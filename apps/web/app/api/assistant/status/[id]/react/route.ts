/**
 * V4.6 M75 — Status'e cevap (DM mesajı oluştur)
 *
 * POST /api/assistant/status/:id/react
 * body: { emoji?: string, text?: string }
 *
 * Karakter status'üne kullanıcı cevabı:
 * - O karakterle olan DM'e mesaj olarak yazılır
 * - attachments JSON'a { type: 'status_reply', statusId, preview } konur
 * - StatusView.reactedEmoji da set edilir (görüldü kaydı + emoji)
 *
 * Not: Karakter cevabı (AI tetiği) bu endpoint sonrası mevcut send-message akışı
 * tarafından handle edilecek. Şimdilik sadece kayıt + view güncelleme.
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { withAuth } from '@/lib/api/with-auth'

export const POST = withAuth(async (req: NextRequest, { user, params }) => {
  const { id } = (await params) as { id: string }
  const body = await req.json().catch(() => ({}))
  const { emoji, text } = body as { emoji?: string; text?: string }

  if (!emoji && !text?.trim()) {
    return NextResponse.json({ error: 'emoji_or_text_required' }, { status: 400 })
  }

  const status = await db.status.findUnique({ where: { id } })
  if (!status) return NextResponse.json({ error: 'not_found' }, { status: 404 })

  if (status.authorType !== 'character' || !status.authorCharId) {
    return NextResponse.json({ error: 'cannot_reply_to_user_status' }, { status: 400 })
  }

  if (status.hiddenFrom.includes(user.id)) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }

  const character = await db.character.findFirst({
    where: { id: status.authorCharId, userId: user.id },
    select: { id: true },
  })
  if (!character) return NextResponse.json({ error: 'character_not_found' }, { status: 404 })

  // DM bul veya oluştur
  let conversation = await db.assistantConversation.findFirst({
    where: { userId: user.id, characterId: character.id, archived: false },
    orderBy: { updatedAt: 'desc' },
    select: { id: true },
  })
  if (!conversation) {
    conversation = await db.assistantConversation.create({
      data: { userId: user.id, characterId: character.id, title: 'Sohbet' },
      select: { id: true },
    })
  }

  const preview = {
    contentType: status.contentType,
    mediaUrl: status.mediaUrl,
    caption: status.caption,
    bgColor: status.bgColor,
  }

  const messageContent = text?.trim() || emoji || ''
  const message = await db.assistantMessage.create({
    data: {
      conversationId: conversation.id,
      role: 'user',
      content: messageContent,
      attachments: {
        type: 'status_reply',
        statusId: status.id,
        preview,
      } as any,
    },
  })

  // View kaydını güncelle (varsa emoji set et, yoksa create)
  const existingView = await db.statusView.findFirst({
    where: { statusId: id, viewerType: 'user', viewerUserId: user.id },
    select: { id: true },
  })
  if (existingView) {
    if (emoji) {
      await db.statusView.update({
        where: { id: existingView.id },
        data: { reactedEmoji: emoji },
      })
    }
  } else {
    await db.statusView.create({
      data: {
        statusId: id,
        viewerType: 'user',
        viewerUserId: user.id,
        reactedEmoji: emoji || null,
      },
    })
  }

  return NextResponse.json({
    ok: true,
    conversationId: conversation.id,
    messageId: message.id,
  })
})
