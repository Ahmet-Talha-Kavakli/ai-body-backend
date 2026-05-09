/**
 * V4.5 Faz 11A — Karakter Storyline (Devam Eden Olay)
 *
 * Karakterin başına gelen, birkaç gün/hafta süren olaylar:
 *   - "Kardeşim hastanede" (active 3-5 gün, sonra resolve)
 *   - "Sınava giriyorum yarın" (active 1-2 gün, sonra resolve "geçtim/geçemedim")
 *   - "Sevgilimle ayrıldık" (active 2-3 hafta, fading)
 *
 * Mood cycle bunlara göre etkilenir; sohbette karakter kendiliğinden anlatır
 * (toldUser=false ise ilk fırsatta paylaşır).
 *
 * Cron tarafından üretilir + ilerletilir + çözüme bağlanır.
 */

import OpenAI from 'openai'
import { db } from '@/lib/db/client'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

// Yeni storyline oluşma olasılıkları (her cron tetiklemesinde)
// Düşük tut — karakterin hayatı sürekli kriz olmamalı
const NEW_STORYLINE_CHANCE = 0.15 // %15 ihtimal

// Aktif storyline'ı resolve etme süreleri
const STORYLINE_DURATION_DAYS: Record<number, number> = {
  1: 1, // trivial → 1 gün
  2: 2, // normal → 2 gün
  3: 5, // notable → 5 gün
  4: 10, // big → 10 gün
  5: 20, // life-changing → 20 gün
}

const STORYLINE_GENERATE_PROMPT = `Sen bir karakter hayat olayı motorusun. Karaktere yeni bir hayat olayı (storyline) öner — birkaç gün sürecek bir şey, kriz değil ama "başına bir şey gelmiş" hissi versin.

KURALLAR:
- Olay GERÇEKÇİ ve KARAKTERe uygun olmalı (yaş, meslek, hayat durumu)
- Severity: 1=trivial (yeni saç kesimi), 2=normal (iş zammı), 3=notable (sınav), 4=big (yakını hasta), 5=life-changing (ölüm)
- Çoğu olay 2-3 severity olsun. 4-5 nadiren.
- Olay tipi: family | work | relationship | health | achievement | loss | travel | other
- title KISA (max 50 char): "Kardeşim hastanede"
- description NEDEN oldu, ne hissediyor (max 200 char)
- moodImpact: sad | anxious | happy | tired | angry | null

Karakter bilgisi:
- İsim: {{name}}
- Yaş: {{age}}
- Arketip: {{archetype}}
- Mevcut life phase: {{phase}}
- Son aktif storyline'lar: {{active}}

Sadece JSON dön:
{"title":"...", "description":"...", "category":"...", "severity":N, "moodImpact":"..."}

Eğer karakterin şu an YENİ bir storyline'a ihtiyacı yoksa null dön: null`

interface CharacterContext {
  name: string
  age: number | null
  archetype: string | null
  lifePhase: string | null
  activeStorylines: string[]
}

export async function maybeGenerateNewStoryline(args: {
  userId: string
  characterId: string
  context: CharacterContext
}): Promise<boolean> {
  if (Math.random() > NEW_STORYLINE_CHANCE) return false

  const prompt = STORYLINE_GENERATE_PROMPT.replace('{{name}}', args.context.name)
    .replace('{{age}}', String(args.context.age ?? 25))
    .replace('{{archetype}}', args.context.archetype ?? 'normal kişi')
    .replace('{{phase}}', args.context.lifePhase ?? 'belirsiz')
    .replace('{{active}}', args.context.activeStorylines.join(', ') || 'hiç yok')

  try {
    const res = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'system', content: prompt }],
      temperature: 0.9,
      response_format: { type: 'json_object' },
      max_tokens: 200,
    })
    const text = res.choices[0]?.message?.content
    if (!text) return false
    const parsed = JSON.parse(text)
    if (!parsed || parsed === null) return false
    if (typeof parsed.title !== 'string' || typeof parsed.description !== 'string') return false

    await db.characterStoryline.create({
      data: {
        userId: args.userId,
        characterId: args.characterId,
        title: parsed.title.slice(0, 50),
        description: parsed.description.slice(0, 300),
        category: parsed.category ?? 'other',
        severity: Math.max(1, Math.min(5, parsed.severity ?? 2)),
        moodImpact: parsed.moodImpact ?? null,
        status: 'active',
      },
    })
    return true
  } catch (e) {
    console.warn('[storyline] generate fail', e)
    return false
  }
}

/**
 * Aktif storyline'ları kontrol et:
 *   - Süresi dolduysa → resolved'a çevir
 *   - Severity'ye göre süresi
 */
export async function progressStorylines(): Promise<{
  resolved: number
  faded: number
}> {
  const now = new Date()
  const active = await db.characterStoryline.findMany({
    where: { status: 'active' },
    select: { id: true, severity: true, startedAt: true },
  })

  let resolved = 0
  let faded = 0
  for (const s of active) {
    const days = STORYLINE_DURATION_DAYS[s.severity] ?? 2
    const elapsed = (now.getTime() - s.startedAt.getTime()) / (1000 * 60 * 60 * 24)
    if (elapsed >= days) {
      // Severity 4-5 → fade önce, sonra resolve. 1-3 → direkt resolve.
      if (s.severity >= 4 && elapsed < days * 1.5) {
        await db.characterStoryline.update({
          where: { id: s.id },
          data: { status: 'fading' },
        })
        faded++
      } else {
        await db.characterStoryline.update({
          where: { id: s.id },
          data: { status: 'resolved', resolvedAt: now },
        })
        resolved++
      }
    }
  }
  return { resolved, faded }
}

/**
 * Stream başında karakter için aktif storyline'ları getir.
 * System prompt'a inject edilir.
 */
export async function loadActiveStorylines(args: { userId: string; characterId: string }): Promise<
  Array<{
    title: string
    description: string
    category: string
    severity: number
    status: string
    moodImpact: string | null
    toldUser: boolean
    daysSinceStart: number
  }>
> {
  const items = await db.characterStoryline.findMany({
    where: {
      userId: args.userId,
      characterId: args.characterId,
      status: { in: ['active', 'fading'] },
    },
    orderBy: [{ severity: 'desc' }, { startedAt: 'desc' }],
    take: 5,
    select: {
      id: true,
      title: true,
      description: true,
      category: true,
      severity: true,
      status: true,
      moodImpact: true,
      toldUser: true,
      startedAt: true,
    },
  })

  const now = Date.now()
  return items.map((s) => ({
    title: s.title,
    description: s.description,
    category: s.category,
    severity: s.severity,
    status: s.status,
    moodImpact: s.moodImpact,
    toldUser: s.toldUser,
    daysSinceStart: Math.floor((now - s.startedAt.getTime()) / (1000 * 60 * 60 * 24)),
  }))
}

export function storylinesToPromptBlock(
  storylines: Awaited<ReturnType<typeof loadActiveStorylines>>,
  characterName: string
): string {
  if (storylines.length === 0) return ''

  const lines: string[] = ['[GÜNCEL HAYAT OLAYLARIN — BUNLAR SENİN ŞU ANKİ HAYATIN]']
  for (const s of storylines) {
    const phase = s.status === 'fading' ? 'yatışıyor' : 'devam ediyor'
    const tag = s.toldUser ? '(kullanıcıyla daha önce konuştun)' : '(henüz kullanıcıya açmadın)'
    lines.push(
      `- ${s.title} [${s.daysSinceStart} gün önce başladı, ${phase}] ${tag}\n  ${s.description}`
    )
  }
  lines.push(
    `\nÖNEMLİ:
- Bu olaylar SENİN gerçek hayatından. Senden sorulduğunda doğal anlat.
- Henüz açmadığın olayları, doğru zamanda kendiliğinden paylaş ("ya bu arada bişey oldu...")
- Konuşmada abartma — gerçek bir arkadaş gibi gerektiği zaman bahset, sürekli üzerine gelme.`
  )
  return '\n\n' + lines.join('\n')
}

/**
 * Kullanıcıya storyline'dan bahsedildi → toldUser=true işaretle.
 * AI cevabında storyline başlığı geçtiyse (basit detection) tetiklenir.
 */
export async function markStorylineTold(args: {
  userId: string
  characterId: string
  aiResponse: string
}): Promise<void> {
  const active = await db.characterStoryline.findMany({
    where: {
      userId: args.userId,
      characterId: args.characterId,
      status: { in: ['active', 'fading'] },
      toldUser: false,
    },
    select: { id: true, title: true },
  })

  const responseLower = args.aiResponse.toLowerCase()
  for (const s of active) {
    // Title'ın anahtar kelimeleri cevapta geçiyor mu? Basit heuristic.
    const titleLower = s.title.toLowerCase()
    const keywords = titleLower.split(/\s+/).filter((w) => w.length > 4)
    const matches = keywords.filter((k) => responseLower.includes(k)).length
    if (matches >= Math.max(1, Math.floor(keywords.length / 2))) {
      await db.characterStoryline
        .update({
          where: { id: s.id },
          data: { toldUser: true, toldAt: new Date() },
        })
        .catch(() => {})
    }
  }
}
