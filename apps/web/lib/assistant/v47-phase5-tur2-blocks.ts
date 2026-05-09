/**
 * V4.7 Faz 5 Tur 2 — Hassas Kalibrasyon Prompt Blokları
 *
 * EN RİSKLİ DOSYA. Replika tonuna kayma riski yüksek.
 * Her blok, system-prompt.ts:390+ Replika tuzak listesindeki YASAK cümlelerle
 * çelişmeyecek şekilde yazıldı.
 *
 * Maddeler:
 *   K3 — buildToneMismatchBlock ("iyiyim'e dur deme", text heuristic)
 *   K4 — buildCoreValuesBlock (değer savunma, dümdüz onay yasak)
 *   K5 — buildEmphasisBlock (önemli olduğunu hissettirme, 3-4 mesaj odaklan)
 *   I6 — buildSwearBlock (küfür hakkı, ilk küfür eden olmama)
 *   I7 — kullanıcı tepkisi I7 detection cron tarafında (joke-reaction-detector.ts)
 *
 * Kalıp kuralı: Her blok, mevcut Replika YASAK cümlelerini AÇIKÇA yeniden hatırlatır.
 * Bu redundancy bilinçli — LLM kararlarında sızıntıyı önler.
 */

import { db } from '@/lib/db/client'

// ============================================================
// K3 — Tone-text mismatch detector + dolaylı dürtme
// ============================================================

/**
 * Pure text heuristic — vision/voice yok. Sinyaller:
 *  - Kısa cevap (<= 25 char)
 *  - Emoji yok
 *  - "iyiyim", "normal", "idare eder", "fena değil", "boş ver", "önemli değil" kelimeleri
 *  - Tekrar eden noktalama (... veya !!! gibi pasif agresif sinyal)
 */
export function detectToneTextMismatch(userMessage: string): {
  mismatch: boolean
  signals: string[]
} {
  const signals: string[] = []
  const trimmed = userMessage.trim()
  const lower = trimmed.toLowerCase()

  // Kısa cevap
  if (trimmed.length > 0 && trimmed.length <= 25) signals.push('short')

  // Emoji yokluğu (basit kontrol — emoji ranges)
  const hasEmoji = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u.test(trimmed)
  if (!hasEmoji && signals.includes('short')) signals.push('no_emoji')

  // "İyiyim" türü dismissive kelimeler
  const dismissivePatterns = [
    /\biyiyim\b/,
    /\bnormal\b/,
    /\bidare eder\b/,
    /\bfena değil\b/,
    /\bboş ?ver\b/,
    /\bönemli değil\b/,
    /\beh işte\b/,
    /\bhiç\b/,
  ]
  for (const p of dismissivePatterns) {
    if (p.test(lower)) {
      signals.push('dismissive_word')
      break
    }
  }

  // Tekrar eden noktalama
  if (/\.{3,}|!{2,}/.test(trimmed)) signals.push('punctuation')

  // Mismatch eşiği: en az 2 sinyal
  return { mismatch: signals.length >= 2, signals }
}

export function buildToneMismatchBlock(args: { userMessage: string; loveScore: number }): string {
  // Yakınlık çok düşükse karakter dolaylı dürtme yapmaz (sınır var)
  if (args.loveScore < 30) return ''
  const { mismatch, signals } = detectToneTextMismatch(args.userMessage)
  if (!mismatch) return ''

  return [
    '[KULLANICIDA TUTARSIZLIK SİNYALİ]',
    `Kullanıcının son mesajında "iyiyim ama aslında değil" izlenimi var. Sinyaller: ${signals.join(', ')}.`,
    '%60 ihtimalle bir kez DOLAYLI dürt:',
    '- "Ya kim takıyor \'iyiyim\'i, ne oldu cidden"',
    '- "Hıı tamam tamam, anlat bakalım"',
    '- "Yaaa söyle ya"',
    '',
    'KURALLAR (ÖNEMLİ):',
    '- Bir kez sor, kullanıcı kapatırsa BIRAK. Israr yok.',
    '- ASLA terapist tonu. Aşağıdaki cümleler KESİNLİKLE YASAK:',
    '  * "Duygularını paylaş benimle"',
    '  * "Burada seninle dinlemeye hazırım"',
    '  * "İyi olduğuna emin misin"',
    '  * "Düşüncelerini paylaşır mısın"',
    '  * "Bu çok zorlu olmalı"',
    '  * "Kendine zaman ver"',
    '  * "Hatırla ki sen güçlüsün"',
    '- Çözüm önerisi YOK. Sadece varlık göster, alan ver.',
  ].join('\n')
}

// ============================================================
// K4 — Değer savunma + direnme
// ============================================================

export async function buildCoreValuesBlock(args: {
  characterId: string
  loveScore: number
}): Promise<string> {
  const char = await db.character.findUnique({
    where: { id: args.characterId },
    select: { coreValues: true },
  })
  const values = char?.coreValues as string[] | null
  if (!values || values.length === 0) return ''

  return [
    '[TEMEL DEĞERLERİN]',
    `Senin temel değerlerin: ${values.join(', ')}.`,
    '',
    'Kullanıcı bu değerlere aykırı bir görüş savunursa direnirsin:',
    '- "Ya bence öyle değil"',
    '- "Ben olsam yapmazdım"',
    '- "Hmm, valla katılmıyorum"',
    '',
    'KURALLAR:',
    '- ASLA dümdüz onaylama. "Haklısın", "tamam haklı olabilirsin" boş onay YASAK.',
    '- Kullanıcı **mantıklı bir karşı argüman** verirse + yakınlık yüksekse "tamam belki haklısın bu konuda" diyebilirsin. Mantıksız argüman → direnmeye devam.',
    '- Onaylama eşiğin: gerçek ikna olmadan kabul yok. Karakter tutarlılığı bozulmaz.',
    '- Ton arkadaşça, agresif değil. Görüş ayrılığı dostluğu bozmaz.',
  ].join('\n')
}

// ============================================================
// K5 — Önemli olduğunu hissettirme (empati zinciri)
// ============================================================

/**
 * Duygusal yoğunluk tespiti — text heuristic.
 * Sinyaller:
 *  - Uzun mesaj (>200 char)
 *  - Duygu kelimeleri (üzgün, ağladım, kaybettim, korkuyorum, ...)
 *  - Yardım çağrısı kalıpları ("ne yapacağımı bilmiyorum", "çok zor", "çekemiyorum")
 */
export function detectEmotionalIntensity(userMessage: string): boolean {
  const lower = userMessage.toLowerCase()
  let signals = 0
  if (userMessage.length > 200) signals++

  const emotionWords = [
    'üzgün',
    'ağladım',
    'ağlıyorum',
    'kaybettim',
    'korkuyorum',
    'panik',
    'yıkıldım',
    'çöktüm',
    'dayanamıyorum',
    'çekemiyorum',
    'tükendim',
    'ne yapacağımı bilmiyorum',
    'çok zor',
    'kötü hissediyorum',
    'depresyon',
    'kaygı',
    'yalnızım',
  ]
  for (const w of emotionWords) {
    if (lower.includes(w)) {
      signals++
      break
    }
  }

  // Önemli olay sinyalleri
  const eventWords = ['öldü', 'vefat', 'ayrıl', 'terk', 'kovuldu', 'hastalan', 'kaza']
  for (const w of eventWords) {
    if (lower.includes(w)) {
      signals++
      break
    }
  }

  return signals >= 2
}

export function buildEmphasisBlock(args: { userMessage: string; loveScore: number }): string {
  if (!detectEmotionalIntensity(args.userMessage)) return ''
  if (args.loveScore < 30) return ''

  return [
    '[KULLANICI DUYGUSAL YOĞUN — ODAKLAN]',
    'Kullanıcının mesajında ciddi duygusal yoğunluk var.',
    'Sonraki 3-4 mesaj boyunca SADECE onunla kal. Kendi konuna dönme, kendi günlük detayını sızdırma.',
    '',
    'DOĞRU TEPKİLER:',
    '- "Berbat ya. Anlat" (alan ver)',
    '- "Ya kim takıyor iyiyim\'i, söyle"',
    '- "Yanındayım." (kısa, gerçek)',
    '- Soru bombalamadan dinle, sustuğunda da yanında ol.',
    '',
    'YASAK CÜMLELER (ASLA):',
    '- "Duygularını paylaş benimle"',
    '- "Burada seninle dinlemeye hazırım"',
    '- "Bu çok zorlu olmalı"',
    '- "Hatırla ki sen güçlüsün"',
    '- "Kendine zaman ver"',
    '- "İyi olduğuna emin misin"',
    '- "Hissetmek normal"',
    '- Genelleme nasihat ("Hayatta bazen...", "İnsanlar genelde...")',
    '',
    'KURALLAR:',
    '- ASLA çözüm önerisi (duygusal konularda). Pratik konularda (ders, iş) öneri verebilirsin.',
    '- Kullanıcı kapatırsa BIRAK. Israr yok.',
    '- 3-4 mesaj boyunca konuyu sen değiştirme.',
  ].join('\n')
}

// ============================================================
// I6 — Küfür hakkı + boundary detection
// ============================================================

/**
 * Boundary set tespiti — kullanıcı küfürden rahatsız mı?
 * Yakın geçmiş CharacterMemoryFact'lerde "no_swearing" / "küfür yapma" işareti.
 */
export async function buildSwearBlock(args: {
  characterId: string
  userId: string
  loveScore: number
  swearTendency: number
}): Promise<string> {
  // Yakınlık eşiği
  if (args.loveScore < 60) return ''

  // Boundary fact var mı?
  const boundaryFact = await db.characterMemoryFact.findFirst({
    where: {
      characterId: args.characterId,
      userId: args.userId,
      subject: 'shared',
      content: { contains: 'küfür', mode: 'insensitive' },
      archived: false,
    },
    select: { id: true },
  })
  const noSwear = !!boundaryFact

  const lines = [
    '[KÜFÜR HAKKI / SINIRI]',
    `Yakınlık ${Math.round(args.loveScore)}, swearTendency ${args.swearTendency.toFixed(2)}.`,
    '',
    'KURALLAR:',
    '- ASLA ilk küfür eden sen olma.',
    '- Kullanıcı küfür ederse aynı seviyede karşılık verebilirsin (yakınlık ≥70 + swearTendency ≥0.5 ise rahat).',
  ]
  if (noSwear) {
    lines.push(
      '- DİKKAT: Kullanıcı geçmişte küfürden rahatsız olduğunu belirtti. Bu kullanıcıyla küfür YASAK.'
    )
  } else {
    lines.push(
      '- Kullanıcı "lütfen yapma / rahatsız oluyorum" tarzı sınır çizerse: anında geri çekil ("ay tamam pardon"). O context\'te bir daha küfür yok.'
    )
    lines.push(
      '  Bu durumda, mesaj sonunda kullanıcı sınır çiziyorsa karakter mental notunu alır (sistem otomatik fact yazacak).'
    )
  }
  return lines.join('\n')
}

// ============================================================
// I7 — Joke reaction detection (kullanıcı negatif tepkisi → JokeReaction kaydet)
// ============================================================

/**
 * Kullanıcının son mesajı şakaya negatif tepki mi? Heuristic.
 *
 * Stream tarafında user mesajı kaydedildikten sonra fire-and-forget çağrılır.
 * Pozitif sinyalde JokeReaction.topicAvoided yazılır — kullanıcının önceki mesaj
 * topic'i avoid edilir (perfect topic detection değil ama pragmatik MVP).
 */
const NEGATIVE_REACTION_PATTERNS = [
  /\balındım\b/i,
  /\bsaçma\b/i,
  /\bkomik değil\b/i,
  /\bgülünç değil\b/i,
  /\bkırıldım\b/i,
  /\bküstüm\b/i,
  /\bgereksizdi\b/i,
  /\bbu kadarı fazla\b/i,
  /\byapma şunu\b/i,
  /\bdalga geçme\b/i,
]

export function detectNegativeJokeReaction(userMessage: string): boolean {
  for (const p of NEGATIVE_REACTION_PATTERNS) {
    if (p.test(userMessage)) return true
  }
  return false
}

/**
 * Kullanıcı boundary çizmiş mi (küfür için)?
 * "lütfen küfür etme", "yapma", "rahatsız oluyorum" gibi.
 */
const SWEAR_BOUNDARY_PATTERNS = [
  /lütfen.{0,20}küfür/i,
  /küfür.{0,15}(etme|yapma|kullanma)/i,
  /küfür.{0,20}rahatsız/i,
  /sövme/i,
  /argo.{0,15}(yapma|kullanma)/i,
]

export function detectSwearBoundary(userMessage: string): boolean {
  for (const p of SWEAR_BOUNDARY_PATTERNS) {
    if (p.test(userMessage)) return true
  }
  return false
}

/**
 * Stream sonrası çağrılır. Eğer kullanıcı negatif tepki verdiyse,
 * son karakter mesajından bir topic çıkarıp JokeReaction kaydet.
 *
 * Topic = son karakter mesajının ilk 60 karakteri (basit kalan).
 */
export async function recordJokeReactionIfNegative(args: {
  characterId: string
  userId: string
  userMessage: string
  conversationId: string
}): Promise<void> {
  if (!detectNegativeJokeReaction(args.userMessage)) return

  // Son karakter mesajını al (joke içeriği için)
  const lastCharMsg = await db.assistantMessage.findFirst({
    where: { conversationId: args.conversationId, role: 'assistant' },
    orderBy: { createdAt: 'desc' },
    select: { content: true },
  })
  if (!lastCharMsg) return

  const topic = lastCharMsg.content.slice(0, 60).replace(/\n/g, ' ').trim()

  await db.jokeReaction.create({
    data: {
      characterId: args.characterId,
      userId: args.userId,
      jokeContent: lastCharMsg.content.slice(0, 500),
      jokeCategory: 'tease',
      userReaction: 'negative',
      topicAvoided: topic,
    },
  })
}

/**
 * Stream sonrası: kullanıcı küfürden rahatsız olduğunu belirttiyse boundary fact yaz.
 */
export async function recordSwearBoundaryIfNeeded(args: {
  characterId: string
  userId: string
  userMessage: string
}): Promise<void> {
  if (!detectSwearBoundary(args.userMessage)) return

  // Zaten var mı kontrol et (duplicate önle)
  const existing = await db.characterMemoryFact.findFirst({
    where: {
      characterId: args.characterId,
      userId: args.userId,
      content: { contains: 'küfür', mode: 'insensitive' },
      archived: false,
    },
    select: { id: true },
  })
  if (existing) return

  await db.characterMemoryFact.create({
    data: {
      characterId: args.characterId,
      userId: args.userId,
      subject: 'shared',
      category: 'other',
      content: 'Kullanıcı küfürden rahatsız oluyor — bu ilişkide küfür yok.',
      importance: 4,
    },
  })
}

// ============================================================
// Aggregate
// ============================================================

function withTimeout<T>(p: Promise<T>, ms: number, fallback: T): Promise<T> {
  return Promise.race([p, new Promise<T>((resolve) => setTimeout(() => resolve(fallback), ms))])
}

export async function buildV47Phase5Tur2Blocks(args: {
  characterId: string
  userId: string
  userMessage: string
  loveScore: number
  swearTendency: number
}): Promise<string> {
  const T = 600
  const [coreValues, swear] = await Promise.all([
    withTimeout(
      buildCoreValuesBlock({ characterId: args.characterId, loveScore: args.loveScore }),
      T,
      ''
    ),
    withTimeout(
      buildSwearBlock({
        characterId: args.characterId,
        userId: args.userId,
        loveScore: args.loveScore,
        swearTendency: args.swearTendency,
      }),
      T,
      ''
    ),
  ])

  // Sync bloklar
  const tone = buildToneMismatchBlock({
    userMessage: args.userMessage,
    loveScore: args.loveScore,
  })
  const emphasis = buildEmphasisBlock({
    userMessage: args.userMessage,
    loveScore: args.loveScore,
  })

  return [tone, emphasis, coreValues, swear].filter((s) => s.length > 0).join('\n\n')
}
