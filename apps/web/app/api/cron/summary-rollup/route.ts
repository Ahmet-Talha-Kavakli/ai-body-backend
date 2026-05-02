/**
 * V3 Faz A — Hierarchical Memory Compression Rollup Cron
 *
 * Günde 1 kez (gece 03:00) çalışır.
 * - Tüm aktif kullanıcılar için Level 2/3/4 rollup'larını kontrol eder
 * - 5 Level 1 birikti mi? Level 2 üret
 * - 4 Level 2 birikti mi? Level 3 üret
 * - 12 Level 3 birikti mi? Level 4 üret
 *
 * Vercel Cron: vercel.json'da /api/cron/summary-rollup günlük tetiklenir
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { createUpperLevelSummary } from '@/lib/assistant/summary-builder'

export async function GET(req: NextRequest) {
  // Vercel cron secret kontrolü
  const authHeader = req.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  const stats = {
    usersChecked: 0,
    level2Created: 0,
    level3Created: 0,
    level4Created: 0,
    errors: 0,
  }

  try {
    // Aktif kullanıcıları al — son 30 günde mesaj atan
    const activeSince = new Date()
    activeSince.setDate(activeSince.getDate() - 30)

    const activeUsers = await db.user.findMany({
      where: {
        assistantConversations: {
          some: {
            messages: {
              some: { createdAt: { gte: activeSince } },
            },
          },
        },
      },
      select: { id: true },
    })

    stats.usersChecked = activeUsers.length

    // Her kullanıcı için sırayla 2 → 3 → 4 rollup'larını dene
    // Her seviye için döngü — yeterince çocuk varsa birden fazla parent üretebilir
    for (const user of activeUsers) {
      try {
        // Level 2 — birden fazla kez tetiklenebilir (5 Level 1 her oluştuğunda)
        let i = 0
        while (i < 10) {
          const created = await createUpperLevelSummary(user.id, 2)
          if (!created) break
          stats.level2Created++
          i++
        }

        // Level 3
        i = 0
        while (i < 5) {
          const created = await createUpperLevelSummary(user.id, 3)
          if (!created) break
          stats.level3Created++
          i++
        }

        // Level 4
        i = 0
        while (i < 3) {
          const created = await createUpperLevelSummary(user.id, 4)
          if (!created) break
          stats.level4Created++
          i++
        }
      } catch (e) {
        console.error(`[summary-rollup] user=${user.id}`, e)
        stats.errors++
      }
    }

    return NextResponse.json({ success: true, stats })
  } catch (e) {
    console.error('[summary-rollup]', e)
    return NextResponse.json(
      { success: false, error: e instanceof Error ? e.message : 'unknown', stats },
      { status: 500 }
    )
  }
}
