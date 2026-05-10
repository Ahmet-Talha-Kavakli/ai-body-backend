/**
 * V4.8 Faz D — Marketplace Listings (60sn redis cache)
 */

import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/api/with-auth'
import { db } from '@/lib/db/client'
import { cached } from '@/lib/redis/client'

export const GET = withAuth(async (req: NextRequest, { user }) => {
  const params = req.nextUrl.searchParams
  const category = params.get('category')
  const sort = params.get('sort') ?? 'trending'
  const q = params.get('q')?.trim() ?? ''
  const limit = Math.min(50, parseInt(params.get('limit') ?? '20', 10))
  const offset = Math.max(0, parseInt(params.get('offset') ?? '0', 10))

  const cacheKey = `mp:list:${category ?? 'all'}:${sort}:${q}:${limit}:${offset}`
  const baseData = await cached(cacheKey, 60, async () => {
    const where: any = {
      character: { publishStatus: 'published', isRetired: false },
    }
    if (category) where.character.category = category
    if (q) where.character.name = { contains: q, mode: 'insensitive' }

    // boostUntil null değerler 'desc'de Postgres default olarak en üste gelir (NULLS FIRST).
    // Bunu boostlu listingler üste gelsin diye `nulls: 'last'` ile çeviriyoruz.
    let orderBy: any = { boostUntil: { sort: 'desc', nulls: 'last' } }
    if (sort === 'new') orderBy = { publishedAt: 'desc' }
    else if (sort === 'rating') orderBy = { averageRating: 'desc' }
    else if (sort === 'priceAsc') orderBy = { rentPrice30d: 'asc' }
    else if (sort === 'trending')
      orderBy = [{ boostUntil: { sort: 'desc', nulls: 'last' } }, { totalRentals: 'desc' }]

    const [listings, total] = await Promise.all([
      db.marketplaceListing.findMany({
        where,
        orderBy,
        take: limit,
        skip: offset,
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
              id: true,
              creatorProfile: { select: { handle: true, tier: true } },
            },
          },
        },
      }),
      db.marketplaceListing.count({ where }),
    ])

    const now = new Date()
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    return {
      listings: listings.map((l) => ({
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
        isBoosted: l.boostUntil ? l.boostUntil > new Date() : false,
        boostTier: l.boostTier,
        trendingBadge: computeTrendingBadge(l, sevenDaysAgo),
        vipUntil: l.vipUntil ? l.vipUntil.toISOString() : null,
        ownerId: l.ownerId,
      })),
      total,
    }
  })

  // VIP filtreleme — vipUntil > now ve user owner değil ve takipçi değilse listing'i gizle
  const now = new Date()
  const vipOwnerIds = Array.from(
    new Set(
      (baseData.listings as any[])
        .filter((l) => l.vipUntil && new Date(l.vipUntil) > now && l.ownerId !== user.id)
        .map((l) => l.ownerId)
    )
  )
  const followedSet = new Set<string>()
  if (vipOwnerIds.length > 0) {
    const follows = await db.creatorFollow.findMany({
      where: { followerId: user.id, creatorId: { in: vipOwnerIds } },
      select: { creatorId: true },
    })
    follows.forEach((f) => followedSet.add(f.creatorId))
  }
  const filteredListings = (baseData.listings as any[]).filter((l) => {
    if (!l.vipUntil) return true
    if (new Date(l.vipUntil) <= now) return true
    if (l.ownerId === user.id) return true
    return followedSet.has(l.ownerId)
  })

  // Demo durumu user-specific, cache dışı
  const charIds = filteredListings.map((l: any) => l.characterId)
  const demoSessions =
    charIds.length > 0
      ? await db.characterDemoSession.findMany({
          where: { userId: user.id, characterId: { in: charIds } },
          select: { characterId: true, messageCount: true, endedAt: true },
        })
      : []
  const demoMap = new Map(demoSessions.map((d) => [d.characterId, d]))

  return NextResponse.json({
    listings: filteredListings.map((l: any) => ({
      ...l,
      isVip: !!l.vipUntil && new Date(l.vipUntil) > now,
      demo: demoMap.get(l.characterId)
        ? {
            messageCount: demoMap.get(l.characterId)!.messageCount,
            ended: !!demoMap.get(l.characterId)!.endedAt,
          }
        : null,
    })),
    total: baseData.total,
    limit,
    offset,
  })
})

type TrendingBadge = 'rising' | 'new' | 'loved' | 'rare' | null

function computeTrendingBadge(l: any, sevenDaysAgo: Date): TrendingBadge {
  // Sıralama: en güçlü sinyal önce
  if (l.averageRating != null && l.averageRating >= 4.5 && l.totalRentals >= 5) return 'loved'
  if (l.totalRentals >= 10) return 'rising'
  if (l.concurrentLimit <= 3 && l.rentEnabled && l.totalRentals >= 1) return 'rare'
  if (l.publishedAt && new Date(l.publishedAt) > sevenDaysAgo) return 'new'
  return null
}
