import { prisma } from '@/lib/db/client'

export interface CoachContext {
  basicProfile: any
  healthMetrics: any
  recentDailyMetrics: any[]
  weaknesses: any[]
  averageMetrics: {
    sleepHours: number
    stressLevel: number
    proteinCompliance: number
    consistencyPct: number
  }
  relevantMemories: string[]
}

export async function buildCoachContext(userId: string): Promise<CoachContext> {
  const [basicProfile, healthMetrics, dailyMetrics, weaknesses] = await Promise.all([
    prisma.userBasicProfile.findUnique({ where: { userId } }),
    prisma.userHealthMetrics.findUnique({ where: { userId } }),
    prisma.dailyMetrics.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
      take: 7,
    }),
    prisma.userWeakness.findMany({
      where: { userId },
      orderBy: { severity: 'desc' },
      take: 5,
    }),
  ])

  // Calculate averages
  const sleepAvg =
    dailyMetrics.length > 0
      ? dailyMetrics.reduce((sum, m) => sum + m.sleepHours, 0) / dailyMetrics.length
      : 0

  const stressAvg =
    dailyMetrics.length > 0
      ? dailyMetrics.reduce((sum, m) => sum + m.stressLevel, 0) / dailyMetrics.length
      : 0

  const nutrition = await prisma.userNutritionMetrics.findUnique({ where: { userId } })
  const proteinCompliance =
    dailyMetrics.length > 0
      ? (dailyMetrics.filter((m) => m.proteinIntake >= (nutrition?.proteinTarget || 0)).length /
          dailyMetrics.length) *
        100
      : 0

  // Geçmiş hafızayı çek (hata olsa bile devam et)
  let relevantMemories: string[] = []
  try {
    const { retrieveMemoryContext } = await import('@/lib/memory/memory-retriever')
    const memCtx = await retrieveMemoryContext(
      userId,
      'workout performance nutrition recovery form score',
      { limit: 4 }
    )
    relevantMemories = memCtx.memories
  } catch {
    // Memory optional — sessizce geç
  }

  return {
    basicProfile,
    healthMetrics,
    recentDailyMetrics: dailyMetrics,
    weaknesses,
    averageMetrics: {
      sleepHours: Math.round(sleepAvg * 10) / 10,
      stressLevel: Math.round(stressAvg),
      proteinCompliance: Math.round(proteinCompliance),
      consistencyPct: 0, // Will calculate from workout history
    },
    relevantMemories,
  }
}
