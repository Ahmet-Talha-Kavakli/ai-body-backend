import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/api/with-auth'
import { db } from '@/lib/db/client'

// GET ?year=2026&month=4 → her gün için toplam su + hedef
export const GET = withAuth(async (req: NextRequest, { user }) => {
  try {
    const yearParam = req.nextUrl.searchParams.get('year')
    const monthParam = req.nextUrl.searchParams.get('month')
    const year = yearParam ? parseInt(yearParam) : new Date().getFullYear()
    const month = monthParam ? parseInt(monthParam) : new Date().getMonth() + 1

    if (!year || !month || month < 1 || month > 12) {
      return NextResponse.json({ error: 'Invalid year/month' }, { status: 400 })
    }

    const monthStart = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0))
    const monthEnd = new Date(Date.UTC(year, month, 1, 0, 0, 0))

    const [waterLogs, settings] = await Promise.all([
      db.waterLog.findMany({
        where: {
          userId: user.id,
          date: { gte: monthStart, lt: monthEnd },
        },
        select: { date: true, amountMl: true },
      }),
      db.waterSettings.findUnique({
        where: { userId: user.id },
        select: { dailyGoalMl: true },
      }),
    ])

    const goal = settings?.dailyGoalMl ?? 2500

    const days: Record<string, { total: number; goal: number }> = {}
    for (const log of waterLogs) {
      const d = new Date(log.date)
      const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`
      days[key] = { total: log.amountMl, goal }
    }

    return NextResponse.json({ days })
  } catch (error) {
    console.error('[tracking/water/monthly GET]', error)
    return NextResponse.json({ error: 'Failed to fetch monthly' }, { status: 500 })
  }
})
