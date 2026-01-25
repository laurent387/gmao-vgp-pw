import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Linking, Platform } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Wrench, Eye, Settings, Edit3, User, Calendar, Mail, ChevronDown, ChevronUp } from 'lucide-react-native';
import { colors, spacing, borderRadius, typography } from '@/constants/theme';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';
import { assetRepository } from '@/repositories/AssetRepository';
import { maintenanceRepository } from '@/repositories/MaintenanceRepository';
import { syncService } from '@/services/SyncService';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/contexts/NotificationContext';
import { Asset, OperationType } from '@/types';
import { trpc } from '@/lib/trpc';
import { generateCalendarInviteData } from '@/utils/calendarInvite';

const schema = z.object({
  assetId: z.string().min(1, 'Sélectionnez un équipement'),
  date: z.string().min(1, 'Date requise'),
  operationType: z.enum(['MAINTENANCE', 'INSPECTION', 'REPARATION', 'MODIFICATION']),
  description: z.string().min(10, 'Description trop courte (min 10 caractères)'),
  partsRef: z.string().optional(),
  assignedTo: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface Technician {
  id: string;
  name: string;
  email: string;
  role: string;
}

function normalizeList<T>(value: any): T[] {
  if (Array.isArray(value)) return value as T[];
  if (value && Array.isArray((value as any).json)) return (value as any).json as T[];
  return [];
}

export default function AddMaintenanceScreen() {
  const { assetId: preselectedAssetId } = useLocalSearchParams<{ assetId?: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, hasPermission } = useAuth();
  const { sendMaintenanceNotification } = useNotifications();
  const [showCalendarOptions, setShowCalendarOptions] = useState(false);
  const [calendarInviteData, setCalendarInviteData] = useState<{
    icsContent: string;
    outlookUrl: string;
    googleUrl: string;
  } | null>(null);

  const isManagerOrAdmin = hasPermission(['ADMIN', 'HSE_MANAGER']);

  const { control, handleSubmit, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      assetId: preselectedAssetId || '',
      date: new Date().toISOString().split('T')[0],
      operationType: 'MAINTENANCE',
      description: '',
      partsRef: '',
      assignedTo: '',
    },
  });

  const selectedOperationType = watch('operationType');
  const selectedTechnicianId = watch('assignedTo');

  const { data: assets } = useQuery<Asset[]>({
    queryKey: ['assets-for-maintenance'],
    queryFn: () => assetRepository.getAllWithDetails(),
    enabled: !preselectedAssetId,
  });

  const { data: selectedAsset } = useQuery<Asset | null>({
    queryKey: ['asset', preselectedAssetId],
    queryFn: () => assetRepository.getByIdWithDetails(preselectedAssetId!),
    enabled: !!preselectedAssetId,
  });

  const { data: techniciansRaw } = trpc.auth.listTechnicians.useQuery(undefined, {
    enabled: isManagerOrAdmin,
  });

  const technicians = React.useMemo(() => normalizeList<Technician>(techniciansRaw), [techniciansRaw]);

  const selectedTechnician = technicians.find(t => t.id === selectedTechnicianId);

  const createMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const logId = await maintenanceRepository.create({
        asset_id: data.assetId,
        date: new Date(data.date).toISOString(),
        actor: user?.name || 'Utilisateur',
        operation_type: data.operationType as OperationType,
        description: data.description,
        parts_ref: data.partsRef || null,
      });

      await syncService.addToOutbox('CREATE_MAINTENANCE', {
        logId,
        ...data,
        actor: user?.name,
        assigned_to: data.assignedTo || null,
      });

      return { logId, data };
    },
    onSuccess: async ({ logId, data }) => {
      queryClient.invalidateQueries({ queryKey: ['asset-maintenance'] });
      queryClient.invalidateQueries({ queryKey: ['technician-interventions'] });

      const assetInfo = selectedAsset || assets?.find(a => a.id === data.assetId);
      const technicianInfo = technicians.find(t => t.id === data.assignedTo);

      if (data.assignedTo && technicianInfo && assetInfo) {
        const calendarData = generateCalendarInviteData({
          assetDesignation: assetInfo.designation,
          operationType: data.operationType,
          date: data.date,
          description: data.description,
          technicianName: technicianInfo.name,
          siteName: assetInfo.site_name,
        });

        setCalendarInviteData(calendarData);

        await sendMaintenanceNotification({
          technicianName: technicianInfo.name,
          assetDesignation: assetInfo.designation,
          date: data.date,
          maintenanceId: logId,
          assetId: data.assetId,
          operationType: data.operationType,
          calendarInviteUrl: calendarData.outlookUrl,
        });

        Alert.alert(
          'Intervention planifiée',
          `L'intervention a été assignée à ${technicianInfo.name}.\n\nUne notification a été envoyée et l'intervention a été ajoutée à son calendrier.`,
          [
            {
              text: 'Envoyer invitation calendrier',
              onPress: () => setShowCalendarOptions(true),
            },
            { text: 'Terminer', onPress: () => router.back() },
          ]
        );
      } else {
        Alert.alert('Succès', 'Entrée de maintenance ajoutée', [
          { text: 'OK', onPress: () => router.back() }
        ]);
      }
    },
    onError: (error) => {
      Alert.alert('Erreur', error instanceof Error ? error.message : 'Erreur lors de la création');
    },
  });

  const onSubmit = (data: FormData) => {
    createMutation.mutate(data);
  };

  const openCalendarLink = async (type: 'outlook' | 'google') => {
    if (!calendarInviteData) return;
    
    const url = type === 'outlook' ? calendarInviteData.outlookUrl : calendarInviteData.googleUrl;
    
    try {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Erreur', 'Impossible d\'ouvrir le lien');
      }
    } catch (e) {
      console.error('Error opening calendar link:', e);
      Alert.alert('Erreur', 'Impossible d\'ouvrir le lien du calendrier');
    }
  };

  const operationTypes: { type: OperationType; label: string; icon: React.ReactNode }[] = [
    { type: 'MAINTENANCE', label: 'Maintenance', icon: <Wrench size={20} color={selectedOperationType === 'MAINTENANCE' ? colors.primary : colors.textMuted} /> },
    { type: 'INSPECTION', label: 'Inspection', icon: <Eye size={20} color={selectedOperationType === 'INSPECTION' ? colors.primary : colors.textMuted} /> },
    { type: 'REPARATION', label: 'Réparation', icon: <Settings size={20} color={selectedOperationType === 'REPARATION' ? colors.primary : colors.textMuted} /> },
    { type: 'MODIFICATION', label: 'Modification', icon: <Edit3 size={20} color={selectedOperationType === 'MODIFICATION' ? colors.primary : colors.textMuted} /> },
  ];

  return (
    <>
      <Stack.Screen options={{ title: 'Ajouter maintenance' }} />
      
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {selectedAsset ? (
          <View style={styles.assetBanner}>
            <Text style={styles.assetCode}>{selectedAsset.code_interne}</Text>
            <Text style={styles.assetDesignation}>{selectedAsset.designation}</Text>
          </View>
        ) : (
          <View style={styles.section}>
            <Text style={styles.label}>Équipement</Text>
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
                        <Text style={[styles.assetOptionCode, value === asset.id && styles.assetOptionCodeSelected]}>
                          {asset.code_interne}
                        </Text>
                        <Text style={styles.assetOptionDesignation} numberOfLines={1}>
                          {asset.designation}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              )}
            />
            {errors.assetId && (
              <Text style={styles.error}>{errors.assetId.message}</Text>
            )}
          </View>
        )}

        <View style={styles.section}>
          <Controller
            control={control}
            name="date"
            render={({ field: { onChange, value } }) => (
              <Input
                label="Date de l'opération"
                value={value}
                onChangeText={onChange}
                placeholder="AAAA-MM-JJ"
                error={errors.date?.message}
              />
            )}
          />

          <Text style={styles.label}>{"Type d'opération"}</Text>
          <Controller
            control={control}
            name="operationType"
            render={({ field: { onChange, value } }) => (
              <View style={styles.operationGrid}>
                {operationTypes.map((op) => (
                  <TouchableOpacity
                    key={op.type}
                    style={[styles.operationOption, value === op.type && styles.operationOptionSelected]}
                    onPress={() => onChange(op.type)}
                  >
                    {op.icon}
                    <Text style={[
                      styles.operationLabel,
                      value === op.type && styles.operationLabelSelected,
                    ]}>
                      {op.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          />

          {isManagerOrAdmin && (
            <>
              <Text style={styles.label}>Technicien assigné</Text>
              <Controller
                control={control}
                name="assignedTo"
                render={({ field: { onChange, value } }) => (
                  <View style={styles.technicianSection}>
                    {technicians.map((tech) => (
                      <TouchableOpacity
                        key={tech.id}
                        style={[
                          styles.technicianOption,
                          value === tech.id && styles.technicianOptionSelected,
                        ]}
                        onPress={() => onChange(value === tech.id ? '' : tech.id)}
                      >
                        <View style={[
                          styles.technicianAvatar,
                          value === tech.id && styles.technicianAvatarSelected,
                        ]}>
                          <User size={20} color={value === tech.id ? colors.textInverse : colors.primary} />
                        </View>
                        <View style={styles.technicianInfo}>
                          <Text style={[
                            styles.technicianName,
                            value === tech.id && styles.technicianNameSelected,
                          ]}>
                            {tech.name}
                          </Text>
                          <Text style={styles.technicianEmail}>{tech.email}</Text>
                        </View>
                        {value === tech.id && (
                          <View style={styles.selectedBadge}>
                            <Text style={styles.selectedBadgeText}>Assigné</Text>
                          </View>
                        )}
                      </TouchableOpacity>
                    ))}
                    {technicians.length === 0 && (
                      <Text style={styles.noTechnicians}>Aucun technicien disponible</Text>
                    )}
                  </View>
                )}
              />

              {selectedTechnician && (
                <View style={styles.notificationInfo}>
                  <View style={styles.notificationHeader}>
                    <Mail size={16} color={colors.info} />
                    <Text style={styles.notificationTitle}>Notifications</Text>
                  </View>
                  <Text style={styles.notificationText}>
                    • Notification push envoyée au technicien{'\n'}
                    • Notification in-app avec détails{'\n'}
                    • Invitation calendrier (Outlook/Google)
                  </Text>
                </View>
              )}
            </>
          )}

          <Controller
            control={control}
            name="description"
            render={({ field: { onChange, value } }) => (
              <Input
                label="Description"
                value={value}
                onChangeText={onChange}
                placeholder="Décrivez l'opération effectuée..."
                multiline
                numberOfLines={4}
                error={errors.description?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="partsRef"
            render={({ field: { onChange, value } }) => (
              <Input
                label="Pièces/références (optionnel)"
                value={value || ''}
                onChangeText={onChange}
                placeholder="Ex: FIL-HYD-001, HUILE-H46"
              />
            )}
          />
        </View>

        {showCalendarOptions && calendarInviteData && (
          <View style={styles.calendarSection}>
            <TouchableOpacity
              style={styles.calendarHeader}
              onPress={() => setShowCalendarOptions(!showCalendarOptions)}
            >
              <Calendar size={20} color={colors.primary} />
              <Text style={styles.calendarTitle}>Envoyer invitation calendrier</Text>
              {showCalendarOptions ? (
                <ChevronUp size={20} color={colors.textMuted} />
              ) : (
                <ChevronDown size={20} color={colors.textMuted} />
              )}
            </TouchableOpacity>
            
            <View style={styles.calendarOptions}>
              <TouchableOpacity
                style={styles.calendarOption}
                onPress={() => openCalendarLink('outlook')}
              >
                <View style={[styles.calendarIcon, { backgroundColor: '#0078D4' }]}>
                  <Text style={styles.calendarIconText}>O</Text>
                </View>
                <Text style={styles.calendarOptionText}>Outlook / Office 365</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.calendarOption}
                onPress={() => openCalendarLink('google')}
              >
                <View style={[styles.calendarIcon, { backgroundColor: '#4285F4' }]}>
                  <Text style={styles.calendarIconText}>G</Text>
                </View>
                <Text style={styles.calendarOptionText}>Google Calendar</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <Button
          title={isManagerOrAdmin && selectedTechnicianId ? "Planifier et notifier" : "Enregistrer"}
          onPress={handleSubmit(onSubmit)}
          loading={createMutation.isPending}
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
  assetBanner: {
    backgroundColor: colors.primary + '10',
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.xl,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  assetCode: {
    fontSize: typography.caption.fontSize,
    fontWeight: '600' as const,
    color: colors.primary,
  },
  assetDesignation: {
    ...typography.h3,
    color: colors.text,
    marginTop: spacing.xs,
  },
  section: {
    marginBottom: spacing.xl,
  },
  label: {
    fontSize: typography.bodySmall.fontSize,
    fontWeight: '500' as const,
    color: colors.text,
    marginBottom: spacing.sm,
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
  assetOptionCode: {
    fontSize: typography.caption.fontSize,
    fontWeight: '600' as const,
    color: colors.textSecondary,
  },
  assetOptionCodeSelected: {
    color: colors.primary,
  },
  assetOptionDesignation: {
    fontSize: typography.bodySmall.fontSize,
    color: colors.text,
    marginTop: spacing.xs,
  },
  operationGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  operationOption: {
    flex: 1,
    minWidth: '45%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  operationOptionSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '10',
  },
  operationLabel: {
    fontSize: typography.bodySmall.fontSize,
    color: colors.textSecondary,
  },
  operationLabelSelected: {
    color: colors.primary,
    fontWeight: '600' as const,
  },
  technicianSection: {
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  technicianOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    gap: spacing.md,
  },
  technicianOptionSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '10',
  },
  technicianAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  technicianAvatarSelected: {
    backgroundColor: colors.primary,
  },
  technicianInfo: {
    flex: 1,
  },
  technicianName: {
    fontSize: typography.body.fontSize,
    fontWeight: '600' as const,
    color: colors.text,
  },
  technicianNameSelected: {
    color: colors.primary,
  },
  technicianEmail: {
    fontSize: typography.caption.fontSize,
    color: colors.textMuted,
    marginTop: 2,
  },
  selectedBadge: {
    backgroundColor: colors.success,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  selectedBadgeText: {
    fontSize: typography.caption.fontSize,
    fontWeight: '600' as const,
    color: colors.textInverse,
  },
  noTechnicians: {
    fontSize: typography.body.fontSize,
    color: colors.textMuted,
    textAlign: 'center',
    padding: spacing.lg,
  },
  notificationInfo: {
    backgroundColor: colors.info + '10',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.lg,
    borderLeftWidth: 3,
    borderLeftColor: colors.info,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  notificationTitle: {
    fontSize: typography.bodySmall.fontSize,
    fontWeight: '600' as const,
    color: colors.info,
  },
  notificationText: {
    fontSize: typography.caption.fontSize,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  calendarSection: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  calendarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    backgroundColor: colors.surfaceAlt,
  },
  calendarTitle: {
    flex: 1,
    fontSize: typography.body.fontSize,
    fontWeight: '600' as const,
    color: colors.text,
  },
  calendarOptions: {
    padding: spacing.md,
    gap: spacing.sm,
  },
  calendarOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.background,
  },
  calendarIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarIconText: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  calendarOptionText: {
    fontSize: typography.body.fontSize,
    color: colors.text,
    fontWeight: '500' as const,
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
});
