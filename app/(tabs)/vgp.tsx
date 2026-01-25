import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { FileText, Plus, Copy, ChevronRight } from 'lucide-react-native';
import { colors, spacing, typography } from '@/constants/theme';
import { EmptyState, LoadingState } from '@/components/EmptyState';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Badge } from '@/components/Badge';
import { useAuth } from '@/contexts/AuthContext';
import { trpc } from '@/lib/trpc';
import type { VGPTemplate } from '@/types';

export default function VGPTemplatesScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { canCreate } = useAuth();
  const [refreshing, setRefreshing] = useState(false);

  const { data: templates, isLoading, refetch } = trpc.vgp.listTemplates.useQuery(
    { activeOnly: false }
  );

  const duplicateMutation = trpc.vgp.duplicateTemplate.useMutation({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vgp', 'templates'] });
      Alert.alert('Succès', 'Template dupliqué avec succès');
    },
    onError: (err) => {
      Alert.alert('Erreur', err.message || 'Erreur lors de la duplication');
    },
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const handleDuplicate = (template: VGPTemplate) => {
    Alert.prompt(
      'Dupliquer le template',
      'Entrez le nom du nouveau template',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Dupliquer',
          onPress: (name: string | undefined) => {
            if (name && name.trim()) {
              duplicateMutation.mutate({ sourceId: template.id, newName: name.trim() });
            }
          },
        },
      ],
      'plain-text',
      `${template.name} (copie)`
    );
  };

  const handleStartVGP = () => {
    router.push('/vgp/start');
  };

  const handleViewTemplate = (templateId: string) => {
    router.push(`/vgp/template/${templateId}`);
  };

  const renderTemplate = ({ item }: { item: VGPTemplate }) => (
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
        
        {item.referentiel && (
          <Text style={styles.referentiel}>{item.referentiel}</Text>
        )}
        
        <View style={styles.templateActions}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => handleDuplicate(item)}
          >
            <Copy size={16} color={colors.primary} />
            <Text style={styles.actionText}>Dupliquer</Text>
          </TouchableOpacity>
          
          <ChevronRight size={20} color={colors.textMuted} />
        </View>
      </TouchableOpacity>
    </Card>
  );

  if (isLoading) {
    return <LoadingState message="Chargement des templates VGP..." />;
  }

  return (
    <View style={styles.container}>
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
        data={templates}
        renderItem={renderTemplate}
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
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    ...typography.h2,
    color: colors.text,
  },
  listContent: {
    padding: spacing.md,
    gap: spacing.md,
  },
  templateCard: {
    marginBottom: spacing.sm,
  },
  templateContent: {
    padding: spacing.md,
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
    fontWeight: '600',
    color: colors.text,
  },
  templateMeta: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 2,
  },
  referentiel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.sm,
    paddingLeft: spacing.xl + spacing.md,
  },
  templateActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    padding: spacing.sm,
  },
  actionText: {
    ...typography.body,
    color: colors.primary,
  },
});
