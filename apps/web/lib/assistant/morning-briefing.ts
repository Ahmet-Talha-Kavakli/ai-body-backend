/**
 * Sabah Briefing — kullanıcı sabah saatlerinde yeni sohbet açtığında
 * AI'nin kendi inisiyatifiyle attığı ilk mesaj.
 *
 * Tetiklenme koşulları:
 * - Saat 5:00 - 11:30 arası
 * - Son AI mesajından bu yana 6+ saat geçmiş
 *
 * Mesaj kişisel bağlama göre üretilir: uyku, randevu, hava, son konuşma.
 */

import OpenAI from 'openai'
import { db } from '@/lib/db/client'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

const BRIEFING_PROMPT = `Sen kullanıcının kişisel asistanısın — bir uygulama değil, bir arkadaş.
Kullanıcı sabah uygulamayı açtı. Ona kısa, sıcak, doğal bir "günaydın" mesajı yazacaksın.

KURALLAR:
- Robot gibi listeleme yapma. "Bugün şunlar var: 1. ... 2. ..." YASAK.
- Bir arkadaşın sabah mesajı gibi yaz — doğal, samimi, kısa (1-3 cümle).
- Eğer önemli bir veri varsa (kötü uyku, randevu, ilaç) ona değin — ama doğal şekilde.
- Yapacaklarını sıralama. Sadece bir konu seç, onu önemse.
- "Nasılsın?" soruyla bitir, ama klişe olmadan.
- Emoji yasak. İsim hitap edebilirsin ama abartma.

ÖRNEKLER (iyi):
- "Günaydın Talha. Dün biraz az uyumuşsun, 5 saat. Bugün nasıl başlamak istersin?"
- "Selam. Saat 14'te diş randevun var, hatırlatayım dedim. Sabahın nasıl?"
- "Günaydın. Dün gece geç yatmışsın, kendini nasıl hissediyorsun bu sabah?"

ÖRNEKLER (kötü, asla yazma):
- "Günaydın! İşte günün özeti: ..."
- "Bugün şunlar var: ..."
- "Merhaba, size yardımcı olmak için buradayım."

Sadece mesajı dön, JSON değil, başka açıklama değil.`

export interface BriefingContext {
  userName: string
  hour: number
  lastSleep?: { totalMinutes: number; sleepScore?: number | null; endedAt: Date }
  todayCalendarEvents?: Array<{ title: string; startsAt: Date }>
  todayMeds?: Array<{ name: string }>
  lastUserMessage?: string
  recentMood?: string
}

/**
 * Sabah saatleri & yeterli zaman geçtiyse mi kontrol et
 */
export function shouldShowBriefing(now: Date, lastMessageAt: Date | null): boolean {
  const hour = now.getHours()
  if (hour < 5 || hour >= 12) return false
  if (!lastMessageAt) return true // hiç mesaj yoksa göster
  const hoursSince = (now.getTime() - lastMessageAt.getTime()) / 3600000
  return hoursSince >= 6
}

/**
 * Briefing context'ini topla
 */
export async function loadBriefingContext(userId: string): Promise<BriefingContext | null> {
  const now = new Date()
  const todayStart = new Date(now)
  todayStart.setHours(0, 0, 0, 0)
  const todayEnd = new Date(now)
  todayEnd.setHours(23, 59, 59, 999)

  const [profile, user, lastSleep, lastUserMsg] = await Promise.all([
    db.assistantProfile.findUnique({
      where: { userId },
      select: { name: true },
    }),
    db.user.findUnique({
      where: { id: userId },
      select: { name: true },
    }),
    db.sleepSession.findFirst({
      where: { userId, status: 'completed' },
      orderBy: { endedAt: 'desc' },
      select: { totalMinutes: true, sleepScore: true, endedAt: true },
    }),
    db.assistantMessage.findFirst({
      where: {
        conversation: { userId },
        role: 'user',
      },
      orderBy: { createdAt: 'desc' },
      select: { content: true },
    }),
  ])

  const userName = profile?.name || user?.name || 'dostum'

  return {
    userName,
    hour: now.getHours(),
    lastSleep: lastSleep
      ? {
          totalMinutes: lastSleep.totalMinutes ?? 0,
          sleepScore: lastSleep.sleepScore,
          endedAt: lastSleep.endedAt!,
        }
      : undefined,
    lastUserMessage: lastUserMsg?.content?.slice(0, 200),
  }
}

/**
 * AI'dan briefing mesajı üret
 */
export async function generateBriefing(ctx: BriefingContext): Promise<string | null> {
  try {
    const contextLines: string[] = []
    contextLines.push(`Kullanıcı adı: ${ctx.userName}`)
    contextLines.push(`Şu anki saat: ${ctx.hour}:00`)

    if (ctx.lastSleep) {
      const hours = Math.round(ctx.lastSleep.totalMinutes / 60)
      const minutes = ctx.lastSleep.totalMinutes % 60
      const endedHoursAgo = Math.round((Date.now() - ctx.lastSleep.endedAt.getTime()) / 3600000)
      contextLines.push(
        `Dün uyku: ${hours} saat ${minutes} dakika (${endedHoursAgo} saat önce kalktı)`
      )
      if (ctx.lastSleep.sleepScore != null) {
        contextLines.push(`Uyku skoru: ${ctx.lastSleep.sleepScore}/100`)
      }
    } else {
      contextLines.push('Uyku verisi yok')
    }

    if (ctx.lastUserMessage) {
      contextLines.push(`Son konuştuğunuzda kullanıcı: "${ctx.lastUserMessage}"`)
    }

    const userContent = contextLines.join('\n')

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: BRIEFING_PROMPT },
        { role: 'user', content: userContent },
      ],
      temperature: 0.85,
      max_tokens: 120,
    })

    const message = completion.choices[0]?.message?.content?.trim()
    return message || null
  } catch (e) {
    console.error('[morning-briefing]', e)
    return null
  }
}
