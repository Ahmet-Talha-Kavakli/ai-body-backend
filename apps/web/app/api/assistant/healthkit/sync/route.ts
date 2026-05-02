/**
 * Mobile HealthKit verisini buraya gönderir (her açılışta + arka plan fetch).
 * Backend "shadow copy" olarak DB'ye yazar — AI tool'lar buradan okur.
 *
 * POST body: { snapshots: Array<{ date: 'YYYY-MM-DD', steps?, heartRateAvg?, ... }> }
 */

import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/api/with-auth'
import { db } from '@/lib/db/client'

interface SnapshotInput {
  date: string
  steps?: number
  activeKcal?: number
  restingKcal?: number
  exerciseMinutes?: number
  standHours?: number
  distanceKm?: number
  flightsClimbed?: number
  heartRateAvg?: number
  heartRateMin?: number
  heartRateMax?: number
  restingHR?: number
  hrvSdnn?: number
  sleepMinutes?: number
  sleepDeepMin?: number
  sleepRemMin?: number
  weightKg?: number
  bodyFatPct?: number
}

export const POST = withAuth(async (req: NextRequest, { user }) => {
  const body = (await req.json()) as { snapshots: SnapshotInput[] }
  if (!Array.isArray(body.snapshots)) {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 })
  }

  let upserted = 0
  for (const s of body.snapshots) {
    const date = new Date(s.date)
    if (isNaN(date.getTime())) continue
    date.setUTCHours(0, 0, 0, 0)

    const data = {
      steps: s.steps ?? null,
      activeKcal: s.activeKcal ?? null,
      restingKcal: s.restingKcal ?? null,
      exerciseMinutes: s.exerciseMinutes ?? null,
      standHours: s.standHours ?? null,
      distanceKm: s.distanceKm ?? null,
      flightsClimbed: s.flightsClimbed ?? null,
      heartRateAvg: s.heartRateAvg ?? null,
      heartRateMin: s.heartRateMin ?? null,
      heartRateMax: s.heartRateMax ?? null,
      restingHR: s.restingHR ?? null,
      hrvSdnn: s.hrvSdnn ?? null,
      sleepMinutes: s.sleepMinutes ?? null,
      sleepDeepMin: s.sleepDeepMin ?? null,
      sleepRemMin: s.sleepRemMin ?? null,
      weightKg: s.weightKg ?? null,
      bodyFatPct: s.bodyFatPct ?? null,
      syncedAt: new Date(),
    }

    await db.healthKitDailySnapshot.upsert({
      where: { userId_date: { userId: user.id, date } },
      create: { userId: user.id, date, ...data },
      update: data,
    })
    upserted++
  }

  return NextResponse.json({ ok: true, upserted })
})
