/**
 * Contacts tool'ları — ContactShadow'dan okur, mobile sync'i yapar.
 */

import { db } from '@/lib/db/client'
import { ToolDefinition, ToolExecutor, ToolResult } from './types'

export const contactsToolDefs: ToolDefinition[] = [
  {
    name: 'find_and_call_contact',
    category: 'social',
    description:
      'Rehberde bir kişiyi ada göre bulur ve telefon dialer\'ını açar. "Anneni ara", "Ahmet\'i ara" deyince.',
    parameters: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Aranacak isim' },
      },
      required: ['name'],
    },
  },
  {
    name: 'list_contacts',
    category: 'social',
    description:
      'Kullanıcının rehberindeki kayıtları listeler. "Rehberimde kimler var", "kaç kişi kayıtlı" gibi sorularda kullan. Çok kişi varsa ilk N taneyi döner.',
    parameters: {
      type: 'object',
      properties: {
        limit: { type: 'number', default: 30, description: 'Kaç kişi döndürülsün' },
      },
    },
  },
  {
    name: 'search_contacts',
    category: 'social',
    description:
      'Rehberde isim veya kısmi ada göre arar. "Mehmet diye birini bul", "Ali\'leri göster" gibi.',
    parameters: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Aranan isim/parça' },
      },
      required: ['query'],
    },
  },
]

export const contactsExecutors: Record<string, ToolExecutor> = {
  find_and_call_contact: {
    name: 'find_and_call_contact',
    execute: async ({ params }) => {
      const p = params as { name: string }
      return {
        ok: true,
        data: {
          navigate: 'find_and_call_contact',
          name: p.name,
        },
        display: {
          title: `${p.name} aranıyor`,
          subtitle: 'Rehberden bulunup aranacak',
          icon: 'phone.fill',
          color: '#30D158',
        },
      } satisfies ToolResult
    },
  },

  list_contacts: {
    name: 'list_contacts',
    execute: async ({ userId, params }) => {
      const p = params as { limit?: number }
      const limit = Math.min(Math.max(p?.limit ?? 30, 1), 100)
      const [contacts, total] = await Promise.all([
        db.contactShadow.findMany({
          where: { userId },
          orderBy: { name: 'asc' },
          take: limit,
          select: { name: true, phoneNumbers: true },
        }),
        db.contactShadow.count({ where: { userId } }),
      ])
      return {
        ok: true,
        data: { contacts, total, shown: contacts.length },
        display: {
          title: 'Rehber',
          subtitle: `${total} kişi`,
          icon: 'person.crop.circle.fill',
          color: '#30D158',
        },
      } satisfies ToolResult
    },
  },

  search_contacts: {
    name: 'search_contacts',
    execute: async ({ userId, params }) => {
      const p = params as { query: string }
      const contacts = await db.contactShadow.findMany({
        where: {
          userId,
          name: { contains: p.query, mode: 'insensitive' },
        },
        orderBy: { name: 'asc' },
        take: 20,
        select: { name: true, phoneNumbers: true, emails: true },
      })
      return {
        ok: true,
        data: { contacts, query: p.query, count: contacts.length },
        display: {
          title: `"${p.query}" araması`,
          subtitle: `${contacts.length} sonuç`,
          icon: 'magnifyingglass',
          color: '#30D158',
        },
      } satisfies ToolResult
    },
  },
}
