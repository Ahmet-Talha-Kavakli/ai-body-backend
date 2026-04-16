import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/api/with-auth'
import { db } from '@/lib/db/client'

export const GET = withAuth(async (_req, { user }) => {
  try {
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)

    const [records, readiness] = await Promise.all([
      db.sleepRecord.findMany({
        where: { userId: user.id, recordedAt: { gte: weekAgo } },
        orderBy: { recordedAt: 'desc' },
      }),
      db.readinessScore.findFirst({
        where: { userId: user.id },
        orderBy: { recordedAt: 'desc' },
      }),
    ])

    const latest = records[0] ?? null
    const avgQuality =
      records.length > 0
        ? Math.round(records.reduce((s, r) => s + r.quality, 0) / records.length)
        : 0
    const avgDurationMin =
      records.length > 0
        ? Math.round(records.reduce((s, r) => s + r.duration, 0) / records.length)
        : 0

    const weekDays = ['Pt', 'Sa', 'Ça', 'Pe', 'Cu', 'Ct', 'Pa']

    return NextResponse.json({
      latest: latest
        ? { duration: latest.duration, quality: latest.quality, recordedAt: latest.recordedAt }
        : null,
      avgQuality,
      avgDurationMin,
      readinessScore: readiness?.score ?? null,
      weeklyRecords: records
        .slice()
        .reverse()
        .map((r) => {
          const d = new Date(r.recordedAt)
          const dow = d.getDay()
          return {
            day: weekDays[dow === 0 ? 6 : dow - 1],
            duration: r.duration,
            quality: r.quality,
            recordedAt: r.recordedAt,
          }
        }),
    })
  } catch (err) {
    console.error('[sleep/dashboard GET]', err)
    return NextResponse.json({ error: 'Failed to fetch sleep data' }, { status: 500 })
  }
})
