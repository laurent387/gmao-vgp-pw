import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Building2, ChevronDown, ChevronRight, MapPin, Package } from 'lucide-react-native';
import { colors, spacing, borderRadius, typography, shadows } from '@/constants/theme';
import { EmptyState, LoadingState } from '@/components/EmptyState';
import { Card } from '@/components/Card';
import { assetRepository } from '@/repositories/AssetRepository';
import { clientRepository, siteRepository } from '@/repositories/SiteRepository';
import type { Asset, Client, Site } from '@/types';

type ClientRow = {
  client: Client;
  sites: Site[];
  assetsCount: number;
};

export default function ClientSitesScreen() {
  const router = useRouter();

  const [expandedClientIds, setExpandedClientIds] = useState<Record<string, boolean>>({});
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const clientsQuery = useQuery<Client[]>({
    queryKey: ['clients'],
    queryFn: async () => {
      const data = await clientRepository.getAll();
      console.log('[CLIENT_SITES] clients loaded', { count: data.length });
      return data;
    },
  });

  const sitesQuery = useQuery<Site[]>({
    queryKey: ['sites-with-client'],
    queryFn: async () => {
      const data = await siteRepository.getAllWithClientName();
      console.log('[CLIENT_SITES] sites loaded', { count: data.length });
      return data;
    },
  });

  const assetsQuery = useQuery<Asset[]>({
    queryKey: ['assets-for-site-browser'],
    queryFn: async () => {
      const data = await assetRepository.getAllWithDetails();
      console.log('[CLIENT_SITES] assets loaded', { count: data.length });
      return data;
    },
  });

  const clientRows = useMemo<ClientRow[]>(() => {
    const clients = clientsQuery.data ?? [];
    const sites = sitesQuery.data ?? [];
    const assets = assetsQuery.data ?? [];

    const sitesByClient = new Map<string, Site[]>();
    for (const s of sites) {
      const arr = sitesByClient.get(s.client_id) ?? [];
      arr.push(s);
      sitesByClient.set(s.client_id, arr);
    }

    const assetsByClient = new Map<string, number>();
    const siteById = new Map<string, Site>();
    for (const s of sites) siteById.set(s.id, s);

    for (const a of assets) {
      const s = siteById.get(a.site_id);
      if (!s) continue;
      assetsByClient.set(s.client_id, (assetsByClient.get(s.client_id) ?? 0) + 1);
    }

    return clients
      .slice()
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((client) => ({
        client,
        sites: (sitesByClient.get(client.id) ?? []).slice().sort((a, b) => a.name.localeCompare(b.name)),
        assetsCount: assetsByClient.get(client.id) ?? 0,
      }))
      .filter((row) => row.sites.length > 0);
  }, [assetsQuery.data, clientsQuery.data, sitesQuery.data]);

  const assetCountBySiteId = useMemo<Record<string, number>>(() => {
    const sites = sitesQuery.data ?? [];
    const assets = assetsQuery.data ?? [];

    const map: Record<string, number> = {};
    for (const s of sites) map[s.id] = 0;
    for (const a of assets) {
      map[a.site_id] = (map[a.site_id] ?? 0) + 1;
    }
    return map;
  }, [assetsQuery.data, sitesQuery.data]);

  const isLoading = clientsQuery.isLoading || sitesQuery.isLoading || assetsQuery.isLoading;

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([clientsQuery.refetch(), sitesQuery.refetch(), assetsQuery.refetch()]);
    } finally {
      setRefreshing(false);
    }
  }, [clientsQuery, sitesQuery, assetsQuery]);

  const toggleExpanded = useCallback((clientId: string) => {
    setExpandedClientIds((prev) => ({ ...prev, [clientId]: !prev[clientId] }));
  }, []);

  const openSite = useCallback(
    (siteId: string, clientId: string) => {
      console.log('[CLIENT_SITES] open site', { siteId, clientId });
      router.push({ pathname: '/(tabs)/inventory', params: { siteId, clientId } });
    },
    [router]
  );

  const renderClient = ({ item }: { item: ClientRow }) => {
    const expanded = Boolean(expandedClientIds[item.client.id]);

    return (
      <Card style={styles.clientCard}>
        <TouchableOpacity
          onPress={() => toggleExpanded(item.client.id)}
          activeOpacity={0.75}
          testID={`client-card-${item.client.id}`}
          style={styles.clientHeader}
        >
          <View style={styles.clientIconWrap}>
            <Building2 size={18} color={colors.primary} />
          </View>

          <View style={styles.clientHeaderText}>
            <Text style={styles.clientName} numberOfLines={1}>
              {item.client.name}
            </Text>
            <View style={styles.clientMetaRow}>
              <View style={styles.metaPill}>
                <MapPin size={14} color={colors.textSecondary} />
                <Text style={styles.metaPillText}>{item.sites.length} site(s)</Text>
              </View>
              <View style={styles.metaPill}>
                <Package size={14} color={colors.textSecondary} />
                <Text style={styles.metaPillText}>{item.assetsCount} équipement(s)</Text>
              </View>
            </View>
          </View>

          {expanded ? (
            <ChevronDown size={18} color={colors.textMuted} />
          ) : (
            <ChevronRight size={18} color={colors.textMuted} />
          )}
        </TouchableOpacity>

        {expanded && (
          <View style={styles.sitesList} testID={`client-sites-${item.client.id}`}>
            {item.sites.map((site) => (
              <TouchableOpacity
                key={site.id}
                onPress={() => openSite(site.id, item.client.id)}
                activeOpacity={0.7}
                testID={`site-row-${site.id}`}
                style={styles.siteRow}
              >
                <View style={styles.siteTextWrap}>
                  <Text style={styles.siteName} numberOfLines={1}>
                    {site.name}
                  </Text>
                  {!!site.address && (
                    <Text style={styles.siteAddress} numberOfLines={1}>
                      {site.address}
                    </Text>
                  )}
                </View>

                <View style={styles.siteRight}>
                  <View style={styles.siteCountPill}>
                    <Text style={styles.siteCountPillText}>{assetCountBySiteId[site.id] ?? 0}</Text>
                    <Text style={styles.siteCountPillLabel}>eq.</Text>
                  </View>
                  <ChevronRight size={18} color={colors.textMuted} />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </Card>
    );
  };

  if (isLoading) {
    return <LoadingState message="Chargement des sites clients..." />;
  }

  return (
    <View style={styles.container} testID="client-sites-screen">
      <FlatList
        data={clientRows}
        keyExtractor={(item) => item.client.id}
        renderItem={renderClient}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        ListEmptyComponent={
          <EmptyState
            icon={<Building2 size={48} color={colors.textMuted} />}
            title="Aucun site"
            message="Aucun client/site n'est disponible pour le moment."
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
  listContent: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  clientCard: {
    padding: 0,
    overflow: 'hidden',
  },
  clientHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    gap: spacing.md,
  },
  clientIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clientHeaderText: {
    flex: 1,
  },
  clientName: {
    ...typography.h3,
    color: colors.text,
  },
  clientMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  metaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surfaceAlt,
  },
  metaPillText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  sitesList: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingVertical: spacing.sm,
  },
  siteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  siteTextWrap: {
    flex: 1,
    minWidth: 0,
  },
  siteName: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600' as const,
  },
  siteAddress: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginTop: 2,
  },
  siteRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  siteCountPill: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: borderRadius.full,
    backgroundColor: 'rgba(0, 102, 204, 0.10)',
  },
  siteCountPillText: {
    fontSize: 13,
    fontWeight: '800' as const,
    color: colors.primary,
  },
  siteCountPillLabel: {
    fontSize: 11,
    fontWeight: '700' as const,
    color: colors.primary,
    opacity: 0.8,
  },
});
