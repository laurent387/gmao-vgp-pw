import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Package, Filter } from 'lucide-react-native';
import { colors, spacing } from '@/constants/theme';
import { SearchInput } from '@/components/Input';
import { AssetListItem } from '@/components/ListItem';
import { EmptyState, LoadingState } from '@/components/EmptyState';
import { Button } from '@/components/Button';
import { assetRepository, AssetFilters } from '@/repositories/AssetRepository';
import { Asset, AssetStatus } from '@/types';

export default function InventoryScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ siteId?: string }>();
  const initialSiteId = typeof params.siteId === 'string' ? params.siteId : undefined;

  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<AssetFilters>({ siteId: initialSiteId });
  const [showFilters, setShowFilters] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const { data: assets, isLoading, refetch } = useQuery<Asset[]>({
    queryKey: ['assets', filters, search],
    queryFn: () => assetRepository.getAllWithDetails({ ...filters, search: search || undefined }),
  });

  const { data: categories } = useQuery<string[]>({
    queryKey: ['asset-categories'],
    queryFn: () => assetRepository.getCategories(),
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const handleAssetPress = (id: string) => {
    router.push(`/asset/${id}`);
  };

  const toggleStatusFilter = (status: AssetStatus | undefined) => {
    setFilters(f => ({ ...f, statut: f.statut === status ? undefined : status }));
  };

  const toggleCategoryFilter = (category: string | undefined) => {
    setFilters(f => ({ ...f, categorie: f.categorie === category ? undefined : category }));
  };

  const renderItem = ({ item }: { item: Asset }) => (
    <AssetListItem
      code={item.code_interne}
      designation={item.designation}
      categorie={item.categorie}
      statut={item.statut}
      criticite={item.criticite}
      isOverdue={item.is_overdue}
      siteName={item.site_name}
      zoneName={item.zone_name}
      onPress={() => handleAssetPress(item.id)}
    />
  );

  if (isLoading) {
    return <LoadingState message="Chargement des équipements..." />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <SearchInput
          value={search}
          onChangeText={setSearch}
          placeholder="Rechercher un équipement..."
          style={styles.searchInput}
        />
        <Button
          title=""
          onPress={() => setShowFilters(!showFilters)}
          variant={showFilters ? 'primary' : 'outline'}
          icon={<Filter size={20} color={showFilters ? colors.textInverse : colors.primary} />}
          style={styles.filterButton}
        />
      </View>

      {showFilters && (
        <View style={styles.filtersContainer}>
          <Text style={styles.filterLabel}>Statut</Text>
          <View style={styles.filterChips}>
            {(['EN_SERVICE', 'HORS_SERVICE', 'REBUT', 'EN_LOCATION'] as AssetStatus[]).map((status) => (
              <Button
                key={status}
                title={status.replace('_', ' ')}
                onPress={() => toggleStatusFilter(status)}
                variant={filters.statut === status ? 'primary' : 'ghost'}
                size="sm"
                style={styles.filterChip}
              />
            ))}
          </View>

          {categories && categories.length > 0 && (
            <>
              <Text style={styles.filterLabel}>Catégorie</Text>
              <View style={styles.filterChips}>
                {categories.map((cat) => (
                  <Button
                    key={cat}
                    title={cat}
                    onPress={() => toggleCategoryFilter(cat)}
                    variant={filters.categorie === cat ? 'primary' : 'ghost'}
                    size="sm"
                    style={styles.filterChip}
                  />
                ))}
              </View>
            </>
          )}
        </View>
      )}

      <FlatList
        data={assets}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
        ListEmptyComponent={
          <EmptyState
            icon={<Package size={48} color={colors.textMuted} />}
            title="Aucun équipement"
            message="Aucun équipement ne correspond à vos critères"
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
    padding: spacing.lg,
    gap: spacing.md,
  },
  searchInput: {
    flex: 1,
  },
  filterButton: {
    width: 48,
    paddingHorizontal: 0,
  },
  filtersContainer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  filterLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    marginTop: spacing.sm,
  },
  filterChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  filterChip: {
    marginBottom: spacing.xs,
  },
  listContent: {
    padding: spacing.lg,
    flexGrow: 1,
  },
});
