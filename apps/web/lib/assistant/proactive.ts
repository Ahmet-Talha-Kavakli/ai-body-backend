/**
 * Proactive AI — kullanıcıya kendi inisiyatifiyle mesaj atma motoru.
 * Cron job tarafından çağırılır (her saat / sabah / akşam).
 *
 * Akış:
 * 1. Kullanıcının verisini çek (uyku, su, aktivite, mood, hatırlatıcılar)
 * 2. AI'ya "şu an mesaj atmaya değer mi?" sor (gpt-4o-mini)
 * 3. Atılırsa: kısa AI mesajı üret, conversation oluştur veya en son'a ekle, push notif gönder
 */

import OpenAI from 'openai'
import { db } from '@/lib/db/client'
import { sendPushToUser } from './push'

const SYSTEM_PROMPT = `Sen bir wellness asistanısın. Kullanıcıya proactive (kendi inisiyatifle) mesaj atmak için karar veriyorsun.

Kuralları:
- Bunaltmayacaksın. Günde en fazla 1-2 mesaj.
- Sıkça atma — sadece GERÇEKTEN değerli bir şey varsa.
- Aşağıdaki tetikleyicilere bak:
  • Saat 22:00+ ve uyku oturumu başlatılmamış → yatma hatırlatıcısı
  • 3 gün üst üste su hedefini tutturamadı
  • Bir hafta önce verilen söz var, hatırlatma zamanı
  • İlaç saati geçti, alınmamış
  • Streak kırılmaya yakın
  • Kişiyle ilgili: "babanın ameliyatı yarın" gibi fact varsa
- Genel "merhaba nasılsın" türü değer vermez, atma.

Eğer mesaj atmak istemiyorsan:
{"action": "skip", "reason": "..."}

Mesaj atmak istiyorsan:
{"action": "send", "message": "kısa, sıcak, doğal bir mesaj (1-2 cümle)", "category": "sleep | water | medication | promise | event | health"}

Sadece JSON dön.`

export interface ProactiveDecision {
  action: 'skip' | 'send'
  reason?: string
  message?: string
  category?: string
}

/**
 * Kullanıcı için proactive karar üret.
 */
export async function decideProactive(userId: string): Promise<ProactiveDecision> {
  try {
    const now = new Date()
    const todayStart = new Date(now)
    todayStart.setHours(0, 0, 0, 0)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const [
      profile,
      activeSleep,
      lastSleep,
      waterToday,
      waterSettings,
      pendingReminders,
      promiseFacts,
      todayMeds,
      recentEvents,
      lastProactive,
    ] = await Promise.all([
      db.assistantProfile.findUnique({
        where: { userId },
        select: { name: true, formality: true, supportStyle: true },
      }),
      db.sleepSession.findFirst({
        where: { userId, status: 'active' },
        select: { id: true },
      }),
      db.sleepSession.findFirst({
        where: { userId, status: 'completed' },
        orderBy: { endedAt: 'desc' },
        select: { totalMinutes: true, sleepScore: true, endedAt: true },
      }),
      db.waterLog
        .findUnique({
          where: { userId_date: { userId, date: todayStart } },
          select: { amountMl: true },
        })
        .catch(() => null),
      db.waterSettings.findUnique({ where: { userId } }),
      db.assistantReminder.findMany({
        where: {
          userId,
          triggered: false,
          scheduledFor: { lte: new Date(now.getTime() + 60 * 60 * 1000) }, // 1 saat içinde
        },
        select: { id: true, text: true, scheduledFor: true },
      }),
      db.assistantMemoryFact.findMany({
        where: { userId, category: 'promise', archived: false },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: { content: true, createdAt: true },
      }),
      db.medication.findMany({
        where: { userId, OR: [{ endDate: null }, { endDate: { gte: now } }] },
        select: { id: true, name: true, scheduleTimes: true, scheduleDays: true },
      }),
      db.lifeEvent.findMany({
        where: {
          userId,
          date: { gte: now, lte: new Date(now.getTime() + 24 * 60 * 60 * 1000) },
        },
        select: { type: true, title: true, date: true, person: { select: { name: true } } },
      }),
      // Son proaktif mesajı bul (son 6 saatte göndermişsek tekrar atma)
      db.assistantMessage.findFirst({
        where: {
          conversation: { userId },
          role: 'assistant',
          toolCalls: { not: undefined },
          createdAt: { gte: new Date(now.getTime() - 6 * 60 * 60 * 1000) },
        },
        orderBy: { createdAt: 'desc' },
      }),
    ])

    if (!profile) return { action: 'skip', reason: 'no_profile' }

    // Bağlam toplama — AI'ya verilecek
    const contextLines: string[] = []
    contextLines.push(`Şimdi: ${now.toLocaleString('tr-TR')}`)
    contextLines.push(`Asistan adı: ${profile.name}`)
    contextLines.push(`Saat: ${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}`)

    if (activeSleep) {
      contextLines.push('Aktif uyku oturumu var (kullanıcı zaten uyuyor).')
    }
    if (lastSleep) {
      contextLines.push(
        `Son tamamlanan uyku: ${lastSleep.totalMinutes ? (lastSleep.totalMinutes / 60).toFixed(1) + 'h' : 'bilinmiyor'} • Skor ${lastSleep.sleepScore}`
      )
    }
    contextLines.push(
      `Bugün su: ${waterToday?.amountMl ?? 0} ml / hedef ${waterSettings?.dailyGoalMl ?? 2500} ml`
    )
    if (pendingReminders.length > 0) {
      contextLines.push(
        `Yaklaşan hatırlatıcılar: ${pendingReminders.map((r) => r.text).join(' | ')}`
      )
    }
    if (promiseFacts.length > 0) {
      contextLines.push(`Eski sözler: ${promiseFacts.map((f) => f.content).join(' | ')}`)
    }
    if (recentEvents.length > 0) {
      contextLines.push(
        `Yakın olaylar: ${recentEvents.map((e) => `${e.title}${e.person ? ' (' + e.person.name + ')' : ''}`).join(' | ')}`
      )
    }

    const todayDow = ((now.getDay() + 6) % 7) + 1
    const todayTimeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
    const overdueMeds = todayMeds.filter((m) => {
      const isToday = m.scheduleDays.length === 0 || m.scheduleDays.includes(todayDow)
      if (!isToday) return false
      return m.scheduleTimes.some((t) => t < todayTimeStr)
    })
    if (overdueMeds.length > 0) {
      contextLines.push(`Geçen ilaç saatleri var: ${overdueMeds.map((m) => m.name).join(', ')}`)
    }

    if (lastProactive) {
      contextLines.push('Son 6 saatte zaten bir mesaj attın — atma.')
    }

    const openai = new OpenAI()
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      max_tokens: 200,
      temperature: 0.6,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: contextLines.join('\n') },
      ],
    })

    const raw = completion.choices[0]?.message?.content?.trim() ?? '{}'
    const parsed = JSON.parse(raw) as ProactiveDecision
    return parsed
  } catch (e) {
    console.error('[proactive/decide]', e)
    return { action: 'skip', reason: 'error' }
  }
}

/**
 * Karar 'send' ise: yeni veya en son conversation'a mesaj ekle, bildirim gönder.
 */
export async function executeProactive(
  userId: string,
  decision: ProactiveDecision
): Promise<{
  ok: boolean
  conversationId?: string
  messageId?: string
}> {
  if (decision.action !== 'send' || !decision.message) return { ok: false }

  try {
    // En son aktif conversation'ı bul, yoksa yenisini oluştur
    let conv = await db.assistantConversation.findFirst({
      where: { userId, archived: false },
      orderBy: { updatedAt: 'desc' },
      select: { id: true },
    })
    if (!conv) {
      conv = await db.assistantConversation.create({
        data: { userId, title: 'Asistan' },
        select: { id: true },
      })
    }

    const aiMessage = await db.assistantMessage.create({
      data: {
        conversationId: conv.id,
        role: 'assistant',
        content: decision.message,
        toolCalls: [
          {
            id: 'proactive',
            name: '_proactive',
            args: { category: decision.category },
            result: { ok: true },
          },
        ] as Parameters<typeof db.assistantMessage.create>[0]['data']['toolCalls'],
      },
    })

    await db.assistantConversation.update({
      where: { id: conv.id },
      data: { updatedAt: new Date() },
    })

    // Push notification gönder
    const profile = await db.assistantProfile.findUnique({
      where: { userId },
      select: { name: true },
    })
    const assistantName = profile?.name ?? 'Asistan'
    sendPushToUser(userId, {
      title: assistantName,
      body: decision.message,
      data: { conversationId: conv.id, messageId: aiMessage.id, type: 'proactive' },
    }).catch(() => {})

    return { ok: true, conversationId: conv.id, messageId: aiMessage.id }
  } catch (e) {
    console.error('[proactive/execute]', e)
    return { ok: false }
  }
}
