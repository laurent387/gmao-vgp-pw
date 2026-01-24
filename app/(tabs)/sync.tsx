import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, Alert } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { RefreshCw, Check, AlertCircle, Clock, Trash2, RotateCcw } from 'lucide-react-native';
import { colors, spacing, borderRadius, typography, shadows } from '@/constants/theme';
import { Button } from '@/components/Button';
import { StatusBadge } from '@/components/Badge';
import { EmptyState, LoadingState } from '@/components/EmptyState';
import { Card } from '@/components/Card';
import { syncService, SyncResult } from '@/services/SyncService';
import { OutboxItem } from '@/types';

export default function SyncScreen() {
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);

  const { data: outboxItems, isLoading, refetch } = useQuery<OutboxItem[]>({
    queryKey: ['outbox'],
    queryFn: () => syncService.getOutboxItems(),
  });

  const { data: pendingCount } = useQuery<number>({
    queryKey: ['outbox-pending-count'],
    queryFn: () => syncService.getPendingCount(),
  });

  const syncMutation = useMutation<SyncResult>({
    mutationFn: () => syncService.sync(),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['outbox'] });
      queryClient.invalidateQueries({ queryKey: ['outbox-pending-count'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-kpis'] });
      
      if (result.success) {
        Alert.alert('Synchronisation réussie', `${result.processed} élément(s) synchronisé(s)`);
      } else if (result.failed > 0) {
        Alert.alert(
          'Synchronisation partielle',
          `${result.processed} réussi(s), ${result.failed} échec(s)\n\n${result.errors.join('\n')}`
        );
      }
    },
    onError: (error) => {
      Alert.alert('Erreur', 'La synchronisation a échoué');
    },
  });

  const clearSentMutation = useMutation({
    mutationFn: () => syncService.clearSentItems(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['outbox'] });
      Alert.alert('Succès', 'Historique nettoyé');
    },
  });

  const retryErrorsMutation = useMutation({
    mutationFn: () => syncService.retryFailedItems(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['outbox'] });
      queryClient.invalidateQueries({ queryKey: ['outbox-pending-count'] });
      Alert.alert('Succès', 'Les éléments en erreur seront retentés');
    },
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const pendingItems = outboxItems?.filter(i => i.status === 'PENDING') ?? [];
  const sentItems = outboxItems?.filter(i => i.status === 'SENT') ?? [];
  const errorItems = outboxItems?.filter(i => i.status === 'ERROR') ?? [];

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      CREATE_REPORT: 'Rapport de contrôle',
      CREATE_NC: 'Non-conformité',
      UPDATE_ACTION: 'Action corrective',
      CREATE_MAINTENANCE: 'Maintenance',
      UPLOAD_DOCUMENT: 'Document',
    };
    return labels[type] || type;
  };

  const renderItem = ({ item }: { item: OutboxItem }) => (
    <View style={styles.outboxItem}>
      <View style={styles.outboxItemHeader}>
        <Text style={styles.outboxItemType}>{getTypeLabel(item.type)}</Text>
        <StatusBadge status={item.status} />
      </View>
      <Text style={styles.outboxItemDate}>{formatDate(item.created_at)}</Text>
      {item.last_error && (
        <Text style={styles.outboxItemError}>{item.last_error}</Text>
      )}
    </View>
  );

  if (isLoading) {
    return <LoadingState message="Chargement..." />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.statusCard}>
        <View style={styles.statusHeader}>
          <RefreshCw size={24} color={colors.primary} />
          <Text style={styles.statusTitle}>État de la synchronisation</Text>
        </View>
        
        <View style={styles.statusGrid}>
          <View style={[styles.statusItem, { borderLeftColor: colors.warning }]}>
            <Clock size={18} color={colors.warning} />
            <Text style={styles.statusCount}>{pendingItems.length}</Text>
            <Text style={styles.statusLabel}>En attente</Text>
          </View>
          <View style={[styles.statusItem, { borderLeftColor: colors.success }]}>
            <Check size={18} color={colors.success} />
            <Text style={styles.statusCount}>{sentItems.length}</Text>
            <Text style={styles.statusLabel}>Envoyés</Text>
          </View>
          <View style={[styles.statusItem, { borderLeftColor: colors.danger }]}>
            <AlertCircle size={18} color={colors.danger} />
            <Text style={styles.statusCount}>{errorItems.length}</Text>
            <Text style={styles.statusLabel}>Erreurs</Text>
          </View>
        </View>

        <View style={styles.actions}>
          <Button
            title="Synchroniser"
            onPress={() => syncMutation.mutate()}
            loading={syncMutation.isPending}
            disabled={pendingItems.length === 0}
            icon={<RefreshCw size={18} color={colors.textInverse} />}
            fullWidth
          />
          
          <View style={styles.secondaryActions}>
            {errorItems.length > 0 && (
              <Button
                title="Réessayer erreurs"
                onPress={() => retryErrorsMutation.mutate()}
                variant="outline"
                loading={retryErrorsMutation.isPending}
                icon={<RotateCcw size={16} color={colors.primary} />}
                size="sm"
              />
            )}
            {sentItems.length > 0 && (
              <Button
                title="Nettoyer"
                onPress={() => clearSentMutation.mutate()}
                variant="ghost"
                loading={clearSentMutation.isPending}
                icon={<Trash2 size={16} color={colors.textSecondary} />}
                size="sm"
              />
            )}
          </View>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Historique</Text>

      <FlatList
        data={outboxItems}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
        ListEmptyComponent={
          <EmptyState
            icon={<Check size={48} color={colors.success} />}
            title="Tout est synchronisé"
            message="Aucune donnée en attente de synchronisation"
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  statusCard: {
    margin: spacing.lg,
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    ...shadows.md,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  statusTitle: {
    ...typography.h3,
    color: colors.text,
  },
  statusGrid: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  statusItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    padding: spacing.md,
    backgroundColor: colors.surfaceAlt,
    borderRadius: borderRadius.md,
    borderLeftWidth: 3,
  },
  statusCount: {
    fontSize: typography.h3.fontSize,
    fontWeight: '700' as const,
    color: colors.text,
  },
  statusLabel: {
    fontSize: typography.caption.fontSize,
    color: colors.textMuted,
  },
  actions: {
    gap: spacing.md,
  },
  secondaryActions: {
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'center',
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.text,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    flexGrow: 1,
  },
  outboxItem: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    marginBottom: spacing.sm,
    ...shadows.sm,
  },
  outboxItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  outboxItemType: {
    fontSize: typography.body.fontSize,
    fontWeight: '500' as const,
    color: colors.text,
  },
  outboxItemDate: {
    fontSize: typography.caption.fontSize,
    color: colors.textMuted,
  },
  outboxItemError: {
    fontSize: typography.caption.fontSize,
    color: colors.danger,
    marginTop: spacing.xs,
  },
});
