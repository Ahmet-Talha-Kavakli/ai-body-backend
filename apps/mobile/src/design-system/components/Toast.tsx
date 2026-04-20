// Visual component only — ToastProvider manages state (M4)
import React from 'react';
import { View, ViewStyle } from 'react-native';
import { DSText } from '../primitives/Text';
import { useTheme } from '../../providers/ThemeProvider';
import { spacing } from '../tokens/spacing';
import { radius } from '../tokens/radius';

type ToastVariant = 'success' | 'error' | 'info' | 'warning';

type ToastProps = {
  message: string;
  variant?: ToastVariant;
};

export function Toast({ message, variant = 'info' }: ToastProps) {
  const { colors } = useTheme();

  const bgMap: Record<ToastVariant, string> = {
    success: `${colors.success}EE`,
    error: `${colors.danger}EE`,
    info: `${colors.bg.surfaceElevated}EE`,
    warning: `${colors.warning}EE`,
  };

  const style: ViewStyle = {
    backgroundColor: bgMap[variant],
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[3],
    borderRadius: radius.lg,
    maxWidth: '90%',
  };

  return (
    <View style={style} accessibilityLiveRegion="polite">
      <DSText variant="subhead">{message}</DSText>
    </View>
  );
}
