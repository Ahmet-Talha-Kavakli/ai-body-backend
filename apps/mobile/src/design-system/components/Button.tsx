import React from 'react';
import { ActivityIndicator, ViewStyle } from 'react-native';
import { DSPressable } from '../primitives/Pressable';
import { DSText } from '../primitives/Text';
import { useTheme } from '../../providers/ThemeProvider';
import { spacing } from '../tokens/spacing';
import { radius } from '../tokens/radius';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'ai';

type ButtonProps = {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  testID?: string;
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  fullWidth = false,
  testID,
}: ButtonProps) {
  const { colors } = useTheme();

  const bgMap: Record<ButtonVariant, string> = {
    primary: colors.accent.primary,
    secondary: colors.bg.surfaceElevated,
    ghost: 'transparent',
    danger: colors.danger,
    ai: colors.ai.glowStart,
  };

  const textColorMap: Record<ButtonVariant, string> = {
    primary: '#000000',
    secondary: colors.text.primary,
    ghost: colors.accent.primary,
    danger: '#FFFFFF',
    ai: '#FFFFFF',
  };

  const containerStyle: ViewStyle = {
    backgroundColor: disabled ? colors.bg.surfaceHover : bgMap[variant],
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[3],
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: spacing[2],
    opacity: disabled ? 0.5 : 1,
    ...(fullWidth && { width: '100%' }),
    ...(variant === 'ghost' && {
      borderWidth: 1,
      borderColor: colors.accent.primary,
    }),
  };

  return (
    <DSPressable
      onPress={onPress}
      disabled={disabled || loading}
      style={containerStyle}
      haptic="medium"
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: disabled || loading }}
      testID={testID}
    >
      {loading ? (
        <ActivityIndicator
          color={textColorMap[variant]}
          size="small"
          testID={testID ? `${testID}-spinner` : 'btn-spinner'}
        />
      ) : (
        <DSText variant="headline" style={{ color: textColorMap[variant] }}>
          {label}
        </DSText>
      )}
    </DSPressable>
  );
}
