/**
 * V4 Faz D — Life Engine (Yaşam Motoru)
 *
 * Karakterlerin "yaşadığını" hissettiren motor. Günde 2 kez tetiklenir
 * (sabah + akşam). Her aktif karakter için:
 *
 *   1. Günlük yaşam üretimi — küçük olay (kafe, iş, dinlenme), mood değişimi
 *   2. Hayat olayı kontrolü — template.lifeEventProbabilities'e göre
 *   3. Tracking → graph anlamlandırma (kullanıcı verisi)
 *   4. Karakterler arası etkileşim simülasyonu (haftada birkaç kez)
 *   5. Proaktif mesaj kuyruğu — hangi karakter bugün ulaşmak istiyor?
 *
 * Maliyet odaklı:
 *   - Sadece son 7 günde etkileşim olmuş karakterler (uyku modu)
 *   - Günlük yaşam: gpt-4o-mini batch
 *   - Hayat olayı: probabilistik tetik, AI sadece olay olunca
 */

import OpenAI from 'openai'
import { db } from '@/lib/db/client'
import { isFlagEnabled } from './feature-flags'
import { getCharacterTemplate } from './character-templates'

const MODEL_NANO = 'gpt-4o-mini' // life engine için

interface DailyLifeUpdate {
  newMood: string
  newActivity: string | null
  newLocation: string | null
  newWeeklyEnergy: number
  smallEvent: string | null // "Bugün kafede arkadaşıyla buluştu"
}

const DAILY_PROMPT = `Sen karakterin yaşam motorusun. Karakterin bugünkü durumunu üretiyorsun. JSON çıktı:
{
  "newMood": "calm|energetic|thoughtful|tired|happy|sad|anxious",
  "newActivity": "sleeping|eating|working|resting|cafe|outside|null",
  "newLocation": "home|cafe|work|outside|null",
  "newWeeklyEnergy": 0..100,
  "smallEvent": "1 cümlelik küçük olay (Türkçe) veya null"
}

Kurallar:
- Mood karakterin kişiliğine + dünkü durumuna + gün/saate göre.
- weeklyEnergy: pazartesi 100, cuma 40 azalır; pazar yeniden 80.
- smallEvent: Karakterin günlük hayatından bir an. Aşırı dramatik değil. Ayda 5-7 kez olur, gerisi null.`

/**
 * Tek karakter için günlük yaşam üretimi.
 */
async function generateDailyLife(args: {
  characterName: string
  archetype: string
  currentMood: string | null
  weeklyEnergy: number
  lifePhase: string | null
  storylines: string[]
  dayOfWeek: number // 0=Sun, 1=Mon...
}): Promise<DailyLifeUpdate | null> {
  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

    const prompt = `KARAKTER: ${args.characterName} (${args.archetype})
Dünkü mood: ${args.currentMood ?? 'belirsiz'}
Haftalık enerji: ${args.weeklyEnergy}/100
Hayat fazı: ${args.lifePhase ?? 'normal'}
Devam eden hikayeler: ${args.storylines.join(', ') || 'yok'}
Günün günü: ${['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'][args.dayOfWeek]}

Bu karakter bugün nasıl?`

    const r = await openai.chat.completions.create({
      model: MODEL_NANO,
      messages: [
        { role: 'system', content: DAILY_PROMPT },
        { role: 'user', content: prompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
      max_tokens: 200,
    })
    const raw = r.choices[0]?.message?.content
    if (!raw) return null
    return JSON.parse(raw) as DailyLifeUpdate
  } catch (e) {
    console.error('[life-engine generateDailyLife]', e)
    return null
  }
}

/**
 * Probabilistik hayat olayı tetiği. Karakter template'inden çekiliyor.
 */
function maybeRollLifeEvent(templateKey: string): { name: string; description: string } | null {
  const template = getCharacterTemplate(templateKey)
  if (!template) return null

  // Her olay için rastgele zar at — dailyChance = monthlyChance / 30
  for (const e of template.lifeEventProbabilities) {
    const dailyChance = e.monthlyChance / 30
    if (Math.random() < dailyChance) {
      return { name: e.name, description: e.description }
    }
  }
  return null
}

/**
 * Tek kullanıcı için sabah motoru — onun aktif karakterlerini işle.
 */
export async function runMorningEngineForUser(userId: string): Promise<{
  charactersProcessed: number
  livesUpdated: number
  eventsTriggered: number
  errors: number
}> {
  const stats = { charactersProcessed: 0, livesUpdated: 0, eventsTriggered: 0, errors: 0 }

  const enabled = await isFlagEnabled('v4_life_engine', userId)
  if (!enabled) return stats

  // Aktif karakterler — son 7 günde etkileşim olmuşlar (uyku modu kuralı)
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  const characters = await db.character.findMany({
    where: {
      userId,
      status: { in: ['active', 'cold', 'recovering'] },
    },
    select: {
      id: true,
      name: true,
      archetype: true,
      currentMood: true,
      weeklyEnergy: true,
      lifePhase: true,
      currentStorylines: true,
      lastMajorEvent: true,
    },
  })

  // Kim aktif (recently interacted)?
  const recentInteractions = await db.memoryRelationship.findMany({
    where: {
      userId,
      characterId: { in: characters.map((c) => c.id) },
      OR: [
        { lastInteractionAt: { gte: sevenDaysAgo } },
        { lastInteractionAt: null }, // yeni gelen karakter
      ],
    },
    select: { characterId: true },
  })
  const activeIds = new Set(recentInteractions.map((r) => r.characterId))
  const activeCharacters = characters.filter((c) => activeIds.has(c.id))

  const dayOfWeek = new Date().getUTCDay()

  for (const character of activeCharacters) {
    stats.charactersProcessed++
    try {
      // 1) Günlük yaşam üretimi
      const storylines = Array.isArray(character.currentStorylines)
        ? (character.currentStorylines as string[])
        : []

      const update = await generateDailyLife({
        characterName: character.name,
        archetype: character.archetype,
        currentMood: character.currentMood,
        weeklyEnergy: character.weeklyEnergy,
        lifePhase: character.lifePhase,
        storylines,
        dayOfWeek,
      })

      if (update) {
        await db.character.update({
          where: { id: character.id },
          data: {
            currentMood: update.newMood,
            currentActivity: update.newActivity,
            currentLocation: update.newLocation,
            weeklyEnergy: clampInt(update.newWeeklyEnergy, 0, 100),
            lastMajorEvent: update.smallEvent ?? character.lastMajorEvent,
            currentStateUpdatedAt: new Date(),
          },
        })
        stats.livesUpdated++
      }

      // 2) Hayat olayı zarı
      const templateKey = character.name.toLowerCase()
      const event = maybeRollLifeEvent(templateKey)
      if (event) {
        // Graph'a memory node olarak yaz (karakter sahibi)
        await db.memoryNode
          .create({
            data: {
              userId,
              ownerType: 'character',
              ownerId: character.id,
              type: 'event',
              title: event.name,
              content: event.description,
              importance: 3,
              visibility: 'public',
              sourceType: 'character_event',
            },
          })
          .catch(() => {})
        await db.character.update({
          where: { id: character.id },
          data: { lastMajorEvent: event.description },
        })
        stats.eventsTriggered++
      }
    } catch (e) {
      console.error('[life-engine] character fail:', character.id, e)
      stats.errors++
    }
  }

  return stats
}

/**
 * Karakterler arası etkileşim simülasyonu.
 * Kullanıcının iki yakın karakteri arasında kısa bir konuşma simüle edilir,
 * sonuç graph'a yazılır. Haftada birkaç kez.
 */
export async function simulateInterCharacterInteractions(userId: string): Promise<{
  simulated: number
}> {
  const enabled = await isFlagEnabled('v4_life_engine', userId)
  if (!enabled) return { simulated: 0 }

  // İki rastgele aktif karakter seç (intimacy yüksek olanlardan tercihen)
  const characters = await db.character.findMany({
    where: { userId, status: 'active' },
    select: { id: true, name: true, archetype: true },
  })
  if (characters.length < 2) return { simulated: 0 }

  // Rastgele 2 farklı karakter
  const idx1 = Math.floor(Math.random() * characters.length)
  let idx2 = Math.floor(Math.random() * characters.length)
  if (idx2 === idx1) idx2 = (idx2 + 1) % characters.length
  const c1 = characters[idx1]
  const c2 = characters[idx2]

  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
    const r = await openai.chat.completions.create({
      model: MODEL_NANO,
      messages: [
        {
          role: 'system',
          content:
            'Sen iki karakter arasında kısa bir günlük etkileşim simüle ediyorsun. JSON: {"summary": "2 cümle özet", "topic": "kullanıcı|hayat|drama|other", "userMentioned": true|false, "outcome": "positive|neutral|negative"}',
        },
        {
          role: 'user',
          content: `${c1.name} (${c1.archetype}) ile ${c2.name} (${c2.archetype}) bugün karşılaştı / mesajlaştı. Kısa bir an üret.`,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
      max_tokens: 200,
    })
    const raw = r.choices[0]?.message?.content
    if (!raw) return { simulated: 0 }
    const parsed = JSON.parse(raw) as {
      summary: string
      topic: string
      userMentioned: boolean
      outcome: string
    }

    // Memory node olarak yaz (her iki karaktere de bağla — owner c1, edge c2'ye)
    const node1 = await db.memoryNode.create({
      data: {
        userId,
        ownerType: 'character',
        ownerId: c1.id,
        type: 'event',
        title: `${c1.name} - ${c2.name} etkileşimi`,
        content: parsed.summary,
        importance: parsed.userMentioned ? 3 : 2,
        visibility: 'public',
        sourceType: 'character_event',
      },
      select: { id: true },
    })

    return { simulated: 1 }
  } catch (e) {
    console.error('[life-engine simulateInterCharacter]', e)
    return { simulated: 0 }
  }
}

function clampInt(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, Math.round(n)))
}
