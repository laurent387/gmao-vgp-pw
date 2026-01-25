import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { 
  ChevronDown, ChevronUp, Check, X, Minus, AlertTriangle, 
  MessageSquare, Save 
} from 'lucide-react-native';
import { colors, spacing, typography } from '@/constants/theme';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Input } from '@/components/Input';
import { Badge } from '@/components/Badge';
import { LoadingState } from '@/components/EmptyState';
import { trpc } from '@/lib/trpc';
import type { VGPItemResult } from '@/types';

interface RunSection {
  id: string;
  code: string;
  title: string;
  sort_order: number;
  items?: RunItem[];
}

interface RunItem {
  id: string;
  section_id: string;
  numero: number;
  label: string;
  help_text?: string | null;
  obligatoire?: boolean;
  active?: boolean;
  result?: {
    result: string;
    comment?: string;
  } | null;
}

interface RunObservation {
  id: string;
  statut: string;
}

interface RunData {
  id: string;
  statut: string;
  asset_code?: string;
  asset_designation?: string;
  asset_marque?: string;
  asset_modele?: string;
  asset_annee?: string;
  asset_force?: string;
  compteur_type?: string;
  compteur_valeur?: number;
  conditions_intervention?: string;
  particularites?: string;
  moyens_disposition?: boolean;
  sections?: RunSection[];
  observations?: RunObservation[];
}

export default function VGPRunScreen() {
  const { runId } = useLocalSearchParams<{ runId: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');
  
  // Header form state
  const [compteurType, setCompteurType] = useState('');
  const [compteurValeur, setCompteurValeur] = useState('');
  const [conditionsIntervention, setConditionsIntervention] = useState('');
  const [particularites, setParticularites] = useState('');
  const [moyensDisposition, setMoyensDisposition] = useState(true);

  const { data: run, isLoading, refetch } = trpc.vgp.getRunById.useQuery(
    { id: runId! },
    { enabled: !!runId }
  );

  // Initialize form values when run data loads
  useEffect(() => {
    if (run) {
      const r = run as unknown as RunData;
      setCompteurType(r.compteur_type || '');
      setCompteurValeur(r.compteur_valeur?.toString() || '');
      setConditionsIntervention(r.conditions_intervention || '');
      setParticularites(r.particularites || '');
      setMoyensDisposition(r.moyens_disposition ?? true);
    }
  }, [run]);

  const updateResultMutation = trpc.vgp.updateItemResult.useMutation({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [['vgp', 'getRunById'], { input: { id: runId } }] });
      refetch();
    },
  });

  const updateHeaderMutation = trpc.vgp.updateRunHeader.useMutation({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [['vgp', 'getRunById'], { input: { id: runId } }] });
      Alert.alert('Succès', 'En-tête mis à jour');
      refetch();
    },
  });

  const validateRunMutation = trpc.vgp.validateRun.useMutation({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [['vgp', 'getRunById'], { input: { id: runId } }] });
      Alert.alert('Succès', 'Fiche validée avec succès', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    },
  });

  const toggleSection = useCallback((sectionId: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(sectionId)) {
        next.delete(sectionId);
      } else {
        next.add(sectionId);
      }
      return next;
    });
  }, []);

  const handleResultChange = useCallback((itemId: string, result: VGPItemResult) => {
    if (!runId) return;
    updateResultMutation.mutate({ runId, itemId, result });
  }, [runId, updateResultMutation]);

  const handleSaveComment = useCallback((itemId: string) => {
    if (!runId || !editingComment) return;
    const r = run as unknown as RunData | undefined;
    
    // Get current result
    const currentResult = r?.sections
      ?.flatMap((s: RunSection) => s.items || [])
      .find((i: RunItem) => i.id === itemId)
      ?.result?.result || 'NA';
    
    updateResultMutation.mutate({ 
      runId, 
      itemId, 
      result: currentResult as VGPItemResult, 
      comment: commentText 
    });
    setEditingComment(null);
    setCommentText('');
  }, [runId, editingComment, commentText, run, updateResultMutation]);

  const handleSaveHeader = useCallback(() => {
    if (!runId) return;
    updateHeaderMutation.mutate({
      runId,
      compteurType: compteurType || undefined,
      compteurValeur: compteurValeur ? parseInt(compteurValeur) : undefined,
      conditionsIntervention: conditionsIntervention || undefined,
      particularites: particularites || undefined,
      moyensDisposition,
    });
  }, [runId, compteurType, compteurValeur, conditionsIntervention, particularites, moyensDisposition, updateHeaderMutation]);

  const handleValidate = useCallback(() => {
    if (!run) return;
    const r = run as unknown as RunData;
    
    const openObs = r.observations?.filter((o: RunObservation) => o.statut === 'OUVERTE').length || 0;
    
    Alert.alert(
      'Valider la fiche',
      `${openObs > 0 ? `Attention: ${openObs} observation(s) ouverte(s).\n\n` : ''}Choisissez la conclusion :`,
      [
        { text: 'Annuler', style: 'cancel' },
        { 
          text: 'Conforme', 
          onPress: () => validateRunMutation.mutate({ runId: runId!, conclusion: 'CONFORME' })
        },
        { 
          text: 'Sous réserve', 
          onPress: () => validateRunMutation.mutate({ runId: runId!, conclusion: 'CONFORME_SOUS_RESERVE' })
        },
        { 
          text: 'Non conforme', 
          style: 'destructive',
          onPress: () => validateRunMutation.mutate({ runId: runId!, conclusion: 'NON_CONFORME' })
        },
      ]
    );
  }, [run, runId, validateRunMutation]);

  const getSectionStats = (section: RunSection) => {
    const items = section.items || [];
    const oui = items.filter((i: RunItem) => i.result?.result === 'OUI').length;
    const non = items.filter((i: RunItem) => i.result?.result === 'NON').length;
    const na = items.filter((i: RunItem) => !i.result?.result || i.result?.result === 'NA').length;
    return { oui, non, na, total: items.length };
  };

  if (isLoading || !run) {
    return <LoadingState message="Chargement de la fiche..." />;
  }

  const r = run as unknown as RunData;
  const openObservationsCount = r.observations?.filter((o: RunObservation) => o.statut === 'OUVERTE').length || 0;

  return (
    <ScrollView style={styles.container}>
      {/* Machine Info Header */}
      <Card style={styles.machineHeader}>
        <Text style={styles.machineCode}>{r.asset_code}</Text>
        <Text style={styles.machineDesignation}>{r.asset_designation}</Text>
        <View style={styles.machineDetails}>
          <Text style={styles.machineMeta}>
            {r.asset_marque} {r.asset_modele} • {r.asset_annee}
          </Text>
          {r.asset_force && (
            <Text style={styles.machineMeta}>Force: {r.asset_force}</Text>
          )}
        </View>
        <Badge 
          label={r.statut === 'VALIDE' ? 'Validé' : 'Brouillon'} 
          variant={r.statut === 'VALIDE' ? 'success' : 'warning'} 
        />
      </Card>

      {/* Run Header Form */}
      <Card style={styles.headerForm}>
        <Text style={styles.sectionTitle}>Informations d'intervention</Text>
        
        <View style={styles.row}>
          <View style={styles.halfInput}>
            <Input
              label="Type compteur"
              value={compteurType}
              onChangeText={setCompteurType}
              placeholder="heures / coups"
            />
          </View>
          <View style={styles.halfInput}>
            <Input
              label="Valeur compteur"
              value={compteurValeur}
              onChangeText={setCompteurValeur}
              placeholder="0"
              keyboardType="numeric"
            />
          </View>
        </View>
        
        <Input
          label="Conditions d'intervention"
          value={conditionsIntervention}
          onChangeText={setConditionsIntervention}
          placeholder="Machine à l'arrêt, zone sécurisée..."
          multiline
        />
        
        <Input
          label="Particularités / Dispositifs de protection"
          value={particularites}
          onChangeText={setParticularites}
          placeholder="Barrière immatérielle, commande bi-manuelle..."
          multiline
        />
        
        <TouchableOpacity 
          style={styles.checkboxRow}
          onPress={() => setMoyensDisposition(!moyensDisposition)}
        >
          <View style={[styles.checkbox, moyensDisposition && styles.checkboxChecked]}>
            {moyensDisposition && <Check size={16} color={colors.textInverse} />}
          </View>
          <Text style={styles.checkboxLabel}>Moyens mis à disposition</Text>
        </TouchableOpacity>
        
        <Button
          title="Enregistrer l'en-tête"
          onPress={handleSaveHeader}
          variant="outline"
          icon={<Save size={16} color={colors.primary} />}
          loading={updateHeaderMutation.isPending}
        />
      </Card>

      {/* Observations Alert */}
      {openObservationsCount > 0 && (
        <Card style={styles.obsAlert}>
          <View style={styles.obsAlertContent}>
            <AlertTriangle size={24} color={colors.warning} />
            <Text style={styles.obsAlertText}>
              {openObservationsCount} observation(s) ouverte(s)
            </Text>
          </View>
          <Button
            title="Voir"
            size="sm"
            variant="ghost"
            onPress={() => router.push(`/vgp/observations?runId=${runId}`)}
          />
        </Card>
      )}

      {/* Checklist Sections */}
      <Text style={styles.checklistTitle}>Checklist de contrôle</Text>
      
      {r.sections?.map((section: RunSection) => {
        const isExpanded = expandedSections.has(section.id);
        const stats = getSectionStats(section);
        
        return (
          <Card key={section.id} style={styles.sectionCard}>
            <TouchableOpacity
              style={styles.sectionHeader}
              onPress={() => toggleSection(section.id)}
            >
              <View style={styles.sectionHeaderLeft}>
                <Text style={styles.sectionCode}>{section.code}</Text>
                <View>
                  <Text style={styles.sectionTitleText}>{section.title}</Text>
                  <View style={styles.sectionStats}>
                    <Text style={[styles.statBadge, styles.statOui]}>{stats.oui} ✓</Text>
                    <Text style={[styles.statBadge, styles.statNon]}>{stats.non} ✗</Text>
                    <Text style={[styles.statBadge, styles.statNa]}>{stats.na} -</Text>
                  </View>
                </View>
              </View>
              {isExpanded ? (
                <ChevronUp size={24} color={colors.textMuted} />
              ) : (
                <ChevronDown size={24} color={colors.textMuted} />
              )}
            </TouchableOpacity>
            
            {isExpanded && (
              <View style={styles.itemsList}>
                {section.items?.map((item: RunItem) => {
                  const currentResult = item.result?.result || 'NA';
                  const hasComment = !!item.result?.comment;
                  
                  return (
                    <View key={item.id} style={styles.itemRow}>
                      <View style={styles.itemInfo}>
                        <Text style={styles.itemNumero}>{item.numero}</Text>
                        <View style={styles.itemContent}>
                          <Text style={styles.itemLabel}>{item.label}</Text>
                          {item.help_text && (
                            <Text style={styles.itemHelp}>{item.help_text}</Text>
                          )}
                          {hasComment && (
                            <Text style={styles.itemComment}>
                              💬 {item.result?.comment}
                            </Text>
                          )}
                        </View>
                      </View>
                      
                      <View style={styles.itemActions}>
                        {/* Result buttons */}
                        <View style={styles.resultButtons}>
                          <TouchableOpacity
                            style={[
                              styles.resultButton,
                              currentResult === 'OUI' && styles.resultButtonOui,
                            ]}
                            onPress={() => handleResultChange(item.id, 'OUI')}
                          >
                            <Check size={16} color={currentResult === 'OUI' ? colors.textInverse : colors.success} />
                          </TouchableOpacity>
                          
                          <TouchableOpacity
                            style={[
                              styles.resultButton,
                              currentResult === 'NON' && styles.resultButtonNon,
                            ]}
                            onPress={() => handleResultChange(item.id, 'NON')}
                          >
                            <X size={16} color={currentResult === 'NON' ? colors.textInverse : colors.danger} />
                          </TouchableOpacity>
                          
                          <TouchableOpacity
                            style={[
                              styles.resultButton,
                              currentResult === 'NA' && styles.resultButtonNa,
                            ]}
                            onPress={() => handleResultChange(item.id, 'NA')}
                          >
                            <Minus size={16} color={currentResult === 'NA' ? colors.textInverse : colors.textMuted} />
                          </TouchableOpacity>
                        </View>
                        
                        {/* Comment button */}
                        <TouchableOpacity
                          style={styles.commentButton}
                          onPress={() => {
                            setEditingComment(item.id);
                            setCommentText(item.result?.comment || '');
                          }}
                        >
                          <MessageSquare 
                            size={16} 
                            color={hasComment ? colors.primary : colors.textMuted} 
                          />
                        </TouchableOpacity>
                      </View>
                      
                      {/* Comment editor */}
                      {editingComment === item.id && (
                        <View style={styles.commentEditor}>
                          <Input
                            value={commentText}
                            onChangeText={setCommentText}
                            placeholder="Ajouter un commentaire..."
                            multiline
                          />
                          <View style={styles.commentActions}>
                            <Button
                              title="Annuler"
                              size="sm"
                              variant="ghost"
                              onPress={() => setEditingComment(null)}
                            />
                            <Button
                              title="Enregistrer"
                              size="sm"
                              onPress={() => handleSaveComment(item.id)}
                            />
                          </View>
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>
            )}
          </Card>
        );
      })}

      {/* Actions */}
      <View style={styles.actions}>
        <Button
          title="Voir les observations"
          variant="outline"
          icon={<AlertTriangle size={18} color={colors.primary} />}
          onPress={() => router.push(`/vgp/observations?runId=${runId}`)}
        />
        
        {r.statut !== 'VALIDE' && (
          <Button
            title="Valider la fiche"
            icon={<Check size={18} color={colors.textInverse} />}
            onPress={handleValidate}
            loading={validateRunMutation.isPending}
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
  machineHeader: {
    margin: spacing.md,
    padding: spacing.lg,
  },
  machineCode: {
    ...typography.h2,
    color: colors.primary,
  },
  machineDesignation: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginTop: spacing.xs,
  },
  machineDetails: {
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  machineMeta: {
    ...typography.caption,
    color: colors.textMuted,
  },
  headerForm: {
    margin: spacing.md,
    marginTop: 0,
    padding: spacing.lg,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.md,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  halfInput: {
    flex: 1,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginVertical: spacing.md,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  checkboxLabel: {
    ...typography.body,
    color: colors.text,
  },
  obsAlert: {
    margin: spacing.md,
    marginTop: 0,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.warningLight,
  },
  obsAlertContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  obsAlertText: {
    ...typography.body,
    color: colors.warning,
    fontWeight: '600',
  },
  checklistTitle: {
    ...typography.h3,
    color: colors.text,
    margin: spacing.md,
    marginBottom: spacing.sm,
  },
  sectionCard: {
    margin: spacing.md,
    marginTop: 0,
    marginBottom: spacing.sm,
    overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    backgroundColor: colors.surface,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
  },
  sectionCode: {
    ...typography.h2,
    color: colors.primary,
    width: 40,
  },
  sectionTitleText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  sectionStats: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  statBadge: {
    ...typography.caption,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statOui: {
    backgroundColor: colors.successLight,
    color: colors.success,
  },
  statNon: {
    backgroundColor: colors.dangerLight,
    color: colors.danger,
  },
  statNa: {
    backgroundColor: colors.border,
    color: colors.textMuted,
  },
  itemsList: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  itemRow: {
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  itemInfo: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  itemNumero: {
    ...typography.caption,
    color: colors.textMuted,
    width: 30,
    fontWeight: '700',
  },
  itemContent: {
    flex: 1,
  },
  itemLabel: {
    ...typography.body,
    color: colors.text,
  },
  itemHelp: {
    ...typography.caption,
    color: colors.textMuted,
    fontStyle: 'italic',
    marginTop: 2,
  },
  itemComment: {
    ...typography.caption,
    color: colors.primary,
    marginTop: spacing.xs,
  },
  itemActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  resultButtons: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  resultButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultButtonOui: {
    backgroundColor: colors.success,
    borderColor: colors.success,
  },
  resultButtonNon: {
    backgroundColor: colors.danger,
    borderColor: colors.danger,
  },
  resultButtonNa: {
    backgroundColor: colors.textMuted,
    borderColor: colors.textMuted,
  },
  commentButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  commentEditor: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  commentActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  actions: {
    padding: spacing.lg,
    gap: spacing.md,
  },
});
