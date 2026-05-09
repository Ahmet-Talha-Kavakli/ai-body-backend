/**
 * V4.6 Faz 6 — M75 Status (Story) Sistemi
 *
 * POST   /api/assistant/status            — Kullanıcı status atar
 * DELETE /api/assistant/status?id=xxx     — Kullanıcı kendi status'ünü siler
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { withAuth } from '@/lib/api/with-auth'

const STATUS_TTL_MS = 24 * 60 * 60 * 1000

export const POST = withAuth(async (req: NextRequest, { user }) => {
  const body = await req.json().catch(() => ({}))
  const { contentType, mediaUrl, caption, bgColor, hiddenFromCharacterIds } = body as {
    contentType?: 'photo' | 'text'
    mediaUrl?: string
    caption?: string
    bgColor?: string
    hiddenFromCharacterIds?: string[]
  }

  if (contentType !== 'photo' && contentType !== 'text') {
    return NextResponse.json({ error: 'invalid_content_type' }, { status: 400 })
  }
  if (contentType === 'photo' && !mediaUrl) {
    return NextResponse.json({ error: 'media_url_required' }, { status: 400 })
  }
  if (contentType === 'text' && !caption?.trim()) {
    return NextResponse.json({ error: 'caption_required' }, { status: 400 })
  }

  const now = new Date()
  const status = await db.status.create({
    data: {
      authorType: 'user',
      authorUserId: user.id,
      contentType,
      mediaUrl: mediaUrl || null,
      caption: caption?.trim() || null,
      bgColor: bgColor || null,
      hiddenFrom: Array.isArray(hiddenFromCharacterIds) ? hiddenFromCharacterIds : [],
      createdAt: now,
      expiresAt: new Date(now.getTime() + STATUS_TTL_MS),
    },
  })

  return NextResponse.json({ status })
})

export const DELETE = withAuth(async (req: NextRequest, { user }) => {
  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id_required' }, { status: 400 })

  const status = await db.status.findUnique({ where: { id } })
  if (!status || status.authorType !== 'user' || status.authorUserId !== user.id) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 })
  }

  await db.status.delete({ where: { id } })
  return NextResponse.json({ ok: true })
})
