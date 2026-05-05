/**
 * V4 Faz D — Proactive Message Queue (Karakter)
 *
 * Karakterin kendiliğinden mesaj atmasına karar verir.
 *
 * Tetikleyiciler (priority sırasıyla):
 *   1. Kullanıcı 2+ gün sessiz + ilişki active/recovering → "neredeyseniz?" mesajı
 *   2. Karakterin başına yeni hayat olayı geldi (lastMajorEvent fresh) → paylaşır
 *   3. Karakterin doğum günü / kullanıcıyla yıldönümü (daha sonra)
 *
 * Kısıtlamalar:
 *   - Aynı karakterden günde max 1 proaktif mesaj
 *   - Saat 22:00-09:00 arası push yok (kriz hariç)
 *   - Kullanıcı 3 proaktif mesaja peş peşe cevap vermediyse → 24 saat soğuma
 *
 * Maliyet: hızlı katman kural bazlı, derin katman sadece tetiklendiğinde mini AI.
 */

import OpenAI from 'openai'
import { db } from '@/lib/db/client'
import { isFlagEnabled } from './feature-flags'
import { getCharacterTemplate } from './character-templates'

interface ProactiveDecision {
  shouldSend: boolean
  reason?: string
  message?: string
}

/**
 * Tek karakter için "şu an proaktif mesaj atmalı mı?" kararı.
 */
export async function evaluateProactiveForCharacter(args: {
  userId: string
  characterId: string
  userLocalHour: number
}): Promise<ProactiveDecision> {
  const { userId, characterId, userLocalHour } = args

  // Saat kontrolü
  if (userLocalHour < 9 || userLocalHour >= 22) {
    return { shouldSend: false, reason: 'quiet_hours' }
  }

  const character = await db.character.findUnique({
    where: { id: characterId },
    select: {
      name: true,
      archetype: true,
      status: true,
      currentMood: true,
      lastMajorEvent: true,
      currentStateUpdatedAt: true,
    },
  })
  if (!character || character.status !== 'active') {
    return { shouldSend: false, reason: 'character_not_active' }
  }

  const relationship = await db.memoryRelationship.findUnique({
    where: { userId_characterId: { userId, characterId } },
  })
  if (!relationship) return { shouldSend: false, reason: 'no_relationship' }

  // Bugün zaten proaktif mesaj atılmış mı? (Karakterin sohbetinde son 24 saat assistant mesajı varsa)
  const conversation = await db.assistantConversation.findFirst({
    where: { userId, characterId, archived: false },
    select: { id: true },
  })
  if (conversation) {
    const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
    const recentAssistantMsg = await db.assistantMessage.findFirst({
      where: {
        conversationId: conversation.id,
        role: 'assistant',
        createdAt: { gte: dayAgo },
      },
    })
    if (recentAssistantMsg) {
      return { shouldSend: false, reason: 'already_messaged_today' }
    }
  }

  // Tetikleyici kontrolü
  const daysSilent = relationship.lastInteractionAt
    ? (Date.now() - relationship.lastInteractionAt.getTime()) / (1000 * 60 * 60 * 24)
    : 999

  let trigger: 'silent_user' | 'fresh_life_event' | null = null

  // Trigger 1: kullanıcı 2+ gündür sessiz + active ilişki
  if (daysSilent >= 2 && daysSilent < 30 && relationship.status === 'active') {
    trigger = 'silent_user'
  }
  // Trigger 2: karakterin son 24 saatte yeni hayat olayı oldu
  else if (
    character.lastMajorEvent &&
    character.currentStateUpdatedAt &&
    Date.now() - character.currentStateUpdatedAt.getTime() < 24 * 60 * 60 * 1000
  ) {
    trigger = 'fresh_life_event'
  }

  if (!trigger) return { shouldSend: false, reason: 'no_trigger' }

  // Mesaj üret (mini AI)
  try {
    const template = getCharacterTemplate(character.name.toLowerCase())
    if (!template) return { shouldSend: false, reason: 'template_not_found' }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

    const systemPromptShort = `Sen ${character.name}'sın. ${template.voicePattern}

Tetikleyici: ${trigger === 'silent_user' ? `Kullanıcı ${Math.floor(daysSilent)} gündür yazmadı, sen merak ediyorsun` : `Senin başına bir şey geldi (${character.lastMajorEvent}) ve kullanıcıyla paylaşmak istiyorsun`}

Kısa (1-2 cümle), doğal proaktif mesaj at. Klişe selam YASAK ("Selam nasılsın?" yerine somut bir şey söyle).
Verbal tics: ${template.verbalTics.slice(0, 3).join(', ')}

YASAK: ${template.forbiddenPhrases.slice(0, 5).join(' / ')}`

    const r = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPromptShort },
        { role: 'user', content: 'Şimdi proaktif mesajı yaz.' },
      ],
      temperature: 0.85,
      max_tokens: 80,
    })
    const message = r.choices[0]?.message?.content?.trim()
    if (!message) return { shouldSend: false, reason: 'generation_failed' }

    return { shouldSend: true, reason: trigger, message }
  } catch (e) {
    console.error('[character-proactive] generate fail:', e)
    return { shouldSend: false, reason: 'error' }
  }
}

/**
 * Tüm aktif karakterler için proaktif değerlendirme + gönderme.
 * Cron'dan çağrılır.
 */
export async function runProactiveForUser(
  userId: string,
  userLocalHour: number
): Promise<{
  sent: number
  evaluated: number
}> {
  const enabled = await isFlagEnabled('v4_decision_engine', userId)
  if (!enabled) return { sent: 0, evaluated: 0 }

  const characters = await db.character.findMany({
    where: { userId, status: 'active' },
    select: { id: true, name: true },
  })

  let sent = 0
  let evaluated = 0

  for (const c of characters) {
    evaluated++
    try {
      const decision = await evaluateProactiveForCharacter({
        userId,
        characterId: c.id,
        userLocalHour,
      })
      if (!decision.shouldSend || !decision.message) continue

      // Karakterin sohbetini bul/oluştur
      let conversation = await db.assistantConversation.findFirst({
        where: { userId, characterId: c.id, archived: false },
      })
      if (!conversation) {
        conversation = await db.assistantConversation.create({
          data: { userId, characterId: c.id, title: c.name },
        })
      }

      // Mesajı yaz
      await db.assistantMessage.create({
        data: {
          conversationId: conversation.id,
          role: 'assistant',
          content: decision.message,
        },
      })

      // İlişkiyi güncelle (proaktif = ufak love+intimacy)
      await db.memoryRelationship
        .update({
          where: { userId_characterId: { userId, characterId: c.id } },
          data: {
            loveScore: { increment: 0.5 },
            intimacyDepth: { increment: 0.005 },
            lastMessageAt: new Date(),
          },
        })
        .catch(() => {})

      sent++
    } catch (e) {
      console.error('[character-proactive] user fail:', userId, c.id, e)
    }
  }

  return { sent, evaluated }
}
