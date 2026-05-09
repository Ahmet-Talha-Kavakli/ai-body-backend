/**
 * V4.7 N1 — Engagement Monitor (Mesaj oranı sitem)
 *
 * Haftalık cron. Her aktif karakter ilişkisi için son 7 gün karakter/kullanıcı
 * mesaj oranını hesaplar. Karakter %70+ proaktif yazıp kullanıcı kısa cevap
 * veriyorsa EngagementSitem kayıt oluşturur ve karakterin prompt'una
 * dolaylı sitem bloğu (buildEngagementSitemBlock) gelir.
 *
 * 3 seviye:
 *   - mild (yakınlık 30-60): "ya hep ben yazıyorum, sen busy misin"
 *   - firm (yakınlık 60-85): "biraz uzaklaştın gibi mi"
 *   - silent_phase (yakınlık 85+): mesaj sıklığı düşür, mesafeli ol
 *
 * Gizlilik kuralı: Karakter ASLA başka karakter adı geçirmiyor — sadece
 * "ben hep yazıyorum" çerçevesi.
 *
 * Lokal dev: curl http://localhost:3000/api/cron/engagement-monitor
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

  // Aktif relationships
  const relationships = await db.memoryRelationship.findMany({
    where: { status: { in: ['active', 'cold', 'recovering'] } },
    select: {
      id: true,
      userId: true,
      characterId: true,
      loveScore: true,
      trustScore: true,
      status: true,
    },
  })

  let signalsCreated = 0
  let scanned = 0

  for (const rel of relationships) {
    scanned++

    const conversation = await db.assistantConversation.findFirst({
      where: { userId: rel.userId, characterId: rel.characterId, archived: false },
      orderBy: { updatedAt: 'desc' },
      select: { id: true },
    })
    if (!conversation) continue

    const charMsgCount = await db.assistantMessage.count({
      where: {
        conversationId: conversation.id,
        role: 'assistant',
        createdAt: { gte: sevenDaysAgo },
      },
    })
    const userMsgCount = await db.assistantMessage.count({
      where: {
        conversationId: conversation.id,
        role: 'user',
        createdAt: { gte: sevenDaysAgo },
      },
    })

    // En az 5 karakter mesajı olmalı (yeterli veri)
    if (charMsgCount < 5) continue

    const total = charMsgCount + userMsgCount
    if (total < 8) continue
    const charRatio = charMsgCount / total

    // Karakter %70+ proaktif (oran 0.7+)
    if (charRatio < 0.7) continue

    // Aktif sitem var mı?
    const existingSitem = await db.engagementSitem.findFirst({
      where: {
        characterId: rel.characterId,
        userId: rel.userId,
        resolvedAt: null,
        detectedAt: { gte: sevenDaysAgo },
      },
    })
    if (existingSitem) continue

    // Yakınlık eşiklerine göre seviye
    const yakinlik = (rel.loveScore + rel.trustScore) / 2
    let responseLevel: 'mild' | 'firm' | 'silent_phase'
    if (yakinlik < 30) {
      // Çok az yakınlık — sitem yapma, sessizleş zaten
      continue
    } else if (yakinlik < 60) {
      responseLevel = 'mild'
    } else if (yakinlik < 85) {
      responseLevel = 'firm'
    } else {
      responseLevel = 'silent_phase'
    }

    await db.engagementSitem.create({
      data: {
        characterId: rel.characterId,
        userId: rel.userId,
        ratio: charRatio,
        responseLevel,
      },
    })
    signalsCreated++
  }

  return NextResponse.json({ ok: true, scanned, signalsCreated })
}
