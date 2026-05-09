/**
 * V4.8 Faz F — Yaratıcı takip toggle + bildirim tercihi
 *
 * POST /api/creators/[handle]/follow         → toggle follow
 *   Body: { notifyOnNew?: boolean } — opsiyonel, sadece güncelleme için
 *
 * Yanıt: { following: boolean, followerCount: number, notifyOnNew: boolean }
 */

import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/api/with-auth'
import { db } from '@/lib/db/client'

type Ctx = { params: Promise<{ handle: string }> }

export const POST = withAuth<Ctx>(async (req, { user, params }) => {
  const { handle } = await params!
  if (!handle) return NextResponse.json({ error: 'handle gerekli' }, { status: 400 })

  const profile = await db.creatorProfile.findUnique({
    where: { handle },
    select: { userId: true },
  })
  if (!profile) return NextResponse.json({ error: 'Bulunamadı' }, { status: 404 })
  if (profile.userId === user.id) {
    return NextResponse.json({ error: 'Kendini takip edemezsin' }, { status: 400 })
  }

  const body = await req.json().catch(() => ({}))
  const notifyOnNew = typeof body.notifyOnNew === 'boolean' ? body.notifyOnNew : undefined

  const existing = await db.creatorFollow.findUnique({
    where: { followerId_creatorId: { followerId: user.id, creatorId: profile.userId } },
  })

  let following: boolean
  let resolvedNotify = true

  if (existing) {
    if (notifyOnNew !== undefined) {
      // Sadece bildirim tercihini güncelle, takibi bırakma
      const updated = await db.creatorFollow.update({
        where: { followerId_creatorId: { followerId: user.id, creatorId: profile.userId } },
        data: { notifyOnNew },
      })
      following = true
      resolvedNotify = updated.notifyOnNew
    } else {
      await db.creatorFollow.delete({
        where: { followerId_creatorId: { followerId: user.id, creatorId: profile.userId } },
      })
      await db.creatorProfile.update({
        where: { userId: profile.userId },
        data: { followerCount: { decrement: 1 } },
      })
      following = false
    }
  } else {
    const created = await db.creatorFollow.create({
      data: {
        followerId: user.id,
        creatorId: profile.userId,
        notifyOnNew: notifyOnNew ?? true,
      },
    })
    await db.creatorProfile.update({
      where: { userId: profile.userId },
      data: { followerCount: { increment: 1 } },
    })
    following = true
    resolvedNotify = created.notifyOnNew
  }

  const followerCount = await db.creatorFollow.count({ where: { creatorId: profile.userId } })

  return NextResponse.json({ following, followerCount, notifyOnNew: resolvedNotify })
})
