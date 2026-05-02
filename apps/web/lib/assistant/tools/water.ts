/**
 * Su takibi tool'ları.
 */

import { db } from '@/lib/db/client'
import { ToolDefinition, ToolExecutor, ToolResult } from './types'

export const waterToolDefs: ToolDefinition[] = [
  {
    name: 'add_water',
    category: 'water',
    description: 'Kullanıcının su tüketimine ml ekler.',
    parameters: {
      type: 'object',
      properties: {
        ml: { type: 'number', description: 'Eklenecek su miktarı (ml). Örn: 250' },
      },
      required: ['ml'],
    },
  },
  {
    name: 'remove_water_amount',
    category: 'water',
    description: 'Bugünün su toplamından belirli miktarda ml düşer (yanlış kayıt için).',
    parameters: {
      type: 'object',
      properties: {
        ml: { type: 'number' },
      },
      required: ['ml'],
    },
    destructive: true,
  },
  {
    name: 'get_water_today',
    category: 'water',
    description: 'Bugün içilen toplam su miktarını ve hedefi döner.',
    parameters: { type: 'object', properties: {} },
  },
  {
    name: 'get_water_history',
    category: 'water',
    description: 'Son N günün günlük su tüketim toplamlarını döner.',
    parameters: {
      type: 'object',
      properties: {
        days: { type: 'number', description: 'Kaç gün geriye gidilsin', default: 7 },
      },
    },
  },
  {
    name: 'set_water_goal',
    category: 'water',
    description: 'Günlük su hedefini günceller.',
    parameters: {
      type: 'object',
      properties: {
        goalMl: { type: 'number' },
      },
      required: ['goalMl'],
    },
  },
]

export const waterExecutors: Record<string, ToolExecutor> = {
  add_water: {
    name: 'add_water',
    execute: async ({ userId, params }) => {
      const { ml } = params as { ml: number }
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const cupSize = 200
      // Günlük tek kayıt — upsert ile ml'i ekle
      const log = await db.waterLog.upsert({
        where: { userId_date: { userId, date: today } },
        create: {
          userId,
          date: today,
          amountMl: ml,
          glasses: Math.round(ml / cupSize),
          loggedAt: new Date(),
        },
        update: {
          amountMl: { increment: ml },
          glasses: { increment: Math.round(ml / cupSize) },
          loggedAt: new Date(),
        },
      })
      const settings = await db.waterSettings.findUnique({ where: { userId } })
      const goal = settings?.dailyGoalMl ?? 2500
      const result: ToolResult = {
        ok: true,
        data: { logId: log.id, totalToday: log.amountMl, goal, addedMl: ml },
        display: {
          title: `${ml}ml su eklendi`,
          subtitle: `Bugün ${(log.amountMl / 1000).toFixed(2)}L / ${(goal / 1000).toFixed(1)}L`,
          icon: 'drop.fill',
          color: '#0A84FF',
          undoable: true,
          undoToolCall: { name: 'remove_water_amount', params: { ml } },
        },
      }
      return result
    },
  },
  remove_water_amount: {
    name: 'remove_water_amount',
    execute: async ({ userId, params }) => {
      const { ml } = params as { ml: number }
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const log = await db.waterLog.findUnique({
        where: { userId_date: { userId, date: today } },
      })
      if (!log) return { ok: false, error: 'no_log_today' }
      const newAmount = Math.max(0, log.amountMl - ml)
      await db.waterLog.update({
        where: { id: log.id },
        data: {
          amountMl: newAmount,
          glasses: Math.max(0, Math.round(newAmount / 200)),
        },
      })
      return {
        ok: true,
        data: { totalToday: newAmount },
        display: {
          title: `${ml}ml geri alındı`,
          subtitle: `Bugün ${(newAmount / 1000).toFixed(2)}L`,
          icon: 'arrow.uturn.backward',
          color: '#FF9F0A',
        },
      } satisfies ToolResult
    },
  },
  get_water_today: {
    name: 'get_water_today',
    execute: async ({ userId }) => {
      const todayStart = new Date()
      todayStart.setHours(0, 0, 0, 0)
      const [total, settings] = await Promise.all([
        db.waterLog.aggregate({
          where: { userId, loggedAt: { gte: todayStart } },
          _sum: { amountMl: true },
        }),
        db.waterSettings.findUnique({ where: { userId } }),
      ])
      const totalMl = total._sum.amountMl ?? 0
      const goal = settings?.dailyGoalMl ?? 2500
      return {
        ok: true,
        data: { totalMl, goal, percentage: Math.round((totalMl / goal) * 100) },
      } satisfies ToolResult
    },
  },
  get_water_history: {
    name: 'get_water_history',
    execute: async ({ userId, params }) => {
      const { days = 7 } = (params as { days?: number }) ?? {}
      const since = new Date()
      since.setDate(since.getDate() - days)
      since.setHours(0, 0, 0, 0)
      const logs = await db.waterLog.findMany({
        where: { userId, loggedAt: { gte: since } },
        select: { amountMl: true, loggedAt: true },
      })
      // Günlere böl
      const dayMap: Record<string, number> = {}
      for (const l of logs) {
        const key = l.loggedAt.toISOString().slice(0, 10)
        dayMap[key] = (dayMap[key] ?? 0) + l.amountMl
      }
      return {
        ok: true,
        data: { history: dayMap },
      } satisfies ToolResult
    },
  },
  set_water_goal: {
    name: 'set_water_goal',
    execute: async ({ userId, params }) => {
      const { goalMl } = params as { goalMl: number }
      await db.waterSettings.upsert({
        where: { userId },
        update: { dailyGoalMl: goalMl },
        create: { userId, dailyGoalMl: goalMl },
      })
      return {
        ok: true,
        data: { goalMl },
        display: {
          title: `Günlük hedef güncellendi`,
          subtitle: `${(goalMl / 1000).toFixed(1)}L`,
          icon: 'target',
          color: '#0A84FF',
        },
      } satisfies ToolResult
    },
  },
}
