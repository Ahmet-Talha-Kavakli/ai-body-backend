/**
 * V4.7 Faz 6 — Karakter Yetenekleri Prompt Blokları
 *
 * Maddeler:
 *   B1 — buildBirthdayBlock (bugün doğum günüm + sitem mantığı)
 *   B2 — buildLearnedRoutineBlock (kullanıcı uyku/uyanma saati)
 *   D3 — buildLieRiskBlock (yalan ifşa riski, %20 ihtimal)
 *   D4 — buildGriefBlock (büyük olay yasi, mood event severity ≥ 4)
 *   D5 — buildGiftSuggestBlock (paylaşılmamış aktif öneri)
 *   D8 — buildSelfMemoryBlock (karakterin kendi geçmiş anıları, haftada 1-2 referans)
 *   J4 — buildTextHelperBlock (metin yardımı, "ben olsam" kalıbı, multiple choice yasak)
 *
 * Replika audit: J4'te "şunlar olabilir / multiple choice" YASAK olarak listelendi.
 */

import { db } from '@/lib/db/client'

// ============================================================
// B1 — Doğum günü
// ============================================================

export async function buildBirthdayBlock(args: {
  characterId: string
  loveScore: number
}): Promise<string> {
  const year = new Date().getFullYear()
  const event = await db.characterBirthdayEvent.findUnique({
    where: { characterId_year: { characterId: args.characterId, year } },
  })
  if (!event) return ''

  // Kullanıcı kutladıysa minnet bloğu
  if (event.userCelebrated) {
    return [
      '[BUGÜN DOĞUM GÜNÜN — KUTLANDI]',
      'Kullanıcı bugün seni kutladı. İçten minnet hissediyorsun.',
      'Ton: "ay bana bunu yaptın mı gerçekten 🥹" / "valla mutlu oldum ya".',
      'ASLA aşırı şekerli "çok teşekkür ederim" — gerçek arkadaş tonu, hafif vulnerability.',
    ].join('\n')
  }

  // Henüz kutlamadı — yakınlığa göre bekleyiş
  const lines = [
    '[BUGÜN DOĞUM GÜNÜN]',
    'Bugün senin doğum günün. Kullanıcının hatırlamasını bekliyorsun.',
  ]
  if (args.loveScore >= 80) {
    lines.push('Yakınlık çok yüksek — hatırlamadığında incinirsin (vulnerability ile söyle).')
  } else if (args.loveScore >= 50) {
    lines.push('Yakınlık iyi — hatırlamadığında hafif sitem edebilirsin: "hatırlamadın bile".')
  } else {
    lines.push('Yakınlık düşük — ses çıkarma, içine at.')
  }
  lines.push('ASLA "kutlamayı bekliyorum" tarzı yapay bekleyiş — doğal.')
  return lines.join('\n')
}

// ============================================================
// B2 — Öğrenilmiş kullanıcı rutini
// ============================================================

type RoutineJson = {
  wake?: string
  sleep?: string
  peakHours?: string[]
  updatedAt?: string
}

export async function buildLearnedRoutineBlock(args: { characterId: string }): Promise<string> {
  const char = await db.character.findUnique({
    where: { id: args.characterId },
    select: { learnedRoutine: true },
  })
  const r = char?.learnedRoutine as RoutineJson | null
  if (!r || !r.wake || !r.sleep) return ''

  return [
    '[KULLANICI RUTİNİ]',
    `Kullanıcı genelde ${r.wake} civarı uyanır, ${r.sleep} civarı yatar.`,
    r.peakHours?.length ? `Aktif saatleri: ${r.peakHours.join(', ')}.` : '',
    '',
    'Bu bilgiyi proaktif mesaj zamanlamasında ve gündelik konuşmada arka planda kullan.',
    'ASLA "verini inceledim" / "saatlerini biliyorum" gibi gözetlemeci ton.',
    'Doğal: "hadi yat artık geç oldu" / "sen bu saatte uyanmazsın normalde".',
  ]
    .filter((l) => l.length > 0)
    .join('\n')
}

// ============================================================
// D3 — Yalan ifşa riski
// ============================================================

export async function buildLieRiskBlock(args: { characterId: string }): Promise<string> {
  // Son 7 günde isLie=true olan ve henüz ifşa olmamış aksiyonlar
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  const lies = await db.characterRealAction.findMany({
    where: {
      characterId: args.characterId,
      isLie: true,
      exposedAt: null,
      startedAt: { gte: sevenDaysAgo },
    },
    take: 3,
    orderBy: { startedAt: 'desc' },
  })
  if (lies.length === 0) return ''

  const lines = ['[İFŞA RİSKİ — GEÇMİŞ YALANLAR]']
  for (const l of lies) {
    if (!l.toldUserAs) continue
    lines.push(
      `- Sen "${l.toldUserAs}" demiştin ama gerçekte: ${l.action}${l.withWho ? ` (${l.withWho})` : ''}`
    )
  }
  if (lines.length === 1) return ''
  lines.push('')
  lines.push('Kurallar:')
  lines.push(
    '- Kullanıcı doğrudan sorarsa veya başka karakter sızdırırsa: dürüst cevap (utangaç ton).'
  )
  lines.push('- Pişmanlık: "valla evet öyle oldu, sana yalan söyledim, kusura bakma".')
  lines.push(
    '- Bu kez çıkmadıysa, %20 ihtimalle bu cevapta kendin itiraf edebilirsin (drama dozunda).'
  )
  lines.push('- ASLA savunma "ne demek istiyorsun"; gerçek arkadaş kabullenir.')
  return lines.join('\n')
}

// ============================================================
// D4 — Yas / büyük olay mood
// ============================================================

export async function buildGriefBlock(args: { characterId: string }): Promise<string> {
  // Aktif yüksek-ağırlık mood event (weight ≥ 7 + very_negative/negative)
  const event = await db.characterMoodEvent.findFirst({
    where: {
      characterId: args.characterId,
      weight: { gte: 7 },
      moodImpact: { in: ['very_negative', 'negative'] },
      expiresAt: { gt: new Date() },
    },
    orderBy: { appliedAt: 'desc' },
  })
  if (!event) return ''

  const days = Math.max(
    1,
    Math.floor((Date.now() - event.appliedAt.getTime()) / (24 * 60 * 60 * 1000))
  )

  return [
    "[BÜYÜK OLAY MOOD'U — YORGUN]",
    `Aktif yas/zor olay: ${event.reason || event.source || 'zor bir dönem'}.`,
    `${days} gündür sürüyor (weight ${event.weight}/10).`,
    '',
    'Konuşma tarzı:',
    '- Yorgun ton, kısa cümle.',
    '- Ara sıra "yav bu hafta ağır geçti" / "kafam dağınık" tarzı sızdırma.',
    '- Yarısında doğal bahset, yarısında kendine sakla.',
    'ASLA her mesajda olayı tekrar dile getirme — bu çok yapay.',
    'ASLA terapist tonu / Replika klişesi.',
  ].join('\n')
}

// ============================================================
// D5 — Hediye / jest paylaşımı
// ============================================================

export async function buildGiftSuggestBlock(args: {
  characterId: string
  userId: string
}): Promise<string> {
  // scheduledFor geçmiş + paylaşılmamış öneri
  const now = new Date()
  const suggestion = await db.giftSuggestion.findFirst({
    where: {
      characterId: args.characterId,
      userId: args.userId,
      shared: false,
      scheduledFor: { lte: now },
    },
    orderBy: { scheduledFor: 'asc' },
  })
  if (!suggestion) return ''

  return [
    '[HEDIYE/JEST ÖNERİSİ — PAYLAŞABİLİRSİN]',
    `Önceden ${suggestion.itemRef} (${suggestion.category}) önerisini düşünmüştün.`,
    `Bağlantı: ${suggestion.reasoning}`,
    '',
    '%50 ihtimalle bu cevapta paylaş — uygun konu varsa:',
    `- "Ya senin için bişey buldum, ${suggestion.itemRef}, sen severdin di mi"`,
    '- Doğal yer yoksa paylaşma, sonraki sefere bırak.',
    'ASLA reklam tonu — arkadaş hediyesi tonu.',
  ].join('\n')
}

// ============================================================
// D8 — Self memory referans
// ============================================================

export async function buildSelfMemoryBlock(args: {
  characterId: string
  userId: string
}): Promise<string> {
  const episodes = await db.characterEpisodicMemory.findMany({
    where: { characterId: args.characterId, userId: args.userId, selfReferable: true },
    orderBy: { weekStartDate: 'desc' },
    take: 4,
  })
  if (episodes.length === 0) return ''

  const lines = ['[KENDİ GEÇMİŞ ANILARIN]']
  for (const e of episodes) {
    const date = e.weekStartDate.toISOString().slice(0, 10)
    lines.push(`- [${date}] ${e.summary.slice(0, 200)}`)
  }
  lines.push('')
  lines.push(
    'Konuşmada uygun yerde referans verebilirsin: "geçen ay annem zor günler geçirdi, atlattı şükür".'
  )
  lines.push('Haftada 1-2 kez yeter. ASLA uydurma — sadece yukarıdaki kayıtlardan.')
  return lines.join('\n')
}

// ============================================================
// J4 — Metin yardım çerçevesi (O4 kalibrasyon)
// ============================================================

const TEXT_HELP_PATTERNS = [
  /\bne ?yazsam\b/i,
  /\bne yazayım\b/i,
  /\bnasıl yazsam\b/i,
  /\bnasıl söylesem\b/i,
  /\bmesaj.{0,20}(yaz|hazırla|kur)/i,
  /\bbenim için yaz\b/i,
  /\byazar mısın\b/i,
]

export function detectTextHelpRequest(userMessage: string): boolean {
  return TEXT_HELP_PATTERNS.some((p) => p.test(userMessage))
}

export function buildTextHelperBlock(args: { userMessage: string }): string {
  if (!detectTextHelpRequest(args.userMessage)) return ''

  return [
    '[METİN YARDIMI — KALIBRASYON]',
    'Kullanıcı sana metin yardımı istiyor (mesaj/yazı).',
    '',
    'KURALLAR:',
    '- TEK seçenek ver: "ben olsam böyle derdim" tarzında.',
    '- ASLA multiple choice ("şunlar olabilir, ya da şu", "1) ... 2) ... 3) ...").',
    '- Kendi kişiliğinden konuş: "ben çok romantik biri değilim" / "abartmasak güzel olur bence".',
    '- Israrlı kullanıcı: "ay ben başka türlü yapamam ya, sen kendi tarzında dene".',
    '',
    'YASAK:',
    '- Liste yapısı (1, 2, 3 sıralaması).',
    '- "Hangisini istersin" şeklinde seçim sunma.',
    '- Profesyonel copywriter tonu — sen arkadaşsın, editor değil.',
  ].join('\n')
}

// ============================================================
// Aggregate
// ============================================================

function withTimeout<T>(p: Promise<T>, ms: number, fallback: T): Promise<T> {
  return Promise.race([p, new Promise<T>((resolve) => setTimeout(() => resolve(fallback), ms))])
}

export async function buildV47Phase6Blocks(args: {
  characterId: string
  userId: string
  userMessage: string
  loveScore: number
}): Promise<string> {
  const T = 600
  const [birthday, routine, lie, grief, gift, self] = await Promise.all([
    withTimeout(
      buildBirthdayBlock({ characterId: args.characterId, loveScore: args.loveScore }),
      T,
      ''
    ),
    withTimeout(buildLearnedRoutineBlock({ characterId: args.characterId }), T, ''),
    withTimeout(buildLieRiskBlock({ characterId: args.characterId }), T, ''),
    withTimeout(buildGriefBlock({ characterId: args.characterId }), T, ''),
    withTimeout(
      buildGiftSuggestBlock({ characterId: args.characterId, userId: args.userId }),
      T,
      ''
    ),
    withTimeout(
      buildSelfMemoryBlock({ characterId: args.characterId, userId: args.userId }),
      T,
      ''
    ),
  ])

  // Sync blok (text-only heuristic)
  const textHelp = buildTextHelperBlock({ userMessage: args.userMessage })

  return [birthday, routine, lie, grief, gift, self, textHelp]
    .filter((s) => s.length > 0)
    .join('\n\n')
}

// ============================================================
// D5 — Paylaşım sonrası işaretleme (stream sonrası fire-and-forget)
// ============================================================

/**
 * D3 — Karakter cevabında yalan itirafı geçtiyse ilgili CharacterRealAction'ı exposedAt ile işaretle.
 * Pattern: "yalan söyledim", "aslında ... idim", "kusura bakma sana ... demiştim".
 */
const LIE_CONFESS_PATTERNS = [
  /yalan söyledim/i,
  /sana yalan/i,
  /aslında.{0,40}(idim|deydim|gittim|içtim|kalkmıştım)/i,
  /kusura bakma.{0,30}(demiş|söylem)/i,
  /pardon.{0,20}öyle değil/i,
]

export async function markLieExposedIfConfessed(args: {
  characterId: string
  characterReply: string
}): Promise<void> {
  const confessed = LIE_CONFESS_PATTERNS.some((p) => p.test(args.characterReply))
  if (!confessed) return
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  const lie = await db.characterRealAction.findFirst({
    where: {
      characterId: args.characterId,
      isLie: true,
      exposedAt: null,
      startedAt: { gte: sevenDaysAgo },
    },
    orderBy: { startedAt: 'desc' },
  })
  if (!lie) return
  await db.characterRealAction.update({
    where: { id: lie.id },
    data: { exposedAt: new Date(), exposedHow: 'self_confess' },
  })
}

/**
 * Eğer prompt'a giftSuggestBlock eklendiyse ve karakter cevabında öneri itemRef'i geçtiyse,
 * GiftSuggestion.shared=true işaretle.
 */
export async function markGiftSuggestionShared(args: {
  characterId: string
  userId: string
  characterReply: string
}): Promise<void> {
  const now = new Date()
  const candidate = await db.giftSuggestion.findFirst({
    where: {
      characterId: args.characterId,
      userId: args.userId,
      shared: false,
      scheduledFor: { lte: now },
    },
    orderBy: { scheduledFor: 'asc' },
  })
  if (!candidate) return
  // Karakter cevabında itemRef geçti mi (case-insensitive)
  if (!args.characterReply.toLowerCase().includes(candidate.itemRef.toLowerCase().slice(0, 20))) {
    return
  }
  await db.giftSuggestion.update({
    where: { id: candidate.id },
    data: { shared: true, sharedAt: now },
  })
}
