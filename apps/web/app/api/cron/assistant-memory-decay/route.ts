/**
 * Asistan Hafıza Decay Cron — günlük (Vercel cron)
 *
 * 3 yıldan uzun süre dokunulmamış belief'leri arşivler.
 * Confidence'ın güncel etkin değeri runtime'da `effectiveConfidence` ile hesaplanır,
 * burada sadece eskimiş olanları arşivleme işi yapıyoruz.
 */

import { NextRequest, NextResponse } from 'next/server'
import { runDecaySweep } from '@/lib/assistant/memory'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  const expected = process.env.CRON_SECRET
  if (!expected || authHeader !== `Bearer ${expected}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const result = await runDecaySweep()
    return NextResponse.json({ ok: true, ...result })
  } catch (e) {
    console.error('[cron/assistant-memory-decay]', e)
    return NextResponse.json({ ok: false, error: 'failed' }, { status: 500 })
  }
}
