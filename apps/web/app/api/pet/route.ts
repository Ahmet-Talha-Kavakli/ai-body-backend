import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/api/with-auth'
import { db } from '@/lib/db/client'
import { calculateMood } from '@/lib/pet/catMood'

// GET — kedi durumu
export const GET = withAuth(async (_req: NextRequest, { user }) => {
  let pet = await db.pet.findUnique({ where: { userId: user.id } })

  if (!pet) {
    // Yeni kullanıcı için kedi oluştur
    pet = await db.pet.create({
      data: { userId: user.id, name: 'Pamuk' },
    })
  }

  // Kullanıcı verilerinden mood hesapla
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const [todayWater, lastSleep, todayWorkout] = await Promise.all([
    db.waterLog.aggregate({
      _sum: { amountMl: true },
      where: { userId: user.id, loggedAt: { gte: today } },
    }),
    db.sleepRecord.findFirst({
      where: { userId: user.id },
      orderBy: { recordedAt: 'desc' },
    }),
    db.workoutSession.findFirst({
      where: { userId: user.id, startedAt: { gte: today } },
    }),
  ])

  const daysAbsent = Math.floor((Date.now() - pet.lastSeenAt.getTime()) / (1000 * 60 * 60 * 24))

  const mood = calculateMood({
    sleepHours: lastSleep?.duration ? lastSleep.duration / 60 : undefined,
    waterMl: todayWater._sum.amountMl ?? 0,
    workoutDone: !!todayWorkout,
    daysAbsent,
    hasInjury: pet.hasInjury,
  })

  // lastSeenAt güncelle
  await db.pet.update({ where: { id: pet.id }, data: { lastSeenAt: new Date(), mood } })

  return NextResponse.json({ ...pet, mood, daysAbsent })
})
