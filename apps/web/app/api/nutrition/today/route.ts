import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/api/with-auth'
import { db } from '@/lib/db/client'

export const GET = withAuth(async (req, { user }) => {
  try {
    const url = new URL(req.url)
    const dateParam = url.searchParams.get('date')

    const day = dateParam ? new Date(dateParam) : new Date()
    if (isNaN(day.getTime())) {
      return NextResponse.json({ error: 'Invalid date' }, { status: 400 })
    }
    const dayStart = new Date(day)
    dayStart.setHours(0, 0, 0, 0)
    const dayEnd = new Date(day)
    dayEnd.setHours(23, 59, 59, 999)

    const [logs, goal] = await Promise.all([
      db.mealLog.findMany({
        where: { userId: user.id, loggedAt: { gte: dayStart, lte: dayEnd } },
        orderBy: { loggedAt: 'asc' },
      }),
      db.nutritionGoal.findUnique({ where: { userId: user.id } }),
    ])

    const zeroMicros = {
      vitA: 0,
      vitC: 0,
      vitD: 0,
      vitE: 0,
      vitK: 0,
      b1: 0,
      b2: 0,
      b3: 0,
      b6: 0,
      b9: 0,
      b12: 0,
      Ca: 0,
      Fe: 0,
      Mg: 0,
      P: 0,
      K: 0,
      Zn: 0,
      Se: 0,
      Cu: 0,
      Mn: 0,
    }

    const totals = logs.reduce(
      (acc, l) => {
        const m = (l.totalMicros as Record<string, number> | null) ?? {}
        return {
          calories: acc.calories + l.totalCalories,
          protein: acc.protein + l.totalProteinG,
          carbs: acc.carbs + l.totalCarbsG,
          fat: acc.fat + l.totalFatG,
          fiber: acc.fiber + l.totalFiberG,
          sugar: acc.sugar + l.totalSugarG,
          addedSugar: acc.addedSugar + l.totalAddedSugarG,
          satFat: acc.satFat + l.totalSatFatG,
          monoFat: acc.monoFat + l.totalMonoFatG,
          polyFat: acc.polyFat + l.totalPolyFatG,
          transFat: acc.transFat + l.totalTransFatG,
          cholesterol: acc.cholesterol + l.totalCholesterolMg,
          sodium: acc.sodium + l.totalSodiumMg,
          salt: acc.salt + l.totalSaltMg,
          alcohol: acc.alcohol + l.totalAlcoholG,
          micros: Object.fromEntries(
            Object.keys(zeroMicros).map((k) => [k, (acc.micros as any)[k] + (Number(m[k]) || 0)])
          ) as typeof zeroMicros,
        }
      },
      {
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
        fiber: 0,
        sugar: 0,
        addedSugar: 0,
        satFat: 0,
        monoFat: 0,
        polyFat: 0,
        transFat: 0,
        cholesterol: 0,
        sodium: 0,
        salt: 0,
        alcohol: 0,
        micros: { ...zeroMicros },
      }
    )

    const byMeal: Record<'breakfast' | 'lunch' | 'dinner' | 'snack', typeof logs> = {
      breakfast: [],
      lunch: [],
      dinner: [],
      snack: [],
    }
    for (const l of logs) {
      const t = l.mealType as keyof typeof byMeal
      if (byMeal[t]) byMeal[t].push(l)
      else byMeal.snack.push(l)
    }

    const mealTotals = Object.fromEntries(
      Object.entries(byMeal).map(([key, list]) => [
        key,
        {
          calories: list.reduce((s, l) => s + l.totalCalories, 0),
          protein: list.reduce((s, l) => s + l.totalProteinG, 0),
          carbs: list.reduce((s, l) => s + l.totalCarbsG, 0),
          fat: list.reduce((s, l) => s + l.totalFatG, 0),
          itemCount: list.reduce(
            (s, l) => s + (Array.isArray(l.items) ? (l.items as any[]).length : 0),
            0
          ),
        },
      ])
    )

    return NextResponse.json({
      date: dayStart.toISOString().split('T')[0],
      totals,
      goal: goal
        ? {
            calories: goal.dailyCalories,
            protein: goal.proteinG,
            carbs: goal.carbsG,
            fat: goal.fatG,
            fiber: goal.fiberG,
            sugar: goal.sugarG,
            addedSugar: goal.addedSugarG,
            satFat: goal.saturatedFatG,
            transFat: goal.transFatG,
            cholesterol: goal.cholesterolMg,
            sodium: goal.sodiumMg,
            salt: goal.saltMg,
            alcohol: goal.alcoholG,
            macroSplit: goal.macroSplit,
            goalType: goal.goalType,
          }
        : null,
      meals: byMeal,
      mealTotals,
    })
  } catch (err) {
    console.error('[nutrition/today GET]', err)
    return NextResponse.json({ error: 'Failed to fetch nutrition data' }, { status: 500 })
  }
})
