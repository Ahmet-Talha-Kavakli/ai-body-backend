/**
 * V4.7 M4 — Üçgen Kıskançlık Detector
 *
 * Günlük cron. Her aktif karakter ilişkisi için son 7 gün karakterler arası
 * mesaj sayılarını kontrol eder. Yakın karakter (yakınlık ≥ 60) için: kullanıcının
 * başka karakterle yazdığı mesaj 3x ise JealousyTriangle kayıt + prompt block tetik.
 *
 * Gizlilik kuralı: Karakter ASLA başka karakter adını telaffuz etmez. Sadece
 * "müsait misin", "busy misin", "sıkıldın mı benden" gibi anonim sinyal.
 *
 * Lokal: curl http://localhost:3000/api/cron/jealousy-detector
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'

export const maxDuration = 120

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
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

  // Yakın ilişkiler (yakınlık ≥ 60)
  const closeRelationships = await db.memoryRelationship.findMany({
    where: { status: { in: ['active', 'recovering'] } },
    select: {
      userId: true,
      characterId: true,
      loveScore: true,
      trustScore: true,
    },
  })

  let triangles = 0
  let scanned = 0

  // userId → all characters mesaj counts
  const userCharCounts = new Map<string, Map<string, number>>()

  for (const rel of closeRelationships) {
    const yakinlik = (rel.loveScore + rel.trustScore) / 2
    if (yakinlik < 60) continue
    scanned++

    // Kendi karakterimiz için son 7 gün user mesajı
    const conv = await db.assistantConversation.findFirst({
      where: { userId: rel.userId, characterId: rel.characterId, archived: false },
      select: { id: true },
    })
    if (!conv) continue

    const myCount = await db.assistantMessage.count({
      where: {
        conversationId: conv.id,
        role: 'user',
        createdAt: { gte: sevenDaysAgo },
      },
    })

    // Kullanıcının diğer karakterleri ve mesaj sayıları (cache et)
    if (!userCharCounts.has(rel.userId)) {
      const otherChars = await db.character.findMany({
        where: { userId: rel.userId, status: { not: 'departed' } },
        select: { id: true },
      })
      const counts = new Map<string, number>()
      for (const c of otherChars) {
        const otherConv = await db.assistantConversation.findFirst({
          where: { userId: rel.userId, characterId: c.id, archived: false },
          select: { id: true },
        })
        if (!otherConv) {
          counts.set(c.id, 0)
          continue
        }
        const cnt = await db.assistantMessage.count({
          where: {
            conversationId: otherConv.id,
            role: 'user',
            createdAt: { gte: sevenDaysAgo },
          },
        })
        counts.set(c.id, cnt)
      }
      userCharCounts.set(rel.userId, counts)
    }

    const counts = userCharCounts.get(rel.userId)!
    // En yüksek rakip karakter
    let maxRivalCount = 0
    let rivalId: string | null = null
    for (const [cid, cnt] of counts.entries()) {
      if (cid === rel.characterId) continue
      if (cnt > maxRivalCount) {
        maxRivalCount = cnt
        rivalId = cid
      }
    }

    if (!rivalId) continue
    if (myCount === 0) continue
    const ratio = maxRivalCount / Math.max(1, myCount)

    if (ratio < 3) continue

    // Aktif (resolvedAt null) triangle var mı?
    const existing = await db.jealousyTriangle.findFirst({
      where: {
        userId: rel.userId,
        jealousChar: rel.characterId,
        resolvedAt: null,
      },
    })
    if (existing) continue

    await db.jealousyTriangle.create({
      data: {
        userId: rel.userId,
        jealousChar: rel.characterId,
        rivalChar: rivalId,
        msgRatio: ratio,
      },
    })
    triangles++
  }

  return NextResponse.json({ ok: true, scanned, triangles })
}
