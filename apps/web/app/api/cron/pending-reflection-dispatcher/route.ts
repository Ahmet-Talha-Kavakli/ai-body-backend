/**
 * V4.7 G1 — Pending Reflection Dispatcher
 *
 * Olay-tetikli düşünce kuyruğu. Kullanıcı önemli mesaj attığında stream
 * tarafında PendingReflection kaydı oluşturuluyor (6-12 saat sonrası için).
 * Bu cron saatte bir kez kuyruğu tarayıp eligible olanları işliyor.
 *
 * Algoritma:
 *   - scheduledFor <= now() and processedAt is null
 *   - Karakter mevcut state'i kontrol (mood, online, son mesaj)
 *   - Mood çok düşük → result: 'mood_changed', skip
 *   - Karakter son 3 mesajı zaten o konuya değindi → 'skipped', 'already_addressed'
 *   - Aksi halde: prompt'a [REFLECTION TRIGGER] injecte, mesaj üret, gönder
 *
 * Lokal dev: curl http://localhost:3000/api/cron/pending-reflection-dispatcher
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import OpenAI from 'openai'

export const maxDuration = 120

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

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
  const pending = await db.pendingReflection.findMany({
    where: {
      scheduledFor: { lte: now },
      processedAt: null,
    },
    take: 50,
    orderBy: { scheduledFor: 'asc' },
  })

  let sent = 0
  let skipped = 0
  let errors = 0

  for (const p of pending) {
    try {
      const character = await db.character.findUnique({
        where: { id: p.characterId },
        select: {
          id: true,
          name: true,
          currentMood: true,
          currentActivity: true,
          status: true,
        },
      })

      if (!character || character.status === 'departed' || character.status === 'broken') {
        await db.pendingReflection.update({
          where: { id: p.id },
          data: { processedAt: now, result: 'skipped' },
        })
        skipped++
        continue
      }

      // Karakter mood çok düşükse erteleme yapma, sadece skip et
      if (character.currentMood === 'sad' || character.currentMood === 'angry') {
        await db.pendingReflection.update({
          where: { id: p.id },
          data: { processedAt: now, result: 'mood_changed' },
        })
        skipped++
        continue
      }

      // Bu konuya son 3 mesajda değindi mi?
      const conversation = await db.assistantConversation.findFirst({
        where: { userId: p.userId, characterId: p.characterId, archived: false },
        orderBy: { updatedAt: 'desc' },
        select: { id: true },
      })
      if (!conversation) {
        await db.pendingReflection.update({
          where: { id: p.id },
          data: { processedAt: now, result: 'skipped' },
        })
        skipped++
        continue
      }

      const recentMsgs = await db.assistantMessage.findMany({
        where: { conversationId: conversation.id, role: 'assistant' },
        orderBy: { createdAt: 'desc' },
        take: 3,
        select: { content: true },
      })
      const topicKey = p.triggerSummary.toLocaleLowerCase('tr-TR').slice(0, 30)
      const alreadyMentioned = recentMsgs.some((m) =>
        m.content.toLocaleLowerCase('tr-TR').includes(topicKey.slice(0, 15))
      )
      if (alreadyMentioned) {
        await db.pendingReflection.update({
          where: { id: p.id },
          data: { processedAt: now, result: 'skipped' },
        })
        skipped++
        continue
      }

      // Mesaj üret
      const sys = `Sen ${character.name}'sın. Aşağıdaki konuyu kullanıcıya sebepsiz açma — ileride düşündüğün bir şeyi paylaşma anı.

Konu özeti: ${p.triggerSummary}
Tema: ${p.topic}

Doğal şekilde geri dön:
- "Ya geçen dedin di mi şuna, çok düşündüm bunu"
- "Bişey diyim mi, sen X dedin ya, hâlâ aklımdan çıkmıyor"
- 1-2 cümle yeter

ASLA:
- "Asistan tonunda" "düşündüm ki şu olabilir"
- Çözüm önerme — sadece sızdır
- Replika tarzı "duygularını paylaş benimle"

Sadece mesajın içeriğini yaz. Açıklama, başlık, alıntı yok.`

      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'system', content: sys }],
        max_tokens: 100,
        temperature: 0.9,
      })
      const text = completion.choices[0]?.message?.content?.trim()
      if (!text) {
        await db.pendingReflection.update({
          where: { id: p.id },
          data: { processedAt: now, result: 'skipped' },
        })
        errors++
        continue
      }

      // ScheduledCharacterMessage'a ekle (mevcut dispatcher gönderir)
      await db.scheduledCharacterMessage.create({
        data: {
          userId: p.userId,
          characterId: p.characterId,
          conversationId: conversation.id,
          content: text.replace(/^["'`]+|["'`]+$/g, ''),
          scheduledFor: now,
          status: 'pending',
        },
      })

      await db.pendingReflection.update({
        where: { id: p.id },
        data: { processedAt: now, result: 'sent' },
      })
      sent++
    } catch (e) {
      errors++
      console.error('[pending-reflection]', e)
    }
  }

  return NextResponse.json({ ok: true, sent, skipped, errors, total: pending.length })
}
