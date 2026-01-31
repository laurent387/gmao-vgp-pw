import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Save, X, Building2 } from 'lucide-react-native';
import { colors, spacing, borderRadius } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { trpc } from '@/lib/trpc';
import { ClientSheet } from '@/components/ClientSheet';
import { Client } from '@/types';
import { canEditClient, CLIENT_STATUS_OPTIONS } from '@/utils/clientPermissions';
import { Button } from '@/components/Button';
import { useNavigation } from '@/lib/navigation';

export default function ClientProfileScreen() {
  const router = useRouter();
  const nav = useNavigation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const userRole = user?.role || 'TECHNICIAN';

  const [refreshing, setRefreshing] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Client>>({});

  // Fetch client data
  const {
    data: clientData,
    isLoading,
    error,
    refetch,
  } = trpc.admin.getClient.useQuery({ id: id || '' }, { enabled: !!id });

  // Fetch client stats
  const { data: statsData } = trpc.admin.getClientStats.useQuery(
    { id: id || '' },
    { enabled: !!id }
  );

  // Update mutation
  const updateClientMutation = trpc.admin.updateClientFull.useMutation({
    onSuccess: () => {
      setEditModalVisible(false);
      refetch();
      Alert.alert('Succès', 'Client modifié avec succès');
    },
    onError: (e) => {
      Alert.alert('Erreur', e.message);
    },
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const handleEdit = () => {
    if (clientData) {
      setEditForm({
        name: clientData.name,
        siret: clientData.siret || '',
        tva_number: clientData.tva_number || '',
        contact_name: clientData.contact_name || '',
        contact_email: clientData.contact_email || '',
        contact_phone: clientData.contact_phone || '',
        address: clientData.address || '',
        access_instructions: clientData.access_instructions || '',
        billing_address: clientData.billing_address || '',
        billing_email: clientData.billing_email || '',
        internal_notes: clientData.internal_notes || '',
        status: clientData.status || 'ACTIVE',
      });
      setEditModalVisible(true);
    }
  };

  const handleSave = () => {
    if (!id || !editForm.name?.trim()) {
      Alert.alert('Erreur', 'Le nom du client est requis');
      return;
    }

    updateClientMutation.mutate({
      id,
      ...editForm,
    });
  };

  const handleViewAssets = () => {
    // Navigate to inventory filtered by client
    if (id) nav.goToInventory(undefined, id);
  };

  const handleViewReports = () => {
    // Navigate to missions list (client filter not yet supported)
    nav.goToMissions();
  };

  const handleViewNextDue = () => {
    // Navigate to planning filtered by upcoming due dates
    nav.goToPlanning('due30');
  };

  // Combine client data with stats
  const client: Client | null = clientData
    ? {
        ...clientData,
        asset_count: statsData?.asset_count ?? 0,
        site_count: statsData?.site_count ?? 0,
        last_report_date: statsData?.last_report_date ?? null,
        next_due_date: statsData?.next_due_date ?? null,
      }
    : null;

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }

  if (error || !client) {
    return (
      <View style={styles.errorContainer}>
        <Building2 size={48} color={colors.textMuted} />
        <Text style={styles.errorText}>Client introuvable</Text>
        <Button title="Retour" onPress={() => router.back()} variant="outline" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profil Client</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        <ClientSheet
          client={client}
          userRole={userRole}
          variant="full"
          onEdit={canEditClient(userRole) ? handleEdit : undefined}
          onViewAssets={handleViewAssets}
          onViewReports={handleViewReports}
          onViewNextDue={handleViewNextDue}
        />
      </ScrollView>

      {/* Edit Modal */}
      <Modal visible={editModalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Modifier le client</Text>
              <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                <X size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent}>
              {/* Identity */}
              <Text style={styles.formSectionTitle}>Identité</Text>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Raison sociale *</Text>
                <TextInput
                  style={styles.input}
                  value={editForm.name}
                  onChangeText={(v) => setEditForm({ ...editForm, name: v })}
                  placeholder="Nom du client"
                  placeholderTextColor={colors.textMuted}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Statut</Text>
                <View style={styles.statusPicker}>
                  {CLIENT_STATUS_OPTIONS.map((opt) => (
                    <TouchableOpacity
                      key={opt.value}
                      style={[
                        styles.statusOption,
                        editForm.status === opt.value && {
                          backgroundColor: opt.color + '20',
                          borderColor: opt.color,
                        },
                      ]}
                      onPress={() => setEditForm({ ...editForm, status: opt.value })}
                    >
                      <Text
                        style={[
                          styles.statusOptionText,
                          editForm.status === opt.value && { color: opt.color },
                        ]}
                      >
                        {opt.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Contact */}
              <Text style={styles.formSectionTitle}>Contact</Text>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Contact principal</Text>
                <TextInput
                  style={styles.input}
                  value={editForm.contact_name || ''}
                  onChangeText={(v) => setEditForm({ ...editForm, contact_name: v })}
                  placeholder="Nom du contact"
                  placeholderTextColor={colors.textMuted}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Téléphone</Text>
                <TextInput
                  style={styles.input}
                  value={editForm.contact_phone || ''}
                  onChangeText={(v) => setEditForm({ ...editForm, contact_phone: v })}
                  placeholder="+33 1 23 45 67 89"
                  keyboardType="phone-pad"
                  placeholderTextColor={colors.textMuted}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Email</Text>
                <TextInput
                  style={styles.input}
                  value={editForm.contact_email || ''}
                  onChangeText={(v) => setEditForm({ ...editForm, contact_email: v })}
                  placeholder="contact@exemple.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  placeholderTextColor={colors.textMuted}
                />
              </View>

              {/* Address */}
              <Text style={styles.formSectionTitle}>Adresse</Text>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Adresse</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={editForm.address || ''}
                  onChangeText={(v) => setEditForm({ ...editForm, address: v })}
                  placeholder="Adresse complète"
                  multiline
                  numberOfLines={3}
                  placeholderTextColor={colors.textMuted}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Consignes d'accès</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={editForm.access_instructions || ''}
                  onChangeText={(v) => setEditForm({ ...editForm, access_instructions: v })}
                  placeholder="Informations pour accéder au site..."
                  multiline
                  numberOfLines={2}
                  placeholderTextColor={colors.textMuted}
                />
              </View>

              {/* Admin fields */}
              <Text style={styles.formSectionTitle}>Informations administratives</Text>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>SIRET</Text>
                <TextInput
                  style={styles.input}
                  value={editForm.siret || ''}
                  onChangeText={(v) => setEditForm({ ...editForm, siret: v })}
                  placeholder="123 456 789 00012"
                  placeholderTextColor={colors.textMuted}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>N° TVA</Text>
                <TextInput
                  style={styles.input}
                  value={editForm.tva_number || ''}
                  onChangeText={(v) => setEditForm({ ...editForm, tva_number: v })}
                  placeholder="FR12345678901"
                  placeholderTextColor={colors.textMuted}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Email facturation</Text>
                <TextInput
                  style={styles.input}
                  value={editForm.billing_email || ''}
                  onChangeText={(v) => setEditForm({ ...editForm, billing_email: v })}
                  placeholder="facturation@exemple.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  placeholderTextColor={colors.textMuted}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Adresse facturation</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={editForm.billing_address || ''}
                  onChangeText={(v) => setEditForm({ ...editForm, billing_address: v })}
                  placeholder="Adresse de facturation"
                  multiline
                  numberOfLines={3}
                  placeholderTextColor={colors.textMuted}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Notes internes</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={editForm.internal_notes || ''}
                  onChangeText={(v) => setEditForm({ ...editForm, internal_notes: v })}
                  placeholder="Notes visibles uniquement par les administrateurs..."
                  multiline
                  numberOfLines={4}
                  placeholderTextColor={colors.textMuted}
                />
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <Button
                title="Annuler"
                onPress={() => setEditModalVisible(false)}
                variant="outline"
                style={{ flex: 1, marginRight: spacing.sm }}
              />
              <Button
                title="Enregistrer"
                onPress={handleSave}
                loading={updateClientMutation.isPending}
                icon={<Save size={16} color={colors.textInverse} />}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: 16,
    color: colors.textSecondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: spacing.xl,
    gap: spacing.md,
  },
  errorText: {
    fontSize: 18,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    padding: spacing.sm,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  headerPlaceholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: spacing.lg,
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  modalContent: {
    padding: spacing.lg,
    maxHeight: 500,
  },
  modalFooter: {
    flexDirection: 'row',
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },

  // Form styles
  formSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  formGroup: {
    marginBottom: spacing.md,
  },
  formLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  input: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: 16,
    color: colors.text,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  statusPicker: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  statusOption: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  statusOptionText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
});
