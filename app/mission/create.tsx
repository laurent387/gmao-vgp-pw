import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Calendar, Check, Package } from 'lucide-react-native';
import { colors, spacing, borderRadius, typography, shadows } from '@/constants/theme';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';
import { CriticalityBadge, OverdueBadge } from '@/components/Badge';
import { siteRepository } from '@/repositories/SiteRepository';
import { controlTypeRepository } from '@/repositories/ControlRepository';
import { assetRepository } from '@/repositories/AssetRepository';
import { userRepository } from '@/repositories/UserRepository';
import { missionRepository } from '@/repositories/MissionRepository';
import { syncService } from '@/services/SyncService';
import { useAuth } from '@/contexts/AuthContext';
import { Site, ControlType, Asset, User } from '@/types';

const schema = z.object({
  controlTypeId: z.string().min(1, 'Sélectionnez un type de contrôle'),
  siteId: z.string().min(1, 'Sélectionnez un site'),
  scheduledAt: z.string().min(1, 'Sélectionnez une date'),
  assignedTo: z.string().min(1, 'Sélectionnez un technicien'),
});

type FormData = z.infer<typeof schema>;

export default function CreateMissionScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [selectedAssets, setSelectedAssets] = useState<string[]>([]);

  const { control, handleSubmit, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      controlTypeId: '',
      siteId: '',
      scheduledAt: new Date().toISOString().split('T')[0],
      assignedTo: user?.id || '',
    },
  });

  const selectedSiteId = watch('siteId');

  const { data: sites } = useQuery<Site[]>({
    queryKey: ['sites'],
    queryFn: () => siteRepository.getAll(),
  });

  const { data: controlTypes } = useQuery<ControlType[]>({
    queryKey: ['control-types'],
    queryFn: () => controlTypeRepository.getActive(),
  });

  const { data: technicians } = useQuery<User[]>({
    queryKey: ['technicians'],
    queryFn: () => userRepository.getTechnicians(),
  });

  const { data: assets } = useQuery<Asset[]>({
    queryKey: ['assets-for-mission', selectedSiteId],
    queryFn: () => assetRepository.getAllWithDetails({ siteId: selectedSiteId }),
    enabled: !!selectedSiteId,
  });

  const createMutation = useMutation({
    mutationFn: async (data: FormData) => {
      if (selectedAssets.length === 0) {
        throw new Error('Sélectionnez au moins un équipement');
      }
      
      const missionId = await missionRepository.create({
        control_type_id: data.controlTypeId,
        site_id: data.siteId,
        scheduled_at: new Date(data.scheduledAt).toISOString(),
        assigned_to: data.assignedTo,
        status: 'PLANIFIEE',
      }, selectedAssets);

      await syncService.addToOutbox('CREATE_MISSION', {
        id: missionId,
        ...data,
        assets: selectedAssets,
      });

      return missionId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['missions'] });
      Alert.alert('Succès', 'Mission créée avec succès', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    },
    onError: (error) => {
      Alert.alert('Erreur', error instanceof Error ? error.message : 'Erreur lors de la création');
    },
  });

  const toggleAsset = (assetId: string) => {
    setSelectedAssets(prev => 
      prev.includes(assetId) 
        ? prev.filter(id => id !== assetId)
        : [...prev, assetId]
    );
  };

  const onSubmit = (data: FormData) => {
    createMutation.mutate(data);
  };

  return (
    <>
      <Stack.Screen options={{ title: 'Nouvelle mission' }} />
      
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informations</Text>
          
          <Text style={styles.label}>Type de contrôle</Text>
          <Controller
            control={control}
            name="controlTypeId"
            render={({ field: { onChange, value } }) => (
              <View style={styles.optionsGrid}>
                {controlTypes?.map((ct) => (
                  <TouchableOpacity
                    key={ct.id}
                    style={[styles.option, value === ct.id && styles.optionSelected]}
                    onPress={() => onChange(ct.id)}
                  >
                    <Text style={[styles.optionText, value === ct.id && styles.optionTextSelected]}>
                      {ct.label}
                    </Text>
                    <Text style={styles.optionMeta}>{ct.periodicity_days}j</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          />
          {errors.controlTypeId && (
            <Text style={styles.error}>{errors.controlTypeId.message}</Text>
          )}

          <Text style={styles.label}>Site</Text>
          <Controller
            control={control}
            name="siteId"
            render={({ field: { onChange, value } }) => (
              <View style={styles.optionsGrid}>
                {sites?.map((site) => (
                  <TouchableOpacity
                    key={site.id}
                    style={[styles.option, value === site.id && styles.optionSelected]}
                    onPress={() => {
                      onChange(site.id);
                      setSelectedAssets([]);
                    }}
                  >
                    <Text style={[styles.optionText, value === site.id && styles.optionTextSelected]}>
                      {site.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          />
          {errors.siteId && (
            <Text style={styles.error}>{errors.siteId.message}</Text>
          )}

          <Controller
            control={control}
            name="scheduledAt"
            render={({ field: { onChange, value } }) => (
              <Input
                label="Date prévue"
                value={value}
                onChangeText={onChange}
                placeholder="AAAA-MM-JJ"
              />
            )}
          />
          {errors.scheduledAt && (
            <Text style={styles.error}>{errors.scheduledAt.message}</Text>
          )}

          <Text style={styles.label}>Assigné à</Text>
          <Controller
            control={control}
            name="assignedTo"
            render={({ field: { onChange, value } }) => (
              <View style={styles.optionsGrid}>
                {technicians?.map((tech) => (
                  <TouchableOpacity
                    key={tech.id}
                    style={[styles.option, value === tech.id && styles.optionSelected]}
                    onPress={() => onChange(tech.id)}
                  >
                    <Text style={[styles.optionText, value === tech.id && styles.optionTextSelected]}>
                      {tech.name}
                    </Text>
                    <Text style={styles.optionMeta}>{tech.role}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          />
          {errors.assignedTo && (
            <Text style={styles.error}>{errors.assignedTo.message}</Text>
          )}
        </View>

        {selectedSiteId && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Équipements ({selectedAssets.length} sélectionné(s))
            </Text>
            
            {assets && assets.length > 0 ? (
              assets.map((asset) => {
                const isSelected = selectedAssets.includes(asset.id);
                return (
                  <TouchableOpacity
                    key={asset.id}
                    style={[styles.assetItem, isSelected && styles.assetItemSelected]}
                    onPress={() => toggleAsset(asset.id)}
                  >
                    <View style={styles.assetCheckbox}>
                      {isSelected && <Check size={16} color={colors.primary} />}
                    </View>
                    <View style={styles.assetInfo}>
                      <Text style={styles.assetCode}>{asset.code_interne}</Text>
                      <Text style={styles.assetDesignation} numberOfLines={1}>
                        {asset.designation}
                      </Text>
                      <View style={styles.assetMeta}>
                        <Text style={styles.assetCategory}>{asset.categorie}</Text>
                        <CriticalityBadge level={asset.criticite} />
                        {asset.is_overdue && <OverdueBadge />}
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })
            ) : (
              <Text style={styles.emptyText}>Aucun équipement sur ce site</Text>
            )}
          </View>
        )}

        <Button
          title="Créer la mission"
          onPress={handleSubmit(onSubmit)}
          loading={createMutation.isPending}
          disabled={selectedAssets.length === 0}
          fullWidth
          style={styles.submitButton}
        />
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
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  option: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  optionSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '10',
  },
  optionText: {
    fontSize: typography.bodySmall.fontSize,
    color: colors.text,
  },
  optionTextSelected: {
    color: colors.primary,
    fontWeight: '600' as const,
  },
  optionMeta: {
    fontSize: typography.caption.fontSize,
    color: colors.textMuted,
  },
  error: {
    fontSize: typography.caption.fontSize,
    color: colors.danger,
    marginTop: spacing.xs,
  },
  assetItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  assetItemSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '05',
  },
  assetCheckbox: {
    width: 24,
    height: 24,
    borderRadius: borderRadius.sm,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  assetInfo: {
    flex: 1,
  },
  assetCode: {
    fontSize: typography.caption.fontSize,
    fontWeight: '600' as const,
    color: colors.primary,
  },
  assetDesignation: {
    fontSize: typography.body.fontSize,
    color: colors.text,
    marginVertical: spacing.xs,
  },
  assetMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  assetCategory: {
    fontSize: typography.caption.fontSize,
    color: colors.textMuted,
  },
  emptyText: {
    fontSize: typography.bodySmall.fontSize,
    color: colors.textMuted,
    textAlign: 'center',
    paddingVertical: spacing.lg,
  },
  submitButton: {
    marginTop: spacing.lg,
  },
});
