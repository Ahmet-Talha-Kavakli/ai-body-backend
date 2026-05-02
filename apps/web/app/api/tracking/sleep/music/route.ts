import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/api/with-auth'
import { db } from '@/lib/db/client'

export const GET = withAuth(async (_req: NextRequest) => {
  const tracks = await db.sleepMusicTrack.findMany({
    orderBy: [{ isPremium: 'asc' }, { name: 'asc' }],
  })
  return NextResponse.json({ tracks })
})
