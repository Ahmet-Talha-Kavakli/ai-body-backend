import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db/client'
import {
  computeGoalHitPercent,
  computeMealTiming,
  computeTopFoods,
  computeStreakCalendar,
} from '@/lib/nutrition/history'

export async function GET() {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const user = await db.user.findUnique({ where: { clerkId } })
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    // NOTE: Must select mealType and items (Json) — existing /api/nutrition/history lacks these
    const [meals, goal] = await Promise.all([
      db.mealLog.findMany({
        where: { userId: user.id, loggedAt: { gte: thirtyDaysAgo } },
        select: {
          loggedAt: true,
          totalCalories: true,
          totalProteinG: true,
          totalCarbsG: true,
          totalFatG: true,
          mealType: true,
          items: true, // Json field — cast as FoodItem[] below
        },
        orderBy: { loggedAt: 'asc' },
      }),
      db.nutritionGoal.findUnique({ where: { userId: user.id } }),
    ])

    // Build daily entries
    const byDate = new Map<
      string,
      { calories: number; protein: number; carbs: number; fat: number }
    >()
    for (const m of meals) {
      const d = m.loggedAt.toISOString().slice(0, 10)
      const existing = byDate.get(d) ?? { calories: 0, protein: 0, carbs: 0, fat: 0 }
      byDate.set(d, {
        calories: existing.calories + m.totalCalories,
        protein: existing.protein + m.totalProteinG,
        carbs: existing.carbs + m.totalCarbsG,
        fat: existing.fat + m.totalFatG,
      })
    }
    const daily = Array.from(byDate.entries()).map(([date, totals]) => ({ date, ...totals }))

    const goalCalories = goal?.dailyCalories ?? 2000
    const mealsForStats = meals.map((m) => ({
      mealType: m.mealType,
      totalCalories: m.totalCalories,
      items: (m.items as Array<{ name: string; calories: number }>) ?? [],
    }))

    return NextResponse.json({
      daily,
      goal,
      goalHitPercent: computeGoalHitPercent(daily, goalCalories),
      topFoods: computeTopFoods(mealsForStats),
      mealTiming: computeMealTiming(mealsForStats),
      streakCalendar: computeStreakCalendar(daily),
    })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
