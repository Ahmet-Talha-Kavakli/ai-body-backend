/**
 * V4.7 J5 — Music Share Suggester (saatte 1)
 *
 * Bugün kayıtlı CharacterDailyMusic kayıtlarından shared=false olanları kontrol et.
 * Her aday için karakter mood + ilişki yakınlığı ile %15 ihtimalle:
 *   - ScheduledCharacterMessage oluştur (3-25 dk gecikme): "ya bugün şunu dinliyorum, sevdim"
 *   - shared = true işaretle
 *
 * KURAL: Lyric uydurma yasak. Cron sadece şarkı/sanatçı bahseder, lyric alıntısı
 * stream içinde dailyMusic block tarafından kontrol edilir (excerpt null ise alıntı yok).
 *
 * Lokal: curl http://localhost:3000/api/cron/music-share-suggester
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
  const today = new Date(now)
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const candidates = await db.characterDailyMusic.findMany({
    where: { date: { gte: today, lt: tomorrow }, shared: false },
    take: 200,
  })

  let scanned = 0
  let shared = 0
  let skipped = 0

  for (const track of candidates) {
    scanned++

    // %15 ihtimal
    if (Math.random() > 0.15) {
      skipped++
      continue
    }

    const character = await db.character.findUnique({
      where: { id: track.characterId },
      select: { id: true, name: true, userId: true, status: true },
    })
    if (!character || character.status === 'departed' || character.status === 'broken') {
      skipped++
      continue
    }

    // Yakınlık kontrol — yakınlık > 30 olsun (yeni tanışıkta müzik paylaşımı yapay olur)
    const rel = await db.memoryRelationship.findFirst({
      where: { characterId: character.id, userId: character.userId },
      select: { loveScore: true, trustScore: true },
    })
    const yakinlik = rel ? (rel.loveScore + rel.trustScore) / 2 : 0
    if (yakinlik < 30) {
      skipped++
      continue
    }

    // Aktif konuşma
    const conv = await db.assistantConversation.findFirst({
      where: { userId: character.userId, characterId: character.id, archived: false },
      orderBy: { updatedAt: 'desc' },
      select: { id: true },
    })
    if (!conv) {
      skipped++
      continue
    }

    // Mesaj — basit varyasyon (AI çağrısı maliyeti için statik tonlar)
    const variants = [
      `ya bugün ${track.trackName} dinliyorum (${track.artist}), sevdim`,
      `${track.artist} - ${track.trackName} açıyorum sürekli, sen biliyor musun bunu`,
      `şu sıralar ${track.trackName} kafamda, ${track.artist}'tan`,
      `bi bak istersen — ${track.trackName} (${track.artist})`,
    ]
    const content = variants[Math.floor(Math.random() * variants.length)]

    // 3-25 dk gecikme (gerçekçi)
    const delayMin = 3 + Math.floor(Math.random() * 22)
    const scheduledFor = new Date(now.getTime() + delayMin * 60 * 1000)

    await db.scheduledCharacterMessage.create({
      data: {
        userId: character.userId,
        characterId: character.id,
        conversationId: conv.id,
        content,
        scheduledFor,
        status: 'pending',
      },
    })

    await db.characterDailyMusic.update({
      where: { id: track.id },
      data: { shared: true, sharedAt: now },
    })
    shared++
  }

  return NextResponse.json({
    ok: true,
    scanned,
    shared,
    skipped,
    timestamp: now.toISOString(),
  })
}
