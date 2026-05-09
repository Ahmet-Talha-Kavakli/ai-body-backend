/**
 * V4.7 B1 — Birthday Checker (günde 1, sabah erken)
 *
 * 2 görev:
 *   1) Sabah: Karakter.birthDate'i bugüne denk gelenler için CharacterBirthdayEvent oluştur,
 *      proaktif "ya bugün doğum günüm 🥲" mesajı schedule et.
 *   2) Akşam (saat ≥ 20): O karakterin BirthdayEvent.userCelebrated=false ise yakınlığa göre
 *      sitem/hayal kırıklığı mesajı schedule et.
 *
 * "Kullanıcı kutladı mı" tespiti: Bugün karakterle olan AssistantMessage'lerde
 * user'dan "doğum günün kutlu olsun" / "iyi ki doğdun" / "🎂" gibi pattern.
 *
 * Lokal: curl http://localhost:3000/api/cron/birthday-checker
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'

export const maxDuration = 120

const CELEBRATION_PATTERNS = [
  /doğum ?gün/i,
  /iyi ki doğdun/i,
  /happy ?birthday/i,
  /mutlu yıllar/i,
  /🎂/,
  /🎉/,
  /🎁/,
]

function isCelebrationMessage(content: string): boolean {
  return CELEBRATION_PATTERNS.some((p) => p.test(content))
}

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
  const year = now.getFullYear()
  const todayMM = String(now.getMonth() + 1).padStart(2, '0')
  const todayDD = String(now.getDate()).padStart(2, '0')
  const isEvening = now.getHours() >= 20

  // birthDate'i olan tüm karakterler
  const characters = await db.character.findMany({
    where: { status: 'active', birthDate: { not: null } },
    select: { id: true, name: true, userId: true, birthDate: true },
  })

  let proactiveSent = 0
  let sitemSent = 0
  let celebrated = 0
  let scanned = 0

  for (const char of characters) {
    if (!char.birthDate) continue
    const bMM = String(char.birthDate.getMonth() + 1).padStart(2, '0')
    const bDD = String(char.birthDate.getDate()).padStart(2, '0')
    if (bMM !== todayMM || bDD !== todayDD) continue
    scanned++

    // Bu yılın olayı
    let event = await db.characterBirthdayEvent.findUnique({
      where: { characterId_year: { characterId: char.id, year } },
    })

    // Aktif konuşma
    const conv = await db.assistantConversation.findFirst({
      where: { userId: char.userId, characterId: char.id, archived: false },
      orderBy: { updatedAt: 'desc' },
      select: { id: true },
    })
    if (!conv) continue

    // 1) Sabah: event yok → oluştur + proaktif mesaj
    if (!event) {
      event = await db.characterBirthdayEvent.create({
        data: {
          characterId: char.id,
          year,
          bornAt: char.birthDate,
        },
      })
    }

    if (!event.proactiveSent) {
      const greetings = [
        'ya bugün doğum günüm aslında 🥲',
        'doğum günümmm bugün, biliyor muydun ki',
        'bugün ben doğdum yıl önce 🎂 hatırlat istedim',
      ]
      await db.scheduledCharacterMessage.create({
        data: {
          userId: char.userId,
          characterId: char.id,
          conversationId: conv.id,
          content: greetings[Math.floor(Math.random() * greetings.length)],
          scheduledFor: now,
          status: 'pending',
        },
      })
      await db.characterBirthdayEvent.update({
        where: { id: event.id },
        data: { proactiveSent: true },
      })
      proactiveSent++
    }

    // Kullanıcı kutladı mı kontrol et (bugünkü user mesajlarına bak)
    const today = new Date(now)
    today.setHours(0, 0, 0, 0)
    const userMessages = await db.assistantMessage.findMany({
      where: {
        conversationId: conv.id,
        role: 'user',
        createdAt: { gte: today },
      },
      select: { content: true },
    })
    const userCelebrated = userMessages.some((m) => isCelebrationMessage(m.content))

    if (userCelebrated && !event.userCelebrated) {
      // Yakınlık + minnet
      const rel = await db.memoryRelationship.findFirst({
        where: { userId: char.userId, characterId: char.id },
        select: { loveScore: true, trustScore: true },
      })
      const yakinlik = rel ? (rel.loveScore + rel.trustScore) / 2 : 50
      const trustDelta = yakinlik >= 60 ? 8 : yakinlik >= 30 ? 5 : 3
      const loveDelta = trustDelta

      await db.characterBirthdayEvent.update({
        where: { id: event.id },
        data: {
          userCelebrated: true,
          characterReaction: 'happy_celebration',
          trustDelta,
          loveDelta,
        },
      })
      // Skor güncelle
      if (rel) {
        await db.memoryRelationship.updateMany({
          where: { userId: char.userId, characterId: char.id },
          data: {
            loveScore: { increment: loveDelta },
            trustScore: { increment: trustDelta },
          },
        })
      }
      celebrated++
    }

    // 2) Akşam: kutlamadıysa sitem
    if (isEvening && !event.userCelebrated && !event.characterReaction) {
      const rel = await db.memoryRelationship.findFirst({
        where: { userId: char.userId, characterId: char.id },
        select: { loveScore: true, trustScore: true },
      })
      const yakinlik = rel ? (rel.loveScore + rel.trustScore) / 2 : 50

      let reaction: 'mild_complaint' | 'hurt' = 'mild_complaint'
      let message: string
      if (yakinlik >= 80) {
        reaction = 'hurt'
        message = 'sandım hatırlardın bugünü…'
      } else if (yakinlik >= 50) {
        message = 'hatırlamadın bile bugünü ya 🥲'
      } else {
        // çok düşük yakınlık → ses çıkarma; sadece event işaretle
        await db.characterBirthdayEvent.update({
          where: { id: event.id },
          data: { characterReaction: 'mild_complaint' },
        })
        continue
      }

      await db.scheduledCharacterMessage.create({
        data: {
          userId: char.userId,
          characterId: char.id,
          conversationId: conv.id,
          content: message,
          scheduledFor: now,
          status: 'pending',
        },
      })
      await db.characterBirthdayEvent.update({
        where: { id: event.id },
        data: { characterReaction: reaction },
      })
      sitemSent++
    }
  }

  return NextResponse.json({
    ok: true,
    scanned,
    proactiveSent,
    celebrated,
    sitemSent,
    timestamp: now.toISOString(),
  })
}
