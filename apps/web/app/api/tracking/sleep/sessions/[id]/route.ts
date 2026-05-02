import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/api/with-auth'
import { db } from '@/lib/db/client'

type Ctx = { params: Promise<{ id: string }> }

export const GET = withAuth<Ctx>(async (_req, { user, params }) => {
  const { id } = await params
  const session = await db.sleepSession.findFirst({
    where: { id, userId: user.id },
    include: {
      musicTrack: true,
      events: { orderBy: { timestamp: 'asc' } },
      snippets: { orderBy: { recordedAt: 'asc' } },
    },
  })
  if (!session) return NextResponse.json({ error: 'not_found' }, { status: 404 })
  return NextResponse.json(session)
})

export const PATCH = withAuth<Ctx>(async (req, { user, params }) => {
  const { id } = await params
  const body = (await req.json()) as {
    action?: 'end' | 'cancel'
    endedAt?: string
    actualAlarmAt?: string | null
    wakeBpm?: number | null
    wakeHrv?: number | null
    awakeMinutes?: number
    lightMinutes?: number
    deepMinutes?: number
    remMinutes?: number
    snoreCount?: number
    snoreMinutes?: number
    movementCount?: number
    avgDb?: number | null
    peakDb?: number | null
    notes?: string | null
  }

  const existing = await db.sleepSession.findFirst({
    where: { id, userId: user.id },
  })
  if (!existing) return NextResponse.json({ error: 'not_found' }, { status: 404 })

  const data: Record<string, unknown> = {}

  if (body.action === 'cancel') {
    data.status = 'cancelled'
    data.endedAt = new Date()
  } else if (body.action === 'end' || body.endedAt) {
    const endedAt = body.endedAt ? new Date(body.endedAt) : new Date()
    data.status = 'completed'
    data.endedAt = endedAt
    const totalMin = (endedAt.getTime() - existing.startedAt.getTime()) / 1000 / 60
    data.totalMinutes = totalMin

    // 1. Wearable bağlı mı kontrol et (Apple Watch sleep stages için)
    const wearable = await db.wearable.findFirst({
      where: { userId: user.id, type: 'apple_watch', isConnected: true },
      select: { id: true },
    })

    let awake = body.awakeMinutes ?? 0
    let light = body.lightMinutes ?? 0
    let deep = body.deepMinutes ?? 0
    let rem = body.remMinutes ?? 0

    // 2. Veri kaynağı ve breakdown mantığı
    const movementDerivedSleepMin = light + deep + rem // mobile'dan gelen
    if (wearable) {
      // TODO: HealthKit'ten gerçek sleep stages çekme — wearables endpoint var ama sleep breakdown yok.
      // Şimdilik mobile'ın gönderdiği değerleri kullan ama dataSource'u 'wearable' işaretle.
      data.dataSource = 'wearable'
    } else {
      // Fallback: hareketten elde edilmiş "uyanık + uyku" verisini istatistiksel insan dağılımına böl.
      // Yetişkin dağılımı: REM ~22%, Deep ~20%, Light ~58% (toplam uyku içinde)
      const sleepMin = Math.max(0, totalMin - awake)
      // Eğer mobile zaten breakdown gönderdiyse (light/deep/rem > 0) ama 0/0/0 dahil çoğu durumda mobile light'a sayıyor → istatistiksel re-distribute
      if (movementDerivedSleepMin === 0 || (deep === 0 && rem === 0)) {
        deep = sleepMin * 0.2
        rem = sleepMin * 0.22
        light = sleepMin * 0.58
      }
      data.dataSource = 'estimated'
    }

    data.awakeMinutes = awake
    data.lightMinutes = light
    data.deepMinutes = deep
    data.remMinutes = rem

    // 3. Sleep score (her iki kaynakta da aynı formül)
    const sleepMin = light + deep + rem
    const durationScore = Math.min(1, sleepMin / 420) * 50
    const deepScore = totalMin > 0 ? Math.min(1, deep / (totalMin * 0.2)) * 25 : 0
    const remScore = totalMin > 0 ? Math.min(1, rem / (totalMin * 0.22)) * 15 : 0
    const continuityScore = totalMin > 0 ? Math.max(0, 1 - awake / totalMin) * 10 : 0
    data.sleepScore = Math.round(durationScore + deepScore + remScore + continuityScore)
  }

  for (const [k, v] of Object.entries({
    actualAlarmAt: body.actualAlarmAt ? new Date(body.actualAlarmAt) : undefined,
    wakeBpm: body.wakeBpm,
    wakeHrv: body.wakeHrv,
    snoreCount: body.snoreCount,
    snoreMinutes: body.snoreMinutes,
    movementCount: body.movementCount,
    avgDb: body.avgDb,
    peakDb: body.peakDb,
    notes: body.notes,
  })) {
    if (v !== undefined) data[k] = v
  }

  const updated = await db.sleepSession.update({
    where: { id },
    data,
    include: { musicTrack: true },
  })

  if (data.status === 'completed' && updated.totalMinutes && updated.sleepScore != null) {
    await db.sleepRecord.create({
      data: {
        userId: user.id,
        duration: updated.totalMinutes,
        quality: updated.sleepScore,
        recordedAt: updated.endedAt ?? new Date(),
      },
    })
  }

  return NextResponse.json(updated)
})

export const DELETE = withAuth<Ctx>(async (_req, { user, params }) => {
  const { id } = await params
  const existing = await db.sleepSession.findFirst({
    where: { id, userId: user.id },
  })
  if (!existing) return NextResponse.json({ error: 'not_found' }, { status: 404 })
  await db.sleepSession.delete({ where: { id } })
  return NextResponse.json({ ok: true })
})
