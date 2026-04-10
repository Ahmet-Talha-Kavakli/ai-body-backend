import { db } from '@/lib/db/client'

export async function aggregateLeaderboards() {
  console.log('[Leaderboard] Starting aggregation...')

  try {
    // Form Score Leaderboard (8-week average)
    const formScores = await db.dailyMetrics.groupBy({
      by: ['userId'],
      _avg: { formScore: true },
      where: {
        date: { gte: new Date(Date.now() - 56 * 24 * 60 * 60 * 1000) },
      },
    })

    const formScoreEntries = await Promise.all(
      formScores.map(async (fs) => {
        const user = await db.user.findUnique({
          where: { id: fs.userId },
          select: { name: true },
        })
        return {
          userId: fs.userId,
          username: user?.name || 'Unknown',
          score: Math.round(fs._avg.formScore || 0),
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

    // Consistency Leaderboard (streak days)
    const workoutCounts = await db.dailyMetrics.groupBy({
      by: ['userId'],
      _count: true,
      where: {
        date: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      },
    })

    const consistencyEntries = await Promise.all(
      workoutCounts.map(async (wc) => {
        const user = await db.user.findUnique({
          where: { id: wc.userId },
          select: { name: true },
        })
        return {
          userId: wc.userId,
          username: user?.name || 'Unknown',
          score: wc._count,
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
