/**
 * V3 Faz C — Surprise Arc Cron
 *
 * Günlük çalışır. Her aktif kullanıcı için %30 olasılıkla AI'ın hayatında
 * sürpriz bir olay üretir, AI proaktif mesaj atar, shared milestone yaratılır,
 * push notification gönderilir.
 */

import { NextRequest, NextResponse } from 'next/server'
import { runSurpriseArcCron } from '@/lib/assistant/surprise-arc-generator'

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  try {
    const result = await runSurpriseArcCron()
    return NextResponse.json({
      ok: true,
      ...result,
    })
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : 'unknown' },
      { status: 500 }
    )
  }
}
