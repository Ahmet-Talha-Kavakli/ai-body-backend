// Design tokens — single source of truth for JS/TS usage
export const colors = {
  brand: {
    primary: '#4F6EFF',
    secondary: '#8B5CF6',
    accent: '#00D4FF',
    energy: '#FFAA00',
    success: '#22C55E',
    danger: '#EF4444',
    warning: '#FFC107',
  },
  dark: {
    bg: '#0D0D1A',
    surface: '#12122A',
    elevated: '#1A1A35',
    card: '#16162E',
  },
} as const

export const gradients = {
  primary: 'linear-gradient(135deg, #4F6EFF 0%, #8B5CF6 100%)',
  energy: 'linear-gradient(135deg, #FFAA00 0%, #EF4444 100%)',
  success: 'linear-gradient(135deg, #22C55E 0%, #00D4FF 100%)',
  dark: 'linear-gradient(135deg, #0D0D1A 0%, #1A0D2E 100%)',
  card: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
} as const

export const nav = {
  height: 72,
  bottomOffset: 16,
  tabs: [
    { id: 'home', label: 'Ev', path: '/dashboard' },
    { id: 'roadmap', label: 'Yol', path: '/dashboard/roadmap' },
    { id: 'sessions', label: 'Seans', path: '/dashboard/sessions' },
    { id: 'tracking', label: 'Takip', path: '/dashboard/tracking' },
    { id: 'pet', label: 'Kedi', path: '/dashboard/pet' },
  ],
} as const

export const animations = {
  easing: {
    bounce: [0.34, 1.56, 0.64, 1],
    smooth: [0.4, 0, 0.2, 1],
    spring: [0.175, 0.885, 0.32, 1.275],
  },
  duration: {
    fast: 0.15,
    normal: 0.3,
    slow: 0.5,
  },
} as const

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
  '3xl': 64,
} as const

export type ColorKey = keyof typeof colors.brand
export type NavTab = (typeof nav.tabs)[number]
