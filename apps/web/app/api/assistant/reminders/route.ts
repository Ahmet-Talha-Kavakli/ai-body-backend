/**
 * V4.7 B3 — Reminder CRUD
 *
 * POST /api/assistant/reminders     → create reminder (body: characterId, topic, scheduledFor ISO)
 * GET  /api/assistant/reminders     → list user's reminders
 *
 * Kullanım: stream içinde tool olarak çağrılacak (LLM "yarın 8'de uyandır" anladığında)
 * VEYA mobile UI direkt POST.
 */

import { NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { withAuth } from '@/lib/api/with-auth'

export const POST = withAuth(async (req, { user }) => {
  const body = (await req.json()) as {
    characterId?: string
    topic?: string
    scheduledFor?: string
  }
  if (!body.characterId || !body.topic || !body.scheduledFor) {
    return NextResponse.json({ error: 'missing_fields' }, { status: 400 })
  }
  const scheduledFor = new Date(body.scheduledFor)
  if (isNaN(scheduledFor.getTime()) || scheduledFor.getTime() <= Date.now()) {
    return NextResponse.json({ error: 'invalid_time' }, { status: 400 })
  }
  const character = await db.character.findFirst({
    where: { id: body.characterId, userId: user.id },
    select: { id: true },
  })
  if (!character) return NextResponse.json({ error: 'character_not_found' }, { status: 404 })

  const reminder = await db.characterReminder.create({
    data: {
      characterId: body.characterId,
      userId: user.id,
      topic: body.topic.slice(0, 200),
      scheduledFor,
      status: 'pending',
    },
  })
  return NextResponse.json({ ok: true, reminder })
})

export const GET = withAuth(async (_req, { user }) => {
  const reminders = await db.characterReminder.findMany({
    where: { userId: user.id, status: { in: ['pending', 'sent'] } },
    orderBy: { scheduledFor: 'asc' },
    take: 50,
  })
  return NextResponse.json({ reminders })
})
