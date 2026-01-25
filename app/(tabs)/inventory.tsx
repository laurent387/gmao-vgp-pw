import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Package, Filter, Building2, MapPin, X } from 'lucide-react-native';
import { colors, spacing, borderRadius } from '@/constants/theme';
import { SearchInput } from '@/components/Input';
import { AssetListItem } from '@/components/ListItem';
import { EmptyState, LoadingState } from '@/components/EmptyState';
import { Button } from '@/components/Button';
import { assetRepository, AssetFilters } from '@/repositories/AssetRepository';
import { clientRepository, siteRepository } from '@/repositories/SiteRepository';
import type { Asset, AssetStatus, Client, Site } from '@/types';

export default function InventoryScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ clientId?: string; siteId?: string }>();
  const initialClientId = typeof params.clientId === 'string' ? params.clientId : undefined;
  const initialSiteId = typeof params.siteId === 'string' ? params.siteId : undefined;

  const [search, setSearch] = useState<string>('');
  const [filters, setFilters] = useState<AssetFilters>({ clientId: initialClientId, siteId: initialSiteId });
  const [showFilters, setShowFilters] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const { data: assets, isLoading, refetch } = useQuery<Asset[]>({
    queryKey: ['assets', filters, search],
    queryFn: () => assetRepository.getAllWithDetails({ ...filters, search: search || undefined }),
  });

  const { data: clients } = useQuery<Client[]>({
    queryKey: ['clients'],
    queryFn: () => clientRepository.getAll(),
  });

  const { data: sites } = useQuery<Site[]>({
    queryKey: ['sites-with-client'],
    queryFn: () => siteRepository.getAllWithClientName(),
  });

  const { data: categories } = useQuery<string[]>({
    queryKey: ['asset-categories'],
    queryFn: () => assetRepository.getCategories(),
  });

  const sitesForSelectedClient = useMemo<Site[]>(() => {
    const allSites = sites ?? [];
    if (!filters.clientId) return allSites;
    return allSites.filter((s) => s.client_id === filters.clientId);
  }, [filters.clientId, sites]);

  useEffect(() => {
    if (!sites || !filters.siteId) return;
    if (filters.clientId) return;
    const site = sites.find((s) => s.id === filters.siteId);
    if (!site) return;
    console.log('[INVENTORY] inferred clientId from siteId', { siteId: filters.siteId, clientId: site.client_id });
    setFilters((prev) => ({ ...prev, clientId: site.client_id }));
  }, [filters.clientId, filters.siteId, sites]);

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

  const toggleClientFilter = (clientId: string | undefined) => {
    setFilters((prev) => {
      const nextClientId = prev.clientId === clientId ? undefined : clientId;
      return {
        ...prev,
        clientId: nextClientId,
        siteId: nextClientId ? prev.siteId : undefined,
        zoneId: undefined,
      };
    });
  };

  const toggleSiteFilter = (siteId: string | undefined) => {
    setFilters((prev) => ({ ...prev, siteId: prev.siteId === siteId ? undefined : siteId, zoneId: undefined }));
  };

  const clearLocationFilters = () => {
    setFilters((prev) => ({ ...prev, clientId: undefined, siteId: undefined, zoneId: undefined }));
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
        <View style={styles.filtersContainer} testID="inventory-filters">
          <View style={styles.filtersHeaderRow}>
            <Text style={styles.filtersTitle}>Filtres</Text>
            {(filters.clientId || filters.siteId) && (
              <Button
                title=""
                onPress={clearLocationFilters}
                variant="ghost"
                size="sm"
                icon={<X size={18} color={colors.textSecondary} />}
                style={styles.clearButton}
              />
            )}
          </View>

          <Text style={styles.filterLabel}>Client</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScrollContent}>
            {(clients ?? [])
              .slice()
              .sort((a, b) => a.name.localeCompare(b.name))
              .map((client) => (
                <Button
                  key={client.id}
                  title={client.name}
                  onPress={() => toggleClientFilter(client.id)}
                  variant={filters.clientId === client.id ? 'primary' : 'ghost'}
                  size="sm"
                  icon={<Building2 size={16} color={filters.clientId === client.id ? colors.textInverse : colors.textSecondary} />}
                  style={styles.filterChip}
                  testID={`inventory-filter-client-${client.id}`}
                />
              ))}
          </ScrollView>

          <Text style={styles.filterLabel}>Site</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScrollContent}>
            {sitesForSelectedClient
              .slice()
              .sort((a, b) => a.name.localeCompare(b.name))
              .map((site) => (
                <Button
                  key={site.id}
                  title={site.name}
                  onPress={() => toggleSiteFilter(site.id)}
                  variant={filters.siteId === site.id ? 'primary' : 'ghost'}
                  size="sm"
                  icon={<MapPin size={16} color={filters.siteId === site.id ? colors.textInverse : colors.textSecondary} />}
                  style={styles.filterChip}
                  testID={`inventory-filter-site-${site.id}`}
                />
              ))}
          </ScrollView>

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
                testID={`inventory-filter-status-${status}`}
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
                    testID={`inventory-filter-category-${cat}`}
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
  filtersHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
    marginBottom: spacing.sm,
  },
  filtersTitle: {
    fontSize: 14,
    fontWeight: '800' as const,
    color: colors.text,
  },
  clearButton: {
    width: 40,
    paddingHorizontal: 0,
    borderRadius: borderRadius.full,
  },
  filterScrollContent: {
    paddingRight: spacing.lg,
    gap: spacing.sm,
    paddingBottom: spacing.xs,
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
