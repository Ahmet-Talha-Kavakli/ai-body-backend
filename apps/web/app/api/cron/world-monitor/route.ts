/**
 * V4.6 M61 — World Monitor Cron
 *
 * Günde 2 kez (üretim) — aktif kullanıcılar için:
 *   1. Lokasyon doğrula (IP)
 *   2. Hava bilgisi (Open-Meteo)
 *   3. Önemli haberler (GDELT)
 *   → LocalEvent tablosuna düşer
 *
 * Lokal dev'de manuel tetiklenebilir:
 *   curl http://localhost:3000/api/cron/world-monitor
 */

import { NextRequest, NextResponse } from 'next/server'
import { tickWorldMonitor } from '@/lib/assistant/world-monitor'

export const maxDuration = 120

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    if (process.env.NODE_ENV === 'production') {
      return new NextResponse('Unauthorized', { status: 401 })
    }
  }

  try {
    const r = await tickWorldMonitor()
    return NextResponse.json({ ok: true, ...r })
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : 'unknown' },
      { status: 500 }
    )
  }
}
