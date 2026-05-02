/**
 * V3 Faz A — Daily Mood Rotation Cron
 *
 * Sabah 06:00 (UTC) çalışır.
 * Her aktif kullanıcının AI'sı için baseline mood hesaplanır ve uygulanır.
 *
 * Vercel Cron: vercel.json'da /api/cron/mood-rotation günlük tetiklenir
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { computeMorningMood, applyMood } from '@/lib/assistant/mood-engine'

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  const stats = {
    usersProcessed: 0,
    moodChanges: 0,
    errors: 0,
    moodDistribution: { calm: 0, energetic: 0, thoughtful: 0, tired: 0 } as Record<string, number>,
  }

  try {
    // Aktif AssistantProfile'lar
    const profiles = await db.assistantProfile.findMany({
      where: {
        onboardingCompleted: true,
      },
      select: { userId: true, currentMood: true },
    })

    for (const p of profiles) {
      try {
        const result = await computeMorningMood(p.userId)
        await applyMood(p.userId, result)

        stats.usersProcessed++
        stats.moodDistribution[result.mood] = (stats.moodDistribution[result.mood] ?? 0) + 1
        if (result.mood !== p.currentMood) stats.moodChanges++
      } catch (e) {
        console.error(`[mood-rotation] user=${p.userId}`, e)
        stats.errors++
      }
    }

    return NextResponse.json({ success: true, stats })
  } catch (e) {
    console.error('[mood-rotation]', e)
    return NextResponse.json(
      { success: false, error: e instanceof Error ? e.message : 'unknown', stats },
      { status: 500 }
    )
  }
}
