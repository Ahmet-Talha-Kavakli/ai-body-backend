import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/api/with-auth'
import { db } from '@/lib/db/client'

export const DELETE = withAuth(async (_req, { user, params }) => {
  try {
    const resolvedParams = await Promise.resolve(params)
    const id = resolvedParams?.id as string

    if (!id) {
      return NextResponse.json({ error: 'Missing id' }, { status: 400 })
    }

    // Verify ownership before deleting
    const log = await db.mealLog.findFirst({ where: { id, userId: user.id } })
    if (!log) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    await db.mealLog.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[nutrition/log/[id] DELETE]', err)
    return NextResponse.json({ error: 'Failed to delete log' }, { status: 500 })
  }
})
