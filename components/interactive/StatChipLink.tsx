/**
 * StatChipLink - Chip/badge component that navigates
 * Used for status, due dates, counts that link to filtered views
 */

import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet, ViewStyle, ActivityIndicator } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { colors, spacing, typography } from '@/constants/theme';

type ChipVariant = 'default' | 'success' | 'warning' | 'danger' | 'info';

interface StatChipLinkProps {
  label: string;
  value: string | number;
  variant?: ChipVariant;
  icon?: React.ReactNode;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  showChevron?: boolean;
  style?: ViewStyle;
  testID?: string;
  accessibilityLabel?: string;
}

export const StatChipLink = ({
  label,
  value,
  variant = 'default',
  icon,
  onPress,
  disabled = false,
  loading = false,
  showChevron = true,
  style,
  testID,
  accessibilityLabel,
}: StatChipLinkProps) => {
  const getBackgroundColor = () => {
    switch (variant) {
      case 'success': return colors.successLight;
      case 'warning': return colors.warningLight;
      case 'danger': return colors.dangerLight;
      case 'info': return colors.infoLight;
      default: return colors.surfaceAlt;
    }
  };

  const getTextColor = () => {
    switch (variant) {
      case 'success': return colors.success;
      case 'warning': return colors.warning;
      case 'danger': return colors.danger;
      case 'info': return colors.info;
      default: return colors.text;
    }
  };

  const backgroundColor = getBackgroundColor();
  const textColor = getTextColor();

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={disabled ? 1 : 0.75}
      style={[
        styles.chip,
        { backgroundColor },
        disabled && styles.disabled,
        style,
      ]}
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || `${label}: ${value}`}
    >
      <View style={styles.iconContainer}>
        {icon}
      </View>

      <View style={styles.textContainer}>
        <Text style={[styles.label, { color: colors.textMuted }]} numberOfLines={1}>
          {label}
        </Text>
        <Text style={[styles.value, { color: textColor }]} numberOfLines={1}>
          {value}
        </Text>
      </View>

      {showChevron && (
        <View style={styles.chevron}>
          {loading ? (
            <ActivityIndicator size={14} color={textColor} />
          ) : (
            <ChevronRight size={16} color={textColor} />
          )}
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    marginHorizontal: spacing.sm,
    marginVertical: spacing.sm,
    minHeight: 44, // Accessibility minimum
  },
  iconContainer: {
    marginRight: spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
    width: 20,
    height: 20,
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  label: {
    ...typography.caption,
    fontSize: 11,
  },
  value: {
    ...typography.body,
    fontWeight: '600',
    marginTop: spacing.xs,
  },
  chevron: {
    marginLeft: spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
    width: 16,
    height: 16,
  },
  disabled: {
    opacity: 0.5,
  },
});
