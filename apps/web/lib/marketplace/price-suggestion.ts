/**
 * V4.8 Faz E — Akıllı Fiyat Önerisi
 *
 * Karakter DNA + kategori + benzer listing'lerin ortalamasıyla fiyat aralığı önerir.
 * Yaratıcı yarış halinde fiyat şişirmesin diye dengeleyici.
 */

import { db } from '@/lib/db/client'

export interface PriceSuggestion {
  rent7d: { min: number; suggested: number; max: number }
  rent14d: { min: number; suggested: number; max: number }
  rent30d: { min: number; suggested: number; max: number }
  buy: { min: number; suggested: number; max: number }
  reasoning: string
}

interface SuggestArgs {
  category: string
  dnaScore: number | null
}

const CATEGORY_BASELINES: Record<string, { rent7d: number; rent30d: number; buy: number }> = {
  friend: { rent7d: 30, rent30d: 90, buy: 400 },
  mentor: { rent7d: 50, rent30d: 150, buy: 700 },
  romantic: { rent7d: 60, rent30d: 180, buy: 800 },
  family: { rent7d: 35, rent30d: 100, buy: 450 },
  fantasy: { rent7d: 45, rent30d: 130, buy: 600 },
  professional: { rent7d: 55, rent30d: 160, buy: 750 },
}

export async function suggestPrice(args: SuggestArgs): Promise<PriceSuggestion> {
  const baseline = CATEGORY_BASELINES[args.category] ?? CATEGORY_BASELINES.friend

  // DNA çarpanı: 50 = 1.0, 70 = 1.15, 90 = 1.35
  const dna = args.dnaScore ?? 50
  const dnaMultiplier = 0.85 + (dna / 100) * 0.6 // 0.85 - 1.45 arası

  // Aynı kategoride yayında olan listing'lerin ortalama fiyatı
  const similar = await db.marketplaceListing.findMany({
    where: {
      character: { category: args.category as any, publishStatus: 'published', isRetired: false },
      rentEnabled: true,
    },
    select: {
      rentPrice7d: true,
      rentPrice14d: true,
      rentPrice30d: true,
      buyPrice: true,
      totalRentals: true,
    },
    take: 30,
  })

  const avg = (
    key: 'rentPrice7d' | 'rentPrice14d' | 'rentPrice30d' | 'buyPrice'
  ): number | null => {
    const vals = similar.map((l) => l[key]).filter((v): v is number => v != null && v > 0)
    if (vals.length === 0) return null
    return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length)
  }

  const market7d = avg('rentPrice7d')
  const market14d = avg('rentPrice14d')
  const market30d = avg('rentPrice30d')
  const marketBuy = avg('buyPrice')

  // Suggested = baseline * dnaMultiplier ile blend
  const suggested7d = Math.round((market7d ?? baseline.rent7d) * dnaMultiplier)
  const suggested14d = Math.round((market14d ?? baseline.rent7d * 1.6) * dnaMultiplier)
  const suggested30d = Math.round((market30d ?? baseline.rent30d) * dnaMultiplier)
  const suggestedBuy = Math.round((marketBuy ?? baseline.buy) * dnaMultiplier)

  const reasoning =
    similar.length === 0
      ? `Yeni kategori — kategori baseline kullanıldı (DNA ${dna})`
      : `${similar.length} benzer karakter ortalaması + DNA çarpanı ${dnaMultiplier.toFixed(2)}`

  return {
    rent7d: {
      min: Math.round(suggested7d * 0.7),
      suggested: suggested7d,
      max: Math.round(suggested7d * 1.5),
    },
    rent14d: {
      min: Math.round(suggested14d * 0.7),
      suggested: suggested14d,
      max: Math.round(suggested14d * 1.5),
    },
    rent30d: {
      min: Math.round(suggested30d * 0.7),
      suggested: suggested30d,
      max: Math.round(suggested30d * 1.5),
    },
    buy: {
      min: Math.round(suggestedBuy * 0.7),
      suggested: suggestedBuy,
      max: Math.round(suggestedBuy * 2),
    },
    reasoning,
  }
}
