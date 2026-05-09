/**
 * V4.8 Faz F — Kirayı erken bitir
 *
 * POST /api/marketplace/rentals/[id]/end-early
 *
 * Kullanıcı kalan günü kullanmadan kirayı bitirir.
 *   - İade YOK (Apple iAP/Spotify paterni — ödediği gibi kalan zaman tüketilmemiş sayılır)
 *   - status='cancelled', endedAt=now, endReason='cancelled'
 *   - Hafıza KAPSÜLLENİR (ileride tekrar kiralarsa devam etsin diye)
 *     → mevcut sistem zaten kapsülleme yapıyor (memory tablosu, Character.userId)
 *   - Sahip komisyonu zaten alındı, kalmaz
 */

import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/api/with-auth'
import { db } from '@/lib/db/client'

type Ctx = { params: Promise<{ id: string }> }

export const POST = withAuth<Ctx>(async (_req, { user, params }) => {
  const { id } = await params!

  const rental = await db.rentalAgreement.findUnique({
    where: { id },
    select: { id: true, renterId: true, status: true, characterId: true },
  })
  if (!rental) return NextResponse.json({ error: 'Kira bulunamadı' }, { status: 404 })
  if (rental.renterId !== user.id) {
    return NextResponse.json({ error: 'Yetkisiz' }, { status: 403 })
  }
  if (rental.status !== 'active') {
    return NextResponse.json({ error: 'Sadece aktif kira erken bitirilebilir' }, { status: 400 })
  }

  await db.rentalAgreement.update({
    where: { id: rental.id },
    data: {
      status: 'cancelled',
      endedAt: new Date(),
      endReason: 'cancelled',
    },
  })

  return NextResponse.json({ ok: true, characterId: rental.characterId })
})
