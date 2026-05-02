/**
 * Cron job — her saat çalışır, tüm aktif kullanıcıları tarar ve proactive mesaj atmaya
 * değer mi diye sorar.
 *
 * Vercel Cron veya kendi cron'unla çağırılabilir:
 *   GET /api/cron/assistant-proactive
 *
 * Auth: CRON_SECRET header (Vercel için Bearer)
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { decideProactive, executeProactive } from '@/lib/assistant/proactive'

export const GET = async (req: NextRequest) => {
  const auth = req.headers.get('authorization')
  if (process.env.CRON_SECRET && auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  // Sadece son 7 gün içinde aktif olan + onboarding'i tamamlamış kullanıcılar
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  const activeUsers = await db.assistantProfile.findMany({
    where: {
      onboardingCompleted: true,
      updatedAt: { gte: sevenDaysAgo },
    },
    select: { userId: true },
    take: 200,
  })

  const stats = { processed: 0, sent: 0, skipped: 0, errors: 0 }
  for (const profile of activeUsers) {
    try {
      const decision = await decideProactive(profile.userId)
      stats.processed++
      if (decision.action === 'send') {
        const result = await executeProactive(profile.userId, decision)
        if (result.ok) stats.sent++
        else stats.errors++
      } else {
        stats.skipped++
      }
    } catch (e) {
      console.error('[cron/proactive]', profile.userId, e)
      stats.errors++
    }
    // Rate limit — paralel atma, sırayla
    await new Promise((r) => setTimeout(r, 200))
  }

  return NextResponse.json({ ok: true, stats })
}
