/**
 * EntityLink - Text link component for navigating to entities
 * Used for inline text that navigates (Client name, Site name, Equipment name)
 */

import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { colors, typography } from '@/constants/theme';

interface EntityLinkProps {
  label?: string;
  value: string;
  onPress: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'danger';
  testID?: string;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

export const EntityLink = ({
  label,
  value,
  onPress,
  disabled = false,
  variant = 'primary',
  testID,
  accessibilityLabel,
  accessibilityHint,
}: EntityLinkProps) => {
  const getColor = () => {
    if (disabled) return colors.textMuted;
    switch (variant) {
      case 'secondary': return colors.textSecondary;
      case 'danger': return colors.danger;
      default: return colors.primary;
    }
  };

  const color = getColor();

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={disabled ? 1 : 0.7}
      testID={testID}
      accessibilityRole="link"
      accessibilityLabel={accessibilityLabel || value}
      accessibilityHint={accessibilityHint}
    >
      {label && (
        <Text style={styles.label}>
          {label}{' '}
          <Text style={[styles.value, { color }]}>
            {value}
          </Text>
        </Text>
      )}
      {!label && (
        <Text style={[styles.value, { color }]}>
          {value}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  label: {
    ...typography.body,
    color: colors.text,
  },
  value: {
    ...typography.body,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});
