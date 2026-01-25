import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, FlatList, RefreshControl, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, CheckCircle, Calendar } from 'lucide-react-native';
import { colors, spacing, borderRadius, typography } from '@/constants/theme';
import { DataTable, type Column } from '@/components/DataTable';
import { useIsDesktop } from '@/hooks/useResponsive';
import { EmptyState, LoadingState } from '@/components/EmptyState';
import { assetControlRepository } from '@/repositories/ControlRepository';
import { DueEcheance } from '@/types';

type FilterType = 'all' | 'overdue' | 'week' | 'month';

interface TimelineItem extends DueEcheance {
  section: string;
  sectionColor: string;
}

export default function PlanningScreen() {
  const router = useRouter();
  const isDesktop = useIsDesktop();
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

  const timelineData = useMemo(() => {
    if (!echeances) return [];

    const items: TimelineItem[] = [];
    const overdue = echeances.filter(e => e.is_overdue);
    const thisWeek = echeances.filter(e => !e.is_overdue && e.days_remaining <= 7);
    const thisMonth = echeances.filter(e => !e.is_overdue && e.days_remaining > 7 && e.days_remaining <= 30);
    const later = echeances.filter(e => !e.is_overdue && e.days_remaining > 30);

    if (overdue.length > 0) {
      items.push(...overdue.map(e => ({ ...e, section: 'En retard', sectionColor: colors.danger })));
    }
    if (thisWeek.length > 0) {
      items.push(...thisWeek.map(e => ({ ...e, section: 'Cette semaine', sectionColor: colors.warning })));
    }
    if (thisMonth.length > 0) {
      items.push(...thisMonth.map(e => ({ ...e, section: 'Ce mois', sectionColor: colors.info })));
    }
    if (later.length > 0) {
      items.push(...later.map(e => ({ ...e, section: 'Plus tard', sectionColor: colors.textMuted })));
    }

    return items;
  }, [echeances]);

  const handleRowPress = (item: TimelineItem) => {
    router.push(`/asset/${item.asset_id}`);
  };

  if (isLoading) {
    return <LoadingState message="Chargement du planning..." />;
  }

  // DESKTOP - TABLE VIEW
  if (isDesktop) {
    const tableColumns: Column<TimelineItem>[] = [
      {
        key: 'section' as any,
        title: 'Section',
        width: 130,
        render: (value: string, row: TimelineItem) => (
          <View style={[styles.sectionBadge, { backgroundColor: row.sectionColor + '20', borderColor: row.sectionColor }]}>
            <Text style={[styles.sectionBadgeText, { color: row.sectionColor }]}>{value}</Text>
          </View>
        ),
      },
      {
        key: 'asset_designation',
        title: 'Équipement',
        sortable: true,
        render: (value) => value || '-',
      },
      {
        key: 'control_type_label',
        title: 'Type de contrôle',
        width: 180,
        render: (value) => value || '-',
      },
      {
        key: 'next_due_at',
        title: 'Échéance',
        width: 120,
        sortable: true,
        render: (value: string) => {
          const date = new Date(value);
          return date.toLocaleDateString('fr-FR');
        },
      },
      {
        key: 'days_remaining' as any,
        title: 'Jours',
        width: 80,
        align: 'center',
        render: (value: number, row: TimelineItem) => (
          <View style={[styles.daysBadge, { backgroundColor: row.is_overdue ? colors.danger + '20' : colors.warning + '20' }]}>
            <Text style={[styles.daysBadgeText, { color: row.is_overdue ? colors.danger : colors.warning }]}>
              {row.is_overdue ? `${Math.abs(value)}j retard` : `${value}j`}
            </Text>
          </View>
        ),
      },
      {
        key: 'site_name',
        title: 'Site',
        width: 150,
        render: (value) => value || '-',
      },
      
    ];

    return (
      <View style={styles.container}>
        {/* Filter Tabs */}
        <View style={styles.desktopFilterTabs}>
          {(['all', 'overdue', 'week', 'month'] as const).map((filterOption) => {
            const labels = {
              all: 'Tout',
              overdue: 'En retard',
              week: 'Cette semaine',
              month: 'Ce mois',
            };
            return (
              <TouchableOpacity
                key={filterOption}
                style={[
                  styles.filterTab,
                  filter === filterOption && styles.filterTabActive,
                ]}
                onPress={() => setFilter(filterOption)}
              >
                <Text
                  style={[
                    styles.filterTabText,
                    filter === filterOption && styles.filterTabTextActive,
                  ]}
                >
                  {labels[filterOption]}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Table */}
        <DataTable<TimelineItem>
          columns={tableColumns}
          data={timelineData}
          onRowPress={handleRowPress}
          loading={isLoading}
        />

        {/* Footer */}
        <View style={styles.desktopFooter}>
          <Text style={styles.countText}>{timelineData.length} contrôle{timelineData.length !== 1 ? 's' : ''}</Text>
        </View>
      </View>
    );
  }

  // MOBILE - TIMELINE VIEW
  return (
    <View style={styles.container}>
      {/* Filter Pills */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.mobileFilterPills}
        scrollEnabled={true}
      >
        {(['all', 'overdue', 'week', 'month'] as const).map((filterOption) => {
          const labels = {
            all: 'Tout',
            overdue: '🔴 Retard',
            week: '🟡 Semaine',
            month: '🔵 Mois',
          };
          return (
            <TouchableOpacity
              key={filterOption}
              style={[
                styles.filterPill,
                filter === filterOption && styles.filterPillActive,
              ]}
              onPress={() => setFilter(filterOption)}
            >
              <Text
                style={[
                  styles.filterPillText,
                  filter === filterOption && styles.filterPillTextActive,
                ]}
              >
                {labels[filterOption]}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Timeline */}
      <FlatList
        data={timelineData}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => {
          const isFirstInSection = index === 0 || timelineData[index - 1]?.section !== item.section;
          const isLastInSection =
            index === timelineData.length - 1 || timelineData[index + 1]?.section !== item.section;

          return (
            <View>
              {isFirstInSection && (
                <View style={[styles.sectionHeader, { borderLeftColor: item.sectionColor }]}>
                  <Text style={styles.sectionHeaderText}>{item.section}</Text>
                </View>
              )}

              <TouchableOpacity
                style={[
                  styles.timelineCard,
                  { borderLeftColor: item.sectionColor },
                  isLastInSection && styles.timelineCardLast,
                ]}
                onPress={() => handleRowPress(item)}
                activeOpacity={0.8}
              >
                <View style={styles.timelineContent}>
                  <View style={styles.timelineTop}>
                    <Text style={styles.assetName} numberOfLines={1}>
                      {item.asset_designation}
                    </Text>
                    <View style={[styles.daysBadgeMobile, { backgroundColor: item.is_overdue ? colors.danger + '20' : colors.warning + '20' }]}>
                      <Text style={[styles.daysBadgeTextMobile, { color: item.is_overdue ? colors.danger : colors.warning }]}>
                        {item.is_overdue ? `${Math.abs(item.days_remaining)}j retard` : `${item.days_remaining}j`}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.controlType} numberOfLines={1}>
                    {item.control_type_label}
                  </Text>

                  <View style={styles.timelineFooter}>
                    <Text style={styles.siteText}>{item.site_name}</Text>
                    <Text style={styles.dateText}>
                      {new Date(item.next_due_at).toLocaleDateString('fr-FR')}
                    </Text>
                  </View>
                </View>

                <View style={styles.timelineChevron}>
                  <Text style={styles.chevronText}>›</Text>
                </View>
              </TouchableOpacity>
            </View>
          );
        }}
        contentContainerStyle={styles.timelineList}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <EmptyState
            title="Aucun contrôle planifié"
            message="Aucune échéance pour cette période"
          />
        }
      />

      <View style={styles.mobileFooter}>
        <Text style={styles.countText}>{timelineData.length} contrôle{timelineData.length !== 1 ? 's' : ''}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  // DESKTOP STYLES
  desktopFilterTabs: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderBottomWidth: 2,
    borderBottomColor: colors.border,
    paddingHorizontal: spacing.lg,
  },
  filterTab: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  filterTabActive: {
    borderBottomColor: colors.primary,
  },
  filterTabText: {
    ...typography.subtitle2,
    color: colors.textMuted,
    fontWeight: '500',
  },
  filterTabTextActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  desktopFooter: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  sectionBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    alignItems: 'center',
  },
  sectionBadgeText: {
    ...typography.body3,
    fontWeight: '600',
  },
  daysBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  daysBadgeText: {
    ...typography.body3,
    fontWeight: '600',
  },

  // MOBILE STYLES
  mobileFilterPills: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  filterPill: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterPillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterPillText: {
    ...typography.body3,
    color: colors.text,
    fontWeight: '600',
  },
  filterPillTextActive: {
    color: colors.textInverse,
  },
  sectionHeader: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.surface,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  sectionHeaderText: {
    ...typography.subtitle2,
    fontWeight: '700',
    color: colors.text,
  },
  timelineList: {
    paddingBottom: spacing.lg,
  },
  timelineCard: {
    marginHorizontal: spacing.md,
    marginVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderLeftWidth: 4,
    borderRadius: borderRadius.md,
    borderRightWidth: 1,
    borderRightColor: colors.border,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  timelineCardLast: {
    marginBottom: spacing.sm,
  },
  timelineContent: {
    flex: 1,
  },
  timelineTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  assetName: {
    ...typography.subtitle2,
    fontWeight: '700',
    color: colors.text,
    flex: 1,
  },
  daysBadgeMobile: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
    alignSelf: 'flex-start',
  },
  daysBadgeTextMobile: {
    ...typography.body4,
    fontWeight: '700',
  },
  controlType: {
    ...typography.body3,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  timelineFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  siteText: {
    ...typography.body4,
    color: colors.textMuted,
  },
  dateText: {
    ...typography.body3,
    fontWeight: '600',
    color: colors.primary,
  },
  timelineChevron: {
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chevronText: {
    fontSize: 24,
    color: colors.primary,
    fontWeight: 'bold',
  },
  mobileFooter: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    alignItems: 'center',
  },
  countText: {
    ...typography.body3,
    color: colors.textMuted,
    fontWeight: '500',
  },
});
