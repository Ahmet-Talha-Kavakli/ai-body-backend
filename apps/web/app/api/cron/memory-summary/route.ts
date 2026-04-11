import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/client'
import { isValidCronRequest } from '@/lib/env/validate'
import { writeWeeklyMemory } from '@/lib/memory/memory-writer'
import { logger } from '@/lib/logger'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (!isValidCronRequest(authHeader)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const weekEnd = new Date()
    const weekStart = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    weekStart.setHours(0, 0, 0, 0)

    // Son 7 günde en az 1 seans tamamlamış kullanıcılar
    const activeUserIds = await prisma.workoutSession
      .findMany({
        where: { startedAt: { gte: weekStart }, endedAt: { not: null } },
        select: { userId: true },
        distinct: ['userId'],
      })
      .then((rows) => rows.map((r) => r.userId))

    logger.info({ count: activeUserIds.length }, 'memory-summary: processing users')

    let processed = 0
    let errors = 0

    for (const userId of activeUserIds) {
      try {
        const [sessions, dailyMetrics, weeklySummary] = await Promise.all([
          prisma.workoutSession.findMany({
            where: { userId, startedAt: { gte: weekStart }, endedAt: { not: null } },
            include: { completedSets: { include: { exercise: true } } },
          }),
          prisma.dailyMetrics.findMany({
            where: { userId, date: { gte: weekStart } },
          }),
          prisma.weeklySummary.findFirst({
            where: { userId, weekStartDate: { gte: weekStart } },
          }),
        ])

        if (sessions.length === 0) continue

        // Toplam hacim
        const totalVolume = sessions.reduce(
          (sum, s) =>
            sum +
            s.completedSets.reduce((sv, set) => sv + (set.reps ?? 0) * (set.weightKg ?? 0), 0),
          0
        )

        // Ortalama form skoru
        const allScores = sessions.flatMap((s) => s.completedSets.map((c) => c.formScore))
        const avgFormScore =
          allScores.length > 0 ? allScores.reduce((a, b) => a + b, 0) / allScores.length : 0

        // En çok yapılan egzersizler (isim bazında)
        const exerciseCounts: Record<string, number> = {}
        for (const s of sessions) {
          for (const set of s.completedSets) {
            const name = set.exercise.name
            exerciseCounts[name] = (exerciseCounts[name] ?? 0) + 1
          }
        }
        const topExercises = Object.entries(exerciseCounts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)
          .map(([name]) => name)

        await writeWeeklyMemory({
          userId,
          weekStartDate: weekStart,
          weekEndDate: weekEnd,
          totalWorkouts: sessions.length,
          totalVolume,
          avgFormScore,
          avgReadiness: weeklySummary?.averageReadiness ?? 70,
          topExercises,
          dailyMetrics: dailyMetrics.map((m) => ({
            sleepHours: m.sleepHours,
            stressLevel: m.stressLevel,
            proteinIntake: m.proteinIntake,
            energyLevel: m.energyLevel,
            mood: m.mood,
          })),
        })

        processed++
      } catch (err) {
        logger.error({ err, userId }, 'memory-summary: failed for user')
        errors++
      }
    }

    return NextResponse.json({ processed, errors, total: activeUserIds.length })
  } catch (err) {
    logger.error({ err }, 'memory-summary cron failed')
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
