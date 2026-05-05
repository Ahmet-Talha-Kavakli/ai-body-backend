/**
 * V4 Faz D — Life Engine Cron
 *
 * Günde 1 kez (sabah 04:00 UTC). Her v4_life_engine flag açık kullanıcı için:
 *   1. runMorningEngineForUser — karakterler için günlük yaşam + olay
 *   2. simulateInterCharacterInteractions — karakterler arası etkileşim
 *   3. runProactiveForUser — proaktif mesaj kuyruğu (kullanıcı saat dilimine göre)
 *
 * V4 plan'da iki kez/gün diyordu — şimdilik 1 kez (Vercel cron limit). Daha
 * sonra Pro plan'a geçince ikiye çıkar.
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { isFlagEnabled } from '@/lib/assistant/feature-flags'
import {
  runMorningEngineForUser,
  simulateInterCharacterInteractions,
} from '@/lib/assistant/life-engine'
import { runProactiveForUser } from '@/lib/assistant/character-proactive'

export const maxDuration = 300

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  const stats = {
    usersChecked: 0,
    livesUpdated: 0,
    eventsTriggered: 0,
    interactionsSimulated: 0,
    proactiveSent: 0,
    errors: 0,
  }

  try {
    const profiles = await db.assistantProfile.findMany({
      where: { onboardingCompleted: true },
      select: { userId: true },
      take: 500,
    })

    for (const p of profiles) {
      try {
        const lifeEnabled = await isFlagEnabled('v4_life_engine', p.userId)
        if (!lifeEnabled) continue
        stats.usersChecked++

        const m = await runMorningEngineForUser(p.userId)
        stats.livesUpdated += m.livesUpdated
        stats.eventsTriggered += m.eventsTriggered
        stats.errors += m.errors

        // %30 olasılık ile karakter-arası simülasyon (her gün değil)
        if (Math.random() < 0.3) {
          const sim = await simulateInterCharacterInteractions(p.userId)
          stats.interactionsSimulated += sim.simulated
        }

        // Proaktif değerlendirme
        const userRow = await db.user.findUnique({
          where: { id: p.userId },
          select: { timezone: true },
        })
        const tz = userRow?.timezone ?? 'Europe/Istanbul'
        const localHour = parseInt(
          new Date().toLocaleString('en-US', {
            timeZone: tz,
            hour: 'numeric',
            hour12: false,
          }),
          10
        )

        const proactive = await runProactiveForUser(p.userId, isNaN(localHour) ? 12 : localHour)
        stats.proactiveSent += proactive.sent
      } catch (e) {
        console.error('[cron life-engine] user fail:', p.userId, e)
        stats.errors++
      }
    }

    return NextResponse.json({ ok: true, ...stats })
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : 'unknown', ...stats },
      { status: 500 }
    )
  }
}
