# Dashboard V2 Overhaul Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix all broken pages, overhaul UI with mesh gradient backgrounds + micro-animations, rebuild Water/Nutrition pages from scratch, add Health Tracking module, and restructure BottomNav with "More" tab.

**Architecture:** Mobile-first Next.js App Router. Each page is a standalone `page.tsx` with its own API routes. Shared design tokens in `globals.css`. All API routes use `withAuth` wrapper. DB changes via `prisma db push`.

**Tech Stack:** Next.js 14, TypeScript strict, Framer Motion, Tailwind CSS, Prisma + PostgreSQL, OpenAI API, Lucide icons (Thiings where embeddable)

---

## Chunk 1: Foundation — Background & Global UI

### Task 1: Mesh Gradient Background System

**Goal:** Replace flat black backgrounds with animated teal+indigo mesh gradient. Apply globally.

**Files:**

- Modify: `apps/web/app/globals.css`
- Modify: `apps/web/app/(dashboard)/layout.tsx` (or wherever `<body>` background is set)

- [ ] **Step 1: Find where background color is applied**

```bash
grep -rn "bg-black\|bg-background\|background:" apps/web/app/globals.css apps/web/app/layout.tsx apps/web/app/\(dashboard\) --include="*.tsx" --include="*.css" | head -30
```

- [ ] **Step 2: Add mesh gradient CSS to globals.css**

Add after existing `:root` block:

```css
/* ── Mesh Gradient Background ─────────────────── */
.mesh-bg {
  background-color: #050816;
  background-image:
    radial-gradient(ellipse 80% 50% at 20% -10%, rgba(20, 184, 166, 0.15) 0%, transparent 60%),
    radial-gradient(ellipse 60% 40% at 80% 110%, rgba(99, 102, 241, 0.18) 0%, transparent 55%),
    radial-gradient(ellipse 40% 60% at 50% 50%, rgba(45, 212, 191, 0.05) 0%, transparent 70%);
}

.mesh-bg-animated {
  background-color: #050816;
  background-image:
    radial-gradient(ellipse 80% 50% at 20% -10%, rgba(20, 184, 166, 0.15) 0%, transparent 60%),
    radial-gradient(ellipse 60% 40% at 80% 110%, rgba(99, 102, 241, 0.18) 0%, transparent 55%),
    radial-gradient(ellipse 40% 60% at 50% 50%, rgba(45, 212, 191, 0.05) 0%, transparent 70%);
  animation: mesh-shift 12s ease-in-out infinite alternate;
}

@keyframes mesh-shift {
  0% {
    background-position:
      0% 0%,
      100% 100%,
      50% 50%;
  }
  100% {
    background-position:
      10% 5%,
      90% 95%,
      55% 45%;
  }
}

/* Card glass effect */
.glass-card {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.07);
  backdrop-filter: blur(12px);
}

.glass-card-teal {
  background: rgba(20, 184, 166, 0.05);
  border: 1px solid rgba(20, 184, 166, 0.15);
}

.glass-card-indigo {
  background: rgba(99, 102, 241, 0.08);
  border: 1px solid rgba(99, 102, 241, 0.2);
}
```

- [ ] **Step 3: Apply mesh-bg to dashboard layout**

Find `apps/web/app/(dashboard)/layout.tsx` — add `mesh-bg-animated` class to the root `<div>` or `<body>`. Also update `DashboardShell` in `apps/web/components/dashboard/shared/layout.tsx`:

```tsx
// In DashboardShell, change:
<div className="bg-background flex h-screen overflow-hidden">
// To:
<div className="mesh-bg flex h-screen overflow-hidden">
```

- [ ] **Step 4: Update globals.css background variable**

```css
:root {
  --background: 5 8 22; /* #050816 — deep dark navy */
}
```

- [ ] **Step 5: Commit**

```bash
git add apps/web/app/globals.css apps/web/components/dashboard/shared/layout.tsx
git commit -m "feat(ui): mesh gradient teal+indigo background system"
```

---

### Task 2: BottomNav — Replace "Kedi" with "Daha Fazlası" Sheet

**Goal:** 5. tab "Kedi" → "Daha Fazlası". Tapping opens an animated bottom sheet with: Kedi, Profil, Bildirimler, Başarımlar.

**Files:**

- Modify: `apps/web/components/navigation/BottomNav.tsx`
- Create: `apps/web/components/navigation/MoreSheet.tsx`

- [ ] **Step 1: Create MoreSheet component**

```tsx
// apps/web/components/navigation/MoreSheet.tsx
'use client'

import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { Cat, User, Bell, Trophy, X } from 'lucide-react'

const ITEMS = [
  {
    href: '/dashboard/pet',
    icon: Cat,
    label: 'Kedi',
    color: 'text-pink-400',
    bg: 'bg-pink-500/10',
    border: 'border-pink-500/20',
  },
  {
    href: '/dashboard/profile',
    icon: User,
    label: 'Profil',
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/20',
  },
  {
    href: '/dashboard/settings/notifications',
    icon: Bell,
    label: 'Bildirimler',
    color: 'text-yellow-400',
    bg: 'bg-yellow-500/10',
    border: 'border-yellow-500/20',
  },
  {
    href: '/dashboard/achievements',
    icon: Trophy,
    label: 'Başarımlar',
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/20',
  },
]

interface MoreSheetProps {
  open: boolean
  onClose: () => void
}

export function MoreSheet({ open, onClose }: MoreSheetProps) {
  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          {/* Sheet */}
          <motion.div
            className="fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl border-t border-white/10 bg-[#0a0f1e] pb-10 pt-4 lg:hidden"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            {/* Handle */}
            <div className="mx-auto mb-6 h-1 w-12 rounded-full bg-white/20" />

            <div className="flex items-center justify-between px-6 pb-4">
              <h2 className="text-lg font-bold text-white">Daha Fazlası</h2>
              <button onClick={onClose} className="rounded-xl p-2 hover:bg-white/5">
                <X size={20} className="text-white/50" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 px-4">
              {ITEMS.map((item, i) => (
                <motion.div
                  key={item.href}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                >
                  <Link href={item.href} onClick={onClose}>
                    <div
                      className={`flex flex-col items-center gap-3 rounded-2xl border p-5 ${item.bg} ${item.border}`}
                    >
                      <div className={`rounded-xl p-3 ${item.bg}`}>
                        <item.icon size={24} className={item.color} />
                      </div>
                      <span className="text-sm font-semibold text-white">{item.label}</span>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
```

- [ ] **Step 2: Update BottomNav to use MoreSheet**

Replace "Kedi" tab with "Daha Fazlası". Add `useState` for sheet open state:

```tsx
'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Map, Zap, BarChart3, MoreHorizontal, LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { MoreSheet } from './MoreSheet'

// ... (keep existing Tab interface and isTabActive)

const TABS = [
  { id: 'home', label: 'Ev', icon: Home, path: '/dashboard' },
  { id: 'roadmap', label: 'Yol', icon: Map, path: '/dashboard/roadmap' },
  { id: 'sessions', label: 'Seans', icon: Zap, path: '/dashboard/sessions', isCenter: true },
  { id: 'tracking', label: 'Takip', icon: BarChart3, path: '/dashboard/tracking' },
  { id: 'more', label: 'Daha', icon: MoreHorizontal, path: '', isMore: true },
]

export function BottomNav() {
  const pathname = usePathname()
  const [moreOpen, setMoreOpen] = useState(false)

  // More tab is "active" if on pet/profile/notifications/achievements
  const moreActive = [
    '/dashboard/pet',
    '/dashboard/profile',
    '/dashboard/settings/notifications',
    '/dashboard/achievements',
  ].some((p) => pathname.startsWith(p))

  return (
    <>
      <MoreSheet open={moreOpen} onClose={() => setMoreOpen(false)} />
      <motion.div
        className="fixed bottom-4 left-1/2 z-40 lg:hidden"
        style={{ x: '-50%' }}
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30, delay: 0.1 }}
      >
        {/* ... same nav container ... */}
        {/* For "more" tab, use button instead of Link */}
        {/* tab.isMore → <button onClick={() => setMoreOpen(true)}> */}
      </motion.div>
    </>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add apps/web/components/navigation/BottomNav.tsx apps/web/components/navigation/MoreSheet.tsx
git commit -m "feat(nav): replace Kedi tab with More sheet containing Pet/Profile/Notifications/Achievements"
```

---

## Chunk 2: Bug Fixes

### Task 3: Fix /api/roadmap 500 Error

**Goal:** Roadmap API crashes — debug and fix the 500 error.

**Files:**

- Read: `apps/web/app/api/roadmap/route.ts`
- Fix as needed

- [ ] **Step 1: Read the route and check for issues**

```bash
cat apps/web/app/api/roadmap/route.ts
```

Look for: missing env vars, wrong Prisma field names, OpenAI call issues, unhandled promise rejections.

- [ ] **Step 2: Add proper error logging**

Wrap the handler body in try/catch and `console.error` the full error so it appears in terminal logs:

```ts
try {
  // ... existing logic
} catch (err) {
  console.error('[roadmap] error:', err)
  return NextResponse.json({ error: 'Internal server error', detail: String(err) }, { status: 500 })
}
```

- [ ] **Step 3: Run the route manually and read terminal logs**

Open `/dashboard/roadmap` in browser, read terminal for the actual error message.

- [ ] **Step 4: Fix root cause** (depends on Step 3 findings)

- [ ] **Step 5: Remove debug logging, commit**

```bash
git commit -m "fix(roadmap): resolve 500 error on GET /api/roadmap"
```

---

### Task 4: Fix /api/tracking/supplements & /api/tracking/medications 500 Errors

**Goal:** Both routes return 500. Fix them.

**Files:**

- Read: `apps/web/app/api/tracking/supplements/route.ts`
- Read: `apps/web/app/api/tracking/medications/route.ts`
- Possibly: `apps/web/prisma/schema.prisma`

- [ ] **Step 1: Add error logging to both routes**

Same pattern as Task 3 — wrap in try/catch, log full error.

- [ ] **Step 2: Check Prisma schema vs query field names**

Common issue: query uses a field that doesn't exist in schema. Check:

- `db.supplement.findMany(...)` — does `Supplement` model have all queried fields?
- `db.supplementLog.create(...)` — does `SupplementLog` have `userId` field?
- Same for `Medication` / `MedicationLog`

- [ ] **Step 3: Fix mismatches**

If schema is missing fields, add them and run:

```bash
cd apps/web && npx prisma db push
```

- [ ] **Step 4: Commit**

```bash
git commit -m "fix(tracking): resolve supplements and medications 500 errors"
```

---

### Task 5: Fix /api/pet 500 Error

**Goal:** Pet page shows blank screen due to 500 from `/api/pet`.

**Files:**

- Read: `apps/web/app/api/pet/route.ts`
- Possibly: `apps/web/prisma/schema.prisma` (Pet model)

- [ ] **Step 1: Add error logging**

- [ ] **Step 2: Check Pet model fields vs API query**

```bash
grep -A 30 "^model Pet " apps/web/prisma/schema.prisma
```

- [ ] **Step 3: Fix and run prisma db push if needed**

- [ ] **Step 4: Commit**

```bash
git commit -m "fix(pet): resolve 500 error on GET /api/pet"
```

---

### Task 6: Fix VAPI Session Error

**Goal:** `/dashboard/sessions/[type]` crashes with "VAPI session error: Error: Unhandled error (undefined)".

**Files:**

- Modify: `apps/web/components/session/VoiceSessionRoom.tsx`

- [ ] **Step 1: Read VoiceSessionRoom.tsx lines 40-70**

- [ ] **Step 2: Guard against missing VAPI assistant ID**

When VAPI assistant ID is not configured, show a friendly "Henüz yapılandırılmamış" UI instead of crashing:

```tsx
// At top of startSession:
if (!assistantId) {
  setError('Bu seans henüz yapılandırılmamış. Lütfen VAPI assistant ID ekleyin.')
  return
}
```

- [ ] **Step 3: Wrap vapi.start() in try/catch**

```tsx
try {
  await vapi.start(assistantId)
} catch (err) {
  console.error('VAPI start error:', err)
  setError('Seans başlatılamadı. Lütfen tekrar deneyin.')
}
```

- [ ] **Step 4: Show error state in UI**

```tsx
{
  error && (
    <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-center">
      <p className="text-sm text-red-400">{error}</p>
    </div>
  )
}
```

- [ ] **Step 5: Commit**

```bash
git commit -m "fix(sessions): graceful error handling when VAPI not configured"
```

---

## Chunk 3: Water Page Rebuild

### Task 7: Water Page — Sıfırdan Yeniden Yazma

**Goal:** Modern, animasyonlu, kapsamlı su takip sayfası. Circular progress, streak, hava durumu bonus, içecek logları, haftalık trend.

**Files:**

- Rewrite: `apps/web/app/(dashboard)/dashboard/water/page.tsx`
- Create: `apps/web/app/(dashboard)/dashboard/water/components/CircularProgress.tsx`
- Create: `apps/web/app/(dashboard)/dashboard/water/components/DrinkButton.tsx`
- Create: `apps/web/app/(dashboard)/dashboard/water/components/WeeklyChart.tsx`
- Keep existing API routes (water, drinks endpoints)

**Design:** Teal color scheme. Large circular progress ring in hero. Quick-add buttons (200ml, 350ml, 500ml, özel). Animated water fill effect. Weekly bar chart. Streak card with fire emoji. Weather bonus banner.

- [ ] **Step 1: Create CircularProgress component**

```tsx
// apps/web/app/(dashboard)/dashboard/water/components/CircularProgress.tsx
'use client'

import { motion } from 'framer-motion'

interface CircularProgressProps {
  current: number // ml
  goal: number // ml
  size?: number
}

export function CircularProgress({ current, goal, size = 200 }: CircularProgressProps) {
  const pct = Math.min(current / goal, 1)
  const r = (size - 20) / 2
  const circ = 2 * Math.PI * r
  const offset = circ * (1 - pct)
  const liters = (current / 1000).toFixed(1)
  const goalL = (goal / 1000).toFixed(1)

  return (
    <div
      className="relative flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90">
        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="rgba(20,184,166,0.1)"
          strokeWidth={12}
        />
        {/* Progress */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="url(#tealGrad)"
          strokeWidth={12}
          strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
        />
        <defs>
          <linearGradient id="tealGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#14b8a6" />
            <stop offset="100%" stopColor="#6366f1" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute flex flex-col items-center">
        <motion.span
          className="text-4xl font-black text-white"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          {liters}L
        </motion.span>
        <span className="text-sm text-white/40">/ {goalL}L hedef</span>
        <span className="mt-1 text-xs font-medium text-teal-400">{Math.round(pct * 100)}%</span>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create DrinkButton component**

```tsx
// apps/web/app/(dashboard)/dashboard/water/components/DrinkButton.tsx
'use client'

import { motion } from 'framer-motion'

interface DrinkButtonProps {
  ml: number
  label?: string
  onAdd: (ml: number) => void
  disabled?: boolean
}

export function DrinkButton({ ml, label, onAdd, disabled }: DrinkButtonProps) {
  return (
    <motion.button
      whileTap={{ scale: 0.92 }}
      whileHover={{ scale: 1.05 }}
      disabled={disabled}
      onClick={() => onAdd(ml)}
      className="flex flex-col items-center gap-1 rounded-2xl border border-teal-500/20 bg-teal-500/10 px-4 py-3 text-teal-300 transition-colors hover:bg-teal-500/20 disabled:opacity-50"
    >
      <span className="text-lg font-black">+{ml}</span>
      <span className="text-[10px] text-teal-400/70">{label ?? 'ml'}</span>
    </motion.button>
  )
}
```

- [ ] **Step 3: Create WeeklyChart component**

```tsx
// apps/web/app/(dashboard)/dashboard/water/components/WeeklyChart.tsx
'use client'

import { motion } from 'framer-motion'

interface DayData {
  day: string
  ml: number
  goal: number
}

export function WeeklyChart({ data }: { data: DayData[] }) {
  const max = Math.max(...data.map((d) => d.goal), 1)
  const days = ['Pt', 'Sa', 'Ça', 'Pe', 'Cu', 'Ct', 'Pa']

  return (
    <div className="flex items-end justify-between gap-2 px-2">
      {data.map((d, i) => {
        const pct = Math.min(d.ml / d.goal, 1)
        const isToday = i === new Date().getDay() - 1
        return (
          <div key={i} className="flex flex-1 flex-col items-center gap-1">
            <div className="relative flex h-20 w-full items-end rounded-lg bg-white/5">
              <motion.div
                className={`w-full rounded-lg ${isToday ? 'bg-gradient-to-t from-teal-500 to-indigo-500' : 'bg-teal-500/40'}`}
                initial={{ height: 0 }}
                animate={{ height: `${pct * 100}%` }}
                transition={{ delay: i * 0.07, duration: 0.6, ease: 'easeOut' }}
              />
            </div>
            <span
              className={`text-[10px] font-medium ${isToday ? 'text-teal-400' : 'text-white/30'}`}
            >
              {days[i]}
            </span>
          </div>
        )
      })}
    </div>
  )
}
```

- [ ] **Step 4: Rewrite water/page.tsx**

```tsx
// apps/web/app/(dashboard)/dashboard/water/page.tsx
'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Droplets, Flame, CloudRain, Plus, Trash2 } from 'lucide-react'
import { CircularProgress } from './components/CircularProgress'
import { DrinkButton } from './components/DrinkButton'
import { WeeklyChart } from './components/WeeklyChart'

const QUICK_AMOUNTS = [
  { ml: 200, label: 'Bardak' },
  { ml: 350, label: 'Büyük' },
  { ml: 500, label: 'Şişe' },
  { ml: 750, label: 'Sport' },
]

interface WaterData {
  todayMl: number
  goalMl: number
  streak: number
  weeklyData: { day: string; ml: number; goal: number }[]
  weatherBonus?: number
  logs: { id: string; amount: number; drinkType: string; loggedAt: string }[]
}

export default function WaterPage() {
  const [data, setData] = useState<WaterData | null>(null)
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [customMl, setCustomMl] = useState('')
  const [showCustom, setShowCustom] = useState(false)

  const fetchData = useCallback(async () => {
    const res = await fetch('/api/water/dashboard')
    if (res.ok) setData(await res.json())
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const addWater = async (ml: number) => {
    if (adding) return
    setAdding(true)
    // Optimistic update
    setData((prev) => (prev ? { ...prev, todayMl: prev.todayMl + ml } : prev))
    await fetch('/api/water/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: ml, drinkType: 'water' }),
    })
    await fetchData()
    setAdding(false)
  }

  if (loading) return <WaterSkeleton />

  const {
    todayMl = 0,
    goalMl = 2500,
    streak = 0,
    weeklyData = [],
    weatherBonus,
    logs = [],
  } = data ?? {}

  return (
    <div className="mx-auto max-w-2xl space-y-5 pb-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-teal-500/20">
          <Droplets size={20} className="text-teal-400" />
        </div>
        <div>
          <h1 className="text-xl font-black text-white">Su Takibi</h1>
          <p className="text-xs text-white/40">Günlük hidrasyon hedefin</p>
        </div>
      </div>

      {/* Weather bonus banner */}
      <AnimatePresence>
        {weatherBonus && weatherBonus > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-3 rounded-2xl border border-amber-500/20 bg-amber-500/10 p-3"
          >
            <CloudRain size={18} className="text-amber-400" />
            <p className="text-sm text-amber-300">
              Hava durumu bonusu: <span className="font-bold">+{weatherBonus}ml</span> ekstra hedef
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Circular Progress Hero */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="glass-card-teal flex flex-col items-center gap-4 rounded-3xl p-6"
      >
        <CircularProgress current={todayMl} goal={goalMl} size={200} />

        {/* Streak */}
        <div className="flex items-center gap-2 rounded-xl border border-orange-500/20 bg-orange-500/10 px-4 py-2">
          <Flame size={16} className="text-orange-400" />
          <span className="text-sm font-bold text-orange-300">{streak} günlük seri</span>
        </div>
      </motion.div>

      {/* Quick Add */}
      <div className="glass-card rounded-3xl p-4">
        <p className="mb-3 text-sm font-semibold text-white/60">Hızlı Ekle</p>
        <div className="grid grid-cols-4 gap-2">
          {QUICK_AMOUNTS.map(({ ml, label }) => (
            <DrinkButton key={ml} ml={ml} label={label} onAdd={addWater} disabled={adding} />
          ))}
        </div>

        {/* Custom amount */}
        <div className="mt-3">
          {showCustom ? (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="flex gap-2"
            >
              <input
                type="number"
                value={customMl}
                onChange={(e) => setCustomMl(e.target.value)}
                placeholder="Miktar (ml)"
                className="flex-1 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/30 outline-none focus:border-teal-500/50"
              />
              <button
                onClick={() => {
                  addWater(parseInt(customMl))
                  setCustomMl('')
                  setShowCustom(false)
                }}
                className="rounded-xl bg-teal-500 px-4 py-2 text-sm font-bold text-white"
              >
                Ekle
              </button>
            </motion.div>
          ) : (
            <button
              onClick={() => setShowCustom(true)}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-white/10 py-2 text-sm text-white/40 hover:text-white/60"
            >
              <Plus size={14} /> Özel miktar
            </button>
          )}
        </div>
      </div>

      {/* Weekly Chart */}
      {weeklyData.length > 0 && (
        <div className="glass-card rounded-3xl p-4">
          <p className="mb-4 text-sm font-semibold text-white/60">Bu Hafta</p>
          <WeeklyChart data={weeklyData} />
        </div>
      )}

      {/* Today's logs */}
      {logs.length > 0 && (
        <div className="glass-card rounded-3xl p-4">
          <p className="mb-3 text-sm font-semibold text-white/60">Bugünkü İçecekler</p>
          <div className="space-y-2">
            {logs.slice(0, 8).map((log) => (
              <div
                key={log.id}
                className="bg-white/3 flex items-center justify-between rounded-xl px-3 py-2"
              >
                <div className="flex items-center gap-2">
                  <Droplets size={14} className="text-teal-400" />
                  <span className="text-sm text-white">{log.amount}ml</span>
                  <span className="text-xs text-white/30">{log.drinkType}</span>
                </div>
                <span className="text-xs text-white/30">
                  {new Date(log.loggedAt).toLocaleTimeString('tr-TR', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function WaterSkeleton() {
  return (
    <div className="mx-auto max-w-2xl space-y-5 pb-6">
      <div className="h-10 w-48 animate-pulse rounded-xl bg-white/5" />
      <div className="h-72 animate-pulse rounded-3xl bg-white/5" />
      <div className="h-36 animate-pulse rounded-3xl bg-white/5" />
    </div>
  )
}
```

- [ ] **Step 5: Create /api/water/dashboard route**

```ts
// apps/web/app/api/water/dashboard/route.ts
import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/api/with-auth'
import { db } from '@/lib/db/client'

export const GET = withAuth(async (_req, { user }) => {
  const now = new Date()
  const todayStart = new Date(now)
  todayStart.setHours(0, 0, 0, 0)
  const weekStart = new Date(now)
  weekStart.setDate(now.getDate() - 6)
  weekStart.setHours(0, 0, 0, 0)

  const [settings, todayLogs, weekLogs, streak] = await Promise.all([
    db.waterSettings.findFirst({ where: { userId: user.id } }),
    db.waterLog.findMany({ where: { userId: user.id, loggedAt: { gte: todayStart } } }),
    db.waterLog.findMany({
      where: { userId: user.id, loggedAt: { gte: weekStart } },
      orderBy: { loggedAt: 'asc' },
    }),
    db.waterStreak.findFirst({ where: { userId: user.id } }),
  ])

  const goalMl = settings?.dailyGoalMl ?? 2500
  const todayMl = todayLogs.reduce((sum, l) => sum + l.amount, 0)

  // Build weekly data
  const weeklyData = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart)
    d.setDate(weekStart.getDate() + i)
    const dayStart = new Date(d)
    dayStart.setHours(0, 0, 0, 0)
    const dayEnd = new Date(d)
    dayEnd.setHours(23, 59, 59, 999)
    const ml = weekLogs
      .filter((l) => l.loggedAt >= dayStart && l.loggedAt <= dayEnd)
      .reduce((s, l) => s + l.amount, 0)
    return { day: d.toLocaleDateString('tr-TR', { weekday: 'short' }), ml, goal: goalMl }
  })

  return NextResponse.json({
    todayMl,
    goalMl,
    streak: streak?.currentStreak ?? 0,
    weeklyData,
    logs: todayLogs.map((l) => ({
      id: l.id,
      amount: l.amount,
      drinkType: l.drinkType ?? 'water',
      loggedAt: l.loggedAt,
    })),
  })
})
```

- [ ] **Step 6: Commit**

```bash
git add apps/web/app/(dashboard)/dashboard/water/ apps/web/app/api/water/dashboard/
git commit -m "feat(water): rebuild water page with circular progress, quick-add, weekly chart"
```

---

## Chunk 4: Nutrition Page Rebuild

### Task 8: Nutrition Page — FitSecret Tarzı Sıfırdan

**Goal:** Öğün bazlı (kahvaltı/öğle/akşam/atıştırma) kalori + makro takibi. Fotoğraf analizi (OpenAI Vision). Manuel ekleme. Günlük özet.

**Files:**

- Rewrite: `apps/web/app/(dashboard)/dashboard/nutrition/page.tsx`
- Create: `apps/web/app/(dashboard)/dashboard/nutrition/components/MealSection.tsx`
- Create: `apps/web/app/(dashboard)/dashboard/nutrition/components/MacroBar.tsx`
- Create: `apps/web/app/(dashboard)/dashboard/nutrition/components/AddFoodModal.tsx`
- Create: `apps/web/app/(dashboard)/dashboard/nutrition/components/PhotoAnalyzer.tsx`
- Create: `apps/web/app/api/nutrition/today/route.ts`
- Create: `apps/web/app/api/nutrition/analyze-photo/route.ts`
- Existing: `apps/web/app/api/nutrition/` (keep existing routes)

- [ ] **Step 1: Create MacroBar component**

```tsx
// apps/web/app/(dashboard)/dashboard/nutrition/components/MacroBar.tsx
'use client'
import { motion } from 'framer-motion'

interface MacroBarProps {
  label: string
  current: number
  goal: number
  color: string
  unit?: string
}

export function MacroBar({ label, current, goal, color, unit = 'g' }: MacroBarProps) {
  const pct = Math.min(current / Math.max(goal, 1), 1)
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-white/60">{label}</span>
        <span className="font-medium text-white">
          {Math.round(current)}
          <span className="text-white/30">
            /{goal}
            {unit}
          </span>
        </span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/5">
        <motion.div
          className={`h-full rounded-full ${color}`}
          initial={{ width: 0 }}
          animate={{ width: `${pct * 100}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create MealSection component**

```tsx
// apps/web/app/(dashboard)/dashboard/nutrition/components/MealSection.tsx
'use client'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, ChevronDown, Trash2 } from 'lucide-react'
import { useState } from 'react'

interface FoodItem {
  id: string
  name: string
  calories: number
  protein: number
  carbs: number
  fat: number
  amount: number
  unit: string
}

interface MealSectionProps {
  meal: { id: string; label: string; icon: string; color: string; bg: string; border: string }
  items: FoodItem[]
  onAdd: (mealType: string) => void
  onDelete: (mealLogId: string) => void
}

export function MealSection({ meal, items, onAdd, onDelete }: MealSectionProps) {
  const [expanded, setExpanded] = useState(true)
  const totalCal = items.reduce((s, i) => s + i.calories, 0)

  return (
    <div className={`rounded-2xl border ${meal.border} ${meal.bg} overflow-hidden`}>
      <button onClick={() => setExpanded((e) => !e)} className="flex w-full items-center gap-3 p-4">
        <span className="text-xl">{meal.icon}</span>
        <div className="flex-1 text-left">
          <p className="font-bold text-white">{meal.label}</p>
          <p className="text-xs text-white/40">{totalCal} kcal</p>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation()
            onAdd(meal.id)
          }}
          className={`mr-2 rounded-xl p-1.5 ${meal.bg} border ${meal.border}`}
        >
          <Plus size={16} className={meal.color} />
        </button>
        <motion.div animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown size={16} className="text-white/30" />
        </motion.div>
      </button>

      <AnimatePresence>
        {expanded && items.length > 0 && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            className="overflow-hidden"
          >
            <div className="space-y-1 px-4 pb-3">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="bg-white/3 flex items-center justify-between rounded-xl px-3 py-2"
                >
                  <div>
                    <p className="text-sm font-medium text-white">{item.name}</p>
                    <p className="text-xs text-white/30">
                      {item.amount}
                      {item.unit} · P:{item.protein}g K:{item.carbs}g Y:{item.fat}g
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white">{item.calories}</span>
                    <button
                      onClick={() => onDelete(item.id)}
                      className="text-white/20 hover:text-red-400"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
```

- [ ] **Step 3: Create PhotoAnalyzer component**

```tsx
// apps/web/app/(dashboard)/dashboard/nutrition/components/PhotoAnalyzer.tsx
'use client'
import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Camera, Loader2, CheckCircle } from 'lucide-react'

interface AnalyzedFood {
  name: string
  calories: number
  protein: number
  carbs: number
  fat: number
  amount: number
  unit: string
}

interface PhotoAnalyzerProps {
  mealType: string
  onAnalyzed: (foods: AnalyzedFood[]) => void
}

export function PhotoAnalyzer({ mealType, onAnalyzed }: PhotoAnalyzerProps) {
  const [status, setStatus] = useState<'idle' | 'analyzing' | 'done' | 'error'>('idle')
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = async (file: File) => {
    setStatus('analyzing')
    const reader = new FileReader()
    reader.onload = async (e) => {
      const base64 = (e.target?.result as string).split(',')[1]
      const res = await fetch('/api/nutrition/analyze-photo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64, mealType }),
      })
      if (res.ok) {
        const data = await res.json()
        onAnalyzed(data.foods)
        setStatus('done')
        setTimeout(() => setStatus('idle'), 2000)
      } else {
        setStatus('error')
      }
    }
    reader.readAsDataURL(file)
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
      />
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={() => inputRef.current?.click()}
        disabled={status === 'analyzing'}
        className="flex items-center gap-2 rounded-2xl border border-indigo-500/20 bg-indigo-500/10 px-4 py-3 text-sm font-medium text-indigo-300"
      >
        {status === 'analyzing' ? (
          <Loader2 size={16} className="animate-spin" />
        ) : status === 'done' ? (
          <CheckCircle size={16} className="text-green-400" />
        ) : (
          <Camera size={16} />
        )}
        {status === 'analyzing'
          ? 'Analiz ediliyor...'
          : status === 'done'
            ? 'Tamamlandı!'
            : 'Fotoğraf ile Analiz'}
      </motion.button>
    </div>
  )
}
```

- [ ] **Step 4: Create /api/nutrition/today route**

```ts
// apps/web/app/api/nutrition/today/route.ts
import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/api/with-auth'
import { db } from '@/lib/db/client'

export const GET = withAuth(async (_req, { user }) => {
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  const todayEnd = new Date()
  todayEnd.setHours(23, 59, 59, 999)

  const [logs, goal] = await Promise.all([
    db.mealLog.findMany({
      where: { userId: user.id, loggedAt: { gte: todayStart, lte: todayEnd } },
      orderBy: { loggedAt: 'asc' },
    }),
    db.nutritionGoal.findFirst({ where: { userId: user.id } }),
  ])

  const totals = logs.reduce(
    (acc, l) => ({
      calories: acc.calories + (l.calories ?? 0),
      protein: acc.protein + (l.protein ?? 0),
      carbs: acc.carbs + (l.carbs ?? 0),
      fat: acc.fat + (l.fat ?? 0),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  )

  const byMeal: Record<string, typeof logs> = {
    breakfast: [],
    lunch: [],
    dinner: [],
    snack: [],
  }
  logs.forEach((l) => {
    const type = (l.mealType ?? 'snack') as string
    if (byMeal[type]) byMeal[type].push(l)
    else byMeal.snack.push(l)
  })

  return NextResponse.json({
    totals,
    goal: {
      calories: goal?.dailyCalories ?? 2200,
      protein: goal?.proteinG ?? 150,
      carbs: goal?.carbsG ?? 220,
      fat: goal?.fatG ?? 70,
    },
    meals: byMeal,
  })
})
```

- [ ] **Step 5: Create /api/nutrition/analyze-photo route**

```ts
// apps/web/app/api/nutrition/analyze-photo/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/api/with-auth'
import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export const POST = withAuth(async (req: NextRequest, { user: _ }) => {
  const { image, mealType } = (await req.json()) as { image: string; mealType: string }

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content:
          'Sen bir diyetisyen AI asistanısın. Yemek fotoğrafını analiz et ve besin değerlerini JSON formatında döndür. Her zaman Türkçe yemek isimleri kullan.',
      },
      {
        role: 'user',
        content: [
          {
            type: 'image_url',
            image_url: { url: `data:image/jpeg;base64,${image}`, detail: 'low' },
          },
          {
            type: 'text',
            text: `Bu yemeği analiz et ve şu JSON formatında döndür: {"foods": [{"name": "Yemek adı", "calories": 0, "protein": 0, "carbs": 0, "fat": 0, "amount": 100, "unit": "g"}]}. Öğün tipi: ${mealType}.`,
          },
        ],
      },
    ],
  })

  const content = response.choices[0]?.message?.content ?? '{}'
  return NextResponse.json(JSON.parse(content))
})
```

- [ ] **Step 6: Rewrite nutrition/page.tsx**

Full page with:

- Daily summary ring (calories remaining)
- Macro bars (protein/carbs/fat)
- 4 meal sections (breakfast/lunch/dinner/snack)
- Photo analyzer button
- Add food modal (manual entry)

```tsx
// apps/web/app/(dashboard)/dashboard/nutrition/page.tsx
'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Utensils } from 'lucide-react'
import { MacroBar } from './components/MacroBar'
import { MealSection } from './components/MealSection'
import { PhotoAnalyzer } from './components/PhotoAnalyzer'

const MEALS = [
  {
    id: 'breakfast',
    label: 'Kahvaltı',
    icon: '🌅',
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/20',
  },
  {
    id: 'lunch',
    label: 'Öğle',
    icon: '☀️',
    color: 'text-orange-400',
    bg: 'bg-orange-500/10',
    border: 'border-orange-500/20',
  },
  {
    id: 'dinner',
    label: 'Akşam',
    icon: '🌙',
    color: 'text-indigo-400',
    bg: 'bg-indigo-500/10',
    border: 'border-indigo-500/20',
  },
  {
    id: 'snack',
    label: 'Atıştırma',
    icon: '🍎',
    color: 'text-green-400',
    bg: 'bg-green-500/10',
    border: 'border-green-500/20',
  },
]

interface NutritionData {
  totals: { calories: number; protein: number; carbs: number; fat: number }
  goal: { calories: number; protein: number; carbs: number; fat: number }
  meals: Record<string, any[]>
}

export default function NutritionPage() {
  const [data, setData] = useState<NutritionData | null>(null)
  const [loading, setLoading] = useState(true)
  const [addingTo, setAddingTo] = useState<string | null>(null)
  const [manualForm, setManualForm] = useState({
    name: '',
    calories: '',
    protein: '',
    carbs: '',
    fat: '',
    amount: '100',
  })

  const fetchData = useCallback(async () => {
    const res = await fetch('/api/nutrition/today')
    if (res.ok) setData(await res.json())
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const addManual = async () => {
    if (!addingTo || !manualForm.name) return
    await fetch('/api/nutrition/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mealType: addingTo,
        name: manualForm.name,
        calories: parseFloat(manualForm.calories) || 0,
        protein: parseFloat(manualForm.protein) || 0,
        carbs: parseFloat(manualForm.carbs) || 0,
        fat: parseFloat(manualForm.fat) || 0,
        amount: parseFloat(manualForm.amount) || 100,
      }),
    })
    setAddingTo(null)
    setManualForm({ name: '', calories: '', protein: '', carbs: '', fat: '', amount: '100' })
    await fetchData()
  }

  const deleteLog = async (id: string) => {
    await fetch(`/api/nutrition/log/${id}`, { method: 'DELETE' })
    await fetchData()
  }

  const remaining = (data?.goal.calories ?? 2200) - (data?.totals.calories ?? 0)
  const remPct = Math.max(0, remaining / (data?.goal.calories ?? 2200))

  return (
    <div className="mx-auto max-w-2xl space-y-4 pb-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-orange-500/20">
          <Utensils size={20} className="text-orange-400" />
        </div>
        <div>
          <h1 className="text-xl font-black text-white">Beslenme</h1>
          <p className="text-xs text-white/40">Günlük öğün ve makro takibi</p>
        </div>
      </div>

      {/* Calorie summary */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-3xl p-5"
      >
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-3xl font-black text-white">{data?.totals.calories ?? 0}</p>
            <p className="text-xs text-white/40">/ {data?.goal.calories ?? 2200} kcal</p>
          </div>
          <div className="text-right">
            <p
              className={`text-lg font-black ${remaining >= 0 ? 'text-green-400' : 'text-red-400'}`}
            >
              {remaining >= 0 ? remaining : Math.abs(remaining)}
            </p>
            <p className="text-xs text-white/40">{remaining >= 0 ? 'kalan' : 'aşıldı'}</p>
          </div>
        </div>

        <div className="space-y-3">
          <MacroBar
            label="Protein"
            current={data?.totals.protein ?? 0}
            goal={data?.goal.protein ?? 150}
            color="bg-blue-500"
          />
          <MacroBar
            label="Karbonhidrat"
            current={data?.totals.carbs ?? 0}
            goal={data?.goal.carbs ?? 220}
            color="bg-amber-500"
          />
          <MacroBar
            label="Yağ"
            current={data?.totals.fat ?? 0}
            goal={data?.goal.fat ?? 70}
            color="bg-rose-500"
          />
        </div>
      </motion.div>

      {/* Photo analyzer */}
      <PhotoAnalyzer
        mealType={addingTo ?? 'snack'}
        onAnalyzed={async (foods) => {
          for (const food of foods) {
            await fetch('/api/nutrition/log', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ mealType: addingTo ?? 'snack', ...food }),
            })
          }
          await fetchData()
        }}
      />

      {/* Meal sections */}
      <div className="space-y-3">
        {MEALS.map((meal, i) => (
          <motion.div
            key={meal.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
          >
            <MealSection
              meal={meal}
              items={(data?.meals[meal.id] ?? []).map((l: any) => ({
                id: l.id,
                name: l.name ?? l.foodName ?? 'Bilinmiyor',
                calories: l.calories ?? 0,
                protein: l.protein ?? 0,
                carbs: l.carbs ?? 0,
                fat: l.fat ?? 0,
                amount: l.amount ?? 100,
                unit: l.unit ?? 'g',
              }))}
              onAdd={(mealType) => setAddingTo(mealType)}
              onDelete={deleteLog}
            />
          </motion.div>
        ))}
      </div>

      {/* Manual add modal */}
      {addingTo && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={() => setAddingTo(null)}
        >
          <motion.div
            className="w-full max-w-lg rounded-t-3xl border-t border-white/10 bg-[#0a0f1e] p-6 pb-10"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="mb-4 text-lg font-bold text-white">Yemek Ekle</h3>
            <div className="space-y-3">
              {[
                { key: 'name', label: 'Yemek adı', type: 'text' },
                { key: 'calories', label: 'Kalori (kcal)', type: 'number' },
                { key: 'protein', label: 'Protein (g)', type: 'number' },
                { key: 'carbs', label: 'Karbonhidrat (g)', type: 'number' },
                { key: 'fat', label: 'Yağ (g)', type: 'number' },
              ].map((f) => (
                <input
                  key={f.key}
                  type={f.type}
                  placeholder={f.label}
                  value={manualForm[f.key as keyof typeof manualForm]}
                  onChange={(e) => setManualForm((prev) => ({ ...prev, [f.key]: e.target.value }))}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-white/30 outline-none focus:border-indigo-500/50"
                />
              ))}
              <button
                onClick={addManual}
                className="w-full rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 py-3 font-bold text-white"
              >
                Ekle
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  )
}
```

- [ ] **Step 7: Create /api/nutrition/log route (POST + DELETE)**

Check if existing route handles these. If not:

```ts
// apps/web/app/api/nutrition/log/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/api/with-auth'
import { db } from '@/lib/db/client'

export const POST = withAuth(async (req: NextRequest, { user }) => {
  const body = await req.json()
  const log = await db.mealLog.create({
    data: {
      userId: user.id,
      mealType: body.mealType ?? 'snack',
      name: body.name,
      calories: body.calories ?? 0,
      protein: body.protein ?? 0,
      carbs: body.carbs ?? 0,
      fat: body.fat ?? 0,
      amount: body.amount ?? 100,
      unit: body.unit ?? 'g',
      loggedAt: new Date(),
    },
  })
  return NextResponse.json(log)
})
```

- [ ] **Step 8: Check MealLog schema has all needed fields, run prisma db push if needed**

```bash
grep -A 25 "^model MealLog " apps/web/prisma/schema.prisma
```

If `name`, `mealType`, `protein`, `carbs`, `fat`, `amount`, `unit` fields missing, add them to schema and:

```bash
cd apps/web && npx prisma db push
```

- [ ] **Step 9: Commit**

```bash
git add apps/web/app/(dashboard)/dashboard/nutrition/ apps/web/app/api/nutrition/
git commit -m "feat(nutrition): rebuild nutrition page with meal sections, macro bars, photo analysis"
```

---

## Chunk 5: Health Tracking Module

### Task 9: Sağlık Takibi Prisma Schema

**Goal:** `HealthMetricLog` modeli ekle — tansiyon, nabız, kan şekeri, ateş, vücut yağı, ruh hali, enerji. Kilo için mevcut `WeightEntry` kullanılır.

**Files:**

- Modify: `apps/web/prisma/schema.prisma`

- [ ] **Step 1: Add HealthMetricLog model**

```prisma
model HealthMetricLog {
  id         String   @id @default(cuid())
  userId     String
  user       User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  type       String   // "blood_pressure" | "heart_rate" | "blood_glucose" | "temperature" | "body_fat" | "mood" | "energy"
  value      Float    // primary value
  value2     Float?   // secondary (e.g. diastolic for blood pressure)
  unit       String   // "mmHg" | "bpm" | "mg/dL" | "°C" | "%" | "1-10"
  note       String?

  recordedAt DateTime @default(now())
  createdAt  DateTime @default(now())

  @@index([userId])
  @@index([userId, type])
  @@index([recordedAt])
}
```

Also add relation to User model:

```prisma
healthMetricLogs HealthMetricLog[]
```

- [ ] **Step 2: Run prisma db push**

```bash
cd apps/web && npx prisma db push
```

- [ ] **Step 3: Commit schema**

```bash
git add apps/web/prisma/schema.prisma
git commit -m "feat(health-tracking): add HealthMetricLog schema"
```

---

### Task 10: Health Tracking API Routes

**Files:**

- Create: `apps/web/app/api/health-metrics/route.ts`
- Create: `apps/web/app/api/health-metrics/[type]/route.ts`

- [ ] **Step 1: Create /api/health-metrics route (GET + POST)**

```ts
// apps/web/app/api/health-metrics/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/api/with-auth'
import { db } from '@/lib/db/client'

// GET: son 30 günlük tüm metrikler (veya type query param ile filtreleme)
export const GET = withAuth(async (req: NextRequest, { user }) => {
  const { searchParams } = new URL(req.url)
  const type = searchParams.get('type')
  const days = parseInt(searchParams.get('days') ?? '30')

  const since = new Date()
  since.setDate(since.getDate() - days)

  const logs = await db.healthMetricLog.findMany({
    where: {
      userId: user.id,
      ...(type ? { type } : {}),
      recordedAt: { gte: since },
    },
    orderBy: { recordedAt: 'desc' },
    take: 100,
  })

  return NextResponse.json(logs)
})

// POST: yeni metrik ekle
export const POST = withAuth(async (req: NextRequest, { user }) => {
  const body = (await req.json()) as {
    type: string
    value: number
    value2?: number
    unit: string
    note?: string
    recordedAt?: string
  }

  const log = await db.healthMetricLog.create({
    data: {
      userId: user.id,
      type: body.type,
      value: body.value,
      value2: body.value2,
      unit: body.unit,
      note: body.note,
      recordedAt: body.recordedAt ? new Date(body.recordedAt) : new Date(),
    },
  })

  return NextResponse.json(log)
})
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/app/api/health-metrics/
git commit -m "feat(health-tracking): add health metrics API routes"
```

---

### Task 11: Health Tracking Page & Widget in Tracking Hub

**Files:**

- Create: `apps/web/app/(dashboard)/dashboard/health-metrics/page.tsx`
- Modify: `apps/web/app/(dashboard)/dashboard/tracking/page.tsx`

- [ ] **Step 1: Create health-metrics page**

```tsx
// apps/web/app/(dashboard)/dashboard/health-metrics/page.tsx
'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Heart, Activity, Thermometer, Droplets, Scale, Brain, Zap, Plus, X } from 'lucide-react'

const METRIC_TYPES = [
  {
    id: 'blood_pressure',
    label: 'Tansiyon',
    icon: Activity,
    color: 'text-red-400',
    bg: 'bg-red-500/10',
    border: 'border-red-500/20',
    unit: 'mmHg',
    fields: [
      { key: 'value', label: 'Sistolik', placeholder: '120' },
      { key: 'value2', label: 'Diyastolik', placeholder: '80' },
    ],
    format: (v: number, v2?: number) => `${v}/${v2 ?? '?'} mmHg`,
  },
  {
    id: 'heart_rate',
    label: 'Nabız',
    icon: Heart,
    color: 'text-pink-400',
    bg: 'bg-pink-500/10',
    border: 'border-pink-500/20',
    unit: 'bpm',
    fields: [{ key: 'value', label: 'Nabız', placeholder: '72' }],
    format: (v: number) => `${v} bpm`,
  },
  {
    id: 'blood_glucose',
    label: 'Kan Şekeri',
    icon: Droplets,
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/20',
    unit: 'mg/dL',
    fields: [{ key: 'value', label: 'Değer', placeholder: '100' }],
    format: (v: number) => `${v} mg/dL`,
  },
  {
    id: 'temperature',
    label: 'Ateş',
    icon: Thermometer,
    color: 'text-orange-400',
    bg: 'bg-orange-500/10',
    border: 'border-orange-500/20',
    unit: '°C',
    fields: [{ key: 'value', label: 'Derece', placeholder: '36.6' }],
    format: (v: number) => `${v}°C`,
  },
  {
    id: 'body_fat',
    label: 'Vücut Yağı',
    icon: Scale,
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/20',
    unit: '%',
    fields: [{ key: 'value', label: 'Yüzde', placeholder: '20' }],
    format: (v: number) => `%${v}`,
  },
  {
    id: 'mood',
    label: 'Ruh Hali',
    icon: Brain,
    color: 'text-purple-400',
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/20',
    unit: '/10',
    fields: [{ key: 'value', label: 'Puan (1-10)', placeholder: '7' }],
    format: (v: number) => `${v}/10`,
  },
  {
    id: 'energy',
    label: 'Enerji',
    icon: Zap,
    color: 'text-green-400',
    bg: 'bg-green-500/10',
    border: 'border-green-500/20',
    unit: '/10',
    fields: [{ key: 'value', label: 'Puan (1-10)', placeholder: '8' }],
    format: (v: number) => `${v}/10`,
  },
]

interface MetricLog {
  id: string
  type: string
  value: number
  value2?: number
  unit: string
  recordedAt: string
}

export default function HealthMetricsPage() {
  const [logs, setLogs] = useState<MetricLog[]>([])
  const [loading, setLoading] = useState(true)
  const [addingType, setAddingType] = useState<string | null>(null)
  const [form, setForm] = useState<Record<string, string>>({})

  const fetchLogs = useCallback(async () => {
    const res = await fetch('/api/health-metrics')
    if (res.ok) setLogs(await res.json())
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchLogs()
  }, [fetchLogs])

  const submit = async () => {
    const metricDef = METRIC_TYPES.find((m) => m.id === addingType)
    if (!metricDef) return
    await fetch('/api/health-metrics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: addingType,
        value: parseFloat(form.value ?? '0'),
        value2: form.value2 ? parseFloat(form.value2) : undefined,
        unit: metricDef.unit,
      }),
    })
    setAddingType(null)
    setForm({})
    await fetchLogs()
  }

  const latestByType = (type: string) => logs.find((l) => l.type === type)

  return (
    <div className="mx-auto max-w-2xl space-y-4 pb-6">
      <div>
        <h1 className="text-xl font-black text-white">Sağlık Takibi</h1>
        <p className="text-xs text-white/40">Vücut metriklerini takip et ve analiz et</p>
      </div>

      {/* Metric widgets grid */}
      <div className="grid grid-cols-2 gap-3">
        {METRIC_TYPES.map((metric, i) => {
          const latest = latestByType(metric.id)
          const Icon = metric.icon
          return (
            <motion.div
              key={metric.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              whileTap={{ scale: 0.97 }}
            >
              <button
                onClick={() => {
                  setAddingType(metric.id)
                  setForm({})
                }}
                className={`w-full rounded-2xl border ${metric.border} ${metric.bg} p-4 text-left`}
              >
                <div className="mb-2 flex items-center justify-between">
                  <Icon size={18} className={metric.color} />
                  <Plus size={14} className="text-white/20" />
                </div>
                <p className="text-xs font-medium text-white/50">{metric.label}</p>
                <p className={`text-lg font-black ${latest ? 'text-white' : 'text-white/20'}`}>
                  {latest ? metric.format(latest.value, latest.value2) : '—'}
                </p>
                {latest && (
                  <p className="mt-0.5 text-[10px] text-white/30">
                    {new Date(latest.recordedAt).toLocaleDateString('tr-TR')}
                  </p>
                )}
              </button>
            </motion.div>
          )
        })}
      </div>

      {/* Recent logs */}
      {logs.length > 0 && (
        <div className="glass-card rounded-3xl p-4">
          <p className="mb-3 text-sm font-semibold text-white/60">Son Ölçümler</p>
          <div className="space-y-2">
            {logs.slice(0, 10).map((log) => {
              const def = METRIC_TYPES.find((m) => m.id === log.type)
              if (!def) return null
              const Icon = def.icon
              return (
                <div
                  key={log.id}
                  className="bg-white/3 flex items-center gap-3 rounded-xl px-3 py-2"
                >
                  <Icon size={14} className={def.color} />
                  <span className="flex-1 text-sm text-white/70">{def.label}</span>
                  <span className="text-sm font-bold text-white">
                    {def.format(log.value, log.value2)}
                  </span>
                  <span className="text-xs text-white/30">
                    {new Date(log.recordedAt).toLocaleDateString('tr-TR', {
                      day: '2-digit',
                      month: '2-digit',
                    })}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Add metric modal */}
      <AnimatePresence>
        {addingType && (
          <motion.div
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setAddingType(null)}
          >
            <motion.div
              className="w-full max-w-lg rounded-t-3xl border-t border-white/10 bg-[#0a0f1e] p-6 pb-10"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              onClick={(e) => e.stopPropagation()}
            >
              {(() => {
                const def = METRIC_TYPES.find((m) => m.id === addingType)!
                const Icon = def.icon
                return (
                  <>
                    <div className="mb-5 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`rounded-xl p-2 ${def.bg}`}>
                          <Icon size={20} className={def.color} />
                        </div>
                        <h3 className="text-lg font-bold text-white">{def.label} Ekle</h3>
                      </div>
                      <button onClick={() => setAddingType(null)}>
                        <X size={20} className="text-white/40" />
                      </button>
                    </div>
                    <div className="space-y-3">
                      {def.fields.map((field) => (
                        <div key={field.key}>
                          <label className="mb-1 block text-xs text-white/50">{field.label}</label>
                          <input
                            type="number"
                            step="0.1"
                            placeholder={field.placeholder}
                            value={form[field.key] ?? ''}
                            onChange={(e) =>
                              setForm((prev) => ({ ...prev, [field.key]: e.target.value }))
                            }
                            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-lg font-bold text-white placeholder-white/20 outline-none focus:border-indigo-500/50"
                          />
                        </div>
                      ))}
                      <button
                        onClick={submit}
                        className="w-full rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 py-3 font-bold text-white"
                      >
                        Kaydet
                      </button>
                    </div>
                  </>
                )
              })()}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
```

- [ ] **Step 2: Add health metrics to tracking hub**

In `apps/web/app/(dashboard)/dashboard/tracking/page.tsx`, add new module:

```tsx
{
  href: '/dashboard/health-metrics',
  icon: Heart,
  label: 'Sağlık Takibi',
  desc: 'Tansiyon, nabız, kan şekeri ve daha fazlası',
  gradient: 'from-red-500 to-pink-500',
  bg: 'bg-red-500/10',
  border: 'border-red-500/20',
},
```

Import `Heart` from lucide-react.

- [ ] **Step 3: Commit**

```bash
git add apps/web/app/(dashboard)/dashboard/health-metrics/ apps/web/app/(dashboard)/dashboard/tracking/
git commit -m "feat(health-tracking): complete health metrics page with 7 metric types"
```

---

## Chunk 6: Sleep Page Overhaul

### Task 12: Sleep Page — Görsel & Veri Geliştirme

**Goal:** Uyku sayfasını tamamen yenile. Sleep score ring, quality chart, bed/wake time log, 7-günlük trend, readiness score.

**Files:**

- Rewrite: `apps/web/app/(dashboard)/dashboard/sleep/page.tsx`
- Create: `apps/web/app/api/sleep/dashboard/route.ts`

- [ ] **Step 1: Create /api/sleep/dashboard**

```ts
// apps/web/app/api/sleep/dashboard/route.ts
import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/api/with-auth'
import { db } from '@/lib/db/client'

export const GET = withAuth(async (_req, { user }) => {
  const weekAgo = new Date()
  weekAgo.setDate(weekAgo.getDate() - 7)

  const [records, readiness] = await Promise.all([
    db.sleepRecord.findMany({
      where: { userId: user.id, recordedAt: { gte: weekAgo } },
      orderBy: { recordedAt: 'desc' },
    }),
    db.readinessScore.findFirst({
      where: { userId: user.id },
      orderBy: { recordedAt: 'desc' },
    }),
  ])

  const latest = records[0]
  const avgQuality =
    records.length > 0 ? Math.round(records.reduce((s, r) => s + r.quality, 0) / records.length) : 0
  const avgDuration =
    records.length > 0
      ? Math.round(records.reduce((s, r) => s + r.duration, 0) / records.length)
      : 0

  return NextResponse.json({
    latest: latest
      ? {
          duration: latest.duration, // minutes
          quality: latest.quality,
          recordedAt: latest.recordedAt,
        }
      : null,
    avgQuality,
    avgDurationMin: avgDuration,
    readinessScore: readiness?.score ?? null,
    weeklyRecords: records.reverse().map((r) => ({
      day: new Date(r.recordedAt).toLocaleDateString('tr-TR', { weekday: 'short' }),
      duration: r.duration,
      quality: r.quality,
      recordedAt: r.recordedAt,
    })),
  })
})
```

- [ ] **Step 2: Rewrite sleep/page.tsx**

```tsx
// apps/web/app/(dashboard)/dashboard/sleep/page.tsx
'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Moon, Sun, Star, Clock, TrendingUp, Plus, X } from 'lucide-react'

interface SleepData {
  latest: { duration: number; quality: number; recordedAt: string } | null
  avgQuality: number
  avgDurationMin: number
  readinessScore: number | null
  weeklyRecords: { day: string; duration: number; quality: number; recordedAt: string }[]
}

function QualityRing({ score, size = 140 }: { score: number; size?: number }) {
  const r = (size - 16) / 2
  const circ = 2 * Math.PI * r
  const offset = circ * (1 - score / 100)
  const color = score >= 80 ? '#818cf8' : score >= 60 ? '#a78bfa' : '#f87171'

  return (
    <div
      className="relative flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="rgba(129,140,248,0.1)"
          strokeWidth={10}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={10}
          strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-3xl font-black text-white">{score}</span>
        <span className="text-xs text-white/40">kalite</span>
      </div>
    </div>
  )
}

export default function SleepPage() {
  const [data, setData] = useState<SleepData | null>(null)
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ bedTime: '23:00', wakeTime: '07:00', quality: '75' })

  const fetchData = useCallback(async () => {
    const res = await fetch('/api/sleep/dashboard')
    if (res.ok) setData(await res.json())
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const logSleep = async () => {
    const [bh, bm] = form.bedTime.split(':').map(Number)
    const [wh, wm] = form.wakeTime.split(':').map(Number)
    let duration = wh * 60 + wm - (bh * 60 + bm)
    if (duration < 0) duration += 24 * 60

    const recordedAt = new Date()
    recordedAt.setHours(wh, wm, 0, 0)

    await fetch('/api/tracking/sleep', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ duration, quality: parseFloat(form.quality), recordedAt }),
    })
    setShowAdd(false)
    await fetchData()
  }

  const hours = (min: number) => `${Math.floor(min / 60)}s ${min % 60}dk`
  const latestHours = data?.latest ? hours(data.latest.duration) : '—'
  const avgHours = data?.avgDurationMin ? hours(data.avgDurationMin) : '—'

  return (
    <div className="mx-auto max-w-2xl space-y-4 pb-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-purple-500/20">
            <Moon size={20} className="text-purple-400" />
          </div>
          <div>
            <h1 className="text-xl font-black text-white">Uyku</h1>
            <p className="text-xs text-white/40">Uyku kalitesi ve analizi</p>
          </div>
        </div>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 rounded-xl border border-purple-500/20 bg-purple-500/10 px-3 py-2 text-sm font-medium text-purple-300"
        >
          <Plus size={16} /> Kaydet
        </motion.button>
      </div>

      {/* Hero: Quality Ring + Stats */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-3xl p-5"
      >
        <div className="flex items-center gap-6">
          <QualityRing score={data?.latest?.quality ?? data?.avgQuality ?? 0} />
          <div className="flex-1 space-y-4">
            <div>
              <p className="text-xs text-white/40">Son Uyku</p>
              <p className="text-2xl font-black text-white">{latestHours}</p>
            </div>
            <div>
              <p className="text-xs text-white/40">Haftalık Ortalama</p>
              <p className="text-lg font-bold text-purple-300">{avgHours}</p>
            </div>
            {data?.readinessScore && (
              <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/10 px-3 py-2">
                <p className="text-xs text-white/40">Hazırlık Skoru</p>
                <p className="text-lg font-black text-indigo-300">{data.readinessScore}/100</p>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Weekly chart */}
      {data?.weeklyRecords && data.weeklyRecords.length > 0 && (
        <div className="glass-card rounded-3xl p-4">
          <p className="mb-4 text-sm font-semibold text-white/60">Bu Hafta</p>
          <div className="flex items-end justify-between gap-2">
            {data.weeklyRecords.map((r, i) => {
              const pct = Math.min(r.duration / (9 * 60), 1)
              const qColor =
                r.quality >= 80
                  ? 'from-indigo-500 to-purple-500'
                  : r.quality >= 60
                    ? 'from-purple-500 to-violet-600'
                    : 'from-red-500 to-rose-500'
              return (
                <div key={i} className="flex flex-1 flex-col items-center gap-1">
                  <div className="relative flex h-24 w-full items-end rounded-lg bg-white/5">
                    <motion.div
                      className={`w-full rounded-lg bg-gradient-to-t ${qColor}`}
                      initial={{ height: 0 }}
                      animate={{ height: `${pct * 100}%` }}
                      transition={{ delay: i * 0.07, duration: 0.6, ease: 'easeOut' }}
                    />
                  </div>
                  <span className="text-[10px] text-white/30">{r.day}</span>
                  <span className="text-[10px] font-medium text-purple-400">
                    {Math.floor(r.duration / 60)}s
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Stats cards */}
      <div className="grid grid-cols-3 gap-3">
        {[
          {
            label: 'Ortalama Kalite',
            value: `${data?.avgQuality ?? 0}%`,
            icon: Star,
            color: 'text-yellow-400',
          },
          { label: 'Ortalama Süre', value: avgHours, icon: Clock, color: 'text-blue-400' },
          {
            label: 'Kayıt Sayısı',
            value: `${data?.weeklyRecords.length ?? 0}`,
            icon: TrendingUp,
            color: 'text-green-400',
          },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + i * 0.07 }}
            className="glass-card rounded-2xl p-3 text-center"
          >
            <stat.icon size={16} className={`${stat.color} mx-auto mb-1`} />
            <p className="text-base font-black text-white">{stat.value}</p>
            <p className="text-[10px] text-white/40">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Sleep tips */}
      <div className="glass-card rounded-3xl p-4">
        <p className="mb-3 text-sm font-semibold text-white/60">Uyku İpuçları</p>
        <div className="space-y-2">
          {[
            { icon: '🌙', tip: 'Her gece aynı saatte uyu ve uyan' },
            { icon: '📱', tip: 'Yatmadan 1 saat önce ekrana bakmayı bırak' },
            { icon: '🌡️', tip: "Oda sıcaklığını 18-20°C'de tut" },
            { icon: '☕', tip: 'Öğleden sonra kafein tüketimini azalt' },
          ].map((item, i) => (
            <div key={i} className="bg-white/3 flex items-center gap-3 rounded-xl px-3 py-2">
              <span className="text-base">{item.icon}</span>
              <p className="text-sm text-white/60">{item.tip}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Add sleep modal */}
      <AnimatePresence>
        {showAdd && (
          <motion.div
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowAdd(false)}
          >
            <motion.div
              className="w-full max-w-lg rounded-t-3xl border-t border-white/10 bg-[#0a0f1e] p-6 pb-10"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-5 flex items-center justify-between">
                <h3 className="text-lg font-bold text-white">Uyku Kaydet</h3>
                <button onClick={() => setShowAdd(false)}>
                  <X size={20} className="text-white/40" />
                </button>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-xs text-white/50">Yatış Saati</label>
                    <input
                      type="time"
                      value={form.bedTime}
                      onChange={(e) => setForm((p) => ({ ...p, bedTime: e.target.value }))}
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-purple-500/50"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-white/50">Uyanış Saati</label>
                    <input
                      type="time"
                      value={form.wakeTime}
                      onChange={(e) => setForm((p) => ({ ...p, wakeTime: e.target.value }))}
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-purple-500/50"
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-xs text-white/50">Kalite (0-100)</label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={form.quality}
                    onChange={(e) => setForm((p) => ({ ...p, quality: e.target.value }))}
                    className="w-full accent-purple-500"
                  />
                  <p className="mt-1 text-center text-sm font-bold text-purple-400">
                    {form.quality}/100
                  </p>
                </div>
                <button
                  onClick={logSleep}
                  className="w-full rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 py-3 font-bold text-white"
                >
                  Kaydet
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add apps/web/app/(dashboard)/dashboard/sleep/ apps/web/app/api/sleep/dashboard/
git commit -m "feat(sleep): rebuild sleep page with quality ring, weekly chart, bed/wake time logging"
```

---

## Chunk 7: Supplements & Medications Fix + UI Overhaul

### Task 13: Fix Supplements Page (500 Error → Full UI)

**Files:**

- Read & fix: `apps/web/app/(dashboard)/dashboard/supplements/page.tsx`
- Fix: `apps/web/app/api/tracking/supplements/route.ts` (add error handling)

- [ ] **Step 1: Check supplements page for the 500 root cause**

Add error logging to API route, open supplements page, read terminal logs.

- [ ] **Step 2: Fix schema mismatch if any**

Check `SupplementLog` has `userId` field:

```bash
grep -A 15 "^model SupplementLog" apps/web/prisma/schema.prisma
```

If `userId` missing from `SupplementLog`, either add it or remove it from the create query.

- [ ] **Step 3: Rewrite supplements/page.tsx with full UI**

Modern card layout. Each supplement: name, dosage, timing badge, "Al" button with checkmark animation.

- [ ] **Step 4: Commit**

```bash
git commit -m "fix(supplements): resolve 500 error and rebuild supplements page UI"
```

---

### Task 14: Fix Medications Page (500 Error → Full UI)

Same pattern as Task 13 but for medications.

**Files:**

- Fix: `apps/web/app/api/tracking/medications/route.ts`
- Rewrite: `apps/web/app/(dashboard)/dashboard/medications/page.tsx`

- [ ] **Step 1: Add error logging, read terminal**
- [ ] **Step 2: Fix schema mismatch**
- [ ] **Step 3: Rewrite medications/page.tsx**
- [ ] **Step 4: Commit**

```bash
git commit -m "fix(medications): resolve 500 error and rebuild medications page UI"
```

---

## Summary

| Chunk | Tasks | What it delivers                                    |
| ----- | ----- | --------------------------------------------------- |
| 1     | 1-2   | Mesh gradient bg, MoreSheet BottomNav               |
| 2     | 3-6   | Fix roadmap/supplements/medications/pet/VAPI errors |
| 3     | 7     | Water page rebuild                                  |
| 4     | 8     | Nutrition page rebuild (FitSecret style)            |
| 5     | 9-11  | Health Tracking module                              |
| 6     | 12    | Sleep page overhaul                                 |
| 7     | 13-14 | Supplements & Medications fix + UI                  |

**Total: 14 tasks**

**Execution order:** Chunks must be sequential (each builds on previous). Within a chunk, tasks are sequential.
