import { db } from '@/lib/db/client'

export async function aggregateLeaderboards() {
  console.log('[Leaderboard] Starting aggregation...')

  try {
    const eightWeeksAgo = new Date(Date.now() - 56 * 24 * 60 * 60 * 1000)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

    // Form Score Leaderboard (8-week average from FormRepData via WorkoutSession)
    const formScoreRaw = await db.$queryRaw<{ userId: string; avgScore: number }[]>`
      SELECT ws."userId", AVG(fr."formScore") as "avgScore"
      FROM "FormRepData" fr
      JOIN "WorkoutSession" ws ON ws.id = fr."sessionId"
      WHERE fr."createdAt" >= ${eightWeeksAgo}
      GROUP BY ws."userId"
    `

    const formScoreEntries = await Promise.all(
      formScoreRaw.map(async (fs) => {
        const user = await db.user.findUnique({
          where: { id: fs.userId },
          select: { name: true },
        })
        return {
          userId: fs.userId,
          username: user?.name || 'Unknown',
          score: Math.round(Number(fs.avgScore) || 0),
          trend: 'stable',
        }
      })
    )

    const sortedFormScore = formScoreEntries.sort((a, b) => b.score - a.score)

    await db.leaderboard.upsert({
      where: { leaderboardType_period: { leaderboardType: 'form_score', period: 'weekly' } },
      create: {
        leaderboardType: 'form_score',
        period: 'weekly',
        entries: JSON.stringify(
          sortedFormScore.map((e, i) => ({ ...e, rank: i + 1 })).slice(0, 100)
        ),
      },
      update: {
        entries: JSON.stringify(
          sortedFormScore.map((e, i) => ({ ...e, rank: i + 1 })).slice(0, 100)
        ),
      },
    })

    // Consistency Leaderboard (DailyMetrics count in last 30 days) - raw query
    const consistencyRaw = await db.$queryRaw<{ userId: string; cnt: number }[]>`
      SELECT "userId", COUNT(*) as "cnt"
      FROM "DailyMetrics"
      WHERE "date" >= ${thirtyDaysAgo}
      GROUP BY "userId"
    `

    const consistencyEntries = await Promise.all(
      consistencyRaw.map(async (wc) => {
        const user = await db.user.findUnique({
          where: { id: wc.userId },
          select: { name: true },
        })
        return {
          userId: wc.userId,
          username: user?.name || 'Unknown',
          score: Number(wc.cnt),
          trend: 'up',
        }
      })
    )

    const sortedConsistency = consistencyEntries.sort((a, b) => b.score - a.score)

    await db.leaderboard.upsert({
      where: { leaderboardType_period: { leaderboardType: 'most_consistent', period: 'monthly' } },
      create: {
        leaderboardType: 'most_consistent',
        period: 'monthly',
        entries: JSON.stringify(
          sortedConsistency.map((e, i) => ({ ...e, rank: i + 1 })).slice(0, 100)
        ),
      },
      update: {
        entries: JSON.stringify(
          sortedConsistency.map((e, i) => ({ ...e, rank: i + 1 })).slice(0, 100)
        ),
      },
    })

    console.log('[Leaderboard] Aggregation complete')
    return { success: true }
  } catch (error) {
    console.error('[Leaderboard] Aggregation failed:', error)
    throw error
  }
}
