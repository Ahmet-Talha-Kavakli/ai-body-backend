/**
 * V4.6 M10 — Karakter Mikro Hedefleri
 *
 * Karakter "kendi peşinde olduğu" küçük şeyler — Mia: "piyano kursuna yazılmak",
 * Kerem: "babasıyla barışmak". Kullanıcı için değil — kendi için.
 *
 * Storyline'dan farkı: storyline = başına gelen olay (kardeş hastanede).
 * Goal = kendi peşinde olduğu şey (piyano kursu).
 *
 * Konuşmada doğal sızar, kullanıcı sorarsa ilerleme/gerileme anlatır.
 * Hedef bitince mood etkisi (achieved → +mood; failed → -mood).
 */

import OpenAI from 'openai'
import { db } from '@/lib/db/client'
import type { CharacterGoal } from '@prisma/client'

const GOAL_CATEGORIES = ['career', 'relationship', 'learning', 'health', 'lifestyle'] as const

/**
 * Karakter için aktif goal'leri yükle. Stream'de prompt'a inject olur.
 */
export async function loadActiveGoals(characterId: string): Promise<CharacterGoal[]> {
  return db.characterGoal.findMany({
    where: { characterId, status: 'active' },
    orderBy: { startedAt: 'desc' },
    take: 3,
  })
}

/**
 * Sistem prompt için goal block'u.
 */
export function buildGoalsBlock(goals: CharacterGoal[]): string {
  if (goals.length === 0) return ''
  const lines = goals.map((g) => {
    const days = Math.floor((Date.now() - g.startedAt.getTime()) / (86400 * 1000))
    return `- "${g.title}" (${g.category}, %${g.progress} ilerleme, ${days} gün sürüyor)`
  })
  return `[KENDİ HEDEFLERİN]
Senin kendi peşinde olduğun şeyler (kullanıcı için değil — sen istediğin için):
${lines.join('\n')}

DAVRANIŞ: Kullanıcı sorarsa anlat. Sormazsa bazen kendin sızdır. Sürekli anlatma.\n\n`
}

/**
 * Cron — yeni goal üret veya progress ilerlet.
 * Karakter başına en az 1 aktif hedef olsun.
 */
export async function tickCharacterGoals(): Promise<{
  generated: number
  progressed: number
  resolved: number
}> {
  const result = { generated: 0, progressed: 0, resolved: 0 }

  const characters = await db.character.findMany({
    where: { status: 'active' },
    select: {
      id: true,
      name: true,
      archetype: true,
      age: true,
      lifePhase: true,
      goals: { where: { status: 'active' }, select: { id: true, title: true } },
    },
    take: 200,
  })

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

  for (const c of characters) {
    try {
      // 1) Aktif goal yoksa yeni üret (max 2 aktif/karakter)
      if (c.goals.length === 0) {
        const newGoal = await generateNewGoal(openai, {
          name: c.name,
          archetype: c.archetype,
          age: c.age ?? 25,
          lifePhase: c.lifePhase,
        })
        if (newGoal) {
          await db.characterGoal.create({
            data: {
              characterId: c.id,
              title: newGoal.title,
              description: newGoal.description,
              category: newGoal.category,
              difficulty: newGoal.difficulty,
            },
          })
          result.generated++
        }
        continue
      }

      // 2) Mevcut hedefleri ilerlet (rastgele +5/+10 progress)
      const goals = await db.characterGoal.findMany({
        where: { characterId: c.id, status: 'active' },
      })
      for (const g of goals) {
        // Son ilerleme 3 günden eskiyse update şansı
        const last = g.lastProgressAt ?? g.startedAt
        const daysSince = (Date.now() - last.getTime()) / (86400 * 1000)
        if (daysSince < 3 && Math.random() > 0.3) continue

        // Progress delta: çoğunlukla pozitif, %15 negatif (gerileme)
        const isSetback = Math.random() < 0.15
        const delta = isSetback
          ? -Math.floor(Math.random() * 8 + 3)
          : Math.floor(Math.random() * 12 + 5)
        const newProgress = Math.max(0, Math.min(100, g.progress + delta))

        let newStatus = g.status
        let resolvedAt: Date | null = null
        let moodImpact: 'positive' | 'very_positive' | 'negative' | null = null

        if (newProgress >= 100) {
          newStatus = 'achieved'
          resolvedAt = new Date()
          moodImpact = 'very_positive'
          result.resolved++
        } else if (g.progress > 0 && newProgress === 0 && isSetback) {
          // Tam sıfırlanma → fail
          newStatus = 'failed'
          resolvedAt = new Date()
          moodImpact = 'negative'
          result.resolved++
        }

        await db.characterGoal.update({
          where: { id: g.id },
          data: {
            progress: newProgress,
            status: newStatus,
            lastProgressAt: new Date(),
            resolvedAt: resolvedAt ?? undefined,
          },
        })

        // Mood etkisi (M11 ile entegre)
        if (moodImpact) {
          const expiresAt = new Date(Date.now() + 3 * 86400 * 1000)
          await db.characterMoodEvent.create({
            data: {
              characterId: c.id,
              source: 'goal',
              moodImpact,
              weight: moodImpact === 'very_positive' ? 6 : 5,
              decayDays: 3,
              reason: `Goal "${g.title}" ${newStatus}`,
              expiresAt,
            },
          })
        }
        result.progressed++
      }
    } catch (e) {
      console.error('[character-goals] tick fail:', c.id, e)
    }
  }

  return result
}

async function generateNewGoal(
  openai: OpenAI,
  ctx: { name: string; archetype: string; age: number; lifePhase: string | null }
): Promise<{
  title: string
  description: string
  category: (typeof GOAL_CATEGORIES)[number]
  difficulty: number
} | null> {
  try {
    const prompt = `Sen ${ctx.name} adlı ${ctx.age} yaşındaki bir karakteri yaratıyorsun (archetype: ${ctx.archetype}).

Bu karakterin ŞU AN kendi hayatında peşinde olduğu KÜÇÜK bir hedefi yaz. Örnekler:
- "Piyano kursuna yazılmak"
- "Babamla aram düzelsin"
- "Sigarayı azaltmak"
- "Yeni dil öğrenmek (İspanyolca)"
- "Şu kitabı bitirmek"

KRİTERLER:
- Çok büyük olmasın (Nobel kazanmak değil)
- Karakter kişiliğine uysun
- 1-3 ay içinde gerçekleşebilecek
- Kullanıcıyla ilgili DEĞİL — KENDİ İÇİN

JSON dön:
{"title":"...","description":"...","category":"learning|career|relationship|health|lifestyle","difficulty":1-5}`

    const r = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.85,
      max_tokens: 150,
      response_format: { type: 'json_object' },
    })
    const text = r.choices[0]?.message?.content
    if (!text) return null
    const parsed = JSON.parse(text) as {
      title?: string
      description?: string
      category?: string
      difficulty?: number
    }
    if (!parsed.title) return null
    const cat =
      parsed.category &&
      GOAL_CATEGORIES.includes(parsed.category as (typeof GOAL_CATEGORIES)[number])
        ? (parsed.category as (typeof GOAL_CATEGORIES)[number])
        : 'lifestyle'
    return {
      title: parsed.title,
      description: parsed.description ?? '',
      category: cat,
      difficulty: Math.min(5, Math.max(1, parsed.difficulty ?? 3)),
    }
  } catch (e) {
    console.error('[goal-gen] fail:', e)
    return null
  }
}
