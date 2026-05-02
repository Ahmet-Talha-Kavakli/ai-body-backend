import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/api/with-auth'
import { db } from '@/lib/db/client'

// POST /api/assistant/push-token — kayıt/güncelle
export const POST = withAuth(async (req: NextRequest, { user }) => {
  const body = (await req.json()) as { token: string }
  const token = body.token?.trim()
  if (!token) return NextResponse.json({ error: 'no_token' }, { status: 400 })

  await db.user.update({
    where: { id: user.id },
    data: {
      expoPushToken: token,
      pushTokenUpdatedAt: new Date(),
    },
  })
  return NextResponse.json({ ok: true })
})

// DELETE /api/assistant/push-token — kaldır (logout vb.)
export const DELETE = withAuth(async (_req: NextRequest, { user }) => {
  await db.user.update({
    where: { id: user.id },
    data: { expoPushToken: null, pushTokenUpdatedAt: null },
  })
  return NextResponse.json({ ok: true })
})
