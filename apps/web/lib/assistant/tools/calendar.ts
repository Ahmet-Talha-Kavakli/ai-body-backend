/**
 * Calendar tool'ları — mobile sync edilen DB'den okur, yazma için mobile'a navigate intent gönderir.
 */

import { db } from '@/lib/db/client'
import { ToolDefinition, ToolExecutor, ToolResult } from './types'

export const calendarToolDefs: ToolDefinition[] = [
  {
    name: 'get_upcoming_events',
    category: 'social',
    description:
      "Kullanıcının takvimindeki yaklaşan etkinlikleri (toplantı, randevu, doğum günü). Mobile sync'inden gelir, en güncel.",
    parameters: {
      type: 'object',
      properties: {
        days: { type: 'number', default: 7, description: 'Bugünden itibaren kaç gün ileri' },
      },
    },
  },
  {
    name: 'create_calendar_event',
    category: 'social',
    description:
      "Takvime yeni etkinlik ekleyeceğini KULLANICIYA SÖYLER, mobile bunu kullanıcının onayıyla iOS Calendar'a yazar. (Direkt yazılmaz, kullanıcı confirm eder.)",
    parameters: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        startISO: { type: 'string', description: 'ISO 8601' },
        endISO: { type: 'string', description: 'ISO 8601' },
        notes: { type: 'string' },
        location: { type: 'string' },
        alarmMinutes: { type: 'number', description: 'Etkinlikten kaç dk önce alarm' },
      },
      required: ['title', 'startISO', 'endISO'],
    },
  },
  {
    name: 'get_active_reminders',
    category: 'social',
    description: "Kullanıcının iOS Reminders'da tamamlanmamış görevleri.",
    parameters: { type: 'object', properties: {} },
  },
  {
    name: 'create_reminder',
    category: 'social',
    description:
      "Yeni reminder oluştururken mobile'a intent gönderir. Kullanıcı onayıyla iOS Reminders'a yazılır.",
    parameters: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        dueISO: { type: 'string', description: 'ISO 8601 (opsiyonel)' },
        notes: { type: 'string' },
      },
      required: ['title'],
    },
  },
]

export const calendarExecutors: Record<string, ToolExecutor> = {
  get_upcoming_events: {
    name: 'get_upcoming_events',
    execute: async ({ userId, params }) => {
      const p = params as { days?: number }
      const days = p?.days ?? 7
      const start = new Date()
      const end = new Date()
      end.setDate(end.getDate() + days)
      const events = await db.calendarEventShadow.findMany({
        where: { userId, startDate: { gte: start, lte: end } },
        orderBy: { startDate: 'asc' },
        take: 30,
      })
      return {
        ok: true,
        data: { events, days },
        display: {
          title: `${days} gün takvim`,
          subtitle: events.length ? `${events.length} etkinlik` : 'Boş',
          icon: 'calendar',
          color: '#FF3B30',
        },
      } satisfies ToolResult
    },
  },

  create_calendar_event: {
    name: 'create_calendar_event',
    execute: async ({ params }) => {
      const p = params as {
        title: string
        startISO: string
        endISO: string
        notes?: string
        location?: string
        alarmMinutes?: number
      }
      // Mobile bu intent ile iOS Calendar prompt açar
      return {
        ok: true,
        data: {
          navigate: 'create_calendar_event',
          title: p.title,
          startISO: p.startISO,
          endISO: p.endISO,
          notes: p.notes,
          location: p.location,
          alarmMinutes: p.alarmMinutes,
        },
        display: {
          title: 'Takvime ekle',
          subtitle: p.title,
          icon: 'calendar.badge.plus',
          color: '#FF3B30',
        },
      } satisfies ToolResult
    },
  },

  get_active_reminders: {
    name: 'get_active_reminders',
    execute: async ({ userId }) => {
      const reminders = await db.reminderShadow.findMany({
        where: { userId, completed: false },
        orderBy: [{ dueDate: 'asc' }, { syncedAt: 'desc' }],
        take: 20,
      })
      return {
        ok: true,
        data: { reminders },
        display: {
          title: 'Görevler',
          subtitle: reminders.length ? `${reminders.length} aktif` : 'Boş',
          icon: 'list.bullet',
          color: '#FF9F0A',
        },
      } satisfies ToolResult
    },
  },

  create_reminder: {
    name: 'create_reminder',
    execute: async ({ params }) => {
      const p = params as { title: string; dueISO?: string; notes?: string }
      return {
        ok: true,
        data: {
          navigate: 'create_reminder',
          title: p.title,
          dueISO: p.dueISO,
          notes: p.notes,
        },
        display: {
          title: 'Görev ekle',
          subtitle: p.title,
          icon: 'list.bullet.indent',
          color: '#FF9F0A',
        },
      } satisfies ToolResult
    },
  },
}
