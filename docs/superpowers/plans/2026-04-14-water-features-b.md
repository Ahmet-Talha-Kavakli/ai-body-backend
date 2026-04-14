# Water Features B: Favori İçecekler Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Su dışındaki içecekleri (kahve, çay, meyve suyu, süt, enerji içeceği) ayrı takip et — su sayacını etkilemez, `/dashboard/water` sayfasında ayrı bir "Diğer İçecekler" kartı gösterilir.

**Architecture:** Yeni `DrinkLog` Prisma modeli. Yeni `/api/nutrition/drinks` route (GET/POST/DELETE). Frontend'de `DrinkTracker` komponenti su sayfasına eklenir.

**Tech Stack:** Next.js 15, Prisma, Framer Motion, Tailwind CSS, Vitest

---

## Chunk 1: DB + API

### Task 1: DrinkLog Prisma Modeli

**Files:**

- Modify: `apps/web/prisma/schema.prisma`

- [ ] **Step 1: User modeline ilişki ekle**

`apps/web/prisma/schema.prisma` dosyasında `User` modelinde `waterStreak WaterStreak?` satırından sonra ekle:

```prisma
  drinkLogs       DrinkLog[]
```

- [ ] **Step 2: DrinkLog modelini ekle**

`WaterStreak` modelinden sonra ekle:

```prisma
model DrinkLog {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  date      DateTime
  drinkType String   // "coffee" | "tea" | "juice" | "milk" | "energy"
  amountMl  Float
  createdAt DateTime @default(now())

  @@index([userId, date])
}
```

- [ ] **Step 3: Prisma generate + db push**

```bash
cd c:/Users/TUF/Desktop/Ai-Pt/apps/web && npx prisma generate && npx prisma db push --accept-data-loss 2>&1 | tail -5
```

Expected: `Your database is now in sync with your Prisma schema`

- [ ] **Step 4: Commit**

```bash
cd c:/Users/TUF/Desktop/Ai-Pt && git add apps/web/prisma/schema.prisma && git commit -m "feat(drinks): add DrinkLog Prisma model"
```

---

### Task 2: Drinks API (TDD)

**Files:**

- Create: `apps/web/app/api/nutrition/drinks/route.ts`
- Create: `apps/web/app/api/nutrition/drinks/__tests__/drinks-api.test.ts`

- [ ] **Step 1: Test dosyası oluştur**

`apps/web/app/api/nutrition/drinks/__tests__/drinks-api.test.ts` oluştur:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

const mockDb = {
  user: { findUnique: vi.fn() },
  drinkLog: {
    findMany: vi.fn(),
    create: vi.fn(),
    delete: vi.fn(),
    findUnique: vi.fn(),
  },
}

vi.mock('@/lib/db/client', () => ({ db: mockDb }))
vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn().mockResolvedValue({ userId: 'clerk_123' }),
}))

describe('GET /api/nutrition/drinks', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockDb.user.findUnique.mockResolvedValue({ id: 'user_1' })
  })

  it('returns today drink logs', async () => {
    mockDb.drinkLog.findMany.mockResolvedValue([
      { id: 'log_1', drinkType: 'coffee', amountMl: 200, createdAt: new Date() },
    ])

    const req = new NextRequest('http://localhost/api/nutrition/drinks')
    const { GET } = await import('../route')
    const res = await GET(req)
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.logs).toHaveLength(1)
    expect(data.logs[0].drinkType).toBe('coffee')
  })
})

describe('POST /api/nutrition/drinks', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockDb.user.findUnique.mockResolvedValue({ id: 'user_1' })
  })

  it('creates a drink log', async () => {
    mockDb.drinkLog.create.mockResolvedValue({
      id: 'log_1',
      drinkType: 'tea',
      amountMl: 300,
      createdAt: new Date(),
    })

    const req = new NextRequest('http://localhost/api/nutrition/drinks', {
      method: 'POST',
      body: JSON.stringify({ drinkType: 'tea', amountMl: 300 }),
      headers: { 'Content-Type': 'application/json' },
    })

    const { POST } = await import('../route')
    const res = await POST(req)
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.log.drinkType).toBe('tea')
  })

  it('rejects invalid drinkType', async () => {
    const req = new NextRequest('http://localhost/api/nutrition/drinks', {
      method: 'POST',
      body: JSON.stringify({ drinkType: 'beer', amountMl: 300 }),
      headers: { 'Content-Type': 'application/json' },
    })

    const { POST } = await import('../route')
    const res = await POST(req)

    expect(res.status).toBe(400)
  })
})

describe('DELETE /api/nutrition/drinks', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockDb.user.findUnique.mockResolvedValue({ id: 'user_1' })
  })

  it('deletes a drink log by id', async () => {
    mockDb.drinkLog.findUnique.mockResolvedValue({ id: 'log_1', userId: 'user_1' })
    mockDb.drinkLog.delete.mockResolvedValue({})

    const req = new NextRequest('http://localhost/api/nutrition/drinks', {
      method: 'DELETE',
      body: JSON.stringify({ id: 'log_1' }),
      headers: { 'Content-Type': 'application/json' },
    })

    const { DELETE } = await import('../route')
    const res = await DELETE(req)
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.success).toBe(true)
  })

  it('returns 404 if log not found or belongs to other user', async () => {
    mockDb.drinkLog.findUnique.mockResolvedValue(null)

    const req = new NextRequest('http://localhost/api/nutrition/drinks', {
      method: 'DELETE',
      body: JSON.stringify({ id: 'log_999' }),
      headers: { 'Content-Type': 'application/json' },
    })

    const { DELETE } = await import('../route')
    const res = await DELETE(req)

    expect(res.status).toBe(404)
  })
})
```

- [ ] **Step 2: Testi çalıştır, FAIL olduğunu doğrula**

```bash
cd c:/Users/TUF/Desktop/Ai-Pt/apps/web && npx vitest run app/api/nutrition/drinks/__tests__/drinks-api.test.ts --reporter=verbose 2>&1 | tail -20
```

Expected: FAIL — route file not found

- [ ] **Step 3: Drinks route oluştur**

`apps/web/app/api/nutrition/drinks/route.ts` oluştur:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db/client'

const VALID_DRINK_TYPES = ['coffee', 'tea', 'juice', 'milk', 'energy'] as const
type DrinkType = (typeof VALID_DRINK_TYPES)[number]

function todayRange() {
  const start = new Date()
  start.setHours(0, 0, 0, 0)
  const end = new Date()
  end.setHours(23, 59, 59, 999)
  return { start, end }
}

export async function GET() {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const user = await db.user.findUnique({ where: { clerkId } })
    if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const { start, end } = todayRange()
    const logs = await db.drinkLog.findMany({
      where: { userId: user.id, date: { gte: start, lte: end } },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ logs })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const user = await db.user.findUnique({ where: { clerkId } })
    if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const { drinkType, amountMl } = await req.json()

    if (!VALID_DRINK_TYPES.includes(drinkType as DrinkType)) {
      return NextResponse.json({ error: 'Invalid drinkType' }, { status: 400 })
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const log = await db.drinkLog.create({
      data: { userId: user.id, date: today, drinkType, amountMl },
    })

    return NextResponse.json({ success: true, log })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const user = await db.user.findUnique({ where: { clerkId } })
    if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const { id } = await req.json()
    const log = await db.drinkLog.findUnique({ where: { id } })

    if (!log || log.userId !== user.id) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    await db.drinkLog.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

- [ ] **Step 4: Testi çalıştır, PASS olduğunu doğrula**

```bash
cd c:/Users/TUF/Desktop/Ai-Pt/apps/web && npx vitest run app/api/nutrition/drinks/__tests__/drinks-api.test.ts --reporter=verbose 2>&1 | tail -20
```

Expected: All tests PASS

- [ ] **Step 5: Commit**

```bash
cd c:/Users/TUF/Desktop/Ai-Pt && git add apps/web/app/api/nutrition/drinks/ && git commit -m "feat(drinks): add drinks API route with TDD"
```

---

## Chunk 2: Frontend

### Task 3: DrinkTracker Komponenti

**Files:**

- Create: `apps/web/components/water/DrinkTracker.tsx`
- Modify: `apps/web/app/(dashboard)/dashboard/water/page.tsx`

- [ ] **Step 1: DrinkTracker.tsx oluştur**

`apps/web/components/water/DrinkTracker.tsx` oluştur:

```typescript
'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Trash2 } from 'lucide-react'

type DrinkType = 'coffee' | 'tea' | 'juice' | 'milk' | 'energy'

interface DrinkLog {
  id: string
  drinkType: DrinkType
  amountMl: number
  createdAt: string
}

const DRINK_DEFS: Record<DrinkType, { label: string; icon: string; color: string; defaultMl: number }> = {
  coffee: { label: 'Kahve', icon: '☕', color: 'bg-amber-500/10 border-amber-500/20 text-amber-400', defaultMl: 200 },
  tea: { label: 'Çay', icon: '🍵', color: 'bg-green-500/10 border-green-500/20 text-green-400', defaultMl: 200 },
  juice: { label: 'Meyve Suyu', icon: '🧃', color: 'bg-orange-500/10 border-orange-500/20 text-orange-400', defaultMl: 250 },
  milk: { label: 'Süt', icon: '🥛', color: 'bg-blue-500/10 border-blue-500/20 text-blue-400', defaultMl: 200 },
  energy: { label: 'Enerji', icon: '⚡', color: 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400', defaultMl: 250 },
}

export function DrinkTracker() {
  const [logs, setLogs] = useState<DrinkLog[]>([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState<DrinkType | null>(null)

  useEffect(() => {
    fetch('/api/nutrition/drinks')
      .then((r) => r.json())
      .then((d) => {
        setLogs(d.logs ?? [])
        setLoading(false)
      })
  }, [])

  const addDrink = async (drinkType: DrinkType) => {
    setAdding(drinkType)
    const amountMl = DRINK_DEFS[drinkType].defaultMl
    const res = await fetch('/api/nutrition/drinks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ drinkType, amountMl }),
    }).then((r) => r.json())

    if (res.success) {
      setLogs((prev) => [res.log, ...prev])
    }
    setAdding(null)
  }

  const removeDrink = async (id: string) => {
    await fetch('/api/nutrition/drinks', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    setLogs((prev) => prev.filter((l) => l.id !== id))
  }

  const totalByType = logs.reduce(
    (acc, log) => {
      acc[log.drinkType] = (acc[log.drinkType] ?? 0) + log.amountMl
      return acc
    },
    {} as Record<DrinkType, number>
  )

  return (
    <div className="space-y-4 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
      <h3 className="text-sm font-semibold text-white">Diğer İçecekler</h3>

      {/* Hızlı Ekleme */}
      <div className="grid grid-cols-5 gap-2">
        {(Object.entries(DRINK_DEFS) as [DrinkType, typeof DRINK_DEFS[DrinkType]][]).map(([type, def]) => (
          <motion.button
            key={type}
            whileTap={{ scale: 0.92 }}
            onClick={() => addDrink(type)}
            disabled={adding === type}
            className={`flex flex-col items-center gap-1 rounded-2xl border p-2 transition-all ${def.color} hover:opacity-80 disabled:opacity-50`}
          >
            <span className="text-xl">{def.icon}</span>
            <span className="text-[9px] font-medium">{def.label}</span>
            {totalByType[type] ? (
              <span className="text-[9px] opacity-70">{totalByType[type]}ml</span>
            ) : null}
          </motion.button>
        ))}
      </div>

      {/* Log Listesi */}
      {!loading && logs.length > 0 && (
        <div className="space-y-1">
          <AnimatePresence>
            {logs.slice(0, 5).map((log) => {
              const def = DRINK_DEFS[log.drinkType]
              return (
                <motion.div
                  key={log.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="flex items-center justify-between rounded-xl bg-white/[0.03] px-3 py-2"
                >
                  <div className="flex items-center gap-2">
                    <span>{def.icon}</span>
                    <span className="text-xs text-white">{def.label}</span>
                    <span className="text-xs text-[#64748B]">{log.amountMl}ml</span>
                  </div>
                  <button
                    onClick={() => removeDrink(log.id)}
                    className="text-red-400/40 transition-colors hover:text-red-400"
                  >
                    <Trash2 size={13} />
                  </button>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      )}

      {!loading && logs.length === 0 && (
        <p className="text-center text-xs text-[#64748B]">Bugün henüz başka içecek eklenmedi</p>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Water page'e DrinkTracker ekle**

`apps/web/app/(dashboard)/dashboard/water/page.tsx` dosyasında:

Import'a ekle:

```typescript
import { DrinkTracker } from '@/components/water/DrinkTracker'
```

JSX'te `WaterAchievements` motion.div'inden sonra, "Bildirimler" bölümünden önce ekle:

```tsx
{
  /* Diğer İçecekler */
}
;<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ delay: 0.32 }}
>
  <DrinkTracker />
</motion.div>
```

- [ ] **Step 3: Dev server'da test et**

`http://localhost:3000/dashboard/water` → "Diğer İçecekler" kartını gör → Kahve, Çay gibi içeceklere tıkla → Log listesinde göründüğünü doğrula → Çöp kutusuyla silmeyi test et.

- [ ] **Step 4: Commit**

```bash
cd c:/Users/TUF/Desktop/Ai-Pt && git add apps/web/components/water/DrinkTracker.tsx apps/web/app/\(dashboard\)/dashboard/water/page.tsx && git commit -m "feat(drinks): add DrinkTracker UI component"
```

---
