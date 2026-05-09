/**
 * V4.8 Faz E — Kira Hediye Et
 *
 * POST /api/marketplace/listings/:id/gift
 * Body: { recipientHandle: string, type: RentalType, message?: string }
 *
 * Gönderen ödeme yapar, alıcı için aktif kira oluşur.
 */

import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/api/with-auth'
import { db } from '@/lib/db/client'
import { processRentalPayment } from '@/lib/marketplace/credit-ledger'

type Ctx = { params: Promise<{ id: string }> }

const RENTAL_DURATIONS: Record<string, number> = {
  // V4.8 Faz E — minimum 14 gün
  rent_14d: 14,
  rent_30d: 30,
}

export const POST = withAuth<Ctx>(async (req, { user, params }) => {
  const { id } = await params!
  const body = await req.json().catch(() => ({}))
  const recipientHandle = body.recipientHandle?.trim().replace(/^@/, '')
  const type = body.type as 'rent_7d' | 'rent_14d' | 'rent_30d' | 'outright_buy'
  const message = body.message?.trim() ?? null

  if (!recipientHandle) return NextResponse.json({ error: 'Alıcı handle gerekli' }, { status: 400 })
  if (!type || (!RENTAL_DURATIONS[type] && type !== 'outright_buy')) {
    return NextResponse.json({ error: 'Geçersiz kira tipi' }, { status: 400 })
  }

  // Alıcıyı bul
  const recipientProfile = await db.creatorProfile.findUnique({
    where: { handle: recipientHandle },
    select: { userId: true },
  })
  if (!recipientProfile) {
    return NextResponse.json(
      { error: `@${recipientHandle} kullanıcısı bulunamadı` },
      { status: 404 }
    )
  }
  const recipientId = recipientProfile.userId
  if (recipientId === user.id) {
    return NextResponse.json({ error: 'Kendine hediye edemezsin' }, { status: 400 })
  }

  // Listing
  const listing = await db.marketplaceListing.findUnique({
    where: { id },
    include: {
      character: { select: { id: true, name: true, isRetired: true, publishStatus: true } },
    },
  })
  if (!listing) return NextResponse.json({ error: 'Listing bulunamadı' }, { status: 404 })
  if (listing.character.isRetired || listing.character.publishStatus !== 'published') {
    return NextResponse.json({ error: 'Bu karakter şu an satışta değil' }, { status: 410 })
  }
  if (listing.ownerId === recipientId) {
    return NextResponse.json({ error: 'Alıcı zaten karakterin sahibi' }, { status: 400 })
  }

  // Aktif kira kontrol
  const existingRental = await db.rentalAgreement.findFirst({
    where: { characterId: listing.characterId, renterId: recipientId, status: 'active' },
  })
  if (existingRental) {
    return NextResponse.json({ error: 'Alıcı bu karakteri zaten kullanıyor' }, { status: 409 })
  }

  // Concurrent limit
  if (type !== 'outright_buy') {
    const activeCount = await db.rentalAgreement.count({
      where: { characterId: listing.characterId, status: 'active' },
    })
    if (activeCount >= listing.concurrentLimit) {
      return NextResponse.json({ error: 'Karakter kapasite dolu' }, { status: 423 })
    }
  }

  let cost = 0
  let endsAt: Date | null = null
  if (type === 'outright_buy') {
    if (!listing.buyEnabled || !listing.buyPrice) {
      return NextResponse.json({ error: 'Bu karakter satılmıyor' }, { status: 400 })
    }
    cost = listing.buyPrice
  } else {
    const days = RENTAL_DURATIONS[type]
    const priceField =
      type === 'rent_7d'
        ? listing.rentPrice7d
        : type === 'rent_14d'
          ? listing.rentPrice14d
          : listing.rentPrice30d
    if (!priceField)
      return NextResponse.json({ error: 'Bu süre için fiyat ayarlanmamış' }, { status: 400 })
    cost = priceField
    endsAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000)
  }

  const startedAt = new Date()
  const rental = await db.rentalAgreement.create({
    data: {
      listingId: listing.id,
      characterId: listing.characterId,
      renterId: recipientId,
      ownerId: listing.ownerId,
      type,
      startedAt,
      endsAt,
      costCredits: cost,
      ownerCredits: 0,
      status: 'active',
    },
  })

  // Ödemeyi gönderici yapar
  const payment = await processRentalPayment(user.id, listing.ownerId, cost, {
    rentalId: rental.id,
    listingId: listing.id,
  })

  if (!payment.ok) {
    await db.rentalAgreement.delete({ where: { id: rental.id } })
    return NextResponse.json({ error: payment.reason }, { status: 402 })
  }

  await db.rentalAgreement.update({
    where: { id: rental.id },
    data: { ownerCredits: payment.ownerEarning },
  })
  await db.marketplaceListing.update({
    where: { id: listing.id },
    data: {
      totalRentals: { increment: 1 },
      totalEarnings: { increment: payment.ownerEarning },
    },
  })

  if (type === 'outright_buy') {
    await db.character.update({
      where: { id: listing.characterId },
      data: { userId: recipientId, creatorId: recipientId },
    })
    await db.marketplaceListing.update({
      where: { id: listing.id },
      data: { rentEnabled: false, buyEnabled: false },
    })
  }

  // TODO: alıcıya push notif (gönderici handle + mesaj). Şimdilik log.
  console.log(
    `[gift] @${recipientHandle} received ${listing.character.name} from ${user.id}`,
    message
  )

  return NextResponse.json({
    rental: { id: rental.id, type, startedAt, endsAt, costCredits: cost },
    recipient: { handle: recipientHandle },
  })
})
