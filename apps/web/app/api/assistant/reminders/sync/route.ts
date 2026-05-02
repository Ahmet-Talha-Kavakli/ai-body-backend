/**
 * Mobile Reminder'ları buraya gönderir (incomplete).
 */

import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/api/with-auth'
import { db } from '@/lib/db/client'

interface ReminderInput {
  externalId: string
  title: string
  notes?: string | null
  dueDate?: string | null
  completed?: boolean
}

export const POST = withAuth(async (req: NextRequest, { user }) => {
  const body = (await req.json()) as { reminders: ReminderInput[] }
  if (!Array.isArray(body.reminders)) {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 })
  }

  // Tamamlanmamış reminder'ları sil (full replace)
  await db.reminderShadow.deleteMany({
    where: { userId: user.id, completed: false },
  })

  for (const r of body.reminders) {
    if (r.completed) continue
    await db.reminderShadow.upsert({
      where: { userId_externalId: { userId: user.id, externalId: r.externalId } },
      create: {
        userId: user.id,
        externalId: r.externalId,
        title: r.title,
        notes: r.notes ?? null,
        dueDate: r.dueDate ? new Date(r.dueDate) : null,
        completed: false,
      },
      update: {
        title: r.title,
        notes: r.notes ?? null,
        dueDate: r.dueDate ? new Date(r.dueDate) : null,
        syncedAt: new Date(),
      },
    })
  }

  return NextResponse.json({ ok: true, synced: body.reminders.length })
})
