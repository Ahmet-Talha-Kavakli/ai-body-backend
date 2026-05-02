import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/api/with-auth'
import { db } from '@/lib/db/client'
import { checkRateLimit } from '@/lib/nutrition/rate-limit'

const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack'] as const
type MealType = (typeof MEAL_TYPES)[number]

const MICRO_KEYS = [
  'vitA',
  'vitC',
  'vitD',
  'vitE',
  'vitK',
  'b1',
  'b2',
  'b3',
  'b6',
  'b9',
  'b12',
  'Ca',
  'Fe',
  'Mg',
  'P',
  'K',
  'Zn',
  'Se',
  'Cu',
  'Mn',
] as const

type MealItem = {
  foodId?: string
  customFoodId?: string
  recipeId?: string
  // External source references — otomatik kişisel kütüphane için
  offCode?: string
  usdaFdcId?: string
  fatSecretFoodId?: string
  name: string
  brand?: string
  photoUrl?: string
  servingSize: number
  servingUnit: string
  quantity: number // kullanıcının yediği miktar (örn. 1.5 porsiyon)
  calories: number
  proteinG: number
  carbsG: number
  fatG: number
  fiberG?: number
  sugarG?: number
  addedSugarG?: number
  saturatedFatG?: number
  monounsaturatedFatG?: number
  polyunsaturatedFatG?: number
  transFatG?: number
  cholesterolMg?: number
  sodiumMg?: number
  saltMg?: number
  alcoholG?: number
  micros?: Partial<Record<(typeof MICRO_KEYS)[number], number>>
  source?: 'fatsecret' | 'custom' | 'recipe' | 'ai' | 'quick' | 'barcode' | 'off' | 'usda'
  confidence?: number // ai için
}

function sumItems(items: MealItem[]) {
  const totals = {
    calories: 0,
    proteinG: 0,
    carbsG: 0,
    fatG: 0,
    fiberG: 0,
    sugarG: 0,
    addedSugarG: 0,
    satFatG: 0,
    monoFatG: 0,
    polyFatG: 0,
    transFatG: 0,
    cholesterolMg: 0,
    sodiumMg: 0,
    saltMg: 0,
    alcoholG: 0,
    micros: Object.fromEntries(MICRO_KEYS.map((k) => [k, 0])) as Record<
      (typeof MICRO_KEYS)[number],
      number
    >,
  }

  for (const it of items) {
    const q = Number(it.quantity) || 1
    totals.calories += (Number(it.calories) || 0) * q
    totals.proteinG += (Number(it.proteinG) || 0) * q
    totals.carbsG += (Number(it.carbsG) || 0) * q
    totals.fatG += (Number(it.fatG) || 0) * q
    totals.fiberG += (Number(it.fiberG) || 0) * q
    totals.sugarG += (Number(it.sugarG) || 0) * q
    totals.addedSugarG += (Number(it.addedSugarG) || 0) * q
    totals.satFatG += (Number(it.saturatedFatG) || 0) * q
    totals.monoFatG += (Number(it.monounsaturatedFatG) || 0) * q
    totals.polyFatG += (Number(it.polyunsaturatedFatG) || 0) * q
    totals.transFatG += (Number(it.transFatG) || 0) * q
    totals.cholesterolMg += (Number(it.cholesterolMg) || 0) * q
    totals.sodiumMg += (Number(it.sodiumMg) || 0) * q
    totals.saltMg += (Number(it.saltMg) || 0) * q
    totals.alcoholG += (Number(it.alcoholG) || 0) * q

    if (it.micros) {
      for (const k of MICRO_KEYS) {
        totals.micros[k] += (Number(it.micros[k]) || 0) * q
      }
    }
  }

  return totals
}

/**
 * GET /api/nutrition/meals?date=YYYY-MM-DD
 * Belirli bir günün öğünlerini döndürür.
 */
export const GET = withAuth(async (req, { user }) => {
  try {
    const url = new URL(req.url)
    const dateParam = url.searchParams.get('date')
    const day = dateParam ? new Date(dateParam) : new Date()
    if (isNaN(day.getTime())) {
      return NextResponse.json({ error: 'Invalid date' }, { status: 400 })
    }
    const start = new Date(day)
    start.setHours(0, 0, 0, 0)
    const end = new Date(day)
    end.setHours(23, 59, 59, 999)

    const meals = await db.mealLog.findMany({
      where: { userId: user.id, loggedAt: { gte: start, lte: end } },
      orderBy: { loggedAt: 'asc' },
      include: { analysis: true },
    })

    return NextResponse.json({ meals })
  } catch (err) {
    console.error('[meals GET]', err)
    return NextResponse.json({ error: 'Failed to fetch meals' }, { status: 500 })
  }
})

/**
 * POST /api/nutrition/meals
 * Yeni öğün loglar. Toplam makro + sub-makro + mikro otomatik hesaplanır.
 *
 * Body: {
 *   mealType: 'breakfast'|'lunch'|'dinner'|'snack',
 *   items: MealItem[],
 *   loggedAt?: ISO string,
 *   notes?: string,
 *   photoUrl?: string,
 *   source?: 'manual'|'ai_photo'|'barcode'|'quick_add'|'template'|'smart_suggest'
 * }
 */
export const POST = withAuth(async (req, { user }) => {
  try {
    const rateKey = `meal_log:${user.id}:${new Date().toDateString()}`
    if (!checkRateLimit(rateKey, 100, 24 * 60 * 60 * 1000)) {
      return NextResponse.json({ error: 'Günlük loglama limitine ulaşıldı.' }, { status: 429 })
    }

    const body = await req.json()
    const { mealType, items, loggedAt, notes, photoUrl, source = 'manual' } = body

    if (!MEAL_TYPES.includes(mealType)) {
      return NextResponse.json({ error: 'Geçersiz öğün tipi' }, { status: 400 })
    }
    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'En az bir yemek gerekli' }, { status: 400 })
    }

    console.log('[meals POST] received items:', JSON.stringify(items).slice(0, 800))
    const t = sumItems(items as MealItem[])
    console.log(
      '[meals POST] computed totals:',
      JSON.stringify({
        fiberG: t.fiberG,
        sugarG: t.sugarG,
        satFatG: t.satFatG,
        sodiumMg: t.sodiumMg,
      })
    )

    const meal = await db.mealLog.create({
      data: {
        userId: user.id,
        mealType,
        items: items as any,
        loggedAt: loggedAt ? new Date(loggedAt) : new Date(),
        notes: notes ?? null,
        photoUrl: photoUrl ?? null,
        aiAnalyzed: source === 'ai_photo',
        source,
        totalCalories: t.calories,
        totalProteinG: t.proteinG,
        totalCarbsG: t.carbsG,
        totalFatG: t.fatG,
        totalFiberG: t.fiberG,
        totalSugarG: t.sugarG,
        totalAddedSugarG: t.addedSugarG,
        totalSatFatG: t.satFatG,
        totalMonoFatG: t.monoFatG,
        totalPolyFatG: t.polyFatG,
        totalTransFatG: t.transFatG,
        totalCholesterolMg: t.cholesterolMg,
        totalSodiumMg: t.sodiumMg,
        totalSaltMg: t.saltMg,
        totalAlcoholG: t.alcoholG,
        totalMicros: t.micros,
      },
    })

    // Use count'ları artır (custom food, recipe, template)
    const customIds = items.map((i: MealItem) => i.customFoodId).filter(Boolean) as string[]
    const recipeIds = items.map((i: MealItem) => i.recipeId).filter(Boolean) as string[]
    if (customIds.length) {
      await db.customFood.updateMany({
        where: { id: { in: customIds }, userId: user.id },
        data: { useCount: { increment: 1 }, lastUsedAt: new Date() },
      })
    }
    if (recipeIds.length) {
      await db.recipe.updateMany({
        where: { id: { in: recipeIds }, userId: user.id },
        data: { useCount: { increment: 1 }, lastUsedAt: new Date() },
      })
    }

    // Otomatik kişisel kütüphane: external source'lu yemekleri CustomFood'a upsert
    // (kullanıcı bir sonraki sefer "Sık kullanılan"da görsün)
    const externalItems = (items as MealItem[]).filter(
      (i) => i.offCode || i.usdaFdcId || i.fatSecretFoodId
    )
    for (const it of externalItems) {
      try {
        const where: any = { userId: user.id }
        if (it.offCode) where.offCode = it.offCode
        else if (it.usdaFdcId) where.usdaFdcId = it.usdaFdcId
        else if (it.fatSecretFoodId) where.fatSecretFoodId = it.fatSecretFoodId

        const existing = await db.customFood.findFirst({ where })

        const data: any = {
          name: it.name,
          brand: it.brand ?? null,
          photoUrl: it.photoUrl ?? null,
          servingSize: it.servingSize,
          servingUnit: it.servingUnit,
          calories: it.calories,
          proteinG: it.proteinG,
          carbsG: it.carbsG,
          fatG: it.fatG,
          fiberG: it.fiberG ?? 0,
          sugarG: it.sugarG ?? 0,
          saturatedFatG: it.saturatedFatG ?? 0,
          transFatG: it.transFatG ?? 0,
          cholesterolMg: it.cholesterolMg ?? 0,
          sodiumMg: it.sodiumMg ?? 0,
        }

        if (existing) {
          await db.customFood.update({
            where: { id: existing.id },
            data: { useCount: { increment: 1 }, lastUsedAt: new Date() },
          })
        } else {
          await db.customFood.create({
            data: {
              ...data,
              userId: user.id,
              offCode: it.offCode ?? null,
              usdaFdcId: it.usdaFdcId ?? null,
              fatSecretFoodId: it.fatSecretFoodId ?? null,
              useCount: 1,
              lastUsedAt: new Date(),
            },
          })
        }
      } catch (e) {
        console.warn('[meals auto-library]', (e as Error).message)
      }
    }

    return NextResponse.json({ meal }, { status: 201 })
  } catch (err) {
    console.error('[meals POST]', err)
    return NextResponse.json(
      { error: 'Failed to create meal', details: err instanceof Error ? err.message : 'unknown' },
      { status: 500 }
    )
  }
})
