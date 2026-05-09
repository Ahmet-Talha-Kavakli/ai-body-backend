/**
 * V4.7 E3 — Distance Phase Manager (günde 1)
 *
 * 2 görev:
 *   1) Aktif phase'leri kontrol et: endsAt geçtiyse resolvedAt + reconciledAt + barışma mesajı.
 *   2) Yeni phase tetik: tension yüksek (örn. son 7 gün karakterde negative storyline + low resilience)
 *      VE rastgele %5 → 5-10 gün phase aç.
 *
 * Bu MVP'de tetik basit: yüksek-weight negative MoodEvent + son 3 gün >= 1 negative storyline.
 *
 * Lokal: curl http://localhost:3000/api/cron/distance-phase-manager
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'

export const maxDuration = 120

const RECONCILE_VARIANTS = [
  'ya boşver canım, geçti gitti',
  'sorum kaldı içimde ama uzayalım istemem, dönelim normale',
  'ya kafam toparlandı biraz, devam edelim',
]

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  if (
    cronSecret &&
    authHeader !== `Bearer ${cronSecret}` &&
    process.env.NODE_ENV === 'production'
  ) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  const now = new Date()

  // 1) Süresi bitmiş phase'leri çöz + barışma mesajı
  const expired = await db.characterDistancePhase.findMany({
    where: { resolvedAt: null, endsAt: { lte: now } },
  })
  let resolved = 0
  for (const ph of expired) {
    const conv = await db.assistantConversation.findFirst({
      where: { userId: ph.userId, characterId: ph.characterId, archived: false },
      orderBy: { updatedAt: 'desc' },
      select: { id: true },
    })
    if (conv) {
      const msg = RECONCILE_VARIANTS[Math.floor(Math.random() * RECONCILE_VARIANTS.length)]
      await db.scheduledCharacterMessage.create({
        data: {
          userId: ph.userId,
          characterId: ph.characterId,
          conversationId: conv.id,
          content: msg,
          scheduledFor: now,
          status: 'pending',
        },
      })
    }
    await db.characterDistancePhase.update({
      where: { id: ph.id },
      data: { resolvedAt: now, reconciledAt: now },
    })
    resolved++
  }

  // 2) Yeni phase tetik — yüksek tension (very_negative weight ≥7) + %5 olasılık
  const characters = await db.character.findMany({
    where: { status: 'active' },
    select: { id: true, userId: true },
  })

  let triggered = 0
  for (const char of characters) {
    // Aktif phase var mı? Üst üste açma
    const activePhase = await db.characterDistancePhase.findFirst({
      where: { characterId: char.id, userId: char.userId, resolvedAt: null },
      select: { id: true },
    })
    if (activePhase) continue

    // Yüksek tension sinyali
    const heavyMood = await db.characterMoodEvent.findFirst({
      where: {
        characterId: char.id,
        weight: { gte: 7 },
        moodImpact: 'very_negative',
        expiresAt: { gt: now },
      },
      select: { id: true, reason: true },
    })
    if (!heavyMood) continue

    if (Math.random() > 0.05) continue

    // 5-10 gün
    const days = 5 + Math.floor(Math.random() * 6)
    const endsAt = new Date(now.getTime() + days * 24 * 60 * 60 * 1000)

    await db.characterDistancePhase.create({
      data: {
        characterId: char.id,
        userId: char.userId,
        trigger: heavyMood.reason ?? 'high_tension_event',
        endsAt,
        intensity: 0.5,
      },
    })
    triggered++
  }

  return NextResponse.json({
    ok: true,
    resolved,
    triggered,
    expiredScanned: expired.length,
    activeCharScanned: characters.length,
    timestamp: now.toISOString(),
  })
}
