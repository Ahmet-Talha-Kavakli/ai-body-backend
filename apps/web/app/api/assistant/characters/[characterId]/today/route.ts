/**
 * V4.7 Faz 4 — GET /api/assistant/characters/[characterId]/today
 *
 * Bugün karakter için üretilen hayat dokusunu döner: outfit + meals + music + details + venues + obsession.
 * Mobile profile / debug paneli için.
 */

import { NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { withAuth } from '@/lib/api/with-auth'

type Params = { params: Promise<{ characterId: string }> }

export const GET = withAuth<Params>(async (_req, { user, params }) => {
  const { characterId } = await params
  const character = await db.character.findFirst({
    where: { id: characterId, userId: user.id },
    select: { id: true, name: true, todayOutfit: true },
  })
  if (!character) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 })
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const [meals, music, details, venues, obsession] = await Promise.all([
    db.characterDailyMeals.findFirst({
      where: { characterId, date: { gte: today, lt: tomorrow } },
    }),
    db.characterDailyMusic.findMany({
      where: { characterId, date: { gte: today, lt: tomorrow } },
    }),
    db.characterDailyDetail.findMany({
      where: { characterId, date: { gte: today, lt: tomorrow } },
      orderBy: { id: 'asc' },
    }),
    db.characterFavoriteVenue.findMany({
      where: { characterId, active: true },
    }),
    db.characterObsession.findFirst({
      where: { characterId, status: 'active', endsAt: { gt: new Date() } },
    }),
  ])

  return NextResponse.json({
    character: { id: character.id, name: character.name },
    outfit: character.todayOutfit,
    meals,
    music,
    details,
    venues,
    obsession,
  })
})
