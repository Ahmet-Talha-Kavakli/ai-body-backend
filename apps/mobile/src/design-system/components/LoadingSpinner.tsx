import React from 'react';
import { ActivityIndicator, View, ViewProps } from 'react-native';
import { useTheme } from '../../providers/ThemeProvider';

type LoadingSpinnerProps = ViewProps & {
  size?: 'small' | 'large';
};

export function LoadingSpinner({ size = 'large', testID, style }: LoadingSpinnerProps) {
  const { colors } = useTheme();
  return (
    <View style={[{ alignItems: 'center', justifyContent: 'center' }, style]} testID={testID}>
      <ActivityIndicator color={colors.accent.primary} size={size} />
    </View>
  );
}
