import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/api/with-auth'
import { db } from '@/lib/db/client'

export const GET = withAuth(async (_req: NextRequest, { user }) => {
  const settings = await db.waterSettings.findUnique({ where: { userId: user.id } })
  return NextResponse.json({ dailyGoalMl: settings?.dailyGoalMl ?? 2500 })
})

export const POST = withAuth(async (req: NextRequest, { user }) => {
  const { dailyGoalMl } = (await req.json()) as { dailyGoalMl: number }
  if (!dailyGoalMl || dailyGoalMl < 500 || dailyGoalMl > 10000) {
    return NextResponse.json({ error: 'Invalid goal' }, { status: 400 })
  }
  await db.waterSettings.upsert({
    where: { userId: user.id },
    create: { userId: user.id, dailyGoalMl },
    update: { dailyGoalMl },
  })
  return NextResponse.json({ dailyGoalMl })
})
