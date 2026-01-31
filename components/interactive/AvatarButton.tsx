/**
 * AvatarButton - Profile avatar button component
 * Used in headers to navigate to profile screen
 */

import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { User } from 'lucide-react-native';
import { colors, spacing } from '@/constants/theme';

interface AvatarButtonProps {
  name?: string;
  onPress: () => void;
  disabled?: boolean;
  testID?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const AvatarButton = ({
  name = 'User',
  onPress,
  disabled = false,
  testID,
  size = 'md',
}: AvatarButtonProps) => {
  const getSize = () => {
    switch (size) {
      case 'sm': return 32;
      case 'lg': return 48;
      default: return 40;
    }
  };

  const getInitials = () => {
    return name
      .split(' ')
      .map(word => word[0]?.toUpperCase())
      .join('')
      .slice(0, 2);
  };

  const avatarSize = getSize();

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
      style={[
        styles.button,
        {
          width: avatarSize,
          height: avatarSize,
          borderRadius: avatarSize / 2,
        },
        disabled && styles.disabled,
      ]}
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel="Ouvrir le profil"
      accessibilityHint="Double-tap to open your profile"
    >
      <View style={styles.avatarContent}>
        {name ? (
          <Text
            style={[
              styles.initials,
              {
                fontSize: avatarSize === 32 ? 12 : avatarSize === 48 ? 18 : 16,
              },
            ]}
          >
            {getInitials()}
          </Text>
        ) : (
          <User
            size={avatarSize === 32 ? 16 : avatarSize === 48 ? 24 : 20}
            color={colors.textInverse}
          />
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    marginRight: spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderWidth: 2,
    borderColor: colors.primaryLight,
  },
  avatarContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  initials: {
    color: colors.textInverse,
    fontWeight: '600',
  },
  disabled: {
    opacity: 0.5,
  },
});
