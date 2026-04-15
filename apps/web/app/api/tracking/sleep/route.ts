import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/api/with-auth'
import { db } from '@/lib/db/client'

// GET: son 7 günlük SleepRecord'ları getir
export const GET = withAuth(async (_req: NextRequest, { user }) => {
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
  sevenDaysAgo.setHours(0, 0, 0, 0)

  const records = await db.sleepRecord.findMany({
    where: {
      userId: user.id,
      recordedAt: { gte: sevenDaysAgo },
    },
    orderBy: { recordedAt: 'desc' },
  })

  return NextResponse.json({ records })
})

// POST: yeni uyku kaydı
// SleepRecord alanları: duration (minutes), quality (0-100), recordedAt
// Body: bedtime (ISO), wakeTime (ISO), quality (1-10)
export const POST = withAuth(async (req: NextRequest, { user }) => {
  const body = (await req.json()) as {
    bedtime: string
    wakeTime: string
    quality: number
  }

  const bedtime = new Date(body.bedtime)
  const wakeTime = new Date(body.wakeTime)

  // duration dakika cinsinden
  const durationMs = wakeTime.getTime() - bedtime.getTime()
  const durationMinutes = Math.max(0, durationMs / 1000 / 60)

  // quality 1-10 → 0-100 scale
  const qualityNormalized = Math.min(100, Math.max(0, (body.quality / 10) * 100))

  const record = await db.sleepRecord.create({
    data: {
      userId: user.id,
      duration: durationMinutes,
      quality: qualityNormalized,
      recordedAt: wakeTime,
    },
  })

  return NextResponse.json(record)
})
