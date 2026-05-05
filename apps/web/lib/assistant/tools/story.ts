/**
 * Story tools — V3 Faz C
 *
 * AI'ın kendi hayat hikayesindeki bir anıyı kullanıcıyla paylaştığında çağırdığı tool.
 * - share_memory(milestone_id): milestone'ı unlock'lar, kullanıcı road map'te görebilsin diye.
 */

import OpenAI from 'openai'
import { put } from '@vercel/blob'
import { db } from '@/lib/db/client'
import { ToolDefinition, ToolExecutor, ToolResult } from './types'
import { backgroundEnsureIllustration } from '@/lib/assistant/illustration-generator'

const openai = new OpenAI()

export const storyToolDefs: ToolDefinition[] = [
  {
    name: 'share_memory',
    category: 'story',
    description:
      "Kullanıcıyla bir kişisel anını/hikayeni paylaştığında çağır. Milestone'ı kullanıcıya açar (road map'te görünür olur). Mesajının kendisi anıyı içermeli; bu tool sadece kayıt için. Milestone id'leri sistem prompt'unda 'KENDİ HİKAYEN' bölümünde verilir.",
    parameters: {
      type: 'object',
      properties: {
        milestone_id: {
          type: 'string',
          description:
            "Paylaştığın anının milestone id'si (sistem prompt'unda kilitli anıların yanında verilir).",
        },
      },
      required: ['milestone_id'],
    },
  },
  {
    name: 'send_image',
    category: 'story',
    description:
      "Konuşmaya bir görsel eklemek istediğinde çağır. NADİREN kullan — sadece atmosferi doğrulayacak, hatırayı somutlaştıracak ya da kullanıcıya küçük bir hediye gibi gelecek anlarda. ÖRNEK: 'sana göstermek istediğim bir şey var' deyip pencereden bir manzara, eski bir fotoğrafı andıran bir kare, bahçe köşesi gönderirsin. Asla rastgele/her mesajda kullanma. Mesajının metni doğal aktarsın, görseli destekler.",
    parameters: {
      type: 'object',
      properties: {
        prompt: {
          type: 'string',
          description:
            'Görsel için detaylı İngilizce prompt. Soft watercolor painted style. NO faces, NO text. Atmosfer ağırlıklı (manzara, eşya, mekan). Karakter Türkiye bağlamında, painterly book illustration aesthetic.',
        },
        caption: {
          type: 'string',
          description:
            'Türkçe kısa açıklama (kullanıcıya görsel altında veya mesajda gösterilebilir).',
        },
      },
      required: ['prompt'],
    },
  },
  {
    name: 'recall_user_image',
    category: 'story',
    description:
      "Kullanıcının geçmişte sana attığı bir fotoğrafı hatırlatma anında çağır. ÖRNEK: 'Hatırlıyor musun şu fotoğraf' deyip kullanıcının önceden attığı yemek/manzara/anı fotoğrafını mesajına ekler. Kullanıcı benzer bir konuyu açtığında veya nostaljik bir bağlam oluştuğunda kullan. Eğer kullanıcının hiç foto attığı yoksa kullanma.",
    parameters: {
      type: 'object',
      properties: {
        searchHint: {
          type: 'string',
          description:
            "Aradığın fotoğrafın bağlamı (TR). Örnek: 'yemek', 'köpeği', 'sahil tatili', 'doğum günü pastası'. Sistem semantik olarak en yakın user fotosunu bulur.",
        },
      },
      required: ['searchHint'],
    },
  },
]

export const storyExecutors: Record<string, ToolExecutor> = {
  share_memory: {
    name: 'share_memory',
    execute: async ({ userId, params, messageId }): Promise<ToolResult> => {
      const p = params as { milestone_id?: string }
      if (!p.milestone_id) {
        return { ok: false, error: 'missing_milestone_id' }
      }

      // Bu kullanıcının milestone'u olduğunu doğrula
      const milestone = await db.milestone.findFirst({
        where: {
          id: p.milestone_id,
          characterStory: {
            assistantProfile: { userId },
          },
        },
        select: { id: true, title: true, isLocked: true, age: true, emotion: true },
      })
      if (!milestone) {
        return { ok: false, error: 'milestone_not_found' }
      }
      if (!milestone.isLocked) {
        return {
          ok: true,
          data: { alreadyOpened: true, title: milestone.title },
          display: {
            title: 'Anı zaten açıktı',
            subtitle: milestone.title,
            icon: 'book.fill',
            color: '#5E5CE6',
          },
        }
      }

      await db.milestone.update({
        where: { id: milestone.id },
        data: {
          isLocked: false,
          unlockedAt: new Date(),
          openedInMessageId: messageId ?? null,
        },
      })

      // V3 Faz C — DALL-E illüstrasyon (background)
      backgroundEnsureIllustration({ kind: 'milestone', id: milestone.id })

      return {
        ok: true,
        data: { unlocked: true, title: milestone.title },
        display: {
          title: 'Yeni bir anı paylaştı',
          subtitle: milestone.title,
          icon: 'book.fill',
          color: '#5E5CE6',
        },
      }
    },
  },
  send_image: {
    name: 'send_image',
    execute: async ({ userId, params, messageId }): Promise<ToolResult> => {
      const p = params as { prompt?: string; caption?: string }
      if (!p.prompt) return { ok: false, error: 'missing_prompt' }
      if (!messageId) return { ok: false, error: 'missing_message_id' }

      // DALL-E
      let dalleUrl: string
      try {
        const r = await openai.images.generate({
          model: 'dall-e-3',
          prompt: `Soft watercolor painted illustration, NO faces, NO text, atmospheric. ${p.prompt}. Painterly book illustration aesthetic, gentle light, square composition, premium memory card style.`,
          n: 1,
          size: '1024x1024',
          quality: 'standard',
          style: 'natural',
          response_format: 'url',
        })
        dalleUrl = r.data?.[0]?.url ?? ''
        if (!dalleUrl) throw new Error('no_url')
      } catch (e) {
        return { ok: false, error: `dalle: ${e instanceof Error ? e.message : 'unknown'}` }
      }

      // Blob'a kaydet
      let blobUrl: string
      try {
        const imgRes = await fetch(dalleUrl)
        const buf = Buffer.from(await imgRes.arrayBuffer())
        const blobKey = `ai-shares/${userId}/${messageId}-${Date.now()}.png`
        const uploaded = await put(blobKey, buf, {
          access: 'public',
          contentType: 'image/png',
          addRandomSuffix: false,
        })
        blobUrl = uploaded.url
      } catch (e) {
        return { ok: false, error: `blob: ${e instanceof Error ? e.message : 'unknown'}` }
      }

      // Mesaja attachment ekle
      const attachment = {
        kind: 'image' as const,
        url: blobUrl,
        filename: `ai-image-${Date.now()}.png`,
        mime: 'image/png',
        caption: p.caption,
        sentByAI: true,
        uploadedAt: new Date().toISOString(),
      }

      // Mesajı çek, attachments'ı update et
      const existing = await db.assistantMessage.findUnique({
        where: { id: messageId },
        select: { attachments: true },
      })
      const prev = (existing?.attachments as unknown[] | null) ?? []
      await db.assistantMessage.update({
        where: { id: messageId },
        data: {
          attachments: [...prev, attachment] as Parameters<
            typeof db.assistantMessage.update
          >[0]['data']['attachments'],
        },
      })

      return {
        ok: true,
        data: { url: blobUrl, caption: p.caption },
        display: {
          title: 'Sana bir şey gösterdi',
          subtitle: p.caption ?? 'Görsel',
          icon: 'photo.fill',
          color: '#5E5CE6',
        },
      }
    },
  },
  recall_user_image: {
    name: 'recall_user_image',
    execute: async ({ userId, params, messageId }): Promise<ToolResult> => {
      const p = params as { searchHint?: string }
      if (!p.searchHint) return { ok: false, error: 'missing_hint' }
      if (!messageId) return { ok: false, error: 'missing_message_id' }

      // Kullanıcının attığı image attachment'ları çek
      const userMessages = await db.assistantMessage.findMany({
        where: {
          conversation: { userId },
          role: 'user',
          attachments: { not: undefined },
        },
        select: {
          id: true,
          content: true,
          createdAt: true,
          attachments: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
      })

      const candidates: Array<{
        url: string
        caption: string
        date: string
      }> = []

      for (const m of userMessages) {
        const atts = (m.attachments as Array<{ kind?: string; url?: string }> | null) ?? []
        for (const a of atts) {
          if (a.kind === 'image' && a.url) {
            candidates.push({
              url: a.url,
              caption: m.content || '(boş)',
              date: m.createdAt.toISOString().slice(0, 10),
            })
          }
        }
      }

      if (candidates.length === 0) {
        return { ok: false, error: 'no_user_images' }
      }

      // Son 1 fotoyu kullan eğer 1 tane varsa
      let chosen = candidates[0]!
      if (candidates.length > 1) {
        // GPT-4o-mini ile en uygun olanı seç
        try {
          const list = candidates
            .map((c, i) => `${i}: [${c.date}] caption: "${c.caption.slice(0, 80)}"`)
            .join('\n')
          const completion = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
              {
                role: 'system',
                content: `Aşağıdaki kullanıcı fotoğrafları listesinden, "${p.searchHint}" arama hintine en uygun olan fotoğrafın index'ini söyle. Sadece JSON: {"index": <number>}.`,
              },
              { role: 'user', content: list },
            ],
            response_format: { type: 'json_object' },
            temperature: 0,
            max_tokens: 30,
          })
          const text = completion.choices[0]?.message?.content
          if (text) {
            const parsed = JSON.parse(text) as { index?: number }
            if (typeof parsed.index === 'number' && candidates[parsed.index]) {
              chosen = candidates[parsed.index]!
            }
          }
        } catch {
          // fallback first
        }
      }

      // AI mesajına attachment ekle (recalled flag ile)
      const attachment = {
        kind: 'image' as const,
        url: chosen.url,
        sentByAI: true,
        recalled: true,
        recalledFromDate: chosen.date,
        uploadedAt: new Date().toISOString(),
      }

      const existing = await db.assistantMessage.findUnique({
        where: { id: messageId },
        select: { attachments: true },
      })
      const prev = (existing?.attachments as unknown[] | null) ?? []
      await db.assistantMessage.update({
        where: { id: messageId },
        data: {
          attachments: [...prev, attachment] as Parameters<
            typeof db.assistantMessage.update
          >[0]['data']['attachments'],
        },
      })

      return {
        ok: true,
        data: { url: chosen.url, recalledFromDate: chosen.date },
        display: {
          title: 'Eski bir anı hatırlattı',
          subtitle: chosen.date,
          icon: 'clock.arrow.circlepath',
          color: '#5E5CE6',
        },
      }
    },
  },
}
