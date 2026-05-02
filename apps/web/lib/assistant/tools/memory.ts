/**
 * AI'nin kendi kendine fact ekleyebileceği tool'lar.
 * Memory V2 (Faz J): versionlu, çelişki-aware.
 */

import { db } from '@/lib/db/client'
import { createBeliefVersion, findConflictingFacts } from '../memory'
import { ToolDefinition, ToolExecutor, ToolResult } from './types'

export const memoryToolDefs: ToolDefinition[] = [
  {
    name: 'remember_fact',
    category: 'knowledge',
    description:
      "Kullanıcı hakkında önemli bilgiyi hatırla. Eski bir bilgiyle çelişiyorsa eski archived, yeni version olarak eklenir. Eski belief'in id'sini biliyorsan replaces parametresine ver.",
    parameters: {
      type: 'object',
      properties: {
        category: {
          type: 'string',
          enum: ['identity', 'preference', 'pattern', 'event', 'promise'],
          description:
            'identity: yaş/cinsiyet/hastalık. preference: vegan/kafein hassas vs. pattern: davranış. event: önemli yaşam olayı. promise: kullanıcı sözü.',
        },
        content: { type: 'string', description: 'Hatırlanacak fact, kısa ve net' },
        replaces: {
          type: 'string',
          description: "Eğer bu fact bir önceki belief'in yerini alıyorsa, eski fact'in id'si.",
        },
      },
      required: ['category', 'content'],
    },
  },
  {
    name: 'revise_belief',
    category: 'knowledge',
    description:
      'Asistan kendi yanlışını düzeltir. Bir fact için yeni bir version yaratır ve eskinin yerini alır. Reason açıklaması kullanıcıya gösterilir ("yanlış anladım", "düzeltiyorum").',
    parameters: {
      type: 'object',
      properties: {
        factId: { type: 'string', description: "Eski fact'in id'si" },
        newContent: { type: 'string', description: 'Düzeltilmiş yeni içerik' },
        reason: {
          type: 'string',
          description: 'Neden düzeltildi (kısa, kullanıcıya açıklama için)',
        },
      },
      required: ['factId', 'newContent'],
    },
  },
  {
    name: 'forget_fact',
    category: 'knowledge',
    description:
      'Kullanıcı bir bilgiyi unutmamı istediğinde kullan. Fact tamamen arşivlenir, AI bir daha bu konuda bilgi sahibi gibi konuşmaz.',
    parameters: {
      type: 'object',
      properties: { factId: { type: 'string' } },
      required: ['factId'],
    },
    destructive: true,
  },
  {
    name: 'mark_onboarding_complete',
    category: 'knowledge',
    description:
      "Kullanıcı tanışma sorularını cevapladığında bu tool ile onboarding'i tamamla. Sadece tüm temel sorular cevaplandığında kullan.",
    parameters: { type: 'object', properties: {} },
  },
  {
    name: 'advance_onboarding_step',
    category: 'knowledge',
    description:
      "Onboarding sırasında her bir adım tamamlandığında bu tool ile step'i ilerlet. Adımlar: 0 (açılış) → 1 (kim) → 2 (niye) → 3 (hayat) → 4 (sevdikler) → 5 (beklenti) → 6 (tamam, mark_onboarding_complete ile birlikte).",
    parameters: {
      type: 'object',
      properties: {
        step: { type: 'integer', description: 'Yeni step (1-5)' },
      },
      required: ['step'],
    },
  },
]

export const memoryExecutors: Record<string, ToolExecutor> = {
  remember_fact: {
    name: 'remember_fact',
    execute: async ({ userId, params, messageId }) => {
      const p = params as { category: string; content: string; replaces?: string }

      // Çelişki tanıma — eğer replaces verilmediyse otomatik ara
      let replacesId: string | null = p.replaces ?? null
      let conflictNote: string | null = null
      if (!replacesId) {
        try {
          const conflicts = await findConflictingFacts(userId, p.content, p.category)
          if (conflicts.length > 0) {
            // En yüksek similarity'li olanı supersede ediyoruz
            const top = conflicts[0]!
            replacesId = top.id
            conflictNote = `Önceki "${top.content}" yerine yeni version eklendi.`
          }
        } catch (e) {
          console.error('[remember_fact/conflict]', e)
        }
      }

      const newId = await createBeliefVersion({
        userId,
        category: p.category,
        content: p.content,
        confidence: 0.9,
        sourceMessageId: messageId ?? null,
        replaces: replacesId,
      })

      return {
        ok: true,
        data: {
          factId: newId,
          replacedId: replacesId,
          note: conflictNote,
        },
      } satisfies ToolResult
    },
  },

  revise_belief: {
    name: 'revise_belief',
    execute: async ({ userId, params, messageId }) => {
      const p = params as { factId: string; newContent: string; reason?: string }
      const old = await db.assistantMemoryFact.findFirst({
        where: { id: p.factId, userId },
      })
      if (!old) return { ok: false, error: 'not_found' }

      const newId = await createBeliefVersion({
        userId,
        category: old.category,
        content: p.newContent,
        confidence: 1.0,
        sourceMessageId: messageId ?? null,
        replaces: old.id,
      })

      return {
        ok: true,
        data: { newFactId: newId, replacedId: old.id, reason: p.reason ?? null },
        display: {
          title: 'Düzeltildi',
          subtitle: p.reason ?? 'Hafızam güncellendi',
          icon: 'arrow.uturn.backward',
          color: '#FF9F0A',
        },
      } satisfies ToolResult
    },
  },

  forget_fact: {
    name: 'forget_fact',
    execute: async ({ userId, params }) => {
      const { factId } = params as { factId: string }
      const f = await db.assistantMemoryFact.findFirst({ where: { id: factId, userId } })
      if (!f) return { ok: false, error: 'not_found' }
      // Belief'in tüm versionlarını arşivle (kullanıcı "bunu unut" dedi → tüm geçmişi arşivle)
      if (f.beliefId) {
        await db.assistantMemoryFact.updateMany({
          where: { userId, beliefId: f.beliefId, archived: false },
          data: { archived: true, archivedAt: new Date() },
        })
      } else {
        await db.assistantMemoryFact.update({
          where: { id: factId },
          data: { archived: true, archivedAt: new Date() },
        })
      }
      return { ok: true } satisfies ToolResult
    },
  },

  mark_onboarding_complete: {
    name: 'mark_onboarding_complete',
    execute: async ({ userId }) => {
      await db.assistantProfile.update({
        where: { userId },
        data: { onboardingCompleted: true, onboardingCompletedAt: new Date(), onboardingStep: 6 },
      })
      return {
        ok: true,
        display: {
          title: 'Tanışma tamamlandı',
          icon: 'sparkles',
          color: '#5E5CE6',
        },
      } satisfies ToolResult
    },
  },

  advance_onboarding_step: {
    name: 'advance_onboarding_step',
    execute: async ({ userId, params }) => {
      const p = params as { step: number }
      const safeStep = Math.max(1, Math.min(5, Math.floor(p.step)))
      await db.assistantProfile.update({
        where: { userId },
        data: { onboardingStep: safeStep },
      })
      return { ok: true, data: { step: safeStep } } satisfies ToolResult
    },
  },
}
