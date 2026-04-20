import React from 'react';
import { Switch as RNSwitch, SwitchProps } from 'react-native';
import { useTheme } from '../../providers/ThemeProvider';

export function DSSwitch({ ...rest }: SwitchProps) {
  const { colors } = useTheme();
  return (
    <RNSwitch
      trackColor={{ false: colors.border.strong, true: colors.accent.muted }}
      thumbColor={rest.value ? colors.accent.primary : colors.text.tertiary}
      ios_backgroundColor={colors.border.strong}
      {...rest}
    />
  );
}
