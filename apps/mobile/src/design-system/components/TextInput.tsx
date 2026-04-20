import React, { useState } from 'react';
import { TextInput as RNTextInput, TextInputProps, View } from 'react-native';
import { DSText } from '../primitives/Text';
import { useTheme } from '../../providers/ThemeProvider';
import { spacing } from '../tokens/spacing';
import { radius } from '../tokens/radius';

type DSTextInputProps = TextInputProps & {
  label?: string;
  error?: string;
  hint?: string;
};

export function DSTextInput({ label, error, hint, style, ...rest }: DSTextInputProps) {
  const { colors } = useTheme();
  const [focused, setFocused] = useState(false);

  const borderColor = error ? colors.danger : focused ? colors.border.focus : colors.border.default;

  return (
    <View style={{ gap: spacing[2] }}>
      {label && (
        <DSText variant="subhead" color="secondary">
          {label}
        </DSText>
      )}
      <RNTextInput
        style={[
          {
            backgroundColor: colors.bg.surfaceElevated,
            borderWidth: 1,
            borderColor,
            borderRadius: radius.lg,
            paddingHorizontal: spacing[4],
            paddingVertical: spacing[3],
            color: colors.text.primary,
            fontSize: 17,
            minHeight: 44,
          },
          style,
        ]}
        placeholderTextColor={colors.text.tertiary}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        accessibilityLabel={label}
        {...rest}
      />
      {error && (
        <DSText variant="caption1" style={{ color: colors.danger }}>
          {error}
        </DSText>
      )}
      {hint && !error && (
        <DSText variant="caption1" color="tertiary">
          {hint}
        </DSText>
      )}
    </View>
  );
}
