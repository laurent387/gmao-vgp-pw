import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Image, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Camera, ImagePlus, X, Plus, ArrowLeft, RefreshCw } from 'lucide-react-native';
import { colors, spacing, borderRadius, typography } from '@/constants/theme';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';
import { assetRepository } from '@/repositories/AssetRepository';
import { ncRepository, actionRepository } from '@/repositories/NCRepository';
import { syncService } from '@/services/SyncService';
import { attachmentService } from '@/services/AttachmentService';
import { webApiService } from '@/services/WebApiService';
import { useAuth } from '@/contexts/AuthContext';
import { Asset, SeverityLevel, Client, Site } from '@/types';

interface PendingPhoto {
  uri: string;
  id: string;
}

const schema = z.object({
  title: z.string().min(5, 'Titre trop court (min 5 caractères)'),
  description: z.string().min(10, 'Description trop courte (min 10 caractères)'),
  severity: z.number().min(1).max(5),
  clientId: z.string().min(1, 'Sélectionnez un client'),
  siteId: z.string().min(1, 'Sélectionnez un site'),
  assetId: z.string().min(1, 'Sélectionnez un équipement'),
  actionOwner: z.string().optional(),
  actionDueDate: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export default function CreateNCScreen() {
  const { assetId: preselectedAssetId } = useLocalSearchParams<{ assetId?: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  // Track if coming from asset page (locked asset selection)
  const isFromAssetPage = !!preselectedAssetId;
  
  // Photos state
  const [pendingPhotos, setPendingPhotos] = useState<PendingPhoto[]>([]);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  
  // Track post-creation action: 'back' or 'new'
  const postActionRef = useRef<'back' | 'new'>('back');

  const { control, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: '',
      description: '',
      severity: 3,
      clientId: '',
      siteId: '',
      assetId: preselectedAssetId || '',
      actionOwner: user?.id || '',
      actionDueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    },
  });

  const selectedSeverity = watch('severity');
  const selectedClientId = watch('clientId');
  const selectedSiteId = watch('siteId');

  const { data: clients } = useQuery<Client[]>({
    queryKey: ['clients-for-nc'],
    queryFn: () => webApiService.getClients(),
  });

  const { data: sites } = useQuery<Site[]>({
    queryKey: ['sites-for-nc', selectedClientId],
    queryFn: () => {
      if (!selectedClientId) return Promise.resolve([]);
      return webApiService.getSites?.() || Promise.resolve([]);
    },
    enabled: !!selectedClientId,
  });

  const { data: assets } = useQuery<Asset[]>({
    queryKey: ['assets-for-nc', selectedSiteId],
    queryFn: () => {
      if (!selectedSiteId) return assetRepository.getAllWithDetails();
      return assetRepository.getAllWithDetails({ siteId: selectedSiteId });
    },
  });

  // Photo handlers
  const handleTakePhoto = async () => {
    try {
      const result = await attachmentService.takePhoto();
      if (result) {
        setPendingPhotos(prev => [...prev, { uri: result.uri, id: `photo_${Date.now()}` }]);
      }
    } catch (e) {
      Alert.alert('Erreur', e instanceof Error ? e.message : 'Erreur caméra');
    }
  };

  const handlePickImage = async () => {
    try {
      const result = await attachmentService.pickImage();
      if (result) {
        setPendingPhotos(prev => [...prev, { uri: result.uri, id: `image_${Date.now()}` }]);
      }
    } catch (e) {
      Alert.alert('Erreur', e instanceof Error ? e.message : 'Erreur galerie');
    }
  };

  const removePhoto = (id: string) => {
    setPendingPhotos(prev => prev.filter(p => p.id !== id));
  };

  // Upload photos after NC is created
  const uploadPhotosForNC = async (ncId: string) => {
    if (pendingPhotos.length === 0) return;
    
    setUploadingPhotos(true);
    try {
      for (const photo of pendingPhotos) {
        await attachmentService.upload(
          photo.uri,
          `${photo.id}.jpg`,
          'image/jpeg',
          'NONCONFORMITY',
          ncId,
          'PHOTO',
          `Photo NC ${new Date().toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
          })}`,
          false
        );
      }
    } catch (e) {
      console.error('Error uploading NC photos:', e);
      // Don't throw - NC was already created
    } finally {
      setUploadingPhotos(false);
    }
  };

  const createMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const ncId = await ncRepository.create({
        report_id: null,
        asset_id: data.assetId,
        checklist_item_id: null,
        title: data.title,
        description: data.description,
        severity: data.severity as SeverityLevel,
        status: 'OUVERTE',
      });

      if (data.actionOwner && data.actionDueDate) {
        await actionRepository.create({
          nonconformity_id: ncId,
          owner: data.actionOwner,
          description: 'Action corrective à définir',
          due_at: new Date(data.actionDueDate).toISOString(),
          status: 'OUVERTE',
          closed_at: null,
          validated_by: null,
        });
      }

      // Upload photos
      await uploadPhotosForNC(ncId);

      await syncService.addToOutbox('CREATE_NC', {
        ncId,
        ...data,
        hasPhotos: pendingPhotos.length > 0,
      });

      return ncId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nonconformities'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-kpis'] });
      
      if (postActionRef.current === 'new') {
        // Reset form for new NC
        resetForm();
        Alert.alert('Succès', 'Non-conformité créée. Vous pouvez en créer une nouvelle.');
      } else {
        // Go back
        Alert.alert('Succès', 'Non-conformité créée', [
          { text: 'OK', onPress: () => router.back() }
        ]);
      }
    },
    onError: (error) => {
      Alert.alert('Erreur', error instanceof Error ? error.message : 'Erreur lors de la création');
    },
  });

  const resetForm = () => {
    setValue('title', '');
    setValue('description', '');
    setValue('severity', 3);
    if (!isFromAssetPage) {
      setValue('clientId', '');
      setValue('siteId', '');
      setValue('assetId', '');
    }
    setValue('actionDueDate', new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
    setPendingPhotos([]);
  };

  const onSubmitAndBack = (data: FormData) => {
    postActionRef.current = 'back';
    createMutation.mutate(data);
  };

  const onSubmitAndNew = (data: FormData) => {
    postActionRef.current = 'new';
    createMutation.mutate(data);
  };

  const severityLevels: { level: SeverityLevel; label: string; color: string }[] = [
    { level: 1, label: 'Mineur', color: colors.success },
    { level: 2, label: 'Faible', color: colors.info },
    { level: 3, label: 'Moyen', color: colors.warning },
    { level: 4, label: 'Important', color: '#FF6B00' },
    { level: 5, label: 'Critique', color: colors.danger },
  ];

  return (
    <>
      <Stack.Screen options={{ title: 'Nouvelle NC' }} />
      
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Information</Text>

          <Controller
            control={control}
            name="title"
            render={({ field: { onChange, value } }) => (
              <Input
                label="Titre"
                value={value}
                onChangeText={onChange}
                placeholder="Ex: Câbles usés sur chariot CHE-001"
                error={errors.title?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="description"
            render={({ field: { onChange, value } }) => (
              <Input
                label="Description"
                value={value}
                onChangeText={onChange}
                placeholder="Décrivez la non-conformité en détail..."
                multiline
                numberOfLines={4}
                error={errors.description?.message}
              />
            )}
          />

          <Text style={styles.label}>Sévérité</Text>
          <Controller
            control={control}
            name="severity"
            render={({ field: { onChange, value } }) => (
              <View style={styles.severityGrid}>
                {severityLevels.map((item) => (
                  <TouchableOpacity
                    key={item.level}
                    style={[
                      styles.severityOption,
                      { borderColor: item.color },
                      value === item.level && { backgroundColor: item.color + '20' },
                    ]}
                    onPress={() => onChange(item.level)}
                  >
                    <Text style={[
                      styles.severityLevel,
                      { color: item.color },
                    ]}>
                      {item.level}
                    </Text>
                    <Text style={[
                      styles.severityLabel,
                      value === item.level && { color: item.color, fontWeight: '600' as const },
                    ]}>
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          />

          <Text style={styles.label}>Client</Text>
          <Controller
            control={control}
            name="clientId"
            render={({ field: { onChange, value } }) => (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.assetsScroll}>
                <View style={styles.assetsGrid}>
                  {clients?.map((client) => (
                    <TouchableOpacity
                      key={client.id}
                      style={[styles.assetOption, value === client.id && styles.assetOptionSelected]}
                      onPress={() => {
                        onChange(client.id);
                        setValue('siteId', '');
                        setValue('assetId', '');
                      }}
                    >
                      <Text style={[styles.assetCode, value === client.id && styles.assetCodeSelected]}>
                        {client.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            )}
          />
          {errors.clientId && (
            <Text style={styles.error}>{errors.clientId.message}</Text>
          )}

          {selectedClientId && (
            <>
              <Text style={styles.label}>Site</Text>
              <Controller
                control={control}
                name="siteId"
                render={({ field: { onChange, value } }) => (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.assetsScroll}>
                    <View style={styles.assetsGrid}>
                      {sites?.map((site) => (
                        <TouchableOpacity
                          key={site.id}
                          style={[styles.assetOption, value === site.id && styles.assetOptionSelected]}
                          onPress={() => {
                            onChange(site.id);
                            setValue('assetId', '');
                          }}
                        >
                          <Text style={[styles.assetCode, value === site.id && styles.assetCodeSelected]}>
                            {site.name}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </ScrollView>
                )}
              />
              {errors.siteId && (
                <Text style={styles.error}>{errors.siteId.message}</Text>
              )}
            </>
          )}

          <Text style={styles.label}>Équipement concerné</Text>
          {isFromAssetPage ? (
            // Asset is locked when coming from asset page
            <View style={styles.lockedAssetContainer}>
              {assets?.filter(a => a.id === preselectedAssetId).map((asset) => (
                <View key={asset.id} style={[styles.assetOption, styles.assetOptionSelected, styles.assetOptionLocked]}>
                  <Text style={[styles.assetCode, styles.assetCodeSelected]}>
                    {asset.code_interne}
                  </Text>
                  <Text style={styles.assetDesignation} numberOfLines={1}>
                    {asset.designation}
                  </Text>
                </View>
              ))}
              <Text style={styles.lockedHint}>Équipement pré-sélectionné</Text>
            </View>
          ) : (
            <Controller
              control={control}
              name="assetId"
              render={({ field: { onChange, value } }) => (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.assetsScroll}>
                  <View style={styles.assetsGrid}>
                    {assets?.map((asset) => (
                      <TouchableOpacity
                        key={asset.id}
                        style={[styles.assetOption, value === asset.id && styles.assetOptionSelected]}
                        onPress={() => onChange(asset.id)}
                      >
                        <Text style={[styles.assetCode, value === asset.id && styles.assetCodeSelected]}>
                          {asset.code_interne}
                        </Text>
                        <Text style={styles.assetDesignation} numberOfLines={1}>
                          {asset.designation}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              )}
            />
          )}
          {errors.assetId && (
            <Text style={styles.error}>{errors.assetId.message}</Text>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Photos</Text>
          <Text style={styles.photoHint}>Ajoutez des photos pour documenter la non-conformité</Text>
          
          <View style={styles.photoGrid}>
            {pendingPhotos.map((photo) => (
              <View key={photo.id} style={styles.photoContainer}>
                <Image source={{ uri: photo.uri }} style={styles.photoThumbnail} />
                <TouchableOpacity 
                  style={styles.removePhotoButton}
                  onPress={() => removePhoto(photo.id)}
                >
                  <X size={16} color="#fff" />
                </TouchableOpacity>
              </View>
            ))}
            
            <View style={styles.photoActions}>
              <TouchableOpacity style={styles.photoButton} onPress={handleTakePhoto}>
                <Camera size={24} color={colors.primary} />
                <Text style={styles.photoButtonText}>Prendre photo</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.photoButton} onPress={handlePickImage}>
                <ImagePlus size={24} color={colors.primary} />
                <Text style={styles.photoButtonText}>Galerie</Text>
              </TouchableOpacity>
            </View>
          </View>
          
          {uploadingPhotos && (
            <View style={styles.uploadingContainer}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={styles.uploadingText}>Upload des photos...</Text>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Action corrective (optionnel)</Text>

          <Controller
            control={control}
            name="actionDueDate"
            render={({ field: { onChange, value } }) => (
              <Input
                label="Échéance"
                value={value || ''}
                onChangeText={onChange}
                placeholder="AAAA-MM-JJ"
              />
            )}
          />
        </View>

        <View style={styles.buttonsContainer}>
          <TouchableOpacity
            style={[styles.actionButton, styles.actionButtonSecondary]}
            onPress={handleSubmit(onSubmitAndNew)}
            disabled={createMutation.isPending}
          >
            <RefreshCw size={18} color={colors.primary} />
            <Text style={styles.actionButtonTextSecondary}>Créer et nouvelle NC</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.actionButton, styles.actionButtonPrimary]}
            onPress={handleSubmit(onSubmitAndBack)}
            disabled={createMutation.isPending}
          >
            {createMutation.isPending ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <ArrowLeft size={18} color="#fff" />
                <Text style={styles.actionButtonTextPrimary}>
                  {isFromAssetPage ? 'Créer et retour équipement' : 'Créer et fermer'}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.md,
  },
  label: {
    fontSize: typography.bodySmall.fontSize,
    fontWeight: '500' as const,
    color: colors.text,
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },
  severityGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  severityOption: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 2,
    alignItems: 'center',
    minWidth: 60,
  },
  severityLevel: {
    fontSize: 18,
    fontWeight: '700' as const,
  },
  severityLabel: {
    fontSize: typography.caption.fontSize,
    color: colors.textSecondary,
  },
  assetsScroll: {
    marginHorizontal: -spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  assetsGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingRight: spacing.lg,
  },
  assetOption: {
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    minWidth: 140,
  },
  assetOptionSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '10',
  },
  assetCode: {
    fontSize: typography.caption.fontSize,
    fontWeight: '600' as const,
    color: colors.textSecondary,
  },
  assetCodeSelected: {
    color: colors.primary,
  },
  assetDesignation: {
    fontSize: typography.bodySmall.fontSize,
    color: colors.text,
    marginTop: spacing.xs,
  },
  error: {
    fontSize: typography.caption.fontSize,
    color: colors.danger,
    marginTop: spacing.xs,
  },
  submitButton: {
    marginTop: spacing.lg,
    marginBottom: spacing.xxl,
  },
  // Photo styles
  photoHint: {
    fontSize: typography.bodySmall.fontSize,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  photoContainer: {
    position: 'relative',
    width: 100,
    height: 100,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
  },
  photoThumbnail: {
    width: '100%',
    height: '100%',
    borderRadius: borderRadius.md,
  },
  removePhotoButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoActions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  photoButton: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    width: 100,
    height: 100,
    borderRadius: borderRadius.md,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.border,
    backgroundColor: colors.surface,
    gap: spacing.xs,
  },
  photoButtonText: {
    fontSize: typography.caption.fontSize,
    color: colors.primary,
    textAlign: 'center',
  },
  uploadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
    padding: spacing.sm,
    backgroundColor: colors.primaryLight + '20',
    borderRadius: borderRadius.sm,
  },
  uploadingText: {
    fontSize: typography.bodySmall.fontSize,
    color: colors.primary,
  },
  // Locked asset styles
  lockedAssetContainer: {
    gap: spacing.sm,
  },
  assetOptionLocked: {
    opacity: 0.9,
    borderWidth: 2,
  },
  lockedHint: {
    fontSize: typography.caption.fontSize,
    color: colors.textMuted,
    fontStyle: 'italic',
  },
  // Action buttons styles
  buttonsContainer: {
    gap: spacing.md,
    marginTop: spacing.lg,
    marginBottom: spacing.xxl,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
  },
  actionButtonPrimary: {
    backgroundColor: colors.primary,
  },
  actionButtonSecondary: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  actionButtonTextPrimary: {
    color: '#fff',
    fontSize: typography.body.fontSize,
    fontWeight: '600' as const,
  },
  actionButtonTextSecondary: {
    color: colors.primary,
    fontSize: typography.body.fontSize,
    fontWeight: '600' as const,
  },
});
