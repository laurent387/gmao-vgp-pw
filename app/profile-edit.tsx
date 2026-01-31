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
  KeyboardAvoidingView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Save, AlertCircle } from 'lucide-react-native';
import { colors, spacing, borderRadius, typography } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/Button';

export default function ProfileEditScreen() {
  const router = useRouter();
  const { user } = useAuth();

  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const updateProfileMutation = trpc.auth.updateProfile.useMutation();

  useEffect(() => {
    if (user) {
      setName(user.name);
      setEmail(user.email);
    }
  }, [user]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = 'Le nom est requis';
    }

    if (name.trim().length < 2) {
      newErrors.name = 'Le nom doit contenir au moins 2 caractères';
    }

    if (!email.trim()) {
      newErrors.email = 'L\'adresse email est requise';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (email && !emailRegex.test(email)) {
      newErrors.email = 'Format d\'adresse email invalide';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    setIsSaving(true);
    try {
      await updateProfileMutation.mutateAsync({ name: name.trim() });
      Alert.alert('Succès', 'Votre profil a été mis à jour avec succès', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error: any) {
      Alert.alert('Erreur', error?.message || 'Impossible de mettre à jour le profil');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (name !== user?.name) {
      Alert.alert(
        'Abandonner les modifications',
        'Les modifications non sauvegardées seront perdues.',
        [
          { text: 'Continuer la modification', style: 'cancel' },
          { text: 'Quitter', style: 'destructive', onPress: () => router.back() },
        ]
      );
    } else {
      router.back();
    }
  };

  const getFieldError = (field: string) => touched[field] ? errors[field] : undefined;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={handleCancel} style={styles.backButton}>
          <ArrowLeft size={24} color={colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Modifier le profil</Text>
        <TouchableOpacity
          onPress={handleSave}
          disabled={isSaving}
          style={styles.saveButton}
        >
          {isSaving ? (
            <ActivityIndicator size={24} color={colors.primary} />
          ) : (
            <Save size={24} color={colors.primary} />
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Name Field */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Nom complet *</Text>
          <TextInput
            style={[
              styles.input,
              getFieldError('name') && styles.inputError,
            ]}
            placeholder="Votre nom"
            value={name}
            onChangeText={setName}
            onBlur={() => setTouched({ ...touched, name: true })}
            placeholderTextColor={colors.textMuted}
            editable={!isSaving}
          />
          {getFieldError('name') && (
            <View style={styles.errorContainer}>
              <AlertCircle size={16} color={colors.danger} />
              <Text style={styles.errorText}>{getFieldError('name')}</Text>
            </View>
          )}
        </View>

        {/* Email Field (Read-only) */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Adresse email (lecture seule)</Text>
          <View style={styles.readOnlyContainer}>
            <Text style={styles.readOnlyText}>{email}</Text>
          </View>
          <Text style={styles.helpText}>
            Pour modifier votre email, contactez un administrateur.
          </Text>
        </View>

        {/* Role Info */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Rôle</Text>
          <View style={styles.readOnlyContainer}>
            <Text style={styles.readOnlyText}>{user?.role}</Text>
          </View>
          <Text style={styles.helpText}>
            Les rôles sont gérés par un administrateur.
          </Text>
        </View>

        {/* Actions */}
        <View style={styles.actionContainer}>
          <Button
            title={isSaving ? 'Enregistrement...' : 'Enregistrer les modifications'}
            onPress={handleSave}
            disabled={isSaving || name === user?.name}
            loading={isSaving}
            fullWidth
            icon={<Save size={18} color={colors.textInverse} />}
          />

          <Button
            title="Annuler"
            onPress={handleCancel}
            variant="outline"
            fullWidth
            style={styles.cancelButton}
          />
        </View>

        {/* Info Section */}
        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>Information</Text>
          <Text style={styles.infoText}>
            • Les modifications de profil sont sauvegardées immédiatement.
          </Text>
          <Text style={styles.infoText}>
            • Pour changer votre mot de passe, retournez à votre profil.
          </Text>
          <Text style={styles.infoText}>
            • Pour modifier l'email ou le rôle, contactez un administrateur.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    ...typography.heading2,
    textAlign: 'center',
    flex: 1,
  },
  backButton: {
    padding: spacing.sm,
    marginRight: spacing.md,
  },
  saveButton: {
    padding: spacing.sm,
    marginLeft: spacing.md,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  fieldGroup: {
    marginBottom: spacing.xl,
  },
  label: {
    ...typography.body,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.md,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: 16,
    color: colors.text,
    backgroundColor: colors.surface,
    minHeight: 44,
  },
  inputError: {
    borderColor: colors.danger,
    backgroundColor: colors.dangerLight,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  errorText: {
    ...typography.caption,
    color: colors.danger,
    marginLeft: spacing.sm,
  },
  readOnlyContainer: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: colors.surfaceAlt,
    minHeight: 44,
    justifyContent: 'center',
  },
  readOnlyText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  helpText: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: spacing.sm,
    fontStyle: 'italic',
  },
  actionContainer: {
    marginVertical: spacing.xl,
    gap: spacing.md,
  },
  cancelButton: {
    marginTop: spacing.md,
  },
  infoSection: {
    backgroundColor: colors.infoLight,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    marginTop: spacing.lg,
    marginBottom: spacing.xl,
  },
  infoTitle: {
    ...typography.body,
    fontWeight: '600',
    color: colors.info,
    marginBottom: spacing.md,
  },
  infoText: {
    ...typography.caption,
    color: colors.info,
    marginBottom: spacing.sm,
    lineHeight: 20,
  },
});
