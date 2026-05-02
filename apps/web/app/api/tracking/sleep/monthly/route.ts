import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/api/with-auth'
import { db } from '@/lib/db/client'

// GET /api/tracking/sleep/monthly?year=2026&month=4
// Belirtilen ayın completed session'larını döner — takvim görünümü için.
export const GET = withAuth(async (req: NextRequest, { user }) => {
  const url = new URL(req.url)
  const year = parseInt(url.searchParams.get('year') ?? String(new Date().getFullYear()), 10)
  const month = parseInt(url.searchParams.get('month') ?? String(new Date().getMonth() + 1), 10)

  const start = new Date(year, month - 1, 1)
  const end = new Date(year, month, 1)

  const sessions = await db.sleepSession.findMany({
    where: {
      userId: user.id,
      status: 'completed',
      endedAt: { gte: start, lt: end },
    },
    orderBy: { endedAt: 'asc' },
    select: {
      id: true,
      startedAt: true,
      endedAt: true,
      totalMinutes: true,
      sleepScore: true,
      deepMinutes: true,
      remMinutes: true,
      lightMinutes: true,
      awakeMinutes: true,
      snoreCount: true,
      dataSource: true,
    },
  })

  return NextResponse.json({ sessions })
})
