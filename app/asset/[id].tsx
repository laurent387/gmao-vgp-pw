import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Switch } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { 
  Info, ClipboardCheck, AlertTriangle, Wrench, FileText, 
  ChevronRight, Calendar, MapPin, Tag, Camera 
} from 'lucide-react-native';
import { colors, spacing, borderRadius, typography, shadows } from '@/constants/theme';
import { StatusBadge, OverdueBadge, CriticalityBadge } from '@/components/Badge';
import { Card, SectionCard } from '@/components/Card';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { EmptyState, LoadingState } from '@/components/EmptyState';
import { assetRepository } from '@/repositories/AssetRepository';
import { assetControlRepository } from '@/repositories/ControlRepository';
import { reportRepository } from '@/repositories/ReportRepository';
import { ncRepository } from '@/repositories/NCRepository';
import { maintenanceRepository } from '@/repositories/MaintenanceRepository';
import { Asset, AssetControl, Report, NonConformity, MaintenanceLog, Document } from '@/types';
import { AttachmentManager } from '@/components/AttachmentManager';
import { useAuth } from '@/contexts/AuthContext';

type TabType = 'info' | 'controls' | 'actions' | 'maintenance' | 'documents';

export default function AssetDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { isReadOnly, canEdit } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('info');
  const [refreshing, setRefreshing] = useState(false);
  const [loadAttachments, setLoadAttachments] = useState(false);
  const [vgpEnabled, setVgpEnabled] = useState(false);
  const [vgpValidity, setVgpValidity] = useState('');
  const [vgpError, setVgpError] = useState<string | null>(null);
  const [vgpSaving, setVgpSaving] = useState(false);

  const { data: asset, isLoading, refetch } = useQuery<Asset | null>({
    queryKey: ['asset', id],
    queryFn: () => assetRepository.getByIdWithDetails(id!),
    enabled: !!id,
  });

  const { data: controls } = useQuery<AssetControl[]>({
    queryKey: ['asset-controls', id],
    queryFn: () => assetControlRepository.getByAssetId(id!),
    enabled: !!id && activeTab === 'controls',
  });

  const { data: reports } = useQuery<Report[]>({
    queryKey: ['asset-reports', id],
    queryFn: () => reportRepository.getByAssetId(id!),
    enabled: !!id && activeTab === 'controls',
  });

  const { data: ncs } = useQuery<NonConformity[]>({
    queryKey: ['asset-ncs', id],
    queryFn: () => ncRepository.getByAssetId(id!),
    enabled: !!id && activeTab === 'actions',
  });

  const { data: maintenanceLogs } = useQuery<MaintenanceLog[]>({
    queryKey: ['asset-maintenance', id],
    queryFn: () => maintenanceRepository.getByAssetId(id!),
    enabled: !!id && activeTab === 'maintenance',
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  useEffect(() => {
    if (!asset) return;
    setVgpEnabled(Boolean(asset.vgp_enabled));
    setVgpValidity(asset.vgp_validity_months ? String(asset.vgp_validity_months) : '');
  }, [asset]);

  const handleSaveVgp = async () => {
    if (!asset) return;
    setVgpError(null);

    if (vgpEnabled) {
      const validityNumber = Number(vgpValidity);
      if (!validityNumber || validityNumber <= 0) {
        setVgpError('La période de validité est requise et doit être > 0');
        return;
      }
      if (!asset.categorie) {
        setVgpError("Le type d'équipement est requis pour la VGP");
        return;
      }

      setVgpSaving(true);
      await assetRepository.update(asset.id, {
        vgp_enabled: true,
        vgp_validity_months: validityNumber,
      } as any);
      setVgpSaving(false);
      await refetch();
      return;
    }

    setVgpSaving(true);
    await assetRepository.update(asset.id, {
      vgp_enabled: false,
      vgp_validity_months: null,
    } as any);
    setVgpSaving(false);
    await refetch();
  };

  if (isLoading) {
    return <LoadingState message="Chargement de l'équipement..." />;
  }

  if (!asset) {
    return (
      <EmptyState
        title="Équipement non trouvé"
        message="Cet équipement n'existe pas ou a été supprimé"
      />
    );
  }

  const tabs: { key: TabType; label: string; icon: React.ReactNode }[] = [
    { key: 'info', label: 'Infos', icon: <Info size={18} color={activeTab === 'info' ? colors.primary : colors.textMuted} /> },
    { key: 'controls', label: 'Contrôles', icon: <ClipboardCheck size={18} color={activeTab === 'controls' ? colors.primary : colors.textMuted} /> },
    { key: 'actions', label: 'NC/Actions', icon: <AlertTriangle size={18} color={activeTab === 'actions' ? colors.primary : colors.textMuted} /> },
    { key: 'maintenance', label: 'Maintenance', icon: <Wrench size={18} color={activeTab === 'maintenance' ? colors.primary : colors.textMuted} /> },
    { key: 'documents', label: 'Photos', icon: <Camera size={18} color={activeTab === 'documents' ? colors.primary : colors.textMuted} /> },
  ];

  const formatDate = (date: string | null) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const renderInfoTab = () => (
    <View style={styles.tabContent}>
      <SectionCard title="Identification">
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Code interne</Text>
          <Text style={styles.infoValue}>{asset.code_interne}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Désignation</Text>
          <Text style={styles.infoValue}>{asset.designation}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Catégorie</Text>
          <Text style={styles.infoValue}>{asset.categorie}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Marque</Text>
          <Text style={styles.infoValue}>{asset.marque || '-'}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Modèle</Text>
          <Text style={styles.infoValue}>{asset.modele || '-'}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>N° série</Text>
          <Text style={styles.infoValue}>{asset.numero_serie || '-'}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Année</Text>
          <Text style={styles.infoValue}>{asset.annee || '-'}</Text>
        </View>
      </SectionCard>

      <SectionCard title="Localisation">
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Site</Text>
          <Text style={styles.infoValue}>{asset.site_name || '-'}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Zone</Text>
          <Text style={styles.infoValue}>{asset.zone_name || '-'}</Text>
        </View>
      </SectionCard>

      <SectionCard title="État">
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Statut</Text>
          <StatusBadge status={asset.statut} />
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Criticité</Text>
          <CriticalityBadge level={asset.criticite} />
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Mise en service</Text>
          <Text style={styles.infoValue}>{formatDate(asset.mise_en_service)}</Text>
        </View>
        {asset.next_due_at && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Prochain contrôle</Text>
            <View style={styles.dueDateContainer}>
              <Text style={[styles.infoValue, asset.is_overdue && styles.overdueText]}>
                {formatDate(asset.next_due_at)}
              </Text>
              {asset.is_overdue && <OverdueBadge />}
            </View>
          </View>
        )}
      </SectionCard>

      <SectionCard title="VGP">
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>VGP</Text>
          <Text style={styles.infoValue}>{asset.vgp_enabled ? 'Oui' : 'Non'}</Text>
        </View>
        {asset.vgp_enabled && (
          <>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Type</Text>
              <Text style={styles.infoValue}>{asset.categorie || '-'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Validité</Text>
              <Text style={styles.infoValue}>
                {asset.vgp_validity_months ? `${asset.vgp_validity_months} mois` : '-'}
              </Text>
            </View>
          </>
        )}

        {canEdit() && (
          <View style={styles.vgpEditor}>
            <View style={styles.vgpToggleRow}>
              <Text style={styles.vgpToggleLabel}>Soumis à VGP ?</Text>
              <Switch value={vgpEnabled} onValueChange={setVgpEnabled} />
            </View>

            {vgpEnabled && (
              <>
                <View style={styles.vgpPresetRow}>
                  {[3, 6, 12, 24].map((value) => (
                    <TouchableOpacity
                      key={value}
                      style={[
                        styles.vgpPreset,
                        vgpValidity === String(value) && styles.vgpPresetActive,
                      ]}
                      onPress={() => setVgpValidity(String(value))}
                    >
                      <Text
                        style={[
                          styles.vgpPresetText,
                          vgpValidity === String(value) && styles.vgpPresetTextActive,
                        ]}
                      >
                        {value} mois
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <Input
                  label="Autre (mois)"
                  value={vgpValidity}
                  onChangeText={setVgpValidity}
                  keyboardType="numeric"
                />
              </>
            )}

            {vgpError && <Text style={styles.vgpError}>{vgpError}</Text>}

            <Button
              title="Enregistrer la configuration VGP"
              onPress={handleSaveVgp}
              loading={vgpSaving}
              disabled={vgpSaving}
              size="sm"
            />
          </View>
        )}
      </SectionCard>
    </View>
  );

  const renderControlsTab = () => (
    <View style={styles.tabContent}>
      <SectionCard title="Échéances">
        {controls && controls.length > 0 ? (
          controls.map((control) => (
            <View key={control.id} style={styles.controlItem}>
              <View style={styles.controlInfo}>
                <Text style={styles.controlType}>{(control as any).label || 'Contrôle'}</Text>
                <Text style={styles.controlDate}>
                  Prochain: {formatDate(control.next_due_at)}
                </Text>
                <Text style={styles.controlMeta}>
                  Dernier: {formatDate(control.last_done_at)}
                </Text>
              </View>
              {control.next_due_at && new Date(control.next_due_at) < new Date() && (
                <OverdueBadge />
              )}
            </View>
          ))
        ) : (
          <Text style={styles.emptyText}>Aucun contrôle planifié</Text>
        )}
      </SectionCard>

      <SectionCard title="Historique des rapports">
        {reports && reports.length > 0 ? (
          reports.map((report) => (
            <TouchableOpacity key={report.id} style={styles.reportItem}>
              <View style={styles.reportInfo}>
                <Text style={styles.reportDate}>{formatDate(report.performed_at)}</Text>
                <StatusBadge status={report.conclusion} />
              </View>
              <Text style={styles.reportSummary} numberOfLines={2}>
                {report.summary || 'Aucun résumé'}
              </Text>
              <Text style={styles.reportMeta}>Par: {report.signed_by_name || report.performer}</Text>
            </TouchableOpacity>
          ))
        ) : (
          <Text style={styles.emptyText}>Aucun rapport</Text>
        )}
      </SectionCard>
    </View>
  );

  const renderActionsTab = () => (
    <View style={styles.tabContent}>
      <SectionCard 
        title="Non-conformités & Actions"
        action={
          !isReadOnly() && (
            <Button
              title="Nouvelle NC"
              onPress={() => router.push({ pathname: '/nc/create', params: { assetId: id } })}
              size="sm"
              variant="outline"
            />
          )
        }
      >
        {ncs && ncs.length > 0 ? (
          ncs.map((nc) => (
            <TouchableOpacity 
              key={nc.id} 
              style={styles.ncItem}
              onPress={() => router.push(`/nc/${nc.id}`)}
            >
              <View style={styles.ncHeader}>
                <Text style={styles.ncTitle} numberOfLines={1}>{nc.title}</Text>
                <CriticalityBadge level={nc.severity} />
              </View>
              <View style={styles.ncFooter}>
                <StatusBadge status={nc.status} />
                {(nc as any).action_status && (
                  <View style={styles.actionStatus}>
                    <Text style={styles.actionLabel}>Action: </Text>
                    <StatusBadge status={(nc as any).action_status} />
                  </View>
                )}
              </View>
              <Text style={styles.ncDate}>{formatDate(nc.created_at)}</Text>
            </TouchableOpacity>
          ))
        ) : (
          <Text style={styles.emptyText}>Aucune non-conformité</Text>
        )}
      </SectionCard>
    </View>
  );

  const renderDocumentsTab = () => (
    <View style={styles.tabContent}>
      {!loadAttachments ? (
        <SectionCard title="Photos & Documents">
          <View style={styles.quickLoadCard}>
            <Text style={styles.quickLoadTitle}>Galerie non chargée</Text>
            <Text style={styles.quickLoadSubtitle}>
              Pour accélérer l'affichage, la galerie se charge à la demande.
            </Text>
            <Button
              title="Charger la galerie"
              onPress={() => setLoadAttachments(true)}
              variant="primary"
            />
          </View>
        </SectionCard>
      ) : (
        <AttachmentManager
          ownerType="EQUIPMENT"
          ownerId={id!}
          showPlateSection={true}
          showCategories={['DOCUMENTATION', 'CERTIFICAT_LEGAL', 'PHOTO', 'AUTRE']}
          allowedFileTypes={['IMAGE', 'PDF']}
          onAttachmentChange={() => {
            // Optionally refetch asset data if needed
          }}
        />
      )}
    </View>
  );

  const renderMaintenanceTab = () => (
    <View style={styles.tabContent}>
      <SectionCard 
        title="Carnet de maintenance"
        action={
          !isReadOnly() && (
            <Button
              title="Ajouter"
              onPress={() => router.push({ pathname: '/maintenance/add', params: { assetId: id } })}
              size="sm"
              variant="outline"
            />
          )
        }
      >
        {maintenanceLogs && maintenanceLogs.length > 0 ? (
          maintenanceLogs.map((log) => (
            <View key={log.id} style={styles.maintenanceItem}>
              <View style={styles.maintenanceHeader}>
                <Text style={styles.maintenanceDate}>{formatDate(log.date)}</Text>
                <View style={styles.maintenanceType}>
                  <Text style={styles.maintenanceTypeText}>{log.operation_type}</Text>
                </View>
              </View>
              <Text style={styles.maintenanceDescription}>{log.description}</Text>
              {log.parts_ref && (
                <Text style={styles.maintenanceParts}>Pièces: {log.parts_ref}</Text>
              )}
              <Text style={styles.maintenanceActor}>Par: {log.actor}</Text>
            </View>
          ))
        ) : (
          <Text style={styles.emptyText}>Aucune entrée de maintenance</Text>
        )}
      </SectionCard>
    </View>
  );

  return (
    <>
      <Stack.Screen options={{ title: asset.code_interne }} />
      
      <ScrollView 
        style={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={styles.headerCode}>{asset.code_interne}</Text>
            <Text style={styles.headerDesignation}>{asset.designation}</Text>
            <View style={styles.headerMeta}>
              <View style={styles.metaItem}>
                <MapPin size={14} color={colors.textMuted} />
                <Text style={styles.metaText}>{asset.site_name}</Text>
              </View>
              <View style={styles.metaItem}>
                <Tag size={14} color={colors.textMuted} />
                <Text style={styles.metaText}>{asset.categorie}</Text>
              </View>
            </View>
          </View>
          <View style={styles.headerBadges}>
            <StatusBadge status={asset.statut} />
            {asset.is_overdue && <OverdueBadge />}
          </View>
        </View>

        <View style={styles.tabs}>
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tab, activeTab === tab.key && styles.tabActive]}
              onPress={() => setActiveTab(tab.key)}
            >
              {tab.icon}
              <Text style={[styles.tabLabel, activeTab === tab.key && styles.tabLabelActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {activeTab === 'info' && renderInfoTab()}
        {activeTab === 'controls' && renderControlsTab()}
        {activeTab === 'actions' && renderActionsTab()}
        {activeTab === 'maintenance' && renderMaintenanceTab()}
        {activeTab === 'documents' && renderDocumentsTab()}
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerContent: {
    flex: 1,
  },
  headerCode: {
    fontSize: typography.caption.fontSize,
    fontWeight: '600' as const,
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  headerDesignation: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  headerMeta: {
    flexDirection: 'row',
    gap: spacing.lg,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  metaText: {
    fontSize: typography.caption.fontSize,
    color: colors.textMuted,
  },
  headerBadges: {
    alignItems: 'flex-end',
    gap: spacing.xs,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.md,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: colors.primary,
  },
  tabLabel: {
    fontSize: typography.caption.fontSize,
    fontWeight: '500' as const,
    color: colors.textMuted,
  },
  tabLabelActive: {
    color: colors.primary,
  },
  tabContent: {
    padding: spacing.lg,
    gap: spacing.lg,
  },
  quickLoadCard: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  quickLoadTitle: {
    ...typography.subtitle2,
    color: colors.text,
    fontWeight: '700' as const,
  },
  quickLoadSubtitle: {
    ...typography.body3,
    color: colors.textSecondary,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  infoLabel: {
    fontSize: typography.bodySmall.fontSize,
    color: colors.textSecondary,
  },
  infoValue: {
    fontSize: typography.bodySmall.fontSize,
    fontWeight: '500' as const,
    color: colors.text,
  },
  vgpEditor: {
    marginTop: spacing.md,
    gap: spacing.md,
  },
  vgpToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  vgpToggleLabel: {
    fontSize: typography.body.fontSize,
    color: colors.text,
    fontWeight: '600' as const,
  },
  vgpPresetRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  vgpPreset: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
  },
  vgpPresetActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  vgpPresetText: {
    fontSize: typography.bodySmall.fontSize,
    color: colors.text,
    fontWeight: '600' as const,
  },
  vgpPresetTextActive: {
    color: colors.textInverse,
  },
  vgpError: {
    fontSize: typography.caption.fontSize,
    color: colors.danger,
  },
  dueDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  overdueText: {
    color: colors.danger,
  },
  controlItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  controlInfo: {
    flex: 1,
  },
  controlType: {
    fontSize: typography.body.fontSize,
    fontWeight: '500' as const,
    color: colors.text,
  },
  controlDate: {
    fontSize: typography.bodySmall.fontSize,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  controlMeta: {
    fontSize: typography.caption.fontSize,
    color: colors.textMuted,
  },
  reportItem: {
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  reportInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  reportDate: {
    fontSize: typography.bodySmall.fontSize,
    fontWeight: '500' as const,
    color: colors.text,
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
  ncItem: {
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  ncHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  ncTitle: {
    flex: 1,
    fontSize: typography.body.fontSize,
    fontWeight: '500' as const,
    color: colors.text,
    marginRight: spacing.sm,
  },
  ncFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.xs,
  },
  actionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionLabel: {
    fontSize: typography.caption.fontSize,
    color: colors.textMuted,
  },
  ncDate: {
    fontSize: typography.caption.fontSize,
    color: colors.textMuted,
  },
  maintenanceItem: {
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  maintenanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  maintenanceDate: {
    fontSize: typography.bodySmall.fontSize,
    fontWeight: '500' as const,
    color: colors.text,
  },
  maintenanceType: {
    backgroundColor: colors.primary + '15',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  maintenanceTypeText: {
    fontSize: typography.caption.fontSize,
    fontWeight: '500' as const,
    color: colors.primary,
  },
  maintenanceDescription: {
    fontSize: typography.bodySmall.fontSize,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  maintenanceParts: {
    fontSize: typography.caption.fontSize,
    color: colors.info,
    marginBottom: spacing.xs,
  },
  maintenanceActor: {
    fontSize: typography.caption.fontSize,
    color: colors.textMuted,
  },
  emptyText: {
    fontSize: typography.bodySmall.fontSize,
    color: colors.textMuted,
    textAlign: 'center',
    paddingVertical: spacing.lg,
  },
});
