import React from 'react';
import { Text as RNText, TextProps } from 'react-native';
import { useTheme } from '../../providers/ThemeProvider';
import { typeScale, TypeScaleKey } from '../tokens/typography';

type TextColor = 'primary' | 'secondary' | 'tertiary' | 'disabled';

type DSTextProps = TextProps & {
  variant?: TypeScaleKey;
  color?: TextColor;
  children: React.ReactNode;
};

export function DSText({ variant = 'body', color = 'primary', style, ...rest }: DSTextProps) {
  const { colors } = useTheme();
  const scale = typeScale[variant];

  return (
    <RNText
      style={[
        {
          fontSize: scale.fontSize,
          lineHeight: scale.lineHeight,
          fontWeight: scale.fontWeight,
          color: colors.text[color],
        },
        style,
      ]}
      allowFontScaling
      maxFontSizeMultiplier={2}
      {...rest}
    />
  );
}
