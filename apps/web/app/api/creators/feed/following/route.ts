/**
 * V4.8 Faz F — Takip ettiğim yaratıcıların feed'i
 *
 * GET /api/creators/feed/following
 *
 * Takip edilen yaratıcıların son yayınladığı karakterler (yayın tarihine göre).
 */

import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/api/with-auth'
import { db } from '@/lib/db/client'

export const GET = withAuth(async (_req, { user }) => {
  const follows = await db.creatorFollow.findMany({
    where: { followerId: user.id },
    select: { creatorId: true },
  })
  const creatorIds = follows.map((f) => f.creatorId)
  if (creatorIds.length === 0) return NextResponse.json({ feed: [] })

  const listings = await db.marketplaceListing.findMany({
    where: {
      ownerId: { in: creatorIds },
      character: { publishStatus: 'published', isRetired: false },
    },
    orderBy: { publishedAt: 'desc' },
    take: 50,
    include: {
      character: {
        select: {
          id: true,
          name: true,
          age: true,
          avatarUrl: true,
          bio: true,
          hometown: true,
          category: true,
        },
      },
      owner: {
        select: {
          creatorProfile: { select: { handle: true, avatar: true } },
        },
      },
    },
  })

  return NextResponse.json({
    feed: listings.map((l) => ({
      id: l.id,
      character: l.character,
      ownerHandle: l.owner.creatorProfile?.handle ?? null,
      ownerAvatar: l.owner.creatorProfile?.avatar ?? null,
      publishedAt: l.publishedAt,
      rentPrice7d: l.rentPrice7d,
      averageRating: l.averageRating,
    })),
  })
})
