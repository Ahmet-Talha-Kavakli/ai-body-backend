/**
 * FitAI Global Design System
 *
 * Tüm feature theme'leri buradan import eder.
 * İki eski tema (SLEEP ve colors.ts) bu dosyada birleşti.
 */

// ─── Sora Font Family ────────────────────────────────────────────────────────
export const font = {
  regular: 'Sora_400Regular',
  medium: 'Sora_500Medium',
  semibold: 'Sora_600SemiBold',
  bold: 'Sora_700Bold',
  extrabold: 'Sora_800ExtraBold',
} as const;

// ─── Ana Renk Paleti ─────────────────────────────────────────────────────────
export const C = {
  // Accent — iOS native mor
  accent: '#5E5CE6',
  accentDark: '#3F3DC4',
  accentWarm: '#7C6FF7',
  accentSoft: '#EEEEFF',
  accentSofter: 'rgba(94,92,230,0.08)',

  // Sayfa & Yüzeyler
  page: '#F8F7FF', // mor'un çok açık tonu — soğuk gri değil
  card: '#FFFFFF',
  surface: '#F2F1FA', // ikincil surface (chip, section bg)
  well: '#ECEAF8', // input bg, track bg

  // Metin Hiyerarşisi
  text: '#1C1C1E',
  textSecondary: '#3C3C43',
  textMuted: '#6B6880',
  textDim: '#A09DB8',

  // Sınırlar
  border: 'rgba(94,92,230,0.12)',
  borderStrong: 'rgba(94,92,230,0.22)',
  hairline: '#E5E3F5',

  // Semantik
  success: '#30D158',
  successBg: 'rgba(48,209,88,0.10)',
  warning: '#FF9F0A',
  warningBg: 'rgba(255,159,10,0.10)',
  danger: '#FF3B30',
  dangerBg: 'rgba(255,59,48,0.10)',
  info: '#0A84FF',
  infoBg: 'rgba(10,132,255,0.10)',

  // Gece modu (uyku ekranı vb.)
  night: '#0A0A1A',
  nightCard: '#1A1A2E',
  nightText: '#F2F2F7',

  // AI imzası
  aiGlow: '#7C6FF7',
  aiBg: 'rgba(124,111,247,0.10)',
} as const;

// ─── Gölge Presets ───────────────────────────────────────────────────────────
export const shadow = {
  card: {
    shadowColor: '#1C1040',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  soft: {
    shadowColor: '#1C1040',
    shadowOpacity: 0.08,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
  accent: {
    shadowColor: '#5E5CE6',
    shadowOpacity: 0.28,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
} as const;

// ─── Animasyon Easing Sabitleri ──────────────────────────────────────────────
export const EASE = {
  spring: [0.16, 1, 0.3, 1] as [number, number, number, number],
  close: [0.4, 0, 1, 1] as [number, number, number, number],
  smooth: [0.22, 1, 0.36, 1] as [number, number, number, number],
  micro: [0.4, 0, 0.2, 1] as [number, number, number, number],
} as const;

// ─── Animasyon Süreleri ──────────────────────────────────────────────────────
export const DUR = {
  micro: { in: 120, out: 100 },
  toggle: { in: 220, out: 180 },
  tab: { in: 260, out: 220 },
  modal: { in: 380, out: 320 },
  sheet: { in: 520, out: 460 },
  progress: 1100,
  counter: 1100,
  skeleton: { in: 300, out: 200 },
} as const;

// ─── API URL ─────────────────────────────────────────────────────────────────
export const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

// ─── Geriye dönük uyumluluk: SLEEP alias ─────────────────────────────────────
// Eski feature dosyaları SLEEP'i hâlâ kullanıyor.
// Yeni kod C kullanmalı; SLEEP yavaş yavaş kaldırılacak.
export const SLEEP = {
  accent: C.accent,
  accentDark: C.accentDark,
  accentSoft: C.accentSoft,
  page: C.page,
  card: C.card,
  text: C.text,
  textMuted: C.textMuted,
  textDim: C.textDim,
  border: C.border,
  success: C.success,
  warn: C.warning,
  danger: C.danger,
  night: C.night,
  nightCard: C.nightCard,
  nightText: C.nightText,
} as const;
