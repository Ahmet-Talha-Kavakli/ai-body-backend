import { prisma } from '@/lib/db/client'
import { createEmbedding } from '@/lib/embeddings/client'
import { logger } from '@/lib/logger'
import type { MemoryContext } from './types'

interface RawMemory {
  content: string
  importance: number
  decayScore: number
  type: string
}

export interface RetrieveOptions {
  limit?: number
  types?: string[]
}

export function rankByRelevance(memories: RawMemory[]): RawMemory[] {
  return [...memories].sort((a, b) => {
    const scoreA = (a.importance / 10) * a.decayScore
    const scoreB = (b.importance / 10) * b.decayScore
    return scoreB - scoreA
  })
}

export async function retrieveMemoryContext(
  userId: string,
  query: string,
  options: RetrieveOptions = {}
): Promise<MemoryContext> {
  const { limit = 5, types } = options

  try {
    const queryEmbedding = await createEmbedding(query)
    const fetchLimit = limit * 2

    let rawResults: RawMemory[]

    if (types && types.length > 0) {
      rawResults = await prisma.$queryRaw<RawMemory[]>`
        SELECT content, importance, "decayScore", type
        FROM "UserMemoryEmbedding"
        WHERE "userId" = ${userId}
          AND type = ANY(${types}::text[])
        ORDER BY embedding <=> ${queryEmbedding}::vector
        LIMIT ${fetchLimit}
      `
    } else {
      rawResults = await prisma.$queryRaw<RawMemory[]>`
        SELECT content, importance, "decayScore", type
        FROM "UserMemoryEmbedding"
        WHERE "userId" = ${userId}
        ORDER BY embedding <=> ${queryEmbedding}::vector
        LIMIT ${fetchLimit}
      `
    }

    const ranked = rankByRelevance(rawResults).slice(0, limit)

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
