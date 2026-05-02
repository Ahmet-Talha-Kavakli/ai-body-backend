/**
 * Hierarchical Memory Compression — V3 Faz A
 *
 * 4 seviyeli özet sistemi:
 * - Level 1 (mini): her 20 mesaj
 * - Level 2 (haftalık): her 5 Level 1
 * - Level 3 (aylık): her 4 Level 2
 * - Level 4 (yıllık): her 12 Level 3
 *
 * Modeller:
 * - Level 1, 2: gpt-4o-mini (ucuz, sık tetiklenir)
 * - Level 3, 4: gpt-4o (kalite kritik, nadir tetiklenir)
 *
 * Tetiklenme:
 * - Level 1: stream endpoint'in mesaj sonrasında tetiklenir
 * - Level 2-4: günde 1 kez cron ile rollup yapılır (daily-summary-rollup.ts)
 */

import OpenAI from 'openai'
import { db } from '@/lib/db/client'

const MESSAGES_PER_LEVEL_1 = 20
const LEVEL_1_PER_LEVEL_2 = 5
const LEVEL_2_PER_LEVEL_3 = 4
const LEVEL_3_PER_LEVEL_4 = 12

const EMBED_MODEL = 'text-embedding-3-small'

// ─── Level 1 (mini) ────────────────────────────────────────────────────────────

const LEVEL_1_PROMPT = `Sen kullanıcı + AI asistan arasındaki bir sohbeti özetliyorsun.

Görev: Verilen 20 mesajı 4-6 cümlelik bir özete dönüştür.

KURALLAR:
- Kullanıcının paylaştığı önemli olayları, duyguları, kararları yakala
- AI'nın verdiği önemli yanıtları/önerileri kaydet
- "Bugün şunu yedi" gibi geçici bilgileri ATLA, "vegan oldu" gibi kalıcıları kaydet
- 3. tekil ağzından yaz: "Talha annesinin hasta olduğunu paylaştı"
- Tarih/zaman bilgisini koru
- Maksimum 6 cümle, 500 karakter
- Sadece özeti dön, başka açıklama yapma`

/**
 * Bir conversation'da yeni 20 mesaj birikti mi kontrol et, biriktiyse Level 1 üret.
 * Stream endpoint'inden background olarak çağrılır.
 */
export async function maybeCreateLevel1Summary(
  userId: string,
  conversationId: string
): Promise<void> {
  try {
    const conv = await db.assistantConversation.findUnique({
      where: { id: conversationId },
      select: {
        lastSummarizedMessageId: true,
        level1SummaryCount: true,
      },
    })
    if (!conv) return

    // Son özetlenen mesajdan sonraki tüm mesajları al
    const newMessages = await db.assistantMessage.findMany({
      where: {
        conversationId,
        ...(conv.lastSummarizedMessageId
          ? {
              createdAt: {
                gt: (
                  await db.assistantMessage.findUnique({
                    where: { id: conv.lastSummarizedMessageId },
                    select: { createdAt: true },
                  })
                )?.createdAt,
              },
            }
          : {}),
      },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        role: true,
        content: true,
        createdAt: true,
      },
    })

    if (newMessages.length < MESSAGES_PER_LEVEL_1) return

    // İlk 20 mesajı al
    const batch = newMessages.slice(0, MESSAGES_PER_LEVEL_1)
    const lastMessageInBatch = batch[batch.length - 1]!

    // Mesajları metin formatına dönüştür
    const conversationText = batch
      .filter((m) => m.role === 'user' || m.role === 'assistant')
      .map((m) => `${m.role === 'user' ? 'KULLANICI' : 'AI'}: ${m.content.slice(0, 500)}`)
      .join('\n\n')

    // gpt-4o-mini ile özet üret
    const openai = new OpenAI()
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      max_tokens: 200,
      temperature: 0.3,
      messages: [
        { role: 'system', content: LEVEL_1_PROMPT },
        { role: 'user', content: conversationText },
      ],
    })

    const content = completion.choices[0]?.message?.content?.trim()
    if (!content) return

    // DB'ye kaydet
    const summary = await db.conversationSummary.create({
      data: {
        userId,
        conversationId,
        level: 1,
        content,
        coversFromDate: batch[0]!.createdAt,
        coversToDate: lastMessageInBatch.createdAt,
        messageCount: batch.length,
      },
    })

    // Conversation state'i güncelle
    await db.assistantConversation.update({
      where: { id: conversationId },
      data: {
        lastSummarizedMessageId: lastMessageInBatch.id,
        level1SummaryCount: { increment: 1 },
      },
    })

    // Embedding (background)
    embedSummary(summary.id, content).catch(() => {})
  } catch (e) {
    console.error('[summary/level1]', e)
  }
}

// ─── Level 2 (haftalık) ────────────────────────────────────────────────────────

const LEVEL_2_PROMPT = `Sen 1 haftalık konuşma özetlerini tematik bir genel özete dönüştürüyorsun.

Görev: 5 mini özeti tek bir tematik haftalık özete birleştir.

KURALLAR:
- Haftanın genel temasını yakala (üzgün hafta? yoğun? sakin? başarılı?)
- En önemli 2-3 olayı vurgula
- Kullanıcının duygusal trajektorisini göster (haftaya nasıl başladı, nasıl bitirdi)
- Tekrar eden örüntüleri yakala (her gün uyumakta zorlandı, sürekli annesinden bahsetti, vb)
- 3. tekil ağzından yaz
- Maksimum 8 cümle, 800 karakter
- Sadece özeti dön`

const LEVEL_3_PROMPT = `Sen 1 aylık konuşma özetlerini birleştirip ay genelinin hikayesini çıkarıyorsun.

Görev: 4 haftalık özeti birleştir, ay genelinin temasını ve dönüm noktalarını göster.

KURALLAR:
- Ayın genel hikayesini anlat (zor mu, dönüştürücü mü, sakin mi?)
- Davranış değişimlerini göster (alışkanlık kazandı, bıraktı, mücadele etti)
- Önemli yaşam olaylarını listele
- Kişilik gelişimi/değişimini yakala
- 3. tekil ağzından yaz
- Maksimum 10 cümle, 1200 karakter
- Sadece özeti dön`

const LEVEL_4_PROMPT = `Sen 1 yıllık konuşma özetlerini birleştirip yılın hikayesini çıkarıyorsun.

Görev: 12 aylık özeti yılın genel hikayesine dönüştür.

KURALLAR:
- Yılın hikayesini anlat — dönüm noktaları, büyük olaylar
- Yıl içindeki kişilik değişimlerini yakala
- Yılın başlangıcı vs sonu — nasıl değişti?
- Yaşam olayları kronolojik
- 3. tekil ağzından yaz
- Maksimum 15 cümle, 1500 karakter
- Sadece özeti dön`

/**
 * Üst seviye özet üret (2, 3, 4).
 * Cron job (daily-summary-rollup.ts) tarafından tetiklenir.
 */
export async function createUpperLevelSummary(userId: string, level: 2 | 3 | 4): Promise<boolean> {
  try {
    const childLevel = level - 1
    const requiredCount =
      level === 2 ? LEVEL_1_PER_LEVEL_2 : level === 3 ? LEVEL_2_PER_LEVEL_3 : LEVEL_3_PER_LEVEL_4

    // Henüz parent'ı olmayan child seviye özetleri çek (en eski tarihten itibaren)
    const orphanChildren = await db.conversationSummary.findMany({
      where: {
        userId,
        level: childLevel,
        parentSummaryId: null,
      },
      orderBy: { coversToDate: 'asc' },
      take: requiredCount,
    })

    if (orphanChildren.length < requiredCount) return false

    // Çocuk özetleri tek metne birleştir
    const childrenText = orphanChildren
      .map(
        (c, i) =>
          `[Özet ${i + 1} - ${c.coversFromDate.toISOString().slice(0, 10)} → ${c.coversToDate.toISOString().slice(0, 10)}]\n${c.content}`
      )
      .join('\n\n')

    const prompt = level === 2 ? LEVEL_2_PROMPT : level === 3 ? LEVEL_3_PROMPT : LEVEL_4_PROMPT
    const model = level >= 3 ? 'gpt-4o' : 'gpt-4o-mini'
    const maxTokens = level === 2 ? 300 : level === 3 ? 500 : 700

    const openai = new OpenAI()
    const completion = await openai.chat.completions.create({
      model,
      max_tokens: maxTokens,
      temperature: 0.3,
      messages: [
        { role: 'system', content: prompt },
        { role: 'user', content: childrenText },
      ],
    })

    const content = completion.choices[0]?.message?.content?.trim()
    if (!content) return false

    const coversFromDate = orphanChildren[0]!.coversFromDate
    const coversToDate = orphanChildren[orphanChildren.length - 1]!.coversToDate

    // Üst seviye özeti oluştur
    const newSummary = await db.conversationSummary.create({
      data: {
        userId,
        level,
        content,
        coversFromDate,
        coversToDate,
        childSummaryCount: orphanChildren.length,
      },
    })

    // Çocukları parent'a bağla
    await db.conversationSummary.updateMany({
      where: { id: { in: orphanChildren.map((c) => c.id) } },
      data: { parentSummaryId: newSummary.id },
    })

    // Embedding (background)
    embedSummary(newSummary.id, content).catch(() => {})

    return true
  } catch (e) {
    console.error(`[summary/level${level}]`, e)
    return false
  }
}

// ─── Embedding ────────────────────────────────────────────────────────────────

async function embedSummary(summaryId: string, content: string): Promise<void> {
  try {
    const openai = new OpenAI()
    const res = await openai.embeddings.create({
      model: EMBED_MODEL,
      input: content.slice(0, 8000),
    })
    const vector = res.data[0]?.embedding
    if (!vector) return
    const literal = '[' + vector.join(',') + ']'
    await db.$executeRawUnsafe(
      `UPDATE "ConversationSummary" SET embedding = $1::vector WHERE id = $2`,
      literal,
      summaryId
    )
  } catch (e) {
    console.error('[summary/embed]', e)
  }
}

// ─── Context loader ────────────────────────────────────────────────────────────

/**
 * AI sistem prompt'una eklenecek geçmiş özetleri yükle.
 * Token-verimli: yıllık/aylık/haftalık/mini hiyerarşisi içinde son N kadarını döner.
 */
export async function loadSummaryContext(userId: string): Promise<{
  yearlies: Array<{ content: string; coversFromDate: Date; coversToDate: Date }>
  monthlies: Array<{ content: string; coversFromDate: Date; coversToDate: Date }>
  weeklies: Array<{ content: string; coversFromDate: Date; coversToDate: Date }>
  recentMinis: Array<{ content: string; coversFromDate: Date; coversToDate: Date }>
}> {
  const [yearlies, monthlies, weeklies, minis] = await Promise.all([
    db.conversationSummary.findMany({
      where: { userId, level: 4 },
      orderBy: { coversToDate: 'desc' },
      take: 10,
      select: { content: true, coversFromDate: true, coversToDate: true },
    }),
    db.conversationSummary.findMany({
      where: { userId, level: 3 },
      orderBy: { coversToDate: 'desc' },
      take: 12, // son 12 ay
      select: { content: true, coversFromDate: true, coversToDate: true },
    }),
    db.conversationSummary.findMany({
      where: { userId, level: 2 },
      orderBy: { coversToDate: 'desc' },
      take: 4, // son 4 hafta
      select: { content: true, coversFromDate: true, coversToDate: true },
    }),
    db.conversationSummary.findMany({
      // Sadece henüz parent'a bağlanmamış (yani mevcut hafta) Level 1'leri
      where: { userId, level: 1, parentSummaryId: null },
      orderBy: { coversToDate: 'desc' },
      take: 5,
      select: { content: true, coversFromDate: true, coversToDate: true },
    }),
  ])

  return {
    yearlies: yearlies.reverse(), // eskiden yeniye
    monthlies: monthlies.reverse(),
    weeklies: weeklies.reverse(),
    recentMinis: minis.reverse(),
  }
}

/**
 * Yüklenen özetleri AI sistem prompt'una eklenecek formata dönüştür.
 */
export function formatSummaryContextForPrompt(ctx: {
  yearlies: Array<{ content: string; coversFromDate: Date; coversToDate: Date }>
  monthlies: Array<{ content: string; coversFromDate: Date; coversToDate: Date }>
  weeklies: Array<{ content: string; coversFromDate: Date; coversToDate: Date }>
  recentMinis: Array<{ content: string; coversFromDate: Date; coversToDate: Date }>
}): string {
  const sections: string[] = []

  if (ctx.yearlies.length > 0) {
    sections.push(
      `[GEÇMİŞ YILLAR]\n${ctx.yearlies
        .map((y) => `${y.coversFromDate.getFullYear()}: ${y.content}`)
        .join('\n\n')}`
    )
  }

  if (ctx.monthlies.length > 0) {
    sections.push(
      `[SON AYLAR]\n${ctx.monthlies
        .map((m) => {
          const monthName = m.coversFromDate.toLocaleDateString('tr-TR', {
            year: 'numeric',
            month: 'long',
          })
          return `${monthName}: ${m.content}`
        })
        .join('\n\n')}`
    )
  }

  if (ctx.weeklies.length > 0) {
    sections.push(
      `[SON HAFTALAR]\n${ctx.weeklies
        .map((w, i) => {
          const weekLabel = `${w.coversFromDate.toLocaleDateString('tr-TR', { day: '2-digit', month: 'short' })} – ${w.coversToDate.toLocaleDateString('tr-TR', { day: '2-digit', month: 'short' })}`
          return `Hafta ${i + 1} (${weekLabel}): ${w.content}`
        })
        .join('\n\n')}`
    )
  }

  if (ctx.recentMinis.length > 0) {
    sections.push(
      `[SON MİNİ ÖZETLER]\n${ctx.recentMinis
        .map((m, i) => `Mini ${i + 1}: ${m.content}`)
        .join('\n\n')}`
    )
  }

  if (sections.length === 0) return ''
  return `\n\n[KONUŞMA GEÇMİŞİ ÖZETLERİ]\n${sections.join('\n\n')}\n[/KONUŞMA GEÇMİŞİ ÖZETLERİ]\n`
}
