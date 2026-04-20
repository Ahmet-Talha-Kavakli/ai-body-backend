import React from 'react';
import { View, ViewProps } from 'react-native';
import { useTheme } from '../../providers/ThemeProvider';
import { spacing, SpacingKey } from '../tokens/spacing';
import { radius, RadiusKey } from '../tokens/radius';

type BoxProps = ViewProps & {
  p?: SpacingKey;
  px?: SpacingKey;
  py?: SpacingKey;
  m?: SpacingKey;
  rounded?: RadiusKey;
  bg?: 'primary' | 'canvas' | 'surface' | 'surfaceElevated';
};

export function Box({ p, px, py, m, rounded, bg, style, ...rest }: BoxProps) {
  const { colors } = useTheme();

  const bgColor = bg ? colors.bg[bg] : undefined;

  return (
    <View
      style={[
        p !== undefined && { padding: spacing[p] },
        px !== undefined && { paddingHorizontal: spacing[px] },
        py !== undefined && { paddingVertical: spacing[py] },
        m !== undefined && { margin: spacing[m] },
        rounded !== undefined && { borderRadius: radius[rounded] },
        bgColor !== undefined && { backgroundColor: bgColor },
        style,
      ]}
      {...rest}
    />
  );
}
