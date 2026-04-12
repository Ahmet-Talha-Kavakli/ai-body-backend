import { prisma } from '@/lib/db/client'
import { createEmbedding } from '@/lib/embeddings/client'
import { buildSessionMemoryText } from './session-summarizer'
import { buildWeeklyMemoryText } from './weekly-summarizer'
import { logger } from '@/lib/logger'
import type { SessionMemoryInput, WeeklyMemoryInput, MemoryType } from './types'

// ── Importance ────────────────────────────────────────────────────────────────
interface ImportanceInput {
  overallFormScore: number | null
  totalVolume: number
  hasPainNote: boolean
}

export function calculateImportance(input: ImportanceInput): number {
  let score = 5

  if (input.overallFormScore !== null) {
    if (input.overallFormScore >= 90) score += 3
    else if (input.overallFormScore >= 80) score += 2
    else if (input.overallFormScore >= 70) score += 1
    else if (input.overallFormScore < 50) score -= 1
  }

  if (input.totalVolume >= 5000) score += 2
  else if (input.totalVolume >= 2000) score += 1

  if (input.hasPainNote) score += 3

  return Math.min(10, Math.max(1, score))
}

// ── Decay ─────────────────────────────────────────────────────────────────────
const DECAY_HALF_LIFE_DAYS: Record<string, number> = {
  SESSION_SUMMARY: 30,
  WEEKLY_SUMMARY: 60,
  EXERCISE_PATTERN: 45,
  NUTRITION_PATTERN: 45,
  RECOVERY_PATTERN: 45,
  MILESTONE: 180,
  WEAKNESS: 90,
  PREFERENCE: 120,
}

export function calculateDecayScore(createdAt: Date, type: string): number {
  const halfLife = DECAY_HALF_LIFE_DAYS[type] ?? 30
  const ageDays = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24)
  return Math.pow(0.5, ageDays / halfLife)
}

// ── Core ──────────────────────────────────────────────────────────────────────
async function writeMemory(params: {
  userId: string
  content: string
  type: MemoryType
  importance: number
  tags: string[]
  sourceId: string | null
  sourceType: string | null
}): Promise<void> {
  try {
    const embedding = await createEmbedding(params.content)
    const decayScore = calculateDecayScore(new Date(), params.type)

    // Convert embedding array to pgvector format: [1,2,3] -> "[1,2,3]"::vector
    const embeddingStr = JSON.stringify(embedding)

    // Insert with raw SQL for pgvector support since Prisma doesn't handle Unsupported types in create
    await prisma.$executeRaw`
      INSERT INTO "UserMemoryEmbedding"
      ("userId", "content", "embedding", "type", "importance", "decayScore", "tags", "sourceId", "sourceType", "createdAt")
      VALUES (${params.userId}, ${params.content}, ${embeddingStr}::vector, ${params.type}, ${params.importance}, ${decayScore}, ${params.tags}, ${params.sourceId}, ${params.sourceType}, NOW())
    `
  } catch (err) {
    logger.error({ err, userId: params.userId, type: params.type }, 'memory write failed')
  }
}

// ── Public API ────────────────────────────────────────────────────────────────
export async function writeSessionMemory(input: SessionMemoryInput): Promise<void> {
  const { text, tags } = buildSessionMemoryText(input)

  let totalVolume = 0
  for (const ex of input.exercises) {
    for (const set of ex.sets) {
      totalVolume += (set.reps ?? 0) * (set.weightKg ?? 0)
    }
  }

  const hasPainNote = input.notes
    ? /ağrı|acı|pain|sore|hurt|diz|omuz|bel/i.test(input.notes)
    : false

  await writeMemory({
    userId: input.userId,
    content: text,
    type: 'SESSION_SUMMARY',
    importance: calculateImportance({
      overallFormScore: input.overallFormScore,
      totalVolume,
      hasPainNote,
    }),
    tags,
    sourceId: input.sessionId,
    sourceType: 'session',
  })
}

export async function writeWeeklyMemory(input: WeeklyMemoryInput): Promise<void> {
  const content = buildWeeklyMemoryText(input)
  const exerciseTags = input.topExercises.map((e) => e.toLowerCase().split(' ')[0])

  await writeMemory({
    userId: input.userId,
    content,
    type: 'WEEKLY_SUMMARY',
    importance: 7,
    tags: ['weekly', ...exerciseTags],
    sourceId: input.weekStartDate.toISOString().split('T')[0],
    sourceType: 'weekly_cron',
  })
}
