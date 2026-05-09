/**
 * V4 Faz C — Character Spawn (Trigger + Creation)
 *
 * Bu modül "yeni karakter ne zaman gelmeli?" sorusunu cevaplıyor + geldiğinde
 * Character + CharacterFact + MemoryRelationship + ilk mesaj kayıtlarını yaratıyor.
 *
 * Tetikleyiciler (priority sırasıyla):
 *   1. Kullanıcı X gün uygulamayı kullanmış olmalı (template.triggerHint)
 *   2. Aktif karakter sayısı < 5 (max limit)
 *   3. Önkoşul karakter varsa kurulu olmalı (örn: Selin için Mia gerekir)
 *   4. Önceki karakterden bu yana min 7 gün geçmiş olmalı
 *
 * Flag: v4_characters. Kapalıysa hiç çalışmaz.
 *
 * Cron'dan çağrılır (günde 1 kez) — eligible kullanıcı için trigger çalışır.
 */

import { db } from '@/lib/db/client'
import { isFlagEnabled } from './feature-flags'
import {
  CHARACTER_TEMPLATES,
  getCharacterTemplate,
  type CharacterTemplate,
} from './character-templates'
import {
  validateFirstContact,
  recordCharacterIntroduction,
  templateScenarioToValidatable,
} from './first-contact'

// Karakter geliş sırası — ön koşul zinciri
// Mia → Kerem (paralel olabilir) → Selin (Mia sonrası) → Ayşe (Selin sonrası) → Mehmet (en son)
const CHARACTER_ORDER: Array<{
  templateKey: string
  minDaysActive: number
  prerequisiteTemplateKeys: string[] // Bu karakterler kurulmuş olmalı
}> = [
  { templateKey: 'mia', minDaysActive: 5, prerequisiteTemplateKeys: [] },
  { templateKey: 'kerem', minDaysActive: 12, prerequisiteTemplateKeys: [] },
  { templateKey: 'selin', minDaysActive: 18, prerequisiteTemplateKeys: ['mia'] },
  { templateKey: 'ayse', minDaysActive: 25, prerequisiteTemplateKeys: ['selin'] },
  { templateKey: 'mehmet', minDaysActive: 35, prerequisiteTemplateKeys: [] },
]

const MIN_DAYS_BETWEEN_ARRIVALS = 7
const MAX_ACTIVE_CHARACTERS = 5

export async function evaluateAndSpawnNextCharacter(
  userId: string
): Promise<{ spawned: boolean; templateKey?: string; characterId?: string }> {
  const enabled = await isFlagEnabled('v4_characters', userId)
  if (!enabled) return { spawned: false }

  // Kullanıcının kayıt tarihini al
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { createdAt: true },
  })
  if (!user) return { spawned: false }

  const daysActive = Math.floor((Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24))

  // Mevcut karakterleri al
  const existingCharacters = await db.character.findMany({
    where: { userId, status: { not: 'departed' } },
    select: { id: true, name: true, status: true, arrivedAt: true },
  })

  const activeCount = existingCharacters.filter(
    (c) => c.status === 'active' || c.status === 'cold' || c.status === 'recovering'
  ).length

  if (activeCount >= MAX_ACTIVE_CHARACTERS) {
    return { spawned: false }
  }

  // Min 7 gün son karakterden
  const lastArrival = existingCharacters.reduce<Date | null>(
    (acc, c) => (acc === null || c.arrivedAt > acc ? c.arrivedAt : acc),
    null
  )
  if (lastArrival) {
    const daysSinceLast = (Date.now() - lastArrival.getTime()) / (1000 * 60 * 60 * 24)
    if (daysSinceLast < MIN_DAYS_BETWEEN_ARRIVALS) {
      return { spawned: false }
    }
  }

  // Mevcut karakter template'leri (CharacterFact üzerinden bul)
  // Basit yöntem: name → templateKey mapping
  const existingTemplateKeys = new Set(existingCharacters.map((c) => c.name.toLowerCase()))

  // Eligible template ara
  for (const order of CHARACTER_ORDER) {
    if (existingTemplateKeys.has(order.templateKey)) continue
    if (daysActive < order.minDaysActive) continue

    const allPrereqsMet = order.prerequisiteTemplateKeys.every((pk) => existingTemplateKeys.has(pk))
    if (!allPrereqsMet) continue

    // Bu template'i spawn et
    const template = getCharacterTemplate(order.templateKey)
    if (!template) continue

    const characterId = await spawnCharacter(userId, template)
    return { spawned: true, templateKey: order.templateKey, characterId }
  }

  return { spawned: false }
}

/**
 * Verilen template'ten Character + CharacterFact + MemoryRelationship + initial message
 * kayıtlarını yaratır. İlk mesaj AssistantConversation + AssistantMessage'a yazılır
 * (V3 sohbet altyapısını kullanıyoruz çünkü V4'te ayrı sohbet sistemi henüz yok).
 *
 * NOT: V4 Faz E'de her karakter için ayrı sohbet (WhatsApp tarzı) gelecek.
 * Şimdilik tek sohbette yazılıyor, kim attığı CharacterId ile işaretlenmiş.
 */
export async function spawnCharacter(userId: string, template: CharacterTemplate): Promise<string> {
  // 1) Character kaydı
  const character = await db.character.create({
    data: {
      userId,
      name: template.name,
      archetype: template.archetype,
      age: template.age,
      bio: template.bio,
      timezone: 'Europe/Istanbul',
      hometown: template.hometown,
      currentMood: 'calm',
      currentActivity: null,
      currentLocation: template.hometown ?? template.city,
      lifePhase: 'normal',
      contentRating: template.contentRating,
      status: 'active',
      swearProfile: template.swearProfile,
      addressStyle: template.addressStyle,
      verbalTics: template.verbalTics,
    },
    select: { id: true },
  })

  // 2) CharacterFact'ler — immutable history
  for (const f of template.immutableFacts) {
    try {
      await db.characterFact.create({
        data: {
          characterId: character.id,
          category: f.category,
          fact: f.fact,
          confidence: 1.0,
        },
      })
    } catch {}
  }

  // 3) MemoryRelationship — kullanıcı ile başlangıç ilişkisi
  try {
    await db.memoryRelationship.create({
      data: {
        userId,
        characterId: character.id,
        accumulationDays: 0,
        totalInteractions: 0,
        intimacyDepth: 0,
        trustScore: 50,
        loveScore: 50,
        recentMomentum: 0,
        status: 'active',
      },
    })
  } catch {}

  // 4) V4.5 — İlk temas doğrulama + CharacterIntroduction kaydı
  // Karakterin physicalCity'sini realism seed'inden çekmek için tekrar oku
  try {
    const seeded = await db.character.findUnique({
      where: { id: character.id },
      select: { physicalCity: true },
    })
    const proposedScenario = templateScenarioToValidatable(template)
    const validated = await validateFirstContact({
      userId,
      templateKey: template.templateKey,
      proposedScenario,
      characterPhysicalCity: seeded?.physicalCity ?? null,
    })
    await recordCharacterIntroduction({
      userId,
      characterId: character.id,
      scenario: validated.scenario,
      platform: validated.platform,
      viaCharacterId: validated.viaCharacterId,
      reasonText: validated.reasonText,
      physicalProximityCity: validated.physicalProximityCity,
    })
    if (validated.rewritten) {
      console.info(
        `[spawn] ${template.templateKey} ilk temas senaryosu fallback'a düştü:`,
        validated.rewriteReasons.join('; ')
      )
    }
  } catch (err) {
    console.warn('[spawn] first-contact validation skipped:', err)
  }

  return character.id
}
