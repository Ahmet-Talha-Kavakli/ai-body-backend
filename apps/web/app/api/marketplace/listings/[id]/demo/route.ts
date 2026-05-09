/**
 * V4.8 Faz D — Demo Modu
 *
 * POST /api/marketplace/listings/:id/demo  → Demo session başlat veya devam ettir
 * GET  /api/marketplace/listings/:id/demo  → Demo durumu
 *
 * 5 mesaj/24 saat. 24 saat sonra reset.
 */

import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/api/with-auth'
import { db } from '@/lib/db/client'

const DEMO_LIMIT = 5
const DEMO_WINDOW_MS = 24 * 60 * 60 * 1000

type Ctx = { params: Promise<{ id: string }> }

export const POST = withAuth<Ctx>(async (_req, { user, params }) => {
  const { id } = await params!
  const listing = await db.marketplaceListing.findUnique({
    where: { id },
    select: {
      id: true,
      characterId: true,
      ownerId: true,
      character: { select: { publishStatus: true, isRetired: true, name: true } },
    },
  })
  if (!listing) return NextResponse.json({ error: 'Listing bulunamadı' }, { status: 404 })
  if (listing.character.isRetired || listing.character.publishStatus !== 'published') {
    return NextResponse.json({ error: 'Demo açık değil' }, { status: 410 })
  }
  if (listing.ownerId === user.id) {
    return NextResponse.json(
      { error: 'Kendi karakterini demo etme — Karakterlerim test odasını kullan' },
      { status: 400 }
    )
  }

  let session = await db.characterDemoSession.findUnique({
    where: { characterId_userId: { characterId: listing.characterId, userId: user.id } },
  })

  // 24 saat geçmişse reset
  if (session && session.startedAt.getTime() < Date.now() - DEMO_WINDOW_MS) {
    await db.characterDemoSession.delete({ where: { id: session.id } })
    session = null
  }

  if (!session) {
    session = await db.characterDemoSession.create({
      data: { characterId: listing.characterId, userId: user.id },
    })
  }

  const remaining = Math.max(0, DEMO_LIMIT - session.messageCount)
  return NextResponse.json({
    session: { id: session.id, messageCount: session.messageCount, remaining, limit: DEMO_LIMIT },
    character: { id: listing.characterId, name: listing.character.name },
  })
})

export const GET = withAuth<Ctx>(async (_req, { user, params }) => {
  const { id } = await params!
  const listing = await db.marketplaceListing.findUnique({
    where: { id },
    select: { characterId: true },
  })
  if (!listing) return NextResponse.json({ error: 'Listing bulunamadı' }, { status: 404 })

  const session = await db.characterDemoSession.findUnique({
    where: { characterId_userId: { characterId: listing.characterId, userId: user.id } },
  })
  if (!session) {
    return NextResponse.json({ session: null, remaining: DEMO_LIMIT, limit: DEMO_LIMIT })
  }
  const expired = session.startedAt.getTime() < Date.now() - DEMO_WINDOW_MS
  const remaining = expired ? DEMO_LIMIT : Math.max(0, DEMO_LIMIT - session.messageCount)
  return NextResponse.json({
    session: expired
      ? null
      : { id: session.id, messageCount: session.messageCount, remaining, limit: DEMO_LIMIT },
    remaining,
    limit: DEMO_LIMIT,
  })
})
