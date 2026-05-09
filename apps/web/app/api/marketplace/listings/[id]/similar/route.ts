/**
 * V4.8 Faz F — Benzer karakterler
 *
 * GET /api/marketplace/listings/[id]/similar?limit=4
 *
 * Aynı kategori + farklı characterId, rating + totalRentals'a göre sıralı.
 * "Bunu sevdiysen şunu da denersin" listing detayında gösterilir.
 *
 * Cache: 5 dakika (kategori/popülerlik nadiren değişir).
 */

import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/api/with-auth'
import { db } from '@/lib/db/client'
import { cached } from '@/lib/redis/client'

type Ctx = { params: Promise<{ id: string }> }

export const GET = withAuth<Ctx>(async (req, { user, params }) => {
  const { id } = await params!
  const limit = Math.min(8, parseInt(req.nextUrl.searchParams.get('limit') ?? '4', 10))

  const cacheKey = `mp:similar:${id}:${limit}`
  const data = await cached(cacheKey, 5 * 60, async () => {
    const source = await db.marketplaceListing.findUnique({
      where: { id },
      select: { id: true, characterId: true, character: { select: { category: true } } },
    })
    if (!source) return null

    const similar = await db.marketplaceListing.findMany({
      where: {
        id: { not: id },
        character: {
          publishStatus: 'published',
          isRetired: false,
          category: source.character.category,
        },
      },
      orderBy: [
        { boostUntil: { sort: 'desc', nulls: 'last' } },
        { averageRating: { sort: 'desc', nulls: 'last' } },
        { totalRentals: 'desc' },
      ],
      take: limit,
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
          select: { creatorProfile: { select: { handle: true } } },
        },
      },
    })

    return {
      sourceCategory: source.character.category,
      items: similar.map((l) => ({
        id: l.id,
        character: l.character,
        ownerHandle: l.owner.creatorProfile?.handle ?? null,
        rentPrice7d: l.rentPrice7d,
        rentPrice14d: l.rentPrice14d,
        rentPrice30d: l.rentPrice30d,
        averageRating: l.averageRating,
        totalRentals: l.totalRentals,
        isBoosted: l.boostUntil ? l.boostUntil > new Date() : false,
      })),
    }
  })

  if (!data) return NextResponse.json({ error: 'Listing bulunamadı' }, { status: 404 })

  // user-specific bilgi yok bu endpoint'te (recommendation public-ish)
  void user
  return NextResponse.json(data)
})
