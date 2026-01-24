import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { colors, spacing, borderRadius, typography } from '@/constants/theme';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';
import { assetRepository } from '@/repositories/AssetRepository';
import { ncRepository, actionRepository } from '@/repositories/NCRepository';
import { syncService } from '@/services/SyncService';
import { useAuth } from '@/contexts/AuthContext';
import { Asset, SeverityLevel } from '@/types';

const schema = z.object({
  title: z.string().min(5, 'Titre trop court (min 5 caractères)'),
  description: z.string().min(10, 'Description trop courte (min 10 caractères)'),
  severity: z.number().min(1).max(5),
  assetId: z.string().min(1, 'Sélectionnez un équipement'),
  actionOwner: z.string().optional(),
  actionDueDate: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export default function CreateNCScreen() {
  const { assetId: preselectedAssetId } = useLocalSearchParams<{ assetId?: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { control, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: '',
      description: '',
      severity: 3,
      assetId: preselectedAssetId || '',
      actionOwner: user?.id || '',
      actionDueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    },
  });

  const selectedSeverity = watch('severity');

  const { data: assets } = useQuery<Asset[]>({
    queryKey: ['assets-for-nc'],
    queryFn: () => assetRepository.getAllWithDetails(),
  });

  const createMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const ncId = await ncRepository.create({
        report_id: null,
        asset_id: data.assetId,
        checklist_item_id: null,
        title: data.title,
        description: data.description,
        severity: data.severity as SeverityLevel,
        status: 'OUVERTE',
      });

      if (data.actionOwner && data.actionDueDate) {
        await actionRepository.create({
          nonconformity_id: ncId,
          owner: data.actionOwner,
          description: 'Action corrective à définir',
          due_at: new Date(data.actionDueDate).toISOString(),
          status: 'OUVERTE',
          closed_at: null,
          validated_by: null,
        });
      }

      await syncService.addToOutbox('CREATE_NC', {
        ncId,
        ...data,
      });

      return ncId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nonconformities'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-kpis'] });
      Alert.alert('Succès', 'Non-conformité créée', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    },
    onError: (error) => {
      Alert.alert('Erreur', error instanceof Error ? error.message : 'Erreur lors de la création');
    },
  });

  const onSubmit = (data: FormData) => {
    createMutation.mutate(data);
  };

  const severityLevels: { level: SeverityLevel; label: string; color: string }[] = [
    { level: 1, label: 'Mineur', color: colors.success },
    { level: 2, label: 'Faible', color: colors.info },
    { level: 3, label: 'Moyen', color: colors.warning },
    { level: 4, label: 'Important', color: '#FF6B00' },
    { level: 5, label: 'Critique', color: colors.danger },
  ];

  return (
    <>
      <Stack.Screen options={{ title: 'Nouvelle NC' }} />
      
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Information</Text>

          <Controller
            control={control}
            name="title"
            render={({ field: { onChange, value } }) => (
              <Input
                label="Titre"
                value={value}
                onChangeText={onChange}
                placeholder="Ex: Câbles usés sur chariot CHE-001"
                error={errors.title?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="description"
            render={({ field: { onChange, value } }) => (
              <Input
                label="Description"
                value={value}
                onChangeText={onChange}
                placeholder="Décrivez la non-conformité en détail..."
                multiline
                numberOfLines={4}
                error={errors.description?.message}
              />
            )}
          />

          <Text style={styles.label}>Sévérité</Text>
          <Controller
            control={control}
            name="severity"
            render={({ field: { onChange, value } }) => (
              <View style={styles.severityGrid}>
                {severityLevels.map((item) => (
                  <TouchableOpacity
                    key={item.level}
                    style={[
                      styles.severityOption,
                      { borderColor: item.color },
                      value === item.level && { backgroundColor: item.color + '20' },
                    ]}
                    onPress={() => onChange(item.level)}
                  >
                    <Text style={[
                      styles.severityLevel,
                      { color: item.color },
                    ]}>
                      {item.level}
                    </Text>
                    <Text style={[
                      styles.severityLabel,
                      value === item.level && { color: item.color, fontWeight: '600' as const },
                    ]}>
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          />

          <Text style={styles.label}>Équipement concerné</Text>
          <Controller
            control={control}
            name="assetId"
            render={({ field: { onChange, value } }) => (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.assetsScroll}>
                <View style={styles.assetsGrid}>
                  {assets?.map((asset) => (
                    <TouchableOpacity
                      key={asset.id}
                      style={[styles.assetOption, value === asset.id && styles.assetOptionSelected]}
                      onPress={() => onChange(asset.id)}
                    >
                      <Text style={[styles.assetCode, value === asset.id && styles.assetCodeSelected]}>
                        {asset.code_interne}
                      </Text>
                      <Text style={styles.assetDesignation} numberOfLines={1}>
                        {asset.designation}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            )}
          />
          {errors.assetId && (
            <Text style={styles.error}>{errors.assetId.message}</Text>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Action corrective (optionnel)</Text>

          <Controller
            control={control}
            name="actionDueDate"
            render={({ field: { onChange, value } }) => (
              <Input
                label="Échéance"
                value={value || ''}
                onChangeText={onChange}
                placeholder="AAAA-MM-JJ"
              />
            )}
          />
        </View>

        <Button
          title="Créer la non-conformité"
          onPress={handleSubmit(onSubmit)}
          loading={createMutation.isPending}
          fullWidth
          style={styles.submitButton}
        />
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.md,
  },
  label: {
    fontSize: typography.bodySmall.fontSize,
    fontWeight: '500' as const,
    color: colors.text,
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },
  severityGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  severityOption: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 2,
    alignItems: 'center',
    minWidth: 60,
  },
  severityLevel: {
    fontSize: 18,
    fontWeight: '700' as const,
  },
  severityLabel: {
    fontSize: typography.caption.fontSize,
    color: colors.textSecondary,
  },
  assetsScroll: {
    marginHorizontal: -spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  assetsGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingRight: spacing.lg,
  },
  assetOption: {
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    minWidth: 140,
  },
  assetOptionSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '10',
  },
  assetCode: {
    fontSize: typography.caption.fontSize,
    fontWeight: '600' as const,
    color: colors.textSecondary,
  },
  assetCodeSelected: {
    color: colors.primary,
  },
  assetDesignation: {
    fontSize: typography.bodySmall.fontSize,
    color: colors.text,
    marginTop: spacing.xs,
  },
  error: {
    fontSize: typography.caption.fontSize,
    color: colors.danger,
    marginTop: spacing.xs,
  },
  submitButton: {
    marginTop: spacing.lg,
    marginBottom: spacing.xxl,
  },
});
