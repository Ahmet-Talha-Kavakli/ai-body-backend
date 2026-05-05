/**
 * V4 Faz F — Grup detay/güncelleme/silme
 *
 * GET    /api/assistant/groups/[id]   — grup detayı + üyeler
 * PATCH  /api/assistant/groups/[id]   — title / archived güncelle
 * DELETE /api/assistant/groups/[id]   — grup sil (cascade ile mesajlar da)
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { withAuth } from '@/lib/api/with-auth'

export const runtime = 'nodejs'

async function resolveId(params: unknown): Promise<string | null> {
  const resolved = params instanceof Promise ? await params : params
  if (resolved && typeof resolved === 'object' && 'id' in resolved) {
    const id = (resolved as { id: unknown }).id
    return typeof id === 'string' ? id : null
  }
  return null
}

export const GET = withAuth(async (_req: NextRequest, { user, params }) => {
  const id = await resolveId(params)
  if (!id) return NextResponse.json({ error: 'invalid_id' }, { status: 400 })

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
              avatarUrl: true,
              currentMood: true,
              archetype: true,
            },
          },
        },
      },
    },
  })
  if (!group) return NextResponse.json({ error: 'not_found' }, { status: 404 })
  return NextResponse.json({ group })
})

export const PATCH = withAuth(async (req: NextRequest, { user, params }) => {
  const id = await resolveId(params)
  if (!id) return NextResponse.json({ error: 'invalid_id' }, { status: 400 })

  const body = (await req.json().catch(() => null)) as {
    title?: string
    archived?: boolean
  } | null
  if (!body) return NextResponse.json({ error: 'invalid_body' }, { status: 400 })

  const owned = await db.groupConversation.findFirst({
    where: { id, userId: user.id },
    select: { id: true },
  })
  if (!owned) return NextResponse.json({ error: 'not_found' }, { status: 404 })

  const updated = await db.groupConversation.update({
    where: { id },
    data: {
      ...(body.title !== undefined ? { title: body.title.trim().slice(0, 80) } : {}),
      ...(body.archived !== undefined ? { archived: body.archived } : {}),
    },
  })
  return NextResponse.json({ group: updated })
})

export const DELETE = withAuth(async (_req: NextRequest, { user, params }) => {
  const id = await resolveId(params)
  if (!id) return NextResponse.json({ error: 'invalid_id' }, { status: 400 })

  const owned = await db.groupConversation.findFirst({
    where: { id, userId: user.id },
    select: { id: true },
  })
  if (!owned) return NextResponse.json({ error: 'not_found' }, { status: 404 })

  await db.groupConversation.delete({ where: { id } })
  return NextResponse.json({ ok: true })
})
