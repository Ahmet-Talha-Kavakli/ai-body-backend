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
import { cached } from '@/lib/redis/client'

export const GET = withAuth(async (req: NextRequest, { user }) => {
  const enabled = await isFlagEnabled('v4_characters', user.id)
  if (!enabled) {
    // Flag kapalıyken boş array döner — UI sadece Jarvis'i gösterir
    return NextResponse.json({ characters: [], flagEnabled: false })
  }

  const cacheKey = `chars:list:${user.id}`
  const cachedResult = await cached(cacheKey, 5, async () => {
    return await loadCharacters(user.id)
  })
  return NextResponse.json({ characters: cachedResult, flagEnabled: true })
})

async function loadCharacters(userId: string) {
  const characters = await db.character.findMany({
    where: { userId, status: { not: 'departed' } },
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
    return [] as Array<Record<string, unknown>>
  }

  // V4 Perf: Tek raw SQL query ile conversation + son mesaj + okunmamış sayısı
  // Önceden 3 round-trip vardı: conversations / relationships / groupBy(unreadCounts).
  // Şimdi 2 paralel: (conversations+lastMessage+unreadCount via raw SQL) + relationships
  const characterIds = characters.map((c) => c.id)

  type ConvRow = {
    id: string
    characterId: string
    updatedAt: Date
    aiTypingUntil: Date | null
    lastMessageRole: string | null
    lastMessageContent: string | null
    lastMessageCreatedAt: Date | null
    lastMessageReadAt: Date | null
    unreadCount: bigint
  }

  const [convRows, relationships] = await Promise.all([
    // Tek query: her conversation için son mesaj (LATERAL) + okunmamış count
    db.$queryRaw<ConvRow[]>`
      SELECT
        c.id,
        c."characterId" AS "characterId",
        c."updatedAt",
        c."aiTypingUntil",
        lm.role        AS "lastMessageRole",
        lm.content     AS "lastMessageContent",
        lm."createdAt" AS "lastMessageCreatedAt",
        lm."readAt"    AS "lastMessageReadAt",
        COALESCE(uc.unread_count, 0) AS "unreadCount"
      FROM "AssistantConversation" c
      LEFT JOIN LATERAL (
        SELECT m.role, m.content, m."createdAt", m."readAt"
        FROM "AssistantMessage" m
        WHERE m."conversationId" = c.id
        ORDER BY m."createdAt" DESC
        LIMIT 1
      ) lm ON TRUE
      LEFT JOIN LATERAL (
        SELECT COUNT(*) AS unread_count
        FROM "AssistantMessage" m2
        WHERE m2."conversationId" = c.id
          AND m2.role = 'assistant'
          AND m2."readAt" IS NULL
      ) uc ON TRUE
      WHERE c."userId" = ${userId}
        AND c."characterId" = ANY(${characterIds})
        AND c.archived = false
      ORDER BY c."updatedAt" DESC
    `,
    db.memoryRelationship.findMany({
      where: { userId, characterId: { in: characterIds } },
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

  const convByCharacterId = new Map(convRows.map((c) => [c.characterId, c]))
  const relByCharacterId = new Map(relationships.map((r) => [r.characterId, r]))

  const result = characters.map((c) => {
    const conv = convByCharacterId.get(c.id)
    const rel = relByCharacterId.get(c.id)
    const isTyping = conv?.aiTypingUntil && new Date(conv.aiTypingUntil).getTime() > Date.now()

    const hasLastMessage = conv?.lastMessageContent !== null && conv?.lastMessageRole !== null

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
      lastMessage:
        conv && hasLastMessage
          ? {
              role: conv.lastMessageRole!,
              content: conv.lastMessageContent!,
              createdAt: conv.lastMessageCreatedAt!,
              isRead: conv.lastMessageReadAt !== null,
            }
          : null,
      lastMessageAt: rel?.lastMessageAt ?? null,
      unreadCount: conv ? Number(conv.unreadCount) : 0,
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

  return result
}
