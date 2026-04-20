// Thin wrapper — specific icon sets added per feature slice.
import React from 'react';
import { Text, TextProps } from 'react-native';
import { useTheme } from '../../providers/ThemeProvider';

type IconProps = TextProps & {
  name: string;
  size?: number;
  color?: string;
};

export function Icon({ name, size = 20, color, style, ...rest }: IconProps) {
  const { colors } = useTheme();
  return (
    <Text
      style={[{ fontSize: size, color: color ?? colors.text.primary }, style]}
      accessibilityElementsHidden
      importantForAccessibility="no"
      {...rest}
    >
      {name}
    </Text>
  );
}
