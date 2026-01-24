import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Wrench, Eye, Settings, Edit3 } from 'lucide-react-native';
import { colors, spacing, borderRadius, typography } from '@/constants/theme';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';
import { assetRepository } from '@/repositories/AssetRepository';
import { maintenanceRepository } from '@/repositories/MaintenanceRepository';
import { syncService } from '@/services/SyncService';
import { useAuth } from '@/contexts/AuthContext';
import { Asset, OperationType } from '@/types';

const schema = z.object({
  assetId: z.string().min(1, 'Sélectionnez un équipement'),
  date: z.string().min(1, 'Date requise'),
  operationType: z.enum(['MAINTENANCE', 'INSPECTION', 'REPARATION', 'MODIFICATION']),
  description: z.string().min(10, 'Description trop courte (min 10 caractères)'),
  partsRef: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export default function AddMaintenanceScreen() {
  const { assetId: preselectedAssetId } = useLocalSearchParams<{ assetId?: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { control, handleSubmit, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      assetId: preselectedAssetId || '',
      date: new Date().toISOString().split('T')[0],
      operationType: 'MAINTENANCE',
      description: '',
      partsRef: '',
    },
  });

  const selectedOperationType = watch('operationType');

  const { data: assets } = useQuery<Asset[]>({
    queryKey: ['assets-for-maintenance'],
    queryFn: () => assetRepository.getAllWithDetails(),
    enabled: !preselectedAssetId,
  });

  const { data: selectedAsset } = useQuery<Asset | null>({
    queryKey: ['asset', preselectedAssetId],
    queryFn: () => assetRepository.getByIdWithDetails(preselectedAssetId!),
    enabled: !!preselectedAssetId,
  });

  const createMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const logId = await maintenanceRepository.create({
        asset_id: data.assetId,
        date: new Date(data.date).toISOString(),
        actor: user?.name || 'Utilisateur',
        operation_type: data.operationType as OperationType,
        description: data.description,
        parts_ref: data.partsRef || null,
      });

      await syncService.addToOutbox('CREATE_MAINTENANCE', {
        logId,
        ...data,
        actor: user?.name,
      });

      return logId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['asset-maintenance'] });
      Alert.alert('Succès', 'Entrée de maintenance ajoutée', [
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

  const operationTypes: { type: OperationType; label: string; icon: React.ReactNode }[] = [
    { type: 'MAINTENANCE', label: 'Maintenance', icon: <Wrench size={20} color={selectedOperationType === 'MAINTENANCE' ? colors.primary : colors.textMuted} /> },
    { type: 'INSPECTION', label: 'Inspection', icon: <Eye size={20} color={selectedOperationType === 'INSPECTION' ? colors.primary : colors.textMuted} /> },
    { type: 'REPARATION', label: 'Réparation', icon: <Settings size={20} color={selectedOperationType === 'REPARATION' ? colors.primary : colors.textMuted} /> },
    { type: 'MODIFICATION', label: 'Modification', icon: <Edit3 size={20} color={selectedOperationType === 'MODIFICATION' ? colors.primary : colors.textMuted} /> },
  ];

  return (
    <>
      <Stack.Screen options={{ title: 'Ajouter maintenance' }} />
      
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {selectedAsset ? (
          <View style={styles.assetBanner}>
            <Text style={styles.assetCode}>{selectedAsset.code_interne}</Text>
            <Text style={styles.assetDesignation}>{selectedAsset.designation}</Text>
          </View>
        ) : (
          <View style={styles.section}>
            <Text style={styles.label}>Équipement</Text>
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
                        <Text style={[styles.assetOptionCode, value === asset.id && styles.assetOptionCodeSelected]}>
                          {asset.code_interne}
                        </Text>
                        <Text style={styles.assetOptionDesignation} numberOfLines={1}>
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
        )}

        <View style={styles.section}>
          <Controller
            control={control}
            name="date"
            render={({ field: { onChange, value } }) => (
              <Input
                label="Date de l'opération"
                value={value}
                onChangeText={onChange}
                placeholder="AAAA-MM-JJ"
                error={errors.date?.message}
              />
            )}
          />

          <Text style={styles.label}>Type d'opération</Text>
          <Controller
            control={control}
            name="operationType"
            render={({ field: { onChange, value } }) => (
              <View style={styles.operationGrid}>
                {operationTypes.map((op) => (
                  <TouchableOpacity
                    key={op.type}
                    style={[styles.operationOption, value === op.type && styles.operationOptionSelected]}
                    onPress={() => onChange(op.type)}
                  >
                    {op.icon}
                    <Text style={[
                      styles.operationLabel,
                      value === op.type && styles.operationLabelSelected,
                    ]}>
                      {op.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
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
                placeholder="Décrivez l'opération effectuée..."
                multiline
                numberOfLines={4}
                error={errors.description?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="partsRef"
            render={({ field: { onChange, value } }) => (
              <Input
                label="Pièces/références (optionnel)"
                value={value || ''}
                onChangeText={onChange}
                placeholder="Ex: FIL-HYD-001, HUILE-H46"
              />
            )}
          />
        </View>

        <Button
          title="Enregistrer"
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
  assetBanner: {
    backgroundColor: colors.primary + '10',
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.xl,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  assetCode: {
    fontSize: typography.caption.fontSize,
    fontWeight: '600' as const,
    color: colors.primary,
  },
  assetDesignation: {
    ...typography.h3,
    color: colors.text,
    marginTop: spacing.xs,
  },
  section: {
    marginBottom: spacing.xl,
  },
  label: {
    fontSize: typography.bodySmall.fontSize,
    fontWeight: '500' as const,
    color: colors.text,
    marginBottom: spacing.sm,
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
  assetOptionCode: {
    fontSize: typography.caption.fontSize,
    fontWeight: '600' as const,
    color: colors.textSecondary,
  },
  assetOptionCodeSelected: {
    color: colors.primary,
  },
  assetOptionDesignation: {
    fontSize: typography.bodySmall.fontSize,
    color: colors.text,
    marginTop: spacing.xs,
  },
  operationGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  operationOption: {
    flex: 1,
    minWidth: '45%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  operationOptionSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '10',
  },
  operationLabel: {
    fontSize: typography.bodySmall.fontSize,
    color: colors.textSecondary,
  },
  operationLabelSelected: {
    color: colors.primary,
    fontWeight: '600' as const,
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
