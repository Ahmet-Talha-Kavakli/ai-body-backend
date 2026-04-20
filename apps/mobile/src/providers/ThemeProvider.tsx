import React, { createContext, useContext, useState } from 'react';
import { useColorScheme } from 'react-native';
import { colors } from '../design-system/tokens/colors';

type ThemeMode = 'dark' | 'light' | 'system';

type ColorGroup = Record<string, string>;

type ThemeColors = {
  bg: ColorGroup;
  text: ColorGroup;
  border: ColorGroup;
  accent: ColorGroup;
  success: string;
  warning: string;
  danger: string;
  info: string;
  recovery: string;
  ai: ColorGroup;
};

type ThemeContextValue = {
  mode: ThemeMode;
  isDark: boolean;
  colors: ThemeColors;
  setMode: (mode: ThemeMode) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function buildThemeColors(isDark: boolean): ThemeColors {
  if (isDark) {
    return {
      bg: colors.bg,
      text: colors.text,
      border: colors.border,
      accent: colors.accent,
      success: colors.success,
      warning: colors.warning,
      danger: colors.danger,
      info: colors.info,
      recovery: colors.recovery,
      ai: colors.ai,
    };
  }
  return {
    bg: colors.light.bg,
    text: colors.light.text,
    border: colors.light.border,
    accent: colors.accent,
    success: colors.success,
    warning: colors.warning,
    danger: colors.danger,
    info: colors.info,
    recovery: colors.recovery,
    ai: colors.ai,
  };
}

type Props = {
  children: React.ReactNode;
  defaultMode?: ThemeMode;
};

export function ThemeProvider({ children, defaultMode = 'system' }: Props) {
  const systemScheme = useColorScheme();
  const [mode, setMode] = useState<ThemeMode>(defaultMode);

  const isDark = mode === 'dark' || (mode === 'system' && systemScheme === 'dark');

  const value: ThemeContextValue = {
    mode,
    isDark,
    colors: buildThemeColors(isDark),
    setMode,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
