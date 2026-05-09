/**
 * V4.8 Faz E — Keşfet pass (sola swipe → 7 gün gizle)
 *
 * POST /api/marketplace/discover/pass  Body: { listingId }
 *   Pass'i upsert eder, expiresAt=+7 gün
 * DELETE /api/marketplace/discover/pass?listingId=...
 *   Pass'i geri alır (kullanıcı "geri al" derse)
 */

import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/api/with-auth'
import { db } from '@/lib/db/client'

const PASS_DURATION_MS = 7 * 24 * 60 * 60 * 1000

export const POST = withAuth(async (req: NextRequest, { user }) => {
  const body = await req.json().catch(() => ({}))
  const listingId = body.listingId as string | undefined
  if (!listingId) return NextResponse.json({ error: 'listingId gerekli' }, { status: 400 })

  const expiresAt = new Date(Date.now() + PASS_DURATION_MS)

  await db.listingPass.upsert({
    where: { userId_listingId: { userId: user.id, listingId } },
    update: { expiresAt },
    create: { userId: user.id, listingId, expiresAt },
  })

  return NextResponse.json({ ok: true, expiresAt })
})

export const DELETE = withAuth(async (req: NextRequest, { user }) => {
  const listingId = req.nextUrl.searchParams.get('listingId')

  if (listingId) {
    await db.listingPass.deleteMany({ where: { userId: user.id, listingId } })
  } else {
    // listingId yoksa kullanıcının tüm pass'lerini sıfırla (Keşfet "Yenile")
    await db.listingPass.deleteMany({ where: { userId: user.id } })
  }

  return NextResponse.json({ ok: true })
})
