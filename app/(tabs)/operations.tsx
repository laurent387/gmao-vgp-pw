import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  TextInput,
  Modal,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import {
  AlertTriangle,
  CheckCircle,
  Plus,
  Filter,
  Search,
  X,
  ChevronDown,
  FileText,
  ClipboardList,
} from 'lucide-react-native';
import { colors, spacing, borderRadius, typography } from '@/constants/theme';
import { NCListItem, MissionListItem } from '@/components/ListItem';
import { EmptyState, LoadingState } from '@/components/EmptyState';
import { Button } from '@/components/Button';
import { Badge } from '@/components/Badge';
import { Card } from '@/components/Card';
import { ncRepository } from '@/repositories/NCRepository';
import { missionRepository } from '@/repositories/MissionRepository';
import { webApiService } from '@/services/WebApiService';
import { NonConformity, Mission, NCStatus, MissionStatus, VGPTemplate } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigation } from '@/lib/navigation';
import { trpc } from '@/lib/trpc';

type TabType = 'vgp' | 'nc' | 'actions' | 'missions';
type FilterType = 'all' | 'open' | 'closed' | 'mine' | 'pending' | 'completed';

interface AdvancedFilters {
  severity: number | null;
  siteId: string | null;
  search: string;
}

export default function OperationsScreen() {
  const router = useRouter();
  const nav = useNavigation();
  const { user, canCreate } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('vgp');
  const [filter, setFilter] = useState<FilterType>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState<AdvancedFilters>({
    severity: null,
    siteId: null,
    search: '',
  });

  // VGP Query
  const { data: vgpTemplates, isLoading: vgpLoading, refetch: refetchVGP } = trpc.vgp.listTemplates.useQuery(
    { activeOnly: false }
  );

  // NC Query
  const { data: ncs, isLoading: ncsLoading, refetch: refetchNCs } = useQuery<NonConformity[]>({
    queryKey: ['nonconformities', filter],
    queryFn: () => {
      const filterMap = {
        open: 'OUVERTE',
        closed: 'CLOTUREE',
        all: undefined,
      } as any;
      return ncRepository.getAllWithDetails({ status: filterMap[filter as any] });
    },
  });

  // Actions Query
  const { data: actions, isLoading: actionsLoading, refetch: refetchActions } = useQuery({
    queryKey: ['actions'],
    queryFn: async () => {
      return webApiService.getActions?.() || [];
    },
  });

  // Missions Query
  const { data: missions, isLoading: missionsLoading, refetch: refetchMissions } = useQuery<Mission[]>({
    queryKey: ['missions', filter, user?.id],
    queryFn: () => {
      const filters: { assignedTo?: string; status?: MissionStatus } = {};

      const missionFilterMap = {
        mine: 'mine',
        pending: 'PLANIFIEE',
        completed: 'TERMINEE',
        all: undefined,
      } as any;

      if (filter === 'mine' && user?.id) {
        filters.assignedTo = user.id;
      } else if (missionFilterMap[filter]) {
        filters.status = missionFilterMap[filter];
      }

      return missionRepository.getAllWithDetails(filters);
    },
  });

  const filteredNCs = useMemo(() => {
    if (!ncs) return [];

    return ncs.filter((nc) => {
      if (advancedFilters.search) {
        const searchLower = advancedFilters.search.toLowerCase();
        const matchesTitle = nc.title.toLowerCase().includes(searchLower);
        const matchesAsset =
          (nc as any).asset_code?.toLowerCase().includes(searchLower) ||
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
    if (activeTab === 'vgp') await refetchVGP();
    if (activeTab === 'nc') await refetchNCs();
    if (activeTab === 'actions') await refetchActions();
    if (activeTab === 'missions') await refetchMissions();
    setRefreshing(false);
  }, [activeTab, refetchVGP, refetchNCs, refetchActions, refetchMissions]);

  const handleNCPress = (id: string) => {
    nav.goToNonConformity(id);
  };

  const handleCreateNC = () => {
    nav.goToNCCreate();
  };

  const handleMissionPress = (id: string) => {
    nav.goToMission(id);
  };

  const handleCreateMission = () => {
    nav.push('/mission/create');
  };

  const handleStartVGP = () => {
    nav.push('/vgp/start');
  };

  const handleViewTemplate = (templateId: string) => {
    nav.push(`/vgp/template/${templateId}`);
  };

  const renderVGPTemplate = ({ item }: { item: VGPTemplate }) => (
    <Card style={styles.templateCard}>
      <TouchableOpacity
        style={styles.templateContent}
        onPress={() => handleViewTemplate(item.id)}
      >
        <View style={styles.templateHeader}>
          <FileText size={24} color={colors.primary} />
          <View style={styles.templateInfo}>
            <Text style={styles.templateName}>{item.name}</Text>
            <Text style={styles.templateMeta}>
              Version {item.version} • {item.machine_type}
            </Text>
          </View>
          <Badge
            label={item.active ? 'Actif' : 'Inactif'}
            variant={item.active ? 'success' : 'warning'}
          />
        </View>

        {item.referentiel && <Text style={styles.referentiel}>{item.referentiel}</Text>}
      </TouchableOpacity>
    </Card>
  );

  const renderNCItem = ({ item }: { item: NonConformity }) => (
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

  const renderMissionItem = ({ item }: { item: Mission }) => (
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

  const ncFilterOptions = [
    { key: 'open', label: 'Ouvertes' },
    { key: 'closed', label: 'Clôturées' },
    { key: 'all', label: 'Toutes' },
  ];

  const missionFilterOptions = [
    { key: 'all', label: 'Toutes' },
    { key: 'mine', label: 'Mes missions' },
    { key: 'pending', label: 'Planifiées' },
    { key: 'completed', label: 'Terminées' },
  ];

  const isLoading =
    activeTab === 'vgp' ? vgpLoading : activeTab === 'nc' ? ncsLoading : activeTab === 'actions' ? actionsLoading : missionsLoading;

  const renderTabContent = () => {
    if (isLoading) {
      const messages: Record<TabType, string> = {
        vgp: 'Chargement des templates VGP...',
        nc: 'Chargement des non-conformités...',
        actions: 'Chargement des actions...',
        missions: 'Chargement des missions...',
      };
      return <LoadingState message={messages[activeTab]} />;
    }

    switch (activeTab) {
      case 'vgp':
        return (
          <>
            <View style={styles.header}>
              <Text style={styles.headerTitle}>Templates VGP</Text>
              <Button
                title="Démarrer une VGP"
                onPress={handleStartVGP}
                icon={<Plus size={18} color={colors.textInverse} />}
                size="sm"
              />
            </View>
            <FlatList
              data={vgpTemplates}
              renderItem={renderVGPTemplate}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.listContent}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
              }
              ListEmptyComponent={
                <EmptyState
                  icon={<FileText size={48} color={colors.textMuted} />}
                  title="Aucun template"
                  message="Aucun template VGP disponible"
                />
              }
            />
          </>
        );

      case 'nc':
        return (
          <>
            <View style={styles.header}>
              <View style={styles.filterTabs}>
                {ncFilterOptions.map((option) => (
                  <TouchableOpacity
                    key={option.key}
                    style={[styles.filterTab, filter === option.key && styles.filterTabActive]}
                    onPress={() => setFilter(option.key as FilterType)}
                  >
                    <Text
                      style={[
                        styles.filterTabText,
                        filter === option.key && styles.filterTabTextActive,
                      ]}
                    >
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

            <FlatList
              data={filteredNCs}
              renderItem={renderNCItem}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.listContent}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
              }
              ListEmptyComponent={
                <EmptyState
                  icon={<AlertTriangle size={48} color={colors.textMuted} />}
                  title="Aucune NC"
                  message="Aucune non-conformité ne correspond à vos critères"
                  actionLabel={canCreate() ? 'Créer une NC' : undefined}
                  onAction={canCreate() ? handleCreateNC : undefined}
                />
              }
            />
          </>
        );

      case 'missions':
        return (
          <>
            <View style={styles.header}>
              <View style={styles.filterTabs}>
                {missionFilterOptions.map((option) => (
                  <TouchableOpacity
                    key={option.key}
                    style={[styles.filterTab, filter === option.key && styles.filterTabActive]}
                    onPress={() => setFilter(option.key as FilterType)}
                  >
                    <Text
                      style={[
                        styles.filterTabText,
                        filter === option.key && styles.filterTabTextActive,
                      ]}
                    >
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
              renderItem={renderMissionItem}
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
                  actionLabel={canCreate() ? 'Créer une mission' : undefined}
                  onAction={canCreate() ? handleCreateMission : undefined}
                />
              }
            />
          </>
        );

      case 'actions':
        return (
          <>
            <View style={styles.header}>
              <Text style={styles.headerTitle}>Actions correctives</Text>
            </View>
            <View style={styles.comingSoon}>
              <Text style={styles.comingSoonText}>Fonctionnalité à venir</Text>
            </View>
          </>
        );
    }
  };

  return (
    <View style={styles.container}>
      {/* Tab Navigation */}
      <View style={styles.tabNav}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          scrollEventThrottle={16}
        >
          <TouchableOpacity
            style={[styles.tab, activeTab === 'vgp' && styles.tabActive]}
            onPress={() => {
              setActiveTab('vgp');
              setFilter('all');
            }}
          >
            <FileText size={20} color={activeTab === 'vgp' ? colors.primary : colors.textMuted} />
            <Text
              style={[
                styles.tabLabel,
                activeTab === 'vgp' && styles.tabLabelActive,
              ]}
            >
              VGP
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === 'nc' && styles.tabActive]}
            onPress={() => {
              setActiveTab('nc');
              setFilter('open');
            }}
          >
            <AlertTriangle size={20} color={activeTab === 'nc' ? colors.primary : colors.textMuted} />
            <Text
              style={[
                styles.tabLabel,
                activeTab === 'nc' && styles.tabLabelActive,
              ]}
            >
              NC
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === 'actions' && styles.tabActive]}
            onPress={() => {
              setActiveTab('actions');
              setFilter('all');
            }}
          >
            <CheckCircle size={20} color={activeTab === 'actions' ? colors.primary : colors.textMuted} />
            <Text
              style={[
                styles.tabLabel,
                activeTab === 'actions' && styles.tabLabelActive,
              ]}
            >
              Actions
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === 'missions' && styles.tabActive]}
            onPress={() => {
              setActiveTab('missions');
              setFilter('all');
            }}
          >
            <ClipboardList size={20} color={activeTab === 'missions' ? colors.primary : colors.textMuted} />
            <Text
              style={[
                styles.tabLabel,
                activeTab === 'missions' && styles.tabLabelActive,
              ]}
            >
              Missions
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Tab Content */}
      {renderTabContent()}

      {/* Filters Modal */}
      <Modal visible={showFilters} transparent animationType="fade">
        <View style={styles.filterOverlay}>
          <View style={styles.filterModal}>
            <View style={styles.filterModalHeader}>
              <Text style={styles.filterModalTitle}>Filtres avancés</Text>
              <TouchableOpacity onPress={() => setShowFilters(false)}>
                <X size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.filterModalContent}>
              <View style={styles.filterGroup}>
                <Text style={styles.filterLabel}>Recherche</Text>
                <TextInput
                  style={styles.filterInput}
                  placeholder="Titre ou équipement..."
                  value={advancedFilters.search}
                  onChangeText={(text) =>
                    setAdvancedFilters({ ...advancedFilters, search: text })
                  }
                  placeholderTextColor={colors.textMuted}
                />
              </View>

              <View style={styles.filterGroup}>
                <Text style={styles.filterLabel}>Sévérité minimale</Text>
                <View style={styles.severityButtons}>
                  {[1, 2, 3, 4, 5].map((level) => (
                    <TouchableOpacity
                      key={level}
                      style={[
                        styles.severityButton,
                        advancedFilters.severity === level && styles.severityButtonActive,
                      ]}
                      onPress={() =>
                        setAdvancedFilters({
                          ...advancedFilters,
                          severity: advancedFilters.severity === level ? null : level,
                        })
                      }
                    >
                      <Text
                        style={[
                          styles.severityButtonText,
                          advancedFilters.severity === level && styles.severityButtonTextActive,
                        ]}
                      >
                        {level}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </ScrollView>

            <View style={styles.filterModalFooter}>
              <Button
                title="Réinitialiser"
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
  tabNav: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  tabActive: {
    borderBottomWidth: 3,
    borderBottomColor: colors.primary,
  },
  tabLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.textMuted,
  },
  tabLabelActive: {
    color: colors.primary,
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
  headerTitle: {
    ...typography.h3,
    color: colors.text,
    flex: 1,
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
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterTabActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterTabText: {
    fontSize: 13,
    fontWeight: '500' as const,
    color: colors.textSecondary,
  },
  filterTabTextActive: {
    color: colors.textInverse,
  },
  filterButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: colors.danger,
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterBadgeText: {
    color: colors.textInverse,
    fontSize: 11,
    fontWeight: '700' as const,
  },
  listContent: {
    flexGrow: 1,
    paddingVertical: spacing.md,
  },
  templateCard: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  templateContent: {
    gap: spacing.md,
  },
  templateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  templateInfo: {
    flex: 1,
  },
  templateName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.text,
  },
  templateMeta: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  referentiel: {
    fontSize: 12,
    color: colors.textSecondary,
    fontStyle: 'italic' as const,
  },
  filterOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  filterModal: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: borderRadius.lg,
    borderTopRightRadius: borderRadius.lg,
    maxHeight: '80%',
  },
  filterModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  filterModalTitle: {
    ...typography.h3,
    color: colors.text,
  },
  filterModalContent: {
    padding: spacing.lg,
  },
  filterModalFooter: {
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  filterGroup: {
    marginBottom: spacing.lg,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.text,
    marginBottom: spacing.md,
  },
  filterInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    color: colors.text,
  },
  severityButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  severityButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  severityButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  severityButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.text,
  },
  severityButtonTextActive: {
    color: colors.textInverse,
  },
  comingSoon: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  comingSoonText: {
    fontSize: 16,
    color: colors.textMuted,
  },
});
