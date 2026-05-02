/**
 * HealthKit tool'ları — mobile sync edilen DB'deki snapshot'lardan okur.
 */

import { db } from '@/lib/db/client'
import { ToolDefinition, ToolExecutor, ToolResult } from './types'

export const healthkitToolDefs: ToolDefinition[] = [
  {
    name: 'get_today_activity',
    category: 'health_read',
    description:
      "Bugünün Apple Health verisi: adım, aktif kalori, egzersiz dk, ayakta saat, mesafe, kat çıkma. Snapshot mobile sync'inden gelir, en son güncellenen veri.",
    parameters: { type: 'object', properties: {} },
  },
  {
    name: 'get_recent_heart_rate',
    category: 'health_read',
    description:
      'Son 7 günün kalp atışı verisi: ortalama, min, max, dinlenme HR, HRV. Trendi yorumlamak için.',
    parameters: { type: 'object', properties: { days: { type: 'number', default: 7 } } },
  },
  {
    name: 'get_health_trend',
    category: 'health_read',
    description:
      'Belirli bir metriği (steps/sleep/heartRate/weight) son N gün için listeler. Trend yorumu için.',
    parameters: {
      type: 'object',
      properties: {
        metric: {
          type: 'string',
          enum: [
            'steps',
            'sleepMinutes',
            'restingHR',
            'weightKg',
            'activeKcal',
            'exerciseMinutes',
            'hrvSdnn',
          ],
        },
        days: { type: 'number', default: 14 },
      },
      required: ['metric'],
    },
  },
  {
    name: 'get_sleep_summary',
    category: 'health_read',
    description:
      'Son N gün uyku özeti: ortalama süre, derin/REM dağılımı. "Bu hafta nasıl uyudum?" gibi.',
    parameters: {
      type: 'object',
      properties: { days: { type: 'number', default: 7 } },
    },
  },
  {
    name: 'get_workout_history',
    category: 'health_read',
    description:
      'Son N gün antrenman geçmişi (koşu, bisiklet, ağırlık vb.). "Bu hafta kaç kez spor yaptım?"',
    parameters: {
      type: 'object',
      properties: { days: { type: 'number', default: 14 } },
    },
  },
  {
    name: 'get_weight_trend',
    category: 'health_read',
    description: 'Kilo değişimi son N gün. Trend ve son ölçümü döner.',
    parameters: {
      type: 'object',
      properties: { days: { type: 'number', default: 30 } },
    },
  },
]

export const healthkitExecutors: Record<string, ToolExecutor> = {
  get_today_activity: {
    name: 'get_today_activity',
    execute: async ({ userId }) => {
      const today = new Date()
      today.setUTCHours(0, 0, 0, 0)
      const snap = await db.healthKitDailySnapshot.findUnique({
        where: { userId_date: { userId, date: today } },
      })
      if (!snap) {
        return {
          ok: false,
          error: 'no_data',
          display: {
            title: 'Apple Health verisi yok',
            subtitle: 'Bağlantı kuruldu mu?',
            icon: 'heart.text.square',
            color: '#8E8E93',
          },
        } satisfies ToolResult
      }
      const summary: string[] = []
      if (snap.steps != null) summary.push(`${snap.steps} adım`)
      if (snap.exerciseMinutes != null) summary.push(`${snap.exerciseMinutes}dk egzersiz`)
      if (snap.activeKcal != null) summary.push(`${Math.round(snap.activeKcal)} aktif kcal`)
      return {
        ok: true,
        data: snap,
        display: {
          title: 'Bugün',
          subtitle: summary.join(' • '),
          icon: 'figure.walk',
          color: '#FF6B35',
        },
      } satisfies ToolResult
    },
  },

  get_recent_heart_rate: {
    name: 'get_recent_heart_rate',
    execute: async ({ userId, params }) => {
      const p = params as { days?: number }
      const days = p?.days ?? 7
      const since = new Date()
      since.setDate(since.getDate() - days)
      since.setUTCHours(0, 0, 0, 0)
      const rows = await db.healthKitDailySnapshot.findMany({
        where: { userId, date: { gte: since } },
        orderBy: { date: 'desc' },
        select: { date: true, heartRateAvg: true, restingHR: true, hrvSdnn: true },
      })
      if (!rows.length) return { ok: false, error: 'no_data' }
      const avgs = rows.map((r) => r.heartRateAvg).filter((v): v is number => v != null)
      const restings = rows.map((r) => r.restingHR).filter((v): v is number => v != null)
      const hrvs = rows.map((r) => r.hrvSdnn).filter((v): v is number => v != null)
      const mean = (arr: number[]) =>
        arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : null
      return {
        ok: true,
        data: {
          days,
          rowCount: rows.length,
          avgHR: mean(avgs),
          avgRestingHR: mean(restings),
          avgHRV: mean(hrvs),
          rows,
        },
        display: {
          title: `Son ${days} gün kalp`,
          subtitle: mean(restings)
            ? `Dinlenme HR ort. ${Math.round(mean(restings)!)}`
            : 'Veri kısıtlı',
          icon: 'heart.fill',
          color: '#FF3B30',
        },
      } satisfies ToolResult
    },
  },

  get_sleep_summary: {
    name: 'get_sleep_summary',
    execute: async ({ userId, params }) => {
      const p = params as { days?: number }
      const days = p?.days ?? 7
      const since = new Date()
      since.setDate(since.getDate() - days)
      since.setUTCHours(0, 0, 0, 0)
      const rows = await db.healthKitDailySnapshot.findMany({
        where: { userId, date: { gte: since } },
        orderBy: { date: 'desc' },
        select: { date: true, sleepMinutes: true, sleepDeepMin: true, sleepRemMin: true },
      })
      if (!rows.length) return { ok: false, error: 'no_data' }
      const sleeps = rows.map((r) => r.sleepMinutes).filter((v): v is number => v != null)
      const avgMin = sleeps.length ? sleeps.reduce((a, b) => a + b, 0) / sleeps.length : null
      return {
        ok: true,
        data: {
          days,
          rowCount: rows.length,
          avgMinutes: avgMin,
          avgHours: avgMin != null ? avgMin / 60 : null,
          rows,
        },
        display: {
          title: `Son ${days} gün uyku`,
          subtitle: avgMin != null ? `Ortalama ${(avgMin / 60).toFixed(1)} saat` : 'Veri kısıtlı',
          icon: 'bed.double.fill',
          color: '#5E5CE6',
        },
      } satisfies ToolResult
    },
  },

  get_workout_history: {
    name: 'get_workout_history',
    execute: async ({ userId, params }) => {
      const p = params as { days?: number }
      const days = p?.days ?? 14
      const since = new Date()
      since.setDate(since.getDate() - days)
      const workouts = await db.workoutShadow.findMany({
        where: { userId, startDate: { gte: since } },
        orderBy: { startDate: 'desc' },
        take: 50,
      })
      const byType: Record<string, number> = {}
      for (const w of workouts) byType[w.workoutType] = (byType[w.workoutType] ?? 0) + 1
      return {
        ok: true,
        data: {
          days,
          count: workouts.length,
          byType,
          workouts,
        },
        display: {
          title: `Son ${days} gün antrenman`,
          subtitle: workouts.length ? `${workouts.length} seans` : 'Henüz yok',
          icon: 'figure.run',
          color: '#30D158',
        },
      } satisfies ToolResult
    },
  },

  get_weight_trend: {
    name: 'get_weight_trend',
    execute: async ({ userId, params }) => {
      const p = params as { days?: number }
      const days = p?.days ?? 30
      const since = new Date()
      since.setDate(since.getDate() - days)
      since.setUTCHours(0, 0, 0, 0)
      const rows = await db.healthKitDailySnapshot.findMany({
        where: { userId, date: { gte: since }, weightKg: { not: null } },
        orderBy: { date: 'asc' },
        select: { date: true, weightKg: true },
      })
      if (!rows.length) return { ok: false, error: 'no_data' }
      const first = rows[0]!.weightKg!
      const last = rows[rows.length - 1]!.weightKg!
      const change = last - first
      return {
        ok: true,
        data: { days, first, last, change, rows },
        display: {
          title: 'Kilo trendi',
          subtitle: `${last.toFixed(1)} kg (${change >= 0 ? '+' : ''}${change.toFixed(1)})`,
          icon: 'scalemass.fill',
          color: '#5856D6',
        },
      } satisfies ToolResult
    },
  },

  get_health_trend: {
    name: 'get_health_trend',
    execute: async ({ userId, params }) => {
      const p = params as { metric: string; days?: number }
      const days = p?.days ?? 14
      const since = new Date()
      since.setDate(since.getDate() - days)
      since.setUTCHours(0, 0, 0, 0)

      const rows = await db.healthKitDailySnapshot.findMany({
        where: { userId, date: { gte: since } },
        orderBy: { date: 'asc' },
      })
      if (!rows.length) return { ok: false, error: 'no_data' }

      const series = rows
        .map((r) => {
          const value = (r as unknown as Record<string, number | null>)[p.metric]
          return { date: r.date.toISOString().slice(0, 10), value }
        })
        .filter((s) => s.value != null)

      const values = series.map((s) => s.value as number)
      const avg = values.length ? values.reduce((a, b) => a + b, 0) / values.length : null
      const first = values[0] ?? null
      const last = values[values.length - 1] ?? null
      const change = first != null && last != null ? last - first : null

      return {
        ok: true,
        data: {
          metric: p.metric,
          days,
          rowCount: series.length,
          avg,
          first,
          last,
          change,
          series,
        },
      } satisfies ToolResult
    },
  },
}
