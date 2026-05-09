/**
 * V4.5 — Realism Checker Cron
 *
 * Salı 04:00 UTC. Aktif User × Character için tutarlılık taraması.
 * vercel.json: { "path": "/api/cron/realism-checker", "schedule": "0 4 * * 2" }
 */

import { NextRequest, NextResponse } from 'next/server'
import { isValidCronRequest } from '@/lib/env/validate'
import { runRealismChecker } from '@/lib/assistant/realism-checker'
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
    const result = await runRealismChecker(7)
    const elapsed = Date.now() - startedAt
    logger.info({ ...result, elapsedMs: elapsed }, 'realism-checker: complete')
    return NextResponse.json({ ok: true, ...result, elapsedMs: elapsed })
  } catch (err: any) {
    logger.error({ err: err?.message }, 'realism-checker: failed')
    return NextResponse.json({ ok: false, error: err?.message ?? 'unknown' }, { status: 500 })
  }
}

// GET dev test
export async function GET(req: NextRequest) {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'GET only in development' }, { status: 404 })
  }
  const result = await runRealismChecker(7)
  return NextResponse.json({ ok: true, ...result })
}
