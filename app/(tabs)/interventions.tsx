import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, SectionList, RefreshControl, TouchableOpacity, Linking, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Calendar, Wrench, Eye, Settings, Edit3, Clock, CheckCircle, Play, ExternalLink } from 'lucide-react-native';
import { colors, spacing, borderRadius, typography } from '@/constants/theme';
import { EmptyState, LoadingState } from '@/components/EmptyState';
import { useAuth } from '@/contexts/AuthContext';
import { trpc } from '@/lib/trpc';
import { generateCalendarInviteData } from '@/utils/calendarInvite';

type StatusFilter = 'all' | 'PLANIFIEE' | 'EN_COURS' | 'TERMINEE';

interface Intervention {
  id: string;
  asset_id: string;
  date: string;
  actor: string;
  operation_type: 'MAINTENANCE' | 'INSPECTION' | 'REPARATION' | 'MODIFICATION';
  description: string;
  parts_ref: string | null;
  assigned_to: string | null;
  assigned_to_name: string | null;
  status: 'PLANIFIEE' | 'EN_COURS' | 'TERMINEE';
  created_at: string;
}

interface Section {
  title: string;
  data: Intervention[];
  color: string;
}

const operationIcons: Record<string, React.ReactNode> = {
  MAINTENANCE: <Wrench size={16} color={colors.primary} />,
  INSPECTION: <Eye size={16} color={colors.info} />,
  REPARATION: <Settings size={16} color={colors.warning} />,
  MODIFICATION: <Edit3 size={16} color={colors.success} />,
};

const operationLabels: Record<string, string> = {
  MAINTENANCE: 'Maintenance',
  INSPECTION: 'Inspection',
  REPARATION: 'Réparation',
  MODIFICATION: 'Modification',
};

const statusLabels: Record<string, string> = {
  PLANIFIEE: 'Planifiée',
  EN_COURS: 'En cours',
  TERMINEE: 'Terminée',
};

const statusColors: Record<string, string> = {
  PLANIFIEE: colors.info,
  EN_COURS: colors.warning,
  TERMINEE: colors.success,
};

export default function InterventionsScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [filter, setFilter] = useState<StatusFilter>('all');
  const [refreshing, setRefreshing] = useState(false);

  const { data: interventions, isLoading, refetch } = trpc.maintenance.listByTechnician.useQuery(
    { 
      technicianId: user?.id || '',
      status: filter === 'all' ? undefined : filter,
    },
    { enabled: !!user?.id }
  );

  const updateStatusMutation = trpc.maintenance.updateStatus.useMutation({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [['maintenance', 'listByTechnician']] });
      Alert.alert('Succès', 'Statut mis à jour');
    },
    onError: (error) => {
      Alert.alert('Erreur', error.message);
    },
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const sections: Section[] = React.useMemo(() => {
    if (!interventions) return [];

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const typedInterventions = interventions as Intervention[];
    const planned = typedInterventions.filter(i => i.status === 'PLANIFIEE');
    const inProgress = typedInterventions.filter(i => i.status === 'EN_COURS');
    const completed = typedInterventions.filter(i => i.status === 'TERMINEE');

    const result: Section[] = [];
    
    if (inProgress.length > 0) {
      result.push({ title: 'En cours', data: inProgress, color: colors.warning });
    }
    if (planned.length > 0) {
      result.push({ title: 'Planifiées', data: planned, color: colors.info });
    }
    if (completed.length > 0 && (filter === 'all' || filter === 'TERMINEE')) {
      result.push({ title: 'Terminées', data: completed.slice(0, 10), color: colors.success });
    }

    return result;
  }, [interventions, filter]);

  const handleStartIntervention = (intervention: Intervention) => {
    Alert.alert(
      'Démarrer l\'intervention',
      `Voulez-vous démarrer cette intervention ?\n\n${operationLabels[intervention.operation_type]} - ${intervention.description.substring(0, 50)}...`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Démarrer',
          onPress: () => updateStatusMutation.mutate({ id: intervention.id, status: 'EN_COURS' }),
        },
      ]
    );
  };

  const handleCompleteIntervention = (intervention: Intervention) => {
    Alert.alert(
      'Terminer l\'intervention',
      'Marquer cette intervention comme terminée ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Terminer',
          onPress: () => updateStatusMutation.mutate({ id: intervention.id, status: 'TERMINEE' }),
        },
      ]
    );
  };

  const handleAddToCalendar = async (intervention: Intervention) => {
    const calendarData = generateCalendarInviteData({
      assetDesignation: `Asset ${intervention.asset_id}`,
      operationType: intervention.operation_type,
      date: intervention.date,
      description: intervention.description,
      technicianName: user?.name || '',
    });

    Alert.alert(
      'Ajouter au calendrier',
      'Choisissez votre application de calendrier',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Outlook',
          onPress: () => Linking.openURL(calendarData.outlookUrl),
        },
        {
          text: 'Google',
          onPress: () => Linking.openURL(calendarData.googleUrl),
        },
      ]
    );
  };

  const filterOptions: { key: StatusFilter; label: string }[] = [
    { key: 'all', label: 'Tout' },
    { key: 'PLANIFIEE', label: 'Planifiées' },
    { key: 'EN_COURS', label: 'En cours' },
    { key: 'TERMINEE', label: 'Terminées' },
  ];

  const renderInterventionItem = ({ item }: { item: Intervention }) => {
    const interventionDate = new Date(item.date);
    const isToday = new Date().toDateString() === interventionDate.toDateString();
    const isPast = interventionDate < new Date() && !isToday;

    return (
      <View style={styles.interventionCard}>
        <View style={styles.cardHeader}>
          <View style={styles.operationType}>
            {operationIcons[item.operation_type]}
            <Text style={styles.operationLabel}>{operationLabels[item.operation_type]}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusColors[item.status] + '20' }]}>
            <Text style={[styles.statusText, { color: statusColors[item.status] }]}>
              {statusLabels[item.status]}
            </Text>
          </View>
        </View>

        <Text style={styles.description} numberOfLines={2}>
          {item.description}
        </Text>

        <View style={styles.cardMeta}>
          <View style={styles.dateRow}>
            <Calendar size={14} color={isToday ? colors.primary : isPast ? colors.danger : colors.textMuted} />
            <Text style={[
              styles.dateText,
              isToday && styles.dateToday,
              isPast && item.status !== 'TERMINEE' && styles.dateOverdue,
            ]}>
              {isToday ? 'Aujourd\'hui' : interventionDate.toLocaleDateString('fr-FR', {
                weekday: 'short',
                day: 'numeric',
                month: 'short',
              })}
            </Text>
          </View>
          {item.parts_ref && (
            <Text style={styles.partsRef}>Pièces: {item.parts_ref}</Text>
          )}
        </View>

        <View style={styles.cardActions}>
          {item.status === 'PLANIFIEE' && (
            <>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleAddToCalendar(item)}
              >
                <ExternalLink size={16} color={colors.info} />
                <Text style={[styles.actionText, { color: colors.info }]}>Calendrier</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.actionButtonPrimary]}
                onPress={() => handleStartIntervention(item)}
              >
                <Play size={16} color={colors.textInverse} />
                <Text style={[styles.actionText, { color: colors.textInverse }]}>Démarrer</Text>
              </TouchableOpacity>
            </>
          )}
          {item.status === 'EN_COURS' && (
            <TouchableOpacity
              style={[styles.actionButton, styles.actionButtonSuccess]}
              onPress={() => handleCompleteIntervention(item)}
            >
              <CheckCircle size={16} color={colors.textInverse} />
              <Text style={[styles.actionText, { color: colors.textInverse }]}>Terminer</Text>
            </TouchableOpacity>
          )}
          {item.status === 'TERMINEE' && (
            <View style={styles.completedBadge}>
              <CheckCircle size={14} color={colors.success} />
              <Text style={styles.completedText}>Complété</Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  if (isLoading) {
    return <LoadingState message="Chargement des interventions..." />;
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
        <View style={[styles.summaryItem, { borderLeftColor: colors.info }]}>
          <Clock size={16} color={colors.info} />
          <Text style={styles.summaryCount}>
            {interventions?.filter(i => i.status === 'PLANIFIEE').length ?? 0}
          </Text>
          <Text style={styles.summaryLabel}>planifiées</Text>
        </View>
        <View style={[styles.summaryItem, { borderLeftColor: colors.warning }]}>
          <Play size={16} color={colors.warning} />
          <Text style={styles.summaryCount}>
            {interventions?.filter(i => i.status === 'EN_COURS').length ?? 0}
          </Text>
          <Text style={styles.summaryLabel}>en cours</Text>
        </View>
        <View style={[styles.summaryItem, { borderLeftColor: colors.success }]}>
          <CheckCircle size={16} color={colors.success} />
          <Text style={styles.summaryCount}>
            {interventions?.filter(i => i.status === 'TERMINEE').length ?? 0}
          </Text>
          <Text style={styles.summaryLabel}>terminées</Text>
        </View>
      </View>

      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        renderItem={renderInterventionItem}
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
            icon={<Calendar size={48} color={colors.textMuted} />}
            title="Aucune intervention"
            message="Vous n'avez pas d'intervention assignée pour le moment"
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
    fontSize: typography.caption.fontSize,
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
    paddingHorizontal: spacing.sm,
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
    fontSize: 10,
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
  interventionCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  operationType: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  operationLabel: {
    fontSize: typography.bodySmall.fontSize,
    fontWeight: '600' as const,
    color: colors.text,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  statusText: {
    fontSize: typography.caption.fontSize,
    fontWeight: '600' as const,
  },
  description: {
    fontSize: typography.body.fontSize,
    color: colors.textSecondary,
    marginBottom: spacing.md,
    lineHeight: 20,
  },
  cardMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  dateText: {
    fontSize: typography.caption.fontSize,
    color: colors.textMuted,
  },
  dateToday: {
    color: colors.primary,
    fontWeight: '600' as const,
  },
  dateOverdue: {
    color: colors.danger,
    fontWeight: '600' as const,
  },
  partsRef: {
    fontSize: typography.caption.fontSize,
    color: colors.textMuted,
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  actionButtonPrimary: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  actionButtonSuccess: {
    backgroundColor: colors.success,
    borderColor: colors.success,
  },
  actionText: {
    fontSize: typography.caption.fontSize,
    fontWeight: '600' as const,
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  completedText: {
    fontSize: typography.caption.fontSize,
    color: colors.success,
    fontWeight: '500' as const,
  },
});
