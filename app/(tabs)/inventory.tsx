import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, ScrollView, TouchableOpacity, Animated } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Package, Filter, Building2, MapPin, X, ChevronDown, Check } from 'lucide-react-native';
import { colors, spacing, borderRadius, shadows } from '@/constants/theme';
import { SearchInput } from '@/components/Input';
import { AssetListItem } from '@/components/ListItem';
import { EmptyState, LoadingState } from '@/components/EmptyState';
import { assetRepository, AssetFilters } from '@/repositories/AssetRepository';
import { clientRepository, siteRepository } from '@/repositories/SiteRepository';
import type { Asset, AssetStatus, Client, Site } from '@/types';

const STATUS_CONFIG: Record<AssetStatus, { label: string; color: string; bgColor: string }> = {
  EN_SERVICE: { label: 'En service', color: colors.success, bgColor: colors.successLight },
  HORS_SERVICE: { label: 'Hors service', color: colors.warning, bgColor: colors.warningLight },
  REBUT: { label: 'Rebut', color: colors.danger, bgColor: colors.dangerLight },
  EN_LOCATION: { label: 'En location', color: '#8B5CF6', bgColor: '#EDE9FE' },
};

interface FilterChipProps {
  label: string;
  selected: boolean;
  onPress: () => void;
  icon?: React.ReactNode;
  color?: string;
}

function FilterChip({ label, selected, onPress, icon, color }: FilterChipProps) {
  const chipColor = color || colors.primary;
  
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={[
        styles.chip,
        selected && { backgroundColor: chipColor, borderColor: chipColor },
      ]}
    >
      {icon && <View style={styles.chipIcon}>{icon}</View>}
      <Text style={[
        styles.chipText,
        selected && styles.chipTextSelected,
      ]} numberOfLines={1}>
        {label}
      </Text>
      {selected && (
        <Check size={14} color={colors.textInverse} style={styles.chipCheck} />
      )}
    </TouchableOpacity>
  );
}

interface ActiveFilterTagProps {
  label: string;
  onRemove: () => void;
}

function ActiveFilterTag({ label, onRemove }: ActiveFilterTagProps) {
  return (
    <View style={styles.activeTag}>
      <Text style={styles.activeTagText} numberOfLines={1}>{label}</Text>
      <TouchableOpacity onPress={onRemove} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <X size={14} color={colors.primary} />
      </TouchableOpacity>
    </View>
  );
}

export default function InventoryScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ clientId?: string; siteId?: string }>();
  const initialClientId = typeof params.clientId === 'string' ? params.clientId : undefined;
  const initialSiteId = typeof params.siteId === 'string' ? params.siteId : undefined;

  const [search, setSearch] = useState<string>('');
  const [filters, setFilters] = useState<AssetFilters>({ clientId: initialClientId, siteId: initialSiteId });
  const [showFilters, setShowFilters] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [filterHeight] = useState(new Animated.Value(0));

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

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.clientId) count++;
    if (filters.siteId) count++;
    if (filters.statut) count++;
    if (filters.categorie) count++;
    return count;
  }, [filters]);

  const selectedClient = useMemo(() => {
    return clients?.find(c => c.id === filters.clientId);
  }, [clients, filters.clientId]);

  const selectedSite = useMemo(() => {
    return sites?.find(s => s.id === filters.siteId);
  }, [sites, filters.siteId]);

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

  const clearAllFilters = () => {
    setFilters({});
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

  const renderActiveFilters = () => {
    if (activeFilterCount === 0) return null;
    
    return (
      <View style={styles.activeFiltersContainer}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.activeFiltersContent}
        >
          {selectedClient && (
            <ActiveFilterTag 
              label={selectedClient.name} 
              onRemove={() => toggleClientFilter(undefined)} 
            />
          )}
          {selectedSite && (
            <ActiveFilterTag 
              label={selectedSite.name} 
              onRemove={() => toggleSiteFilter(undefined)} 
            />
          )}
          {filters.statut && (
            <ActiveFilterTag 
              label={STATUS_CONFIG[filters.statut].label} 
              onRemove={() => toggleStatusFilter(undefined)} 
            />
          )}
          {filters.categorie && (
            <ActiveFilterTag 
              label={filters.categorie} 
              onRemove={() => toggleCategoryFilter(undefined)} 
            />
          )}
        </ScrollView>
        <TouchableOpacity onPress={clearAllFilters} style={styles.clearAllButton}>
          <Text style={styles.clearAllText}>Effacer</Text>
        </TouchableOpacity>
      </View>
    );
  };

  if (isLoading) {
    return <LoadingState message="Chargement des équipements..." />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.searchRow}>
          <SearchInput
            value={search}
            onChangeText={setSearch}
            placeholder="Rechercher un équipement..."
            style={styles.searchInput}
          />
          <TouchableOpacity
            onPress={() => setShowFilters(!showFilters)}
            activeOpacity={0.7}
            style={[
              styles.filterButton,
              showFilters && styles.filterButtonActive,
            ]}
          >
            <Filter size={20} color={showFilters ? colors.textInverse : colors.primary} />
            {activeFilterCount > 0 && !showFilters && (
              <View style={styles.filterBadge}>
                <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {!showFilters && renderActiveFilters()}
      </View>

      {showFilters && (
        <View style={styles.filtersPanel} testID="inventory-filters">
          <View style={styles.filtersPanelHeader}>
            <Text style={styles.filtersPanelTitle}>Filtres</Text>
            {activeFilterCount > 0 && (
              <TouchableOpacity onPress={clearAllFilters}>
                <Text style={styles.resetFiltersText}>Réinitialiser</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.filterSection}>
            <View style={styles.filterSectionHeader}>
              <Building2 size={16} color={colors.textSecondary} />
              <Text style={styles.filterSectionTitle}>Client</Text>
            </View>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false} 
              contentContainerStyle={styles.chipsScroll}
            >
              {(clients ?? [])
                .slice()
                .sort((a, b) => a.name.localeCompare(b.name))
                .map((client) => (
                  <FilterChip
                    key={client.id}
                    label={client.name}
                    selected={filters.clientId === client.id}
                    onPress={() => toggleClientFilter(client.id)}
                  />
                ))}
            </ScrollView>
          </View>

          <View style={styles.filterSection}>
            <View style={styles.filterSectionHeader}>
              <MapPin size={16} color={colors.textSecondary} />
              <Text style={styles.filterSectionTitle}>Site</Text>
              {filters.clientId && (
                <Text style={styles.filterSectionHint}>
                  ({sitesForSelectedClient.length} disponibles)
                </Text>
              )}
            </View>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false} 
              contentContainerStyle={styles.chipsScroll}
            >
              {sitesForSelectedClient.length === 0 ? (
                <Text style={styles.noDataText}>Sélectionnez un client</Text>
              ) : (
                sitesForSelectedClient
                  .slice()
                  .sort((a, b) => a.name.localeCompare(b.name))
                  .map((site) => (
                    <FilterChip
                      key={site.id}
                      label={site.name}
                      selected={filters.siteId === site.id}
                      onPress={() => toggleSiteFilter(site.id)}
                    />
                  ))
              )}
            </ScrollView>
          </View>

          <View style={styles.filterSection}>
            <Text style={styles.filterSectionTitle}>Statut</Text>
            <View style={styles.statusChipsContainer}>
              {(Object.keys(STATUS_CONFIG) as AssetStatus[]).map((status) => {
                const config = STATUS_CONFIG[status];
                const isSelected = filters.statut === status;
                return (
                  <TouchableOpacity
                    key={status}
                    onPress={() => toggleStatusFilter(status)}
                    activeOpacity={0.7}
                    style={[
                      styles.statusChip,
                      { 
                        backgroundColor: isSelected ? config.color : config.bgColor,
                        borderColor: config.color,
                      },
                    ]}
                  >
                    <View style={[
                      styles.statusDot,
                      { backgroundColor: isSelected ? colors.textInverse : config.color }
                    ]} />
                    <Text style={[
                      styles.statusChipText,
                      { color: isSelected ? colors.textInverse : config.color }
                    ]}>
                      {config.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {categories && categories.length > 0 && (
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Catégorie</Text>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false} 
                contentContainerStyle={styles.chipsScroll}
              >
                {categories.map((cat) => (
                  <FilterChip
                    key={cat}
                    label={cat}
                    selected={filters.categorie === cat}
                    onPress={() => toggleCategoryFilter(cat)}
                  />
                ))}
              </ScrollView>
            </View>
          )}

          <TouchableOpacity 
            style={styles.applyButton}
            onPress={() => setShowFilters(false)}
            activeOpacity={0.8}
          >
            <Text style={styles.applyButtonText}>
              Voir {assets?.length ?? 0} résultat{(assets?.length ?? 0) !== 1 ? 's' : ''}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.resultsHeader}>
        <Text style={styles.resultsCount}>
          {assets?.length ?? 0} équipement{(assets?.length ?? 0) !== 1 ? 's' : ''}
        </Text>
      </View>

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
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  searchRow: {
    flexDirection: 'row',
    padding: spacing.lg,
    gap: spacing.md,
  },
  searchInput: {
    flex: 1,
  },
  filterButton: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: colors.danger,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  filterBadgeText: {
    color: colors.textInverse,
    fontSize: 11,
    fontWeight: '700' as const,
  },
  activeFiltersContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    gap: spacing.sm,
  },
  activeFiltersContent: {
    gap: spacing.sm,
    paddingRight: spacing.sm,
  },
  activeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.infoLight,
    paddingVertical: 6,
    paddingLeft: spacing.md,
    paddingRight: spacing.sm,
    borderRadius: borderRadius.full,
    gap: spacing.xs,
  },
  activeTagText: {
    fontSize: 13,
    fontWeight: '500' as const,
    color: colors.primary,
    maxWidth: 120,
  },
  clearAllButton: {
    paddingHorizontal: spacing.sm,
  },
  clearAllText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: colors.danger,
  },
  filtersPanel: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: spacing.md,
    ...shadows.md,
  },
  filtersPanelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  filtersPanelTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: colors.text,
  },
  resetFiltersText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.primary,
  },
  filterSection: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  filterSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  filterSectionTitle: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  filterSectionHint: {
    fontSize: 12,
    color: colors.textMuted,
    marginLeft: spacing.xs,
  },
  chipsScroll: {
    gap: spacing.sm,
    paddingRight: spacing.lg,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    gap: spacing.xs,
  },
  chipIcon: {
    marginRight: 2,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: colors.text,
    maxWidth: 140,
  },
  chipTextSelected: {
    color: colors.textInverse,
  },
  chipCheck: {
    marginLeft: 2,
  },
  statusChipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: borderRadius.full,
    borderWidth: 1.5,
    gap: spacing.xs,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusChipText: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
  noDataText: {
    fontSize: 14,
    color: colors.textMuted,
    fontStyle: 'italic',
  },
  applyButton: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  applyButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.textInverse,
  },
  resultsHeader: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.background,
  },
  resultsCount: {
    fontSize: 13,
    fontWeight: '500' as const,
    color: colors.textMuted,
  },
  listContent: {
    padding: spacing.lg,
    paddingTop: spacing.sm,
    flexGrow: 1,
  },
});
