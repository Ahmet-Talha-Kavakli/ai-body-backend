/**
 * V4.6 M6 — Aracılık endpoint'i
 *
 * Kullanıcı engelli karaktere ulaşmak için ortak arkadaştan aracılık ister.
 *
 * POST /api/assistant/characters/{mediatorCharId}/mediate
 * Body: { blockedCharId: string, message: string }
 *
 * Aracı karakterin sonraki konuşmasında promptuna inject olur.
 */

import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/api/with-auth'
import { db } from '@/lib/db/client'
import { createMediation } from '@/lib/assistant/blocking'

export const POST = withAuth(async (req: NextRequest, { user }) => {
  const url = new URL(req.url)
  const segments = url.pathname.split('/').filter(Boolean)
  // /api/assistant/characters/{characterId}/mediate
  const idx = segments.indexOf('characters')
  const mediatorCharId = idx >= 0 ? segments[idx + 1] : null
  if (!mediatorCharId) {
    return NextResponse.json({ error: 'mediator_id_missing' }, { status: 400 })
  }

  let body: { blockedCharId?: string; message?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 })
  }

  if (!body.blockedCharId || !body.message?.trim()) {
    return NextResponse.json({ error: 'blockedCharId_and_message_required' }, { status: 400 })
  }

  // Kullanıcı her iki karaktere de sahip olmalı
  const [blocked, mediator] = await Promise.all([
    db.character.findFirst({
      where: { id: body.blockedCharId, userId: user.id },
      select: { id: true, name: true },
    }),
    db.character.findFirst({
      where: { id: mediatorCharId, userId: user.id },
      select: { id: true, name: true },
    }),
  ])
  if (!blocked || !mediator) {
    return NextResponse.json({ error: 'character_not_found' }, { status: 404 })
  }

  // Mediator gerçekten blocked değil olmalı (kendisi de engelliyse anlamsız)
  const mediatorRel = await db.memoryRelationship.findUnique({
    where: { userId_characterId: { userId: user.id, characterId: mediatorCharId } },
    select: { blockedUntil: true, permanentlyEnded: true },
  })
  if (
    mediatorRel?.permanentlyEnded ||
    (mediatorRel?.blockedUntil && mediatorRel.blockedUntil.getTime() > Date.now())
  ) {
    return NextResponse.json({ error: 'mediator_also_blocked' }, { status: 400 })
  }

  const mediation = await createMediation({
    userId: user.id,
    blockedCharId: body.blockedCharId,
    mediatorCharId,
    message: body.message.trim(),
  })

  return NextResponse.json({
    ok: true,
    mediationId: mediation.id,
    blockedName: blocked.name,
    mediatorName: mediator.name,
  })
})
