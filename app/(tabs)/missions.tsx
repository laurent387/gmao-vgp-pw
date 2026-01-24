import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { ClipboardList, Plus } from 'lucide-react-native';
import { colors, spacing, borderRadius, typography } from '@/constants/theme';
import { MissionListItem } from '@/components/ListItem';
import { EmptyState, LoadingState } from '@/components/EmptyState';
import { Button } from '@/components/Button';
import { missionRepository } from '@/repositories/MissionRepository';
import { Mission, MissionStatus } from '@/types';
import { useAuth } from '@/contexts/AuthContext';

type FilterType = 'all' | 'mine' | 'pending' | 'completed';

export default function MissionsScreen() {
  const router = useRouter();
  const { user, canCreate } = useAuth();
  const [filter, setFilter] = useState<FilterType>('all');
  const [refreshing, setRefreshing] = useState(false);

  const { data: missions, isLoading, refetch } = useQuery<Mission[]>({
    queryKey: ['missions', filter, user?.id],
    queryFn: () => {
      const filters: { assignedTo?: string; status?: MissionStatus } = {};
      
      if (filter === 'mine' && user?.id) {
        filters.assignedTo = user.id;
      }
      if (filter === 'pending') {
        filters.status = 'PLANIFIEE';
      }
      if (filter === 'completed') {
        filters.status = 'TERMINEE';
      }
      
      return missionRepository.getAllWithDetails(filters);
    },
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const handleMissionPress = (id: string) => {
    router.push(`/mission/${id}`);
  };

  const handleCreateMission = () => {
    router.push('/mission/create');
  };

  const filterOptions: { key: FilterType; label: string }[] = [
    { key: 'all', label: 'Toutes' },
    { key: 'mine', label: 'Mes missions' },
    { key: 'pending', label: 'Planifiées' },
    { key: 'completed', label: 'Terminées' },
  ];

  const renderItem = ({ item }: { item: Mission }) => (
    <MissionListItem
      controlTypeLabel={(item as any).control_type_label || 'Contrôle'}
      scheduledAt={item.scheduled_at}
      status={item.status}
      siteName={(item as any).site_name || ''}
      assignedToName={(item as any).assigned_to_name}
      assetsCount={item.assets?.length ?? 0}
      onPress={() => handleMissionPress(item.id)}
    />
  );

  if (isLoading) {
    return <LoadingState message="Chargement des missions..." />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
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
        
        {canCreate() && (
          <Button
            title="Nouvelle"
            onPress={handleCreateMission}
            icon={<Plus size={18} color={colors.textInverse} />}
            size="sm"
          />
        )}
      </View>

      <FlatList
        data={missions}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
        ListEmptyComponent={
          <EmptyState
            icon={<ClipboardList size={48} color={colors.textMuted} />}
            title="Aucune mission"
            message="Aucune mission ne correspond à vos critères"
            actionLabel={canCreate() ? "Créer une mission" : undefined}
            onAction={canCreate() ? handleCreateMission : undefined}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
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
    fontSize: typography.caption.fontSize,
    fontWeight: '500' as const,
    color: colors.textSecondary,
  },
  filterTabTextActive: {
    color: colors.textInverse,
  },
  listContent: {
    padding: spacing.lg,
    flexGrow: 1,
  },
});
