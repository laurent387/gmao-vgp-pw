import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';
import { colors, spacing, borderRadius } from '@/constants/theme';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
  fullWidth?: boolean;
  testID?: string;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  icon,
  style,
  textStyle,
  fullWidth = false,
  testID,
}: ButtonProps) {
  const getBackgroundColor = () => {
    if (disabled) return colors.border;
    switch (variant) {
      case 'primary': return colors.primary;
      case 'secondary': return colors.secondary;
      case 'danger': return colors.danger;
      case 'outline':
      case 'ghost': return 'transparent';
      default: return colors.primary;
    }
  };

  const getTextColor = () => {
    if (disabled) return colors.textMuted;
    switch (variant) {
      case 'primary':
      case 'secondary':
      case 'danger': return colors.textInverse;
      case 'outline': return colors.primary;
      case 'ghost': return colors.text;
      default: return colors.textInverse;
    }
  };

  const getPadding = () => {
    switch (size) {
      case 'sm': return { paddingVertical: spacing.sm, paddingHorizontal: spacing.md };
      case 'lg': return { paddingVertical: spacing.lg, paddingHorizontal: spacing.xxl };
      default: return { paddingVertical: spacing.md, paddingHorizontal: spacing.xl };
    }
  };

  const getFontSize = () => {
    switch (size) {
      case 'sm': return 13;
      case 'lg': return 17;
      default: return 15;
    }
  };

  return (
    <TouchableOpacity
      testID={testID}
      style={[
        styles.button,
        { backgroundColor: getBackgroundColor() },
        getPadding(),
        variant === 'outline' && styles.outline,
        fullWidth && styles.fullWidth,
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator color={getTextColor()} size="small" />
      ) : (
        <>
          {icon}
          <Text style={[
            styles.text,
            { color: getTextColor(), fontSize: getFontSize() },
            icon && styles.textWithIcon,
            textStyle,
          ]}>
            {title}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
}

interface IconButtonProps {
  icon: React.ReactNode;
  onPress: () => void;
  variant?: 'default' | 'primary' | 'danger';
  size?: number;
  disabled?: boolean;
}

export function IconButton({ icon, onPress, variant = 'default', size = 40, disabled = false }: IconButtonProps) {
  const getBgColor = () => {
    if (disabled) return colors.surfaceAlt;
    switch (variant) {
      case 'primary': return colors.primary + '15';
      case 'danger': return colors.danger + '15';
      default: return colors.surfaceAlt;
    }
  };

  return (
    <TouchableOpacity
      style={[styles.iconButton, { width: size, height: size, backgroundColor: getBgColor() }]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
    >
      {icon}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.md,
  },
  outline: {
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  fullWidth: {
    width: '100%',
  },
  text: {
    fontWeight: '600' as const,
  },
  textWithIcon: {
    marginLeft: spacing.sm,
  },
  iconButton: {
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
