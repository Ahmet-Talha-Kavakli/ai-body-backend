import { Platform } from 'react-native';

export const fontFamily = {
  // iOS: SF Pro (system), Android: Roboto Flex (system)
  regular: Platform.select({ ios: 'System', android: 'Roboto', default: 'System' }),
  mono: Platform.select({ ios: 'Courier', android: 'monospace', default: 'monospace' }),
} as const;

export const typeScale = {
  display: { fontSize: 40, lineHeight: 44, fontWeight: '700' as const },
  title1: { fontSize: 34, lineHeight: 41, fontWeight: '700' as const },
  title2: { fontSize: 28, lineHeight: 34, fontWeight: '700' as const },
  title3: { fontSize: 22, lineHeight: 28, fontWeight: '600' as const },
  title4: { fontSize: 20, lineHeight: 25, fontWeight: '600' as const },
  headline: { fontSize: 17, lineHeight: 22, fontWeight: '600' as const },
  body: { fontSize: 17, lineHeight: 22, fontWeight: '400' as const },
  bodyMedium: { fontSize: 17, lineHeight: 22, fontWeight: '500' as const },
  callout: { fontSize: 16, lineHeight: 21, fontWeight: '400' as const },
  subhead: { fontSize: 15, lineHeight: 20, fontWeight: '400' as const },
  footnote: { fontSize: 13, lineHeight: 18, fontWeight: '400' as const },
  caption1: { fontSize: 12, lineHeight: 16, fontWeight: '400' as const },
  caption2: { fontSize: 11, lineHeight: 13, fontWeight: '400' as const },
  mono: { fontSize: 14, lineHeight: 20, fontWeight: '400' as const },
} as const;

export type TypeScaleKey = keyof typeof typeScale;
