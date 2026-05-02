/**
 * Uyku tool'ları.
 */

import { db } from '@/lib/db/client'
import { ToolDefinition, ToolExecutor, ToolResult } from './types'

export const sleepToolDefs: ToolDefinition[] = [
  {
    name: 'get_last_sleep',
    category: 'sleep',
    description: 'Son tamamlanan uyku oturumunun detaylarını döner.',
    parameters: { type: 'object', properties: {} },
  },
  {
    name: 'get_sleep_history',
    category: 'sleep',
    description: 'Son N gecenin uyku verilerini döner.',
    parameters: {
      type: 'object',
      properties: {
        days: { type: 'number', default: 7 },
      },
    },
  },
  {
    name: 'get_sleep_score_avg',
    category: 'sleep',
    description: 'Son 7/30 günün ortalama uyku skorunu döner.',
    parameters: {
      type: 'object',
      properties: {
        days: { type: 'number', default: 7 },
      },
    },
  },
  {
    name: 'analyze_sleep_pattern',
    category: 'sleep',
    description: 'Kullanıcının uyku desenlerini analiz eder (geç yatma, kesintili uyku, vs.).',
    parameters: { type: 'object', properties: {} },
  },
]

export const sleepExecutors: Record<string, ToolExecutor> = {
  get_last_sleep: {
    name: 'get_last_sleep',
    execute: async ({ userId }) => {
      const session = await db.sleepSession.findFirst({
        where: { userId, status: 'completed' },
        orderBy: { endedAt: 'desc' },
      })
      if (!session) return { ok: true, data: { found: false } } satisfies ToolResult
      return {
        ok: true,
        data: {
          found: true,
          startedAt: session.startedAt,
          endedAt: session.endedAt,
          totalHours: session.totalMinutes ? +(session.totalMinutes / 60).toFixed(1) : null,
          score: session.sleepScore,
          deepMin: session.deepMinutes,
          remMin: session.remMinutes,
          lightMin: session.lightMinutes,
          awakeMin: session.awakeMinutes,
          snoreCount: session.snoreCount,
          bedtimeBpm: session.bedtimeBpm,
          wakeBpm: session.wakeBpm,
        },
      } satisfies ToolResult
    },
  },
  get_sleep_history: {
    name: 'get_sleep_history',
    execute: async ({ userId, params }) => {
      const { days = 7 } = (params as { days?: number }) ?? {}
      const since = new Date()
      since.setDate(since.getDate() - days)
      const sessions = await db.sleepSession.findMany({
        where: { userId, status: 'completed', endedAt: { gte: since } },
        orderBy: { endedAt: 'asc' },
        select: {
          endedAt: true,
          totalMinutes: true,
          sleepScore: true,
          deepMinutes: true,
          remMinutes: true,
        },
      })
      return {
        ok: true,
        data: {
          sessions: sessions.map((s) => ({
            date: s.endedAt?.toISOString().slice(0, 10),
            hours: s.totalMinutes ? +(s.totalMinutes / 60).toFixed(1) : null,
            score: s.sleepScore,
            deepMin: s.deepMinutes,
            remMin: s.remMinutes,
          })),
        },
      } satisfies ToolResult
    },
  },
  get_sleep_score_avg: {
    name: 'get_sleep_score_avg',
    execute: async ({ userId, params }) => {
      const { days = 7 } = (params as { days?: number }) ?? {}
      const since = new Date()
      since.setDate(since.getDate() - days)
      const sessions = await db.sleepSession.findMany({
        where: { userId, status: 'completed', endedAt: { gte: since } },
        select: { sleepScore: true, totalMinutes: true },
      })
      if (!sessions.length) return { ok: true, data: { found: false } } satisfies ToolResult
      const avgScore = Math.round(
        sessions.reduce((s, x) => s + (x.sleepScore ?? 0), 0) / sessions.length
      )
      const avgHours = +(
        sessions.reduce((s, x) => s + (x.totalMinutes ?? 0), 0) /
        sessions.length /
        60
      ).toFixed(1)
      return {
        ok: true,
        data: { found: true, days, avgScore, avgHours, nights: sessions.length },
      } satisfies ToolResult
    },
  },
  analyze_sleep_pattern: {
    name: 'analyze_sleep_pattern',
    execute: async ({ userId }) => {
      const since = new Date()
      since.setDate(since.getDate() - 30)
      const sessions = await db.sleepSession.findMany({
        where: { userId, status: 'completed', endedAt: { gte: since } },
        orderBy: { startedAt: 'asc' },
        select: { startedAt: true, totalMinutes: true, sleepScore: true, awakeMinutes: true },
      })
      if (sessions.length < 5) {
        return {
          ok: true,
          data: { enough: false, message: 'Yeterli veri yok (en az 5 gece gerekli).' },
        } satisfies ToolResult
      }
      const lateBedtime = sessions.filter(
        (s) => s.startedAt.getHours() >= 0 && s.startedAt.getHours() < 5
      ).length
      const fragmentedNights = sessions.filter((s) => s.awakeMinutes > 30).length
      const avgScore = Math.round(
        sessions.reduce((s, x) => s + (x.sleepScore ?? 0), 0) / sessions.length
      )
      return {
        ok: true,
        data: {
          enough: true,
          totalNights: sessions.length,
          avgScore,
          lateBedtimeNights: lateBedtime,
          fragmentedNights,
          patterns: [
            lateBedtime > sessions.length * 0.3
              ? 'Sık geç yatma alışkanlığı (gece 12 sonrası)'
              : null,
            fragmentedNights > sessions.length * 0.3 ? 'Uyku kesintili (30dk+ uyanık kalma)' : null,
            avgScore < 60 ? 'Ortalama uyku skoru düşük' : null,
          ].filter(Boolean),
        },
      } satisfies ToolResult
    },
  },
}
