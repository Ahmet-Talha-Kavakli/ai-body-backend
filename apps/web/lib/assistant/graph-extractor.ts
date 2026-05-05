/**
 * V4 Faz B — Graph Memory Extractor
 *
 * V3 extractor (memory-extractor.ts) düz fact'ler çıkarır → AssistantMemoryFact.
 * V4 extractor — graph nesnesi çıkarır → MemoryNode + MemoryEdge.
 *
 * Çalışma:
 *  - Her 15-20 user mesajında bir tetiklenir (V4 plan'a göre — V3'ten daha seyrek
 *    çünkü graph extraction daha pahalı, daha kapsamlı)
 *  - Son N mesaj + mevcut top graph node'lar bağlam olarak verilir
 *  - LLM yeni node + edge'leri JSON olarak döner
 *  - Yeni node'ların embedding'i üretilir, DB'ye yazılır
 *  - Yeni edge'ler oluşturulur (her iki node DB'de varsa)
 *
 * Flag: v4_graph_memory. Flag kapalıyken hiç çalışmaz.
 *
 * Fire-and-forget — kullanıcıyı bekletmez. Hata durumunda sessiz fail.
 */

import OpenAI from 'openai'
import { db } from '@/lib/db/client'
import { isFlagEnabled } from './feature-flags'

const EMBED_MODEL = 'text-embedding-3-small' // 1536 boyut — schema ile uyumlu
const EXTRACT_MODEL = 'gpt-4o-mini'

// Graph extraction her N user mesajında bir
const GRAPH_EXTRACT_INTERVAL = 15

const NODE_TYPES = [
  'person',
  'event',
  'pattern',
  'value',
  'emotion',
  'habit',
  'place',
  'goal',
  'belief',
  'secret',
  'trauma',
  'dream',
  'tracking_pattern',
  'relationship',
] as const

const EDGE_RELATIONS = [
  'causes',
  'related_to',
  'conflicts_with',
  'parent_of',
  'triggered_by',
  'leads_to',
  'part_of',
  'similar_to',
] as const

type NodeType = (typeof NODE_TYPES)[number]
type EdgeRelation = (typeof EDGE_RELATIONS)[number]

interface ExtractedNode {
  type: NodeType
  title: string
  content: string
  importance: number // 1-5
  visibility?: 'public' | 'inner_circle' | 'secret'
  // Edge oluştururken referans için geçici local id
  tempId: string
}

interface ExtractedEdge {
  fromTempId: string
  toTempId: string
  relation: EdgeRelation
  strength?: number // 0-1
}

interface ExtractionResult {
  newNodes: ExtractedNode[]
  newEdges: ExtractedEdge[]
}

const SYSTEM_PROMPT = `Sen bir graph memory extractor'sın. Kullanıcının son mesajlarından hatırlanması gereken **bilgi parçaları (node)** ve aralarındaki **ilişkiler (edge)** çıkarırsın.

Sadece **ÖNEMLİ ve KALICI** bilgileri çıkar. Geçici durumları (örn: "şimdi yorgunum") çıkarma.

NODE TİPLERİ:
- person: önemli kişiler (anne, sevgili, en yakın arkadaş)
- event: hayat olayı (kayıp, terfi, ayrılık, doğum, taşınma)
- pattern: tekrar eden davranış ("stresli olunca uyku kaçar")
- value: önem verdiği şey ("aileme bağlıyım")
- emotion: kalıcı duygu/korku ("yalnız kalmaktan korkuyor")
- habit: alışkanlık ("her sabah kahve")
- place: önemli mekan/şehir
- goal: hedef ("İngilizce öğreneceğim")
- belief: inanç/bakış açısı
- secret: sır (kullanıcıdan başka kimse bilmiyor — visibility: secret)
- trauma: travma/yara
- dream: hayal
- tracking_pattern: sağlık/davranış örüntüsü ("cumartesi sabah egzersiz")
- relationship: ilişki tanımı ("Ayşe ile en yakın arkadaş")

EDGE İLİŞKİLERİ:
- causes: A B'ye sebep olur
- related_to: A B ile ilgili
- conflicts_with: A B ile çatışıyor
- parent_of: A B'nin üst kategorisi
- triggered_by: A B tarafından tetikleniyor
- leads_to: A B'ye yol açar
- part_of: A B'nin parçası
- similar_to: A B'ye benziyor

KURALLAR:
- Mevcut graph'taki node'ları (sana verilen) DUPLICATE etme. Onlardan biriyle ilgiliyse o id'ye edge çek (existingNodeId kullan).
- Her node'un 'tempId'i benzersiz olsun (n1, n2, n3...).
- Edge oluştururken: fromTempId/toTempId yeni node'lar için; mevcut node'a bağlamak için fromExistingId/toExistingId kullan.
- importance: 1=trivia, 5=hayati. Kullanıcının kim olduğunu tanımlayan şey 4-5.
- Maksimum 5 yeni node, 8 yeni edge döndür.
- Hiçbir şey çıkmıyorsa: {"newNodes": [], "newEdges": []}

YANITINI SADECE JSON OLARAK DÖN:
{
  "newNodes": [{"tempId":"n1","type":"person","title":"...","content":"...","importance":4,"visibility":"public"}],
  "newEdges": [{"fromTempId":"n1","toTempId":"n2","relation":"causes","strength":0.7}]
}`

export async function extractGraphFromMessages(args: {
  userId: string
  recentMessages: Array<{ role: 'user' | 'assistant'; content: string }>
  userMessageCount: number
}): Promise<{ extracted: boolean; nodesCreated: number; edgesCreated: number }> {
  const { userId, recentMessages, userMessageCount } = args

  // Flag kapalıysa hiç çalışma
  const enabled = await isFlagEnabled('v4_graph_memory', userId)
  if (!enabled) return { extracted: false, nodesCreated: 0, edgesCreated: 0 }

  // Her 15 user mesajında bir (1, 16, 31, ...)
  if (userMessageCount > 1 && userMessageCount % GRAPH_EXTRACT_INTERVAL !== 1) {
    return { extracted: false, nodesCreated: 0, edgesCreated: 0 }
  }

  if (recentMessages.length === 0) {
    return { extracted: false, nodesCreated: 0, edgesCreated: 0 }
  }

  try {
    // Mevcut graph'tan en yüksek importance + en güncel 20 node — duplicate önleme bağlamı
    const existingNodes = await db.memoryNode.findMany({
      where: { userId, ownerType: 'user', archived: false },
      orderBy: [{ importance: 'desc' }, { lastAccessedAt: 'desc' }],
      take: 20,
      select: { id: true, type: true, title: true, content: true, importance: true },
    })

    const existingNodesContext = existingNodes
      .map((n) => `[${n.id}|${n.type}|imp:${n.importance}] ${n.title}: ${n.content}`)
      .join('\n')

    const messagesText = recentMessages
      .slice(-20) // son 20 mesaj
      .map((m) => `${m.role === 'user' ? 'KULLANICI' : 'AI'}: ${m.content}`)
      .join('\n')

    const userPrompt = `MEVCUT GRAPH (bunları duplicate etme — referans ver):
${existingNodesContext || '(graph boş)'}

SON MESAJLAR:
${messagesText}

Bu mesajlardan **yeni** öğrenilen bilgileri (node + edge) çıkar.`

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
    const startedAt = Date.now()
    const completion = await openai.chat.completions.create({
      model: EXTRACT_MODEL,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
      max_tokens: 1200,
    })

    const raw = completion.choices[0]?.message?.content
    if (!raw) return { extracted: false, nodesCreated: 0, edgesCreated: 0 }

    const parsed = JSON.parse(raw) as ExtractionResult
    if (!parsed.newNodes && !parsed.newEdges) {
      return { extracted: true, nodesCreated: 0, edgesCreated: 0 }
    }

    const nodes = parsed.newNodes ?? []
    const edges = parsed.newEdges ?? []

    if (nodes.length === 0 && edges.length === 0) {
      return { extracted: true, nodesCreated: 0, edgesCreated: 0 }
    }

    // 1) Node'ları yarat — embedding'leri paralel üret
    const tempIdToRealId = new Map<string, string>()
    const validNodes = nodes.filter(
      (n) =>
        n &&
        typeof n.title === 'string' &&
        typeof n.content === 'string' &&
        (NODE_TYPES as readonly string[]).includes(n.type)
    )

    // Embedding'leri batch çek
    const embeddings: (number[] | null)[] = await Promise.all(
      validNodes.map(async (n) => {
        try {
          const text = `${n.title}: ${n.content}`.slice(0, 8000)
          const r = await openai.embeddings.create({ model: EMBED_MODEL, input: text })
          return r.data[0]?.embedding ?? null
        } catch {
          return null
        }
      })
    )

    let nodesCreated = 0
    for (let i = 0; i < validNodes.length; i++) {
      const n = validNodes[i]
      try {
        const created = await db.memoryNode.create({
          data: {
            userId,
            ownerType: 'user',
            ownerId: userId,
            type: n.type,
            title: n.title.slice(0, 200),
            content: n.content.slice(0, 4000),
            importance: Math.max(1, Math.min(5, Math.round(n.importance ?? 2))),
            visibility: n.visibility ?? 'public',
            sourceType: 'message',
          },
          select: { id: true },
        })
        tempIdToRealId.set(n.tempId, created.id)
        nodesCreated++

        // Embedding'i raw SQL ile yaz (Prisma vector tipini doğrudan yazmıyor)
        const emb = embeddings[i]
        if (emb && emb.length === 1536) {
          const vectorLiteral = `[${emb.join(',')}]`
          await db.$executeRawUnsafe(
            `UPDATE "MemoryNode" SET "embedding" = $1::vector WHERE id = $2`,
            vectorLiteral,
            created.id
          )
        }
      } catch (e) {
        // Tek node fail — devam
        console.error('[graph-extractor] node create fail:', e)
      }
    }

    // 2) Edge'leri yarat
    let edgesCreated = 0
    for (const e of edges) {
      try {
        if (!e || !(EDGE_RELATIONS as readonly string[]).includes(e.relation)) continue

        const fromId =
          (e as any).fromExistingId ?? (e.fromTempId ? tempIdToRealId.get(e.fromTempId) : undefined)
        const toId =
          (e as any).toExistingId ?? (e.toTempId ? tempIdToRealId.get(e.toTempId) : undefined)

        if (!fromId || !toId || fromId === toId) continue

        await db.memoryEdge.create({
          data: {
            userId,
            fromNodeId: fromId,
            toNodeId: toId,
            relation: e.relation,
            strength: typeof e.strength === 'number' ? Math.max(0, Math.min(1, e.strength)) : 0.5,
          },
        })
        edgesCreated++
      } catch (err: any) {
        // Unique constraint (aynı edge varsa) ya da node bulunamadı — sessizce geç
        if (err?.code !== 'P2002') {
          console.error('[graph-extractor] edge create fail:', err)
        }
      }
    }

    // AiCallLog
    try {
      const usage = completion.usage
      await db.aiCallLog.create({
        data: {
          userId,
          model: EXTRACT_MODEL,
          provider: 'openai',
          purpose: 'extractor',
          inputTokens: usage?.prompt_tokens ?? 0,
          outputTokens: usage?.completion_tokens ?? 0,
          // Yaklaşık maliyet: gpt-4o-mini in $0.15/M, out $0.60/M
          costUsd:
            ((usage?.prompt_tokens ?? 0) * 0.15) / 1_000_000 +
            ((usage?.completion_tokens ?? 0) * 0.6) / 1_000_000,
          durationMs: Date.now() - startedAt,
          metadata: { nodesCreated, edgesCreated },
        },
      })
    } catch {
      // log fail — kritik değil
    }

    return { extracted: true, nodesCreated, edgesCreated }
  } catch (e) {
    console.error('[graph-extractor] failed:', e)
    return { extracted: false, nodesCreated: 0, edgesCreated: 0 }
  }
}
