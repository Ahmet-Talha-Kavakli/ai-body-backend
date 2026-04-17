import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/api/with-auth'
import { db } from '@/lib/db/client'

export const POST = withAuth(async (_req, { user, params }) => {
  const resolvedParams = await params
  const id = resolvedParams?.id as string

  await db.notification.update({
    where: { id, userId: user.id },
    data: { read: true },
  })

  return NextResponse.json({ success: true })
})
