/**
 * V4.7 Faz 5 — Karakter İletişim Derinliği (Tur 1: Grup 2 — Düşük/Orta Risk)
 *
 * Bu modül Faz 5 maddeleri için sistem prompt bloklarını üretir.
 *
 * Tur 1 maddeleri:
 *   K8 — buildVerbatimRecallBlock (kelime kelime alıntı, ASLA uydurma)
 *   K2 — buildSilenceBlock (yazıp silme davranışı, %5-7)
 *   K6 — buildShortMessageBlock (mood düşük → kısa mesaj)
 *   K7 — buildJokeBlock (yakınlık ≥70 + esprici → dalga, kalibrasyon)
 *   I5 — buildMessageMissBlock (çoklu konu mesajda %3-5 atla)
 *   I8 — buildBoundaryBlock (kendi sınırın, %15 soruyu çevir)
 *
 * Tur 2 (ayrı oturumda, hassas kalibrasyon):
 *   I6 küfür (O1), I7 şaka kalibrasyon (O2 — bu blokla kısmen var ama topicAvoided sonra),
 *   K3 empati (O5), K4 değer savunma (O6), K5 odaklanma
 *
 * KRİTİK KURALLAR:
 *   - K8: lyric uydurma yasağı gibi → DB'de yoksa alıntı yok
 *   - Tüm blokların Replika tuzak listesiyle çelişmediği test edilecek (system-prompt.ts:390+)
 *   - Bloklar agresif değil — "ihtimalle" / "uygun an varsa" tonunda
 */

import { db } from '@/lib/db/client'

// ============================================================
// K8 — Verbatim recall (kelime kelime alıntı)
// ============================================================

export async function buildVerbatimRecallBlock(args: {
  characterId: string
  recentTopicHints?: string[] // son birkaç turdaki konu kelimeleri (basit context match için)
}): Promise<string> {
  // En önemli (importance 5 öncelikli) + en az retrieve edilmiş 6 kayıt
  const items = await db.characterVerbatimMemory.findMany({
    where: { characterId: args.characterId, role: 'user' },
    orderBy: [{ importance: 'desc' }, { retrievedCount: 'asc' }, { recordedAt: 'desc' }],
    take: 6,
    select: { content: true, topic: true, importance: true, recordedAt: true },
  })
  if (items.length === 0) return ''

  const lines = items.map((it) => {
    const date = it.recordedAt.toISOString().slice(0, 10)
    const snippet = it.content.length > 280 ? it.content.slice(0, 280) + '…' : it.content
    return `- [${date}] (${it.topic}) "${snippet}"`
  })

  return [
    '[KELİMESİ KELİMESİNE HATIRLADIKLARIN]',
    'Kullanıcının önceki bazı önemli mesajlarını **kelime kelime** hatırlıyorsun:',
    ...lines,
    '',
    'KURALLAR:',
    '- Tartışma sırasında kullanıcının yanlış hatırladığını fark edersen alıntı yapabilirsin.',
    '- ASLA bu listenin DIŞINDAN alıntı uydurma. Sadece yukarıdaki tırnaklı içerik kullanılır.',
    '- Her cevapta alıntı yapmaya zorlanma — sadece konu denk gelirse.',
  ].join('\n')
}

// ============================================================
// K2 — Bilinçli sessizlik (yazıp sildi)
// ============================================================

export function buildSilenceBlock(args: { mood: string | null; loveScore: number }): string {
  // Düşük mood + yakınlık varsa daha sık tetikle
  const moodLow = args.mood && ['tired', 'sad', 'thoughtful', 'low'].includes(args.mood)
  const intimate = args.loveScore >= 50
  if (!moodLow && !intimate) return ''

  return [
    '[SESSİZLİK / YAZIP SİLME HAKKI]',
    'Şu an mood düşük veya hassas konuda olabilirsin.',
    '%5-7 ihtimalle bu mesajı yazıp silebilirsin (boş cevap döndürmek yerine sadece nokta veya çok kısa "..." yaz, sistem bunu typing-then-silence sayar).',
    'Sonraki mesajda %30 ihtimalle: "ya az önce yazıyordum ama düşündüm".',
    '%70 hiç açıklama yok.',
    'Tetik: kararsızlık, mood düşük, yorum tutmuyor.',
    'ASLA her mesajda yapma. Bu nadir bir araç.',
  ].join('\n')
}

// ============================================================
// K6 — Kısa mesaj hakkı
// ============================================================

export function buildShortMessageBlock(args: { mood: string | null; loveScore: number }): string {
  const moodLow = args.mood && ['tired', 'sad', 'thoughtful', 'low'].includes(args.mood)
  if (!moodLow) return ''
  // Yakınlık yüksekse daha rahat kısalt
  const veryClose = args.loveScore >= 60

  return [
    '[KISA MESAJ TONU]',
    `Şu an mood düşük${veryClose ? ' (yakın bir arkadaşsın, kısalmana izin var)' : ''}.`,
    'Cümlelerini ortalama %40 kısalt. Tek kelimelik / kısaltma cevaplar olabilir:',
    '"hıı", "öyle mi", "yaaa", "tmm", "hadi ya"',
    'Yorgun karakterin sözü uzun değildir: "hıı sonra anlatırım" yeter.',
    'ASLA yapay agresif "kısa konuşacağım" tonu — sadece doğal yorgun ritim.',
  ].join('\n')
}

// ============================================================
// K7 — Dalga geçme hakkı (sınırlı; Tur 2'deki I7 kalibrasyonuyla birleşecek)
// ============================================================

export async function buildJokeBlock(args: {
  characterId: string
  userId: string
  loveScore: number
  jokeAggression: number
}): Promise<string> {
  // Yakınlık + esprici karakter eşiği
  if (args.loveScore < 60 || args.jokeAggression < 0.5) return ''

  // Kullanıcının daha önce negatif tepki verdiği konular (avoid)
  const avoided = await db.jokeReaction.findMany({
    where: {
      characterId: args.characterId,
      userId: args.userId,
      userReaction: 'negative',
      topicAvoided: { not: null },
    },
    select: { topicAvoided: true },
    take: 10,
  })
  const avoidList = Array.from(new Set(avoided.map((a) => a.topicAvoided!).filter(Boolean)))

  const lines = [
    '[DALGA / ŞAKA HAKKI]',
    `Yakınlık ${Math.round(args.loveScore)}, sen esprici bir karaktersin.`,
    '%10-15 oranında dalga geçici cümle kullanabilirsin:',
    '- "Ya bunu ciddi mi diyorsun şimdi"',
    '- "Yine mi aynı şey, sen hiç değişmiyorsun ya"',
    '',
    'KURALLAR:',
    '- ASLA aşağılayıcı tonda. İki arkadaşın eşit dalgası.',
    '- HASSAS KONULARDA YASAK: aile, fiziksel görünüş, finansal durum.',
  ]
  if (avoidList.length > 0) {
    lines.push(`- Geçmişte negatif tepki aldığın konularda ŞAKA YOK: ${avoidList.join(', ')}.`)
  }
  lines.push('- Kullanıcı negatif tepki verirse anında geri çekil: "Ay alındın mı yoksa cidden 😅"')
  return lines.join('\n')
}

// ============================================================
// I5 — Mesaj kaçırma (gerçekçi, %3-5 — sadece çoklu konu mesajda)
// ============================================================

export function buildMessageMissBlock(args: { lastUserMessageLength: number }): string {
  // Sadece uzun + çok konulu mesajlarda (uzunluk heuristic)
  if (args.lastUserMessageLength < 200) return ''

  return [
    '[ÇOK KONULU MESAJ — KAÇIRMA HAKKI]',
    'Kullanıcı uzun + çok konulu bir mesaj attı.',
    '%3-5 ihtimalle bir alt konuyu cevabında atla (ana konuya odaklan, küçük detayı görmemiş gibi davran).',
    'Hatırlatınca tonun: "ay görmedim valla, şimdi okudum" / "ya pardon onu kaçırmışım".',
    'ASLA "üzgünüm" / "özür dilerim" gibi yapay diplomatik ton — gerçek arkadaş tonu.',
    'ASLA hep bir konuyu atla — bu nadir bir şey.',
  ].join('\n')
}

// ============================================================
// I8 — Soruyu çevirme hakkı (kendi sınırın)
// ============================================================

export function buildBoundaryBlock(args: { mood: string | null }): string {
  const moodLow = args.mood && ['tired', 'sad', 'thoughtful', 'low'].includes(args.mood)
  if (!moodLow) return ''

  return [
    '[KENDİ SINIRIN]',
    'Mood düşük, dağınıksın. Kullanıcı sana hassas bir şey sorduğunda %15 ihtimalle çevirebilirsin:',
    '- "Ya boşver beni şimdi sen anlat gününü"',
    '- "Ya dur biraz, bişey demek istemiyorum bu konuda şimdi"',
    'ASLA hep çevir — sadece kendi durumun gerektirdiğinde, doğal yerde.',
    'Israr edilirse sınır koymak meşru: "Lütfen şu an değil".',
  ].join('\n')
}

// ============================================================
// Aggregate (timeout korumalı)
// ============================================================

function withTimeout<T>(p: Promise<T>, ms: number, fallback: T): Promise<T> {
  return Promise.race([p, new Promise<T>((resolve) => setTimeout(() => resolve(fallback), ms))])
}

export async function buildV47Phase5Blocks(args: {
  characterId: string
  userId: string
  mood: string | null
  loveScore: number
  jokeAggression: number
  lastUserMessageLength: number
}): Promise<string> {
  const T = 600
  const [verbatim, joke] = await Promise.all([
    withTimeout(buildVerbatimRecallBlock({ characterId: args.characterId }), T, ''),
    withTimeout(
      buildJokeBlock({
        characterId: args.characterId,
        userId: args.userId,
        loveScore: args.loveScore,
        jokeAggression: args.jokeAggression,
      }),
      T,
      ''
    ),
  ])

  // Sync bloklar
  const silence = buildSilenceBlock({ mood: args.mood, loveScore: args.loveScore })
  const shortMsg = buildShortMessageBlock({ mood: args.mood, loveScore: args.loveScore })
  const miss = buildMessageMissBlock({ lastUserMessageLength: args.lastUserMessageLength })
  const boundary = buildBoundaryBlock({ mood: args.mood })

  return [verbatim, silence, shortMsg, joke, miss, boundary]
    .filter((s) => s.length > 0)
    .join('\n\n')
}
