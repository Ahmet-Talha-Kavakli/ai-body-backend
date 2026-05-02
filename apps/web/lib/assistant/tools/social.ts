import { ToolDefinition, ToolExecutor } from './types'
import { db as prisma } from '@/lib/db/client'

const C = 'social_life' as const

export const socialToolDefs: ToolDefinition[] = [
  {
    name: 'add_social_event',
    category: C,
    description: 'Sosyal etkinlik / buluşma planı ekle',
    parameters: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Etkinlik adı (ör. "Ali ile kahve")' },
        personName: { type: 'string', description: 'Kiminle' },
        scheduledAt: { type: 'string', description: 'ISO tarih-saat' },
        location: { type: 'string' },
        notes: { type: 'string' },
      },
      required: ['title'],
    },
  },
  {
    name: 'list_social_events',
    category: C,
    description: 'Sosyal etkinlikleri listele',
    parameters: {
      type: 'object',
      properties: {
        upcoming: { type: 'boolean' },
        limit: { type: 'number', default: 10 },
      },
    },
  },
  {
    name: 'complete_social_event',
    category: C,
    description: 'Buluşmayı tamamlandı olarak işaretle',
    parameters: {
      type: 'object',
      properties: {
        eventId: { type: 'string' },
        notes: { type: 'string', description: 'Nasıl geçti?' },
      },
      required: ['eventId'],
    },
  },
  {
    name: 'add_birthday',
    category: C,
    description: 'Doğum günü kaydet',
    parameters: {
      type: 'object',
      properties: {
        personName: { type: 'string' },
        birthDate: { type: 'string', description: 'YYYY-MM-DD (yıl bilinmiyorsa 1900)' },
        relationship: { type: 'string', description: 'arkadaş | aile | iş arkadaşı | diğer' },
        notes: { type: 'string' },
      },
      required: ['personName', 'birthDate'],
    },
  },
  {
    name: 'list_upcoming_birthdays',
    category: C,
    description: 'Yaklaşan doğum günlerini listele',
    parameters: {
      type: 'object',
      properties: {
        withinDays: { type: 'number', default: 30 },
      },
    },
  },
  {
    name: 'add_gift_idea',
    category: C,
    description: 'Hediye fikri kaydet',
    parameters: {
      type: 'object',
      properties: {
        personName: { type: 'string' },
        idea: { type: 'string' },
        estimatedPrice: { type: 'number' },
        occasion: { type: 'string', description: 'doğum günü | yılbaşı | düğün | diğer' },
        notes: { type: 'string' },
      },
      required: ['personName', 'idea'],
    },
  },
  {
    name: 'list_gift_ideas',
    category: C,
    description: 'Hediye fikirlerini listele',
    parameters: {
      type: 'object',
      properties: {
        personName: { type: 'string' },
        boughtOnly: { type: 'boolean' },
      },
    },
  },
  {
    name: 'mark_gift_bought',
    category: C,
    description: 'Hediyeyi alındı olarak işaretle',
    parameters: {
      type: 'object',
      properties: {
        giftId: { type: 'string' },
      },
      required: ['giftId'],
    },
  },
  {
    name: 'add_favor',
    category: C,
    description: 'Yapılan veya yapılması gereken iyilik/borç kaydı ekle',
    parameters: {
      type: 'object',
      properties: {
        personName: { type: 'string' },
        description: { type: 'string' },
        direction: {
          type: 'string',
          enum: ['gave', 'received'],
          description: 'gave = ben yaptım, received = bana yapıldı',
        },
        amount: { type: 'number', description: 'Parasal değer (isteğe bağlı)' },
        notes: { type: 'string' },
      },
      required: ['personName', 'description', 'direction'],
    },
  },
  {
    name: 'list_favors',
    category: C,
    description: 'Borç/iyilik kayıtlarını listele',
    parameters: {
      type: 'object',
      properties: {
        personName: { type: 'string' },
        direction: { type: 'string', enum: ['gave', 'received', 'all'] },
        settledOnly: { type: 'boolean' },
      },
    },
  },
  {
    name: 'settle_favor',
    category: C,
    description: 'Borç/iyiliği kapatıldı olarak işaretle',
    parameters: {
      type: 'object',
      properties: {
        favorId: { type: 'string' },
      },
      required: ['favorId'],
    },
  },
  {
    name: 'log_social_note',
    category: C,
    description: 'Biriyle ilgili not al (ne konuştuk, ne söyledi, ne anlatmasını istedi)',
    parameters: {
      type: 'object',
      properties: {
        personName: { type: 'string' },
        note: { type: 'string' },
      },
      required: ['personName', 'note'],
    },
  },
  {
    name: 'list_social_notes',
    category: C,
    description: 'Biriyle ilgili alınan notları listele',
    parameters: {
      type: 'object',
      properties: {
        personName: { type: 'string' },
        limit: { type: 'number', default: 10 },
      },
    },
  },
]

export const socialExecutors: Record<string, ToolExecutor> = {
  add_social_event: {
    name: 'add_social_event',
    execute: async ({ userId, params }) => {
      const p = params as {
        title: string
        personName?: string
        scheduledAt?: string
        location?: string
        notes?: string
      }
      const ev = await prisma.socialEvent.create({
        data: {
          userId,
          title: p.title,
          personName: p.personName,
          scheduledAt: p.scheduledAt ? new Date(p.scheduledAt) : undefined,
          location: p.location,
          notes: p.notes,
        },
      })
      return { ok: true, data: ev }
    },
  },
  list_social_events: {
    name: 'list_social_events',
    execute: async ({ userId, params }) => {
      const p = params as { upcoming?: boolean; limit?: number }
      const now = new Date()
      const events = await prisma.socialEvent.findMany({
        where: {
          userId,
          ...(p.upcoming && { scheduledAt: { gte: now }, completed: false }),
        },
        orderBy: { scheduledAt: 'asc' },
        take: p.limit ?? 10,
      })
      return { ok: true, data: events }
    },
  },
  complete_social_event: {
    name: 'complete_social_event',
    execute: async ({ userId, params }) => {
      const p = params as { eventId: string; notes?: string }
      await prisma.socialEvent.updateMany({
        where: { id: p.eventId, userId },
        data: { completed: true, ...(p.notes !== undefined && { notes: p.notes }) },
      })
      return { ok: true }
    },
  },
  add_birthday: {
    name: 'add_birthday',
    execute: async ({ userId, params }) => {
      const p = params as {
        personName: string
        birthDate: string
        relationship?: string
        notes?: string
      }
      const rec = await prisma.birthday.create({
        data: {
          userId,
          personName: p.personName,
          birthDate: new Date(p.birthDate),
          relationship: p.relationship,
          notes: p.notes,
        },
      })
      return { ok: true, data: rec }
    },
  },
  list_upcoming_birthdays: {
    name: 'list_upcoming_birthdays',
    execute: async ({ userId, params }) => {
      const p = params as { withinDays?: number }
      const days = p.withinDays ?? 30
      const now = new Date()
      const all = await prisma.birthday.findMany({ where: { userId } })
      const upcoming = all
        .map((b) => {
          const next = new Date(b.birthDate)
          next.setFullYear(now.getFullYear())
          if (next < now) next.setFullYear(now.getFullYear() + 1)
          const diff = Math.ceil((next.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
          return { ...b, nextBirthday: next.toISOString().slice(0, 10), daysUntil: diff }
        })
        .filter((b) => b.daysUntil <= days)
        .sort((a, b) => a.daysUntil - b.daysUntil)
      return { ok: true, data: upcoming }
    },
  },
  add_gift_idea: {
    name: 'add_gift_idea',
    execute: async ({ userId, params }) => {
      const p = params as {
        personName: string
        idea: string
        estimatedPrice?: number
        occasion?: string
        notes?: string
      }
      const gift = await prisma.giftIdea.create({
        data: {
          userId,
          personName: p.personName,
          idea: p.idea,
          estimatedPrice: p.estimatedPrice,
          occasion: p.occasion,
          notes: p.notes,
        },
      })
      return { ok: true, data: gift }
    },
  },
  list_gift_ideas: {
    name: 'list_gift_ideas',
    execute: async ({ userId, params }) => {
      const p = params as { personName?: string; boughtOnly?: boolean }
      const gifts = await prisma.giftIdea.findMany({
        where: {
          userId,
          ...(p.personName && { personName: p.personName }),
          ...(p.boughtOnly !== undefined && { bought: p.boughtOnly }),
        },
        orderBy: { createdAt: 'desc' },
      })
      return { ok: true, data: gifts }
    },
  },
  mark_gift_bought: {
    name: 'mark_gift_bought',
    execute: async ({ userId, params }) => {
      const p = params as { giftId: string }
      await prisma.giftIdea.updateMany({ where: { id: p.giftId, userId }, data: { bought: true } })
      return { ok: true }
    },
  },
  add_favor: {
    name: 'add_favor',
    execute: async ({ userId, params }) => {
      const p = params as {
        personName: string
        description: string
        direction: string
        amount?: number
        notes?: string
      }
      const favor = await prisma.favor.create({
        data: {
          userId,
          personName: p.personName,
          description: p.description,
          direction: p.direction,
          amount: p.amount,
          notes: p.notes,
        },
      })
      return { ok: true, data: favor }
    },
  },
  list_favors: {
    name: 'list_favors',
    execute: async ({ userId, params }) => {
      const p = params as { personName?: string; direction?: string; settledOnly?: boolean }
      const favors = await prisma.favor.findMany({
        where: {
          userId,
          ...(p.personName && { personName: p.personName }),
          ...(p.direction && p.direction !== 'all' && { direction: p.direction }),
          ...(p.settledOnly !== undefined && { settled: p.settledOnly }),
        },
        orderBy: { createdAt: 'desc' },
      })
      return { ok: true, data: favors }
    },
  },
  settle_favor: {
    name: 'settle_favor',
    execute: async ({ userId, params }) => {
      const p = params as { favorId: string }
      await prisma.favor.updateMany({ where: { id: p.favorId, userId }, data: { settled: true } })
      return { ok: true }
    },
  },
  log_social_note: {
    name: 'log_social_note',
    execute: async ({ userId, params }) => {
      const p = params as { personName: string; note: string }
      const rec = await prisma.socialNote.create({
        data: { userId, personName: p.personName, note: p.note },
      })
      return { ok: true, data: rec }
    },
  },
  list_social_notes: {
    name: 'list_social_notes',
    execute: async ({ userId, params }) => {
      const p = params as { personName?: string; limit?: number }
      const notes = await prisma.socialNote.findMany({
        where: { userId, ...(p.personName && { personName: p.personName }) },
        orderBy: { createdAt: 'desc' },
        take: p.limit ?? 10,
      })
      return { ok: true, data: notes }
    },
  },
}
