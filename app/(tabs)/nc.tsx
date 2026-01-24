import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, CheckCircle, Plus } from 'lucide-react-native';
import { colors, spacing, borderRadius, typography } from '@/constants/theme';
import { NCListItem } from '@/components/ListItem';
import { EmptyState, LoadingState } from '@/components/EmptyState';
import { Button } from '@/components/Button';
import { ncRepository } from '@/repositories/NCRepository';
import { NonConformity, NCStatus } from '@/types';
import { useAuth } from '@/contexts/AuthContext';

type FilterType = 'all' | 'open' | 'closed';

export default function NCScreen() {
  const router = useRouter();
  const { canCreate } = useAuth();
  const [filter, setFilter] = useState<FilterType>('open');
  const [refreshing, setRefreshing] = useState(false);

  const { data: ncs, isLoading, refetch } = useQuery<NonConformity[]>({
    queryKey: ['nonconformities', filter],
    queryFn: () => {
      if (filter === 'open') {
        return ncRepository.getAllWithDetails({ status: 'OUVERTE' });
      }
      if (filter === 'closed') {
        return ncRepository.getAllWithDetails({ status: 'CLOTUREE' });
      }
      return ncRepository.getAllWithDetails();
    },
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const handleNCPress = (id: string) => {
    router.push(`/nc/${id}`);
  };

  const handleCreateNC = () => {
    router.push('/nc/create');
  };

  const filterOptions: { key: FilterType; label: string }[] = [
    { key: 'open', label: 'Ouvertes' },
    { key: 'closed', label: 'Clôturées' },
    { key: 'all', label: 'Toutes' },
  ];

  const openCount = ncs?.filter(nc => nc.status !== 'CLOTUREE').length ?? 0;

  const renderItem = ({ item }: { item: NonConformity }) => (
    <NCListItem
      title={item.title}
      assetCode={(item as any).asset_code}
      severity={item.severity}
      status={item.status}
      actionStatus={(item as any).action_status}
      createdAt={item.created_at}
      onPress={() => handleNCPress(item.id)}
    />
  );

  if (isLoading) {
    return <LoadingState message="Chargement des non-conformités..." />;
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
            onPress={handleCreateNC}
            icon={<Plus size={18} color={colors.textInverse} />}
            size="sm"
          />
        )}
      </View>

      {openCount > 0 && (
        <View style={styles.alertBanner}>
          <AlertTriangle size={18} color={colors.danger} />
          <Text style={styles.alertText}>
            {openCount} non-conformité(s) ouverte(s) nécessitant une action
          </Text>
        </View>
      )}

      <FlatList
        data={ncs}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
        ListEmptyComponent={
          <EmptyState
            icon={<CheckCircle size={48} color={colors.success} />}
            title="Aucune non-conformité"
            message={filter === 'open' ? "Toutes les NC ont été traitées" : "Aucune NC trouvée"}
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
  alertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    backgroundColor: colors.dangerLight,
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    borderRadius: borderRadius.md,
  },
  alertText: {
    flex: 1,
    fontSize: typography.bodySmall.fontSize,
    color: colors.danger,
    fontWeight: '500' as const,
  },
  listContent: {
    padding: spacing.lg,
    flexGrow: 1,
  },
});
