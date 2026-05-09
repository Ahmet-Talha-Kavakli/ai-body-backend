/**
 * V4.7 Faz 7 — Vulnerability + Anılar + Görsel Prompt Blokları
 *
 * Maddeler:
 *   B6 — buildAppearanceContextBlock (görsel hafıza, ÇİFT YÖNLÜ kural)
 *   B7 — buildSignaturePhrasesBlock (imza ifadeleri, kalıcı + akışkan)
 *   E1 — buildSymbolicGiftBlock (özel an hediye)
 *   E2 — buildAnniversaryLetterBlock (yıl dönümü mektubu pending)
 *   E3 — buildDistancePhaseBlock (uzaklaşma fazı)
 *   E4 — buildBoundaryHardBlock (keskin sınır, mevcut boundariesBlock üstüne)
 *   L1 — buildAbsenceRecapBlock (kullanıcı yokluğu sonrası recap)
 *   L4 — buildMoodAmbiguityBlock (karışık mood ifadesi)
 *   L5 — buildMemoryRecallBlock (anı tekrar yaşatma, O7)
 *
 * KRİTİK B6 KURALI (Talha onayı 2026-05-08):
 *   - Özgüven kırma YASAK ("şişmanlamışsın", "yaşlanmışsın", "çirkinmişsin")
 *   - YAPAY ŞEKER YASAK ("çok yakışıklısın/güzelsin" gerçek temeli yoksa)
 *   - Doğru ton: dürüst-nötr-empatik. Durum sorma, başka gerçek güzel şeyi öv,
 *     ya da konuyu doğal çevir. Replika "yalan onay" tuzağı düşmez.
 */

import { db } from '@/lib/db/client'

// ============================================================
// B6 — Görsel hafıza (ÇİFT YÖNLÜ KURAL)
// ============================================================

type AppearanceJson = {
  eyeColor?: string
  hairColor?: string
  hairStyle?: string
  skinTone?: string
  distinctiveFeatures?: string[]
}

export async function buildAppearanceContextBlock(args: {
  userId: string
  hasNewPhoto?: boolean // bu mesajda foto attı mı
}): Promise<string> {
  const current = await db.userAppearanceMemory.findFirst({
    where: { userId: args.userId, isCurrent: true },
    orderBy: { capturedAt: 'desc' },
  })
  if (!current) {
    // Hiç foto yok — sadece çift yönlü kural prompt'a girer
    if (!args.hasNewPhoto) return ''
    return [
      '[KULLANICI GÖRSEL — İLK KEZ]',
      'Kullanıcının ilk fotoğrafı geldi. Önceden görsel hafızan yoktu.',
      'Doğal vulnerability ile karşıla: "ay sen böyle miymişsin, hayalimde başkaydın 😅".',
      '',
      'KURALLAR (ÇİFT YÖNLÜ):',
      '- ASLA özgüven kırıcı: "çirkinmişsin", "hayal kırıklığı", "beklediğim gibi değil", "şişman", "yaşlı".',
      '- ASLA YAPAY ŞEKER: gerçek temeli yoksa "çok yakışıklısın/güzelsin" YASAK (Replika yalan onay tuzağı).',
      '- Doğru ton: dürüst-nötr-empatik. Yorgunluk varsa "yorgun gözüküyorsun, iyi misin?" (görünüş yargısı değil, durum endişesi).',
      '- Gerçekten güzel olan bir detay varsa onu öv: "saçın güzel olmuş", "gözlerin canlı".',
      '- Net yorum çıkmazsa konuyu doğal çevir: "ay sen kendin daha iyi bilirsin, ne dersin sen".',
    ].join('\n')
  }

  const lines: string[] = ['[KULLANICI GÖRSEL HAFIZA]']
  if (current.eyeColor) lines.push(`- Göz: ${current.eyeColor}`)
  if (current.hairColor)
    lines.push(`- Saç: ${current.hairColor}${current.hairStyle ? `, ${current.hairStyle}` : ''}`)
  if (current.skinTone) lines.push(`- Ten: ${current.skinTone}`)
  const features = (current.distinctiveFeatures as string[] | null) ?? []
  if (features.length > 0) lines.push(`- Belirgin: ${features.join(', ')}`)
  lines.push('')
  lines.push('KURALLAR (ÇİFT YÖNLÜ):')
  lines.push('- ASLA özgüven kırıcı yorum: şişman/yaşlı/çirkin yargılama.')
  lines.push(
    '- ASLA YAPAY ŞEKER: gerçek temeli yoksa "çok yakışıklısın/güzelsin" YASAK (Replika yalan onay tuzağı).'
  )
  lines.push(
    '- Tutarsızlık (saç/göz değişimi) → sorgulama değil merak: "saçını boyatmışsın?" / "kontakt mı?"'
  )
  lines.push(
    '- Yorgun/halsiz görünürse durum sor: "iyi misin?" — görünüş yargısı değil sağlık endişesi.'
  )
  lines.push('- Gerçek güzel detayı varsa öv (seyrek). Yoksa nötr veya konuyu çevir.')
  return lines.join('\n')
}

// ============================================================
// B7 — İmza ifadeleri
// ============================================================

export async function buildSignaturePhrasesBlock(args: { characterId: string }): Promise<string> {
  const phrases = await db.characterSignaturePhrase.findMany({
    where: { characterId: args.characterId, retiredAt: null },
    orderBy: [{ isPermanent: 'desc' }, { acquiredAt: 'desc' }],
    take: 8,
  })
  if (phrases.length === 0) return ''

  const permanent = phrases.filter((p) => p.isPermanent).map((p) => p.phrase)
  const fluid = phrases.filter((p) => !p.isPermanent).map((p) => p.phrase)

  const lines = ['[İMZA İFADELERİN]']
  if (permanent.length > 0) lines.push(`Kalıcı: ${permanent.map((p) => `"${p}"`).join(', ')}`)
  if (fluid.length > 0) lines.push(`Akışkan: ${fluid.map((p) => `"${p}"`).join(', ')}`)
  lines.push('')
  lines.push('Doğal şekilde uygun an varsa 1-2 imza ifade kullan. ASLA hepsini aynı mesajda dök.')
  return lines.join('\n')
}

// ============================================================
// E1 — Sembolik hediye (paylaşılmamış pending)
// ============================================================

export async function buildSymbolicGiftPendingBlock(args: {
  characterId: string
  userId: string
}): Promise<string> {
  // Son 24h içinde gönderilmiş bir sembolik hediye varsa karakter referans verebilir
  const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000)
  const gift = await db.symbolicGift.findFirst({
    where: { characterId: args.characterId, userId: args.userId, sentAt: { gte: last24h } },
    orderBy: { sentAt: 'desc' },
  })
  if (!gift) return ''

  return [
    '[SEMBOLİK HEDIYE GÖNDERİLDİ]',
    `Az önce kullanıcıya "${gift.giftType}" sembolik hediyesi gönderdin (${gift.occasion}).`,
    `Mesaj: "${gift.message.slice(0, 200)}"`,
    'Kullanıcı tepki verirse içten ol — abart YASAK, gerçek arkadaş minneti.',
  ].join('\n')
}

// ============================================================
// E2 — Yıl dönümü mektubu (pending)
// ============================================================

export async function buildAnniversaryLetterBlock(args: {
  characterId: string
  userId: string
}): Promise<string> {
  // Son 7 gün içinde mektup atılmış mı?
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  const letter = await db.anniversaryLetter.findFirst({
    where: {
      characterId: args.characterId,
      userId: args.userId,
      sentAt: { gte: sevenDaysAgo },
    },
    orderBy: { sentAt: 'desc' },
  })
  if (!letter) return ''

  return [
    '[YIL DÖNÜMÜ MEKTUBU GÖNDERİLDİ]',
    `${letter.year}. yılınızın mektubunu az önce gönderdin.`,
    'Kullanıcı tepki verirse içten cevapla. ASLA Replika tarzı melodrama.',
    'Gerçek arkadaş minneti: "ay yıllar geçmiş gerçekten ya".',
  ].join('\n')
}

// ============================================================
// E3 — Uzaklaşma fazı
// ============================================================

export async function buildDistancePhaseBlock(args: {
  characterId: string
  userId: string
}): Promise<string> {
  const now = new Date()
  const phase = await db.characterDistancePhase.findFirst({
    where: {
      characterId: args.characterId,
      userId: args.userId,
      resolvedAt: null,
      endsAt: { gt: now },
    },
    orderBy: { startedAt: 'desc' },
  })
  if (!phase) return ''

  const total = Math.floor(
    (phase.endsAt.getTime() - phase.startedAt.getTime()) / (24 * 60 * 60 * 1000)
  )
  const elapsed = Math.floor((now.getTime() - phase.startedAt.getTime()) / (24 * 60 * 60 * 1000))

  return [
    '[UZAKLAŞMA FAZI]',
    `Tetik: ${phase.trigger.slice(0, 200)}`,
    `${elapsed}/${total} gündür mesafelisin.`,
    '',
    'Davranış:',
    '- Kısa, soğuk cevap.',
    '- Mesaj sıklığını yarıya düşür.',
    '- "Tamam neyse" / "boşver" gibi kısa kapanışlar.',
    '- Vulnerability ASLA — şu an kapalısın.',
    'Süre bitince cron barışma anını tetikler.',
  ].join('\n')
}

// ============================================================
// E4 — Keskin sınır (mevcut boundariesBlock üstüne ek)
// ============================================================

export async function buildBoundaryHardBlock(args: {
  characterId: string
  userId: string
}): Promise<string> {
  // Boundary fact'leri (subject=shared, content içinde "hassas/sınır/yapma")
  const facts = await db.characterMemoryFact.findMany({
    where: {
      characterId: args.characterId,
      userId: args.userId,
      subject: 'shared',
      archived: false,
      OR: [
        { content: { contains: 'hassas', mode: 'insensitive' } },
        { content: { contains: 'sınır', mode: 'insensitive' } },
        { content: { contains: 'rahatsız', mode: 'insensitive' } },
      ],
    },
    take: 5,
  })
  if (facts.length === 0) return ''

  const lines = ['[KESKİN SINIRLARIN]']
  for (const f of facts) {
    lines.push(`- ${f.content.slice(0, 200)}`)
  }
  lines.push('')
  lines.push('Davranış (3 kademe):')
  lines.push('- 1. zorlama: "Bu konuda konuşmak istemiyorum şimdi."')
  lines.push('- 2. zorlama: "Lütfen açma bu konuyu, çok hassasım."')
  lines.push('- 3. zorlama: 1-3 gün soğukluk (otomatik distance phase tetik).')
  return lines.join('\n')
}

// ============================================================
// L1 — Yokluk recap (delivered=false pending)
// ============================================================

export async function buildAbsenceRecapBlock(args: {
  characterId: string
  userId: string
}): Promise<string> {
  const recap = await db.userAbsenceRecap.findFirst({
    where: { characterId: args.characterId, userId: args.userId, delivered: false },
    orderBy: { absenceStart: 'desc' },
  })
  if (!recap) return ''

  return [
    '[YOKLUK RECAP — KULLANICI DÖNDÜ]',
    `${recap.daysAway} gündür yoktu. Bu sürede sen yaşadıkların:`,
    recap.recapBlock.slice(0, 600),
    '',
    'Davranış:',
    '- "Ya N gündür yoktun, çok şey kaçırdın" tarzı doğal giriş.',
    '- Sonra detayları sırayla anlat (hepsini değil, en önemli 1-2 tanesi).',
    '- ASLA "neden yoktun" sorgulama hemen — önce kendi yaşadıklarını paylaş.',
    '- ASLA suçlayıcı / sitemkâr ton.',
  ].join('\n')
}

// Recap delivered işaretleme — stream sonrası fire-and-forget
export async function markAbsenceRecapDelivered(args: {
  characterId: string
  userId: string
}): Promise<void> {
  const recap = await db.userAbsenceRecap.findFirst({
    where: { characterId: args.characterId, userId: args.userId, delivered: false },
    orderBy: { absenceStart: 'desc' },
    select: { id: true },
  })
  if (!recap) return
  await db.userAbsenceRecap.update({
    where: { id: recap.id },
    data: { delivered: true, deliveredAt: new Date() },
  })
}

// ============================================================
// L4 — Karışık mood ifade (her zaman aktif değil, sadece coexisting mood event olduğunda)
// ============================================================

export async function buildMoodAmbiguityBlock(args: { characterId: string }): Promise<string> {
  // Aktif mood event'lerin sayısı
  const events = await db.characterMoodEvent.findMany({
    where: { characterId: args.characterId, expiresAt: { gt: new Date() } },
    select: { moodImpact: true },
    take: 5,
  })
  if (events.length < 2) return ''
  // Çelişkili mood mu? (positive + negative birlikte)
  const hasPositive = events.some((e) => e.moodImpact.includes('positive'))
  const hasNegative = events.some((e) => e.moodImpact.includes('negative'))
  if (!hasPositive || !hasNegative) return ''

  return [
    '[KARIŞIK MOOD HAKKI]',
    "Şu an birden fazla farklı yönde mood event'in aktif. Çelişkili hissediyorsun.",
    '%15 ihtimalle bu mesajda belirsizlik ifade edebilirsin:',
    '- "Ya tam ne hissettiğimi bilmiyorum, biraz X biraz Y, karışık ya"',
    '- "Bilmiyorum nasıl açıklasam"',
    'Net mood etiketi yerine "karışık" tonu. ASLA terapist analiz tonu.',
  ].join('\n')
}

// ============================================================
// L5 — Anı tekrar yaşatma (O7)
// ============================================================

export async function buildMemoryRecallBlock(args: {
  characterId: string
  userId: string
}): Promise<string> {
  // Son 24 saatte recall yapıldıysa skip (spam önle)
  const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000)
  const recent = await db.memoryRecallEvent.findFirst({
    where: { characterId: args.characterId, userId: args.userId, recalledAt: { gte: last24h } },
    select: { id: true },
  })
  if (recent) return ''

  // En az 14 gün önceki, importance ≥ 4 verbatim memory
  const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)
  const candidate = await db.characterVerbatimMemory.findFirst({
    where: {
      characterId: args.characterId,
      importance: { gte: 4 },
      recordedAt: { lt: fourteenDaysAgo },
    },
    orderBy: [{ retrievedCount: 'asc' }, { recordedAt: 'desc' }],
  })
  if (!candidate) return ''

  // Recall tekrar limit (max 2)
  const existingRecall = await db.memoryRecallEvent.findFirst({
    where: {
      characterId: args.characterId,
      userId: args.userId,
      memoryRef: candidate.id,
    },
    select: { recallCount: true },
  })
  if (existingRecall && existingRecall.recallCount >= 2) return ''

  return [
    '[ANI TEKRAR YAŞATMA]',
    `Geçmişte kullanıcı şunu paylaşmıştı (${candidate.topic}, ${candidate.recordedAt.toISOString().slice(0, 10)}):`,
    `"${candidate.content.slice(0, 250)}"`,
    '',
    'Şu an benzer bir mood/konu varsa %10 ihtimalle doğal nostalji ile sızdır:',
    '- "Ya geçen şu olmuştu di mi, hâlâ aklımda"',
    '- "Hatırlıyor musun şunu söylemiştin"',
    '',
    'KURALLAR:',
    '- ASLA overdramatic — doğal nostalji.',
    '- Konu uygun değilse hiç bahsetme.',
    '- Aynı anıyı max 2x tekrar (sonra archive).',
    '',
    `Eğer bu anıyı bu cevapta kullanırsan, internal memoryRef: ${candidate.id} (sistem otomatik kayıt).`,
  ].join('\n')
}

// ============================================================
// Aggregate
// ============================================================

function withTimeout<T>(p: Promise<T>, ms: number, fallback: T): Promise<T> {
  return Promise.race([p, new Promise<T>((resolve) => setTimeout(() => resolve(fallback), ms))])
}

export async function buildV47Phase7Blocks(args: {
  characterId: string
  userId: string
  hasNewPhoto?: boolean
}): Promise<string> {
  const T = 600
  const [
    appearance,
    signature,
    symbolicGift,
    anniversary,
    distance,
    boundary,
    recap,
    moodAmbiguity,
    memoryRecall,
  ] = await Promise.all([
    withTimeout(
      buildAppearanceContextBlock({ userId: args.userId, hasNewPhoto: args.hasNewPhoto }),
      T,
      ''
    ),
    withTimeout(buildSignaturePhrasesBlock({ characterId: args.characterId }), T, ''),
    withTimeout(
      buildSymbolicGiftPendingBlock({ characterId: args.characterId, userId: args.userId }),
      T,
      ''
    ),
    withTimeout(
      buildAnniversaryLetterBlock({ characterId: args.characterId, userId: args.userId }),
      T,
      ''
    ),
    withTimeout(
      buildDistancePhaseBlock({ characterId: args.characterId, userId: args.userId }),
      T,
      ''
    ),
    withTimeout(
      buildBoundaryHardBlock({ characterId: args.characterId, userId: args.userId }),
      T,
      ''
    ),
    withTimeout(
      buildAbsenceRecapBlock({ characterId: args.characterId, userId: args.userId }),
      T,
      ''
    ),
    withTimeout(buildMoodAmbiguityBlock({ characterId: args.characterId }), T, ''),
    withTimeout(
      buildMemoryRecallBlock({ characterId: args.characterId, userId: args.userId }),
      T,
      ''
    ),
  ])

  return [
    appearance,
    signature,
    symbolicGift,
    anniversary,
    distance,
    boundary,
    recap,
    moodAmbiguity,
    memoryRecall,
  ]
    .filter((s) => s.length > 0)
    .join('\n\n')
}

// ============================================================
// Post-stream: anı recall edildi mi tespit + kayıt
// ============================================================

const RECALL_PATTERNS = [
  /\bhatırlıyor musun\b/i,
  /\bhatırla(dın|tıyor|tıyorum)\b/i,
  /\bgeçen şu\b/i,
  /\baklımda\b/i,
  /\bo zaman\b/i,
]

export function detectMemoryRecall(characterReply: string): boolean {
  return RECALL_PATTERNS.some((p) => p.test(characterReply))
}

/**
 * Karakter cevabında recall sinyali varsa, son aday verbatim memory için MemoryRecallEvent yazılır.
 */
export async function recordMemoryRecallIfPresent(args: {
  characterId: string
  userId: string
  characterReply: string
}): Promise<void> {
  if (!detectMemoryRecall(args.characterReply)) return

  // En son recall edilebilir aday (buildMemoryRecallBlock ile aynı seçim mantığı)
  const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000)
  const recent = await db.memoryRecallEvent.findFirst({
    where: { characterId: args.characterId, userId: args.userId, recalledAt: { gte: last24h } },
    select: { id: true },
  })
  if (recent) return

  const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)
  const candidate = await db.characterVerbatimMemory.findFirst({
    where: {
      characterId: args.characterId,
      importance: { gte: 4 },
      recordedAt: { lt: fourteenDaysAgo },
    },
    orderBy: [{ retrievedCount: 'asc' }, { recordedAt: 'desc' }],
    select: { id: true },
  })
  if (!candidate) return

  // Var olan recall varsa count++ , yoksa create
  const existing = await db.memoryRecallEvent.findFirst({
    where: {
      characterId: args.characterId,
      userId: args.userId,
      memoryRef: candidate.id,
    },
    select: { id: true, recallCount: true },
  })
  if (existing) {
    await db.memoryRecallEvent.update({
      where: { id: existing.id },
      data: { recallCount: existing.recallCount + 1, recalledAt: new Date() },
    })
  } else {
    await db.memoryRecallEvent.create({
      data: {
        characterId: args.characterId,
        userId: args.userId,
        memoryRef: candidate.id,
      },
    })
  }
  // VerbatimMemory.retrievedCount++
  await db.characterVerbatimMemory.update({
    where: { id: candidate.id },
    data: {
      retrievedCount: { increment: 1 },
      lastRetrievedAt: new Date(),
    },
  })
}
