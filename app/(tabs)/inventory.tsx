import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, ScrollView, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Filter, Building2, MapPin, Check } from 'lucide-react-native';
import { colors, spacing, borderRadius, typography, shadows } from '@/constants/theme';
import { SearchInput } from '@/components/Input';
import { DataTable, type Column } from '@/components/DataTable';
import { DesktopFilterBar } from '@/components/DesktopFilterBar';
import { EmptyState, LoadingState } from '@/components/EmptyState';
import { useIsDesktop, useScreenSize } from '@/hooks/useResponsive';
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
  color?: string;
}

function FilterChip({ label, selected, onPress, color }: FilterChipProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={[
        styles.chip,
        selected && { backgroundColor: color || colors.primary, borderColor: color || colors.primary },
      ]}
    >
      <Text style={[styles.chipText, selected && styles.chipTextSelected]} numberOfLines={1}>
        {label}
      </Text>
      {selected && <Check size={14} color={colors.textInverse} />}
    </TouchableOpacity>
  );
}

function MobileFilterPanel({
  clients,
  sites,
  categories,
  statuses,
  filters,
  onFilterChange,
  onClearFilters,
}: {
  clients: Client[];
  sites: Site[];
  categories: string[];
  statuses: AssetStatus[];
  filters: AssetFilters;
  onFilterChange: (key: string, value: any) => void;
  onClearFilters: () => void;
}) {
  return (
    <ScrollView style={styles.mobileFilterPanel} showsVerticalScrollIndicator={false}>
      {/* Clients */}
      <View style={styles.filterSection}>
        <View style={styles.filterSectionHeader}>
          <Building2 size={16} color={colors.textSecondary} />
          <Text style={styles.filterSectionTitle}>Clients</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsContainer}>
          {clients.map((client) => (
            <FilterChip
              key={client.id}
              label={client.name}
              selected={filters.clientId === client.id}
              onPress={() => onFilterChange('clientId', filters.clientId === client.id ? undefined : client.id)}
            />
          ))}
        </ScrollView>
      </View>

      {/* Sites */}
      {sites.length > 0 && (
        <View style={styles.filterSection}>
          <View style={styles.filterSectionHeader}>
            <MapPin size={16} color={colors.textSecondary} />
            <Text style={styles.filterSectionTitle}>Sites</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsContainer}>
            {sites.map((site) => (
              <FilterChip
                key={site.id}
                label={site.name}
                selected={filters.siteId === site.id}
                onPress={() => onFilterChange('siteId', filters.siteId === site.id ? undefined : site.id)}
              />
            ))}
          </ScrollView>
        </View>
      )}

      {/* Statuses */}
      <View style={styles.filterSection}>
        <Text style={styles.filterSectionTitle}>Statut</Text>
        <View style={styles.statusGrid}>
          {statuses.map((status) => {
            const config = STATUS_CONFIG[status];
            return (
              <TouchableOpacity
                key={status}
                style={[
                  styles.statusChip,
                  { backgroundColor: config.bgColor },
                  filters.statut === status && styles.statusChipSelected,
                ]}
                onPress={() => onFilterChange('statut', filters.statut === status ? undefined : status)}
              >
                <View style={[styles.statusDot, { backgroundColor: config.color }]} />
                <Text style={[styles.statusChipText, { color: config.color }]}>{config.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Categories */}
      {categories.length > 0 && (
        <View style={styles.filterSection}>
          <Text style={styles.filterSectionTitle}>Catégorie</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsContainer}>
            {categories.map((cat) => (
              <FilterChip
                key={cat}
                label={cat}
                selected={filters.categorie === cat}
                onPress={() => onFilterChange('categorie', filters.categorie === cat ? undefined : cat)}
              />
            ))}
          </ScrollView>
        </View>
      )}

      <TouchableOpacity style={styles.clearButton} onPress={onClearFilters}>
        <Text style={styles.clearButtonText}>Réinitialiser les filtres</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

export default function InventoryScreen() {
  const router = useRouter();
  const isDesktop = useIsDesktop();
  const screenSize = useScreenSize();
  const params = useLocalSearchParams<{ clientId?: string; siteId?: string }>();
  const initialClientId = typeof params.clientId === 'string' ? params.clientId : undefined;
  const initialSiteId = typeof params.siteId === 'string' ? params.siteId : undefined;

  const [search, setSearch] = useState<string>('');
  const [filters, setFilters] = useState<AssetFilters>({ clientId: initialClientId, siteId: initialSiteId });
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [sortConfig, setSortConfig] = useState<{ key: string; order: 'asc' | 'desc' | null } | null>(null);

  const { data: assets, isLoading, refetch } = useQuery<Asset[]>({
    queryKey: ['assets', filters, search],
    queryFn: () => assetRepository.getAllWithDetails({ ...filters, search: search || undefined }),
  });

  const { data: clients } = useQuery<Client[]>({
    queryKey: ['clients'],
    queryFn: () => clientRepository.getAll(),
  });

  const { data: sites } = useQuery<Site[]>({
    queryKey: ['sites'],
    queryFn: () => siteRepository.getAllWithClientName(),
  });

  const { data: categories } = useQuery<string[]>({
    queryKey: ['asset-categories'],
    queryFn: () => assetRepository.getCategories(),
  });

  const clientList = Array.isArray(clients) ? clients : [];
  const siteList = Array.isArray(sites) ? sites : [];
  const categoryList = Array.isArray(categories) ? categories : [];

  const sortedAssets = useMemo(() => {
    if (!assets || !sortConfig) return assets;

    const sorted = [...assets].sort((a, b) => {
      const aVal = a[sortConfig.key as keyof Asset];
      const bVal = b[sortConfig.key as keyof Asset];

      if (aVal === bVal) return 0;
      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;

      const comparison = aVal < bVal ? -1 : 1;
      return sortConfig.order === 'asc' ? comparison : -comparison;
    });

    return sorted;
  }, [assets, sortConfig]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const handleFilterChange = (key: string, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleClearFilters = () => {
    setFilters({});
    setSearch('');
  };

  const handleRowPress = (asset: Asset) => {
    router.push(`/asset/${asset.id}`);
  };

  const handleSort = (key: string, order: 'asc' | 'desc' | null) => {
    setSortConfig(order ? { key, order } : null);
  };

  if (isLoading) {
    return <LoadingState message="Chargement de l'inventaire..." />;
  }

  // DESKTOP VIEW - TABLE
  if (isDesktop) {
    const tableColumns: Column<Asset>[] = [
      {
        key: 'code_interne',
        title: 'Code',
        width: 100,
        sortable: true,
      },
      {
        key: 'designation',
        title: 'Désignation',
        sortable: true,
        render: (value) => value || '-',
      },
      {
        key: 'marque',
        title: 'Marque',
        width: 120,
        sortable: true,
        render: (value) => value || '-',
      },
      {
        key: 'modele',
        title: 'Modèle',
        width: 140,
        sortable: true,
        render: (value) => value || '-',
      },
      {
        key: 'categorie',
        title: 'Catégorie',
        width: 130,
        sortable: true,
      },
      {
        key: 'statut',
        title: 'Statut',
        width: 120,
        render: (value: AssetStatus) => {
          const config = STATUS_CONFIG[value];
          return (
            <View style={[styles.statusBadge, { backgroundColor: config.bgColor }]}>
              <Text style={[styles.statusBadgeText, { color: config.color }]}>{config.label}</Text>
            </View>
          );
        },
      },
      {
        key: 'site_name',
        title: 'Site',
        width: 150,
        sortable: true,
        render: (value) => value || '-',
      },
    ];

    return (
      <View style={styles.container}>
        {/* Desktop Filter Bar */}
        <DesktopFilterBar
          filters={{
            'Client': clientList.map(c => ({ label: c.name, value: c.id })),
            'Site': siteList.map(s => ({ label: s.name, value: s.id })),
            'Catégorie': categoryList.map(c => ({ label: c, value: c })),
            'Statut': Object.entries(STATUS_CONFIG).map(([key, config]) => ({
              label: config.label,
              value: key,
            })),
          }}
          values={filters as any}
          onChange={handleFilterChange}
          onClear={(key) => handleFilterChange(key, undefined)}
          searchValue={search}
          onSearchChange={setSearch}
        />

        {/* Table */}
        <DataTable<Asset>
          columns={tableColumns}
          data={sortedAssets || []}
          onRowPress={handleRowPress}
          onSort={handleSort}
          loading={isLoading}
        />

        {/* Results count */}
        <View style={styles.desktopFooter}>
          <Text style={styles.resultsCountText}>
            {sortedAssets?.length || 0} équipement{(sortedAssets?.length || 0) !== 1 ? 's' : ''}
          </Text>
        </View>
      </View>
    );
  }

  // MOBILE VIEW - CARDS
  return (
    <View style={styles.container}>
      <View style={styles.mobileHeader}>
        <SearchInput
          value={search}
          onChangeText={setSearch}
          placeholder="Rechercher..."
          style={styles.mobileSearch}
        />
        <TouchableOpacity
          style={[styles.filterButton, showMobileFilters && styles.filterButtonActive]}
          onPress={() => setShowMobileFilters(!showMobileFilters)}
        >
          <Filter size={20} color={showMobileFilters ? colors.textInverse : colors.primary} />
        </TouchableOpacity>
      </View>

      {showMobileFilters && (
        <MobileFilterPanel
          clients={clientList}
          sites={siteList}
          categories={categoryList}
          statuses={Object.keys(STATUS_CONFIG) as AssetStatus[]}
          filters={filters}
          onFilterChange={handleFilterChange}
          onClearFilters={handleClearFilters}
        />
      )}

      <FlatList
        data={sortedAssets || []}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.assetCard, shadows.sm]}
            onPress={() => handleRowPress(item)}
            activeOpacity={0.8}
          >
            <View style={styles.assetCardHeader}>
              <Text style={styles.assetName} numberOfLines={1}>{item.designation}</Text>
              <View style={[styles.statusChip, { backgroundColor: STATUS_CONFIG[item.statut].bgColor }]}>
                <Text style={[styles.statusChipText, { color: STATUS_CONFIG[item.statut].color }]}>
                  {STATUS_CONFIG[item.statut].label}
                </Text>
              </View>
            </View>
            <View style={styles.assetDetails}>
              <Text style={styles.detailLabel}>Marque: <Text style={styles.detailValue}>{item.marque || '-'}</Text></Text>
              <Text style={styles.detailLabel}>Modèle: <Text style={styles.detailValue}>{item.modele || '-'}</Text></Text>
              <Text style={styles.detailLabel}>Site: <Text style={styles.detailValue}>{item.site_name || '-'}</Text></Text>
            </View>
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <EmptyState
            title="Aucun équipement"
            message="Ajustez vos filtres ou recherchez un équipement"
          />
        }
      />

      <View style={styles.mobileFooter}>
        <Text style={styles.resultsCountText}>
          {sortedAssets?.length || 0} équipement{(sortedAssets?.length || 0) !== 1 ? 's' : ''}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  
  // DESKTOP STYLES
  desktopFooter: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  statusBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  statusBadgeText: {
    ...typography.body3,
    fontWeight: '600',
  },

  // MOBILE STYLES
  mobileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  mobileSearch: {
    flex: 1,
    height: 40,
  },
  filterButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surfaceAlt,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: colors.primary,
  },
  mobileFilterPanel: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    maxHeight: 400,
  },
  filterSection: {
    marginBottom: spacing.lg,
  },
  filterSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  filterSectionTitle: {
    ...typography.subtitle2,
    fontWeight: '600',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  chipsContainer: {
    marginHorizontal: -spacing.md,
    paddingHorizontal: spacing.md,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.xs,
    marginRight: spacing.sm,
  },
  chipText: {
    ...typography.body3,
    fontWeight: '500',
    color: colors.text,
  },
  chipTextSelected: {
    color: colors.textInverse,
  },
  statusGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 2,
    borderColor: 'transparent',
    flex: 0.48,
    gap: spacing.xs,
  },
  statusChipSelected: {
    borderColor: colors.primary,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusChipText: {
    ...typography.body3,
    fontWeight: '600',
  },
  clearButton: {
    marginTop: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  clearButtonText: {
    ...typography.body3,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  listContent: {
    paddingHorizontal: spacing.sm,
    paddingBottom: spacing.lg,
    gap: spacing.sm,
  },
  assetCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  assetCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  assetName: {
    ...typography.subtitle2,
    fontWeight: '700',
    color: colors.text,
    flex: 1,
  },
  assetDetails: {
    gap: spacing.xs,
  },
  detailLabel: {
    ...typography.body3,
    color: colors.textMuted,
  },
  detailValue: {
    color: colors.text,
    fontWeight: '600',
  },
  mobileFooter: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    alignItems: 'center',
  },
  resultsCountText: {
    ...typography.body3,
    color: colors.textMuted,
    fontWeight: '500',
  },
});
