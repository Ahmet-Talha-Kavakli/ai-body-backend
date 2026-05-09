/**
 * V4.7 J7 — Voice Trend Analyzer (günde 1)
 *
 * Her kullanıcı için son 14 gün VoiceObservation'larını analiz et:
 *   - high_stress sayısı: tone in [stressed, angry, sad, tired] AND intensity ≥ 0.6
 *   - Eşik: ≥5 high_stress olayı → UserVoiceTrend kayıt + flagged=true
 *
 * Mevcut UserVoiceTrend (son 7 gün, flaggedAt!=null) varsa yeni flag açma.
 *
 * Lokal: curl http://localhost:3000/api/cron/voice-trend-analyzer
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'

export const maxDuration = 120

const HIGH_STRESS_TONES = ['stressed', 'angry', 'sad', 'tired']
const STRESS_THRESHOLD = 5

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  if (
    cronSecret &&
    authHeader !== `Bearer ${cronSecret}` &&
    process.env.NODE_ENV === 'production'
  ) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  const now = new Date()
  const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

  // Son 14 gün observation'ları olan kullanıcılar
  const grouped = await db.voiceObservation.groupBy({
    by: ['userId'],
    where: { observedAt: { gte: fourteenDaysAgo } },
    _count: { id: true },
  })

  let scanned = 0
  let flagged = 0
  let skipped = 0

  for (const g of grouped) {
    scanned++

    // Son 7 gün içinde flagged trend varsa skip (anti-spam)
    const recentFlag = await db.userVoiceTrend.findFirst({
      where: {
        userId: g.userId,
        flagged: true,
        windowEnd: { gte: sevenDaysAgo },
      },
      select: { id: true },
    })
    if (recentFlag) {
      skipped++
      continue
    }

    // High stress sayısı
    const observations = await db.voiceObservation.findMany({
      where: {
        userId: g.userId,
        observedAt: { gte: fourteenDaysAgo },
      },
      select: { tone: true, intensity: true },
    })
    const highStress = observations.filter(
      (o) => HIGH_STRESS_TONES.includes(o.tone) && o.intensity >= 0.6
    ).length

    const avgIntensity =
      observations.length > 0
        ? observations.reduce((sum, o) => sum + o.intensity, 0) / observations.length
        : 0

    // Eşik altıysa kayıt at ama flagged=false (gözlem amaçlı)
    const isFlagged = highStress >= STRESS_THRESHOLD

    await db.userVoiceTrend.create({
      data: {
        userId: g.userId,
        windowStart: fourteenDaysAgo,
        windowEnd: now,
        avgIntensity,
        highStressCount: highStress,
        flagged: isFlagged,
      },
    })
    if (isFlagged) flagged++
  }

  return NextResponse.json({
    ok: true,
    scanned,
    flagged,
    skipped,
    timestamp: now.toISOString(),
  })
}
