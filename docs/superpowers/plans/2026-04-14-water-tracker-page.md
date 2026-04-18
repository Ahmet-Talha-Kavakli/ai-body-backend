# Water Tracker Page Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `/dashboard/water` sayfası — su dalgası animasyonu, bardak/ml ekleme, haftalık/aylık geçmiş, streak sistemi ve başarımlar ile tam özellikli su takip sayfası.

**Architecture:** `WaterLog` Prisma modeli zaten mevcut (glasses + amountMl). `WaterSettings` modeli eklenerek kullanıcı tercihleri (günlük hedef ml, bardak boyutu) saklanır. `WaterStreak` modeli streak takibi için eklenir. API routes mevcut `/api/nutrition/water` üzerine genişletilir (history, settings, streak, achievements). Frontend: Next.js 15, Framer Motion su dalgası animasyonu, Recharts haftalık/aylık grafik.

**Tech Stack:** Next.js 15, Prisma, Framer Motion, Recharts, Tailwind CSS, Vitest, Clerk auth

---

## Chunk 1: Backend — DB + API

### Task 1: WaterSettings + WaterStreak Prisma modelleri

**Files:**

- Modify: `apps/web/prisma/schema.prisma`

- [ ] **Step 1: User modeline ilişkiler ekle**

`apps/web/prisma/schema.prisma` dosyasında `User` modelinde `waterLogs WaterLog[]` satırından sonra ekle:

```prisma
  waterSettings    WaterSettings?
  waterStreak      WaterStreak?
```

- [ ] **Step 2: WaterSettings modelini ekle**

`WaterLog` modelinden sonra ekle:

```prisma
model WaterSettings {
  id            String   @id @default(cuid())
  userId        String   @unique
  user          User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  dailyGoalMl   Float    @default(2500)
  cupSizeMl     Float    @default(200)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  @@index([userId])
}
```

- [ ] **Step 3: WaterStreak modelini ekle**

`WaterSettings` modelinden sonra ekle:

```prisma
model WaterStreak {
  id            String   @id @default(cuid())
  userId        String   @unique
  user          User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  currentStreak Int      @default(0)
  longestStreak Int      @default(0)
  lastGoalDate  DateTime?
  totalDaysGoal Int      @default(0)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  @@index([userId])
}
```

- [ ] **Step 4: Prisma generate + db push**

```bash
cd c:/Users/TUF/Desktop/Ai-Pt/apps/web && npx prisma generate && npx prisma db push --accept-data-loss 2>&1 | tail -5
```

Expected: `Your database is now in sync with your Prisma schema`

- [ ] **Step 5: Commit**

```bash
cd c:/Users/TUF/Desktop/Ai-Pt && git add apps/web/prisma/schema.prisma && git commit -m "feat(water): add WaterSettings and WaterStreak Prisma models"
```

---

### Task 2: Water API — history, settings, streak endpoints (TDD)

**Files:**

- Modify: `apps/web/app/api/nutrition/water/route.ts`
- Create: `apps/web/app/api/nutrition/water/history/route.ts`
- Create: `apps/web/app/api/nutrition/water/settings/route.ts`
- Create: `apps/web/app/api/nutrition/water/streak/route.ts`
- Create: `apps/web/app/api/nutrition/water/__tests__/water-api.test.ts`

- [ ] **Step 1: Failing test yaz**

Create `apps/web/app/api/nutrition/water/__tests__/water-api.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn().mockResolvedValue({ userId: 'clerk_123' }),
}))

const mockUser = { id: 'user_1' }
const mockSettings = { dailyGoalMl: 2500, cupSizeMl: 200 }
const mockStreak = { currentStreak: 3, longestStreak: 7, totalDaysGoal: 10 }
const mockLog = { id: 'log_1', glasses: 4, amountMl: 800, date: new Date() }

vi.mock('@/lib/db/client', () => ({
  db: {
    user: { findUnique: vi.fn().mockResolvedValue(mockUser) },
    waterLog: {
      upsert: vi.fn().mockResolvedValue(mockLog),
      findUnique: vi.fn().mockResolvedValue(mockLog),
      findMany: vi.fn().mockResolvedValue([mockLog]),
    },
    waterSettings: {
      upsert: vi.fn().mockResolvedValue(mockSettings),
      findUnique: vi.fn().mockResolvedValue(mockSettings),
    },
    waterStreak: {
      upsert: vi.fn().mockResolvedValue(mockStreak),
      findUnique: vi.fn().mockResolvedValue(mockStreak),
    },
  },
}))

describe('GET /api/nutrition/water/history', () => {
  it('returns weekly history', async () => {
    const { GET } = await import('../history/route')
    const req = new Request('http://localhost/api/nutrition/water/history?period=week')
    const response = await GET(req as any)
    const data = await response.json()
    expect(response.status).toBe(200)
    expect(Array.isArray(data.history)).toBe(true)
  })

  it('returns monthly history', async () => {
    const { GET } = await import('../history/route')
    const req = new Request('http://localhost/api/nutrition/water/history?period=month')
    const response = await GET(req as any)
    const data = await response.json()
    expect(response.status).toBe(200)
    expect(Array.isArray(data.history)).toBe(true)
  })
})

describe('GET /api/nutrition/water/settings', () => {
  it('returns user water settings', async () => {
    const { GET } = await import('../settings/route')
    const response = await GET()
    const data = await response.json()
    expect(response.status).toBe(200)
    expect(typeof data.settings.dailyGoalMl).toBe('number')
    expect(typeof data.settings.cupSizeMl).toBe('number')
  })
})

describe('PUT /api/nutrition/water/settings', () => {
  it('updates water settings', async () => {
    const { PUT } = await import('../settings/route')
    const req = new Request('http://localhost/api/nutrition/water/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dailyGoalMl: 3000, cupSizeMl: 250 }),
    })
    const response = await PUT(req as any)
    const data = await response.json()
    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
  })
})

describe('GET /api/nutrition/water/streak', () => {
  it('returns streak data', async () => {
    const { GET } = await import('../streak/route')
    const response = await GET()
    const data = await response.json()
    expect(response.status).toBe(200)
    expect(typeof data.streak.currentStreak).toBe('number')
    expect(typeof data.streak.longestStreak).toBe('number')
  })
})
```

- [ ] **Step 2: Test'i çalıştır — FAIL beklenir**

```bash
cd c:/Users/TUF/Desktop/Ai-Pt/apps/web && npx vitest run "app/api/nutrition/water/__tests__/water-api.test.ts" 2>&1 | tail -10
```

- [ ] **Step 3: History route oluştur**

Create `apps/web/app/api/nutrition/water/history/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db/client'

export async function GET(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const user = await db.user.findUnique({ where: { clerkId } })
    if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const period = req.nextUrl.searchParams.get('period') ?? 'week'
    const now = new Date()
    const from = new Date()
    if (period === 'month') {
      from.setDate(now.getDate() - 30)
    } else {
      from.setDate(now.getDate() - 6)
    }
    from.setHours(0, 0, 0, 0)

    const logs = await db.waterLog.findMany({
      where: { userId: user.id, date: { gte: from } },
      orderBy: { date: 'asc' },
    })

    const settings = await db.waterSettings.findUnique({ where: { userId: user.id } })
    const dailyGoalMl = settings?.dailyGoalMl ?? 2500

    const history = logs.map((log) => ({
      date: log.date.toISOString().split('T')[0],
      amountMl: log.amountMl,
      glasses: log.glasses,
      goalMet: log.amountMl >= dailyGoalMl,
    }))

    return NextResponse.json({ history, dailyGoalMl })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

- [ ] **Step 4: Settings route oluştur**

Create `apps/web/app/api/nutrition/water/settings/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db/client'

export async function GET() {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const user = await db.user.findUnique({ where: { clerkId } })
    if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const settings = await db.waterSettings.findUnique({ where: { userId: user.id } })
    return NextResponse.json({
      settings: settings ?? { dailyGoalMl: 2500, cupSizeMl: 200 },
    })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const user = await db.user.findUnique({ where: { clerkId } })
    if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const { dailyGoalMl, cupSizeMl } = await req.json()
    await db.waterSettings.upsert({
      where: { userId: user.id },
      create: { userId: user.id, dailyGoalMl, cupSizeMl },
      update: { dailyGoalMl, cupSizeMl },
    })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

- [ ] **Step 5: Streak route oluştur**

Create `apps/web/app/api/nutrition/water/streak/route.ts`:

```typescript
import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db/client'

export async function GET() {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const user = await db.user.findUnique({ where: { clerkId } })
    if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const streak = await db.waterStreak.findUnique({ where: { userId: user.id } })
    return NextResponse.json({
      streak: streak ?? {
        currentStreak: 0,
        longestStreak: 0,
        totalDaysGoal: 0,
        lastGoalDate: null,
      },
    })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

- [ ] **Step 6: Mevcut POST route'unu güncelle — streak hesapla**

`apps/web/app/api/nutrition/water/route.ts` dosyasını tamamen şununla değiştir:

```typescript
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
    const settings = await db.waterSettings.findUnique({ where: { userId: user.id } })

    return NextResponse.json({
      glasses: log?.glasses ?? 0,
      amountMl: log?.amountMl ?? 0,
      dailyGoalMl: settings?.dailyGoalMl ?? 2500,
      cupSizeMl: settings?.cupSizeMl ?? 200,
    })
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
    const settings = await db.waterSettings.findUnique({ where: { userId: user.id } })
    const cupSizeMl = settings?.cupSizeMl ?? 200
    const dailyGoalMl = settings?.dailyGoalMl ?? 2500

    // ml veya bardak sayısı gelebilir
    let addMl: number
    if (body.ml !== undefined) {
      addMl = body.ml
    } else {
      addMl = (body.glasses ?? 1) * cupSizeMl
    }

    const today = todayDate()
    const existing = await db.waterLog.findUnique({
      where: { userId_date: { userId: user.id, date: today } },
    })

    const newAmountMl = Math.max(0, (existing?.amountMl ?? 0) + addMl)
    const newGlasses = Math.round(newAmountMl / cupSizeMl)

    const log = await db.waterLog.upsert({
      where: { userId_date: { userId: user.id, date: today } },
      create: { userId: user.id, date: today, glasses: newGlasses, amountMl: newAmountMl },
      update: { glasses: newGlasses, amountMl: newAmountMl },
    })

    // Streak güncelle
    if (newAmountMl >= dailyGoalMl) {
      const streak = await db.waterStreak.findUnique({ where: { userId: user.id } })
      const lastGoal = streak?.lastGoalDate
      const yesterday = new Date(today)
      yesterday.setDate(yesterday.getDate() - 1)
      const isConsecutive = lastGoal && lastGoal.toDateString() === yesterday.toDateString()
      const newCurrent = isConsecutive ? (streak?.currentStreak ?? 0) + 1 : 1
      const newLongest = Math.max(newCurrent, streak?.longestStreak ?? 0)
      const newTotal =
        (streak?.totalDaysGoal ?? 0) + (lastGoal?.toDateString() !== today.toDateString() ? 1 : 0)

      await db.waterStreak.upsert({
        where: { userId: user.id },
        create: {
          userId: user.id,
          currentStreak: newCurrent,
          longestStreak: newLongest,
          lastGoalDate: today,
          totalDaysGoal: 1,
        },
        update: {
          currentStreak: newCurrent,
          longestStreak: newLongest,
          lastGoalDate: today,
          totalDaysGoal: newTotal,
        },
      })
    }

    return NextResponse.json({ success: true, glasses: log.glasses, amountMl: log.amountMl })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const user = await db.user.findUnique({ where: { clerkId } })
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const body = await req.json()
    const settings = await db.waterSettings.findUnique({ where: { userId: user.id } })
    const cupSizeMl = settings?.cupSizeMl ?? 200
    const removeMl = body.ml ?? cupSizeMl

    const today = todayDate()
    const existing = await db.waterLog.findUnique({
      where: { userId_date: { userId: user.id, date: today } },
    })

    const newAmountMl = Math.max(0, (existing?.amountMl ?? 0) - removeMl)
    const newGlasses = Math.round(newAmountMl / cupSizeMl)

    const log = await db.waterLog.upsert({
      where: { userId_date: { userId: user.id, date: today } },
      create: { userId: user.id, date: today, glasses: newGlasses, amountMl: newAmountMl },
      update: { glasses: newGlasses, amountMl: newAmountMl },
    })

    return NextResponse.json({ success: true, glasses: log.glasses, amountMl: log.amountMl })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

- [ ] **Step 7: Test'i çalıştır — PASS beklenir**

```bash
cd c:/Users/TUF/Desktop/Ai-Pt/apps/web && npx vitest run "app/api/nutrition/water/__tests__/water-api.test.ts" 2>&1 | tail -15
```

Expected: 4 tests PASS

- [ ] **Step 8: Commit**

```bash
cd c:/Users/TUF/Desktop/Ai-Pt && git add apps/web/app/api/nutrition/water/ && git commit -m "feat(water): add history, settings, streak API routes with TDD"
```

---

## Chunk 2: Frontend — Animasyon + Sayfa

### Task 3: WaterWave animasyon componenti (TDD)

**Files:**

- Create: `apps/web/components/water/WaterWave.tsx`
- Create: `apps/web/components/water/__tests__/WaterWave.test.tsx`

- [ ] **Step 1: Failing test yaz**

Create `apps/web/components/water/__tests__/WaterWave.test.tsx`:

```typescript
// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { WaterWave } from '../WaterWave'

describe('WaterWave', () => {
  it('renders without crashing', () => {
    const { container } = render(<WaterWave percentage={50} amountMl={1250} goalMl={2500} />)
    expect(container.firstChild).toBeTruthy()
  })

  it('shows correct amount text', () => {
    const { getByText } = render(<WaterWave percentage={50} amountMl={1250} goalMl={2500} />)
    expect(getByText('1250 ml')).toBeTruthy()
  })

  it('shows 0% fill when empty', () => {
    const { container } = render(<WaterWave percentage={0} amountMl={0} goalMl={2500} />)
    expect(container.firstChild).toBeTruthy()
  })

  it('shows 100% fill when goal met', () => {
    const { container } = render(<WaterWave percentage={100} amountMl={2500} goalMl={2500} />)
    expect(container.firstChild).toBeTruthy()
  })
})
```

- [ ] **Step 2: Test'i çalıştır — FAIL beklenir**

```bash
cd c:/Users/TUF/Desktop/Ai-Pt/apps/web && npx vitest run "components/water/__tests__/WaterWave.test.tsx" 2>&1 | tail -10
```

- [ ] **Step 3: WaterWave componenti oluştur**

Create `apps/web/components/water/WaterWave.tsx`:

```typescript
'use client'

import { motion, useAnimationFrame } from 'framer-motion'
import { useRef, useState } from 'react'

interface WaterWaveProps {
  percentage: number
  amountMl: number
  goalMl: number
}

function generateWavePath(offset: number, amplitude: number, width: number, height: number, fillY: number): string {
  const points: string[] = []
  const segments = 20
  for (let i = 0; i <= segments; i++) {
    const x = (i / segments) * width
    const y = fillY + Math.sin(((i / segments) * Math.PI * 2) + offset) * amplitude
    points.push(`${i === 0 ? 'M' : 'L'} ${x} ${y}`)
  }
  points.push(`L ${width} ${height} L 0 ${height} Z`)
  return points.join(' ')
}

export function WaterWave({ percentage, amountMl, goalMl }: WaterWaveProps) {
  const [wave1, setWave1] = useState(0)
  const [wave2, setWave2] = useState(Math.PI)
  const clampedPct = Math.min(100, Math.max(0, percentage))
  const width = 300
  const height = 300
  const fillY = height - (clampedPct / 100) * height
  const amplitude = clampedPct > 0 && clampedPct < 100 ? 8 : 2
  const goalMet = clampedPct >= 100

  useAnimationFrame((t) => {
    setWave1(t * 0.001)
    setWave2(t * 0.0015 + Math.PI)
  })

  const path1 = generateWavePath(wave1, amplitude, width, height, fillY)
  const path2 = generateWavePath(wave2, amplitude * 0.7, width, height, fillY + 4)

  return (
    <div className="relative flex flex-col items-center">
      {/* Daire kapsayıcı */}
      <div className="relative w-64 h-64 rounded-full overflow-hidden border-4 border-white/10 shadow-2xl">
        {/* Arka plan */}
        <div className="absolute inset-0 bg-[#0A0A1A]" />

        {/* SVG dalga */}
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="absolute inset-0 w-full h-full"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="waveGrad1" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={goalMet ? '#10B981' : '#3B82F6'} stopOpacity="0.9" />
              <stop offset="100%" stopColor={goalMet ? '#059669' : '#1D4ED8'} stopOpacity="1" />
            </linearGradient>
            <linearGradient id="waveGrad2" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={goalMet ? '#34D399' : '#60A5FA'} stopOpacity="0.5" />
              <stop offset="100%" stopColor={goalMet ? '#10B981' : '#3B82F6'} stopOpacity="0.7" />
            </linearGradient>
          </defs>
          <path d={path1} fill="url(#waveGrad1)" />
          <path d={path2} fill="url(#waveGrad2)" />
        </svg>

        {/* Merkez metin */}
        <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
          <motion.p
            key={amountMl}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-3xl font-black text-white drop-shadow-lg"
          >
            {amountMl} ml
          </motion.p>
          <p className="text-sm text-white/70 mt-1">/ {goalMl} ml</p>
          <motion.p
            key={clampedPct}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={`text-lg font-bold mt-1 ${goalMet ? 'text-emerald-400' : 'text-blue-300'}`}
          >
            {Math.round(clampedPct)}%
          </motion.p>
          {goalMet && (
            <motion.p
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="text-xs text-emerald-400 mt-1 font-semibold"
            >
              🎉 Hedefe ulaştın!
            </motion.p>
          )}
        </div>
      </div>

      {/* Alt bilgi */}
      <p className="mt-3 text-xs text-[#64748B]">
        Kalan: {Math.max(0, goalMl - amountMl)} ml
      </p>
    </div>
  )
}
```

- [ ] **Step 4: Test'i çalıştır — PASS beklenir**

```bash
cd c:/Users/TUF/Desktop/Ai-Pt/apps/web && npx vitest run "components/water/__tests__/WaterWave.test.tsx" 2>&1 | tail -10
```

- [ ] **Step 5: Commit**

```bash
cd c:/Users/TUF/Desktop/Ai-Pt && git add apps/web/components/water/ && git commit -m "feat(water): add animated WaterWave component"
```

---

### Task 4: WaterActions + WaterSettings UI componentleri

**Files:**

- Create: `apps/web/components/water/WaterActions.tsx`
- Create: `apps/web/components/water/WaterSettingsPanel.tsx`

- [ ] **Step 1: WaterActions oluştur**

Create `apps/web/components/water/WaterActions.tsx`:

```typescript
'use client'

import { motion } from 'framer-motion'
import { Plus, Minus } from 'lucide-react'

interface WaterActionsProps {
  cupSizeMl: number
  onAdd: (ml: number) => void
  onRemove: (ml: number) => void
}

const PRESETS = [
  { label: '1 Bardak', getMl: (cup: number) => cup },
  { label: '500 ml', getMl: () => 500 },
  { label: '1 L', getMl: () => 1000 },
]

export function WaterActions({ cupSizeMl, onAdd, onRemove }: WaterActionsProps) {
  return (
    <div className="space-y-3 w-full">
      {/* Hızlı ekleme presetleri */}
      <div className="grid grid-cols-3 gap-2">
        {PRESETS.map((preset) => {
          const ml = preset.getMl(cupSizeMl)
          return (
            <motion.button
              key={preset.label}
              whileTap={{ scale: 0.95 }}
              onClick={() => onAdd(ml)}
              className="flex flex-col items-center gap-1 rounded-2xl bg-[#3B82F6]/10 border border-[#3B82F6]/20 py-3 px-2 transition-colors hover:bg-[#3B82F6]/20"
            >
              <Plus size={16} className="text-[#3B82F6]" />
              <span className="text-xs font-semibold text-white">{preset.label}</span>
              <span className="text-[10px] text-[#64748B]">{ml} ml</span>
            </motion.button>
          )
        })}
      </div>

      {/* Manuel ml giriş */}
      <ManualInput onAdd={onAdd} onRemove={onRemove} />
    </div>
  )
}

function ManualInput({ onAdd, onRemove }: { onAdd: (ml: number) => void; onRemove: (ml: number) => void }) {
  return (
    <div className="flex items-center gap-2 rounded-2xl bg-white/[0.03] border border-white/[0.06] p-3">
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={() => onRemove(100)}
        className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
      >
        <Minus size={16} />
      </motion.button>
      <div className="flex-1 text-center">
        <p className="text-xs text-[#64748B]">100 ml ekle / çıkar</p>
      </div>
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={() => onAdd(100)}
        className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#3B82F6]/10 text-[#3B82F6] hover:bg-[#3B82F6]/20 transition-colors"
      >
        <Plus size={16} />
      </motion.button>
    </div>
  )
}
```

- [ ] **Step 2: WaterSettingsPanel oluştur**

Create `apps/web/components/water/WaterSettingsPanel.tsx`:

```typescript
'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Settings, X, Loader2 } from 'lucide-react'

interface WaterSettingsPanelProps {
  dailyGoalMl: number
  cupSizeMl: number
  onSave: (dailyGoalMl: number, cupSizeMl: number) => Promise<void>
}

export function WaterSettingsPanel({ dailyGoalMl, cupSizeMl, onSave }: WaterSettingsPanelProps) {
  const [open, setOpen] = useState(false)
  const [goal, setGoal] = useState(dailyGoalMl)
  const [cup, setCup] = useState(cupSizeMl)
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    await onSave(goal, cup)
    setSaving(false)
    setOpen(false)
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 rounded-xl bg-white/[0.04] px-3 py-2 text-xs text-[#64748B] transition-colors hover:bg-white/[0.08]"
      >
        <Settings size={13} /> Ayarlar
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => setOpen(false)}
          >
            <motion.div
              initial={{ y: 60, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 60, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm rounded-3xl bg-[#111118] border border-white/[0.08] p-6 space-y-5"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-white">Su Takip Ayarları</h3>
                <button onClick={() => setOpen(false)} className="text-[#64748B] hover:text-white">
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs text-[#64748B] mb-2 block">Günlük Hedef (ml)</label>
                  <div className="flex items-center gap-2">
                    {[1500, 2000, 2500, 3000, 3500].map((v) => (
                      <button
                        key={v}
                        onClick={() => setGoal(v)}
                        className={`flex-1 rounded-xl py-2 text-xs font-semibold transition-colors ${
                          goal === v
                            ? 'bg-[#3B82F6] text-white'
                            : 'bg-white/[0.04] text-[#64748B] hover:bg-white/[0.08]'
                        }`}
                      >
                        {v < 1000 ? v : `${v / 1000}L`}
                      </button>
                    ))}
                  </div>
                  <input
                    type="number"
                    value={goal}
                    onChange={(e) => setGoal(Number(e.target.value))}
                    className="mt-2 w-full rounded-xl bg-white/[0.04] border border-white/[0.08] px-3 py-2 text-sm text-white outline-none focus:border-[#3B82F6]/50"
                  />
                </div>

                <div>
                  <label className="text-xs text-[#64748B] mb-2 block">Bardak Boyutu (ml)</label>
                  <div className="flex items-center gap-2">
                    {[150, 200, 250, 300, 400].map((v) => (
                      <button
                        key={v}
                        onClick={() => setCup(v)}
                        className={`flex-1 rounded-xl py-2 text-xs font-semibold transition-colors ${
                          cup === v
                            ? 'bg-[#3B82F6] text-white'
                            : 'bg-white/[0.04] text-[#64748B] hover:bg-white/[0.08]'
                        }`}
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <button
                onClick={handleSave}
                disabled={saving}
                className="w-full rounded-2xl bg-[#3B82F6] py-3 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {saving && <Loader2 size={14} className="animate-spin" />}
                Kaydet
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
```

- [ ] **Step 3: Commit**

```bash
cd c:/Users/TUF/Desktop/Ai-Pt && git add apps/web/components/water/ && git commit -m "feat(water): add WaterActions and WaterSettingsPanel components"
```

---

### Task 5: WaterHistory grafik componenti

**Files:**

- Create: `apps/web/components/water/WaterHistory.tsx`

- [ ] **Step 1: Recharts kurulu mu kontrol et**

```bash
cd c:/Users/TUF/Desktop/Ai-Pt/apps/web && node -e "require('recharts'); console.log('OK')" 2>&1
```

Eğer hata gelirse: `pnpm --filter=web add recharts`

- [ ] **Step 2: WaterHistory oluştur**

Create `apps/web/components/water/WaterHistory.tsx`:

```typescript
'use client'

import { useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, ReferenceLine,
} from 'recharts'
import { motion } from 'framer-motion'

interface DayData {
  date: string
  amountMl: number
  goalMet: boolean
}

interface WaterHistoryProps {
  history: DayData[]
  dailyGoalMl: number
  period: 'week' | 'month'
  onPeriodChange: (p: 'week' | 'month') => void
}

function formatDate(dateStr: string, period: 'week' | 'month') {
  const d = new Date(dateStr)
  if (period === 'week') {
    return ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'][d.getDay()]
  }
  return `${d.getDate()}/${d.getMonth() + 1}`
}

export function WaterHistory({ history, dailyGoalMl, period, onPeriodChange }: WaterHistoryProps) {
  const data = history.map((d) => ({
    ...d,
    label: formatDate(d.date, period),
    liters: +(d.amountMl / 1000).toFixed(1),
  }))

  const goalL = +(dailyGoalMl / 1000).toFixed(1)

  return (
    <div className="space-y-3 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
      {/* Başlık + period toggle */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white">Geçmiş</h3>
        <div className="flex gap-1 rounded-xl bg-white/[0.04] p-1">
          {(['week', 'month'] as const).map((p) => (
            <button
              key={p}
              onClick={() => onPeriodChange(p)}
              className={`rounded-lg px-3 py-1 text-xs font-semibold transition-colors ${
                period === p ? 'bg-[#3B82F6] text-white' : 'text-[#64748B] hover:text-white'
              }`}
            >
              {p === 'week' ? 'Haftalık' : 'Aylık'}
            </button>
          ))}
        </div>
      </div>

      {/* Grafik */}
      <motion.div
        key={period}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="h-48"
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fill: '#64748B', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: '#64748B', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `${v}L`}
            />
            <Tooltip
              contentStyle={{
                background: '#1A1A2E',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 12,
                color: '#fff',
                fontSize: 12,
              }}
              formatter={(value: number) => [`${(value * 1000).toFixed(0)} ml`, 'Su']}
              cursor={{ fill: 'rgba(255,255,255,0.03)' }}
            />
            <ReferenceLine
              y={goalL}
              stroke="#3B82F6"
              strokeDasharray="4 4"
              strokeOpacity={0.5}
              label={{ value: 'Hedef', fill: '#3B82F6', fontSize: 10, position: 'right' }}
            />
            <Bar dataKey="liters" radius={[6, 6, 0, 0]}>
              {data.map((entry, index) => (
                <Cell
                  key={index}
                  fill={entry.goalMet ? '#10B981' : '#3B82F6'}
                  fillOpacity={entry.goalMet ? 0.9 : 0.6}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Özet */}
      <div className="flex items-center gap-4 pt-1">
        <div className="flex items-center gap-1.5">
          <div className="h-2 w-2 rounded-full bg-emerald-500" />
          <span className="text-xs text-[#64748B]">Hedefe ulaşıldı</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-2 w-2 rounded-full bg-blue-500 opacity-60" />
          <span className="text-xs text-[#64748B]">Hedefe ulaşılamadı</span>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
cd c:/Users/TUF/Desktop/Ai-Pt && git add apps/web/components/water/WaterHistory.tsx && git commit -m "feat(water): add WaterHistory chart component"
```

---

### Task 6: WaterStreak + WaterAchievements componentleri

**Files:**

- Create: `apps/web/components/water/WaterStreakCard.tsx`
- Create: `apps/web/components/water/WaterAchievements.tsx`

- [ ] **Step 1: WaterStreakCard oluştur**

Create `apps/web/components/water/WaterStreakCard.tsx`:

```typescript
'use client'

import { motion } from 'framer-motion'
import { Flame, Trophy, Calendar } from 'lucide-react'

interface WaterStreakCardProps {
  currentStreak: number
  longestStreak: number
  totalDaysGoal: number
}

export function WaterStreakCard({ currentStreak, longestStreak, totalDaysGoal }: WaterStreakCardProps) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {[
        {
          icon: <Flame size={18} className="text-orange-400" />,
          value: currentStreak,
          label: 'Günlük Seri',
          color: 'text-orange-400',
          bg: 'bg-orange-500/10',
          border: 'border-orange-500/20',
        },
        {
          icon: <Trophy size={18} className="text-yellow-400" />,
          value: longestStreak,
          label: 'En Uzun Seri',
          color: 'text-yellow-400',
          bg: 'bg-yellow-500/10',
          border: 'border-yellow-500/20',
        },
        {
          icon: <Calendar size={18} className="text-purple-400" />,
          value: totalDaysGoal,
          label: 'Toplam Gün',
          color: 'text-purple-400',
          bg: 'bg-purple-500/10',
          border: 'border-purple-500/20',
        },
      ].map((item) => (
        <motion.div
          key={item.label}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`flex flex-col items-center gap-1.5 rounded-2xl ${item.bg} border ${item.border} p-3`}
        >
          {item.icon}
          <motion.span
            key={item.value}
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            className={`text-2xl font-black ${item.color}`}
          >
            {item.value}
          </motion.span>
          <span className="text-center text-[10px] text-[#64748B] leading-tight">{item.label}</span>
        </motion.div>
      ))}
    </div>
  )
}
```

- [ ] **Step 2: WaterAchievements oluştur**

Create `apps/web/components/water/WaterAchievements.tsx`:

```typescript
'use client'

import { motion } from 'framer-motion'

interface AchievementDef {
  id: string
  title: string
  desc: string
  icon: string
  check: (stats: AchievementStats) => boolean
}

interface AchievementStats {
  totalDaysGoal: number
  currentStreak: number
  longestStreak: number
  totalMlEver: number
}

const ACHIEVEMENTS: AchievementDef[] = [
  {
    id: 'first_drop',
    title: 'İlk Yudum',
    desc: 'İlk kez su kaydetti',
    icon: '💧',
    check: (s) => s.totalDaysGoal >= 1,
  },
  {
    id: 'three_days',
    title: '3 Gün Şampiyonu',
    desc: '3 gün üst üste hedefe ulaştı',
    icon: '🥉',
    check: (s) => s.longestStreak >= 3,
  },
  {
    id: 'week_warrior',
    title: 'Hafta Savaşçısı',
    desc: '7 gün üst üste hedefe ulaştı',
    icon: '🥈',
    check: (s) => s.longestStreak >= 7,
  },
  {
    id: 'month_master',
    title: 'Ay Ustası',
    desc: '30 gün üst üste hedefe ulaştı',
    icon: '🥇',
    check: (s) => s.longestStreak >= 30,
  },
  {
    id: 'ten_days',
    title: 'On Günlük Disiplin',
    desc: 'Toplamda 10 gün hedefe ulaştı',
    icon: '⭐',
    check: (s) => s.totalDaysGoal >= 10,
  },
  {
    id: 'fifty_days',
    title: 'Su Abidesi',
    desc: 'Toplamda 50 gün hedefe ulaştı',
    icon: '🌟',
    check: (s) => s.totalDaysGoal >= 50,
  },
  {
    id: 'ocean_50',
    title: 'Göl',
    desc: 'Toplamda 50 litre içti',
    icon: '🏞️',
    check: (s) => s.totalMlEver >= 50000,
  },
  {
    id: 'ocean_100',
    title: 'Okyanus',
    desc: 'Toplamda 100 litre içti',
    icon: '🌊',
    check: (s) => s.totalMlEver >= 100000,
  },
]

interface WaterAchievementsProps {
  stats: AchievementStats
}

export function WaterAchievements({ stats }: WaterAchievementsProps) {
  const unlocked = ACHIEVEMENTS.filter((a) => a.check(stats))
  const locked = ACHIEVEMENTS.filter((a) => !a.check(stats))

  return (
    <div className="space-y-3 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white">Başarımlar</h3>
        <span className="text-xs text-[#64748B]">{unlocked.length}/{ACHIEVEMENTS.length}</span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {[...unlocked, ...locked].map((achievement, i) => {
          const isUnlocked = achievement.check(stats)
          return (
            <motion.div
              key={achievement.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              className={`flex items-center gap-3 rounded-2xl p-3 border transition-all ${
                isUnlocked
                  ? 'bg-[#3B82F6]/10 border-[#3B82F6]/20'
                  : 'bg-white/[0.02] border-white/[0.04] opacity-40'
              }`}
            >
              <span className="text-2xl">{isUnlocked ? achievement.icon : '🔒'}</span>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-white truncate">{achievement.title}</p>
                <p className="text-[10px] text-[#64748B] leading-tight">{achievement.desc}</p>
              </div>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
cd c:/Users/TUF/Desktop/Ai-Pt && git add apps/web/components/water/ && git commit -m "feat(water): add WaterStreakCard and WaterAchievements components"
```

---

### Task 7: /dashboard/water ana sayfa + navigasyon

**Files:**

- Create: `apps/web/app/(dashboard)/dashboard/water/page.tsx`
- Modify: `apps/web/app/(dashboard)/dashboard/layout.tsx` veya navigasyon dosyası

- [ ] **Step 1: Navigasyon dosyasını bul**

```bash
find c:/Users/TUF/Desktop/Ai-Pt/apps/web/app/\(dashboard\) -name "*.tsx" | head -20
grep -r "nutrition\|dashboard.*href\|NavItem\|navItems" c:/Users/TUF/Desktop/Ai-Pt/apps/web/app/\(dashboard\) --include="*.tsx" -l
```

- [ ] **Step 2: Water sayfasını oluştur**

Create `apps/web/app/(dashboard)/dashboard/water/page.tsx`:

```typescript
'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Droplets } from 'lucide-react'
import { WaterWave } from '@/components/water/WaterWave'
import { WaterActions } from '@/components/water/WaterActions'
import { WaterSettingsPanel } from '@/components/water/WaterSettingsPanel'
import { WaterHistory } from '@/components/water/WaterHistory'
import { WaterStreakCard } from '@/components/water/WaterStreakCard'
import { WaterAchievements } from '@/components/water/WaterAchievements'
import { NotificationSettings } from '@/components/settings/NotificationSettings'

interface WaterState {
  amountMl: number
  glasses: number
  dailyGoalMl: number
  cupSizeMl: number
}

interface StreakState {
  currentStreak: number
  longestStreak: number
  totalDaysGoal: number
  totalMlEver: number
}

interface HistoryItem {
  date: string
  amountMl: number
  goalMet: boolean
}

export default function WaterPage() {
  const [water, setWater] = useState<WaterState>({
    amountMl: 0,
    glasses: 0,
    dailyGoalMl: 2500,
    cupSizeMl: 200,
  })
  const [streak, setStreak] = useState<StreakState>({
    currentStreak: 0,
    longestStreak: 0,
    totalDaysGoal: 0,
    totalMlEver: 0,
  })
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [period, setPeriod] = useState<'week' | 'month'>('week')
  const [loading, setLoading] = useState(true)

  const fetchAll = useCallback(async () => {
    const [waterRes, streakRes, historyRes] = await Promise.all([
      fetch('/api/nutrition/water').then((r) => r.json()),
      fetch('/api/nutrition/water/streak').then((r) => r.json()),
      fetch(`/api/nutrition/water/history?period=${period}`).then((r) => r.json()),
    ])
    setWater({
      amountMl: waterRes.amountMl ?? 0,
      glasses: waterRes.glasses ?? 0,
      dailyGoalMl: waterRes.dailyGoalMl ?? 2500,
      cupSizeMl: waterRes.cupSizeMl ?? 200,
    })
    setStreak({
      currentStreak: streakRes.streak?.currentStreak ?? 0,
      longestStreak: streakRes.streak?.longestStreak ?? 0,
      totalDaysGoal: streakRes.streak?.totalDaysGoal ?? 0,
      totalMlEver: historyRes.history?.reduce((s: number, d: HistoryItem) => s + d.amountMl, 0) ?? 0,
    })
    setHistory(historyRes.history ?? [])
    setLoading(false)
  }, [period])

  useEffect(() => { fetchAll() }, [fetchAll])

  const handleAdd = async (ml: number) => {
    const res = await fetch('/api/nutrition/water', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ml }),
    }).then((r) => r.json())
    setWater((prev) => ({ ...prev, amountMl: res.amountMl, glasses: res.glasses }))
    // Streak'i güncelle
    fetch('/api/nutrition/water/streak').then((r) => r.json()).then((d) => {
      setStreak((prev) => ({ ...prev, ...d.streak }))
    })
  }

  const handleRemove = async (ml: number) => {
    const res = await fetch('/api/nutrition/water', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ml }),
    }).then((r) => r.json())
    setWater((prev) => ({ ...prev, amountMl: res.amountMl, glasses: res.glasses }))
  }

  const handleSaveSettings = async (dailyGoalMl: number, cupSizeMl: number) => {
    await fetch('/api/nutrition/water/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dailyGoalMl, cupSizeMl }),
    })
    setWater((prev) => ({ ...prev, dailyGoalMl, cupSizeMl }))
  }

  const percentage = water.dailyGoalMl > 0 ? (water.amountMl / water.dailyGoalMl) * 100 : 0

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#3B82F6] border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto space-y-5 pb-10">
      {/* Başlık */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div className="flex items-center gap-2">
          <Droplets size={24} className="text-[#3B82F6]" />
          <h1 className="text-2xl font-black text-white">Su Takibi</h1>
        </div>
        <WaterSettingsPanel
          dailyGoalMl={water.dailyGoalMl}
          cupSizeMl={water.cupSizeMl}
          onSave={handleSaveSettings}
        />
      </motion.div>

      {/* Su Dalgası */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        className="flex justify-center"
      >
        <WaterWave
          percentage={percentage}
          amountMl={water.amountMl}
          goalMl={water.dailyGoalMl}
        />
      </motion.div>

      {/* Hızlı Ekleme */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
        <WaterActions
          cupSizeMl={water.cupSizeMl}
          onAdd={handleAdd}
          onRemove={handleRemove}
        />
      </motion.div>

      {/* Streak */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <WaterStreakCard
          currentStreak={streak.currentStreak}
          longestStreak={streak.longestStreak}
          totalDaysGoal={streak.totalDaysGoal}
        />
      </motion.div>

      {/* Geçmiş */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
        <WaterHistory
          history={history}
          dailyGoalMl={water.dailyGoalMl}
          period={period}
          onPeriodChange={(p) => { setPeriod(p); fetchAll() }}
        />
      </motion.div>

      {/* Başarımlar */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <WaterAchievements stats={streak} />
      </motion.div>

      {/* Bildirimler */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
          <h3 className="text-sm font-semibold text-white mb-3">Su Bildirimleri</h3>
          <NotificationSettings />
        </div>
      </motion.div>
    </div>
  )
}
```

- [ ] **Step 3: Navigasyona "Su" linkini ekle**

Navigasyon dosyasını bul (Step 1 sonucuna göre) ve `water` linkini ekle. Örnek pattern:

```typescript
{ href: '/dashboard/water', label: 'Su', icon: <Droplets size={18} /> }
```

- [ ] **Step 4: Commit**

```bash
cd c:/Users/TUF/Desktop/Ai-Pt && git add apps/web/app/\(dashboard\)/dashboard/water/ && git commit -m "feat(water): add /dashboard/water page with full UI"
```

---

## Özet

| Task | Dosyalar                           | Test   |
| ---- | ---------------------------------- | ------ |
| 1    | schema.prisma                      | —      |
| 2    | 4 API route                        | 4 test |
| 3    | WaterWave.tsx                      | 4 test |
| 4    | WaterActions, WaterSettingsPanel   | —      |
| 5    | WaterHistory.tsx                   | —      |
| 6    | WaterStreakCard, WaterAchievements | —      |
| 7    | water/page.tsx + nav               | —      |
