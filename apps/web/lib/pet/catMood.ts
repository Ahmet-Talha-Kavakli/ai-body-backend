export type CatMood = 'happy' | 'energetic' | 'tired' | 'sad' | 'angry' | 'sick'

export interface CatMoodFactors {
  sleepHours?: number // son gecenin uykusu
  waterMl?: number // bugünkü su
  workoutDone?: boolean // bugün antrenman yapıldı mı
  daysAbsent?: number // kaç gündür giriş yok
  hasInjury?: boolean
}

export function calculateMood(factors: CatMoodFactors): CatMood {
  const {
    sleepHours = 7,
    waterMl = 1500,
    workoutDone = false,
    daysAbsent = 0,
    hasInjury = false,
  } = factors

  if (daysAbsent >= 7) return 'angry'
  if (daysAbsent >= 3) return 'sad'
  if (hasInjury) return 'sick'
  if (sleepHours < 5) return 'tired'
  if (workoutDone && sleepHours >= 7 && waterMl >= 2000) return 'energetic'
  if (sleepHours >= 6 && waterMl >= 1500) return 'happy'
  return 'tired'
}

export function getMoodConfig(mood: CatMood) {
  const configs = {
    happy: {
      emoji: '😺',
      label: 'Mutlu',
      color: 'text-amber-400',
      bg: 'from-amber-500 to-orange-500',
      animation: 'bounce' as const,
    },
    energetic: {
      emoji: '😸',
      label: 'Enerjik',
      color: 'text-green-400',
      bg: 'from-green-500 to-emerald-500',
      animation: 'bounce' as const,
    },
    tired: {
      emoji: '😴',
      label: 'Yorgun',
      color: 'text-purple-400',
      bg: 'from-purple-500 to-violet-500',
      animation: 'sway' as const,
    },
    sad: {
      emoji: '😿',
      label: 'Üzgün',
      color: 'text-blue-400',
      bg: 'from-blue-500 to-indigo-500',
      animation: 'droop' as const,
    },
    angry: {
      emoji: '😾',
      label: 'Sinirli',
      color: 'text-red-400',
      bg: 'from-red-500 to-rose-500',
      animation: 'shake' as const,
    },
    sick: {
      emoji: '🤒',
      label: 'Hasta',
      color: 'text-yellow-400',
      bg: 'from-yellow-500 to-amber-500',
      animation: 'sway' as const,
    },
  }
  return configs[mood]
}

export function getReturnMessage(daysAbsent: number, petName: string): string | null {
  if (daysAbsent === 0) return null
  if (daysAbsent >= 7) return `${petName}: "Ohh sonunda!! Bir daha böyle yapma! 😤 (ama özledim)"`
  if (daysAbsent >= 3) return `${petName}: "Neredesin?? Seni bekliyordum... 😿"`
  if (daysAbsent >= 1) return `${petName}: "Ah, geldin nihayet! 🐱"`
  return null
}
