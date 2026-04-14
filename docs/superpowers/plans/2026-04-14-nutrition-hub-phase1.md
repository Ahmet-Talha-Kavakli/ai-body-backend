# Nutrition Hub Phase 1 — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild `/dashboard/nutrition` from scratch as a Tab-Based Hub with Today, Explore, History, and Profile tabs — delivering FatSecret-level nutrition tracking with food search, barcode scanning, photo analysis, streak system, nutrition score, and i18n (TR/EN).

**Architecture:** Next.js App Router page with URL-driven tab state. Each tab is an isolated client component. All data fetching via custom hooks with optimistic updates. Open Food Facts API for food search and barcode lookup.

**Tech Stack:** Next.js 14 App Router, TypeScript strict, Tailwind CSS, Framer Motion 12, Recharts 2, Prisma 6, Vitest 3, Clerk auth, OpenAI, next-intl, @ericblade/quagga2

**Spec:** `docs/superpowers/specs/2026-04-14-nutrition-hub-design.md`

---

## Chunk 1: Foundation — DB, i18n, Types, API skeleton

### Task 1: Prisma schema extensions

**Files:**

- Modify: `apps/web/prisma/schema.prisma`

- [ ] **Step 1: Verify current WaterLog schema**

Run:

```bash
grep -A10 "model WaterLog" apps/web/prisma/schema.prisma
```

Expected: `@@unique([userId, date])` already present. `date DateTime` already present. No changes needed to WaterLog. The `userId_date` compound key used in `upsert` will work as-is.

- [ ] **Step 2: Add new fields and models to schema**

Add to `NutritionGoal` (after `waterMl` field):

```prisma
fiberG         Float    @default(25)
waterGoalMl    Float    @default(2500)
```

Note: `waterMl` is the existing field (legacy). `waterGoalMl` is the new canonical goal field. Keep both for backwards compatibility.

Add new models after existing models:

```prisma
model NutritionStreak {
  id            String    @id @default(cuid())
  userId        String    @unique
  user          User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  currentStreak Int       @default(0)
  longestStreak Int       @default(0)
  lastLogDate   DateTime?
  updatedAt     DateTime  @updatedAt
}

model DietProfile {
  id        String   @id @default(cuid())
  userId    String   @unique
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  type      String   @default("balanced")
  updatedAt DateTime @updatedAt
}
```

Also add `@db.Date` to `WaterLog.date` and `@@unique([userId, date])` if not present.

- [ ] **Step 2: Add relations to User model**

In `model User`, add:

```prisma
nutritionStreak NutritionStreak?
dietProfile     DietProfile?
```

- [ ] **Step 3: Run migration**

```bash
cd apps/web && pnpm prisma migrate dev --name nutrition-hub-phase1
```

Expected: Clean migration — only `NutritionStreak`, `DietProfile` models added, and `fiberG`/`waterGoalMl` columns added to `NutritionGoal`. No WaterLog changes.
Expected: Migration created and applied, no errors.

- [ ] **Step 4: Generate Prisma client**

```bash
cd apps/web && pnpm prisma generate
```

- [ ] **Step 5: Commit**

```bash
git add apps/web/prisma/
git commit -m "feat(nutrition): extend prisma schema — streak, diet profile, fiber goal"
```

---

### Task 2: Shared TypeScript types

**Files:**

- Create: `apps/web/lib/nutrition/types.ts`

- [ ] **Step 1: Create types file**

```typescript
// apps/web/lib/nutrition/types.ts

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'pre_workout' | 'post_workout'

export type DietType = 'balanced' | 'keto' | 'vegan' | 'paleo' | 'low_carb'

export interface FoodItem {
  name: string
  calories: number
  proteinG: number
  carbsG: number
  fatG: number
  fiberG?: number
  glycemicIndex?: number
  allergens?: string[]
  portionSize?: number
  portionUnit?: string
  barcode?: string
}

export interface MealLog {
  id: string
  mealType: MealType
  items: FoodItem[]
  totalCalories: number
  totalProteinG: number
  totalCarbsG: number
  totalFatG: number
  totalFiberG?: number
  loggedAt: string
  aiAnalyzed: boolean
  photoUrl?: string
  notes?: string
}

export interface NutritionGoal {
  dailyCalories: number
  proteinG: number
  carbsG: number
  fatG: number
  fiberG: number
  waterGoalMl: number
}

export interface MacroTotals {
  calories: number
  protein: number
  carbs: number
  fat: number
  fiber: number
}

export interface NutritionStreak {
  currentStreak: number
  longestStreak: number
  lastLogDate: string | null
}

export interface NutritionScore {
  score: number // 0-100
  breakdown: {
    calories: number
    protein: number
    carbs: number
    fat: number
    fiber: number
    water: number
  }
}

export interface OpenFoodFactsProduct {
  code: string
  product_name: string
  brands?: string
  nutriments: {
    'energy-kcal_100g'?: number
    proteins_100g?: number
    carbohydrates_100g?: number
    fat_100g?: number
    fiber_100g?: number
    'glycemic-index'?: number
  }
  allergens_tags?: string[]
  image_url?: string
}

export interface SearchResult {
  barcode: string
  name: string
  brand?: string
  caloriesPer100g: number
  proteinPer100g: number
  carbsPer100g: number
  fatPer100g: number
  fiberPer100g?: number
  glycemicIndex?: number
  allergens: string[]
  imageUrl?: string
}
```

- [ ] **Step 2: Write tests**

Create `apps/web/lib/nutrition/__tests__/types.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import type { FoodItem, MealLog, NutritionScore } from '../types'

describe('NutritionScore', () => {
  it('score is a number between 0 and 100', () => {
    const score: NutritionScore = {
      score: 75,
      breakdown: { calories: 80, protein: 70, carbs: 75, fat: 80, fiber: 60, water: 75 },
    }
    expect(score.score).toBeGreaterThanOrEqual(0)
    expect(score.score).toBeLessThanOrEqual(100)
  })
})

describe('FoodItem', () => {
  it('accepts optional fields', () => {
    const item: FoodItem = { name: 'Chicken', calories: 165, proteinG: 31, carbsG: 0, fatG: 3.6 }
    expect(item.glycemicIndex).toBeUndefined()
    expect(item.allergens).toBeUndefined()
  })
})
```

- [ ] **Step 3: Run tests**

```bash
cd apps/web && pnpm vitest run lib/nutrition/__tests__/types.test.ts
```

Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add apps/web/lib/nutrition/
git commit -m "feat(nutrition): add shared TypeScript types"
```

---

### Task 3: Nutrition score calculator

**Files:**

- Create: `apps/web/lib/nutrition/score.ts`
- Create: `apps/web/lib/nutrition/__tests__/score.test.ts`

- [ ] **Step 1: Write failing tests first**

```typescript
// apps/web/lib/nutrition/__tests__/score.test.ts
import { describe, it, expect } from 'vitest'
import { calculateNutritionScore } from '../score'
import type { MacroTotals, NutritionGoal } from '../types'

const goal: NutritionGoal = {
  dailyCalories: 2000,
  proteinG: 150,
  carbsG: 200,
  fatG: 65,
  fiberG: 25,
  waterGoalMl: 2000,
}

describe('calculateNutritionScore', () => {
  it('returns 100 when all goals met exactly', () => {
    const totals: MacroTotals = { calories: 2000, protein: 150, carbs: 200, fat: 65, fiber: 25 }
    const result = calculateNutritionScore(totals, goal, 8)
    expect(result.score).toBe(100)
  })

  it('returns 0 when nothing logged', () => {
    const totals: MacroTotals = { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 }
    const result = calculateNutritionScore(totals, goal, 0)
    expect(result.score).toBe(0)
  })

  it('score is capped at 100 even when over goal', () => {
    const totals: MacroTotals = { calories: 5000, protein: 300, carbs: 400, fat: 200, fiber: 60 }
    const result = calculateNutritionScore(totals, goal, 8)
    expect(result.score).toBeLessThanOrEqual(100)
  })

  it('partial completion returns partial score', () => {
    const totals: MacroTotals = { calories: 1000, protein: 75, carbs: 100, fat: 32, fiber: 12 }
    const result = calculateNutritionScore(totals, goal, 4)
    expect(result.score).toBeGreaterThan(0)
    expect(result.score).toBeLessThan(100)
  })
})
```

- [ ] **Step 2: Run tests — expect FAIL**

```bash
cd apps/web && pnpm vitest run lib/nutrition/__tests__/score.test.ts
```

- [ ] **Step 3: Implement score calculator**

```typescript
// apps/web/lib/nutrition/score.ts
import type { MacroTotals, NutritionGoal, NutritionScore } from './types'

function pct(current: number, goal: number): number {
  if (goal === 0) return 0
  // penalize going over: over 120% = 0 points for that macro
  const ratio = current / goal
  if (ratio > 1.2) return Math.max(0, 100 - (ratio - 1.2) * 200)
  return Math.min(100, ratio * 100)
}

export function calculateNutritionScore(
  totals: MacroTotals,
  goal: NutritionGoal,
  waterGlasses: number
): NutritionScore {
  const waterGoalGlasses = Math.round(goal.waterGoalMl / 250)
  const breakdown = {
    calories: Math.round(pct(totals.calories, goal.dailyCalories)),
    protein: Math.round(pct(totals.protein, goal.proteinG)),
    carbs: Math.round(pct(totals.carbs, goal.carbsG)),
    fat: Math.round(pct(totals.fat, goal.fatG)),
    fiber: Math.round(pct(totals.fiber, goal.fiberG)),
    water: Math.round(pct(waterGlasses, waterGoalGlasses)),
  }
  const weights = { calories: 0.3, protein: 0.25, carbs: 0.15, fat: 0.1, fiber: 0.1, water: 0.1 }
  const score = Math.round(
    breakdown.calories * weights.calories +
      breakdown.protein * weights.protein +
      breakdown.carbs * weights.carbs +
      breakdown.fat * weights.fat +
      breakdown.fiber * weights.fiber +
      breakdown.water * weights.water
  )
  return { score, breakdown }
}
```

- [ ] **Step 4: Run tests — expect PASS**

```bash
cd apps/web && pnpm vitest run lib/nutrition/__tests__/score.test.ts
```

- [ ] **Step 5: Commit**

```bash
git add apps/web/lib/nutrition/
git commit -m "feat(nutrition): add nutrition score calculator with tests"
```

---

### Task 4: Streak updater utility

**Files:**

- Create: `apps/web/lib/nutrition/streak.ts`
- Create: `apps/web/lib/nutrition/__tests__/streak.test.ts`

- [ ] **Step 1: Write failing tests**

```typescript
// apps/web/lib/nutrition/__tests__/streak.test.ts
import { describe, it, expect } from 'vitest'
import { computeNewStreak } from '../streak'

describe('computeNewStreak', () => {
  it('increments streak when logging on consecutive day', () => {
    const yesterday = new Date(Date.now() - 86400000).toISOString()
    const result = computeNewStreak(
      { currentStreak: 3, longestStreak: 5, lastLogDate: yesterday },
      new Date()
    )
    expect(result.currentStreak).toBe(4)
    expect(result.longestStreak).toBe(5)
  })

  it('updates longestStreak when current exceeds it', () => {
    const yesterday = new Date(Date.now() - 86400000).toISOString()
    const result = computeNewStreak(
      { currentStreak: 5, longestStreak: 5, lastLogDate: yesterday },
      new Date()
    )
    expect(result.longestStreak).toBe(6)
  })

  it('resets streak to 1 when gap > 1 day', () => {
    const threeDaysAgo = new Date(Date.now() - 3 * 86400000).toISOString()
    const result = computeNewStreak(
      { currentStreak: 10, longestStreak: 10, lastLogDate: threeDaysAgo },
      new Date()
    )
    expect(result.currentStreak).toBe(1)
  })

  it('does not double-increment when logging same day', () => {
    const today = new Date().toISOString()
    const result = computeNewStreak(
      { currentStreak: 3, longestStreak: 5, lastLogDate: today },
      new Date()
    )
    expect(result.currentStreak).toBe(3)
  })

  it('starts streak at 1 when no previous log', () => {
    const result = computeNewStreak(
      { currentStreak: 0, longestStreak: 0, lastLogDate: null },
      new Date()
    )
    expect(result.currentStreak).toBe(1)
  })
})
```

- [ ] **Step 2: Run — expect FAIL**

```bash
cd apps/web && pnpm vitest run lib/nutrition/__tests__/streak.test.ts
```

- [ ] **Step 3: Implement**

```typescript
// apps/web/lib/nutrition/streak.ts
interface StreakState {
  currentStreak: number
  longestStreak: number
  lastLogDate: string | null
}

function isSameDay(a: Date, b: Date): boolean {
  return a.toDateString() === b.toDateString()
}

function isYesterday(date: Date, ref: Date): boolean {
  const yesterday = new Date(ref)
  yesterday.setDate(yesterday.getDate() - 1)
  return isSameDay(date, yesterday)
}

export function computeNewStreak(state: StreakState, now: Date): StreakState {
  if (!state.lastLogDate) {
    return {
      currentStreak: 1,
      longestStreak: Math.max(1, state.longestStreak),
      lastLogDate: now.toISOString(),
    }
  }
  const last = new Date(state.lastLogDate)
  if (isSameDay(last, now)) return state
  const newCurrent = isYesterday(last, now) ? state.currentStreak + 1 : 1
  const newLongest = Math.max(newCurrent, state.longestStreak)
  return { currentStreak: newCurrent, longestStreak: newLongest, lastLogDate: now.toISOString() }
}
```

- [ ] **Step 4: Run — expect PASS**

```bash
cd apps/web && pnpm vitest run lib/nutrition/__tests__/streak.test.ts
```

- [ ] **Step 5: Commit**

```bash
git add apps/web/lib/nutrition/
git commit -m "feat(nutrition): add streak calculator with tests"
```

---

### Task 5: Open Food Facts API client

**Files:**

- Create: `apps/web/lib/nutrition/openfoodfacts.ts`
- Create: `apps/web/lib/nutrition/__tests__/openfoodfacts.test.ts`

- [ ] **Step 1: Write failing tests**

```typescript
// apps/web/lib/nutrition/__tests__/openfoodfacts.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { searchFoods, lookupBarcode, mapOFFProduct } from '../openfoodfacts'

const mockProduct = {
  code: '123',
  product_name: 'Chicken Breast',
  brands: 'TestBrand',
  nutriments: {
    'energy-kcal_100g': 165,
    proteins_100g: 31,
    carbohydrates_100g: 0,
    fat_100g: 3.6,
    fiber_100g: 0,
  },
  allergens_tags: [],
}

describe('mapOFFProduct', () => {
  it('maps OFF product to SearchResult correctly', () => {
    const result = mapOFFProduct(mockProduct as any)
    expect(result.name).toBe('Chicken Breast')
    expect(result.brand).toBe('TestBrand')
    expect(result.caloriesPer100g).toBe(165)
    expect(result.proteinPer100g).toBe(31)
    expect(result.allergens).toEqual([])
  })
})

describe('searchFoods', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('returns empty array on network error', async () => {
    vi.spyOn(global, 'fetch').mockRejectedValueOnce(new Error('Network error'))
    const results = await searchFoods('chicken')
    expect(results).toEqual([])
  })
})

describe('lookupBarcode', () => {
  it('returns null on network error', async () => {
    vi.spyOn(global, 'fetch').mockRejectedValueOnce(new Error('Network error'))
    const result = await lookupBarcode('1234567890')
    expect(result).toBeNull()
  })
})
```

- [ ] **Step 2: Run — expect FAIL**

```bash
cd apps/web && pnpm vitest run lib/nutrition/__tests__/openfoodfacts.test.ts
```

- [ ] **Step 3: Implement**

```typescript
// apps/web/lib/nutrition/openfoodfacts.ts
import type { OpenFoodFactsProduct, SearchResult } from './types'

export function mapOFFProduct(p: OpenFoodFactsProduct): SearchResult {
  return {
    barcode: p.code,
    name: p.product_name || 'Unknown',
    brand: p.brands,
    caloriesPer100g: p.nutriments['energy-kcal_100g'] ?? 0,
    proteinPer100g: p.nutriments.proteins_100g ?? 0,
    carbsPer100g: p.nutriments.carbohydrates_100g ?? 0,
    fatPer100g: p.nutriments.fat_100g ?? 0,
    fiberPer100g: p.nutriments.fiber_100g ?? 0,
    glycemicIndex: p.nutriments['glycemic-index'],
    allergens: p.allergens_tags?.map((t) => t.replace('en:', '')) ?? [],
    imageUrl: p.image_url,
  }
}

export async function searchFoods(query: string, page = 1): Promise<SearchResult[]> {
  try {
    const params = new URLSearchParams({
      search_terms: query,
      search_simple: '1',
      action: 'process',
      json: '1',
      page_size: '20',
      page: String(page),
      fields: 'code,product_name,brands,nutriments,allergens_tags,image_url',
    })
    const res = await fetch(`https://world.openfoodfacts.org/cgi/search.pl?${params}`, {
      next: { revalidate: 300 },
    })
    if (!res.ok) return []
    const data = await res.json()
    return (data.products ?? [])
      .filter((p: OpenFoodFactsProduct) => p.product_name)
      .map(mapOFFProduct)
  } catch {
    return []
  }
}

export async function lookupBarcode(barcode: string): Promise<SearchResult | null> {
  try {
    const res = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`, {
      next: { revalidate: 3600 },
    })
    if (!res.ok) return null
    const data = await res.json()
    if (data.status !== 1 || !data.product) return null
    return mapOFFProduct({ ...data.product, code: barcode })
  } catch {
    return null
  }
}
```

- [ ] **Step 4: Run — expect PASS**

```bash
cd apps/web && pnpm vitest run lib/nutrition/__tests__/openfoodfacts.test.ts
```

- [ ] **Step 5: Commit**

```bash
git add apps/web/lib/nutrition/
git commit -m "feat(nutrition): add Open Food Facts API client with tests"
```

---

### Task 6: New API routes (backend)

**Files:**

- Create: `apps/web/app/api/nutrition/[id]/route.ts`
- Create: `apps/web/app/api/nutrition/history/route.ts`
- Create: `apps/web/app/api/nutrition/water/route.ts`
- Create: `apps/web/app/api/nutrition/recent-foods/route.ts`
- Create: `apps/web/app/api/nutrition/streak/route.ts`
- Modify: `apps/web/app/api/nutrition/goal/route.ts`

- [ ] **Step 1: DELETE meal route**

```typescript
// apps/web/app/api/nutrition/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db/client'

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const user = await db.user.findUnique({ where: { clerkId } })
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })
    const meal = await db.mealLog.findUnique({ where: { id: params.id } })
    if (!meal || meal.userId !== user.id)
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    await db.mealLog.delete({ where: { id: params.id } })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

- [ ] **Step 2: History route**

```typescript
// apps/web/app/api/nutrition/history/route.ts
import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db/client'

export async function GET() {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const user = await db.user.findUnique({ where: { clerkId } })
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const meals = await db.mealLog.findMany({
      where: { userId: user.id, loggedAt: { gte: thirtyDaysAgo } },
      select: {
        loggedAt: true,
        totalCalories: true,
        totalProteinG: true,
        totalCarbsG: true,
        totalFatG: true,
      },
      orderBy: { loggedAt: 'asc' },
    })

    const goal = await db.nutritionGoal.findUnique({ where: { userId: user.id } })

    // Group by date
    const byDate = new Map<
      string,
      { calories: number; protein: number; carbs: number; fat: number }
    >()
    for (const m of meals) {
      const d = m.loggedAt.toISOString().slice(0, 10)
      const existing = byDate.get(d) ?? { calories: 0, protein: 0, carbs: 0, fat: 0 }
      byDate.set(d, {
        calories: existing.calories + m.totalCalories,
        protein: existing.protein + m.totalProteinG,
        carbs: existing.carbs + m.totalCarbsG,
        fat: existing.fat + m.totalFatG,
      })
    }

    const daily = Array.from(byDate.entries()).map(([date, totals]) => ({ date, ...totals }))

    return NextResponse.json({ daily, goal })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

- [ ] **Step 3: Water route**

```typescript
// apps/web/app/api/nutrition/water/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db/client'

function todayDate() {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d
}

export async function GET() {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const user = await db.user.findUnique({ where: { clerkId } })
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })
    const log = await db.waterLog.findUnique({
      where: { userId_date: { userId: user.id, date: todayDate() } },
    })
    return NextResponse.json({ glasses: log?.glasses ?? 0 })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const user = await db.user.findUnique({ where: { clerkId } })
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })
    const { glasses } = await req.json()
    const log = await db.waterLog.upsert({
      where: { userId_date: { userId: user.id, date: todayDate() } },
      create: { userId: user.id, date: todayDate(), glasses },
      update: { glasses },
    })
    return NextResponse.json({ glasses: log.glasses })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

- [ ] **Step 4: Recent foods route**

```typescript
// apps/web/app/api/nutrition/recent-foods/route.ts
import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db/client'

export async function GET() {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const user = await db.user.findUnique({ where: { clerkId } })
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const meals = await db.mealLog.findMany({
      where: { userId: user.id },
      select: { items: true },
      orderBy: { loggedAt: 'desc' },
      take: 50,
    })

    // Extract unique food items (by name) from recent meals
    const seen = new Set<string>()
    const recentFoods: unknown[] = []
    for (const meal of meals) {
      const items = meal.items as Array<{ name: string; calories: number }>
      for (const item of items) {
        if (!seen.has(item.name) && recentFoods.length < 10) {
          seen.add(item.name)
          recentFoods.push(item)
        }
      }
    }

    return NextResponse.json({ recentFoods })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

- [ ] **Step 5: Streak route**

```typescript
// apps/web/app/api/nutrition/streak/route.ts
import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db/client'
import { computeNewStreak } from '@/lib/nutrition/streak'

export async function GET() {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const user = await db.user.findUnique({ where: { clerkId } })
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })
    const streak = await db.nutritionStreak.findUnique({ where: { userId: user.id } })
    return NextResponse.json({
      currentStreak: streak?.currentStreak ?? 0,
      longestStreak: streak?.longestStreak ?? 0,
      lastLogDate: streak?.lastLogDate ?? null,
    })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST() {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const user = await db.user.findUnique({ where: { clerkId } })
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const existing = await db.nutritionStreak.findUnique({ where: { userId: user.id } })
    const state = {
      currentStreak: existing?.currentStreak ?? 0,
      longestStreak: existing?.longestStreak ?? 0,
      lastLogDate: existing?.lastLogDate?.toISOString() ?? null,
    }
    const newState = computeNewStreak(state, new Date())

    const streak = await db.nutritionStreak.upsert({
      where: { userId: user.id },
      create: { userId: user.id, ...newState },
      update: newState,
    })

    return NextResponse.json(streak)
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

- [ ] **Step 6: Update goal route to include waterGoalMl and fiberG**

In `apps/web/app/api/nutrition/goal/route.ts`, the POST handler already uses spread (`update: body`) so it will accept `waterGoalMl` and `fiberG` automatically. Add GET handler:

```typescript
export async function GET() {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const user = await db.user.findUnique({ where: { clerkId } })
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })
    const goal = await db.nutritionGoal.findUnique({ where: { userId: user.id } })
    return NextResponse.json({ goal })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

- [ ] **Step 7: Commit**

```bash
git add apps/web/app/api/nutrition/
git commit -m "feat(nutrition): add DELETE meal, history, water, recent-foods, streak API routes"
```

---

### Task 7: Install dependencies

- [ ] **Step 1: Install new packages**

```bash
cd apps/web && pnpm add next-intl @ericblade/quagga2
```

- [ ] **Step 2: Install Barlow Condensed via next/font**

No install needed — `next/font/google` is already available. Font will be added in layout.

- [ ] **Step 3: Commit**

```bash
git add apps/web/package.json pnpm-lock.yaml
git commit -m "feat(nutrition): install next-intl and quagga2"
```

---

### Task 8: i18n foundation

**Files:**

- Create: `apps/web/messages/tr.json`
- Create: `apps/web/messages/en.json`
- Create: `apps/web/i18n.ts`
- Modify: `apps/web/middleware.ts` (create if not exists)

- [ ] **Step 1: Create i18n config**

```typescript
// apps/web/i18n.ts
import { getRequestConfig } from 'next-intl/server'

export default getRequestConfig(async ({ locale }) => ({
  messages: (await import(`./messages/${locale}.json`)).default,
}))
```

- [ ] **Step 1b: Create/update middleware.ts**

Check if `apps/web/middleware.ts` exists. If it has Clerk middleware, extend it with next-intl. If it doesn't exist, create:

```typescript
// apps/web/middleware.ts
import createMiddleware from 'next-intl/middleware'
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

const intlMiddleware = createMiddleware({
  locales: ['tr', 'en'],
  defaultLocale: 'tr',
  localePrefix: 'as-needed', // /dashboard works, /en/dashboard also works
})

const isPublicRoute = createRouteMatcher(['/sign-in(.*)', '/sign-up(.*)'])

export default clerkMiddleware((auth, req) => {
  if (!isPublicRoute(req)) auth().protect()
  return intlMiddleware(req)
})

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
  ],
}
```

Note: If existing middleware already handles Clerk auth, adapt accordingly — the key addition is the `intlMiddleware` call and locales config. `localePrefix: 'as-needed'` means existing routes like `/dashboard/nutrition` continue to work without locale prefix.

- [ ] **Step 1c: Wrap layout with NextIntlClientProvider**

In `apps/web/app/layout.tsx`, add:

```typescript
import { NextIntlClientProvider } from 'next-intl'
import { getLocale, getMessages } from 'next-intl/server'

// Inside the async RootLayout function:
const locale = await getLocale()
const messages = await getMessages()

// Wrap children:
<NextIntlClientProvider locale={locale} messages={messages}>
  {children}
</NextIntlClientProvider>
```

- [ ] **Step 2: Create Turkish messages**

```json
// apps/web/messages/tr.json
{
  "nutrition": {
    "title": "Beslenme",
    "subtitle": "Günlük besin takibi",
    "tabs": {
      "today": "Bugün",
      "explore": "Keşfet",
      "history": "Geçmiş",
      "profile": "Profil"
    },
    "today": {
      "caloriesConsumed": "Tüketilen kalori",
      "caloriesRemaining": "kalan",
      "caloriesOver": "fazla",
      "protein": "Protein",
      "carbs": "Karbonhidrat",
      "fat": "Yağ",
      "fiber": "Lif",
      "water": "Su",
      "meals": "Bugünkü Öğünler",
      "noMeals": "Henüz öğün eklenmedi",
      "addFirst": "İlk öğünü ekle",
      "quickAdd": "Hızlı Ekle",
      "streak": "günlük seri",
      "score": "Beslenme puanı"
    },
    "explore": {
      "searchPlaceholder": "Besin ara...",
      "recentFoods": "Son Kullanılanlar",
      "noResults": "Sonuç bulunamadı",
      "addToLog": "Günlüğe Ekle",
      "per100g": "100g başına"
    },
    "mealTypes": {
      "breakfast": "Kahvaltı",
      "lunch": "Öğle Yemeği",
      "dinner": "Akşam Yemeği",
      "snack": "Ara Öğün",
      "pre_workout": "Antrenman Öncesi",
      "post_workout": "Antrenman Sonrası"
    },
    "actions": {
      "addMeal": "Öğün Ekle",
      "photoAnalysis": "Fotoğrafla",
      "scanBarcode": "Barkod Tara",
      "copyMeal": "Kopyala",
      "delete": "Sil",
      "save": "Kaydet",
      "cancel": "İptal"
    },
    "allergens": {
      "gluten": "Gluten",
      "milk": "Süt",
      "eggs": "Yumurta",
      "nuts": "Kuruyemiş",
      "peanuts": "Fıstık",
      "soy": "Soya",
      "fish": "Balık",
      "shellfish": "Kabuklu Deniz Ürünleri"
    }
  }
}
```

- [ ] **Step 3: Create English messages**

```json
// apps/web/messages/en.json
{
  "nutrition": {
    "title": "Nutrition",
    "subtitle": "Daily food tracking",
    "tabs": {
      "today": "Today",
      "explore": "Explore",
      "history": "History",
      "profile": "Profile"
    },
    "today": {
      "caloriesConsumed": "Calories consumed",
      "caloriesRemaining": "remaining",
      "caloriesOver": "over",
      "protein": "Protein",
      "carbs": "Carbs",
      "fat": "Fat",
      "fiber": "Fiber",
      "water": "Water",
      "meals": "Today's Meals",
      "noMeals": "No meals logged yet",
      "addFirst": "Add your first meal",
      "quickAdd": "Quick Add",
      "streak": "day streak",
      "score": "Nutrition score"
    },
    "explore": {
      "searchPlaceholder": "Search food...",
      "recentFoods": "Recent Foods",
      "noResults": "No results found",
      "addToLog": "Add to Log",
      "per100g": "per 100g"
    },
    "mealTypes": {
      "breakfast": "Breakfast",
      "lunch": "Lunch",
      "dinner": "Dinner",
      "snack": "Snack",
      "pre_workout": "Pre-Workout",
      "post_workout": "Post-Workout"
    },
    "actions": {
      "addMeal": "Add Meal",
      "photoAnalysis": "Photo",
      "scanBarcode": "Scan Barcode",
      "copyMeal": "Copy",
      "delete": "Delete",
      "save": "Save",
      "cancel": "Cancel"
    },
    "allergens": {
      "gluten": "Gluten",
      "milk": "Milk",
      "eggs": "Eggs",
      "nuts": "Tree Nuts",
      "peanuts": "Peanuts",
      "soy": "Soy",
      "fish": "Fish",
      "shellfish": "Shellfish"
    }
  }
}
```

- [ ] **Step 4: Commit**

```bash
git add apps/web/messages/ apps/web/i18n.ts
git commit -m "feat(nutrition): add i18n foundation (TR/EN) with next-intl"
```

---

## Chunk 2: Today Tab — CalorieRing, MacroBars, WaterTracker, MealTimeline

### Task 9: CalorieRing component

**Files:**

- Create: `apps/web/app/(dashboard)/dashboard/nutrition/components/today/CalorieRing.tsx`

- [ ] **Step 1: Implement CalorieRing**

```tsx
// apps/web/app/(dashboard)/dashboard/nutrition/components/today/CalorieRing.tsx
'use client'

import { useEffect, useRef } from 'react'
import { motion, useMotionValue, useTransform, animate } from 'framer-motion'

interface CalorieRingProps {
  consumed: number
  goal: number
  score: number
  streak: number
}

export function CalorieRing({ consumed, goal, score, streak }: CalorieRingProps) {
  const SIZE = 220
  const STROKE = 16
  const RADIUS = (SIZE - STROKE) / 2
  const CIRCUMFERENCE = 2 * Math.PI * RADIUS
  const progress = useMotionValue(0)
  const dashOffset = useTransform(progress, (v) => CIRCUMFERENCE - (v / 100) * CIRCUMFERENCE)
  const pct = Math.min((consumed / goal) * 100, 100)
  const isOver = consumed > goal

  useEffect(() => {
    const controls = animate(progress, pct, {
      duration: 1.2,
      ease: [0.4, 0, 0.2, 1],
    })
    return controls.stop
  }, [pct, progress])

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative" style={{ width: SIZE, height: SIZE }}>
        <svg width={SIZE} height={SIZE} className="-rotate-90">
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            fill="none"
            stroke="rgba(99,102,241,0.15)"
            strokeWidth={STROKE}
          />
          <motion.circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            fill="none"
            stroke={isOver ? '#F97316' : '#6366F1'}
            strokeWidth={STROKE}
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            style={{ strokeDashoffset: dashOffset }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-['Barlow_Condensed'] text-4xl font-bold text-white">
            {consumed.toLocaleString()}
          </span>
          <span className="mt-0.5 text-xs text-[#64748B]">/ {goal.toLocaleString()} kcal</span>
          <span
            className={`mt-1 text-sm font-semibold ${isOver ? 'text-[#F97316]' : 'text-[#22C55E]'}`}
          >
            {isOver
              ? `${(consumed - goal).toLocaleString()} kcal fazla`
              : `${(goal - consumed).toLocaleString()} kcal kalan`}
          </span>
        </div>
      </div>
      <div className="flex gap-4 text-center">
        <div>
          <p className="font-['Barlow_Condensed'] text-2xl font-bold text-[#6366F1]">{score}</p>
          <p className="text-xs text-[#64748B]">puan</p>
        </div>
        <div className="w-px bg-white/10" />
        <div>
          <p className="font-['Barlow_Condensed'] text-2xl font-bold text-[#22C55E]">{streak}</p>
          <p className="text-xs text-[#64748B]">günlük seri</p>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/app/\(dashboard\)/dashboard/nutrition/
git commit -m "feat(nutrition): add CalorieRing component"
```

---

### Task 10: MacroBars component

**Files:**

- Create: `apps/web/app/(dashboard)/dashboard/nutrition/components/today/MacroBars.tsx`

- [ ] **Step 1: Implement MacroBars**

```tsx
// apps/web/app/(dashboard)/dashboard/nutrition/components/today/MacroBars.tsx
'use client'

import { motion } from 'framer-motion'

interface MacroBarsProps {
  protein: { current: number; goal: number }
  carbs: { current: number; goal: number }
  fat: { current: number; goal: number }
  fiber: { current: number; goal: number }
}

const MACROS = [
  { key: 'protein' as const, label: 'Protein', unit: 'g', color: 'from-[#3B82F6] to-[#06B6D4]' },
  { key: 'carbs' as const, label: 'Karbonhidrat', unit: 'g', color: 'from-[#F59E0B] to-[#F97316]' },
  { key: 'fat' as const, label: 'Yağ', unit: 'g', color: 'from-[#EC4899] to-[#F43F5E]' },
  { key: 'fiber' as const, label: 'Lif', unit: 'g', color: 'from-[#22C55E] to-[#10B981]' },
]

export function MacroBars({ protein, carbs, fat, fiber }: MacroBarsProps) {
  const data = { protein, carbs, fat, fiber }

  return (
    <div className="flex w-full flex-col gap-3">
      {MACROS.map((m, i) => {
        const { current, goal } = data[m.key]
        const pct = Math.min((current / goal) * 100, 100)
        return (
          <div key={m.key}>
            <div className="mb-1 flex justify-between">
              <span className="text-xs text-[#64748B]">{m.label}</span>
              <span className="text-xs font-semibold text-white">
                {Math.round(current)}
                <span className="font-normal text-[#64748B]">
                  /{goal}
                  {m.unit}
                </span>
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-white/[0.06]">
              <motion.div
                className={`h-full bg-gradient-to-r ${m.color} rounded-full`}
                initial={{ scaleX: 0 }}
                animate={{ scaleX: pct / 100 }}
                transition={{ duration: 0.7, delay: i * 0.08, ease: 'easeOut' }}
                style={{ originX: 0 }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/app/\(dashboard\)/dashboard/nutrition/
git commit -m "feat(nutrition): add MacroBars component"
```

---

### Task 11: WaterTracker component

**Files:**

- Create: `apps/web/app/(dashboard)/dashboard/nutrition/components/today/WaterTracker.tsx`

- [ ] **Step 1: Implement WaterTracker**

```tsx
// apps/web/app/(dashboard)/dashboard/nutrition/components/today/WaterTracker.tsx
'use client'

import { motion } from 'framer-motion'
import { Droplets } from 'lucide-react'

interface WaterTrackerProps {
  glasses: number
  goal?: number
  onUpdate: (glasses: number) => void
}

export function WaterTracker({ glasses, goal = 8, onUpdate }: WaterTrackerProps) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Droplets size={14} className="text-[#3B82F6]" />
          <span className="text-xs text-[#64748B]">Su</span>
        </div>
        <span className="text-xs font-semibold text-white">
          {glasses * 250}ml / {goal * 250}ml
        </span>
      </div>
      <div className="flex gap-1.5">
        {Array.from({ length: goal }).map((_, i) => (
          <motion.button
            key={i}
            onClick={() => onUpdate(i < glasses ? i : i + 1)}
            whileTap={{ scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            className="h-6 flex-1 cursor-pointer rounded-sm"
            style={{
              background:
                i < glasses
                  ? 'linear-gradient(to top, #3B82F6, #06B6D4)'
                  : 'rgba(255,255,255,0.06)',
            }}
            aria-label={`${i + 1} bardak su`}
          />
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/app/\(dashboard\)/dashboard/nutrition/
git commit -m "feat(nutrition): add WaterTracker component"
```

---

### Task 12: MealTimeline components

**Files:**

- Create: `apps/web/app/(dashboard)/dashboard/nutrition/components/today/MealTimelineItem.tsx`
- Create: `apps/web/app/(dashboard)/dashboard/nutrition/components/today/MealTimeline.tsx`

- [ ] **Step 1: Implement MealTimelineItem**

```tsx
// apps/web/app/(dashboard)/dashboard/nutrition/components/today/MealTimelineItem.tsx
'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, Trash2, Copy } from 'lucide-react'
import type { MealLog } from '@/lib/nutrition/types'

const MEAL_LABELS: Record<string, string> = {
  breakfast: 'Kahvaltı',
  lunch: 'Öğle Yemeği',
  dinner: 'Akşam Yemeği',
  snack: 'Ara Öğün',
  pre_workout: 'Antrenman Öncesi',
  post_workout: 'Antrenman Sonrası',
}

interface Props {
  meal: MealLog
  index: number
  onDelete: (id: string) => void
  onCopy: (meal: MealLog) => void
}

export function MealTimelineItem({ meal, index, onDelete, onCopy }: Props) {
  const [expanded, setExpanded] = useState(false)
  const items = meal.items as Array<{ name: string; calories: number }>

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, type: 'spring', stiffness: 120, damping: 18 }}
      className="flex gap-3"
    >
      {/* Timeline dot */}
      <div className="flex flex-col items-center pt-1">
        <div
          className={`h-2.5 w-2.5 shrink-0 rounded-full ${meal.aiAnalyzed ? 'bg-[#8B5CF6]' : 'bg-[#6366F1]'}`}
        />
        <div className="mt-1 w-px flex-1 bg-white/[0.06]" />
      </div>

      {/* Content */}
      <div className="flex-1 pb-4">
        <button
          onClick={() => setExpanded((e) => !e)}
          className="group flex w-full cursor-pointer items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-white">
              {MEAL_LABELS[meal.mealType] ?? meal.mealType}
            </span>
            {meal.aiAnalyzed && (
              <span className="rounded-full border border-[#8B5CF6]/20 bg-[#8B5CF6]/15 px-1.5 py-0.5 text-[10px] text-[#A78BFA]">
                AI
              </span>
            )}
            <span className="text-xs text-[#64748B]">
              {new Date(meal.loggedAt).toLocaleTimeString('tr-TR', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-['Barlow_Condensed'] text-lg font-bold text-white">
              {Math.round(meal.totalCalories)}
            </span>
            <span className="text-xs text-[#64748B]">kcal</span>
            <motion.div animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
              <ChevronDown size={14} className="text-[#64748B]" />
            </motion.div>
          </div>
        </button>

        {/* Food chips preview */}
        <div className="mt-1.5 flex flex-wrap gap-1">
          {items.slice(0, 3).map((item, j) => (
            <span
              key={j}
              className="rounded-full bg-white/[0.05] px-2 py-0.5 text-[11px] text-[#64748B]"
            >
              {item.name}
            </span>
          ))}
          {items.length > 3 && (
            <span className="rounded-full bg-white/[0.05] px-2 py-0.5 text-[11px] text-[#64748B]">
              +{items.length - 3}
            </span>
          )}
        </div>

        {/* Expanded details */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="mt-3 space-y-1">
                {items.map((item, j) => (
                  <div key={j} className="flex justify-between text-xs text-[#64748B]">
                    <span>{item.name}</span>
                    <span>{item.calories} kcal</span>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex gap-3 text-xs text-[#64748B]">
                <span>P: {Math.round(meal.totalProteinG)}g</span>
                <span>K: {Math.round(meal.totalCarbsG)}g</span>
                <span>Y: {Math.round(meal.totalFatG)}g</span>
              </div>
              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => onCopy(meal)}
                  className="flex cursor-pointer items-center gap-1 rounded-lg bg-white/[0.05] px-3 py-1.5 text-xs text-[#64748B] transition-colors hover:bg-white/[0.10]"
                >
                  <Copy size={12} /> Kopyala
                </button>
                <button
                  onClick={() => onDelete(meal.id)}
                  className="flex cursor-pointer items-center gap-1 rounded-lg bg-red-500/10 px-3 py-1.5 text-xs text-red-400 transition-colors hover:bg-red-500/20"
                >
                  <Trash2 size={12} /> Sil
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}
```

- [ ] **Step 2: Implement MealTimeline wrapper**

```tsx
// apps/web/app/(dashboard)/dashboard/nutrition/components/today/MealTimeline.tsx
'use client'

import { UtensilsCrossed } from 'lucide-react'
import { MealTimelineItem } from './MealTimelineItem'
import type { MealLog } from '@/lib/nutrition/types'

interface Props {
  meals: MealLog[]
  onDelete: (id: string) => void
  onCopy: (meal: MealLog) => void
  onAddMeal: () => void
}

export function MealTimeline({ meals, onDelete, onCopy, onAddMeal }: Props) {
  if (meals.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <UtensilsCrossed size={36} className="mb-3 text-white/20" />
        <p className="text-sm text-[#64748B]">Henüz öğün eklenmedi</p>
        <button
          onClick={onAddMeal}
          className="mt-3 cursor-pointer text-xs text-[#6366F1] transition-colors hover:text-[#818CF8]"
        >
          + İlk öğünü ekle
        </button>
      </div>
    )
  }

  return (
    <div>
      {meals.map((meal, i) => (
        <MealTimelineItem key={meal.id} meal={meal} index={i} onDelete={onDelete} onCopy={onCopy} />
      ))}
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add apps/web/app/\(dashboard\)/dashboard/nutrition/
git commit -m "feat(nutrition): add MealTimeline and MealTimelineItem components"
```

---

### Task 13: QuickAddBar component

**Files:**

- Create: `apps/web/app/(dashboard)/dashboard/nutrition/components/today/QuickAddBar.tsx`

- [ ] **Step 0: Verify THIINGS keys exist**

Run:

```bash
grep -E "waterBottle|banana|egg|avocado|apple|orange" apps/web/lib/thiings.ts
```

Expected: All 6 keys found. If any are missing, use the closest available key from `apps/web/lib/thiings.ts`.

- [ ] **Step 1: Implement QuickAddBar**

```tsx
// apps/web/app/(dashboard)/dashboard/nutrition/components/today/QuickAddBar.tsx
'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'
import Image from 'next/image'
import { THIINGS } from '@/lib/thiings'

interface QuickAddItem {
  name: string
  cals: number
  img: string
  type: string
  protein: number
  carbs: number
  fat: number
}

const QUICK_ADD: QuickAddItem[] = [
  {
    name: 'Su (250ml)',
    cals: 0,
    img: THIINGS.waterBottle,
    type: 'snack',
    protein: 0,
    carbs: 0,
    fat: 0,
  },
  { name: 'Muz', cals: 89, img: THIINGS.banana, type: 'snack', protein: 1, carbs: 23, fat: 0 },
  { name: 'Yumurta', cals: 78, img: THIINGS.egg, type: 'breakfast', protein: 6, carbs: 0, fat: 5 },
  {
    name: 'Avokado',
    cals: 160,
    img: THIINGS.avocado,
    type: 'snack',
    protein: 2,
    carbs: 9,
    fat: 15,
  },
  { name: 'Elma', cals: 95, img: THIINGS.apple, type: 'snack', protein: 0, carbs: 25, fat: 0 },
  { name: 'Portakal', cals: 62, img: THIINGS.orange, type: 'snack', protein: 1, carbs: 15, fat: 0 },
]

interface Props {
  onAdd: (item: QuickAddItem) => Promise<void>
}

export function QuickAddBar({ onAdd }: Props) {
  const [adding, setAdding] = useState<string | null>(null)

  const handle = async (item: QuickAddItem) => {
    setAdding(item.name)
    await onAdd(item)
    setAdding(null)
  }

  return (
    <div className="scrollbar-none flex gap-3 overflow-x-auto pb-2">
      {QUICK_ADD.map((item) => (
        <motion.button
          key={item.name}
          onClick={() => handle(item)}
          disabled={adding === item.name}
          whileTap={{ scale: 0.94 }}
          transition={{ duration: 0.12 }}
          className="flex min-w-[72px] cursor-pointer flex-col items-center gap-1.5 rounded-xl border border-white/[0.06] bg-white/[0.04] p-3 transition-colors hover:border-[#6366F1]/30 hover:bg-[#6366F1]/10 disabled:opacity-50"
        >
          {adding === item.name ? (
            <Loader2 size={24} className="animate-spin text-[#6366F1]" />
          ) : (
            <Image
              src={item.img}
              alt={item.name}
              width={36}
              height={36}
              unoptimized
              className="drop-shadow-md"
            />
          )}
          <p className="text-center text-[11px] font-medium leading-tight text-white">
            {item.name}
          </p>
          <p className="text-[10px] text-[#64748B]">{item.cals > 0 ? `${item.cals} kcal` : '—'}</p>
        </motion.button>
      ))}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/app/\(dashboard\)/dashboard/nutrition/
git commit -m "feat(nutrition): add QuickAddBar component"
```

---

### Task 14: useNutritionToday hook

**Files:**

- Create: `apps/web/app/(dashboard)/dashboard/nutrition/hooks/useNutritionToday.ts`

- [ ] **Step 1: Implement hook**

```typescript
// apps/web/app/(dashboard)/dashboard/nutrition/hooks/useNutritionToday.ts
'use client'

import { useState, useEffect, useCallback } from 'react'
import type { MealLog, NutritionGoal, MacroTotals } from '@/lib/nutrition/types'
import { calculateNutritionScore } from '@/lib/nutrition/score'
import type { NutritionScore } from '@/lib/nutrition/types'

interface TodayData {
  meals: MealLog[]
  goal: NutritionGoal
  totals: MacroTotals
  waterGlasses: number
  streak: { currentStreak: number; longestStreak: number }
  score: NutritionScore
  loading: boolean
}

const DEFAULT_GOAL: NutritionGoal = {
  dailyCalories: 2200,
  proteinG: 150,
  carbsG: 250,
  fatG: 70,
  fiberG: 25,
  waterGoalMl: 2000,
}

export function useNutritionToday() {
  const [data, setData] = useState<TodayData>({
    meals: [],
    goal: DEFAULT_GOAL,
    totals: { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 },
    waterGlasses: 0,
    streak: { currentStreak: 0, longestStreak: 0 },
    score: {
      score: 0,
      breakdown: { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, water: 0 },
    },
    loading: true,
  })

  const fetchAll = useCallback(async () => {
    const [mealsRes, waterRes, streakRes] = await Promise.all([
      fetch('/api/nutrition'),
      fetch('/api/nutrition/water'),
      fetch('/api/nutrition/streak'),
    ])
    const [mealsData, waterData, streakData] = await Promise.all([
      mealsRes.json(),
      waterRes.json(),
      streakRes.json(),
    ])
    const meals: MealLog[] = mealsData.meals ?? []
    const goal: NutritionGoal = mealsData.nutritionGoal ?? DEFAULT_GOAL
    const waterGlasses: number = waterData.glasses ?? 0
    const totals: MacroTotals = {
      calories: meals.reduce((s, m) => s + m.totalCalories, 0),
      protein: meals.reduce((s, m) => s + m.totalProteinG, 0),
      carbs: meals.reduce((s, m) => s + m.totalCarbsG, 0),
      fat: meals.reduce((s, m) => s + m.totalFatG, 0),
      fiber: meals.reduce((s, m) => s + (m.totalFiberG ?? 0), 0),
    }
    const score = calculateNutritionScore(totals, goal, waterGlasses)
    setData({ meals, goal, totals, waterGlasses, streak: streakData, score, loading: false })
  }, [])

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  const deleteMeal = async (id: string) => {
    const prev = data.meals
    setData((d) => ({ ...d, meals: d.meals.filter((m) => m.id !== id) }))
    try {
      await fetch(`/api/nutrition/${id}`, { method: 'DELETE' })
      await fetchAll()
    } catch {
      setData((d) => ({ ...d, meals: prev }))
    }
  }

  const copyMeal = async (meal: MealLog) => {
    const prev = data.meals
    const optimistic = { ...meal, id: `temp-${Date.now()}`, loggedAt: new Date().toISOString() }
    setData((d) => ({ ...d, meals: [...d.meals, optimistic] }))
    try {
      await fetch('/api/nutrition', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mealType: meal.mealType,
          items: meal.items,
          totalCalories: meal.totalCalories,
          totalProteinG: meal.totalProteinG,
          totalCarbsG: meal.totalCarbsG,
          totalFatG: meal.totalFatG,
        }),
      })
      await fetchAll()
    } catch {
      setData((d) => ({ ...d, meals: prev }))
    }
  }

  const updateWater = async (glasses: number) => {
    const prev = data.waterGlasses
    setData((d) => ({ ...d, waterGlasses: glasses }))
    try {
      await fetch('/api/nutrition/water', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ glasses }),
      })
    } catch {
      setData((d) => ({ ...d, waterGlasses: prev }))
    }
  }

  const addQuickItem = async (item: {
    name: string
    cals: number
    type: string
    protein: number
    carbs: number
    fat: number
  }) => {
    await fetch('/api/nutrition', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mealType: item.type,
        items: [{ name: item.name, calories: item.cals }],
        totalCalories: item.cals,
        totalProteinG: item.protein,
        totalCarbsG: item.carbs,
        totalFatG: item.fat,
      }),
    })
    await fetchAll()
    await fetch('/api/nutrition/streak', { method: 'POST' })
  }

  return { ...data, deleteMeal, copyMeal, updateWater, addQuickItem, refresh: fetchAll }
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/app/\(dashboard\)/dashboard/nutrition/hooks/
git commit -m "feat(nutrition): add useNutritionToday hook with optimistic updates"
```

---

### Task 15: TodayTab assembly

**Files:**

- Create: `apps/web/app/(dashboard)/dashboard/nutrition/components/tabs/TodayTab.tsx`

- [ ] **Step 1: Implement TodayTab**

```tsx
// apps/web/app/(dashboard)/dashboard/nutrition/components/tabs/TodayTab.tsx
'use client'

import { CalorieRing } from '../today/CalorieRing'
import { MacroBars } from '../today/MacroBars'
import { WaterTracker } from '../today/WaterTracker'
import { MealTimeline } from '../today/MealTimeline'
import { QuickAddBar } from '../today/QuickAddBar'
import { useNutritionToday } from '../../hooks/useNutritionToday'

interface Props {
  onAddMeal: () => void
}

export function TodayTab({ onAddMeal }: Props) {
  const {
    meals,
    goal,
    totals,
    waterGlasses,
    streak,
    score,
    loading,
    deleteMeal,
    copyMeal,
    updateWater,
    addQuickItem,
  } = useNutritionToday()

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-64 rounded-2xl bg-white/[0.04]" />
        <div className="h-32 rounded-2xl bg-white/[0.04]" />
        <div className="h-48 rounded-2xl bg-white/[0.04]" />
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Hero row */}
      <div className="rounded-[1.5rem] border border-white/[0.06] p-[1px]">
        <div className="rounded-[calc(1.5rem-1px)] bg-[#12121E] p-5">
          <div className="flex flex-col items-center gap-6 lg:flex-row">
            <div className="shrink-0">
              <CalorieRing
                consumed={Math.round(totals.calories)}
                goal={goal.dailyCalories}
                score={score.score}
                streak={streak.currentStreak}
              />
            </div>
            <div className="w-full flex-1 space-y-4">
              <MacroBars
                protein={{ current: totals.protein, goal: goal.proteinG }}
                carbs={{ current: totals.carbs, goal: goal.carbsG }}
                fat={{ current: totals.fat, goal: goal.fatG }}
                fiber={{ current: totals.fiber, goal: goal.fiberG }}
              />
              <WaterTracker
                glasses={waterGlasses}
                goal={Math.round(goal.waterGoalMl / 250)}
                onUpdate={updateWater}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Meal Timeline */}
      <div className="rounded-[1.5rem] border border-white/[0.06] p-[1px]">
        <div className="rounded-[calc(1.5rem-1px)] bg-[#12121E] p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold text-white">Bugünkü Öğünler</h3>
            <button
              onClick={onAddMeal}
              className="cursor-pointer rounded-lg bg-[#6366F1] px-3 py-1.5 text-xs text-white transition-colors hover:bg-[#4F46E5]"
            >
              + Ekle
            </button>
          </div>
          <MealTimeline
            meals={meals}
            onDelete={deleteMeal}
            onCopy={copyMeal}
            onAddMeal={onAddMeal}
          />
        </div>
      </div>

      {/* Quick Add */}
      <div className="rounded-[1.5rem] border border-white/[0.06] p-[1px]">
        <div className="rounded-[calc(1.5rem-1px)] bg-[#12121E] p-5">
          <h3 className="mb-3 font-semibold text-white">Hızlı Ekle</h3>
          <QuickAddBar onAdd={addQuickItem} />
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/app/\(dashboard\)/dashboard/nutrition/
git commit -m "feat(nutrition): assemble TodayTab"
```

---

## Chunk 3: Explore Tab — Food Search, Barcode, Recent Foods

> **i18n note:** Components in Chunks 2–5 use hardcoded Turkish strings for Phase 1 simplicity. The i18n infrastructure (next-intl, messages files) is installed and wired in Task 8. String extraction into `useTranslations('nutrition')` calls is a Phase 1 follow-up task that can be done after all components are working. The spec requires it before Phase 1 ships — extract strings from each component after Task 23 is complete.

### Task 16: useRecentFoods hook

**Files:**

- Create: `apps/web/app/(dashboard)/dashboard/nutrition/hooks/useRecentFoods.ts`

- [ ] **Step 1: Implement hook**

```typescript
// apps/web/app/(dashboard)/dashboard/nutrition/hooks/useRecentFoods.ts
'use client'

import { useState, useEffect } from 'react'

interface RecentFood {
  name: string
  calories: number
}

export function useRecentFoods() {
  const [foods, setFoods] = useState<RecentFood[]>([])

  useEffect(() => {
    fetch('/api/nutrition/recent-foods')
      .then((r) => r.json())
      .then((d) => setFoods(d.recentFoods ?? []))
      .catch(() => {})
  }, [])

  return { foods }
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/app/\(dashboard\)/dashboard/nutrition/hooks/
git commit -m "feat(nutrition): add useRecentFoods hook"
```

---

### Task 17: useFoodSearch hook

**Files:**

- Create: `apps/web/app/(dashboard)/dashboard/nutrition/hooks/useFoodSearch.ts`

- [ ] **Step 1: Implement hook**

```typescript
// apps/web/app/(dashboard)/dashboard/nutrition/hooks/useFoodSearch.ts
'use client'

import { useState, useCallback, useRef } from 'react'
import { searchFoods } from '@/lib/nutrition/openfoodfacts'
import type { SearchResult } from '@/lib/nutrition/types'

export function useFoodSearch() {
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [query, setQuery] = useState('')
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const search = useCallback((q: string) => {
    setQuery(q)
    if (timerRef.current) clearTimeout(timerRef.current)
    if (!q.trim()) {
      setResults([])
      return
    }
    timerRef.current = setTimeout(async () => {
      setLoading(true)
      const r = await searchFoods(q)
      setResults(r)
      setLoading(false)
    }, 300)
  }, [])

  return { results, loading, query, search }
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/app/\(dashboard\)/dashboard/nutrition/hooks/
git commit -m "feat(nutrition): add useFoodSearch hook with debounce"
```

---

### Task 17: FoodSearchBar + FoodSearchResults

**Files:**

- Create: `apps/web/app/(dashboard)/dashboard/nutrition/components/explore/FoodSearchBar.tsx`
- Create: `apps/web/app/(dashboard)/dashboard/nutrition/components/explore/FoodSearchResults.tsx`
- Create: `apps/web/app/(dashboard)/dashboard/nutrition/components/explore/RecentFoods.tsx`

- [ ] **Step 1: FoodSearchBar**

```tsx
// apps/web/app/(dashboard)/dashboard/nutrition/components/explore/FoodSearchBar.tsx
'use client'

import { Search, Camera, ScanLine } from 'lucide-react'

interface Props {
  query: string
  onSearch: (q: string) => void
  onPhoto: () => void
  onBarcode: () => void
}

export function FoodSearchBar({ query, onSearch, onPhoto, onBarcode }: Props) {
  return (
    <div className="flex gap-2">
      <div className="relative flex-1">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B]" />
        <input
          type="text"
          value={query}
          onChange={(e) => onSearch(e.target.value)}
          placeholder="Besin ara..."
          className="w-full rounded-xl border border-white/[0.06] bg-white/[0.04] py-3 pl-9 pr-4 text-sm text-white outline-none transition-colors placeholder:text-[#64748B] focus:border-[#6366F1]/50"
        />
      </div>
      <button
        onClick={onPhoto}
        className="cursor-pointer rounded-xl border border-white/[0.06] bg-white/[0.04] p-3 transition-colors hover:border-[#6366F1]/30"
        aria-label="Fotoğrafla analiz"
      >
        <Camera size={18} className="text-[#64748B]" />
      </button>
      <button
        onClick={onBarcode}
        className="cursor-pointer rounded-xl border border-white/[0.06] bg-white/[0.04] p-3 transition-colors hover:border-[#6366F1]/30"
        aria-label="Barkod tara"
      >
        <ScanLine size={18} className="text-[#64748B]" />
      </button>
    </div>
  )
}
```

- [ ] **Step 2: FoodSearchResults**

```tsx
// apps/web/app/(dashboard)/dashboard/nutrition/components/explore/FoodSearchResults.tsx
'use client'

import { motion } from 'framer-motion'
import { Plus, AlertTriangle } from 'lucide-react'
import type { SearchResult } from '@/lib/nutrition/types'

interface Props {
  results: SearchResult[]
  loading: boolean
  query: string
  onSelect: (result: SearchResult) => void
}

export function FoodSearchResults({ results, loading, query, onSelect }: Props) {
  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-16 animate-pulse rounded-xl bg-white/[0.04]" />
        ))}
      </div>
    )
  }

  if (query && results.length === 0) {
    return (
      <div className="py-10 text-center text-[#64748B]">
        <p className="text-sm">"{query}" için sonuç bulunamadı</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {results.map((r, i) => (
        <motion.div
          key={r.barcode + i}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.04 }}
          className="flex cursor-pointer items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.03] p-3 transition-colors hover:bg-white/[0.06]"
          onClick={() => onSelect(r)}
        >
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-white">{r.name}</p>
            {r.brand && <p className="truncate text-xs text-[#64748B]">{r.brand}</p>}
            <div className="mt-1 flex gap-3 text-[11px] text-[#64748B]">
              <span>{r.caloriesPer100g} kcal</span>
              <span>P {r.proteinPer100g}g</span>
              <span>K {r.carbsPer100g}g</span>
              <span>Y {r.fatPer100g}g</span>
              {r.glycemicIndex && <span>Gİ {r.glycemicIndex}</span>}
            </div>
            {r.allergens.length > 0 && (
              <div className="mt-1 flex items-center gap-1">
                <AlertTriangle size={10} className="text-[#F59E0B]" />
                <span className="text-[10px] text-[#F59E0B]">
                  {r.allergens.slice(0, 3).join(', ')}
                </span>
              </div>
            )}
          </div>
          <button className="shrink-0 cursor-pointer rounded-lg bg-[#6366F1]/10 p-1.5 transition-colors hover:bg-[#6366F1]/20">
            <Plus size={16} className="text-[#6366F1]" />
          </button>
        </motion.div>
      ))}
    </div>
  )
}
```

- [ ] **Step 3: RecentFoods**

```tsx
// apps/web/app/(dashboard)/dashboard/nutrition/components/explore/RecentFoods.tsx
'use client'

import { useRecentFoods } from '../../hooks/useRecentFoods'

interface Props {
  onSelect: (name: string) => void
}

export function RecentFoods({ onSelect }: Props) {
  const { foods } = useRecentFoods()

  if (foods.length === 0) return null

  return (
    <div>
      <p className="mb-2 text-xs text-[#64748B]">Son Kullanılanlar</p>
      <div className="flex flex-wrap gap-2">
        {foods.map((f) => (
          <button
            key={f.name}
            onClick={() => onSelect(f.name)}
            className="cursor-pointer rounded-full border border-white/[0.06] bg-white/[0.04] px-3 py-1.5 text-xs text-white transition-colors hover:bg-white/[0.08]"
          >
            {f.name}
          </button>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Commit**

```bash
git add apps/web/app/\(dashboard\)/dashboard/nutrition/
git commit -m "feat(nutrition): add FoodSearchBar, FoodSearchResults, RecentFoods components"
```

---

### Task 18: ExploreTab assembly

**Files:**

- Create: `apps/web/app/(dashboard)/dashboard/nutrition/components/tabs/ExploreTab.tsx`

- [ ] **Step 1: Implement ExploreTab**

```tsx
// apps/web/app/(dashboard)/dashboard/nutrition/components/tabs/ExploreTab.tsx
'use client'

import { useState } from 'react'
import { FoodSearchBar } from '../explore/FoodSearchBar'
import { FoodSearchResults } from '../explore/FoodSearchResults'
import { RecentFoods } from '../explore/RecentFoods'
import { useFoodSearch } from '../../hooks/useFoodSearch'
import type { SearchResult } from '@/lib/nutrition/types'

interface Props {
  onSelectFood: (food: SearchResult) => void
  onPhoto: () => void
  onBarcode: () => void
}

export function ExploreTab({ onSelectFood, onPhoto, onBarcode }: Props) {
  const { results, loading, query, search } = useFoodSearch()

  return (
    <div className="space-y-4">
      <FoodSearchBar query={query} onSearch={search} onPhoto={onPhoto} onBarcode={onBarcode} />
      {!query && <RecentFoods onSelect={search} />}
      {query && (
        <FoodSearchResults
          results={results}
          loading={loading}
          query={query}
          onSelect={onSelectFood}
        />
      )}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/app/\(dashboard\)/dashboard/nutrition/
git commit -m "feat(nutrition): assemble ExploreTab"
```

---

## Chunk 4: Modals — AddMeal, FoodDetail, Barcode, PhotoAnalyzer

### Task 19: FoodDetailModal (porsiyon hesaplama + GI + alerjen)

**Files:**

- Create: `apps/web/app/(dashboard)/dashboard/nutrition/components/modals/FoodDetailModal.tsx`

- [ ] **Step 1: Implement FoodDetailModal**

```tsx
// apps/web/app/(dashboard)/dashboard/nutrition/components/modals/FoodDetailModal.tsx
'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { X, AlertTriangle, Plus } from 'lucide-react'
import type { SearchResult, MealType } from '@/lib/nutrition/types'

const MEAL_LABELS: Record<MealType, string> = {
  breakfast: 'Kahvaltı',
  lunch: 'Öğle Yemeği',
  dinner: 'Akşam Yemeği',
  snack: 'Ara Öğün',
  pre_workout: 'Antrenman Öncesi',
  post_workout: 'Antrenman Sonrası',
}

const PORTION_UNITS = ['g', 'adet', 'bardak', 'dilim', 'kaşık', 'paket']

interface Props {
  food: SearchResult
  onClose: () => void
  onAdd: (data: {
    food: SearchResult
    portionG: number
    portionUnit: string
    mealType: MealType
  }) => Promise<void>
}

export function FoodDetailModal({ food, onClose, onAdd }: Props) {
  const [portion, setPortion] = useState(100)
  const [unit, setUnit] = useState('g')
  const [mealType, setMealType] = useState<MealType>('snack')
  const [saving, setSaving] = useState(false)

  // Recalculate per portion
  const factor = portion / 100
  const calc = {
    calories: Math.round(food.caloriesPer100g * factor),
    protein: Math.round(food.proteinPer100g * factor * 10) / 10,
    carbs: Math.round(food.carbsPer100g * factor * 10) / 10,
    fat: Math.round(food.fatPer100g * factor * 10) / 10,
    fiber: Math.round((food.fiberPer100g ?? 0) * factor * 10) / 10,
  }

  const handle = async () => {
    setSaving(true)
    await onAdd({ food, portionG: portion, portionUnit: unit, mealType })
    setSaving(false)
    onClose()
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4 backdrop-blur-sm sm:items-center"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 60, opacity: 0 }}
        transition={{ type: 'spring', bounce: 0.34 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-[1.5rem] border border-white/[0.06] p-[1px]"
      >
        <div className="rounded-[calc(1.5rem-1px)] bg-[#12121E] p-6">
          <div className="mb-4 flex items-start justify-between">
            <div>
              <h3 className="font-semibold text-white">{food.name}</h3>
              {food.brand && <p className="text-xs text-[#64748B]">{food.brand}</p>}
            </div>
            <button
              onClick={onClose}
              className="cursor-pointer rounded-lg p-1.5 transition-colors hover:bg-white/[0.08]"
            >
              <X size={16} className="text-[#64748B]" />
            </button>
          </div>

          {/* Portion input */}
          <div className="mb-4 flex gap-2">
            <input
              type="number"
              value={portion}
              onChange={(e) => setPortion(Number(e.target.value) || 0)}
              className="flex-1 rounded-xl border border-white/[0.06] bg-white/[0.04] px-3 py-2.5 text-sm text-white outline-none transition-colors focus:border-[#6366F1]/50"
              min={1}
            />
            <select
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              className="cursor-pointer rounded-xl border border-white/[0.06] bg-white/[0.04] px-3 py-2.5 text-sm text-white outline-none"
            >
              {PORTION_UNITS.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          </div>

          {/* Live macro preview */}
          <div className="mb-4 grid grid-cols-5 gap-2">
            {[
              { label: 'Kcal', value: calc.calories },
              { label: 'Protein', value: `${calc.protein}g` },
              { label: 'Karbo', value: `${calc.carbs}g` },
              { label: 'Yağ', value: `${calc.fat}g` },
              { label: 'Lif', value: `${calc.fiber}g` },
            ].map((m) => (
              <div key={m.label} className="rounded-lg bg-white/[0.04] p-2 text-center">
                <p className="font-['Barlow_Condensed'] text-base font-bold text-white">
                  {m.value}
                </p>
                <p className="text-[10px] text-[#64748B]">{m.label}</p>
              </div>
            ))}
          </div>

          {/* GI */}
          {food.glycemicIndex !== undefined && (
            <div className="mb-3 flex items-center gap-2 text-xs text-[#64748B]">
              <span>Glisemik İndeks:</span>
              <span
                className={`font-semibold ${food.glycemicIndex < 55 ? 'text-[#22C55E]' : food.glycemicIndex < 70 ? 'text-[#F59E0B]' : 'text-[#F97316]'}`}
              >
                {food.glycemicIndex} (
                {food.glycemicIndex < 55 ? 'Düşük' : food.glycemicIndex < 70 ? 'Orta' : 'Yüksek'})
              </span>
            </div>
          )}

          {/* Allergens */}
          {food.allergens.length > 0 && (
            <div className="mb-4 flex items-start gap-2 rounded-xl border border-[#F59E0B]/20 bg-[#F59E0B]/10 p-2.5">
              <AlertTriangle size={14} className="mt-0.5 shrink-0 text-[#F59E0B]" />
              <p className="text-xs text-[#F59E0B]">Alerjen: {food.allergens.join(', ')}</p>
            </div>
          )}

          {/* Meal type pills */}
          <div className="mb-5 flex flex-wrap gap-1.5">
            {(Object.entries(MEAL_LABELS) as [MealType, string][]).map(([type, label]) => (
              <button
                key={type}
                onClick={() => setMealType(type)}
                className={`cursor-pointer rounded-full px-3 py-1 text-xs transition-colors ${mealType === type ? 'bg-[#6366F1] text-white' : 'bg-white/[0.04] text-[#64748B] hover:bg-white/[0.08]'}`}
              >
                {label}
              </button>
            ))}
          </div>

          <button
            onClick={handle}
            disabled={saving || portion <= 0}
            className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#6366F1] py-3 text-sm font-semibold text-white transition-colors hover:bg-[#4F46E5] disabled:opacity-50"
          >
            {saving ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            ) : (
              <Plus size={16} />
            )}
            Günlüğe Ekle
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/app/\(dashboard\)/dashboard/nutrition/
git commit -m "feat(nutrition): add FoodDetailModal with portion, GI, allergen display"
```

---

### Task 20: AddMealModal (manual entry)

**Files:**

- Create: `apps/web/app/(dashboard)/dashboard/nutrition/components/modals/AddMealModal.tsx`

- [ ] **Step 1: Implement AddMealModal**

```tsx
// apps/web/app/(dashboard)/dashboard/nutrition/components/modals/AddMealModal.tsx
'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import type { MealType } from '@/lib/nutrition/types'

const MEAL_LABELS: Record<MealType, string> = {
  breakfast: 'Kahvaltı',
  lunch: 'Öğle Yemeği',
  dinner: 'Akşam Yemeği',
  snack: 'Ara Öğün',
  pre_workout: 'Antrenman Öncesi',
  post_workout: 'Antrenman Sonrası',
}

interface Props {
  open: boolean
  onClose: () => void
  onSave: (data: {
    name: string
    calories: number
    protein: number
    carbs: number
    fat: number
    mealType: MealType
  }) => Promise<void>
}

export function AddMealModal({ open, onClose, onSave }: Props) {
  const [form, setForm] = useState({
    name: '',
    calories: '',
    protein: '',
    carbs: '',
    fat: '',
    mealType: 'snack' as MealType,
  })
  const [saving, setSaving] = useState(false)

  const handle = async () => {
    if (!form.name || !form.calories) return
    setSaving(true)
    await onSave({
      name: form.name,
      calories: Number(form.calories),
      protein: Number(form.protein || 0),
      carbs: Number(form.carbs || 0),
      fat: Number(form.fat || 0),
      mealType: form.mealType,
    })
    setSaving(false)
    setForm({ name: '', calories: '', protein: '', carbs: '', fat: '', mealType: 'snack' })
    onClose()
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4 backdrop-blur-sm sm:items-center"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ type: 'spring', bounce: 0.34 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-[1.5rem] border border-white/[0.06] p-[1px]"
          >
            <div className="space-y-4 rounded-[calc(1.5rem-1px)] bg-[#12121E] p-6">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-white">Öğün Ekle</h3>
                <button
                  onClick={onClose}
                  className="cursor-pointer rounded-lg p-1.5 transition-colors hover:bg-white/[0.08]"
                >
                  <X size={16} className="text-[#64748B]" />
                </button>
              </div>

              <input
                type="text"
                placeholder="Yemek adı"
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                className="w-full rounded-xl border border-white/[0.06] bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition-colors placeholder:text-[#64748B] focus:border-[#6366F1]/50"
              />

              <div className="flex flex-wrap gap-1.5">
                {(Object.entries(MEAL_LABELS) as [MealType, string][]).map(([type, label]) => (
                  <button
                    key={type}
                    onClick={() => setForm((p) => ({ ...p, mealType: type }))}
                    className={`cursor-pointer rounded-full px-3 py-1 text-xs transition-colors ${form.mealType === type ? 'bg-[#6366F1] text-white' : 'bg-white/[0.04] text-[#64748B]'}`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs text-[#64748B]">Kalori (kcal) *</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={form.calories}
                    onChange={(e) => setForm((p) => ({ ...p, calories: e.target.value }))}
                    className="w-full rounded-xl border border-white/[0.06] bg-white/[0.04] px-3 py-2.5 text-sm text-white outline-none transition-colors focus:border-[#6366F1]/50"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-[#64748B]">Protein (g)</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={form.protein}
                    onChange={(e) => setForm((p) => ({ ...p, protein: e.target.value }))}
                    className="w-full rounded-xl border border-white/[0.06] bg-white/[0.04] px-3 py-2.5 text-sm text-white outline-none transition-colors focus:border-[#6366F1]/50"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-[#64748B]">Karbonhidrat (g)</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={form.carbs}
                    onChange={(e) => setForm((p) => ({ ...p, carbs: e.target.value }))}
                    className="w-full rounded-xl border border-white/[0.06] bg-white/[0.04] px-3 py-2.5 text-sm text-white outline-none transition-colors focus:border-[#6366F1]/50"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-[#64748B]">Yağ (g)</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={form.fat}
                    onChange={(e) => setForm((p) => ({ ...p, fat: e.target.value }))}
                    className="w-full rounded-xl border border-white/[0.06] bg-white/[0.04] px-3 py-2.5 text-sm text-white outline-none transition-colors focus:border-[#6366F1]/50"
                  />
                </div>
              </div>

              <button
                onClick={handle}
                disabled={saving || !form.name || !form.calories}
                className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#6366F1] py-3 text-sm font-semibold text-white transition-colors hover:bg-[#4F46E5] disabled:opacity-50"
              >
                {saving && (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                )}
                Ekle
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/app/\(dashboard\)/dashboard/nutrition/
git commit -m "feat(nutrition): add AddMealModal"
```

---

### Task 21: BarcodeModal

**Files:**

- Create: `apps/web/app/(dashboard)/dashboard/nutrition/components/explore/BarcodeScanner.tsx`
- Create: `apps/web/app/(dashboard)/dashboard/nutrition/components/modals/BarcodeModal.tsx`

- [ ] **Step 1: BarcodeScanner inner component**

```tsx
// apps/web/app/(dashboard)/dashboard/nutrition/components/explore/BarcodeScanner.tsx
'use client'

import { useEffect, useRef } from 'react'
import Quagga from '@ericblade/quagga2'

interface Props {
  onDetected: (barcode: string) => void
}

export function BarcodeScanner({ onDetected }: Props) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!ref.current) return
    Quagga.init(
      {
        inputStream: {
          type: 'LiveStream',
          target: ref.current,
          constraints: { facingMode: 'environment' },
        },
        decoder: { readers: ['ean_reader', 'ean_8_reader', 'upc_reader', 'code_128_reader'] },
      },
      (err) => {
        if (err) return
        Quagga.start()
      }
    )
    Quagga.onDetected((result) => {
      const code = result.codeResult.code
      if (code) {
        Quagga.stop()
        onDetected(code)
      }
    })
    return () => {
      Quagga.stop()
    }
  }, [onDetected])

  return <div ref={ref} className="h-64 w-full overflow-hidden rounded-xl bg-black" />
}
```

- [ ] **Step 2: BarcodeModal wrapper**

```tsx
// apps/web/app/(dashboard)/dashboard/nutrition/components/modals/BarcodeModal.tsx
'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Loader2 } from 'lucide-react'
import { BarcodeScanner } from '../explore/BarcodeScanner'
import { lookupBarcode } from '@/lib/nutrition/openfoodfacts'
import type { SearchResult } from '@/lib/nutrition/types'

interface Props {
  open: boolean
  onClose: () => void
  onFound: (food: SearchResult) => void
}

export function BarcodeModal({ open, onClose, onFound }: Props) {
  const [status, setStatus] = useState<'scanning' | 'loading' | 'notfound'>('scanning')

  const handleDetected = async (barcode: string) => {
    setStatus('loading')
    const result = await lookupBarcode(barcode)
    if (result) {
      onFound(result)
      onClose()
    } else setStatus('notfound')
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: 'spring', bounce: 0.34 }}
            className="w-full max-w-sm rounded-[1.5rem] border border-white/[0.06] p-[1px]"
          >
            <div className="rounded-[calc(1.5rem-1px)] bg-[#12121E] p-5">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-semibold text-white">Barkod Tara</h3>
                <button
                  onClick={onClose}
                  className="cursor-pointer rounded-lg p-1.5 hover:bg-white/[0.08]"
                >
                  <X size={16} className="text-[#64748B]" />
                </button>
              </div>

              {status === 'scanning' && <BarcodeScanner onDetected={handleDetected} />}

              {status === 'loading' && (
                <div className="flex h-64 items-center justify-center">
                  <Loader2 size={32} className="animate-spin text-[#6366F1]" />
                </div>
              )}

              {status === 'notfound' && (
                <div className="flex h-64 flex-col items-center justify-center gap-3">
                  <p className="text-sm text-[#64748B]">Ürün bulunamadı</p>
                  <button
                    onClick={() => setStatus('scanning')}
                    className="cursor-pointer rounded-xl bg-[#6366F1] px-4 py-2 text-sm text-white"
                  >
                    Tekrar Dene
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add apps/web/app/\(dashboard\)/dashboard/nutrition/
git commit -m "feat(nutrition): add BarcodeScanner and BarcodeModal"
```

---

### Task 22: MealPhotoAnalyzer modal (rewrite)

**Files:**

- Modify: `apps/web/components/dashboard/MealPhotoAnalyzer.tsx` → move/rewrite to `apps/web/app/(dashboard)/dashboard/nutrition/components/modals/MealPhotoAnalyzer.tsx`

- [ ] **Step 1: Rewrite MealPhotoAnalyzer**

```tsx
// apps/web/app/(dashboard)/dashboard/nutrition/components/modals/MealPhotoAnalyzer.tsx
'use client'

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Upload, Camera, Loader2, Check, AlertCircle } from 'lucide-react'
import type { MealType } from '@/lib/nutrition/types'

const MEAL_LABELS: Record<MealType, string> = {
  breakfast: 'Kahvaltı',
  lunch: 'Öğle Yemeği',
  dinner: 'Akşam Yemeği',
  snack: 'Ara Öğün',
  pre_workout: 'Antrenman Öncesi',
  post_workout: 'Antrenman Sonrası',
}

interface AnalysisResult {
  name: string
  calories: number
  protein: number
  carbs: number
  fat: number
}

interface Props {
  onClose: () => void
  onSaved: () => void
}

export function MealPhotoAnalyzer({ onClose, onSaved }: Props) {
  const [phase, setPhase] = useState<'upload' | 'analyzing' | 'result' | 'error'>('upload')
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [mealType, setMealType] = useState<MealType>('snack')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [dragging, setDragging] = useState(false)

  const analyze = useCallback(async (file: File) => {
    setPhase('analyzing')
    try {
      const formData = new FormData()
      formData.append('photo', file)
      const res = await fetch('/api/ai/analyze-meal-photo', { method: 'POST', body: formData })
      if (!res.ok) throw new Error('Analysis failed')
      const data = await res.json()
      setResult(data)
      setPhase('result')
    } catch (e) {
      setError('Analiz başarısız. Tekrar dene.')
      setPhase('error')
    }
  }, [])

  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) return
    analyze(file)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  const handleSave = async () => {
    if (!result) return
    setSaving(true)
    await fetch('/api/nutrition', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mealType,
        aiAnalyzed: true,
        items: [{ name: result.name, calories: result.calories }],
        totalCalories: result.calories,
        totalProteinG: result.protein,
        totalCarbsG: result.carbs,
        totalFatG: result.fat,
      }),
    })
    await fetch('/api/nutrition/streak', { method: 'POST' })
    setSaving(false)
    onSaved()
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4 backdrop-blur-sm sm:items-center"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 60, opacity: 0 }}
        transition={{ type: 'spring', bounce: 0.34 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-[1.5rem] border border-white/[0.06] p-[1px]"
      >
        <div className="rounded-[calc(1.5rem-1px)] bg-[#12121E] p-6">
          <div className="mb-5 flex items-center justify-between">
            <h3 className="font-semibold text-white">Fotoğrafla Analiz</h3>
            <button
              onClick={onClose}
              className="cursor-pointer rounded-lg p-1.5 transition-colors hover:bg-white/[0.08]"
            >
              <X size={16} className="text-[#64748B]" />
            </button>
          </div>

          {phase === 'upload' && (
            <div
              onDragOver={(e) => {
                e.preventDefault()
                setDragging(true)
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              className={`rounded-xl border-2 border-dashed p-8 text-center transition-colors ${dragging ? 'border-[#6366F1] bg-[#6366F1]/5' : 'border-white/[0.10]'}`}
            >
              <Upload size={32} className="mx-auto mb-3 text-[#64748B]" />
              <p className="mb-3 text-sm text-[#64748B]">Fotoğrafı sürükle bırak</p>
              <label className="cursor-pointer rounded-xl bg-[#6366F1] px-4 py-2 text-sm text-white transition-colors hover:bg-[#4F46E5]">
                Dosya Seç
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0]
                    if (f) handleFile(f)
                  }}
                />
              </label>
            </div>
          )}

          {phase === 'analyzing' && (
            <div className="flex flex-col items-center justify-center gap-4 py-12">
              {/* Skeleton */}
              <div className="w-full animate-pulse space-y-3">
                <div className="h-5 w-3/4 rounded bg-white/[0.06]" />
                <div className="h-4 w-1/2 rounded bg-white/[0.06]" />
                <div className="mt-4 grid grid-cols-4 gap-2">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-12 rounded-lg bg-white/[0.06]" />
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm text-[#64748B]">
                <Loader2 size={16} className="animate-spin" />
                AI analiz ediyor...
              </div>
            </div>
          )}

          {phase === 'result' && result && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Check size={16} className="text-[#22C55E]" />
                <p className="font-medium text-white">{result.name}</p>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { label: 'Kcal', value: result.calories },
                  { label: 'Protein', value: `${result.protein}g` },
                  { label: 'Karbo', value: `${result.carbs}g` },
                  { label: 'Yağ', value: `${result.fat}g` },
                ].map((m) => (
                  <div key={m.label} className="rounded-lg bg-white/[0.04] p-2 text-center">
                    <p className="font-['Barlow_Condensed'] text-base font-bold text-white">
                      {m.value}
                    </p>
                    <p className="text-[10px] text-[#64748B]">{m.label}</p>
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {(Object.entries(MEAL_LABELS) as [MealType, string][]).map(([type, label]) => (
                  <button
                    key={type}
                    onClick={() => setMealType(type)}
                    className={`cursor-pointer rounded-full px-3 py-1 text-xs transition-colors ${mealType === type ? 'bg-[#6366F1] text-white' : 'bg-white/[0.04] text-[#64748B]'}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#6366F1] py-3 text-sm font-semibold text-white transition-colors hover:bg-[#4F46E5] disabled:opacity-50"
              >
                {saving && (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                )}
                Günlüğe Ekle
              </button>
            </div>
          )}

          {phase === 'error' && (
            <div className="flex flex-col items-center gap-3 py-8">
              <AlertCircle size={32} className="text-red-400" />
              <p className="text-sm text-[#64748B]">{error}</p>
              <button
                onClick={() => setPhase('upload')}
                className="cursor-pointer rounded-xl bg-[#6366F1] px-4 py-2 text-sm text-white"
              >
                Tekrar Dene
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/app/\(dashboard\)/dashboard/nutrition/components/modals/MealPhotoAnalyzer.tsx
git commit -m "feat(nutrition): rewrite MealPhotoAnalyzer with drag-drop, skeleton, editable result"
```

---

## Chunk 5: Page orchestrator, Tab bar, font, final wiring

### Task 23: NutritionTabs tab bar

**Files:**

- Create: `apps/web/app/(dashboard)/dashboard/nutrition/components/NutritionTabs.tsx`

- [ ] **Step 1: Implement NutritionTabs**

```tsx
// apps/web/app/(dashboard)/dashboard/nutrition/components/NutritionTabs.tsx
'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'

const TABS = [
  { id: 'today', label: 'Bugün' },
  { id: 'explore', label: 'Keşfet' },
  { id: 'history', label: 'Geçmiş' },
  { id: 'profile', label: 'Profil' },
]

export function NutritionTabs() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const active = searchParams.get('tab') ?? 'today'

  return (
    <div className="flex w-fit gap-1 rounded-xl border border-white/[0.06] bg-white/[0.03] p-1">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          onClick={() => router.push(`?tab=${tab.id}`)}
          className="relative cursor-pointer rounded-lg px-4 py-2 text-sm font-medium transition-colors"
          style={{ color: active === tab.id ? '#fff' : '#64748B' }}
        >
          {active === tab.id && (
            <motion.div
              layoutId="activeTab"
              className="absolute inset-0 rounded-lg border border-[#6366F1]/30 bg-[#6366F1]/20"
              transition={{ type: 'spring', stiffness: 100, damping: 20 }}
            />
          )}
          <span className="relative z-10">{tab.label}</span>
        </button>
      ))}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/app/\(dashboard\)/dashboard/nutrition/
git commit -m "feat(nutrition): add NutritionTabs with animated active indicator"
```

---

### Task 24: Page orchestrator (final assembly)

**Files:**

- Modify: `apps/web/app/(dashboard)/dashboard/nutrition/page.tsx`
- Modify: `apps/web/app/layout.tsx` (add Barlow Condensed font)

- [ ] **Step 1: Add Barlow Condensed font to layout**

In `apps/web/app/layout.tsx`, add alongside existing font imports:

```typescript
import { Barlow_Condensed } from 'next/font/google'

const barlowCondensed = Barlow_Condensed({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  variable: '--font-barlow-condensed',
})
```

And add `barlowCondensed.variable` to the `<html>` or root `<body>` className.

- [ ] **Step 2: Add CSS variable to globals.css**

```css
/* apps/web/app/globals.css */
.font-barlow {
  font-family: var(--font-barlow-condensed), sans-serif;
}
```

- [ ] **Step 3: Rewrite nutrition page.tsx**

```tsx
// apps/web/app/(dashboard)/dashboard/nutrition/page.tsx
'use client'

import { useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import { Plus, Camera } from 'lucide-react'
import { NutritionTabs } from './components/NutritionTabs'
import { TodayTab } from './components/tabs/TodayTab'
import { ExploreTab } from './components/tabs/ExploreTab'
import { AddMealModal } from './components/modals/AddMealModal'
import { FoodDetailModal } from './components/modals/FoodDetailModal'
import { BarcodeModal } from './components/modals/BarcodeModal'
import { MealPhotoAnalyzer } from './components/modals/MealPhotoAnalyzer'
import type { SearchResult, MealType } from '@/lib/nutrition/types'

function NutritionPageInner() {
  const searchParams = useSearchParams()
  const tab = searchParams.get('tab') ?? 'today'

  const [showAddMeal, setShowAddMeal] = useState(false)
  const [showBarcode, setShowBarcode] = useState(false)
  const [showPhoto, setShowPhoto] = useState(false)
  const [selectedFood, setSelectedFood] = useState<SearchResult | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  const refresh = () => setRefreshKey((k) => k + 1)

  const handleManualAdd = async (data: {
    name: string
    calories: number
    protein: number
    carbs: number
    fat: number
    mealType: MealType
  }) => {
    await fetch('/api/nutrition', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mealType: data.mealType,
        items: [{ name: data.name, calories: data.calories }],
        totalCalories: data.calories,
        totalProteinG: data.protein,
        totalCarbsG: data.carbs,
        totalFatG: data.fat,
      }),
    })
    await fetch('/api/nutrition/streak', { method: 'POST' })
    refresh()
  }

  const handleFoodAdd = async (data: {
    food: SearchResult
    portionG: number
    portionUnit: string
    mealType: MealType
  }) => {
    const totalCalories = Math.round((data.food.caloriesPer100g * data.portionG) / 100)
    await fetch('/api/nutrition', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mealType: data.mealType,
        items: [{ name: data.food.name, calories: totalCalories }],
        totalCalories,
        totalProteinG: Math.round(((data.food.proteinPer100g * data.portionG) / 100) * 10) / 10,
        totalCarbsG: Math.round(((data.food.carbsPer100g * data.portionG) / 100) * 10) / 10,
        totalFatG: Math.round(((data.food.fatPer100g * data.portionG) / 100) * 10) / 10,
      }),
    })
    await fetch('/api/nutrition/streak', { method: 'POST' })
    setSelectedFood(null)
    refresh()
  }

  return (
    <div className="max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-['Barlow_Condensed'] text-4xl font-bold tracking-tight text-white">
            Beslenme
          </h1>
          <p className="mt-0.5 text-sm text-[#64748B]">Günlük besin takibi</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowAddMeal(true)}
            className="flex cursor-pointer items-center gap-2 rounded-xl bg-[#6366F1] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#4F46E5]"
          >
            <Plus size={16} /> Öğün Ekle
          </button>
          <button
            onClick={() => {}}
            className="flex cursor-pointer items-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.04] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-white/[0.08]"
            onClick={() => setShowPhoto(true)}
          >
            <Camera size={16} /> Fotoğrafla
          </button>
        </div>
      </div>

      {/* Tabs */}
      <NutritionTabs />

      {/* Tab content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -10 }}
          transition={{ type: 'spring', stiffness: 100, damping: 20 }}
        >
          {tab === 'today' && <TodayTab key={refreshKey} onAddMeal={() => setShowAddMeal(true)} />}
          {tab === 'explore' && (
            <ExploreTab
              onSelectFood={setSelectedFood}
              onPhoto={() => {}}
              onBarcode={() => setShowBarcode(true)}
            />
          )}
          {tab === 'history' && (
            <div className="py-20 text-center text-sm text-[#64748B]">
              Geçmiş — Phase 2'de gelecek
            </div>
          )}
          {tab === 'profile' && (
            <div className="py-20 text-center text-sm text-[#64748B]">
              Profil — Phase 3'te gelecek
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Modals */}
      <AddMealModal
        open={showAddMeal}
        onClose={() => setShowAddMeal(false)}
        onSave={handleManualAdd}
      />
      <BarcodeModal
        open={showBarcode}
        onClose={() => setShowBarcode(false)}
        onFound={setSelectedFood}
      />
      <AnimatePresence>
        {showPhoto && (
          <MealPhotoAnalyzer
            onClose={() => setShowPhoto(false)}
            onSaved={() => {
              setShowPhoto(false)
              refresh()
            }}
          />
        )}
        {selectedFood && (
          <FoodDetailModal
            food={selectedFood}
            onClose={() => setSelectedFood(null)}
            onAdd={handleFoodAdd}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

export default function NutritionPage() {
  return (
    <Suspense>
      <NutritionPageInner />
    </Suspense>
  )
}
```

- [ ] **Step 4: Run TypeScript check**

```bash
cd apps/web && pnpm tsc --noEmit 2>&1 | head -40
```

Fix any type errors before proceeding.

- [ ] **Step 5: Final commit**

```bash
git add apps/web/app/\(dashboard\)/dashboard/nutrition/ apps/web/app/layout.tsx apps/web/app/globals.css
git commit -m "feat(nutrition): complete Phase 1 page orchestrator — all tabs, modals, font wired"
```

---

## Testing Summary

Run all nutrition tests:

```bash
cd apps/web && pnpm vitest run lib/nutrition/
```

Expected: All tests PASS

Run full test suite:

```bash
cd apps/web && pnpm vitest run
```

Expected: No regressions.

---

## Phase 1 Done — What's Built

- Animasyonlu Kalori Ring (SVG, Framer Motion)
- Makro barlar (Protein / Karbo / Yağ / Lif)
- Su takibi (8 bardak, optimistic)
- Öğün timeline (ekle / sil / genişlet / **kopyala**)
- Hızlı ekle bar
- Besin arama (Open Food Facts, debounced)
- **Porsiyon hesaplama** (g / adet / bardak / dilim / kaşık / paket)
- **Glisemik indeks** gösterimi
- **Alerjen uyarıları**
- Barkod tarama (quagga2)
- Son kullanılan besinler
- **Streak sistemi** (her öğün kayıt sonrası güncellenir)
- **Beslenme puanı** (0-100, ağırlıklı makro skoru)
- Türkçe + İngilizce i18n altyapısı
- Tüm core utility'ler test edilmiş (score, streak, OFFclient)
