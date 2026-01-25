import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, TouchableOpacity, TextInput, Modal, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, CheckCircle, Plus, Filter, Search, X, ChevronDown } from 'lucide-react-native';
import { colors, spacing, borderRadius, typography } from '@/constants/theme';
import { NCListItem } from '@/components/ListItem';
import { EmptyState, LoadingState } from '@/components/EmptyState';
import { Button } from '@/components/Button';
import { ncRepository } from '@/repositories/NCRepository';
import { NonConformity, NCStatus } from '@/types';
import { useAuth } from '@/contexts/AuthContext';

type FilterType = 'all' | 'open' | 'closed';

interface AdvancedFilters {
  severity: number | null;
  siteId: string | null;
  search: string;
}

export default function NCScreen() {
  const router = useRouter();
  const { canCreate } = useAuth();
  const [filter, setFilter] = useState<FilterType>('open');
  const [refreshing, setRefreshing] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState<AdvancedFilters>({
    severity: null,
    siteId: null,
    search: '',
  });

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

  const filteredNCs = useMemo(() => {
    if (!ncs) return [];
    
    return ncs.filter((nc) => {
      if (advancedFilters.search) {
        const searchLower = advancedFilters.search.toLowerCase();
        const matchesTitle = nc.title.toLowerCase().includes(searchLower);
        const matchesAsset = (nc as any).asset_code?.toLowerCase().includes(searchLower) ||
                            (nc as any).asset_designation?.toLowerCase().includes(searchLower);
        if (!matchesTitle && !matchesAsset) return false;
      }

      if (advancedFilters.severity !== null && nc.severity < advancedFilters.severity) {
        return false;
      }

      return true;
    });
  }, [ncs, advancedFilters]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (advancedFilters.search) count++;
    if (advancedFilters.severity !== null) count++;
    if (advancedFilters.siteId !== null) count++;
    return count;
  }, [advancedFilters]);

  const clearFilters = () => {
    setAdvancedFilters({ severity: null, siteId: null, search: '' });
  };

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

  const openCount = filteredNCs.filter(nc => nc.status !== 'CLOTUREE').length;

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
        
        <TouchableOpacity
          style={[styles.filterButton, activeFilterCount > 0 && styles.filterButtonActive]}
          onPress={() => setShowFilters(true)}
        >
          <Filter size={18} color={activeFilterCount > 0 ? colors.textInverse : colors.primary} />
          {activeFilterCount > 0 && (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
            </View>
          )}
        </TouchableOpacity>

        {canCreate() && (
          <Button
            title="Nouvelle"
            onPress={handleCreateNC}
            icon={<Plus size={18} color={colors.textInverse} />}
            size="sm"
          />
        )}
      </View>

      <View style={styles.searchBar}>
        <Search size={18} color={colors.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Rechercher par titre ou équipement..."
          placeholderTextColor={colors.textMuted}
          value={advancedFilters.search}
          onChangeText={(text) => setAdvancedFilters({ ...advancedFilters, search: text })}
        />
        {advancedFilters.search.length > 0 && (
          <TouchableOpacity onPress={() => setAdvancedFilters({ ...advancedFilters, search: '' })}>
            <X size={18} color={colors.textMuted} />
          </TouchableOpacity>
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
        data={filteredNCs}
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

      <Modal visible={showFilters} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filtres avancés</Text>
              <TouchableOpacity onPress={() => setShowFilters(false)}>
                <X size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent}>
              <View style={styles.filterSection}>
                <Text style={styles.filterLabel}>Sévérité minimum</Text>
                <View style={styles.severityOptions}>
                  {[null, 1, 2, 3, 4, 5].map((level) => (
                    <TouchableOpacity
                      key={level ?? 'all'}
                      style={[
                        styles.severityOption,
                        advancedFilters.severity === level && styles.severityOptionActive,
                      ]}
                      onPress={() => setAdvancedFilters({ ...advancedFilters, severity: level })}
                    >
                      <Text style={[
                        styles.severityOptionText,
                        advancedFilters.severity === level && styles.severityOptionTextActive,
                      ]}>
                        {level === null ? 'Tous' : `≥ ${level}`}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <Button
                title="Effacer"
                onPress={clearFilters}
                variant="outline"
                style={{ flex: 1 }}
              />
              <Button
                title="Appliquer"
                onPress={() => setShowFilters(false)}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        </View>
      </Modal>
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
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  searchInput: {
    flex: 1,
    fontSize: typography.body.fontSize,
    color: colors.text,
    paddingVertical: spacing.xs,
  },
  filterButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterButtonActive: {
    backgroundColor: colors.primary,
  },
  filterBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBadgeText: {
    fontSize: 10,
    fontWeight: '700' as const,
    color: colors.textInverse,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    ...typography.h3,
    color: colors.text,
  },
  modalContent: {
    padding: spacing.lg,
  },
  modalFooter: {
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  filterSection: {
    marginBottom: spacing.lg,
  },
  filterLabel: {
    fontSize: typography.bodySmall.fontSize,
    fontWeight: '600' as const,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  severityOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  severityOption: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
  },
  severityOptionActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  severityOptionText: {
    fontSize: typography.bodySmall.fontSize,
    color: colors.text,
  },
  severityOptionTextActive: {
    color: colors.textInverse,
    fontWeight: '600' as const,
  },
});
