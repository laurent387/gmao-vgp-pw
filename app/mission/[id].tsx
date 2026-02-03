import React, { useState, useRef, useCallback, memo } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, Modal, TextInput } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Calendar, MapPin, User, Play, CheckCircle, Users, 
  Wrench, Eye, Settings, FileEdit, ChevronRight, Building2,
  ChevronDown, ChevronUp, Edit2, Check, X, Plus, Trash2,
  FileText, Image, Award, Paperclip, ExternalLink
} from 'lucide-react-native';
import { colors, spacing, borderRadius, typography, shadows } from '@/constants/theme';
import { StatusBadge, CriticalityBadge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { EmptyState, LoadingState } from '@/components/EmptyState';
import { Mission, OperationType } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { webApiService } from '@/services/WebApiService';

const OPERATION_ICONS: Record<OperationType, React.ReactNode> = {
  MAINTENANCE: <Wrench size={18} color={colors.primary} />,
  INSPECTION: <Eye size={18} color={colors.info} />,
  REPARATION: <Settings size={18} color={colors.warning} />,
  MODIFICATION: <FileEdit size={18} color={colors.textSecondary} />,
};

const OPERATION_LABELS: Record<OperationType, string> = {
  MAINTENANCE: 'Maintenance Préventive',
  INSPECTION: 'Vérification',
  REPARATION: 'Maintenance Corrective',
  MODIFICATION: 'Autres',
};

interface MissionOperationAsset {
  id: number;
  mission_id: string;
  operation_type: OperationType;
  asset_id: string;
  code_interne: string;
  designation: string;
  categorie: string;
  work_description?: string;
  checklist_template_id?: number;
  checklist_name?: string;
  checklist_data: Array<{
    step: string;
    order: number;
    checked: boolean;
    checked_at?: string;
    checked_by?: string;
  }>;
}

// Composant isolé pour l'input de description - évite les re-renders
const DescriptionInput = memo(({ 
  initialValue, 
  onSave, 
  onCancel 
}: { 
  initialValue: string; 
  onSave: (value: string) => void; 
  onCancel: () => void;
}) => {
  const [value, setValue] = useState(initialValue);
  
  return (
    <View style={styles.editDescriptionContainer}>
      <TextInput
        style={styles.descriptionInput}
        value={value}
        onChangeText={setValue}
        placeholder="Décrivez les travaux à réaliser..."
        multiline
        numberOfLines={4}
        autoFocus
      />
      <View style={styles.editDescriptionActions}>
        <TouchableOpacity
          onPress={onCancel}
          style={[styles.editDescriptionButton, styles.cancelButton]}
        >
          <X size={16} color={colors.textSecondary} />
          <Text style={styles.cancelButtonText}>Annuler</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => onSave(value)}
          style={[styles.editDescriptionButton, styles.saveButton]}
        >
          <Check size={16} color="#fff" />
          <Text style={styles.saveButtonText}>Enregistrer</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
});

// Composant isolé pour l'input de checklist step - évite les re-renders
const ChecklistStepInput = memo(({ 
  onAdd 
}: { 
  onAdd: (step: string) => void;
}) => {
  const [value, setValue] = useState('');
  const inputRef = useRef<TextInput>(null);
  
  const handleAdd = () => {
    const trimmed = value.trim();
    if (!trimmed) return;
    onAdd(trimmed);
    setValue('');
    // Refocus après ajout
    setTimeout(() => inputRef.current?.focus(), 50);
  };
  
  return (
    <View style={styles.addStepRow}>
      <TextInput
        ref={inputRef}
        style={styles.addStepInput}
        value={value}
        onChangeText={setValue}
        placeholder="Nouvelle étape..."
        onSubmitEditing={handleAdd}
        autoFocus
        blurOnSubmit={false}
      />
      <TouchableOpacity
        style={styles.addStepButton}
        onPress={handleAdd}
      >
        <Plus size={16} color="#fff" />
        <Text style={styles.addStepButtonText}>Ajouter</Text>
      </TouchableOpacity>
    </View>
  );
});

export default function MissionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, isAdmin, canEdit } = useAuth();
  const [refreshing, setRefreshing] = React.useState(false);
  const [expandedOperations, setExpandedOperations] = useState<Set<OperationType>>(new Set());
  const [editingDescriptionId, setEditingDescriptionId] = useState<number | null>(null);
  const [editingChecklistId, setEditingChecklistId] = useState<number | null>(null);
  const isAdminUser = isAdmin();
  const canEditChecklist = canEdit();

  // Fetch mission base data
  const { data: mission, isLoading, refetch: refetchMission } = useQuery<Mission | null>({
    queryKey: ['mission', id],
    queryFn: async () => {
      const result = await webApiService.getMissionById(id!);
      return result;
    },
    enabled: !!id,
  });

  // Check if current user is assigned to this mission (must be after mission query)
  const isAssignedToMission = mission?.technicians?.some((tech: any) => tech.id === user?.id) ?? false;
  const canStartOrCompleteMission = isAssignedToMission || !isAdminUser; // Technicians can always, admins only if assigned

  // Fetch operation assets with checklists
  const { data: operationAssets, refetch: refetchAssets } = useQuery<MissionOperationAsset[]>({
    queryKey: ['mission-operation-assets', id],
    queryFn: () => webApiService.getMissionOperationAssets(id!),
    enabled: !!id,
  });

  // Get unique asset IDs from operation assets
  const assetIds = operationAssets?.map(a => a.asset_id) || [];

  // Fetch attachments for all assets in this mission
  const { data: attachmentsByAsset } = useQuery<Record<string, any[]>>({
    queryKey: ['mission-attachments', id, assetIds.join(',')],
    queryFn: async () => {
      if (assetIds.length === 0) return {};
      const result: Record<string, any[]> = {};
      await Promise.all(
        assetIds.map(async (assetId) => {
          try {
            const attachments = await webApiService.getAttachments('ASSET', assetId);
            if (attachments && attachments.length > 0) {
              result[assetId] = attachments;
            }
          } catch (e) {
            console.error(`Error fetching attachments for ${assetId}:`, e);
          }
        })
      );
      return result;
    },
    enabled: assetIds.length > 0,
  });

  const startMutation = useMutation({
    mutationFn: () => webApiService.updateMissionStatus(id!, 'EN_COURS'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mission', id] });
      queryClient.invalidateQueries({ queryKey: ['missions'] });
    },
  });

  const completeMutation = useMutation({
    mutationFn: () => webApiService.updateMissionStatus(id!, 'TERMINEE'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mission', id] });
      queryClient.invalidateQueries({ queryKey: ['missions'] });
    },
  });

  const updateChecklistItemMutation = useMutation({
    mutationFn: ({ assetId, checklist_data }: { assetId: number; checklist_data: any[] }) =>
      webApiService.updateMissionOperationAsset(id!, assetId, { checklist_data }),
    onMutate: async ({ assetId, checklist_data }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['mission-operation-assets', id] });
      
      // Snapshot previous value
      const previousAssets = queryClient.getQueryData<MissionOperationAsset[]>(['mission-operation-assets', id]);
      
      // Optimistically update
      queryClient.setQueryData<MissionOperationAsset[]>(['mission-operation-assets', id], (old) =>
        old?.map((asset) =>
          asset.id === assetId ? { ...asset, checklist_data } : asset
        )
      );
      
      return { previousAssets };
    },
    onError: (_err, _variables, context) => {
      // Rollback on error
      if (context?.previousAssets) {
        queryClient.setQueryData(['mission-operation-assets', id], context.previousAssets);
      }
    },
    // Don't refetch on success - we already have the updated data
  });

  const updateDescriptionMutation = useMutation({
    mutationFn: ({ assetId, description }: { assetId: number; description: string }) =>
      webApiService.updateMissionOperationAsset(id!, assetId, { work_description: description }),
    onMutate: async ({ assetId, description }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['mission-operation-assets', id] });
      
      // Snapshot previous value
      const previousAssets = queryClient.getQueryData<MissionOperationAsset[]>(['mission-operation-assets', id]);
      
      // Optimistically update
      queryClient.setQueryData<MissionOperationAsset[]>(['mission-operation-assets', id], (old) =>
        old?.map((asset) =>
          asset.id === assetId ? { ...asset, work_description: description } : asset
        )
      );
      
      return { previousAssets };
    },
    onSuccess: () => {
      setEditingDescriptionId(null);
    },
    onError: (_err, _variables, context) => {
      // Rollback on error
      if (context?.previousAssets) {
        queryClient.setQueryData(['mission-operation-assets', id], context.previousAssets);
      }
    },
  });

  const startEditingChecklist = (asset: MissionOperationAsset) => {
    setEditingChecklistId(asset.id);
  };

  const addChecklistStepToAsset = useCallback((asset: MissionOperationAsset, step: string) => {
    const currentChecklist = asset.checklist_data || [];
    const newChecklist = [
      ...currentChecklist,
      {
        step,
        order: currentChecklist.length + 1,
        checked: false,
        checked_at: null,
        checked_by: null,
      },
    ];

    updateChecklistItemMutation.mutate({
      assetId: asset.id,
      checklist_data: newChecklist,
    });
  }, [updateChecklistItemMutation]);

  const removeChecklistStepFromAsset = (asset: MissionOperationAsset, stepIndex: number) => {
    const currentChecklist = asset.checklist_data || [];
    const newChecklist = currentChecklist
      .filter((_, i) => i !== stepIndex)
      .map((item, idx) => ({ ...item, order: idx + 1 }));

    updateChecklistItemMutation.mutate({
      assetId: asset.id,
      checklist_data: newChecklist,
    });
  };

  const stopEditingChecklist = () => {
    setEditingChecklistId(null);
  };

  const saveDescription = useCallback((assetId: number, description: string) => {
    updateDescriptionMutation.mutate({ assetId, description });
  }, [updateDescriptionMutation]);

  const cancelEditingDescription = () => {
    setEditingDescriptionId(null);
  };

  const startEditingDescription = (asset: MissionOperationAsset) => {
    setEditingDescriptionId(asset.id);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetchMission(), refetchAssets()]);
    setRefreshing(false);
  };

  const toggleOperation = (op: OperationType) => {
    setExpandedOperations((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(op)) {
        newSet.delete(op);
      } else {
        newSet.add(op);
      }
      return newSet;
    });
  };

  const toggleChecklistItem = (asset: MissionOperationAsset, stepIndex: number) => {
    if (!canEditChecklist) return; // Only authorized roles can check items
    
    const updatedChecklist = [...asset.checklist_data];
    updatedChecklist[stepIndex] = {
      ...updatedChecklist[stepIndex],
      checked: !updatedChecklist[stepIndex].checked,
      checked_at: !updatedChecklist[stepIndex].checked ? new Date().toISOString() : undefined,
      checked_by: !updatedChecklist[stepIndex].checked ? user?.id : undefined,
    };
    
    updateChecklistItemMutation.mutate({
      assetId: asset.id,
      checklist_data: updatedChecklist,
    });
  };

  if (isLoading) {
    return <LoadingState message="Chargement de la mission..." />;
  }

  if (!mission) {
    return (
      <EmptyState
        title="Mission non trouvée"
        message="Cette mission n'existe pas ou a été supprimée"
      />
    );
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const formatDateLong = (date: string) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  // Group assets by operation type
  const assetsByOperation: Record<OperationType, MissionOperationAsset[]> = {
    MAINTENANCE: [],
    INSPECTION: [],
    REPARATION: [],
    MODIFICATION: [],
  };

  operationAssets?.forEach((asset) => {
    if (asset.operation_type in assetsByOperation) {
      assetsByOperation[asset.operation_type].push(asset);
    }
  });

  const hasOperations = Object.values(assetsByOperation).some((assets) => assets.length > 0);

  return (
    <>
      <Stack.Screen
        options={{
          title: `Mission du ${formatDate(mission.scheduled_at)}`,
          headerBackTitle: 'Missions',
        }}
      />
      <ScrollView
        style={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Header Card */}
        <View style={styles.headerCard}>
          <View style={styles.headerTop}>
            <StatusBadge status={mission.status} />
            <Text style={styles.dateLabel}>{formatDate(mission.scheduled_at)}</Text>
          </View>
          
          <Text style={styles.missionTitle}>
            Mission du {formatDateLong(mission.scheduled_at)}
          </Text>

          <View style={styles.infoRow}>
            <Building2 size={16} color={colors.textSecondary} />
            <Text style={styles.infoText}>{mission.client_name}</Text>
          </View>

          <View style={styles.infoRow}>
            <MapPin size={16} color={colors.textSecondary} />
            <Text style={styles.infoText}>{mission.site_name}</Text>
          </View>

          {/* Technicians */}
          {mission.technicians && mission.technicians.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Users size={18} color={colors.primary} />
                <Text style={styles.sectionTitle}>
                  Techniciens assignés ({mission.technicians.length})
                </Text>
              </View>
              <View style={styles.technicianChips}>
                {mission.technicians.map((tech: any) => (
                  <View key={tech.id} style={styles.technicianChip}>
                    <User size={14} color={colors.primary} />
                    <Text style={styles.technicianName}>{tech.name}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Action Buttons */}
          {mission.status === 'PLANIFIEE' && (
            <Button
              title={canStartOrCompleteMission ? "📍 Démarrer la mission" : "📍 Non assigné à cette mission"}
              onPress={() => startMutation.mutate()}
              loading={startMutation.isPending}
              fullWidth
              style={styles.actionButton}
              disabled={!canStartOrCompleteMission}
            />
          )}

          {mission.status === 'EN_COURS' && (
            <Button
              title={canStartOrCompleteMission ? "✅ Terminer la mission" : "✅ Non assigné à cette mission"}
              onPress={() => completeMutation.mutate()}
              loading={completeMutation.isPending}
              fullWidth
              style={styles.actionButton}
              disabled={!canStartOrCompleteMission}
            />
          )}
        </View>

        {/* Operations with Assets and Checklists */}
        <View style={styles.operationsSection}>
          <Text style={styles.mainSectionTitle}>🔧 Opérations à réaliser</Text>

          {!hasOperations && (
            <EmptyState
              title="Aucune opération"
              message="Aucune opération n'a été configurée pour cette mission"
            />
          )}

          {Object.entries(assetsByOperation).map(([operationType, assets]) => {
            if (assets.length === 0) return null;
            
            const opType = operationType as OperationType;
            const isExpanded = expandedOperations.has(opType);

            return (
              <View key={opType} style={styles.operationCard}>
                <View style={styles.operationHeader}>
                  <TouchableOpacity
                    style={styles.operationToggle}
                    onPress={() => toggleOperation(opType)}
                  >
                    <View style={styles.operationTitleRow}>
                      {OPERATION_ICONS[opType]}
                      <Text style={styles.operationTitle}>{OPERATION_LABELS[opType]}</Text>
                      <View style={styles.assetCount}>
                        <Text style={styles.assetCountText}>{assets.length}</Text>
                      </View>
                    </View>
                    {isExpanded ? (
                      <ChevronUp size={20} color={colors.textSecondary} />
                    ) : (
                      <ChevronDown size={20} color={colors.textSecondary} />
                    )}
                  </TouchableOpacity>
                </View>

                {isExpanded && (
                  <View style={styles.operationContent}>
                    {assets.map((asset, idx) => {
                      const allChecked = asset.checklist_data?.every((item) => item.checked);
                      const isEditing = editingDescriptionId === asset.id;
                      const assetAttachments = attachmentsByAsset?.[asset.asset_id] || [];

                      // Grouper par catégorie
                      const docsByCategory = {
                        photos: assetAttachments.filter((a: any) => a.category === 'PHOTO' || a.file_type === 'IMAGE'),
                        certificates: assetAttachments.filter((a: any) => a.category === 'CERTIFICAT'),
                        manuals: assetAttachments.filter((a: any) => a.category === 'MANUEL' || a.category === 'DOCUMENTATION'),
                        other: assetAttachments.filter((a: any) => !['PHOTO', 'CERTIFICAT', 'MANUEL', 'DOCUMENTATION'].includes(a.category) && a.file_type !== 'IMAGE'),
                      };

                      return (
                        <View key={asset.id} style={[styles.assetCard, idx > 0 && styles.assetCardSpacing]}>
                          {/* Asset Header */}
                          <View style={styles.assetHeader}>
                            <View style={styles.assetTitleRow}>
                              <Text style={styles.assetCode}>{asset.code_interne}</Text>
                              {allChecked && <Check size={16} color={colors.success} />}
                            </View>
                            <Text style={styles.assetDesignation}>{asset.designation}</Text>
                            <Text style={styles.assetCategory}>{asset.categorie}</Text>
                          </View>

                          {/* Documents attachés */}
                          {assetAttachments.length > 0 && (
                            <View style={styles.documentsSection}>
                              <Text style={styles.documentsLabel}>📎 Documents ({assetAttachments.length})</Text>
                              <View style={styles.documentsRow}>
                                {docsByCategory.photos.length > 0 && (
                                  <TouchableOpacity 
                                    style={styles.docBadge}
                                    onPress={() => router.push(`/asset/${asset.asset_id}?tab=documents`)}
                                  >
                                    <Image size={14} color={colors.info} />
                                    <Text style={styles.docBadgeText}>{docsByCategory.photos.length} photo{docsByCategory.photos.length > 1 ? 's' : ''}</Text>
                                  </TouchableOpacity>
                                )}
                                {docsByCategory.certificates.length > 0 && (
                                  <TouchableOpacity 
                                    style={styles.docBadge}
                                    onPress={() => router.push(`/asset/${asset.asset_id}?tab=documents`)}
                                  >
                                    <Award size={14} color={colors.success} />
                                    <Text style={styles.docBadgeText}>{docsByCategory.certificates.length} certificat{docsByCategory.certificates.length > 1 ? 's' : ''}</Text>
                                  </TouchableOpacity>
                                )}
                                {docsByCategory.manuals.length > 0 && (
                                  <TouchableOpacity 
                                    style={styles.docBadge}
                                    onPress={() => router.push(`/asset/${asset.asset_id}?tab=documents`)}
                                  >
                                    <FileText size={14} color={colors.warning} />
                                    <Text style={styles.docBadgeText}>{docsByCategory.manuals.length} manuel{docsByCategory.manuals.length > 1 ? 's' : ''}</Text>
                                  </TouchableOpacity>
                                )}
                                {docsByCategory.other.length > 0 && (
                                  <TouchableOpacity 
                                    style={styles.docBadge}
                                    onPress={() => router.push(`/asset/${asset.asset_id}?tab=documents`)}
                                  >
                                    <Paperclip size={14} color={colors.textSecondary} />
                                    <Text style={styles.docBadgeText}>{docsByCategory.other.length} autre{docsByCategory.other.length > 1 ? 's' : ''}</Text>
                                  </TouchableOpacity>
                                )}
                              </View>
                            </View>
                          )}

                          {/* Work Description */}
                          <View style={styles.descriptionSection}>
                            <View style={styles.descriptionHeader}>
                              <Text style={styles.descriptionLabel}>📝 Descriptif des travaux</Text>
                              {isAdminUser && !isEditing && (
                                <TouchableOpacity
                                  onPress={() => startEditingDescription(asset)}
                                  style={styles.editButton}
                                >
                                  <Edit2 size={16} color={colors.primary} />
                                </TouchableOpacity>
                              )}
                            </View>
                            
                            {isEditing ? (
                              <DescriptionInput
                                initialValue={asset.work_description || ''}
                                onSave={(value) => saveDescription(asset.id, value)}
                                onCancel={cancelEditingDescription}
                              />
                            ) : (
                              <Text style={styles.descriptionText}>
                                {asset.work_description || 'Aucun descriptif défini'}
                              </Text>
                            )}
                          </View>

                          {/* Checklist */}
                          <View style={styles.checklistSection}>
                            <View style={styles.descriptionHeader}>
                              <Text style={styles.checklistLabel}>
                                ✓ Checklist ({asset.checklist_data?.length || 0} étape{(asset.checklist_data?.length || 0) !== 1 ? 's' : ''})
                              </Text>
                              {isAdminUser && editingChecklistId !== asset.id && (
                                <TouchableOpacity
                                  onPress={() => startEditingChecklist(asset)}
                                  style={styles.editButton}
                                >
                                  <Edit2 size={16} color={colors.primary} />
                                </TouchableOpacity>
                              )}
                              {isAdminUser && editingChecklistId === asset.id && (
                                <TouchableOpacity
                                  onPress={stopEditingChecklist}
                                  style={styles.editButton}
                                >
                                  <Check size={16} color={colors.success} />
                                </TouchableOpacity>
                              )}
                            </View>

                            {/* Admin add step input */}
                            {isAdminUser && editingChecklistId === asset.id && (
                              <ChecklistStepInput
                                onAdd={(step) => addChecklistStepToAsset(asset, step)}
                              />
                            )}

                            {/* Checklist items */}
                            {asset.checklist_data && asset.checklist_data.length > 0 ? (
                              asset.checklist_data
                                .sort((a, b) => a.order - b.order)
                                .map((item, itemIdx) => (
                                  <View key={itemIdx} style={styles.checklistItemRow}>
                                    <TouchableOpacity
                                      style={styles.checklistItem}
                                      onPress={() => toggleChecklistItem(asset, itemIdx)}
                                      disabled={!canEditChecklist || editingChecklistId === asset.id}
                                    >
                                      <View
                                        style={[
                                          styles.checkbox,
                                          item.checked && styles.checkboxChecked,
                                        ]}
                                      >
                                        {item.checked && <Check size={14} color="#fff" />}
                                      </View>
                                      <Text
                                        style={[
                                          styles.checklistItemText,
                                          item.checked && styles.checklistItemTextChecked,
                                        ]}
                                      >
                                        {item.step}
                                      </Text>
                                    </TouchableOpacity>
                                    {isAdminUser && editingChecklistId === asset.id && (
                                      <TouchableOpacity
                                        onPress={() => removeChecklistStepFromAsset(asset, itemIdx)}
                                        style={styles.removeStepButton}
                                      >
                                        <Trash2 size={16} color={colors.danger} />
                                      </TouchableOpacity>
                                    )}
                                  </View>
                                ))
                            ) : (
                              <Text style={styles.emptyChecklistText}>Aucune étape définie</Text>
                            )}
                          </View>
                        </View>
                      );
                    })}
                  </View>
                )}
              </View>
            );
          })}
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
  headerCard: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  dateLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  missionTitle: {
    ...typography.h2,
    marginBottom: spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  infoText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  section: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    ...typography.body,
    fontWeight: '600',
  },
  technicianChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  technicianChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.primaryLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  technicianName: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
  },
  actionButton: {
    marginTop: spacing.md,
  },
  operationsSection: {
    padding: spacing.lg,
  },
  mainSectionTitle: {
    ...typography.h3,
    marginBottom: spacing.md,
  },
  operationCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
    overflow: 'hidden',
    ...shadows.sm,
  },
  operationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  operationToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flex: 1,
  },
  operationActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  editChecklistButton: {
    padding: spacing.xs,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primaryLight,
  },
  operationTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  operationTitle: {
    ...typography.body,
    fontWeight: '600',
    flex: 1,
  },
  assetCount: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
  },
  assetCountText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
  },
  operationContent: {
    padding: spacing.md,
  },
  assetCard: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.md,
    padding: spacing.md,
  },
  assetCardSpacing: {
    marginTop: spacing.md,
  },
  assetHeader: {
    marginBottom: spacing.md,
  },
  assetTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  assetCode: {
    ...typography.body,
    fontWeight: '600',
    color: colors.primary,
  },
  assetDesignation: {
    ...typography.body,
    marginBottom: spacing.xs,
  },
  assetCategory: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  documentsSection: {
    marginBottom: spacing.md,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  documentsLabel: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    marginBottom: spacing.sm,
  },
  documentsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  docBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.border,
  },
  docBadgeText: {
    ...typography.caption,
    color: colors.textPrimary,
  },
  descriptionSection: {
    marginBottom: spacing.md,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  descriptionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  descriptionLabel: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.textSecondary,
    textTransform: 'uppercase',
  },
  editButton: {
    padding: spacing.xs,
  },
  descriptionText: {
    ...typography.body,
    color: colors.textPrimary,
    fontStyle: 'italic',
  },
  editDescriptionContainer: {
    marginTop: spacing.xs,
  },
  descriptionInput: {
    ...typography.body,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  editDescriptionActions: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  editDescriptionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    flex: 1,
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: colors.backgroundSecondary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cancelButtonText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  saveButton: {
    backgroundColor: colors.primary,
  },
  saveButtonText: {
    ...typography.body,
    color: '#fff',
    fontWeight: '600',
  },
  checklistSection: {
    marginTop: spacing.md,
  },
  checklistHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  checklistLabel: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.textSecondary,
    textTransform: 'uppercase',
  },
  addStepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  addStepInput: {
    flex: 1,
    ...typography.body,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
  },
  addStepButtonText: {
    ...typography.caption,
    color: '#fff',
    fontWeight: '600',
    marginLeft: 4,
  },
  checklistItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  emptyChecklistText: {
    ...typography.body,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  checklistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: colors.success,
    borderColor: colors.success,
  },
  checklistItemText: {
    ...typography.body,
    flex: 1,
  },
  checklistItemTextChecked: {
    textDecorationLine: 'line-through',
    color: colors.textSecondary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    maxHeight: '90%',
  },
  modalScroll: {
    maxHeight: '85%',
  },
  modalTitle: {
    ...typography.h3,
    marginBottom: spacing.md,
  },
  modalLoading: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingVertical: spacing.lg,
  },
  modalLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  modalInput: {
    ...typography.body,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    marginBottom: spacing.sm,
    backgroundColor: colors.surfaceAlt,
  },
  stepInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  stepInput: {
    flex: 1,
    marginBottom: 0,
  },
  addStepButton: {
    backgroundColor: colors.primary,
    padding: spacing.sm,
    borderRadius: borderRadius.md,
  },
  stepsList: {
    marginBottom: spacing.md,
  },
  emptySteps: {
    ...typography.body,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  stepIndex: {
    ...typography.caption,
    color: colors.textSecondary,
    width: 20,
  },
  stepText: {
    ...typography.body,
    flex: 1,
  },
  removeStepButton: {
    padding: spacing.xs,
  },
  previewTitle: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
  },
  previewList: {
    marginBottom: spacing.md,
  },
  previewItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  previewCheckbox: {
    width: 18,
    height: 18,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 4,
  },
  previewText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  modalActions: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
});
