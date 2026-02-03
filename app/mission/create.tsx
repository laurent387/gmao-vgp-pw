import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Check } from 'lucide-react-native';
import { colors, spacing, borderRadius, typography } from '@/constants/theme';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';
import { CriticalityBadge, OverdueBadge } from '@/components/Badge';
import { siteRepository, clientRepository } from '@/repositories/SiteRepository';
import { assetRepository } from '@/repositories/AssetRepository';
import { userRepository } from '@/repositories/UserRepository';
import { missionRepository } from '@/repositories/MissionRepository';
import { syncService } from '@/services/SyncService';
import { useAuth } from '@/contexts/AuthContext';
import { Site, Asset, User, OperationType, Client } from '@/types';

const schema = z.object({
  clientId: z.string().min(1, 'Sélectionnez un client'),
  siteId: z.string().min(1, 'Sélectionnez un site client'),
  scheduledAt: z.string().min(1, 'Sélectionnez une date'),
  assignedToIds: z.array(z.string()).min(1, 'Assignez au moins un technicien'),
  operationTypes: z
    .array(z.enum(['MAINTENANCE', 'INSPECTION', 'REPARATION', 'MODIFICATION']))
    .min(1, 'Sélectionnez au moins une opération'),
});

type FormData = z.infer<typeof schema>;

const OPERATION_ICONS: Record<OperationType, string> = {
  MAINTENANCE: '🔧',
  INSPECTION: '👁',
  REPARATION: '⚙️',
  MODIFICATION: '✏️',
};

const OPERATION_LABELS: Record<OperationType, string> = {
  MAINTENANCE: 'Maintenance Préventive',
  INSPECTION: 'Vérification',
  REPARATION: 'Maintenance Corrective',
  MODIFICATION: 'Autres',
};

export default function CreateMissionScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [selectedAssets, setSelectedAssets] = useState<string[]>([]);
  const [expandedOperation, setExpandedOperation] = useState<OperationType | null>(null);
  const [operationAssets, setOperationAssets] = useState<Record<OperationType, string[]>>({
    MAINTENANCE: [],
    INSPECTION: [],
    REPARATION: [],
    MODIFICATION: [],
  });

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      clientId: '',
      siteId: '',
      scheduledAt: new Date().toISOString().split('T')[0],
      assignedToIds: [],
      operationTypes: [],
    },
  });

  const selectedClientId = watch('clientId');
  const selectedSiteId = watch('siteId');
  const selectedTechnicianIds = watch('assignedToIds');
  const selectedOperations = watch('operationTypes');

  const { data: clients } = useQuery<Client[]>({
    queryKey: ['clients'],
    queryFn: () => clientRepository.getAll(),
  });

  const { data: sites } = useQuery<Site[]>({
    queryKey: ['sites-by-client', selectedClientId],
    queryFn: () => siteRepository.getByClientId(selectedClientId),
    enabled: !!selectedClientId,
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

  // Synchroniser selectedAssets avec les équipements assignés aux opérations
  useEffect(() => {
    const allAssignedAssets = new Set<string>();
    Object.values(operationAssets).forEach((assetIds) => {
      assetIds.forEach((id) => allAssignedAssets.add(id));
    });
    setSelectedAssets(Array.from(allAssignedAssets));
  }, [operationAssets]);

  const createMutation = useMutation({
    mutationFn: async (data: FormData) => {
      if (selectedAssets.length === 0) {
        throw new Error('Sélectionnez au moins un équipement');
      }

      const missionId = await missionRepository.create(
        {
          control_type_id: null,
          site_id: data.siteId,
          scheduled_at: new Date(data.scheduledAt).toISOString(),
          assigned_to: data.assignedToIds[0],
          status: 'PLANIFIEE',
        },
        selectedAssets,
        data.assignedToIds,
        data.operationTypes,
        operationAssets // Ajouter la structure hiérarchique opération->équipements
      );

      await syncService.addToOutbox('CREATE_MISSION', {
        id: missionId,
        ...data,
        assets: selectedAssets,
      });

      return missionId;
    },
    onSuccess: (missionId) => {
      queryClient.invalidateQueries({ queryKey: ['missions'] });
      Alert.alert('Succès', 'Mission créée avec succès', [
        { text: 'Voir la mission', onPress: () => router.replace(`/mission/${missionId}`) },
      ]);
    },
    onError: (error) => {
      Alert.alert(
        'Erreur',
        error instanceof Error ? error.message : 'Erreur lors de la création'
      );
    },
  });

  const toggleAsset = (assetId: string) => {
    setSelectedAssets((prev) =>
      prev.includes(assetId)
        ? prev.filter((id) => id !== assetId)
        : [...prev, assetId]
    );
  };

  const toggleOperationAsset = (operation: OperationType, assetId: string) => {
    setOperationAssets((prev) => ({
      ...prev,
      [operation]: prev[operation].includes(assetId)
        ? prev[operation].filter((id) => id !== assetId)
        : [...prev[operation], assetId],
    }));
  };

  const toggleTechnician = (techId: string) => {
    setValue(
      'assignedToIds',
      selectedTechnicianIds.includes(techId)
        ? selectedTechnicianIds.filter((id) => id !== techId)
        : [...selectedTechnicianIds, techId]
    );
  };

  const toggleOperation = (op: OperationType) => {
    setValue(
      'operationTypes',
      selectedOperations.includes(op)
        ? selectedOperations.filter((o) => o !== op)
        : [...selectedOperations, op]
    );
  };

  const onSubmit = (data: FormData) => {
    createMutation.mutate(data);
  };

  return (
    <>
      <Stack.Screen options={{ title: 'Nouvelle mission' }} />

      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* SECTION 1: Mission Base Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📋 Informations de base</Text>

          <Text style={styles.label}>Client</Text>
          <Controller
            control={control}
            name="clientId"
            render={({ field: { onChange, value } }) => (
              <View style={styles.optionsGrid}>
                {clients?.map((client) => (
                  <TouchableOpacity
                    key={client.id}
                    style={[styles.option, value === client.id && styles.optionSelected]}
                    onPress={() => {
                      onChange(client.id);
                      setValue('siteId', '');
                      setSelectedAssets([]);
                    }}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        value === client.id && styles.optionTextSelected,
                      ]}
                    >
                      {client.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          />
          {errors.clientId && (
            <Text style={styles.error}>{errors.clientId.message}</Text>
          )}

          <Text style={styles.label}>Site client</Text>
          <Controller
            control={control}
            name="siteId"
            render={({ field: { onChange, value } }) => (
              <View style={styles.optionsGrid}>
                {sites && sites.length > 0 ? (
                  sites.map((site) => (
                    <TouchableOpacity
                      key={site.id}
                      style={[
                        styles.option,
                        value === site.id && styles.optionSelected,
                      ]}
                      onPress={() => {
                        onChange(site.id);
                        setSelectedAssets([]);
                      }}
                    >
                      <Text
                        style={[
                          styles.optionText,
                          value === site.id && styles.optionTextSelected,
                        ]}
                      >
                        {site.name}
                      </Text>
                    </TouchableOpacity>
                  ))
                ) : (
                  <Text style={styles.emptyText}>
                    {selectedClientId ? 'Aucun site disponible' : 'Sélectionnez un client'}
                  </Text>
                )}
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
        </View>

        {/* SECTION 2: Resources - Technicians & Operations */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>👥 Ressources</Text>

          {/* Technicians Selection */}
          <View style={styles.subsection}>
            <Text style={styles.subsectionTitle}>
              Assigné à ({selectedTechnicianIds.length} sélectionné(s))
            </Text>
            <View style={styles.technicianGrid}>
              {technicians && technicians.length > 0 ? (
                technicians.map((tech) => {
                  const isSelected = selectedTechnicianIds.includes(tech.id);
                  return (
                    <TouchableOpacity
                      key={tech.id}
                      style={[
                        styles.technicianCard,
                        isSelected && styles.technicianCardSelected,
                      ]}
                      onPress={() => toggleTechnician(tech.id)}
                    >
                      <View
                        style={[
                          styles.technicianCheckbox,
                          isSelected && styles.checkboxSelected,
                        ]}
                      >
                        {isSelected && <Check size={14} color="white" />}
                      </View>
                      <View style={styles.technicianInfo}>
                        <Text
                          style={[
                            styles.technicianName,
                            isSelected && styles.technicianNameSelected,
                          ]}
                        >
                          {tech.name}
                        </Text>
                        <Text style={styles.technicianRole}>{tech.role}</Text>
                      </View>
                    </TouchableOpacity>
                  );
                })
              ) : (
                <Text style={styles.emptyText}>Chargement des techniciens...</Text>
              )}
            </View>
            {errors.assignedToIds && (
              <Text style={styles.error}>{errors.assignedToIds.message}</Text>
            )}
          </View>

          {/* Operations Selection */}
          <View style={[styles.subsection, styles.subsectionSpaced]}>
            <Text style={styles.subsectionTitle}>
              Opérations ({selectedOperations.length} sélectionnée(s))
            </Text>
            <View style={styles.operationsGrid}>
              {(
                [
                  'MAINTENANCE',
                  'INSPECTION',
                  'REPARATION',
                  'MODIFICATION',
                ] as OperationType[]
              ).map((op) => {
                const isSelected = selectedOperations.includes(op);
                return (
                  <TouchableOpacity
                    key={op}
                    style={[
                      styles.operationCard,
                      isSelected && styles.operationCardSelected,
                    ]}
                    onPress={() => toggleOperation(op)}
                  >
                    <View
                      style={[
                        styles.operationCheckbox,
                        isSelected && styles.checkboxSelected,
                      ]}
                    >
                      {isSelected && <Check size={14} color="white" />}
                    </View>
                    <Text style={styles.operationIcon}>{OPERATION_ICONS[op]}</Text>
                    <Text
                      style={[
                        styles.operationLabel,
                        isSelected && styles.operationLabelSelected,
                      ]}
                    >
                      {OPERATION_LABELS[op]}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            {errors.operationTypes && (
              <Text style={styles.error}>{errors.operationTypes.message}</Text>
            )}
          </View>
        </View>

        {/* SECTION 3: Configuration des Opérations - Asset Mapping */}
        {selectedOperations.length > 0 && selectedSiteId && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>⚙️ Configuration des opérations</Text>
            <Text style={styles.sectionDescription}>
              Configurez les équipements pour chaque opération
            </Text>
            
            {selectedOperations.map((operation) => {
              const operationAssetsList = operationAssets[operation] || [];
                const isExpanded = expandedOperation === operation;
                
                return (
                  <View key={operation} style={styles.operationConfigCard}>
                    <TouchableOpacity
                      style={styles.operationConfigHeader}
                      onPress={() => setExpandedOperation(isExpanded ? null : operation)}
                    >
                      <View style={styles.operationConfigTitle}>
                        <Text style={styles.operationConfigIcon}>{OPERATION_ICONS[operation]}</Text>
                        <View style={styles.operationConfigInfo}>
                          <Text style={styles.operationConfigName}>
                            {OPERATION_LABELS[operation]}
                          </Text>
                          <Text style={styles.operationConfigCount}>
                            {operationAssetsList.length} équipement{operationAssetsList.length !== 1 ? 's' : ''} assigné{operationAssetsList.length !== 1 ? 's' : ''}
                          </Text>
                        </View>
                      </View>
                      <View style={[
                        styles.operationConfigChevron,
                        isExpanded && styles.operationConfigChevronOpen,
                      ]}>
                        <Text>›</Text>
                      </View>
                    </TouchableOpacity>

                    {isExpanded && assets && assets.length > 0 && (
                      <View style={styles.operationConfigContent}>
                        <Text style={styles.operationConfigContentTitle}>
                          Sélectionnez les équipements:
                        </Text>
                        {assets.map((asset) => {
                          const isSelected = operationAssetsList.includes(asset.id);
                          return (
                            <TouchableOpacity
                              key={asset.id}
                              style={[
                                styles.operationAssetItem,
                                isSelected && styles.operationAssetItemSelected,
                              ]}
                              onPress={() => toggleOperationAsset(operation, asset.id)}
                            >
                              <View
                                style={[
                                  styles.operationAssetCheckbox,
                                  isSelected && styles.checkboxSelected,
                                ]}
                              >
                                {isSelected && <Check size={14} color="white" />}
                              </View>
                              <View style={styles.operationAssetInfo}>
                                <Text style={[
                                  styles.operationAssetCode,
                                  isSelected && styles.operationAssetCodeSelected,
                                ]}>
                                  {asset.code_interne}
                                </Text>
                                <Text style={[
                                  styles.operationAssetDesignation,
                                  isSelected && styles.operationAssetDesignationSelected,
                                ]}>
                                  {asset.designation}
                                </Text>
                              </View>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          )}

        {/* Summary Card */}
        {selectedTechnicianIds.length > 0 &&
          selectedOperations.length > 0 &&
          selectedAssets.length > 0 && (
            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>✅ Résumé de la mission</Text>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Techniciens assignés:</Text>
                <Text style={styles.summaryValue}>{selectedTechnicianIds.length}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Opérations:</Text>
                <Text style={styles.summaryValue}>{selectedOperations.length}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Équipements:</Text>
                <Text style={styles.summaryValue}>{selectedAssets.length}</Text>
              </View>
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
    paddingBottom: spacing.xl,
  },
  section: {
    marginBottom: spacing.xl,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.md,
    fontWeight: '600' as const,
  },
  subsection: {
    marginBottom: spacing.lg,
  },
  subsectionSpaced: {
    marginTop: spacing.lg,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  subsectionTitle: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600' as const,
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
    marginBottom: spacing.md,
  },
  option: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  optionSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '10',
  },
  optionText: {
    fontSize: typography.bodySmall.fontSize,
    color: colors.text,
    fontWeight: '500' as const,
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
  technicianGrid: {
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  technicianCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  technicianCardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '05',
  },
  technicianCheckbox: {
    width: 24,
    height: 24,
    borderRadius: borderRadius.sm,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  checkboxSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  technicianInfo: {
    flex: 1,
  },
  technicianName: {
    fontSize: typography.body.fontSize,
    fontWeight: '500' as const,
    color: colors.text,
  },
  technicianNameSelected: {
    color: colors.primary,
    fontWeight: '600' as const,
  },
  technicianRole: {
    fontSize: typography.caption.fontSize,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  operationsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  operationCard: {
    flex: 1,
    minWidth: '45%',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    alignItems: 'center',
  },
  operationCardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '10',
  },
  operationCheckbox: {
    width: 20,
    height: 20,
    borderRadius: borderRadius.sm,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  operationIcon: {
    fontSize: 24,
    marginBottom: spacing.xs,
  },
  operationLabel: {
    fontSize: typography.caption.fontSize,
    fontWeight: '500' as const,
    color: colors.text,
    textAlign: 'center',
  },
  operationLabelSelected: {
    color: colors.primary,
    fontWeight: '600' as const,
  },
  selectedOperationsList: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginTop: spacing.md,
  },
  selectedLabel: {
    fontSize: typography.bodySmall.fontSize,
    fontWeight: '600' as const,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  selectedOperationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.primary + '10',
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
  },
  selectedOperationIcon: {
    fontSize: 18,
    marginRight: spacing.md,
  },
  selectedOperationText: {
    fontSize: typography.body.fontSize,
    color: colors.primary,
    fontWeight: '500' as const,
  },
  assetItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.background,
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
  assetCheckboxSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '10',
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
    fontWeight: '500' as const,
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
  operationConfigCard: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  operationConfigHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    backgroundColor: colors.surface,
  },
  operationConfigTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  operationConfigIcon: {
    fontSize: 24,
    marginRight: spacing.md,
  },
  operationConfigInfo: {
    flex: 1,
  },
  operationConfigName: {
    fontSize: typography.body.fontSize,
    fontWeight: '600' as const,
    color: colors.text,
  },
  operationConfigCount: {
    fontSize: typography.caption.fontSize,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  operationConfigChevron: {
    fontSize: 24,
    color: colors.primary,
    marginLeft: spacing.md,
    transform: [{ rotate: '0deg' }],
  },
  operationConfigChevronOpen: {
    transform: [{ rotate: '90deg' }],
  },
  operationConfigContent: {
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
  },
  operationConfigContentTitle: {
    fontSize: typography.bodySmall.fontSize,
    fontWeight: '600' as const,
    color: colors.text,
    marginBottom: spacing.md,
  },
  operationAssetItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  operationAssetItemSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '05',
  },
  operationAssetCheckbox: {
    width: 20,
    height: 20,
    borderRadius: borderRadius.sm,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  operationAssetInfo: {
    flex: 1,
  },
  operationAssetCode: {
    fontSize: typography.caption.fontSize,
    fontWeight: '600' as const,
    color: colors.primary,
  },
  operationAssetCodeSelected: {
    color: colors.primary,
    fontWeight: '700' as const,
  },
  operationAssetDesignation: {
    fontSize: typography.bodySmall.fontSize,
    color: colors.text,
    marginTop: spacing.xs,
  },
  operationAssetDesignationSelected: {
    fontWeight: '500' as const,
  },
  sectionDescription: {
    fontSize: typography.bodySmall.fontSize,
    color: colors.textMuted,
    marginBottom: spacing.md,
    fontStyle: 'italic' as const,
  },
  summaryCard: {
    backgroundColor: colors.primary + '10',
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  summaryTitle: {
    fontSize: typography.body.fontSize,
    fontWeight: '600' as const,
    color: colors.primary,
    marginBottom: spacing.md,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  summaryLabel: {
    fontSize: typography.body.fontSize,
    color: colors.text,
  },
  summaryValue: {
    fontSize: typography.body.fontSize,
    fontWeight: '600' as const,
    color: colors.primary,
  },
  submitButton: {
    marginTop: spacing.lg,
  },
});
