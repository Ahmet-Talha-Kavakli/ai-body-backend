/**
 * V4 Faz B — Graph Pattern Detection Cron
 *
 * Haftada 1 (pazar gece UTC) çalışmak için tasarlanmış.
 * Vercel Hobby günlük cron limiti yüzünden günlük tetiklenir, içeride
 * "haftanın belli günü mü?" kontrolüyle haftada 1'e indirgenir.
 *
 * Sadece v4_graph_memory flag'i AÇIK olan kullanıcılar için çalışır.
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { detectPatternsForUser } from '@/lib/assistant/graph-pattern-detector'
import { isFlagEnabled } from '@/lib/assistant/feature-flags'

export const maxDuration = 300

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  const stats = { usersProcessed: 0, patternsCreated: 0, errors: 0 }

  try {
    // Aktif kullanıcılar (V4 flag açık olanlar)
    const profiles = await db.assistantProfile.findMany({
      where: { onboardingCompleted: true },
      select: { userId: true },
      take: 500,
    })

    for (const p of profiles) {
      try {
        const enabled = await isFlagEnabled('v4_graph_memory', p.userId)
        if (!enabled) continue
        const r = await detectPatternsForUser(p.userId)
        stats.usersProcessed++
        stats.patternsCreated += r.patternsCreated
      } catch (e) {
        console.error('[cron graph-pattern] user fail:', p.userId, e)
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
