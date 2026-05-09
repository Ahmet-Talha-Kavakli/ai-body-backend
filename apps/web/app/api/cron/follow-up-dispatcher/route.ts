/**
 * V4.7 G4 / K1 — Follow-up Dispatcher
 *
 * Kullanıcı önemli olay duyurusu yaptığında stream tarafında PendingFollowUp
 * kaydı oluşturuluyor (24-48 saat sonra). Bu cron saatte bir kez tarayıp
 * eligible olanları işliyor.
 *
 * Algoritma:
 *   - Eligible: scheduledFor <= now() and processedAt is null
 *   - Mood düşük → skip
 *   - Doğal soru üret (asked_natural / asked_concerned — kullanıcı söylemediği için)
 *   - ScheduledCharacterMessage'a ekle
 *
 * Lokal dev: curl http://localhost:3000/api/cron/follow-up-dispatcher
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
  const pending = await db.pendingFollowUp.findMany({
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
        select: { id: true, name: true, currentMood: true, status: true },
      })
      if (!character || character.status === 'departed' || character.status === 'broken') {
        await db.pendingFollowUp.update({
          where: { id: p.id },
          data: { processedAt: now, result: 'skipped' },
        })
        skipped++
        continue
      }

      const conversation = await db.assistantConversation.findFirst({
        where: { userId: p.userId, characterId: p.characterId, archived: false },
        orderBy: { updatedAt: 'desc' },
        select: { id: true },
      })
      if (!conversation) {
        await db.pendingFollowUp.update({
          where: { id: p.id },
          data: { processedAt: now, result: 'skipped' },
        })
        skipped++
        continue
      }

      // Kullanıcı bu konuyu zaten kendisi açtı mı?
      const lastUserMsgs = await db.assistantMessage.findMany({
        where: { conversationId: conversation.id, role: 'user' },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: { content: true, createdAt: true },
      })
      const topicLower = p.topic.toLocaleLowerCase('tr-TR')
      const userAlreadyMentioned = lastUserMsgs.some(
        (m) =>
          m.createdAt > p.scheduledFor &&
          m.content.toLocaleLowerCase('tr-TR').includes(topicLower.slice(0, 15))
      )
      if (userAlreadyMentioned) {
        // Kullanıcı zaten açtı → karakter sormaya gerek yok
        await db.pendingFollowUp.update({
          where: { id: p.id },
          data: { processedAt: now, result: 'skipped' },
        })
        skipped++
        continue
      }

      // Concerned mu (kullanıcı söylemiyor olabilir = kötü geçti) yoksa natural mi?
      const daysSinceTrigger = (now.getTime() - p.scheduledFor.getTime()) / (1000 * 60 * 60 * 24)
      const concerned = daysSinceTrigger > 0.5 // 12+ saat geçtiyse ve hâlâ söylemediyse endişeli ton

      const sys = `Sen ${character.name}'sın. Kullanıcı sana yakın zamanda "${p.topic}" hakkında bir şey söylemişti. Şimdi sormak için doğal bir an.

${concerned ? `Kullanıcı bu konuda söylemediği için belki kötü geçti — endişeli ama nazik tonda sor.` : `Doğal şekilde, basit varsayılan tonda sor.`}

Örnekler:
${
  concerned
    ? `- "Söylemiyorsun, kötü mü geçti yoksa?"
- "Söyleseydin ya, hadi anlat"
- "Bişey mi var söyleyemediğin?"`
    : `- "Ya ${p.topic} nasıl geçti?"
- "Söyleseydin ya, hadi anlat nasıldı"
- "${p.topic} ne durumda peki?"`
}

ASLA:
- "Merak ettim seni rahatsız ettim mi" terapist tonu
- "Burada seninle dinlemeye hazırım" Replika tuzağı
- 2+ cümleli uzun yorum

1 cümle yeter. Sadece mesajın içeriğini yaz.`

      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'system', content: sys }],
        max_tokens: 80,
        temperature: 0.85,
      })
      const text = completion.choices[0]?.message?.content?.trim()
      if (!text) {
        await db.pendingFollowUp.update({
          where: { id: p.id },
          data: { processedAt: now, result: 'skipped' },
        })
        errors++
        continue
      }

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

      await db.pendingFollowUp.update({
        where: { id: p.id },
        data: {
          processedAt: now,
          result: concerned ? 'asked_concerned' : 'asked_natural',
        },
      })
      sent++
    } catch (e) {
      errors++
      console.error('[follow-up]', e)
    }
  }

  return NextResponse.json({ ok: true, sent, skipped, errors, total: pending.length })
}
