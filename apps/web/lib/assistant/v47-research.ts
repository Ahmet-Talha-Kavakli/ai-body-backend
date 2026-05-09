/**
 * V4.7 J2 — Tavily Web Search
 *
 * Akış:
 *   1) Karakter konuşma sırasında bilinmeyen bir konu duyduğunda "bekle bakarım"
 *      diyebilir → POST /api/assistant/research/queue çağrılır → PendingResearch kayıt.
 *   2) research-dispatcher cron (saatlik) due olanları Tavily ile sorgular, result yazar.
 *   3) Karakter sonraki cevabında buildResearchSharingBlock prompt'a girer ("ya şuna baktım").
 *   4) Karakter referans verdiyse markResearchSharedIfMentioned shared=true yapar.
 *
 * KURAL (O3 kalibrasyon):
 *   - "Araştırdım", "kaynaklar şunlar" YASAK — arkadaş tonu.
 *   - %10 yanlış sonuç olursa "ya yanlış mı baktım acaba".
 */

import { db } from '@/lib/db/client'

const TAVILY_ENDPOINT = 'https://api.tavily.com/search'

interface TavilyResponse {
  query: string
  answer?: string
  results?: Array<{ title: string; content: string; url: string }>
}

export async function tavilySearch(query: string): Promise<string | null> {
  const apiKey = process.env.TAVILY_API_KEY
  if (!apiKey) {
    console.error('[v47-research] TAVILY_API_KEY missing')
    return null
  }
  try {
    const r = await fetch(TAVILY_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        query: query.slice(0, 400),
        search_depth: 'basic',
        include_answer: true,
        max_results: 3,
      }),
      signal: AbortSignal.timeout(15000),
    })
    if (!r.ok) {
      console.error('[v47-research] Tavily HTTP', r.status, await r.text().catch(() => ''))
      return null
    }
    const data = (await r.json()) as TavilyResponse
    if (data.answer) return data.answer
    if (data.results && data.results.length > 0) {
      return data.results
        .map((r) => `${r.title}: ${r.content.slice(0, 200)}`)
        .join('\n\n')
        .slice(0, 1500)
    }
    return null
  } catch (e) {
    console.error('[v47-research] tavilySearch fail:', e)
    return null
  }
}

// ============================================================
// Prompt block — hazır araştırma sonucu varsa karakter paylaşır
// ============================================================

export async function buildResearchSharingBlock(args: {
  characterId: string
  userId: string
}): Promise<string> {
  // Resolved + paylaşılmamış sonuç
  const research = await db.pendingResearch.findFirst({
    where: {
      characterId: args.characterId,
      userId: args.userId,
      shared: false,
      resolvedAt: { not: null },
    },
    orderBy: { resolvedAt: 'desc' },
  })
  if (!research || !research.result) return ''

  return [
    '[ARAŞTIRMA SONUCU — PAYLAŞABİLİRSİN]',
    `Önceden kullanıcı şunu sormuştu: "${research.query.slice(0, 200)}"`,
    `Sonuç: ${research.result.slice(0, 800)}`,
    '',
    'Davranış (O3 kalibrasyon):',
    '- "Ya şuna baktım az önce, X dedi" tarzı arkadaş tonu.',
    '- ASLA "araştırdım" / "kaynaklar şunlar" / "internette gördüm".',
    '- Kendi yorumunu ekle: "ben olsam X yapardım" / "valla mantıklı".',
    '- %10 ihtimalle "ya yanlış mı baktım acaba" şüphe.',
    '- Konu uygun değilse paylaşma, sonraki sefer.',
  ].join('\n')
}

// ============================================================
// Post-stream: karakter cevabında araştırma paylaşıldı mı?
// ============================================================

const RESEARCH_MENTION_PATTERNS = [
  /\b(şuna|buna) baktım\b/i,
  /\bbi baktım\b/i,
  /\bbi araştırdım\b/i, // — "araştırdım" yasak ama "bi araştırdım" daha doğal, MVP
  /\baz önce.{0,20}(okudum|gördüm|baktım)/i,
]

export function detectResearchMention(characterReply: string): boolean {
  return RESEARCH_MENTION_PATTERNS.some((p) => p.test(characterReply))
}

export async function markResearchSharedIfMentioned(args: {
  characterId: string
  userId: string
  characterReply: string
}): Promise<void> {
  if (!detectResearchMention(args.characterReply)) return
  const research = await db.pendingResearch.findFirst({
    where: {
      characterId: args.characterId,
      userId: args.userId,
      shared: false,
      resolvedAt: { not: null },
    },
    orderBy: { resolvedAt: 'desc' },
    select: { id: true },
  })
  if (!research) return
  await db.pendingResearch.update({
    where: { id: research.id },
    data: { shared: true },
  })
}
