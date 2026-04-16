import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db/client'

export async function GET() {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const user = await db.user.findUnique({ where: { clerkId } })
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const now = new Date()
    const todayStart = new Date(now)
    todayStart.setHours(0, 0, 0, 0)
    const weekStart = new Date(now)
    weekStart.setDate(now.getDate() - 6)
    weekStart.setHours(0, 0, 0, 0)

    const [settings, todayLog, weekLogs, streak] = await Promise.all([
      db.waterSettings.findUnique({ where: { userId: user.id } }),
      db.waterLog.findUnique({
        where: { userId_date: { userId: user.id, date: todayStart } },
      }),
      db.waterLog.findMany({
        where: { userId: user.id, date: { gte: weekStart } },
        orderBy: { date: 'asc' },
      }),
      db.waterStreak.findUnique({ where: { userId: user.id } }),
    ])

    const goalMl = settings?.dailyGoalMl ?? 2500
    const todayMl = todayLog?.amountMl ?? 0

    // Build 7-day weekly data (Mon–Sun labels in Turkish)
    const weekDayLabels = ['Pt', 'Sa', 'Ça', 'Pe', 'Cu', 'Ct', 'Pa']
    const weeklyData = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(weekStart)
      d.setDate(weekStart.getDate() + i)
      const dayKey = new Date(d)
      dayKey.setHours(0, 0, 0, 0)

      const log = weekLogs.find((l) => l.date.toDateString() === dayKey.toDateString())
      const ml = log?.amountMl ?? 0

      const dow = d.getDay() // 0=Sun
      const labelIdx = dow === 0 ? 6 : dow - 1
      return { day: weekDayLabels[labelIdx], ml, goal: goalMl }
    })

    return NextResponse.json({
      todayMl,
      goalMl,
      streak: streak?.currentStreak ?? 0,
      weeklyData,
    })
  } catch (err) {
    console.error('[water/dashboard GET]', err)
    return NextResponse.json({ error: 'Failed to fetch water data' }, { status: 500 })
  }
}
