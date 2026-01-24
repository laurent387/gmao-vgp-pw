import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  Package, AlertTriangle, Clock, CheckCircle, RefreshCw, 
  Plus, ChevronRight, LogOut, User 
} from 'lucide-react-native';
import { colors, spacing, borderRadius, typography, shadows } from '@/constants/theme';
import { KPICard, Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { StatusBadge, OverdueBadge } from '@/components/Badge';
import { useAuth } from '@/contexts/AuthContext';
import { assetRepository } from '@/repositories/AssetRepository';
import { assetControlRepository } from '@/repositories/ControlRepository';
import { ncRepository, actionRepository } from '@/repositories/NCRepository';
import { outboxRepository } from '@/repositories/OutboxRepository';
import { DashboardKPIs, DueEcheance } from '@/types';

export default function DashboardScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [refreshing, setRefreshing] = useState(false);

  const { data: kpis, refetch: refetchKpis } = useQuery<DashboardKPIs>({
    queryKey: ['dashboard-kpis'],
    queryFn: async () => {
      const [totalAssets, overdueControls, dueSoon30Days, openNCs, overdueActions, pendingSyncItems] = await Promise.all([
        assetRepository.count(),
        assetRepository.getOverdueCount(),
        assetRepository.getDueSoonCount(30),
        ncRepository.getOpenCount(),
        actionRepository.getOverdueCount(),
        outboxRepository.getPendingCount(),
      ]);
      return { totalAssets, overdueControls, dueSoon30Days, openNCs, overdueActions, pendingSyncItems };
    },
  });

  const { data: urgentEcheances, refetch: refetchEcheances } = useQuery<DueEcheance[]>({
    queryKey: ['urgent-echeances'],
    queryFn: () => assetControlRepository.getDueEcheances({ dueSoon: 30 }),
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetchKpis(), refetchEcheances()]);
    setRefreshing(false);
  }, []);

  const handleLogout = async () => {
    await logout();
    router.replace('/login');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Bonjour,</Text>
            <Text style={styles.userName}>{user?.name || 'Utilisateur'}</Text>
          </View>
          <View style={styles.headerActions}>
            <View style={styles.roleBadge}>
              <User size={14} color={colors.primary} />
              <Text style={styles.roleText}>{user?.role}</Text>
            </View>
            <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
              <LogOut size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.kpiGrid}>
          <KPICard
            title="Équipements"
            value={kpis?.totalAssets ?? 0}
            variant="default"
            icon={<Package size={24} color={colors.primary} />}
            onPress={() => router.push('/(tabs)/inventory')}
          />
          <KPICard
            title="En retard"
            value={kpis?.overdueControls ?? 0}
            variant="danger"
            icon={<AlertTriangle size={24} color={colors.danger} />}
            onPress={() => router.push('/(tabs)/planning')}
          />
          <KPICard
            title="À 30 jours"
            value={kpis?.dueSoon30Days ?? 0}
            variant="warning"
            icon={<Clock size={24} color={colors.warning} />}
            onPress={() => router.push('/(tabs)/planning')}
          />
          <KPICard
            title="NC ouvertes"
            value={kpis?.openNCs ?? 0}
            variant={kpis?.openNCs ? 'danger' : 'success'}
            icon={<AlertTriangle size={24} color={kpis?.openNCs ? colors.danger : colors.success} />}
            onPress={() => router.push('/(tabs)/nc')}
          />
        </View>

        <View style={styles.quickActions}>
          <Text style={styles.sectionTitle}>Actions rapides</Text>
          <View style={styles.actionButtons}>
            <Button
              title="Nouvelle mission"
              onPress={() => router.push('/mission/create')}
              icon={<Plus size={18} color={colors.textInverse} />}
              style={styles.actionButton}
            />
            <Button
              title="Synchroniser"
              onPress={() => router.push('/(tabs)/sync')}
              variant="outline"
              icon={<RefreshCw size={18} color={colors.primary} />}
              style={styles.actionButton}
            />
          </View>
          {(kpis?.pendingSyncItems ?? 0) > 0 && (
            <View style={styles.syncWarning}>
              <RefreshCw size={16} color={colors.warning} />
              <Text style={styles.syncWarningText}>
                {kpis?.pendingSyncItems} élément(s) en attente de synchronisation
              </Text>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Échéances urgentes</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/planning')} style={styles.seeAllButton}>
              <Text style={styles.seeAllText}>Voir tout</Text>
              <ChevronRight size={16} color={colors.primary} />
            </TouchableOpacity>
          </View>

          {urgentEcheances && urgentEcheances.length > 0 ? (
            urgentEcheances.slice(0, 5).map((echeance) => (
              <TouchableOpacity
                key={echeance.id}
                style={styles.echeanceItem}
                onPress={() => router.push(`/asset/${echeance.asset_id}`)}
              >
                <View style={styles.echeanceContent}>
                  <View style={styles.echeanceHeader}>
                    <Text style={styles.echeanceCode}>{echeance.asset_code}</Text>
                    {echeance.is_overdue && <OverdueBadge />}
                  </View>
                  <Text style={styles.echeanceDesignation} numberOfLines={1}>
                    {echeance.asset_designation}
                  </Text>
                  <Text style={styles.echeanceType}>{echeance.control_type_label}</Text>
                  <Text style={[
                    styles.echeanceDays,
                    echeance.is_overdue && styles.echeanceDaysOverdue
                  ]}>
                    {echeance.is_overdue 
                      ? `${Math.abs(echeance.days_remaining)} j de retard`
                      : echeance.days_remaining === 0 
                        ? "Aujourd'hui"
                        : `Dans ${echeance.days_remaining} j`
                    }
                  </Text>
                </View>
                <ChevronRight size={20} color={colors.textMuted} />
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.emptyState}>
              <CheckCircle size={32} color={colors.success} />
              <Text style={styles.emptyStateText}>Aucune échéance urgente</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  greeting: {
    fontSize: typography.body.fontSize,
    color: colors.textSecondary,
  },
  userName: {
    ...typography.h2,
    color: colors.text,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.primary + '15',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
  },
  roleText: {
    fontSize: typography.caption.fontSize,
    fontWeight: '600' as const,
    color: colors.primary,
  },
  logoutButton: {
    padding: spacing.sm,
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  quickActions: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.md,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  actionButton: {
    flex: 1,
  },
  syncWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.warningLight,
    borderRadius: borderRadius.md,
  },
  syncWarningText: {
    fontSize: typography.bodySmall.fontSize,
    color: colors.warning,
    fontWeight: '500' as const,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  seeAllText: {
    fontSize: typography.bodySmall.fontSize,
    color: colors.primary,
    fontWeight: '500' as const,
  },
  echeanceItem: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    marginBottom: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    ...shadows.sm,
  },
  echeanceContent: {
    flex: 1,
  },
  echeanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  echeanceCode: {
    fontSize: typography.caption.fontSize,
    fontWeight: '600' as const,
    color: colors.primary,
  },
  echeanceDesignation: {
    fontSize: typography.body.fontSize,
    fontWeight: '500' as const,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  echeanceType: {
    fontSize: typography.bodySmall.fontSize,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  echeanceDays: {
    fontSize: typography.bodySmall.fontSize,
    fontWeight: '500' as const,
    color: colors.warning,
  },
  echeanceDaysOverdue: {
    color: colors.danger,
  },
  emptyState: {
    alignItems: 'center',
    padding: spacing.xxl,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
  },
  emptyStateText: {
    marginTop: spacing.md,
    color: colors.textSecondary,
    fontSize: typography.body.fontSize,
  },
});
