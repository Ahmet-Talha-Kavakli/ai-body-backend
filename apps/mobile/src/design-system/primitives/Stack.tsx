import React from 'react';
import { View, ViewProps } from 'react-native';
import { spacing, SpacingKey } from '../tokens/spacing';

type StackProps = ViewProps & {
  direction?: 'row' | 'column';
  gap?: SpacingKey;
  align?: 'flex-start' | 'center' | 'flex-end' | 'stretch';
  justify?: 'flex-start' | 'center' | 'flex-end' | 'space-between' | 'space-around';
  wrap?: boolean;
};

export function Stack({
  direction = 'column',
  gap,
  align,
  justify,
  wrap,
  style,
  ...rest
}: StackProps) {
  return (
    <View
      style={[
        { flexDirection: direction },
        gap !== undefined && { gap: spacing[gap] },
        align !== undefined && { alignItems: align },
        justify !== undefined && { justifyContent: justify },
        wrap && { flexWrap: 'wrap' },
        style,
      ]}
      {...rest}
    />
  );
}
