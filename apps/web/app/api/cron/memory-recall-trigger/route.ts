/**
 * V4.7 L5 — Memory Recall Cleanup (günde 1)
 *
 * NOT: Asıl "anı tekrar yaşat" tetiği stream'de prompt block (buildMemoryRecallBlock)
 * tarafından LLM kararıyla yapılır. Cron sadece:
 *   - 30+ gündür kullanıcı tepkisi olmamış MemoryRecallEvent'leri 'rejected' işaretler
 *   - recallCount ≥ 2 olanları soft-archive (karakter daha kullanmasın diye işaret)
 *
 * Bu hafif bir bakım cron'u. Maliyet sıfır.
 *
 * Lokal: curl http://localhost:3000/api/cron/memory-recall-trigger
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'

export const maxDuration = 60

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
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

  // Eski tepkisiz recall'lar → 'rejected'
  const stale = await db.memoryRecallEvent.updateMany({
    where: {
      userReaction: null,
      recalledAt: { lte: thirtyDaysAgo },
    },
    data: { userReaction: 'rejected' },
  })

  return NextResponse.json({
    ok: true,
    archivedRejected: stale.count,
    timestamp: now.toISOString(),
  })
}
