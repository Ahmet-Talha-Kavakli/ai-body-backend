import { db } from '@/lib/db/client'
import { ToolDefinition, ToolExecutor, ToolResult } from './types'

export const reminderToolDefs: ToolDefinition[] = [
  {
    name: 'set_reminder',
    category: 'reminder',
    description: 'Belirli bir tarih/saatte hatırlatıcı kurar.',
    parameters: {
      type: 'object',
      properties: {
        text: { type: 'string', description: 'Hatırlatma mesajı' },
        scheduledFor: { type: 'string', description: 'ISO datetime' },
      },
      required: ['text', 'scheduledFor'],
    },
  },
  {
    name: 'list_reminders',
    category: 'reminder',
    description: 'Aktif hatırlatıcıları listeler.',
    parameters: { type: 'object', properties: {} },
  },
  {
    name: 'cancel_reminder',
    category: 'reminder',
    description: 'Hatırlatıcı iptal eder.',
    parameters: {
      type: 'object',
      properties: { reminderId: { type: 'string' } },
      required: ['reminderId'],
    },
    destructive: true,
  },
  {
    name: 'make_promise',
    category: 'reminder',
    description: 'Kullanıcının kendine verdiği sözü kaydeder. AI bunu hatırlatır.',
    parameters: {
      type: 'object',
      properties: {
        promise: { type: 'string', description: 'Söz metni' },
        checkInDays: { type: 'number', description: 'Kaç gün sonra hatırlat', default: 7 },
      },
      required: ['promise'],
    },
  },
]

export const reminderExecutors: Record<string, ToolExecutor> = {
  set_reminder: {
    name: 'set_reminder',
    execute: async ({ userId, params }) => {
      const p = params as { text: string; scheduledFor: string }
      const reminder = await db.assistantReminder.create({
        data: {
          userId,
          text: p.text,
          scheduledFor: new Date(p.scheduledFor),
        },
      })
      return {
        ok: true,
        data: reminder,
        display: {
          title: 'Hatırlatıcı kuruldu',
          subtitle: p.text,
          icon: 'bell.badge.fill',
          color: '#FF9F0A',
          undoable: true,
          undoToolCall: { name: 'cancel_reminder', params: { reminderId: reminder.id } },
        },
      } satisfies ToolResult
    },
  },
  list_reminders: {
    name: 'list_reminders',
    execute: async ({ userId }) => {
      const list = await db.assistantReminder.findMany({
        where: { userId, triggered: false },
        orderBy: { scheduledFor: 'asc' },
        take: 30,
      })
      return { ok: true, data: { reminders: list } } satisfies ToolResult
    },
  },
  cancel_reminder: {
    name: 'cancel_reminder',
    execute: async ({ userId, params }) => {
      const { reminderId } = params as { reminderId: string }
      const existing = await db.assistantReminder.findFirst({
        where: { id: reminderId, userId },
      })
      if (!existing) return { ok: false, error: 'not_found' }
      await db.assistantReminder.delete({ where: { id: reminderId } })
      return {
        ok: true,
        display: { title: 'Hatırlatıcı iptal edildi', icon: 'bell.slash', color: '#FF3B30' },
      } satisfies ToolResult
    },
  },
  make_promise: {
    name: 'make_promise',
    execute: async ({ userId, params }) => {
      const p = params as { promise: string; checkInDays?: number }
      const days = p.checkInDays ?? 7
      const checkInDate = new Date()
      checkInDate.setDate(checkInDate.getDate() + days)

      // Hem fact olarak ekle hem reminder olarak kur
      await db.assistantMemoryFact.create({
        data: {
          userId,
          category: 'promise',
          content: p.promise,
          confidence: 1,
        },
      })
      const reminder = await db.assistantReminder.create({
        data: {
          userId,
          text: `Söz hatırlatması: "${p.promise}" — denedin mi?`,
          scheduledFor: checkInDate,
        },
      })
      return {
        ok: true,
        data: { reminderId: reminder.id, checkInDate },
        display: {
          title: 'Söz kaydedildi',
          subtitle: `${days} gün sonra hatırlatacağım`,
          icon: 'hand.raised.fill',
          color: '#5E5CE6',
        },
      } satisfies ToolResult
    },
  },
}
