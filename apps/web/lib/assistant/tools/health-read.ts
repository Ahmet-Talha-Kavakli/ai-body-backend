/**
 * Sağlık okuma tool'ları — kullanıcının her şeyini bilmek için.
 */

import { db } from '@/lib/db/client'
import { ToolDefinition, ToolExecutor, ToolResult } from './types'

export const healthReadToolDefs: ToolDefinition[] = [
  {
    name: 'get_user_profile',
    category: 'health_read',
    description:
      'Kullanıcının temel profilini döner: yaş, cinsiyet, boy, kilo, kronik hastalıklar, alerjiler.',
    parameters: { type: 'object', properties: {} },
  },
  {
    name: 'get_today_summary',
    category: 'health_read',
    description: 'Bugünün uyku, su, ilaç, beslenme, aktivite, mood özetini döner.',
    parameters: { type: 'object', properties: {} },
  },
  {
    name: 'get_week_summary',
    category: 'health_read',
    description: 'Son 7 günün ortalama uyku, su, aktivite, mood değerlerini döner.',
    parameters: { type: 'object', properties: {} },
  },
  {
    name: 'get_streaks',
    category: 'health_read',
    description: "Kullanıcının uyku, su, beslenme streak'lerini döner.",
    parameters: { type: 'object', properties: {} },
  },
  {
    name: 'get_decision_context',
    category: 'health_read',
    description:
      'Kullanıcı bir eylem (antrenman, alkol, uzun yolculuk, önemli karar vb.) yapmak isterse ÖNCE bu tool ile bağlamı çek. Bugünün uyku, su, kafein, alkol, ilaç, mood, son aktivite, kronik hastalık, alerji bilgilerini birleştirip risk değerlendirmesi için döner.',
    parameters: { type: 'object', properties: {} },
  },
]

export const healthReadExecutors: Record<string, ToolExecutor> = {
  get_user_profile: {
    name: 'get_user_profile',
    execute: async ({ userId }) => {
      const [user, profile, allergies] = await Promise.all([
        db.user.findUnique({
          where: { id: userId },
          select: {
            name: true,
            locale: true,
            country: true,
            allergies: true,
          },
        }),
        db.healthProfile
          .findUnique({
            where: { userId },
            select: { gender: true, heightCm: true, weightKg: true, age: true },
          })
          .catch(() => null),
        db.chronicCondition
          .findMany({
            where: { userId },
            select: { name: true, severity: true },
          })
          .catch(() => [] as Array<{ name: string; severity: string | null }>),
      ])
      return {
        ok: true,
        data: {
          name: user?.name,
          locale: user?.locale,
          country: user?.country,
          allergies: user?.allergies ?? [],
          age: profile?.age ?? null,
          gender: profile?.gender ?? null,
          heightCm: profile?.heightCm ?? null,
          weightKg: profile?.weightKg ?? null,
          chronicConditions: allergies.map((c: { name: string; severity: string | null }) => ({
            name: c.name,
            severity: c.severity,
          })),
        },
      } satisfies ToolResult
    },
  },
  get_today_summary: {
    name: 'get_today_summary',
    execute: async ({ userId }) => {
      const todayStart = new Date()
      todayStart.setHours(0, 0, 0, 0)
      const [waterAgg, lastSleep, todayMeals, medsTaken] = await Promise.all([
        db.waterLog.aggregate({
          where: { userId, loggedAt: { gte: todayStart } },
          _sum: { amountMl: true },
        }),
        db.sleepSession.findFirst({
          where: { userId, status: 'completed' },
          orderBy: { endedAt: 'desc' },
          select: { totalMinutes: true, sleepScore: true, endedAt: true },
        }),
        db.mealLog.findMany({
          where: { userId, loggedAt: { gte: todayStart } },
          select: { mealType: true, totalCalories: true, totalProteinG: true },
        }),
        db.medicationLog
          .count({
            where: { userId, takenAt: { gte: todayStart } },
          })
          .catch(() => 0),
      ])
      const calories = todayMeals.reduce((s, m) => s + (m.totalCalories ?? 0), 0)
      const protein = todayMeals.reduce((s, m) => s + (m.totalProteinG ?? 0), 0)
      return {
        ok: true,
        data: {
          waterMl: waterAgg._sum.amountMl ?? 0,
          lastSleep: lastSleep
            ? {
                hours: lastSleep.totalMinutes ? +(lastSleep.totalMinutes / 60).toFixed(1) : null,
                score: lastSleep.sleepScore,
                endedAt: lastSleep.endedAt,
              }
            : null,
          mealsToday: todayMeals.length,
          caloriesToday: Math.round(calories),
          proteinToday: Math.round(protein),
          medsTakenToday: medsTaken,
        },
      } satisfies ToolResult
    },
  },
  get_week_summary: {
    name: 'get_week_summary',
    execute: async ({ userId }) => {
      const since = new Date()
      since.setDate(since.getDate() - 7)
      const [sleepSessions, waterLogs] = await Promise.all([
        db.sleepSession.findMany({
          where: { userId, status: 'completed', endedAt: { gte: since } },
          select: { totalMinutes: true, sleepScore: true },
        }),
        db.waterLog.findMany({
          where: { userId, loggedAt: { gte: since } },
          select: { amountMl: true },
        }),
      ])
      const avgSleepHours = sleepSessions.length
        ? +(
            sleepSessions.reduce((s, x) => s + (x.totalMinutes ?? 0), 0) /
            sleepSessions.length /
            60
          ).toFixed(1)
        : null
      const avgScore = sleepSessions.length
        ? Math.round(
            sleepSessions.reduce((s, x) => s + (x.sleepScore ?? 0), 0) / sleepSessions.length
          )
        : null
      const totalWater = waterLogs.reduce((s, l) => s + l.amountMl, 0)
      return {
        ok: true,
        data: {
          avgSleepHours,
          avgSleepScore: avgScore,
          sleepNightsTracked: sleepSessions.length,
          totalWaterMl: Math.round(totalWater),
          avgDailyWaterMl: Math.round(totalWater / 7),
        },
      } satisfies ToolResult
    },
  },
  get_streaks: {
    name: 'get_streaks',
    execute: async ({ userId }) => {
      const [waterStreak, nutritionStreak] = await Promise.all([
        db.waterStreak.findUnique({ where: { userId } }).catch(() => null),
        db.nutritionStreak.findUnique({ where: { userId } }).catch(() => null),
      ])
      return {
        ok: true,
        data: {
          waterStreak: waterStreak?.currentStreak ?? 0,
          waterBestStreak: waterStreak?.longestStreak ?? 0,
          nutritionStreak: nutritionStreak?.currentStreak ?? 0,
        },
      } satisfies ToolResult
    },
  },

  /**
   * Bütünsel bağlam toplama — kullanıcı bir eylem yapacaksa AI önce bu tool'u çağırır.
   * Tek query'de bugünün ve son haftaların kritik tüm verisini birleştirir.
   */
  get_decision_context: {
    name: 'get_decision_context',
    execute: async ({ userId }) => {
      const todayStart = new Date()
      todayStart.setHours(0, 0, 0, 0)
      const yesterdayStart = new Date(todayStart)
      yesterdayStart.setDate(yesterdayStart.getDate() - 1)
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
      const todayDateStr = todayStart.toISOString().slice(0, 10)

      const [
        lastSleep,
        prevSleep,
        last7Sleep,
        waterToday,
        mealsToday,
        medsTakenToday,
        chronicConditions,
        userBasic,
        moodToday,
        moodWeek,
        recentActivities,
        recentEvents,
      ] = await Promise.all([
        db.sleepSession.findFirst({
          where: { userId, status: 'completed' },
          orderBy: { endedAt: 'desc' },
          select: { totalMinutes: true, sleepScore: true, endedAt: true, startedAt: true },
        }),
        db.sleepSession.findFirst({
          where: { userId, status: 'completed' },
          orderBy: { endedAt: 'desc' },
          skip: 1,
          select: { totalMinutes: true, sleepScore: true },
        }),
        db.sleepSession.findMany({
          where: { userId, status: 'completed', endedAt: { gte: sevenDaysAgo } },
          select: { totalMinutes: true, sleepScore: true },
        }),
        db.waterLog
          .findUnique({
            where: { userId_date: { userId, date: todayStart } },
            select: { amountMl: true },
          })
          .catch(() => null),
        db.mealLog.findMany({
          where: { userId, loggedAt: { gte: todayStart } },
          select: { items: true, totalCalories: true, mealType: true },
        }),
        db.medicationLog.count({ where: { userId, takenAt: { gte: todayStart } } }).catch(() => 0),
        db.chronicCondition
          .findMany({
            where: { userId },
            select: { name: true, severity: true },
          })
          .catch(() => [] as Array<{ name: string; severity: string | null }>),
        db.user.findUnique({
          where: { id: userId },
          select: { allergies: true },
        }),
        db.moodLog
          .findFirst({
            where: { userId, loggedAt: { gte: todayStart } },
            orderBy: { loggedAt: 'desc' },
            select: { mood: true, stressLevel: true, energyLevel: true },
          })
          .catch(() => null),
        db.moodLog
          .findMany({
            where: { userId, loggedAt: { gte: sevenDaysAgo } },
            select: { moodScore: true, stressLevel: true },
          })
          .catch(() => [] as Array<{ moodScore: number; stressLevel: number | null }>),
        db.activityLog
          .findMany({
            where: { userId, date: { gte: todayDateStr } },
            select: {
              activityType: true,
              duration: true,
              intensity: true,
              calories: true,
              startTime: true,
            },
          })
          .catch(
            () =>
              [] as Array<{
                activityType: string
                duration: number
                intensity: string
                calories: number | null
                startTime: string | null
              }>
          ),
        db.lifeEvent.findMany({
          where: { userId, date: { gte: sevenDaysAgo }, resolved: false },
          orderBy: { date: 'desc' },
          take: 5,
          select: { type: true, title: true, stressLevel: true, date: true },
        }),
      ])

      // Mealden kafein/alkol tahmini (item.name içerisinden taranır)
      let estCaffeineMg = 0
      let estAlcoholUnits = 0
      const consumed: string[] = []
      for (const m of mealsToday) {
        const items = (m.items as Array<{ name?: string; quantity?: number }>) ?? []
        for (const i of items) {
          const name = (i.name ?? '').toLowerCase()
          consumed.push(i.name ?? '')
          const qty = i.quantity ?? 1
          if (name.includes('kahve') || name.includes('coffee') || name.includes('espresso'))
            estCaffeineMg += 80 * qty
          if (name.includes('çay') || name.includes('tea')) estCaffeineMg += 40 * qty
          if (name.includes('cola') || name.includes('kola')) estCaffeineMg += 35 * qty
          if (name.includes('enerji') || name.includes('redbull') || name.includes('monster'))
            estCaffeineMg += 100 * qty
          if (name.includes('bira') || name.includes('beer')) estAlcoholUnits += 1 * qty
          if (name.includes('şarap') || name.includes('wine')) estAlcoholUnits += 1.5 * qty
          if (
            name.includes('rakı') ||
            name.includes('viski') ||
            name.includes('whiskey') ||
            name.includes('votka') ||
            name.includes('gin')
          )
            estAlcoholUnits += 2 * qty
        }
      }

      const avgSleepHours7d = last7Sleep.length
        ? +(
            last7Sleep.reduce((s, x) => s + (x.totalMinutes ?? 0), 0) /
            last7Sleep.length /
            60
          ).toFixed(1)
        : null
      const avgScore7d = last7Sleep.length
        ? Math.round(last7Sleep.reduce((s, x) => s + (x.sleepScore ?? 0), 0) / last7Sleep.length)
        : null

      const avgMoodScore7d = moodWeek.length
        ? +(moodWeek.reduce((s, x) => s + x.moodScore, 0) / moodWeek.length).toFixed(1)
        : null
      const avgStress7d = moodWeek.filter((x) => x.stressLevel != null).length
        ? +(
            moodWeek
              .filter((x) => x.stressLevel != null)
              .reduce((s, x) => s + (x.stressLevel ?? 0), 0) /
            moodWeek.filter((x) => x.stressLevel != null).length
          ).toFixed(1)
        : null

      return {
        ok: true,
        data: {
          today: {
            waterMl: waterToday?.amountMl ?? 0,
            estimatedCaffeineMg: Math.round(estCaffeineMg),
            estimatedAlcoholUnits: +estAlcoholUnits.toFixed(1),
            consumedItems: consumed.slice(0, 20),
            mealCount: mealsToday.length,
            caloriesToday: Math.round(mealsToday.reduce((s, m) => s + (m.totalCalories ?? 0), 0)),
            medsTakenToday,
            mood: moodToday,
            activities: recentActivities,
          },
          sleep: {
            lastNight: lastSleep
              ? {
                  hours: lastSleep.totalMinutes ? +(lastSleep.totalMinutes / 60).toFixed(1) : null,
                  score: lastSleep.sleepScore,
                }
              : null,
            previousNight: prevSleep
              ? {
                  hours: prevSleep.totalMinutes ? +(prevSleep.totalMinutes / 60).toFixed(1) : null,
                  score: prevSleep.sleepScore,
                }
              : null,
            avg7days: { hours: avgSleepHours7d, score: avgScore7d, nights: last7Sleep.length },
          },
          health: {
            chronicConditions: chronicConditions.map((c) => ({
              name: c.name,
              severity: c.severity,
            })),
            allergies: userBasic?.allergies ?? [],
          },
          mental: {
            today: moodToday,
            avg7days: { moodScore: avgMoodScore7d, stress: avgStress7d, count: moodWeek.length },
          },
          recentEvents: recentEvents.map((e) => ({
            type: e.type,
            title: e.title,
            stressLevel: e.stressLevel,
            date: e.date.toISOString().slice(0, 10),
          })),
        },
      } satisfies ToolResult
    },
  },
}
