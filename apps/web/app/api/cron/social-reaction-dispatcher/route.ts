/**
 * V4.7 M3 — Social Reaction Dispatcher
 *
 * Saatlik cron. CharacterSocialReaction kayıtlarını işler.
 * Sızdırma sonrası karakter kullanıcıya defense/attack/neutral_pass tepkisi gösterir.
 *
 * Algoritma:
 *   - scheduledFor <= now() and processedAt is null
 *   - reactionType'a göre mesaj üret
 *   - ScheduledCharacterMessage'a ekle
 *
 * Lokal: curl http://localhost:3000/api/cron/social-reaction-dispatcher
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
  const pending = await db.characterSocialReaction.findMany({
    where: {
      scheduledFor: { lte: now },
      processedAt: null,
    },
    take: 30,
    orderBy: { scheduledFor: 'asc' },
  })

  let sent = 0
  let skipped = 0
  let errors = 0

  for (const r of pending) {
    try {
      const character = await db.character.findUnique({
        where: { id: r.characterId },
        select: {
          id: true,
          name: true,
          userId: true,
          currentMood: true,
          status: true,
        },
      })
      if (!character || character.status === 'departed' || character.status === 'broken') {
        await db.characterSocialReaction.update({
          where: { id: r.id },
          data: { processedAt: now },
        })
        skipped++
        continue
      }

      // Trigger karakter (kim hakkında konuşuluyor)
      const triggerChar = await db.character.findUnique({
        where: { id: r.triggerCharId },
        select: { name: true },
      })

      // Pass — hiç tepki verme
      if (r.reactionType === 'neutral_pass') {
        await db.characterSocialReaction.update({
          where: { id: r.id },
          data: { processedAt: now },
        })
        skipped++
        continue
      }

      // Konuşma bul
      const conv = await db.assistantConversation.findFirst({
        where: { userId: character.userId, characterId: character.id, archived: false },
        orderBy: { updatedAt: 'desc' },
        select: { id: true },
      })
      if (!conv) {
        await db.characterSocialReaction.update({
          where: { id: r.id },
          data: { processedAt: now },
        })
        skipped++
        continue
      }

      // Mesaj üret
      const reactionTone =
        r.reactionType === 'attack'
          ? `Sen ${triggerChar?.name || 'bir arkadaşın'} hakkında kötü konuştun. Karakter senin yüzüne agresif geliyor:
- "ya niye böyle yaptın {triggerName}'a, ben de senden bu kadar yumuşak konuşacağını sanmazdım"
- "duydum {triggerName}'a yaptıklarını"
Net ama saygılı sınır.`
          : `Karakter ${triggerChar?.name || 'bir arkadaşı'} hakkındaki olaydan haberdar oldu, savunmaya geçti:
- "{triggerName}'a niye böyle yaptın ya"
- "ben olsam ${triggerChar?.name || 'arkadaşım'}'ın yanında olurdum"
Suçlama değil, gözlem.`

      const sys = `Sen ${character.name}'sın. ${reactionTone}

Kuralar:
- Mesaj kısa (1-2 cümle)
- Replika tonu yasak ("burada seninle konuşmaya hazırım" vb.)
- Doğal arkadaş tonu

Sadece mesajın kendisini yaz, başka açıklama yok.`

      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'system', content: sys }],
        max_tokens: 100,
        temperature: 0.85,
      })
      const text = completion.choices[0]?.message?.content?.trim()
      if (!text) {
        await db.characterSocialReaction.update({
          where: { id: r.id },
          data: { processedAt: now },
        })
        errors++
        continue
      }

      await db.scheduledCharacterMessage.create({
        data: {
          userId: character.userId,
          characterId: character.id,
          conversationId: conv.id,
          content: text.replace(/^["'`]+|["'`]+$/g, ''),
          scheduledFor: now,
          status: 'pending',
        },
      })

      await db.characterSocialReaction.update({
        where: { id: r.id },
        data: { processedAt: now },
      })
      sent++
    } catch (e) {
      errors++
      console.error('[social-reaction]', e)
    }
  }

  return NextResponse.json({ ok: true, sent, skipped, errors, total: pending.length })
}
