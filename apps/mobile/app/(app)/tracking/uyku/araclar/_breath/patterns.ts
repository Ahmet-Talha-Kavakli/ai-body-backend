/**
 * Nefes egzersizi pattern'leri.
 * Her phase saniye cinsinden. inhale → hold1 → exhale → hold2 → loop.
 * 0 → o phase atlanır.
 */

export interface BreathPattern {
  id: string;
  name: string;
  short: string;
  description: string;
  emoji: string;
  inhale: number;
  hold1: number;
  exhale: number;
  hold2: number;
  // Önerilen toplam süre (saniye)
  defaultMin: number;
}

export const BREATH_PATTERNS: BreathPattern[] = [
  {
    id: '478',
    name: '4-7-8',
    short: 'Uykuya dalış için',
    description: '4 sn al, 7 sn tut, 8 sn ver. Parasempatiği aktive eder.',
    emoji: '🌙',
    inhale: 4,
    hold1: 7,
    exhale: 8,
    hold2: 0,
    defaultMin: 5,
  },
  {
    id: 'box',
    name: 'Kutu Nefesi',
    short: 'Odak ve sakinlik',
    description: '4 sn al, 4 sn tut, 4 sn ver, 4 sn bekle. Navy SEAL tekniği.',
    emoji: '⬜',
    inhale: 4,
    hold1: 4,
    exhale: 4,
    hold2: 4,
    defaultMin: 5,
  },
  {
    id: 'resonance',
    name: 'Rezonans',
    short: 'HRV artırma',
    description: '5.5 sn al, 5.5 sn ver. Kalp ile beyin arasında uyum.',
    emoji: '🌊',
    inhale: 5.5,
    hold1: 0,
    exhale: 5.5,
    hold2: 0,
    defaultMin: 6,
  },
  {
    id: 'triangle',
    name: 'Üçgen',
    short: 'Yeni başlayanlar için',
    description: '4 sn al, 4 sn tut, 4 sn ver. Sade ve etkili.',
    emoji: '🔺',
    inhale: 4,
    hold1: 4,
    exhale: 4,
    hold2: 0,
    defaultMin: 4,
  },
  {
    id: 'deep',
    name: 'Derin Nefes',
    short: 'Stres atma',
    description: '6 sn al, 8 sn ver. Vagus siniri uyarıcı.',
    emoji: '🌬️',
    inhale: 6,
    hold1: 0,
    exhale: 8,
    hold2: 0,
    defaultMin: 5,
  },
];

export function getCycleSec(p: BreathPattern): number {
  return p.inhale + p.hold1 + p.exhale + p.hold2;
}

export type BreathPhase = 'inhale' | 'hold1' | 'exhale' | 'hold2';

export function getPhase(
  elapsedInCycle: number,
  p: BreathPattern,
): { phase: BreathPhase; phaseElapsed: number; phaseDuration: number } {
  let t = elapsedInCycle;
  if (t < p.inhale) return { phase: 'inhale', phaseElapsed: t, phaseDuration: p.inhale };
  t -= p.inhale;
  if (t < p.hold1) return { phase: 'hold1', phaseElapsed: t, phaseDuration: p.hold1 };
  t -= p.hold1;
  if (t < p.exhale) return { phase: 'exhale', phaseElapsed: t, phaseDuration: p.exhale };
  t -= p.exhale;
  return { phase: 'hold2', phaseElapsed: t, phaseDuration: p.hold2 };
}

export function getPhaseLabel(phase: BreathPhase): string {
  return (
    {
      inhale: 'Top yukarı çıktığında nefes al',
      hold1: 'Tut',
      exhale: 'Top aşağı indiğinde nefes ver',
      hold2: 'Bekle',
    } as const
  )[phase];
}

export const BREATH_SOUND_INHALE =
  'https://bollxgwrevnwjhnzdwcb.supabase.co/storage/v1/object/public/sleep-sounds/breath_inhale.mp3';
export const BREATH_SOUND_EXHALE =
  'https://bollxgwrevnwjhnzdwcb.supabase.co/storage/v1/object/public/sleep-sounds/breath_exhale.mp3';
export const BREATH_SOUND_BELL =
  'https://bollxgwrevnwjhnzdwcb.supabase.co/storage/v1/object/public/sleep-sounds/breath_bell.mp3';
