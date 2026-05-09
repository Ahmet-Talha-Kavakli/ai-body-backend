/**
 * V4.8 Faz F — Kira süresini uzat
 *
 * GET /api/marketplace/rentals/[id]/extend  → mevcut kira durumu + uzatma seçenekleri (fiyatlar)
 * POST /api/marketplace/rentals/[id]/extend → uzat
 *   Body: { type: 'rent_7d' | 'rent_14d' | 'rent_30d' }
 *
 * Uzatma:
 *   - Kira aktif olmalı
 *   - Aynı listing'in fiyatlarıyla yeni süre satın alınır
 *   - endsAt += yeni gün sayısı
 *   - Aynı RentalAgreement güncellenir (yeni record yok), sahip komisyonu alır
 */

import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/api/with-auth'
import { db } from '@/lib/db/client'
import { processRentalPayment, getUserBalance } from '@/lib/marketplace/credit-ledger'

type Ctx = { params: Promise<{ id: string }> }

const EXTEND_DAYS: Record<string, number> = {
  rent_7d: 7,
  rent_14d: 14,
  rent_30d: 30,
}

export const GET = withAuth<Ctx>(async (_req, { user, params }) => {
  const { id } = await params!
  const rental = await db.rentalAgreement.findUnique({
    where: { id },
    include: {
      listing: {
        select: { rentPrice7d: true, rentPrice14d: true, rentPrice30d: true, rentEnabled: true },
      },
    },
  })
  if (!rental) return NextResponse.json({ error: 'Kira bulunamadı' }, { status: 404 })
  if (rental.renterId !== user.id) {
    return NextResponse.json({ error: 'Yetkisiz' }, { status: 403 })
  }
  if (rental.status !== 'active') {
    return NextResponse.json({ error: 'Sadece aktif kira uzatılabilir' }, { status: 400 })
  }
  if (!rental.listing.rentEnabled) {
    return NextResponse.json({ error: 'Listing artık kiralanmıyor' }, { status: 410 })
  }

  const balance = await getUserBalance(user.id)
  const options = [
    { type: 'rent_7d', days: 7, price: rental.listing.rentPrice7d },
    { type: 'rent_14d', days: 14, price: rental.listing.rentPrice14d },
    { type: 'rent_30d', days: 30, price: rental.listing.rentPrice30d },
  ].filter((o) => o.price != null)

  return NextResponse.json({
    balance,
    currentEndsAt: rental.endsAt,
    options,
  })
})

export const POST = withAuth<Ctx>(async (req, { user, params }) => {
  const { id } = await params!
  const body = await req.json().catch(() => ({}))
  const type = body.type as 'rent_7d' | 'rent_14d' | 'rent_30d' | undefined
  if (!type || !EXTEND_DAYS[type]) {
    return NextResponse.json({ error: 'Geçersiz uzatma tipi' }, { status: 400 })
  }

  const rental = await db.rentalAgreement.findUnique({
    where: { id },
    include: {
      listing: {
        select: { rentPrice7d: true, rentPrice14d: true, rentPrice30d: true, rentEnabled: true },
      },
    },
  })
  if (!rental) return NextResponse.json({ error: 'Kira bulunamadı' }, { status: 404 })
  if (rental.renterId !== user.id) {
    return NextResponse.json({ error: 'Yetkisiz' }, { status: 403 })
  }
  if (rental.status !== 'active') {
    return NextResponse.json({ error: 'Sadece aktif kira uzatılabilir' }, { status: 400 })
  }
  if (!rental.listing.rentEnabled) {
    return NextResponse.json({ error: 'Listing artık kiralanmıyor' }, { status: 410 })
  }

  const priceField =
    type === 'rent_7d'
      ? rental.listing.rentPrice7d
      : type === 'rent_14d'
        ? rental.listing.rentPrice14d
        : rental.listing.rentPrice30d
  if (!priceField) {
    return NextResponse.json({ error: 'Bu süre için fiyat tanımlı değil' }, { status: 400 })
  }

  const days = EXTEND_DAYS[type]
  const baseTime =
    rental.endsAt && rental.endsAt > new Date() ? rental.endsAt.getTime() : Date.now()
  const newEndsAt = new Date(baseTime + days * 24 * 60 * 60 * 1000)

  const payment = await processRentalPayment(user.id, rental.ownerId, priceField, {
    rentalId: rental.id,
    listingId: rental.listingId,
  })
  if (!payment.ok) {
    return NextResponse.json({ error: payment.reason }, { status: 402 })
  }

  await db.rentalAgreement.update({
    where: { id: rental.id },
    data: {
      endsAt: newEndsAt,
      costCredits: rental.costCredits + priceField,
      ownerCredits: rental.ownerCredits + payment.ownerEarning,
    },
  })

  // Listing istatistikleri
  await db.marketplaceListing.update({
    where: { id: rental.listingId },
    data: {
      totalEarnings: { increment: payment.ownerEarning },
    },
  })

  const newBalance = await getUserBalance(user.id)

  return NextResponse.json({
    ok: true,
    endsAt: newEndsAt,
    addedDays: days,
    cost: priceField,
    balance: newBalance,
  })
})
