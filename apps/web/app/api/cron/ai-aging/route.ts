/**
 * V3 Faz C — AI Aging Cron
 *
 * Her sabah çalışır. Aktif AI'lar için doğum günü, yıl dönümü, decade
 * geçişi kontrol eder. Uygunsa AI proaktif mesaj atar, shared milestone
 * yaratır, push gönderir.
 */

import { NextRequest, NextResponse } from 'next/server'
import { runAgingCron } from '@/lib/assistant/aging-cron'

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  try {
    const result = await runAgingCron()
    return NextResponse.json({ ok: true, ...result })
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : 'unknown' },
      { status: 500 }
    )
  }
}
