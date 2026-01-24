import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, Alert } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, User, Calendar, CheckCircle, ArrowRight } from 'lucide-react-native';
import { colors, spacing, borderRadius, typography, shadows } from '@/constants/theme';
import { StatusBadge, CriticalityBadge } from '@/components/Badge';
import { SectionCard } from '@/components/Card';
import { Button } from '@/components/Button';
import { EmptyState, LoadingState } from '@/components/EmptyState';
import { ncRepository, actionRepository } from '@/repositories/NCRepository';
import { syncService } from '@/services/SyncService';
import { useAuth } from '@/contexts/AuthContext';
import { NonConformity, ActionStatus } from '@/types';

export default function NCDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, canValidate, canEdit } = useAuth();
  const [refreshing, setRefreshing] = useState(false);

  const { data: nc, isLoading, refetch } = useQuery<NonConformity | null>({
    queryKey: ['nc', id],
    queryFn: () => ncRepository.getByIdWithAction(id!),
    enabled: !!id,
  });

  const updateActionMutation = useMutation({
    mutationFn: async (newStatus: ActionStatus) => {
      if (!nc?.corrective_action) throw new Error('Pas d\'action corrective');
      
      await actionRepository.updateStatus(
        nc.corrective_action.id,
        newStatus,
        newStatus === 'VALIDEE' ? user?.id : undefined
      );

      if (newStatus === 'CLOTUREE' || newStatus === 'VALIDEE') {
        await ncRepository.updateStatus(id!, 'CLOTUREE');
      }

      await syncService.addToOutbox('UPDATE_ACTION', {
        actionId: nc.corrective_action.id,
        status: newStatus,
        ncId: id,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nc', id] });
      queryClient.invalidateQueries({ queryKey: ['nonconformities'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-kpis'] });
      Alert.alert('Succès', 'Action mise à jour');
    },
    onError: (error) => {
      Alert.alert('Erreur', error instanceof Error ? error.message : 'Erreur');
    },
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  if (isLoading) {
    return <LoadingState message="Chargement..." />;
  }

  if (!nc) {
    return (
      <EmptyState
        title="NC non trouvée"
        message="Cette non-conformité n'existe pas"
      />
    );
  }

  const formatDate = (date: string | null) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const action = nc.corrective_action;
  const canProgress = canEdit() && action;
  const canClose = canProgress && action?.status === 'EN_COURS';
  const canValidateAction = canValidate() && action?.status === 'CLOTUREE';

  const getNextActionButton = () => {
    if (!action) return null;
    
    switch (action.status) {
      case 'OUVERTE':
        return canProgress ? (
          <Button
            title="Démarrer l'action"
            onPress={() => updateActionMutation.mutate('EN_COURS')}
            loading={updateActionMutation.isPending}
            icon={<ArrowRight size={18} color={colors.textInverse} />}
            fullWidth
          />
        ) : null;
      case 'EN_COURS':
        return canClose ? (
          <Button
            title="Clôturer l'action"
            onPress={() => updateActionMutation.mutate('CLOTUREE')}
            loading={updateActionMutation.isPending}
            icon={<CheckCircle size={18} color={colors.textInverse} />}
            fullWidth
          />
        ) : null;
      case 'CLOTUREE':
        return canValidateAction ? (
          <Button
            title="Valider la clôture"
            onPress={() => updateActionMutation.mutate('VALIDEE')}
            loading={updateActionMutation.isPending}
            variant="secondary"
            icon={<CheckCircle size={18} color={colors.textInverse} />}
            fullWidth
          />
        ) : null;
      default:
        return null;
    }
  };

  return (
    <>
      <Stack.Screen options={{ title: 'Non-conformité' }} />
      
      <ScrollView 
        style={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <AlertTriangle size={24} color={colors.danger} />
            <CriticalityBadge level={nc.severity} />
            <StatusBadge status={nc.status} />
          </View>
          <Text style={styles.title}>{nc.title}</Text>
          {(nc as any).asset_code && (
            <Text style={styles.assetInfo}>
              Équipement: {(nc as any).asset_code} - {(nc as any).asset_designation}
            </Text>
          )}
          <Text style={styles.date}>Créée le {formatDate(nc.created_at)}</Text>
        </View>

        <View style={styles.content}>
          <SectionCard title="Description">
            <Text style={styles.description}>
              {nc.description || 'Aucune description'}
            </Text>
          </SectionCard>

          {action && (
            <SectionCard title="Action corrective">
              <View style={styles.actionHeader}>
                <StatusBadge status={action.status} />
                {action.due_at && new Date(action.due_at) < new Date() && action.status !== 'VALIDEE' && (
                  <View style={styles.overdueBadge}>
                    <Text style={styles.overdueText}>En retard</Text>
                  </View>
                )}
              </View>

              <View style={styles.infoRow}>
                <User size={16} color={colors.textMuted} />
                <Text style={styles.infoLabel}>Responsable:</Text>
                <Text style={styles.infoValue}>{action.owner}</Text>
              </View>

              <View style={styles.infoRow}>
                <Calendar size={16} color={colors.textMuted} />
                <Text style={styles.infoLabel}>Échéance:</Text>
                <Text style={[
                  styles.infoValue,
                  action.due_at && new Date(action.due_at) < new Date() && action.status !== 'VALIDEE' && styles.overdueValue
                ]}>
                  {formatDate(action.due_at)}
                </Text>
              </View>

              {action.description && (
                <Text style={styles.actionDescription}>{action.description}</Text>
              )}

              {action.closed_at && (
                <View style={styles.infoRow}>
                  <CheckCircle size={16} color={colors.success} />
                  <Text style={styles.infoLabel}>Clôturée le:</Text>
                  <Text style={styles.infoValue}>{formatDate(action.closed_at)}</Text>
                </View>
              )}

              {action.validated_by && (
                <View style={styles.infoRow}>
                  <CheckCircle size={16} color={colors.success} />
                  <Text style={styles.infoLabel}>Validée par:</Text>
                  <Text style={styles.infoValue}>{action.validated_by}</Text>
                </View>
              )}

              <View style={styles.actionButtons}>
                {getNextActionButton()}
              </View>
            </SectionCard>
          )}

          {!action && canEdit() && (
            <View style={styles.noAction}>
              <Text style={styles.noActionText}>Aucune action corrective définie</Text>
              <Button
                title="Créer une action"
                onPress={() => {}}
                variant="outline"
              />
            </View>
          )}
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  title: {
    ...typography.h2,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  assetInfo: {
    fontSize: typography.bodySmall.fontSize,
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  date: {
    fontSize: typography.caption.fontSize,
    color: colors.textMuted,
  },
  content: {
    padding: spacing.lg,
    gap: spacing.lg,
  },
  description: {
    fontSize: typography.body.fontSize,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  actionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  overdueBadge: {
    backgroundColor: colors.dangerLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  overdueText: {
    fontSize: typography.caption.fontSize,
    fontWeight: '600' as const,
    color: colors.danger,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  infoLabel: {
    fontSize: typography.bodySmall.fontSize,
    color: colors.textMuted,
  },
  infoValue: {
    fontSize: typography.bodySmall.fontSize,
    fontWeight: '500' as const,
    color: colors.text,
  },
  overdueValue: {
    color: colors.danger,
  },
  actionDescription: {
    fontSize: typography.bodySmall.fontSize,
    color: colors.textSecondary,
    marginVertical: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  actionButtons: {
    marginTop: spacing.lg,
    gap: spacing.md,
  },
  noAction: {
    alignItems: 'center',
    padding: spacing.xl,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    ...shadows.sm,
  },
  noActionText: {
    fontSize: typography.body.fontSize,
    color: colors.textMuted,
    marginBottom: spacing.md,
  },
});
