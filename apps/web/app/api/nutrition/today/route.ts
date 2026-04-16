import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/api/with-auth'
import { db } from '@/lib/db/client'

export const GET = withAuth(async (_req, { user }) => {
  try {
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    const todayEnd = new Date()
    todayEnd.setHours(23, 59, 59, 999)

    const [logs, goal] = await Promise.all([
      db.mealLog.findMany({
        where: { userId: user.id, loggedAt: { gte: todayStart, lte: todayEnd } },
        orderBy: { loggedAt: 'asc' },
      }),
      db.nutritionGoal.findFirst({ where: { userId: user.id } }),
    ])

    const totals = logs.reduce(
      (acc, l) => ({
        calories: acc.calories + l.totalCalories,
        protein: acc.protein + l.totalProteinG,
        carbs: acc.carbs + l.totalCarbsG,
        fat: acc.fat + l.totalFatG,
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    )

    const byMeal: Record<string, typeof logs> = {
      breakfast: [],
      lunch: [],
      dinner: [],
      snack: [],
    }
    logs.forEach((l) => {
      const type = l.mealType as string
      if (byMeal[type]) byMeal[type].push(l)
      else byMeal.snack.push(l)
    })

    return NextResponse.json({
      totals,
      goal: {
        calories: goal?.dailyCalories ?? 2200,
        protein: goal?.proteinG ?? 150,
        carbs: goal?.carbsG ?? 220,
        fat: goal?.fatG ?? 70,
      },
      meals: byMeal,
    })
  } catch (err) {
    console.error('[nutrition/today GET]', err)
    return NextResponse.json({ error: 'Failed to fetch nutrition data' }, { status: 500 })
  }
})
