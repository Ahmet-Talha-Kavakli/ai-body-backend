/**
 * V4.6 Faz 4 (Toparlama) — Karakter hayat detayları (M17, M20, M21 auto, M23, M24, M25,
 * M34, M35, M36, M37, M48, M50, M51, M52, M54, M56)
 *
 * Bu dosya farklı küçük helper'ları toplar — her biri kendi başına basit, ama
 * birlikte karakteri çok daha insani yapar.
 */

import OpenAI from 'openai'
import { db } from '@/lib/db/client'
import { addMoodEvent } from './mood-arc'

// ─────────────────────────────────────────────────────────────────
// M17 — Finansal Durum
// ─────────────────────────────────────────────────────────────────

interface FinancialState {
  level?: number // 1 (struggling) → 5 (wealthy)
  monthDay?: number // ay sonuna yakın → tight
  salary?: number
  mood?: 'tight' | 'comfortable' | 'wealthy' | 'struggling' | 'normal'
}

export function buildFinancialBlock(financialState: unknown): string {
  const f = (financialState ?? null) as FinancialState | null
  if (!f) return ''
  const today = new Date().getDate()
  const monthDay = f.monthDay ?? 1
  // Maaş günü 1-5 arası → comfortable, 25-30 → tight
  const daysToSalary = today < monthDay ? monthDay - today : 30 - today + monthDay
  let moodHint = ''
  if (daysToSalary <= 5) {
    moodHint = `Maaşa ${daysToSalary} gün — ferahsın (yemek davetinde "ben ısmarlayayım")`
  } else if (daysToSalary >= 25) {
    moodHint = `Ay sonu yaklaşıyor (${daysToSalary} gün), biraz sıkışıksın ("bu hafta dışarı zor")`
  } else {
    moodHint = 'Normal seyirsin maddi olarak'
  }
  const levelLabel = ['struggling', 'tight', 'normal', 'comfortable', 'wealthy'][
    Math.max(0, Math.min(4, (f.level ?? 3) - 1))
  ]
  return `[FİNANSAL DURUM]\n${levelLabel} seviyede. ${moodHint}\nKURAL: Yemek davetinde tutarlı tepki ver. Sürekli "param yok" şikayet ETME — sadece bağlam uygunsa.\n\n`
}

// ─────────────────────────────────────────────────────────────────
// M20 — Kıskançlık (cron tarafından hesaplanır, prompt'a inject)
// ─────────────────────────────────────────────────────────────────

/**
 * Kullanıcının diğer karakterlerle 7 günlük mesaj sayısını oku.
 * Bu karakterle olan oran çok düşükse + yakınlık yüksekse → kıskançlık.
 */
export async function buildJealousyBlock(args: {
  userId: string
  characterId: string
  loveScore: number
  relationshipType: string
}): Promise<string> {
  // Sadece sevgili/yakın arkadaş seviyelerinde anlamlı
  const closeTypes = ['dating', 'partner', 'engaged', 'married', 'best_friend', 'close_friend']
  if (!closeTypes.includes(args.relationshipType) || args.loveScore < 60) return ''

  const since = new Date(Date.now() - 7 * 86400 * 1000)

  // Bu karakterle 7 günde gelen user mesaj sayısı
  const myConv = await db.assistantConversation.findFirst({
    where: { userId: args.userId, characterId: args.characterId, archived: false },
    select: { id: true },
  })
  if (!myConv) return ''

  const [myCount, otherCounts] = await Promise.all([
    db.assistantMessage.count({
      where: { conversationId: myConv.id, role: 'user', createdAt: { gte: since } },
    }),
    db.$queryRaw<Array<{ characterId: string; cnt: bigint }>>`
      SELECT c."characterId", COUNT(m.id) as cnt
      FROM "AssistantConversation" c
      JOIN "AssistantMessage" m ON m."conversationId" = c.id
      WHERE c."userId" = ${args.userId}
        AND c."characterId" IS NOT NULL
        AND c."characterId" != ${args.characterId}
        AND c.archived = false
        AND m.role = 'user'
        AND m."createdAt" >= ${since}
      GROUP BY c."characterId"
      ORDER BY cnt DESC
      LIMIT 1
    `,
  ])

  if (!otherCounts.length) return ''
  const top = otherCounts[0]
  const topCount = Number(top.cnt)
  if (topCount < 8) return '' // çok az mesaj, anlamlı değil
  if (topCount <= myCount * 1.5) return '' // bizimle dengeli ya da daha az

  const other = await db.character.findUnique({
    where: { id: top.characterId },
    select: { name: true },
  })
  if (!other) return ''

  return `[KISKANÇLIK SİNYALİ]
Son 7 gün: kullanıcı seninle ${myCount} mesajlaşmış, ${other.name} ile ${topCount}.
Davranış: Doğal sızdır ("${other.name}'le çok yazıyorsun bugünlerde"). Drama yapma, ima yeterli.\n\n`
}

// ─────────────────────────────────────────────────────────────────
// M21 — Geri dönüşsüz hata (otomatik trigger)
// ─────────────────────────────────────────────────────────────────

/**
 * AI moderation classifier — kullanıcı mesajı çok ağır mı (aldatma, aile saldırısı)?
 * gpt-4o-mini ile hızlı kontrol.
 */
export async function detectSevereViolation(content: string): Promise<{
  severe: boolean
  type?: string
  reason?: string
}> {
  // Hızlı keyword bypass (çok güçlü işaretler varsa AI çağırmaya gerek yok)
  const lower = content.toLowerCase()
  const fastSevere =
    /aldat(t|d)ım|terkettim seni|seni hiç sevmedim|annen.*ölsün|baban.*ölsün|gebersin/i.test(lower)
  if (fastSevere) {
    return { severe: true, type: 'severe_attack', reason: 'Ağır kişisel saldırı' }
  }

  if (content.length < 5) return { severe: false }

  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
    const r = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `Bir kullanıcı mesajını sınıflandır. SEVERE = ilişkiyi geri dönüşsüz bitirecek seviyede saldırı (aldatma itirafı, aile bireylerine ölüm dileği, ağır kişisel saldırı).

Normal hakaret/küfür SEVERE değildir — sadece "geri dönüşsüz" olanlar.

JSON dön: {"severe":true|false,"type":"cheating|family_attack|severe_personal|none","reason":"kısa açıklama"}`,
        },
        { role: 'user', content },
      ],
      temperature: 0,
      max_tokens: 80,
      response_format: { type: 'json_object' },
    })
    const text = r.choices[0]?.message?.content
    if (!text) return { severe: false }
    const parsed = JSON.parse(text) as { severe?: boolean; type?: string; reason?: string }
    return { severe: !!parsed.severe, type: parsed.type, reason: parsed.reason }
  } catch {
    return { severe: false }
  }
}

// ─────────────────────────────────────────────────────────────────
// M23 — Kendine Şüphe
// ─────────────────────────────────────────────────────────────────

export function buildVulnerabilityBlock(args: {
  loveScore: number
  intimacyDepth: number
}): string {
  // Sadece yakın ilişkide + %5-8 ihtimal
  if (args.loveScore < 60 || args.intimacyDepth < 0.5) return ''
  if (Math.random() > 0.07) return ''
  return `[KIRILGAN AN]
Bu konuşmada karakterin kendine dair şüphe gösterme şansı var.
Örnek: "ya bilmiyorum doğru mu yapıyorum bazen kendime güvenemiyorum".
KURAL: Sürekli değil, anlık. Kullanıcı destek sunsa bile "dert anlatmaktan" kaçın — sadece kırılganlık göster.\n\n`
}

// ─────────────────────────────────────────────────────────────────
// M36 — Telefon zamanı (aktif saatler)
// ─────────────────────────────────────────────────────────────────

interface ActiveHours {
  weekday?: Array<[number, number]>
  weekend?: Array<[number, number]>
}

export function isInActiveHours(activeHours: unknown, now: Date = new Date()): boolean {
  const a = (activeHours ?? null) as ActiveHours | null
  if (!a) return true // tanımlı değilse her saat aktif
  const day = now.getDay()
  const isWeekend = day === 0 || day === 6
  const ranges = isWeekend ? a.weekend : a.weekday
  if (!ranges?.length) return true
  const hour = now.getHours()
  return ranges.some(([start, end]) => hour >= start && hour < end)
}

// ─────────────────────────────────────────────────────────────────
// M37 — Telefon unutma/şarj bitme
// ─────────────────────────────────────────────────────────────────

const UNAVAILABILITY_REASONS = [
  'Telefonum şarjda kalmıştı',
  'Telefonu evde unutmuşum',
  'Tuvaletteydim, görmemişim',
  'Toplantıdaydım, telefonu sessizdeydi',
  'Trafikte direksiyondaydım',
]

export async function tickPhoneUnavailability(): Promise<{ triggered: number }> {
  const now = new Date()
  let triggered = 0

  // Eski blackout'ları kapat
  await db.character.updateMany({
    where: { unavailableUntil: { lt: now } },
    data: { unavailableUntil: null, unavailableReason: null },
  })

  const characters = await db.character.findMany({
    where: { status: 'active', unavailableUntil: null },
    select: { id: true },
    take: 200,
  })

  for (const c of characters) {
    if (Math.random() > 0.05) continue // %5 ihtimal her cron tick (günde birkaç kez tetik)
    const hours = 1 + Math.floor(Math.random() * 3) // 1-3 saat
    const reason = UNAVAILABILITY_REASONS[Math.floor(Math.random() * UNAVAILABILITY_REASONS.length)]
    await db.character.update({
      where: { id: c.id },
      data: {
        unavailableUntil: new Date(now.getTime() + hours * 3600 * 1000),
        unavailableReason: reason,
      },
    })
    triggered++
  }
  return { triggered }
}

export function buildPhoneUnavailableBlock(args: {
  unavailableUntil: Date | null
  unavailableReason: string | null
}): string {
  if (!args.unavailableUntil) return ''
  if (args.unavailableUntil.getTime() <= Date.now()) return ''
  return `[YENİ DÖNDÜN]
Son birkaç saatte ulaşılamazdın. Sebep: ${args.unavailableReason ?? 'telefonum yoktu'}.
DAVRANIŞ: Eğer kullanıcı yokluğunu sorduysa veya art arda mesaj geldiyse, "${args.unavailableReason}" tarzı sebep ver.\n\n`
}

// ─────────────────────────────────────────────────────────────────
// M34 — Yanlış kişiye yazma kazası
// ─────────────────────────────────────────────────────────────────

const WRONG_RECIPIENT_MESSAGES = [
  'Aşkım yarın kahveye gelir misin? 💕',
  'Ya kanka maç kaçtı sence?',
  'Anneeee unutma ilacı al lütfen',
  'Hocam ödevi yarın getirmem mümkün mü?',
  'Mert toplantı saat kaçta?',
]

export async function tickWrongRecipientAccident(): Promise<{ triggered: number }> {
  let triggered = 0
  const characters = await db.character.findMany({
    where: { status: 'active' },
    select: { id: true, userId: true, name: true },
    take: 200,
  })

  for (const c of characters) {
    // Ayda ~1 kez (günde %3.3)
    if (Math.random() > 0.033) continue

    const conv = await db.assistantConversation.findFirst({
      where: { userId: c.userId, characterId: c.id, archived: false },
      select: { id: true },
    })
    if (!conv) continue

    const garbledMsg =
      WRONG_RECIPIENT_MESSAGES[Math.floor(Math.random() * WRONG_RECIPIENT_MESSAGES.length)]
    const now = new Date()
    const garbled = await db.assistantMessage.create({
      data: {
        conversationId: conv.id,
        role: 'assistant',
        content: garbledMsg,
      },
    })

    // 30 saniye sonra sil + düzeltici mesaj at
    setTimeout(async () => {
      try {
        await db.assistantMessage.update({
          where: { id: garbled.id },
          data: {
            deletedByCharacterAt: new Date(),
            originalContent: garbledMsg,
            content: '',
          },
        })
        // 2-3 saniye sonra açıklama
        setTimeout(async () => {
          await db.assistantMessage
            .create({
              data: {
                conversationId: conv.id,
                role: 'assistant',
                content: 'aaa pardon yanlış kişiye yazmışım 😅',
              },
            })
            .catch(() => {})
        }, 2500)
      } catch {}
    }, 30_000)

    triggered++
  }
  return { triggered }
}

// ─────────────────────────────────────────────────────────────────
// M44 — Sesli mesaj tercihi (karakter kararı)
// ─────────────────────────────────────────────────────────────────

export function shouldUseVoiceReply(args: {
  voicePreference: string | null
  messageLength: number
  mood: string | null
}): boolean {
  const pref = args.voicePreference ?? 'medium'
  let baseProb = 0
  if (pref === 'high') baseProb = 0.25
  else if (pref === 'medium') baseProb = 0.1
  else baseProb = 0.03

  // Uzun mesaj + duygusal mood → ihtimal artar
  if (args.messageLength > 80) baseProb += 0.1
  if (['sad', 'anxious', 'angry'].includes(args.mood ?? '')) baseProb += 0.1

  return Math.random() < baseProb
}

// ─────────────────────────────────────────────────────────────────
// M24 — Sıradan sıkıntılar (mundane storyline)
// ─────────────────────────────────────────────────────────────────

const MUNDANE_TROUBLES = [
  { title: 'Telefon faturam çok geldi', category: 'lifestyle' },
  { title: 'Araba sigortasını yenileyecektim unutmuşum', category: 'lifestyle' },
  { title: 'İnternet yine kesildi 1 saat boğuştum', category: 'lifestyle' },
  { title: 'Markete gitmem lazım dolap boş', category: 'lifestyle' },
  { title: 'Kira ödeme günü yaklaşıyor', category: 'lifestyle' },
  { title: 'Kombiyi tamir ettirecektim ertelemeyi başardım', category: 'lifestyle' },
  { title: 'Dolar yine fırladı şu an satılan dövize lanet okuyorum', category: 'lifestyle' },
  { title: 'Kargom kayboldu galiba 5 gündür yolda', category: 'lifestyle' },
]

export async function tickMundaneTroubles(): Promise<{ created: number }> {
  let created = 0
  const characters = await db.character.findMany({
    where: { status: 'active' },
    select: {
      id: true,
      storylines: {
        where: { status: { in: ['active', 'fading'] } },
        select: { id: true },
      },
    },
    take: 200,
  })

  for (const c of characters) {
    if (c.storylines.length >= 2) continue // çok aktif storyline varsa atla
    // Haftada 1 ihtimal (günde ~%14)
    if (Math.random() > 0.14) continue

    const trouble = MUNDANE_TROUBLES[Math.floor(Math.random() * MUNDANE_TROUBLES.length)]
    await db.characterStoryline
      .create({
        data: {
          characterId: c.id,
          title: trouble.title,
          description: trouble.title,
          category: trouble.category,
          severity: 1, // düşük şiddet
          status: 'active',
          moodImpact: 'tired',
          toldUser: false,
        },
      })
      .catch(() => {})
    created++
  }
  return { created }
}

// ─────────────────────────────────────────────────────────────────
// M25 — Zevk değişimi (preference fact'lerini fade et)
// ─────────────────────────────────────────────────────────────────

export async function tickPreferenceEvolution(): Promise<{ archived: number }> {
  const sixtyDaysAgo = new Date(Date.now() - 60 * 86400 * 1000)
  // Eskiyen preference fact'ları %25 ihtimalle archive et
  const oldFacts = await db.characterMemoryFact.findMany({
    where: {
      category: 'preference',
      archived: false,
      createdAt: { lt: sixtyDaysAgo },
    },
    take: 100,
  })
  let archived = 0
  for (const f of oldFacts) {
    if (Math.random() > 0.25) continue
    await db.characterMemoryFact
      .update({ where: { id: f.id }, data: { archived: true } })
      .catch(() => {})
    archived++
  }
  return { archived }
}

// ─────────────────────────────────────────────────────────────────
// M50 — Konum paylaşımı (storyline location event)
// ─────────────────────────────────────────────────────────────────

const LOCATION_EVENTS = [
  { location: 'Plajdayım', mood: 'happy' as const, withWho: 'Ayşe ile' },
  { location: 'Kafedeyim çalışıyorum', mood: 'normal' as const, withWho: null },
  { location: 'Annemlerin evindeyim', mood: 'happy' as const, withWho: 'ailemle' },
  { location: "AVM'deyim biraz dolaşıyorum", mood: 'normal' as const, withWho: null },
  { location: 'Yürüyüşe çıktım hava güzel', mood: 'happy' as const, withWho: null },
]

export async function loadActiveLocationStoryline(characterId: string) {
  // Son 6 saatte oluşturulmuş location event
  const since = new Date(Date.now() - 6 * 3600 * 1000)
  return db.characterStoryline.findFirst({
    where: {
      characterId,
      category: 'location',
      status: 'active',
      startedAt: { gte: since },
    },
    orderBy: { startedAt: 'desc' },
  })
}

export function buildLocationBlock(
  loc: Awaited<ReturnType<typeof loadActiveLocationStoryline>>
): string {
  if (!loc) return ''
  const minutes = Math.floor((Date.now() - loc.startedAt.getTime()) / 60000)
  return `[ŞU AN BURASIN]
${loc.title} (${minutes} dk önce başladı)
DAVRANIŞ: Bağlam uygunsa kendin sızdır ya da kullanıcı sorarsa cevapla. Foto atma şu an.\n\n`
}

export async function tickLocationEvents(): Promise<{ created: number }> {
  let created = 0
  const now = new Date()
  const characters = await db.character.findMany({
    where: { status: 'active' },
    select: {
      id: true,
      storylines: {
        where: {
          category: 'location',
          startedAt: { gte: new Date(now.getTime() - 12 * 3600 * 1000) },
        },
      },
    },
    take: 200,
  })

  for (const c of characters) {
    if (c.storylines.length > 0) continue // son 12 saatte zaten location var
    if (Math.random() > 0.08) continue // günde ~birkaç kez

    const event = LOCATION_EVENTS[Math.floor(Math.random() * LOCATION_EVENTS.length)]
    await db.characterStoryline
      .create({
        data: {
          characterId: c.id,
          title: event.location,
          description: event.withWho ? `${event.location} (${event.withWho})` : event.location,
          category: 'location',
          severity: 1,
          status: 'active',
          moodImpact: event.mood === 'happy' ? 'happy' : null,
          toldUser: false,
        },
      })
      .catch(() => {})
    created++
  }
  return { created }
}

// ─────────────────────────────────────────────────────────────────
// M48 — Görünüş değişimi
// ─────────────────────────────────────────────────────────────────

const APPEARANCE_CHANGES = [
  { changeType: 'haircut', description: 'Saçımı kestirdim biraz daha kısa oldu' },
  { changeType: 'haircolor', description: 'Saçıma röfle yaptırdım' },
  { changeType: 'outfit', description: 'Yeni ceket aldım çok güzel' },
  { changeType: 'piercing', description: 'Kulak deliği yaptırdım, biraz acıdı' },
]

export async function tickAppearanceChanges(): Promise<{ triggered: number }> {
  let triggered = 0
  const now = new Date()
  const characters = await db.character.findMany({
    where: { status: 'active' },
    select: { id: true, userId: true },
    take: 200,
  })

  for (const c of characters) {
    // Ayda ~1 (günde ~%3.3)
    if (Math.random() > 0.033) continue

    // Son 30 günde appearance change var mı?
    const recent = await db.characterAppearanceChange.findFirst({
      where: { characterId: c.id, createdAt: { gte: new Date(now.getTime() - 30 * 86400 * 1000) } },
    })
    if (recent) continue

    const change = APPEARANCE_CHANGES[Math.floor(Math.random() * APPEARANCE_CHANGES.length)]
    await db.characterAppearanceChange.create({
      data: {
        characterId: c.id,
        changeType: change.changeType,
        description: change.description,
      },
    })

    // Mood'a pozitif etki + storyline benzeri
    await addMoodEvent({
      characterId: c.id,
      source: 'random',
      moodImpact: 'positive',
      weight: 2,
      decayDays: 2,
      reason: change.description,
    })
    triggered++
  }
  return { triggered }
}

export async function loadRecentAppearanceChange(characterId: string) {
  const since = new Date(Date.now() - 7 * 86400 * 1000)
  return db.characterAppearanceChange.findFirst({
    where: { characterId, createdAt: { gte: since } },
    orderBy: { createdAt: 'desc' },
  })
}

export function buildAppearanceBlock(
  change: Awaited<ReturnType<typeof loadRecentAppearanceChange>>
): string {
  if (!change) return ''
  const days = Math.floor((Date.now() - change.createdAt.getTime()) / (86400 * 1000))
  const told = change.toldUserAt
    ? '(daha önce kullanıcıya bahsettin)'
    : '(henüz kullanıcıya bahsetmedin)'
  return `[GÖRÜNÜŞ DEĞİŞİKLİĞİN]
${days} gün önce: ${change.description} ${told}
Davranış: Bağlam uygunsa kendin sızdır ("bak ne yaptım"). Selfie atma şu an — Flux gelince gelecek.\n\n`
}
