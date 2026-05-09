/**
 * V4.6 M75 — Status view (görüldü kaydı)
 *
 * POST /api/assistant/status/:id/view
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { withAuth } from '@/lib/api/with-auth'

export const POST = withAuth(async (_req: NextRequest, { user, params }) => {
  const { id } = (await params) as { id: string }

  const status = await db.status.findUnique({ where: { id } })
  if (!status) return NextResponse.json({ error: 'not_found' }, { status: 404 })

  if (status.authorType === 'user' && status.authorUserId === user.id) {
    return NextResponse.json({ ok: true, skipped: 'own_status' })
  }

  if (status.authorType === 'character' && status.hiddenFrom.includes(user.id)) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }

  const existing = await db.statusView.findFirst({
    where: { statusId: id, viewerType: 'user', viewerUserId: user.id },
    select: { id: true },
  })
  if (!existing) {
    await db.statusView.create({
      data: {
        statusId: id,
        viewerType: 'user',
        viewerUserId: user.id,
      },
    })
  }

  return NextResponse.json({ ok: true })
})
