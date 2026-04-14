import { db } from '@/lib/db/client'
import { ACHIEVEMENTS, getLevelFromXp, type AchievementDef } from './definitions'

export type TriggerEvent =
  | 'meal_logged'
  | 'workout_completed'
  | 'goal_set'
  | 'template_created'
  | 'photo_analyzed'

interface CheckResult {
  newAchievements: AchievementDef[]
  xpGained: number
  newLevel: number
  leveledUp: boolean
}

export async function checkAndAwardAchievements(
  userId: string,
  event: TriggerEvent
): Promise<CheckResult> {
  const existing = await db.userAchievement.findMany({
    where: { userId },
    select: { achievementId: true },
  })
  const earnedIds = new Set(existing.map((e) => e.achievementId))

  const [mealCount, streak, workoutCount] = await Promise.all([
    db.mealLog.count({ where: { userId } }),
    db.nutritionStreak.findUnique({ where: { userId }, select: { currentStreak: true } }),
    db.workoutSession.count({ where: { userId } }),
  ])

  const currentStreak = streak?.currentStreak ?? 0
  const toAward: AchievementDef[] = []

  const check = (id: string) => {
    if (!earnedIds.has(id) && ACHIEVEMENTS[id]) toAward.push(ACHIEVEMENTS[id])
  }

  if (event === 'meal_logged') {
    if (mealCount >= 1) check('first_log')
    if (currentStreak >= 3) check('streak_3')
    if (currentStreak >= 7) check('streak_7')
    if (currentStreak >= 30) check('streak_30')
    if (currentStreak >= 100) check('streak_100')
  }

  if (event === 'workout_completed') {
    if (workoutCount >= 1) check('first_workout')
    if (workoutCount >= 10) check('workout_10')
    if (workoutCount >= 50) check('workout_50')
  }

  if (event === 'goal_set') check('goal_set')
  if (event === 'template_created') check('template_created')
  if (event === 'photo_analyzed') check('photo_analysis_1')

  if (toAward.length === 0) {
    const xpRecord = await db.userXP.upsert({
      where: { userId },
      create: { userId, total: 0, level: 1 },
      update: {},
    })
    return { newAchievements: [], xpGained: 0, newLevel: xpRecord.level, leveledUp: false }
  }

  const xpGained = toAward.reduce((s, a) => s + a.xp, 0)

  await db.userAchievement.createMany({
    data: toAward.map((a) => ({ userId, achievementId: a.id, xpAwarded: a.xp })),
    skipDuplicates: true,
  })

  const xpRecord = await db.userXP.upsert({
    where: { userId },
    create: { userId, total: xpGained, level: getLevelFromXp(xpGained) },
    update: { total: { increment: xpGained } },
  })

  const newLevel = getLevelFromXp(xpRecord.total)
  const leveledUp = newLevel > xpRecord.level

  if (leveledUp) {
    await db.userXP.update({ where: { userId }, data: { level: newLevel } })
  }

  return { newAchievements: toAward, xpGained, newLevel, leveledUp }
}
