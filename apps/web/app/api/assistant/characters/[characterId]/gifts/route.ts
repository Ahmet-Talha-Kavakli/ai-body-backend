/**
 * V4.5 Faz 15B — Hediye Gönderim Endpoint
 *
 * POST /api/assistant/characters/[characterId]/gifts
 * Body: { giftType, label, emoji, message? }
 *
 * Yapar:
 *   1. CharacterGift kaydı oluştur (user_to_character)
 *   2. AssistantMessage olarak ekle (özel attachment marker)
 *   3. Relationship update (love + trust delta)
 *   4. Karakter cevabı ASYNC olarak stream endpoint üzerinden
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { withAuth } from '@/lib/api/with-auth'
import { updateRelationshipAfterInteraction } from '@/lib/assistant/character-relationship'

type Params = { params: Promise<{ characterId: string }> }

// Hediye tipi → varsayılan etki
const GIFT_IMPACTS: Record<string, { love: number; trust: number }> = {
  coffee: { love: 1.5, trust: 0.5 },
  flower: { love: 3, trust: 1 },
  book: { love: 2, trust: 2 },
  music: { love: 2, trust: 1 },
  note: { love: 1, trust: 1.5 },
  gift_other: { love: 1, trust: 0.5 },
}

const VALID_TYPES = Object.keys(GIFT_IMPACTS)

export const POST = withAuth<Params>(async (req, { user, params }) => {
  const { characterId } = await params

  const character = await db.character.findFirst({
    where: { id: characterId, userId: user.id },
    select: { id: true, name: true },
  })
  if (!character) {
    return NextResponse.json({ error: 'character_not_found' }, { status: 404 })
  }

  let body: any
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'bad_body' }, { status: 400 })
  }

  const giftType = String(body.giftType ?? '').trim()
  if (!VALID_TYPES.includes(giftType)) {
    return NextResponse.json({ error: 'invalid_gift_type', valid: VALID_TYPES }, { status: 400 })
  }
  const label = String(body.label ?? '').slice(0, 50)
  const emoji = String(body.emoji ?? '🎁').slice(0, 8)
  const message = body.message ? String(body.message).slice(0, 300) : null

  const impact = GIFT_IMPACTS[giftType]

  // Conversation
  const conversation = await db.assistantConversation.findFirst({
    where: { userId: user.id, characterId, archived: false },
    orderBy: { updatedAt: 'desc' },
    select: { id: true },
  })
  if (!conversation) {
    return NextResponse.json({ error: 'no_conversation' }, { status: 404 })
  }

  // Gift kaydı
  const gift = await db.characterGift.create({
    data: {
      userId: user.id,
      characterId,
      direction: 'user_to_character',
      giftType,
      label,
      emoji,
      message,
      loveDelta: impact.love,
      trustDelta: impact.trust,
    },
  })

  // Mesaj olarak da ekle — UI'da bubble göstermek için
  const giftContent = message ? `${emoji} ${label} (${message})` : `${emoji} ${label}`
  const userMsg = await db.assistantMessage.create({
    data: {
      conversationId: conversation.id,
      role: 'user',
      content: `[GIFT:${giftType}] ${giftContent}`,
      attachments: [
        {
          kind: 'gift',
          giftId: gift.id,
          giftType,
          label,
          emoji,
          message: message ?? '',
        },
      ] as any,
      deliveredAt: new Date(),
    },
  })

  // İlişki güncellemesi
  await updateRelationshipAfterInteraction({
    userId: user.id,
    characterId,
    delta: {
      love: impact.love,
      trust: impact.trust,
      momentumImpact: 0.5,
      reason: `gift_${giftType}`,
    },
  }).catch(() => {})

  return NextResponse.json({
    ok: true,
    giftId: gift.id,
    messageId: userMsg.id,
  })
})
