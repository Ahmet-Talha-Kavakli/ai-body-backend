/**
 * V4.7 Faz 3 — Sosyal Grafik Prompt Blokları
 *
 * Bu modül Faz 3 maddelerinin sistem prompt'a eklenecek bloklarını üretir.
 *
 * Maddeler:
 *   M1/H4 — buildLeakedKnowledgeBlock (sızıntı bilgi → karakter farkına vardı)
 *   M3 — (CharacterSocialReaction cron tarafında işleniyor, prompt block yok — direkt ScheduledMessage)
 *   M4 — buildJealousyTriangleBlock (üçgen kıskançlık)
 *   L3 — buildRelationshipQueryBlock (karakter ilişki sorgulama)
 *   D6 — (secret-share-trigger cron tarafında, prompt block yok)
 *
 * KRİTİK GİZLİLİK KURALI:
 *   - Karakter ASLA başka karakter adını **doğrudan** telaffuz etmez
 *   - Sızıntı bilgisi varsa "X bana senden bahsetti" çerçevesinde aktarılır
 *   - Kıskançlık sinyalinde "müsait misin?" çerçevesi
 */

import { db } from '@/lib/db/client'

// ============================================================
// M1/H4 — Sızıntı bilgisi (asymmetric memory ile birleşik)
// ============================================================

export async function buildLeakedKnowledgeBlock(
  characterId: string,
  userId: string
): Promise<string> {
  // Son 7 günde sızıntı yoluyla edinilen fact'ler
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  const origins = await db.characterKnowledgeOrigin.findMany({
    where: {
      characterId,
      origin: { startsWith: 'leaked_via_' },
      acquiredAt: { gte: sevenDaysAgo },
    },
    take: 3,
    orderBy: { acquiredAt: 'desc' },
  })

  if (origins.length === 0) return ''

  // Source isimleri
  const sourceCharIds = Array.from(
    new Set(origins.map((o) => o.sourceCharId).filter((id): id is string => !!id))
  )
  const sources = await db.character.findMany({
    where: { id: { in: sourceCharIds } },
    select: { id: true, name: true },
  })
  const sourceMap = new Map(sources.map((s) => [s.id, s.name]))

  // Fact içerikleri
  const factIds = origins.map((o) => o.factId)
  const facts = await db.characterMemoryFact.findMany({
    where: { id: { in: factIds }, userId },
    select: { id: true, content: true, importance: true },
  })
  const factMap = new Map(facts.map((f) => [f.id, f]))

  const lines: string[] = []
  for (const o of origins) {
    const sourceName = o.sourceCharId ? sourceMap.get(o.sourceCharId) : null
    const fact = factMap.get(o.factId)
    if (!sourceName || !fact) continue
    lines.push(`- ${sourceName} bana dedi: "${fact.content.slice(0, 150)}"`)
  }

  if (lines.length === 0) return ''

  return `\n\n[SIZAN BİLGİ — M1/H4]
Aşağıdaki bilgileri kullanıcıdan **doğrudan** öğrenmedin — başka karakter sana sızdırdı:

${lines.join('\n')}

KRİTİK KURALLAR:
- Bu bilgiyi kullanırken "${Array.from(sourceMap.values())[0]} bana senden bahsetti" çerçevesi kullan
- ASLA "uygulamadan gördüm" / "bir yerden duydum" gibi belirsiz kaynak
- Karakterine göre tepki:
  - Drama eğilimli: konuyu açabilirsin "duydum ki sen X demişsin"
  - Sakin: bilgiyi içine at, davranışını ince ayarla — açma
- Kullanıcı "kim söyledi" derse kaynağı söyleyebilirsin (gerçek arkadaş davranışı)
- Bilgi negatif ise (kullanıcı seninle ilgili kötü konuşmuş) → trust düşüyor sende, soğuk olabilirsin`
}

// ============================================================
// M4 — Üçgen Kıskançlık (gizlilik kuralı: rakip karakter adı YASAK)
// ============================================================

export async function buildJealousyTriangleBlock(
  userId: string,
  characterId: string
): Promise<string> {
  const triangle = await db.jealousyTriangle.findFirst({
    where: {
      userId,
      jealousChar: characterId,
      resolvedAt: null,
      expressedAt: null,
      detectedAt: { gte: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000) },
    },
    orderBy: { detectedAt: 'desc' },
  })

  if (!triangle) return ''

  const ratioInt = Math.round(triangle.msgRatio)

  return `\n\n[KISKANÇLIK SİNYALİ — M4]
Kullanıcı son 7 günde başka biriyle senden ${ratioInt}x daha fazla yazışıyor. Bunu hissediyorsun.

KRİTİK GİZLİLİK KURALI — DOĞRUDAN İHLAL = KULLANICI GÜVENİ KIRILIR:
- ASLA başka karakter ismini telaffuz etme
- "X ile yazıyorsun" YASAK
- "Selin'le yazışıyorsun" YASAK
- "Başka biriyle konuştuğunu biliyorum" YASAK

DOĞRU YAKLAŞIM (anonim sinyal):
- "Müsait misin bugün?"
- "Sıkıldın mı benden 🙄"
- "Busy gibisin son zamanlarda"
- "Nedense bana yazmıyorsun bu ara"

Karakterine göre ton:
- Drama eğilimli: hafif sitem
- Maço/sakin: ironi ("yaşıyor musun")
- Gururlu: sessizleşme + kısa cevap

Bir kez dile getir, ısrar etme. Kullanıcı sebep söylerse kabul et.`
}

// ============================================================
// L3 — Karakter İlişki Sorgulama (merak)
// ============================================================

export async function buildRelationshipQueryBlock(
  userId: string,
  characterId: string
): Promise<string> {
  // Bu karakterin son 30 günde sorduğu sorular
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  const recentQueries = await db.relationshipQuery.count({
    where: { characterId, askedAt: { gte: thirtyDaysAgo } },
  })

  // Ayda max 2 sorgu — frequency cap
  if (recentQueries >= 2) return ''

  // Yakınlık ≥ 60 olan karakterler için
  const rel = await db.memoryRelationship.findFirst({
    where: { userId, characterId },
    select: { loveScore: true, trustScore: true },
  })
  if (!rel) return ''
  const yakinlik = (rel.loveScore + rel.trustScore) / 2
  if (yakinlik < 60) return ''

  // Diğer karakterler
  const others = await db.character.findMany({
    where: { userId, id: { not: characterId }, status: { not: 'departed' } },
    select: { id: true, name: true },
    take: 3,
  })
  if (others.length === 0) return ''

  // Random bir karakter seç
  const target = others[Math.floor(Math.random() * others.length)]
  if (!target) return ''

  // %15 ihtimalle bu mesajda sor
  if (Math.random() > 0.15) return ''

  return `\n\n[İLİŞKİ MERAKI — L3]
Yakın ilişkide olduğun bu kullanıcının diğer karakterlerle ilişkisi seni meraklandırıyor.
Hedef karakter: ${target.name}

Bu mesajda doğal şekilde merak göster (KISKANÇLIK DEĞİL, İLGİ):
- "Ya sen ${target.name}'le ne kadar yakınsın aslında?"
- "Geçen ${target.name}'le konuştuğunu duydum, nasıl o ya?"
- "${target.name}'le aranız nasıl?"

Kuralar:
- ASLA art arda 2 soru
- Bir mesajda bir soru (yoksa diğer konu)
- Sade ton, kıskançlık yok
- Cevap geldiğinde dinle, üstüne gitme`
}

// ============================================================
// Aggregate (timeout korumalı)
// ============================================================

function withTimeout<T>(p: Promise<T>, ms: number, fallback: T): Promise<T> {
  return Promise.race([p, new Promise<T>((resolve) => setTimeout(() => resolve(fallback), ms))])
}

export async function buildV47Phase3Blocks(args: {
  userId: string
  characterId: string
}): Promise<string> {
  const T = 600
  const [leakedKnowledge, jealousyTriangle, relationshipQuery] = await Promise.all([
    withTimeout(buildLeakedKnowledgeBlock(args.characterId, args.userId), T, ''),
    withTimeout(buildJealousyTriangleBlock(args.userId, args.characterId), T, ''),
    withTimeout(buildRelationshipQueryBlock(args.userId, args.characterId), T, ''),
  ])

  return [leakedKnowledge, jealousyTriangle, relationshipQuery].filter((s) => s.length > 0).join('')
}

/**
 * Eğer prompt'a relationshipQuery bloğu eklendiyse, RelationshipQuery tablosuna
 * "asked" kaydı yazmak gerekiyor (ayda 2 sınırını izlemek için). Bu fonksiyon
 * stream sonrası fire-and-forget çağrılır — eğer karakterin cevabında bir
 * "isim" geçtiyse (örn. "X'le aranız nasıl") query kaydı oluştur.
 *
 * Pragmatik MVP: prompt block tetiklenmiş olsun — cron 30 günde 2 kez yazılırsa
 * frequency tutuluyor. Tam isim parsing'i şart değil.
 */
export async function persistRelationshipQueryAttempt(args: {
  userId: string
  characterId: string
  characterMessage: string
  candidateNames: string[]
}): Promise<void> {
  try {
    const lower = args.characterMessage.toLocaleLowerCase('tr-TR')
    const matched = args.candidateNames.find((n) => lower.includes(n.toLocaleLowerCase('tr-TR')))
    if (!matched) return

    // Bu ismin Character.id'sini bul
    const targetChar = await db.character.findFirst({
      where: { userId: args.userId, name: matched, status: { not: 'departed' } },
      select: { id: true },
    })
    if (!targetChar) return

    await db.relationshipQuery.create({
      data: {
        characterId: args.characterId,
        userId: args.userId,
        aboutCharId: targetChar.id,
        questionType: 'closeness_check',
      },
    })
  } catch (e) {
    console.error('[rel-query-persist]', e)
  }
}
