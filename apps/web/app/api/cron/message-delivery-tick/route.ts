/**
 * V4.5 Faz 7B — Mesaj İletim Tick
 *
 * Her 30 saniyede çalışır (Pro plan), undelivered/unseen kullanıcı mesajlarını
 * karakter durumuna göre uygun zamanda damgalar.
 *
 * vercel.json: { "path": "/api/cron/message-delivery-tick", "schedule": "*\/30 * * * * *" }
 * (Hobby plan için poller fallback)
 */

import { NextRequest, NextResponse } from 'next/server'
import { isValidCronRequest } from '@/lib/env/validate'
import { tickMessageDelivery } from '@/lib/assistant/message-delivery'
import { logger } from '@/lib/logger'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (!isValidCronRequest(authHeader)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const result = await tickMessageDelivery()
    if (result.delivered > 0 || result.seen > 0) {
      logger.info(result, 'message-delivery-tick: complete')
    }
    return NextResponse.json({ ok: true, ...result })
  } catch (err: any) {
    logger.error({ err: err?.message }, 'message-delivery-tick: failed')
    return NextResponse.json({ ok: false, error: err?.message ?? 'unknown' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'GET only in development' }, { status: 404 })
  }
  const result = await tickMessageDelivery()
  return NextResponse.json({ ok: true, ...result })
}
