import React from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Calendar, MapPin, User, Play, CheckCircle } from 'lucide-react-native';
import { colors, spacing, typography } from '@/constants/theme';
import { StatusBadge, CriticalityBadge } from '@/components/Badge';
import { SectionCard } from '@/components/Card';
import { Button } from '@/components/Button';
import { EmptyState, LoadingState } from '@/components/EmptyState';
import { missionRepository } from '@/repositories/MissionRepository';
import { reportRepository } from '@/repositories/ReportRepository';
import { Mission, Report } from '@/types';
import { useAuth } from '@/contexts/AuthContext';

export default function MissionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { canEdit } = useAuth();
  const [refreshing, setRefreshing] = React.useState(false);

  const { data: mission, isLoading, refetch } = useQuery<Mission | null>({
    queryKey: ['mission', id],
    queryFn: () => missionRepository.getByIdWithDetails(id!),
    enabled: !!id,
  });

  const { data: reports } = useQuery<Report[]>({
    queryKey: ['mission-reports', id],
    queryFn: () => reportRepository.getByMissionId(id!),
    enabled: !!id,
  });

  const startMutation = useMutation({
    mutationFn: () => missionRepository.updateStatus(id!, 'EN_COURS'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mission', id] });
      queryClient.invalidateQueries({ queryKey: ['missions'] });
    },
  });

  const completeMutation = useMutation({
    mutationFn: () => missionRepository.updateStatus(id!, 'TERMINEE'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mission', id] });
      queryClient.invalidateQueries({ queryKey: ['missions'] });
    },
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  if (isLoading) {
    return <LoadingState message="Chargement de la mission..." />;
  }

  if (!mission) {
    return (
      <EmptyState
        title="Mission non trouvée"
        message="Cette mission n'existe pas ou a été supprimée"
      />
    );
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const canStart = mission.status === 'PLANIFIEE' && canEdit();
  const canComplete = mission.status === 'EN_COURS' && canEdit();
  const canExecute = (mission.status === 'PLANIFIEE' || mission.status === 'EN_COURS') && canEdit();

  const handleStartMission = () => {
    startMutation.mutate();
  };

  const handleCompleteMission = () => {
    completeMutation.mutate();
  };

  const handleExecuteControl = (assetId: string) => {
    router.push({
      pathname: '/mission/execute',
      params: { missionId: id, assetId },
    });
  };

  const getAssetReportStatus = (assetId: string) => {
    return reports?.find(r => r.asset_id === assetId);
  };

  return (
    <>
      <Stack.Screen options={{ title: `Mission ${(mission as any).control_type_code || ''}` }} />
      
      <ScrollView 
        style={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <Text style={styles.headerTitle}>{(mission as any).control_type_label || 'Contrôle'}</Text>
            <StatusBadge status={mission.status} />
          </View>
          
          <View style={styles.headerMeta}>
            <View style={styles.metaItem}>
              <Calendar size={16} color={colors.textMuted} />
              <Text style={styles.metaText}>{formatDate(mission.scheduled_at)}</Text>
            </View>
            <View style={styles.metaItem}>
              <MapPin size={16} color={colors.textMuted} />
              <Text style={styles.metaText}>{(mission as any).site_name || '-'}</Text>
            </View>
            <View style={styles.metaItem}>
              <User size={16} color={colors.textMuted} />
              <Text style={styles.metaText}>{(mission as any).assigned_to_name || '-'}</Text>
            </View>
          </View>
        </View>

        <View style={styles.content}>
          {canStart && (
            <Button
              title="Démarrer la mission"
              onPress={handleStartMission}
              loading={startMutation.isPending}
              icon={<Play size={18} color={colors.textInverse} />}
              fullWidth
              style={styles.actionButton}
            />
          )}

          {canComplete && (
            <Button
              title="Terminer la mission"
              onPress={handleCompleteMission}
              loading={completeMutation.isPending}
              icon={<CheckCircle size={18} color={colors.textInverse} />}
              fullWidth
              style={styles.actionButton}
            />
          )}

          <SectionCard title={`Équipements (${mission.assets?.length ?? 0})`}>
            {mission.assets && mission.assets.length > 0 ? (
              mission.assets.map((asset) => {
                const report = getAssetReportStatus(asset.id);
                const hasReport = !!report;
                
                return (
                  <View key={asset.id} style={styles.assetItem}>
                    <View style={styles.assetInfo}>
                      <Text style={styles.assetCode}>{asset.code_interne}</Text>
                      <Text style={styles.assetDesignation} numberOfLines={1}>
                        {asset.designation}
                      </Text>
                      <View style={styles.assetMeta}>
                        <Text style={styles.assetCategory}>{asset.categorie}</Text>
                        <CriticalityBadge level={asset.criticite} />
                      </View>
                      {hasReport && (
                        <View style={styles.reportStatus}>
                          <CheckCircle size={14} color={colors.success} />
                          <StatusBadge status={report.conclusion} />
                        </View>
                      )}
                    </View>
                    
                    {canExecute && !hasReport && (
                      <Button
                        title="Contrôler"
                        onPress={() => handleExecuteControl(asset.id)}
                        size="sm"
                      />
                    )}
                    
                    {hasReport && (
                      <View style={styles.completedBadge}>
                        <CheckCircle size={20} color={colors.success} />
                      </View>
                    )}
                  </View>
                );
              })
            ) : (
              <Text style={styles.emptyText}>Aucun équipement associé</Text>
            )}
          </SectionCard>

          {reports && reports.length > 0 && (
            <SectionCard title="Rapports générés">
              {reports.map((report) => (
                <View key={report.id} style={styles.reportItem}>
                  <View style={styles.reportHeader}>
                    <Text style={styles.reportAsset}>
                      {(report as any).asset_code || 'Équipement'}
                    </Text>
                    <StatusBadge status={report.conclusion} />
                  </View>
                  <Text style={styles.reportDate}>
                    {formatDate(report.performed_at)}
                  </Text>
                  {report.summary && (
                    <Text style={styles.reportSummary} numberOfLines={2}>
                      {report.summary}
                    </Text>
                  )}
                  <Text style={styles.reportMeta}>
                    Signé par: {report.signed_by_name || '-'}
                  </Text>
                </View>
              ))}
            </SectionCard>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  headerTitle: {
    ...typography.h2,
    color: colors.text,
    flex: 1,
    marginRight: spacing.md,
  },
  headerMeta: {
    gap: spacing.sm,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  metaText: {
    fontSize: typography.bodySmall.fontSize,
    color: colors.textSecondary,
  },
  content: {
    padding: spacing.lg,
    gap: spacing.lg,
  },
  actionButton: {
    marginBottom: spacing.md,
  },
  assetItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  assetInfo: {
    flex: 1,
    marginRight: spacing.md,
  },
  assetCode: {
    fontSize: typography.caption.fontSize,
    fontWeight: '600' as const,
    color: colors.primary,
  },
  assetDesignation: {
    fontSize: typography.body.fontSize,
    fontWeight: '500' as const,
    color: colors.text,
    marginVertical: spacing.xs,
  },
  assetMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  assetCategory: {
    fontSize: typography.caption.fontSize,
    color: colors.textMuted,
  },
  reportStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  completedBadge: {
    padding: spacing.sm,
  },
  emptyText: {
    fontSize: typography.bodySmall.fontSize,
    color: colors.textMuted,
    textAlign: 'center',
    paddingVertical: spacing.lg,
  },
  reportItem: {
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  reportAsset: {
    fontSize: typography.body.fontSize,
    fontWeight: '500' as const,
    color: colors.text,
  },
  reportDate: {
    fontSize: typography.caption.fontSize,
    color: colors.textMuted,
    marginBottom: spacing.xs,
  },
  reportSummary: {
    fontSize: typography.bodySmall.fontSize,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  reportMeta: {
    fontSize: typography.caption.fontSize,
    color: colors.textMuted,
  },
});
