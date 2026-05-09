/**
 * V4.8 Faz E — Wishlist
 *
 * GET /api/marketplace/wishlist  → kullanıcının favori listing'leri
 * POST /api/marketplace/wishlist → ekle veya kaldır (toggle)
 * Body: { listingId }
 */

import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/api/with-auth'
import { db } from '@/lib/db/client'

export const GET = withAuth(async (_req: NextRequest, { user }) => {
  const items = await db.listingWishlist.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    include: {
      listing: {
        include: {
          character: {
            select: {
              id: true,
              name: true,
              age: true,
              gender: true,
              avatarUrl: true,
              bio: true,
              hometown: true,
              category: true,
              dnaScore: true,
            },
          },
          owner: {
            select: { creatorProfile: { select: { handle: true } } },
          },
        },
      },
    },
  })

  return NextResponse.json({
    wishlist: items
      .filter((w) => w.listing.character.id) // listing silinmiş olabilir
      .map((w) => ({
        id: w.id,
        addedAt: w.createdAt,
        listing: {
          id: w.listing.id,
          characterId: w.listing.characterId,
          character: w.listing.character,
          ownerHandle: w.listing.owner.creatorProfile?.handle ?? null,
          rentPrice7d: w.listing.rentPrice7d,
          rentPrice14d: w.listing.rentPrice14d,
          rentPrice30d: w.listing.rentPrice30d,
          buyPrice: w.listing.buyPrice,
          rentEnabled: w.listing.rentEnabled,
          buyEnabled: w.listing.buyEnabled,
          averageRating: w.listing.averageRating,
          totalRentals: w.listing.totalRentals,
        },
      })),
  })
})

export const POST = withAuth(async (req: NextRequest, { user }) => {
  const body = await req.json().catch(() => ({}))
  const listingId = body.listingId
  if (!listingId) return NextResponse.json({ error: 'listingId gerekli' }, { status: 400 })

  const existing = await db.listingWishlist.findUnique({
    where: { userId_listingId: { userId: user.id, listingId } },
  })
  if (existing) {
    await db.listingWishlist.delete({ where: { id: existing.id } })
    return NextResponse.json({ added: false })
  } else {
    await db.listingWishlist.create({ data: { userId: user.id, listingId } })
    return NextResponse.json({ added: true })
  }
})
