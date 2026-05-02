import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/api/with-auth'
import { db } from '@/lib/db/client'
import { resolveCalorieTarget, calcMacros, buildDayMenus, todayStr } from '../_helpers'
import type { MealPool } from '../_helpers'

export const POST = withAuth(async (req, ctx) => {
  try {
    const body = await req.json()
    const userId = ctx.user.id
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    let planData: any

    if (body.presetSlug) {
      const preset = await db.dietPreset.findUnique({ where: { slug: body.presetSlug } })
      if (!preset) return NextResponse.json({ error: 'Preset not found' }, { status: 404 })
      const durationDays = body.durationDays ?? preset.defaultDurationDays
      const dailyCalories = await resolveCalorieTarget(preset.calorieFormula, userId)
      const macros = calcMacros(dailyCalories, preset.proteinPct, preset.carbsPct, preset.fatPct)
      const endsAt = new Date(today)
      endsAt.setDate(endsAt.getDate() + durationDays)

      planData = {
        userId,
        presetId: preset.id,
        name: preset.name,
        accentColor: preset.accentColor,
        heroImageUrl: preset.heroImageUrl,
        startedAt: today,
        durationDays,
        endsAt,
        status: 'active',
        dailyCalories,
        ...macros,
        rules: preset.rules,
        mealPool: preset.mealPool,
        aiGenerated: false,
      }
    } else if (body.aiPlan) {
      const p = body.aiPlan
      const durationDays = body.durationDays ?? 30
      const endsAt = new Date(today)
      endsAt.setDate(endsAt.getDate() + durationDays)
      planData = {
        userId,
        name: p.name,
        accentColor: p.accentColor ?? '#34C759',
        heroImageUrl: p.heroImageUrl ?? null,
        startedAt: today,
        durationDays,
        endsAt,
        status: 'active',
        dailyCalories: p.dailyCalories,
        proteinG: p.proteinG,
        carbsG: p.carbsG,
        fatG: p.fatG,
        rules: p.rules ?? { allowed: [], avoid: [], tips: [] },
        mealPool: p.mealPool,
        aiGenerated: true,
        aiPreferences: p.aiPreferences ?? null,
      }
    } else {
      return NextResponse.json({ error: 'presetSlug or aiPlan required' }, { status: 400 })
    }

    // Save previous nutrition goal snapshot
    const prevGoal = await db.nutritionGoal.findUnique({ where: { userId } }).catch(() => null)

    // Cascade-delete any existing plan (userId @unique enforces tek plan kuralı)
    await db.activeDietPlan.deleteMany({ where: { userId } })

    // Create plan
    const plan = await db.activeDietPlan.create({
      data: {
        ...planData,
        previousGoalSnapshot: prevGoal ?? {},
      },
    })

    // Generate day menus
    const menuRows = buildDayMenus(
      plan.id,
      today,
      planData.durationDays,
      planData.mealPool as MealPool
    )
    await db.dietDayMenu.createMany({ data: menuRows, skipDuplicates: true })

    // Update NutritionGoal
    await db.nutritionGoal.upsert({
      where: { userId },
      update: {
        dailyCalories: planData.dailyCalories,
        proteinG: planData.proteinG,
        carbsG: planData.carbsG,
        fatG: planData.fatG,
      },
      create: {
        userId,
        dailyCalories: planData.dailyCalories,
        proteinG: planData.proteinG,
        carbsG: planData.carbsG,
        fatG: planData.fatG,
      },
    })

    return NextResponse.json({ plan })
  } catch (err) {
    console.error('[diet/start POST]', err)
    return NextResponse.json({ error: 'Failed to start plan' }, { status: 500 })
  }
})
