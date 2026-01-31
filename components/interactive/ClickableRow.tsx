/**
 * ClickableRow - Row component with icon, text, and navigation chevron
 * Used for list items that navigate (Equipment, Mission, NC, etc.)
 */

import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet, ViewStyle, ActivityIndicator } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { colors, spacing, typography, shadows } from '@/constants/theme';

interface ClickableRowProps {
  icon?: React.ReactNode;
  title: string;
  subtitle?: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  testID?: string;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  rightElement?: React.ReactNode;
}

export const ClickableRow = ({
  icon,
  title,
  subtitle,
  onPress,
  disabled = false,
  loading = false,
  style,
  testID,
  accessibilityLabel,
  accessibilityHint,
  rightElement,
}: ClickableRowProps) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={disabled ? 1 : 0.7}
      style={[
        styles.row,
        disabled && styles.disabled,
        style,
      ]}
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || title}
      accessibilityHint={accessibilityHint}
    >
      {icon && (
        <View style={styles.iconContainer}>
          {icon}
        </View>
      )}
      
      <View style={styles.textContainer}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        {subtitle && (
          <Text style={styles.subtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        )}
      </View>

      {rightElement && (
        <View style={styles.rightElementContainer}>
          {rightElement}
        </View>
      )}

      <View style={styles.chevronContainer}>
        {loading ? (
          <ActivityIndicator size={16} color={colors.primary} />
        ) : (
          <ChevronRight size={18} color={colors.primary} />
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    minHeight: 52, // Ensure at least 44px for accessibility
  },
  iconContainer: {
    marginRight: spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
    width: 24,
    height: 24,
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    ...typography.body,
    color: colors.text,
    fontWeight: '500',
  },
  subtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  rightElementContainer: {
    marginRight: spacing.md,
  },
  chevronContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 20,
    height: 20,
  },
  disabled: {
    opacity: 0.5,
  },
});
