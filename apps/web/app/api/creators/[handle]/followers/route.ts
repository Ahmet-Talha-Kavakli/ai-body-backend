/**
 * V4.8 Faz F — Yaratıcı takipçi listesi (sadece sahip görür)
 *
 * GET /api/creators/[handle]/followers
 */

import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/api/with-auth'
import { db } from '@/lib/db/client'

type Ctx = { params: Promise<{ handle: string }> }

export const GET = withAuth<Ctx>(async (_req, { user, params }) => {
  const { handle } = await params!
  if (!handle) return NextResponse.json({ error: 'handle gerekli' }, { status: 400 })

  const profile = await db.creatorProfile.findUnique({
    where: { handle },
    select: { userId: true },
  })
  if (!profile) return NextResponse.json({ error: 'Bulunamadı' }, { status: 404 })
  if (profile.userId !== user.id) {
    return NextResponse.json({ error: 'Yetkisiz' }, { status: 403 })
  }

  const followers = await db.creatorFollow.findMany({
    where: { creatorId: user.id },
    orderBy: { createdAt: 'desc' },
    take: 200,
    include: {
      follower: {
        select: {
          id: true,
          creatorProfile: {
            select: { handle: true, avatar: true, tier: true },
          },
        },
      },
    },
  })

  return NextResponse.json({
    followers: followers.map((f) => ({
      handle: f.follower.creatorProfile?.handle ?? null,
      avatar: f.follower.creatorProfile?.avatar ?? null,
      tier: f.follower.creatorProfile?.tier ?? null,
      followedAt: f.createdAt,
      notifyOnNew: f.notifyOnNew,
    })),
    total: followers.length,
  })
})
