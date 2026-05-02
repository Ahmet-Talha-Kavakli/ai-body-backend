/**
 * Vücut & tartı tool'ları.
 */

import { db } from '@/lib/db/client'
import { ToolDefinition, ToolExecutor, ToolResult } from './types'

export const bodyToolDefs: ToolDefinition[] = [
  {
    name: 'add_weight',
    category: 'body',
    description: 'Kilo kaydı ekler.',
    parameters: {
      type: 'object',
      properties: {
        weightKg: { type: 'number' },
        note: { type: 'string' },
      },
      required: ['weightKg'],
    },
  },
  {
    name: 'get_weight_trend',
    category: 'body',
    description: 'Son N gündeki kilo trendini döner.',
    parameters: {
      type: 'object',
      properties: { days: { type: 'number', default: 30 } },
    },
  },
  {
    name: 'get_latest_weight',
    category: 'body',
    description: 'En son kaydedilmiş kiloyu döner.',
    parameters: { type: 'object', properties: {} },
  },
]

export const bodyExecutors: Record<string, ToolExecutor> = {
  add_weight: {
    name: 'add_weight',
    execute: async ({ userId, params }) => {
      const p = params as { weightKg: number; note?: string }
      const entry = await db.weightEntry.create({
        data: { userId, weightKg: p.weightKg, note: p.note },
      })
      return {
        ok: true,
        data: { entryId: entry.id },
        display: {
          title: `${p.weightKg.toFixed(1)} kg kaydedildi`,
          icon: 'scalemass.fill',
          color: '#5AC8FA',
        },
      } satisfies ToolResult
    },
  },
  get_weight_trend: {
    name: 'get_weight_trend',
    execute: async ({ userId, params }) => {
      const { days = 30 } = (params as { days?: number }) ?? {}
      const since = new Date()
      since.setDate(since.getDate() - days)
      const entries = await db.weightEntry.findMany({
        where: { userId, recordedAt: { gte: since } },
        orderBy: { recordedAt: 'asc' },
        select: { weightKg: true, recordedAt: true, note: true },
      })
      if (!entries.length)
        return { ok: true, data: { entries: [], trend: null } } satisfies ToolResult
      const first = entries[0]!.weightKg
      const last = entries[entries.length - 1]!.weightKg
      const change = +(last - first).toFixed(1)
      return {
        ok: true,
        data: {
          entries: entries.map((e) => ({
            date: e.recordedAt.toISOString().slice(0, 10),
            kg: e.weightKg,
            note: e.note,
          })),
          startKg: first,
          currentKg: last,
          changeKg: change,
          days,
        },
      } satisfies ToolResult
    },
  },
  get_latest_weight: {
    name: 'get_latest_weight',
    execute: async ({ userId }) => {
      const entry = await db.weightEntry.findFirst({
        where: { userId },
        orderBy: { recordedAt: 'desc' },
        select: { weightKg: true, recordedAt: true },
      })
      return { ok: true, data: { entry } } satisfies ToolResult
    },
  },
}
