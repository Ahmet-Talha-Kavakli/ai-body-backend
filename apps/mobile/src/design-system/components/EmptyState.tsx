import React from 'react';
import { View } from 'react-native';
import { DSText } from '../primitives/Text';
import { spacing } from '../tokens/spacing';

type EmptyStateProps = {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
};

export function EmptyState({ title, subtitle, action }: EmptyStateProps) {
  return (
    <View style={{ alignItems: 'center', padding: spacing[8], gap: spacing[3] }}>
      <DSText variant="title3" color="primary">
        {title}
      </DSText>
      {subtitle && (
        <DSText variant="body" color="secondary">
          {subtitle}
        </DSText>
      )}
      {action}
    </View>
  );
}
