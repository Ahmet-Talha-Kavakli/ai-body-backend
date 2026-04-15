export type SubscriptionTier = 'free' | 'basic' | 'standard' | 'pro'

export const FREE_FEATURES = [
  'water_basic',
  'food_manual',
  'sleep_basic',
  'pet_basic',
  'roadmap_basic',
  'achievements_basic',
  'sessions_general',
] as const

export const PREMIUM_FEATURES = [
  'sessions_all', // Tüm AI seans tipleri
  'food_photo', // Fotoğraf ile yemek analizi
  'food_barcode', // Barkod tarama
  'sleep_advanced', // Uyku analizi
  'pet_cosmetics', // Kedi kozmetikleri
  'pet_minigames', // Mini oyunlar
  'roadmap_all', // Tüm yol haritaları
  'health_wearables', // Akıllı saat entegrasyonu
  'advanced_analytics', // Gelişmiş analitik
  'ai_memory', // AI hafıza sistemi
] as const

export type FreeFeature = (typeof FREE_FEATURES)[number]
export type PremiumFeature = (typeof PREMIUM_FEATURES)[number]
export type Feature = FreeFeature | PremiumFeature

export function hasAccess(tier: SubscriptionTier, feature: Feature): boolean {
  if (FREE_FEATURES.includes(feature as FreeFeature)) return true
  if (tier === 'pro' || tier === 'standard' || tier === 'basic') {
    return PREMIUM_FEATURES.includes(feature as PremiumFeature)
  }
  return false
}

export const PLANS = [
  {
    id: 'free',
    name: 'Ücretsiz',
    price: 0,
    period: 'aylık',
    features: ['Temel takip', 'Genel AI asistan', 'Temel kedi', 'Temel yol haritası'],
    color: 'from-gray-500 to-gray-600',
    cta: 'Mevcut Plan',
  },
  {
    id: 'basic',
    name: 'Temel',
    price: 79,
    period: 'aylık',
    features: [
      'Tüm AI seanslar',
      'Fotoğraf ile yemek analizi',
      'Gelişmiş uyku takibi',
      'Kedi kozmetikleri',
    ],
    color: 'from-indigo-500 to-purple-600',
    cta: 'Başla',
    popular: false,
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 149,
    period: 'aylık',
    features: [
      "Temel'in her şeyi",
      'Akıllı saat entegrasyonu',
      'AI hafıza sistemi',
      'Gelişmiş analitik',
      'Öncelikli destek',
    ],
    color: 'from-amber-500 to-orange-600',
    cta: 'Pro Ol',
    popular: true,
  },
] as const
