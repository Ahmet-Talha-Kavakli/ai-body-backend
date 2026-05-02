// Türkçe etiket map'leri — body-command, calendar/history ve diğer
// AI/UI kodları paylaşır. DRY için burada tek noktada tutulur.

export const REGION_TR_MAP: Record<string, string> = {
  head: 'Baş',
  hair: 'Saç',
  neck: 'Boyun',
  trapezius: 'Trapez',
  chest: 'Göğüs',
  deltoids: 'Omuz',
  biceps: 'Biceps',
  triceps: 'Triceps',
  forearm: 'Önkol',
  hands: 'Eller',
  abs: 'Karın',
  obliques: 'Yan karın',
  'upper-back': 'Üst sırt',
  'lower-back': 'Bel',
  gluteal: 'Kalça',
  adductors: 'İç bacak',
  quadriceps: 'Quadriceps',
  hamstring: 'Hamstring',
  knees: 'Diz',
  calves: 'Baldır',
  tibialis: 'Ön baldır',
  ankles: 'Ayak bileği',
  feet: 'Ayaklar',
}

export const MARK_TYPE_TR: Record<string, string> = {
  injury: 'yaralanma',
  pain: 'ağrı',
  scar: 'iz',
  missing: 'eksik',
  surgery: 'ameliyat',
  tightness: 'kas tutulması',
  chronic_region: 'kronik bölge',
}

export const SUB_TYPE_TR: Record<string, string> = {
  smoking: 'sigara',
  alcohol: 'alkol',
  caffeine: 'kafein',
  vape: 'vape',
  chewing_tobacco: 'çiğneme tütünü',
  cannabis: 'esrar',
  other: 'diğer',
}

export const SUB_STATUS_TR: Record<string, string> = {
  active: 'aktif',
  quitting: 'bırakıyor',
  quit: 'bıraktı',
}

export const ILLNESS_TR: Record<string, string> = {
  diarrhea: 'ishal',
  constipation: 'kabızlık',
  migraine: 'migren',
  headache: 'baş ağrısı',
  nausea: 'mide bulantısı',
  fever: 'ateş',
  cough: 'öksürük',
  dizziness: 'baş dönmesi',
  flu: 'üşütme/grip',
  stomachache: 'mide ağrısı',
  back_pain_episode: 'bel ağrısı krizi',
  allergic_reaction: 'alerjik reaksiyon',
  fatigue: 'halsizlik',
  other: 'diğer',
}

export const TRIGGER_TR: Record<string, string> = {
  food: 'yemek',
  stress: 'stres',
  sleep: 'uyku eksikliği',
  weather: 'hava',
  menstruation: 'regl',
  alcohol: 'alkol',
  caffeine: 'kafein',
  medication: 'ilaç',
  exercise: 'egzersiz',
  unknown: 'bilinmiyor',
}

export function trIllnessName(type: string, customName?: string | null): string {
  if (type === 'other' && customName) return customName
  return ILLNESS_TR[type] ?? type
}

export function trRegion(region: string | null | undefined): string {
  if (!region) return ''
  return REGION_TR_MAP[region] ?? region
}

export function trMarkType(type: string): string {
  return MARK_TYPE_TR[type] ?? type
}
