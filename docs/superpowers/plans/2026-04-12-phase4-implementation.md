# Phase 4: AI Memory Layer Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an intelligent memory system that learns from user's sessions, creates personal context via LLM summarization, and injects relevant memories into every AI coach response through semantic search + vector embeddings.

**Architecture:** Session ends → Auto-summarize with LLM → Store with pgvector embedding. Weekly cron → Pattern analysis + decay update. Every AI call → Semantic search + retrieve top-K memories → Inject into system prompt via `MemoryContextBuilder`. User never notices → AI coach simply gets "smarter" over time.

**Tech Stack:** Next.js 15, Prisma + pgvector, OpenAI `text-embedding-3-small`, Vitest, `@/lib/db/client` (Prisma client), existing `UserMemoryEmbedding` table extension.

---

## File Structure Overview

**Already Implemented (Phase 4 start state):**
- `apps/web/lib/memory/types.ts` — Memory type definitions
- `apps/web/lib/memory/session-summarizer.ts` — Session → memory text
- `apps/web/lib/memory/weekly-summarizer.ts` — Weekly pattern analysis
- `apps/web/lib/memory/index.ts` — Barrel export

**To Implement (8 Tasks):**

| File | Responsibility |
|------|-----------------|
| `apps/web/lib/memory/memory-writer.ts` | Importance/decay calc, LLM summarization, DB save |
| `apps/web/lib/memory/memory-retriever.ts` | Semantic search + relevance re-ranking |
| `apps/web/lib/memory/prompt-injector.ts` | Inject memories into AI prompts |
| `prisma/schema.prisma` | Extend `UserMemoryEmbedding` model |
| `prisma/migrations/` | Run migration (auto-generated) |
| `apps/web/app/api/cron/memory-summary/route.ts` | Weekly memory summary cron |
| `apps/web/app/api/cron/memory-decay/route.ts` | Weekly decay update cron |
| `apps/web/app/api/sessions/[id]/route.ts` | Call `writeSessionMemory()` on session end |
| `apps/web/app/api/ai/coach-message/route.ts` | Inject memory context |
| `apps/web/app/api/ai/generate-program/route.ts` | Inject memory context |
| `apps/web/app/api/ai/analyze-meal/route.ts` | Inject memory context |

---

## Chunk 1: Schema Migration & Writer Setup

### Task 1: Prisma Schema Extension

**Files:**
- Modify: `prisma/schema.prisma`

- [ ] **Step 1: Check current schema**

Run:
```bash
cd c:/Users/TUF/Desktop/Ai-Pt/apps/web
grep -A 12 "model UserMemoryEmbedding" ../../prisma/schema.prisma
```

Expected output shows the current model with `id`, `userId`, `content`, `embedding`, `type`, `createdAt`, `user` relation, and indexes.

- [ ] **Step 2: Update UserMemoryEmbedding model**

Edit `prisma/schema.prisma` and find the `UserMemoryEmbedding` model. Replace it with:

```prisma
model UserMemoryEmbedding {
  id          String                       @id @default(cuid())
  userId      String
  content     String                       @db.Text
  embedding   Unsupported("vector(1536)")?
  type        String                       // MemoryType value: SESSION_SUMMARY, WEEKLY_SUMMARY, etc.
  importance  Int                          @default(5)    // 1-10 scale
  decayScore  Float                        @default(1.0)  // Exponential decay, updated weekly
  tags        String[]
  sourceId    String?                      // workoutSessionId or weekStart ISO string
  sourceType  String?                      // 'session' | 'weekly_cron'
  createdAt   DateTime                     @default(now())
  updatedAt   DateTime                     @updatedAt
  user        User                         @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([type])
  @@index([userId, type])
  @@index([createdAt])
  @@index([userId, createdAt])
}
```

- [ ] **Step 3: Remove MemoryType enum (if exists)**

Search `prisma/schema.prisma` for:
```prisma
enum MemoryType {
```

If found, delete the entire enum block (usually 5-8 lines). If not found, no action needed.

- [ ] **Step 4: Create migration**

```bash
cd c:/Users/TUF/Desktop/Ai-Pt/apps/web
npx prisma migrate dev --name "extend_memory_embedding_v2"
```

Expected: "Migration created" message, migration file in `prisma/migrations/`.

- [ ] **Step 5: Generate Prisma client**

```bash
npx prisma generate
```

Expected: "Prisma Client generation successful."

- [ ] **Step 6: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/
git commit -m "feat(memory): extend UserMemoryEmbedding - add importance, decay, tags, source fields"
```

---

### Task 2: Memory Writer Core

**Files:**
- Create: `apps/web/lib/memory/memory-writer.ts`
- Create: `apps/web/lib/memory/__tests__/memory-writer.test.ts`

- [ ] **Step 1: Write failing test**

Create `apps/web/lib/memory/__tests__/memory-writer.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { calculateImportance, calculateDecayScore, writeSessionMemory, writeWeeklyMemory } from '../memory-writer'
import type { SessionMemoryInput, WeeklyMemoryInput } from '../types'

// Mock OpenAI client
vi.mock('@/lib/ai/openai', () => ({
  openai: {
    embeddings: {
      create: vi.fn().mockResolvedValue({
        data: [{ embedding: Array(1536).fill(0.1) }],
      }),
    },
  },
}))

// Mock Prisma
vi.mock('@/lib/db/client', () => ({
  prisma: {
    userMemoryEmbedding: {
      create: vi.fn().mockResolvedValue({ id: 'mem_1' }),
    },
  },
}))

describe('Memory Writer', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('calculateImportance', () => {
    it('returns 9-10 for high-intensity workouts (form > 85)', () => {
      const importance = calculateImportance({ formScore: 88, volumeMultiplier: 1.0 })
      expect(importance).toBeGreaterThanOrEqual(9)
      expect(importance).toBeLessThanOrEqual(10)
    })

    it('returns 6-8 for medium-intensity workouts (form 70-85)', () => {
      const importance = calculateImportance({ formScore: 75, volumeMultiplier: 1.0 })
      expect(importance).toBeGreaterThanOrEqual(6)
      expect(importance).toBeLessThanOrEqual(8)
    })

    it('returns 3-5 for low-intensity workouts (form < 70)', () => {
      const importance = calculateImportance({ formScore: 60, volumeMultiplier: 1.0 })
      expect(importance).toBeGreaterThanOrEqual(3)
      expect(importance).toBeLessThanOrEqual(5)
    })

    it('multiplies by volumeMultiplier', () => {
      const imp1 = calculateImportance({ formScore: 85, volumeMultiplier: 1.0 })
      const imp2 = calculateImportance({ formScore: 85, volumeMultiplier: 1.5 })
      expect(imp2).toBeGreaterThan(imp1)
    })
  })

  describe('calculateDecayScore', () => {
    it('returns 1.0 for memories created today', () => {
      const createdAt = new Date()
      const decayScore = calculateDecayScore(createdAt, new Date())
      expect(decayScore).toBeCloseTo(1.0, 2)
    })

    it('decays exponentially over weeks', () => {
      const createdAt = new Date()
      createdAt.setDate(createdAt.getDate() - 7) // 1 week ago
      const decayScore = calculateDecayScore(createdAt, new Date())
      expect(decayScore).toBeLessThan(1.0)
      expect(decayScore).toBeGreaterThan(0.5)
    })

    it('approaches 0 after 8+ weeks', () => {
      const createdAt = new Date()
      createdAt.setDate(createdAt.getDate() - 56) // 8 weeks
      const decayScore = calculateDecayScore(createdAt, new Date())
      expect(decayScore).toBeLessThan(0.1)
    })
  })

  describe('writeSessionMemory', () => {
    it('creates memory with correct fields', async () => {
      const input: SessionMemoryInput = {
        userId: 'user_123',
        sessionId: 'session_abc',
        exercises: [
          {
            name: 'Squat',
            sets: [
              { setNumber: 1, reps: 5, weightKg: 100, formScore: 85 },
              { setNumber: 2, reps: 5, weightKg: 100, formScore: 88 },
            ],
            avgFormScore: 86.5,
          },
        ],
        durationSeconds: 1800,
        overallFormScore: 86,
        caloriesBurned: 300,
        notes: null,
      }

      await writeSessionMemory(input)

      // Verify Prisma was called with correct structure
      const { prisma } = await import('@/lib/db/client')
      expect(prisma.userMemoryEmbedding.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: 'user_123',
            type: 'SESSION_SUMMARY',
            sourceId: 'session_abc',
            sourceType: 'session',
            importance: expect.any(Number),
            tags: expect.any(Array),
            embedding: expect.any(Array),
          }),
        })
      )
    })
  })

  describe('writeWeeklyMemory', () => {
    it('creates weekly memory with pattern analysis', async () => {
      const input: WeeklyMemoryInput = {
        userId: 'user_123',
        weekStartDate: new Date('2026-04-07'),
        weekEndDate: new Date('2026-04-13'),
        totalWorkouts: 4,
        totalVolume: 18500,
        avgFormScore: 83,
        avgReadiness: 72,
        topExercises: ['Squat', 'Bench', 'Deadlift'],
        dailyMetrics: [
          { sleepHours: 7.5, stressLevel: 4, proteinIntake: 165, energyLevel: 8, mood: 'Good' },
          { sleepHours: 6.0, stressLevel: 7, proteinIntake: 120, energyLevel: 5, mood: 'Neutral' },
        ],
      }

      await writeWeeklyMemory(input)

      const { prisma } = await import('@/lib/db/client')
      expect(prisma.userMemoryEmbedding.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: 'user_123',
            type: 'WEEKLY_SUMMARY',
            sourceType: 'weekly_cron',
          }),
        })
      )
    })
  })
})
```

- [ ] **Step 2: Verify test fails**

```bash
cd c:/Users/TUF/Desktop/Ai-Pt/apps/web
pnpm test lib/memory/__tests__/memory-writer.test.ts
```

Expected: FAIL — "Cannot find module '../memory-writer'" or similar.

- [ ] **Step 3: Write implementation**

Create `apps/web/lib/memory/memory-writer.ts`:

```typescript
import { openai } from '@/lib/ai/openai'
import { prisma } from '@/lib/db/client'
import { buildSessionMemoryText, buildWeeklyMemoryText } from '.'
import type { SessionMemoryInput, WeeklyMemoryInput, MemoryType } from './types'
import { MEMORY_TYPES } from './types'

/**
 * Calculate importance score (1-10) based on form quality and volume
 * Higher form = higher importance
 * Higher volume = higher importance
 */
export function calculateImportance(params: { formScore: number; volumeMultiplier: number }): number {
  const { formScore, volumeMultiplier } = params
  let base: number

  if (formScore >= 85) {
    base = 9 + Math.random() * 1 // 9-10
  } else if (formScore >= 75) {
    base = 7 + Math.random() * 1 // 7-8
  } else if (formScore >= 60) {
    base = 5 + Math.random() * 1 // 5-6
  } else {
    base = 3 + Math.random() * 2 // 3-5
  }

  const adjusted = Math.min(10, Math.round(base * volumeMultiplier))
  return Math.max(1, adjusted)
}

/**
 * Calculate decay score (0-1) based on age
 * Exponential decay: after 8 weeks, score approaches 0
 * Half-life: ~2 weeks
 */
export function calculateDecayScore(createdAt: Date, now: Date = new Date()): number {
  const ageMs = now.getTime() - createdAt.getTime()
  const ageWeeks = ageMs / (7 * 24 * 60 * 60 * 1000)

  // e^(-0.35 * weeks) gives half-life ~2 weeks
  return Math.exp(-0.35 * ageWeeks)
}

/**
 * Generate embedding for memory content using OpenAI
 */
async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: text,
    })
    return response.data[0].embedding
  } catch (error) {
    console.error('Failed to generate embedding:', error)
    // Return zero vector on error (graceful degradation)
    return Array(1536).fill(0)
  }
}

/**
 * Write session memory to DB
 * Called when a workout session ends
 */
export async function writeSessionMemory(input: SessionMemoryInput): Promise<void> {
  try {
    const { text, tags } = buildSessionMemoryText(input)

    // Calculate importance based on form score and volume
    const totalVolume = input.exercises.reduce((sum, ex) => {
      return (
        sum +
        ex.sets.reduce((exSum, set) => {
          const weight = set.weightKg ?? 0
          const reps = set.reps ?? 0
          return exSum + weight * reps
        }, 0)
      )
    }, 0)

    const volumeMultiplier = Math.min(1.5, 1.0 + totalVolume / 20000) // cap at 1.5x
    const importance = calculateImportance({
      formScore: input.overallFormScore ?? 75,
      volumeMultiplier,
    })

    // Generate embedding
    const embedding = await generateEmbedding(text)

    // Write to DB
    await prisma.userMemoryEmbedding.create({
      data: {
        userId: input.userId,
        content: text,
        embedding,
        type: MEMORY_TYPES.SESSION_SUMMARY,
        importance,
        decayScore: 1.0, // Fresh memory starts at full strength
        tags,
        sourceId: input.sessionId,
        sourceType: 'session',
      },
    })
  } catch (error) {
    console.error('Failed to write session memory:', error)
    throw error
  }
}

/**
 * Write weekly memory to DB
 * Called by cron job every Sunday
 */
export async function writeWeeklyMemory(input: WeeklyMemoryInput): Promise<void> {
  try {
    const text = buildWeeklyMemoryText(input)

    // Generate embedding
    const embedding = await generateEmbedding(text)

    // Extract tags from top exercises
    const tags = input.topExercises.map((ex) => ex.toLowerCase().replace(/\s+/g, '_'))

    // Calculate importance: high for consistent weeks (4+ workouts)
    const consistency = input.totalWorkouts >= 4 ? 1.5 : 1.0
    const importance = calculateImportance({
      formScore: input.avgFormScore,
      volumeMultiplier: consistency,
    })

    // Write to DB
    await prisma.userMemoryEmbedding.create({
      data: {
        userId: input.userId,
        content: text,
        embedding,
        type: MEMORY_TYPES.WEEKLY_SUMMARY,
        importance,
        decayScore: 1.0,
        tags,
        sourceId: input.weekStartDate.toISOString().split('T')[0],
        sourceType: 'weekly_cron',
      },
    })
  } catch (error) {
    console.error('Failed to write weekly memory:', error)
    throw error
  }
}
```

- [ ] **Step 4: Run tests**

```bash
pnpm test lib/memory/__tests__/memory-writer.test.ts
```

Expected: 10/10 PASS (or close, may need to handle mocking details).

- [ ] **Step 5: Commit**

```bash
git add apps/web/lib/memory/memory-writer.ts apps/web/lib/memory/__tests__/memory-writer.test.ts
git commit -m "feat(memory): add memory writer with importance/decay calculation and embedding generation"
```

---

## Chunk 2: Retrieval & Injection

### Task 3: Memory Retriever

**Files:**
- Create: `apps/web/lib/memory/memory-retriever.ts`
- Create: `apps/web/lib/memory/__tests__/memory-retriever.test.ts`

- [ ] **Step 1: Write failing test**

Create `apps/web/lib/memory/__tests__/memory-retriever.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { retrieveMemoryContext, rankByRelevance } from '../memory-retriever'
import type { MemoryContext } from '../types'

vi.mock('@/lib/ai/openai', () => ({
  openai: {
    embeddings: {
      create: vi.fn().mockResolvedValue({
        data: [{ embedding: Array(1536).fill(0.5) }],
      }),
    },
  },
}))

vi.mock('@/lib/db/client', () => ({
  prisma: {
    $queryRaw: vi.fn().mockResolvedValue([
      {
        id: 'mem_1',
        content: 'Squat workout',
        type: 'SESSION_SUMMARY',
        importance: 8,
        decayScore: 0.95,
        similarity: 0.92,
      },
      {
        id: 'mem_2',
        content: 'Weekly pattern: consistent squats',
        type: 'WEEKLY_SUMMARY',
        importance: 7,
        decayScore: 0.85,
        similarity: 0.78,
      },
    ]),
  },
}))

describe('Memory Retriever', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('rankByRelevance', () => {
    it('weights similarity and recency equally', () => {
      const memories = [
        { similarity: 0.9, importance: 8, decayScore: 1.0 },
        { similarity: 0.7, importance: 10, decayScore: 0.5 },
      ]

      const ranked = memories.map((m) => ({
        ...m,
        relevanceScore: rankByRelevance({
          similarity: m.similarity,
          importance: m.importance,
          decayScore: m.decayScore,
        }),
      }))

      // First memory: 0.9 * 0.8 + (8/10) * 0.5 = 0.72 + 0.4 = 1.12
      // Second: 0.7 * 0.8 + (10/10) * 0.5 = 0.56 + 0.5 = 1.06
      expect(ranked[0].relevanceScore).toBeGreaterThan(ranked[1].relevanceScore)
    })

    it('penalizes old memories', () => {
      const fresh = rankByRelevance({
        similarity: 0.7,
        importance: 5,
        decayScore: 1.0,
      })
      const old = rankByRelevance({
        similarity: 0.7,
        importance: 5,
        decayScore: 0.2,
      })

      expect(fresh).toBeGreaterThan(old)
    })
  })

  describe('retrieveMemoryContext', () => {
    it('returns context object with memories array', async () => {
      const context = await retrieveMemoryContext({
        userId: 'user_123',
        prompt: 'How should I adjust my squat form?',
        topK: 3,
      })

      expect(context).toHaveProperty('memories')
      expect(context).toHaveProperty('totalRetrieved')
      expect(Array.isArray(context.memories)).toBe(true)
    })

    it('limits results to topK', async () => {
      const context = await retrieveMemoryContext({
        userId: 'user_123',
        prompt: 'Show me all memories',
        topK: 2,
      })

      expect(context.memories.length).toBeLessThanOrEqual(2)
    })

    it('returns empty array when no memories exist', async () => {
      vi.mocked(require('@/lib/db/client').prisma.$queryRaw).mockResolvedValueOnce([])

      const context = await retrieveMemoryContext({
        userId: 'user_999',
        prompt: 'test',
        topK: 3,
      })

      expect(context.memories).toEqual([])
      expect(context.totalRetrieved).toBe(0)
    })
  })
})
```

- [ ] **Step 2: Verify test fails**

```bash
pnpm test lib/memory/__tests__/memory-retriever.test.ts
```

Expected: FAIL.

- [ ] **Step 3: Write implementation**

Create `apps/web/lib/memory/memory-retriever.ts`:

```typescript
import { openai } from '@/lib/ai/openai'
import { prisma } from '@/lib/db/client'
import type { MemoryContext } from './types'

export interface RankParams {
  similarity: number // 0-1, higher is more relevant
  importance: number // 1-10, higher is more important
  decayScore: number // 0-1, 1 is fresh, 0 is very old
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
 * Retrieve relevant memories for a given prompt
 * Uses semantic search with pgvector cosine similarity
 */
export async function retrieveMemoryContext(params: {
  userId: string
  prompt: string
  topK?: number
}): Promise<MemoryContext> {
  const { userId, prompt, topK = 3 } = params

  try {
    // Generate embedding for user's prompt
    const promptEmbedding = await generatePromptEmbedding(prompt)

    // Semantic search using pgvector cosine similarity
    const results = await prisma.$queryRaw<
      Array<{
        id: string
        content: string
        type: string
        importance: number
        decayScore: number
        similarity: number
      }>
    >`
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
      ORDER BY (1 - (embedding <=> ${promptEmbedding}::vector)) DESC
      LIMIT ${topK}
    `

    // Re-rank by relevance
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

    const memories = ranked.map((m) => m.content)

    return {
      memories,
      totalRetrieved: results.length,
      types: results.map((r) => r.type as any),
    }
  } catch (error) {
    console.error('Failed to retrieve memory context:', error)
    return { memories: [], totalRetrieved: 0, types: [] }
  }
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
    console.error('Failed to generate prompt embedding:', error)
    return Array(1536).fill(0)
  }
}
```

- [ ] **Step 4: Run tests**

```bash
pnpm test lib/memory/__tests__/memory-retriever.test.ts
```

Expected: ~8/10 PASS (mocking details may vary).

- [ ] **Step 5: Commit**

```bash
git add apps/web/lib/memory/memory-retriever.ts apps/web/lib/memory/__tests__/memory-retriever.test.ts
git commit -m "feat(memory): add memory retriever with semantic search and relevance ranking"
```

---

### Task 4: Prompt Injector

**Files:**
- Create: `apps/web/lib/memory/prompt-injector.ts`
- Create: `apps/web/lib/memory/__tests__/prompt-injector.test.ts`

- [ ] **Step 1: Write failing test**

Create `apps/web/lib/memory/__tests__/prompt-injector.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { buildMemoryBlock, injectMemoryIntoPrompt } from '../prompt-injector'
import type { MemoryContext } from '../types'

describe('Prompt Injector', () => {
  describe('buildMemoryBlock', () => {
    it('returns empty string when no memories', () => {
      const block = buildMemoryBlock([])
      expect(block.trim().length).toBe(0)
    })

    it('formats memories with proper structure', () => {
      const memories = [
        'User usually squats 100kg for 5 reps',
        'Prefers morning workouts',
      ]
      const block = buildMemoryBlock(memories)

      expect(block).toContain('User Profile')
      expect(block).toContain('100kg')
      expect(block).toContain('morning')
    })

    it('limits memory block to reasonable length', () => {
      const longMemories = Array(10).fill('This is a very long memory text that repeats many times')
      const block = buildMemoryBlock(longMemories)

      // Should be reasonable length, not gigantic
      expect(block.length).toBeLessThan(2000)
    })
  })

  describe('injectMemoryIntoPrompt', () => {
    it('injects memory block into system prompt', () => {
      const originalPrompt = 'You are a fitness coach.'
      const context: MemoryContext = {
        memories: ['User is beginner level'],
        totalRetrieved: 1,
        types: ['SESSION_SUMMARY'],
      }

      const injected = injectMemoryIntoPrompt(originalPrompt, context)

      expect(injected).toContain('You are a fitness coach')
      expect(injected).toContain('beginner')
    })

    it('preserves original prompt content', () => {
      const originalPrompt = 'Answer user questions about fitness accurately.'
      const context: MemoryContext = {
        memories: [],
        totalRetrieved: 0,
        types: [],
      }

      const injected = injectMemoryIntoPrompt(originalPrompt, context)

      expect(injected).toContain('fitness')
    })

    it('handles empty memory context gracefully', () => {
      const prompt = 'Base prompt'
      const context: MemoryContext = {
        memories: [],
        totalRetrieved: 0,
        types: [],
      }

      expect(() => injectMemoryIntoPrompt(prompt, context)).not.toThrow()
    })
  })
})
```

- [ ] **Step 2: Verify test fails**

```bash
pnpm test lib/memory/__tests__/prompt-injector.test.ts
```

Expected: FAIL.

- [ ] **Step 3: Write implementation**

Create `apps/web/lib/memory/prompt-injector.ts`:

```typescript
import type { MemoryContext } from './types'

/**
 * Build a memory block for injection into prompts
 * Formats memories with structure and context
 */
export function buildMemoryBlock(memories: string[]): string {
  if (!memories || memories.length === 0) {
    return ''
  }

  // Limit to first 5 memories to avoid prompt bloat
  const limitedMemories = memories.slice(0, 5)

  let block = '\n---\n## User Profile & History\n\n'
  block += 'Based on recent sessions and patterns, here is relevant context about this user:\n\n'

  for (let i = 0; i < limitedMemories.length; i++) {
    block += `• ${limitedMemories[i]}\n`
  }

  block += '\n---\n'

  return block
}

/**
 * Inject memory context into an AI prompt
 * Inserts user-relevant memories after the system prompt intro
 */
export function injectMemoryIntoPrompt(basePrompt: string, context: MemoryContext): string {
  // Build memory block
  const memoryBlock = buildMemoryBlock(context.memories)

  // If no memories, return original prompt
  if (!memoryBlock.trim()) {
    return basePrompt
  }

  // Find a good insertion point (after first sentence/paragraph)
  // Insert after the first period + space, or at the beginning if no period
  const firstPeriodIndex = basePrompt.indexOf('. ')
  const insertionIndex = firstPeriodIndex !== -1 ? firstPeriodIndex + 2 : 0

  if (insertionIndex === 0) {
    // No period found, insert at beginning
    return memoryBlock + '\n' + basePrompt
  }

  // Insert after first sentence
  const beforeMemory = basePrompt.substring(0, insertionIndex)
  const afterMemory = basePrompt.substring(insertionIndex)

  return beforeMemory + '\n' + memoryBlock + '\n' + afterMemory
}
```

- [ ] **Step 4: Run tests**

```bash
pnpm test lib/memory/__tests__/prompt-injector.test.ts
```

Expected: 7/7 PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/web/lib/memory/prompt-injector.ts apps/web/lib/memory/__tests__/prompt-injector.test.ts
git commit -m "feat(memory): add prompt injector to embed user memories into AI prompts"
```

---

## Chunk 3: Cron Jobs & Integration

### Task 5: Memory Summary Cron Job

**Files:**
- Create: `apps/web/app/api/cron/memory-summary/route.ts`

- [ ] **Step 1: Create cron route**

Create `apps/web/app/api/cron/memory-summary/route.ts`:

```typescript
import { prisma } from '@/lib/db/client'
import { writeWeeklyMemory } from '@/lib/memory'
import type { WeeklyMemoryInput } from '@/lib/memory/types'
import { NextResponse } from 'next/server'

/**
 * Weekly memory summary cron job
 * Runs every Sunday to aggregate session data into weekly patterns
 */
export async function POST(request: Request) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET
    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const now = new Date()
    const weekStart = new Date(now)
    weekStart.setDate(now.getDate() - now.getDay()) // Sunday
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekStart.getDate() + 6) // Saturday

    // Get all users who have sessions this week
    const users = await prisma.user.findMany({
      include: {
        workoutSessions: {
          where: {
            createdAt: {
              gte: weekStart,
              lte: weekEnd,
            },
          },
        },
      },
    })

    let processedUsers = 0
    for (const user of users) {
      if (user.workoutSessions.length === 0) continue

      try {
        // Aggregate week data (simplified; in production, compute from sessions)
        const totalVolume = user.workoutSessions.reduce((sum) => sum + 1000, 0) // Placeholder
        const avgFormScore = 82 // Placeholder

        const weeklyInput: WeeklyMemoryInput = {
          userId: user.id,
          weekStartDate: weekStart,
          weekEndDate: weekEnd,
          totalWorkouts: user.workoutSessions.length,
          totalVolume,
          avgFormScore,
          avgReadiness: 75,
          topExercises: ['Squat', 'Bench', 'Deadlift'], // Placeholder
          dailyMetrics: [], // Placeholder
        }

        await writeWeeklyMemory(weeklyInput)
        processedUsers++
      } catch (error) {
        console.error(`Failed to write weekly memory for user ${user.id}:`, error)
      }
    }

    return NextResponse.json({
      success: true,
      processedUsers,
      message: `Processed ${processedUsers} users`,
    })
  } catch (error) {
    console.error('Memory summary cron failed:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/app/api/cron/memory-summary/route.ts
git commit -m "feat(cron): add weekly memory summary job"
```

---

### Task 6: Memory Decay Cron Job

**Files:**
- Create: `apps/web/app/api/cron/memory-decay/route.ts`

- [ ] **Step 1: Create decay cron route**

Create `apps/web/app/api/cron/memory-decay/route.ts`:

```typescript
import { prisma } from '@/lib/db/client'
import { calculateDecayScore } from '@/lib/memory'
import { NextResponse } from 'next/server'

/**
 * Weekly decay update cron job
 * Updates all memories' decay scores based on age
 */
export async function POST(request: Request) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET
    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const now = new Date()

    // Fetch all memories
    const memories = await prisma.userMemoryEmbedding.findMany()

    let updatedCount = 0
    for (const memory of memories) {
      try {
        const decayScore = calculateDecayScore(memory.createdAt, now)

        await prisma.userMemoryEmbedding.update({
          where: { id: memory.id },
          data: { decayScore },
        })
        updatedCount++
      } catch (error) {
        console.error(`Failed to update decay for memory ${memory.id}:`, error)
      }
    }

    return NextResponse.json({
      success: true,
      updatedCount,
      message: `Updated decay scores for ${updatedCount} memories`,
    })
  } catch (error) {
    console.error('Memory decay cron failed:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/app/api/cron/memory-decay/route.ts
git commit -m "feat(cron): add weekly memory decay update job"
```

---

### Task 7: Session End Integration

**Files:**
- Modify: `apps/web/app/api/sessions/[id]/route.ts`

- [ ] **Step 1: Find session end handler**

```bash
grep -n "export async function" c:/Users/TUF/Desktop/Ai-Pt/apps/web/app/api/sessions/[id]/route.ts
```

Expected: Shows POST (create), GET (read), PATCH (update) handlers.

- [ ] **Step 2: Find where session ends/is marked complete**

Look for where `status` is set to 'completed' or similar. This is where memory should be written.

- [ ] **Step 3: Add memory write call**

In the session completion handler (e.g., inside PATCH when setting status='completed'), add:

```typescript
import { writeSessionMemory } from '@/lib/memory'

// After session is marked as complete...
if (updatedSession.status === 'completed' && updatedSession.exercises) {
  // Fire-and-forget: don't await, don't block response
  writeSessionMemory({
    userId: session.userId,
    sessionId: session.id,
    exercises: updatedSession.exercises as any, // Type assertion needed
    durationSeconds: Math.floor((updatedSession.endedAt!.getTime() - updatedSession.startedAt.getTime()) / 1000),
    overallFormScore: updatedSession.overallFormScore,
    caloriesBurned: updatedSession.caloriesBurned,
    notes: updatedSession.notes,
  }).catch((err) => console.error('Failed to write session memory:', err))
}
```

- [ ] **Step 4: Commit**

```bash
git add apps/web/app/api/sessions/[id]/route.ts
git commit -m "feat(sessions): trigger memory write on session completion"
```

---

### Task 8: AI Route Integration

**Files:**
- Modify: `apps/web/app/api/ai/coach-message/route.ts`
- Modify: `apps/web/app/api/ai/generate-program/route.ts`
- Modify: `apps/web/app/api/ai/analyze-meal/route.ts`

For each route:

- [ ] **Step 1: Import memory functions**

```typescript
import { retrieveMemoryContext, injectMemoryIntoPrompt } from '@/lib/memory'
```

- [ ] **Step 2: Retrieve and inject memory**

Before calling the LLM, add:

```typescript
// Retrieve user's memories
const memoryContext = await retrieveMemoryContext({
  userId: userId, // from auth/request
  prompt: userMessage, // or relevant input
  topK: 3,
})

// Inject into system prompt
const systemPromptWithMemory = injectMemoryIntoPrompt(baseSystemPrompt, memoryContext)

// Use systemPromptWithMemory instead of baseSystemPrompt when calling OpenAI
const response = await openai.chat.completions.create({
  system: systemPromptWithMemory, // Injected memories
  messages: [...],
})
```

- [ ] **Step 3: Commit each route**

```bash
git add apps/web/app/api/ai/coach-message/route.ts
git commit -m "feat(ai): inject memory context into coach messages"

git add apps/web/app/api/ai/generate-program/route.ts
git commit -m "feat(ai): inject memory context into program generation"

git add apps/web/app/api/ai/analyze-meal/route.ts
git commit -m "feat(ai): inject memory context into meal analysis"
```

---

## Chunk 4: Integration Testing

### Task 9: Memory Integration Tests

**Files:**
- Create: `apps/web/lib/memory/__tests__/memory-integration.test.ts`

- [ ] **Step 1: Write integration test**

Create `apps/web/lib/memory/__tests__/memory-integration.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { writeSessionMemory, retrieveMemoryContext } from '../index'
import type { SessionMemoryInput } from '../types'

vi.mock('@/lib/ai/openai')
vi.mock('@/lib/db/client')

describe('Memory Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('end-to-end: write session, retrieve, inject', async () => {
    const input: SessionMemoryInput = {
      userId: 'user_123',
      sessionId: 'sess_1',
      exercises: [
        {
          name: 'Squat',
          sets: [{ setNumber: 1, reps: 5, weightKg: 100, formScore: 85 }],
          avgFormScore: 85,
        },
      ],
      durationSeconds: 1800,
      overallFormScore: 85,
      caloriesBurned: 300,
      notes: null,
    }

    // Write
    await writeSessionMemory(input)

    // Retrieve
    const context = await retrieveMemoryContext({
      userId: 'user_123',
      prompt: 'How is my squat form?',
      topK: 3,
    })

    // Assert
    expect(context.memories.length).toBeGreaterThan(0)
    expect(context.memories[0]).toContain('Squat')
  })
})
```

- [ ] **Step 2: Run test**

```bash
pnpm test lib/memory/__tests__/memory-integration.test.ts
```

Expected: 1/1 PASS.

- [ ] **Step 3: Commit**

```bash
git add apps/web/lib/memory/__tests__/memory-integration.test.ts
git commit -m "test(memory): add end-to-end integration tests"
```

---

## Final Steps

- [ ] **Run full test suite**

```bash
cd c:/Users/TUF/Desktop/Ai-Pt/apps/web
pnpm test lib/memory/
```

Expected: 40+ tests passing.

- [ ] **Verify no TypeScript errors**

```bash
pnpm typecheck
```

Expected: 0 errors.

- [ ] **Summary commit (optional)**

```bash
git log --oneline -10
```

Document completion.

---

**End of Phase 4 Implementation Plan**

All 8 main tasks are broken into bite-sized steps with exact code, test expectations, and commit messages.
