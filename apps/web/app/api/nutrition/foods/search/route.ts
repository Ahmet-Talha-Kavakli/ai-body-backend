import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/api/with-auth'
import { db } from '@/lib/db/client'
import { searchFatSecretFoods, normalizeFatSecretFood } from '@/lib/nutrition/fatsecret'
import { searchOpenFoodFacts } from '@/lib/nutrition/off-db'
import { searchUsdaFoods } from '@/lib/nutrition/usda-search'
import { checkRateLimit } from '@/lib/nutrition/rate-limit'

/**
 * GET /api/nutrition/foods/search?q=tavuk&tab=frequent|recent|favorites|all
 *
 * Tek arama endpoint'i — Yazio paterni:
 * - frequent: kullanıcının useCount'a göre sık yedikleri (custom + recipe + meal templates)
 * - recent: son 30 gün loglarından gelen unique yemekler
 * - favorites: long-press ile favorilediği yemekler
 * - all (default): q varsa FatSecret + custom + recipe + cached FoodItem hepsini döndür
 */
export const GET = withAuth(async (req, { user }) => {
  try {
    const url = new URL(req.url)
    const q = url.searchParams.get('q')?.trim() ?? ''
    const tab = (url.searchParams.get('tab') ?? 'all') as
      | 'frequent'
      | 'recent'
      | 'favorites'
      | 'all'

    // ── FREQUENT TAB ──────────────────────
    if (tab === 'frequent') {
      const [customs, recipes, templates] = await Promise.all([
        db.customFood.findMany({
          where: { userId: user.id },
          orderBy: [{ useCount: 'desc' }, { lastUsedAt: 'desc' }],
          take: 30,
        }),
        db.recipe.findMany({
          where: { userId: user.id },
          orderBy: [{ useCount: 'desc' }, { lastUsedAt: 'desc' }],
          take: 20,
        }),
        db.mealTemplate.findMany({
          where: { userId: user.id },
          orderBy: [{ useCount: 'desc' }, { createdAt: 'desc' }],
          take: 10,
        }),
      ])
      return NextResponse.json({
        tab,
        results: {
          foods: customs,
          recipes,
          meals: templates,
        },
      })
    }

    // ── RECENT TAB ────────────────────────
    if (tab === 'recent') {
      const since = new Date()
      since.setDate(since.getDate() - 30)
      const meals = await db.mealLog.findMany({
        where: { userId: user.id, loggedAt: { gte: since } },
        orderBy: { loggedAt: 'desc' },
        take: 50,
      })
      // unique items by name (newest first)
      const seen = new Set<string>()
      const items: any[] = []
      for (const m of meals) {
        for (const it of (m.items as any[]) ?? []) {
          const key = `${it.name}|${it.brand ?? ''}|${it.foodId ?? ''}|${it.customFoodId ?? ''}|${it.recipeId ?? ''}`
          if (!seen.has(key)) {
            seen.add(key)
            items.push({ ...it, lastLoggedAt: m.loggedAt })
            if (items.length >= 30) break
          }
        }
        if (items.length >= 30) break
      }
      return NextResponse.json({ tab, results: items })
    }

    // ── FAVORITES TAB ─────────────────────
    if (tab === 'favorites') {
      const favs = await db.favoriteFood.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
      })
      return NextResponse.json({ tab, results: favs })
    }

    // ── ALL (search) ──────────────────────
    if (!q || q.length < 2) {
      // Boş arama: Yazio gibi default frequent + recent göster
      const [customs, recents] = await Promise.all([
        db.customFood.findMany({
          where: { userId: user.id },
          orderBy: [{ useCount: 'desc' }],
          take: 15,
        }),
        db.mealLog.findMany({
          where: { userId: user.id },
          orderBy: { loggedAt: 'desc' },
          take: 5,
        }),
      ])
      return NextResponse.json({
        tab: 'all',
        query: q,
        results: {
          custom: customs,
          recent: recents,
          fatsecret: [],
        },
      })
    }

    if (q.length > 100) {
      return NextResponse.json({ error: 'Query too long' }, { status: 400 })
    }

    const rateKey = `food_search:${user.id}`
    if (!checkRateLimit(rateKey, 100, 60 * 1000)) {
      return NextResponse.json({ error: 'Çok fazla arama yapıldı, biraz bekle.' }, { status: 429 })
    }

    // Paralel: FatSecret + OpenFoodFacts + USDA + kullanıcı custom + cached
    const qLower = q.toLowerCase()
    const [fatSecretResult, offResult, usdaResult, customs, cached] = await Promise.all([
      searchFatSecretFoods(q).catch((e) => {
        console.warn('[foods/search FatSecret]', e?.message)
        return [] as any[]
      }),
      searchOpenFoodFacts(q, 10).catch((e) => {
        console.warn('[foods/search OFF]', e?.message)
        return []
      }),
      searchUsdaFoods(q, 10).catch((e) => {
        console.warn('[foods/search USDA]', e?.message)
        return []
      }),
      db.customFood.findMany({
        where: {
          userId: user.id,
          OR: [
            { name: { contains: q, mode: 'insensitive' } },
            { brand: { contains: q, mode: 'insensitive' } },
          ],
        },
        orderBy: { useCount: 'desc' },
        take: 10,
      }),
      db.foodItem.findMany({
        where: {
          OR: [
            { name: { contains: q, mode: 'insensitive' } },
            { nametr: { contains: q, mode: 'insensitive' } },
          ],
        },
        take: 10,
      }),
    ])

    const fatSecretNormalized = (fatSecretResult ?? [])
      .slice(0, 15)
      .map((f) => {
        try {
          return normalizeFatSecretFood(f)
        } catch {
          return null
        }
      })
      .filter(Boolean) as any[]

    // Top 5'i DB'ye cache'le
    Promise.all(
      fatSecretNormalized.slice(0, 5).map((item) =>
        db.foodItem
          .upsert({
            where: { fatSecretId: item.fatSecretId },
            update: { updatedAt: new Date() },
            create: item,
          })
          .catch(() => null)
      )
    ).catch(() => null)

    return NextResponse.json({
      tab: 'all',
      query: q,
      results: {
        custom: customs,
        cached,
        fatsecret: fatSecretNormalized,
        openfoodfacts: offResult,
        usda: usdaResult,
      },
    })
  } catch (err) {
    console.error('[foods/search]', err)
    return NextResponse.json({ error: 'Arama başarısız' }, { status: 500 })
  }
})
