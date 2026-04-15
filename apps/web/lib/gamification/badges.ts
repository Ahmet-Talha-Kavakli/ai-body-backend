export interface Badge {
  id: string
  name: string
  description: string
  emoji: string
  category: 'fitness' | 'nutrition' | 'health' | 'streak' | 'special'
  xpReward: number
  condition: string
}

export const BADGES: Badge[] = [
  {
    id: 'first_workout',
    name: 'İlk Adım',
    description: 'İlk antrenmanını tamamladın',
    emoji: '🎯',
    category: 'fitness',
    xpReward: 100,
    condition: '1 antrenman',
  },
  {
    id: 'workout_10',
    name: 'Azmettiniz!',
    description: '10 antrenman tamamladın',
    emoji: '💪',
    category: 'fitness',
    xpReward: 200,
    condition: '10 antrenman',
  },
  {
    id: 'workout_50',
    name: 'Demir Disiplin',
    description: '50 antrenman tamamladın',
    emoji: '🏆',
    category: 'fitness',
    xpReward: 500,
    condition: '50 antrenman',
  },
  {
    id: 'streak_7',
    name: 'Haftanın Savunucusu',
    description: '7 gün üst üste aktif oldun',
    emoji: '🔥',
    category: 'streak',
    xpReward: 150,
    condition: '7 günlük seri',
  },
  {
    id: 'streak_30',
    name: 'Aylık Şampiyon',
    description: '30 gün üst üste aktif oldun',
    emoji: '⚡',
    category: 'streak',
    xpReward: 500,
    condition: '30 günlük seri',
  },
  {
    id: 'water_week',
    name: 'Su Perisi',
    description: 'Bir hafta boyunca su hedefini tuttun',
    emoji: '💧',
    category: 'health',
    xpReward: 100,
    condition: '7 gün su hedefi',
  },
  {
    id: 'sleep_week',
    name: 'Uyku Ustası',
    description: 'Bir hafta 7+ saat uyudun',
    emoji: '😴',
    category: 'health',
    xpReward: 100,
    condition: '7 gün uyku hedefi',
  },
  {
    id: 'session_ai',
    name: 'AI Yoldaşı',
    description: 'İlk AI seansını tamamladın',
    emoji: '🤖',
    category: 'special',
    xpReward: 75,
    condition: '1 AI seans',
  },
  {
    id: 'meal_log_7',
    name: 'Beslenme Takipçisi',
    description: '7 gün yemek takibi yaptın',
    emoji: '🥗',
    category: 'nutrition',
    xpReward: 100,
    condition: '7 gün yemek kaydı',
  },
  {
    id: 'roadmap_complete',
    name: 'Yol Tamamlayıcı',
    description: 'İlk yol haritasını bitirdin',
    emoji: '🗺️',
    category: 'special',
    xpReward: 300,
    condition: 'Tüm haftalık görevler',
  },
  {
    id: 'first_pet',
    name: 'Evcil Hayvan Sahibi',
    description: 'Kedini sahiplendin',
    emoji: '🐱',
    category: 'special',
    xpReward: 50,
    condition: 'Kedi oluştur',
  },
  {
    id: 'level_5',
    name: 'Seviye 5',
    description: "Seviye 5'e ulaştın",
    emoji: '🌟',
    category: 'special',
    xpReward: 200,
    condition: 'Seviye 5',
  },
]

export function getBadge(id: string): Badge | undefined {
  return BADGES.find((b) => b.id === id)
}
