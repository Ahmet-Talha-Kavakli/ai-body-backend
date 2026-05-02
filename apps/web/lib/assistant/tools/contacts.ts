/**
 * Contacts tool — mobile native search, intent ile.
 * Asistan "[X]'i arayalım" derse mobile rehberden bulur, dialer açar.
 */

import { ToolDefinition, ToolExecutor, ToolResult } from './types'

export const contactsToolDefs: ToolDefinition[] = [
  {
    name: 'find_and_call_contact',
    category: 'social',
    description:
      'Rehberde bir kişiyi ada göre bulur ve telefon dialer\'ını açar. Kullanıcı "anneni ara" / "Ahmet\'i ara" gibi konuştuğunda kullan.',
    parameters: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Aranacak isim (rehberde geçen)' },
      },
      required: ['name'],
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
}
