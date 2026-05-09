/**
 * V4.8 Faz F — Yaratıcı şikayeti
 *
 * POST /api/creators/[handle]/report
 *   Body: { reason: string, detail?: string }
 */

import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/api/with-auth'
import { db } from '@/lib/db/client'

type Ctx = { params: Promise<{ handle: string }> }

const VALID_REASONS = new Set([
  'real_person',
  'nsfw',
  'harassment',
  'low_quality',
  'copy_claim',
  'other',
])

export const POST = withAuth<Ctx>(async (req, { user, params }) => {
  const { handle } = await params!
  if (!handle) return NextResponse.json({ error: 'handle gerekli' }, { status: 400 })

  const body = await req.json().catch(() => ({}))
  const reason = typeof body.reason === 'string' ? body.reason : null
  const detail = typeof body.detail === 'string' ? body.detail.trim().slice(0, 1000) : null
  if (!reason || !VALID_REASONS.has(reason)) {
    return NextResponse.json({ error: 'Geçersiz sebep' }, { status: 400 })
  }

  const profile = await db.creatorProfile.findUnique({
    where: { handle },
    select: { userId: true },
  })
  if (!profile) return NextResponse.json({ error: 'Bulunamadı' }, { status: 404 })
  if (profile.userId === user.id) {
    return NextResponse.json({ error: 'Kendini şikayet edemezsin' }, { status: 400 })
  }

  // Aynı kullanıcı son 24 saatte aynı yaratıcıyı zaten şikayet ettiyse spam'e dönüştürme
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000)
  const recent = await db.creatorReport.findFirst({
    where: {
      reporterId: user.id,
      reportedUserId: profile.userId,
      createdAt: { gt: since },
    },
  })
  if (recent) {
    return NextResponse.json({ ok: true, alreadyReported: true })
  }

  await db.creatorReport.create({
    data: {
      reporterId: user.id,
      reportedUserId: profile.userId,
      scope: 'creator',
      reason,
      detail,
    },
  })

  return NextResponse.json({ ok: true })
})
