/**
 * V4.8 Faz D — Karakter için marketplace listing yarat / güncelle
 *
 * POST /api/characters/:id/listing  → Listing yarat (publish=published şartı)
 * PATCH /api/characters/:id/listing → Fiyat / limit güncelle
 * DELETE /api/characters/:id/listing → Listing sil (kira pasif olur)
 *
 * Body: {
 *   rentPrice7d?, rentPrice14d?, rentPrice30d?, buyPrice?,
 *   buyEnabled?, rentEnabled?, concurrentLimit?
 * }
 */

import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/api/with-auth'
import { db } from '@/lib/db/client'

type Ctx = { params: Promise<{ id: string }> }

const MIN_RENT = 10
const MAX_RENT = 5000
const MIN_BUY = 100
const MAX_BUY = 50000

function validatePrices(body: any): string | null {
  for (const field of ['rentPrice7d', 'rentPrice14d', 'rentPrice30d']) {
    const v = body[field]
    if (v !== undefined && v !== null && (typeof v !== 'number' || v < MIN_RENT || v > MAX_RENT)) {
      return `${field}: ${MIN_RENT}-${MAX_RENT} credit aralığı`
    }
  }
  if (body.buyPrice !== undefined && body.buyPrice !== null) {
    if (typeof body.buyPrice !== 'number' || body.buyPrice < MIN_BUY || body.buyPrice > MAX_BUY) {
      return `buyPrice: ${MIN_BUY}-${MAX_BUY} credit aralığı`
    }
  }
  if (body.concurrentLimit !== undefined) {
    if (
      typeof body.concurrentLimit !== 'number' ||
      body.concurrentLimit < 1 ||
      body.concurrentLimit > 100
    ) {
      return 'concurrentLimit: 1-100 arası'
    }
  }
  return null
}

export const POST = withAuth<Ctx>(async (req, { user, params }) => {
  const { id } = await params!
  const character = await db.character.findFirst({ where: { id, creatorId: user.id } })
  if (!character) return NextResponse.json({ error: 'Karakter bulunamadı' }, { status: 404 })
  if (character.publishStatus !== 'published') {
    return NextResponse.json({ error: 'Önce karakteri "Markete koy" ile yayınla' }, { status: 422 })
  }
  const existing = await db.marketplaceListing.findUnique({ where: { characterId: id } })
  if (existing) {
    return NextResponse.json({ error: 'Zaten listing var, PATCH ile güncelle' }, { status: 409 })
  }
  const body = await req.json().catch(() => ({}))
  const err = validatePrices(body)
  if (err) return NextResponse.json({ error: err }, { status: 400 })

  // V4.8 #13 — VIP early access (48 saat takipçilere özel)
  const vipUntil = body.vipEarlyAccess === true ? new Date(Date.now() + 48 * 60 * 60 * 1000) : null

  const listing = await db.marketplaceListing.create({
    data: {
      characterId: id,
      ownerId: user.id,
      rentPrice7d: body.rentPrice7d ?? null,
      rentPrice14d: body.rentPrice14d ?? null,
      rentPrice30d: body.rentPrice30d ?? null,
      buyPrice: body.buyPrice ?? null,
      buyEnabled: body.buyEnabled ?? false,
      rentEnabled: body.rentEnabled ?? true,
      concurrentLimit: body.concurrentLimit ?? 1,
      vipUntil,
      publishedAt: new Date(),
    },
  })

  // V4.8 Faz F — takipçilere yeni karakter bildirimi (fire-and-forget)
  notifyFollowersOfNewListing(user.id, character.name, listing.id).catch((e) =>
    console.error('[creator-follow] notify error:', e)
  )

  return NextResponse.json({ listing })
})

async function notifyFollowersOfNewListing(
  creatorId: string,
  characterName: string,
  listingId: string
) {
  const [profile, follows] = await Promise.all([
    db.creatorProfile.findUnique({ where: { userId: creatorId }, select: { handle: true } }),
    db.creatorFollow.findMany({
      where: { creatorId, notifyOnNew: true },
      select: { followerId: true },
    }),
  ])
  if (!profile?.handle || follows.length === 0) return

  const { sendPushToUser } = await import('@/lib/assistant/push')
  for (const f of follows) {
    sendPushToUser(f.followerId, {
      title: `@${profile.handle} yeni karakter yayınladı`,
      body: characterName,
      data: { type: 'creator_new_listing', listingId, creatorHandle: profile.handle },
    }).catch(() => undefined)
  }
}

export const PATCH = withAuth<Ctx>(async (req, { user, params }) => {
  const { id } = await params!
  const listing = await db.marketplaceListing.findFirst({
    where: { characterId: id, ownerId: user.id },
  })
  if (!listing) return NextResponse.json({ error: 'Listing bulunamadı' }, { status: 404 })

  const body = await req.json().catch(() => ({}))
  const err = validatePrices(body)
  if (err) return NextResponse.json({ error: err }, { status: 400 })

  const data: any = {}
  for (const field of [
    'rentPrice7d',
    'rentPrice14d',
    'rentPrice30d',
    'buyPrice',
    'buyEnabled',
    'rentEnabled',
    'concurrentLimit',
  ]) {
    if (field in body) data[field] = body[field]
  }
  const updated = await db.marketplaceListing.update({ where: { id: listing.id }, data })
  return NextResponse.json({ listing: updated })
})

export const DELETE = withAuth<Ctx>(async (_req, { user, params }) => {
  const { id } = await params!
  const listing = await db.marketplaceListing.findFirst({
    where: { characterId: id, ownerId: user.id },
  })
  if (!listing) return NextResponse.json({ error: 'Listing bulunamadı' }, { status: 404 })

  await db.marketplaceListing.update({
    where: { id: listing.id },
    data: { rentEnabled: false, buyEnabled: false },
  })
  return NextResponse.json({
    ok: true,
    message: 'Listing pasifleştirildi (mevcut kiralar bitene kadar aktif kalır)',
  })
})

export const GET = withAuth<Ctx>(async (_req, { user, params }) => {
  const { id } = await params!
  const listing = await db.marketplaceListing.findFirst({
    where: { characterId: id, ownerId: user.id },
  })
  return NextResponse.json({ listing })
})
