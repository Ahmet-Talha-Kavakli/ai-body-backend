/**
 * V4.8 Faz E — Kullanıcının kiraları (aktif + geçmiş)
 *
 * GET /api/marketplace/rentals/mine
 * Aktif kiralar + henüz yorum bırakılmamış expired kiralar.
 */

import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/api/with-auth'
import { db } from '@/lib/db/client'

export const GET = withAuth(async (_req: NextRequest, { user }) => {
  const rentals = await db.rentalAgreement.findMany({
    where: { renterId: user.id },
    orderBy: { startedAt: 'desc' },
    take: 50,
    include: {
      character: {
        select: { id: true, name: true, avatarUrl: true, category: true },
      },
    },
  })

  return NextResponse.json({
    active: rentals.filter((r) => r.status === 'active').map(formatRental),
    pendingReview: rentals
      .filter((r) => r.status !== 'active' && r.ratingByRenter == null)
      .map(formatRental),
    history: rentals
      .filter((r) => r.status !== 'active' && r.ratingByRenter != null)
      .map(formatRental),
  })
})

function formatRental(r: any) {
  return {
    id: r.id,
    character: r.character,
    type: r.type,
    startedAt: r.startedAt,
    endsAt: r.endsAt,
    endedAt: r.endedAt,
    status: r.status,
    rating: r.ratingByRenter,
  }
}
