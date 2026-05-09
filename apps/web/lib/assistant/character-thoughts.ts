/**
 * V4.6 M12 — Karakter İç Düşünce Sistemi
 *
 * Karakter sen yazmıyorken bile seni düşünür. Cron günde 3-5 kez her karakter
 * için iç düşünce üretir. 4 yola gidebilir:
 *   1. Hemen mesaj (yakınlık + heyecan yüksek + emotion=missing/excited)
 *   2. Beklet (2-12 saat sonra)
 *   3. Status'e dök (Faz 6 status sistemi gerektiriyor — şimdilik discard)
 *   4. Hiç yansıtma (sadece hafızada kalır, "geçen seni düşünmüştüm" iddiası
 *      gerçekleşince DB'den çekilir)
 *
 * Replika "sürekli yazar" ile "hiç yazmaz" arasındaki doğru noktayı tutturur.
 */

import OpenAI from 'openai'
import { db } from '@/lib/db/client'

interface ThoughtGenInput {
  characterId: string
  userId: string
  characterName: string
  characterArchetype: string
  recentSummary?: string | null
  daysSinceLast?: number
  loveScore: number
  trustScore: number
  trigger: 'memory_recall' | 'storyline' | 'random' | 'anniversary' | 'missing'
}

const ROUTE_WEIGHTS = {
  // [send_dm, delay, status, discard]
  high_intimacy_missing: [0.45, 0.25, 0.05, 0.25],
  high_intimacy_random: [0.15, 0.25, 0.05, 0.55],
  med_intimacy: [0.1, 0.2, 0.05, 0.65],
  low_intimacy: [0.03, 0.15, 0.02, 0.8],
}

function pickWeighted<T>(items: T[], weights: number[]): T {
  const total = weights.reduce((a, b) => a + b, 0)
  let r = Math.random() * total
  for (let i = 0; i < items.length; i++) {
    r -= weights[i]
    if (r <= 0) return items[i]
  }
  return items[items.length - 1]
}

/**
 * Bir thought üret + route kararı ver.
 * NOT: SADECE üretir. Eğer route='dm' ise mesaj atma işi proactive sistemine kalır.
 */
export async function generateThought(input: ThoughtGenInput): Promise<{
  thoughtId: string
  route: 'dm' | 'delay' | 'status' | 'none'
} | null> {
  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
    const triggerLine = (() => {
      switch (input.trigger) {
        case 'memory_recall':
          return 'Geçen konuştuğunuz bir konu birden aklına geldi'
        case 'storyline':
          return 'Kendi hayatından bir şey hatırladın → kullanıcıyı düşündün'
        case 'anniversary':
          return 'Bugün özel bir tarih (tanışma, doğum günü vb)'
        case 'missing':
          return 'Kullanıcıyı özledin'
        default:
          return 'Birden aklına geldi'
      }
    })()

    const r = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `Sen ${input.characterName} adlı karakterin iç sesisin. Kullanıcı şu an yazmıyor ama sen onu düşünüyorsun.

Tetikleyici: ${triggerLine}
${input.daysSinceLast ? `Son etkileşim: ${input.daysSinceLast} gün önce` : ''}

Kısa bir İÇ DÜŞÜNCE yaz (1-2 cümle). Karaktere özgü ses. Bu kullanıcıya YAZILMAYACAK — sadece senin kafanda.

Örnek format:
- "Acaba Talha bugün iyi mi, dün biraz dağınıktı..."
- "O kafede konuştuğumuz şarkı yine aklıma geldi."
- "Ya bu hafta hiç sormadım, telefon faturası nasıl bitti?"

JSON dön:
{"content":"...","emotion":"happy|sad|curious|missing|excited|worried"}`,
        },
        { role: 'user', content: 'Şimdi iç düşünceyi yaz.' },
      ],
      temperature: 0.9,
      max_tokens: 100,
      response_format: { type: 'json_object' },
    })
    const text = r.choices[0]?.message?.content
    if (!text) return null
    const parsed = JSON.parse(text) as { content?: string; emotion?: string }
    if (!parsed.content) return null

    // Route kararı: yakınlık + emotion'a göre ağırlıklandır
    const intimacy =
      input.loveScore >= 70 && input.trustScore >= 60
        ? 'high'
        : input.loveScore >= 50
          ? 'med'
          : 'low'
    let weights: number[]
    if (intimacy === 'high' && (parsed.emotion === 'missing' || parsed.emotion === 'excited')) {
      weights = ROUTE_WEIGHTS.high_intimacy_missing
    } else if (intimacy === 'high') {
      weights = ROUTE_WEIGHTS.high_intimacy_random
    } else if (intimacy === 'med') {
      weights = ROUTE_WEIGHTS.med_intimacy
    } else {
      weights = ROUTE_WEIGHTS.low_intimacy
    }
    const route = pickWeighted(['dm', 'delay', 'status', 'none'] as const, weights)

    // Status route'u Faz 6'da aktif — şimdilik none'a düşür
    const finalRoute = route === 'status' ? 'none' : route

    let scheduledFor: Date | null = null
    if (finalRoute === 'delay') {
      const hours = 2 + Math.random() * 10
      scheduledFor = new Date(Date.now() + hours * 3600 * 1000)
    }

    const thought = await db.characterThought.create({
      data: {
        characterId: input.characterId,
        userId: input.userId,
        content: parsed.content,
        trigger: input.trigger,
        emotion: parsed.emotion ?? 'curious',
        decidedRoute: finalRoute,
        scheduledFor,
        status: finalRoute === 'none' ? 'discarded' : 'unprocessed',
        processedAt: finalRoute === 'none' ? new Date() : null,
      },
    })

    return { thoughtId: thought.id, route: finalRoute }
  } catch (e) {
    console.error('[character-thoughts] gen fail:', e)
    return null
  }
}

/**
 * Cron — her 4-6 saatte bir aktif karakterler için thought üret.
 */
export async function tickCharacterThoughts(): Promise<{ generated: number }> {
  const characters = await db.character.findMany({
    where: { status: 'active' },
    select: {
      id: true,
      userId: true,
      name: true,
      archetype: true,
      memoryRelationships: undefined,
    },
    take: 200,
  })

  let generated = 0
  for (const c of characters) {
    // %30-50 ihtimal
    if (Math.random() > 0.4) continue

    try {
      const rel = await db.memoryRelationship.findUnique({
        where: { userId_characterId: { userId: c.userId, characterId: c.id } },
        select: { trustScore: true, loveScore: true, lastInteractionAt: true },
      })
      if (!rel) continue

      const daysSince = rel.lastInteractionAt
        ? Math.floor((Date.now() - rel.lastInteractionAt.getTime()) / (86400 * 1000))
        : 999

      // Trigger seç
      const triggerPool: Array<ThoughtGenInput['trigger']> = ['random']
      if (daysSince >= 2) triggerPool.push('missing', 'memory_recall')
      if (daysSince >= 1) triggerPool.push('memory_recall')
      const trigger = triggerPool[Math.floor(Math.random() * triggerPool.length)]

      const r = await generateThought({
        characterId: c.id,
        userId: c.userId,
        characterName: c.name,
        characterArchetype: c.archetype,
        daysSinceLast: daysSince,
        loveScore: rel.loveScore,
        trustScore: rel.trustScore,
        trigger,
      })
      if (r) generated++
    } catch (e) {
      console.error('[character-thoughts] char fail:', c.id, e)
    }
  }
  return { generated }
}

/**
 * Stream'de "geçen seni düşündüm" iddiası gerçekleşmek için
 * son N gün içindeki düşünceleri çek.
 */
export async function loadRecentThoughtsForRecall(args: {
  userId: string
  characterId: string
  withinDays?: number
}): Promise<Array<{ content: string; daysAgo: number; emotion: string }>> {
  const since = new Date(Date.now() - (args.withinDays ?? 30) * 86400 * 1000)
  const thoughts = await db.characterThought.findMany({
    where: { userId: args.userId, characterId: args.characterId, createdAt: { gte: since } },
    orderBy: { createdAt: 'desc' },
    take: 5,
    select: { content: true, createdAt: true, emotion: true },
  })
  return thoughts.map((t) => ({
    content: t.content,
    emotion: t.emotion,
    daysAgo: Math.floor((Date.now() - t.createdAt.getTime()) / (86400 * 1000)),
  }))
}

export function buildThoughtRecallBlock(
  thoughts: Awaited<ReturnType<typeof loadRecentThoughtsForRecall>>
): string {
  if (thoughts.length === 0) return ''
  const lines = thoughts.slice(0, 3).map((t) => {
    const dayPhrase = t.daysAgo === 0 ? 'bugün' : t.daysAgo === 1 ? 'dün' : `${t.daysAgo} gün önce`
    return `- ${dayPhrase}: "${t.content}" (${t.emotion})`
  })
  return `[KULLANICI HAKKINDA SON DÜŞÜNCELERİN]
Bu kullanıcı senin aklına gelen son şeyler (gerçekten):
${lines.join('\n')}

KURAL: Kullanıcı "geçen seni düşündüm" derse VEYA uygun bağlamda, BU GERÇEK düşüncelerinden birine referans verebilirsin. Uydurma DEĞİL — gerçek kayıt.\n\n`
}
