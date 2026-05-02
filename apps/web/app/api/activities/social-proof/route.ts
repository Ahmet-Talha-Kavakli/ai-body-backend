import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/api/with-auth'
import { db } from '@/lib/db/client'

export const GET = withAuth(async (req: NextRequest, _ctx) => {
  try {
    const { searchParams } = new URL(req.url)
    const activityType = searchParams.get('activityType')
    const date = searchParams.get('date') ?? new Date().toISOString().slice(0, 10)

    if (!activityType) {
      return NextResponse.json({ error: 'activityType is required' }, { status: 400 })
    }

    const count = await db.activityLog.count({
      where: { activityType, date },
    })

    return NextResponse.json({ count, activityType, date })
  } catch (error) {
    console.error('[social-proof GET]', error)
    return NextResponse.json({ error: 'Failed to fetch social proof' }, { status: 500 })
  }
})
