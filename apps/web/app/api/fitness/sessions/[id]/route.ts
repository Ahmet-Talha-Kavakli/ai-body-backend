import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/api/with-auth'
import { db } from '@/lib/db/client'

export const DELETE = withAuth(async (_req: NextRequest, { user, params }) => {
  const id = (params as any).id as string

  const session = await db.workoutSession.findUnique({ where: { id } })
  if (!session || session.userId !== user.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  await db.workoutSession.delete({ where: { id } })
  return new NextResponse(null, { status: 204 })
})
