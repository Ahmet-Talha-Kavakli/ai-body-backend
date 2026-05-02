/**
 * Aktivite/spor tool'ları.
 */

import { db } from '@/lib/db/client'
import { ToolDefinition, ToolExecutor, ToolResult } from './types'

export const activityToolDefs: ToolDefinition[] = [
  {
    name: 'log_activity',
    category: 'activity',
    description:
      'Kullanıcının yaptığı bir aktiviteyi (yürüyüş, koşu, yoga, antrenman vs.) kaydeder.',
    parameters: {
      type: 'object',
      properties: {
        activityType: {
          type: 'string',
          description:
            'running | walking | swimming | cycling | yoga | tennis | football | basketball | dance | sauna | cold_pool | other',
        },
        duration: { type: 'number', description: 'Dakika' },
        intensity: { type: 'string', enum: ['low', 'medium', 'high'], default: 'medium' },
        distance: { type: 'number', description: 'km (opsiyonel — koşu/bisiklet için)' },
        calories: { type: 'number', description: 'Tahmini kalori (opsiyonel)' },
        notes: { type: 'string' },
      },
      required: ['activityType', 'duration'],
    },
  },
  {
    name: 'get_today_activity',
    category: 'activity',
    description: 'Bugün yapılan tüm aktivitelerin özetini döner.',
    parameters: { type: 'object', properties: {} },
  },
  {
    name: 'get_activity_history',
    category: 'activity',
    description: 'Son N günün aktivitelerini döner.',
    parameters: {
      type: 'object',
      properties: { days: { type: 'number', default: 7 } },
    },
  },
  {
    name: 'get_active_minutes',
    category: 'activity',
    description: 'Belirtilen gün(ler)deki toplam aktif dakika sayısını döner.',
    parameters: {
      type: 'object',
      properties: { days: { type: 'number', default: 1 } },
    },
  },
]

function todayDateStr() {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d.toISOString().slice(0, 10)
}

export const activityExecutors: Record<string, ToolExecutor> = {
  log_activity: {
    name: 'log_activity',
    execute: async ({ userId, params }) => {
      const p = params as {
        activityType: string
        duration: number
        intensity?: string
        distance?: number
        calories?: number
        notes?: string
      }
      const log = await db.activityLog.create({
        data: {
          userId,
          activityType: p.activityType,
          date: todayDateStr(),
          duration: p.duration,
          intensity: p.intensity ?? 'medium',
          distance: p.distance,
          calories: p.calories ? Math.round(p.calories) : null,
          note: p.notes,
        },
      })
      return {
        ok: true,
        data: { id: log.id },
        display: {
          title: `${labelActivity(p.activityType)} kaydedildi`,
          subtitle: `${p.duration} dk${p.distance ? ` • ${p.distance}km` : ''}${p.calories ? ` • ${Math.round(p.calories)} kcal` : ''}`,
          icon: 'figure.walk',
          color: '#FF6B35',
        },
      } satisfies ToolResult
    },
  },
  get_today_activity: {
    name: 'get_today_activity',
    execute: async ({ userId }) => {
      const today = todayDateStr()
      const activities = await db.activityLog.findMany({
        where: { userId, date: today },
        select: {
          activityType: true,
          duration: true,
          intensity: true,
          distance: true,
          calories: true,
        },
      })
      const totalMin = activities.reduce((s, a) => s + a.duration, 0)
      const totalKcal = activities.reduce((s, a) => s + (a.calories ?? 0), 0)
      return {
        ok: true,
        data: { activities, totalMinutes: totalMin, totalCalories: totalKcal },
      } satisfies ToolResult
    },
  },
  get_activity_history: {
    name: 'get_activity_history',
    execute: async ({ userId, params }) => {
      const { days = 7 } = (params as { days?: number }) ?? {}
      const since = new Date()
      since.setDate(since.getDate() - days)
      const sinceStr = since.toISOString().slice(0, 10)
      const activities = await db.activityLog.findMany({
        where: { userId, date: { gte: sinceStr } },
        orderBy: { date: 'desc' },
        select: {
          date: true,
          activityType: true,
          duration: true,
          intensity: true,
          distance: true,
          calories: true,
          startTime: true,
        },
      })
      return { ok: true, data: { activities } } satisfies ToolResult
    },
  },
  get_active_minutes: {
    name: 'get_active_minutes',
    execute: async ({ userId, params }) => {
      const { days = 1 } = (params as { days?: number }) ?? {}
      const since = new Date()
      since.setDate(since.getDate() - (days - 1))
      const sinceStr = since.toISOString().slice(0, 10)
      const result = await db.activityLog.aggregate({
        where: { userId, date: { gte: sinceStr } },
        _sum: { duration: true, calories: true },
        _count: true,
      })
      return {
        ok: true,
        data: {
          days,
          totalMinutes: result._sum.duration ?? 0,
          totalCalories: result._sum.calories ?? 0,
          activityCount: result._count,
        },
      } satisfies ToolResult
    },
  },
}

function labelActivity(t: string): string {
  return (
    (
      {
        running: 'Koşu',
        walking: 'Yürüyüş',
        swimming: 'Yüzme',
        cycling: 'Bisiklet',
        yoga: 'Yoga',
        tennis: 'Tenis',
        football: 'Futbol',
        basketball: 'Basketbol',
        dance: 'Dans',
        sauna: 'Sauna',
        cold_pool: 'Soğuk havuz',
        other: 'Aktivite',
      } as Record<string, string>
    )[t] ?? t
  )
}
