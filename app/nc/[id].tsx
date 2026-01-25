import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, Alert, TouchableOpacity, Platform } from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, User, Calendar, CheckCircle, ArrowRight, Camera, Image as ImageIcon, Trash2, Upload, Plus } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { Image } from 'expo-image';

import { colors, spacing, borderRadius, typography, shadows } from '@/constants/theme';
import { StatusBadge, CriticalityBadge } from '@/components/Badge';
import { SectionCard } from '@/components/Card';
import { Button } from '@/components/Button';
import { EmptyState, LoadingState } from '@/components/EmptyState';
import { ncRepository, actionRepository } from '@/repositories/NCRepository';
import { documentRepository } from '@/repositories/DocumentRepository';
import { syncService } from '@/services/SyncService';
import { useAuth } from '@/contexts/AuthContext';
import { Document, NonConformity, ActionStatus, CorrectiveAction } from '@/types';
import { Input } from '@/components/Input';
import { Modal, TextInput } from 'react-native';

export default function NCDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const queryClient = useQueryClient();
  const { user, canValidate, canEdit, isReadOnly } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [showActionModal, setShowActionModal] = useState(false);
  const [actionForm, setActionForm] = useState({
    owner: '',
    description: '',
    due_at: '',
  });

  const { data: nc, isLoading, refetch } = useQuery<NonConformity | null>({
    queryKey: ['nc', id],
    queryFn: () => ncRepository.getByIdWithAction(id!),
    enabled: !!id,
  });

  const { data: documents } = useQuery<Document[]>({
    queryKey: ['nc-documents', id],
    queryFn: async () => {
      if (!id) return [];
      return documentRepository.getByEntity('nc', id);
    },
    enabled: !!id,
  });

  const createActionMutation = useMutation({
    mutationFn: async () => {
      if (!id) throw new Error('NC inconnue');
      if (!actionForm.owner || !actionForm.due_at) throw new Error('Responsable et échéance requis');

      const actionId = `action-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const now = new Date().toISOString();

      const newAction: CorrectiveAction = {
        id: actionId,
        nonconformity_id: id,
        owner: actionForm.owner,
        description: actionForm.description,
        due_at: actionForm.due_at,
        status: 'OUVERTE',
        closed_at: null,
        validated_by: null,
      };

      await actionRepository.create(newAction);
      await ncRepository.updateStatus(id, 'EN_COURS');

      await syncService.addToOutbox('CREATE_NC', {
        id: id,
        asset_id: nc?.asset_id,
        title: nc?.title,
        description: nc?.description,
        severity: nc?.severity,
        status: 'EN_COURS',
        corrective_action: newAction,
      });

      return newAction;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nc', id] });
      queryClient.invalidateQueries({ queryKey: ['nonconformities'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-kpis'] });
      setShowActionModal(false);
      setActionForm({ owner: '', description: '', due_at: '' });
      Alert.alert('Succès', 'Action corrective créée');
    },
    onError: (error) => {
      Alert.alert('Erreur', error instanceof Error ? error.message : 'Erreur');
    },
  });

  const updateActionMutation = useMutation({
    mutationFn: async (newStatus: ActionStatus) => {
      if (!nc?.corrective_action) throw new Error('Pas d\'action corrective');
      
      await actionRepository.updateStatus(
        nc.corrective_action.id,
        newStatus,
        newStatus === 'VALIDEE' ? user?.id : undefined
      );

      if (newStatus === 'CLOTUREE' || newStatus === 'VALIDEE') {
        await ncRepository.updateStatus(id!, 'CLOTUREE');
      }

      await syncService.addToOutbox('UPDATE_ACTION', {
        actionId: nc.corrective_action.id,
        status: newStatus,
        ncId: id,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nc', id] });
      queryClient.invalidateQueries({ queryKey: ['nonconformities'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-kpis'] });
      Alert.alert('Succès', 'Action mise à jour');
    },
    onError: (error) => {
      Alert.alert('Erreur', error instanceof Error ? error.message : 'Erreur');
    },
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const formatDate = (date: string | null) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const action = nc?.corrective_action;

  const photoDocs = useMemo(() => {
    return (documents ?? []).filter((d) => d.mime.startsWith('image/'));
  }, [documents]);

  const resolveImageUri = useCallback(
    (doc: Document): string => {
      if (doc.server_url) {
        const base = process.env.EXPO_PUBLIC_RORK_API_BASE_URL || '';
        if (doc.server_url.startsWith('http')) return doc.server_url;
        if (base) return `${base}${doc.server_url}`;
      }
      return doc.local_uri;
    },
    []
  );
  const canProgress = canEdit() && action;
  const canClose = canProgress && action?.status === 'EN_COURS';
  const canValidateAction = canValidate() && action?.status === 'CLOTUREE';

  const getNextActionButton = () => {
    if (!action) return null;
    
    switch (action.status) {
      case 'OUVERTE':
        return canProgress ? (
          <Button
            title="Démarrer l'action"
            onPress={() => updateActionMutation.mutate('EN_COURS')}
            loading={updateActionMutation.isPending}
            icon={<ArrowRight size={18} color={colors.textInverse} />}
            fullWidth
          />
        ) : null;
      case 'EN_COURS':
        return canClose ? (
          <Button
            title="Clôturer l'action"
            onPress={() => updateActionMutation.mutate('CLOTUREE')}
            loading={updateActionMutation.isPending}
            icon={<CheckCircle size={18} color={colors.textInverse} />}
            fullWidth
          />
        ) : null;
      case 'CLOTUREE':
        return canValidateAction ? (
          <Button
            title="Valider la clôture"
            onPress={() => updateActionMutation.mutate('VALIDEE')}
            loading={updateActionMutation.isPending}
            variant="secondary"
            icon={<CheckCircle size={18} color={colors.textInverse} />}
            fullWidth
          />
        ) : null;
      default:
        return null;
    }
  };

  const addPhotoMutation = useMutation<{ documentId: string }, Error, void>({
    mutationFn: async () => {
      if (!id) throw new Error('NC inconnue');

      if (Platform.OS !== 'web') {
        const perm = await ImagePicker.requestCameraPermissionsAsync();
        if (perm.status !== 'granted') {
          throw new Error('Permission caméra refusée');
        }
      }

      const result = await ImagePicker.launchCameraAsync({
        quality: 0.8,
        exif: false,
        allowsEditing: false,
      });

      if (result.canceled || !result.assets[0]?.uri) {
        throw new Error('Capture annulée');
      }

      const srcUri = result.assets[0].uri;

      if (Platform.OS === 'web') {
        const docId = `web-doc-${Date.now()}`;
        await syncService.addToOutbox('UPLOAD_DOCUMENT', { documentId: docId });
        return { documentId: docId };
      }

      const photosDir = `${FileSystem.Paths.document.uri}photos`;
      const dirInfo = await FileSystem.getInfoAsync(photosDir);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(photosDir, { intermediates: true });
      }

      const destUri = `${photosDir}/nc-${id}-${Date.now()}.jpg`;
      await FileSystem.copyAsync({ from: srcUri, to: destUri });

      const documentId = await documentRepository.create({
        entity_type: 'nc',
        entity_id: id,
        local_uri: destUri,
        mime: 'image/jpeg',
        sha256: null,
        uploaded_at: new Date().toISOString(),
        synced: false,
        server_url: null,
      });

      await syncService.addToOutbox('UPLOAD_DOCUMENT', { documentId });

      return { documentId };
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['nc-documents', id] });
      await queryClient.invalidateQueries({ queryKey: ['outbox-pending-count'] });
      await queryClient.invalidateQueries({ queryKey: ['outbox'] });
    },
    onError: (e) => {
      if (e.message !== 'Capture annulée') {
        Alert.alert('Erreur', e.message);
      }
    },
  });

  const deletePhotoMutation = useMutation<void, Error, { documentId: string; localUri: string }>({
    mutationFn: async ({ documentId, localUri }) => {
      if (Platform.OS !== 'web') {
        try {
          await FileSystem.deleteAsync(localUri, { idempotent: true });
        } catch (e) {
          console.log('[NC] Failed to delete local file:', e);
        }
      }
      await documentRepository.deleteById(documentId);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['nc-documents', id] });
    },
    onError: (e) => Alert.alert('Erreur', e.message),
  });

  return (
    <>
      <Stack.Screen options={{ title: 'Non-conformité' }} />

      {isLoading ? (
        <LoadingState message="Chargement..." />
      ) : !nc ? (
        <EmptyState title="NC non trouvée" message="Cette non-conformité n'existe pas" />
      ) : (

      <ScrollView
        style={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <AlertTriangle size={24} color={colors.danger} />
            <CriticalityBadge level={nc?.severity ?? 3} />
            <StatusBadge status={nc?.status ?? 'OUVERTE'} />
          </View>
          <Text style={styles.title}>{nc?.title ?? ''}</Text>
          {(nc as any).asset_code && (
            <Text style={styles.assetInfo}>
              Équipement: {(nc as any).asset_code} - {(nc as any).asset_designation}
            </Text>
          )}
          <Text style={styles.date}>Créée le {formatDate(nc?.created_at ?? null)}</Text>
        </View>

        <View style={styles.content}>
          <SectionCard title="Description">
            <Text style={styles.description}>
              {nc?.description || 'Aucune description'}
            </Text>
          </SectionCard>

          <SectionCard
            title="Photos"
            action={
              <TouchableOpacity
                testID="nc-add-photo"
                style={styles.photoAddBtn}
                onPress={() => addPhotoMutation.mutate()}
                disabled={addPhotoMutation.isPending}
              >
                <Camera size={18} color={colors.textInverse} />
                <Text style={styles.photoAddBtnText}>{addPhotoMutation.isPending ? '...' : 'Ajouter'}</Text>
              </TouchableOpacity>
            }
          >
            {photoDocs.length === 0 ? (
              <View style={styles.photoEmpty}>
                <ImageIcon size={18} color={colors.textMuted} />
                <Text style={styles.photoEmptyText}>Aucune photo</Text>
                <Text style={styles.photoEmptyHint}>
                  Ajoutez une photo pour documenter la non-conformité.
                </Text>
              </View>
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.photoRow}>
                {photoDocs.map((doc) => {
                  const uri = resolveImageUri(doc);
                  return (
                    <View key={doc.id} style={styles.photoCard}>
                      <Image source={{ uri }} style={styles.photo} contentFit="cover" />
                      <View style={styles.photoMeta}>
                        <View style={styles.photoMetaLeft}>
                          <Text style={styles.photoMetaText} numberOfLines={1}>
                            {doc.synced ? 'Synchronisée' : 'En attente'}
                          </Text>
                        </View>
                        <View style={styles.photoMetaRight}>
                          {!doc.synced && (
                            <View style={styles.photoMetaBadge}>
                              <Upload size={14} color={colors.warning} />
                            </View>
                          )}
                          <TouchableOpacity
                            testID={`nc-delete-photo-${doc.id}`}
                            onPress={() =>
                              deletePhotoMutation.mutate({
                                documentId: doc.id,
                                localUri: doc.local_uri,
                              })
                            }
                            style={styles.photoDeleteBtn}
                          >
                            <Trash2 size={16} color={colors.danger} />
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  );
                })}
              </ScrollView>
            )}
          </SectionCard>

          {action && (
            <SectionCard title="Action corrective">
              <View style={styles.actionHeader}>
                <StatusBadge status={action.status} />
                {action.due_at && new Date(action.due_at) < new Date() && action.status !== 'VALIDEE' && (
                  <View style={styles.overdueBadge}>
                    <Text style={styles.overdueText}>En retard</Text>
                  </View>
                )}
              </View>

              <View style={styles.infoRow}>
                <User size={16} color={colors.textMuted} />
                <Text style={styles.infoLabel}>Responsable:</Text>
                <Text style={styles.infoValue}>{action.owner}</Text>
              </View>

              <View style={styles.infoRow}>
                <Calendar size={16} color={colors.textMuted} />
                <Text style={styles.infoLabel}>Échéance:</Text>
                <Text style={[
                  styles.infoValue,
                  action.due_at && new Date(action.due_at) < new Date() && action.status !== 'VALIDEE' && styles.overdueValue
                ]}>
                  {formatDate(action.due_at)}
                </Text>
              </View>

              {action.description && (
                <Text style={styles.actionDescription}>{action.description}</Text>
              )}

              {action.closed_at && (
                <View style={styles.infoRow}>
                  <CheckCircle size={16} color={colors.success} />
                  <Text style={styles.infoLabel}>Clôturée le:</Text>
                  <Text style={styles.infoValue}>{formatDate(action.closed_at)}</Text>
                </View>
              )}

              {action.validated_by && (
                <View style={styles.infoRow}>
                  <CheckCircle size={16} color={colors.success} />
                  <Text style={styles.infoLabel}>Validée par:</Text>
                  <Text style={styles.infoValue}>{action.validated_by}</Text>
                </View>
              )}

              <View style={styles.actionButtons}>
                {getNextActionButton()}
              </View>
            </SectionCard>
          )}

          {!action && canEdit() && !isReadOnly() && (
            <View style={styles.noAction}>
              <Text style={styles.noActionText}>Aucune action corrective définie</Text>
              <Button
                title="Créer une action"
                onPress={() => setShowActionModal(true)}
                variant="outline"
                icon={<Plus size={18} color={colors.primary} />}
              />
            </View>
          )}

          <Modal visible={showActionModal} transparent animationType="slide">
            <View style={styles.modalOverlay}>
              <View style={styles.modalContainer}>
                <Text style={styles.modalTitle}>Nouvelle action corrective</Text>
                
                <View style={styles.modalField}>
                  <Text style={styles.modalLabel}>Responsable *</Text>
                  <TextInput
                    style={styles.modalInput}
                    value={actionForm.owner}
                    onChangeText={(text) => setActionForm({ ...actionForm, owner: text })}
                    placeholder="Nom du responsable"
                    placeholderTextColor={colors.textMuted}
                  />
                </View>

                <View style={styles.modalField}>
                  <Text style={styles.modalLabel}>Description</Text>
                  <TextInput
                    style={[styles.modalInput, styles.modalInputMulti]}
                    value={actionForm.description}
                    onChangeText={(text) => setActionForm({ ...actionForm, description: text })}
                    placeholder="Description de l'action à réaliser"
                    placeholderTextColor={colors.textMuted}
                    multiline
                    numberOfLines={3}
                  />
                </View>

                <View style={styles.modalField}>
                  <Text style={styles.modalLabel}>Échéance * (AAAA-MM-JJ)</Text>
                  <TextInput
                    style={styles.modalInput}
                    value={actionForm.due_at}
                    onChangeText={(text) => setActionForm({ ...actionForm, due_at: text })}
                    placeholder="2025-02-15"
                    placeholderTextColor={colors.textMuted}
                  />
                </View>

                <View style={styles.modalButtons}>
                  <Button
                    title="Annuler"
                    onPress={() => {
                      setShowActionModal(false);
                      setActionForm({ owner: '', description: '', due_at: '' });
                    }}
                    variant="outline"
                    style={{ flex: 1 }}
                  />
                  <Button
                    title="Créer"
                    onPress={() => createActionMutation.mutate()}
                    loading={createActionMutation.isPending}
                    style={{ flex: 1 }}
                  />
                </View>
              </View>
            </View>
          </Modal>
        </View>
      </ScrollView>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  title: {
    ...typography.h2,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  assetInfo: {
    fontSize: typography.bodySmall.fontSize,
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  date: {
    fontSize: typography.caption.fontSize,
    color: colors.textMuted,
  },
  content: {
    padding: spacing.lg,
    gap: spacing.lg,
  },
  photoAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: borderRadius.full,
  },
  photoAddBtnText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: colors.textInverse,
  },
  photoEmpty: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
    gap: spacing.sm,
  },
  photoEmptyText: {
    fontSize: typography.bodySmall.fontSize,
    fontWeight: '600' as const,
    color: colors.text,
  },
  photoEmptyHint: {
    fontSize: typography.caption.fontSize,
    color: colors.textMuted,
    textAlign: 'center' as const,
    maxWidth: 280,
  },
  photoRow: {
    gap: spacing.md,
    paddingVertical: spacing.sm,
    paddingRight: spacing.lg,
  },
  photoCard: {
    width: 220,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
  },
  photo: {
    width: '100%',
    height: 140,
    backgroundColor: colors.surfaceAlt,
  },
  photoMeta: {
    padding: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  photoMetaLeft: {
    flex: 1,
  },
  photoMetaText: {
    fontSize: typography.caption.fontSize,
    color: colors.textSecondary,
  },
  photoMetaRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  photoMetaBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.warningLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoDeleteBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  description: {
    fontSize: typography.body.fontSize,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  actionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  overdueBadge: {
    backgroundColor: colors.dangerLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  overdueText: {
    fontSize: typography.caption.fontSize,
    fontWeight: '600' as const,
    color: colors.danger,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  infoLabel: {
    fontSize: typography.bodySmall.fontSize,
    color: colors.textMuted,
  },
  infoValue: {
    fontSize: typography.bodySmall.fontSize,
    fontWeight: '500' as const,
    color: colors.text,
  },
  overdueValue: {
    color: colors.danger,
  },
  actionDescription: {
    fontSize: typography.bodySmall.fontSize,
    color: colors.textSecondary,
    marginVertical: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  actionButtons: {
    marginTop: spacing.lg,
    gap: spacing.md,
  },
  noAction: {
    alignItems: 'center',
    padding: spacing.xl,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    ...shadows.sm,
  },
  noActionText: {
    fontSize: typography.body.fontSize,
    color: colors.textMuted,
    marginBottom: spacing.md,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  modalContainer: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    ...shadows.lg,
  },
  modalTitle: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.lg,
  },
  modalField: {
    marginBottom: spacing.md,
  },
  modalLabel: {
    fontSize: typography.bodySmall.fontSize,
    fontWeight: '500' as const,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  modalInput: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    fontSize: typography.body.fontSize,
    color: colors.text,
  },
  modalInputMulti: {
    minHeight: 80,
    textAlignVertical: 'top' as const,
  },
  modalButtons: {
    flexDirection: 'row' as const,
    gap: spacing.md,
    marginTop: spacing.lg,
  },
});
