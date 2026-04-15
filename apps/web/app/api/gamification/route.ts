import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/api/with-auth'
import { db } from '@/lib/db/client'
import { levelProgress } from '@/lib/gamification/xpSystem'
import { BADGES } from '@/lib/gamification/badges'

export const GET = withAuth(async (_req: NextRequest, { user }) => {
  const [userXP, userAchievements, sessions] = await Promise.all([
    db.userXP.findUnique({ where: { userId: user.id } }),
    db.userAchievement.findMany({ where: { userId: user.id }, orderBy: { earnedAt: 'desc' } }),
    db.workoutSession.findMany({
      where: { userId: user.id },
      select: { startedAt: true },
      orderBy: { startedAt: 'desc' },
    }),
  ])

  const xp = userXP?.total ?? 0
  const { level, progress } = levelProgress(xp)

  const earnedIds = new Set(userAchievements.map((a) => a.achievementId))

  const activityDates = sessions.map((s) => s.startedAt)

  return NextResponse.json({
    xp,
    level,
    progress,
    badges: BADGES.map((b) => ({
      ...b,
      earned: earnedIds.has(b.id),
      earnedAt: userAchievements.find((a) => a.achievementId === b.id)?.earnedAt,
    })),
    totalBadges: BADGES.length,
    earnedBadges: earnedIds.size,
    activityDates: activityDates.slice(0, 30).map((d) => d.toISOString()),
  })
})
