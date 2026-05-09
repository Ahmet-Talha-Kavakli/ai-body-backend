/**
 * V4.7 J2 — Research Dispatcher (saatte 1)
 *
 * PendingResearch where scheduledFor <= now() AND resolvedAt is null
 * Her kayıt için Tavily ile sorgu → result yazılır, resolvedAt = now()
 *
 * NOT: Karakter prompt'ta paylaşımı buildResearchSharingBlock üzerinden yapar
 * (cron schedule message YAPMAZ — kullanıcı sohbet açtığında karakter doğal yerde sızdırır).
 *
 * Lokal: curl http://localhost:3000/api/cron/research-dispatcher
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { tavilySearch } from '@/lib/assistant/v47-research'

export const maxDuration = 300

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
  const due = await db.pendingResearch.findMany({
    where: { scheduledFor: { lte: now }, resolvedAt: null },
    take: 30,
  })

  let processed = 0
  let resolved = 0
  let failed = 0

  for (const r of due) {
    processed++
    const result = await tavilySearch(r.query)
    if (!result) {
      failed++
      continue
    }
    await db.pendingResearch.update({
      where: { id: r.id },
      data: { result: result.slice(0, 4000), resolvedAt: new Date() },
    })
    resolved++
  }

  return NextResponse.json({
    ok: true,
    due: due.length,
    processed,
    resolved,
    failed,
    timestamp: now.toISOString(),
  })
}
