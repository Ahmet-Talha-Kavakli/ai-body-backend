# Nutrition Hub Phase 2 — History Tab Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the History tab for `/dashboard/nutrition` with 30-day trend charts, weekly analytics, streak calendar, top foods, meal timing breakdown, weekly performance badge, week selector, and CSV export.

**Architecture:** History tab is a pure read layer. It uses a new `/api/nutrition/history/stats` endpoint that queries MealLog with `mealType` and `items` fields (the existing `/api/nutrition/history` endpoint lacks these fields). All chart rendering is client-side via Recharts dynamic imports (`ssr: false`). No new Prisma migrations needed. The streak calendar uses the stats endpoint — NOT the existing `/api/nutrition/streak` route (which tracks current streak; this shows a 30-day activity grid).

**Tech Stack:** Recharts, existing Prisma MealLog model, Next.js App Router, Framer Motion, Tailwind CSS, Vitest

---

## Chunk 1: Types, Utilities & API

### Task 1: Extend types for History

**Files:**

- Modify: `apps/web/lib/nutrition/types.ts`

- [ ] **Step 1: Add history types**

Add to the bottom of `apps/web/lib/nutrition/types.ts`:

```typescript
export interface DailyEntry {
  date: string // YYYY-MM-DD
  calories: number
  protein: number
  carbs: number
  fat: number
}

export interface WeeklyStats {
  weekLabel: string // e.g. "14 Apr - 20 Apr"
  avgCalories: number
  avgProtein: number
  avgCarbs: number
  avgFat: number
  daysLogged: number
  goalHitDays: number
  badge: 'excellent' | 'good' | 'needs_work'
}

export interface MealTimingStats {
  breakfast: number // avg calories
  lunch: number
  dinner: number
  snack: number
}

export interface TopFood {
  name: string
  count: number
  avgCalories: number
}

export interface HistoryStats {
  daily: DailyEntry[]
  goal: { dailyCalories: number; proteinG: number; carbsG: number; fatG: number } | null
  goalHitPercent: number // 0-100
  topFoods: TopFood[]
  mealTiming: MealTimingStats
  streakCalendar: Record<string, boolean> // YYYY-MM-DD -> logged?
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/lib/nutrition/types.ts
git commit -m "feat(nutrition): add history types for Phase 2"
```

---

### Task 2: History stats utility (TDD)

**Files:**

- Create: `apps/web/lib/nutrition/history.ts`
- Create: `apps/web/lib/nutrition/__tests__/history.test.ts`

- [ ] **Step 1: Write failing tests**

Create `apps/web/lib/nutrition/__tests__/history.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import {
  computeWeeklyStats,
  computeGoalHitPercent,
  computeMealTiming,
  computeTopFoods,
  computeStreakCalendar,
  getBadge,
} from '../history'
import type { DailyEntry } from '../types'

const makeDaily = (overrides: Partial<DailyEntry>[] = []): DailyEntry[] =>
  overrides.map((o, i) => ({
    date: `2026-04-${String(i + 1).padStart(2, '0')}`,
    calories: 2000,
    protein: 150,
    carbs: 200,
    fat: 70,
    ...o,
  }))

describe('computeGoalHitPercent', () => {
  it('returns 100 when all days hit goal', () => {
    const daily = makeDaily([{}, {}, {}])
    expect(computeGoalHitPercent(daily, 2000)).toBe(100)
  })

  it('returns 0 when no days hit goal', () => {
    const daily = makeDaily([{ calories: 500 }, { calories: 600 }])
    expect(computeGoalHitPercent(daily, 2000)).toBe(0)
  })

  it('allows 10% tolerance above and below goal', () => {
    const daily = makeDaily([{ calories: 1900 }, { calories: 2100 }, { calories: 1000 }])
    expect(computeGoalHitPercent(daily, 2000)).toBeCloseTo(66.67, 1)
  })

  it('returns 0 for empty array', () => {
    expect(computeGoalHitPercent([], 2000)).toBe(0)
  })
})

describe('getBadge', () => {
  it('returns excellent when goalHitPercent >= 80', () => {
    expect(getBadge(80)).toBe('excellent')
    expect(getBadge(100)).toBe('excellent')
  })

  it('returns good when goalHitPercent >= 50', () => {
    expect(getBadge(50)).toBe('good')
    expect(getBadge(79)).toBe('good')
  })

  it('returns needs_work when goalHitPercent < 50', () => {
    expect(getBadge(0)).toBe('needs_work')
    expect(getBadge(49)).toBe('needs_work')
  })
})

describe('computeWeeklyStats', () => {
  it('groups entries into weeks of 7 days', () => {
    const daily = makeDaily(Array(14).fill({}))
    const weeks = computeWeeklyStats(daily, 2000)
    expect(weeks).toHaveLength(2)
  })

  it('computes correct average calories', () => {
    const daily = makeDaily([{ calories: 1000 }, { calories: 3000 }])
    const weeks = computeWeeklyStats(daily, 2000)
    expect(weeks[0].avgCalories).toBe(2000)
  })

  it('assigns badge based on goal hit percent', () => {
    const daily = makeDaily(Array(7).fill({ calories: 2000 }))
    const weeks = computeWeeklyStats(daily, 2000)
    expect(weeks[0].badge).toBe('excellent')
  })
})

describe('computeMealTiming', () => {
  it('sums calories by meal type', () => {
    const meals = [
      { mealType: 'breakfast', totalCalories: 400 },
      { mealType: 'lunch', totalCalories: 600 },
      { mealType: 'breakfast', totalCalories: 200 },
    ] as any[]
    const result = computeMealTiming(meals)
    expect(result.breakfast).toBe(300) // avg
    expect(result.lunch).toBe(600)
    expect(result.dinner).toBe(0)
    expect(result.snack).toBe(0)
  })
})

describe('computeTopFoods', () => {
  it('returns top 5 foods sorted by count', () => {
    const meals = [
      {
        items: [
          { name: 'Apple', calories: 80 },
          { name: 'Banana', calories: 100 },
        ],
      },
      { items: [{ name: 'Apple', calories: 80 }] },
    ] as any[]
    const result = computeTopFoods(meals)
    expect(result[0].name).toBe('Apple')
    expect(result[0].count).toBe(2)
    expect(result.length).toBeLessThanOrEqual(5)
  })
})

describe('computeStreakCalendar', () => {
  it('marks dates with logs as true', () => {
    const daily = makeDaily([{}, {}])
    const calendar = computeStreakCalendar(daily)
    expect(calendar['2026-04-01']).toBe(true)
    expect(calendar['2026-04-02']).toBe(true)
  })

  it('covers last 30 days only', () => {
    const daily = makeDaily([{}])
    const calendar = computeStreakCalendar(daily)
    expect(Object.keys(calendar).length).toBe(30)
  })
})
```

- [ ] **Step 2: Run tests — verify they fail**

```bash
cd apps/web && npx vitest run lib/nutrition/__tests__/history.test.ts
```

Expected: FAIL (history module not found)

- [ ] **Step 3: Implement history utility**

Create `apps/web/lib/nutrition/history.ts`:

```typescript
import type { DailyEntry, WeeklyStats, MealTimingStats, TopFood } from './types'

export function computeGoalHitPercent(daily: DailyEntry[], goalCalories: number): number {
  if (daily.length === 0) return 0
  const tolerance = goalCalories * 0.1
  const hits = daily.filter(
    (d) => d.calories >= goalCalories - tolerance && d.calories <= goalCalories + tolerance
  )
  return (hits.length / daily.length) * 100
}

export function getBadge(goalHitPercent: number): 'excellent' | 'good' | 'needs_work' {
  if (goalHitPercent >= 80) return 'excellent'
  if (goalHitPercent >= 50) return 'good'
  return 'needs_work'
}

export function computeWeeklyStats(daily: DailyEntry[], goalCalories: number): WeeklyStats[] {
  const weeks: WeeklyStats[] = []
  for (let i = 0; i < daily.length; i += 7) {
    const chunk = daily.slice(i, i + 7)
    const avg = (key: keyof DailyEntry) =>
      Math.round(chunk.reduce((s, d) => s + (d[key] as number), 0) / chunk.length)
    const goalHitPercent = computeGoalHitPercent(chunk, goalCalories)
    weeks.push({
      weekLabel: `${chunk[0].date} - ${chunk[chunk.length - 1].date}`,
      avgCalories: avg('calories'),
      avgProtein: avg('protein'),
      avgCarbs: avg('carbs'),
      avgFat: avg('fat'),
      daysLogged: chunk.length,
      goalHitDays: Math.round((goalHitPercent / 100) * chunk.length),
      badge: getBadge(goalHitPercent),
    })
  }
  return weeks
}

export function computeMealTiming(
  meals: Array<{ mealType: string; totalCalories: number }>
): MealTimingStats {
  const groups: Record<string, number[]> = { breakfast: [], lunch: [], dinner: [], snack: [] }
  for (const m of meals) {
    const key = ['breakfast', 'lunch', 'dinner', 'snack'].includes(m.mealType)
      ? m.mealType
      : 'snack'
    groups[key].push(m.totalCalories)
  }
  const avg = (arr: number[]) =>
    arr.length ? Math.round(arr.reduce((s, v) => s + v, 0) / arr.length) : 0
  return {
    breakfast: avg(groups.breakfast),
    lunch: avg(groups.lunch),
    dinner: avg(groups.dinner),
    snack: avg(groups.snack),
  }
}

export function computeTopFoods(
  meals: Array<{ items: Array<{ name: string; calories: number }> | null | undefined }>
): TopFood[] {
  const map = new Map<string, { count: number; totalCalories: number }>()
  for (const m of meals) {
    const items = Array.isArray(m.items) ? m.items : []
    for (const item of items) {
      if (!item?.name) continue
      const existing = map.get(item.name) ?? { count: 0, totalCalories: 0 }
      map.set(item.name, {
        count: existing.count + 1,
        totalCalories: existing.totalCalories + (item.calories ?? 0),
      })
    }
  }
  return Array.from(map.entries())
    .map(([name, { count, totalCalories }]) => ({
      name,
      count,
      avgCalories: Math.round(totalCalories / count),
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)
}

export function computeStreakCalendar(daily: DailyEntry[]): Record<string, boolean> {
  const loggedDates = new Set(daily.map((d) => d.date))
  const calendar: Record<string, boolean> = {}
  const today = new Date()
  for (let i = 29; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(today.getDate() - i)
    const key = d.toISOString().slice(0, 10)
    calendar[key] = loggedDates.has(key)
  }
  return calendar
}
```

- [ ] **Step 4: Run tests — verify they pass**

```bash
cd apps/web && npx vitest run lib/nutrition/__tests__/history.test.ts
```

Expected: All tests PASS

- [ ] **Step 5: Commit**

```bash
git add apps/web/lib/nutrition/history.ts apps/web/lib/nutrition/__tests__/history.test.ts
git commit -m "feat(nutrition): add history utility functions with tests"
```

---

### Task 3: History stats API endpoint

**Files:**

- Create: `apps/web/app/api/nutrition/history/stats/route.ts`

- [ ] **Step 1: Create stats route**

Create `apps/web/app/api/nutrition/history/stats/route.ts`:

```typescript
import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db/client'
import {
  computeGoalHitPercent,
  computeMealTiming,
  computeTopFoods,
  computeStreakCalendar,
} from '@/lib/nutrition/history'

export async function GET() {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const user = await db.user.findUnique({ where: { clerkId } })
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    // NOTE: Must select mealType and items (Json) — existing /api/nutrition/history lacks these
    const [meals, goal] = await Promise.all([
      db.mealLog.findMany({
        where: { userId: user.id, loggedAt: { gte: thirtyDaysAgo } },
        select: {
          loggedAt: true,
          totalCalories: true,
          totalProteinG: true,
          totalCarbsG: true,
          totalFatG: true,
          mealType: true,
          items: true, // Json field — cast as FoodItem[] below
        },
        orderBy: { loggedAt: 'asc' },
      }),
      db.nutritionGoal.findUnique({ where: { userId: user.id } }),
    ])

    // Build daily entries
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

    const goalCalories = goal?.dailyCalories ?? 2000
    const mealsForStats = meals.map((m) => ({
      mealType: m.mealType,
      totalCalories: m.totalCalories,
      items: (m.items as Array<{ name: string; calories: number }>) ?? [],
    }))

    return NextResponse.json({
      daily,
      goal,
      goalHitPercent: computeGoalHitPercent(daily, goalCalories),
      topFoods: computeTopFoods(mealsForStats),
      mealTiming: computeMealTiming(mealsForStats),
      streakCalendar: computeStreakCalendar(daily),
    })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/app/api/nutrition/history/stats/route.ts
git commit -m "feat(nutrition): add history stats API endpoint"
```

---

### Task 4: CSV Export endpoint

**Files:**

- Create: `apps/web/app/api/nutrition/history/export/route.ts`

- [ ] **Step 1: Create export route**

Create `apps/web/app/api/nutrition/history/export/route.ts`:

```typescript
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
        mealType: true,
        totalCalories: true,
        totalProteinG: true,
        totalCarbsG: true,
        totalFatG: true,
      },
      orderBy: { loggedAt: 'asc' },
    })

    const header = 'Date,MealType,Calories,ProteinG,CarbsG,FatG'
    const rows = meals.map(
      (m) =>
        `${m.loggedAt.toISOString().slice(0, 10)},${m.mealType},${m.totalCalories},${m.totalProteinG},${m.totalCarbsG},${m.totalFatG}`
    )
    const csv = [header, ...rows].join('\n')

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="nutrition-history.csv"',
      },
    })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/app/api/nutrition/history/export/route.ts
git commit -m "feat(nutrition): add CSV export endpoint"
```

---

## Chunk 2: useHistoryStats Hook

### Task 5: useHistoryStats hook (TDD)

**Files:**

- Create: `apps/web/app/(dashboard)/dashboard/nutrition/hooks/useHistoryStats.ts`
- Create: `apps/web/app/(dashboard)/dashboard/nutrition/hooks/__tests__/useHistoryStats.test.ts`

- [ ] **Step 1: Write failing test**

Create `apps/web/app/(dashboard)/dashboard/nutrition/hooks/__tests__/useHistoryStats.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useHistoryStats } from '../useHistoryStats'

const mockStats = {
  daily: [{ date: '2026-04-01', calories: 2000, protein: 150, carbs: 200, fat: 70 }],
  goal: { dailyCalories: 2000, proteinG: 150, carbsG: 200, fatG: 70 },
  goalHitPercent: 80,
  topFoods: [{ name: 'Apple', count: 3, avgCalories: 80 }],
  mealTiming: { breakfast: 400, lunch: 600, dinner: 800, snack: 200 },
  streakCalendar: { '2026-04-01': true },
}

beforeEach(() => {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockStats,
    })
  )
})

describe('useHistoryStats', () => {
  it('starts with loading true', () => {
    const { result } = renderHook(() => useHistoryStats())
    expect(result.current.loading).toBe(true)
  })

  it('fetches and returns stats', async () => {
    const { result } = renderHook(() => useHistoryStats())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.stats?.goalHitPercent).toBe(80)
    expect(result.current.stats?.topFoods[0].name).toBe('Apple')
  })

  it('sets error on fetch failure', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')))
    const { result } = renderHook(() => useHistoryStats())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.error).toBeTruthy()
  })
})
```

- [ ] **Step 2: Run tests — verify they fail**

```bash
cd apps/web && npx vitest run app/\\(dashboard\\)/dashboard/nutrition/hooks/__tests__/useHistoryStats.test.ts
```

Expected: FAIL

- [ ] **Step 3: Implement hook**

Create `apps/web/app/(dashboard)/dashboard/nutrition/hooks/useHistoryStats.ts`:

```typescript
'use client'

import { useState, useEffect } from 'react'
import type { HistoryStats } from '@/lib/nutrition/types'

// Explicit typed return shape for tests and consumers
interface UseHistoryStatsResult {
  stats: HistoryStats | null
  loading: boolean // true while fetch is in flight
  error: string | null // error message or null
  refetch: () => void
}

export function useHistoryStats(): UseHistoryStatsResult {
  const [stats, setStats] = useState<HistoryStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tick, setTick] = useState(0)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    fetch('/api/nutrition/history/stats')
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) {
          setStats(data)
          setLoading(false)
        }
      })
      .catch((e) => {
        if (!cancelled) {
          setError(e.message)
          setLoading(false)
        }
      })
    return () => {
      cancelled = true
    }
  }, [tick])

  return { stats, loading, error, refetch: () => setTick((t) => t + 1) }
}
```

- [ ] **Step 4: Run tests — verify they pass**

```bash
cd apps/web && npx vitest run app/\\(dashboard\\)/dashboard/nutrition/hooks/__tests__/useHistoryStats.test.ts
```

Expected: All PASS

- [ ] **Step 5: Commit**

```bash
git add apps/web/app/\(dashboard\)/dashboard/nutrition/hooks/useHistoryStats.ts apps/web/app/\(dashboard\)/dashboard/nutrition/hooks/__tests__/useHistoryStats.test.ts
git commit -m "feat(nutrition): add useHistoryStats hook with tests"
```

---

## Chunk 3: Chart Components

### Task 6: CalorieTrendChart

**Files:**

- Create: `apps/web/app/(dashboard)/dashboard/nutrition/components/history/CalorieTrendChart.tsx`

- [ ] **Step 1: Install recharts**

```bash
cd apps/web && pnpm add recharts
```

- [ ] **Step 2: Create component**

Create `apps/web/app/(dashboard)/dashboard/nutrition/components/history/CalorieTrendChart.tsx`:

```typescript
'use client'

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from 'recharts'
import type { DailyEntry } from '@/lib/nutrition/types'

interface Props {
  daily: DailyEntry[]
  goalCalories: number
}

export function CalorieTrendChart({ daily, goalCalories }: Props) {
  const data = daily.map((d) => ({
    date: d.date.slice(5), // MM-DD
    calories: d.calories,
  }))

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-4">
      <h3 className="mb-4 text-sm font-semibold text-white">Kalori Trendi (30 Gün)</h3>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis
            dataKey="date"
            tick={{ fill: '#64748B', fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            interval={6}
          />
          <YAxis
            tick={{ fill: '#64748B', fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            width={40}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1E293B',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: '8px',
              color: '#fff',
              fontSize: 12,
            }}
            formatter={(value: number) => [`${value} kcal`, 'Kalori']}
          />
          <ReferenceLine
            y={goalCalories}
            stroke="#6366F1"
            strokeDasharray="4 4"
            label={{ value: 'Hedef', fill: '#6366F1', fontSize: 11 }}
          />
          <Line
            type="monotone"
            dataKey="calories"
            stroke="#10B981"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: '#10B981' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add apps/web/app/\(dashboard\)/dashboard/nutrition/components/history/CalorieTrendChart.tsx
git commit -m "feat(nutrition): add CalorieTrendChart component"
```

---

### Task 7: MacroBarChart

**Files:**

- Create: `apps/web/app/(dashboard)/dashboard/nutrition/components/history/MacroBarChart.tsx`

- [ ] **Step 1: Create component**

Create `apps/web/app/(dashboard)/dashboard/nutrition/components/history/MacroBarChart.tsx`:

```typescript
'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import type { WeeklyStats } from '@/lib/nutrition/types'

interface Props {
  weeks: WeeklyStats[]
}

export function MacroBarChart({ weeks }: Props) {
  const data = weeks.map((w) => ({
    week: w.weekLabel.split(' - ')[0], // start date only
    Protein: w.avgProtein,
    Karbonhidrat: w.avgCarbs,
    Yağ: w.avgFat,
  }))

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-4">
      <h3 className="mb-4 text-sm font-semibold text-white">Haftalık Makro Ortalama</h3>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis dataKey="week" tick={{ fill: '#64748B', fontSize: 11 }} tickLine={false} axisLine={false} />
          <YAxis tick={{ fill: '#64748B', fontSize: 11 }} tickLine={false} axisLine={false} width={35} />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1E293B',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: '8px',
              color: '#fff',
              fontSize: 12,
            }}
            formatter={(value: number, name: string) => [`${value}g`, name]}
          />
          <Legend wrapperStyle={{ fontSize: 12, color: '#94A3B8' }} />
          <Bar dataKey="Protein" fill="#6366F1" radius={[4, 4, 0, 0]} />
          <Bar dataKey="Karbonhidrat" fill="#F59E0B" radius={[4, 4, 0, 0]} />
          <Bar dataKey="Yağ" fill="#EF4444" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/app/\(dashboard\)/dashboard/nutrition/components/history/MacroBarChart.tsx
git commit -m "feat(nutrition): add MacroBarChart component"
```

---

### Task 8: MealTimingChart (Pie)

**Files:**

- Create: `apps/web/app/(dashboard)/dashboard/nutrition/components/history/MealTimingChart.tsx`

- [ ] **Step 1: Create component**

Create `apps/web/app/(dashboard)/dashboard/nutrition/components/history/MealTimingChart.tsx`:

```typescript
'use client'

import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import type { MealTimingStats } from '@/lib/nutrition/types'

interface Props {
  timing: MealTimingStats
}

const COLORS = ['#6366F1', '#10B981', '#F59E0B', '#EC4899']
const LABELS = ['Kahvaltı', 'Öğle', 'Akşam', 'Atıştırma']

export function MealTimingChart({ timing }: Props) {
  const data = [
    { name: LABELS[0], value: timing.breakfast },
    { name: LABELS[1], value: timing.lunch },
    { name: LABELS[2], value: timing.dinner },
    { name: LABELS[3], value: timing.snack },
  ].filter((d) => d.value > 0)

  if (data.length === 0) {
    return (
      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-4">
        <h3 className="mb-4 text-sm font-semibold text-white">Öğün Zamanı Dağılımı</h3>
        <p className="py-8 text-center text-sm text-[#64748B]">Henüz veri yok</p>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-4">
      <h3 className="mb-4 text-sm font-semibold text-white">Öğün Zamanı Dağılımı</h3>
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie data={data} cx="50%" cy="50%" outerRadius={75} dataKey="value">
            {data.map((_, index) => (
              <Cell key={index} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: '#1E293B',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: '8px',
              color: '#fff',
              fontSize: 12,
            }}
            formatter={(value: number, name: string) => [`${value} kcal ort.`, name]}
          />
          <Legend wrapperStyle={{ fontSize: 12, color: '#94A3B8' }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/app/\(dashboard\)/dashboard/nutrition/components/history/MealTimingChart.tsx
git commit -m "feat(nutrition): add MealTimingChart pie component"
```

---

## Chunk 4: Stat Cards & Streak Calendar

### Task 9: WeeklySummaryCards

**Files:**

- Create: `apps/web/app/(dashboard)/dashboard/nutrition/components/history/WeeklySummaryCards.tsx`

- [ ] **Step 1: Create component**

Create `apps/web/app/(dashboard)/dashboard/nutrition/components/history/WeeklySummaryCards.tsx`:

```typescript
'use client'

import { Trophy, TrendingUp, Target } from 'lucide-react'
import type { WeeklyStats } from '@/lib/nutrition/types'

interface Props {
  weeks: WeeklyStats[]
  goalHitPercent: number
}

const BADGE_CONFIG = {
  excellent: { label: 'Mükemmel', color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
  good: { label: 'İyi', color: 'text-yellow-400', bg: 'bg-yellow-400/10' },
  needs_work: { label: 'Geliştirilmeli', color: 'text-red-400', bg: 'bg-red-400/10' },
}

export function WeeklySummaryCards({ weeks, goalHitPercent }: Props) {
  const latest = weeks[weeks.length - 1]
  const badge = latest ? BADGE_CONFIG[latest.badge] : null

  return (
    <div className="grid grid-cols-3 gap-3">
      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-4">
        <div className="mb-2 flex items-center gap-2">
          <Target size={14} className="text-[#6366F1]" />
          <span className="text-xs text-[#64748B]">Hedef Tutturma</span>
        </div>
        <p className="text-2xl font-bold text-white">{Math.round(goalHitPercent)}%</p>
        <p className="mt-1 text-xs text-[#64748B]">son 30 gün</p>
      </div>

      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-4">
        <div className="mb-2 flex items-center gap-2">
          <TrendingUp size={14} className="text-emerald-400" />
          <span className="text-xs text-[#64748B]">Bu Hafta Ort.</span>
        </div>
        <p className="text-2xl font-bold text-white">{latest?.avgCalories ?? '—'}</p>
        <p className="mt-1 text-xs text-[#64748B]">kcal/gün</p>
      </div>

      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-4">
        <div className="mb-2 flex items-center gap-2">
          <Trophy size={14} className="text-yellow-400" />
          <span className="text-xs text-[#64748B]">Performans</span>
        </div>
        {badge ? (
          <span className={`inline-block rounded-lg px-2 py-1 text-xs font-semibold ${badge.bg} ${badge.color}`}>
            {badge.label}
          </span>
        ) : (
          <p className="text-sm text-[#64748B]">—</p>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/app/\(dashboard\)/dashboard/nutrition/components/history/WeeklySummaryCards.tsx
git commit -m "feat(nutrition): add WeeklySummaryCards component"
```

---

### Task 10: StreakCalendar

**Files:**

- Create: `apps/web/app/(dashboard)/dashboard/nutrition/components/history/StreakCalendar.tsx`

- [ ] **Step 1: Create component**

Create `apps/web/app/(dashboard)/dashboard/nutrition/components/history/StreakCalendar.tsx`:

```typescript
'use client'

interface Props {
  calendar: Record<string, boolean> // YYYY-MM-DD -> logged
}

export function StreakCalendar({ calendar }: Props) {
  const entries = Object.entries(calendar).sort(([a], [b]) => a.localeCompare(b))

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-4">
      <h3 className="mb-4 text-sm font-semibold text-white">Son 30 Gün Aktivitesi</h3>
      <div className="flex flex-wrap gap-1.5">
        {entries.map(([date, logged]) => (
          <div
            key={date}
            title={date}
            className={`h-5 w-5 rounded-sm transition-colors ${
              logged
                ? 'bg-[#6366F1]'
                : 'bg-white/[0.06]'
            }`}
          />
        ))}
      </div>
      <div className="mt-3 flex items-center gap-3 text-xs text-[#64748B]">
        <div className="flex items-center gap-1">
          <div className="h-3 w-3 rounded-sm bg-[#6366F1]" />
          <span>Kayıt var</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="h-3 w-3 rounded-sm bg-white/[0.06]" />
          <span>Kayıt yok</span>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/app/\(dashboard\)/dashboard/nutrition/components/history/StreakCalendar.tsx
git commit -m "feat(nutrition): add StreakCalendar component"
```

---

### Task 11: TopFoodsList

**Files:**

- Create: `apps/web/app/(dashboard)/dashboard/nutrition/components/history/TopFoodsList.tsx`

- [ ] **Step 1: Create component**

Create `apps/web/app/(dashboard)/dashboard/nutrition/components/history/TopFoodsList.tsx`:

```typescript
'use client'

import type { TopFood } from '@/lib/nutrition/types'

interface Props {
  foods: TopFood[]
}

export function TopFoodsList({ foods }: Props) {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-4">
      <h3 className="mb-4 text-sm font-semibold text-white">En Çok Tüketilen (Top 5)</h3>
      {foods.length === 0 ? (
        <p className="py-4 text-center text-sm text-[#64748B]">Henüz veri yok</p>
      ) : (
        <ul className="space-y-2">
          {foods.map((food, i) => (
            <li key={food.name} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/[0.06] text-xs font-bold text-[#94A3B8]">
                  {i + 1}
                </span>
                <span className="text-sm text-white">{food.name}</span>
              </div>
              <div className="text-right">
                <p className="text-xs font-semibold text-[#6366F1]">{food.count}x</p>
                <p className="text-xs text-[#64748B]">{food.avgCalories} kcal ort.</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/app/\(dashboard\)/dashboard/nutrition/components/history/TopFoodsList.tsx
git commit -m "feat(nutrition): add TopFoodsList component"
```

---

## Chunk 5: HistoryTab Assembly

### Task 12: WeekSelector component

**Files:**

- Create: `apps/web/app/(dashboard)/dashboard/nutrition/components/history/WeekSelector.tsx`

- [ ] **Step 1: Create component**

Create `apps/web/app/(dashboard)/dashboard/nutrition/components/history/WeekSelector.tsx`:

```typescript
'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'

interface Props {
  selectedWeek: number // 0 = this week, 1 = last week, 2 = 2 weeks ago
  onChange: (week: number) => void
  maxWeeks?: number
}

const LABELS = ['Bu Hafta', 'Geçen Hafta', '2 Hafta Önce', '3 Hafta Önce']

export function WeekSelector({ selectedWeek, onChange, maxWeeks = 4 }: Props) {
  return (
    <div className="flex items-center gap-3">
      <button
        onClick={() => onChange(Math.min(selectedWeek + 1, maxWeeks - 1))}
        disabled={selectedWeek >= maxWeeks - 1}
        className="rounded-lg p-1.5 text-[#64748B] transition-colors hover:bg-white/[0.06] disabled:opacity-30"
      >
        <ChevronLeft size={16} />
      </button>
      <span className="min-w-[120px] text-center text-sm font-semibold text-white">
        {LABELS[selectedWeek] ?? `${selectedWeek + 1} Hafta Önce`}
      </span>
      <button
        onClick={() => onChange(Math.max(selectedWeek - 1, 0))}
        disabled={selectedWeek <= 0}
        className="rounded-lg p-1.5 text-[#64748B] transition-colors hover:bg-white/[0.06] disabled:opacity-30"
      >
        <ChevronRight size={16} />
      </button>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/app/\(dashboard\)/dashboard/nutrition/components/history/WeekSelector.tsx
git commit -m "feat(nutrition): add WeekSelector component"
```

---

### Task 13: Assemble HistoryTab

**Files:**

- Create: `apps/web/app/(dashboard)/dashboard/nutrition/components/tabs/HistoryTab.tsx`

- [ ] **Step 1: Create HistoryTab**

Create `apps/web/app/(dashboard)/dashboard/nutrition/components/tabs/HistoryTab.tsx`:

```typescript
'use client'

import { useState } from 'react'
import { Download, Loader2 } from 'lucide-react'
import { useHistoryStats } from '../hooks/useHistoryStats'
import { CalorieTrendChart } from '../history/CalorieTrendChart'
import { MacroBarChart } from '../history/MacroBarChart'
import { MealTimingChart } from '../history/MealTimingChart'
import { WeeklySummaryCards } from '../history/WeeklySummaryCards'
import { StreakCalendar } from '../history/StreakCalendar'
import { TopFoodsList } from '../history/TopFoodsList'
import { WeekSelector } from '../history/WeekSelector'
import { computeWeeklyStats } from '@/lib/nutrition/history'

export function HistoryTab() {
  const { stats, loading, error } = useHistoryStats()
  const [selectedWeek, setSelectedWeek] = useState(0)

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={24} className="animate-spin text-[#6366F1]" />
      </div>
    )
  }

  if (error || !stats) {
    return (
      <div className="py-20 text-center text-sm text-[#64748B]">
        Veriler yüklenemedi. Lütfen tekrar deneyin.
      </div>
    )
  }

  const goalCalories = stats.goal?.dailyCalories ?? 2000
  const weeks = computeWeeklyStats(stats.daily, goalCalories)

  // Filter daily entries to selected week
  const weekStart = selectedWeek * 7
  const weekDaily = stats.daily.slice(
    Math.max(stats.daily.length - 7 - weekStart, 0),
    Math.max(stats.daily.length - weekStart, 0)
  )

  const handleExport = () => {
    window.open('/api/nutrition/history/export', '_blank')
  }

  return (
    <div className="space-y-4">
      {/* Header row */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <WeekSelector
          selectedWeek={selectedWeek}
          onChange={setSelectedWeek}
          maxWeeks={Math.max(weeks.length, 1)}
        />
        <button
          onClick={handleExport}
          className="flex items-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.04] px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-white/[0.08]"
        >
          <Download size={14} /> CSV İndir
        </button>
      </div>

      {/* Summary cards */}
      <WeeklySummaryCards weeks={weeks} goalHitPercent={stats.goalHitPercent} />

      {/* Calorie trend */}
      <CalorieTrendChart daily={stats.daily} goalCalories={goalCalories} />

      {/* Macro bar chart */}
      {weeks.length > 0 && <MacroBarChart weeks={weeks} />}

      {/* Bottom grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <MealTimingChart timing={stats.mealTiming} />
        <TopFoodsList foods={stats.topFoods} />
      </div>

      {/* Streak calendar */}
      <StreakCalendar calendar={stats.streakCalendar} />
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/app/\(dashboard\)/dashboard/nutrition/components/tabs/HistoryTab.tsx
git commit -m "feat(nutrition): add HistoryTab assembly component"
```

---

### Task 14: Wire HistoryTab into page

**Files:**

- Modify: `apps/web/app/(dashboard)/dashboard/nutrition/page.tsx`

- [ ] **Step 1: Import and wire HistoryTab**

In `apps/web/app/(dashboard)/dashboard/nutrition/page.tsx`, replace the history placeholder.

Recharts uses browser APIs — use `dynamic()` with `ssr: false` to avoid SSR errors.

Find:

```typescript
import { TodayTab } from './components/tabs/TodayTab'
import { ExploreTab } from './components/tabs/ExploreTab'
```

Replace with:

```typescript
import dynamic from 'next/dynamic'
import { TodayTab } from './components/tabs/TodayTab'
import { ExploreTab } from './components/tabs/ExploreTab'

const HistoryTab = dynamic(
  () => import('./components/tabs/HistoryTab').then((m) => m.HistoryTab),
  { ssr: false, loading: () => <div className="py-20 text-center text-sm text-[#64748B]">Yükleniyor...</div> }
)
```

Then find:

```typescript
          {tab === 'history' && (
            <div className="py-20 text-center text-sm text-[#64748B]">
              Geçmiş — Phase 2&apos;de gelecek
            </div>
          )}
```

Replace with:

```typescript
          {tab === 'history' && <HistoryTab />}
```

- [ ] **Step 2: Verify build**

```bash
cd apps/web && npx tsc --noEmit
```

Expected: No TypeScript errors

- [ ] **Step 3: Commit**

```bash
git add apps/web/app/\(dashboard\)/dashboard/nutrition/page.tsx
git commit -m "feat(nutrition): wire HistoryTab into nutrition page"
```

---

### Task 15: Run all nutrition tests

- [ ] **Step 1: Run full test suite**

```bash
cd apps/web && npx vitest run lib/nutrition/ app/\\(dashboard\\)/dashboard/nutrition/
```

Expected: All tests PASS (14 from Phase 1 + new Phase 2 tests)

- [ ] **Step 2: Final commit**

```bash
git add -A
git commit -m "feat(nutrition): Phase 2 History tab complete — charts, analytics, streak calendar, CSV export"
```
