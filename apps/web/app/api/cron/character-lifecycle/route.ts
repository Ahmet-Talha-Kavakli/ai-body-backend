/**
 * V4 Faz C — Character Lifecycle Cron
 *
 * Günlük çalışır. 3 iş yapar:
 *   1. Yeni karakter spawn değerlendirmesi (eligible kullanıcılar için)
 *   2. İnaktif ilişkileri cold/silent'a düşür
 *   3. Aktif ilişkilerin accumulationDays'ini +1 artır
 *
 * Sadece v4_characters flag'i AÇIK kullanıcılar için.
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { isFlagEnabled } from '@/lib/assistant/feature-flags'
import { evaluateAndSpawnNextCharacter } from '@/lib/assistant/character-spawn'
import {
  decayInactiveRelationships,
  incrementAccumulationDays,
} from '@/lib/assistant/character-relationship'

export const maxDuration = 300

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  const stats = {
    usersChecked: 0,
    charactersSpawned: 0,
    decayed: 0,
    accumulated: 0,
    errors: 0,
  }

  try {
    // 1) Decay + accumulation — global, tüm aktif ilişkiler
    try {
      const d = await decayInactiveRelationships()
      stats.decayed = d.updated
    } catch (e) {
      console.error('[character-lifecycle] decay fail:', e)
      stats.errors++
    }

    try {
      const a = await incrementAccumulationDays()
      stats.accumulated = a.updated
    } catch (e) {
      console.error('[character-lifecycle] accumulation fail:', e)
      stats.errors++
    }

    // 2) Spawn değerlendirmesi — sadece v4_characters flag'i açık kullanıcılar
    const profiles = await db.assistantProfile.findMany({
      where: { onboardingCompleted: true },
      select: { userId: true },
      take: 500,
    })

    for (const p of profiles) {
      try {
        const enabled = await isFlagEnabled('v4_characters', p.userId)
        if (!enabled) continue
        stats.usersChecked++
        const r = await evaluateAndSpawnNextCharacter(p.userId)
        if (r.spawned) stats.charactersSpawned++
      } catch (e) {
        console.error('[character-lifecycle] spawn fail for user:', p.userId, e)
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
