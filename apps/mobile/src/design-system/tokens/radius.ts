export const radius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20, // iOS 17 sheet standard
  '2xl': 24,
  full: 9999,
} as const;

export type RadiusKey = keyof typeof radius;
