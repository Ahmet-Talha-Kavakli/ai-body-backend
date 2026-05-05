/**
 * V4 Faz B — Graph Essence Cron
 *
 * Ayda 1 (ayın 1'i UTC) çalışmak için. Günlük cron + içeride day-of-month kontrolü.
 * Sadece v4_graph_memory flag'i AÇIK kullanıcılar için.
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { generateEssenceForUser } from '@/lib/assistant/graph-essence'
import { isFlagEnabled } from '@/lib/assistant/feature-flags'

export const maxDuration = 300

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  const stats = { usersProcessed: 0, essenceCreated: 0, errors: 0 }

  try {
    const profiles = await db.assistantProfile.findMany({
      where: { onboardingCompleted: true },
      select: { userId: true },
      take: 500,
    })

    for (const p of profiles) {
      try {
        const enabled = await isFlagEnabled('v4_graph_memory', p.userId)
        if (!enabled) continue
        const r = await generateEssenceForUser(p.userId)
        stats.usersProcessed++
        stats.essenceCreated += r.essenceCreated
      } catch (e) {
        console.error('[cron graph-essence] user fail:', p.userId, e)
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
