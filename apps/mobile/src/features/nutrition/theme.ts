/**
 * Nutrition feature — light theme (Yazio + Apple iOS Fitness benzeri).
 *
 * Sayfa arka planı açık gri (#F2F2F7), kartlar saf beyaz (#FFFFFF) + yumuşak gölge.
 * Bu sayede kartlar "yüzer" — Yazio'daki his.
 */

/**
 * Sora font weight family map. Yazio benzeri kullanım:
 *  - 400: regular text
 *  - 500: secondary
 *  - 600: medium emphasis
 *  - 700: bold (titles)
 *  - 800: extrabold (hero numbers, big titles)
 */
export const font = {
  regular: 'Sora_400Regular',
  medium: 'Sora_500Medium',
  semibold: 'Sora_600SemiBold',
  bold: 'Sora_700Bold',
  extrabold: 'Sora_800ExtraBold',
};

export const palette = {
  bg: {
    page: '#F2F2F7', // ana scroll BG (Apple iOS sistem gri)
    pageAlt: '#F8F8FA',
    card: '#FFFFFF', // kartlar
    cardAlt: '#FAFAFC', // ikincil yüzey (chip, pill, divider area)
    well: '#EFEFF4', // input, well, track BG
  },

  text: {
    primary: '#0E1014', // koyu lacivert/siyah
    secondary: '#3C3C43', // .text.secondary iOS
    tertiary: '#8E8E93', // .text.tertiary iOS
    quaternary: '#C7C7CC',
    onAccent: '#FFFFFF',
  },

  border: {
    hairline: '#E5E5EA', // iOS hairline
    soft: '#F2F2F7',
    strong: '#D1D1D6',
  },

  accent: {
    primary: '#14B8A6', // teal-500
    primaryBright: '#2DD4BF',
    primaryDim: '#0D9488',
    soft: 'rgba(20, 184, 166, 0.12)',
    softer: 'rgba(20, 184, 166, 0.06)',
  },

  // Macro renkleri (bar + ring)
  macro: {
    protein: '#EC4899',
    proteinBg: 'rgba(236, 72, 153, 0.10)',
    carbs: '#F59E0B',
    carbsBg: 'rgba(245, 158, 11, 0.10)',
    fat: '#8B5CF6',
    fatBg: 'rgba(139, 92, 246, 0.10)',
  },

  semantic: {
    success: '#34C759',
    warning: '#FF9500',
    danger: '#FF3B30',
    info: '#0A84FF',
  },

  // Kalori ring renkleri (yenen oranına göre)
  ring: {
    low: '#FF3B30',
    mid: '#FF9500',
    high: '#34C759',
    over: '#FF3B30',
    track: '#F2F2F7', // boş kısmın rengi (kart üzerinde fark edilebilir)
  },

  ai: {
    fg: '#7C3AED',
    bg: 'rgba(124, 58, 237, 0.10)',
  },

  // Gölge — kartlar için (iOS-style yumuşak, alttan)
  shadow: {
    card: {
      shadowColor: '#0F172A',
      shadowOpacity: 0.04,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 4 },
      elevation: 2,
    },
    soft: {
      shadowColor: '#0F172A',
      shadowOpacity: 0.06,
      shadowRadius: 20,
      shadowOffset: { width: 0, height: 8 },
      elevation: 3,
    },
  },
};

export const N = palette;
