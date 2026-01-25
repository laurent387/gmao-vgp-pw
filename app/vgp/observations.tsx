import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, TouchableOpacity, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, Check, Download } from 'lucide-react-native';
import { colors, spacing, borderRadius, typography } from '@/constants/theme';
import { Card } from '@/components/Card';
import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { EmptyState, LoadingState } from '@/components/EmptyState';
import { trpc } from '@/lib/trpc';

type FilterType = 'all' | 'ouverte' | 'resolue' | 'traitee';

interface ObservationItem {
  id: string;
  statut: string;
  description: string;
  recommandation?: string;
  gravite: number;
  is_auto?: boolean;
  item_numero?: number;
  asset_code?: string;
}

export default function VGPObservationsScreen() {
  const { runId, reportId } = useLocalSearchParams<{ runId?: string; reportId?: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  
  const [filter, setFilter] = useState<FilterType>('all');
  const [refreshing, setRefreshing] = useState(false);

  const { data: observations, isLoading, refetch } = trpc.vgp.listObservations.useQuery({
    runId: runId || undefined,
    reportId: reportId || undefined,
    statut: filter !== 'all' ? filter.toUpperCase() : undefined,
  });

  const updateObsMutation = trpc.vgp.updateObservation.useMutation({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [['vgp']] });
      refetch();
    },
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const handleMarkResolved = (obsId: string) => {
    Alert.alert(
      'Marquer comme résolue',
      'Cette observation sera marquée comme résolue.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Confirmer',
          onPress: () => updateObsMutation.mutate({ id: obsId, statut: 'RESOLUE' }),
        },
      ]
    );
  };

  const handleMarkTreated = (obsId: string) => {
    Alert.alert(
      'Marquer comme traitée',
      'Cette observation sera marquée comme traitée.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Confirmer',
          onPress: () => updateObsMutation.mutate({ id: obsId, statut: 'TRAITEE' }),
        },
      ]
    );
  };

  const handleExportCSV = () => {
    // Generate CSV content
    if (!observations || observations.length === 0) {
      Alert.alert('Erreur', 'Aucune observation à exporter');
      return;
    }

    const headers = 'Machine;Point;Description;Recommandation;Gravité;Statut\n';
    const rows = observations.map(o => 
      `"${o.asset_code || ''}";${o.item_numero || '-'};"${o.description.replace(/"/g, '""')}";"${(o.recommandation || '').replace(/"/g, '""')}";${o.gravite};${o.statut}`
    ).join('\n');
    
    const csv = headers + rows;
    
    // For now, show in alert (in production, use expo-file-system + expo-sharing)
    Alert.alert('Export CSV', 'Fonctionnalité à implémenter avec expo-sharing');
    console.log('CSV Content:', csv);
  };

  const getGraviteColor = (gravite: number) => {
    if (gravite >= 4) return colors.danger;
    if (gravite >= 3) return colors.warning;
    return colors.textMuted;
  };

  const getStatutVariant = (statut: string): 'danger' | 'success' | 'info' => {
    switch (statut) {
      case 'OUVERTE': return 'danger';
      case 'RESOLUE': return 'success';
      case 'TRAITEE': return 'info';
      default: return 'info';
    }
  };

  const filterOptions: { key: FilterType; label: string }[] = [
    { key: 'all', label: 'Toutes' },
    { key: 'ouverte', label: 'Ouvertes' },
    { key: 'resolue', label: 'Résolues' },
    { key: 'traitee', label: 'Traitées' },
  ];

  const renderObservation = ({ item }: { item: ObservationItem }) => (
    <Card style={styles.obsCard}>
      <View style={styles.obsHeader}>
        <View style={styles.obsHeaderLeft}>
          <AlertTriangle size={20} color={getGraviteColor(item.gravite)} />
          <View>
            <Text style={styles.obsAsset}>{item.asset_code || 'Machine'}</Text>
            {item.item_numero && (
              <Text style={styles.obsPoint}>Point {item.item_numero}</Text>
            )}
          </View>
        </View>
        <View style={styles.obsHeaderRight}>
          <View style={styles.graviteIndicator}>
            {[1, 2, 3, 4, 5].map((g) => (
              <View
                key={g}
                style={[
                  styles.graviteDot,
                  g <= item.gravite && { backgroundColor: getGraviteColor(item.gravite) },
                ]}
              />
            ))}
          </View>
          <Badge label={item.statut} variant={getStatutVariant(item.statut)} />
        </View>
      </View>
      
      <Text style={styles.obsDescription}>{item.description}</Text>
      
      {item.recommandation && (
        <View style={styles.recommandation}>
          <Text style={styles.recommandationLabel}>Recommandation :</Text>
          <Text style={styles.recommandationText}>{item.recommandation}</Text>
        </View>
      )}
      
      {item.is_auto && (
        <Text style={styles.autoTag}>🤖 Générée automatiquement</Text>
      )}
      
      {item.statut === 'OUVERTE' && (
        <View style={styles.obsActions}>
          <Button
            title="Résolue"
            size="sm"
            variant="outline"
            icon={<Check size={14} color={colors.success} />}
            onPress={() => handleMarkResolved(item.id)}
          />
          <Button
            title="Traitée"
            size="sm"
            variant="ghost"
            onPress={() => handleMarkTreated(item.id)}
          />
        </View>
      )}
    </Card>
  );

  if (isLoading) {
    return <LoadingState message="Chargement des observations..." />;
  }

  const openCount = observations?.filter(o => o.statut === 'OUVERTE').length || 0;
  const resolvedCount = observations?.filter(o => o.statut === 'RESOLUE').length || 0;

  return (
    <View style={styles.container}>
      {/* Summary */}
      <View style={styles.summary}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>{observations?.length || 0}</Text>
          <Text style={styles.summaryLabel}>Total</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryValue, { color: colors.danger }]}>{openCount}</Text>
          <Text style={styles.summaryLabel}>Ouvertes</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryValue, { color: colors.success }]}>{resolvedCount}</Text>
          <Text style={styles.summaryLabel}>Résolues</Text>
        </View>
      </View>

      {/* Filters */}
      <View style={styles.filterRow}>
        <View style={styles.filterTabs}>
          {filterOptions.map((option) => (
            <TouchableOpacity
              key={option.key}
              style={[styles.filterTab, filter === option.key && styles.filterTabActive]}
              onPress={() => setFilter(option.key)}
            >
              <Text style={[styles.filterTabText, filter === option.key && styles.filterTabTextActive]}>
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        
        <TouchableOpacity style={styles.exportButton} onPress={handleExportCSV}>
          <Download size={18} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* List */}
      <FlatList
        data={observations as ObservationItem[] | undefined}
        renderItem={renderObservation}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
        ListEmptyComponent={
          <EmptyState
            icon={<Check size={48} color={colors.success} />}
            title="Aucune observation"
            message="Aucune observation ne correspond à vos critères"
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
  summary: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryValue: {
    ...typography.h1,
    color: colors.text,
  },
  summaryLabel: {
    ...typography.caption,
    color: colors.textMuted,
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    gap: spacing.md,
  },
  filterTabs: {
    flex: 1,
    flexDirection: 'row',
    gap: spacing.xs,
  },
  filterTab: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
  },
  filterTabActive: {
    backgroundColor: colors.primary,
  },
  filterTabText: {
    ...typography.caption,
    color: colors.textMuted,
    fontWeight: '600',
  },
  filterTabTextActive: {
    color: colors.textInverse,
  },
  exportButton: {
    padding: spacing.sm,
  },
  listContent: {
    padding: spacing.md,
    gap: spacing.sm,
  },
  obsCard: {
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  obsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  obsHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  obsAsset: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  obsPoint: {
    ...typography.caption,
    color: colors.textMuted,
  },
  obsHeaderRight: {
    alignItems: 'flex-end',
    gap: spacing.xs,
  },
  graviteIndicator: {
    flexDirection: 'row',
    gap: 3,
  },
  graviteDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.border,
  },
  obsDescription: {
    ...typography.body,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  recommandation: {
    backgroundColor: colors.background,
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.sm,
  },
  recommandationLabel: {
    ...typography.caption,
    color: colors.textMuted,
    fontWeight: '600',
  },
  recommandationText: {
    ...typography.body,
    color: colors.text,
    marginTop: 2,
  },
  autoTag: {
    ...typography.caption,
    color: colors.textMuted,
    fontStyle: 'italic',
  },
  obsActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
});
