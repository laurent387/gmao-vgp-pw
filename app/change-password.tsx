import { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { KeyRound } from 'lucide-react-native';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { colors, spacing, borderRadius, typography } from '@/constants/theme';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/contexts/AuthContext';

export default function ChangePasswordScreen() {
  const router = useRouter();
  const { markPasswordChanged } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  const changePasswordMutation = trpc.auth.changePassword.useMutation({
    onSuccess: () => {
      markPasswordChanged();
      Alert.alert('Succès', 'Mot de passe mis à jour', [
        {
          text: 'Continuer',
          onPress: () => router.replace('/(tabs)'),
        },
      ]);
    },
    onError: (e) => {
      setError(e.message || 'Erreur lors de la mise à jour');
    },
  });

  const handleSubmit = () => {
    setError('');
    if (!currentPassword || !newPassword) {
      setError('Tous les champs sont requis');
      return;
    }
    if (newPassword.length < 8) {
      setError('Le nouveau mot de passe doit contenir au moins 8 caractères');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    changePasswordMutation.mutate({
      currentPassword,
      newPassword,
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <KeyRound size={48} color={colors.primary} />
            </View>
            <Text style={styles.title}>Changer le mot de passe</Text>
            <Text style={styles.subtitle}>Veuillez définir un nouveau mot de passe</Text>
          </View>

          <View style={styles.form}>
            <Input
              label="Mot de passe temporaire"
              value={currentPassword}
              onChangeText={setCurrentPassword}
              placeholder="••••••••"
              secureTextEntry
            />

            <Input
              label="Nouveau mot de passe"
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder="••••••••"
              secureTextEntry
            />

            <Input
              label="Confirmer le mot de passe"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="••••••••"
              secureTextEntry
            />

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <Button
              title="Mettre à jour"
              onPress={handleSubmit}
              loading={changePasswordMutation.isPending}
              fullWidth
              style={styles.submitButton}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: spacing.xl,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xxxl,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.xl,
    backgroundColor: colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: 26,
    fontWeight: '700' as const,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: typography.body.fontSize,
    color: colors.textSecondary,
  },
  form: {
    marginBottom: spacing.xl,
  },
  error: {
    color: colors.danger,
    fontSize: typography.bodySmall.fontSize,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  submitButton: {
    marginTop: spacing.sm,
  },
});
