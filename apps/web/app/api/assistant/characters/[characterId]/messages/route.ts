/**
 * V4 Faz E — GET /api/assistant/characters/[characterId]/messages
 *
 * Karakterle olan sohbetin mesajlarını döner (sayfalama: ?before=<msgId>&take=50).
 * POST aynı path → mesajları okundu işaretle (mark-as-read).
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { withAuth } from '@/lib/api/with-auth'

export const GET = withAuth(async (req: NextRequest, { user, params }) => {
  const resolvedParams = params instanceof Promise ? await params : params
  const characterId = resolvedParams?.characterId
  if (typeof characterId !== 'string') {
    return new NextResponse('Bad Request', { status: 400 })
  }

  // Karakter sahipliği
  const character = await db.character.findFirst({
    where: { id: characterId, userId: user.id },
    select: { id: true, name: true, bio: true, avatarUrl: true, currentMood: true },
  })
  if (!character) return new NextResponse('Not found', { status: 404 })

  const conversation = await db.assistantConversation.findFirst({
    where: { userId: user.id, characterId, archived: false },
    select: { id: true },
  })
  if (!conversation) {
    return NextResponse.json({ character, conversationId: null, messages: [] })
  }

  const url = new URL(req.url)
  const beforeId = url.searchParams.get('before')
  const take = Math.min(parseInt(url.searchParams.get('take') ?? '50', 10), 100)

  let cursor: { createdAt: Date } | undefined
  if (beforeId) {
    const beforeMsg = await db.assistantMessage.findUnique({
      where: { id: beforeId },
      select: { createdAt: true },
    })
    if (beforeMsg) cursor = { createdAt: beforeMsg.createdAt }
  }

  const messages = await db.assistantMessage.findMany({
    where: {
      conversationId: conversation.id,
      ...(cursor ? { createdAt: { lt: cursor.createdAt } } : {}),
    },
    orderBy: { createdAt: 'desc' },
    take,
    select: {
      id: true,
      role: true,
      content: true,
      createdAt: true,
      starredAt: true,
      readAt: true,
      repliedToMessageId: true,
    },
  })

  // Kronolojik (eskiden yeniye) döndür
  return NextResponse.json({
    character,
    conversationId: conversation.id,
    messages: messages.reverse(),
  })
})

/**
 * POST → Karakter mesajlarını okundu işaretler.
 */
export const POST = withAuth(async (req: NextRequest, { user, params }) => {
  const resolvedParams = params instanceof Promise ? await params : params
  const characterId = resolvedParams?.characterId
  if (typeof characterId !== 'string') {
    return new NextResponse('Bad Request', { status: 400 })
  }

  const conversation = await db.assistantConversation.findFirst({
    where: { userId: user.id, characterId, archived: false },
    select: { id: true },
  })
  if (!conversation) return NextResponse.json({ ok: true, marked: 0 })

  const result = await db.assistantMessage.updateMany({
    where: {
      conversationId: conversation.id,
      role: 'assistant',
      readAt: null,
    },
    data: { readAt: new Date() },
  })

  return NextResponse.json({ ok: true, marked: result.count })
})
