import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/api/with-auth'
import { db } from '@/lib/db/client'
import { cached } from '@/lib/redis/client'

type Ctx = { params: Promise<{ id: string }> }

export const GET = withAuth<Ctx>(async (_req, { user, params }) => {
  const { id } = await params!

  // Listing + reviews cache (60s)
  const baseData = await cached(`mp:detail:${id}`, 60, async () => {
    const listing = await db.marketplaceListing.findUnique({
      where: { id },
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
            coreValues: true,
          },
        },
        owner: {
          select: {
            id: true,
            creatorProfile: { select: { handle: true, tier: true, avatar: true, bio: true } },
          },
        },
      },
    })
    if (!listing) return null

    const reviews = await db.rentalAgreement.findMany({
      where: {
        characterId: listing.characterId,
        reviewByRenter: { not: null },
        ratingByRenter: { not: null },
      },
      orderBy: { endedAt: 'desc' },
      take: 10,
      select: {
        id: true,
        ratingByRenter: true,
        reviewScrubbed: true,
        reviewByRenter: true,
        endedAt: true,
      },
    })

    const activeRental = await db.rentalAgreement.count({
      where: { characterId: listing.characterId, status: 'active' },
    })

    return { listing, reviews, activeRental }
  })

  if (!baseData) return NextResponse.json({ error: 'Listing bulunamadı' }, { status: 404 })

  const { listing, reviews, activeRental } = baseData
  const isOwner = listing.owner.id === user.id

  // User-specific (cache dışı)
  const [demoSession, ownRental, wishlistEntry] = await Promise.all([
    db.characterDemoSession.findUnique({
      where: { characterId_userId: { characterId: listing.characterId, userId: user.id } },
    }),
    db.rentalAgreement.findFirst({
      where: { characterId: listing.characterId, renterId: user.id, status: 'active' },
    }),
    db.listingWishlist.findUnique({
      where: { userId_listingId: { userId: user.id, listingId: listing.id } },
    }),
  ])

  // View kaydet — sadece sahip değilse, 24h unique
  if (!isOwner) {
    const viewDate = new Date().toISOString().slice(0, 10) // YYYY-MM-DD
    try {
      await db.listingView.create({
        data: { listingId: listing.id, userId: user.id, viewDate },
      })
      // Yeni view sayıldı (unique today) — totalViews artır
      await db.marketplaceListing.update({
        where: { id: listing.id },
        data: { totalViews: { increment: 1 } },
      })
    } catch {
      // Unique constraint ihlali = bugün zaten görüntüledi, sayma
    }
  }

  return NextResponse.json({
    listing: {
      id: listing.id,
      characterId: listing.characterId,
      character: listing.character,
      ownerHandle: listing.owner.creatorProfile?.handle ?? null,
      ownerTier: listing.owner.creatorProfile?.tier ?? 'bronze',
      ownerBio: listing.owner.creatorProfile?.bio ?? null,
      rentPrice7d: listing.rentPrice7d,
      rentPrice14d: listing.rentPrice14d,
      rentPrice30d: listing.rentPrice30d,
      buyPrice: listing.buyPrice,
      buyEnabled: listing.buyEnabled,
      rentEnabled: listing.rentEnabled,
      concurrentLimit: listing.concurrentLimit,
      activeRentalCount: activeRental,
      averageRating: listing.averageRating,
      totalRentals: listing.totalRentals,
      isBoosted: listing.boostUntil ? listing.boostUntil > new Date() : false,
    },
    reviews: reviews.map((r) => ({
      id: r.id,
      rating: r.ratingByRenter,
      review: r.reviewScrubbed ?? r.reviewByRenter,
      endedAt: r.endedAt,
    })),
    userState: {
      hasActiveRental: !!ownRental,
      activeRentalId: ownRental?.id ?? null,
      demoMessagesUsed: demoSession?.messageCount ?? 0,
      demoEnded: !!demoSession?.endedAt,
      isOwner: listing.owner.id === user.id,
      isWishlisted: !!wishlistEntry,
    },
  })
})
