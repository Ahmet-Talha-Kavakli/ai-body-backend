export type AchievementTier = 'bronze' | 'silver' | 'gold' | 'platinum'

export interface AchievementDef {
  id: string
  title: string
  description: string
  xp: number
  tier: AchievementTier
  icon: string
  fullScreen: boolean
}

export const ACHIEVEMENTS: Record<string, AchievementDef> = {
  streak_3: {
    id: 'streak_3',
    title: '3 Günlük Seri',
    description: '3 gün üst üste öğün logladın',
    xp: 50,
    tier: 'bronze',
    icon: '🔥',
    fullScreen: false,
  },
  streak_7: {
    id: 'streak_7',
    title: 'Haftalık Seri',
    description: '7 gün üst üste öğün logladın',
    xp: 150,
    tier: 'silver',
    icon: '🔥',
    fullScreen: true,
  },
  streak_30: {
    id: 'streak_30',
    title: '30 Günlük Seri',
    description: '30 gün üst üste öğün logladın',
    xp: 500,
    tier: 'gold',
    icon: '🏆',
    fullScreen: true,
  },
  streak_100: {
    id: 'streak_100',
    title: '100 Günlük Efsane',
    description: '100 gün üst üste öğün logladın',
    xp: 2000,
    tier: 'platinum',
    icon: '💎',
    fullScreen: true,
  },
  calorie_goal_1: {
    id: 'calorie_goal_1',
    title: 'İlk Hedef',
    description: 'İlk kez günlük kalori hedefini tuturdun',
    xp: 30,
    tier: 'bronze',
    icon: '🎯',
    fullScreen: false,
  },
  calorie_goal_7: {
    id: 'calorie_goal_7',
    title: 'Haftalık Disiplin',
    description: '7 gün kalori hedefini tuturdun',
    xp: 200,
    tier: 'silver',
    icon: '🎯',
    fullScreen: true,
  },
  calorie_goal_30: {
    id: 'calorie_goal_30',
    title: 'Aylık Şampiyon',
    description: '30 gün kalori hedefini tuturdun',
    xp: 800,
    tier: 'gold',
    icon: '👑',
    fullScreen: true,
  },
  variety_10: {
    id: 'variety_10',
    title: 'Kaşif',
    description: '10 farklı yemek logladın',
    xp: 75,
    tier: 'bronze',
    icon: '🍽️',
    fullScreen: false,
  },
  variety_50: {
    id: 'variety_50',
    title: 'Gurme',
    description: '50 farklı yemek logladın',
    xp: 300,
    tier: 'silver',
    icon: '🍽️',
    fullScreen: false,
  },
  photo_analysis_1: {
    id: 'photo_analysis_1',
    title: 'İlk Fotoğraf Analizi',
    description: 'AI ile ilk yemek analizini yaptın',
    xp: 40,
    tier: 'bronze',
    icon: '📸',
    fullScreen: false,
  },
  photo_analysis_10: {
    id: 'photo_analysis_10',
    title: 'AI Ustası',
    description: '10 kez yemek fotoğrafı analiz ettin',
    xp: 200,
    tier: 'silver',
    icon: '🤖',
    fullScreen: false,
  },
  first_workout: {
    id: 'first_workout',
    title: 'İlk Adım',
    description: 'İlk antrenman seansını tamamladın',
    xp: 100,
    tier: 'bronze',
    icon: '💪',
    fullScreen: true,
  },
  workout_10: {
    id: 'workout_10',
    title: 'Azimli Sporcu',
    description: '10 antrenman seansı tamamladın',
    xp: 300,
    tier: 'silver',
    icon: '🏋️',
    fullScreen: false,
  },
  workout_50: {
    id: 'workout_50',
    title: 'Demir Kafes',
    description: '50 antrenman seansı tamamladın',
    xp: 1000,
    tier: 'gold',
    icon: '🦁',
    fullScreen: true,
  },
  first_log: {
    id: 'first_log',
    title: 'Hoş Geldin!',
    description: 'İlk öğününü logladın',
    xp: 20,
    tier: 'bronze',
    icon: '🌟',
    fullScreen: false,
  },
  goal_set: {
    id: 'goal_set',
    title: 'Hedef Belirledim',
    description: 'Beslenme hedeflerini ayarladın',
    xp: 25,
    tier: 'bronze',
    icon: '📋',
    fullScreen: false,
  },
  template_created: {
    id: 'template_created',
    title: 'Öğün Şabloncusu',
    description: 'İlk öğün şablonunu oluşturdun',
    xp: 30,
    tier: 'bronze',
    icon: '📝',
    fullScreen: false,
  },
}

// Returns the XP threshold to reach (level + 1)
// e.g. getXpForLevel(1) = XP needed to go from level 1 to level 2
export function getXpForLevel(level: number): number {
  let total = 0
  for (let i = 1; i <= level; i++) {
    total += Math.floor(100 * Math.pow(1.3, i - 1))
  }
  return total
}

export function getLevelFromXp(xp: number): number {
  let level = 1
  while (getXpForLevel(level) <= xp) level++
  return level
}
