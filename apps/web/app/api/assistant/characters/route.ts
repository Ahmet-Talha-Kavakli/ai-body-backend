/**
 * V4 Faz E — GET /api/assistant/characters
 *
 * Kullanıcının aktif karakterlerini döner. Her birinin son mesajı, okunmamış
 * sayısı, mood'u, ilişki snapshot'ı dahil.
 *
 * Mobile sohbet listesi (WhatsApp tarzı) bu endpoint'ten besleniyor.
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { withAuth } from '@/lib/api/with-auth'
import { isFlagEnabled } from '@/lib/assistant/feature-flags'

export const GET = withAuth(async (req: NextRequest, { user }) => {
  const enabled = await isFlagEnabled('v4_characters', user.id)
  if (!enabled) {
    // Flag kapalıyken boş array döner — UI sadece Jarvis'i gösterir
    return NextResponse.json({ characters: [], flagEnabled: false })
  }

  const characters = await db.character.findMany({
    where: { userId: user.id, status: { not: 'departed' } },
    orderBy: { arrivedAt: 'desc' },
    select: {
      id: true,
      name: true,
      archetype: true,
      age: true,
      bio: true,
      avatarUrl: true,
      currentMood: true,
      currentActivity: true,
      currentLocation: true,
      status: true,
      arrivedAt: true,
    },
  })

  if (characters.length === 0) {
    return NextResponse.json({ characters: [], flagEnabled: true })
  }

  // Her karakterin son sohbeti + ilişki snapshot
  const characterIds = characters.map((c) => c.id)

  const [conversations, relationships] = await Promise.all([
    db.assistantConversation.findMany({
      where: { userId: user.id, characterId: { in: characterIds }, archived: false },
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        characterId: true,
        updatedAt: true,
        aiTypingUntil: true,
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { role: true, content: true, createdAt: true, readAt: true },
        },
      },
    }),
    db.memoryRelationship.findMany({
      where: { userId: user.id, characterId: { in: characterIds } },
      select: {
        characterId: true,
        status: true,
        trustScore: true,
        loveScore: true,
        intimacyDepth: true,
        lastMessageAt: true,
      },
    }),
  ])

  const convByCharacterId = new Map(conversations.map((c) => [c.characterId!, c]))
  const relByCharacterId = new Map(relationships.map((r) => [r.characterId, r]))

  // Okunmamış sayısı için tek query
  const unreadCounts = await db.assistantMessage.groupBy({
    by: ['conversationId'],
    where: {
      conversationId: { in: conversations.map((c) => c.id) },
      role: 'assistant',
      readAt: null,
    },
    _count: { _all: true },
  })
  const unreadByConvId = new Map(unreadCounts.map((u) => [u.conversationId, u._count._all]))

  const result = characters.map((c) => {
    const conv = convByCharacterId.get(c.id)
    const rel = relByCharacterId.get(c.id)
    const lastMessage = conv?.messages[0] ?? null
    const isTyping = conv?.aiTypingUntil && new Date(conv.aiTypingUntil).getTime() > Date.now()

    return {
      id: c.id,
      name: c.name,
      archetype: c.archetype,
      age: c.age,
      bio: c.bio,
      avatarUrl: c.avatarUrl,
      currentMood: c.currentMood,
      currentActivity: c.currentActivity,
      currentLocation: c.currentLocation,
      status: c.status,
      arrivedAt: c.arrivedAt,
      conversationId: conv?.id ?? null,
      lastMessage: lastMessage
        ? {
            role: lastMessage.role,
            content: lastMessage.content,
            createdAt: lastMessage.createdAt,
            isRead: lastMessage.readAt !== null,
          }
        : null,
      lastMessageAt: rel?.lastMessageAt ?? null,
      unreadCount: conv ? (unreadByConvId.get(conv.id) ?? 0) : 0,
      isTyping: !!isTyping,
      relationship: rel
        ? {
            status: rel.status,
            trustScore: rel.trustScore,
            loveScore: rel.loveScore,
            intimacyDepth: rel.intimacyDepth,
          }
        : null,
    }
  })

  return NextResponse.json({ characters: result, flagEnabled: true })
})
