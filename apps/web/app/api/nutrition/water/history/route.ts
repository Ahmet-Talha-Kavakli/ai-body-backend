import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db/client'

export async function GET(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const user = await db.user.findUnique({ where: { clerkId } })
    if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const { searchParams } = new URL(req.url)
    const period = searchParams.get('period') ?? 'week'
    const now = new Date()
    const from = new Date()
    if (period === 'month') {
      from.setDate(now.getDate() - 30)
    } else {
      from.setDate(now.getDate() - 6)
    }
    from.setHours(0, 0, 0, 0)

    const logs = await db.waterLog.findMany({
      where: { userId: user.id, date: { gte: from } },
      orderBy: { date: 'asc' },
    })

    const settings = await db.waterSettings.findUnique({ where: { userId: user.id } })
    const dailyGoalMl = settings?.dailyGoalMl ?? 2500

    const history = logs.map((log) => ({
      date: log.date.toISOString().split('T')[0],
      amountMl: log.amountMl,
      glasses: log.glasses,
      goalMet: log.amountMl >= dailyGoalMl,
    }))

    return NextResponse.json({ history, dailyGoalMl })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
