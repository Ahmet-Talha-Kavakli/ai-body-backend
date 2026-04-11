import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db/client'

export async function GET() {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const user = await db.user.findUnique({ where: { clerkId } })
    if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const now = new Date()
    const todayStart = new Date(now); todayStart.setHours(0, 0, 0, 0)
    const weekStart = new Date(now); weekStart.setDate(now.getDate() - 7)
    const monthStart = new Date(now); monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0)

    // Aylık seans dağılımı (son 6 ay)
    const sixMonthsAgo = new Date(); sixMonthsAgo.setMonth(now.getMonth() - 5); sixMonthsAgo.setDate(1); sixMonthsAgo.setHours(0,0,0,0)

    // Tüm sorgular paralel çalışır
    const [weeklySessions, todayMeals, monthlySessions, totalSessions, nutritionGoal, allRecentSessions] = await Promise.all([
      db.workoutSession.findMany({
        where: { userId: user.id, startedAt: { gte: weekStart }, endedAt: { not: null } },
        orderBy: { startedAt: 'asc' },
      }),
      db.mealLog.findMany({
        where: { userId: user.id, loggedAt: { gte: todayStart } },
      }),
      db.workoutSession.findMany({
        where: { userId: user.id, startedAt: { gte: monthStart }, endedAt: { not: null } },
        orderBy: { startedAt: 'asc' },
      }),
      db.workoutSession.count({
        where: { userId: user.id, endedAt: { not: null } },
      }),
      db.nutritionGoal.findUnique({ where: { userId: user.id } }),
      db.workoutSession.findMany({
        where: { userId: user.id, startedAt: { gte: sixMonthsAgo }, endedAt: { not: null } },
        select: { startedAt: true },
      }),
    ])

    // Haftalık kalori toplamı
    const weeklyCalories = weeklySessions.reduce((s, sess) => s + (sess.caloriesBurned ?? 0), 0)

    // Haftalık aktif süre (dakika)
    const weeklyMinutes = weeklySessions.reduce((s, sess) => s + Math.round((sess.durationSeconds ?? 0) / 60), 0)

    // Bugünkü beslenme toplamı
    const todayCalories = todayMeals.reduce((s, m) => s + m.totalCalories, 0)
    const todayProtein = todayMeals.reduce((s, m) => s + m.totalProteinG, 0)
    const todayCarbs = todayMeals.reduce((s, m) => s + m.totalCarbsG, 0)
    const todayFat = todayMeals.reduce((s, m) => s + m.totalFatG, 0)

    // Aylara göre grupla
    const monthlyMap: Record<string, number> = {}
    allRecentSessions.forEach(s => {
      const key = s.startedAt.toLocaleDateString('tr-TR', { month: 'short' })
      monthlyMap[key] = (monthlyMap[key] ?? 0) + 1
    })

    // Son 7 günün aktivite durumu
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(); d.setDate(now.getDate() - (6 - i)); d.setHours(0,0,0,0)
      const next = new Date(d); next.setDate(d.getDate() + 1)
      const daySession = weeklySessions.find(s => s.startedAt >= d && s.startedAt < next)
      return {
        day: d.toLocaleDateString('tr-TR', { weekday: 'short' }),
        date: d.getDate().toString(),
        done: !!daySession,
        calories: daySession?.caloriesBurned ?? 0,
        isToday: i === 6,
      }
    })

    return NextResponse.json({
      stats: {
        weeklyCalories: Math.round(weeklyCalories),
        weeklyMinutes,
        weeklySessions: weeklySessions.length,
        totalSessions,
      },
      todayNutrition: {
        calories: Math.round(todayCalories),
        protein: Math.round(todayProtein),
        carbs: Math.round(todayCarbs),
        fat: Math.round(todayFat),
        goal: nutritionGoal ?? { dailyCalories: 2200, proteinG: 150, carbsG: 250, fatG: 70 },
      },
      last7Days,
      monthlyActivity: monthlyMap,
    })
  } catch (error) {
    console.error('Stats error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
