import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { colors, borderRadius, typography } from '@/constants/theme';

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'muted';
type BadgeSize = 'sm' | 'md';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  size?: BadgeSize;
  style?: ViewStyle;
}

const variantStyles: Record<BadgeVariant, { bg: string; text: string }> = {
  default: { bg: colors.primary + '20', text: colors.primary },
  success: { bg: colors.successLight, text: colors.success },
  warning: { bg: colors.warningLight, text: colors.warning },
  danger: { bg: colors.dangerLight, text: colors.danger },
  info: { bg: colors.infoLight, text: colors.info },
  muted: { bg: colors.surfaceAlt, text: colors.textSecondary },
};

export function Badge({ label, variant = 'default', size = 'sm', style }: BadgeProps) {
  const { bg, text } = variantStyles[variant];
  const isSmall = size === 'sm';

  return (
    <View style={[
      styles.badge,
      { backgroundColor: bg },
      isSmall ? styles.badgeSm : styles.badgeMd,
      style,
    ]}>
      <Text style={[
        styles.text,
        { color: text },
        isSmall ? styles.textSm : styles.textMd,
      ]}>
        {label}
      </Text>
    </View>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const getVariant = (): BadgeVariant => {
    switch (status) {
      case 'EN_SERVICE':
      case 'CONFORME':
      case 'TERMINEE':
      case 'VALIDEE':
      case 'CLOTUREE':
      case 'SENT':
        return 'success';
      case 'HORS_SERVICE':
      case 'EN_COURS':
      case 'PLANIFIEE':
      case 'PENDING':
        return 'warning';
      case 'REBUT':
      case 'NON_CONFORME':
      case 'OUVERTE':
      case 'ERROR':
        return 'danger';
      case 'EN_LOCATION':
      case 'CONFORME_SOUS_RESERVE':
      case 'A_PLANIFIER':
        return 'info';
      default:
        return 'muted';
    }
  };

  const getLabel = (): string => {
    const labels: Record<string, string> = {
      EN_SERVICE: 'En service',
      HORS_SERVICE: 'Hors service',
      REBUT: 'Rebut',
      EN_LOCATION: 'En location',
      CONFORME: 'Conforme',
      NON_CONFORME: 'Non conforme',
      CONFORME_SOUS_RESERVE: 'Sous réserve',
      A_PLANIFIER: 'À planifier',
      PLANIFIEE: 'Planifiée',
      EN_COURS: 'En cours',
      TERMINEE: 'Terminée',
      ANNULEE: 'Annulée',
      OUVERTE: 'Ouverte',
      CLOTUREE: 'Clôturée',
      VALIDEE: 'Validée',
      PENDING: 'En attente',
      SENT: 'Envoyé',
      ERROR: 'Erreur',
    };
    return labels[status] || status;
  };

  return <Badge label={getLabel()} variant={getVariant()} />;
}

export function OverdueBadge() {
  return <Badge label="EN RETARD" variant="danger" />;
}

export function CriticalityBadge({ level }: { level: number }) {
  const getVariant = (): BadgeVariant => {
    if (level >= 4) return 'danger';
    if (level >= 3) return 'warning';
    return 'muted';
  };
  return <Badge label={`C${level}`} variant={getVariant()} />;
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: borderRadius.sm,
    alignSelf: 'flex-start',
  },
  badgeSm: {
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  badgeMd: {
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  text: {
    fontWeight: '600' as const,
  },
  textSm: {
    fontSize: 10,
  },
  textMd: {
    fontSize: 12,
  },
});
