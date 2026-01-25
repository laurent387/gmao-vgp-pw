import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, Modal, RefreshControl } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Users, MapPin, Layers, ClipboardList, Plus, Pencil, Trash2, X, Check, ChevronDown, ChevronUp } from 'lucide-react-native';
import { colors, spacing, borderRadius, typography, shadows } from '@/constants/theme';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { SectionCard } from '@/components/Card';
import { LoadingState } from '@/components/EmptyState';
import { useAuth } from '@/contexts/AuthContext';
import { trpc } from '@/lib/trpc';

type AdminTab = 'users' | 'sites' | 'zones' | 'controls';
type UserRole = 'ADMIN' | 'HSE_MANAGER' | 'TECHNICIAN' | 'AUDITOR';

interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  created_at: string;
}

interface Site {
  id: string;
  name: string;
  address: string | null;
  client_id: string;
  created_at: string;
}

interface Zone {
  id: string;
  site_id: string;
  name: string;
  site_name?: string;
}

interface ControlType {
  id: string;
  code: string;
  label: string;
  description: string | null;
  periodicity_days: number;
  active: boolean;
}

const ROLE_LABELS: Record<UserRole, string> = {
  ADMIN: 'Administrateur',
  HSE_MANAGER: 'Responsable HSE',
  TECHNICIAN: 'Technicien',
  AUDITOR: 'Auditeur',
};

export default function AdminScreen() {
  const { user, hasPermission } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<AdminTab>('users');
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

  const isAdmin = hasPermission(['ADMIN', 'HSE_MANAGER']);

  const { data: users, isLoading: loadingUsers, refetch: refetchUsers } = trpc.admin.listUsers.useQuery(undefined, { enabled: isAdmin && activeTab === 'users' });
  const { data: sites, isLoading: loadingSites, refetch: refetchSites } = trpc.admin.listSites.useQuery(undefined, { enabled: isAdmin && activeTab === 'sites' });
  const { data: zones, isLoading: loadingZones, refetch: refetchZones } = trpc.admin.listZones.useQuery(undefined, { enabled: isAdmin && activeTab === 'zones' });
  const { data: controlTypes, isLoading: loadingControls, refetch: refetchControls } = trpc.admin.listControlTypes.useQuery(undefined, { enabled: isAdmin && activeTab === 'controls' });

  const createUserMutation = trpc.admin.createUser.useMutation({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [['admin', 'listUsers']] });
      setModalVisible(false);
      Alert.alert('Succès', 'Utilisateur créé');
    },
    onError: (e) => Alert.alert('Erreur', e.message),
  });

  const updateUserMutation = trpc.admin.updateUser.useMutation({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [['admin', 'listUsers']] });
      setModalVisible(false);
      Alert.alert('Succès', 'Utilisateur modifié');
    },
    onError: (e) => Alert.alert('Erreur', e.message),
  });

  const deleteUserMutation = trpc.admin.deleteUser.useMutation({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [['admin', 'listUsers']] });
      Alert.alert('Succès', 'Utilisateur supprimé');
    },
    onError: (e) => Alert.alert('Erreur', e.message),
  });

  const createSiteMutation = trpc.admin.createSite.useMutation({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [['admin', 'listSites']] });
      setModalVisible(false);
      Alert.alert('Succès', 'Site créé');
    },
    onError: (e) => Alert.alert('Erreur', e.message),
  });

  const updateSiteMutation = trpc.admin.updateSite.useMutation({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [['admin', 'listSites']] });
      setModalVisible(false);
      Alert.alert('Succès', 'Site modifié');
    },
    onError: (e) => Alert.alert('Erreur', e.message),
  });

  const deleteSiteMutation = trpc.admin.deleteSite.useMutation({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [['admin', 'listSites']] });
      Alert.alert('Succès', 'Site supprimé');
    },
    onError: (e) => Alert.alert('Erreur', e.message),
  });

  const createZoneMutation = trpc.admin.createZone.useMutation({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [['admin', 'listZones']] });
      setModalVisible(false);
      Alert.alert('Succès', 'Zone créée');
    },
    onError: (e) => Alert.alert('Erreur', e.message),
  });

  const deleteZoneMutation = trpc.admin.deleteZone.useMutation({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [['admin', 'listZones']] });
      Alert.alert('Succès', 'Zone supprimée');
    },
    onError: (e) => Alert.alert('Erreur', e.message),
  });

  const createControlTypeMutation = trpc.admin.createControlType.useMutation({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [['admin', 'listControlTypes']] });
      setModalVisible(false);
      Alert.alert('Succès', 'Type de contrôle créé');
    },
    onError: (e) => Alert.alert('Erreur', e.message),
  });

  const updateControlTypeMutation = trpc.admin.updateControlType.useMutation({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [['admin', 'listControlTypes']] });
      setModalVisible(false);
      Alert.alert('Succès', 'Type de contrôle modifié');
    },
    onError: (e) => Alert.alert('Erreur', e.message),
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    if (activeTab === 'users') await refetchUsers();
    if (activeTab === 'sites') await refetchSites();
    if (activeTab === 'zones') await refetchZones();
    if (activeTab === 'controls') await refetchControls();
    setRefreshing(false);
  }, [activeTab, refetchUsers, refetchSites, refetchZones, refetchControls]);

  const openCreateModal = () => {
    setEditingItem(null);
    setModalVisible(true);
  };

  const openEditModal = (item: any) => {
    setEditingItem(item);
    setModalVisible(true);
  };

  const confirmDelete = (type: string, id: string, name: string) => {
    Alert.alert(
      'Confirmer la suppression',
      `Voulez-vous vraiment supprimer "${name}" ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: () => {
            if (type === 'user') deleteUserMutation.mutate({ id });
            if (type === 'site') deleteSiteMutation.mutate({ id });
            if (type === 'zone') deleteZoneMutation.mutate({ id });
          },
        },
      ]
    );
  };

  if (!isAdmin) {
    return (
      <View style={styles.container}>
        <View style={styles.accessDenied}>
          <Text style={styles.accessDeniedText}>Accès réservé aux administrateurs</Text>
        </View>
      </View>
    );
  }

  const tabs: { key: AdminTab; label: string; icon: React.ReactNode }[] = [
    { key: 'users', label: 'Utilisateurs', icon: <Users size={18} color={activeTab === 'users' ? colors.primary : colors.textMuted} /> },
    { key: 'sites', label: 'Sites', icon: <MapPin size={18} color={activeTab === 'sites' ? colors.primary : colors.textMuted} /> },
    { key: 'zones', label: 'Zones', icon: <Layers size={18} color={activeTab === 'zones' ? colors.primary : colors.textMuted} /> },
    { key: 'controls', label: 'Contrôles', icon: <ClipboardList size={18} color={activeTab === 'controls' ? colors.primary : colors.textMuted} /> },
  ];

  const isLoading = (activeTab === 'users' && loadingUsers) || (activeTab === 'sites' && loadingSites) || (activeTab === 'zones' && loadingZones) || (activeTab === 'controls' && loadingControls);

  return (
    <View style={styles.container}>
      <View style={styles.tabs}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
            onPress={() => setActiveTab(tab.key)}
          >
            {tab.icon}
            <Text style={[styles.tabLabel, activeTab === tab.key && styles.tabLabelActive]}>{tab.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        <View style={styles.header}>
          <Text style={styles.title}>
            {activeTab === 'users' && 'Gestion des utilisateurs'}
            {activeTab === 'sites' && 'Gestion des sites'}
            {activeTab === 'zones' && 'Gestion des zones'}
            {activeTab === 'controls' && 'Types de contrôles'}
          </Text>
          <Button title="Ajouter" onPress={openCreateModal} size="sm" icon={<Plus size={16} color={colors.textInverse} />} />
        </View>

        {isLoading ? (
          <LoadingState message="Chargement..." />
        ) : (
          <View style={styles.list}>
            {activeTab === 'users' && users?.map((u: User) => (
              <View key={u.id} style={styles.listItem}>
                <View style={styles.listItemContent}>
                  <Text style={styles.listItemTitle}>{u.name}</Text>
                  <Text style={styles.listItemSubtitle}>{u.email}</Text>
                  <View style={[styles.roleBadge, { backgroundColor: getRoleColor(u.role) + '20' }]}>
                    <Text style={[styles.roleBadgeText, { color: getRoleColor(u.role) }]}>{ROLE_LABELS[u.role]}</Text>
                  </View>
                </View>
                <View style={styles.listItemActions}>
                  <TouchableOpacity style={styles.actionBtn} onPress={() => openEditModal(u)}>
                    <Pencil size={16} color={colors.primary} />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.actionBtn} onPress={() => confirmDelete('user', u.id, u.name)}>
                    <Trash2 size={16} color={colors.danger} />
                  </TouchableOpacity>
                </View>
              </View>
            ))}

            {activeTab === 'sites' && sites?.map((s: Site) => (
              <View key={s.id} style={styles.listItem}>
                <View style={styles.listItemContent}>
                  <Text style={styles.listItemTitle}>{s.name}</Text>
                  {s.address && <Text style={styles.listItemSubtitle}>{s.address}</Text>}
                </View>
                <View style={styles.listItemActions}>
                  <TouchableOpacity style={styles.actionBtn} onPress={() => openEditModal(s)}>
                    <Pencil size={16} color={colors.primary} />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.actionBtn} onPress={() => confirmDelete('site', s.id, s.name)}>
                    <Trash2 size={16} color={colors.danger} />
                  </TouchableOpacity>
                </View>
              </View>
            ))}

            {activeTab === 'zones' && zones?.map((z: Zone) => (
              <View key={z.id} style={styles.listItem}>
                <View style={styles.listItemContent}>
                  <Text style={styles.listItemTitle}>{z.name}</Text>
                  <Text style={styles.listItemSubtitle}>{z.site_name || 'Site inconnu'}</Text>
                </View>
                <View style={styles.listItemActions}>
                  <TouchableOpacity style={styles.actionBtn} onPress={() => confirmDelete('zone', z.id, z.name)}>
                    <Trash2 size={16} color={colors.danger} />
                  </TouchableOpacity>
                </View>
              </View>
            ))}

            {activeTab === 'controls' && controlTypes?.map((ct: ControlType) => (
              <View key={ct.id} style={[styles.listItem, !ct.active && styles.listItemInactive]}>
                <View style={styles.listItemContent}>
                  <Text style={styles.listItemTitle}>{ct.label}</Text>
                  <Text style={styles.listItemSubtitle}>Code: {ct.code} • Périodicité: {ct.periodicity_days} jours</Text>
                  {ct.description && <Text style={styles.listItemDesc}>{ct.description}</Text>}
                </View>
                <View style={styles.listItemActions}>
                  <TouchableOpacity style={styles.actionBtn} onPress={() => openEditModal(ct)}>
                    <Pencil size={16} color={colors.primary} />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      <AdminModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        type={activeTab}
        editingItem={editingItem}
        sites={sites || []}
        onSaveUser={(data) => editingItem ? updateUserMutation.mutate({ id: editingItem.id, ...data }) : createUserMutation.mutate(data as any)}
        onSaveSite={(data) => editingItem ? updateSiteMutation.mutate({ id: editingItem.id, ...data }) : createSiteMutation.mutate(data as any)}
        onSaveZone={(data) => createZoneMutation.mutate(data as any)}
        onSaveControlType={(data) => editingItem ? updateControlTypeMutation.mutate({ id: editingItem.id, ...data }) : createControlTypeMutation.mutate(data as any)}
        isSaving={createUserMutation.isPending || updateUserMutation.isPending || createSiteMutation.isPending || updateSiteMutation.isPending || createZoneMutation.isPending || createControlTypeMutation.isPending || updateControlTypeMutation.isPending}
      />
    </View>
  );
}

function getRoleColor(role: UserRole): string {
  switch (role) {
    case 'ADMIN': return colors.danger;
    case 'HSE_MANAGER': return colors.primary;
    case 'TECHNICIAN': return colors.success;
    case 'AUDITOR': return colors.warning;
    default: return colors.textMuted;
  }
}

interface AdminModalProps {
  visible: boolean;
  onClose: () => void;
  type: AdminTab;
  editingItem: any;
  sites: Site[];
  onSaveUser: (data: any) => void;
  onSaveSite: (data: any) => void;
  onSaveZone: (data: any) => void;
  onSaveControlType: (data: any) => void;
  isSaving: boolean;
}

function AdminModal({ visible, onClose, type, editingItem, sites, onSaveUser, onSaveSite, onSaveZone, onSaveControlType, isSaving }: AdminModalProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('TECHNICIAN');
  const [address, setAddress] = useState('');
  const [siteId, setSiteId] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [periodicityDays, setPeriodicityDays] = useState('365');
  const [showRolePicker, setShowRolePicker] = useState(false);
  const [showSitePicker, setShowSitePicker] = useState(false);

  React.useEffect(() => {
    if (visible) {
      if (editingItem) {
        setName(editingItem.name || editingItem.label || '');
        setEmail(editingItem.email || '');
        setRole(editingItem.role || 'TECHNICIAN');
        setAddress(editingItem.address || '');
        setSiteId(editingItem.site_id || '');
        setCode(editingItem.code || '');
        setDescription(editingItem.description || '');
        setPeriodicityDays(String(editingItem.periodicity_days || 365));
      } else {
        setName('');
        setEmail('');
        setRole('TECHNICIAN');
        setAddress('');
        setSiteId(sites[0]?.id || '');
        setCode('');
        setDescription('');
        setPeriodicityDays('365');
      }
    }
  }, [visible, editingItem, sites]);

  const handleSave = () => {
    if (type === 'users') {
      if (!name || !email) {
        Alert.alert('Erreur', 'Nom et email requis');
        return;
      }
      onSaveUser({ name, email, role });
    } else if (type === 'sites') {
      if (!name) {
        Alert.alert('Erreur', 'Nom requis');
        return;
      }
      onSaveSite({ name, address: address || undefined });
    } else if (type === 'zones') {
      if (!name || !siteId) {
        Alert.alert('Erreur', 'Nom et site requis');
        return;
      }
      onSaveZone({ name, site_id: siteId });
    } else if (type === 'controls') {
      if (!name || !code) {
        Alert.alert('Erreur', 'Label et code requis');
        return;
      }
      onSaveControlType({
        label: name,
        code,
        description: description || undefined,
        periodicity_days: parseInt(periodicityDays, 10) || 365,
      });
    }
  };

  const getTitle = () => {
    const action = editingItem ? 'Modifier' : 'Créer';
    switch (type) {
      case 'users': return `${action} un utilisateur`;
      case 'sites': return `${action} un site`;
      case 'zones': return `${action} une zone`;
      case 'controls': return `${action} un type de contrôle`;
      default: return action;
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={modalStyles.overlay}>
        <View style={modalStyles.container}>
          <View style={modalStyles.header}>
            <Text style={modalStyles.title}>{getTitle()}</Text>
            <TouchableOpacity onPress={onClose}>
              <X size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={modalStyles.content}>
            {type === 'users' && (
              <>
                <Input label="Nom" value={name} onChangeText={setName} placeholder="Nom complet" />
                <Input label="Email" value={email} onChangeText={setEmail} placeholder="email@example.com" keyboardType="email-address" autoCapitalize="none" />
                <View style={modalStyles.field}>
                  <Text style={modalStyles.label}>Rôle</Text>
                  <TouchableOpacity style={modalStyles.picker} onPress={() => setShowRolePicker(!showRolePicker)}>
                    <Text style={modalStyles.pickerText}>{ROLE_LABELS[role]}</Text>
                    {showRolePicker ? <ChevronUp size={20} color={colors.textMuted} /> : <ChevronDown size={20} color={colors.textMuted} />}
                  </TouchableOpacity>
                  {showRolePicker && (
                    <View style={modalStyles.pickerOptions}>
                      {(Object.keys(ROLE_LABELS) as UserRole[]).map((r) => (
                        <TouchableOpacity key={r} style={modalStyles.pickerOption} onPress={() => { setRole(r); setShowRolePicker(false); }}>
                          <Text style={[modalStyles.pickerOptionText, role === r && modalStyles.pickerOptionSelected]}>{ROLE_LABELS[r]}</Text>
                          {role === r && <Check size={16} color={colors.primary} />}
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>
              </>
            )}

            {type === 'sites' && (
              <>
                <Input label="Nom" value={name} onChangeText={setName} placeholder="Nom du site" />
                <Input label="Adresse" value={address} onChangeText={setAddress} placeholder="Adresse (optionnel)" multiline />
              </>
            )}

            {type === 'zones' && (
              <>
                <View style={modalStyles.field}>
                  <Text style={modalStyles.label}>Site</Text>
                  <TouchableOpacity style={modalStyles.picker} onPress={() => setShowSitePicker(!showSitePicker)}>
                    <Text style={modalStyles.pickerText}>{sites.find(s => s.id === siteId)?.name || 'Sélectionner un site'}</Text>
                    {showSitePicker ? <ChevronUp size={20} color={colors.textMuted} /> : <ChevronDown size={20} color={colors.textMuted} />}
                  </TouchableOpacity>
                  {showSitePicker && (
                    <View style={modalStyles.pickerOptions}>
                      {sites.map((s) => (
                        <TouchableOpacity key={s.id} style={modalStyles.pickerOption} onPress={() => { setSiteId(s.id); setShowSitePicker(false); }}>
                          <Text style={[modalStyles.pickerOptionText, siteId === s.id && modalStyles.pickerOptionSelected]}>{s.name}</Text>
                          {siteId === s.id && <Check size={16} color={colors.primary} />}
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>
                <Input label="Nom de la zone" value={name} onChangeText={setName} placeholder="Nom de la zone" />
              </>
            )}

            {type === 'controls' && (
              <>
                <Input label="Label" value={name} onChangeText={setName} placeholder="VGP Périodique" />
                <Input label="Code" value={code} onChangeText={setCode} placeholder="VGP_PERIODIQUE" autoCapitalize="characters" />
                <Input label="Description" value={description} onChangeText={setDescription} placeholder="Description (optionnel)" multiline />
                <Input label="Périodicité (jours)" value={periodicityDays} onChangeText={setPeriodicityDays} placeholder="365" keyboardType="numeric" />
              </>
            )}
          </ScrollView>

          <View style={modalStyles.footer}>
            <Button title="Annuler" onPress={onClose} variant="outline" style={{ flex: 1 }} />
            <Button title="Enregistrer" onPress={handleSave} loading={isSaving} style={{ flex: 1 }} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.md,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: colors.primary,
  },
  tabLabel: {
    fontSize: typography.caption.fontSize,
    fontWeight: '500' as const,
    color: colors.textMuted,
  },
  tabLabelActive: {
    color: colors.primary,
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
  },
  title: {
    ...typography.h3,
    color: colors.text,
  },
  list: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    gap: spacing.sm,
  },
  listItem: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    ...shadows.sm,
  },
  listItemInactive: {
    opacity: 0.6,
  },
  listItemContent: {
    flex: 1,
    gap: spacing.xs,
  },
  listItemTitle: {
    fontSize: typography.body.fontSize,
    fontWeight: '600' as const,
    color: colors.text,
  },
  listItemSubtitle: {
    fontSize: typography.bodySmall.fontSize,
    color: colors.textSecondary,
  },
  listItemDesc: {
    fontSize: typography.caption.fontSize,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  listItemActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  actionBtn: {
    padding: spacing.sm,
  },
  roleBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
    marginTop: spacing.xs,
  },
  roleBadgeText: {
    fontSize: typography.caption.fontSize,
    fontWeight: '500' as const,
  },
  accessDenied: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  accessDeniedText: {
    ...typography.body,
    color: colors.textMuted,
  },
});

const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    ...typography.h3,
    color: colors.text,
  },
  content: {
    padding: spacing.lg,
  },
  footer: {
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  field: {
    marginBottom: spacing.md,
  },
  label: {
    fontSize: typography.bodySmall.fontSize,
    fontWeight: '500' as const,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  picker: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.surfaceAlt,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pickerText: {
    fontSize: typography.body.fontSize,
    color: colors.text,
  },
  pickerOptions: {
    marginTop: spacing.sm,
    backgroundColor: colors.surfaceAlt,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  pickerOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  pickerOptionText: {
    fontSize: typography.body.fontSize,
    color: colors.text,
  },
  pickerOptionSelected: {
    color: colors.primary,
    fontWeight: '600' as const,
  },
});
