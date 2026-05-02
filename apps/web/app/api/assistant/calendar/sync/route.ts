/**
 * Mobile Calendar event'lerini buraya gönderir.
 * Backend shadow copy tutar — AI tool'lar oradan okur.
 */

import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/api/with-auth'
import { db } from '@/lib/db/client'

interface EventInput {
  externalId: string
  title: string
  notes?: string | null
  location?: string | null
  startDate: string // ISO
  endDate: string
  allDay?: boolean
}

export const POST = withAuth(async (req: NextRequest, { user }) => {
  const body = (await req.json()) as { events: EventInput[] }
  if (!Array.isArray(body.events)) {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 })
  }

  // Eski event'leri sil (sync = full replace within 30 day window)
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 1)
  const thirtyDaysForward = new Date()
  thirtyDaysForward.setDate(thirtyDaysForward.getDate() + 30)
  await db.calendarEventShadow.deleteMany({
    where: {
      userId: user.id,
      startDate: { gte: thirtyDaysAgo, lte: thirtyDaysForward },
    },
  })

  // Yeni event'leri ekle
  for (const e of body.events) {
    const start = new Date(e.startDate)
    const end = new Date(e.endDate)
    if (isNaN(start.getTime()) || isNaN(end.getTime())) continue
    await db.calendarEventShadow.upsert({
      where: { userId_externalId: { userId: user.id, externalId: e.externalId } },
      create: {
        userId: user.id,
        externalId: e.externalId,
        title: e.title,
        notes: e.notes ?? null,
        location: e.location ?? null,
        startDate: start,
        endDate: end,
        allDay: e.allDay ?? false,
      },
      update: {
        title: e.title,
        notes: e.notes ?? null,
        location: e.location ?? null,
        startDate: start,
        endDate: end,
        allDay: e.allDay ?? false,
        syncedAt: new Date(),
      },
    })
  }

  return NextResponse.json({ ok: true, synced: body.events.length })
})
