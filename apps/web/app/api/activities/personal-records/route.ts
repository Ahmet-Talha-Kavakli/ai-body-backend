import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/api/with-auth'
import { db } from '@/lib/db/client'

export const GET = withAuth(async (req: NextRequest, { user }) => {
  try {
    const { searchParams } = new URL(req.url)
    const activityType = searchParams.get('activityType')

    if (!activityType) {
      return NextResponse.json({ error: 'activityType is required' }, { status: 400 })
    }

    const logs = await db.activityLog.findMany({
      where: { userId: user.id, activityType },
      select: { duration: true, calories: true, date: true },
      orderBy: { date: 'desc' },
    })

    if (logs.length === 0) {
      return NextResponse.json({
        longestDuration: 0,
        mostCalories: 0,
        thisMonthCount: 0,
        totalCount: 0,
        lastDone: null,
        avgDuration: 0,
      })
    }

    const now = new Date()
    const thisMonthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

    const longestDuration = Math.max(...logs.map((l) => l.duration))
    const mostCalories = Math.max(
      ...logs.filter((l) => l.calories != null).map((l) => l.calories as number),
      0
    )
    const thisMonthCount = logs.filter((l) => l.date.startsWith(thisMonthPrefix)).length
    const totalCount = logs.length
    const lastDone = logs[0].date
    const avgDuration = Math.round(logs.reduce((sum, l) => sum + l.duration, 0) / logs.length)

    return NextResponse.json({
      longestDuration,
      mostCalories,
      thisMonthCount,
      totalCount,
      lastDone,
      avgDuration,
    })
  } catch (error) {
    console.error('[personal-records GET]', error)
    return NextResponse.json({ error: 'Failed to fetch personal records' }, { status: 500 })
  }
})
