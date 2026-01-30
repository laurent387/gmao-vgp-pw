import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, Modal, RefreshControl } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { Users, MapPin, Plus, Pencil, Trash2, X, Check, ChevronDown, ChevronUp, Building2, Wrench, Eye, KeyRound } from 'lucide-react-native';
import { colors, spacing, borderRadius, typography, shadows } from '@/constants/theme';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { SectionCard } from '@/components/Card';
import { LoadingState } from '@/components/EmptyState';
import { ClientSheet } from '@/components/ClientSheet';
import { useAuth } from '@/contexts/AuthContext';
import { trpc } from '@/lib/trpc';
import { Client as ClientType } from '@/types';

type AdminTab = 'users' | 'clients' | 'sites' | 'assets';
type UserRole = 'ADMIN' | 'HSE_MANAGER' | 'TECHNICIAN' | 'AUDITOR';

interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  created_at: string;
}

interface Client {
  id: string;
  name: string;
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

interface Asset {
  id: string;
  code_interne: string;
  designation: string;
  categorie: string;
  marque: string;
  modele: string;
  numero_serie: string;
  annee: number;
  vgp_enabled?: boolean;
  vgp_validity_months?: number | null;
  statut: string;
  criticite: number;
  site_id: string;
  zone_id: string;
  site_name?: string;
  zone_name?: string;
}

function normalizeList<T>(value: any): T[] {
  if (Array.isArray(value)) return value as T[];
  if (value && Array.isArray((value as any).json)) return (value as any).json as T[];
  return [];
}

const ROLE_LABELS: Record<UserRole, string> = {
  ADMIN: 'Administrateur',
  HSE_MANAGER: 'Responsable HSE',
  TECHNICIAN: 'Technicien',
  AUDITOR: 'Auditeur',
};

export default function AdminScreen() {
  const router = useRouter();
  const { user, hasPermission } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<AdminTab>('users');
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

  const isAdmin = hasPermission(['ADMIN', 'HSE_MANAGER']);
  const userRole = user?.role || 'TECHNICIAN';

  const { data: users, isLoading: loadingUsers, refetch: refetchUsers } = trpc.admin.listUsers.useQuery(undefined, { enabled: isAdmin && activeTab === 'users' });
  const { data: clients, isLoading: loadingClients, refetch: refetchClients } = trpc.admin.listClients.useQuery(undefined, { enabled: isAdmin && (activeTab === 'clients' || activeTab === 'sites') });
  const { data: sites, isLoading: loadingSites, refetch: refetchSites } = trpc.admin.listSites.useQuery(undefined, { enabled: isAdmin && (activeTab === 'sites' || activeTab === 'assets') });
  const { data: zones, isLoading: loadingZones, refetch: refetchZones } = trpc.admin.listZones.useQuery(undefined, { enabled: isAdmin && activeTab === 'assets' });
  const { data: assets, isLoading: loadingAssets, refetch: refetchAssets } = trpc.assets.list.useQuery(undefined, { enabled: isAdmin && activeTab === 'assets' });

  const usersList = React.useMemo(() => normalizeList<User>(users), [users]);
  const clientsList = React.useMemo(() => normalizeList<Client>(clients), [clients]);
  const sitesList = React.useMemo(() => normalizeList<Site>(sites), [sites]);
  const zonesList = React.useMemo(() => normalizeList<Zone>(zones), [zones]);
  const assetsList = React.useMemo(() => normalizeList<Asset>(assets), [assets]);

  const createUserMutation = trpc.admin.createUser.useMutation({
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: [['admin', 'listUsers']] });
      setModalVisible(false);
      const emailSent = (result as any)?.json?.emailSent ?? (result as any)?.emailSent;
      Alert.alert(
        'Succès',
        emailSent === false
          ? 'Utilisateur créé, mais l’email n’a pas pu être envoyé.'
          : 'Utilisateur créé. Le mot de passe temporaire a été envoyé par email.'
      );
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

  const sendPasswordResetMutation = trpc.admin.sendPasswordResetToUser.useMutation({
    onSuccess: () => {
      Alert.alert('Succès', 'Un lien de réinitialisation a été envoyé par email');
    },
    onError: (e) => Alert.alert('Erreur', e.message),
  });

  const createClientMutation = trpc.admin.createClient.useMutation({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [['admin', 'listClients']] });
      setModalVisible(false);
      Alert.alert('Succès', 'Client créé');
    },
    onError: (e) => Alert.alert('Erreur', e.message),
  });

  const updateClientMutation = trpc.admin.updateClient.useMutation({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [['admin', 'listClients']] });
      setModalVisible(false);
      Alert.alert('Succès', 'Client modifié');
    },
    onError: (e) => Alert.alert('Erreur', e.message),
  });

  const deleteClientMutation = trpc.admin.deleteClient.useMutation({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [['admin', 'listClients']] });
      Alert.alert('Succès', 'Client supprimé');
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

  const createAssetMutation = trpc.assets.create.useMutation({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [['assets', 'list']] });
      setModalVisible(false);
      Alert.alert('Succès', 'Équipement créé');
    },
    onError: (e) => Alert.alert('Erreur', e.message),
  });

  const updateAssetMutation = trpc.assets.update.useMutation({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [['assets', 'list']] });
      setModalVisible(false);
      Alert.alert('Succès', 'Équipement modifié');
    },
    onError: (e) => Alert.alert('Erreur', e.message),
  });

  const deleteAssetMutation = trpc.assets.delete.useMutation({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [['assets', 'list']] });
      Alert.alert('Succès', 'Équipement supprimé');
    },
    onError: (e) => Alert.alert('Erreur', e.message),
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    if (activeTab === 'users') await refetchUsers();
    if (activeTab === 'clients') await refetchClients();
    if (activeTab === 'sites') await refetchSites();
    if (activeTab === 'assets') {
      await refetchAssets();
      await refetchZones();
    }
    setRefreshing(false);
  }, [activeTab, refetchUsers, refetchClients, refetchSites, refetchAssets, refetchZones]);

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
            if (type === 'client') deleteClientMutation.mutate({ id });
            if (type === 'site') deleteSiteMutation.mutate({ id });
            if (type === 'asset') deleteAssetMutation.mutate({ id });
          },
        },
      ]
    );
  };

  const confirmPasswordReset = (userId: string, userName: string, userEmail: string) => {
    Alert.alert(
      'Réinitialiser le mot de passe',
      `Envoyer un nouveau mot de passe à ${userName} (${userEmail}) ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Envoyer',
          onPress: () => sendPasswordResetMutation.mutate({ userId }),
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
    { key: 'clients', label: 'Clients', icon: <Building2 size={18} color={activeTab === 'clients' ? colors.primary : colors.textMuted} /> },
    { key: 'sites', label: 'Sites', icon: <MapPin size={18} color={activeTab === 'sites' ? colors.primary : colors.textMuted} /> },
    { key: 'assets', label: 'Équipements', icon: <Wrench size={18} color={activeTab === 'assets' ? colors.primary : colors.textMuted} /> },
  ];

  const isLoading =
    (activeTab === 'users' && loadingUsers) ||
    (activeTab === 'clients' && loadingClients) ||
    (activeTab === 'sites' && loadingSites) ||
    (activeTab === 'assets' && (loadingAssets || loadingZones));

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
            {activeTab === 'clients' && 'Gestion des clients'}
            {activeTab === 'sites' && 'Gestion des sites'}
            {activeTab === 'assets' && 'Gestion des équipements'}
          </Text>
          <Button title="Ajouter" onPress={openCreateModal} size="sm" icon={<Plus size={16} color={colors.textInverse} />} />
        </View>

        {isLoading ? (
          <LoadingState message="Chargement..." />
        ) : (
          <View style={styles.list}>
            {activeTab === 'users' && usersList.map((u: User) => (
              <View key={u.id} style={styles.listItem}>
                <View style={styles.listItemContent}>
                  <Text style={styles.listItemTitle}>{u.name}</Text>
                  <Text style={styles.listItemSubtitle}>{u.email}</Text>
                  <View style={[styles.roleBadge, { backgroundColor: getRoleColor(u.role) + '20' }]}>
                    <Text style={[styles.roleBadgeText, { color: getRoleColor(u.role) }]}>{ROLE_LABELS[u.role]}</Text>
                  </View>
                </View>
                <View style={styles.listItemActions}>
                  <TouchableOpacity 
                    style={styles.actionBtn} 
                    onPress={() => confirmPasswordReset(u.id, u.name, u.email)}
                    disabled={sendPasswordResetMutation.isPending}
                  >
                    <KeyRound size={16} color={colors.warning} />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.actionBtn} onPress={() => openEditModal(u)}>
                    <Pencil size={16} color={colors.primary} />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.actionBtn} onPress={() => confirmDelete('user', u.id, u.name)}>
                    <Trash2 size={16} color={colors.danger} />
                  </TouchableOpacity>
                </View>
              </View>
            ))}

            {activeTab === 'clients' && clientsList.map((c: Client) => (
              <View key={c.id} style={styles.clientCardWrapper}>
                <ClientSheet
                  client={c as unknown as ClientType}
                  userRole={userRole}
                  variant="compact"
                  onPress={() => router.push(`/client/${c.id}`)}
                />
                <View style={styles.clientActions}>
                  <TouchableOpacity style={styles.actionBtn} onPress={() => router.push(`/client/${c.id}`)}>
                    <Eye size={16} color={colors.primary} />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.actionBtn} onPress={() => openEditModal(c)}>
                    <Pencil size={16} color={colors.primary} />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.actionBtn} onPress={() => confirmDelete('client', c.id, c.name)}>
                    <Trash2 size={16} color={colors.danger} />
                  </TouchableOpacity>
                </View>
              </View>
            ))}

            {activeTab === 'sites' && sitesList.map((s: Site) => (
              <View key={s.id} style={styles.listItem}>
                <View style={styles.listItemContent}>
                  <Text style={styles.listItemTitle}>{s.name}</Text>
                  {s.address && <Text style={styles.listItemSubtitle}>{s.address}</Text>}
                  {!!s.client_id && (
                    <Text style={styles.listItemSubtitle}>
                      Client: {clientsList.find((c) => c.id === s.client_id)?.name || 'Non défini'}
                    </Text>
                  )}
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

            {activeTab === 'assets' && assetsList.map((a: Asset) => (
              <View key={a.id} style={styles.listItem}>
                <View style={styles.listItemContent}>
                  <Text style={styles.listItemTitle}>{a.code_interne} • {a.designation}</Text>
                  <Text style={styles.listItemSubtitle}>{a.categorie}</Text>
                  <Text style={styles.listItemSubtitle}>
                    {a.site_name || 'Site inconnu'} • {a.zone_name || 'Zone inconnue'}
                  </Text>
                </View>
                <View style={styles.listItemActions}>
                  <TouchableOpacity style={styles.actionBtn} onPress={() => openEditModal(a)}>
                    <Pencil size={16} color={colors.primary} />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.actionBtn} onPress={() => confirmDelete('asset', a.id, a.code_interne)}>
                    <Trash2 size={16} color={colors.danger} />
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
        clients={clientsList}
        sites={sitesList}
        zones={zonesList}
        onSaveUser={(data) => editingItem ? updateUserMutation.mutate({ id: editingItem.id, ...data }) : createUserMutation.mutate(data as any)}
        onSaveClient={(data) => editingItem ? updateClientMutation.mutate({ id: editingItem.id, ...data }) : createClientMutation.mutate(data as any)}
        onSaveSite={(data) => editingItem ? updateSiteMutation.mutate({ id: editingItem.id, ...data }) : createSiteMutation.mutate(data as any)}
        onSaveAsset={(data) => editingItem ? updateAssetMutation.mutate({ id: editingItem.id, data }) : createAssetMutation.mutate(data as any)}
        isSaving={
          createUserMutation.isPending ||
          updateUserMutation.isPending ||
          createClientMutation.isPending ||
          updateClientMutation.isPending ||
          createSiteMutation.isPending ||
          updateSiteMutation.isPending ||
          createAssetMutation.isPending ||
          updateAssetMutation.isPending
        }
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
  clients: Client[];
  sites: Site[];
  zones: Zone[];
  onSaveUser: (data: any) => void;
  onSaveClient: (data: any) => void;
  onSaveSite: (data: any) => void;
  onSaveAsset: (data: any) => void;
  isSaving: boolean;
}

function AdminModal({ visible, onClose, type, editingItem, clients, sites, zones, onSaveUser, onSaveClient, onSaveSite, onSaveAsset, isSaving }: AdminModalProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('TECHNICIAN');
  const [address, setAddress] = useState('');
  const [clientId, setClientId] = useState('');
  const [siteId, setSiteId] = useState('');
  const [zoneId, setZoneId] = useState('');
  const [codeInterne, setCodeInterne] = useState('');
  const [designation, setDesignation] = useState('');
  const [categorie, setCategorie] = useState('');
  const [marque, setMarque] = useState('');
  const [modele, setModele] = useState('');
  const [numeroSerie, setNumeroSerie] = useState('');
  const [annee, setAnnee] = useState('2024');
  const [statut, setStatut] = useState<'EN_SERVICE' | 'HORS_SERVICE' | 'REBUT' | 'EN_LOCATION'>('EN_SERVICE');
  const [criticite, setCriticite] = useState('3');
  const [vgpEnabled, setVgpEnabled] = useState(false);
  const [vgpValidity, setVgpValidity] = useState('12');
  const [showRolePicker, setShowRolePicker] = useState(false);
  const [showSitePicker, setShowSitePicker] = useState(false);
  const [showClientPicker, setShowClientPicker] = useState(false);
  const [showZonePicker, setShowZonePicker] = useState(false);
  const [showStatusPicker, setShowStatusPicker] = useState(false);

  React.useEffect(() => {
    if (type === 'assets' && siteId) {
      const matchingZones = zones.filter((z) => z.site_id === siteId);
      if (!matchingZones.find((z) => z.id === zoneId)) {
        setZoneId(matchingZones[0]?.id || '');
      }
    }
  }, [siteId, zones, zoneId, type]);

  React.useEffect(() => {
    if (visible) {
      if (editingItem) {
        setName(editingItem.name || '');
        setEmail(editingItem.email || '');
        setRole(editingItem.role || 'TECHNICIAN');
        setAddress(editingItem.address || '');
        setClientId(editingItem.client_id || '');
        setSiteId(editingItem.site_id || '');
        setZoneId(editingItem.zone_id || '');
        setCodeInterne(editingItem.code_interne || '');
        setDesignation(editingItem.designation || '');
        setCategorie(editingItem.categorie || '');
        setMarque(editingItem.marque || '');
        setModele(editingItem.modele || '');
        setNumeroSerie(editingItem.numero_serie || '');
        setAnnee(String(editingItem.annee || 2024));
        setStatut(editingItem.statut || 'EN_SERVICE');
        setCriticite(String(editingItem.criticite || 3));
        setVgpEnabled(Boolean(editingItem.vgp_enabled));
        setVgpValidity(String(editingItem.vgp_validity_months || 12));
      } else {
        setName('');
        setEmail('');
        setRole('TECHNICIAN');
        setAddress('');
        setClientId(clients[0]?.id || '');
        setSiteId(sites[0]?.id || '');
        setZoneId(zones[0]?.id || '');
        setCodeInterne('');
        setDesignation('');
        setCategorie('');
        setMarque('');
        setModele('');
        setNumeroSerie('');
        setAnnee('2024');
        setStatut('EN_SERVICE');
        setCriticite('3');
        setVgpEnabled(false);
        setVgpValidity('12');
      }
    }
  }, [visible, editingItem, sites, zones, clients]);

  const handleSave = () => {
    if (type === 'users') {
      if (!name || !email) {
        Alert.alert('Erreur', 'Nom et email requis');
        return;
      }
      onSaveUser({ name, email, role });
    } else if (type === 'clients') {
      if (!name) {
        Alert.alert('Erreur', 'Nom requis');
        return;
      }
      onSaveClient({ name });
    } else if (type === 'sites') {
      if (!name) {
        Alert.alert('Erreur', 'Nom requis');
        return;
      }
      onSaveSite({ name, address: address || undefined, client_id: clientId || undefined });
    } else if (type === 'assets') {
      if (!siteId || !zoneId) {
        Alert.alert('Erreur', 'Site et zone requis');
        return;
      }

      if (editingItem) {
        onSaveAsset({
          designation,
          statut,
          criticite: parseInt(criticite, 10) || 3,
          site_id: siteId,
          zone_id: zoneId,
          vgp_enabled: vgpEnabled,
          vgp_validity_months: vgpEnabled ? (parseInt(vgpValidity, 10) || 12) : null,
        });
        return;
      }

      if (!codeInterne || !designation || !categorie || !marque || !modele || !numeroSerie) {
        Alert.alert('Erreur', 'Tous les champs obligatoires doivent être remplis');
        return;
      }

      onSaveAsset({
        code_interne: codeInterne,
        designation,
        categorie,
        marque,
        modele,
        numero_serie: numeroSerie,
        annee: parseInt(annee, 10) || 2024,
        statut,
        criticite: parseInt(criticite, 10) || 3,
        site_id: siteId,
        zone_id: zoneId,
        vgp_enabled: vgpEnabled,
        vgp_validity_months: vgpEnabled ? (parseInt(vgpValidity, 10) || 12) : null,
      });
    }
  };

  const getTitle = () => {
    const action = editingItem ? 'Modifier' : 'Créer';
    switch (type) {
      case 'users': return `${action} un utilisateur`;
      case 'clients': return `${action} un client`;
      case 'sites': return `${action} un site`;
      case 'assets': return `${action} un équipement`;
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

            {type === 'clients' && (
              <>
                <Input label="Nom du client" value={name} onChangeText={setName} placeholder="Entreprise" />
              </>
            )}

            {type === 'sites' && (
              <>
                <View style={modalStyles.field}>
                  <Text style={modalStyles.label}>Client</Text>
                  <TouchableOpacity style={modalStyles.picker} onPress={() => setShowClientPicker(!showClientPicker)}>
                    <Text style={modalStyles.pickerText}>{clients.find(c => c.id === clientId)?.name || 'Sélectionner un client'}</Text>
                    {showClientPicker ? <ChevronUp size={20} color={colors.textMuted} /> : <ChevronDown size={20} color={colors.textMuted} />}
                  </TouchableOpacity>
                  {showClientPicker && (
                    <View style={modalStyles.pickerOptions}>
                      {clients.map((c) => (
                        <TouchableOpacity key={c.id} style={modalStyles.pickerOption} onPress={() => { setClientId(c.id); setShowClientPicker(false); }}>
                          <Text style={[modalStyles.pickerOptionText, clientId === c.id && modalStyles.pickerOptionSelected]}>{c.name}</Text>
                          {clientId === c.id && <Check size={16} color={colors.primary} />}
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>
                <Input label="Nom" value={name} onChangeText={setName} placeholder="Nom du site" />
                <Input label="Adresse" value={address} onChangeText={setAddress} placeholder="Adresse (optionnel)" multiline />
              </>
            )}

            {type === 'assets' && (
              <>
                <Input label="Code interne" value={codeInterne} onChangeText={setCodeInterne} placeholder="EQ-0001" />
                <Input label="Désignation" value={designation} onChangeText={setDesignation} placeholder="Désignation" />
                <Input label="Catégorie" value={categorie} onChangeText={setCategorie} placeholder="Catégorie" />
                <Input label="Marque" value={marque} onChangeText={setMarque} placeholder="Marque" />
                <Input label="Modèle" value={modele} onChangeText={setModele} placeholder="Modèle" />
                <Input label="N° Série" value={numeroSerie} onChangeText={setNumeroSerie} placeholder="Numéro de série" />
                <Input label="Année" value={annee} onChangeText={setAnnee} placeholder="2024" keyboardType="numeric" />

                <View style={modalStyles.field}>
                  <Text style={modalStyles.label}>Statut</Text>
                  <TouchableOpacity style={modalStyles.picker} onPress={() => setShowStatusPicker(!showStatusPicker)}>
                    <Text style={modalStyles.pickerText}>{statut}</Text>
                    {showStatusPicker ? <ChevronUp size={20} color={colors.textMuted} /> : <ChevronDown size={20} color={colors.textMuted} />}
                  </TouchableOpacity>
                  {showStatusPicker && (
                    <View style={modalStyles.pickerOptions}>
                      {['EN_SERVICE', 'HORS_SERVICE', 'REBUT', 'EN_LOCATION'].map((s) => (
                        <TouchableOpacity key={s} style={modalStyles.pickerOption} onPress={() => { setStatut(s as any); setShowStatusPicker(false); }}>
                          <Text style={[modalStyles.pickerOptionText, statut === s && modalStyles.pickerOptionSelected]}>{s}</Text>
                          {statut === s && <Check size={16} color={colors.primary} />}
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>

                <Input label="Criticité (1-5)" value={criticite} onChangeText={setCriticite} placeholder="3" keyboardType="numeric" />

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

                <View style={modalStyles.field}>
                  <Text style={modalStyles.label}>Zone</Text>
                  <TouchableOpacity style={modalStyles.picker} onPress={() => setShowZonePicker(!showZonePicker)}>
                    <Text style={modalStyles.pickerText}>{zones.find(z => z.id === zoneId)?.name || 'Sélectionner une zone'}</Text>
                    {showZonePicker ? <ChevronUp size={20} color={colors.textMuted} /> : <ChevronDown size={20} color={colors.textMuted} />}
                  </TouchableOpacity>
                  {showZonePicker && (
                    <View style={modalStyles.pickerOptions}>
                      {zones
                        .filter((z) => !siteId || z.site_id === siteId)
                        .map((z) => (
                          <TouchableOpacity key={z.id} style={modalStyles.pickerOption} onPress={() => { setZoneId(z.id); setShowZonePicker(false); }}>
                            <Text style={[modalStyles.pickerOptionText, zoneId === z.id && modalStyles.pickerOptionSelected]}>{z.name}</Text>
                            {zoneId === z.id && <Check size={16} color={colors.primary} />}
                          </TouchableOpacity>
                        ))}
                    </View>
                  )}
                </View>

                <View style={modalStyles.field}>
                  <Text style={modalStyles.label}>VGP activée</Text>
                  <TouchableOpacity style={modalStyles.picker} onPress={() => setVgpEnabled(!vgpEnabled)}>
                    <Text style={modalStyles.pickerText}>{vgpEnabled ? 'Oui' : 'Non'}</Text>
                  </TouchableOpacity>
                </View>

                {vgpEnabled && (
                  <Input label="Validité VGP (mois)" value={vgpValidity} onChangeText={setVgpValidity} placeholder="12" keyboardType="numeric" />
                )}
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
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface,
  },
  tabActive: {
    backgroundColor: colors.primary + '15',
  },
  tabLabel: {
    fontSize: typography.bodySmall.fontSize,
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
  clientCardWrapper: {
    position: 'relative',
    marginBottom: spacing.sm,
  },
  clientActions: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    flexDirection: 'row',
    gap: spacing.xs,
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
