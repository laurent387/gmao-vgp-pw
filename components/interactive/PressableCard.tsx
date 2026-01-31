/**
 * PressableCard - Enhanced Card component with press feedback and chevron
 * Used for navigable card elements (Client, Site, Equipment, etc.)
 */

import React from 'react';
import { TouchableOpacity, View, StyleSheet, ViewStyle, ActivityIndicator } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { colors, spacing, shadows } from '@/constants/theme';

interface PressableCardProps {
  children: React.ReactNode;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  showChevron?: boolean;
  style?: ViewStyle;
  testID?: string;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

export const PressableCard = ({
  children,
  onPress,
  disabled = false,
  loading = false,
  showChevron = true,
  style,
  testID,
  accessibilityLabel,
  accessibilityHint,
}: PressableCardProps) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={disabled ? 1 : 0.7}
      style={[
        styles.card,
        disabled && styles.disabled,
        style,
      ]}
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
    >
      <View style={styles.content}>
        {children}
      </View>
      
      <View style={styles.chevronContainer}>
        {loading ? (
          <ActivityIndicator size={20} color={colors.primary} />
        ) : showChevron && !disabled ? (
          <ChevronRight size={20} color={colors.primary} />
        ) : null}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: 8,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    marginHorizontal: spacing.sm,
    marginVertical: spacing.sm,
    minHeight: 50, // At least 44px for accessibility
    ...shadows.sm,
  },
  content: {
    flex: 1,
  },
  chevronContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 24,
    height: 24,
    marginLeft: spacing.md,
  },
  disabled: {
    opacity: 0.5,
  },
});
