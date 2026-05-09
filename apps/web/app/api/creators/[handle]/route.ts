/**
 * V4.8 Faz F — Yaratıcı profili
 *
 * GET /api/creators/[handle]
 *
 * Profil sayfası kapısı: yaratıcının yayınlanmış karakter sayısı < 3 VE
 * takipçi sayısı < 10 ise 404 (kapı açılmamış).
 */

import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/api/with-auth'
import { db } from '@/lib/db/client'

type Ctx = { params: Promise<{ handle: string }> }

const PROFILE_GATE_MIN_CHARS = 3
const PROFILE_GATE_MIN_FOLLOWERS = 10

export const GET = withAuth<Ctx>(async (_req, { user, params }) => {
  const { handle } = await params!
  if (!handle) return NextResponse.json({ error: 'handle gerekli' }, { status: 400 })

  const profile = await db.creatorProfile.findUnique({
    where: { handle },
    include: {
      user: { select: { id: true } },
    },
  })
  if (!profile) return NextResponse.json({ error: 'Bulunamadı' }, { status: 404 })

  // Yayınlanmış karakter sayısı (Marketplace'te aktif)
  const publishedCount = await db.marketplaceListing.count({
    where: {
      ownerId: profile.userId,
      character: { publishStatus: 'published', isRetired: false },
    },
  })

  const followerCount = await db.creatorFollow.count({
    where: { creatorId: profile.userId },
  })

  // Profil kapısı: kendi profilin her zaman açık, başkası gate uygular
  const isSelf = profile.userId === user.id
  if (
    !isSelf &&
    publishedCount < PROFILE_GATE_MIN_CHARS &&
    followerCount < PROFILE_GATE_MIN_FOLLOWERS
  ) {
    return NextResponse.json({ error: 'Profil henüz açılmamış' }, { status: 404 })
  }

  // Yaratıcının yayınladığı karakterler
  const listings = await db.marketplaceListing.findMany({
    where: {
      ownerId: profile.userId,
      character: { publishStatus: 'published', isRetired: false },
    },
    orderBy: { publishedAt: 'desc' },
    take: 30,
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
    },
  })

  // Takip durumu (kullanıcı bu yaratıcıyı takip ediyor mu)
  const followRow = await db.creatorFollow.findUnique({
    where: { followerId_creatorId: { followerId: user.id, creatorId: profile.userId } },
  })

  return NextResponse.json({
    handle: profile.handle,
    bio: profile.bio,
    avatar: profile.avatar,
    tier: profile.tier,
    totalCharacters: publishedCount,
    followerCount,
    isSelf,
    isFollowing: !!followRow,
    notifyOnNew: followRow?.notifyOnNew ?? false,
    listings: listings.map((l) => ({
      id: l.id,
      character: l.character,
      rentPrice7d: l.rentPrice7d,
      rentPrice30d: l.rentPrice30d,
      averageRating: l.averageRating,
      totalRentals: l.totalRentals,
    })),
  })
})
