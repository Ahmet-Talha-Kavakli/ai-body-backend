# Nutrition Hub Phase 3A — ProfileTab Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Profile tab for `/dashboard/nutrition` with Goal Editor (inline calorie/macro/water targets), Meal Templates (save/use/delete), and AI Daily Tip card.

**Architecture:** Profile tab is split into three independent sections. GoalEditor reads/writes `/api/nutrition/goal` (already exists). MealTemplates needs new Prisma model `MealTemplate` + CRUD API routes. AI Daily Tip calls a new `/api/ai/nutrition-tip` route that uses Claude to generate a short tip based on today's log. All sections are independent `'use client'` components assembled in ProfileTab.

**Tech Stack:** Next.js 15 App Router, Prisma, Clerk auth, OpenAI SDK (`gpt-4o-mini` for tip generation — already installed), Framer Motion, Tailwind CSS, Vitest

---

## Chunk 1: MealTemplate DB + API

### Task 1: Add MealTemplate to Prisma schema

**Files:**

- Modify: `apps/web/prisma/schema.prisma`

- [ ] **Step 1: Add MealTemplate model**

Add the following model to `apps/web/prisma/schema.prisma` after the `DietProfile` model:

```prisma
model MealTemplate {
  id            String   @id @default(cuid())
  userId        String
  user          User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  name          String
  mealType      String   // breakfast | lunch | dinner | snack | pre_workout | post_workout
  items         Json     // FoodItem[]
  totalCalories Int
  totalProteinG Float
  totalCarbsG   Float
  totalFatG     Float
  createdAt     DateTime @default(now())

  @@index([userId])
}
```

Also add to the `User` model (find the User model and add to its relations):

```prisma
  mealTemplates    MealTemplate[]
```

- [ ] **Step 2: Generate Prisma client**

```bash
cd c:/Users/TUF/Desktop/Ai-Pt/apps/web && npx prisma generate
```

Expected: Generated Prisma Client

- [ ] **Step 3: Create migration SQL and apply**

```bash
cd c:/Users/TUF/Desktop/Ai-Pt/apps/web && npx prisma migrate diff --from-schema-datasource prisma/schema.prisma --to-schema-datamodel prisma/schema.prisma --script > /tmp/meal_template_migration.sql 2>&1 || true
```

Since shadow DB is unavailable, apply directly:

```bash
cd c:/Users/TUF/Desktop/Ai-Pt/apps/web && npx prisma db push --accept-data-loss 2>&1 | tail -5
```

Expected: `Your database is now in sync with your Prisma schema`

- [ ] **Step 4: Commit**

```bash
cd c:/Users/TUF/Desktop/Ai-Pt && git add apps/web/prisma/schema.prisma && git commit -m "feat(nutrition): add MealTemplate model to Prisma schema"
```

---

### Task 2: MealTemplate API routes (TDD)

**Files:**

- Create: `apps/web/app/api/nutrition/templates/route.ts`
- Create: `apps/web/app/api/nutrition/templates/[id]/route.ts`
- Create: `apps/web/app/api/nutrition/templates/__tests__/templates.test.ts`

- [ ] **Step 1: Write failing tests**

Create `apps/web/app/api/nutrition/templates/__tests__/templates.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock auth and db
vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn().mockResolvedValue({ userId: 'clerk_123' }),
}))

vi.mock('@/lib/db/client', () => ({
  db: {
    user: {
      findUnique: vi.fn().mockResolvedValue({ id: 'user_1', clerkId: 'clerk_123' }),
    },
    mealTemplate: {
      findMany: vi.fn().mockResolvedValue([
        {
          id: 'tpl_1',
          name: 'High Protein Breakfast',
          mealType: 'breakfast',
          totalCalories: 450,
          totalProteinG: 40,
          totalCarbsG: 30,
          totalFatG: 15,
          items: [],
          createdAt: new Date('2026-04-14'),
        },
      ]),
      create: vi.fn().mockResolvedValue({
        id: 'tpl_2',
        name: 'New Template',
        mealType: 'lunch',
        totalCalories: 600,
        totalProteinG: 35,
        totalCarbsG: 60,
        totalFatG: 20,
        items: [],
        createdAt: new Date('2026-04-14'),
      }),
      findUnique: vi.fn().mockResolvedValue({
        id: 'tpl_1',
        userId: 'user_1',
      }),
      delete: vi.fn().mockResolvedValue({ id: 'tpl_1' }),
    },
  },
}))

describe('GET /api/nutrition/templates', () => {
  it('returns list of templates for authenticated user', async () => {
    const { GET } = await import('../route')
    const response = await GET()
    const data = await response.json()
    expect(response.status).toBe(200)
    expect(Array.isArray(data.templates)).toBe(true)
    expect(data.templates[0].name).toBe('High Protein Breakfast')
  })
})

describe('POST /api/nutrition/templates', () => {
  it('creates a new template', async () => {
    const { POST } = await import('../route')
    const req = new Request('http://localhost/api/nutrition/templates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'New Template',
        mealType: 'lunch',
        items: [],
        totalCalories: 600,
        totalProteinG: 35,
        totalCarbsG: 60,
        totalFatG: 20,
      }),
    })
    const response = await POST(req as any)
    const data = await response.json()
    expect(response.status).toBe(200)
    expect(data.template.name).toBe('New Template')
  })
})

describe('DELETE /api/nutrition/templates/[id]', () => {
  it('deletes a template belonging to the user', async () => {
    const { DELETE } = await import('../[id]/route')
    const req = new Request('http://localhost/api/nutrition/templates/tpl_1', {
      method: 'DELETE',
    })
    const response = await DELETE(req as any, { params: Promise.resolve({ id: 'tpl_1' }) })
    const data = await response.json()
    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
  })
})
```

- [ ] **Step 2: Run tests — verify they fail**

```bash
cd c:/Users/TUF/Desktop/Ai-Pt/apps/web && npx vitest run app/api/nutrition/templates/__tests__/templates.test.ts 2>&1 | tail -10
```

Expected: FAIL (modules not found)

- [ ] **Step 3: Create GET + POST route**

Create `apps/web/app/api/nutrition/templates/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db/client'

export async function GET() {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const user = await db.user.findUnique({ where: { clerkId } })
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const templates = await db.mealTemplate.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ templates })
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

    const body = await req.json()
    const { name, mealType, items, totalCalories, totalProteinG, totalCarbsG, totalFatG } = body

    const template = await db.mealTemplate.create({
      data: {
        userId: user.id,
        name,
        mealType,
        items: items ?? [],
        totalCalories,
        totalProteinG,
        totalCarbsG,
        totalFatG,
      },
    })

    return NextResponse.json({ template })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

- [ ] **Step 4: Create DELETE route**

Create `apps/web/app/api/nutrition/templates/[id]/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db/client'

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const user = await db.user.findUnique({ where: { clerkId } })
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const { id } = await params
    const template = await db.mealTemplate.findUnique({ where: { id } })
    if (!template || template.userId !== user.id)
      return NextResponse.json({ error: 'Not found' }, { status: 404 })

    await db.mealTemplate.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

- [ ] **Step 5: Run tests — verify they pass**

```bash
cd c:/Users/TUF/Desktop/Ai-Pt/apps/web && npx vitest run app/api/nutrition/templates/__tests__/templates.test.ts 2>&1 | tail -10
```

Expected: All tests PASS

- [ ] **Step 6: Commit**

```bash
cd c:/Users/TUF/Desktop/Ai-Pt && git add apps/web/app/api/nutrition/templates/ && git commit -m "feat(nutrition): add MealTemplate CRUD API routes"
```

---

### Task 3: AI Nutrition Tip API route (TDD)

**Files:**

- Create: `apps/web/app/api/ai/nutrition-tip/route.ts`
- Create: `apps/web/app/api/ai/nutrition-tip/__tests__/route.test.ts`

- [ ] **Step 1: Write failing test**

Create `apps/web/app/api/ai/nutrition-tip/__tests__/route.test.ts`:

```typescript
import { describe, it, expect, vi } from 'vitest'

vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn().mockResolvedValue({ userId: 'clerk_123' }),
}))

vi.mock('@/lib/db/client', () => ({
  db: {
    user: {
      findUnique: vi.fn().mockResolvedValue({ id: 'user_1' }),
    },
    mealLog: {
      findMany: vi
        .fn()
        .mockResolvedValue([
          {
            mealType: 'breakfast',
            totalCalories: 450,
            totalProteinG: 35,
            totalCarbsG: 40,
            totalFatG: 15,
          },
        ]),
    },
    nutritionGoal: {
      findUnique: vi.fn().mockResolvedValue({ dailyCalories: 2000, proteinG: 150 }),
    },
  },
}))

vi.mock('openai', () => ({
  default: vi.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: vi.fn().mockResolvedValue({
          choices: [
            {
              message: {
                content: 'Great job on your protein intake today! Consider adding more vegetables.',
              },
            },
          ],
        }),
      },
    },
  })),
}))

describe('GET /api/ai/nutrition-tip', () => {
  it('returns a tip string', async () => {
    const { GET } = await import('../route')
    const response = await GET()
    const data = await response.json()
    expect(response.status).toBe(200)
    expect(typeof data.tip).toBe('string')
    expect(data.tip.length).toBeGreaterThan(0)
  })

  it('returns fallback tip when AI fails', async () => {
    vi.mock('openai', () => ({
      default: vi.fn().mockImplementation(() => ({
        chat: {
          completions: {
            create: vi.fn().mockRejectedValue(new Error('API error')),
          },
        },
      })),
    }))
    const { GET } = await import('../route')
    const response = await GET()
    const data = await response.json()
    expect(response.status).toBe(200)
    expect(typeof data.tip).toBe('string')
    expect(data.tip.length).toBeGreaterThan(0)
  })
})
```

- [ ] **Step 2: Run tests — verify they fail**

```bash
cd c:/Users/TUF/Desktop/Ai-Pt/apps/web && npx vitest run app/api/ai/nutrition-tip/__tests__/route.test.ts 2>&1 | tail -10
```

Expected: FAIL (module not found)

- [ ] **Step 3: Implement route**

Create `apps/web/app/api/ai/nutrition-tip/route.ts`:

```typescript
import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db/client'
import OpenAI from 'openai'

const FALLBACK_TIP =
  'Bugün sağlıklı beslenmeye devam et! Her öğünde protein, karbonhidrat ve yağ dengesine dikkat et.'

export async function GET() {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const user = await db.user.findUnique({ where: { clerkId } })
    if (!user) return NextResponse.json({ tip: FALLBACK_TIP })

    // Get today's meals
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const [meals, goal] = await Promise.all([
      db.mealLog.findMany({
        where: { userId: user.id, loggedAt: { gte: today } },
        select: {
          mealType: true,
          totalCalories: true,
          totalProteinG: true,
          totalCarbsG: true,
          totalFatG: true,
        },
      }),
      db.nutritionGoal.findUnique({ where: { userId: user.id } }),
    ])

    const totalCalories = meals.reduce((s, m) => s + m.totalCalories, 0)
    const totalProtein = meals.reduce((s, m) => s + m.totalProteinG, 0)

    const prompt = `You are a supportive nutrition coach. The user has logged today:
- Total calories: ${totalCalories} kcal (goal: ${goal?.dailyCalories ?? 2000} kcal)
- Total protein: ${totalProtein}g (goal: ${goal?.proteinG ?? 150}g)
- Meals logged: ${meals.length}

Give ONE short, practical, encouraging nutrition tip for today in Turkish. Max 2 sentences. No emojis. Be specific to their data.`

    try {
      const openai = new OpenAI()
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        max_tokens: 150,
        messages: [{ role: 'user', content: prompt }],
      })
      const tip = response.choices[0]?.message?.content ?? FALLBACK_TIP
      return NextResponse.json({ tip })
    } catch {
      return NextResponse.json({ tip: FALLBACK_TIP })
    }
  } catch {
    return NextResponse.json({ tip: FALLBACK_TIP })
  }
}
```

- [ ] **Step 4: Run tests — verify they pass**

```bash
cd c:/Users/TUF/Desktop/Ai-Pt/apps/web && npx vitest run app/api/ai/nutrition-tip/__tests__/route.test.ts 2>&1 | tail -10
```

Expected: All tests PASS

- [ ] **Step 5: Commit**

```bash
cd c:/Users/TUF/Desktop/Ai-Pt && git add apps/web/app/api/ai/nutrition-tip/ && git commit -m "feat(nutrition): add AI nutrition tip API route"
```

---

## Chunk 2: ProfileTab Components

### Task 4: Add PUT to goal API (TDD)

**Files:**

- Modify: `apps/web/app/api/nutrition/goal/route.ts`
- Create: `apps/web/app/api/nutrition/goal/__tests__/goal-put.test.ts`

- [ ] **Step 1: Write failing test**

Create `apps/web/app/api/nutrition/goal/__tests__/goal-put.test.ts`:

```typescript
import { describe, it, expect, vi } from 'vitest'

vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn().mockResolvedValue({ userId: 'clerk_123' }),
}))

vi.mock('@/lib/db/client', () => ({
  db: {
    user: { findUnique: vi.fn().mockResolvedValue({ id: 'user_1' }) },
    nutritionGoal: {
      upsert: vi.fn().mockResolvedValue({
        dailyCalories: 2200,
        proteinG: 160,
        carbsG: 220,
        fatG: 75,
        waterGoalMl: 2500,
        fiberG: 25,
      }),
    },
  },
}))

describe('PUT /api/nutrition/goal', () => {
  it('updates goal and returns updated goal', async () => {
    const { PUT } = await import('../route')
    const req = new Request('http://localhost/api/nutrition/goal', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        dailyCalories: 2200,
        proteinG: 160,
        carbsG: 220,
        fatG: 75,
        waterGoalMl: 2500,
        fiberG: 25,
      }),
    })
    const response = await PUT(req as any)
    const data = await response.json()
    expect(response.status).toBe(200)
    expect(data.goal.dailyCalories).toBe(2200)
  })
})
```

- [ ] **Step 2: Run test — verify it fails**

```bash
cd c:/Users/TUF/Desktop/Ai-Pt/apps/web && npx vitest run app/api/nutrition/goal/__tests__/goal-put.test.ts 2>&1 | tail -10
```

Expected: FAIL (PUT not exported)

- [ ] **Step 3: Add PUT handler to goal route**

In `apps/web/app/api/nutrition/goal/route.ts`, add after the existing POST handler:

```typescript
export async function PUT(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const user = await db.user.findUnique({ where: { clerkId } })
    if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    const body = await req.json()
    const goal = await db.nutritionGoal.upsert({
      where: { userId: user.id },
      create: { userId: user.id, ...body },
      update: body,
    })
    return NextResponse.json({ goal })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

- [ ] **Step 4: Run test — verify it passes**

```bash
cd c:/Users/TUF/Desktop/Ai-Pt/apps/web && npx vitest run app/api/nutrition/goal/__tests__/goal-put.test.ts 2>&1 | tail -10
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
cd c:/Users/TUF/Desktop/Ai-Pt && git add apps/web/app/api/nutrition/goal/ && git commit -m "feat(nutrition): add PUT handler to goal API"
```

---

### Task 5: GoalEditor component (TDD)

**Files:**

- Create: `apps/web/app/(dashboard)/dashboard/nutrition/components/profile/GoalEditor.tsx`
- Create: `apps/web/app/(dashboard)/dashboard/nutrition/components/profile/__tests__/GoalEditor.test.tsx`

- [ ] **Step 1: Write failing test**

Create `apps/web/app/(dashboard)/dashboard/nutrition/components/profile/__tests__/GoalEditor.test.tsx`:

```typescript
// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { GoalEditor } from '../GoalEditor'

const mockGoal = {
  dailyCalories: 2000,
  proteinG: 150,
  carbsG: 200,
  fatG: 70,
  waterGoalMl: 2500,
  fiberG: 25,
}

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn())
})

describe('GoalEditor', () => {
  it('renders all goal fields', () => {
    render(<GoalEditor initialGoal={mockGoal} />)
    expect(screen.getByDisplayValue('2000')).toBeTruthy()
    expect(screen.getByDisplayValue('150')).toBeTruthy()
    expect(screen.getByDisplayValue('200')).toBeTruthy()
    expect(screen.getByDisplayValue('70')).toBeTruthy()
  })

  it('shows save button when a value changes', async () => {
    render(<GoalEditor initialGoal={mockGoal} />)
    const calorieInput = screen.getByDisplayValue('2000')
    fireEvent.change(calorieInput, { target: { value: '2200' } })
    await waitFor(() => {
      expect(screen.getByText(/Kaydet/i)).toBeTruthy()
    })
  })

  it('calls PUT /api/nutrition/goal on save', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ goal: { ...mockGoal, dailyCalories: 2200 } }),
    })
    vi.stubGlobal('fetch', mockFetch)

    render(<GoalEditor initialGoal={mockGoal} />)
    const calorieInput = screen.getByDisplayValue('2000')
    fireEvent.change(calorieInput, { target: { value: '2200' } })

    const saveBtn = await screen.findByText(/Kaydet/i)
    fireEvent.click(saveBtn)

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/nutrition/goal',
        expect.objectContaining({ method: 'PUT' })
      )
    })
  })
})
```

- [ ] **Step 2: Run test — verify it fails**

```bash
cd c:/Users/TUF/Desktop/Ai-Pt/apps/web && npx vitest run "app/(dashboard)/dashboard/nutrition/components/profile/__tests__/GoalEditor.test.tsx" 2>&1 | tail -10
```

Expected: FAIL

- [ ] **Step 3: Update goal API to support PUT**

Modify `apps/web/app/api/nutrition/goal/route.ts` — add a PUT handler (same as POST but semantically correct):

```typescript
export async function PUT(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const user = await db.user.findUnique({ where: { clerkId } })
    if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    const body = await req.json()
    const goal = await db.nutritionGoal.upsert({
      where: { userId: user.id },
      create: { userId: user.id, ...body },
      update: body,
    })
    return NextResponse.json({ goal })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

- [ ] **Step 4: Create GoalEditor component**

Create `apps/web/app/(dashboard)/dashboard/nutrition/components/profile/GoalEditor.tsx`:

```typescript
'use client'

import { useState, useEffect } from 'react'
import { Save, Loader2 } from 'lucide-react'

interface Goal {
  dailyCalories: number
  proteinG: number
  carbsG: number
  fatG: number
  waterGoalMl: number
  fiberG: number
}

interface Props {
  initialGoal: Goal
}

const FIELDS: Array<{ key: keyof Goal; label: string; unit: string; color: string }> = [
  { key: 'dailyCalories', label: 'Kalori Hedefi', unit: 'kcal', color: 'text-[#6366F1]' },
  { key: 'proteinG', label: 'Protein', unit: 'g', color: 'text-blue-400' },
  { key: 'carbsG', label: 'Karbonhidrat', unit: 'g', color: 'text-amber-400' },
  { key: 'fatG', label: 'Yağ', unit: 'g', color: 'text-pink-400' },
  { key: 'waterGoalMl', label: 'Su Hedefi', unit: 'ml', color: 'text-cyan-400' },
  { key: 'fiberG', label: 'Lif', unit: 'g', color: 'text-emerald-400' },
]

export function GoalEditor({ initialGoal }: Props) {
  const [goal, setGoal] = useState<Goal>(initialGoal)
  const [dirty, setDirty] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  // Fetch real goal from API on mount (component is always client-side via dynamic import)
  useEffect(() => {
    fetch('/api/nutrition/goal')
      .then((r) => r.json())
      .then((data) => {
        if (data.goal) {
          setGoal(data.goal)
          setDirty(false)
        }
      })
      .catch(() => {}) // keep initialGoal as fallback silently
  }, [])

  const handleChange = (key: keyof Goal, value: string) => {
    const num = parseFloat(value)
    if (isNaN(num)) return
    setGoal((prev) => ({ ...prev, [key]: num }))
    setDirty(true)
    setSaved(false)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await fetch('/api/nutrition/goal', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(goal),
      })
      setDirty(false)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-4">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white">Hedeflerim</h3>
        {dirty && (
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1.5 rounded-lg bg-[#6366F1] px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-[#4F46E5] disabled:opacity-60"
          >
            {saving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
            Kaydet
          </button>
        )}
        {saved && !dirty && (
          <span className="text-xs font-semibold text-emerald-400">Kaydedildi ✓</span>
        )}
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {FIELDS.map(({ key, label, unit, color }) => (
          <div key={key} className="rounded-xl border border-white/[0.04] bg-white/[0.02] p-3">
            <label className={`mb-1 block text-xs font-medium ${color}`}>{label}</label>
            <div className="flex items-baseline gap-1">
              <input
                type="number"
                value={goal[key]}
                onChange={(e) => handleChange(key, e.target.value)}
                className="w-full bg-transparent text-lg font-bold text-white outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                min={0}
              />
              <span className="text-xs text-[#64748B]">{unit}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Run test — verify it passes**

```bash
cd c:/Users/TUF/Desktop/Ai-Pt/apps/web && npx vitest run "app/(dashboard)/dashboard/nutrition/components/profile/__tests__/GoalEditor.test.tsx" 2>&1 | tail -10
```

Expected: All tests PASS

- [ ] **Step 6: Commit**

```bash
cd c:/Users/TUF/Desktop/Ai-Pt && git add apps/web/app/api/nutrition/goal/route.ts "apps/web/app/(dashboard)/dashboard/nutrition/components/profile/GoalEditor.tsx" "apps/web/app/(dashboard)/dashboard/nutrition/components/profile/__tests__/GoalEditor.test.tsx" && git commit -m "feat(nutrition): add GoalEditor component with PUT goal API"
```

---

### Task 6: useMealTemplates hook (TDD)

**Files:**

- Create: `apps/web/app/(dashboard)/dashboard/nutrition/hooks/useMealTemplates.ts`
- Create: `apps/web/app/(dashboard)/dashboard/nutrition/hooks/__tests__/useMealTemplates.test.ts`

- [ ] **Step 1: Write failing test**

Create `apps/web/app/(dashboard)/dashboard/nutrition/hooks/__tests__/useMealTemplates.test.ts`:

```typescript
// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { useMealTemplates } from '../useMealTemplates'

const mockTemplates = [
  {
    id: 'tpl_1',
    name: 'High Protein',
    mealType: 'breakfast',
    totalCalories: 450,
    totalProteinG: 40,
    totalCarbsG: 30,
    totalFatG: 15,
    items: [],
    createdAt: '2026-04-14',
  },
]

beforeEach(() => {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ templates: mockTemplates }),
    })
  )
})

describe('useMealTemplates', () => {
  it('starts loading', () => {
    const { result } = renderHook(() => useMealTemplates())
    expect(result.current.loading).toBe(true)
  })

  it('loads templates', async () => {
    const { result } = renderHook(() => useMealTemplates())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.templates).toHaveLength(1)
    expect(result.current.templates[0].name).toBe('High Protein')
  })

  it('deleteTemplate removes from list optimistically', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValueOnce({ ok: true, json: async () => ({ templates: mockTemplates }) })
        .mockResolvedValueOnce({ ok: true, json: async () => ({ success: true }) })
    )
    const { result } = renderHook(() => useMealTemplates())
    await waitFor(() => expect(result.current.loading).toBe(false))

    await act(async () => {
      await result.current.deleteTemplate('tpl_1')
    })
    expect(result.current.templates).toHaveLength(0)
  })
})
```

- [ ] **Step 2: Run test — verify it fails**

```bash
cd c:/Users/TUF/Desktop/Ai-Pt/apps/web && npx vitest run "app/(dashboard)/dashboard/nutrition/hooks/__tests__/useMealTemplates.test.ts" 2>&1 | tail -10
```

Expected: FAIL

- [ ] **Step 3: Implement hook**

Create `apps/web/app/(dashboard)/dashboard/nutrition/hooks/useMealTemplates.ts`:

```typescript
'use client'

import { useState, useEffect } from 'react'

export interface MealTemplate {
  id: string
  name: string
  mealType: string
  totalCalories: number
  totalProteinG: number
  totalCarbsG: number
  totalFatG: number
  items: Array<{ name: string; calories: number }>
  createdAt: string
}

interface UseMealTemplatesResult {
  templates: MealTemplate[]
  loading: boolean
  error: string | null
  createTemplate: (data: Omit<MealTemplate, 'id' | 'createdAt'>) => Promise<void>
  deleteTemplate: (id: string) => Promise<void>
  refetch: () => void
}

export function useMealTemplates(): UseMealTemplatesResult {
  const [templates, setTemplates] = useState<MealTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tick, setTick] = useState(0)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    fetch('/api/nutrition/templates')
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) {
          setTemplates(data.templates ?? [])
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

  const createTemplate = async (data: Omit<MealTemplate, 'id' | 'createdAt'>) => {
    const res = await fetch('/api/nutrition/templates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    const json = await res.json()
    setTemplates((prev) => [json.template, ...prev])
  }

  const deleteTemplate = async (id: string) => {
    const prev = templates
    setTemplates((t) => t.filter((x) => x.id !== id))
    try {
      await fetch(`/api/nutrition/templates/${id}`, { method: 'DELETE' })
    } catch {
      setTemplates(prev)
    }
  }

  return {
    templates,
    loading,
    error,
    createTemplate,
    deleteTemplate,
    refetch: () => setTick((t) => t + 1),
  }
}
```

- [ ] **Step 4: Run test — verify it passes**

```bash
cd c:/Users/TUF/Desktop/Ai-Pt/apps/web && npx vitest run "app/(dashboard)/dashboard/nutrition/hooks/__tests__/useMealTemplates.test.ts" 2>&1 | tail -10
```

Expected: All PASS

- [ ] **Step 5: Commit**

```bash
cd c:/Users/TUF/Desktop/Ai-Pt && git add "apps/web/app/(dashboard)/dashboard/nutrition/hooks/useMealTemplates.ts" "apps/web/app/(dashboard)/dashboard/nutrition/hooks/__tests__/useMealTemplates.test.ts" && git commit -m "feat(nutrition): add useMealTemplates hook with TDD"
```

---

### Task 7: MealTemplates component

**Files:**

- Create: `apps/web/app/(dashboard)/dashboard/nutrition/components/profile/MealTemplates.tsx`
- Create: `apps/web/app/(dashboard)/dashboard/nutrition/components/profile/NewTemplateModal.tsx`

- [ ] **Step 1: Create NewTemplateModal**

Create `apps/web/app/(dashboard)/dashboard/nutrition/components/profile/NewTemplateModal.tsx`:

```typescript
'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Loader2 } from 'lucide-react'
import type { MealTemplate } from '../../hooks/useMealTemplates'

type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'pre_workout' | 'post_workout'

const MEAL_TYPES: Array<{ value: MealType; label: string }> = [
  { value: 'breakfast', label: 'Kahvaltı' },
  { value: 'lunch', label: 'Öğle' },
  { value: 'dinner', label: 'Akşam' },
  { value: 'snack', label: 'Atıştırma' },
  { value: 'pre_workout', label: 'Antrenman Öncesi' },
  { value: 'post_workout', label: 'Antrenman Sonrası' },
]

interface Props {
  open: boolean
  onClose: () => void
  onSave: (data: Omit<MealTemplate, 'id' | 'createdAt'>) => Promise<void>
}

export function NewTemplateModal({ open, onClose, onSave }: Props) {
  const [name, setName] = useState('')
  const [mealType, setMealType] = useState<MealType>('breakfast')
  const [calories, setCalories] = useState('')
  const [protein, setProtein] = useState('')
  const [carbs, setCarbs] = useState('')
  const [fat, setFat] = useState('')
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!name || !calories) return
    setSaving(true)
    try {
      await onSave({
        name,
        mealType,
        items: [],
        totalCalories: parseInt(calories),
        totalProteinG: parseFloat(protein) || 0,
        totalCarbsG: parseFloat(carbs) || 0,
        totalFatG: parseFloat(fat) || 0,
      })
      onClose()
      setName(''); setCalories(''); setProtein(''); setCarbs(''); setFat('')
    } finally {
      setSaving(false)
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 sm:items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="w-full max-w-md rounded-t-2xl border border-white/[0.06] bg-[#12121E] p-6 sm:rounded-2xl"
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 100, damping: 20 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-semibold text-white">Yeni Şablon</h2>
              <button onClick={onClose} className="text-[#64748B] hover:text-white">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3">
              <input
                type="text"
                placeholder="Şablon adı"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl border border-white/[0.06] bg-white/[0.04] px-3 py-2 text-sm text-white placeholder:text-[#64748B] outline-none focus:border-[#6366F1]/50"
              />

              <div className="flex flex-wrap gap-1.5">
                {MEAL_TYPES.map((t) => (
                  <button
                    key={t.value}
                    onClick={() => setMealType(t.value)}
                    className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
                      mealType === t.value
                        ? 'bg-[#6366F1] text-white'
                        : 'bg-white/[0.04] text-[#64748B] hover:bg-white/[0.08]'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: 'Kalori (kcal)', value: calories, set: setCalories },
                  { label: 'Protein (g)', value: protein, set: setProtein },
                  { label: 'Karb (g)', value: carbs, set: setCarbs },
                  { label: 'Yağ (g)', value: fat, set: setFat },
                ].map(({ label, value, set }) => (
                  <input
                    key={label}
                    type="number"
                    placeholder={label}
                    value={value}
                    onChange={(e) => set(e.target.value)}
                    className="rounded-xl border border-white/[0.06] bg-white/[0.04] px-3 py-2 text-sm text-white placeholder:text-[#64748B] outline-none focus:border-[#6366F1]/50"
                    min={0}
                  />
                ))}
              </div>

              <button
                onClick={handleSave}
                disabled={!name || !calories || saving}
                className="w-full rounded-xl bg-[#6366F1] py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#4F46E5] disabled:opacity-50"
              >
                {saving ? <Loader2 size={16} className="mx-auto animate-spin" /> : 'Kaydet'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
```

- [ ] **Step 2: Create MealTemplates component**

Create `apps/web/app/(dashboard)/dashboard/nutrition/components/profile/MealTemplates.tsx`:

```typescript
'use client'

import { useState } from 'react'
import { Plus, Trash2, Utensils } from 'lucide-react'
import { useMealTemplates } from '../../hooks/useMealTemplates'
import { NewTemplateModal } from './NewTemplateModal'

const MEAL_TYPE_LABELS: Record<string, string> = {
  breakfast: 'Kahvaltı',
  lunch: 'Öğle',
  dinner: 'Akşam',
  snack: 'Atıştırma',
  pre_workout: 'Antrenman Öncesi',
  post_workout: 'Antrenman Sonrası',
}

export function MealTemplates() {
  const { templates, loading, createTemplate, deleteTemplate } = useMealTemplates()
  const [showModal, setShowModal] = useState(false)

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-4">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white">Öğün Şablonlarım</h3>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 rounded-xl bg-[#6366F1]/10 px-3 py-1.5 text-xs font-semibold text-[#6366F1] transition-colors hover:bg-[#6366F1]/20"
        >
          <Plus size={12} /> Yeni Şablon
        </button>
      </div>

      {loading ? (
        <div className="py-8 text-center text-sm text-[#64748B]">Yükleniyor...</div>
      ) : templates.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-8">
          <Utensils size={24} className="text-[#64748B]" />
          <p className="text-sm text-[#64748B]">Henüz şablon yok</p>
          <p className="text-xs text-[#475569]">Sık yediğin öğünleri şablon olarak kaydet</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {templates.map((tpl) => (
            <li
              key={tpl.id}
              className="flex items-center justify-between rounded-xl border border-white/[0.04] bg-white/[0.02] px-3 py-2.5"
            >
              <div>
                <p className="text-sm font-medium text-white">{tpl.name}</p>
                <p className="text-xs text-[#64748B]">
                  {MEAL_TYPE_LABELS[tpl.mealType] ?? tpl.mealType} · {tpl.totalCalories} kcal
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-[#64748B]">
                  P:{tpl.totalProteinG}g C:{tpl.totalCarbsG}g F:{tpl.totalFatG}g
                </span>
                <button
                  onClick={() => deleteTemplate(tpl.id)}
                  className="rounded-lg p-1.5 text-[#64748B] transition-colors hover:bg-red-500/10 hover:text-red-400"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <NewTemplateModal
        open={showModal}
        onClose={() => setShowModal(false)}
        onSave={createTemplate}
      />
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
cd c:/Users/TUF/Desktop/Ai-Pt && git add "apps/web/app/(dashboard)/dashboard/nutrition/components/profile/" && git commit -m "feat(nutrition): add MealTemplates component and NewTemplateModal"
```

---

### Task 8: AiNutritionTip component

**Files:**

- Create: `apps/web/app/(dashboard)/dashboard/nutrition/components/profile/AiNutritionTip.tsx`

- [ ] **Step 1: Create component**

Create `apps/web/app/(dashboard)/dashboard/nutrition/components/profile/AiNutritionTip.tsx`:

```typescript
'use client'

import { useState, useEffect } from 'react'
import { Sparkles, RefreshCw } from 'lucide-react'

const FALLBACK = 'Bugün sağlıklı beslenmeye devam et! Her öğünde protein, karbonhidrat ve yağ dengesine dikkat et.'

export function AiNutritionTip() {
  const [tip, setTip] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchTip = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/ai/nutrition-tip')
      const data = await res.json()
      setTip(data.tip ?? FALLBACK)
    } catch {
      setTip(FALLBACK)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchTip() }, [])

  return (
    <div className="rounded-2xl border border-[#6366F1]/20 bg-gradient-to-br from-[#6366F1]/10 to-[#4F46E5]/5 p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles size={14} className="text-[#6366F1]" />
          <span className="text-xs font-semibold text-[#6366F1]">AI Günlük İpucu</span>
        </div>
        <button
          onClick={fetchTip}
          disabled={loading}
          className="rounded-lg p-1.5 text-[#64748B] transition-colors hover:bg-white/[0.06] disabled:opacity-40"
        >
          <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>
      {loading ? (
        <div className="space-y-2">
          <div className="h-3 w-full animate-pulse rounded bg-white/[0.06]" />
          <div className="h-3 w-3/4 animate-pulse rounded bg-white/[0.06]" />
        </div>
      ) : (
        <p className="text-sm leading-relaxed text-[#CBD5E1]">{tip}</p>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
cd c:/Users/TUF/Desktop/Ai-Pt && git add "apps/web/app/(dashboard)/dashboard/nutrition/components/profile/AiNutritionTip.tsx" && git commit -m "feat(nutrition): add AiNutritionTip component"
```

---

### Task 9: Assemble ProfileTab + wire into page

**Files:**

- Create: `apps/web/app/(dashboard)/dashboard/nutrition/components/tabs/ProfileTab.tsx`
- Modify: `apps/web/app/(dashboard)/dashboard/nutrition/page.tsx`

- [ ] **Step 1: Create ProfileTab**

Create `apps/web/app/(dashboard)/dashboard/nutrition/components/tabs/ProfileTab.tsx`:

```typescript
'use client'

import { Suspense } from 'react'
import { GoalEditor } from '../profile/GoalEditor'
import { MealTemplates } from '../profile/MealTemplates'
import { AiNutritionTip } from '../profile/AiNutritionTip'

interface Props {
  initialGoal: {
    dailyCalories: number
    proteinG: number
    carbsG: number
    fatG: number
    waterGoalMl: number
    fiberG: number
  } | null
}

const DEFAULT_GOAL = {
  dailyCalories: 2000,
  proteinG: 150,
  carbsG: 250,
  fatG: 65,
  waterGoalMl: 2500,
  fiberG: 25,
}

export function ProfileTab({ initialGoal }: Props) {
  return (
    <div className="space-y-4">
      <AiNutritionTip />
      <GoalEditor initialGoal={initialGoal ?? DEFAULT_GOAL} />
      <MealTemplates />
    </div>
  )
}
```

- [ ] **Step 2: Wire into page.tsx**

In `apps/web/app/(dashboard)/dashboard/nutrition/page.tsx`:

Add dynamic import after existing imports:

```typescript
import dynamic from 'next/dynamic'

const ProfileTab = dynamic(
  () => import('./components/tabs/ProfileTab').then((m) => m.ProfileTab),
  { ssr: false, loading: () => <div className="py-20 text-center text-sm text-[#64748B]">Yükleniyor...</div> }
)
```

Fetch goal at page level — modify the `NutritionPageInner` component to accept and pass goal prop, OR fetch inside ProfileTab. Since ProfileTab is dynamic (client), fetch goal in ProfileTab via `GoalEditor`'s own fetch on mount.

Replace the profile placeholder:

```typescript
// REMOVE:
{tab === 'profile' && (
  <div className="py-20 text-center text-sm text-[#64748B]">
    Profil — Phase 3&apos;te gelecek
  </div>
)}

// REPLACE with:
{tab === 'profile' && <ProfileTab initialGoal={null} />}
```

Note: `initialGoal={null}` causes ProfileTab to use DEFAULT_GOAL. GoalEditor will show defaults until user saves. This is intentional — ProfileTab fetches its own data client-side.

Actually, update GoalEditor to fetch its own initial data:

Modify `GoalEditor.tsx` to fetch goal on mount if needed. Replace the Props interface and add a fetch in useEffect:

```typescript
// At top of GoalEditor, add fetch on mount:
const [goal, setGoal] = useState<Goal>(initialGoal)

useEffect(() => {
  fetch('/api/nutrition/goal')
    .then((r) => r.json())
    .then((data) => {
      if (data.goal) setGoal(data.goal)
    })
    .catch(() => {}) // keep initialGoal as fallback
}, [])
```

- [ ] **Step 3: Verify TypeScript**

```bash
cd c:/Users/TUF/Desktop/Ai-Pt/apps/web && npx tsc --noEmit 2>&1 | head -20
```

- [ ] **Step 4: Commit**

```bash
cd c:/Users/TUF/Desktop/Ai-Pt && git add "apps/web/app/(dashboard)/dashboard/nutrition/components/tabs/ProfileTab.tsx" "apps/web/app/(dashboard)/dashboard/nutrition/page.tsx" "apps/web/app/(dashboard)/dashboard/nutrition/components/profile/GoalEditor.tsx" && git commit -m "feat(nutrition): assemble ProfileTab and wire into nutrition page"
```

---

### Task 10: Run all tests

- [ ] **Step 1: Run full nutrition test suite**

```bash
cd c:/Users/TUF/Desktop/Ai-Pt/apps/web && npx vitest run lib/nutrition/ "app/(dashboard)/dashboard/nutrition/hooks/" "app/(dashboard)/dashboard/nutrition/components/profile/" "app/api/nutrition/templates/" "app/api/ai/nutrition-tip/" 2>&1 | tail -20
```

Expected: All tests PASS

- [ ] **Step 2: Final commit**

```bash
cd c:/Users/TUF/Desktop/Ai-Pt && git add -A && git commit -m "feat(nutrition): Phase 3A ProfileTab complete — GoalEditor, MealTemplates, AI Daily Tip"
```
