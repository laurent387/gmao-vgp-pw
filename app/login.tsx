import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Shield } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { colors, spacing, borderRadius, typography } from '@/constants/theme';


export default function LoginScreen() {
  const router = useRouter();
  const { login, isAuthenticated } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/(tabs)');
    }
  }, [isAuthenticated]);

  const handleLogin = async () => {
    if (!email.trim()) {
      setError('Veuillez entrer votre email');
      return;
    }

    setIsLoading(true);
    setError('');

    const success = await login(email.trim(), password);
    
    if (success) {
      router.replace('/(tabs)');
    } else {
      setError('Identifiants incorrects');
    }

    setIsLoading(false);
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
              <Shield size={48} color={colors.primary} />
            </View>
            <Text style={styles.title}>In-Spectra</Text>
            <Text style={styles.subtitle}>VGP & GMAO Terrain</Text>
          </View>

          <View style={styles.form}>
            <Input
              label="Email"
              value={email}
              onChangeText={setEmail}
              placeholder="technicien@inspectra.fr"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />

            <Input
              label="Mot de passe"
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              secureTextEntry
            />

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <Button
              title="Connexion"
              onPress={handleLogin}
              loading={isLoading}
              fullWidth
              style={styles.loginButton}
            />
          </View>

          <View style={styles.demoBox}>
            <Text style={styles.demoTitle}>Comptes de démonstration</Text>
            <Text style={styles.demoCredential}>Technicien: technicien@inspectra.fr</Text>
            <Text style={styles.demoCredential}>HSE Manager: hse@inspectra.fr</Text>
            <Text style={styles.demoNote}>(mot de passe: laisser vide)</Text>
          </View>

          <Text style={styles.hint}>
            Contactez votre administrateur si vous n&apos;avez pas de compte
          </Text>
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
    fontSize: 32,
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
  loginButton: {
    marginTop: spacing.sm,
  },
  hint: {
    marginTop: spacing.lg,
    textAlign: 'center',
    color: colors.textMuted,
    fontSize: typography.caption.fontSize,
  },
  demoBox: {
    marginTop: spacing.xxl,
    padding: spacing.md,
    backgroundColor: colors.primary + '10',
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.primary + '30',
  },
  demoTitle: {
    fontSize: typography.bodySmall.fontSize,
    fontWeight: '600' as const,
    color: colors.primary,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  demoCredential: {
    fontSize: typography.bodySmall.fontSize,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  demoNote: {
    fontSize: typography.caption.fontSize,
    color: colors.textMuted,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
