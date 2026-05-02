/**
 * Memory V2 (Faz J) — versionlu hafıza, decay, çelişki tanıma.
 *
 * Belief: bir konunun kimliği (örn: "kullanıcının diyet tercihi")
 * Version: o belief'in zamana göre içeriği (örn: "vegan değil" → "vegan oldu")
 *
 * Tüm versiyonlar AssistantMemoryFact tablosunda tutulur:
 *  - beliefId tüm versiyonları gruplar (ilk version'da kendi id'sine eşit)
 *  - supersededById hangi yeni version'un yerini aldığını gösterir
 *  - active version = supersededById === null && archived === false
 *
 * Decay (3 yıl):
 *  - 0–365 gün dokunulmamış → confidence korunur
 *  - 365–1095 gün → lineer azalır 1.0 → 0.3
 *  - 1095+ gün → archived (kalıcı silinmez, geri çağırılabilir)
 *
 * Çelişki:
 *  - Yeni fact gelirken aktif belief'lere semantic search
 *  - >0.85 benzerlik → çelişki olabilir, AI'ya sor
 */

import OpenAI from 'openai'
import { db } from '@/lib/db/client'

const DECAY_GRACE_DAYS = 365 // bu kadar süre güven düşmez
const DECAY_FULL_DAYS = 1095 // 3 yıl — bu süre sonunda arşivlenir
const DECAY_MIN_CONFIDENCE = 0.3 // arşivden önceki minimum

const CONFLICT_SIMILARITY_THRESHOLD = 0.85
const EMBED_MODEL = 'text-embedding-3-small'

/**
 * Confidence'ı güncel zamana göre hesaplar (yaşlanma).
 * lastConfirmedAt'tan beri geçen güne göre lineer azalır.
 */
export function effectiveConfidence(baseConfidence: number, lastConfirmedAt: Date): number {
  const daysSinceConfirmed = (Date.now() - lastConfirmedAt.getTime()) / (1000 * 60 * 60 * 24)
  if (daysSinceConfirmed <= DECAY_GRACE_DAYS) return baseConfidence
  if (daysSinceConfirmed >= DECAY_FULL_DAYS) return DECAY_MIN_CONFIDENCE
  // Lineer interpolasyon: GRACE → FULL arasında 1.0 → 0.3
  const t = (daysSinceConfirmed - DECAY_GRACE_DAYS) / (DECAY_FULL_DAYS - DECAY_GRACE_DAYS)
  return baseConfidence * (1 - t) + DECAY_MIN_CONFIDENCE * t
}

/**
 * Belirsizlik dili — confidence'a göre AI'nın nasıl konuşması gerektiğini söyler.
 * Sistem prompt'ta kullanılır.
 */
export function uncertaintyMarker(confidence: number): 'certain' | 'probable' | 'fuzzy' {
  if (confidence >= 0.7) return 'certain'
  if (confidence >= 0.4) return 'probable'
  return 'fuzzy'
}

/**
 * Bir metin için embedding üretir.
 */
export async function embedText(text: string): Promise<number[]> {
  const openai = new OpenAI()
  const res = await openai.embeddings.create({
    model: EMBED_MODEL,
    input: text,
  })
  const e = res.data[0]?.embedding
  if (!e) throw new Error('embed_failed')
  return e
}

/**
 * Cosine similarity (basit, embeddings normalleştirilmiş varsayılır).
 */
export function cosineSim(a: number[], b: number[]): number {
  let dot = 0,
    na = 0,
    nb = 0
  for (let i = 0; i < a.length; i++) {
    const ai = a[i] ?? 0
    const bi = b[i] ?? 0
    dot += ai * bi
    na += ai * ai
    nb += bi * bi
  }
  if (na === 0 || nb === 0) return 0
  return dot / (Math.sqrt(na) * Math.sqrt(nb))
}

/**
 * Aktif fact'leri (supersede edilmemiş, arşivlenmemiş) çek.
 */
export async function getActiveFacts(userId: string) {
  const facts = await db.assistantMemoryFact.findMany({
    where: {
      userId,
      archived: false,
      supersededById: null,
    },
    orderBy: { lastConfirmedAt: 'desc' },
  })
  return facts
}

/**
 * Yeni gelen fact için çelişen aktif fact'leri bul.
 * Embedding karşılaştırması — pgvector ile semantic search.
 *
 * Dönüş: en yüksek similarity'li 3 fact (varsa).
 */
export async function findConflictingFacts(
  userId: string,
  newContent: string,
  category: string
): Promise<
  Array<{
    id: string
    content: string
    similarity: number
    lastConfirmedAt: Date
    confidence: number
  }>
> {
  const newEmbed = await embedText(newContent)
  // pgvector için raw query
  const rows = await db.$queryRaw<
    Array<{
      id: string
      content: string
      last_confirmed_at: Date
      confidence: number
      distance: number
    }>
  >`
    SELECT id, content, "lastConfirmedAt" as last_confirmed_at, confidence,
           embedding <=> ${`[${newEmbed.join(',')}]`}::vector AS distance
    FROM "AssistantMemoryFact"
    WHERE "userId" = ${userId}
      AND archived = false
      AND "supersededById" IS NULL
      AND category = ${category}
      AND embedding IS NOT NULL
    ORDER BY distance ASC
    LIMIT 3
  `
  return rows
    .map((r) => ({
      id: r.id,
      content: r.content,
      lastConfirmedAt: r.last_confirmed_at,
      confidence: r.confidence,
      similarity: 1 - r.distance,
    }))
    .filter((r) => r.similarity >= CONFLICT_SIMILARITY_THRESHOLD)
}

/**
 * Yeni fact yarat (ya da çelişen varsa supersede et).
 *
 * @param replaces — eğer bu fact bir başkasının yerini alıyorsa, eski fact'in id'si.
 *                   Eski fact supersededById ile yenisine bağlanır.
 */
export async function createBeliefVersion(args: {
  userId: string
  category: string
  content: string
  confidence?: number
  sourceMessageId?: string | null
  replaces?: string | null
}): Promise<string> {
  const {
    userId,
    category,
    content,
    confidence = 1.0,
    sourceMessageId = null,
    replaces = null,
  } = args

  // Embedding üret
  let embedding: number[] | null = null
  try {
    embedding = await embedText(content)
  } catch (e) {
    console.error('[memory/embed]', e)
  }

  // Eski belief varsa, yeni version onun beliefId'sini paylaşır
  let beliefId: string | null = null
  if (replaces) {
    const old = await db.assistantMemoryFact.findUnique({ where: { id: replaces } })
    beliefId = old?.beliefId ?? null
  }

  // Önce yeni version'u yarat
  const created = await db.assistantMemoryFact.create({
    data: {
      userId,
      category,
      content,
      confidence,
      sourceMessageId,
      lastConfirmedAt: new Date(),
      beliefId, // null ise altta self-id atayacağız
    },
  })

  // beliefId yoksa kendi id'sini ata (ilk version)
  if (!beliefId) {
    await db.assistantMemoryFact.update({
      where: { id: created.id },
      data: { beliefId: created.id },
    })
  }

  // Embedding'i ayrı update — Prisma Unsupported tipi yazma desteklemediği için raw
  if (embedding) {
    await db.$executeRaw`
      UPDATE "AssistantMemoryFact"
      SET embedding = ${`[${embedding.join(',')}]`}::vector
      WHERE id = ${created.id}
    `
  }

  // Eski version'u supersede et
  if (replaces) {
    await db.assistantMemoryFact.update({
      where: { id: replaces },
      data: {
        supersededById: created.id,
        supersededAt: new Date(),
      },
    })
  }

  return created.id
}

/**
 * Bir fact'i confirm et (güveni yenile, lastConfirmedAt güncelle).
 * Asistan kullanıcıdan tekrar duyduğunda çağırır.
 */
export async function confirmBelief(factId: string, newConfidence?: number): Promise<void> {
  await db.assistantMemoryFact.update({
    where: { id: factId },
    data: {
      lastConfirmedAt: new Date(),
      lastUsedAt: new Date(),
      ...(newConfidence !== undefined ? { confidence: newConfidence } : {}),
    },
  })
}

/**
 * Bir belief'in tüm versionlarını (timeline) çek.
 */
export async function getBeliefTimeline(beliefId: string) {
  return db.assistantMemoryFact.findMany({
    where: { beliefId },
    orderBy: { createdAt: 'asc' },
  })
}

/**
 * Decay sweep — her gece çağırılır.
 * 1. 1095+ gün dokunulmamış aktif fact'leri arşivle
 * 2. (Confidence kendiliğinden effectiveConfidence ile hesaplandığı için DB'de güncellemeye gerek yok,
 *    ama prompt'ta gösterilecek değer hep effectiveConfidence olur.)
 *
 * Dönüş: arşivlenen fact sayısı.
 */
export async function runDecaySweep(): Promise<{ archived: number }> {
  const cutoff = new Date(Date.now() - DECAY_FULL_DAYS * 24 * 60 * 60 * 1000)
  const result = await db.assistantMemoryFact.updateMany({
    where: {
      archived: false,
      supersededById: null,
      lastConfirmedAt: { lt: cutoff },
    },
    data: {
      archived: true,
      archivedAt: new Date(),
    },
  })
  return { archived: result.count }
}
