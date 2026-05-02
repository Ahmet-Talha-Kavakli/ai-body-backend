import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/api/with-auth'
import { db } from '@/lib/db/client'
import { todayStr } from '../_helpers'

export const GET = withAuth(async (_req, ctx) => {
  try {
    const plan = await db.activeDietPlan.findUnique({
      where: { userId: ctx.user.id },
      include: {
        dayMenus: { where: { date: todayStr() } },
      },
    })
    if (!plan) return NextResponse.json({ plan: null })

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const start = new Date(plan.startedAt)
    start.setHours(0, 0, 0, 0)
    const dayNumber = Math.floor((today.getTime() - start.getTime()) / 86400000) + 1
    const totalDays = plan.durationDays

    return NextResponse.json({
      plan: {
        ...plan,
        progress: {
          dayNumber: Math.min(dayNumber, totalDays),
          totalDays,
          pct: Math.min(100, Math.round((dayNumber / totalDays) * 100)),
        },
      },
    })
  } catch (err) {
    console.error('[diet/active GET]', err)
    return NextResponse.json({ error: 'Failed to fetch active plan' }, { status: 500 })
  }
})
