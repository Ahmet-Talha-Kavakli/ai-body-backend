/**
 * Mood / mental sağlık tool'ları.
 */

import { db } from '@/lib/db/client'
import { ToolDefinition, ToolExecutor, ToolResult } from './types'

export const moodToolDefs: ToolDefinition[] = [
  {
    name: 'log_mood',
    category: 'mental',
    description: "Kullanıcının mood'unu ve isteğe bağlı stres/enerji seviyesini kaydeder.",
    parameters: {
      type: 'object',
      properties: {
        mood: { type: 'string', enum: ['very_low', 'low', 'neutral', 'good', 'excellent'] },
        stressLevel: { type: 'number', description: '1-10' },
        energyLevel: { type: 'number', description: '1-10' },
        note: { type: 'string', description: 'Kullanıcının ne hissettiğine dair kısa not' },
      },
      required: ['mood'],
    },
  },
  {
    name: 'get_today_mood',
    category: 'mental',
    description: 'Bugünün mood kaydını döner (varsa).',
    parameters: { type: 'object', properties: {} },
  },
  {
    name: 'get_mood_history',
    category: 'mental',
    description: 'Son N günün mood/stres/enerji geçmişini döner.',
    parameters: {
      type: 'object',
      properties: { days: { type: 'number', default: 14 } },
    },
  },
  {
    name: 'analyze_mood_pattern',
    category: 'mental',
    description: 'Son 30 günün mood deseni analizi (depresif belirtiler, stres trendi, vs.).',
    parameters: { type: 'object', properties: {} },
  },
]

const MOOD_SCORE: Record<string, number> = {
  very_low: 1,
  low: 2,
  neutral: 3,
  good: 4,
  excellent: 5,
}

export const moodExecutors: Record<string, ToolExecutor> = {
  log_mood: {
    name: 'log_mood',
    execute: async ({ userId, params }) => {
      const p = params as {
        mood: string
        stressLevel?: number
        energyLevel?: number
        note?: string
      }
      const log = await db.moodLog.create({
        data: {
          userId,
          mood: p.mood,
          moodScore: MOOD_SCORE[p.mood] ?? 3,
          stressLevel: p.stressLevel,
          energyLevel: p.energyLevel,
          note: p.note,
        },
      })
      return {
        ok: true,
        data: { logId: log.id },
        display: {
          title: 'Mood kaydedildi',
          subtitle: moodLabel(p.mood) + (p.stressLevel ? ` • Stres ${p.stressLevel}/10` : ''),
          icon: moodIcon(p.mood),
          color: moodColor(p.mood),
        },
      } satisfies ToolResult
    },
  },
  get_today_mood: {
    name: 'get_today_mood',
    execute: async ({ userId }) => {
      const todayStart = new Date()
      todayStart.setHours(0, 0, 0, 0)
      const log = await db.moodLog.findFirst({
        where: { userId, loggedAt: { gte: todayStart } },
        orderBy: { loggedAt: 'desc' },
      })
      return { ok: true, data: { mood: log } } satisfies ToolResult
    },
  },
  get_mood_history: {
    name: 'get_mood_history',
    execute: async ({ userId, params }) => {
      const { days = 14 } = (params as { days?: number }) ?? {}
      const since = new Date()
      since.setDate(since.getDate() - days)
      const logs = await db.moodLog.findMany({
        where: { userId, loggedAt: { gte: since } },
        orderBy: { loggedAt: 'asc' },
        select: {
          mood: true,
          moodScore: true,
          stressLevel: true,
          energyLevel: true,
          note: true,
          loggedAt: true,
        },
      })
      const avgScore = logs.length
        ? +(logs.reduce((s, l) => s + l.moodScore, 0) / logs.length).toFixed(1)
        : null
      return { ok: true, data: { logs, avgScore, count: logs.length } } satisfies ToolResult
    },
  },
  analyze_mood_pattern: {
    name: 'analyze_mood_pattern',
    execute: async ({ userId }) => {
      const since = new Date()
      since.setDate(since.getDate() - 30)
      const logs = await db.moodLog.findMany({
        where: { userId, loggedAt: { gte: since } },
        orderBy: { loggedAt: 'asc' },
        select: {
          mood: true,
          moodScore: true,
          stressLevel: true,
          energyLevel: true,
          loggedAt: true,
        },
      })
      if (logs.length < 5) {
        return {
          ok: true,
          data: { enough: false, message: 'Yeterli mood verisi yok (en az 5 gün gerekli).' },
        } satisfies ToolResult
      }
      const avgScore = +(logs.reduce((s, l) => s + l.moodScore, 0) / logs.length).toFixed(2)
      const lowDays = logs.filter((l) => l.moodScore <= 2).length
      const lowDaysRatio = lowDays / logs.length
      const avgStress = logs.filter((l) => l.stressLevel != null).length
        ? +(
            logs
              .filter((l) => l.stressLevel != null)
              .reduce((s, l) => s + (l.stressLevel ?? 0), 0) /
            logs.filter((l) => l.stressLevel != null).length
          ).toFixed(1)
        : null
      const avgEnergy = logs.filter((l) => l.energyLevel != null).length
        ? +(
            logs
              .filter((l) => l.energyLevel != null)
              .reduce((s, l) => s + (l.energyLevel ?? 0), 0) /
            logs.filter((l) => l.energyLevel != null).length
          ).toFixed(1)
        : null
      const patterns: string[] = []
      if (lowDaysRatio > 0.5)
        patterns.push(
          'Mood sürekli düşük seyrediyor (depresif belirti olabilir, profesyonel destek önerilir)'
        )
      else if (lowDaysRatio > 0.3) patterns.push('Mood ortalamanın altında, dikkat gerekli')
      if (avgStress && avgStress > 7) patterns.push('Stres seviyesi sürekli yüksek')
      if (avgEnergy && avgEnergy < 4) patterns.push('Enerji seviyesi düşük')
      const trend = compareTrend(logs.map((l) => l.moodScore))
      if (trend === 'down') patterns.push('Son haftalarda mood düşüş trendinde')
      if (trend === 'up') patterns.push('Son haftalarda mood iyileşme trendinde')
      return {
        ok: true,
        data: {
          enough: true,
          totalLogs: logs.length,
          avgScore,
          avgStress,
          avgEnergy,
          lowDays,
          lowDaysRatio: +lowDaysRatio.toFixed(2),
          patterns,
          trend,
        },
      } satisfies ToolResult
    },
  },
}

function compareTrend(scores: number[]): 'up' | 'down' | 'stable' {
  if (scores.length < 4) return 'stable'
  const half = Math.floor(scores.length / 2)
  const first = scores.slice(0, half).reduce((s, n) => s + n, 0) / half
  const second = scores.slice(half).reduce((s, n) => s + n, 0) / (scores.length - half)
  if (second - first > 0.3) return 'up'
  if (first - second > 0.3) return 'down'
  return 'stable'
}

function moodLabel(m: string): string {
  return (
    (
      {
        very_low: 'Çok kötü',
        low: 'Kötü',
        neutral: 'Nötr',
        good: 'İyi',
        excellent: 'Çok iyi',
      } as Record<string, string>
    )[m] ?? m
  )
}

function moodIcon(m: string): string {
  return (
    (
      {
        very_low: 'face.dashed',
        low: 'face.smiling.inverse',
        neutral: 'face.smiling',
        good: 'face.smiling.fill',
        excellent: 'sun.max.fill',
      } as Record<string, string>
    )[m] ?? 'face.smiling'
  )
}

function moodColor(m: string): string {
  return (
    (
      {
        very_low: '#FF3B30',
        low: '#FF9F0A',
        neutral: '#8E8E93',
        good: '#30D158',
        excellent: '#5E5CE6',
      } as Record<string, string>
    )[m] ?? '#5E5CE6'
  )
}
