import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Check, X, Minus, Camera, AlertTriangle } from 'lucide-react-native';
import { colors, spacing, borderRadius, typography, shadows } from '@/constants/theme';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { LoadingState, EmptyState } from '@/components/EmptyState';
import { assetRepository } from '@/repositories/AssetRepository';
import { checklistTemplateRepository, checklistItemRepository, controlTypeRepository, assetControlRepository } from '@/repositories/ControlRepository';
import { missionRepository } from '@/repositories/MissionRepository';
import { reportRepository } from '@/repositories/ReportRepository';
import { ncRepository } from '@/repositories/NCRepository';
import { actionRepository } from '@/repositories/NCRepository';
import { syncService } from '@/services/SyncService';
import { useAuth } from '@/contexts/AuthContext';
import { Asset, ChecklistItem, ChecklistItemStatus, ControlConclusion, ControlType } from '@/types';

interface ItemResult {
  checklistItemId: string;
  status: ChecklistItemStatus;
  valueNum: number | null;
  valueText: string | null;
  comment: string | null;
}

export default function ExecuteControlScreen() {
  const { missionId, assetId } = useLocalSearchParams<{ missionId: string; assetId: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  const [results, setResults] = useState<Record<string, ItemResult>>({});
  const [summary, setSummary] = useState('');
  const [signatureName, setSignatureName] = useState(user?.name || '');
  const [attestation, setAttestation] = useState(false);

  const { data: mission } = useQuery({
    queryKey: ['mission', missionId],
    queryFn: () => missionRepository.getByIdWithDetails(missionId!),
    enabled: !!missionId,
  });

  const { data: asset, isLoading: assetLoading } = useQuery<Asset | null>({
    queryKey: ['asset', assetId],
    queryFn: () => assetRepository.getByIdWithDetails(assetId!),
    enabled: !!assetId,
  });

  const { data: controlType } = useQuery<ControlType | null>({
    queryKey: ['control-type', mission?.control_type_id],
    queryFn: () => controlTypeRepository.getById(mission!.control_type_id),
    enabled: !!mission?.control_type_id,
  });

  const { data: template } = useQuery({
    queryKey: ['checklist-template', mission?.control_type_id, asset?.categorie],
    queryFn: () => checklistTemplateRepository.getByControlType(mission!.control_type_id, asset?.categorie),
    enabled: !!mission?.control_type_id,
  });

  const { data: checklistItems, isLoading: itemsLoading } = useQuery<ChecklistItem[]>({
    queryKey: ['checklist-items', template?.id],
    queryFn: () => checklistItemRepository.getByTemplateId(template!.id),
    enabled: !!template?.id,
  });

  const submitMutation = useMutation({
    mutationFn: async () => {
      if (!asset || !mission || !user) throw new Error('Données manquantes');
      if (!attestation) throw new Error('Veuillez attester le rapport');
      
      const itemResults = Object.values(results);
      const hasKO = itemResults.some(r => r.status === 'KO');
      const allAnswered = checklistItems?.every(item => 
        results[item.id]?.status !== undefined
      );
      
      if (!allAnswered) {
        throw new Error('Veuillez répondre à toutes les questions obligatoires');
      }

      let conclusion: ControlConclusion = 'CONFORME';
      if (hasKO) {
        conclusion = 'NON_CONFORME';
      }

      const reportItems = itemResults.map(r => ({
        checklist_item_id: r.checklistItemId,
        status: r.status,
        value_num: r.valueNum,
        value_text: r.valueText,
        comment: r.comment,
      }));

      const reportId = await reportRepository.create({
        mission_id: missionId!,
        asset_id: assetId!,
        performed_at: new Date().toISOString(),
        performer: user.id,
        conclusion,
        summary,
        signed_by_name: signatureName,
        signed_at: new Date().toISOString(),
      }, reportItems);

      if (controlType && controlType.periodicity_days > 0) {
        await assetControlRepository.updateLastDone(
          assetId!,
          mission.control_type_id,
          new Date(),
          controlType.periodicity_days
        );
      }

      const koItems = itemResults.filter(r => r.status === 'KO');
      for (const koItem of koItems) {
        const checklistItem = checklistItems?.find(i => i.id === koItem.checklistItemId);
        const ncId = await ncRepository.create({
          report_id: reportId,
          asset_id: assetId!,
          checklist_item_id: koItem.checklistItemId,
          title: `NC: ${checklistItem?.label || 'Item non conforme'}`,
          description: koItem.comment || `Non-conformité détectée lors du contrôle ${controlType?.label || ''}`,
          severity: 3,
          status: 'OUVERTE',
        });

        await actionRepository.create({
          nonconformity_id: ncId,
          owner: user.id,
          description: 'Action corrective à définir',
          due_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'OUVERTE',
          closed_at: null,
          validated_by: null,
        });
      }

      await syncService.addToOutbox('CREATE_REPORT', {
        reportId,
        missionId,
        assetId,
        conclusion,
        items: reportItems,
      });

      return reportId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mission', missionId] });
      queryClient.invalidateQueries({ queryKey: ['mission-reports', missionId] });
      queryClient.invalidateQueries({ queryKey: ['asset-controls', assetId] });
      queryClient.invalidateQueries({ queryKey: ['echeances'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-kpis'] });
      
      Alert.alert('Succès', 'Rapport de contrôle enregistré', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    },
    onError: (error) => {
      Alert.alert('Erreur', error instanceof Error ? error.message : 'Erreur lors de la soumission');
    },
  });

  const setItemResult = (itemId: string, update: Partial<ItemResult>) => {
    setResults(prev => ({
      ...prev,
      [itemId]: {
        checklistItemId: itemId,
        status: prev[itemId]?.status || 'NA',
        valueNum: prev[itemId]?.valueNum || null,
        valueText: prev[itemId]?.valueText || null,
        comment: prev[itemId]?.comment || null,
        ...update,
      },
    }));
  };

  if (assetLoading || itemsLoading) {
    return <LoadingState message="Chargement du contrôle..." />;
  }

  if (!asset || !checklistItems) {
    return (
      <EmptyState
        title="Erreur"
        message="Impossible de charger les données du contrôle"
      />
    );
  }

  const koCount = Object.values(results).filter(r => r.status === 'KO').length;

  return (
    <>
      <Stack.Screen options={{ title: `Contrôle ${asset.code_interne}` }} />
      
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.assetCode}>{asset.code_interne}</Text>
          <Text style={styles.assetDesignation}>{asset.designation}</Text>
          <Text style={styles.controlType}>{controlType?.label || 'Contrôle'}</Text>
        </View>

        {koCount > 0 && (
          <View style={styles.koWarning}>
            <AlertTriangle size={18} color={colors.danger} />
            <Text style={styles.koWarningText}>
              {koCount} point(s) non conforme(s) - NC créée(s) automatiquement
            </Text>
          </View>
        )}

        <View style={styles.checklist}>
          <Text style={styles.sectionTitle}>Checklist</Text>
          
          {checklistItems.map((item, index) => (
            <View key={item.id} style={styles.checklistItem}>
              <View style={styles.itemHeader}>
                <Text style={styles.itemNumber}>{index + 1}.</Text>
                <Text style={styles.itemLabel}>{item.label}</Text>
                {item.required && <Text style={styles.required}>*</Text>}
              </View>
              
              {item.help_text && (
                <Text style={styles.itemHelp}>{item.help_text}</Text>
              )}

              {item.field_type === 'BOOL' && (
                <View style={styles.boolButtons}>
                  <TouchableOpacity
                    style={[styles.boolButton, styles.okButton, results[item.id]?.status === 'OK' && styles.okButtonActive]}
                    onPress={() => setItemResult(item.id, { status: 'OK' })}
                  >
                    <Check size={20} color={results[item.id]?.status === 'OK' ? colors.textInverse : colors.success} />
                    <Text style={[styles.boolButtonText, results[item.id]?.status === 'OK' && styles.boolButtonTextActive]}>
                      OK
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[styles.boolButton, styles.koButton, results[item.id]?.status === 'KO' && styles.koButtonActive]}
                    onPress={() => setItemResult(item.id, { status: 'KO' })}
                  >
                    <X size={20} color={results[item.id]?.status === 'KO' ? colors.textInverse : colors.danger} />
                    <Text style={[styles.boolButtonText, results[item.id]?.status === 'KO' && styles.boolButtonTextActive]}>
                      KO
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[styles.boolButton, styles.naButton, results[item.id]?.status === 'NA' && styles.naButtonActive]}
                    onPress={() => setItemResult(item.id, { status: 'NA' })}
                  >
                    <Minus size={20} color={results[item.id]?.status === 'NA' ? colors.textInverse : colors.textMuted} />
                    <Text style={[styles.boolButtonText, results[item.id]?.status === 'NA' && styles.boolButtonTextActive]}>
                      N/A
                    </Text>
                  </TouchableOpacity>
                </View>
              )}

              {item.field_type === 'NUM' && (
                <TextInput
                  style={styles.numInput}
                  keyboardType="numeric"
                  placeholder="Valeur numérique"
                  value={results[item.id]?.valueNum?.toString() || ''}
                  onChangeText={(text) => {
                    const num = parseFloat(text) || null;
                    setItemResult(item.id, { valueNum: num, status: num !== null ? 'OK' : 'NA' });
                  }}
                />
              )}

              {item.field_type === 'TEXT' && (
                <TextInput
                  style={[styles.numInput, styles.textInput]}
                  multiline
                  placeholder="Observations..."
                  value={results[item.id]?.valueText || ''}
                  onChangeText={(text) => setItemResult(item.id, { valueText: text, status: text ? 'OK' : 'NA' })}
                />
              )}

              {(item.field_type === 'BOOL' && results[item.id]?.status === 'KO') && (
                <TextInput
                  style={[styles.numInput, styles.textInput]}
                  multiline
                  placeholder="Commentaire obligatoire pour KO..."
                  value={results[item.id]?.comment || ''}
                  onChangeText={(text) => setItemResult(item.id, { comment: text })}
                />
              )}
            </View>
          ))}
        </View>

        <View style={styles.summarySection}>
          <Text style={styles.sectionTitle}>Résumé</Text>
          <TextInput
            style={[styles.numInput, styles.textInput]}
            multiline
            placeholder="Observations générales..."
            value={summary}
            onChangeText={setSummary}
          />
        </View>

        <View style={styles.signatureSection}>
          <Text style={styles.sectionTitle}>Signature</Text>
          
          <Input
            label="Nom du signataire"
            value={signatureName}
            onChangeText={setSignatureName}
            placeholder="Votre nom"
          />

          <TouchableOpacity
            style={styles.attestationRow}
            onPress={() => setAttestation(!attestation)}
          >
            <View style={[styles.checkbox, attestation && styles.checkboxChecked]}>
              {attestation && <Check size={16} color={colors.textInverse} />}
            </View>
            <Text style={styles.attestationText}>
              J'atteste avoir effectué ce contrôle conformément aux procédures en vigueur
            </Text>
          </TouchableOpacity>
        </View>

        <Button
          title="Valider le rapport"
          onPress={() => submitMutation.mutate()}
          loading={submitMutation.isPending}
          disabled={!attestation}
          fullWidth
          style={styles.submitButton}
        />
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
  },
  header: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.lg,
    ...shadows.sm,
  },
  assetCode: {
    fontSize: typography.caption.fontSize,
    fontWeight: '600' as const,
    color: colors.primary,
  },
  assetDesignation: {
    ...typography.h3,
    color: colors.text,
    marginVertical: spacing.xs,
  },
  controlType: {
    fontSize: typography.bodySmall.fontSize,
    color: colors.textSecondary,
  },
  koWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    backgroundColor: colors.dangerLight,
    borderRadius: borderRadius.md,
    marginBottom: spacing.lg,
  },
  koWarningText: {
    flex: 1,
    fontSize: typography.bodySmall.fontSize,
    color: colors.danger,
    fontWeight: '500' as const,
  },
  checklist: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.md,
  },
  checklistItem: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  itemHeader: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
  },
  itemNumber: {
    fontSize: typography.body.fontSize,
    fontWeight: '600' as const,
    color: colors.primary,
    marginRight: spacing.sm,
  },
  itemLabel: {
    flex: 1,
    fontSize: typography.body.fontSize,
    color: colors.text,
  },
  required: {
    color: colors.danger,
    marginLeft: spacing.xs,
  },
  itemHelp: {
    fontSize: typography.caption.fontSize,
    color: colors.textMuted,
    fontStyle: 'italic',
    marginBottom: spacing.sm,
  },
  boolButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  boolButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 2,
  },
  okButton: {
    borderColor: colors.success,
    backgroundColor: colors.success + '10',
  },
  okButtonActive: {
    backgroundColor: colors.success,
  },
  koButton: {
    borderColor: colors.danger,
    backgroundColor: colors.danger + '10',
  },
  koButtonActive: {
    backgroundColor: colors.danger,
  },
  naButton: {
    borderColor: colors.border,
    backgroundColor: colors.surfaceAlt,
  },
  naButtonActive: {
    backgroundColor: colors.textMuted,
    borderColor: colors.textMuted,
  },
  boolButtonText: {
    fontSize: typography.bodySmall.fontSize,
    fontWeight: '600' as const,
    color: colors.text,
  },
  boolButtonTextActive: {
    color: colors.textInverse,
  },
  numInput: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: typography.body.fontSize,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  textInput: {
    minHeight: 80,
    textAlignVertical: 'top',
    marginTop: spacing.sm,
  },
  summarySection: {
    marginBottom: spacing.xl,
  },
  signatureSection: {
    marginBottom: spacing.xl,
  },
  attestationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: borderRadius.sm,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  attestationText: {
    flex: 1,
    fontSize: typography.bodySmall.fontSize,
    color: colors.textSecondary,
  },
  submitButton: {
    marginBottom: spacing.xxl,
  },
});
