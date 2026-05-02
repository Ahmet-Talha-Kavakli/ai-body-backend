import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/api/with-auth'
import { db } from '@/lib/db/client'

export const GET = withAuth(async (req: NextRequest, { user }) => {
  try {
    const { searchParams } = new URL(req.url)
    const year = parseInt(searchParams.get('year') ?? String(new Date().getFullYear()), 10)
    const month = parseInt(searchParams.get('month') ?? String(new Date().getMonth() + 1), 10)

    const monthStart = new Date(Date.UTC(year, month - 1, 1))
    const monthEnd = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999))

    // Fetch user for registration date
    const dbUser = await db.user.findUnique({ where: { id: user.id }, select: { createdAt: true } })
    const userCreatedAt = dbUser?.createdAt ?? monthStart

    // Supplements active at any point during this month
    const supplements = await db.supplement.findMany({
      where: {
        userId: user.id,
        createdAt: { lte: monthEnd },
        OR: [{ isActive: true }, { updatedAt: { gte: monthStart } }],
      },
      include: {
        logs: {
          where: { takenAt: { gte: monthStart, lte: monthEnd } },
          select: { date: true, scheduledTime: true },
        },
      },
    })

    const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate()
    const result: Record<string, { total: number; taken: number }> = {}

    for (let d = 1; d <= daysInMonth; d++) {
      const dayDate = new Date(Date.UTC(year, month - 1, d))
      const dayDateEnd = new Date(Date.UTC(year, month - 1, d, 23, 59, 59, 999))
      const dateStr = dayDate.toISOString().slice(0, 10)

      let total = 0
      let taken = 0

      for (const s of supplements) {
        const wasActive = s.createdAt <= dayDateEnd && (s.isActive || s.updatedAt > dayDateEnd)

        if (!wasActive) continue

        const doses = s.scheduleTimes.length > 0 ? s.scheduleTimes.length : 1
        total += doses

        const dayLogs = s.logs.filter((l) => l.date === dateStr)
        if (s.scheduleTimes.length > 0) {
          const validTaken = dayLogs.filter(
            (l) => l.scheduledTime && s.scheduleTimes.includes(l.scheduledTime)
          )
          taken += Math.min(validTaken.length, s.scheduleTimes.length)
        } else {
          taken += dayLogs.length > 0 ? 1 : 0
        }
      }

      if (total > 0) result[dateStr] = { total, taken }
    }

    return NextResponse.json({ days: result, userCreatedAt: userCreatedAt.toISOString() })
  } catch (error) {
    console.error('[supplements/monthly GET]', error)
    return NextResponse.json({ error: 'Failed to fetch monthly data' }, { status: 500 })
  }
})
