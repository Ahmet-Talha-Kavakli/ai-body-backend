/**
 * V4.5 — Episodik Hafıza Cron
 *
 * Her pazartesi 03:00 UTC çalışır. Aktif (User × Character) çiftleri için
 * geçen 7 günün özetini üretir, CharacterEpisodicMemory'ye yazar.
 *
 * Maliyet: ~$0.0008/karakter × kullanıcı sayısı.
 *
 * vercel.json schedule: { "path": "/api/cron/episodic-summarizer", "schedule": "0 3 * * 1" }
 */

import { NextRequest, NextResponse } from 'next/server'
import { isValidCronRequest } from '@/lib/env/validate'
import { runEpisodicSummarizer } from '@/lib/assistant/episodic-memory'
import { logger } from '@/lib/logger'

export const runtime = 'nodejs'
export const maxDuration = 300

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (!isValidCronRequest(authHeader)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const startedAt = Date.now()
  try {
    const result = await runEpisodicSummarizer()
    const elapsed = Date.now() - startedAt
    logger.info({ ...result, elapsedMs: elapsed }, 'episodic-summarizer: complete')
    return NextResponse.json({ ok: true, ...result, elapsedMs: elapsed })
  } catch (err: any) {
    logger.error({ err: err?.message }, 'episodic-summarizer: failed')
    return NextResponse.json({ ok: false, error: err?.message ?? 'unknown' }, { status: 500 })
  }
}

// GET: dev test (auth atla, tek kullanıcı için manuel tetik)
export async function GET(req: NextRequest) {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'GET only in development' }, { status: 404 })
  }
  const result = await runEpisodicSummarizer()
  return NextResponse.json({ ok: true, ...result })
}
