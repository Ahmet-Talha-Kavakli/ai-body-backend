# AI Memory Layer Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Kullanıcıyı gerçek anlamda tanıyan, sessiz arka planda çalışan, her AI çağrısında kişiselleştirilmiş bağlam sağlayan bir hafıza katmanı inşa etmek.

**Architecture:** Seans bitişinde ve haftalık cron'da otomatik hafıza üretilir, vector embedding ile saklanır. Her AI çağrısından önce `MemoryContextBuilder` semantik arama yaparak ilgili anıları çeker ve prompt'a enjekte eder. Kullanıcı hiçbir şey fark etmez — AI sadece "daha iyi" hissettirmeye başlar.

**Tech Stack:** Next.js 15, Prisma + pgvector, OpenAI `text-embedding-3-small`, Vitest, existing `prisma` client (`@/lib/db/client`), `UserMemoryEmbedding` tablosu genişletilecek.

**Import convention:** Bu projede `import { prisma } from '@/lib/db/client'` kullanılır — `db` alias değil.

---

## Dosya Haritası

### Yeni Dosyalar

| Dosya                                                      | Sorumluluk                                             |
| ---------------------------------------------------------- | ------------------------------------------------------ |
| `apps/web/lib/memory/types.ts`                             | Memory tip tanımları, interface'ler                    |
| `apps/web/lib/memory/session-summarizer.ts`                | Seans → hafıza metni dönüşümü                          |
| `apps/web/lib/memory/weekly-summarizer.ts`                 | Haftalık pattern analizi ve özet üretimi               |
| `apps/web/lib/memory/memory-writer.ts`                     | Hafıza üretme, importance/decay hesabı, DB'ye kaydetme |
| `apps/web/lib/memory/memory-retriever.ts`                  | Semantik arama + relevance re-ranking                  |
| `apps/web/lib/memory/prompt-injector.ts`                   | AI prompt'larına hafıza enjeksiyonu                    |
| `apps/web/lib/memory/index.ts`                             | Barrel export                                          |
| `apps/web/lib/memory/__tests__/session-summarizer.test.ts` |                                                        |
| `apps/web/lib/memory/__tests__/memory-writer.test.ts`      |                                                        |
| `apps/web/lib/memory/__tests__/memory-retriever.test.ts`   |                                                        |
| `apps/web/lib/memory/__tests__/prompt-injector.test.ts`    |                                                        |
| `apps/web/lib/memory/__tests__/memory-integration.test.ts` |                                                        |
| `apps/web/app/api/cron/memory-summary/route.ts`            | Haftalık hafıza cron job                               |
| `apps/web/app/api/cron/memory-decay/route.ts`              | Haftalık decay güncelleme cron job                     |

### Değiştirilen Dosyalar

| Dosya                                           | Ne Değişiyor                                                         |
| ----------------------------------------------- | -------------------------------------------------------------------- |
| `prisma/schema.prisma`                          | `UserMemoryEmbedding` genişletme + eski `MemoryType` enum güncelleme |
| `apps/web/app/api/sessions/[id]/route.ts`       | Seans bitişinde `writeSessionMemory()` fire-and-forget çağrısı       |
| `apps/web/app/api/ai/coach-message/route.ts`    | `injectMemoryIntoPrompt()` ile prompt zenginleştirme                 |
| `apps/web/app/api/ai/generate-program/route.ts` | `injectMemoryIntoPrompt()` ile prompt zenginleştirme                 |
| `apps/web/app/api/ai/analyze-meal/route.ts`     | `injectMemoryIntoPrompt()` ile prompt zenginleştirme                 |
| `apps/web/lib/coach/profile-context-builder.ts` | `relevantMemories` alanı ekleniyor                                   |
| `apps/web/lib/ai/gpt-coach.ts`                  | Memory block prompt'a ekleniyor                                      |
| `apps/web/lib/embeddings/search.ts`             | `searchRelevantMemories` deprecated, `retrieveMemoryContext` kullan  |

---

## Chunk 1: Temel Tipler ve Schema Migrasyonu

### Task 1: Memory Tip Tanımları

**Files:**

- Create: `apps/web/lib/memory/types.ts`

- [ ] **Step 1: Tip dosyasını oluştur**

```typescript
// apps/web/lib/memory/types.ts

// Tüm memory tipleri — DB'de String olarak saklanır (enum değil)
export const MEMORY_TYPES = {
  SESSION_SUMMARY: 'SESSION_SUMMARY',
  WEEKLY_SUMMARY: 'WEEKLY_SUMMARY',
  EXERCISE_PATTERN: 'EXERCISE_PATTERN',
  NUTRITION_PATTERN: 'NUTRITION_PATTERN',
  RECOVERY_PATTERN: 'RECOVERY_PATTERN',
  MILESTONE: 'MILESTONE',
  WEAKNESS: 'WEAKNESS',
  PREFERENCE: 'PREFERENCE',
} as const

export type MemoryType = keyof typeof MEMORY_TYPES

export interface SessionMemoryInput {
  userId: string
  sessionId: string
  // Egzersizler route'tan gruplandırılarak gelir
  exercises: Array<{
    name: string
    sets: Array<{
      setNumber: number
      reps: number | null
      weightKg: number | null
      formScore: number
    }>
    avgFormScore: number
  }>
  durationSeconds: number
  overallFormScore: number | null
  caloriesBurned: number | null
  notes: string | null
}

export interface WeeklyMemoryInput {
  userId: string
  weekStartDate: Date
  weekEndDate: Date
  totalWorkouts: number
  totalVolume: number
  avgFormScore: number
  avgReadiness: number
  topExercises: string[]
  dailyMetrics: Array<{
    sleepHours: number
    stressLevel: number
    proteinIntake: number
    energyLevel: number
    mood: string
  }>
}

export interface MemoryContext {
  memories: string[]
  totalRetrieved: number
  types: MemoryType[]
}

// buildSessionMemoryText'in tag modunda döndürdüğü tip
export interface SessionMemoryTextResult {
  text: string
  tags: string[]
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/lib/memory/types.ts
git commit -m "feat(memory): add memory layer type definitions"
```

---

### Task 2: Prisma Schema Migrasyonu

**Files:**

- Modify: `prisma/schema.prisma`

- [ ] **Step 1: Schema'da `UserMemoryEmbedding` modelini güncelle**

Mevcut:

```prisma
model UserMemoryEmbedding {
  id        String                       @id @default(cuid())
  userId    String
  content   String
  embedding Unsupported("vector(1536)")?
  type      MemoryType
  createdAt DateTime                     @default(now())
  user      User                         @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
}
```

Yeni hali:

```prisma
model UserMemoryEmbedding {
  id          String                       @id @default(cuid())
  userId      String
  content     String                       @db.Text
  embedding   Unsupported("vector(1536)")?
  type        String                       // MemoryType değeri: SESSION_SUMMARY, WEEKLY_SUMMARY, vb.
  importance  Int                          @default(5)    // 1-10
  decayScore  Float                        @default(1.0)  // üstel bozunma, haftalık cron günceller
  tags        String[]
  sourceId    String?                      // workoutSessionId veya weekStart ISO string
  sourceType  String?                      // 'session' | 'weekly_cron'
  createdAt   DateTime                     @default(now())
  user        User                         @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([type])
  @@index([userId, type])
  @@index([createdAt])
  @@index([userId, createdAt])
}
```

- [ ] **Step 2: `MemoryType` enum'unu schema'dan kaldır veya güncelle**

Schema'nın altında bulunan:

```prisma
enum MemoryType {
  SESSION_SUMMARY
  WEEKLY_SUMMARY
  MILESTONE
  PATTERN
}
```

Bu bloğu tamamen kaldır. `UserMemoryEmbedding.type` artık `String` — TypeScript tarafında `MEMORY_TYPES` const ile kontrol edilecek.

- [ ] **Step 3: Migrasyon oluştur**

```bash
cd apps/web
npx prisma migrate dev --name "extend_memory_embedding_v2"
```

Beklenen: Migration başarılı, yeni kolonlar eklendi, enum kaldırıldı.

- [ ] **Step 4: Prisma client yenile**

```bash
npx prisma generate
```

- [ ] **Step 5: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/
git commit -m "feat(memory): extend UserMemoryEmbedding - add importance, decay, tags, source fields"
```

---

## Chunk 2: Summarizer'lar

### Task 3: Session Summarizer

**Files:**

- Create: `apps/web/lib/memory/session-summarizer.ts`
- Create: `apps/web/lib/memory/__tests__/session-summarizer.test.ts`

- [ ] **Step 1: Failing test yaz**

```typescript
// apps/web/lib/memory/__tests__/session-summarizer.test.ts
import { describe, it, expect } from 'vitest'
import { buildSessionMemoryText } from '../session-summarizer'
import type { SessionMemoryInput } from '../types'

const mockInput: SessionMemoryInput = {
  userId: 'user_123',
  sessionId: 'session_abc',
  exercises: [
    {
      name: 'Barbell Squat',
      sets: [
        { setNumber: 1, reps: 5, weightKg: 100, formScore: 85 },
        { setNumber: 2, reps: 5, weightKg: 100, formScore: 88 },
        { setNumber: 3, reps: 4, weightKg: 100, formScore: 72 },
      ],
      avgFormScore: 81.7,
    },
    {
      name: 'Romanian Deadlift',
      sets: [
        { setNumber: 1, reps: 8, weightKg: 80, formScore: 90 },
        { setNumber: 2, reps: 8, weightKg: 80, formScore: 92 },
      ],
      avgFormScore: 91,
    },
  ],
  durationSeconds: 3600,
  overallFormScore: 85,
  caloriesBurned: 450,
  notes: 'Sol diz biraz ağrıdı son sette',
}

describe('buildSessionMemoryText', () => {
  it('includes exercise names', () => {
    const { text } = buildSessionMemoryText(mockInput)
    expect(text).toContain('Barbell Squat')
    expect(text).toContain('Romanian Deadlift')
  })

  it('includes max weight', () => {
    const { text } = buildSessionMemoryText(mockInput)
    expect(text).toContain('100')
  })

  it('includes total volume', () => {
    const { text } = buildSessionMemoryText(mockInput)
    // Barbell Squat: (5+5+4)*100=1400, RDL: (8+8)*80=1280 → toplam 2680
    expect(text).toContain('2680')
  })

  it('includes overall form score', () => {
    const { text } = buildSessionMemoryText(mockInput)
    expect(text).toContain('85')
  })

  it('includes user notes', () => {
    const { text } = buildSessionMemoryText(mockInput)
    expect(text).toContain('Sol diz')
  })

  it('extracts tags from exercise names', () => {
    const { tags } = buildSessionMemoryText(mockInput)
    expect(tags).toContain('squat')
    expect(tags).toContain('deadlift')
  })

  it('tags pain keywords from notes', () => {
    const { tags } = buildSessionMemoryText(mockInput)
    expect(tags).toContain('knee_issue')
    expect(tags).toContain('pain_reported')
  })

  it('handles null optional fields without throwing', () => {
    const minimal: SessionMemoryInput = {
      ...mockInput,
      overallFormScore: null,
      caloriesBurned: null,
      notes: null,
    }
    expect(() => buildSessionMemoryText(minimal)).not.toThrow()
  })
})
```

- [ ] **Step 2: Test'in fail ettiğini doğrula**

```bash
cd apps/web
pnpm test lib/memory/__tests__/session-summarizer.test.ts
```

Beklenen: FAIL — `buildSessionMemoryText` bulunamıyor

- [ ] **Step 3: Implementasyon yaz**

```typescript
// apps/web/lib/memory/session-summarizer.ts

import type { SessionMemoryInput, SessionMemoryTextResult } from './types'

function extractTags(exercises: SessionMemoryInput['exercises'], notes: string | null): string[] {
  const tags: string[] = []

  for (const ex of exercises) {
    const lower = ex.name.toLowerCase()
    if (lower.includes('squat')) tags.push('squat')
    if (lower.includes('deadlift')) tags.push('deadlift')
    if (lower.includes('bench')) tags.push('bench')
    if (lower.includes('press')) tags.push('press')
    if (lower.includes('row')) tags.push('row')
    if (lower.includes('pull')) tags.push('pull')
    if (lower.includes('curl')) tags.push('curl')
    if (lower.includes('lunge')) tags.push('lunge')
    // İlk kelimeyi de ekle (örn. "Barbell" → barbell)
    const firstWord = lower.split(' ')[0]
    if (firstWord && !tags.includes(firstWord)) tags.push(firstWord)
  }

  if (notes) {
    const n = notes.toLowerCase()
    if (n.includes('diz') || n.includes('knee')) tags.push('knee_issue')
    if (n.includes('omuz') || n.includes('shoulder')) tags.push('shoulder_issue')
    if (n.includes('bel') || n.includes('back')) tags.push('back_issue')
    if (n.includes('ağrı') || n.includes('acı') || n.includes('pain')) tags.push('pain_reported')
  }

  return [...new Set(tags)]
}

export function buildSessionMemoryText(input: SessionMemoryInput): SessionMemoryTextResult {
  const { exercises, durationSeconds, overallFormScore, caloriesBurned, notes } = input

  let totalVolume = 0
  const exerciseSummaries: string[] = []

  for (const ex of exercises) {
    let exVolume = 0
    let maxWeight = 0
    let totalReps = 0

    for (const set of ex.sets) {
      const reps = set.reps ?? 0
      const weight = set.weightKg ?? 0
      exVolume += reps * weight
      maxWeight = Math.max(maxWeight, weight)
      totalReps += reps
    }

    totalVolume += exVolume
    const setCount = ex.sets.length
    const avgReps = setCount > 0 ? Math.round(totalReps / setCount) : 0

    const summary =
      maxWeight > 0
        ? `${ex.name}: ${setCount}x${avgReps} @ ${maxWeight}kg (form: ${Math.round(ex.avgFormScore)}/100, hacim: ${exVolume}kg)`
        : `${ex.name}: ${setCount} set, ${totalReps} rep (form: ${Math.round(ex.avgFormScore)}/100)`

    exerciseSummaries.push(summary)
  }

  const durationMin = Math.round(durationSeconds / 60)
  const dateStr = new Date().toLocaleDateString('tr-TR')

  let text = `[Antrenman - ${dateStr}]\n`
  text += `Süre: ${durationMin} dk | Toplam Hacim: ${totalVolume}kg`

  if (overallFormScore !== null) text += ` | Form: ${Math.round(overallFormScore)}/100`
  if (caloriesBurned !== null) text += ` | Kalori: ${Math.round(caloriesBurned)}`

  text += `\nEgzersizler:\n${exerciseSummaries.join('\n')}`
  if (notes) text += `\nNot: ${notes}`

  return { text, tags: extractTags(exercises, notes) }
}
```

- [ ] **Step 4: Testleri çalıştır**

```bash
pnpm test lib/memory/__tests__/session-summarizer.test.ts
```

Beklenen: 8/8 PASS

- [ ] **Step 5: Commit**

```bash
git add apps/web/lib/memory/session-summarizer.ts apps/web/lib/memory/__tests__/session-summarizer.test.ts
git commit -m "feat(memory): add session summarizer with volume calculation, tag extraction"
```

---

### Task 4: Weekly Summarizer

**Files:**

- Create: `apps/web/lib/memory/weekly-summarizer.ts`
- Create: `apps/web/lib/memory/__tests__/weekly-summarizer.test.ts`

- [ ] **Step 1: Test yaz**

```typescript
// apps/web/lib/memory/__tests__/weekly-summarizer.test.ts
import { describe, it, expect } from 'vitest'
import { buildWeeklyMemoryText } from '../weekly-summarizer'
import type { WeeklyMemoryInput } from '../types'

const mockWeek: WeeklyMemoryInput = {
  userId: 'user_123',
  weekStartDate: new Date('2026-04-07'),
  weekEndDate: new Date('2026-04-13'),
  totalWorkouts: 4,
  totalVolume: 18500,
  avgFormScore: 83,
  avgReadiness: 72,
  topExercises: ['Barbell Squat', 'Bench Press', 'Deadlift'],
  dailyMetrics: [
    { sleepHours: 7.5, stressLevel: 4, proteinIntake: 165, energyLevel: 8, mood: 'Good' },
    { sleepHours: 6.0, stressLevel: 7, proteinIntake: 120, energyLevel: 5, mood: 'Neutral' },
    { sleepHours: 8.0, stressLevel: 3, proteinIntake: 180, energyLevel: 9, mood: 'Excellent' },
    { sleepHours: 7.0, stressLevel: 5, proteinIntake: 155, energyLevel: 7, mood: 'Good' },
  ],
}

describe('buildWeeklyMemoryText', () => {
  it('includes workout count and volume', () => {
    const text = buildWeeklyMemoryText(mockWeek)
    expect(text).toContain('4')
    expect(text).toContain('18500')
  })

  it('includes top exercises', () => {
    const text = buildWeeklyMemoryText(mockWeek)
    expect(text).toContain('Barbell Squat')
    expect(text).toContain('Bench Press')
  })

  it('calculates and shows average sleep', () => {
    const text = buildWeeklyMemoryText(mockWeek)
    // (7.5+6+8+7)/4 = 7.1
    expect(text).toContain('7.1')
  })

  it('includes form and readiness scores', () => {
    const text = buildWeeklyMemoryText(mockWeek)
    expect(text).toContain('83')
    expect(text).toContain('72')
  })

  it('contains a consistency label for 4 workouts', () => {
    const text = buildWeeklyMemoryText(mockWeek)
    expect(text).toMatch(/4 antrenman/i)
  })

  it('handles empty dailyMetrics array', () => {
    const input = { ...mockWeek, dailyMetrics: [] }
    expect(() => buildWeeklyMemoryText(input)).not.toThrow()
  })
})
```

- [ ] **Step 2: Fail doğrula**

```bash
pnpm test lib/memory/__tests__/weekly-summarizer.test.ts
```

- [ ] **Step 3: Implementasyon**

```typescript
// apps/web/lib/memory/weekly-summarizer.ts

import type { WeeklyMemoryInput } from './types'

export function buildWeeklyMemoryText(input: WeeklyMemoryInput): string {
  const {
    weekStartDate,
    weekEndDate,
    totalWorkouts,
    totalVolume,
    avgFormScore,
    avgReadiness,
    topExercises,
    dailyMetrics,
  } = input

  const startStr = weekStartDate.toLocaleDateString('tr-TR')
  const endStr = weekEndDate.toLocaleDateString('tr-TR')

  const n = dailyMetrics.length

  const avgSleep =
    n > 0 ? Math.round((dailyMetrics.reduce((s, m) => s + m.sleepHours, 0) / n) * 10) / 10 : 0
  const avgStress = n > 0 ? Math.round(dailyMetrics.reduce((s, m) => s + m.stressLevel, 0) / n) : 0
  const avgProtein =
    n > 0 ? Math.round(dailyMetrics.reduce((s, m) => s + m.proteinIntake, 0) / n) : 0
  const avgEnergy =
    n > 0 ? Math.round((dailyMetrics.reduce((s, m) => s + m.energyLevel, 0) / n) * 10) / 10 : 0

  const consistency =
    totalWorkouts >= 5
      ? `${totalWorkouts} antrenman — mükemmel tutarlılık`
      : totalWorkouts === 4
        ? `4 antrenman — güçlü tutarlılık`
        : totalWorkouts === 3
          ? `3 antrenman — iyi`
          : totalWorkouts === 2
            ? `2 antrenman — orta`
            : `1 antrenman — düşük`

  let text = `[Haftalık Özet - ${startStr} / ${endStr}]\n`
  text += `Antrenman: ${consistency} | Toplam Hacim: ${totalVolume}kg\n`
  text += `Form Ort: ${Math.round(avgFormScore)}/100 | Hazırlık Ort: ${Math.round(avgReadiness)}/100\n`
  text += `Ana Egzersizler: ${topExercises.join(', ')}\n`
  text += `Uyku Ort: ${avgSleep}s | Stres Ort: ${avgStress}/10 | Enerji: ${avgEnergy}/10 | Protein: ${avgProtein}g/gün`

  return text
}
```

- [ ] **Step 4: Testleri çalıştır — PASS**

```bash
pnpm test lib/memory/__tests__/weekly-summarizer.test.ts
```

- [ ] **Step 5: Commit**

```bash
git add apps/web/lib/memory/weekly-summarizer.ts apps/web/lib/memory/__tests__/weekly-summarizer.test.ts
git commit -m "feat(memory): add weekly summarizer with pattern detection and consistency labeling"
```

---

## Chunk 3: Memory Writer

### Task 5: Memory Writer — Core

**Files:**

- Create: `apps/web/lib/memory/memory-writer.ts`
- Create: `apps/web/lib/memory/__tests__/memory-writer.test.ts`

- [ ] **Step 1: Failing testler yaz**

```typescript
// apps/web/lib/memory/__tests__/memory-writer.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { calculateImportance, calculateDecayScore, writeSessionMemory } from '../memory-writer'
import type { SessionMemoryInput } from '../types'

vi.mock('@/lib/db/client', () => ({
  prisma: {
    userMemoryEmbedding: {
      create: vi.fn().mockResolvedValue({ id: 'mem_1' }),
    },
  },
}))

vi.mock('@/lib/embeddings/client', () => ({
  createEmbedding: vi.fn().mockResolvedValue(new Array(1536).fill(0.1)),
}))

vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn() },
}))

const mockInput: SessionMemoryInput = {
  userId: 'user_123',
  sessionId: 'session_abc',
  exercises: [
    {
      name: 'Barbell Squat',
      sets: [
        { setNumber: 1, reps: 5, weightKg: 120, formScore: 90 },
        { setNumber: 2, reps: 5, weightKg: 120, formScore: 88 },
      ],
      avgFormScore: 89,
    },
  ],
  durationSeconds: 2700,
  overallFormScore: 89,
  caloriesBurned: 380,
  notes: null,
}

describe('calculateImportance', () => {
  it('returns high importance for high form score', () => {
    expect(
      calculateImportance({ overallFormScore: 95, totalVolume: 1000, hasPainNote: false })
    ).toBeGreaterThanOrEqual(8)
  })

  it('returns high importance when pain note exists regardless of form score', () => {
    expect(
      calculateImportance({ overallFormScore: 60, totalVolume: 500, hasPainNote: true })
    ).toBeGreaterThanOrEqual(8)
  })

  it('returns moderate importance for average session', () => {
    const score = calculateImportance({
      overallFormScore: 70,
      totalVolume: 1000,
      hasPainNote: false,
    })
    expect(score).toBeGreaterThanOrEqual(4)
    expect(score).toBeLessThanOrEqual(7)
  })

  it('clamps result between 1 and 10', () => {
    expect(
      calculateImportance({ overallFormScore: 5, totalVolume: 0, hasPainNote: false })
    ).toBeGreaterThanOrEqual(1)
    expect(
      calculateImportance({ overallFormScore: 100, totalVolume: 10000, hasPainNote: true })
    ).toBeLessThanOrEqual(10)
  })
})

describe('calculateDecayScore', () => {
  it('returns ~1.0 for a brand new memory', () => {
    expect(calculateDecayScore(new Date(), 'SESSION_SUMMARY')).toBeCloseTo(1.0, 1)
  })

  it('decays over 30 days for sessions', () => {
    const ago = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    expect(calculateDecayScore(ago, 'SESSION_SUMMARY')).toBeCloseTo(0.5, 1)
  })

  it('milestones decay slower than sessions at same age', () => {
    const tenDaysAgo = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000)
    const session = calculateDecayScore(tenDaysAgo, 'SESSION_SUMMARY')
    const milestone = calculateDecayScore(tenDaysAgo, 'MILESTONE')
    expect(milestone).toBeGreaterThan(session)
  })
})

describe('writeSessionMemory', () => {
  beforeEach(() => vi.clearAllMocks())

  it('creates exactly one memory record', async () => {
    const { prisma } = await import('@/lib/db/client')
    await writeSessionMemory(mockInput)
    expect(prisma.userMemoryEmbedding.create).toHaveBeenCalledOnce()
  })

  it('saves correct userId and type', async () => {
    const { prisma } = await import('@/lib/db/client')
    await writeSessionMemory(mockInput)
    const data = (prisma.userMemoryEmbedding.create as any).mock.calls[0][0].data
    expect(data.userId).toBe('user_123')
    expect(data.type).toBe('SESSION_SUMMARY')
  })

  it('saves sessionId as sourceId', async () => {
    const { prisma } = await import('@/lib/db/client')
    await writeSessionMemory(mockInput)
    const data = (prisma.userMemoryEmbedding.create as any).mock.calls[0][0].data
    expect(data.sourceId).toBe('session_abc')
    expect(data.sourceType).toBe('session')
  })

  it('does not throw when DB fails — logs silently', async () => {
    const { prisma } = await import('@/lib/db/client')
    ;(prisma.userMemoryEmbedding.create as any).mockRejectedValueOnce(new Error('DB error'))
    await expect(writeSessionMemory(mockInput)).resolves.not.toThrow()
  })
})
```

- [ ] **Step 2: Fail doğrula**

```bash
pnpm test lib/memory/__tests__/memory-writer.test.ts
```

- [ ] **Step 3: Implementasyon**

```typescript
// apps/web/lib/memory/memory-writer.ts

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
// Half-life: kaç günde önem yarıya düşer
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

    await prisma.userMemoryEmbedding.create({
      data: {
        userId: params.userId,
        content: params.content,
        embedding: embedding as never,
        type: params.type,
        importance: params.importance,
        decayScore,
        tags: params.tags,
        sourceId: params.sourceId,
        sourceType: params.sourceType,
      },
    })
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
```

- [ ] **Step 4: Testleri çalıştır — PASS**

```bash
pnpm test lib/memory/__tests__/memory-writer.test.ts
```

- [ ] **Step 5: Commit**

```bash
git add apps/web/lib/memory/memory-writer.ts apps/web/lib/memory/__tests__/memory-writer.test.ts
git commit -m "feat(memory): add memory writer with importance scoring and exponential decay"
```

---

## Chunk 4: Memory Retriever + Prompt Injector

### Task 6: Memory Retriever

**Files:**

- Create: `apps/web/lib/memory/memory-retriever.ts`
- Create: `apps/web/lib/memory/__tests__/memory-retriever.test.ts`

- [ ] **Step 1: Failing testler**

```typescript
// apps/web/lib/memory/__tests__/memory-retriever.test.ts
import { describe, it, expect, vi } from 'vitest'
import { rankByRelevance, retrieveMemoryContext } from '../memory-retriever'

// $queryRaw mock — Prisma raw query sonucunu simüle eder
vi.mock('@/lib/db/client', () => ({
  prisma: {
    $queryRaw: vi.fn().mockResolvedValue([
      {
        content: '[Antrenman - 01.04] Squat: 3x5 @ 100kg',
        importance: 8,
        decayScore: 0.9,
        type: 'SESSION_SUMMARY',
      },
      {
        content: '[Haftalık Özet] 4 antrenman tutarlı',
        importance: 7,
        decayScore: 0.7,
        type: 'WEEKLY_SUMMARY',
      },
      {
        content: '[Antrenman - 15.03] Bench: 4x5 @ 80kg',
        importance: 5,
        decayScore: 0.4,
        type: 'SESSION_SUMMARY',
      },
    ]),
  },
}))

vi.mock('@/lib/embeddings/client', () => ({
  createEmbedding: vi.fn().mockResolvedValue(new Array(1536).fill(0.1)),
}))

vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn() },
}))

describe('rankByRelevance', () => {
  const items = [
    { content: 'A', importance: 8, decayScore: 0.9 },
    { content: 'B', importance: 5, decayScore: 0.5 },
    { content: 'C', importance: 7, decayScore: 0.8 },
  ]

  it('ranks highest importance*decay first', () => {
    // A: 0.8*0.9=0.72, C: 0.7*0.8=0.56, B: 0.5*0.5=0.25
    const ranked = rankByRelevance(items)
    expect(ranked[0].content).toBe('A')
    expect(ranked[2].content).toBe('B')
  })

  it('returns all items', () => {
    expect(rankByRelevance(items)).toHaveLength(3)
  })

  it('does not mutate the original array', () => {
    const copy = [...items]
    rankByRelevance(items)
    expect(items[0].content).toBe(copy[0].content)
  })
})

describe('retrieveMemoryContext', () => {
  it('returns memories array', async () => {
    const ctx = await retrieveMemoryContext('user_123', 'squat form')
    expect(ctx.memories).toBeInstanceOf(Array)
    expect(ctx.totalRetrieved).toBeGreaterThan(0)
  })

  it('respects limit option', async () => {
    const ctx = await retrieveMemoryContext('user_123', 'nutrition', { limit: 1 })
    expect(ctx.memories.length).toBeLessThanOrEqual(1)
  })

  it('returns empty context when no memories', async () => {
    const { prisma } = await import('@/lib/db/client')
    ;(prisma.$queryRaw as any).mockResolvedValueOnce([])
    const ctx = await retrieveMemoryContext('user_123', 'anything')
    expect(ctx.memories).toHaveLength(0)
    expect(ctx.totalRetrieved).toBe(0)
  })

  it('returns empty context on DB error without throwing', async () => {
    const { prisma } = await import('@/lib/db/client')
    ;(prisma.$queryRaw as any).mockRejectedValueOnce(new Error('DB down'))
    const ctx = await retrieveMemoryContext('user_123', 'query')
    expect(ctx.memories).toHaveLength(0)
  })
})
```

- [ ] **Step 2: Fail doğrula**

```bash
pnpm test lib/memory/__tests__/memory-retriever.test.ts
```

- [ ] **Step 3: Implementasyon**

```typescript
// apps/web/lib/memory/memory-retriever.ts

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

interface RetrieveOptions {
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
    const fetchLimit = limit * 2 // cosine similarity ile fazla çek, sonra re-rank et

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
```

- [ ] **Step 4: Testleri çalıştır — PASS**

```bash
pnpm test lib/memory/__tests__/memory-retriever.test.ts
```

- [ ] **Step 5: Commit**

```bash
git add apps/web/lib/memory/memory-retriever.ts apps/web/lib/memory/__tests__/memory-retriever.test.ts
git commit -m "feat(memory): add memory retriever with cosine similarity and relevance re-ranking"
```

---

### Task 7: Prompt Injector

**Files:**

- Create: `apps/web/lib/memory/prompt-injector.ts`
- Create: `apps/web/lib/memory/__tests__/prompt-injector.test.ts`

- [ ] **Step 1: Test yaz**

```typescript
// apps/web/lib/memory/__tests__/prompt-injector.test.ts
import { describe, it, expect, vi } from 'vitest'
import { buildMemoryBlock, injectMemoryIntoPrompt } from '../prompt-injector'

vi.mock('../memory-retriever', () => ({
  retrieveMemoryContext: vi.fn().mockResolvedValue({
    memories: [
      '[Antrenman - 01.04.2026] Squat: 3x5 @ 100kg, form: 85/100',
      '[Haftalık Özet] 4 antrenman, iyi tutarlılık, uyku ort: 7.2s',
    ],
    totalRetrieved: 2,
    types: ['SESSION_SUMMARY', 'WEEKLY_SUMMARY'],
  }),
}))

describe('buildMemoryBlock', () => {
  it('wraps memories in a labeled section', () => {
    const block = buildMemoryBlock(['mem 1', 'mem 2'])
    expect(block).toContain('KULLANICI GEÇMİŞİ')
    expect(block).toContain('mem 1')
    expect(block).toContain('mem 2')
  })

  it('returns empty string when no memories', () => {
    expect(buildMemoryBlock([])).toBe('')
  })
})

describe('injectMemoryIntoPrompt', () => {
  it('appends memory block after base prompt', async () => {
    const result = await injectMemoryIntoPrompt('user_123', 'squat coaching', 'Sen bir koçsun.')
    expect(result).toContain('Sen bir koçsun.')
    expect(result).toContain('KULLANICI GEÇMİŞİ')
    expect(result).toContain('Squat')
  })

  it('memory block comes after base prompt', async () => {
    const result = await injectMemoryIntoPrompt('user_123', 'squat', 'BENIM_PROMPT')
    expect(result.indexOf('BENIM_PROMPT')).toBeLessThan(result.indexOf('KULLANICI GEÇMİŞİ'))
  })

  it('returns original prompt when no memories', async () => {
    const { retrieveMemoryContext } = await import('../memory-retriever')
    ;(retrieveMemoryContext as any).mockResolvedValueOnce({
      memories: [],
      totalRetrieved: 0,
      types: [],
    })
    const result = await injectMemoryIntoPrompt('user_123', 'x', 'Base prompt.')
    expect(result).toBe('Base prompt.')
  })
})
```

- [ ] **Step 2: Fail doğrula, implementasyon yaz**

```typescript
// apps/web/lib/memory/prompt-injector.ts

import { retrieveMemoryContext } from './memory-retriever'
import type { RetrieveOptions } from './memory-retriever'

export function buildMemoryBlock(memories: string[]): string {
  if (memories.length === 0) return ''

  return [
    '',
    '=== KULLANICI GEÇMİŞİ ===',
    'Bu kullanıcının geçmiş antrenman ve beslenme verilerinden otomatik çıkarılan bilgiler.',
    'Bu bilgileri kullanıcıya söyleme — sadece kararlarını bu bağlamla sessizce zenginleştir:',
    '',
    ...memories,
    '=== GEÇMİŞ SONU ===',
  ].join('\n')
}

export async function injectMemoryIntoPrompt(
  userId: string,
  queryHint: string,
  basePrompt: string,
  options?: RetrieveOptions
): Promise<string> {
  const ctx = await retrieveMemoryContext(userId, queryHint, options)
  const block = buildMemoryBlock(ctx.memories)
  return block ? basePrompt + block : basePrompt
}
```

- [ ] **Step 3: Testleri çalıştır — PASS**

```bash
pnpm test lib/memory/__tests__/prompt-injector.test.ts
```

- [ ] **Step 4: Commit**

```bash
git add apps/web/lib/memory/prompt-injector.ts apps/web/lib/memory/__tests__/prompt-injector.test.ts
git commit -m "feat(memory): add prompt injector - silently enriches AI prompts with user history"
```

---

## Chunk 5: Coach Context + GPT Coach Entegrasyonu

### Task 8: Profile Context Builder Entegrasyonu

**Files:**

- Modify: `apps/web/lib/coach/profile-context-builder.ts`
- Modify: `apps/web/lib/ai/gpt-coach.ts`

- [ ] **Step 1: profile-context-builder.ts'i oku**

Dosyayı oku: `apps/web/lib/coach/profile-context-builder.ts`

- [ ] **Step 2: `CoachContext` interface'ine `relevantMemories` ekle**

`CoachContext` interface'ini şu şekilde güncelle:

```typescript
export interface CoachContext {
  basicProfile: any
  healthMetrics: any
  recentDailyMetrics: any[]
  weaknesses: any[]
  averageMetrics: {
    sleepHours: number
    stressLevel: number
    proteinCompliance: number
    consistencyPct: number
  }
  relevantMemories: string[] // ← YENİ
}
```

- [ ] **Step 3: `buildCoachContext` fonksiyonunu güncelle**

Return'den önce şunu ekle:

```typescript
// Geçmiş hafızayı çek (hata olsa bile devam et)
let relevantMemories: string[] = []
try {
  const { retrieveMemoryContext } = await import('@/lib/memory/memory-retriever')
  const memCtx = await retrieveMemoryContext(
    userId,
    'workout performance nutrition recovery form score',
    { limit: 4 }
  )
  relevantMemories = memCtx.memories
} catch {
  // Memory optional — sessizce geç
}
```

Return objesini güncelle:

```typescript
return {
  basicProfile,
  healthMetrics,
  recentDailyMetrics: dailyMetrics,
  weaknesses,
  averageMetrics: {
    sleepHours: Math.round(sleepAvg * 10) / 10,
    stressLevel: Math.round(stressAvg),
    proteinCompliance: Math.round(proteinCompliance),
    consistencyPct: 0,
  },
  relevantMemories, // ← YENİ
}
```

- [ ] **Step 4: gpt-coach.ts'de `buildCoachPrompt`'a memory ekle**

`apps/web/lib/ai/gpt-coach.ts` dosyasında `buildCoachPrompt` fonksiyonunu bul.
`profile.weaknesses` bloğunun hemen ardına ekle:

```typescript
if (profile.relevantMemories && profile.relevantMemories.length > 0) {
  prompt += `\n=== KULLANICI GEÇMİŞİ ===\n`
  prompt += `(Kullanıcıya söyleme — sadece coaching kararlarında kullan)\n`
  prompt += profile.relevantMemories.join('\n')
  prompt += `\n=== GEÇMİŞ SONU ===\n`
}
```

- [ ] **Step 5: Commit**

```bash
git add apps/web/lib/coach/profile-context-builder.ts apps/web/lib/ai/gpt-coach.ts
git commit -m "feat(memory): inject retrieved memories into coach context and GPT coaching prompt"
```

---

## Chunk 6: Route Entegrasyonları

### Task 9: Seans Bitişinde Hafıza Yaz

**Files:**

- Modify: `apps/web/app/api/sessions/[id]/route.ts`

- [ ] **Step 1: Dosyayı oku**

Dosya: `apps/web/app/api/sessions/[id]/route.ts`

- [ ] **Step 2: Import ekle**

Bu dosya halihazırda `import { db } from '@/lib/db/client'` kullanıyor (`db` ve `prisma` alias'tır, ikisi de çalışır).
Yeni memory import'larını ekle:

```typescript
import { writeSessionMemory } from '@/lib/memory/memory-writer'
import type { SessionMemoryInput } from '@/lib/memory/types'
```

- [ ] **Step 3: Transaction tamamlandıktan sonra, `return NextResponse.json(...)` satırından önce ekle**

`completedSets` Zod validation (`sessionCompleteSchema`) üzerinden geçtiği için `exerciseName` ve `exerciseSlug` alanları garantili olarak mevcuttur (`apps/web/lib/validation/schemas.ts` satır 19-20).

Aşağıdaki kodu transaction'ın dışına, return'den hemen önce ekle:

```typescript
// Hafıza katmanına yaz — fire-and-forget, response'u bloklamaz
if (completedSets && completedSets.length > 0) {
  const exerciseMap: Record<
    string,
    { name: string; sets: SessionMemoryInput['exercises'][0]['sets']; scores: number[] }
  > = {}

  for (const set of completedSets) {
    // exerciseName, sessionCompleteSchema Zod validation'dan garantili geliyor
    const key = set.exerciseName
    if (!exerciseMap[key]) exerciseMap[key] = { name: key, sets: [], scores: [] }
    exerciseMap[key].sets.push({
      setNumber: set.setNumber,
      reps: set.reps ?? null,
      weightKg: set.weightKg ?? null,
      formScore: set.formScore ?? 0,
    })
    exerciseMap[key].scores.push(set.formScore ?? 0)
  }

  writeSessionMemory({
    userId: user.id,
    sessionId: id,
    exercises: Object.values(exerciseMap).map((ex) => ({
      name: ex.name,
      sets: ex.sets,
      avgFormScore:
        ex.scores.length > 0 ? ex.scores.reduce((a, b) => a + b, 0) / ex.scores.length : 0,
    })),
    durationSeconds: durationSeconds ?? 0,
    overallFormScore: overallFormScore ?? null,
    caloriesBurned: caloriesBurned ?? null,
    notes: notes ?? null,
  }).catch(() => {}) // Hafıza hatası seans kaydını asla etkilemez
}
```

- [ ] **Step 4: Commit**

```bash
git add "apps/web/app/api/sessions/[id]/route.ts"
git commit -m "feat(memory): write session memory on workout completion (fire-and-forget)"
```

---

### Task 10: Program Üretme Route'una Memory Enjeksiyonu

**Files:**

- Modify: `apps/web/app/api/ai/generate-program/route.ts`

- [ ] **Step 1: Dosyayı oku — prompt string'inin oluşturulduğu yeri bul**

Dosya: `apps/web/app/api/ai/generate-program/route.ts`

- [ ] **Step 2: Import ekle**

```typescript
import { injectMemoryIntoPrompt } from '@/lib/memory/prompt-injector'
```

- [ ] **Step 3: Prompt string tanımlandıktan hemen sonra ekle**

`const prompt = \`...\`` satırının ardına:

```typescript
// Kullanıcının geçmiş antrenman hafızasını sessizce enjekte et
const enrichedPrompt = await injectMemoryIntoPrompt(
  user.id,
  `program generation ${healthProfile.fitnessLevel} ${healthProfile.goals.join(' ')} ${healthProfile.availableEquipment.join(' ')}`,
  prompt
)
```

OpenAI çağrısında `prompt` → `enrichedPrompt` değiştir:

```typescript
{ role: 'user', content: enrichedPrompt }
```

- [ ] **Step 4: Commit**

```bash
git add apps/web/app/api/ai/generate-program/route.ts
git commit -m "feat(memory): inject user memory history into program generation"
```

---

### Task 11: Coach Message + Meal Analysis Memory Enjeksiyonu

**Files:**

- Modify: `apps/web/app/api/ai/coach-message/route.ts`
- Modify: `apps/web/app/api/ai/analyze-meal/route.ts`

- [ ] **Step 1: coach-message/route.ts'i oku**

- [ ] **Step 2: coach-message'a memory ekle**

Import ekle:

```typescript
import { injectMemoryIntoPrompt } from '@/lib/memory/prompt-injector'
```

OpenAI çağrısından önce prompt'u zenginleştir:

```typescript
const enrichedPrompt = await injectMemoryIntoPrompt(
  user.id,
  `${exercise} coaching form feedback`,
  prompt // mevcut prompt değişkeni
)
// enrichedPrompt'u OpenAI çağrısında kullan
```

- [ ] **Step 3: analyze-meal/route.ts'i oku**

- [ ] **Step 4: analyze-meal'e beslenme hafızası ekle**

Import ekle:

```typescript
import { injectMemoryIntoPrompt } from '@/lib/memory/prompt-injector'
```

Prompt zenginleştir:

```typescript
const enrichedPrompt = await injectMemoryIntoPrompt(
  user.id,
  'nutrition meals protein calorie intake diet habits',
  userPrompt, // mevcut prompt değişkeni
  { types: ['WEEKLY_SUMMARY', 'NUTRITION_PATTERN', 'SESSION_SUMMARY'], limit: 3 }
)
```

- [ ] **Step 5: Commit**

```bash
git add apps/web/app/api/ai/coach-message/route.ts apps/web/app/api/ai/analyze-meal/route.ts
git commit -m "feat(memory): inject memory context into coach message and meal analysis routes"
```

---

## Chunk 7: Cron Job'lar

### Task 12: Haftalık Memory Summary Cron

**Files:**

- Create: `apps/web/app/api/cron/memory-summary/route.ts`

- [ ] **Step 1: Mevcut cron yapısını anla**

Dosyayı oku: `apps/web/app/api/cron/weekly-summary/route.ts`
Pattern: `isValidCronRequest(authHeader)` ile doğrulama, `export const runtime = 'nodejs'`.

- [ ] **Step 2: Yeni cron route'unu oluştur**

```typescript
// apps/web/app/api/cron/memory-summary/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/client'
import { isValidCronRequest } from '@/lib/env/validate'
import { writeWeeklyMemory } from '@/lib/memory/memory-writer'
import { logger } from '@/lib/logger'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (!isValidCronRequest(authHeader)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const weekEnd = new Date()
    const weekStart = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    weekStart.setHours(0, 0, 0, 0)

    // Son 7 günde en az 1 seans tamamlamış kullanıcılar
    const activeUserIds = await prisma.workoutSession
      .findMany({
        where: { startedAt: { gte: weekStart }, endedAt: { not: null } },
        select: { userId: true },
        distinct: ['userId'],
      })
      .then((rows) => rows.map((r) => r.userId))

    logger.info({ count: activeUserIds.length }, 'memory-summary: processing users')

    let processed = 0
    let errors = 0

    for (const userId of activeUserIds) {
      try {
        const [sessions, dailyMetrics, weeklySummary] = await Promise.all([
          prisma.workoutSession.findMany({
            where: { userId, startedAt: { gte: weekStart }, endedAt: { not: null } },
            include: { completedSets: { include: { exercise: true } } },
          }),
          prisma.dailyMetrics.findMany({
            where: { userId, date: { gte: weekStart } },
          }),
          prisma.weeklySummary.findFirst({
            where: { userId, weekStartDate: { gte: weekStart } },
          }),
        ])

        if (sessions.length === 0) continue

        // Toplam hacim
        const totalVolume = sessions.reduce(
          (sum, s) =>
            sum +
            s.completedSets.reduce((sv, set) => sv + (set.reps ?? 0) * (set.weightKg ?? 0), 0),
          0
        )

        // Ortalama form skoru
        const allScores = sessions.flatMap((s) => s.completedSets.map((c) => c.formScore))
        const avgFormScore =
          allScores.length > 0 ? allScores.reduce((a, b) => a + b, 0) / allScores.length : 0

        // En çok yapılan egzersizler (isim bazında)
        const exerciseCounts: Record<string, number> = {}
        for (const s of sessions) {
          for (const set of s.completedSets) {
            const name = set.exercise.name
            exerciseCounts[name] = (exerciseCounts[name] ?? 0) + 1
          }
        }
        const topExercises = Object.entries(exerciseCounts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)
          .map(([name]) => name)

        await writeWeeklyMemory({
          userId,
          weekStartDate: weekStart,
          weekEndDate: weekEnd,
          totalWorkouts: sessions.length,
          totalVolume,
          avgFormScore,
          avgReadiness: weeklySummary?.averageReadiness ?? 70,
          topExercises,
          dailyMetrics: dailyMetrics.map((m) => ({
            sleepHours: m.sleepHours,
            stressLevel: m.stressLevel,
            proteinIntake: m.proteinIntake,
            energyLevel: m.energyLevel,
            mood: m.mood,
          })),
        })

        processed++
      } catch (err) {
        logger.error({ err, userId }, 'memory-summary: failed for user')
        errors++
      }
    }

    return NextResponse.json({ processed, errors, total: activeUserIds.length })
  } catch (err) {
    logger.error({ err }, 'memory-summary cron failed')
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add apps/web/app/api/cron/memory-summary/route.ts
git commit -m "feat(memory): add weekly memory summary cron job"
```

---

### Task 13: Decay Güncelleme Cron

**Files:**

- Create: `apps/web/app/api/cron/memory-decay/route.ts`

- [ ] **Step 1: Implementasyonu yaz**

```typescript
// apps/web/app/api/cron/memory-decay/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/client'
import { isValidCronRequest } from '@/lib/env/validate'
import { calculateDecayScore } from '@/lib/memory/memory-writer'
import { logger } from '@/lib/logger'

export const runtime = 'nodejs'

const BATCH_SIZE = 100

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (!isValidCronRequest(authHeader)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Tüm memory'leri çek (embedding hariç — büyük alan)
    const memories = await prisma.userMemoryEmbedding.findMany({
      select: { id: true, createdAt: true, type: true },
    })

    logger.info({ count: memories.length }, 'memory-decay: updating scores')

    let updated = 0
    let errors = 0

    // Batch olarak güncelle
    for (let i = 0; i < memories.length; i += BATCH_SIZE) {
      const batch = memories.slice(i, i + BATCH_SIZE)

      const results = await Promise.allSettled(
        batch.map((m) =>
          prisma.userMemoryEmbedding.update({
            where: { id: m.id },
            data: { decayScore: calculateDecayScore(m.createdAt, m.type) },
          })
        )
      )

      for (const result of results) {
        if (result.status === 'fulfilled') updated++
        else {
          errors++
          logger.error({ reason: result.reason }, 'memory-decay: batch item failed')
        }
      }
    }

    return NextResponse.json({ updated, errors, total: memories.length })
  } catch (err) {
    logger.error({ err }, 'memory-decay cron failed')
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/app/api/cron/memory-decay/route.ts
git commit -m "feat(memory): add weekly decay score update cron job with batch processing"
```

---

## Chunk 8: Entegrasyon Testleri + Barrel Export

### Task 14: End-to-End Entegrasyon Testi

**Files:**

- Create: `apps/web/lib/memory/__tests__/memory-integration.test.ts`

- [ ] **Step 1: Entegrasyon testi yaz**

```typescript
// apps/web/lib/memory/__tests__/memory-integration.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/db/client', () => ({
  prisma: {
    userMemoryEmbedding: {
      create: vi.fn().mockResolvedValue({ id: 'mem_new' }),
    },
    $queryRaw: vi.fn().mockResolvedValue([
      {
        content: '[Antrenman - 01.04.2026] Squat: 3x5 @ 100kg, form: 88/100',
        importance: 8,
        decayScore: 0.92,
        type: 'SESSION_SUMMARY',
      },
    ]),
  },
}))

vi.mock('@/lib/embeddings/client', () => ({
  createEmbedding: vi.fn().mockResolvedValue(new Array(1536).fill(0.05)),
}))

vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn(), info: vi.fn() },
}))

describe('Memory Layer — End-to-End', () => {
  beforeEach(() => vi.clearAllMocks())

  it('full write flow: session → embedding → DB', async () => {
    const { writeSessionMemory } = await import('../memory-writer')
    const { prisma } = await import('@/lib/db/client')

    await writeSessionMemory({
      userId: 'user_e2e',
      sessionId: 'sess_e2e',
      exercises: [
        {
          name: 'Barbell Squat',
          sets: [{ setNumber: 1, reps: 5, weightKg: 110, formScore: 90 }],
          avgFormScore: 90,
        },
      ],
      durationSeconds: 3000,
      overallFormScore: 90,
      caloriesBurned: 420,
      notes: null,
    })

    expect(prisma.userMemoryEmbedding.create).toHaveBeenCalledOnce()
    const data = (prisma.userMemoryEmbedding.create as any).mock.calls[0][0].data
    expect(data.userId).toBe('user_e2e')
    expect(data.content).toContain('Barbell Squat')
    expect(data.importance).toBeGreaterThanOrEqual(1)
    expect(data.decayScore).toBeCloseTo(1.0, 1)
    expect(data.type).toBe('SESSION_SUMMARY')
  })

  it('retrieve → inject pipeline: memories appear in prompt', async () => {
    const { injectMemoryIntoPrompt } = await import('../prompt-injector')

    const result = await injectMemoryIntoPrompt('user_e2e', 'squat coaching', 'Sen bir koçsun.')

    expect(result).toContain('Sen bir koçsun.')
    expect(result).toContain('KULLANICI GEÇMİŞİ')
    expect(result).toContain('Squat')
  })

  it('DB write failure does not crash the caller', async () => {
    const { prisma } = await import('@/lib/db/client')
    ;(prisma.userMemoryEmbedding.create as any).mockRejectedValueOnce(new Error('DB down'))

    const { writeSessionMemory } = await import('../memory-writer')

    await expect(
      writeSessionMemory({
        userId: 'user_e2e',
        sessionId: 'sess_fail',
        exercises: [],
        durationSeconds: 0,
        overallFormScore: null,
        caloriesBurned: null,
        notes: null,
      })
    ).resolves.not.toThrow()
  })

  it('memory retrieval failure returns empty context without throwing', async () => {
    const { prisma } = await import('@/lib/db/client')
    ;(prisma.$queryRaw as any).mockRejectedValueOnce(new Error('pgvector down'))

    const { retrieveMemoryContext } = await import('../memory-retriever')
    const ctx = await retrieveMemoryContext('user_e2e', 'anything')

    expect(ctx.memories).toHaveLength(0)
    expect(ctx.totalRetrieved).toBe(0)
  })
})
```

- [ ] **Step 2: Tüm memory testleri çalıştır**

```bash
pnpm test lib/memory/
```

Beklenen: Tüm test dosyalarında PASS

- [ ] **Step 3: Commit**

```bash
git add apps/web/lib/memory/__tests__/memory-integration.test.ts
git commit -m "test(memory): add end-to-end integration tests for full memory pipeline"
```

---

### Task 15: Barrel Export + Deprecation

**Files:**

- Create: `apps/web/lib/memory/index.ts`
- Modify: `apps/web/lib/embeddings/search.ts`

- [ ] **Step 1: index.ts oluştur**

```typescript
// apps/web/lib/memory/index.ts
export {
  writeSessionMemory,
  writeWeeklyMemory,
  calculateImportance,
  calculateDecayScore,
} from './memory-writer'

export { retrieveMemoryContext, rankByRelevance } from './memory-retriever'

export { injectMemoryIntoPrompt, buildMemoryBlock } from './prompt-injector'

export { buildSessionMemoryText } from './session-summarizer'
export { buildWeeklyMemoryText } from './weekly-summarizer'

export type {
  MemoryType,
  MemoryContext,
  SessionMemoryInput,
  WeeklyMemoryInput,
  SessionMemoryTextResult,
} from './types'
```

- [ ] **Step 2: Eski `searchRelevantMemories`'i deprecate et**

`apps/web/lib/embeddings/search.ts` dosyasının başına ekle:

```typescript
/**
 * @deprecated Use `retrieveMemoryContext` from `@/lib/memory/memory-retriever` instead.
 * This function lacks importance/decay scoring and type filtering.
 */
```

- [ ] **Step 3: Final commit**

```bash
git add apps/web/lib/memory/index.ts apps/web/lib/embeddings/search.ts
git commit -m "feat(memory): add barrel export, deprecate old searchRelevantMemories"
```

---

## Özet

| Katman                   | Kazanım                                                                      |
| ------------------------ | ---------------------------------------------------------------------------- |
| **DB**                   | `UserMemoryEmbedding` artık importance, decay, tags, source alanlarına sahip |
| **Seans bitişi**         | Her antrenman otomatik hafızaya yazılıyor (fire-and-forget)                  |
| **Haftalık cron**        | 7 günlük pattern özeti + tüm kayıtlar için decay güncelleme                  |
| **AI Coach (real-time)** | Rep feedback'i kullanıcının 90 günlük geçmişini biliyor                      |
| **Program üretici**      | Geçmiş antrenmanlar, zayıflıklar, tercihler bilinerek program yapılıyor      |
| **Yemek analizi**        | Beslenme alışkanlık pattern'larını hatırlıyor                                |
| **Kullanıcı deneyimi**   | Hiçbir şey görmüyor — AI sadece daha iyi hissettiriyor                       |
| **Hata toleransı**       | Tüm memory işlemleri fail-safe — ana iş akışını asla bloklamaz               |
