import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, SectionList, RefreshControl, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Calendar, AlertTriangle, Clock, CheckCircle } from 'lucide-react-native';
import { colors, spacing, borderRadius, typography } from '@/constants/theme';
import { EcheanceListItem } from '@/components/ListItem';
import { EmptyState, LoadingState } from '@/components/EmptyState';
import { assetControlRepository } from '@/repositories/ControlRepository';
import { DueEcheance } from '@/types';

type FilterType = 'all' | 'overdue' | 'week' | 'month';

interface Section {
  title: string;
  data: DueEcheance[];
  color: string;
}

export default function PlanningScreen() {
  const router = useRouter();
  const [filter, setFilter] = useState<FilterType>('all');
  const [refreshing, setRefreshing] = useState(false);

  const { data: echeances, isLoading, refetch } = useQuery<DueEcheance[]>({
    queryKey: ['echeances', filter],
    queryFn: () => {
      switch (filter) {
        case 'overdue':
          return assetControlRepository.getDueEcheances({ overdue: true });
        case 'week':
          return assetControlRepository.getDueEcheances({ dueSoon: 7 });
        case 'month':
          return assetControlRepository.getDueEcheances({ dueSoon: 30 });
        default:
          return assetControlRepository.getDueEcheances({ dueSoon: 365 });
      }
    },
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const sections: Section[] = React.useMemo(() => {
    if (!echeances) return [];

    const overdue = echeances.filter(e => e.is_overdue);
    const thisWeek = echeances.filter(e => !e.is_overdue && e.days_remaining <= 7);
    const thisMonth = echeances.filter(e => !e.is_overdue && e.days_remaining > 7 && e.days_remaining <= 30);
    const later = echeances.filter(e => !e.is_overdue && e.days_remaining > 30);

    const result: Section[] = [];
    
    if (overdue.length > 0) {
      result.push({ title: 'En retard', data: overdue, color: colors.danger });
    }
    if (thisWeek.length > 0) {
      result.push({ title: 'Cette semaine', data: thisWeek, color: colors.warning });
    }
    if (thisMonth.length > 0) {
      result.push({ title: 'Ce mois', data: thisMonth, color: colors.info });
    }
    if (later.length > 0) {
      result.push({ title: 'Plus tard', data: later, color: colors.textMuted });
    }

    return result;
  }, [echeances]);

  const handleEcheancePress = (echeance: DueEcheance) => {
    router.push(`/asset/${echeance.asset_id}`);
  };

  const filterOptions: { key: FilterType; label: string }[] = [
    { key: 'all', label: 'Tout' },
    { key: 'overdue', label: 'Retard' },
    { key: 'week', label: '7 jours' },
    { key: 'month', label: '30 jours' },
  ];

  if (isLoading) {
    return <LoadingState message="Chargement du planning..." />;
  }

  return (
    <View style={styles.container}>
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

      <View style={styles.summary}>
        <View style={[styles.summaryItem, { borderLeftColor: colors.danger }]}>
          <AlertTriangle size={16} color={colors.danger} />
          <Text style={styles.summaryCount}>
            {echeances?.filter(e => e.is_overdue).length ?? 0}
          </Text>
          <Text style={styles.summaryLabel}>retard</Text>
        </View>
        <View style={[styles.summaryItem, { borderLeftColor: colors.warning }]}>
          <Clock size={16} color={colors.warning} />
          <Text style={styles.summaryCount}>
            {echeances?.filter(e => !e.is_overdue && e.days_remaining <= 7).length ?? 0}
          </Text>
          <Text style={styles.summaryLabel}>7 jours</Text>
        </View>
        <View style={[styles.summaryItem, { borderLeftColor: colors.info }]}>
          <Calendar size={16} color={colors.info} />
          <Text style={styles.summaryCount}>
            {echeances?.filter(e => !e.is_overdue && e.days_remaining <= 30).length ?? 0}
          </Text>
          <Text style={styles.summaryLabel}>30 jours</Text>
        </View>
      </View>

      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <EcheanceListItem
            assetCode={item.asset_code}
            assetDesignation={item.asset_designation}
            controlTypeLabel={item.control_type_label}
            daysRemaining={item.days_remaining}
            isOverdue={item.is_overdue}
            siteName={item.site_name}
            onPress={() => handleEcheancePress(item)}
          />
        )}
        renderSectionHeader={({ section }) => (
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIndicator, { backgroundColor: section.color }]} />
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <Text style={styles.sectionCount}>{section.data.length}</Text>
          </View>
        )}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
        ListEmptyComponent={
          <EmptyState
            icon={<CheckCircle size={48} color={colors.success} />}
            title="Aucune échéance"
            message="Tous les contrôles sont à jour"
          />
        }
        stickySectionHeadersEnabled={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  filterTabs: {
    flexDirection: 'row',
    padding: spacing.md,
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  filterTab: {
    flex: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  filterTabActive: {
    backgroundColor: colors.primary,
  },
  filterTabText: {
    fontSize: typography.bodySmall.fontSize,
    fontWeight: '500' as const,
    color: colors.textSecondary,
  },
  filterTabTextActive: {
    color: colors.textInverse,
  },
  summary: {
    flexDirection: 'row',
    padding: spacing.md,
    gap: spacing.md,
    backgroundColor: colors.surface,
  },
  summaryItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surfaceAlt,
    borderRadius: borderRadius.md,
    borderLeftWidth: 3,
  },
  summaryCount: {
    fontSize: typography.h3.fontSize,
    fontWeight: '700' as const,
    color: colors.text,
  },
  summaryLabel: {
    fontSize: typography.caption.fontSize,
    color: colors.textMuted,
  },
  listContent: {
    padding: spacing.lg,
    flexGrow: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    marginBottom: spacing.sm,
  },
  sectionIndicator: {
    width: 4,
    height: 20,
    borderRadius: 2,
    marginRight: spacing.md,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.text,
    flex: 1,
  },
  sectionCount: {
    fontSize: typography.bodySmall.fontSize,
    fontWeight: '600' as const,
    color: colors.textMuted,
    backgroundColor: colors.surfaceAlt,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
});
