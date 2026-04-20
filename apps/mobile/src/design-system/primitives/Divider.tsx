import React from 'react';
import { View, ViewProps } from 'react-native';
import { useTheme } from '../../providers/ThemeProvider';

type DividerProps = ViewProps & {
  orientation?: 'horizontal' | 'vertical';
};

export function Divider({ orientation = 'horizontal', style, ...rest }: DividerProps) {
  const { colors } = useTheme();

  return (
    <View
      style={[
        orientation === 'horizontal'
          ? { height: 1, width: '100%' }
          : { width: 1, alignSelf: 'stretch' as const },
        { backgroundColor: colors.border.default },
        style,
      ]}
      {...rest}
    />
  );
}
