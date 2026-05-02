import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'

// GET /api/activities/subtypes?activityType=football
export async function GET(req: NextRequest) {
  const activityType = req.nextUrl.searchParams.get('activityType')
  if (!activityType) {
    return NextResponse.json({ error: 'activityType required' }, { status: 400 })
  }
  const subtypes = await db.activitySubType.findMany({
    where: { activityType },
    orderBy: { key: 'asc' },
  })
  return NextResponse.json({ subtypes })
}
