/**
 * V4.5 — Debug endpoint (sadece dev)
 *
 * Bu haftanın episodik özetini zorla üretir — gerçek pazartesi cron'unu
 * beklemeden test için.
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { summarizeWeekForCharacter, weekStartOf } from '@/lib/assistant/episodic-memory'

export const runtime = 'nodejs'
export const maxDuration = 120

export async function GET(req: NextRequest) {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'dev only' }, { status: 404 })
  }
  const url = new URL(req.url)
  const characterName = url.searchParams.get('character') ?? 'Mia'

  const character = await db.character.findFirst({
    where: { name: characterName },
    select: { id: true, name: true, userId: true },
  })
  if (!character) return NextResponse.json({ error: 'character not found' }, { status: 404 })

  // Bu haftanın başlangıcı
  const weekStart = weekStartOf(new Date())

  const summary = await summarizeWeekForCharacter({
    userId: character.userId,
    characterId: character.id,
    characterName: character.name,
    weekStart,
  })

  if (!summary) {
    return NextResponse.json({ ok: false, reason: 'not enough messages or AI failed' })
  }

  // Mevcut varsa güncelle, yoksa oluştur
  await db.characterEpisodicMemory.upsert({
    where: {
      userId_characterId_weekStartDate: {
        userId: character.userId,
        characterId: character.id,
        weekStartDate: weekStart,
      },
    },
    create: {
      userId: character.userId,
      characterId: character.id,
      weekStartDate: weekStart,
      summary: summary.summary,
      topicsDiscussed: summary.topics,
      promisesByCharacter: summary.promisesByCharacter as any,
      promisesByUser: summary.promisesByUser as any,
      significantMoments: summary.significantMoments as any,
      jokesUsed: summary.jokesUsed,
    },
    update: {
      summary: summary.summary,
      topicsDiscussed: summary.topics,
      promisesByCharacter: summary.promisesByCharacter as any,
      promisesByUser: summary.promisesByUser as any,
      significantMoments: summary.significantMoments as any,
      jokesUsed: summary.jokesUsed,
    },
  })

  return NextResponse.json({
    ok: true,
    character: character.name,
    weekStart,
    summary,
  })
}
