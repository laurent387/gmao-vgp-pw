import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
  Switch,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { User, Mail, Lock, LogOut, Save, ArrowLeft, Send, Pencil, Users, Shield } from 'lucide-react-native';
import { Image } from 'expo-image';
import * as Clipboard from 'expo-clipboard';
import QRCode from 'react-native-qrcode-svg';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { colors, spacing, borderRadius } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { trpc } from '@/lib/trpc';
import { useNavigation } from '@/lib/navigation';
import { trackEvent } from '@/lib/analytics';
import { BusinessCard } from '@/types';

export default function ProfileScreen() {
  const router = useRouter();
  const nav = useNavigation();
  const queryClient = useQueryClient();
  const { user, logout, isAdmin } = useAuth();

  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [isSaving, setIsSaving] = useState(false);
  const [isSendingReset, setIsSendingReset] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [showQr, setShowQr] = useState(false);
  const [cardForm, setCardForm] = useState({
    firstName: '',
    lastName: '',
    jobTitle: '',
    photoUrl: '',
    email: '',
    phone: '',
    isEmailPublic: false,
    isPhonePublic: false,
  });

  const publicBaseUrl = process.env.EXPO_PUBLIC_WEB_BASE_URL || 'https://app.in-spectra.com';

  // Query all users for admin section
  const { data: allUsers, refetch: refetchUsers } = useQuery({
    queryKey: ['all-users-admin'],
    queryFn: async () => {
      const { getUsers } = await import('@/app/api');
      const response = await getUsers();
      return response.data as Array<{ 
        id: string; 
        name: string; 
        email: string; 
        role: string; 
        can_be_responsible: boolean;
      }>;
    },
    enabled: isAdmin?.() ?? false,
  });

  // Mutation to toggle can_be_responsible
  const toggleResponsibleMutation = useMutation({
    mutationFn: async ({ userId, canBeResponsible }: { userId: string; canBeResponsible: boolean }) => {
      const { updateUserCanBeResponsible } = await import('@/app/api');
      await updateUserCanBeResponsible(userId, canBeResponsible);
    },
    onSuccess: () => {
      refetchUsers();
      queryClient.invalidateQueries({ queryKey: ['responsible-users'] });
    },
    onError: (error: any) => {
      Alert.alert('Erreur', error?.message || 'Impossible de modifier');
    },
  });

  const updateProfileMutation = trpc.auth.updateProfile.useMutation();
  const requestPasswordResetMutation = trpc.auth.requestPasswordReset.useMutation();

  const {
    data: businessCard,
    isLoading: isLoadingBusinessCard,
    refetch: refetchBusinessCard,
  } = useQuery<BusinessCard>({
    queryKey: ['business-card'],
    queryFn: async () => {
      const { getMyBusinessCard } = await import('@/app/api');
      const response = await getMyBusinessCard();
      return response.data as BusinessCard;
    },
  });

  const updateBusinessCardMutation = useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const { updateMyBusinessCard } = await import('@/app/api');
      const response = await updateMyBusinessCard(payload);
      return response.data as BusinessCard;
    },
    onSuccess: (data) => {
      setCardForm({
        firstName: data.firstName || '',
        lastName: data.lastName || '',
        jobTitle: data.jobTitle || '',
        photoUrl: data.photoUrl || '',
        email: data.email || '',
        phone: data.phone || '',
        isEmailPublic: data.isEmailPublic,
        isPhonePublic: data.isPhonePublic,
      });
      refetchBusinessCard();
    },
    onError: (error: any) => {
      Alert.alert('Erreur', error?.message || 'Impossible de mettre a jour la carte');
    },
  });

  const rotateBusinessCardMutation = useMutation({
    mutationFn: async () => {
      const { rotateMyBusinessCardToken } = await import('@/app/api');
      const response = await rotateMyBusinessCardToken();
      return response.data as BusinessCard;
    },
    onSuccess: () => {
      refetchBusinessCard();
    },
    onError: (error: any) => {
      Alert.alert('Erreur', error?.message || 'Impossible de regenerer le lien');
    },
  });

  const disableBusinessCardMutation = useMutation({
    mutationFn: async () => {
      const { disableMyBusinessCardPublic } = await import('@/app/api');
      const response = await disableMyBusinessCardPublic();
      return response.data as BusinessCard;
    },
    onSuccess: () => {
      refetchBusinessCard();
    },
    onError: (error: any) => {
      Alert.alert('Erreur', error?.message || 'Impossible de desactiver le lien');
    },
  });

  useEffect(() => {
    if (user) {
      setName(user.name);
      setEmail(user.email);
    }
  }, [user]);

  useEffect(() => {
    if (businessCard) {
      setCardForm({
        firstName: businessCard.firstName || '',
        lastName: businessCard.lastName || '',
        jobTitle: businessCard.jobTitle || '',
        photoUrl: businessCard.photoUrl || '',
        email: businessCard.email || '',
        phone: businessCard.phone || '',
        isEmailPublic: businessCard.isEmailPublic,
        isPhonePublic: businessCard.isPhonePublic,
      });
    }
  }, [businessCard]);

  const handleSaveProfile = async () => {
    if (!name.trim()) {
      Alert.alert('Erreur', 'Le nom est requis');
      return;
    }

    setIsSaving(true);
    setSaveSuccess(false);

    try {
      await updateProfileMutation.mutateAsync({ name: name.trim() });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error: any) {
      Alert.alert('Erreur', error?.message || 'Impossible de mettre à jour le profil');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRequestPasswordReset = async () => {
    if (Platform.OS === 'web') {
      const confirmed = window.confirm(
        'Un email avec un lien de réinitialisation de mot de passe sera envoyé à votre adresse email. Continuer ?'
      );
      if (!confirmed) return;
    } else {
      Alert.alert(
        'Réinitialiser le mot de passe',
        'Un email avec un lien de réinitialisation sera envoyé à votre adresse email.',
        [
          { text: 'Annuler', style: 'cancel' },
          { text: 'Envoyer', onPress: () => sendResetEmail() },
        ]
      );
      return;
    }

    sendResetEmail();
  };

  const sendResetEmail = async () => {
    setIsSendingReset(true);
    setResetSent(false);

    try {
      await requestPasswordResetMutation.mutateAsync({ email: user?.email || '' });
      setResetSent(true);
      Alert.alert(
        'Email envoyé',
        'Un email avec un lien de réinitialisation de mot de passe a été envoyé à votre adresse.'
      );
    } catch (error: any) {
      Alert.alert('Erreur', error?.message || "Impossible d'envoyer l'email de réinitialisation");
    } finally {
      setIsSendingReset(false);
    }
  };

  const handleLogout = async () => {
    if (Platform.OS === 'web') {
      const confirmed = window.confirm('Voulez-vous vraiment vous déconnecter ?');
      if (!confirmed) return;
    } else {
      Alert.alert(
        'Déconnexion',
        'Voulez-vous vraiment vous déconnecter ?',
        [
          { text: 'Annuler', style: 'cancel' },
          { text: 'Déconnecter', style: 'destructive', onPress: () => performLogout() },
        ]
      );
      return;
    }

    performLogout();
  };

  const performLogout = async () => {
    await logout();
    router.replace('/login');
  };

  const publicLink = (businessCard?.publicEnabled && businessCard.publicToken)
    ? `${publicBaseUrl.replace(/\/$/, '')}/u/${businessCard.publicToken}`
    : '';

  const handleSaveBusinessCard = async () => {
    updateBusinessCardMutation.mutate({
      firstName: cardForm.firstName,
      lastName: cardForm.lastName,
      jobTitle: cardForm.jobTitle,
      photoUrl: cardForm.photoUrl,
      email: cardForm.email,
      phone: cardForm.phone,
      isEmailPublic: cardForm.isEmailPublic,
      isPhonePublic: cardForm.isPhonePublic,
    });
  };

  const handleCopyBusinessLink = async () => {
    if (!publicLink) {
      Alert.alert('Lien indisponible', 'Activez le lien public pour generer un lien.');
      return;
    }
    await Clipboard.setStringAsync(publicLink);
    Alert.alert('Lien copie', 'Le lien public a ete copie dans le presse-papiers.');
  };

  const handleTogglePublicLink = (value: boolean) => {
    if (value) {
      updateBusinessCardMutation.mutate({ publicEnabled: true });
    } else {
      disableBusinessCardMutation.mutate();
    }
  };

  const handleRotatePublicLink = () => {
    const confirmRotate = () => rotateBusinessCardMutation.mutate();

    if (Platform.OS === 'web') {
      if (window.confirm('Ce lien va remplacer le precedent et invalider l\'ancien QR. Continuer ?')) {
        confirmRotate();
      }
      return;
    }

    Alert.alert(
      'Regenerer le lien',
      'Ce lien va remplacer le precedent et invalider l\'ancien QR.',
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Regenerer', onPress: confirmRotate, style: 'destructive' },
      ]
    );
  };

  const getRoleLabel = (role: string): string => {
    const labels: Record<string, string> = {
      ADMIN: 'Administrateur',
      HSE_MANAGER: 'Responsable HSE',
      TECHNICIAN: 'Technicien',
      AUDITOR: 'Auditeur',
    };
    return labels[role] || role;
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Mon Profil</Text>
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => {
            trackEvent('navigate_to_profile_edit', { source: 'profile_header' });
            nav.goToProfileEdit();
          }}
          accessibilityLabel="Modifier le profil"
          accessibilityHint="Double-tap to edit your profile"
        >
          <Pencil size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Avatar / Icon */}
      <View style={styles.avatarContainer}>
        <View style={styles.avatar}>
          <User size={48} color={colors.surface} />
        </View>
        <Text style={styles.userName}>{user?.name}</Text>
        <Text style={styles.userRole}>{getRoleLabel(user?.role || '')}</Text>
      </View>

      {/* Informations Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Informations personnelles</Text>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Nom complet</Text>
          <View style={styles.inputContainer}>
            <User size={20} color={colors.textMuted} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Votre nom"
              placeholderTextColor={colors.textMuted}
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Email</Text>
          <View style={[styles.inputContainer, styles.inputDisabled]}>
            <Mail size={20} color={colors.textMuted} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, styles.inputTextDisabled]}
              value={email}
              editable={false}
              placeholder="Votre email"
              placeholderTextColor={colors.textMuted}
            />
          </View>
          <Text style={styles.hint}>L'email ne peut pas être modifié</Text>
        </View>

        <TouchableOpacity
          style={[styles.saveButton, isSaving && styles.buttonDisabled]}
          onPress={handleSaveProfile}
          disabled={isSaving}
        >
          {isSaving ? (
            <ActivityIndicator size="small" color={colors.surface} />
          ) : (
            <>
              <Save size={20} color={colors.surface} />
              <Text style={styles.saveButtonText}>
                {saveSuccess ? 'Enregistré !' : 'Enregistrer les modifications'}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Password Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Sécurité</Text>

        <View style={styles.passwordInfo}>
          <Lock size={24} color={colors.primary} />
          <View style={styles.passwordTextContainer}>
            <Text style={styles.passwordTitle}>Changer le mot de passe</Text>
            <Text style={styles.passwordDescription}>
              Un lien de réinitialisation sera envoyé à votre adresse email
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.resetButton, isSendingReset && styles.buttonDisabled]}
          onPress={handleRequestPasswordReset}
          disabled={isSendingReset}
        >
          {isSendingReset ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <>
              <Send size={20} color={colors.primary} />
              <Text style={styles.resetButtonText}>
                {resetSent ? 'Email envoyé !' : 'Envoyer le lien par email'}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Business Card Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Carte de visite</Text>

        {isLoadingBusinessCard ? (
          <ActivityIndicator size="small" color={colors.primary} />
        ) : (
          <>
            <View style={styles.businessHeader}>
              <View style={styles.businessAvatar}>
                {cardForm.photoUrl ? (
                  <Image source={{ uri: cardForm.photoUrl }} style={styles.businessAvatarImage} contentFit="cover" />
                ) : (
                  <User size={28} color={colors.surface} />
                )}
              </View>
              <View style={styles.businessInfo}>
                <Text style={styles.businessName}>
                  {`${cardForm.firstName} ${cardForm.lastName}`.trim() || user?.name}
                </Text>
                {cardForm.jobTitle ? (
                  <Text style={styles.businessJob}>{cardForm.jobTitle}</Text>
                ) : null}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Prenom</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  value={cardForm.firstName}
                  onChangeText={(value) => setCardForm((prev) => ({ ...prev, firstName: value }))}
                  placeholder="Prenom"
                  placeholderTextColor={colors.textMuted}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Nom</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  value={cardForm.lastName}
                  onChangeText={(value) => setCardForm((prev) => ({ ...prev, lastName: value }))}
                  placeholder="Nom"
                  placeholderTextColor={colors.textMuted}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Poste</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  value={cardForm.jobTitle}
                  onChangeText={(value) => setCardForm((prev) => ({ ...prev, jobTitle: value }))}
                  placeholder="Technicien VGP"
                  placeholderTextColor={colors.textMuted}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Photo (URL)</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  value={cardForm.photoUrl}
                  onChangeText={(value) => setCardForm((prev) => ({ ...prev, photoUrl: value }))}
                  placeholder="https://..."
                  placeholderTextColor={colors.textMuted}
                  autoCapitalize="none"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email de contact</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  value={cardForm.email}
                  onChangeText={(value) => setCardForm((prev) => ({ ...prev, email: value }))}
                  placeholder="contact@..."
                  placeholderTextColor={colors.textMuted}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Telephone</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  value={cardForm.phone}
                  onChangeText={(value) => setCardForm((prev) => ({ ...prev, phone: value }))}
                  placeholder="+33 ..."
                  placeholderTextColor={colors.textMuted}
                  keyboardType="phone-pad"
                />
              </View>
            </View>

            <View style={styles.toggleRow}>
              <Text style={styles.toggleLabel}>{"Rendre l'email public"}</Text>
              <Switch
                value={cardForm.isEmailPublic}
                onValueChange={(value) => setCardForm((prev) => ({ ...prev, isEmailPublic: value }))}
                trackColor={{ false: colors.border, true: colors.primaryLight }}
                thumbColor={cardForm.isEmailPublic ? colors.primary : colors.textMuted}
              />
            </View>

            <View style={styles.toggleRow}>
              <Text style={styles.toggleLabel}>Rendre le telephone public</Text>
              <Switch
                value={cardForm.isPhonePublic}
                onValueChange={(value) => setCardForm((prev) => ({ ...prev, isPhonePublic: value }))}
                trackColor={{ false: colors.border, true: colors.primaryLight }}
                thumbColor={cardForm.isPhonePublic ? colors.primary : colors.textMuted}
              />
            </View>

            <View style={styles.toggleRow}>
              <Text style={styles.toggleLabel}>Lien public active</Text>
              <Switch
                value={businessCard?.publicEnabled ?? false}
                onValueChange={handleTogglePublicLink}
                trackColor={{ false: colors.border, true: colors.primaryLight }}
                thumbColor={(businessCard?.publicEnabled ?? false) ? colors.primary : colors.textMuted}
                disabled={updateBusinessCardMutation.isPending || disableBusinessCardMutation.isPending}
              />
            </View>

            <TouchableOpacity
              style={[styles.saveButton, updateBusinessCardMutation.isPending && styles.buttonDisabled]}
              onPress={handleSaveBusinessCard}
              disabled={updateBusinessCardMutation.isPending}
            >
              {updateBusinessCardMutation.isPending ? (
                <ActivityIndicator size="small" color={colors.surface} />
              ) : (
                <>
                  <Save size={20} color={colors.surface} />
                  <Text style={styles.saveButtonText}>Enregistrer la carte</Text>
                </>
              )}
            </TouchableOpacity>

            <View style={styles.businessActions}>
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={handleCopyBusinessLink}
                disabled={!publicLink}
              >
                <Text style={styles.secondaryButtonText}>Copier le lien public</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() => setShowQr(true)}
                disabled={!publicLink}
              >
                <Text style={styles.secondaryButtonText}>Afficher mon QR</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={handleRotatePublicLink}
              >
                <Text style={styles.secondaryButtonText}>Regenerer le lien</Text>
              </TouchableOpacity>
            </View>

            {!!publicLink && (
              <Text style={styles.publicLinkText}>{publicLink}</Text>
            )}
          </>
        )}
      </View>

      {/* Admin Section - User Management */}
      {isAdmin?.() && (
        <View style={styles.section}>
          <View style={styles.adminHeader}>
            <Shield size={20} color={colors.primary} />
            <Text style={styles.sectionTitle}>Administration</Text>
          </View>
          
          <Text style={styles.adminSubtitle}>Utilisateurs responsables d'actions</Text>
          <Text style={styles.adminHint}>
            Activez les utilisateurs pouvant être assignés comme responsable d'une action corrective.
          </Text>

          <View style={styles.userList}>
            {allUsers?.filter(u => u.role !== 'CLIENT' && u.role !== 'AUDITOR').map((u) => (
              <View key={u.id} style={styles.userRow}>
                <View style={styles.userInfo}>
                  <Users size={18} color={colors.textMuted} />
                  <View style={styles.userDetails}>
                    <Text style={styles.userNameText}>{u.name}</Text>
                    <Text style={styles.userEmailText}>{u.email}</Text>
                    <Text style={styles.userRoleText}>{getRoleLabel(u.role)}</Text>
                  </View>
                </View>
                <Switch
                  value={u.can_be_responsible}
                  onValueChange={(value) => 
                    toggleResponsibleMutation.mutate({ userId: u.id, canBeResponsible: value })
                  }
                  trackColor={{ false: colors.border, true: colors.primaryLight }}
                  thumbColor={u.can_be_responsible ? colors.primary : colors.textMuted}
                />
              </View>
            ))}
            {(!allUsers || allUsers.filter(u => u.role !== 'CLIENT' && u.role !== 'AUDITOR').length === 0) && (
              <Text style={styles.noUsersMessage}>Aucun utilisateur trouvé</Text>
            )}
          </View>
        </View>
      )}

      {/* Logout Section */}
      <View style={styles.section}>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <LogOut size={20} color={colors.danger} />
          <Text style={styles.logoutButtonText}>Se déconnecter</Text>
        </TouchableOpacity>
      </View>

      <Modal visible={showQr} transparent animationType="fade" onRequestClose={() => setShowQr(false)}>
        <View style={styles.qrOverlay}>
          <View style={styles.qrCard}>
            <Text style={styles.qrTitle}>Mon QR public</Text>
            {publicLink ? <QRCode value={publicLink} size={200} /> : null}
            {publicLink ? <Text style={styles.qrLink}>{publicLink}</Text> : null}
            <TouchableOpacity style={styles.secondaryButton} onPress={() => setShowQr(false)}>
              <Text style={styles.secondaryButtonText}>Fermer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <View style={styles.footer}>
        <Text style={styles.footerText}>In-Spectra v1.0</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xl,
  },
  backButton: {
    padding: spacing.sm,
  },
  editButton: {
    padding: spacing.sm,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  userName: {
    fontSize: 22,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  userRole: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  section: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.lg,
  },
  inputGroup: {
    marginBottom: spacing.md,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  inputDisabled: {
    backgroundColor: colors.surfaceAlt,
  },
  inputIcon: {
    marginLeft: spacing.md,
  },
  input: {
    flex: 1,
    padding: spacing.md,
    fontSize: 16,
    color: colors.text,
  },
  inputTextDisabled: {
    color: colors.textMuted,
  },
  hint: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.surface,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  passwordInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  passwordTextContainer: {
    flex: 1,
  },
  passwordTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  passwordDescription: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.primary,
    gap: spacing.sm,
  },
  resetButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
  },
  businessHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  businessAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  businessAvatarImage: {
    width: '100%',
    height: '100%',
  },
  businessInfo: {
    flex: 1,
  },
  businessName: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  businessJob: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
  },
  toggleLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  businessActions: {
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  secondaryButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  publicLinkText: {
    marginTop: spacing.sm,
    fontSize: 12,
    color: colors.textMuted,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.danger,
    gap: spacing.sm,
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.danger,
  },
  footer: {
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  footerText: {
    fontSize: 12,
    color: colors.textMuted,
  },
  qrOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  qrCard: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    gap: spacing.md,
  },
  qrTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  qrLink: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
  },
  // Admin section styles
  adminHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  adminSubtitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  adminHint: {
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: spacing.md,
  },
  userList: {
    gap: spacing.sm,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
  },
  userDetails: {
    flex: 1,
  },
  userNameText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  userEmailText: {
    fontSize: 12,
    color: colors.textMuted,
  },
  userRoleText: {
    fontSize: 11,
    color: colors.primary,
    fontWeight: '500',
  },
  noUsersMessage: {
    textAlign: 'center',
    color: colors.textMuted,
    fontStyle: 'italic',
    padding: spacing.md,
  },
});
