/**
 * V4.6 M69 — Mesaj reaksiyonları
 *
 * POST   { emoji: string } → reaksiyon ekle/güncelle
 * DELETE                   → reaksiyonu kaldır
 * GET                      → mesajın tüm reaksiyonları
 */

import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/api/with-auth'
import { db } from '@/lib/db/client'

const VALID_EMOJIS = ['❤️', '😂', '😮', '😢', '😡', '🙏', '👍', '👎']

function getMessageIdFromUrl(url: string): string | null {
  const segments = new URL(url).pathname.split('/').filter(Boolean)
  const idx = segments.indexOf('messages')
  return idx >= 0 ? segments[idx + 1] : null
}

async function verifyMessageOwnership(messageId: string, userId: string) {
  const msg = await db.assistantMessage.findUnique({
    where: { id: messageId },
    select: {
      conversation: { select: { userId: true } },
    },
  })
  return msg?.conversation?.userId === userId
}

export const GET = withAuth(async (req: NextRequest, { user }) => {
  const messageId = getMessageIdFromUrl(req.url)
  if (!messageId) return NextResponse.json({ error: 'message_id_missing' }, { status: 400 })
  const ok = await verifyMessageOwnership(messageId, user.id)
  if (!ok) return NextResponse.json({ error: 'not_found' }, { status: 404 })
  const reactions = await db.messageReaction.findMany({
    where: { messageId },
    orderBy: { createdAt: 'asc' },
  })
  return NextResponse.json({ ok: true, reactions })
})

export const POST = withAuth(async (req: NextRequest, { user }) => {
  const messageId = getMessageIdFromUrl(req.url)
  if (!messageId) return NextResponse.json({ error: 'message_id_missing' }, { status: 400 })
  const ok = await verifyMessageOwnership(messageId, user.id)
  if (!ok) return NextResponse.json({ error: 'not_found' }, { status: 404 })

  let body: { emoji?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 })
  }
  if (!body.emoji || !VALID_EMOJIS.includes(body.emoji)) {
    return NextResponse.json({ error: 'invalid_emoji' }, { status: 400 })
  }

  const reaction = await db.messageReaction
    .upsert({
      where: {
        messageId_fromType_fromCharId: {
          messageId,
          fromType: 'user',
          fromCharId: null as unknown as string,
        },
      },
      create: { messageId, fromType: 'user', emoji: body.emoji },
      update: { emoji: body.emoji },
    })
    .catch(async () => {
      // Eğer fromCharId null ile unique çakışması varsa elle kontrol
      const existing = await db.messageReaction.findFirst({
        where: { messageId, fromType: 'user', fromCharId: null },
      })
      if (existing) {
        return db.messageReaction.update({
          where: { id: existing.id },
          data: { emoji: body.emoji! },
        })
      }
      return db.messageReaction.create({
        data: { messageId, fromType: 'user', emoji: body.emoji! },
      })
    })

  return NextResponse.json({ ok: true, reaction })
})

export const DELETE = withAuth(async (req: NextRequest, { user }) => {
  const messageId = getMessageIdFromUrl(req.url)
  if (!messageId) return NextResponse.json({ error: 'message_id_missing' }, { status: 400 })
  const ok = await verifyMessageOwnership(messageId, user.id)
  if (!ok) return NextResponse.json({ error: 'not_found' }, { status: 404 })

  await db.messageReaction.deleteMany({
    where: { messageId, fromType: 'user', fromCharId: null },
  })
  return NextResponse.json({ ok: true })
})
