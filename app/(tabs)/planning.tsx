import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, SectionList, FlatList, RefreshControl, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Calendar, AlertTriangle, Clock, CheckCircle, CalendarDays } from 'lucide-react-native';
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

  const chronologicalEvents = useMemo(() => {
    if (!echeances) return [];
    return [...echeances].sort((a, b) => {
      const dateA = new Date(a.next_due_date).getTime();
      const dateB = new Date(b.next_due_date).getTime();
      return dateA - dateB;
    });
  }, [echeances]);

  const groupedByDate = useMemo(() => {
    const groups: { [key: string]: DueEcheance[] } = {};
    chronologicalEvents.forEach(event => {
      const date = new Date(event.next_due_date);
      const key = date.toISOString().split('T')[0];
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(event);
    });
    return groups;
  }, [chronologicalEvents]);

  const formatDateHeader = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (date.toDateString() === today.toDateString()) {
      return "Aujourd'hui";
    }
    if (date.toDateString() === tomorrow.toDateString()) {
      return 'Demain';
    }
    
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined,
    });
  };

  const getEventColor = (event: DueEcheance) => {
    if (event.is_overdue) return colors.danger;
    if (event.days_remaining <= 7) return colors.warning;
    if (event.days_remaining <= 30) return colors.info;
    return colors.textMuted;
  };

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

      {filter === 'all' ? (
        <FlatList
          data={Object.keys(groupedByDate).sort()}
          keyExtractor={(item) => item}
          renderItem={({ item: dateKey }) => (
            <View style={styles.calendarDay}>
              <View style={styles.calendarDateHeader}>
                <View style={styles.calendarDateBadge}>
                  <Text style={styles.calendarDateDay}>
                    {new Date(dateKey).getDate()}
                  </Text>
                  <Text style={styles.calendarDateMonth}>
                    {new Date(dateKey).toLocaleDateString('fr-FR', { month: 'short' }).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.calendarDateInfo}>
                  <Text style={styles.calendarDateTitle}>{formatDateHeader(dateKey)}</Text>
                  <Text style={styles.calendarDateCount}>
                    {groupedByDate[dateKey].length} échéance{groupedByDate[dateKey].length > 1 ? 's' : ''}
                  </Text>
                </View>
              </View>
              <View style={styles.calendarEvents}>
                {groupedByDate[dateKey].map((event) => (
                  <TouchableOpacity
                    key={event.id}
                    style={styles.calendarEvent}
                    onPress={() => handleEcheancePress(event)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.calendarEventIndicator, { backgroundColor: getEventColor(event) }]} />
                    <View style={styles.calendarEventContent}>
                      <Text style={styles.calendarEventTitle} numberOfLines={1}>
                        {event.asset_code} - {event.asset_designation}
                      </Text>
                      <Text style={styles.calendarEventSubtitle} numberOfLines={1}>
                        {event.control_type_label}
                      </Text>
                      <View style={styles.calendarEventMeta}>
                        <Text style={styles.calendarEventSite}>{event.site_name}</Text>
                        {event.is_overdue && (
                          <View style={styles.overdueTag}>
                            <AlertTriangle size={10} color={colors.danger} />
                            <Text style={styles.overdueTagText}>En retard</Text>
                          </View>
                        )}
                      </View>
                    </View>
                    <CalendarDays size={18} color={colors.textMuted} />
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
          contentContainerStyle={styles.calendarContent}
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
        />
      ) : (
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
      )}
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
  calendarContent: {
    padding: spacing.md,
    flexGrow: 1,
  },
  calendarDay: {
    marginBottom: spacing.lg,
  },
  calendarDateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  calendarDateBadge: {
    width: 52,
    height: 52,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  calendarDateDay: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: colors.textInverse,
    lineHeight: 24,
  },
  calendarDateMonth: {
    fontSize: 10,
    fontWeight: '600' as const,
    color: colors.textInverse,
    opacity: 0.9,
  },
  calendarDateInfo: {
    flex: 1,
  },
  calendarDateTitle: {
    fontSize: typography.body.fontSize,
    fontWeight: '600' as const,
    color: colors.text,
    textTransform: 'capitalize',
  },
  calendarDateCount: {
    fontSize: typography.caption.fontSize,
    color: colors.textMuted,
    marginTop: 2,
  },
  calendarEvents: {
    marginLeft: 26,
    borderLeftWidth: 2,
    borderLeftColor: colors.border,
    paddingLeft: spacing.lg,
  },
  calendarEvent: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  calendarEventIndicator: {
    width: 4,
    height: '100%',
    minHeight: 40,
    borderRadius: 2,
    marginRight: spacing.md,
  },
  calendarEventContent: {
    flex: 1,
  },
  calendarEventTitle: {
    fontSize: typography.body.fontSize,
    fontWeight: '600' as const,
    color: colors.text,
    marginBottom: 2,
  },
  calendarEventSubtitle: {
    fontSize: typography.bodySmall.fontSize,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  calendarEventMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  calendarEventSite: {
    fontSize: typography.caption.fontSize,
    color: colors.textMuted,
  },
  overdueTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.dangerLight,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  overdueTagText: {
    fontSize: 10,
    fontWeight: '600' as const,
    color: colors.danger,
  },
});
