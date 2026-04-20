import React from 'react';
import { View, ViewStyle } from 'react-native';
import { DSText } from '../primitives/Text';
import { useTheme } from '../../providers/ThemeProvider';
import { spacing } from '../tokens/spacing';
import { radius } from '../tokens/radius';

type AIMessageProps = {
  message: string;
};

export function AIMessage({ message }: AIMessageProps) {
  const { colors } = useTheme();

  const containerStyle: ViewStyle = {
    padding: spacing[4],
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.ai.glowStart,
    backgroundColor: `${colors.ai.glowStart}11`,
  };

  return (
    <View style={containerStyle}>
      <DSText variant="body">{message}</DSText>
    </View>
  );
}
