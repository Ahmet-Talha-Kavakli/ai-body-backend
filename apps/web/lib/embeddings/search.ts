import { prisma } from '@/lib/db/client'
import { createEmbedding } from './client'

/**
 * @deprecated Use `retrieveMemoryContext` from `@/lib/memory/memory-retriever` instead.
 * This function lacks importance/decay scoring and type filtering.
 */
export async function searchRelevantMemories(
  userId: string,
  query: string,
  limit = 3
): Promise<string[]> {
  const queryEmbedding = await createEmbedding(query)

  const results = await prisma.$queryRaw<Array<{ content: string }>>`
    SELECT content
    FROM "UserMemoryEmbedding"
    WHERE "userId" = ${userId}
    ORDER BY embedding <=> ${queryEmbedding}::vector
    LIMIT ${limit}
  `

  return results.map((r) => r.content)
}
