import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/api/with-auth'
import { db } from '@/lib/db/client'
import {
  resolveCalorieTarget,
  calcMacros,
  pickMealForDate,
  mealTotals,
  todayStr,
} from '../../_helpers'
import type { MealPool, MealType } from '../../_helpers'

const MEAL_TYPES: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack']

export const GET = withAuth(async (_req, ctx) => {
  try {
    const url = new URL(_req.url)
    const slug = url.pathname.split('/').filter(Boolean).pop() // /api/diet/presets/[slug]
    if (!slug) return NextResponse.json({ error: 'slug required' }, { status: 400 })

    const preset = await db.dietPreset.findUnique({ where: { slug } })
    if (!preset) return NextResponse.json({ error: 'Preset not found' }, { status: 404 })

    // Kullanıcının kalori hedefini bu preset'e göre hesapla (preview)
    const dailyCalories = await resolveCalorieTarget(preset.calorieFormula, ctx.user.id)
    const macros = calcMacros(dailyCalories, preset.proteinPct, preset.carbsPct, preset.fatPct)

    // Bugünün örnek menüsünü pool'dan üret (preview)
    const pool = preset.mealPool as unknown as MealPool
    const today = todayStr()
    const sampleMenu = MEAL_TYPES.map((mealType) => {
      const meal = pickMealForDate(pool[mealType] ?? [], today, mealType)
      const t = mealTotals(meal)
      return {
        mealType,
        name: meal.name,
        items: meal.items,
        totalCalories: Math.round(t.cal),
        totalProteinG: Math.round(t.p),
        totalCarbsG: Math.round(t.c),
        totalFatG: Math.round(t.f),
      }
    })

    return NextResponse.json({
      preset: {
        id: preset.id,
        slug: preset.slug,
        name: preset.name,
        tagline: preset.tagline,
        description: preset.description,
        heroImageUrl: preset.heroImageUrl,
        thumbnailUrl: preset.thumbnailUrl,
        accentColor: preset.accentColor,
        defaultDurationDays: preset.defaultDurationDays,
        minDurationDays: preset.minDurationDays,
        maxDurationDays: preset.maxDurationDays,
        proteinPct: preset.proteinPct,
        carbsPct: preset.carbsPct,
        fatPct: preset.fatPct,
        evidenceLevel: preset.evidenceLevel,
        recommendedFor: preset.recommendedFor,
        notRecommendedFor: preset.notRecommendedFor,
        rules: preset.rules,
        isPremium: preset.isPremium,
      },
      preview: {
        dailyCalories,
        ...macros,
        sampleMenu,
      },
    })
  } catch (err) {
    console.error('[diet/presets/[slug] GET]', err)
    return NextResponse.json({ error: 'Failed to fetch preset' }, { status: 500 })
  }
})
