import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ViewProps } from 'react-native';
import { useTheme } from '../../providers/ThemeProvider';

type SafeAreaWrapperProps = ViewProps & {
  children: React.ReactNode;
};

export function SafeAreaWrapper({ style, children, ...rest }: SafeAreaWrapperProps) {
  const { colors } = useTheme();

  return (
    <SafeAreaView style={[{ flex: 1, backgroundColor: colors.bg.primary }, style]} {...rest}>
      {children}
    </SafeAreaView>
  );
}
