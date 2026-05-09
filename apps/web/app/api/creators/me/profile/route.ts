/**
 * V4.8 Faz F — Kendi yaratıcı profili
 *
 * GET   /api/creators/me/profile  → mevcut profil
 * PATCH /api/creators/me/profile  → bio/avatar güncelle
 *   Body: { bio?: string, avatar?: string }
 */

import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/api/with-auth'
import { db } from '@/lib/db/client'

const MAX_BIO = 280

export const GET = withAuth(async (_req, { user }) => {
  const profile = await db.creatorProfile.findUnique({ where: { userId: user.id } })
  if (!profile) return NextResponse.json({ error: 'Yaratıcı profili yok' }, { status: 404 })
  return NextResponse.json({
    handle: profile.handle,
    bio: profile.bio,
    avatar: profile.avatar,
    tier: profile.tier,
  })
})

export const PATCH = withAuth(async (req, { user }) => {
  const body = await req.json().catch(() => ({}))
  const bio = typeof body.bio === 'string' ? body.bio.trim().slice(0, MAX_BIO) : undefined
  const avatar = typeof body.avatar === 'string' ? body.avatar.trim() : undefined

  const profile = await db.creatorProfile.findUnique({ where: { userId: user.id } })
  if (!profile) return NextResponse.json({ error: 'Yaratıcı profili yok' }, { status: 404 })

  const updated = await db.creatorProfile.update({
    where: { userId: user.id },
    data: {
      ...(bio !== undefined ? { bio } : {}),
      ...(avatar !== undefined ? { avatar } : {}),
    },
  })

  return NextResponse.json({
    handle: updated.handle,
    bio: updated.bio,
    avatar: updated.avatar,
    tier: updated.tier,
  })
})
