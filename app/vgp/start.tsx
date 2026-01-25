import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, StyleProp, ViewStyle, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Building2, MapPin, Package, FileText, ChevronRight, Check } from 'lucide-react-native';
import { colors, spacing, borderRadius, typography } from '@/constants/theme';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { LoadingState } from '@/components/EmptyState';
import { useAuth } from '@/contexts/AuthContext';
import { trpc } from '@/lib/trpc';
import type { VGPTemplate } from '@/types';
import { useQuery } from '@tanstack/react-query';
import { userRepository } from '@/repositories/UserRepository';

type Step = 'client' | 'site' | 'assets' | 'template' | 'confirm';

interface ClientItem {
  id: string;
  name: string;
  created_at?: string;
}

interface SiteItem {
  id: string;
  name: string;
  address?: string;
  client_id?: string | null;
}

interface AssetItem {
  id: string;
  code_interne: string;
  designation: string;
  marque?: string;
  modele?: string;
}

export default function StartVGPScreen() {
  const router = useRouter();
  const { user } = useAuth();
  
  const [step, setStep] = useState<Step>('client');
  const [selectedClient, setSelectedClient] = useState<ClientItem | null>(null);
  const [selectedSite, setSelectedSite] = useState<SiteItem | null>(null);
  const [selectedAssets, setSelectedAssets] = useState<AssetItem[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<VGPTemplate | null>(null);
  const [signataire, setSignataire] = useState(user?.name || '');
  const [verifierMenuOpen, setVerifierMenuOpen] = useState(false);

  const { data: verifiers } = useQuery({
    queryKey: ['users'],
    queryFn: () => userRepository.getAll(),
    enabled: step === 'confirm',
  });

  // Queries using tRPC hooks
  const { data: clients, isLoading: loadingClients } = trpc.sites.clients.useQuery(undefined, {
    enabled: step === 'client',
  });

  const { data: allSites, isLoading: loadingSites } = trpc.sites.list.useQuery(undefined, {
    enabled: step === 'site' && !!selectedClient,
  });

  const normalizeList = <T,>(value: unknown): T[] => {
    const list = (value as any)?.json ?? value;
    return Array.isArray(list) ? (list as T[]) : [];
  };

  const clientList = normalizeList<ClientItem>(clients);
  const siteList = normalizeList<SiteItem>(allSites);

  // Filter sites by selected client
  const sites = siteList.filter((s) => s.client_id === selectedClient?.id);

  const { data: allAssets, isLoading: loadingAssets } = trpc.assets.list.useQuery(
    { siteId: selectedSite?.id },
    { enabled: step === 'assets' && !!selectedSite }
  );

  const assets = normalizeList<AssetItem>(allAssets);

  const { data: templates, isLoading: loadingTemplates } = trpc.vgp.listTemplates.useQuery(
    { activeOnly: true },
    { enabled: step === 'template' }
  );
  const templateList = normalizeList<VGPTemplate>(templates);

  // Create report mutation
  const createReportMutation = trpc.vgp.createReport.useMutation({
    onSuccess: (result) => {
      const report = (result as any)?.json ?? result;
      const runIds = Array.isArray((report as any)?.runIds) ? (report as any).runIds : [];
      const numeroRapport = (report as any)?.numeroRapport || 'sans numéro';
      const message = runIds.length
        ? `Rapport ${numeroRapport} créé avec ${runIds.length} fiche(s) à remplir.`
        : `Rapport ${numeroRapport} créé.`;

      Alert.alert(
        'VGP créée',
        message,
        runIds.length
          ? [
              {
                text: 'Commencer la saisie',
                onPress: () => router.push(`/vgp/run/${runIds[0]}`),
              },
            ]
          : [{ text: 'OK' }]
      );
    },
    onError: (err) => {
      const details = (err as any)?.data?.zodError ? JSON.stringify((err as any).data.zodError) : null;
      Alert.alert('Erreur', err.message || details || 'Erreur lors de la création de la VGP');
    },
  });

  const handleSelectClient = (client: ClientItem) => {
    setSelectedClient(client);
    setSelectedSite(null);
    setSelectedAssets([]);
    setStep('site');
  };

  const handleSelectSite = (site: SiteItem) => {
    setSelectedSite(site);
    setSelectedAssets([]);
    setStep('assets');
  };

  const handleToggleAsset = (asset: AssetItem) => {
    setSelectedAssets((prev) => {
      const exists = prev.find((a) => a.id === asset.id);
      if (exists) {
        return prev.filter((a) => a.id !== asset.id);
      }
      return [...prev, asset];
    });
  };

  const handleSelectTemplate = (template: VGPTemplate) => {
    setSelectedTemplate(template);
    setStep('confirm');
  };

  const handleConfirm = () => {
    if (!selectedClient || !selectedSite || selectedAssets.length === 0 || !selectedTemplate) {
      Alert.alert('Erreur', 'Veuillez compléter toutes les étapes');
      return;
    }
    if (!signataire || signataire.trim().length === 0) {
      Alert.alert('Erreur', 'Veuillez sélectionner un vérificateur');
      return;
    }

    createReportMutation.mutate({
      clientId: selectedClient.id,
      siteId: selectedSite.id,
      signataire: signataire.trim(),
      assetIds: selectedAssets.map((a) => a.id),
      templateId: selectedTemplate.id,
    });
  };

  const renderStepIndicator = () => (
    <View style={styles.stepIndicator}>
      {(['client', 'site', 'assets', 'template', 'confirm'] as Step[]).map((s, idx) => (
        <View key={s} style={styles.stepItem}>
          <View
            style={[
              styles.stepDot,
              step === s && styles.stepDotActive,
              (['client', 'site', 'assets', 'template', 'confirm'] as Step[]).indexOf(step) > idx && styles.stepDotCompleted,
            ]}
          >
            {(['client', 'site', 'assets', 'template', 'confirm'] as Step[]).indexOf(step) > idx ? (
              <Check size={12} color={colors.textInverse} />
            ) : (
              <Text style={styles.stepNumber}>{idx + 1}</Text>
            )}
          </View>
          {idx < 4 && <View style={styles.stepLine} />}
        </View>
      ))}
    </View>
  );

  const renderHeaderBar = () => (
    <View style={styles.headerBar}>
      {renderStepIndicator()}
      {step === 'assets' && (
        <Button
          title={`Continuer (${selectedAssets.length} machine${selectedAssets.length > 1 ? 's' : ''})`}
          onPress={() => setStep('template')}
          style={styles.headerActionButton}
          disabled={selectedAssets.length === 0}
        />
      )}
    </View>
  );

  const renderContent = () => {
    switch (step) {
      case 'client':
        if (loadingClients) return <LoadingState message="Chargement des clients..." />;
        return (
          <ScrollView style={styles.content}>
            <Text style={styles.stepTitle}>Sélectionnez un client</Text>
            {clientList.map((client: ClientItem) => (
              <Card
                key={client.id}
                style={styles.optionCard}
                onPress={() => handleSelectClient(client)}
              >
                <View style={styles.optionContent}>
                  <Building2 size={24} color={colors.primary} />
                  <View style={styles.optionInfo}>
                    <Text style={styles.optionTitle}>{client.name}</Text>
                  </View>
                  <ChevronRight size={20} color={colors.textMuted} />
                </View>
              </Card>
            ))}
          </ScrollView>
        );

      case 'site':
        if (loadingSites) return <LoadingState message="Chargement des sites..." />;
        return (
          <ScrollView style={styles.content}>
            <Text style={styles.stepTitle}>Sélectionnez un site</Text>
            <Text style={styles.stepSubtitle}>Client: {selectedClient?.name}</Text>
            {sites.map((site: SiteItem) => (
              <Card
                key={site.id}
                style={styles.optionCard}
                onPress={() => handleSelectSite(site)}
              >
                <View style={styles.optionContent}>
                  <MapPin size={24} color={colors.primary} />
                  <View style={styles.optionInfo}>
                    <Text style={styles.optionTitle}>{site.name}</Text>
                    {site.address && <Text style={styles.optionMeta}>{site.address}</Text>}
                  </View>
                  <ChevronRight size={20} color={colors.textMuted} />
                </View>
              </Card>
            ))}
          </ScrollView>
        );

      case 'assets':
        if (loadingAssets) return <LoadingState message="Chargement des équipements..." />;
        return (
          <ScrollView style={styles.content}>
            <Text style={styles.stepTitle}>Sélectionnez les machines</Text>
            <Text style={styles.stepSubtitle}>
              Site: {selectedSite?.name} • {selectedAssets.length} sélectionné(s)
            </Text>
            {assets.map((asset: AssetItem) => {
              const isSelected = selectedAssets.some((a) => a.id === asset.id);
              return (
                <Card
                  key={asset.id}
                  style={StyleSheet.flatten(isSelected ? [styles.optionCard, styles.optionCardSelected] : [styles.optionCard])}
                  onPress={() => handleToggleAsset(asset)}
                >
                  <View style={styles.optionContent}>
                    <Package size={24} color={isSelected ? colors.primary : colors.textMuted} />
                    <View style={styles.optionInfo}>
                      <Text style={styles.optionTitle}>{asset.code_interne}</Text>
                      <Text style={styles.optionMeta}>{asset.designation}</Text>
                      <Text style={styles.optionMeta}>
                        {asset.marque} {asset.modele}
                      </Text>
                    </View>
                    {isSelected && <Check size={24} color={colors.primary} />}
                  </View>
                </Card>
              );
            })}
            {/* Bouton déplacé dans le bandeau fixe */}
          </ScrollView>
        );

      case 'template':
        if (loadingTemplates) return <LoadingState message="Chargement des templates..." />;
        return (
          <ScrollView style={styles.content}>
            <Text style={styles.stepTitle}>Choisissez le template</Text>
            {templateList.map((template: VGPTemplate) => (
              <Card
                key={template.id}
                style={styles.optionCard}
                onPress={() => handleSelectTemplate(template)}
              >
                <View style={styles.optionContent}>
                  <FileText size={24} color={colors.primary} />
                  <View style={styles.optionInfo}>
                    <Text style={styles.optionTitle}>{template.name}</Text>
                    <Text style={styles.optionMeta}>
                      Version {template.version} • {template.machine_type}
                    </Text>
                    {template.referentiel && (
                      <Text style={styles.optionMeta}>{template.referentiel}</Text>
                    )}
                  </View>
                  <ChevronRight size={20} color={colors.textMuted} />
                </View>
              </Card>
            ))}
          </ScrollView>
        );

      case 'confirm':
        return (
          <ScrollView style={styles.content}>
            <Text style={styles.stepTitle}>Confirmation</Text>
            
            <Card style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>Client</Text>
              <Text style={styles.summaryValue}>{selectedClient?.name}</Text>
              
              <Text style={styles.summaryLabel}>Site</Text>
              <Text style={styles.summaryValue}>{selectedSite?.name}</Text>
              
              <Text style={styles.summaryLabel}>Machines ({selectedAssets.length})</Text>
              {selectedAssets.map((a) => (
                <Text key={a.id} style={styles.summaryAsset}>
                  • {a.code_interne} - {a.designation}
                </Text>
              ))}
              
              <Text style={styles.summaryLabel}>Template</Text>
              <Text style={styles.summaryValue}>{selectedTemplate?.name}</Text>
            </Card>

            <View style={styles.dropdownField}>
              <Text style={styles.dropdownLabel}>Signataire / Vérificateur</Text>
              <TouchableOpacity
                style={styles.dropdownButton}
                onPress={() => setVerifierMenuOpen((prev) => !prev)}
              >
                <Text style={styles.dropdownValue}>
                  {signataire || 'Sélectionner un vérificateur'}
                </Text>
                <ChevronRight size={16} color={colors.textMuted} />
              </TouchableOpacity>
              {verifierMenuOpen && (
                <View style={styles.dropdownMenu}>
                  {(verifiers || []).length === 0 && (
                    <View style={styles.dropdownEmpty}>
                      <Text style={styles.dropdownEmptyText}>Aucun utilisateur disponible</Text>
                    </View>
                  )}
                  {(verifiers || []).map((v) => (
                    <TouchableOpacity
                      key={v.id}
                      style={styles.dropdownItem}
                      onPress={() => {
                        setSignataire(v.name);
                        setVerifierMenuOpen(false);
                      }}
                    >
                      <Text style={styles.dropdownItemText}>{v.name}</Text>
                      <Text style={styles.dropdownItemMeta}>{v.role}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            <Button
              title="Créer la VGP"
              onPress={handleConfirm}
              loading={createReportMutation.isPending}
              style={styles.confirmButton}
              disabled={!signataire || signataire.trim().length === 0}
            />
          </ScrollView>
        );
    }
  };

  return (
    <View style={styles.container}>
      {renderHeaderBar()}
      {renderContent()}
      
      {step !== 'client' && (
        <Button
          title="Retour"
          variant="ghost"
          onPress={() => {
            const steps: Step[] = ['client', 'site', 'assets', 'template', 'confirm'];
            const currentIdx = steps.indexOf(step);
            if (currentIdx > 0) setStep(steps[currentIdx - 1]);
          }}
          style={styles.backButton}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  stepIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepDotActive: {
    backgroundColor: colors.primary,
  },
  stepDotCompleted: {
    backgroundColor: colors.success,
  },
  stepNumber: {
    ...typography.caption,
    color: colors.textMuted,
  },
  stepLine: {
    width: 30,
    height: 2,
    backgroundColor: colors.border,
    marginHorizontal: 4,
  },
  content: {
    flex: 1,
    padding: spacing.md,
  },
  stepTitle: {
    ...typography.h2,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  stepSubtitle: {
    ...typography.body,
    color: colors.textMuted,
    marginBottom: spacing.md,
  },
  optionCard: {
    marginBottom: spacing.sm,
  },
  optionCardSelected: {
    borderColor: colors.primary,
    borderWidth: 2,
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    gap: spacing.md,
  },
  optionInfo: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  optionMeta: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 2,
  },
  headerBar: {
    position: 'sticky' as any,
    top: 0,
    zIndex: 10,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerActionButton: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
  summaryCard: {
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  summaryLabel: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: spacing.md,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  summaryAsset: {
    ...typography.body,
    color: colors.text,
    marginLeft: spacing.sm,
  },
  dropdownField: {
    marginTop: spacing.md,
  },
  dropdownLabel: {
    ...typography.caption,
    color: colors.textMuted,
    marginBottom: spacing.sm,
  },
  dropdownButton: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dropdownValue: {
    ...typography.body,
    color: colors.text,
  },
  dropdownMenu: {
    marginTop: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    maxHeight: 240,
  },
  dropdownItem: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  dropdownItemText: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
  },
  dropdownItemMeta: {
    ...typography.caption,
    color: colors.textMuted,
  },
  dropdownEmpty: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  dropdownEmptyText: {
    ...typography.caption,
    color: colors.textMuted,
  },
  confirmButton: {
    marginTop: spacing.lg,
  },
  backButton: {
    margin: spacing.md,
  },
});
