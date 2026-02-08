import React, { useCallback, useMemo, useState, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, Alert, TouchableOpacity, Platform } from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, User, Calendar, CheckCircle, ArrowRight, Camera, Image as ImageIcon, Trash2, Upload, Plus, Edit3, Save, X } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { Image } from 'expo-image';

import { colors, spacing, borderRadius, typography, shadows } from '@/constants/theme';
import { StatusBadge, CriticalityBadge } from '@/components/Badge';
import { SectionCard } from '@/components/Card';
import { Button } from '@/components/Button';
import { EmptyState, LoadingState } from '@/components/EmptyState';
import { ncRepository, actionRepository } from '@/repositories/NCRepository';
import { assetRepository } from '@/repositories/AssetRepository';
import { clientRepository, siteRepository } from '@/repositories/SiteRepository';
import { documentRepository } from '@/repositories/DocumentRepository';
import { webApiService } from '@/services/WebApiService';
import { syncService } from '@/services/SyncService';
import { attachmentService } from '@/services/AttachmentService';
import { useAuth } from '@/contexts/AuthContext';
import { Document, NonConformity, ActionStatus, CorrectiveAction, Asset, Client, Site } from '@/types';
import { Input } from '@/components/Input';
import { formatDateFR, formatDateTimeFR } from '@/lib/dateUtils';
import { Modal, TextInput } from 'react-native';

// Composant séparé pour le formulaire d'action - évite les re-renders du parent
interface ActionFormModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: { owner: string; ownerId: string; description: string; dueAt: string; partsRefs: string[]; photoIds: string[] }) => void;
  isLoading: boolean;
  responsibleUsers: Array<{ id: string; name: string; email: string; role: string }> | undefined;
  photos: Array<{ id: string; uri: string }>;
}

function ActionFormModal({ visible, onClose, onSubmit, isLoading, responsibleUsers, photos }: ActionFormModalProps) {
  const [owner, setOwner] = useState('');
  const [ownerId, setOwnerId] = useState('');
  const [description, setDescription] = useState('');
  const [dueAt, setDueAt] = useState('');
  const [showPicker, setShowPicker] = useState(false);
  const [partsRefs, setPartsRefs] = useState<string[]>([]);
  const [partInput, setPartInput] = useState('');
  const [selectedPhotoIds, setSelectedPhotoIds] = useState<string[]>([]);
  // Key to force re-render of TextInputs when modal opens
  const [formKey, setFormKey] = useState(0);

  // Reset form when modal becomes visible
  React.useEffect(() => {
    if (visible) {
      setOwner('');
      setOwnerId('');
      setDescription('');
      setDueAt('');
      setPartsRefs([]);
      setPartInput('');
      setSelectedPhotoIds([]);
      setFormKey(k => k + 1);
    }
  }, [visible]);

  const handleClose = () => {
    onClose();
  };

  const handleSubmit = () => {
    onSubmit({ owner, ownerId, description, dueAt, partsRefs, photoIds: selectedPhotoIds });
  };

  // Only render when visible to avoid focus issues
  if (!visible) return null;

  return (
    <>
      <Modal visible={visible} transparent animationType="slide">
        <View style={modalStyles.overlay}>
          <View style={modalStyles.container}>
            <Text style={modalStyles.title}>Nouvelle action corrective</Text>
            
            {/* Sélection du responsable */}
            <View style={modalStyles.field}>
              <Text style={modalStyles.label}>Responsable *</Text>
              <TouchableOpacity 
                style={modalStyles.selector}
                onPress={() => setShowPicker(true)}
              >
                <User size={18} color={owner ? colors.primary : colors.textMuted} />
                <Text style={[
                  modalStyles.selectorText,
                  !owner && modalStyles.selectorPlaceholder
                ]}>
                  {owner || 'Sélectionner un responsable'}
                </Text>
                <ArrowRight size={18} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            {/* Description */}
            <View style={modalStyles.field} key={`desc-${formKey}`}>
              <Text style={modalStyles.label}>Description</Text>
              <TextInput
                style={[modalStyles.input, modalStyles.inputMulti]}
                value={description}
                onChangeText={(text) => setDescription(text)}
                placeholder="Description de l'action à réaliser"
                placeholderTextColor={colors.textMuted}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>

            {/* Échéance */}
            <View style={modalStyles.field} key={`due-${formKey}`}>
              <Text style={modalStyles.label}>Échéance * (AAAA-MM-JJ)</Text>
              <TextInput
                style={modalStyles.input}
                value={dueAt}
                onChangeText={(text) => setDueAt(text)}
                placeholder="2026-02-15"
                placeholderTextColor={colors.textMuted}
              />
            </View>

            {/* Pièces détachées */}
            <View style={modalStyles.field}>
              <Text style={modalStyles.label}>Pièces détachées</Text>
              <View style={modalStyles.partRow}>
                <TextInput
                  style={[modalStyles.input, modalStyles.partInput]}
                  value={partInput}
                  onChangeText={setPartInput}
                  placeholder="Référence pièce"
                  placeholderTextColor={colors.textMuted}
                />
                <TouchableOpacity
                  style={modalStyles.partAddBtn}
                  onPress={() => {
                    const trimmed = partInput.trim();
                    if (!trimmed) return;
                    setPartsRefs((prev) => (prev.includes(trimmed) ? prev : [...prev, trimmed]));
                    setPartInput('');
                  }}
                >
                  <Text style={modalStyles.partAddText}>Ajouter</Text>
                </TouchableOpacity>
              </View>
              {partsRefs.length > 0 && (
                <View style={modalStyles.partList}>
                  {partsRefs.map((ref) => (
                    <View key={ref} style={modalStyles.partChip}>
                      <Text style={modalStyles.partChipText}>{ref}</Text>
                      <TouchableOpacity onPress={() => setPartsRefs((prev) => prev.filter((r) => r !== ref))}>
                        <X size={14} color={colors.textMuted} />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
            </View>

            {/* Photos NC liées */}
            <View style={modalStyles.field}>
              <Text style={modalStyles.label}>Photos de la NC</Text>
              {photos.length === 0 ? (
                <Text style={modalStyles.emptyText}>Aucune photo disponible</Text>
              ) : (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={modalStyles.photoRow}>
                  {photos.map((photo) => {
                    const selected = selectedPhotoIds.includes(photo.id);
                    return (
                      <TouchableOpacity
                        key={photo.id}
                        style={[modalStyles.photoThumb, selected && modalStyles.photoThumbSelected]}
                        onPress={() =>
                          setSelectedPhotoIds((prev) =>
                            prev.includes(photo.id)
                              ? prev.filter((id) => id !== photo.id)
                              : [...prev, photo.id]
                          )
                        }
                      >
                        <Image source={{ uri: photo.uri }} style={modalStyles.photoImage} contentFit="cover" />
                        {selected && (
                          <View style={modalStyles.photoCheck}>
                            <CheckCircle size={18} color={colors.success} />
                          </View>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              )}
            </View>

            <View style={modalStyles.buttons}>
              <Button
                title="Annuler"
                onPress={handleClose}
                variant="outline"
                style={{ flex: 1 }}
              />
              <Button
                title="Créer"
                onPress={handleSubmit}
                loading={isLoading}
                disabled={!owner || !dueAt}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* Picker pour sélectionner le responsable */}
      <Modal visible={showPicker} transparent animationType="fade">
        <View style={modalStyles.pickerOverlay}>
          <View style={modalStyles.pickerContainer}>
            <View style={modalStyles.pickerHeader}>
              <Text style={modalStyles.pickerTitle}>Sélectionner un responsable</Text>
              <TouchableOpacity onPress={() => setShowPicker(false)}>
                <X size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={modalStyles.pickerList}>
              {responsibleUsers?.map((u) => (
                <TouchableOpacity
                  key={u.id}
                  style={[
                    modalStyles.pickerOption,
                    owner === u.name && modalStyles.pickerOptionSelected,
                  ]}
                  onPress={() => {
                    setOwner(u.name);
                    setOwnerId(u.id);
                    setShowPicker(false);
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={[
                      modalStyles.pickerOptionName,
                      owner === u.name && modalStyles.pickerOptionNameSelected,
                    ]}>
                      {u.name}
                    </Text>
                    <Text style={modalStyles.pickerOptionEmail}>{u.email}</Text>
                  </View>
                  {owner === u.name && (
                    <CheckCircle size={22} color={colors.success} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}
const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  container: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    ...shadows.lg,
  },
  title: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.lg,
  },
  field: {
    marginBottom: spacing.md,
  },
  label: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  input: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    fontSize: 16,
    color: colors.text,
  },
  inputMulti: {
    minHeight: 80,
    textAlignVertical: 'top' as const,
  },
  partRow: {
    flexDirection: 'row' as const,
    gap: spacing.sm,
    alignItems: 'center' as const,
  },
  partInput: {
    flex: 1,
  },
  partAddBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: borderRadius.md,
  },
  partAddText: {
    color: colors.textInverse,
    fontSize: 13,
    fontWeight: '600' as const,
  },
  partList: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  partChip: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 6,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
  },
  partChipText: {
    fontSize: 12,
    color: colors.text,
  },
  photoRow: {
    gap: spacing.sm,
  },
  photoThumb: {
    width: 72,
    height: 72,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: colors.border,
  },
  photoThumbSelected: {
    borderColor: colors.success,
  },
  photoImage: {
    width: '100%',
    height: '100%',
  },
  photoCheck: {
    position: 'absolute',
    right: 4,
    top: 4,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.full,
    padding: 2,
  },
  emptyText: {
    fontSize: 12,
    color: colors.textMuted,
  },
  selector: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: colors.surfaceAlt,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm,
  },
  selectorText: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
  },
  selectorPlaceholder: {
    color: colors.textMuted,
  },
  buttons: {
    flexDirection: 'row' as const,
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  pickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    padding: spacing.lg,
  },
  pickerContainer: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    width: '100%',
    maxWidth: 400,
    maxHeight: '70%',
    ...shadows.md,
  },
  pickerHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  pickerTitle: {
    ...typography.h3,
    color: colors.text,
  },
  pickerList: {
    padding: spacing.sm,
  },
  pickerOption: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    padding: spacing.md,
    marginBottom: spacing.xs,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surfaceAlt,
  },
  pickerOptionSelected: {
    backgroundColor: colors.primaryLight,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  pickerOptionName: {
    fontSize: 16,
    fontWeight: '500' as const,
    color: colors.text,
  },
  pickerOptionNameSelected: {
    fontWeight: '700' as const,
    color: colors.primary,
  },
  pickerOptionEmail: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
});

export default function NCDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const queryClient = useQueryClient();
  const { user, canValidate, canEdit, isReadOnly, isAdmin } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [showActionModal, setShowActionModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isEditingAction, setIsEditingAction] = useState(false);
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    severity: 3 as 1 | 2 | 3,
    status: 'OUVERTE' as 'OUVERTE' | 'EN_COURS' | 'CLOTUREE',
  });
  const [editActionForm, setEditActionForm] = useState({
    owner: '',
    ownerId: '',
    description: '',
    dueAt: '',
  });
  const [showActionOwnerPicker, setShowActionOwnerPicker] = useState(false);

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

  // Fetch attachments from API (for photos uploaded via web)
  const { data: attachments } = useQuery({
    queryKey: ['nc-attachments', id],
    queryFn: async () => {
      if (!id) return [];
      return webApiService.getAttachments('NONCONFORMITY', id);
    },
    enabled: !!id,
  });

  // Fetch users who can be responsible for actions
  const { data: responsibleUsers } = useQuery({
    queryKey: ['responsible-users'],
    queryFn: async () => {
      const { getResponsibleUsers } = await import('@/app/api');
      const response = await getResponsibleUsers();
      return response.data as Array<{ id: string; name: string; email: string; role: string }>;
    },
  });

  const { data: assetDetails } = useQuery<Asset | null>({
    queryKey: ['asset', nc?.asset_id],
    queryFn: () => assetRepository.getByIdWithDetails(nc!.asset_id),
    enabled: !!nc?.asset_id,
  });

  const { data: sites } = useQuery<Site[]>({
    queryKey: ['sites-with-client'],
    queryFn: () => siteRepository.getAllWithClientName(),
  });

  const { data: clients } = useQuery<Client[]>({
    queryKey: ['clients'],
    queryFn: () => clientRepository.getAll(),
  });

  const siteForAsset = useMemo(() => {
    if (!assetDetails?.site_id) return undefined;
    return sites?.find((s) => s.id === assetDetails.site_id);
  }, [assetDetails?.site_id, sites]);

  const clientName = useMemo(() => {
    if (!siteForAsset) return undefined;
    return siteForAsset.client_name || clients?.find((c) => c.id === siteForAsset.client_id)?.name;
  }, [siteForAsset, clients]);

  // Initialize edit form when NC is loaded
  React.useEffect(() => {
    if (nc) {
      setEditForm({
        title: nc.title || '',
        description: nc.description || '',
        severity: nc.severity || 3,
        status: nc.status || 'OUVERTE',
      });
    }
  }, [nc]);

  // Mutation to update NC (admin only)
  const updateNCMutation = useMutation({
    mutationFn: async () => {
      if (!id) throw new Error('NC inconnue');
      if (!editForm.title.trim()) throw new Error('Le titre est requis');

      // Update via API
      if (Platform.OS === 'web') {
        await webApiService.updateNC(id, {
          title: editForm.title.trim(),
          description: editForm.description.trim(),
          severity: editForm.severity,
          status: editForm.status,
        });
      } else {
        // Update local database
        await ncRepository.update(id, {
          title: editForm.title.trim(),
          description: editForm.description.trim(),
          severity: editForm.severity,
          status: editForm.status,
        });
        // Sync to server
        await syncService.addToOutbox('UPDATE_NC', {
          id,
          title: editForm.title.trim(),
          description: editForm.description.trim(),
          severity: editForm.severity,
          status: editForm.status,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nc', id] });
      queryClient.invalidateQueries({ queryKey: ['nonconformities'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-kpis'] });
      setIsEditing(false);
      Alert.alert('Succès', 'Non-conformité mise à jour');
    },
    onError: (error) => {
      Alert.alert('Erreur', error instanceof Error ? error.message : 'Erreur lors de la mise à jour');
    },
  });

  const createActionMutation = useMutation({
    mutationFn: async (data: { owner: string; ownerId: string; description: string; dueAt: string; partsRefs: string[]; photoIds: string[] }) => {
      if (!id) throw new Error('NC inconnue');
      if (!data.owner || !data.dueAt) throw new Error('Responsable et échéance requis');

      const actionId = `action-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const now = new Date().toISOString();

      const newAction: CorrectiveAction = {
        id: actionId,
        nonconformity_id: id,
        owner: data.owner,
        description: data.description,
        due_at: data.dueAt,
        parts_refs: data.partsRefs,
        photo_ids: data.photoIds,
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

  // Mutation to edit corrective action details (owner, description, due_at)
  const editActionMutation = useMutation({
    mutationFn: async () => {
      if (!nc?.corrective_action) throw new Error('Pas d\'action corrective');
      if (!editActionForm.owner) throw new Error('Le responsable est requis');
      if (!editActionForm.dueAt) throw new Error('L\'échéance est requise');

      const updates: Partial<CorrectiveAction> = {
        owner: editActionForm.owner,
        description: editActionForm.description,
        due_at: editActionForm.dueAt,
      };

      if (Platform.OS === 'web') {
        await webApiService.updateAction(nc.corrective_action.id, updates);
      } else {
        await actionRepository.update(nc.corrective_action.id, updates);
        await syncService.addToOutbox('UPDATE_ACTION', {
          id: nc.corrective_action.id,
          ...updates,
          ncId: id,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nc', id] });
      queryClient.invalidateQueries({ queryKey: ['nonconformities'] });
      setIsEditingAction(false);
      Alert.alert('Succès', 'Action corrective mise à jour');
    },
    onError: (error) => {
      Alert.alert('Erreur', error instanceof Error ? error.message : 'Erreur lors de la mise à jour');
    },
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const formatDate = (date: string | null) => {
    return formatDateFR(date);
  };

  const action = nc?.corrective_action;

  // Combine local documents and API attachments for photos
  const photoDocs = useMemo(() => {
    const localPhotos = (documents ?? []).filter((d) => d.mime.startsWith('image/'));
    return localPhotos;
  }, [documents]);

  // API attachments (photos uploaded via web)
  const apiPhotos = useMemo(() => {
    if (!attachments) return [];
    return attachments.filter((a: any) => a.file_type === 'IMAGE');
  }, [attachments]);

  const resolveImageUri = useCallback(
    (doc: Document): string => {
      if (doc.server_url) {
        const base = process.env.EXPO_PUBLIC_API_BASE_URL || '';
        if (doc.server_url.startsWith('http')) return doc.server_url;
        if (base) return `${base}${doc.server_url}`;
      }
      return doc.local_uri;
    },
    []
  );
  const actionPhotoOptions = useMemo(() => {
    const options: Array<{ id: string; uri: string }> = [];
    for (const doc of photoDocs) {
      options.push({ id: `doc:${doc.id}`, uri: resolveImageUri(doc) });
    }
    for (const att of apiPhotos) {
      const uri = `https://api.in-spectra.com/uploads/${att.storage_key}`;
      options.push({ id: `att:${att.id}`, uri });
    }
    return options;
  }, [photoDocs, apiPhotos, resolveImageUri]);
  const canProgress = canEdit() && action;
  const canClose = canProgress && action?.status === 'EN_COURS';
  const canValidateAction = canValidate() && action?.status === 'CLOTUREE';

  const getNextActionButton = () => {
    if (!action) return null;
    
    switch (action.status) {
      case 'OUVERTE':
      case 'PLANIFIEE':
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

      // Use AttachmentService for web platform
      if (Platform.OS === 'web') {
        // Take photo or pick from gallery
        const photo = await attachmentService.takePhoto();
        if (!photo) {
          throw new Error('Capture annulée');
        }

        // Upload directly to API
        const today = new Date().toLocaleDateString('fr-FR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        });
        const result = await attachmentService.upload(
          photo.uri,
          `photo_${Date.now()}.jpg`,
          'image/jpeg',
          'NONCONFORMITY',
          id,
          'PHOTO',
          `Photo NC ${today}`,
          false
        );

        return { documentId: result.id };
      }

      // Native platform - use local storage
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (perm.status !== 'granted') {
        throw new Error('Permission caméra refusée');
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
      await queryClient.invalidateQueries({ queryKey: ['nc-attachments', id] });
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
          {/* Admin edit button */}
          {isAdmin() && !isEditing && (
            <TouchableOpacity 
              style={styles.editButton}
              onPress={() => setIsEditing(true)}
            >
              <Edit3 size={18} color={colors.primary} />
              <Text style={styles.editButtonText}>Modifier</Text>
            </TouchableOpacity>
          )}

          {isEditing ? (
            <>
              {/* Edit mode */}
              <View style={styles.editHeader}>
                <Text style={styles.editHeaderTitle}>Mode édition</Text>
                <View style={styles.editActions}>
                  <TouchableOpacity 
                    style={styles.cancelButton}
                    onPress={() => {
                      setIsEditing(false);
                      if (nc) {
                        setEditForm({
                          title: nc.title || '',
                          description: nc.description || '',
                          severity: nc.severity || 3,
                          status: nc.status || 'OUVERTE',
                        });
                      }
                    }}
                  >
                    <X size={18} color={colors.danger} />
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.saveButton}
                    onPress={() => updateNCMutation.mutate()}
                    disabled={updateNCMutation.isPending}
                  >
                    <Save size={18} color={colors.success} />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.contextInfo}>
                {(assetDetails?.code_interne || (nc as any).asset_code) && (
                  <Text style={styles.assetInfo}>
                    Équipement: {assetDetails?.code_interne || (nc as any).asset_code} - {assetDetails?.designation || (nc as any).asset_designation}
                  </Text>
                )}
                {siteForAsset?.name && (
                  <Text style={styles.assetInfo}>
                    Site: {siteForAsset.name}
                  </Text>
                )}
                {clientName && (
                  <Text style={styles.assetInfo}>
                    Client: {clientName}
                  </Text>
                )}
              </View>

              {/* Title input */}
              <View style={styles.editField}>
                <Text style={styles.editLabel}>Titre</Text>
                <TextInput
                  style={styles.editInput}
                  value={editForm.title}
                  onChangeText={(text) => setEditForm(prev => ({ ...prev, title: text }))}
                  placeholder="Titre de la NC"
                  placeholderTextColor={colors.textMuted}
                />
              </View>

              {/* Severity selector */}
              <View style={styles.editField}>
                <Text style={styles.editLabel}>Criticité</Text>
                <View style={styles.severitySelector}>
                  {([1, 2, 3] as const).map((level) => (
                    <TouchableOpacity
                      key={level}
                      style={[
                        styles.severityOption,
                        editForm.severity === level && styles.severityOptionSelected,
                        level === 1 && styles.severityHigh,
                        level === 2 && styles.severityMedium,
                        level === 3 && styles.severityLow,
                      ]}
                      onPress={() => setEditForm(prev => ({ ...prev, severity: level }))}
                    >
                      <Text style={[
                        styles.severityOptionText,
                        editForm.severity === level && styles.severityOptionTextSelected,
                      ]}>
                        {level === 1 ? 'Critique' : level === 2 ? 'Majeure' : 'Mineure'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Status selector */}
              <View style={styles.editField}>
                <Text style={styles.editLabel}>Statut</Text>
                <View style={styles.statusSelector}>
                  {(['OUVERTE', 'EN_COURS', 'CLOTUREE'] as const).map((status) => (
                    <TouchableOpacity
                      key={status}
                      style={[
                        styles.statusOption,
                        editForm.status === status && styles.statusOptionSelected,
                      ]}
                      onPress={() => setEditForm(prev => ({ ...prev, status }))}
                    >
                      <Text style={[
                        styles.statusOptionText,
                        editForm.status === status && styles.statusOptionTextSelected,
                      ]}>
                        {status === 'OUVERTE' ? 'Ouverte' : status === 'EN_COURS' ? 'En cours' : 'Clôturée'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Description input */}
              <View style={styles.editField}>
                <Text style={styles.editLabel}>Description</Text>
                <TextInput
                  style={[styles.editInput, styles.editTextarea]}
                  value={editForm.description}
                  onChangeText={(text) => setEditForm(prev => ({ ...prev, description: text }))}
                  placeholder="Description de la non-conformité"
                  placeholderTextColor={colors.textMuted}
                  multiline
                  numberOfLines={4}
                />
              </View>
            </>
          ) : (
            <>
              {/* Display mode */}
              <View style={styles.headerTop}>
                <AlertTriangle size={24} color={colors.danger} />
                <CriticalityBadge level={nc?.severity ?? 3} />
                <StatusBadge status={nc?.status ?? 'OUVERTE'} />
              </View>
              <Text style={styles.title}>{nc?.title ?? ''}</Text>
              {(assetDetails?.code_interne || (nc as any).asset_code) && (
                <Text style={styles.assetInfo}>
                  Équipement: {assetDetails?.code_interne || (nc as any).asset_code} - {assetDetails?.designation || (nc as any).asset_designation}
                </Text>
              )}
              {siteForAsset?.name && (
                <Text style={styles.assetInfo}>
                  Site: {siteForAsset.name}
                </Text>
              )}
              {clientName && (
                <Text style={styles.assetInfo}>
                  Client: {clientName}
                </Text>
              )}
              <Text style={styles.date}>Créée le {formatDate(nc?.created_at ?? null)}</Text>
            </>
          )}
        </View>

        <View style={styles.content}>
          {!isEditing && (
          <SectionCard title="Description">
            <Text style={styles.description}>
              {nc?.description || 'Aucune description'}
            </Text>
          </SectionCard>
          )}

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
            {photoDocs.length === 0 && apiPhotos.length === 0 ? (
              <View style={styles.photoEmpty}>
                <ImageIcon size={18} color={colors.textMuted} />
                <Text style={styles.photoEmptyText}>Aucune photo</Text>
                <Text style={styles.photoEmptyHint}>
                  Ajoutez une photo pour documenter la non-conformité.
                </Text>
              </View>
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.photoRow}>
                {/* Photos de l'API (attachments) */}
                {apiPhotos.map((att: any) => {
                  const uri = `https://api.in-spectra.com/uploads/${att.storage_key}`;
                  return (
                    <View key={att.id} style={styles.photoCard}>
                      <Image source={{ uri }} style={styles.photo} contentFit="cover" />
                      <View style={styles.photoMeta}>
                        <View style={styles.photoMetaLeft}>
                          <Text style={styles.photoMetaText} numberOfLines={1}>
                            Synchronisée
                          </Text>
                        </View>
                      </View>
                    </View>
                  );
                })}
                {/* Photos locales (documents) */}
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
            <SectionCard 
              title="Action corrective"
              action={
                action.status !== 'VALIDEE' && isAdmin() && !isEditingAction ? (
                  <TouchableOpacity
                    style={styles.actionEditBtn}
                    onPress={() => {
                      setEditActionForm({
                        owner: action.owner || '',
                        ownerId: '',
                        description: action.description || '',
                        dueAt: action.due_at ? action.due_at.substring(0, 10) : '',
                      });
                      setIsEditingAction(true);
                    }}
                  >
                    <Edit3 size={16} color={colors.primary} />
                    <Text style={styles.actionEditBtnText}>Modifier</Text>
                  </TouchableOpacity>
                ) : undefined
              }
            >
              {isEditingAction ? (
                /* === MODE ÉDITION ACTION === */
                <View>
                  <View style={styles.actionHeader}>
                    <StatusBadge status={action.status} />
                  </View>

                  {/* Responsable */}
                  <View style={styles.editField}>
                    <Text style={styles.editLabel}>Responsable *</Text>
                    <TouchableOpacity
                      style={modalStyles.selector}
                      onPress={() => setShowActionOwnerPicker(true)}
                    >
                      <User size={18} color={editActionForm.owner ? colors.primary : colors.textMuted} />
                      <Text style={[
                        modalStyles.selectorText,
                        !editActionForm.owner && modalStyles.selectorPlaceholder
                      ]}>
                        {editActionForm.owner || 'Sélectionner un responsable'}
                      </Text>
                      <ArrowRight size={18} color={colors.textMuted} />
                    </TouchableOpacity>
                  </View>

                  {/* Description */}
                  <View style={styles.editField}>
                    <Text style={styles.editLabel}>Description</Text>
                    <TextInput
                      style={[styles.editInput, styles.editTextarea]}
                      value={editActionForm.description}
                      onChangeText={(text) => setEditActionForm(prev => ({ ...prev, description: text }))}
                      placeholder="Description de l'action à réaliser"
                      placeholderTextColor={colors.textMuted}
                      multiline
                      numberOfLines={3}
                    />
                  </View>

                  {/* Échéance */}
                  <View style={styles.editField}>
                    <Text style={styles.editLabel}>Échéance * (AAAA-MM-JJ)</Text>
                    <TextInput
                      style={styles.editInput}
                      value={editActionForm.dueAt}
                      onChangeText={(text) => setEditActionForm(prev => ({ ...prev, dueAt: text }))}
                      placeholder="2026-03-15"
                      placeholderTextColor={colors.textMuted}
                    />
                  </View>

                  {/* Boutons sauvegarder / annuler */}
                  <View style={styles.editActionButtons}>
                    <Button
                      title="Annuler"
                      onPress={() => setIsEditingAction(false)}
                      variant="outline"
                      style={{ flex: 1 }}
                    />
                    <Button
                      title="Enregistrer"
                      onPress={() => editActionMutation.mutate()}
                      loading={editActionMutation.isPending}
                      disabled={!editActionForm.owner || !editActionForm.dueAt}
                      style={{ flex: 1 }}
                    />
                  </View>
                </View>
              ) : (
                /* === MODE LECTURE ACTION === */
                <View>
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
                </View>
              )}
            </SectionCard>
          )}

          {/* Modal picker pour responsable d'action (mode édition) */}
          <Modal visible={showActionOwnerPicker} transparent animationType="fade">
            <View style={modalStyles.pickerOverlay}>
              <View style={modalStyles.pickerContainer}>
                <View style={modalStyles.pickerHeader}>
                  <Text style={modalStyles.pickerTitle}>Sélectionner un responsable</Text>
                  <TouchableOpacity onPress={() => setShowActionOwnerPicker(false)}>
                    <X size={24} color={colors.text} />
                  </TouchableOpacity>
                </View>
                <ScrollView style={modalStyles.pickerList}>
                  {responsibleUsers?.map((u) => (
                    <TouchableOpacity
                      key={u.id}
                      style={[
                        modalStyles.pickerOption,
                        editActionForm.owner === u.name && modalStyles.pickerOptionSelected,
                      ]}
                      onPress={() => {
                        setEditActionForm(prev => ({ ...prev, owner: u.name, ownerId: u.id }));
                        setShowActionOwnerPicker(false);
                      }}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={[
                          modalStyles.pickerOptionName,
                          editActionForm.owner === u.name && modalStyles.pickerOptionNameSelected,
                        ]}>
                          {u.name}
                        </Text>
                        <Text style={modalStyles.pickerOptionEmail}>{u.email}</Text>
                      </View>
                      {editActionForm.owner === u.name && (
                        <CheckCircle size={22} color={colors.success} />
                      )}
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>
          </Modal>

          {!action && isAdmin() && (
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

          {/* Modal de création d'action corrective - composant séparé pour éviter les re-renders */}
          <ActionFormModal
            visible={showActionModal}
            onClose={() => setShowActionModal(false)}
            onSubmit={(data) => createActionMutation.mutate(data)}
            isLoading={createActionMutation.isPending}
            responsibleUsers={responsibleUsers}
            photos={actionPhotoOptions}
          />
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
  contextInfo: {
    marginBottom: spacing.md,
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
  actionEditBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  actionEditBtnText: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: '600',
  },
  editActionButtons: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.lg,
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
  // Edit mode styles
  editButton: {
    position: 'absolute' as const,
    top: spacing.md,
    right: spacing.md,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: spacing.xs,
    backgroundColor: colors.surfaceAlt,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.full,
    zIndex: 10,
  },
  editButtonText: {
    fontSize: typography.bodySmall.fontSize,
    fontWeight: '600' as const,
    color: colors.primary,
  },
  editHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: spacing.lg,
  },
  editHeaderTitle: {
    ...typography.h3,
    color: colors.primary,
  },
  editActions: {
    flexDirection: 'row' as const,
    gap: spacing.md,
  },
  cancelButton: {
    padding: spacing.sm,
    backgroundColor: colors.dangerLight,
    borderRadius: borderRadius.full,
  },
  saveButton: {
    padding: spacing.sm,
    backgroundColor: colors.successLight,
    borderRadius: borderRadius.full,
  },
  editField: {
    marginBottom: spacing.md,
  },
  editLabel: {
    fontSize: typography.bodySmall.fontSize,
    fontWeight: '600' as const,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  editInput: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    fontSize: typography.body.fontSize,
    color: colors.text,
  },
  editTextarea: {
    minHeight: 100,
    textAlignVertical: 'top' as const,
  },
  severitySelector: {
    flexDirection: 'row' as const,
    gap: spacing.sm,
  },
  severityOption: {
    flex: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center' as const,
  },
  severityOptionSelected: {
    borderWidth: 2,
  },
  severityHigh: {
    borderColor: colors.danger,
  },
  severityMedium: {
    borderColor: colors.warning,
  },
  severityLow: {
    borderColor: colors.success,
  },
  severityOptionText: {
    fontSize: typography.bodySmall.fontSize,
    fontWeight: '500' as const,
    color: colors.textSecondary,
  },
  severityOptionTextSelected: {
    fontWeight: '700' as const,
    color: colors.text,
  },
  statusSelector: {
    flexDirection: 'row' as const,
    gap: spacing.sm,
  },
  statusOption: {
    flex: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center' as const,
    backgroundColor: colors.surfaceAlt,
  },
  statusOptionSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  statusOptionText: {
    fontSize: typography.bodySmall.fontSize,
    fontWeight: '500' as const,
    color: colors.textSecondary,
  },
  statusOptionTextSelected: {
    color: colors.textInverse,
    fontWeight: '700' as const,
  },
  // Responsible selector button style
  responsibleSelector: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: colors.surfaceAlt,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm,
  },
  responsibleSelectorText: {
    flex: 1,
    fontSize: typography.body.fontSize,
    color: colors.text,
  },
  responsibleSelectorPlaceholder: {
    color: colors.textMuted,
  },
  // Picker modal styles
  pickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    padding: spacing.lg,
  },
  pickerContainer: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    width: '100%',
    maxWidth: 400,
    maxHeight: '70%',
    ...shadows.md,
  },
  pickerHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  pickerTitle: {
    ...typography.h3,
    color: colors.text,
  },
  pickerCloseBtn: {
    padding: spacing.xs,
  },
  pickerList: {
    padding: spacing.sm,
  },
  pickerOption: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    padding: spacing.md,
    marginBottom: spacing.xs,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surfaceAlt,
  },
  pickerOptionSelected: {
    backgroundColor: colors.primaryLight,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  pickerOptionContent: {
    flex: 1,
  },
  pickerOptionName: {
    fontSize: typography.body.fontSize,
    fontWeight: '500' as const,
    color: colors.text,
  },
  pickerOptionNameSelected: {
    fontWeight: '700' as const,
    color: colors.primary,
  },
  pickerOptionEmail: {
    fontSize: typography.caption.fontSize,
    color: colors.textMuted,
    marginTop: 2,
  },
  noUsersText: {
    padding: spacing.lg,
    textAlign: 'center' as const,
    color: colors.textMuted,
    fontStyle: 'italic' as const,
  },
});
