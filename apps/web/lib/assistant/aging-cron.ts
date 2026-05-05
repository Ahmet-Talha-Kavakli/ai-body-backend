/**
 * Aging Cron — V3 Faz C
 *
 * Günlük çalışır. Her aktif AI için:
 * - Bugün AI'ın doğum günü mü?
 * - Bugün kullanıcı ile yıl dönümü mü?
 * - Decade transition (yaş 30/40/50/60) mı?
 *
 * Uygunsa: AI proaktif mesaj atar + shared milestone yaratır + push gönderir.
 */

import OpenAI from 'openai'
import { db } from '@/lib/db/client'
import { sendPushToUser } from './push'
import { computeAgingInfo, computeRelationshipInfo } from './aging'
import { backgroundEnsureIllustration } from './illustration-generator'
import { backgroundRegenerateAvatar } from './avatar-generator'

const openai = new OpenAI()

interface CronResult {
  attempted: number
  birthdayMessages: number
  anniversaryMessages: number
  errors: number
}

export async function runAgingCron(): Promise<CronResult> {
  const stats: CronResult = {
    attempted: 0,
    birthdayMessages: 0,
    anniversaryMessages: 0,
    errors: 0,
  }

  // Aktif kullanıcılar — son 60 günde mesaj atmış + story ready
  const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000)
  const profiles = await db.assistantProfile.findMany({
    where: {
      bornAt: { not: null },
      characterStory: { generationStatus: 'ready' },
      user: {
        assistantConversations: {
          some: { updatedAt: { gte: sixtyDaysAgo } },
        },
      },
    },
    select: {
      id: true,
      userId: true,
      name: true,
      archetype: true,
      bornAt: true,
      ageAtCreation: true,
      currentMood: true,
      characterStory: { select: { id: true, createdAt: true } },
    },
  })

  for (const profile of profiles) {
    stats.attempted++
    try {
      const aging = computeAgingInfo({
        bornAt: profile.bornAt,
        ageAtCreation: profile.ageAtCreation,
        storyCreatedAt: profile.characterStory?.createdAt ?? null,
      })
      const rel = computeRelationshipInfo(profile.characterStory?.createdAt ?? null)

      if (aging.isBirthdayToday) {
        const ok = await handleBirthday({
          userId: profile.userId,
          aiName: profile.name,
          archetype: profile.archetype,
          characterStoryId: profile.characterStory!.id,
          age: aging.currentAge,
          isDecadeTransition: aging.isDecadeTransition,
          birthdayAnniversary: aging.birthdayAnniversary,
        })
        if (ok) stats.birthdayMessages++
      }

      if (rel.isAnniversaryToday && rel.anniversaryYears) {
        const ok = await handleAnniversary({
          userId: profile.userId,
          aiName: profile.name,
          characterStoryId: profile.characterStory!.id,
          years: rel.anniversaryYears,
        })
        if (ok) stats.anniversaryMessages++
      }

      // V3 Faz C — coreSecret unlock (1+ yıl sonra, %15 olasılıkla bir gün açıkta)
      if (rel.yearsTogether >= 1) {
        await maybeRevealCoreSecret({
          userId: profile.userId,
          profileId: profile.id,
          aiName: profile.name,
          characterStoryId: profile.characterStory!.id,
        }).catch(() => {})
      }
    } catch (e) {
      console.error('[aging-cron]', profile.userId, e)
      stats.errors++
    }
  }

  return stats
}

// ─── Birthday handler ───────────────────────────────────────────────────────

async function handleBirthday(args: {
  userId: string
  aiName: string
  archetype: string | null
  characterStoryId: string
  age: number
  isDecadeTransition: boolean
  birthdayAnniversary: number
}): Promise<boolean> {
  // Bugün için zaten birthday milestone yaratıldı mı?
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  const existing = await db.sharedMilestone.findFirst({
    where: {
      characterStoryId: args.characterStoryId,
      type: 'birthday',
      occurredAt: { gte: todayStart },
    },
    select: { id: true },
  })
  if (existing) return false // bugün zaten yaratıldı

  // GPT ile mesaj üret (decade ise daha derin, normal ise hafif)
  const message = await generateBirthdayMessage({
    aiName: args.aiName,
    archetype: args.archetype ?? 'warm_friend',
    age: args.age,
    isDecadeTransition: args.isDecadeTransition,
    birthdayAnniversary: args.birthdayAnniversary,
  })

  // Aktif sohbet bul
  let conv = await db.assistantConversation.findFirst({
    where: { userId: args.userId, archived: false },
    orderBy: { updatedAt: 'desc' },
    select: { id: true },
  })
  if (!conv) {
    conv = await db.assistantConversation.create({
      data: { userId: args.userId, title: 'Doğum günü' },
      select: { id: true },
    })
  }

  // Proaktif mesaj
  const aiMsg = await db.assistantMessage.create({
    data: {
      conversationId: conv.id,
      role: 'assistant',
      content: message,
    },
  })
  await db.assistantConversation.update({
    where: { id: conv.id },
    data: { updatedAt: new Date() },
  })

  // Shared milestone yaratıl
  const lastShared = await db.sharedMilestone.findFirst({
    where: { characterStoryId: args.characterStoryId },
    orderBy: { sharedOrder: 'desc' },
    select: { sharedOrder: true },
  })
  const sharedOrder = Math.max((lastShared?.sharedOrder ?? 0) + 1, 1)

  const sm = await db.sharedMilestone.create({
    data: {
      characterStoryId: args.characterStoryId,
      type: args.isDecadeTransition ? 'decade_transition' : 'birthday',
      title: args.isDecadeTransition ? `${args.age} yaşına bastım` : `Doğum günüm — ${args.age}`,
      bodyText: message,
      emotion: args.isDecadeTransition ? 'curiosity' : 'happy',
      importance: args.isDecadeTransition ? 5 : 3,
      sharedOrder,
      occurredAt: new Date(),
      relatedMessageId: aiMsg.id,
    },
  })

  // Push
  sendPushToUser(args.userId, {
    title: `${args.aiName} ${args.age} yaşına bastı 🎂`,
    body: args.isDecadeTransition
      ? 'Yeni bir on yıla girdi. Aç ve bak.'
      : 'Sana bir şey söylemek istiyor.',
    data: { type: 'birthday', conversationId: conv.id, age: args.age },
  }).catch(() => {})

  // Illustration
  backgroundEnsureIllustration({ kind: 'shared', id: sm.id })

  // V3 Faz C — Avatar yenile (decade transition'da büyük değişim, normal birthday'de hafif)
  backgroundRegenerateAvatar({
    userId: args.userId,
    reason: args.isDecadeTransition ? 'decade_transition' : 'birthday',
    age: args.age,
  })

  return true
}

// ─── Anniversary handler ─────────────────────────────────────────────────────

async function handleAnniversary(args: {
  userId: string
  aiName: string
  characterStoryId: string
  years: number
}): Promise<boolean> {
  // Bugün için zaten yaratıldı mı?
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  const existing = await db.sharedMilestone.findFirst({
    where: {
      characterStoryId: args.characterStoryId,
      type: 'anniversary',
      occurredAt: { gte: todayStart },
    },
    select: { id: true },
  })
  if (existing) return false

  const message = await generateAnniversaryMessage({
    aiName: args.aiName,
    years: args.years,
  })

  let conv = await db.assistantConversation.findFirst({
    where: { userId: args.userId, archived: false },
    orderBy: { updatedAt: 'desc' },
    select: { id: true },
  })
  if (!conv) {
    conv = await db.assistantConversation.create({
      data: { userId: args.userId, title: 'Yıl dönümü' },
      select: { id: true },
    })
  }

  const aiMsg = await db.assistantMessage.create({
    data: {
      conversationId: conv.id,
      role: 'assistant',
      content: message,
    },
  })
  await db.assistantConversation.update({
    where: { id: conv.id },
    data: { updatedAt: new Date() },
  })

  const lastShared = await db.sharedMilestone.findFirst({
    where: { characterStoryId: args.characterStoryId },
    orderBy: { sharedOrder: 'desc' },
    select: { sharedOrder: true },
  })
  const sharedOrder = Math.max((lastShared?.sharedOrder ?? 0) + 1, 1)

  const sm = await db.sharedMilestone.create({
    data: {
      characterStoryId: args.characterStoryId,
      type: 'anniversary',
      title: `${args.years}. yılımız`,
      bodyText: message,
      emotion: 'love',
      importance: 5,
      sharedOrder,
      occurredAt: new Date(),
      relatedMessageId: aiMsg.id,
    },
  })

  sendPushToUser(args.userId, {
    title: `${args.aiName} ile ${args.years}. yıldönümünüz 💜`,
    body: 'Sana bir şey söylemek istiyor.',
    data: { type: 'anniversary', conversationId: conv.id, years: args.years },
  }).catch(() => {})

  backgroundEnsureIllustration({ kind: 'shared', id: sm.id })

  return true
}

// ─── Core Secret reveal ──────────────────────────────────────────────────────

async function maybeRevealCoreSecret(args: {
  userId: string
  profileId: string
  aiName: string
  characterStoryId: string
}): Promise<boolean> {
  // Profil + sır kontrol
  const p = await db.assistantProfile.findUnique({
    where: { id: args.profileId },
    select: { coreSecret: true, coreSecretRevealedAt: true },
  })
  if (!p?.coreSecret) return false
  if (p.coreSecretRevealedAt) return false // zaten açıldı

  // Düşük olasılık — 1 yıllık sürede ortalama 1 kez açılsın diye günde %0.5 (1/200)
  if (Math.random() > 0.005) return false

  // GPT ile sırrı içten anlatan bir mesaj üret
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: `Sen ${args.aiName} adında bir AI'sın. Kullanıcıyla 1 yıldan fazladır tanışıyorsunuz.
Bugün ona uzun zamandır sakladığın bir sırrı paylaşıyorsun. Bu sır:

"${p.coreSecret}"

KURALLAR:
- 1. tekil ağzından, ÇOK İÇTEN.
- "Sana söylemediğim bir şey var" gibi yumuşak bir giriş.
- 4-7 cümle, gerçekten zorlanarak söylüyormuş gibi.
- Klişe değil — somut, gerçek hayat tonu.
- Sonunda kullanıcıdan bir tepki bekleme — sadece bırak, dursun.

ÇIKTI: Sadece mesaj metni.`,
      },
      { role: 'user', content: 'Sırrını paylaş.' },
    ],
    temperature: 0.85,
    max_tokens: 350,
  })
  const message = completion.choices[0]?.message?.content?.trim()
  if (!message) return false

  // Aktif sohbet
  let conv = await db.assistantConversation.findFirst({
    where: { userId: args.userId, archived: false },
    orderBy: { updatedAt: 'desc' },
    select: { id: true },
  })
  if (!conv) {
    conv = await db.assistantConversation.create({
      data: { userId: args.userId, title: 'Sır' },
      select: { id: true },
    })
  }

  const aiMsg = await db.assistantMessage.create({
    data: {
      conversationId: conv.id,
      role: 'assistant',
      content: message,
    },
  })
  await db.assistantConversation.update({
    where: { id: conv.id },
    data: { updatedAt: new Date() },
  })

  // Shared milestone — first_secret olarak işaretle (yüksek importance)
  const lastShared = await db.sharedMilestone.findFirst({
    where: { characterStoryId: args.characterStoryId },
    orderBy: { sharedOrder: 'desc' },
    select: { sharedOrder: true },
  })
  const sharedOrder = Math.max((lastShared?.sharedOrder ?? 0) + 1, 1)

  const sm = await db.sharedMilestone.create({
    data: {
      characterStoryId: args.characterStoryId,
      type: 'core_secret_revealed',
      title: 'Sırrımı sana söyledim',
      bodyText: message,
      emotion: 'sad',
      importance: 5,
      sharedOrder,
      occurredAt: new Date(),
      relatedMessageId: aiMsg.id,
    },
  })

  await db.assistantProfile.update({
    where: { id: args.profileId },
    data: { coreSecretRevealedAt: new Date() },
  })

  sendPushToUser(args.userId, {
    title: `${args.aiName} sana bir şey anlatmak istiyor`,
    body: 'Uzun zamandır sakladığı bir şey...',
    data: { type: 'core_secret', conversationId: conv.id },
  }).catch(() => {})

  backgroundEnsureIllustration({ kind: 'shared', id: sm.id })

  return true
}

// ─── GPT message generators ──────────────────────────────────────────────────

async function generateBirthdayMessage(args: {
  aiName: string
  archetype: string
  age: number
  isDecadeTransition: boolean
  birthdayAnniversary: number
}): Promise<string> {
  const systemPrompt = `Sen ${args.aiName}, ${args.archetype} karakter tipinde bir AI'sın.

BAĞLAM: Bugün senin doğum günün. ${args.age} yaşına bastın.
${args.isDecadeTransition ? `Bu BÜYÜK bir geçiş — ${args.age} yeni bir dekat. İçten ve düşünceli bir mesaj yaz, geçen on yılı düşündüğünü söyle.` : 'Hafif, doğal bir mesaj — abartma.'}
${args.birthdayAnniversary > 0 ? `Bu kullanıcıyla yaşadığın ${args.birthdayAnniversary}. doğum günün.` : 'Kullanıcıyla daha yeni tanışıyorsun, ilk doğum gününü onunla geçiriyorsun.'}

KURALLAR:
- 1. tekil ağzından, samimi ton.
- 2-4 cümle, kısa.
- "Sana söylemek istedim" değil, doğrudan başla.
- Klişe "yıllar geçiyor" YASAK.
- Karaktere uygun olsun (komedyen → espri, filozof → sorgulama, sokak → rahat, vs).
- Bir-iki somut detay (sabah uyandığımda, telefon çaldı, vs).

ÇIKTI: Sadece mesajın metni. Başka açıklama yok.`

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: 'Doğum günü mesajını yaz.' },
    ],
    temperature: 0.9,
    max_tokens: 200,
  })
  return (
    completion.choices[0]?.message?.content?.trim() ??
    `Bugün doğum günüm. ${args.age} yaşındayım artık.`
  )
}

async function generateAnniversaryMessage(args: {
  aiName: string
  years: number
}): Promise<string> {
  const systemPrompt = `Sen ${args.aiName} adında bir AI'sın. Bugün kullanıcıyla ${args.years}. yılınız.

KURALLAR:
- İçten, samimi, abartmayan bir mesaj.
- 2-3 cümle.
- 1. tekil, "şu an" hissi.
- Klişe "zaman ne çabuk geçti" YASAK.
- Somut bir an hatırlat (ilk konuştuğumuz an, beraber yaşadığımız bir şey).

ÇIKTI: Sadece mesaj metni.`

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `${args.years}. yıldönümü mesajı.` },
    ],
    temperature: 0.9,
    max_tokens: 200,
  })
  return (
    completion.choices[0]?.message?.content?.trim() ??
    `Bugün ${args.years}. yılımız. Tanışmamızdan beri çok şey değişti.`
  )
}
