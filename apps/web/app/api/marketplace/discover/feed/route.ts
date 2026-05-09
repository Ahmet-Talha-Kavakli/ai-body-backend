/**
 * V4.8 Faz E — Keşfet swipe feed
 *
 * GET /api/marketplace/discover/feed
 * Pass'lenmiş (henüz expire olmamış) + wishlist'tekiler hariç,
 * trending sırada listing döndürür. Limit varsayılan 30.
 */

import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/api/with-auth'
import { db } from '@/lib/db/client'

export const GET = withAuth(async (req: NextRequest, { user }) => {
  const limit = Math.min(50, parseInt(req.nextUrl.searchParams.get('limit') ?? '30', 10))
  const now = new Date()

  const [activePasses, wishlisted] = await Promise.all([
    db.listingPass.findMany({
      where: { userId: user.id, expiresAt: { gt: now } },
      select: { listingId: true },
    }),
    db.listingWishlist.findMany({
      where: { userId: user.id },
      select: { listingId: true },
    }),
  ])

  const excludeIds = [
    ...activePasses.map((p) => p.listingId),
    ...wishlisted.map((w) => w.listingId),
  ]

  const listings = await db.marketplaceListing.findMany({
    where: {
      character: { publishStatus: 'published', isRetired: false },
      ...(excludeIds.length > 0 ? { id: { notIn: excludeIds } } : {}),
    },
    orderBy: [{ boostUntil: 'desc' }, { totalRentals: 'desc' }],
    take: limit,
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
          tier: true,
          dnaScore: true,
        },
      },
      owner: {
        select: {
          creatorProfile: { select: { handle: true, tier: true } },
        },
      },
    },
  })

  return NextResponse.json({
    feed: listings.map((l) => ({
      id: l.id,
      characterId: l.characterId,
      character: l.character,
      ownerHandle: l.owner.creatorProfile?.handle ?? null,
      ownerTier: l.owner.creatorProfile?.tier ?? 'bronze',
      rentPrice7d: l.rentPrice7d,
      rentPrice14d: l.rentPrice14d,
      rentPrice30d: l.rentPrice30d,
      buyPrice: l.buyPrice,
      buyEnabled: l.buyEnabled,
      rentEnabled: l.rentEnabled,
      averageRating: l.averageRating,
      totalRentals: l.totalRentals,
      isBoosted: l.boostUntil ? l.boostUntil > now : false,
      boostTier: l.boostTier,
    })),
  })
})
