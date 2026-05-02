/**
 * Mobile HealthKit workout'larını backend WorkoutShadow'a sync eder.
 */

import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/api/with-auth'
import { db } from '@/lib/db/client'

interface WorkoutInput {
  externalId: string
  workoutType: string
  startDate: string
  endDate: string
  durationMin: number
  totalEnergyKcal?: number | null
  totalDistanceM?: number | null
}

export const POST = withAuth(async (req: NextRequest, { user }) => {
  const body = (await req.json()) as { workouts: WorkoutInput[] }
  if (!Array.isArray(body.workouts)) {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 })
  }

  for (const w of body.workouts) {
    const start = new Date(w.startDate)
    const end = new Date(w.endDate)
    if (isNaN(start.getTime()) || isNaN(end.getTime())) continue
    await db.workoutShadow.upsert({
      where: { userId_externalId: { userId: user.id, externalId: w.externalId } },
      create: {
        userId: user.id,
        externalId: w.externalId,
        workoutType: w.workoutType,
        startDate: start,
        endDate: end,
        durationMin: Math.round(w.durationMin),
        totalEnergyKcal: w.totalEnergyKcal ?? null,
        totalDistanceM: w.totalDistanceM ?? null,
      },
      update: {
        workoutType: w.workoutType,
        startDate: start,
        endDate: end,
        durationMin: Math.round(w.durationMin),
        totalEnergyKcal: w.totalEnergyKcal ?? null,
        totalDistanceM: w.totalDistanceM ?? null,
        syncedAt: new Date(),
      },
    })
  }

  return NextResponse.json({ ok: true, synced: body.workouts.length })
})
