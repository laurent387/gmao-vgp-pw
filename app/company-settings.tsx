import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { ArrowLeft, Building2, Save } from 'lucide-react-native';
import { useMutation, useQuery } from '@tanstack/react-query';
import { colors, spacing, borderRadius, typography } from '@/constants/theme';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { useAuth } from '@/contexts/AuthContext';
import { CompanySettings } from '@/types';

const emptyCompany: CompanySettings = {
  companyName: '',
  companyLogoUrl: '',
  websiteUrl: '',
  addressLine1: '',
  addressLine2: '',
  postalCode: '',
  city: '',
  country: '',
  phone: '',
  email: '',
  legalName: '',
  siret: '',
  primaryColor: '',
};

const mapCompanyPayload = (payload: any): CompanySettings => ({
  companyName: payload?.company_name ?? payload?.companyName ?? '',
  companyLogoUrl: payload?.company_logo_url ?? payload?.companyLogoUrl ?? '',
  websiteUrl: payload?.website_url ?? payload?.websiteUrl ?? '',
  addressLine1: payload?.address_line1 ?? payload?.addressLine1 ?? '',
  addressLine2: payload?.address_line2 ?? payload?.addressLine2 ?? '',
  postalCode: payload?.postal_code ?? payload?.postalCode ?? '',
  city: payload?.city ?? '',
  country: payload?.country ?? '',
  phone: payload?.phone ?? '',
  email: payload?.email ?? '',
  legalName: payload?.legal_name ?? payload?.legalName ?? '',
  siret: payload?.siret ?? '',
  primaryColor: payload?.primary_color ?? payload?.primaryColor ?? '',
});

export default function CompanySettingsScreen() {
  const router = useRouter();
  const { hasPermission } = useAuth();
  const isAdmin = hasPermission(['ADMIN']);

  const [form, setForm] = useState<CompanySettings>(emptyCompany);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['company-settings'],
    queryFn: async () => {
      const { getCompanySettings } = await import('@/app/api');
      const response = await getCompanySettings();
      return response.data;
    },
    enabled: isAdmin,
  });

  useEffect(() => {
    if (data) {
      setForm(mapCompanyPayload(data));
    }
  }, [data]);

  const updateMutation = useMutation({
    mutationFn: async () => {
      const { updateCompanySettings } = await import('@/app/api');
      const payload = {
        companyName: form.companyName,
        companyLogoUrl: form.companyLogoUrl || null,
        websiteUrl: form.websiteUrl || null,
        addressLine1: form.addressLine1 || null,
        addressLine2: form.addressLine2 || null,
        postalCode: form.postalCode || null,
        city: form.city || null,
        country: form.country || null,
        phone: form.phone || null,
        email: form.email || null,
        legalName: form.legalName || null,
        siret: form.siret || null,
        primaryColor: form.primaryColor || null,
      };
      const response = await updateCompanySettings(payload);
      return response.data;
    },
    onSuccess: async () => {
      await refetch();
      Alert.alert('Succès', "Les informations de l'entreprise ont été mises à jour.");
    },
    onError: (error: any) => {
      Alert.alert('Erreur', error?.message || 'Impossible de mettre à jour');
    },
  });

  if (!isAdmin) {
    return (
      <View style={styles.container}>
        <View style={styles.accessDenied}>
          <Text style={styles.accessDeniedText}>Accès réservé aux administrateurs</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Entreprise</Text>
        <View style={styles.headerSpacer} />
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.sectionHeader}>
            <Building2 size={22} color={colors.primary} />
            <Text style={styles.sectionTitle}>Identite visuelle</Text>
          </View>

          <Input
            label="Nom de l'entreprise"
            value={form.companyName}
            onChangeText={(value) => setForm((prev) => ({ ...prev, companyName: value }))}
            placeholder="In-Spectra"
          />

          <Input
            label="Logo (URL)"
            value={form.companyLogoUrl || ''}
            onChangeText={(value) => setForm((prev) => ({ ...prev, companyLogoUrl: value }))}
            placeholder="https://..."
            autoCapitalize="none"
          />

          {form.companyLogoUrl ? (
            <View style={styles.logoPreview}>
              <Image source={{ uri: form.companyLogoUrl }} style={styles.logoImage} contentFit="contain" />
            </View>
          ) : null}

          <Input
            label="Site web"
            value={form.websiteUrl || ''}
            onChangeText={(value) => setForm((prev) => ({ ...prev, websiteUrl: value }))}
            placeholder="https://..."
            autoCapitalize="none"
          />

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Coordonnees</Text>
          </View>

          <Input
            label="Adresse"
            value={form.addressLine1 || ''}
            onChangeText={(value) => setForm((prev) => ({ ...prev, addressLine1: value }))}
            placeholder="Adresse principale"
          />

          <Input
            label="Complement d'adresse"
            value={form.addressLine2 || ''}
            onChangeText={(value) => setForm((prev) => ({ ...prev, addressLine2: value }))}
            placeholder="Batiment, etage"
          />

          <View style={styles.row}>
            <Input
              label="Code postal"
              value={form.postalCode || ''}
              onChangeText={(value) => setForm((prev) => ({ ...prev, postalCode: value }))}
              placeholder="75000"
              containerStyle={styles.rowItem}
            />
            <Input
              label="Ville"
              value={form.city || ''}
              onChangeText={(value) => setForm((prev) => ({ ...prev, city: value }))}
              placeholder="Paris"
              containerStyle={styles.rowItem}
            />
          </View>

          <Input
            label="Pays"
            value={form.country || ''}
            onChangeText={(value) => setForm((prev) => ({ ...prev, country: value }))}
            placeholder="France"
          />

          <Input
            label="Telephone"
            value={form.phone || ''}
            onChangeText={(value) => setForm((prev) => ({ ...prev, phone: value }))}
            placeholder="+33..."
            keyboardType="phone-pad"
          />

          <Input
            label="Email"
            value={form.email || ''}
            onChangeText={(value) => setForm((prev) => ({ ...prev, email: value }))}
            placeholder="contact@..."
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Informations legales</Text>
          </View>

          <Input
            label="Raison sociale"
            value={form.legalName || ''}
            onChangeText={(value) => setForm((prev) => ({ ...prev, legalName: value }))}
            placeholder="Nom legal"
          />

          <Input
            label="SIRET"
            value={form.siret || ''}
            onChangeText={(value) => setForm((prev) => ({ ...prev, siret: value }))}
            placeholder="123 456 789 00000"
          />

          <Input
            label="Couleur principale (hex)"
            value={form.primaryColor || ''}
            onChangeText={(value) => setForm((prev) => ({ ...prev, primaryColor: value }))}
            placeholder="#1b4d3e"
            autoCapitalize="none"
          />

          <Button
            title={updateMutation.isPending ? 'Enregistrement...' : 'Enregistrer'}
            onPress={() => updateMutation.mutate()}
            loading={updateMutation.isPending}
            icon={<Save size={18} color={colors.textInverse} />}
            fullWidth
          />
        </ScrollView>
      )}
    </View>
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
    padding: spacing.lg,
  },
  backButton: {
    padding: spacing.sm,
  },
  headerSpacer: {
    width: 32,
  },
  title: {
    ...typography.h3,
    color: colors.text,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
    marginTop: spacing.sm,
  },
  sectionTitle: {
    ...typography.h4,
    color: colors.text,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  rowItem: {
    flex: 1,
  },
  logoPreview: {
    marginBottom: spacing.lg,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surface,
    alignItems: 'center',
  },
  logoImage: {
    width: 160,
    height: 80,
  },
  accessDenied: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  accessDeniedText: {
    ...typography.body,
    color: colors.textMuted,
  },
});
