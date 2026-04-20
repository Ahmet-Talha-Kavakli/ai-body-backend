import React from 'react';
import { View } from 'react-native';
import { DSText } from '../primitives/Text';
import { spacing } from '../tokens/spacing';

type StreakIndicatorProps = {
  days: number;
};

export function StreakIndicator({ days }: StreakIndicatorProps) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[2] }}>
      <DSText style={{ fontSize: 24 }}>🔥</DSText>
      <DSText variant="title3">{String(days)}</DSText>
    </View>
  );
}
