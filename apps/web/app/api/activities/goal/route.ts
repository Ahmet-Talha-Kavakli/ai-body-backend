import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { withAuth } from '@/lib/api/with-auth'
import { db } from '@/lib/db/client'

const PostSchema = z.object({
  dailyMinutes: z.number().int().min(1).max(1440),
})

export const GET = withAuth(async (_req: NextRequest, { user }) => {
  try {
    const goal = await db.userActivityGoal.findUnique({
      where: { userId: user.id },
      select: { dailyMinutes: true },
    })

    return NextResponse.json({ dailyMinutes: goal?.dailyMinutes ?? 60 })
  } catch (error) {
    console.error('[activity goal GET]', error)
    return NextResponse.json({ error: 'Failed to fetch activity goal' }, { status: 500 })
  }
})

export const POST = withAuth(async (req: NextRequest, { user }) => {
  try {
    const body = await req.json()
    const parsed = PostSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { dailyMinutes } = parsed.data

    const goal = await db.userActivityGoal.upsert({
      where: { userId: user.id },
      update: { dailyMinutes },
      create: { userId: user.id, dailyMinutes },
    })

    return NextResponse.json({ dailyMinutes: goal.dailyMinutes })
  } catch (error) {
    console.error('[activity goal POST]', error)
    return NextResponse.json({ error: 'Failed to save activity goal' }, { status: 500 })
  }
})
