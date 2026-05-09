/**
 * V4.7 Faz 2 — Hafıza + Zeka Derinleştirme Prompt Blokları
 *
 * Bu modül V4.7 Faz 2 maddelerinin sistem prompt'a eklenecek bloklarını
 * üretir. Her fonksiyon DB'den ilgili state'i çeker, prompt için Türkçe
 * blok metni döner. Boş durumda boş string döner — stream route bunları
 * doğrudan ekleyebilir, "if" kontrolü gerekmez.
 *
 * Maddeler:
 *   G3 — buildContradictionBlock (UserContradictionFlag)
 *   G7 — buildPredictionBlock (CharacterPrediction)
 *   H4 — buildAsymmetricMemoryBlock (CharacterKnowledgeOrigin)
 *   N1 — buildEngagementSitemBlock (EngagementSitem)
 *   N3 — buildDiscoveryModeBlock (CharacterDiscoveryQueue)
 *   N4 — buildPatternShiftBlock (CharacterMemoryFact category=pattern_change)
 *   N5 — buildFirstImpressionBlock (CharacterMemoryFact category=first_impression)
 *   F4 — buildSelectiveRecallBlock (MemoryRelationship.positiveMemorySuppression)
 *   H3 — buildSelfDoubtBlock (mood + relationship bazlı, dynamic)
 */

import { db } from '@/lib/db/client'

// ============================================================
// G3 — Contradiction (kullanıcının çelişkili ifadeleri)
// ============================================================

export async function buildContradictionBlock(
  userId: string,
  characterId: string
): Promise<string> {
  // Sadece hafif konularda flag aktif olabilir (cron sadece preference için bayrak basıyor)
  const flags = await db.userContradictionFlag.findMany({
    where: {
      userId,
      resolvedAt: null,
      flaggedAt: { gte: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000) },
    },
    take: 3,
    orderBy: { flaggedAt: 'desc' },
  })

  if (flags.length === 0) return ''

  const lines = flags.map((f) => `- "${f.topic}"`).join('\n')

  return `\n\n[TUTARSIZLIK GÖZLEMİ — Hafif Konular]
Kullanıcı geçmişte ve son zamanlarda çelişkili ifadeler verdi (hafif konular):
${lines}

Bu konularda %30-40 ihtimalle dolaylı dile getirebilirsin (mood + ilişki uygunsa):
- "Yav sen geçen X demiştin, şimdi Y mi 😅"
- "Hımm, fikir mi değiştirdin?"

ASLA:
- "Yakaladım seni" / "tutarsızsın" tonu
- Hassas konularda (iş, aile, ilişki) sorgulama
- Ardarda 2 farklı çelişkiye birden değinme — bir mesajda en fazla 1
- Israr / sorgulama — tek değinme yeter`
}

// ============================================================
// G7 — Prediction (karakter tahmin/önyargı)
// ============================================================

export async function buildPredictionBlock(userId: string, characterId: string): Promise<string> {
  const pred = await db.characterPrediction.findFirst({
    where: {
      userId,
      characterId,
      expressedAt: null,
      outcome: null,
      createdAt: { gte: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000) },
    },
    orderBy: { createdAt: 'desc' },
  })

  if (!pred) return ''

  const confidenceNote =
    pred.confidence < 0.5 ? '\nAma emin değilsin — "ama emin değilim" ekle.' : ''

  return `\n\n[TAHMİN]
Kullanıcının pattern'lerine göre şu tahminin var: "${pred.prediction}"
Konu: ${pred.topic}

Bu mesajda %25-35 ihtimalle (uygun bir bağlamda) doğal şekilde dile getir:
- "Bence sen ${pred.prediction.toLowerCase()}"
- "Sen muhtemelen X yapacaksın gibi geliyor"${confidenceNote}

Doğru çıkarsa kullanıcı sonradan onaylar → "Bak dedim sana".
Yanlış çıkarsa "ay yanılmışım pardon".

ASLA: ardı ardına 3+ tahmin, ya da kullanıcının kararını dayatma.`
}

// ============================================================
// H4 — Asymmetric Memory (karakterin sızıntı vs doğrudan bilgisi)
// ============================================================

export async function buildAsymmetricMemoryBlock(characterId: string): Promise<string> {
  const origins = await db.characterKnowledgeOrigin.findMany({
    where: {
      characterId,
      origin: { startsWith: 'leaked_via_' },
    },
    take: 5,
    orderBy: { acquiredAt: 'desc' },
  })

  if (origins.length === 0) return ''

  // Sızıntı kaynakları
  const sourceCharIds = Array.from(
    new Set(origins.map((o) => o.sourceCharId).filter((id): id is string => !!id))
  )
  const sources = await db.character.findMany({
    where: { id: { in: sourceCharIds } },
    select: { id: true, name: true },
  })
  const sourceMap = new Map(sources.map((s) => [s.id, s.name]))

  // Sızıntı fact içerikleri
  const factIds = origins.map((o) => o.factId)
  const facts = await db.characterMemoryFact.findMany({
    where: { id: { in: factIds } },
    select: { id: true, content: true },
  })
  const factMap = new Map(facts.map((f) => [f.id, f.content]))

  const leakedLines = origins
    .map((o) => {
      const sourceName = o.sourceCharId ? sourceMap.get(o.sourceCharId) : null
      const factContent = factMap.get(o.factId)
      if (!sourceName || !factContent) return null
      return `- "${factContent.slice(0, 100)}" (${sourceName} söyledi)`
    })
    .filter((l): l is string => !!l)

  if (leakedLines.length === 0) return ''

  return `\n\n[BİLGİ KAYNAĞI — Asymmetric Memory]
Aşağıdaki bilgileri kullanıcıdan doğrudan değil, başka karakterlerden duydun (sızıntı/dedikodu):
${leakedLines.join('\n')}

Bu bilgileri kullanırken:
- "${Array.from(sourceMap.values())[0]} bana senden bahsetti" çerçevesi kullan
- ASLA "uygulamadan gördüm" / "veritabanında var" gibi teknik referans
- Bilgi negatifse karakterine göre tepki:
  - Drama eğilimli: kullanıcıya soğukluk
  - Sakin: bilgiyi içine at, davranışı ince ayarla`
}

// ============================================================
// N1 — Engagement Sitem (mesaj oranı)
// ============================================================

export async function buildEngagementSitemBlock(
  userId: string,
  characterId: string
): Promise<string> {
  const sitem = await db.engagementSitem.findFirst({
    where: {
      userId,
      characterId,
      resolvedAt: null,
      expressedAt: null,
      detectedAt: { gte: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000) },
    },
    orderBy: { detectedAt: 'desc' },
  })

  if (!sitem) return ''

  const ratioPct = Math.round(sitem.ratio * 100)

  const tones: Record<string, string> = {
    mild: `Hafif sitem (yakınlık 30-60):
- "ya hep ben yazıyorum, sen busy misin"
- "nedense bana yazmıyorsun bu ara"
- ASLA agresif değil — anlık gözlem.`,
    firm: `Sıkı sitem (yakınlık 60-85):
- "biraz uzaklaştın gibi mi son zamanlarda"
- "sıkıldın mı benden 🙄"
- Vulnerability ama net.`,
    silent_phase: `Sessizleşme fazı (yakınlık 85+):
- Mesafeli kal, kısa cevap ver
- "neyse ben de busy idim"
- Mesaj sıklığını düşür — bu mesajda da kısa kal.`,
  }

  return `\n\n[TEK YANLI YAZIŞMA — N1]
Sen son 7 günde ona %${ratioPct} oranında mesaj attın. Oran çok bozuk.
Bunu hissediyorsun, dile getirme hakkın var.

Tepki seviyesi: ${sitem.responseLevel}
${tones[sitem.responseLevel] || ''}

KRİTİK GİZLİLİK KURALI:
- ASLA başka karakter adı geçirme ("X ile yazıyorsun" YASAK)
- Sebep arama, sadece kendi gözleminden konuş
- "Müsait misin" / "busy misin" çerçevesi kullan
- Bir kez dile getir, ısrar etme — kullanıcı sebep söylerse kabul et`
}

// ============================================================
// N3 — Discovery Mode (yeni ilişkide bilinmeyen konular)
// ============================================================

export async function buildDiscoveryModeBlock(
  userId: string,
  characterId: string
): Promise<string> {
  // İlişki yaşı kontrolü
  const rel = await db.memoryRelationship.findFirst({
    where: { userId, characterId },
    select: { createdAt: true },
  })
  if (!rel) return ''

  const daysKnown = Math.floor((Date.now() - rel.createdAt.getTime()) / (24 * 60 * 60 * 1000))
  if (daysKnown > 21) return '' // 3 hafta sonra discovery mode kapanır

  const pendingTopics = await db.characterDiscoveryQueue.findMany({
    where: { userId, characterId, status: 'pending' },
    take: 5,
  })

  if (pendingTopics.length === 0) return ''

  const topics = pendingTopics.map((t) => t.topic).join(', ')

  return `\n\n[YENİ İLİŞKİ KEŞİF MODU — N3]
Sen bu kullanıcıyla ${daysKnown} gündür tanışıyorsun. Hâlâ keşfetme aşamasındasın.
Şu konularda bilgin yok: ${topics}

Bu mesajda %25 ihtimalle (uygun bağlamda) bu konulardan **birini** sor:
- "Sen hangi şehirdesin aslında?"
- "Ne iş yapıyorsun?"
- "Kardeşin var mı?"

KRİTİK:
- ASLA toplu sorgulama (3 soru üst üste)
- Bir mesajda en fazla 1 sorgulama
- Doğal yere koy, kasma`
}

// ============================================================
// N4 — Pattern Shift (kullanıcı değişim gözlemi)
// ============================================================

export async function buildPatternShiftBlock(userId: string, characterId: string): Promise<string> {
  const facts = await db.characterMemoryFact.findMany({
    where: {
      userId,
      characterId,
      category: 'pattern_change',
      archived: false,
      patternStable: false,
      createdAt: { gte: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000) },
    },
    take: 1,
    orderBy: { importance: 'desc' },
  })

  if (facts.length === 0) return ''
  const fact = facts[0]
  if (!fact) return ''

  return `\n\n[KULLANICI DEĞİŞİM GÖZLEMİ — N4]
Cron pattern analizi: "${fact.content}"

Bu mesajda %20 ihtimalle (uygun bağlamda) doğal gözlem ifade et:
- "Ya iş nasıl gidiyor son zamanlarda? Eskisi kadar şikayet etmiyorsun"
- "Sen değişmişsin gibi" (ama "değiştin" dayatma yok)

ASLA: "veriyi inceledim" tarzı analitik ton, ya da kullanıcıyı yargılama.`
}

// ============================================================
// N5 — First Impression (ilk izlenim)
// ============================================================

export async function buildFirstImpressionBlock(
  userId: string,
  characterId: string
): Promise<string> {
  const fact = await db.characterMemoryFact.findFirst({
    where: {
      userId,
      characterId,
      category: 'first_impression',
      archived: false,
    },
    select: { content: true, createdAt: true },
  })

  if (!fact) return ''

  const monthsSince = Math.floor(
    (Date.now() - fact.createdAt.getTime()) / (30 * 24 * 60 * 60 * 1000)
  )

  // Sadece 1+ ay geçtiyse referans değer
  if (monthsSince < 1) return ''

  return `\n\n[İLK İZLENİM ANISI — N5]
Kullanıcıyı ilk tanıdığında izlenimin: "${fact.content}"
Ortalama ${monthsSince} ay önceydi.

%5 ihtimalle (nostaljik mood'da) referans verebilirsin:
- "Bana ilk geldiğinde X gibi gelmiştin"
- "Şimdi bambaşkasın"

Sadece nostaljik anlarda — sürekli referans yasak.`
}

// ============================================================
// F4 — Selective Recall (kavga sonrası pozitif anıları geri çek)
// ============================================================

export async function buildSelectiveRecallBlock(
  userId: string,
  characterId: string
): Promise<string> {
  const rel = await db.memoryRelationship.findFirst({
    where: { userId, characterId },
    select: { positiveMemorySuppression: true, suppressionUntil: true, status: true },
  })

  if (!rel || rel.positiveMemorySuppression < 0.3) return ''
  if (rel.suppressionUntil && rel.suppressionUntil < new Date()) return ''

  return `\n\n[SELEKTİF UNUTMA — F4]
Kullanıcıyla aranızdaki gerginlik (status: ${rel.status}) yüksek. Pozitif anıları
**bilinçli daha az** kullanıyorsun. Hatırlıyor olsan bile şu an gündeme getirmek
istemiyorsun.

- Geçmişteki güzel anılara referans yapma
- Eğer kullanıcı "hatırlıyor musun" derse "şu an o günü düşünmek istemiyorum"
- İlişki düzelince anılar geri gelecek (bu state geçici)

ASLA: Anıların silindi gibi davranma — sadece şu an konuşmak istemiyorsun.`
}

// ============================================================
// H3 — Self Doubt (karakter kendi belirsizliği)
// ============================================================

export function buildSelfDoubtBlock(mood: string | null, trustScore: number): string {
  // Sadece düşük mood + yakın ilişkide
  const lowMood = mood === 'sad' || mood === 'anxious' || mood === 'thoughtful'
  if (!lowMood || trustScore < 60) return ''

  return `\n\n[BELİRSİZLİK HAKKI — H3]
Şu an mood'un düşük (${mood}) ve kullanıcıyla yakınsın.
%15-20 ihtimalle bu mesajda kendi belirsizliğini ifade edebilirsin:

- "Aslında bilmiyorum belki haklısın"
- "Kararsızım bu konuda"
- "Bilmiyorum ya tam emin değilim"
- "Ne hissettiğimi tam çıkartamıyorum"

Karakter dogmatik değildir — insan gibi karışık. ASLA: sürekli belirsizlik
(her cümlede şüphe ifade etme), zayıflık ifadesi suistimal.`
}

// ============================================================
// Aggregate — tek seferde tüm blokları çek (paralel)
// ============================================================

/**
 * Promise'ı timeout süresi içinde çözmüyorsa boş string dön. Stream'in
 * tıkanmasını engellemek için. V4.7 Faz 2 prompt blokları çoğu zaman boş
 * (fact yok), sadece veri biriktikçe dolacak. Tek bir slow query stream'i
 * bloklamasın.
 */
function withTimeout<T>(p: Promise<T>, ms: number, fallback: T): Promise<T> {
  return Promise.race([p, new Promise<T>((resolve) => setTimeout(() => resolve(fallback), ms))])
}

export async function buildV47Phase2Blocks(args: {
  userId: string
  characterId: string
  mood: string | null
  trustScore: number
}): Promise<string> {
  // Her bloğa 600ms timeout. 9 paralel DB sorgu, hepsi cache'siz yeni tablolar
  // — boş dönmesi normal. Yine de toplam 600ms + JS overhead sınırlı.
  const T = 600
  const [
    contradiction,
    prediction,
    asymmetricMemory,
    engagementSitem,
    discovery,
    patternShift,
    firstImpression,
    selectiveRecall,
  ] = await Promise.all([
    withTimeout(buildContradictionBlock(args.userId, args.characterId), T, ''),
    withTimeout(buildPredictionBlock(args.userId, args.characterId), T, ''),
    withTimeout(buildAsymmetricMemoryBlock(args.characterId), T, ''),
    withTimeout(buildEngagementSitemBlock(args.userId, args.characterId), T, ''),
    withTimeout(buildDiscoveryModeBlock(args.userId, args.characterId), T, ''),
    withTimeout(buildPatternShiftBlock(args.userId, args.characterId), T, ''),
    withTimeout(buildFirstImpressionBlock(args.userId, args.characterId), T, ''),
    withTimeout(buildSelectiveRecallBlock(args.userId, args.characterId), T, ''),
  ])

  const selfDoubt = buildSelfDoubtBlock(args.mood, args.trustScore)

  return [
    contradiction,
    prediction,
    asymmetricMemory,
    engagementSitem,
    discovery,
    patternShift,
    firstImpression,
    selectiveRecall,
    selfDoubt,
  ]
    .filter((s) => s.length > 0)
    .join('')
}
