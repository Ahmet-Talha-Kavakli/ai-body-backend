/**
 * V4 Faz F — Grup Sohbet API
 *
 * GET  /api/assistant/groups       — kullanıcının aktif gruplarını listele
 * POST /api/assistant/groups       — yeni grup oluştur (2-4 karakter)
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { withAuth } from '@/lib/api/with-auth'
import { isFlagEnabled } from '@/lib/assistant/feature-flags'
import { cached } from '@/lib/redis/client'

export const runtime = 'nodejs'

export const GET = withAuth(async (_req: NextRequest, { user }) => {
  const enabled = await isFlagEnabled('v4_group_chat', user.id)
  if (!enabled) return NextResponse.json({ groups: [], flagEnabled: false })

  const groups = await cached(`groups:list:${user.id}`, 5, async () => {
    return await db.groupConversation.findMany({
      where: { userId: user.id, archived: false },
      include: {
        members: {
          where: { leftAt: null },
          include: {
            character: {
              select: { id: true, name: true, avatarUrl: true, currentMood: true },
            },
          },
        },
        messages: {
          take: 1,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            content: true,
            senderType: true,
            senderCharacterId: true,
            senderCharacter: { select: { name: true } },
            createdAt: true,
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    })
  })

  return NextResponse.json({ groups, flagEnabled: true })
})

export const POST = withAuth(async (req: NextRequest, { user }) => {
  const enabled = await isFlagEnabled('v4_group_chat', user.id)
  if (!enabled) return NextResponse.json({ error: 'feature_disabled' }, { status: 403 })

  const body = (await req.json().catch(() => null)) as {
    title?: string
    characterIds?: string[]
  } | null

  if (
    !body?.characterIds ||
    !Array.isArray(body.characterIds) ||
    body.characterIds.length < 2 ||
    body.characterIds.length > 4
  ) {
    return NextResponse.json(
      { error: 'invalid_members', message: '2-4 karakter seçilmeli' },
      { status: 400 }
    )
  }

  // Tekil karakterler — duplicate engelle
  const uniqueIds = Array.from(new Set(body.characterIds))
  if (uniqueIds.length !== body.characterIds.length) {
    return NextResponse.json({ error: 'duplicate_members' }, { status: 400 })
  }

  const characters = await db.character.findMany({
    where: { id: { in: uniqueIds }, userId: user.id },
    select: { id: true },
  })
  if (characters.length !== uniqueIds.length) {
    return NextResponse.json({ error: 'invalid_characters' }, { status: 400 })
  }

  const group = await db.groupConversation.create({
    data: {
      userId: user.id,
      title: body.title?.trim().slice(0, 80) || 'Grup',
      members: {
        create: uniqueIds.map((cid) => ({ characterId: cid })),
      },
    },
    include: {
      members: {
        include: {
          character: { select: { id: true, name: true, avatarUrl: true, currentMood: true } },
        },
      },
    },
  })

  return NextResponse.json({ group })
})
