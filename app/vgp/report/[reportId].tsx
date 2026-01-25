import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, Linking } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { FileText, Download, Check, AlertTriangle, Package, Upload } from 'lucide-react-native';
import { colors, spacing, borderRadius, typography } from '@/constants/theme';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Badge } from '@/components/Badge';
import { LoadingState } from '@/components/EmptyState';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/contexts/AuthContext';
import { attachmentService } from '@/services/AttachmentService';
import { Attachment } from '@/types';

interface ReportRun {
  id: string;
  asset_code?: string;
  asset_designation?: string;
  asset_marque?: string;
  asset_modele?: string;
  statut: string;
  conclusion?: string;
  observationCount?: number;
}

interface ReportData {
  id: string;
  numero_rapport: string;
  date_rapport: string;
  client_name?: string;
  site_name?: string;
  signataire?: string;
  synthese?: string;
  has_observations?: boolean;
  pdf_url?: string;
  runs?: ReportRun[];
}

export default function VGPReportScreen() {
  const { reportId } = useLocalSearchParams<{ reportId: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { hasPermission, user } = useAuth();
  const isAdmin = hasPermission(['ADMIN', 'HSE_MANAGER']);
  const [uploadingPdf, setUploadingPdf] = useState(false);

  const { data: report, isLoading, refetch } = trpc.vgp.getReportById.useQuery(
    { id: reportId! },
    { enabled: !!reportId }
  );

  const {
    data: pdfAttachments,
    isLoading: loadingPdf,
    refetch: refetchPdf,
  } = trpc.attachments.list.useQuery(
    { ownerType: 'VGP_REPORT', ownerId: reportId!, category: 'RAPPORT' },
    { enabled: !!reportId }
  );

  const pdfAttachment: Attachment | null = Array.isArray(pdfAttachments) && pdfAttachments.length > 0
    ? (pdfAttachments[0] as Attachment)
    : null;

  const finalizeMutation = trpc.vgp.finalizeReport.useMutation({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [['vgp']] });
      Alert.alert('Succès', 'Rapport finalisé');
      refetch();
    },
    onError: (err) => {
      Alert.alert('Erreur', err.message || 'Erreur lors de la finalisation');
    },
  });

  const generatePDFMutation = trpc.vgp.generatePDF.useMutation({
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: [['vgp']] });
      Alert.alert(
        'PDF Généré',
        'Le rapport PDF a été généré avec succès.',
        [
          { text: 'OK' },
          {
            text: 'Télécharger',
            onPress: () => {
              if (result.pdfUrl) {
                Linking.openURL(result.pdfUrl);
              }
            },
          },
        ]
      );
      refetch();
    },
    onError: (err) => {
      Alert.alert('Erreur', err.message || 'Erreur lors de la génération du PDF');
    },
  });

  const handleOpenRun = (runId: string) => {
    router.push(`/vgp/run/${runId}`);
  };

  const handleFinalize = () => {
    if (!report) return;
    const r = report as ReportData;
    
    const pendingRuns = r.runs?.filter((run: ReportRun) => run.statut !== 'VALIDE').length || 0;
    
    if (pendingRuns > 0) {
      Alert.alert(
        'Attention',
        `Il reste ${pendingRuns} fiche(s) non validée(s). Veuillez les valider avant de finaliser le rapport.`
      );
      return;
    }

    Alert.alert(
      'Finaliser le rapport',
      'Cette action validera définitivement le rapport. Continuer ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Finaliser',
          onPress: () => finalizeMutation.mutate({ reportId: reportId! }),
        },
      ]
    );
  };

  const handleGeneratePDF = () => {
    if (!report) return;
    generatePDFMutation.mutate({ reportId: reportId! });
  };

  const handleUploadFinalPdf = async () => {
    try {
      setUploadingPdf(true);
      const picked = await attachmentService.pickPdf();
      if (!picked) return;

      await attachmentService.uploadPdfToVgpReport(
        reportId!,
        picked.uri,
        picked.name,
        picked.name.replace('.pdf', '') || 'Rapport VGP PDF'
      );

      await refetchPdf();
      Alert.alert('Succès', 'PDF final ajouté');
    } catch (e) {
      Alert.alert('Erreur', e instanceof Error ? e.message : 'Impossible d\'ajouter le PDF');
    } finally {
      setUploadingPdf(false);
    }
  };

  const handleViewObservations = () => {
    router.push(`/vgp/observations?reportId=${reportId}`);
  };

  const handleDownloadAttachment = async () => {
    if (!pdfAttachment) return;
    try {
      await attachmentService.downloadAndShare(pdfAttachment);
    } catch (e) {
      Alert.alert('Erreur', e instanceof Error ? e.message : 'Téléchargement impossible');
    }
  };

  const getConclusionBadge = (conclusion: string | undefined) => {
    switch (conclusion) {
      case 'CONFORME':
        return <Badge label="Conforme" variant="success" />;
      case 'NON_CONFORME':
        return <Badge label="Non conforme" variant="danger" />;
      case 'CONFORME_SOUS_RESERVE':
        return <Badge label="Sous réserve" variant="warning" />;
      default:
        return <Badge label="En cours" variant="info" />;
    }
  };

  if (isLoading || !report) {
    return <LoadingState message="Chargement du rapport..." />;
  }

  const r = report as ReportData;
  const validatedRuns = r.runs?.filter((run: ReportRun) => run.statut === 'VALIDE').length || 0;
  const totalRuns = r.runs?.length || 0;
  const totalObservations = r.runs?.reduce((acc: number, run: ReportRun) => acc + (run.observationCount || 0), 0) || 0;

  return (
    <ScrollView style={styles.container}>
      {/* Report Header */}
      <Card style={styles.reportHeader}>
        <View style={styles.reportTitleRow}>
          <FileText size={32} color={colors.primary} />
          <View style={styles.reportTitleInfo}>
            <Text style={styles.reportNumber}>{r.numero_rapport}</Text>
            <Text style={styles.reportDate}>
              {new Date(r.date_rapport).toLocaleDateString('fr-FR', {
                day: '2-digit',
                month: 'long',
                year: 'numeric',
              })}
            </Text>
          </View>
          <Badge 
            label={r.has_observations ? 'Avec observations' : 'Sans observation'} 
            variant={r.has_observations ? 'warning' : 'success'} 
          />
        </View>
        
        <View style={styles.reportMeta}>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Client</Text>
            <Text style={styles.metaValue}>{r.client_name}</Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Site</Text>
            <Text style={styles.metaValue}>{r.site_name}</Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Signataire</Text>
            <Text style={styles.metaValue}>{r.signataire}</Text>
          </View>
        </View>

        {r.synthese && (
          <View style={styles.synthese}>
            <Text style={styles.syntheseLabel}>Synthèse</Text>
            <Text style={styles.syntheseText}>{r.synthese}</Text>
          </View>
        )}
      </Card>

      {/* Progress */}
      <Card style={styles.progressCard}>
        <Text style={styles.progressTitle}>Avancement</Text>
        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressFill, 
              { width: `${(validatedRuns / totalRuns) * 100}%` }
            ]} 
          />
        </View>
        <View style={styles.progressStats}>
          <Text style={styles.progressStat}>
            <Text style={styles.progressStatValue}>{validatedRuns}</Text>/{totalRuns} fiches validées
          </Text>
          <Text style={styles.progressStat}>
            <Text style={[styles.progressStatValue, { color: colors.warning }]}>
              {totalObservations}
            </Text> observation(s)
          </Text>
        </View>
      </Card>

      {/* Machines List */}
      <Text style={styles.sectionTitle}>Machines ({totalRuns})</Text>
      
      {r.runs?.map((run: ReportRun) => (
        <Card
          key={run.id}
          style={styles.runCard}
          onPress={() => handleOpenRun(run.id)}
        >
          <View style={styles.runHeader}>
            <Package size={24} color={colors.primary} />
            <View style={styles.runInfo}>
              <Text style={styles.runCode}>{run.asset_code}</Text>
              <Text style={styles.runDesignation}>{run.asset_designation}</Text>
              <Text style={styles.runMeta}>
                {run.asset_marque} {run.asset_modele}
              </Text>
            </View>
            <View style={styles.runStatus}>
              {getConclusionBadge(run.conclusion)}
              <Badge 
                label={run.statut === 'VALIDE' ? 'Validé' : 'Brouillon'} 
                variant={run.statut === 'VALIDE' ? 'success' : 'info'} 
              />
            </View>
          </View>
          
          {(run.observationCount || 0) > 0 && (
            <View style={styles.runObsIndicator}>
              <AlertTriangle size={14} color={colors.warning} />
              <Text style={styles.runObsText}>
                {run.observationCount} observation(s)
              </Text>
            </View>
          )}
        </Card>
      ))}

      {/* Actions */}
      <View style={styles.actions}>
        <Button
          title="Voir les observations"
          variant="outline"
          icon={<AlertTriangle size={18} color={colors.primary} />}
          onPress={handleViewObservations}
        />

        {isAdmin && (
          <Button
            title={pdfAttachment ? 'Remplacer le PDF final' : 'Importer le PDF final'}
            icon={<Upload size={18} color={colors.textInverse} />}
            onPress={handleUploadFinalPdf}
            loading={uploadingPdf}
          />
        )}

        {pdfAttachment && (
          <Button
            title="Télécharger le PDF final"
            variant="outline"
            icon={<FileText size={18} color={colors.primary} />}
            onPress={handleDownloadAttachment}
          />
        )}
        
        {validatedRuns === totalRuns && !r.synthese && (
          <Button
            title="Finaliser le rapport"
            icon={<Check size={18} color={colors.textInverse} />}
            onPress={handleFinalize}
            loading={finalizeMutation.isPending}
          />
        )}
        
        {r.synthese && (
          <Button
            title={r.pdf_url ? 'Régénérer le PDF' : 'Générer le PDF'}
            icon={<Download size={18} color={colors.textInverse} />}
            onPress={handleGeneratePDF}
            loading={generatePDFMutation.isPending}
          />
        )}
        
        {r.pdf_url && (
          <Button
            title="Télécharger le PDF"
            variant="outline"
            icon={<FileText size={18} color={colors.primary} />}
            onPress={() => Linking.openURL(r.pdf_url!)}
          />
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  reportHeader: {
    margin: spacing.md,
    padding: spacing.lg,
  },
  reportTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  reportTitleInfo: {
    flex: 1,
  },
  reportNumber: {
    ...typography.h2,
    color: colors.text,
  },
  reportDate: {
    ...typography.body,
    color: colors.textMuted,
  },
  reportMeta: {
    gap: spacing.sm,
  },
  metaItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metaLabel: {
    ...typography.caption,
    color: colors.textMuted,
  },
  metaValue: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
  },
  synthese: {
    marginTop: spacing.lg,
    padding: spacing.md,
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
  },
  syntheseLabel: {
    ...typography.caption,
    color: colors.textMuted,
    marginBottom: spacing.xs,
  },
  syntheseText: {
    ...typography.body,
    color: colors.text,
  },
  progressCard: {
    margin: spacing.md,
    marginTop: 0,
    padding: spacing.lg,
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.md,
  },
  progressBar: {
    height: 8,
    backgroundColor: colors.border,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.success,
    borderRadius: 4,
  },
  progressStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  progressStat: {
    ...typography.caption,
    color: colors.textMuted,
  },
  progressStatValue: {
    fontWeight: '700',
    color: colors.success,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.text,
    margin: spacing.md,
    marginBottom: spacing.sm,
  },
  runCard: {
    margin: spacing.md,
    marginTop: 0,
    marginBottom: spacing.sm,
    padding: spacing.md,
  },
  runHeader: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  runInfo: {
    flex: 1,
  },
  runCode: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
  },
  runDesignation: {
    ...typography.body,
    color: colors.text,
  },
  runMeta: {
    ...typography.caption,
    color: colors.textMuted,
  },
  runStatus: {
    alignItems: 'flex-end',
    gap: spacing.xs,
  },
  runObsIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  runObsText: {
    ...typography.caption,
    color: colors.warning,
  },
  actions: {
    padding: spacing.lg,
    gap: spacing.md,
  },
});
