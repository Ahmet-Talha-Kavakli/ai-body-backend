/**
 * V4.8 Faz D — Kira Süresi Sona Eren Anlaşmaları İşle
 *
 * Saatlik cron. Her aktif rental için:
 *   - endsAt geçmişse → status='expired', endedAt=now, endReason='expired'
 *   - CharacterRelationshipMemory.sealed=true (kiralayanın hafızası kapsüllenir)
 *   - Demo sessions temizlenir (varsa)
 *   - Yaratıcıya rapor: kullanıcı puanı, mesaj sayısı, kira süresi
 *
 * vercel.json schedule: { "path": "/api/cron/rental-expiry-checker", "schedule": "0 * * * *" }
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization')
  const expected = `Bearer ${process.env.CRON_SECRET}`
  if (auth !== expected && process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const now = new Date()
  const expiringRentals = await db.rentalAgreement.findMany({
    where: {
      status: 'active',
      type: { not: 'outright_buy' },
      endsAt: { lte: now },
    },
    select: {
      id: true,
      characterId: true,
      renterId: true,
      ownerId: true,
      startedAt: true,
      endsAt: true,
    },
    take: 50,
  })

  let sealed = 0
  let processed = 0

  for (const rental of expiringRentals) {
    try {
      // 1. Rental status update
      await db.rentalAgreement.update({
        where: { id: rental.id },
        data: {
          status: 'expired',
          endedAt: now,
          endReason: 'expired',
        },
      })

      // 2. CharacterRelationshipMemory seal (kiralayanın bu karakterle yaşadıkları)
      const result = await db.characterRelationshipMemory.updateMany({
        where: {
          characterId: rental.characterId,
          userId: rental.renterId,
          sealed: false,
        },
        data: {
          sealed: true,
          sealedAt: now,
        },
      })
      sealed += result.count

      processed++
    } catch (e) {
      console.error('[rental-expiry-checker] error', rental.id, e)
    }
  }

  return NextResponse.json({
    ok: true,
    processed,
    sealed,
    timestamp: now.toISOString(),
  })
}
