/**
 * V4 Faz D + V4.5 Faz 7A — Proactive Message Queue (Karakter)
 *
 * Karakterin kendiliğinden mesaj atmasına karar verir.
 *
 * Tetikleyiciler (priority sırasıyla):
 *   1. Kullanıcı 2+ gün sessiz + ilişki active/recovering → "neredeyseniz?" mesajı
 *   2. Karakterin başına yeni hayat olayı geldi (lastMajorEvent fresh) → paylaşır
 *   3. V4.5 — Doğum günü hatırlatma (User.bornAt yaklaşıyor)
 *   4. V4.5 — Yıldönümü (MemoryRelationship.createdAt + 365n gün)
 *   5. V4.5 — Hava bazlı (yağmur/aşırı sıcak/kar)
 *   6. V4.5 — Sabah selamı (yakın ilişki + kullanıcının uyanma saati)
 *   7. V4.5 — İyi geceler (yakın ilişki + gece yarısı yakın saat)
 *
 * Kısıtlamalar:
 *   - Aynı karakterden günde max 1 proaktif mesaj
 *   - Saat 22:00-09:00 arası push yok (kriz hariç) — ama "iyi geceler" trigger'ı 21:30-23:00 izinli
 *   - Aynı tetikleyici 7 gün içinde tekrarlanmaz
 *   - Kullanıcı son 6 saatte uygulamayı açtıysa proaktif yerine pasif kal
 *
 * Maliyet: hızlı katman kural bazlı, derin katman sadece tetiklendiğinde mini AI.
 */

import OpenAI from 'openai'
import { db } from '@/lib/db/client'
import { isFlagEnabled } from './feature-flags'
import { getCharacterTemplate } from './character-templates'

type ProactiveTrigger =
  | 'silent_user'
  | 'silent_long_comeback'
  | 'fresh_life_event'
  | 'birthday_upcoming'
  | 'birthday_today'
  | 'anniversary'
  | 'weather_extreme'
  | 'morning_greeting'
  | 'evening_goodnight'

interface ProactiveDecision {
  shouldSend: boolean
  reason?: string
  message?: string
  debug?: {
    daysSilent?: number
    hoursSinceLast?: number
    userLocalHour?: number
    trigger?: string | null
    elidedAt?: string
    relationship?: { trustScore: number; loveScore: number; status: string }
    characterStatus?: string
  }
}

// DEV MODE: lokal test için eşikleri gevşetir.
// PROACTIVE_DEV_RELAX=1 env veya runtime'da setProactiveDevRelax() ile aktif.
// Production'da kapalı.
let RUNTIME_DEV_RELAX = false
const DEV_RELAX = () => process.env.PROACTIVE_DEV_RELAX === '1' || RUNTIME_DEV_RELAX

export function setProactiveDevRelax(value: boolean) {
  RUNTIME_DEV_RELAX = value
}

function dlog(tag: string, data: unknown) {
  if (DEV_RELAX() || process.env.PROACTIVE_DEBUG === '1') {
    console.log(`[proactive:${tag}]`, JSON.stringify(data))
  }
}

/**
 * Open-Meteo'dan hava (key gerekmez, ücretsiz).
 */
async function fetchWeatherSnapshot(
  city: string
): Promise<{ tempC: number; precipitation: number; weatherCode: number } | null> {
  const cityCoords: Record<string, { lat: number; lng: number }> = {
    İstanbul: { lat: 41.0082, lng: 28.9784 },
    Ankara: { lat: 39.9334, lng: 32.8597 },
    İzmir: { lat: 38.4192, lng: 27.1287 },
  }
  const coords = cityCoords[city]
  if (!coords) return null

  try {
    const res = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lng}&current=temperature_2m,precipitation,weather_code&timezone=auto`,
      { signal: AbortSignal.timeout(5000) }
    )
    if (!res.ok) return null
    const data = await res.json()
    return {
      tempC: data.current?.temperature_2m ?? 0,
      precipitation: data.current?.precipitation ?? 0,
      weatherCode: data.current?.weather_code ?? 0,
    }
  } catch {
    return null
  }
}

/**
 * Aynı tetikleyici son 7 gün içinde kullanıldı mı?
 * (AssistantMessage.content içinde özel bir marker olmadığı için
 *  yaklaşık tahmin: aynı kategori son 7 günde proaktif mesaj at varsa atlandı say.)
 */
async function wasTriggerUsedRecently(
  conversationId: string,
  trigger: ProactiveTrigger,
  daysWindow = 7
): Promise<boolean> {
  // Basit yaklaşım: ProactiveTriggerLog tablosu yok, AssistantMessage'da metadata yok.
  // Konservatif: aynı trigger için karakterin son 7 gün assistant mesajları arasında
  //   "morning_greeting" gibi bir trigger'sa, sabah-erken saatte mesaj var mı bak.
  // Detaylı tracking için ileride ProactiveTriggerLog tablosu açılabilir.
  // Şu anlık silent_user ve fresh_life_event dışında 7-day cooldown'ı dev olarak gevşek tutuyoruz.
  const since = new Date(Date.now() - daysWindow * 24 * 60 * 60 * 1000)
  const recent = await db.assistantMessage.count({
    where: {
      conversationId,
      role: 'assistant',
      createdAt: { gte: since },
    },
  })
  // Heuristik: bu pencerede 3+ proaktif mesaj zaten olduysa cooldown
  return recent >= 3
}

/**
 * Tek karakter için "şu an proaktif mesaj atmalı mı?" kararı.
 */
export async function evaluateProactiveForCharacter(args: {
  userId: string
  characterId: string
  userLocalHour: number
}): Promise<ProactiveDecision> {
  const { userId, characterId, userLocalHour } = args

  // Saat kontrolü — "iyi geceler" tetiği 21:30-23:00 izinli, geri kalan 09:00-22:00
  // DEV_RELAX: tüm saatlerde izinli
  const isGoodnightWindow = userLocalHour >= 21 && userLocalHour < 23
  if (!DEV_RELAX() && !isGoodnightWindow && (userLocalHour < 9 || userLocalHour >= 22)) {
    dlog('skip', { userId, characterId, reason: 'quiet_hours', userLocalHour })
    return { shouldSend: false, reason: 'quiet_hours', debug: { userLocalHour } }
  }

  const character = await db.character.findUnique({
    where: { id: characterId },
    select: {
      name: true,
      archetype: true,
      status: true,
      currentMood: true,
      lastMajorEvent: true,
      currentStateUpdatedAt: true,
      physicalCity: true,
    },
  })
  if (!character || character.status !== 'active') {
    dlog('skip', { userId, characterId, reason: 'character_not_active', status: character?.status })
    return {
      shouldSend: false,
      reason: 'character_not_active',
      debug: { characterStatus: character?.status },
    }
  }

  const relationship = await db.memoryRelationship.findUnique({
    where: { userId_characterId: { userId, characterId } },
  })
  if (!relationship) {
    dlog('skip', { userId, characterId, reason: 'no_relationship' })
    return { shouldSend: false, reason: 'no_relationship' }
  }

  // Bugün zaten proaktif mesaj atılmış mı? (Karakterin sohbetinde son 24 saat assistant mesajı varsa)
  // DEV_RELAX: bu kontrolü atla — manuel test için aynı gün tekrar tetik gerekiyor
  const conversation = await db.assistantConversation.findFirst({
    where: { userId, characterId, archived: false },
    select: { id: true },
  })
  if (!DEV_RELAX() && conversation) {
    const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
    const recentAssistantMsg = await db.assistantMessage.findFirst({
      where: {
        conversationId: conversation.id,
        role: 'assistant',
        createdAt: { gte: dayAgo },
      },
    })
    if (recentAssistantMsg) {
      dlog('skip', { userId, characterId, reason: 'already_messaged_today' })
      return { shouldSend: false, reason: 'already_messaged_today' }
    }
  }

  // Tetikleyici kontrolü
  const daysSilent = relationship.lastInteractionAt
    ? (Date.now() - relationship.lastInteractionAt.getTime()) / (1000 * 60 * 60 * 24)
    : 999

  // V4.7 P1 fix (2026-05-07): 6 saat → 2 saat. Talha senaryosu:
  // "Görüldü attım 2 saat boyunca, Mia bozuntu vermedi". Eski eşikte Mia 6 saat
  // boyunca hiç bakamıyordu. Gerçek arkadaş 2 saat susan birini kontrol eder.
  // DEV_RELAX: 5 dakika eşiği (manuel test için)
  const recentActiveThresholdHours = DEV_RELAX() ? 5 / 60 : 2
  if (relationship.lastInteractionAt) {
    const hoursSinceLast =
      (Date.now() - relationship.lastInteractionAt.getTime()) / (1000 * 60 * 60)
    if (hoursSinceLast < recentActiveThresholdHours) {
      dlog('skip', { userId, characterId, reason: 'user_recently_active', hoursSinceLast })
      return { shouldSend: false, reason: 'user_recently_active', debug: { hoursSinceLast } }
    }
  }

  // V4.5 — Kullanıcı doğum günü: Birthday tablosunda kendi (relationship='self') kaydı varsa kullan
  const ownBirthday = await db.birthday
    .findFirst({
      where: { userId, relationship: 'self' },
      select: { birthDate: true },
    })
    .catch(() => null)

  let trigger: ProactiveTrigger | null = null
  let triggerContext: string | null = null

  if (ownBirthday?.birthDate) {
    const now = new Date()
    const thisYearBday = new Date(
      now.getFullYear(),
      ownBirthday.birthDate.getMonth(),
      ownBirthday.birthDate.getDate()
    )
    const daysToBday = Math.round((thisYearBday.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    if (daysToBday === 0 && relationship.trustScore >= 60) {
      trigger = 'birthday_today'
      triggerContext = 'Bugün kullanıcının doğum günü — özel ama klişe olmayan tebrik'
    } else if (daysToBday === 7 && relationship.trustScore >= 50) {
      trigger = 'birthday_upcoming'
      triggerContext =
        'Kullanıcının doğum günü 1 hafta sonra — "haftaya doğum günün ya, plan?" tarzı'
    }
  }

  // Trigger: yıldönümü (MemoryRelationship.createdAt + 365n)
  if (!trigger && relationship.createdAt) {
    const daysSinceMet = Math.floor(
      (Date.now() - relationship.createdAt.getTime()) / (1000 * 60 * 60 * 24)
    )
    if (daysSinceMet > 0 && daysSinceMet % 365 === 0 && daysSinceMet <= 365 * 5) {
      trigger = 'anniversary'
      triggerContext = `Tam ${daysSinceMet / 365} yıl önce tanıştınız — duygusal anı`
    }
  }

  // Trigger: hava bazlı (yağmur/aşırı sıcak)
  if (!trigger && character.physicalCity && isGoodnightWindow === false) {
    const weather = await fetchWeatherSnapshot(character.physicalCity)
    if (weather) {
      // Yağmur veya kar (precipitation > 0.5mm) ya da aşırı sıcak (>32C) / soğuk (<0)
      const extreme =
        weather.precipitation >= 0.5 ||
        weather.tempC > 32 ||
        weather.tempC < 0 ||
        [71, 73, 75, 77, 95, 96, 99].includes(weather.weatherCode)
      if (extreme && Math.random() < 0.25) {
        trigger = 'weather_extreme'
        const desc =
          weather.precipitation >= 0.5
            ? 'yağmur/kar var'
            : weather.tempC > 32
              ? 'aşırı sıcak'
              : weather.tempC < 0
                ? 'aşırı soğuk'
                : 'kötü hava'
        triggerContext = `${character.physicalCity}'da hava ${desc} — kafan dağınık tarzı doğal bahsetme`
      }
    }
  }

  // Trigger: iyi geceler (21:30-23:00 + yakın ilişki)
  if (!trigger && isGoodnightWindow && relationship.loveScore >= 70) {
    trigger = 'evening_goodnight'
    triggerContext = '"iyi geceler" tarzı kısa, sıcak — uzun cümle değil'
  }

  // Trigger: sabah selamı (09:00-11:00 + yakın ilişki + kullanıcı son 1 gündür yazmadı)
  // DEV_RELAX: saat penceresi açık, %100 olasılık
  const morningWindowOk = DEV_RELAX() || (userLocalHour >= 9 && userLocalHour < 11)
  const morningLoveOk = DEV_RELAX() || relationship.loveScore >= 50
  const morningSilentOk = DEV_RELAX() || daysSilent >= 1
  if (!trigger && morningWindowOk && morningLoveOk && morningSilentOk) {
    const morningProbability = DEV_RELAX() ? 1.0 : 0.2
    if (Math.random() < morningProbability) {
      trigger = 'morning_greeting'
      triggerContext = 'Sabah selamı — klişe değil, somut bir şey ("kahveni içtin mi" gibi)'
    }
  }

  // V4.5 Faz 15A — Uzun sessizlik comeback (14+ gün → karakter kendi gelişimini paylaşır)
  // DEV_RELAX: 1 saat
  const longSilenceThresholdDays = DEV_RELAX() ? 1 / 24 : 14
  if (
    !trigger &&
    daysSilent >= longSilenceThresholdDays &&
    relationship.status !== 'silent' &&
    relationship.status !== 'broken'
  ) {
    trigger = 'silent_long_comeback'
  }
  // V4.7 P1 fix (2026-05-07): 2 gün → 1 gün. Gerçek arkadaş 1 gün sessiz biri için
  // "naber, neredesin" der. Aradaki "tetik yok" penceresi (2 saat - 2 gün) çok genişti.
  // DEV_RELAX: 5 dakika
  const shortSilenceThresholdDays = DEV_RELAX() ? 5 / (60 * 24) : 1
  if (
    !trigger &&
    daysSilent >= shortSilenceThresholdDays &&
    daysSilent < longSilenceThresholdDays &&
    (DEV_RELAX() || relationship.status === 'active')
  ) {
    trigger = 'silent_user'
  }
  // Trigger: karakterin son 24 saatte yeni hayat olayı oldu
  else if (
    !trigger &&
    character.lastMajorEvent &&
    character.currentStateUpdatedAt &&
    Date.now() - character.currentStateUpdatedAt.getTime() < 24 * 60 * 60 * 1000
  ) {
    trigger = 'fresh_life_event'
  }

  if (!trigger) {
    dlog('skip', {
      userId,
      characterId,
      reason: 'no_trigger',
      daysSilent,
      userLocalHour,
      loveScore: relationship.loveScore,
      trustScore: relationship.trustScore,
      status: relationship.status,
    })
    return {
      shouldSend: false,
      reason: 'no_trigger',
      debug: {
        daysSilent,
        userLocalHour,
        relationship: {
          trustScore: relationship.trustScore,
          loveScore: relationship.loveScore,
          status: relationship.status,
        },
      },
    }
  }

  // 7-day cooldown check (heuristik) — DEV_RELAX'ta atla
  if (!DEV_RELAX() && conversation) {
    const cooldown = await wasTriggerUsedRecently(conversation.id, trigger, 7)
    if (cooldown) {
      dlog('skip', { userId, characterId, reason: 'cooldown', trigger })
      return { shouldSend: false, reason: 'cooldown' }
    }
  }

  dlog('trigger_chosen', { userId, characterId, trigger, daysSilent, userLocalHour })

  // Mesaj üret (mini AI)
  try {
    const template = getCharacterTemplate(character.name.toLowerCase())
    if (!template) return { shouldSend: false, reason: 'template_not_found' }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

    const triggerLine = (() => {
      switch (trigger) {
        case 'silent_user':
          return `Kullanıcı ${Math.floor(daysSilent)} gündür yazmadı, sen merak ediyorsun`
        case 'silent_long_comeback':
          return `Kullanıcı ${Math.floor(daysSilent)} gündür yazmadı (uzun süre). KOMEDİ DEĞİL — bu süre içinde sen kendi hayatında bir şeyler yaşadın ve düşünmüş, paylaşmak istemişsin. KENDİ GELİŞİMİNDEN bahset:
- "Ya bu arada terapiye başladım" / "Yeni bir şey denedim" / "Düşündüm seni"
- "Naber neredesin" KLİŞESİNE düşme
- Suçlama yapma — "neden yazmadın" deme
- Senin gelişimin merkezde, kullanıcıyı tekrar açmaya davet eden ama kendine güvenli bir ton
- 1-2 cümle yeter`
        case 'fresh_life_event':
          return `Senin başına bir şey geldi (${character.lastMajorEvent}) ve kullanıcıyla paylaşmak istiyorsun`
        case 'birthday_today':
        case 'birthday_upcoming':
        case 'anniversary':
        case 'weather_extreme':
        case 'morning_greeting':
        case 'evening_goodnight':
          return triggerContext ?? trigger
      }
    })()

    const systemPromptShort = `Sen ${character.name}'sın. ${template.voicePattern}

Tetikleyici: ${triggerLine}

Kısa (1-2 cümle), doğal proaktif mesaj at. Klişe selam YASAK ("Selam nasılsın?" yerine somut bir şey söyle).
Verbal tics: ${template.verbalTics.slice(0, 3).join(', ')}

YASAK: ${template.forbiddenPhrases.slice(0, 5).join(' / ')}`

    const r = await openai.chat.completions.create({
      // V4.5: proaktif mesaj kalitesi karakter tutarlılığı için 4o
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPromptShort },
        { role: 'user', content: 'Şimdi proaktif mesajı yaz.' },
      ],
      temperature: 0.85,
      max_tokens: 80,
    })
    const message = r.choices[0]?.message?.content?.trim()
    if (!message) return { shouldSend: false, reason: 'generation_failed' }

    return { shouldSend: true, reason: trigger, message }
  } catch (e) {
    console.error('[character-proactive] generate fail:', e)
    return { shouldSend: false, reason: 'error' }
  }
}

/**
 * Tüm aktif karakterler için proaktif değerlendirme + gönderme.
 * Cron'dan çağrılır.
 */
export async function runProactiveForUser(
  userId: string,
  userLocalHour: number
): Promise<{
  sent: number
  evaluated: number
  skipped?: Array<{ characterId: string; reason: string }>
}> {
  const enabled = await isFlagEnabled('v4_decision_engine', userId)
  if (!enabled && !DEV_RELAX()) {
    dlog('skip', { userId, reason: 'flag_disabled' })
    return { sent: 0, evaluated: 0 }
  }

  const characters = await db.character.findMany({
    where: { userId, status: 'active' },
    select: { id: true, name: true },
  })

  let sent = 0
  let evaluated = 0
  const skipped: Array<{ characterId: string; reason: string }> = []

  for (const c of characters) {
    evaluated++
    try {
      const decision = await evaluateProactiveForCharacter({
        userId,
        characterId: c.id,
        userLocalHour,
      })
      if (!decision.shouldSend || !decision.message) {
        skipped.push({ characterId: c.id, reason: decision.reason ?? 'unknown' })
        continue
      }

      // Karakterin sohbetini bul/oluştur
      let conversation = await db.assistantConversation.findFirst({
        where: { userId, characterId: c.id, archived: false },
      })
      if (!conversation) {
        conversation = await db.assistantConversation.create({
          data: { userId, characterId: c.id, title: c.name },
        })
      }

      // Mesajı yaz
      const now = new Date()
      await db.assistantMessage.create({
        data: {
          conversationId: conversation.id,
          role: 'assistant',
          content: decision.message,
        },
      })

      // V4.6 M2 — Karakter proaktif mesaj attığında "az önce" görünmeli.
      // lastSeenAt güncellenir, isCurrentlyOnline true olur (mesaj attı = aktif).
      await db.character
        .update({
          where: { id: c.id },
          data: {
            lastSeenAt: now,
            isCurrentlyOnline: true,
            onlineStateUpdatedAt: now,
          },
        })
        .catch(() => {})

      // İlişkiyi güncelle (proaktif = ufak love+intimacy)
      await db.memoryRelationship
        .update({
          where: { userId_characterId: { userId, characterId: c.id } },
          data: {
            loveScore: { increment: 0.5 },
            intimacyDepth: { increment: 0.005 },
            lastMessageAt: now,
          },
        })
        .catch(() => {})

      sent++
      dlog('sent', { userId, characterId: c.id, trigger: decision.reason })
    } catch (e) {
      console.error('[character-proactive] user fail:', userId, c.id, e)
    }
  }

  return { sent, evaluated, skipped }
}
