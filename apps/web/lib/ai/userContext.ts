import { db } from '@/lib/db/client'

export interface UserAIContext {
  name: string
  age?: number
  primaryGoal?: string
  fitnessLevel?: string
  recentSleepHours?: number
  todayCalories?: number
  todayWaterMl?: number
  hasInjury?: boolean
  injuredPart?: string
  supplementNames?: string[]
  medicationNames?: string[]
  currentMood?: string
  streakDays?: number
  level?: number
}

export async function buildUserAIContext(userId: string): Promise<UserAIContext> {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const [
    user,
    profile,
    healthMetrics,
    todayWater,
    lastSleep,
    pet,
    userXP,
    supplements,
    medications,
  ] = await Promise.all([
    db.user.findUnique({ where: { id: userId }, select: { name: true } }),
    db.userBasicProfile.findUnique({ where: { userId } }),
    db.userHealthMetrics.findUnique({ where: { userId } }),
    db.waterLog.aggregate({
      _sum: { amountMl: true },
      where: { userId, loggedAt: { gte: today } },
    }),
    db.sleepRecord.findFirst({ where: { userId }, orderBy: { recordedAt: 'desc' } }),
    db.pet.findUnique({ where: { userId } }),
    db.userXP.findUnique({ where: { userId } }),
    db.supplement.findMany({ where: { userId, isActive: true }, select: { name: true }, take: 5 }),
    db.medication.findMany({ where: { userId, isActive: true }, select: { name: true }, take: 5 }),
  ])

  const activeInjuries = healthMetrics?.activeInjuries as unknown[]

  return {
    name: user?.name?.split(' ')[0] ?? 'Kullanıcı',
    age: profile?.age ?? undefined,
    primaryGoal: profile?.primaryGoal ?? undefined,
    fitnessLevel: profile?.fitnessLevel ?? undefined,
    // SleepRecord.duration is stored in minutes
    recentSleepHours: lastSleep?.duration != null ? lastSleep.duration / 60 : undefined,
    todayWaterMl: todayWater._sum.amountMl ?? 0,
    hasInjury: Array.isArray(activeInjuries) && activeInjuries.length > 0,
    currentMood: pet?.mood ?? undefined,
    level: userXP?.level ?? 1,
    supplementNames: supplements.map((s) => s.name),
    medicationNames: medications.map((m) => m.name),
  }
}

export function formatContextForPrompt(ctx: UserAIContext): string {
  const lines: string[] = [
    `Kullanıcı: ${ctx.name}`,
    ctx.age ? `Yaş: ${ctx.age}` : '',
    ctx.primaryGoal ? `Hedef: ${ctx.primaryGoal}` : '',
    ctx.fitnessLevel ? `Fitness seviyesi: ${ctx.fitnessLevel}` : '',
    ctx.recentSleepHours !== undefined ? `Son uyku: ${ctx.recentSleepHours.toFixed(1)} saat` : '',
    ctx.todayWaterMl !== undefined ? `Bugünkü su: ${ctx.todayWaterMl}ml` : '',
    ctx.hasInjury ? `Aktif sakatlık var` : '',
    ctx.supplementNames?.length ? `Supplementler: ${ctx.supplementNames.join(', ')}` : '',
    ctx.medicationNames?.length ? `İlaçlar: ${ctx.medicationNames.join(', ')}` : '',
    ctx.level ? `Seviye: ${ctx.level}` : '',
  ]
  return lines.filter(Boolean).join('\n')
}
