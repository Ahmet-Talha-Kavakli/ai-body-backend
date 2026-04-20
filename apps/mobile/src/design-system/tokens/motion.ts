// Reanimated spring configs
export const spring = {
  snappy: { damping: 22, stiffness: 400, mass: 1 }, // button press
  smooth: { damping: 20, stiffness: 180, mass: 1 }, // screen transition
  gentle: { damping: 18, stiffness: 120, mass: 1 }, // sheet, large element
  bouncy: { damping: 12, stiffness: 200, mass: 1 }, // PR, achievement
  soft: { damping: 30, stiffness: 100, mass: 1 }, // slow reveal
} as const;

// Duration (non-spring, ms)
export const duration = {
  instant: 100,
  fast: 200,
  normal: 300,
  slow: 500,
  slower: 800,
} as const;

// Bezier easing
export const easing = {
  ios: [0.25, 0.1, 0.25, 1] as [number, number, number, number],
  emphasize: [0.2, 0, 0, 1] as [number, number, number, number],
  accelerate: [0.4, 0, 1, 1] as [number, number, number, number],
} as const;

export type SpringKey = keyof typeof spring;
