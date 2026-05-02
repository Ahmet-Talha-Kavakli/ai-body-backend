/**
 * İlaç tool'ları.
 */

import { db } from '@/lib/db/client'
import { ToolDefinition, ToolExecutor, ToolResult } from './types'

export const medicationToolDefs: ToolDefinition[] = [
  {
    name: 'list_medications',
    category: 'medication',
    description: 'Kullanıcının takip ettiği tüm ilaçları listeler (isim, doz, zamanlar).',
    parameters: { type: 'object', properties: {} },
  },
  {
    name: 'get_today_medications',
    category: 'medication',
    description: 'Bugün alınması gereken ilaçları, alınanları ve alınmayanları listeler.',
    parameters: { type: 'object', properties: {} },
  },
  {
    name: 'mark_med_taken',
    category: 'medication',
    description: 'Bir ilacın alındığını işaretler.',
    parameters: {
      type: 'object',
      properties: {
        medicationId: { type: 'string' },
        scheduledTime: { type: 'string', description: 'Hangi zamanlanmış doz, örn "08:00"' },
      },
      required: ['medicationId'],
    },
  },
  {
    name: 'mark_med_skipped',
    category: 'medication',
    description: 'Bir ilaç dozunun atlandığını işaretler.',
    parameters: {
      type: 'object',
      properties: {
        medicationId: { type: 'string' },
        scheduledTime: { type: 'string' },
      },
      required: ['medicationId'],
    },
  },
  {
    name: 'add_medication',
    category: 'medication',
    description: 'Yeni ilaç ekler (kullanıcı yeni bir ilaca başladığında).',
    parameters: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        dosage: { type: 'string', description: 'örn "1 tablet", "10mg"' },
        unit: { type: 'string', enum: ['tablet', 'ml', 'mg', 'sprey', 'damla'] },
        scheduleTimes: {
          type: 'array',
          items: { type: 'string' },
          description: '["08:00", "20:00"]',
        },
        notes: { type: 'string' },
      },
      required: ['name', 'dosage'],
    },
  },
  {
    name: 'get_med_adherence',
    category: 'medication',
    description: 'Son 7-30 günde ilaç uyum oranını döner (alınması gereken / alındı).',
    parameters: {
      type: 'object',
      properties: {
        days: { type: 'number', default: 7 },
      },
    },
  },
]

function todayStr() {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d.toISOString().slice(0, 10)
}

export const medicationExecutors: Record<string, ToolExecutor> = {
  list_medications: {
    name: 'list_medications',
    execute: async ({ userId }) => {
      const meds = await db.medication.findMany({
        where: { userId, OR: [{ endDate: null }, { endDate: { gte: new Date() } }] },
        orderBy: { name: 'asc' },
        select: {
          id: true,
          name: true,
          dosage: true,
          unit: true,
          type: true,
          scheduleMode: true,
          scheduleTimes: true,
          scheduleDays: true,
          notes: true,
          startDate: true,
          endDate: true,
        },
      })
      return { ok: true, data: { medications: meds } } satisfies ToolResult
    },
  },
  get_today_medications: {
    name: 'get_today_medications',
    execute: async ({ userId }) => {
      const meds = await db.medication.findMany({
        where: { userId, OR: [{ endDate: null }, { endDate: { gte: new Date() } }] },
        select: {
          id: true,
          name: true,
          dosage: true,
          unit: true,
          scheduleMode: true,
          scheduleTimes: true,
          scheduleDays: true,
        },
      })
      const todayISO = todayStr()
      const logs = await db.medicationLog.findMany({
        where: { userId, date: todayISO },
        select: { medicationId: true, scheduledTime: true, skipped: true },
      })
      const dayOfWeek = ((new Date().getDay() + 6) % 7) + 1 // 1=Pzt, 7=Pzr
      const items = meds.map((m) => {
        const isToday = m.scheduleDays.length === 0 || m.scheduleDays.includes(dayOfWeek)
        const expectedTimes = isToday ? m.scheduleTimes : []
        const myLogs = logs.filter((l) => l.medicationId === m.id)
        const taken = myLogs.filter((l) => !l.skipped)
        const skipped = myLogs.filter((l) => l.skipped)
        const remaining = expectedTimes.filter(
          (t) =>
            !taken.some((l) => l.scheduledTime === t) && !skipped.some((l) => l.scheduledTime === t)
        )
        return {
          id: m.id,
          name: m.name,
          dosage: m.dosage,
          unit: m.unit,
          expectedTimes,
          takenTimes: taken.map((l) => l.scheduledTime).filter(Boolean),
          skippedTimes: skipped.map((l) => l.scheduledTime).filter(Boolean),
          remainingTimes: remaining,
        }
      })
      return {
        ok: true,
        data: {
          medications: items,
          totalToday: items.reduce((s, m) => s + m.expectedTimes.length, 0),
          takenToday: items.reduce((s, m) => s + m.takenTimes.length, 0),
        },
      } satisfies ToolResult
    },
  },
  mark_med_taken: {
    name: 'mark_med_taken',
    execute: async ({ userId, params }) => {
      const p = params as { medicationId: string; scheduledTime?: string }
      const med = await db.medication.findFirst({
        where: { id: p.medicationId, userId },
        select: { id: true, name: true, dosage: true },
      })
      if (!med) return { ok: false, error: 'med_not_found' }
      const log = await db.medicationLog.create({
        data: {
          userId,
          medicationId: med.id,
          takenAt: new Date(),
          date: todayStr(),
          scheduledTime: p.scheduledTime ?? null,
          skipped: false,
        },
      })
      return {
        ok: true,
        data: { logId: log.id },
        display: {
          title: `${med.name} alındı`,
          subtitle: `${med.dosage}${p.scheduledTime ? ` • ${p.scheduledTime}` : ''}`,
          icon: 'pills.fill',
          color: '#30D158',
        },
      } satisfies ToolResult
    },
  },
  mark_med_skipped: {
    name: 'mark_med_skipped',
    execute: async ({ userId, params }) => {
      const p = params as { medicationId: string; scheduledTime?: string }
      const med = await db.medication.findFirst({
        where: { id: p.medicationId, userId },
        select: { id: true, name: true },
      })
      if (!med) return { ok: false, error: 'med_not_found' }
      await db.medicationLog.create({
        data: {
          userId,
          medicationId: med.id,
          takenAt: new Date(),
          date: todayStr(),
          scheduledTime: p.scheduledTime ?? null,
          skipped: true,
        },
      })
      return {
        ok: true,
        display: {
          title: `${med.name} atlandı`,
          icon: 'pills',
          color: '#FF9F0A',
        },
      } satisfies ToolResult
    },
  },
  add_medication: {
    name: 'add_medication',
    execute: async ({ userId, params }) => {
      const p = params as {
        name: string
        dosage: string
        unit?: string
        scheduleTimes?: string[]
        notes?: string
      }
      const med = await db.medication.create({
        data: {
          userId,
          name: p.name,
          dosage: p.dosage,
          unit: p.unit ?? 'tablet',
          scheduleMode: p.scheduleTimes?.length ? 'fixed_times' : 'as_needed',
          scheduleTimes: p.scheduleTimes ?? [],
          notes: p.notes,
        },
      })
      return {
        ok: true,
        data: { medicationId: med.id },
        display: {
          title: `${med.name} eklendi`,
          subtitle: med.dosage,
          icon: 'pills.fill',
          color: '#5E5CE6',
        },
      } satisfies ToolResult
    },
  },
  get_med_adherence: {
    name: 'get_med_adherence',
    execute: async ({ userId, params }) => {
      const { days = 7 } = (params as { days?: number }) ?? {}
      const since = new Date()
      since.setDate(since.getDate() - days)
      since.setHours(0, 0, 0, 0)
      const [meds, logs] = await Promise.all([
        db.medication.findMany({
          where: { userId, OR: [{ endDate: null }, { endDate: { gte: since } }] },
          select: { scheduleTimes: true, scheduleDays: true, startDate: true },
        }),
        db.medicationLog.findMany({
          where: { userId, takenAt: { gte: since } },
          select: { skipped: true },
        }),
      ])
      const expectedDoses = meds.reduce((s, m) => {
        const daysCount = days
        return s + m.scheduleTimes.length * daysCount
      }, 0)
      const takenDoses = logs.filter((l) => !l.skipped).length
      const adherence = expectedDoses > 0 ? Math.round((takenDoses / expectedDoses) * 100) : 0
      return {
        ok: true,
        data: { days, expectedDoses, takenDoses, adherencePercent: adherence },
      } satisfies ToolResult
    },
  },
}
