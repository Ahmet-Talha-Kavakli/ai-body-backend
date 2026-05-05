/**
 * V4 Faz F — 1-Hop Reaktivite
 *
 * Bir karakter cevap attığında, diğer üyeler için "ben de tepki vereyim mi?"
 * sorusu paralel çalışır. Sonsuz döngü engeli:
 *   - reactivityProcessed flag'i tek seferlik garanti
 *   - Eğer tetikleyici mesaj zaten bir karakterin cevabıysa (2. hop) — DUR
 *
 * Yani: kullanıcı → Mia (1. cevap) → Kerem reaktivite ✓
 *       kullanıcı → Mia → Kerem (1. reaktivite) → ARTIK YOK
 */

import { db } from '@/lib/db/client'
import { decideForCharacter, parseAddressedNames, type GroupDecisionInput } from './group-decision'

export async function triggerReactivity(args: {
  groupId: string
  newMessageId: string
  newMessageContent: string
  speakerCharacterId: string
}): Promise<{ scheduled: number } | { skipped: string }> {
  const msg = await db.groupMessage.findUnique({
    where: { id: args.newMessageId },
    select: { reactivityProcessed: true, repliedToMessageId: true },
  })
  if (!msg) return { skipped: 'msg_not_found' }
  if (msg.reactivityProcessed) return { skipped: 'already_processed' }

  // 2-hop koruma: tetikleyici de bir karakter cevabıysa zincir burada biter
  if (msg.repliedToMessageId) {
    const trigger = await db.groupMessage.findUnique({
      where: { id: msg.repliedToMessageId },
      select: { senderType: true },
    })
    if (trigger?.senderType === 'character') {
      await db.groupMessage.update({
        where: { id: args.newMessageId },
        data: { reactivityProcessed: true },
      })
      return { skipped: 'two_hops_max' }
    }
  }

  // Idempotent işaretle (paralel cron koşusunda duplicate engeli)
  await db.groupMessage.update({
    where: { id: args.newMessageId },
    data: { reactivityProcessed: true },
  })

  const group = await db.groupConversation.findUnique({
    where: { id: args.groupId },
    include: {
      members: {
        where: { leftAt: null, characterId: { not: args.speakerCharacterId } },
        include: {
          character: {
            select: {
              id: true,
              name: true,
              archetype: true,
              currentMood: true,
              currentActivity: true,
            },
          },
        },
      },
    },
  })
  if (!group || group.members.length === 0) return { scheduled: 0 }

  const memberNames = group.members.map((m) => m.character.name)
  const addressedNames = parseAddressedNames(args.newMessageContent, memberNames)

  const recent = await db.groupMessage.findMany({
    where: { groupId: args.groupId, senderType: 'character' },
    orderBy: { createdAt: 'desc' },
    take: 5,
    select: { senderCharacterId: true },
  })
  const recentCounts = new Map<string, number>()
  for (const m of recent) {
    if (!m.senderCharacterId) continue
    recentCounts.set(m.senderCharacterId, (recentCounts.get(m.senderCharacterId) ?? 0) + 1)
  }

  const decisions = await Promise.all(
    group.members.map(async (m) => {
      const input: GroupDecisionInput = {
        characterId: m.character.id,
        characterName: m.character.name,
        characterMood: m.character.currentMood,
        characterActivity: m.character.currentActivity,
        characterArchetype: m.character.archetype,
        addressedNames,
        messageContent: args.newMessageContent,
        senderType: 'character',
        recentSelfMessageCount: recentCounts.get(m.character.id) ?? 0,
        totalMembers: group.members.length + 1, // konuşan dahil
      }
      const decision = await decideForCharacter(input)
      return { member: m, decision }
    })
  )

  const now = Date.now()
  const willReact = decisions.filter((d) => d.decision.respond)
  if (willReact.length === 0) return { scheduled: 0 }

  // Bir karakterin halihazırda pending schedule'ı varsa yeni yazma
  // (yoksa aynı kişi arka arkaya 2 cevap atıyor — kendi kendine konuşuyor gibi)
  const existingPending = await db.scheduledGroupMessage.findMany({
    where: {
      groupId: args.groupId,
      status: 'pending',
      characterId: { in: willReact.map((s) => s.member.character.id) },
    },
    select: { characterId: true },
  })
  const blockedIds = new Set(existingPending.map((e) => e.characterId))
  const filtered = willReact.filter((s) => !blockedIds.has(s.member.character.id))
  if (filtered.length === 0) return { scheduled: 0 }

  await db.scheduledGroupMessage.createMany({
    data: filtered.map((s) => ({
      groupId: args.groupId,
      characterId: s.member.character.id,
      triggerMessageId: args.newMessageId,
      scheduledFor: new Date(now + s.decision.delaySec * 1000),
      reasoning: `reactivity: ${s.decision.reasoning}`,
    })),
  })

  return { scheduled: filtered.length }
}
