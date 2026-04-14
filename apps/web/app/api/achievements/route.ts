import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db/client'
import { ACHIEVEMENTS } from '@/lib/achievements/definitions'

export async function GET() {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const user = await db.user.findUnique({ where: { clerkId } })
    if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const [userAchievements, xp] = await Promise.all([
      db.userAchievement.findMany({
        where: { userId: user.id },
        orderBy: { earnedAt: 'desc' },
      }),
      db.userXP.findUnique({ where: { userId: user.id } }),
    ])

    const achievements = userAchievements.map((ua) => ({
      ...ua,
      definition: ACHIEVEMENTS[ua.achievementId] ?? null,
    }))

    return NextResponse.json({
      achievements,
      xp: xp ?? { total: 0, level: 1 },
      allDefinitions: Object.values(ACHIEVEMENTS),
    })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
