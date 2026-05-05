/**
 * V4 Faz F — Grup mesajları
 *
 * GET  /api/assistant/groups/[id]/messages?before=<iso>&take=30
 *      — mesajları cursor sayfalama ile döner (kronolojik artan)
 *
 * POST /api/assistant/groups/[id]/messages
 *      — kullanıcı yeni mesaj gönderir, paralel `shouldRespond` çalışır,
 *        cevap verecek karakterler ScheduledGroupMessage'a yazılır.
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { withAuth } from '@/lib/api/with-auth'
import { isFlagEnabled } from '@/lib/assistant/feature-flags'
import {
  decideForCharacter,
  parseAddressedNames,
  type GroupDecisionInput,
} from '@/lib/assistant/group-decision'

export const runtime = 'nodejs'

async function resolveId(params: unknown): Promise<string | null> {
  const resolved = params instanceof Promise ? await params : params
  if (resolved && typeof resolved === 'object' && 'id' in resolved) {
    const id = (resolved as { id: unknown }).id
    return typeof id === 'string' ? id : null
  }
  return null
}

export const GET = withAuth(async (req: NextRequest, { user, params }) => {
  const id = await resolveId(params)
  if (!id) return NextResponse.json({ error: 'invalid_id' }, { status: 400 })

  const owned = await db.groupConversation.findFirst({
    where: { id, userId: user.id },
    select: { id: true },
  })
  if (!owned) return NextResponse.json({ error: 'not_found' }, { status: 404 })

  const url = new URL(req.url)
  const before = url.searchParams.get('before')
  const take = Math.min(parseInt(url.searchParams.get('take') ?? '30', 10), 100)

  const messages = await db.groupMessage.findMany({
    where: {
      groupId: id,
      ...(before ? { createdAt: { lt: new Date(before) } } : {}),
    },
    orderBy: { createdAt: 'desc' },
    take,
    select: {
      id: true,
      senderType: true,
      senderCharacterId: true,
      senderCharacter: { select: { id: true, name: true, avatarUrl: true } },
      content: true,
      repliedToMessageId: true,
      createdAt: true,
    },
  })

  return NextResponse.json({ messages: messages.reverse() })
})

export const POST = withAuth(async (req: NextRequest, { user, params }) => {
  const enabled = await isFlagEnabled('v4_group_chat', user.id)
  if (!enabled) return NextResponse.json({ error: 'feature_disabled' }, { status: 403 })

  const id = await resolveId(params)
  if (!id) return NextResponse.json({ error: 'invalid_id' }, { status: 400 })

  const body = (await req.json().catch(() => null)) as { content?: string } | null
  if (!body?.content || body.content.trim().length === 0) {
    return NextResponse.json({ error: 'empty_content' }, { status: 400 })
  }

  const group = await db.groupConversation.findFirst({
    where: { id, userId: user.id },
    include: {
      members: {
        where: { leftAt: null },
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
  if (!group) return NextResponse.json({ error: 'not_found' }, { status: 404 })

  const content = body.content.trim().slice(0, 4000)

  // 1) Kullanıcı mesajı kaydı
  const userMessage = await db.groupMessage.create({
    data: {
      groupId: id,
      senderType: 'user',
      content,
    },
  })
  await db.groupConversation.update({
    where: { id },
    data: { updatedAt: new Date() },
  })

  // 2) Mesaj kime hitap ediyor? (basit isim parse)
  const memberNames = group.members.map((m) => m.character.name)
  const addressedNames = parseAddressedNames(content, memberNames)

  // 3) Spam koruma — son 5 karakter mesajında her üye kaç kez konuştu
  const recent = await db.groupMessage.findMany({
    where: { groupId: id, senderType: 'character' },
    orderBy: { createdAt: 'desc' },
    take: 5,
    select: { senderCharacterId: true },
  })
  const recentCounts = new Map<string, number>()
  for (const m of recent) {
    if (!m.senderCharacterId) continue
    recentCounts.set(m.senderCharacterId, (recentCounts.get(m.senderCharacterId) ?? 0) + 1)
  }

  // 4) Paralel karar motoru — her üye için "cevap vereyim mi?"
  const decisions = await Promise.all(
    group.members.map(async (m) => {
      const input: GroupDecisionInput = {
        characterId: m.character.id,
        characterName: m.character.name,
        characterMood: m.character.currentMood,
        characterActivity: m.character.currentActivity,
        characterArchetype: m.character.archetype,
        addressedNames,
        messageContent: content,
        senderType: 'user',
        recentSelfMessageCount: recentCounts.get(m.character.id) ?? 0,
        totalMembers: group.members.length,
      }
      const decision = await decideForCharacter(input)
      return { member: m, decision }
    })
  )

  // 5) Cevap vereceklerini ScheduledGroupMessage'a yaz
  const now = Date.now()
  const scheduled = decisions.filter((d) => d.decision.respond)

  if (scheduled.length > 0) {
    await db.scheduledGroupMessage.createMany({
      data: scheduled.map((s) => ({
        groupId: id,
        characterId: s.member.character.id,
        triggerMessageId: userMessage.id,
        scheduledFor: new Date(now + s.decision.delaySec * 1000),
        reasoning: s.decision.reasoning,
      })),
    })
  }

  return NextResponse.json({
    message: userMessage,
    scheduledRepliesCount: scheduled.length,
    decisions: decisions.map((d) => ({
      characterId: d.member.character.id,
      characterName: d.member.character.name,
      respond: d.decision.respond,
      delaySec: d.decision.delaySec,
      source: d.decision.source,
      reasoning: d.decision.reasoning,
    })),
  })
})
