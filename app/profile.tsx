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
} from 'react-native';
import { useRouter } from 'expo-router';
import { User, Mail, Lock, LogOut, Save, ArrowLeft, Send, Pencil } from 'lucide-react-native';
import { colors, spacing, borderRadius } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { trpc } from '@/lib/trpc';
import { useNavigation } from '@/lib/navigation';
import { trackEvent } from '@/lib/analytics';

export default function ProfileScreen() {
  const router = useRouter();
  const nav = useNavigation();
  const { user, logout } = useAuth();

  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [isSaving, setIsSaving] = useState(false);
  const [isSendingReset, setIsSendingReset] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const updateProfileMutation = trpc.auth.updateProfile.useMutation();
  const requestPasswordResetMutation = trpc.auth.requestPasswordReset.useMutation();

  useEffect(() => {
    if (user) {
      setName(user.name);
      setEmail(user.email);
    }
  }, [user]);

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

      {/* Logout Section */}
      <View style={styles.section}>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <LogOut size={20} color={colors.danger} />
          <Text style={styles.logoutButtonText}>Se déconnecter</Text>
        </TouchableOpacity>
      </View>

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
});
