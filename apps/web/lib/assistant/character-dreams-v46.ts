/**
 * V4.6 M15 — Rüyalar
 *
 * Sabah 6-9 arası rastgele tetiklenir. Karakter "ya çok garip bir rüya gördüm".
 * Kötü → destek arar; iyi → coşkulu; garip → güldürücü. 1-3 saat etki.
 */

import OpenAI from 'openai'
import { db } from '@/lib/db/client'
import { addMoodEvent } from './mood-arc'

export async function loadActiveDream(characterId: string) {
  const now = new Date()
  return db.characterDreamEvent.findFirst({
    where: {
      characterId,
      effectUntil: { gt: now },
    },
    orderBy: { createdAt: 'desc' },
  })
}

export function buildDreamBlock(dream: Awaited<ReturnType<typeof loadActiveDream>>): string {
  if (!dream) return ''
  const dayPart = dream.recountedAt ? '(daha önce anlattın)' : '(henüz anlatmadın)'
  let hint = ''
  switch (dream.mood) {
    case 'bad':
      hint = 'Kötü rüya — biraz dağınık, destek arıyor olabilirsin'
      break
    case 'good':
      hint = 'İyi rüya — moralin yüksek, paylaşmak istersin'
      break
    case 'strange':
      hint = 'Garip rüya — komik anlatabilirsin'
      break
  }
  return `[BU SABAH GÖRDÜĞÜN RÜYA] ${dayPart}
"${dream.content}"
Mood: ${dream.mood} — ${hint}
Davranış: Bağlam uygunsa kendin sızdır. Anlattıktan sonra recountedAt damgalanır.\n\n`
}

/**
 * Cron — sabah 6-9, %15-20 ihtimalle rüya üret.
 */
export async function tickDreams(): Promise<{ generated: number }> {
  const now = new Date()
  const hour = now.getHours()
  if (hour < 6 || hour > 9) return { generated: 0 }

  const characters = await db.character.findMany({
    where: { status: 'active' },
    select: {
      id: true,
      name: true,
      archetype: true,
      dreamEvents: {
        where: { createdAt: { gte: new Date(now.getTime() - 16 * 3600 * 1000) } },
      },
    },
    take: 200,
  })

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  let generated = 0

  for (const c of characters) {
    if (c.dreamEvents.length > 0) continue // bugün rüya zaten var
    if (Math.random() > 0.18) continue

    try {
      const r = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'user',
            content: `${c.name} (${c.archetype}) bu sabah uyandığında garip bir rüya gördü. Rüyayı 1-2 cümle anlat. Çok özel/yaratıcı olmasın — sıradan bir insanın görebileceği rüya.

JSON dön: {"content":"...","mood":"bad|good|strange"}`,
          },
        ],
        temperature: 0.95,
        max_tokens: 100,
        response_format: { type: 'json_object' },
      })
      const text = r.choices[0]?.message?.content
      if (!text) continue
      const parsed = JSON.parse(text) as { content?: string; mood?: string }
      if (!parsed.content) continue

      const mood = (parsed.mood === 'good' || parsed.mood === 'strange' ? parsed.mood : 'bad') as
        | 'good'
        | 'bad'
        | 'strange'
      const hours = 1 + Math.floor(Math.random() * 3)
      const effectUntil = new Date(now.getTime() + hours * 3600 * 1000)
      await db.characterDreamEvent.create({
        data: { characterId: c.id, content: parsed.content, mood, effectUntil },
      })
      // Mood etkisi
      if (mood === 'bad') {
        await addMoodEvent({
          characterId: c.id,
          source: 'random',
          moodImpact: 'negative',
          weight: 2,
          decayDays: 1,
          reason: 'Kötü rüya',
        })
      } else if (mood === 'good') {
        await addMoodEvent({
          characterId: c.id,
          source: 'random',
          moodImpact: 'positive',
          weight: 2,
          decayDays: 1,
          reason: 'İyi rüya',
        })
      }
      generated++
    } catch (e) {
      console.error('[dreams] gen fail:', c.id, e)
    }
  }
  return { generated }
}
