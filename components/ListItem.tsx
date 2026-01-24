import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { colors, spacing, borderRadius, shadows, typography } from '@/constants/theme';
import { StatusBadge, OverdueBadge, CriticalityBadge } from './Badge';

interface AssetListItemProps {
  code: string;
  designation: string;
  categorie: string;
  statut: string;
  criticite: number;
  isOverdue?: boolean;
  siteName?: string;
  zoneName?: string;
  onPress: () => void;
}

export function AssetListItem({
  code,
  designation,
  categorie,
  statut,
  criticite,
  isOverdue,
  siteName,
  zoneName,
  onPress,
}: AssetListItemProps) {
  return (
    <TouchableOpacity style={styles.item} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.itemContent}>
        <View style={styles.itemHeader}>
          <Text style={styles.itemCode}>{code}</Text>
          <View style={styles.badges}>
            {isOverdue && <OverdueBadge />}
            <CriticalityBadge level={criticite} />
          </View>
        </View>
        <Text style={styles.itemTitle} numberOfLines={1}>{designation}</Text>
        <View style={styles.itemMeta}>
          <Text style={styles.itemCategory}>{categorie}</Text>
          {(siteName || zoneName) && (
            <Text style={styles.itemLocation}>
              {[siteName, zoneName].filter(Boolean).join(' • ')}
            </Text>
          )}
        </View>
        <View style={styles.itemFooter}>
          <StatusBadge status={statut} />
        </View>
      </View>
      <ChevronRight size={20} color={colors.textMuted} />
    </TouchableOpacity>
  );
}

interface EcheanceListItemProps {
  assetCode: string;
  assetDesignation: string;
  controlTypeLabel: string;
  daysRemaining: number;
  isOverdue: boolean;
  siteName: string;
  onPress: () => void;
}

export function EcheanceListItem({
  assetCode,
  assetDesignation,
  controlTypeLabel,
  daysRemaining,
  isOverdue,
  siteName,
  onPress,
}: EcheanceListItemProps) {
  const getDaysLabel = () => {
    if (isOverdue) {
      return `${Math.abs(daysRemaining)} j de retard`;
    }
    if (daysRemaining === 0) return "Aujourd'hui";
    if (daysRemaining === 1) return 'Demain';
    return `Dans ${daysRemaining} jours`;
  };

  return (
    <TouchableOpacity style={styles.item} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.itemContent}>
        <View style={styles.itemHeader}>
          <Text style={styles.itemCode}>{assetCode}</Text>
          {isOverdue && <OverdueBadge />}
        </View>
        <Text style={styles.itemTitle} numberOfLines={1}>{assetDesignation}</Text>
        <Text style={styles.itemCategory}>{controlTypeLabel}</Text>
        <View style={styles.itemFooter}>
          <Text style={[styles.daysLabel, isOverdue && styles.daysLabelOverdue]}>
            {getDaysLabel()}
          </Text>
          <Text style={styles.itemLocation}>{siteName}</Text>
        </View>
      </View>
      <ChevronRight size={20} color={colors.textMuted} />
    </TouchableOpacity>
  );
}

interface MissionListItemProps {
  controlTypeLabel: string;
  scheduledAt: string;
  status: string;
  siteName: string;
  assignedToName?: string;
  assetsCount: number;
  onPress: () => void;
}

export function MissionListItem({
  controlTypeLabel,
  scheduledAt,
  status,
  siteName,
  assignedToName,
  assetsCount,
  onPress,
}: MissionListItemProps) {
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <TouchableOpacity style={styles.item} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.itemContent}>
        <View style={styles.itemHeader}>
          <Text style={styles.itemTitle}>{controlTypeLabel}</Text>
          <StatusBadge status={status} />
        </View>
        <Text style={styles.itemCategory}>{formatDate(scheduledAt)}</Text>
        <View style={styles.itemMeta}>
          <Text style={styles.itemLocation}>{siteName}</Text>
          <Text style={styles.itemLocation}>•</Text>
          <Text style={styles.itemLocation}>{assetsCount} équipement(s)</Text>
        </View>
        {assignedToName && (
          <Text style={styles.assignee}>Assigné à: {assignedToName}</Text>
        )}
      </View>
      <ChevronRight size={20} color={colors.textMuted} />
    </TouchableOpacity>
  );
}

interface NCListItemProps {
  title: string;
  assetCode?: string;
  severity: number;
  status: string;
  actionStatus?: string;
  createdAt: string;
  onPress: () => void;
}

export function NCListItem({
  title,
  assetCode,
  severity,
  status,
  actionStatus,
  createdAt,
  onPress,
}: NCListItemProps) {
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
    });
  };

  return (
    <TouchableOpacity style={styles.item} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.itemContent}>
        <View style={styles.itemHeader}>
          <Text style={styles.itemTitle} numberOfLines={1}>{title}</Text>
          <CriticalityBadge level={severity} />
        </View>
        {assetCode && <Text style={styles.itemCode}>{assetCode}</Text>}
        <View style={styles.itemFooter}>
          <StatusBadge status={status} />
          {actionStatus && (
            <View style={styles.actionBadge}>
              <Text style={styles.actionLabel}>Action: </Text>
              <StatusBadge status={actionStatus} />
            </View>
          )}
        </View>
        <Text style={styles.dateLabel}>{formatDate(createdAt)}</Text>
      </View>
      <ChevronRight size={20} color={colors.textMuted} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  item: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    ...shadows.sm,
  },
  itemContent: {
    flex: 1,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  itemCode: {
    fontSize: typography.caption.fontSize,
    fontWeight: '600' as const,
    color: colors.primary,
  },
  itemTitle: {
    fontSize: typography.body.fontSize,
    fontWeight: '600' as const,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  itemCategory: {
    fontSize: typography.bodySmall.fontSize,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  itemMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  itemLocation: {
    fontSize: typography.caption.fontSize,
    color: colors.textMuted,
  },
  itemFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  badges: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  daysLabel: {
    fontSize: typography.bodySmall.fontSize,
    fontWeight: '500' as const,
    color: colors.warning,
  },
  daysLabelOverdue: {
    color: colors.danger,
  },
  assignee: {
    fontSize: typography.caption.fontSize,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  actionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionLabel: {
    fontSize: typography.caption.fontSize,
    color: colors.textMuted,
  },
  dateLabel: {
    fontSize: typography.caption.fontSize,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
});
