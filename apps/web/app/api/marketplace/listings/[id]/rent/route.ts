/**
 * V4.8 Faz D — Kira Akışı
 *
 * POST /api/marketplace/listings/:id/rent
 * Body: { type: 'rent_7d' | 'rent_14d' | 'rent_30d' | 'outright_buy' }
 *
 * Concurrent limit kontrolü, ödeme, RentalAgreement create.
 * Karakter kullanıcının sohbet listesine eklenir (mevcut Character.userId paterni ile).
 */

import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/api/with-auth'
import { db } from '@/lib/db/client'
import { processRentalPayment } from '@/lib/marketplace/credit-ledger'

type Ctx = { params: Promise<{ id: string }> }

const RENTAL_DURATIONS: Record<string, number> = {
  // V4.8 Faz E — minimum 14 gün (Talha kararı)
  rent_14d: 14,
  rent_30d: 30,
}

export const POST = withAuth<Ctx>(async (req, { user, params }) => {
  const { id } = await params!
  const body = await req.json().catch(() => ({}))
  const type = body.type as 'rent_7d' | 'rent_14d' | 'rent_30d' | 'outright_buy'

  if (!type || (!RENTAL_DURATIONS[type] && type !== 'outright_buy')) {
    return NextResponse.json({ error: 'Geçersiz kira tipi' }, { status: 400 })
  }

  const listing = await db.marketplaceListing.findUnique({
    where: { id },
    include: {
      character: {
        select: { id: true, name: true, isRetired: true, publishStatus: true, userId: true },
      },
    },
  })
  if (!listing) return NextResponse.json({ error: 'Listing bulunamadı' }, { status: 404 })
  if (listing.character.isRetired || listing.character.publishStatus !== 'published') {
    return NextResponse.json({ error: 'Bu karakter şu an satışta değil' }, { status: 410 })
  }

  if (type === 'outright_buy' && (!listing.buyEnabled || !listing.buyPrice)) {
    return NextResponse.json({ error: 'Bu karakter satılmıyor' }, { status: 400 })
  }
  if (type !== 'outright_buy' && !listing.rentEnabled) {
    return NextResponse.json({ error: 'Bu karakter kiralanmıyor' }, { status: 400 })
  }
  if (listing.ownerId === user.id) {
    return NextResponse.json({ error: 'Kendi karakterini kiralayamazsın' }, { status: 400 })
  }

  // Zaten aktif kira var mı?
  const existingRental = await db.rentalAgreement.findFirst({
    where: { characterId: listing.characterId, renterId: user.id, status: 'active' },
  })
  if (existingRental) {
    return NextResponse.json({ error: 'Bu karakteri zaten kullanıyorsun' }, { status: 409 })
  }

  // Concurrent limit kontrolü (sadece kira için)
  if (type !== 'outright_buy') {
    const activeCount = await db.rentalAgreement.count({
      where: { characterId: listing.characterId, status: 'active' },
    })
    if (activeCount >= listing.concurrentLimit) {
      return NextResponse.json(
        { error: 'Karakter şu an kapasite dolu, yakında boşalacak' },
        { status: 423 }
      )
    }
  }

  // Fiyat hesabı
  let cost = 0
  let endsAt: Date | null = null
  if (type === 'outright_buy') {
    cost = listing.buyPrice!
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

  // Ödeme + agreement create transaction
  const startedAt = new Date()
  const rental = await db.rentalAgreement.create({
    data: {
      listingId: listing.id,
      characterId: listing.characterId,
      renterId: user.id,
      ownerId: listing.ownerId,
      type,
      startedAt,
      endsAt,
      costCredits: cost,
      ownerCredits: 0, // Aşağıda payment ile güncellenecek
      status: 'active',
    },
  })

  const payment = await processRentalPayment(user.id, listing.ownerId, cost, {
    rentalId: rental.id,
    listingId: listing.id,
  })

  if (!payment.ok) {
    // Rollback rental
    await db.rentalAgreement.delete({ where: { id: rental.id } })
    return NextResponse.json({ error: payment.reason }, { status: 402 })
  }

  // ownerCredits güncelle
  await db.rentalAgreement.update({
    where: { id: rental.id },
    data: { ownerCredits: payment.ownerEarning },
  })

  // Listing istatistik güncelle
  await db.marketplaceListing.update({
    where: { id: listing.id },
    data: {
      totalRentals: { increment: 1 },
      totalEarnings: { increment: payment.ownerEarning },
    },
  })

  // Outright buy ise: karakterin sahibi yeni kullanıcı olur
  if (type === 'outright_buy') {
    await db.character.update({
      where: { id: listing.characterId },
      data: { userId: user.id, creatorId: user.id }, // Mirası transfer
    })
    // Listing pasifleştir (artık başkası satamaz)
    await db.marketplaceListing.update({
      where: { id: listing.id },
      data: { rentEnabled: false, buyEnabled: false },
    })
  } else {
    // Kira: karakter clone'u kullanıcı için oluşmaz; karakter aynı kalır,
    // RentalAgreement üzerinden erişim kontrol edilir.
    // V4.5 sohbet/cron sistemi `userId` ile filter yapıyor, bu yüzden RentalAgreement
    // üzerinden ekstra entegrasyon gerek (Faz B sonraki dalga).
  }

  return NextResponse.json({
    rental: {
      id: rental.id,
      type,
      startedAt,
      endsAt,
      costCredits: cost,
    },
    balance: payment.ok
      ? (await import('@/lib/marketplace/credit-ledger')).getUserBalance(user.id)
      : null,
  })
})
