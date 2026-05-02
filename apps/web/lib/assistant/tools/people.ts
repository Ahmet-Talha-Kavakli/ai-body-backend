/**
 * Kişi (Person) ve yaşam olayı (LifeEvent) tool'ları.
 */

import { db } from '@/lib/db/client'
import { ToolDefinition, ToolExecutor, ToolResult } from './types'

export const peopleToolDefs: ToolDefinition[] = [
  {
    name: 'add_person',
    category: 'people',
    description: 'Kullanıcının hayatındaki bir kişiyi (aile, arkadaş, iş arkadaşı vs.) kaydeder.',
    parameters: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        relationship: {
          type: 'string',
          enum: ['father', 'mother', 'sibling', 'friend', 'partner', 'colleague', 'child', 'other'],
        },
        importance: { type: 'number', description: '0-10 arası önem', default: 5 },
        notes: { type: 'string' },
        healthConditions: { type: 'array', items: { type: 'string' } },
      },
      required: ['name', 'relationship'],
    },
  },
  {
    name: 'update_person',
    category: 'people',
    description: 'Mevcut bir kişinin bilgilerini günceller (sağlık durumu, konum, notlar).',
    parameters: {
      type: 'object',
      properties: {
        personId: { type: 'string' },
        notes: { type: 'string' },
        healthConditions: { type: 'array', items: { type: 'string' } },
        importance: { type: 'number' },
        location: { type: 'string' },
      },
      required: ['personId'],
    },
  },
  {
    name: 'list_people',
    category: 'people',
    description: 'Kullanıcının hayatındaki kişileri listeler.',
    parameters: { type: 'object', properties: {} },
  },
  {
    name: 'add_life_event',
    category: 'people',
    description: 'Bir hayat olayı kaydeder (tanı, toplantı, kaybetme, kutlama vs.).',
    parameters: {
      type: 'object',
      properties: {
        type: {
          type: 'string',
          enum: [
            'diagnosis',
            'meeting',
            'deadline',
            'trip',
            'celebration',
            'conflict',
            'loss',
            'achievement',
            'health_event',
            'other',
          ],
        },
        title: { type: 'string' },
        description: { type: 'string' },
        date: { type: 'string', description: 'ISO date' },
        personId: { type: 'string', description: 'İlişkili kişi (opsiyonel)' },
        stressLevel: { type: 'number', description: '0-10 arası stres seviyesi' },
      },
      required: ['type', 'title', 'date'],
    },
  },
  {
    name: 'list_recent_events',
    category: 'people',
    description: 'Son N günün önemli hayat olaylarını listeler.',
    parameters: {
      type: 'object',
      properties: {
        days: { type: 'number', default: 30 },
      },
    },
  },
  {
    name: 'set_emergency_contact',
    category: 'people',
    description:
      'Bir kişiyi acil durum kişisi olarak işaretler (kriz anında asistan bunu önerir). Telefon numarası gerekir.',
    parameters: {
      type: 'object',
      properties: {
        personId: { type: 'string' },
        phoneNumber: { type: 'string', description: '+90... formatında' },
      },
      required: ['personId', 'phoneNumber'],
    },
  },
  {
    name: 'prepare_emergency_call',
    category: 'people',
    description:
      "KRİZ ANINDA kullanıcının acil durum kişisini aramaya hazırlar. Mobile bunu alıp telefon dialer'ını açar (kullanıcı son tıkla onaylar). Sadece L5 protokolünde (kullanıcı tehlikede + acil kişi var + onay verdi) kullan.",
    parameters: { type: 'object', properties: {} },
  },
]

export const peopleExecutors: Record<string, ToolExecutor> = {
  add_person: {
    name: 'add_person',
    execute: async ({ userId, params }) => {
      const p = params as {
        name: string
        relationship: string
        importance?: number
        notes?: string
        healthConditions?: string[]
      }
      const person = await db.person.create({
        data: {
          userId,
          name: p.name,
          relationship: p.relationship,
          importance: p.importance ?? 5,
          notes: p.notes,
          healthConditions: p.healthConditions ?? [],
        },
      })
      return {
        ok: true,
        data: person,
        display: {
          title: `${person.name} hatırlandı`,
          subtitle: relLabel(person.relationship),
          icon: 'person.crop.circle.fill',
          color: '#5E5CE6',
        },
      } satisfies ToolResult
    },
  },
  update_person: {
    name: 'update_person',
    execute: async ({ userId, params }) => {
      const p = params as {
        personId: string
        notes?: string
        healthConditions?: string[]
        importance?: number
        location?: string
      }
      const existing = await db.person.findFirst({
        where: { id: p.personId, userId },
        select: { id: true, name: true },
      })
      if (!existing) return { ok: false, error: 'not_found' }
      const updated = await db.person.update({
        where: { id: p.personId },
        data: {
          notes: p.notes,
          healthConditions: p.healthConditions,
          importance: p.importance,
          location: p.location,
          lastMentionedAt: new Date(),
        },
      })
      return {
        ok: true,
        data: updated,
        display: { title: `${existing.name} güncellendi`, icon: 'pencil', color: '#5E5CE6' },
      } satisfies ToolResult
    },
  },
  list_people: {
    name: 'list_people',
    execute: async ({ userId }) => {
      const people = await db.person.findMany({
        where: { userId, archived: false },
        orderBy: [{ importance: 'desc' }, { lastMentionedAt: 'desc' }],
        select: {
          id: true,
          name: true,
          relationship: true,
          importance: true,
          healthConditions: true,
          location: true,
          notes: true,
        },
      })
      return { ok: true, data: { people } } satisfies ToolResult
    },
  },
  add_life_event: {
    name: 'add_life_event',
    execute: async ({ userId, params }) => {
      const p = params as {
        type: string
        title: string
        description?: string
        date: string
        personId?: string
        stressLevel?: number
      }
      const event = await db.lifeEvent.create({
        data: {
          userId,
          personId: p.personId,
          type: p.type,
          title: p.title,
          description: p.description,
          date: new Date(p.date),
          stressLevel: p.stressLevel,
        },
      })
      return {
        ok: true,
        data: event,
        display: {
          title: `Olay kaydedildi`,
          subtitle: event.title,
          icon: 'calendar.badge.plus',
          color: '#5E5CE6',
        },
      } satisfies ToolResult
    },
  },
  list_recent_events: {
    name: 'list_recent_events',
    execute: async ({ userId, params }) => {
      const { days = 30 } = (params as { days?: number }) ?? {}
      const since = new Date()
      since.setDate(since.getDate() - days)
      const events = await db.lifeEvent.findMany({
        where: { userId, OR: [{ date: { gte: since } }, { resolved: false }] },
        orderBy: { date: 'desc' },
        take: 30,
        include: { person: { select: { name: true, relationship: true } } },
      })
      return { ok: true, data: { events } } satisfies ToolResult
    },
  },

  set_emergency_contact: {
    name: 'set_emergency_contact',
    execute: async ({ userId, params }) => {
      const p = params as { personId: string; phoneNumber: string }
      const person = await db.person.findFirst({ where: { id: p.personId, userId } })
      if (!person) return { ok: false, error: 'person_not_found' }
      // Diğerlerini düşür (tek bir acil kişi)
      await db.person.updateMany({
        where: { userId, isEmergencyContact: true },
        data: { isEmergencyContact: false },
      })
      const updated = await db.person.update({
        where: { id: p.personId },
        data: { isEmergencyContact: true, phoneNumber: p.phoneNumber },
      })
      return {
        ok: true,
        data: { person: updated },
        display: {
          title: `${updated.name} acil kişin oldu`,
          subtitle: 'Kriz anında onu önereceğim',
          icon: 'phone.fill',
          color: '#FF3B30',
        },
      } satisfies ToolResult
    },
  },

  prepare_emergency_call: {
    name: 'prepare_emergency_call',
    execute: async ({ userId }) => {
      const ec = await db.person.findFirst({
        where: { userId, isEmergencyContact: true, archived: false },
        select: { id: true, name: true, relationship: true, phoneNumber: true },
      })
      if (!ec || !ec.phoneNumber) {
        return { ok: false, error: 'no_emergency_contact' }
      }
      return {
        ok: true,
        data: {
          name: ec.name,
          relationship: ec.relationship,
          phoneNumber: ec.phoneNumber,
          // Mobile bu data ile dialer açar (tel: protokol)
          navigate: 'emergency_call',
          dialerUrl: `tel:${ec.phoneNumber}`,
        },
        display: {
          title: `${ec.name} aranıyor`,
          subtitle: ec.phoneNumber,
          icon: 'phone.fill',
          color: '#FF3B30',
        },
      } satisfies ToolResult
    },
  },
}

function relLabel(r: string) {
  return (
    (
      {
        father: 'Baba',
        mother: 'Anne',
        sibling: 'Kardeş',
        friend: 'Arkadaş',
        partner: 'Eş/Sevgili',
        colleague: 'İş arkadaşı',
        child: 'Çocuk',
        other: 'Diğer',
      } as const
    )[r as 'father'] ?? r
  )
}
