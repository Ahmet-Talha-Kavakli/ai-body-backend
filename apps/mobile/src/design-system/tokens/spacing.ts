export const spacing = {
  0: 0,
  1: 2,
  2: 4,
  3: 8,
  4: 12,
  5: 16, // most common (card padding)
  6: 20,
  7: 24,
  8: 32,
  9: 40,
  10: 48,
  11: 64,
} as const;

export type SpacingKey = keyof typeof spacing;
