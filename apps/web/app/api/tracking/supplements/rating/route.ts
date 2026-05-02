import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/api/with-auth'
import { db } from '@/lib/db/client'

// GET — kullanıcının tüm supplementleri için en son rating
export const GET = withAuth(async (_req: NextRequest, { user }) => {
  const ratings = await db.supplementEffectRating.findMany({
    where: { userId: user.id },
    orderBy: { ratedAt: 'desc' },
    select: { supplementId: true, rating: true, note: true, ratedAt: true },
  })

  // Her supplement için en son rating
  const latest: Record<string, { rating: number; note: string | null; ratedAt: string }> = {}
  for (const r of ratings) {
    if (!latest[r.supplementId]) {
      latest[r.supplementId] = {
        rating: r.rating,
        note: r.note,
        ratedAt: r.ratedAt.toISOString(),
      }
    }
  }

  return NextResponse.json({ ratings: latest })
})

// POST — yeni rating kaydet
export const POST = withAuth(async (req: NextRequest, { user }) => {
  const { supplementId, rating, note } = await req.json()

  if (!supplementId || typeof rating !== 'number' || rating < 1 || rating > 5) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }

  // Supplement kullanıcıya ait mi?
  const supplement = await db.supplement.findFirst({
    where: { id: supplementId, userId: user.id },
  })
  if (!supplement) {
    return NextResponse.json({ error: 'Supplement not found' }, { status: 404 })
  }

  const result = await db.supplementEffectRating.create({
    data: { userId: user.id, supplementId, rating, note: note ?? null },
  })

  return NextResponse.json({ id: result.id, rating: result.rating })
})
