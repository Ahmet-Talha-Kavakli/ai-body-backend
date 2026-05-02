import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/api/with-auth'
import { db } from '@/lib/db/client'

// GET: aktif session + son 7 günün session'ları
export const GET = withAuth(async (_req: NextRequest, { user }) => {
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  const [active, recent] = await Promise.all([
    db.sleepSession.findFirst({
      where: { userId: user.id, status: 'active' },
      include: { musicTrack: true },
    }),
    db.sleepSession.findMany({
      where: {
        userId: user.id,
        status: 'completed',
        startedAt: { gte: sevenDaysAgo },
      },
      orderBy: { startedAt: 'desc' },
      include: { musicTrack: true },
    }),
  ])

  return NextResponse.json({ active, recent })
})

// POST: yeni session başlat (eğer aktif varsa onu döndür)
export const POST = withAuth(async (req: NextRequest, { user }) => {
  const body = (await req.json()) as {
    plannedAlarmAt?: string | null
    smartAlarm?: boolean
    bedtimeBpm?: number | null
    bedtimeHrv?: number | null
    musicTrackId?: string | null
    sleepTimerMin?: number | null
    wearableSynced?: boolean
  }

  const existing = await db.sleepSession.findFirst({
    where: { userId: user.id, status: 'active' },
    include: { musicTrack: true },
  })
  if (existing) return NextResponse.json(existing)

  const session = await db.sleepSession.create({
    data: {
      userId: user.id,
      status: 'active',
      startedAt: new Date(),
      plannedAlarmAt: body.plannedAlarmAt ? new Date(body.plannedAlarmAt) : null,
      smartAlarm: body.smartAlarm ?? true,
      bedtimeBpm: body.bedtimeBpm ?? null,
      bedtimeHrv: body.bedtimeHrv ?? null,
      musicTrackId: body.musicTrackId ?? null,
      sleepTimerMin: body.sleepTimerMin ?? null,
      wearableSynced: body.wearableSynced ?? false,
    },
    include: { musicTrack: true },
  })

  return NextResponse.json(session)
})
