/**
 * DEV ONLY — Proaktif mesaj test endpoint'i
 *
 * Cron beklemeden manuel tetik. PROACTIVE_DEV_RELAX=1 env ile çağırınca
 * tüm filterları gevşetir (saat penceresi, gün eşiği, %20 olasılık vs).
 *
 * Kullanım:
 *   GET /api/dev/proactive-test?userId=USER_ID
 *   GET /api/dev/proactive-test?userId=USER_ID&characterId=CHAR_ID
 *
 * Response: her karakter için kararı (sent/skipped + reason + debug).
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import {
  evaluateProactiveForCharacter,
  runProactiveForUser,
  setProactiveDevRelax,
} from '@/lib/assistant/character-proactive'

export const maxDuration = 60

export async function GET(req: NextRequest) {
  if (process.env.NODE_ENV === 'production' && process.env.ALLOW_DEV_ENDPOINTS !== '1') {
    return NextResponse.json({ error: 'dev_only' }, { status: 403 })
  }

  const url = new URL(req.url)
  const userId = url.searchParams.get('userId')
  const characterId = url.searchParams.get('characterId')
  const dryRun = url.searchParams.get('dryRun') === '1'

  if (!userId) {
    return NextResponse.json({ error: 'userId_required' }, { status: 400 })
  }

  // Otomatik DEV_RELAX — bu endpoint'te her zaman gevşek
  setProactiveDevRelax(true)

  const tz = 'Europe/Istanbul'
  const localHour = parseInt(
    new Date().toLocaleString('en-US', {
      timeZone: tz,
      hour: 'numeric',
      hour12: false,
    }),
    10
  )

  if (characterId && dryRun) {
    const decision = await evaluateProactiveForCharacter({
      userId,
      characterId,
      userLocalHour: isNaN(localHour) ? 12 : localHour,
    })
    return NextResponse.json({ ok: true, dryRun: true, decision })
  }

  if (characterId) {
    const decision = await evaluateProactiveForCharacter({
      userId,
      characterId,
      userLocalHour: isNaN(localHour) ? 12 : localHour,
    })
    if (!decision.shouldSend || !decision.message) {
      return NextResponse.json({ ok: true, sent: false, decision })
    }
    let conversation = await db.assistantConversation.findFirst({
      where: { userId, characterId, archived: false },
    })
    const character = await db.character.findUnique({
      where: { id: characterId },
      select: { name: true },
    })
    if (!conversation) {
      conversation = await db.assistantConversation.create({
        data: { userId, characterId, title: character?.name ?? 'Character' },
      })
    }
    const now = new Date()
    await db.assistantMessage.create({
      data: {
        conversationId: conversation.id,
        role: 'assistant',
        content: decision.message,
      },
    })
    // V4.6 M2 — proaktif sonrası karakter "şu an aktif"
    await db.character
      .update({
        where: { id: characterId },
        data: { lastSeenAt: now, isCurrentlyOnline: true, onlineStateUpdatedAt: now },
      })
      .catch(() => {})
    return NextResponse.json({ ok: true, sent: true, decision })
  }

  const result = await runProactiveForUser(userId, isNaN(localHour) ? 12 : localHour)
  return NextResponse.json({ ok: true, ...result, userLocalHour: localHour })
}
