import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  Users, CheckCircle, AlertTriangle, Clock, TrendingUp, 
  ClipboardCheck, FileText, ChevronRight, LogOut, Shield,
  BarChart3, Target
} from 'lucide-react-native';
import { colors, spacing, borderRadius, typography, shadows } from '@/constants/theme';
import { KPICard } from '@/components/Card';
import { useAuth } from '@/contexts/AuthContext';
import { missionRepository } from '@/repositories/MissionRepository';
import { ncRepository, actionRepository } from '@/repositories/NCRepository';
import { reportRepository } from '@/repositories/ReportRepository';
import { assetRepository } from '@/repositories/AssetRepository';
import { Mission, NonConformity, Report } from '@/types';

interface ManagerStats {
  totalMissions: number;
  completedMissions: number;
  inProgressMissions: number;
  plannedMissions: number;
  totalReports: number;
  conformeReports: number;
  nonConformeReports: number;
  openNCs: number;
  overdueActions: number;
  totalAssets: number;
  overdueControls: number;
}

export default function ManagerDashboardScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [refreshing, setRefreshing] = useState(false);

  const { data: stats, refetch: refetchStats } = useQuery<ManagerStats>({
    queryKey: ['manager-stats'],
    queryFn: async () => {
      const [
        allMissions,
        completedMissions,
        inProgressMissions,
        plannedMissions,
        totalReports,
        openNCs,
        overdueActions,
        totalAssets,
        overdueControls,
      ] = await Promise.all([
        missionRepository.getAll(),
        missionRepository.getByStatus('TERMINEE'),
        missionRepository.getByStatus('EN_COURS'),
        missionRepository.getByStatus('PLANIFIEE'),
        reportRepository.getAll(),
        ncRepository.getOpenCount(),
        actionRepository.getOverdueCount(),
        assetRepository.count(),
        assetRepository.getOverdueCount(),
      ]);

      const conformeReports = totalReports.filter((r: Report) => r.conclusion === 'CONFORME').length;
      const nonConformeReports = totalReports.filter((r: Report) => r.conclusion === 'NON_CONFORME').length;

      return {
        totalMissions: allMissions.length,
        completedMissions: completedMissions.length,
        inProgressMissions: inProgressMissions.length,
        plannedMissions: plannedMissions.length,
        totalReports: totalReports.length,
        conformeReports,
        nonConformeReports,
        openNCs,
        overdueActions,
        totalAssets,
        overdueControls,
      };
    },
  });

  const { data: recentMissions, refetch: refetchMissions } = useQuery<Mission[]>({
    queryKey: ['recent-missions'],
    queryFn: async () => {
      const missions = await missionRepository.getAll();
      return missions.slice(0, 5);
    },
  });

  const { data: openNCs, refetch: refetchNCs } = useQuery<NonConformity[]>({
    queryKey: ['open-ncs-manager'],
    queryFn: async () => {
      const ncs = await ncRepository.getByStatus('OUVERTE');
      return ncs.slice(0, 5);
    },
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetchStats(), refetchMissions(), refetchNCs()]);
    setRefreshing(false);
  }, []);

  const handleLogout = async () => {
    await logout();
    router.replace('/login');
  };

  const conformityRate = stats?.totalReports 
    ? Math.round((stats.conformeReports / stats.totalReports) * 100) 
    : 0;

  const completionRate = stats?.totalMissions 
    ? Math.round((stats.completedMissions / stats.totalMissions) * 100) 
    : 0;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Tableau de bord</Text>
            <Text style={styles.userName}>{user?.name || 'Manager'}</Text>
          </View>
          <View style={styles.headerActions}>
            <View style={styles.roleBadge}>
              <Shield size={14} color={colors.primary} />
              <Text style={styles.roleText}>Manager</Text>
            </View>
            <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
              <LogOut size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.statsOverview}>
          <View style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <Target size={24} color={colors.success} />
            </View>
            <Text style={styles.statValue}>{conformityRate}%</Text>
            <Text style={styles.statLabel}>Taux conformité</Text>
          </View>
          <View style={styles.statCard}>
            <View style={[styles.statIconContainer, { backgroundColor: colors.primary + '15' }]}>
              <TrendingUp size={24} color={colors.primary} />
            </View>
            <Text style={styles.statValue}>{completionRate}%</Text>
            <Text style={styles.statLabel}>Missions terminées</Text>
          </View>
        </View>

        <View style={styles.kpiGrid}>
          <KPICard
            title="Missions planifiées"
            value={stats?.plannedMissions ?? 0}
            variant="default"
            icon={<Clock size={24} color={colors.primary} />}
            onPress={() => router.push('/(tabs)/missions')}
          />
          <KPICard
            title="En cours"
            value={stats?.inProgressMissions ?? 0}
            variant="warning"
            icon={<ClipboardCheck size={24} color={colors.warning} />}
            onPress={() => router.push('/(tabs)/missions')}
          />
          <KPICard
            title="NC ouvertes"
            value={stats?.openNCs ?? 0}
            variant={stats?.openNCs ? 'danger' : 'success'}
            icon={<AlertTriangle size={24} color={stats?.openNCs ? colors.danger : colors.success} />}
            onPress={() => router.push('/(tabs)/nc')}
          />
          <KPICard
            title="Actions en retard"
            value={stats?.overdueActions ?? 0}
            variant={stats?.overdueActions ? 'danger' : 'success'}
            icon={<Clock size={24} color={stats?.overdueActions ? colors.danger : colors.success} />}
            onPress={() => router.push('/(tabs)/validation')}
          />
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Activité récente</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/missions')} style={styles.seeAllButton}>
              <Text style={styles.seeAllText}>Voir tout</Text>
              <ChevronRight size={16} color={colors.primary} />
            </TouchableOpacity>
          </View>

          {recentMissions && recentMissions.length > 0 ? (
            recentMissions.map((mission) => (
              <TouchableOpacity
                key={mission.id}
                style={styles.missionItem}
                onPress={() => router.push(`/mission/${mission.id}`)}
              >
                <View style={styles.missionContent}>
                  <View style={styles.missionHeader}>
                    <Text style={styles.missionSite}>{mission.site_name || 'Site'}</Text>
                    <View style={[styles.statusBadge, getStatusStyle(mission.status)]}>
                      <Text style={[styles.statusText, getStatusTextStyle(mission.status)]}>
                        {getStatusLabel(mission.status)}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.missionType}>{mission.control_type?.label || 'VGP'}</Text>
                  <Text style={styles.missionDate}>
                    {new Date(mission.scheduled_at).toLocaleDateString('fr-FR')}
                  </Text>
                </View>
                <ChevronRight size={20} color={colors.textMuted} />
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.emptyState}>
              <FileText size={32} color={colors.textMuted} />
              <Text style={styles.emptyStateText}>Aucune mission récente</Text>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>NC à traiter</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/nc')} style={styles.seeAllButton}>
              <Text style={styles.seeAllText}>Voir tout</Text>
              <ChevronRight size={16} color={colors.primary} />
            </TouchableOpacity>
          </View>

          {openNCs && openNCs.length > 0 ? (
            openNCs.map((nc) => (
              <TouchableOpacity
                key={nc.id}
                style={styles.ncItem}
                onPress={() => router.push(`/nc/${nc.id}`)}
              >
                <View style={styles.ncContent}>
                  <View style={styles.ncHeader}>
                    <View style={[styles.severityBadge, getSeverityStyle(nc.severity)]}>
                      <Text style={styles.severityText}>S{nc.severity}</Text>
                    </View>
                    <Text style={styles.ncTitle} numberOfLines={1}>{nc.title}</Text>
                  </View>
                  <Text style={styles.ncAsset}>{nc.asset?.designation || 'Équipement'}</Text>
                  <Text style={styles.ncDate}>
                    Créée le {new Date(nc.created_at).toLocaleDateString('fr-FR')}
                  </Text>
                </View>
                <ChevronRight size={20} color={colors.textMuted} />
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.emptyState}>
              <CheckCircle size={32} color={colors.success} />
              <Text style={styles.emptyStateText}>Aucune NC ouverte</Text>
            </View>
          )}
        </View>

        <View style={styles.quickStats}>
          <Text style={styles.sectionTitle}>Résumé global</Text>
          <View style={styles.quickStatsGrid}>
            <View style={styles.quickStatItem}>
              <BarChart3 size={20} color={colors.primary} />
              <Text style={styles.quickStatValue}>{stats?.totalReports ?? 0}</Text>
              <Text style={styles.quickStatLabel}>Rapports</Text>
            </View>
            <View style={styles.quickStatItem}>
              <Users size={20} color={colors.primary} />
              <Text style={styles.quickStatValue}>{stats?.totalAssets ?? 0}</Text>
              <Text style={styles.quickStatLabel}>Équipements</Text>
            </View>
            <View style={styles.quickStatItem}>
              <AlertTriangle size={20} color={colors.danger} />
              <Text style={styles.quickStatValue}>{stats?.overdueControls ?? 0}</Text>
              <Text style={styles.quickStatLabel}>Contrôles en retard</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function getStatusStyle(status: string) {
  switch (status) {
    case 'TERMINEE': return { backgroundColor: colors.success + '20' };
    case 'EN_COURS': return { backgroundColor: colors.warning + '20' };
    case 'PLANIFIEE': return { backgroundColor: colors.primary + '20' };
    case 'ANNULEE': return { backgroundColor: colors.textMuted + '20' };
    default: return { backgroundColor: colors.textMuted + '20' };
  }
}

function getStatusTextStyle(status: string) {
  switch (status) {
    case 'TERMINEE': return { color: colors.success };
    case 'EN_COURS': return { color: colors.warning };
    case 'PLANIFIEE': return { color: colors.primary };
    case 'ANNULEE': return { color: colors.textMuted };
    default: return { color: colors.textMuted };
  }
}

function getStatusLabel(status: string) {
  switch (status) {
    case 'TERMINEE': return 'Terminée';
    case 'EN_COURS': return 'En cours';
    case 'PLANIFIEE': return 'Planifiée';
    case 'ANNULEE': return 'Annulée';
    case 'A_PLANIFIER': return 'À planifier';
    default: return status;
  }
}

function getSeverityStyle(severity: number) {
  if (severity >= 4) return { backgroundColor: colors.danger };
  if (severity >= 3) return { backgroundColor: colors.warning };
  return { backgroundColor: colors.primary };
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
  statsOverview: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    ...shadows.sm,
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.full,
    backgroundColor: colors.success + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: colors.text,
  },
  statLabel: {
    fontSize: typography.caption.fontSize,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing.xl,
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
  sectionTitle: {
    ...typography.h3,
    color: colors.text,
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
  missionItem: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    marginBottom: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    ...shadows.sm,
  },
  missionContent: {
    flex: 1,
  },
  missionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  missionSite: {
    fontSize: typography.body.fontSize,
    fontWeight: '600' as const,
    color: colors.text,
    flex: 1,
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
  missionType: {
    fontSize: typography.bodySmall.fontSize,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  missionDate: {
    fontSize: typography.caption.fontSize,
    color: colors.textMuted,
  },
  ncItem: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    marginBottom: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    ...shadows.sm,
  },
  ncContent: {
    flex: 1,
  },
  ncHeader: {
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
  ncTitle: {
    fontSize: typography.body.fontSize,
    fontWeight: '500' as const,
    color: colors.text,
    flex: 1,
  },
  ncAsset: {
    fontSize: typography.bodySmall.fontSize,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  ncDate: {
    fontSize: typography.caption.fontSize,
    color: colors.textMuted,
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
  quickStats: {
    marginBottom: spacing.xl,
  },
  quickStatsGrid: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginTop: spacing.md,
    ...shadows.sm,
  },
  quickStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  quickStatValue: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: colors.text,
    marginTop: spacing.sm,
  },
  quickStatLabel: {
    fontSize: typography.caption.fontSize,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
});
