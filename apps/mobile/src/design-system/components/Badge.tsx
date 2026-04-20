import React from 'react';
import { View } from 'react-native';
import { DSText } from '../primitives/Text';
import { useTheme } from '../../providers/ThemeProvider';
import { spacing } from '../tokens/spacing';
import { radius } from '../tokens/radius';

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'accent';

type BadgeProps = {
  label: string;
  variant?: BadgeVariant;
};

export function Badge({ label, variant = 'default' }: BadgeProps) {
  const { colors } = useTheme();

  const bgMap: Record<BadgeVariant, string> = {
    default: colors.bg.surfaceElevated,
    success: `${colors.success}22`,
    warning: `${colors.warning}22`,
    danger: `${colors.danger}22`,
    accent: `${colors.accent.primary}22`,
  };

  const textMap: Record<BadgeVariant, string> = {
    default: colors.text.secondary,
    success: colors.success,
    warning: colors.warning,
    danger: colors.danger,
    accent: colors.accent.primary,
  };

  return (
    <View
      style={{
        backgroundColor: bgMap[variant],
        paddingHorizontal: spacing[3],
        paddingVertical: spacing[1],
        borderRadius: radius.full,
        alignSelf: 'flex-start',
      }}
    >
      <DSText variant="caption1" style={{ color: textMap[variant] }}>
        {label}
      </DSText>
    </View>
  );
}
