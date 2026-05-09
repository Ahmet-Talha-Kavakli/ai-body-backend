/**
 * V4.5 Faz 9C — Karakter sohbeti running summary
 *
 * Mantık: Sohbet 30+ mesajı geçtiğinde, en eski 20 mesaj özetlenir
 * (gpt-4o-mini ile, hızlı + ucuz), AssistantConversation.runningSummary'ye yazılır.
 * Stream'de son 12 mesaj + bu özet birlikte prompt'a inject edilir.
 *
 * Trigger: Stream sonunda arka planda — yeni mesaj sayısı eşiği aştıysa.
 */

import { db } from '@/lib/db/client'
import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

const SUMMARIZE_THRESHOLD = 30 // bu sayıdan fazla mesaj varsa özet üret/güncelle
const KEEP_RECENT_FOR_PROMPT = 12 // son N mesaj prompt'a verbatim gider
const SUMMARIZE_BATCH_FROM = 20 // en eski 20 mesajı özetle (yeni mesajları korur)

const SUMMARIZE_PROMPT = `Sen bir sohbet özetleme motorusun. İki kişi arasındaki konuşmayı, KARAKTER GİBİ KONUŞMA TARZINI BOZMADAN, BAĞLAMI KAYBETMEDEN özetle.

KURALLAR:
- Özette tüm önemli olayları, paylaşılan bilgileri, ruh hali değişimlerini, sözleri yakala.
- Detayı önemli olaylar için (aile, iş, hastalık, ayrılık, sırrı paylaşma) tut.
- Trivial konuları (selamlaşma, "n'aber") atla.
- Türkçe, akıcı, max 600 kelime.
- Üçüncü şahıs bakış açısı ("X şunu paylaştı, sonra Y..." şeklinde).

Özet sonra karakterin system prompt'una "[ESKİ KONUŞMA ÖZETİ]" bloğu olarak girecek.`

/**
 * Conversation'da yeterince mesaj varsa, eskileri özetle ve runningSummary'yi güncelle.
 * Idempotent: zaten yazılmış mesajları tekrar özetlemez.
 */
export async function maybeUpdateConversationSummary(args: {
  conversationId: string
}): Promise<void> {
  const { conversationId } = args

  const conv = await db.assistantConversation.findUnique({
    where: { id: conversationId },
    select: {
      id: true,
      runningSummary: true,
      summarizedThruId: true,
    },
  })
  if (!conv) return

  // Toplam mesaj sayısı
  const total = await db.assistantMessage.count({
    where: { conversationId },
  })
  if (total < SUMMARIZE_THRESHOLD) return

  // Henüz özetlenmemiş eski mesajları çek
  // Sıralı: kronolojik (eskiden yeniye)
  const allMessages = await db.assistantMessage.findMany({
    where: { conversationId },
    orderBy: { createdAt: 'asc' },
    select: { id: true, role: true, content: true, createdAt: true },
  })

  // Son KEEP_RECENT_FOR_PROMPT mesajı bırak, gerisi özetlenebilir aday
  const cutoff = allMessages.length - KEEP_RECENT_FOR_PROMPT
  if (cutoff < SUMMARIZE_BATCH_FROM) return

  const toSummarize = allMessages.slice(0, cutoff)
  const lastSummarizedIdx = conv.summarizedThruId
    ? toSummarize.findIndex((m) => m.id === conv.summarizedThruId)
    : -1

  // Eğer son özetlenen mesajdan beri yeterli yeni mesaj birikmediyse atla
  const newMessagesSinceLast = toSummarize.length - (lastSummarizedIdx + 1)
  if (newMessagesSinceLast < 10) return

  // Özetlenecek metni oluştur
  const conversationText = toSummarize
    .map((m) => `${m.role === 'user' ? 'Kullanıcı' : 'Karakter'}: ${m.content}`)
    .join('\n')

  // Mevcut özet varsa "önceki özet + yeni mesajlar" olarak gönder
  const inputText = conv.runningSummary
    ? `[ÖNCEKİ ÖZET]\n${conv.runningSummary}\n\n[YENİ MESAJLAR]\n${toSummarize
        .slice(lastSummarizedIdx + 1)
        .map((m) => `${m.role === 'user' ? 'Kullanıcı' : 'Karakter'}: ${m.content}`)
        .join('\n')}\n\nGüncel tek bir özet üret.`
    : conversationText

  try {
    const res = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: SUMMARIZE_PROMPT },
        { role: 'user', content: inputText },
      ],
      temperature: 0.3,
      max_tokens: 800,
    })
    const summary = res.choices[0]?.message?.content?.trim()
    if (!summary) return

    await db.assistantConversation.update({
      where: { id: conversationId },
      data: {
        runningSummary: summary,
        summarizedThruId: toSummarize[toSummarize.length - 1].id,
        summaryUpdatedAt: new Date(),
      },
    })
  } catch (e) {
    console.warn('[summarizer] failed', e)
  }
}

export function summaryToPromptBlock(summary: string | null): string {
  if (!summary) return ''
  return `\n\n[ESKİ KONUŞMA ÖZETİ — KALICI BAĞLAM]
${summary}

ÖNEMLİ: Bu özet, konuşmanın eski kısmıdır. Burada geçen olayları, paylaşılan bilgileri, sözleri HATIRLA. Kullanıcı bunlardan birini sorduğunda "hatırlamıyorum" deme.`
}
