import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/api/with-auth'
import { db } from '@/lib/db/client'

// GET /api/tracking/sleep/export?range=7|30|90|all
// CSV satırı döner. Mobile sharing için.
export const GET = withAuth(async (req: NextRequest, { user }) => {
  const url = new URL(req.url)
  const range = url.searchParams.get('range') ?? '30'

  const where: { userId: string; status: string; startedAt?: { gte: Date } } = {
    userId: user.id,
    status: 'completed',
  }

  if (range !== 'all') {
    const days = parseInt(range, 10) || 30
    const since = new Date()
    since.setDate(since.getDate() - days)
    where.startedAt = { gte: since }
  }

  const sessions = await db.sleepSession.findMany({
    where,
    orderBy: { startedAt: 'asc' },
    select: {
      startedAt: true,
      endedAt: true,
      totalMinutes: true,
      sleepScore: true,
      awakeMinutes: true,
      lightMinutes: true,
      deepMinutes: true,
      remMinutes: true,
      snoreCount: true,
      snoreMinutes: true,
      movementCount: true,
      bedtimeBpm: true,
      wakeBpm: true,
      bedtimeHrv: true,
      wakeHrv: true,
      avgDb: true,
      peakDb: true,
    },
  })

  const headers = [
    'date',
    'bedtime',
    'wakeTime',
    'totalMinutes',
    'sleepScore',
    'awakeMin',
    'lightMin',
    'deepMin',
    'remMin',
    'snoreCount',
    'snoreMin',
    'movementCount',
    'bedtimeBpm',
    'wakeBpm',
    'bedtimeHrv',
    'wakeHrv',
    'avgDb',
    'peakDb',
  ]
  const rows = sessions.map((s) =>
    [
      s.endedAt?.toISOString().slice(0, 10) ?? '',
      s.startedAt.toISOString(),
      s.endedAt?.toISOString() ?? '',
      s.totalMinutes ?? '',
      s.sleepScore ?? '',
      s.awakeMinutes,
      s.lightMinutes,
      s.deepMinutes,
      s.remMinutes,
      s.snoreCount,
      s.snoreMinutes,
      s.movementCount,
      s.bedtimeBpm ?? '',
      s.wakeBpm ?? '',
      s.bedtimeHrv ?? '',
      s.wakeHrv ?? '',
      s.avgDb ?? '',
      s.peakDb ?? '',
    ].join(',')
  )

  const csv = [headers.join(','), ...rows].join('\n')

  return new NextResponse(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="uyku-${range}.csv"`,
    },
  })
})
