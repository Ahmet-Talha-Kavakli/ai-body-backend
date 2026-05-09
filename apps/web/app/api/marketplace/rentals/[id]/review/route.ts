/**
 * V4.8 Faz E — Kira Yorumu Bırak
 *
 * POST /api/marketplace/rentals/:id/review
 * Body: { rating: 1-5, review?: string }
 *
 * Sadece expired/completed rental için, sadece renter, 1 kez.
 * reviewByRenter = raw, reviewScrubbed = LLM ile spoiler temizlendi.
 */

import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/api/with-auth'
import { db } from '@/lib/db/client'
import OpenAI from 'openai'

const openai = new OpenAI()

type Ctx = { params: Promise<{ id: string }> }

export const POST = withAuth<Ctx>(async (req, { user, params }) => {
  const { id } = await params!
  const body = await req.json().catch(() => ({}))
  const rating = body.rating
  const review = body.review?.trim() ?? null

  if (!rating || typeof rating !== 'number' || rating < 1 || rating > 5) {
    return NextResponse.json({ error: 'rating 1-5 olmalı' }, { status: 400 })
  }
  if (review && (typeof review !== 'string' || review.length > 500)) {
    return NextResponse.json({ error: 'review en fazla 500 karakter' }, { status: 400 })
  }

  const rental = await db.rentalAgreement.findFirst({
    where: { id, renterId: user.id },
    select: { id: true, characterId: true, status: true, ratingByRenter: true },
  })
  if (!rental) return NextResponse.json({ error: 'Kira bulunamadı' }, { status: 404 })
  if (rental.ratingByRenter != null) {
    return NextResponse.json({ error: 'Zaten yorum bıraktın' }, { status: 409 })
  }
  if (rental.status === 'active') {
    return NextResponse.json({ error: 'Kira henüz aktif, sonra yorum bırak' }, { status: 400 })
  }

  // Spoiler scrub LLM (review varsa)
  let scrubbed: string | null = null
  if (review) {
    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        temperature: 0.2,
        messages: [
          {
            role: 'system',
            content: `Karakter kira yorumlarını genelleştirmek için spoiler scrub yap.
Kişisel hikaye detaylarını ("Faruk'la şu olayı yaşadık", "bana şunu söyledi") genelleştir ("güçlü drama yaşadık", "samimi konuşmalar oldu").
Karakterin kişiliği/tarzı hakkındaki yorum kalır, spesifik olay detayları yumuşatılır.
Yıldız puanı/duygu kalır. Türkçe.`,
          },
          { role: 'user', content: review },
        ],
        max_tokens: 200,
      })
      scrubbed = completion.choices[0]?.message?.content?.trim() ?? null
    } catch (e) {
      console.error('[review-scrub] error', e)
      scrubbed = review // scrub başarısızsa raw kalır
    }
  }

  await db.rentalAgreement.update({
    where: { id },
    data: {
      ratingByRenter: rating,
      reviewByRenter: review,
      reviewScrubbed: scrubbed,
    },
  })

  // Listing average rating güncelle
  const listingAgg = await db.rentalAgreement.aggregate({
    where: { characterId: rental.characterId, ratingByRenter: { not: null } },
    _avg: { ratingByRenter: true },
    _count: { ratingByRenter: true },
  })
  const avgRating = listingAgg._avg.ratingByRenter ?? 0
  await db.marketplaceListing.updateMany({
    where: { characterId: rental.characterId },
    data: { averageRating: avgRating },
  })

  return NextResponse.json({ ok: true, averageRating: avgRating })
})
