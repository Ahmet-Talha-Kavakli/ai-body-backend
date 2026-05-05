/**
 * V4 Faz B — Graph Context Loader
 *
 * Bir mesaj geldiğinde graph'tan **alakalı** node'ları çek:
 *   1. Çekirdek (her zaman): top importance + en sık erişilen 10 node
 *   2. Semantic match: mesajın embedding'i ile cosine en yakın 10 node
 *   3. Recent: son 7 günde oluşturulmuş 5 node
 *   4. Dedup, max 25 node döner
 *
 * Hedef: ~1500-2500 token bağlam üretmek.
 *
 * Flag: v4_graph_memory. Kapalıysa boş array döner.
 */

import OpenAI from 'openai'
import { db } from '@/lib/db/client'
import { isFlagEnabled } from './feature-flags'
import { migrateUserToGraph } from './graph-migration'

const EMBED_MODEL = 'text-embedding-3-small'

export interface GraphContextNode {
  id: string
  type: string
  title: string
  content: string
  importance: number
  source: 'core' | 'semantic' | 'recent'
}

export async function loadGraphContext(args: {
  userId: string
  userMessage?: string
}): Promise<GraphContextNode[]> {
  const { userId, userMessage } = args

  const enabled = await isFlagEnabled('v4_graph_memory', userId)
  if (!enabled) return []

  try {
    // Lazy migration: kullanıcının hiç graph node'u yoksa V3 verisinden migre et.
    // Tek seferlik — sonraki çağrılarda hızlı skip eder (count > 0 dönüş).
    // Bu await — ilk girişte bir defalık ~2-5sn maliyeti var ama kritik (graph boş başlamasın).
    const nodeCount = await db.memoryNode.count({
      where: { userId, ownerType: 'user' },
    })
    if (nodeCount === 0) {
      await migrateUserToGraph(userId).catch((e) =>
        console.error('[graph-context] migration failed:', e)
      )
    }

    // Çekirdek + recent paralel
    const [coreNodes, recentNodes] = await Promise.all([
      db.memoryNode.findMany({
        where: { userId, ownerType: 'user', archived: false },
        orderBy: [{ importance: 'desc' }, { lastAccessedAt: 'desc' }],
        take: 10,
        select: { id: true, type: true, title: true, content: true, importance: true },
      }),
      db.memoryNode.findMany({
        where: {
          userId,
          ownerType: 'user',
          archived: false,
          createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: { id: true, type: true, title: true, content: true, importance: true },
      }),
    ])

    // Semantic search — userMessage varsa
    let semanticNodes: Array<{
      id: string
      type: string
      title: string
      content: string
      importance: number
    }> = []

    if (userMessage && userMessage.trim().length > 3) {
      try {
        const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
        const trimmed = userMessage.trim().slice(0, 8000)
        const r = await openai.embeddings.create({ model: EMBED_MODEL, input: trimmed })
        const vec = r.data[0]?.embedding

        if (vec && vec.length === 1536) {
          const vectorLiteral = `[${vec.join(',')}]`
          // Cosine distance = 1 - similarity. ASC = en yakın.
          // 0.4 threshold (cosine distance) — daha alakalı için sıkı (similarity > 0.6)
          const rows = await db.$queryRawUnsafe<
            Array<{
              id: string
              type: string
              title: string
              content: string
              importance: number
            }>
          >(
            `SELECT id, type, title, content, importance
             FROM "MemoryNode"
             WHERE "userId" = $1
               AND "ownerType" = 'user'
               AND archived = false
               AND embedding IS NOT NULL
               AND (embedding <=> $2::vector) < 0.4
             ORDER BY embedding <=> $2::vector ASC
             LIMIT 10`,
            userId,
            vectorLiteral
          )
          semanticNodes = rows
        }
      } catch (e) {
        console.error('[graph-context] semantic search failed:', e)
      }
    }

    // Dedup — aynı id farklı kaynaklarda birleşir, ilk kaynak korunur
    const seen = new Map<string, GraphContextNode>()
    for (const n of coreNodes) {
      seen.set(n.id, { ...n, source: 'core' })
    }
    for (const n of semanticNodes) {
      if (!seen.has(n.id)) seen.set(n.id, { ...n, source: 'semantic' })
    }
    for (const n of recentNodes) {
      if (!seen.has(n.id)) seen.set(n.id, { ...n, source: 'recent' })
    }

    const result = Array.from(seen.values()).slice(0, 25)

    // lastAccessedAt'i güncelle (fire-and-forget)
    if (result.length > 0) {
      const ids = result.map((r) => r.id)
      db.memoryNode
        .updateMany({
          where: { id: { in: ids } },
          data: { lastAccessedAt: new Date() },
        })
        .catch(() => {})
    }

    return result
  } catch (e) {
    console.error('[graph-context] load failed:', e)
    return []
  }
}

/**
 * Graph node'larını system prompt için hazırlanmış metin bloğuna çevir.
 * Boş array → boş string döner (caller koşullu ekler).
 */
export function formatGraphContextForPrompt(nodes: GraphContextNode[]): string {
  if (nodes.length === 0) return ''

  // Tipe göre grupla
  const byType = new Map<string, GraphContextNode[]>()
  for (const n of nodes) {
    if (!byType.has(n.type)) byType.set(n.type, [])
    byType.get(n.type)!.push(n)
  }

  const sections: string[] = []
  for (const [type, list] of byType.entries()) {
    const lines = list.map((n) => `  • [imp:${n.importance}] ${n.title} — ${n.content}`).join('\n')
    sections.push(`${type.toUpperCase()}:\n${lines}`)
  }

  return `[GRAPH HAFIZA — kullanıcı hakkında bildiklerin]
${sections.join('\n')}

Bu bilgiler hatırlandığını hisset; konuyla bağlantılı olduğunda doğal şekilde yansıt — listele veya tekrarla, ama "hatırlıyorum" demeden.

`
}
