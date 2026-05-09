/**
 * V4.5 Faz 7B — Çoklu Mesaj Dispatcher
 *
 * Karakter bölünmüş cevap verdiğinde 2-4. parçaları zamanı geldikçe gönderir.
 * Her 5-10 saniyede çalışır (Pro plan cron veya dev poller).
 *
 * vercel.json: { "path": "/api/cron/scheduled-character-dispatcher", "schedule": "* * * * *" }
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { isValidCronRequest } from '@/lib/env/validate'

export const runtime = 'nodejs'
export const maxDuration = 60

async function dispatchPending(): Promise<{ sent: number; failed: number }> {
  const now = new Date()
  const pending = await db.scheduledCharacterMessage.findMany({
    where: {
      status: 'pending',
      scheduledFor: { lte: now },
    },
    orderBy: { scheduledFor: 'asc' },
    take: 50,
  })

  let sent = 0
  let failed = 0

  for (const msg of pending) {
    try {
      await db.$transaction([
        db.assistantMessage.create({
          data: {
            conversationId: msg.conversationId,
            role: 'assistant',
            content: msg.content,
            // V4.7 Faz 7 — özel kart metadata taşı (anniversary_letter / symbolic_gift / vs)
            ...(msg.attachments ? { attachments: msg.attachments as object } : {}),
          },
        }),
        db.scheduledCharacterMessage.update({
          where: { id: msg.id },
          data: { status: 'sent', sentAt: new Date() },
        }),
      ])
      sent++
    } catch (err: any) {
      console.error('[scheduled-character-dispatcher] failed:', msg.id, err?.message)
      await db.scheduledCharacterMessage
        .update({
          where: { id: msg.id },
          data: { status: 'cancelled' },
        })
        .catch(() => {})
      failed++
    }
  }

  return { sent, failed }
}

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (!isValidCronRequest(authHeader)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const result = await dispatchPending()
  return NextResponse.json({ ok: true, ...result })
}

export async function GET(req: NextRequest) {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'GET only in development' }, { status: 404 })
  }
  const result = await dispatchPending()
  return NextResponse.json({ ok: true, ...result })
}
