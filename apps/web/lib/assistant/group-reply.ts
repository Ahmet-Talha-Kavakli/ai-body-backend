/**
 * V4 Faz F — Grup Karakter Cevap Üretici
 *
 * ScheduledGroupMessage işlenirken bu fonksiyon çağrılır. Karakterin sistem
 * prompt'unu (tek-sohbet ile aynı) + grup bağlamını + son 12 mesajı verir,
 * gpt-4o-mini ile kısa cevap üretir.
 *
 * Karakter cevabı tekil-sohbetinkinden daha kısa tutulur (1-3 cümle) — grup
 * sohbetinde herkes birlikte konuşur, kimse paragraf yazmaz.
 */

import OpenAI from 'openai'
import { db } from '@/lib/db/client'
import { buildCharacterSystemPrompt } from './character-prompt'
import { getCharacterTemplate } from './character-templates'

const MODEL = 'gpt-4o-mini'

export async function generateGroupReply(args: {
  characterId: string
  groupId: string
  triggerMessageId: string
}): Promise<{ content: string } | null> {
  const character = await db.character.findUnique({
    where: { id: args.characterId },
    include: { facts: true },
  })
  if (!character) return null

  const template = getCharacterTemplate(character.name.toLowerCase())
  if (!template) {
    console.error('[group-reply] no template for', character.name)
    return null
  }

  const group = await db.groupConversation.findUnique({
    where: { id: args.groupId },
    include: {
      user: {
        select: { id: true, name: true, timezone: true },
      },
      members: {
        where: { leftAt: null },
        include: {
          character: { select: { id: true, name: true, archetype: true } },
        },
      },
    },
  })
  if (!group) return null

  // İlişki snapshot'ı (bu kullanıcı + bu karakter arası)
  const relationship = await db.memoryRelationship.findFirst({
    where: { userId: group.userId, characterId: args.characterId },
    select: {
      status: true,
      trustScore: true,
      loveScore: true,
      intimacyDepth: true,
      momentum: true,
      accumulationDays: true,
    },
  })

  // Son 12 grup mesajı — bağlam
  const recentMessages = await db.groupMessage.findMany({
    where: { groupId: args.groupId },
    orderBy: { createdAt: 'desc' },
    take: 12,
    select: {
      senderType: true,
      senderCharacterId: true,
      senderCharacter: { select: { name: true } },
      content: true,
    },
  })
  const ordered = recentMessages.reverse()

  const otherMembers = group.members
    .filter((m) => m.character.id !== args.characterId)
    .map((m) => `${m.character.name} (${m.character.archetype})`)
    .join(', ')

  const groupContextBlock = `[GRUP SOHBETİ]
Bu kullanıcı + ${group.members.length - 1} arkadaşının olduğu bir grup sohbeti.
Diğer üyeler: ${otherMembers || 'yok'}.
Tüm mesajlara cevap vermek zorunda değilsin — gerçek hayatta nasılsa öyle davran.
Cevabın KISA olsun (1-3 cümle). Grup sohbetinde paragraf yazılmaz.
Bazen kullanıcıya, bazen başka bir üyeye laf atabilirsin.`

  // Sistem prompt — tek-sohbettekiyle aynı yapı, ekstra olarak grup bağlamı
  const systemPrompt =
    buildCharacterSystemPrompt({
      template,
      state: {
        name: character.name,
        age: character.age,
        city: template.city,
        hometown: character.hometown,
        bio: character.bio ?? template.bio,
        currentMood: character.currentMood,
        currentActivity: character.currentActivity,
        currentLocation: character.currentLocation,
        lifePhase: character.lifePhase,
        currentStorylines: Array.isArray(character.currentStorylines)
          ? (character.currentStorylines as string[])
          : null,
        weeklyEnergy: character.weeklyEnergy,
        lastMajorEvent: character.lastMajorEvent,
      },
      relationship: relationship
        ? {
            status: relationship.status,
            trustScore: relationship.trustScore,
            loveScore: relationship.loveScore,
            intimacyDepth: relationship.intimacyDepth,
            momentum: relationship.momentum,
            accumulationDays: relationship.accumulationDays,
          }
        : null,
      user: { name: group.user.name, timezone: group.user.timezone },
      characterFacts: character.facts.map((f) => ({ category: f.category, fact: f.fact })),
    }) +
    '\n\n' +
    groupContextBlock

  // Mesaj history — başka karakterlerin mesajları "user" rolünde [İsim]: prefix ile
  const messages: { role: 'system' | 'user' | 'assistant'; content: string }[] = [
    { role: 'system', content: systemPrompt },
    ...ordered.map((m) => {
      if (m.senderType === 'user') {
        return { role: 'user' as const, content: m.content }
      }
      if (m.senderCharacterId === args.characterId) {
        return { role: 'assistant' as const, content: m.content }
      }
      const sender = m.senderCharacter?.name ?? 'biri'
      return { role: 'user' as const, content: `[${sender}]: ${m.content}` }
    }),
  ]

  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
    const r = await openai.chat.completions.create({
      model: MODEL,
      messages,
      temperature: 0.85,
      max_tokens: 200,
    })
    const content = r.choices[0]?.message?.content?.trim()
    if (!content) return null
    return { content }
  } catch (e) {
    console.error('[generateGroupReply]', e)
    return null
  }
}
