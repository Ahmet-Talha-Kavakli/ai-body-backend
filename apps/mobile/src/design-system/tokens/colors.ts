export const colors = {
  // Backgrounds (OLED-optimized dark)
  bg: {
    primary: '#000000',
    canvas: '#08080B',
    surface: '#12121A',
    surfaceElevated: '#1A1A26',
    surfaceHover: '#20202C',
  },

  // Text hierarchy
  text: {
    primary: '#F8FAFC', // 19.7:1 AAA
    secondary: '#CBD5E1', // 14.5:1 AAA
    tertiary: '#94A3B8', // 7.8:1 AAA
    disabled: '#475569', // 4.6:1 AA (disabled only)
  },

  // Borders
  border: {
    subtle: '#0F172A',
    default: '#1E293B',
    strong: '#334155',
    focus: '#2DD4BF',
  },

  // Accent — FitAI brand (Mint/Aqua)
  accent: {
    primary: '#2DD4BF', // teal-400 — main CTA
    primaryBright: '#5EEAD4', // teal-300 — pressed
    primaryDim: '#14B8A6', // teal-500 — gradient end
    muted: '#134E4A', // teal-900 — soft background
  },

  // Semantic
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  info: '#3B82F6',
  recovery: '#8B5CF6',

  // AI signature
  ai: {
    glowStart: '#6366F1',
    glowEnd: '#8B5CF6',
  },

  // Data visualization
  data: {
    readiness: {
      high: '#10B981', // 80+
      mid: '#F59E0B', // 60-79
      low: '#EF4444', // <60
    },
    hrZone: ['#60A5FA', '#34D399', '#FBBF24', '#F97316', '#DC2626'] as string[],
  },

  // Light mode overrides (used by ThemeProvider)
  light: {
    bg: {
      primary: '#FFFFFF',
      canvas: '#F8FAFC',
      surface: '#F1F5F9',
      surfaceElevated: '#E2E8F0',
      surfaceHover: '#CBD5E1',
    },
    text: {
      primary: '#0F172A',
      secondary: '#334155',
      tertiary: '#64748B',
      disabled: '#94A3B8',
    },
    border: {
      subtle: '#E2E8F0',
      default: '#CBD5E1',
      strong: '#94A3B8',
      focus: '#14B8A6',
    },
  },
} as const;

export type Colors = typeof colors;
