import { openai } from '@/lib/ai/client'
import { prisma } from '@/lib/db/client'
import type { MemoryContext } from './types'

export interface RankParams {
  similarity: number // 0-1, higher is more relevant
  importance: number // 1-10, higher is more important
  decayScore: number // 0-1, 1 is fresh, 0 is very old
}

export interface RetrieveOptions {
  limit?: number
  types?: string[]
}

interface RawMemoryResult {
  id: string
  content: string
  type: string
  importance: number
  decayScore: number
  similarity: number
}

/**
 * Rank memory by relevance
 * Uses weighted combination: 80% semantic similarity, 20% recency/importance
 */
export function rankByRelevance(params: RankParams): number {
  const { similarity, importance, decayScore } = params

  // Normalize importance to 0-1
  const importanceNorm = importance / 10

  // Combined score: 80% similarity + 20% (importance * decay)
  return similarity * 0.8 + importanceNorm * decayScore * 0.2
}

/**
 * Generate embedding for a prompt
 */
async function generatePromptEmbedding(prompt: string): Promise<number[]> {
  try {
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: prompt,
    })
    return response.data[0].embedding
  } catch (error) {
    logger.error({ error: error instanceof Error ? error.message : String(error) }, 'failed to generate prompt embedding')
    // Return zero vector on error (graceful degradation)
    return Array(1536).fill(0)
  }
}

export async function retrieveMemoryContext(
  userId: string,
  query: string,
  options: RetrieveOptions = {}
): Promise<MemoryContext> {
  const { limit = 5, types } = options

  try {
    // Generate embedding for user's prompt
    const promptEmbedding = await generatePromptEmbedding(query)
    const fetchLimit = limit * 2

    // Semantic search using pgvector cosine similarity
    let results: RawMemoryResult[]

    if (types && types.length > 0) {
      results = await prisma.$queryRaw<RawMemoryResult[]>`
        SELECT
          id,
          content,
          type,
          importance,
          "decayScore",
          1 - (embedding <=> ${promptEmbedding}::vector) as similarity
        FROM "UserMemoryEmbedding"
        WHERE "userId" = ${userId}
          AND type = ANY(${types}::text[])
          AND (embedding <=> ${promptEmbedding}::vector) < 0.5
        ORDER BY (embedding <=> ${promptEmbedding}::vector) ASC
        LIMIT ${fetchLimit}
      `
    } else {
      results = await prisma.$queryRaw<RawMemoryResult[]>`
        SELECT
          id,
          content,
          type,
          importance,
          "decayScore",
          1 - (embedding <=> ${promptEmbedding}::vector) as similarity
        FROM "UserMemoryEmbedding"
        WHERE "userId" = ${userId}
          AND (embedding <=> ${promptEmbedding}::vector) < 0.5
        ORDER BY (embedding <=> ${promptEmbedding}::vector) ASC
        LIMIT ${fetchLimit}
      `
    }

    // Re-rank by relevance score
    const ranked = results
      .map((mem) => ({
        ...mem,
        relevanceScore: rankByRelevance({
          similarity: mem.similarity,
          importance: mem.importance,
          decayScore: mem.decayScore,
        }),
      }))
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, limit)

    return {
      memories: ranked.map((r) => r.content),
      totalRetrieved: ranked.length,
      types: [...new Set(ranked.map((r) => r.type))] as any,
    }
  } catch (err) {
    logger.error({ err, userId }, 'memory retrieval failed')
    return { memories: [], totalRetrieved: 0, types: [] }
  }
}
