/**
 * V4.8 Faz F — Kira sonrası özet (Spotify Wrapped paterni)
 *
 * GET /api/marketplace/rentals/[id]/recap
 *
 * Kira süresince kullanıcının karakterle yaşadığı istatistikler:
 *   - Toplam mesaj sayısı (kullanıcı + karakter)
 *   - Kira süresi (gün)
 *   - Toplam kelime sayısı (kullanıcının yazdığı)
 *   - En çok geçen 3 kelime (stop word filtreli)
 *   - Hızlı cevaplar (karakterin <30sn içinde cevapladığı mesaj sayısı)
 *   - En aktif gün (en çok mesaj atılan gün)
 *   - "İlk mesajın" + "son mesajın" (özlü olanlar)
 *
 * Kira aktif olmasa da çağrılabilir (history için). Sadece sahibi (renter) görebilir.
 */

import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/api/with-auth'
import { db } from '@/lib/db/client'

type Ctx = { params: Promise<{ id: string }> }

// Türkçe + İngilizce yaygın stop words
const STOP_WORDS = new Set([
  've',
  'ile',
  'bu',
  'şu',
  'o',
  'bir',
  'da',
  'de',
  'ne',
  'ki',
  'mi',
  'mı',
  'mu',
  'mü',
  'ben',
  'sen',
  'biz',
  'siz',
  'ama',
  'fakat',
  'çok',
  'için',
  'gibi',
  'sonra',
  'önce',
  'evet',
  'hayır',
  'tamam',
  'olur',
  'oldu',
  'var',
  'yok',
  'ya',
  'şey',
  'şimdi',
  'hep',
  'hiç',
  'her',
  'bence',
  'ben de',
  'the',
  'and',
  'or',
  'is',
  'are',
  'was',
  'a',
  'an',
  'in',
  'on',
  'at',
  'to',
  'of',
  'i',
  'you',
  'me',
  'my',
  'we',
  'be',
  'have',
  'has',
  'do',
  'did',
  'can',
  'will',
  'just',
  'so',
  'if',
  'but',
  'not',
  'no',
  'yes',
  'ok',
  'as',
  'it',
  'its',
  'this',
  'that',
  'one',
  'two',
])

export const GET = withAuth<Ctx>(async (_req, { user, params }) => {
  const { id } = await params!

  const rental = await db.rentalAgreement.findUnique({
    where: { id },
    include: {
      character: {
        select: { id: true, name: true, avatarUrl: true },
      },
    },
  })
  if (!rental) return NextResponse.json({ error: 'Kira bulunamadı' }, { status: 404 })
  if (rental.renterId !== user.id) {
    return NextResponse.json({ error: 'Yetkisiz' }, { status: 403 })
  }

  // Kira süresi (gün)
  const startedAt = rental.startedAt
  const endedAt = rental.endedAt ?? rental.endsAt ?? new Date()
  const durationMs = endedAt.getTime() - startedAt.getTime()
  const durationDays = Math.max(1, Math.round(durationMs / (24 * 60 * 60 * 1000)))

  // Bu karakterle olan sohbetin mesajları
  const conversation = await db.assistantConversation.findFirst({
    where: { userId: user.id, characterId: rental.characterId },
    select: { id: true },
  })

  if (!conversation) {
    // Hiç sohbet yok — minimal recap
    return NextResponse.json({
      character: rental.character,
      durationDays,
      totalMessages: 0,
      userMessages: 0,
      characterMessages: 0,
      totalWords: 0,
      topWords: [],
      quickReplies: 0,
      mostActiveDay: null,
      firstUserMessage: null,
      lastUserMessage: null,
    })
  }

  const messages = await db.assistantMessage.findMany({
    where: {
      conversationId: conversation.id,
      // Kira başlangıcından bitişine kadar
      // (Mesajlar createdAt'e göre sıralı tutulduğu için range filter)
    },
    orderBy: { createdAt: 'asc' },
    select: {
      id: true,
      role: true,
      content: true,
      createdAt: true,
    },
    take: 5000, // güvenlik limiti
  })

  // Sadece kira süresi içindeki mesajlar
  const inRange = messages.filter((m) => m.createdAt >= startedAt && m.createdAt <= endedAt)

  const userMsgs = inRange.filter((m) => m.role === 'user')
  const charMsgs = inRange.filter((m) => m.role === 'assistant')

  // Toplam kelime sayısı
  const totalWords = userMsgs.reduce((sum, m) => sum + countWords(m.content), 0)

  // En çok geçen kelimeler
  const wordFreq: Record<string, number> = {}
  for (const m of userMsgs) {
    const tokens = tokenize(m.content)
    for (const t of tokens) {
      if (STOP_WORDS.has(t) || t.length < 3) continue
      wordFreq[t] = (wordFreq[t] ?? 0) + 1
    }
  }
  const topWords = Object.entries(wordFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([word, count]) => ({ word, count }))

  // Hızlı cevaplar — kullanıcı mesajından sonra <30sn içinde gelen karakter mesajı
  let quickReplies = 0
  for (let i = 0; i < inRange.length - 1; i++) {
    const cur = inRange[i]
    const next = inRange[i + 1]
    if (cur && next && cur.role === 'user' && next.role === 'assistant') {
      const diffSec = (next.createdAt.getTime() - cur.createdAt.getTime()) / 1000
      if (diffSec < 30) quickReplies++
    }
  }

  // En aktif gün
  const dayCounts: Record<string, number> = {}
  for (const m of inRange) {
    const day = m.createdAt.toISOString().slice(0, 10)
    dayCounts[day] = (dayCounts[day] ?? 0) + 1
  }
  let mostActiveDay: { date: string; count: number } | null = null
  for (const [date, count] of Object.entries(dayCounts)) {
    if (!mostActiveDay || count > mostActiveDay.count) {
      mostActiveDay = { date, count }
    }
  }

  // İlk ve son kullanıcı mesajı (kısa olanlar daha hoş)
  const firstUserMessage = userMsgs[0]?.content?.slice(0, 100) ?? null
  const lastUserMessage = userMsgs[userMsgs.length - 1]?.content?.slice(0, 100) ?? null

  return NextResponse.json({
    character: rental.character,
    durationDays,
    totalMessages: inRange.length,
    userMessages: userMsgs.length,
    characterMessages: charMsgs.length,
    totalWords,
    topWords,
    quickReplies,
    mostActiveDay,
    firstUserMessage,
    lastUserMessage,
  })
})

function tokenize(s: string): string[] {
  return s
    .toLowerCase()
    .replace(/[^a-zA-ZçğıöşüÇĞİÖŞÜ\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
}

function countWords(s: string): number {
  return tokenize(s).length
}
