/**
 * DELETE /api/assistant/messages/[mid] — kullanıcı mesajını siler
 *
 * Sadece kullanıcının kendi sohbetindeki mesajlar silinebilir.
 * AI mesajları da silinebilir (kullanıcı geri almak isteyebilir).
 */

import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/api/with-auth'
import { db } from '@/lib/db/client'

type Params = { params: Promise<{ mid: string }> }

export const DELETE = withAuth<Params>(async (_req, { user, params }) => {
  const { mid } = await params

  const msg = await db.assistantMessage.findFirst({
    where: { id: mid, conversation: { userId: user.id } },
    select: { id: true },
  })
  if (!msg) return NextResponse.json({ error: 'not_found' }, { status: 404 })

  await db.assistantMessage.delete({ where: { id: mid } })
  return NextResponse.json({ ok: true })
})
