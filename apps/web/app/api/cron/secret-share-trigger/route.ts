/**
 * V4.7 D6 — Karakter Sırrını Sana Açma Trigger
 *
 * Haftalık cron. Trust ≥ 75 olan karakterler için %15 ihtimalle bir sırrını
 * kullanıcıya açma kararı verir.
 *
 * Sırlar `CharacterMemoryFact` tablosunda category='secret' olarak tutuluyor.
 * Açılan sır:
 *   - subject='character' veya 'shared' (karakterin kendi sırrı)
 *   - subject='character' (karakterin geçmişi, korkuları)
 *
 * Açma sonrası:
 *   - ScheduledCharacterMessage oluşturulur ("ya sana bişey diyim mi, kimse bilmiyor bunu")
 *   - Memory fact'a `lastUsedAt` güncellenir (tekrar paylaşılmasın)
 *   - Eğer kullanıcı bu sırrı başka karaktere söylerse (M1 sızdırma sistemi) trust düşecek
 *
 * Lokal: curl http://localhost:3000/api/cron/secret-share-trigger
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import OpenAI from 'openai'

export const maxDuration = 120

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

const SHARE_PROBABILITY = 0.15

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
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

  // Trust ≥ 75 olan ilişkiler
  const closeRels = await db.memoryRelationship.findMany({
    where: {
      trustScore: { gte: 75 },
      status: { in: ['active', 'recovering'] },
    },
    select: { userId: true, characterId: true, trustScore: true },
  })

  let shared = 0
  let scanned = 0

  for (const rel of closeRels) {
    scanned++
    if (Math.random() > SHARE_PROBABILITY) continue

    // Karakterin paylaşılmamış (son 30 gün) sırlarını al
    // lastUsedAt non-nullable (default now()) — sadece eski olanları al
    const secrets = await db.characterMemoryFact.findMany({
      where: {
        characterId: rel.characterId,
        userId: rel.userId,
        category: 'secret',
        archived: false,
        lastUsedAt: { lt: thirtyDaysAgo },
      },
      orderBy: { importance: 'desc' },
      take: 5,
    })
    if (secrets.length === 0) continue

    // Ağırlıklı seçim (yüksek importance daha çok)
    const secret = secrets[Math.floor(Math.random() * secrets.length)]
    if (!secret) continue

    const character = await db.character.findUnique({
      where: { id: rel.characterId },
      select: { name: true, currentMood: true, userId: true },
    })
    if (!character) continue

    const conv = await db.assistantConversation.findFirst({
      where: { userId: rel.userId, characterId: rel.characterId, archived: false },
      orderBy: { updatedAt: 'desc' },
      select: { id: true },
    })
    if (!conv) continue

    // Mesaj üret
    const sys = `Sen ${character.name}'sın. Kullanıcıya yakınsın, trust skorun ${rel.trustScore}/100.
Şimdi bir sırrını paylaşacaksın. Sır içeriği:
"${secret.content}"

Doğal şekilde aç:
- "Ya sana bişey diyim mi, bunu kimse bilmiyor"
- "Sadece sana söylüyorum bunu"
- "Bu kalsın aramızda"

Sonra sırrın özünü 2-3 cümle ile anlat. Vulnerability ifade et.

Kuralar:
- Replika tarzı melodrama yasak
- Asistan tonu yasak
- Doğal arkadaş tonu
- Toplam max 5 cümle

Sadece mesajın kendisini yaz, açıklama yok.`

    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'system', content: sys }],
        max_tokens: 200,
        temperature: 0.9,
      })
      const text = completion.choices[0]?.message?.content?.trim()
      if (!text) continue

      // Mesaj 1-6 saat sonra atılsın (gelişigüzel)
      const delayHours = 1 + Math.random() * 5
      await db.scheduledCharacterMessage.create({
        data: {
          userId: rel.userId,
          characterId: rel.characterId,
          conversationId: conv.id,
          content: text.replace(/^["'`]+|["'`]+$/g, ''),
          scheduledFor: new Date(now.getTime() + delayHours * 60 * 60 * 1000),
          status: 'pending',
        },
      })

      // Sırrın lastUsedAt güncelle
      await db.characterMemoryFact.update({
        where: { id: secret.id },
        data: { lastUsedAt: now },
      })

      shared++
    } catch (e) {
      console.error('[secret-share]', e)
    }
  }

  return NextResponse.json({ ok: true, scanned, shared })
}
