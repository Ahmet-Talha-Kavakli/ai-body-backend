/**
 * Calendar + Reminders tool'ları — mobile sync'inden okur, yazma için intent gönderir.
 */

import { db } from '@/lib/db/client'
import { ToolDefinition, ToolExecutor, ToolResult } from './types'

export const calendarToolDefs: ToolDefinition[] = [
  // CALENDAR
  {
    name: 'get_upcoming_events',
    category: 'social',
    description:
      "Kullanıcının takvimindeki yaklaşan etkinlikleri (toplantı, randevu, doğum günü). Mobile sync'inden gelir.",
    parameters: {
      type: 'object',
      properties: {
        days: { type: 'number', default: 7, description: 'Bugünden itibaren kaç gün ileri' },
      },
    },
  },
  {
    name: 'search_events',
    category: 'social',
    description:
      'Takvim etkinliklerini başlığa göre ara. "Spor randevularım", "doktor randevuları" gibi.',
    parameters: {
      type: 'object',
      properties: {
        query: { type: 'string' },
        days: { type: 'number', default: 30, description: 'Kaç gün geriye+ileriye baksın' },
      },
      required: ['query'],
    },
  },
  {
    name: 'create_calendar_event',
    category: 'social',
    description:
      "Takvime yeni etkinlik. Mobile kullanıcıya onay sorar, kullanıcı confirm edince iOS Calendar'a yazılır.",
    parameters: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        startISO: { type: 'string', description: 'ISO 8601' },
        endISO: { type: 'string', description: 'ISO 8601' },
        notes: { type: 'string' },
        location: { type: 'string' },
        alarmMinutes: { type: 'number' },
      },
      required: ['title', 'startISO', 'endISO'],
    },
  },
  {
    name: 'update_calendar_event',
    category: 'social',
    description:
      'Bir etkinliğin başlık/zaman/yer/notunu güncelle. eventId, get_upcoming_events veya search_events çıktısından alınır. Kullanıcı onayıyla yazılır.',
    parameters: {
      type: 'object',
      properties: {
        eventId: { type: 'string', description: 'externalId (iOS event id)' },
        title: { type: 'string' },
        startISO: { type: 'string' },
        endISO: { type: 'string' },
        notes: { type: 'string' },
        location: { type: 'string' },
      },
      required: ['eventId'],
    },
  },
  {
    name: 'delete_calendar_event',
    category: 'social',
    description: 'Takvimden bir etkinliği siler. Kullanıcı onayıyla. eventId, listeden bilinmeli.',
    parameters: {
      type: 'object',
      properties: {
        eventId: { type: 'string' },
      },
      required: ['eventId'],
    },
    destructive: true,
  },

  // REMINDERS
  {
    name: 'get_active_reminders',
    category: 'social',
    description: "iOS Reminders'da tamamlanmamış görevleri listeler.",
    parameters: { type: 'object', properties: {} },
  },
  {
    name: 'search_reminders',
    category: 'social',
    description: 'Reminders\'da başlığa göre arama. "Süt al diye reminderım var mı?"',
    parameters: {
      type: 'object',
      properties: {
        query: { type: 'string' },
      },
      required: ['query'],
    },
  },
  {
    name: 'create_reminder',
    category: 'social',
    description: "Yeni reminder oluştur. Mobile onay isteyip iOS Reminders'a yazar.",
    parameters: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        dueISO: { type: 'string' },
        notes: { type: 'string' },
      },
      required: ['title'],
    },
  },
  {
    name: 'complete_reminder',
    category: 'social',
    description: "Bir reminder'ı tamamlandı işaretle. reminderId listeden alınır.",
    parameters: {
      type: 'object',
      properties: {
        reminderId: { type: 'string' },
      },
      required: ['reminderId'],
    },
  },
  {
    name: 'update_reminder',
    category: 'social',
    description: 'Reminder başlığı/notunu/zamanını güncelle.',
    parameters: {
      type: 'object',
      properties: {
        reminderId: { type: 'string' },
        title: { type: 'string' },
        dueISO: { type: 'string' },
        notes: { type: 'string' },
      },
      required: ['reminderId'],
    },
  },
  {
    name: 'delete_reminder',
    category: 'social',
    description: "Reminder'ı siler. Kullanıcı onayıyla.",
    parameters: {
      type: 'object',
      properties: {
        reminderId: { type: 'string' },
      },
      required: ['reminderId'],
    },
    destructive: true,
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

  search_events: {
    name: 'search_events',
    execute: async ({ userId, params }) => {
      const p = params as { query: string; days?: number }
      const days = p?.days ?? 30
      const start = new Date()
      start.setDate(start.getDate() - days)
      const end = new Date()
      end.setDate(end.getDate() + days)
      const events = await db.calendarEventShadow.findMany({
        where: {
          userId,
          startDate: { gte: start, lte: end },
          title: { contains: p.query, mode: 'insensitive' },
        },
        orderBy: { startDate: 'asc' },
        take: 30,
      })
      return {
        ok: true,
        data: { events, query: p.query, count: events.length },
        display: {
          title: `"${p.query}"`,
          subtitle: `${events.length} etkinlik`,
          icon: 'magnifyingglass',
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
      return {
        ok: true,
        data: { navigate: 'create_calendar_event', ...p },
        display: {
          title: 'Takvime ekle',
          subtitle: p.title,
          icon: 'calendar.badge.plus',
          color: '#FF3B30',
        },
      } satisfies ToolResult
    },
  },

  update_calendar_event: {
    name: 'update_calendar_event',
    execute: async ({ params }) => {
      const p = params as Record<string, unknown>
      return {
        ok: true,
        data: { navigate: 'update_calendar_event', ...p },
        display: {
          title: 'Etkinlik güncellenecek',
          subtitle: (p.title as string) ?? 'Onayla',
          icon: 'pencil',
          color: '#FF3B30',
        },
      } satisfies ToolResult
    },
  },

  delete_calendar_event: {
    name: 'delete_calendar_event',
    execute: async ({ params }) => {
      const p = params as { eventId: string }
      return {
        ok: true,
        data: { navigate: 'delete_calendar_event', eventId: p.eventId },
        display: {
          title: 'Etkinlik silinecek',
          subtitle: 'Onayla',
          icon: 'trash',
          color: '#FF3B30',
          undoable: false,
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

  search_reminders: {
    name: 'search_reminders',
    execute: async ({ userId, params }) => {
      const p = params as { query: string }
      const reminders = await db.reminderShadow.findMany({
        where: {
          userId,
          title: { contains: p.query, mode: 'insensitive' },
        },
        orderBy: [{ completed: 'asc' }, { dueDate: 'asc' }],
        take: 20,
      })
      return {
        ok: true,
        data: { reminders, query: p.query, count: reminders.length },
        display: {
          title: `"${p.query}"`,
          subtitle: `${reminders.length} görev`,
          icon: 'magnifyingglass',
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
        data: { navigate: 'create_reminder', ...p },
        display: {
          title: 'Görev ekle',
          subtitle: p.title,
          icon: 'list.bullet.indent',
          color: '#FF9F0A',
        },
      } satisfies ToolResult
    },
  },

  complete_reminder: {
    name: 'complete_reminder',
    execute: async ({ params }) => {
      const p = params as { reminderId: string }
      return {
        ok: true,
        data: { navigate: 'complete_reminder', reminderId: p.reminderId },
        display: {
          title: 'Görev tamamlandı',
          icon: 'checkmark.circle.fill',
          color: '#30D158',
        },
      } satisfies ToolResult
    },
  },

  update_reminder: {
    name: 'update_reminder',
    execute: async ({ params }) => {
      const p = params as Record<string, unknown>
      return {
        ok: true,
        data: { navigate: 'update_reminder', ...p },
        display: {
          title: 'Görev güncellenecek',
          subtitle: (p.title as string) ?? 'Onayla',
          icon: 'pencil',
          color: '#FF9F0A',
        },
      } satisfies ToolResult
    },
  },

  delete_reminder: {
    name: 'delete_reminder',
    execute: async ({ params }) => {
      const p = params as { reminderId: string }
      return {
        ok: true,
        data: { navigate: 'delete_reminder', reminderId: p.reminderId },
        display: {
          title: 'Görev silinecek',
          subtitle: 'Onayla',
          icon: 'trash',
          color: '#FF9F0A',
          undoable: false,
        },
      } satisfies ToolResult
    },
  },
}
