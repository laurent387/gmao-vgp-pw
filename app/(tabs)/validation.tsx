import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  CheckCircle, XCircle, Clock, AlertTriangle, 
  ChevronRight, Filter, CheckSquare
} from 'lucide-react-native';
import { colors, spacing, borderRadius, typography, shadows } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { ncRepository, actionRepository } from '@/repositories/NCRepository';
import { NonConformity, CorrectiveAction } from '@/types';

type FilterType = 'all' | 'nc' | 'actions';

interface ActionWithNC extends CorrectiveAction {
  nc?: NonConformity;
}

export default function ValidationScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, canValidate } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<FilterType>('all');

  const { data: pendingNCs, refetch: refetchNCs } = useQuery<NonConformity[]>({
    queryKey: ['pending-ncs-validation'],
    queryFn: async () => {
      const openNCs = await ncRepository.getByStatus('OUVERTE');
      const inProgressNCs = await ncRepository.getByStatus('EN_COURS');
      return [...openNCs, ...inProgressNCs];
    },
  });

  const { data: pendingActions, refetch: refetchActions } = useQuery<ActionWithNC[]>({
    queryKey: ['pending-actions-validation'],
    queryFn: async () => {
      const openActions = await actionRepository.getByStatus('OUVERTE');
      const inProgressActions = await actionRepository.getByStatus('EN_COURS');
      return [...openActions, ...inProgressActions];
    },
  });

  const validateActionMutation = useMutation({
    mutationFn: async (actionId: string) => {
      await actionRepository.update(actionId, {
        status: 'VALIDEE',
        closed_at: new Date().toISOString(),
        validated_by: user?.id || '',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-actions-validation'] });
      queryClient.invalidateQueries({ queryKey: ['manager-stats'] });
      Alert.alert('Succès', 'Action validée avec succès');
    },
    onError: () => {
      Alert.alert('Erreur', 'Impossible de valider l\'action');
    },
  });

  const closeNCMutation = useMutation({
    mutationFn: async (ncId: string) => {
      await ncRepository.update(ncId, { status: 'CLOTUREE' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-ncs-validation'] });
      queryClient.invalidateQueries({ queryKey: ['manager-stats'] });
      Alert.alert('Succès', 'Non-conformité clôturée');
    },
    onError: () => {
      Alert.alert('Erreur', 'Impossible de clôturer la NC');
    },
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetchNCs(), refetchActions()]);
    setRefreshing(false);
  }, []);

  const handleValidateAction = (actionId: string) => {
    Alert.alert(
      'Valider l\'action',
      'Êtes-vous sûr de vouloir valider cette action corrective ?',
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Valider', onPress: () => validateActionMutation.mutate(actionId) },
      ]
    );
  };

  const handleCloseNC = (ncId: string) => {
    Alert.alert(
      'Clôturer la NC',
      'Êtes-vous sûr de vouloir clôturer cette non-conformité ?',
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Clôturer', onPress: () => closeNCMutation.mutate(ncId) },
      ]
    );
  };

  const filteredNCs = filter === 'actions' ? [] : (pendingNCs || []);
  const filteredActions = filter === 'nc' ? [] : (pendingActions || []);

  const totalPending = (pendingNCs?.length || 0) + (pendingActions?.length || 0);

  if (!canValidate()) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.noAccessContainer}>
          <AlertTriangle size={48} color={colors.warning} />
          <Text style={styles.noAccessTitle}>Accès restreint</Text>
          <Text style={styles.noAccessText}>
            Cette fonctionnalité est réservée aux managers et administrateurs.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Validation</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{totalPending}</Text>
        </View>
      </View>

      <View style={styles.filters}>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'all' && styles.filterButtonActive]}
          onPress={() => setFilter('all')}
        >
          <Filter size={16} color={filter === 'all' ? colors.textInverse : colors.text} />
          <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>Tout</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'nc' && styles.filterButtonActive]}
          onPress={() => setFilter('nc')}
        >
          <AlertTriangle size={16} color={filter === 'nc' ? colors.textInverse : colors.text} />
          <Text style={[styles.filterText, filter === 'nc' && styles.filterTextActive]}>
            NC ({pendingNCs?.length || 0})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'actions' && styles.filterButtonActive]}
          onPress={() => setFilter('actions')}
        >
          <CheckSquare size={16} color={filter === 'actions' ? colors.textInverse : colors.text} />
          <Text style={[styles.filterText, filter === 'actions' && styles.filterTextActive]}>
            Actions ({pendingActions?.length || 0})
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {filteredNCs.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Non-conformités à traiter</Text>
            {filteredNCs.map((nc) => (
              <View key={nc.id} style={styles.itemCard}>
                <TouchableOpacity
                  style={styles.itemContent}
                  onPress={() => router.push(`/nc/${nc.id}`)}
                >
                  <View style={styles.itemHeader}>
                    <View style={[styles.severityBadge, getSeverityStyle(nc.severity)]}>
                      <Text style={styles.severityText}>S{nc.severity}</Text>
                    </View>
                    <Text style={styles.itemTitle} numberOfLines={1}>{nc.title}</Text>
                  </View>
                  <Text style={styles.itemSubtitle}>{nc.asset?.designation || 'Équipement'}</Text>
                  <View style={styles.itemFooter}>
                    <View style={[styles.statusBadge, getNCStatusStyle(nc.status)]}>
                      <Text style={[styles.statusText, getNCStatusTextStyle(nc.status)]}>
                        {nc.status === 'OUVERTE' ? 'Ouverte' : 'En cours'}
                      </Text>
                    </View>
                    <Text style={styles.itemDate}>
                      {new Date(nc.created_at).toLocaleDateString('fr-FR')}
                    </Text>
                  </View>
                </TouchableOpacity>
                <View style={styles.itemActions}>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => router.push(`/nc/${nc.id}`)}
                  >
                    <ChevronRight size={20} color={colors.primary} />
                  </TouchableOpacity>
                  {nc.status === 'EN_COURS' && (
                    <TouchableOpacity
                      style={[styles.actionButton, styles.validateButton]}
                      onPress={() => handleCloseNC(nc.id)}
                    >
                      <CheckCircle size={20} color={colors.success} />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}

        {filteredActions.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Actions correctives à valider</Text>
            {filteredActions.map((action) => (
              <View key={action.id} style={styles.itemCard}>
                <TouchableOpacity
                  style={styles.itemContent}
                  onPress={() => action.nonconformity_id && router.push(`/nc/${action.nonconformity_id}`)}
                >
                  <View style={styles.itemHeader}>
                    <Clock size={16} color={colors.warning} />
                    <Text style={styles.itemTitle} numberOfLines={1}>
                      {action.description || 'Action corrective'}
                    </Text>
                  </View>
                  <Text style={styles.itemSubtitle}>Responsable: {action.owner}</Text>
                  <View style={styles.itemFooter}>
                    <View style={[styles.statusBadge, getActionStatusStyle(action.status)]}>
                      <Text style={[styles.statusText, getActionStatusTextStyle(action.status)]}>
                        {action.status === 'OUVERTE' ? 'Ouverte' : 'En cours'}
                      </Text>
                    </View>
                    <Text style={[
                      styles.itemDate,
                      isOverdue(action.due_at) && styles.overdueText
                    ]}>
                      Échéance: {new Date(action.due_at).toLocaleDateString('fr-FR')}
                    </Text>
                  </View>
                </TouchableOpacity>
                <View style={styles.itemActions}>
                  {action.status === 'EN_COURS' && (
                    <TouchableOpacity
                      style={[styles.actionButton, styles.validateButton]}
                      onPress={() => handleValidateAction(action.id)}
                    >
                      <CheckCircle size={20} color={colors.success} />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}

        {filteredNCs.length === 0 && filteredActions.length === 0 && (
          <View style={styles.emptyState}>
            <CheckCircle size={48} color={colors.success} />
            <Text style={styles.emptyStateTitle}>Tout est à jour !</Text>
            <Text style={styles.emptyStateText}>
              Aucun élément en attente de validation
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function isOverdue(dateStr: string): boolean {
  return new Date(dateStr) < new Date();
}

function getSeverityStyle(severity: number) {
  if (severity >= 4) return { backgroundColor: colors.danger };
  if (severity >= 3) return { backgroundColor: colors.warning };
  return { backgroundColor: colors.primary };
}

function getNCStatusStyle(status: string) {
  return status === 'OUVERTE' 
    ? { backgroundColor: colors.danger + '20' }
    : { backgroundColor: colors.warning + '20' };
}

function getNCStatusTextStyle(status: string) {
  return status === 'OUVERTE'
    ? { color: colors.danger }
    : { color: colors.warning };
}

function getActionStatusStyle(status: string) {
  return status === 'OUVERTE'
    ? { backgroundColor: colors.danger + '20' }
    : { backgroundColor: colors.warning + '20' };
}

function getActionStatusTextStyle(status: string) {
  return status === 'OUVERTE'
    ? { color: colors.danger }
    : { color: colors.warning };
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
  title: {
    ...typography.h2,
    color: colors.text,
  },
  badge: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  badgeText: {
    color: colors.textInverse,
    fontSize: typography.bodySmall.fontSize,
    fontWeight: '600' as const,
  },
  filters: {
    flexDirection: 'row',
    padding: spacing.md,
    gap: spacing.sm,
    backgroundColor: colors.surface,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.background,
  },
  filterButtonActive: {
    backgroundColor: colors.primary,
  },
  filterText: {
    fontSize: typography.bodySmall.fontSize,
    color: colors.text,
    fontWeight: '500' as const,
  },
  filterTextActive: {
    color: colors.textInverse,
  },
  scrollContent: {
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
  itemCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
    flexDirection: 'row',
    ...shadows.sm,
  },
  itemContent: {
    flex: 1,
    padding: spacing.lg,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  severityBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  severityText: {
    fontSize: typography.caption.fontSize,
    fontWeight: '600' as const,
    color: colors.textInverse,
  },
  itemTitle: {
    fontSize: typography.body.fontSize,
    fontWeight: '500' as const,
    color: colors.text,
    flex: 1,
  },
  itemSubtitle: {
    fontSize: typography.bodySmall.fontSize,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  itemFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  statusText: {
    fontSize: typography.caption.fontSize,
    fontWeight: '500' as const,
  },
  itemDate: {
    fontSize: typography.caption.fontSize,
    color: colors.textMuted,
  },
  overdueText: {
    color: colors.danger,
    fontWeight: '500' as const,
  },
  itemActions: {
    justifyContent: 'center',
    paddingRight: spacing.md,
    gap: spacing.sm,
  },
  actionButton: {
    padding: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.background,
  },
  validateButton: {
    backgroundColor: colors.success + '15',
  },
  emptyState: {
    alignItems: 'center',
    padding: spacing.xxxl,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
  },
  emptyStateTitle: {
    ...typography.h3,
    color: colors.text,
    marginTop: spacing.lg,
  },
  emptyStateText: {
    fontSize: typography.body.fontSize,
    color: colors.textSecondary,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  noAccessContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xxxl,
  },
  noAccessTitle: {
    ...typography.h2,
    color: colors.text,
    marginTop: spacing.lg,
  },
  noAccessText: {
    fontSize: typography.body.fontSize,
    color: colors.textSecondary,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
});
