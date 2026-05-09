/**
 * V4.7 J2 — Research Queue Endpoint
 *
 * POST /api/assistant/research
 *   body: { characterId, conversationId, query, delayMinutes? (default 30-120 random) }
 * → PendingResearch kayıt, scheduledFor delayMinutes sonrası.
 *
 * Stream içinde tool olarak veya elle çağrılabilir.
 */

import { NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { withAuth } from '@/lib/api/with-auth'

export const POST = withAuth(async (req, { user }) => {
  const body = (await req.json()) as {
    characterId?: string
    conversationId?: string
    query?: string
    delayMinutes?: number
  }
  if (!body.characterId || !body.conversationId || !body.query) {
    return NextResponse.json({ error: 'missing_fields' }, { status: 400 })
  }
  const character = await db.character.findFirst({
    where: { id: body.characterId, userId: user.id },
    select: { id: true },
  })
  if (!character) return NextResponse.json({ error: 'character_not_found' }, { status: 404 })

  const conv = await db.assistantConversation.findFirst({
    where: { id: body.conversationId, userId: user.id },
    select: { id: true },
  })
  if (!conv) return NextResponse.json({ error: 'conv_not_found' }, { status: 404 })

  // 30-120 dk random gerçekçi gecikme
  const delay = body.delayMinutes ?? 30 + Math.floor(Math.random() * 90)
  const scheduledFor = new Date(Date.now() + delay * 60 * 1000)

  const research = await db.pendingResearch.create({
    data: {
      characterId: body.characterId,
      userId: user.id,
      conversationId: body.conversationId,
      query: body.query.slice(0, 800),
      scheduledFor,
    },
  })
  return NextResponse.json({ ok: true, research })
})
