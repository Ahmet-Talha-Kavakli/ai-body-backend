# Health Dashboard Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `/dashboard/health` sayfasını 6 tab'lı kapsamlı bir sağlık merkezi olarak sıfırdan yeniden yaz — Google Fit / Garmin / Fitbit OAuth entegrasyonu, manuel giriş, AI önerileri, vücut ölçüleri takibi ve bildirim tercihleri dahil.

**Architecture:** Tab-based layout (Genel Bakış · Aktivite · Uyku · Su · Vücut · Cihazlar). Her tab kendi API endpoint'inden veri çeker, Recharts ile görselleştirir, ve sayfanın altında contextual AI insight kartı gösterir. Cihaz entegrasyonu OAuth flow ile Google Fit / Garmin / Fitbit API'larını backend üzerinden bağlar.

**Tech Stack:** Next.js 14 App Router, Prisma, Clerk auth, Recharts, Framer Motion, Tailwind CSS, Lucide React

**Design System:**

- Style: Dark glassmorphism — `bg-card/80 backdrop-blur border border-border/30`
- Colors: Her tab'a ait accent rengi (Aktivite: purple, Uyku: indigo, Su: blue, Vücut: emerald, Cihazlar: slate)
- Typography: font-black başlıklar, text-muted-foreground alt metinler
- Animation: Framer Motion — stagger kartlar (delay 0.08s), bar chart fill animasyonu (0.8s), ring progress animasyonu
- Charts: Recharts — AreaChart (trendler), BarChart (haftalık), RadialBarChart (hedef ring)
- Touch targets: min 44x44px, cursor-pointer her interaktif element
- Contrast: 4.5:1 minimum, her iki mod test edilecek

---

## Chunk 1: Database & API Foundation

### Task 1: Prisma Schema Genişletme

**Files:**

- Modify: `apps/web/prisma/schema.prisma`
- Create: `apps/web/prisma/migrations/` (otomatik)

WeightEntry modeli yok, HealthGoal modeli yok. Bunları ekle.

- [ ] **Step 1: schema.prisma'ya WeightEntry ve HealthGoal modellerini ekle**

```prisma
model WeightEntry {
  id         String   @id @default(cuid())
  userId     String
  user       User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  weightKg   Float
  note       String?
  recordedAt DateTime @default(now())

  @@index([userId])
  @@index([recordedAt])
}

model HealthGoal {
  id              String   @id @default(cuid())
  userId          String   @unique
  user            User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  dailySteps      Int      @default(10000)
  sleepHours      Float    @default(8.0)
  waterMl         Float    @default(2500)
  targetWeightKg  Float?
  updatedAt       DateTime @updatedAt
}
```

User modeline ilişkileri ekle:

```prisma
weightEntries WeightEntry[]
healthGoal    HealthGoal?
```

- [ ] **Step 2: Migration çalıştır**

```bash
cd apps/web && npx prisma migrate dev --name add_weight_and_health_goals
```

Expected: Migration başarılı, client güncellendi.

- [ ] **Step 3: Commit**

```bash
git add apps/web/prisma/
git commit -m "feat(health): add WeightEntry and HealthGoal models"
```

---

### Task 2: Health API Routes Yeniden Yaz

**Files:**

- Modify: `apps/web/app/api/health/route.ts`
- Create: `apps/web/app/api/health/goals/route.ts`
- Create: `apps/web/app/api/health/weight/route.ts`
- Create: `apps/web/app/api/health/activity/route.ts`
- Create: `apps/web/app/api/health/sleep/route.ts`
- Create: `apps/web/app/api/health/devices/route.ts`
- Create: `apps/web/app/api/health/devices/connect/route.ts`
- Create: `apps/web/app/api/health/manual/route.ts`

- [ ] **Step 1: `/api/health/route.ts` — Genel Bakış verisi**

```typescript
import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db/client'

export async function GET() {
  const { userId: clerkId } = await auth()
  if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await db.user.findUnique({
    where: { clerkId },
    include: {
      healthProfile: true,
      healthGoal: true,
    },
  })
  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const weekAgo = new Date()
  weekAgo.setDate(weekAgo.getDate() - 7)

  const [readings, devices, weightEntries] = await Promise.all([
    db.wearableReading.findMany({
      where: { userId: user.id, recordedAt: { gte: weekAgo } },
      orderBy: { recordedAt: 'desc' },
    }),
    db.wearableDevice.findMany({ where: { userId: user.id } }),
    db.weightEntry.findMany({
      where: { userId: user.id },
      orderBy: { recordedAt: 'desc' },
      take: 30,
    }),
  ])

  const latest: Record<string, number> = {}
  readings.forEach((r) => {
    if (!(r.type in latest)) latest[r.type] = r.value
  })

  const stepReadings = readings.filter((r) => r.type === 'steps')
  const avgSteps = stepReadings.length
    ? Math.round(stepReadings.reduce((s, r) => s + r.value, 0) / stepReadings.length)
    : 0

  const sleepReadings = readings.filter((r) => r.type === 'sleep_minutes')

  return NextResponse.json({
    profile: user.healthProfile,
    goal: user.healthGoal,
    devices,
    latestReadings: latest,
    avgSteps,
    sleepData: sleepReadings.slice(0, 7).map((r) => ({
      date: r.recordedAt,
      hours: +(r.value / 60).toFixed(1),
    })),
    weightEntries: weightEntries.map((w) => ({
      date: w.recordedAt,
      weightKg: w.weightKg,
    })),
    hasDevice: devices.some((d) => d.isConnected),
  })
}
```

- [ ] **Step 2: `/api/health/goals/route.ts` — Hedef GET/PUT**

```typescript
import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db/client'

export async function GET() {
  const { userId: clerkId } = await auth()
  if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const user = await db.user.findUnique({ where: { clerkId } })
  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const goal = await db.healthGoal.findUnique({ where: { userId: user.id } })
  return NextResponse.json(
    goal ?? { dailySteps: 10000, sleepHours: 8, waterMl: 2500, targetWeightKg: null }
  )
}

export async function PUT(req: Request) {
  const { userId: clerkId } = await auth()
  if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const user = await db.user.findUnique({ where: { clerkId } })
  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await req.json()
  const goal = await db.healthGoal.upsert({
    where: { userId: user.id },
    update: body,
    create: { userId: user.id, ...body },
  })
  return NextResponse.json(goal)
}
```

- [ ] **Step 3: `/api/health/weight/route.ts` — Kilo GET/POST**

```typescript
import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db/client'

export async function GET() {
  const { userId: clerkId } = await auth()
  if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const user = await db.user.findUnique({ where: { clerkId } })
  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const entries = await db.weightEntry.findMany({
    where: { userId: user.id },
    orderBy: { recordedAt: 'desc' },
    take: 90,
  })
  return NextResponse.json(entries)
}

export async function POST(req: Request) {
  const { userId: clerkId } = await auth()
  if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const user = await db.user.findUnique({ where: { clerkId } })
  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { weightKg, note } = await req.json()
  if (!weightKg || weightKg < 20 || weightKg > 300) {
    return NextResponse.json({ error: 'Invalid weight' }, { status: 400 })
  }

  const entry = await db.weightEntry.create({
    data: { userId: user.id, weightKg, note },
  })
  return NextResponse.json(entry)
}
```

- [ ] **Step 4: `/api/health/activity/route.ts` — Aktivite verisi**

```typescript
import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db/client'

export async function GET(req: Request) {
  const { userId: clerkId } = await auth()
  if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const user = await db.user.findUnique({ where: { clerkId } })
  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { searchParams } = new URL(req.url)
  const days = parseInt(searchParams.get('days') ?? '7')
  const since = new Date()
  since.setDate(since.getDate() - days)

  const readings = await db.wearableReading.findMany({
    where: {
      userId: user.id,
      recordedAt: { gte: since },
      type: { in: ['steps', 'calories_burned', 'heart_rate', 'hrv'] },
    },
    orderBy: { recordedAt: 'asc' },
  })

  // Group by day
  const byDay: Record<
    string,
    { steps: number; calories: number; heartRate: number[]; hrv: number[] }
  > = {}
  readings.forEach((r) => {
    const day = r.recordedAt.toISOString().split('T')[0]
    if (!byDay[day]) byDay[day] = { steps: 0, calories: 0, heartRate: [], hrv: [] }
    if (r.type === 'steps') byDay[day].steps += r.value
    if (r.type === 'calories_burned') byDay[day].calories += r.value
    if (r.type === 'heart_rate') byDay[day].heartRate.push(r.value)
    if (r.type === 'hrv') byDay[day].hrv.push(r.value)
  })

  const chartData = Object.entries(byDay).map(([date, d]) => ({
    date,
    steps: d.steps,
    calories: Math.round(d.calories),
    avgHeartRate: d.heartRate.length
      ? Math.round(d.heartRate.reduce((a, b) => a + b) / d.heartRate.length)
      : null,
    hrv: d.hrv.length ? Math.round(d.hrv.reduce((a, b) => a + b) / d.hrv.length) : null,
  }))

  return NextResponse.json({ chartData })
}
```

- [ ] **Step 5: `/api/health/sleep/route.ts` — Uyku verisi**

```typescript
import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db/client'

export async function GET(req: Request) {
  const { userId: clerkId } = await auth()
  if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const user = await db.user.findUnique({ where: { clerkId } })
  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { searchParams } = new URL(req.url)
  const days = parseInt(searchParams.get('days') ?? '7')
  const since = new Date()
  since.setDate(since.getDate() - days)

  const readings = await db.wearableReading.findMany({
    where: {
      userId: user.id,
      recordedAt: { gte: since },
      type: 'sleep_minutes',
    },
    orderBy: { recordedAt: 'asc' },
  })

  const chartData = readings.map((r) => ({
    date: r.recordedAt.toISOString().split('T')[0],
    hours: +(r.value / 60).toFixed(1),
  }))

  const avg = chartData.length
    ? +(chartData.reduce((s, d) => s + d.hours, 0) / chartData.length).toFixed(1)
    : 0

  return NextResponse.json({ chartData, avg })
}
```

- [ ] **Step 6: `/api/health/devices/route.ts` — Cihaz listesi**

```typescript
import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db/client'

export async function GET() {
  const { userId: clerkId } = await auth()
  if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const user = await db.user.findUnique({ where: { clerkId } })
  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const devices = await db.wearableDevice.findMany({
    where: { userId: user.id },
    orderBy: { lastSyncedAt: 'desc' },
  })
  return NextResponse.json(devices)
}

export async function DELETE(req: Request) {
  const { userId: clerkId } = await auth()
  if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const user = await db.user.findUnique({ where: { clerkId } })
  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { id } = await req.json()
  await db.wearableDevice.deleteMany({ where: { id, userId: user.id } })
  return NextResponse.json({ ok: true })
}
```

- [ ] **Step 7: `/api/health/manual/route.ts` — Manuel okuma girişi**

```typescript
import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db/client'

const ALLOWED_TYPES = ['steps', 'heart_rate', 'sleep_minutes', 'spo2', 'hrv', 'calories_burned']
const UNITS: Record<string, string> = {
  steps: 'count',
  heart_rate: 'bpm',
  sleep_minutes: 'min',
  spo2: '%',
  hrv: 'ms',
  calories_burned: 'kcal',
}

export async function POST(req: Request) {
  const { userId: clerkId } = await auth()
  if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const user = await db.user.findUnique({ where: { clerkId } })
  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { type, value } = await req.json()
  if (!ALLOWED_TYPES.includes(type) || typeof value !== 'number' || value < 0) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
  }

  // Manual entries go to a virtual "manual" device
  let device = await db.wearableDevice.findFirst({
    where: { userId: user.id, type: 'manual' },
  })
  if (!device) {
    device = await db.wearableDevice.create({
      data: { userId: user.id, type: 'manual', brand: 'Manuel', model: 'Giriş', isConnected: true },
    })
  }

  const reading = await db.wearableReading.create({
    data: {
      deviceId: device.id,
      userId: user.id,
      type,
      value,
      unit: UNITS[type],
      recordedAt: new Date(),
    },
  })
  return NextResponse.json(reading)
}
```

- [ ] **Step 8: Commit**

```bash
git add apps/web/app/api/health/
git commit -m "feat(health): add health API routes (goals, weight, activity, sleep, devices, manual)"
```

---

### Task 3: OAuth Device Connect API

**Files:**

- Create: `apps/web/app/api/health/devices/connect/route.ts`
- Create: `apps/web/app/api/health/devices/oauth/callback/route.ts`

Bu task'ta OAuth flow'u implement ediyoruz. Garmin ve Fitbit OAuth 2.0 kullanıyor. Google Fit Google OAuth kullanıyor. Şimdilik OAuth URL'yi generate edip redirect yapan kısım. Real token exchange callback'te.

- [ ] **Step 1: `/api/health/devices/connect/route.ts`**

```typescript
import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'

const OAUTH_CONFIGS: Record<string, { authUrl: string; clientId: string; scope: string }> = {
  google_fit: {
    authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    clientId: process.env.GOOGLE_FIT_CLIENT_ID ?? '',
    scope:
      'https://www.googleapis.com/auth/fitness.activity.read https://www.googleapis.com/auth/fitness.sleep.read https://www.googleapis.com/auth/fitness.heart_rate.read',
  },
  garmin: {
    authUrl: 'https://connect.garmin.com/oauthConfirm',
    clientId: process.env.GARMIN_CONSUMER_KEY ?? '',
    scope: 'ACTIVITY_EXPORT',
  },
  fitbit: {
    authUrl: 'https://www.fitbit.com/oauth2/authorize',
    clientId: process.env.FITBIT_CLIENT_ID ?? '',
    scope: 'activity heartrate sleep profile',
  },
}

export async function POST(req: Request) {
  const { userId: clerkId } = await auth()
  if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { provider } = await req.json()
  const config = OAUTH_CONFIGS[provider]
  if (!config) return NextResponse.json({ error: 'Unknown provider' }, { status: 400 })

  if (!config.clientId) {
    // Dev mode: return mock connect success URL
    return NextResponse.json({
      redirectUrl: `/api/health/devices/oauth/callback?provider=${provider}&mock=true`,
    })
  }

  const callbackUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/health/devices/oauth/callback`
  const state = Buffer.from(JSON.stringify({ clerkId, provider })).toString('base64')

  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: callbackUrl,
    scope: config.scope,
    response_type: 'code',
    state,
  })

  return NextResponse.json({ redirectUrl: `${config.authUrl}?${params}` })
}
```

- [ ] **Step 2: `/api/health/devices/oauth/callback/route.ts`**

```typescript
import { NextResponse } from 'next/server'
import { db } from '@/lib/db/client'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const mock = searchParams.get('mock')
  const provider = searchParams.get('provider') ?? ''
  const state = searchParams.get('state') ?? ''

  if (mock) {
    // Dev/demo mode: create a mock connected device
    const stateData = state ? JSON.parse(Buffer.from(state, 'base64').toString()) : null
    if (stateData?.clerkId) {
      const user = await db.user.findUnique({ where: { clerkId: stateData.clerkId } })
      if (user) {
        const BRAND_MAP: Record<string, { brand: string; model: string }> = {
          google_fit: { brand: 'Google', model: 'Fit' },
          garmin: { brand: 'Garmin', model: 'Connect' },
          fitbit: { brand: 'Fitbit', model: 'Sense 2' },
        }
        const info = BRAND_MAP[provider] ?? { brand: provider, model: '' }
        await db.wearableDevice.upsert({
          where: { id: `mock-${user.id}-${provider}` },
          update: { isConnected: true, lastSyncedAt: new Date() },
          create: {
            id: `mock-${user.id}-${provider}`,
            userId: user.id,
            type: provider,
            brand: info.brand,
            model: info.model,
            isConnected: true,
            lastSyncedAt: new Date(),
          },
        })
      }
    }
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/health?tab=devices&connected=${provider}`
    )
  }

  // Real OAuth: token exchange would happen here
  // For now redirect to devices tab
  return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/health?tab=devices`)
}
```

- [ ] **Step 3: Commit**

```bash
git add apps/web/app/api/health/devices/
git commit -m "feat(health): add OAuth device connect flow (Google Fit, Garmin, Fitbit)"
```

---

## Chunk 2: UI Components

### Task 4: Shared Health UI Components

**Files:**

- Create: `apps/web/components/health/HealthMetricCard.tsx`
- Create: `apps/web/components/health/TimeRangeFilter.tsx`
- Create: `apps/web/components/health/AIInsightCard.tsx`
- Create: `apps/web/components/health/GoalRing.tsx`
- Create: `apps/web/components/health/WeeklyBarChart.tsx`
- Create: `apps/web/components/health/ManualEntryModal.tsx`

- [ ] **Step 1: `HealthMetricCard.tsx`**

```tsx
'use client'

import { motion } from 'framer-motion'
import { LucideIcon } from 'lucide-react'

interface HealthMetricCardProps {
  icon: LucideIcon
  label: string
  value: string | number
  unit?: string
  status?: string
  statusColor?: string
  accentColor: string // tailwind class like 'purple'
  trend?: number // +/- percentage
  delay?: number
}

export function HealthMetricCard({
  icon: Icon,
  label,
  value,
  unit,
  status,
  statusColor,
  accentColor,
  trend,
  delay = 0,
}: HealthMetricCardProps) {
  const colorMap: Record<string, { bg: string; border: string; glow: string; text: string }> = {
    red: {
      bg: 'bg-red-500/10',
      border: 'border-red-500/20',
      glow: 'from-red-500/10 to-red-600/5',
      text: 'text-red-400',
    },
    purple: {
      bg: 'bg-purple-500/10',
      border: 'border-purple-500/20',
      glow: 'from-purple-500/10 to-purple-600/5',
      text: 'text-purple-400',
    },
    blue: {
      bg: 'bg-blue-500/10',
      border: 'border-blue-500/20',
      glow: 'from-blue-500/10 to-blue-600/5',
      text: 'text-blue-400',
    },
    green: {
      bg: 'bg-green-500/10',
      border: 'border-green-500/20',
      glow: 'from-green-500/10 to-green-600/5',
      text: 'text-green-400',
    },
    indigo: {
      bg: 'bg-indigo-500/10',
      border: 'border-indigo-500/20',
      glow: 'from-indigo-500/10 to-indigo-600/5',
      text: 'text-indigo-400',
    },
    emerald: {
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/20',
      glow: 'from-emerald-500/10 to-emerald-600/5',
      text: 'text-emerald-400',
    },
    cyan: {
      bg: 'bg-cyan-500/10',
      border: 'border-cyan-500/20',
      glow: 'from-cyan-500/10 to-cyan-600/5',
      text: 'text-cyan-400',
    },
  }
  const c = colorMap[accentColor] ?? colorMap.purple

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay, duration: 0.4 }}
      whileHover={{ y: -4 }}
      className="group relative cursor-pointer"
    >
      <div
        className={`absolute inset-0 bg-gradient-to-br ${c.glow} rounded-3xl opacity-0 blur-xl transition-opacity group-hover:opacity-100`}
      />
      <div
        className={`relative ${c.bg} border ${c.border} h-full rounded-3xl p-5 backdrop-blur-sm transition-all hover:border-opacity-60`}
      >
        <motion.div whileHover={{ scale: 1.15, rotate: 5 }} className="mb-3">
          <Icon size={22} className={c.text} />
        </motion.div>
        <p className="text-muted-foreground mb-1.5 text-xs font-semibold uppercase tracking-wider">
          {label}
        </p>
        <p className="text-2xl font-black leading-none">
          {value}
          {unit && <span className="text-muted-foreground ml-1 text-sm font-normal">{unit}</span>}
        </p>
        <div className="mt-2 flex items-center justify-between">
          {status && <p className={`text-xs font-semibold ${statusColor ?? c.text}`}>{status}</p>}
          {trend !== undefined && (
            <p
              className={`ml-auto text-xs font-bold ${trend >= 0 ? 'text-green-400' : 'text-red-400'}`}
            >
              {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
            </p>
          )}
        </div>
      </div>
    </motion.div>
  )
}
```

- [ ] **Step 2: `TimeRangeFilter.tsx`**

```tsx
'use client'

import { motion } from 'framer-motion'

export type TimeRange = '7d' | '30d' | '90d'

const OPTIONS: { label: string; value: TimeRange }[] = [
  { label: '7 Gün', value: '7d' },
  { label: '30 Gün', value: '30d' },
  { label: '90 Gün', value: '90d' },
]

interface TimeRangeFilterProps {
  value: TimeRange
  onChange: (v: TimeRange) => void
  accentColor?: string
}

export function TimeRangeFilter({ value, onChange, accentColor = 'purple' }: TimeRangeFilterProps) {
  return (
    <div className="bg-muted/30 border-border/30 flex gap-1 rounded-xl border p-1">
      {OPTIONS.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`relative cursor-pointer rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
            value === opt.value ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          {value === opt.value && (
            <motion.div
              layoutId="time-range-pill"
              className="bg-card border-border/50 absolute inset-0 rounded-lg border shadow-sm"
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            />
          )}
          <span className="relative z-10">{opt.label}</span>
        </button>
      ))}
    </div>
  )
}
```

- [ ] **Step 3: `AIInsightCard.tsx`**

```tsx
'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, ChevronDown } from 'lucide-react'

interface AIInsightCardProps {
  insight: string
  loading?: boolean
  accentColor?: string
}

export function AIInsightCard({ insight, loading, accentColor = 'purple' }: AIInsightCardProps) {
  const [expanded, setExpanded] = useState(false)

  const colorMap: Record<
    string,
    { border: string; iconBg: string; iconText: string; glow: string }
  > = {
    purple: {
      border: 'border-purple-500/30',
      iconBg: 'bg-purple-500/20',
      iconText: 'text-purple-400',
      glow: 'from-purple-500/5 to-indigo-500/5',
    },
    blue: {
      border: 'border-blue-500/30',
      iconBg: 'bg-blue-500/20',
      iconText: 'text-blue-400',
      glow: 'from-blue-500/5 to-cyan-500/5',
    },
    indigo: {
      border: 'border-indigo-500/30',
      iconBg: 'bg-indigo-500/20',
      iconText: 'text-indigo-400',
      glow: 'from-indigo-500/5 to-purple-500/5',
    },
    emerald: {
      border: 'border-emerald-500/30',
      iconBg: 'bg-emerald-500/20',
      iconText: 'text-emerald-400',
      glow: 'from-emerald-500/5 to-green-500/5',
    },
    cyan: {
      border: 'border-cyan-500/30',
      iconBg: 'bg-cyan-500/20',
      iconText: 'text-cyan-400',
      glow: 'from-cyan-500/5 to-blue-500/5',
    },
  }
  const c = colorMap[accentColor] ?? colorMap.purple

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className={`bg-gradient-to-r ${c.glow} border ${c.border} cursor-pointer rounded-2xl p-4`}
      onClick={() => setExpanded((e) => !e)}
    >
      <div className="flex items-center gap-3">
        <div className={`p-2 ${c.iconBg} shrink-0 rounded-xl`}>
          <Sparkles size={14} className={c.iconText} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-muted-foreground mb-0.5 text-xs font-bold uppercase tracking-wider">
            AI Koç Önerisi
          </p>
          {loading ? (
            <div className="bg-muted/50 h-4 w-3/4 animate-pulse rounded" />
          ) : (
            <p className={`text-sm font-medium ${expanded ? '' : 'truncate'}`}>{insight}</p>
          )}
        </div>
        <motion.div animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown size={14} className="text-muted-foreground shrink-0" />
        </motion.div>
      </div>
    </motion.div>
  )
}
```

- [ ] **Step 4: `GoalRing.tsx` — Circular progress**

```tsx
'use client'

import { motion } from 'framer-motion'

interface GoalRingProps {
  value: number
  max: number
  label: string
  unit: string
  color: string // hex or tailwind stroke color
  size?: number
}

export function GoalRing({ value, max, label, unit, color, size = 120 }: GoalRingProps) {
  const pct = Math.min(value / max, 1)
  const radius = (size - 20) / 2
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference * (1 - pct)

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={10}
            className="text-muted/30"
          />
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={10}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-lg font-black leading-none">{Math.round(pct * 100)}%</span>
          <span className="text-muted-foreground text-xs">hedef</span>
        </div>
      </div>
      <div className="text-center">
        <p className="text-muted-foreground text-xs font-semibold">{label}</p>
        <p className="text-sm font-bold">
          {value.toLocaleString('tr-TR')}{' '}
          <span className="text-muted-foreground text-xs font-normal">{unit}</span>
        </p>
      </div>
    </div>
  )
}
```

- [ ] **Step 5: `WeeklyBarChart.tsx`**

```tsx
'use client'

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

interface WeeklyBarChartProps {
  data: { date: string; value: number }[]
  color: string
  label: string
  unit: string
}

export function WeeklyBarChart({ data, color, label, unit }: WeeklyBarChartProps) {
  const formatted = data.map((d) => ({
    ...d,
    day: new Date(d.date).toLocaleDateString('tr-TR', { weekday: 'short' }),
  }))

  return (
    <ResponsiveContainer width="100%" height={160}>
      <BarChart data={formatted} barSize={28} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
        <XAxis
          dataKey="day"
          tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          contentStyle={{
            background: 'hsl(var(--card))',
            border: '1px solid hsl(var(--border))',
            borderRadius: 12,
            fontSize: 12,
          }}
          formatter={(v: number) => [`${v.toLocaleString('tr-TR')} ${unit}`, label]}
          cursor={{ fill: 'rgba(255,255,255,0.04)', radius: 8 }}
        />
        <Bar dataKey="value" fill={color} radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
```

- [ ] **Step 6: `ManualEntryModal.tsx`**

```tsx
'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Plus } from 'lucide-react'

const ENTRY_TYPES = [
  { value: 'steps', label: 'Adım', unit: 'adım', min: 0, max: 100000 },
  { value: 'heart_rate', label: 'Nabız', unit: 'bpm', min: 30, max: 220 },
  { value: 'sleep_minutes', label: 'Uyku', unit: 'dk', min: 0, max: 1440 },
  { value: 'spo2', label: 'SpO2', unit: '%', min: 50, max: 100 },
  { value: 'hrv', label: 'HRV', unit: 'ms', min: 0, max: 300 },
  { value: 'calories_burned', label: 'Kalori', unit: 'kcal', min: 0, max: 10000 },
]

interface ManualEntryModalProps {
  open: boolean
  onClose: () => void
  onSave: (type: string, value: number) => Promise<void>
}

export function ManualEntryModal({ open, onClose, onSave }: ManualEntryModalProps) {
  const [type, setType] = useState(ENTRY_TYPES[0].value)
  const [value, setValue] = useState('')
  const [saving, setSaving] = useState(false)

  const selected = ENTRY_TYPES.find((t) => t.value === type)!

  async function handleSave() {
    const num = parseFloat(value)
    if (isNaN(num) || num < selected.min || num > selected.max) return
    setSaving(true)
    await onSave(type, num)
    setSaving(false)
    setValue('')
    onClose()
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 backdrop-blur-sm sm:items-center"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-card border-border/50 w-full max-w-sm rounded-3xl border p-6 shadow-2xl"
          >
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-lg font-bold">Manuel Veri Gir</h3>
              <button
                onClick={onClose}
                className="hover:bg-muted/50 cursor-pointer rounded-xl p-2 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <div className="mb-5 grid grid-cols-3 gap-2">
              {ENTRY_TYPES.map((t) => (
                <button
                  key={t.value}
                  onClick={() => setType(t.value)}
                  className={`cursor-pointer rounded-xl px-3 py-2 text-xs font-bold transition-all ${
                    type === t.value
                      ? 'border border-purple-500/40 bg-purple-500/20 text-purple-300'
                      : 'bg-muted/30 border-border/30 text-muted-foreground hover:border-border/60 border'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div className="mb-5">
              <label className="text-muted-foreground mb-2 block text-xs font-semibold uppercase tracking-wider">
                {selected.label} ({selected.unit})
              </label>
              <input
                type="number"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder={`${selected.min} – ${selected.max}`}
                className="bg-muted/30 border-border/50 w-full rounded-xl border px-4 py-3 text-lg font-bold transition-colors focus:border-purple-500/50 focus:outline-none"
              />
            </div>

            <button
              onClick={handleSave}
              disabled={saving || !value}
              className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl border border-purple-500/30 bg-purple-500/20 py-3 text-sm font-bold text-purple-300 transition-all hover:bg-purple-500/30 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Plus size={16} />
              {saving ? 'Kaydediliyor...' : 'Kaydet'}
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
```

- [ ] **Step 7: Commit**

```bash
git add apps/web/components/health/
git commit -m "feat(health): add shared health UI components (MetricCard, TimeFilter, AIInsight, GoalRing, Charts, ManualModal)"
```

---

## Chunk 3: Tab Sections

### Task 5: Genel Bakış Tab

**Files:**

- Create: `apps/web/app/(dashboard)/dashboard/health/components/OverviewTab.tsx`

- [ ] **Step 1: `OverviewTab.tsx`**

```tsx
'use client'

import { motion } from 'framer-motion'
import { Heart, Footprints, Moon, Droplets, Activity, Wind } from 'lucide-react'
import { HealthMetricCard } from '@/components/health/HealthMetricCard'
import { AIInsightCard } from '@/components/health/AIInsightCard'
import { TimeRangeFilter, TimeRange } from '@/components/health/TimeRangeFilter'
import { useState } from 'react'

interface OverviewTabProps {
  heartRate: number
  spo2: number
  avgSteps: number
  avgSleepH: number
  waterLiters: number
  stressScore: number | null
  waterGoalL: number
  stepGoal: number
  sleepGoal: number
  aiInsight: string
}

export function OverviewTab({
  heartRate,
  spo2,
  avgSteps,
  avgSleepH,
  waterLiters,
  stressScore,
  waterGoalL,
  stepGoal,
  sleepGoal,
  aiInsight,
}: OverviewTabProps) {
  const [range, setRange] = useState<TimeRange>('7d')

  const METRICS = [
    {
      icon: Heart,
      label: 'Dinlenme Nabzı',
      value: heartRate,
      unit: 'bpm',
      accentColor: 'red',
      status: heartRate < 100 ? 'Normal' : 'Yüksek',
      statusColor: heartRate < 100 ? 'text-green-400' : 'text-red-400',
    },
    {
      icon: Wind,
      label: 'Kan Oksijeni',
      value: spo2,
      unit: '%',
      accentColor: 'cyan',
      status: spo2 >= 95 ? 'Normal' : 'Düşük',
      statusColor: spo2 >= 95 ? 'text-green-400' : 'text-red-400',
    },
    {
      icon: Footprints,
      label: 'Ort. Adım',
      value: avgSteps.toLocaleString('tr-TR'),
      unit: 'adım',
      accentColor: 'purple',
      status: `Hedef: ${stepGoal.toLocaleString('tr-TR')}`,
    },
    {
      icon: Moon,
      label: 'Ort. Uyku',
      value: avgSleepH,
      unit: 'saat',
      accentColor: 'indigo',
      status: `Hedef: ${sleepGoal}s`,
    },
    {
      icon: Droplets,
      label: 'Su Tüketimi',
      value: waterLiters.toFixed(1),
      unit: 'L',
      accentColor: 'blue',
      status: `Hedef: ${waterGoalL}L`,
    },
    {
      icon: Activity,
      label: 'Stres Skoru',
      value: stressScore ?? '–',
      unit: stressScore ? '/100' : '',
      accentColor: 'emerald',
      status: stressScore
        ? stressScore < 40
          ? 'Düşük'
          : stressScore < 70
            ? 'Orta'
            : 'Yüksek'
        : 'Veri yok',
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">Genel Bakış</h2>
        <TimeRangeFilter value={range} onChange={setRange} />
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        {METRICS.map((m, i) => (
          <HealthMetricCard key={m.label} {...m} delay={i * 0.07} />
        ))}
      </div>

      <AIInsightCard insight={aiInsight} accentColor="purple" />
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/app/\(dashboard\)/dashboard/health/components/
git commit -m "feat(health): add OverviewTab component"
```

---

### Task 6: Aktivite Tab

**Files:**

- Create: `apps/web/app/(dashboard)/dashboard/health/components/ActivityTab.tsx`

- [ ] **Step 1: `ActivityTab.tsx`**

```tsx
'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Footprints, Flame, Heart, Zap } from 'lucide-react'
import { TimeRangeFilter, TimeRange } from '@/components/health/TimeRangeFilter'
import { GoalRing } from '@/components/health/GoalRing'
import { WeeklyBarChart } from '@/components/health/WeeklyBarChart'
import { AIInsightCard } from '@/components/health/AIInsightCard'
import { HealthMetricCard } from '@/components/health/HealthMetricCard'

const HEART_ZONES = [
  { name: 'Dinlenme', range: '< 60 bpm', color: 'bg-blue-500', pct: 40 },
  { name: 'Hafif', range: '60–100 bpm', color: 'bg-green-500', pct: 30 },
  { name: 'Aerobik', range: '100–140 bpm', color: 'bg-yellow-500', pct: 18 },
  { name: 'Anaerobik', range: '140–170 bpm', color: 'bg-orange-500', pct: 9 },
  { name: 'Maksimal', range: '170+ bpm', color: 'bg-red-500', pct: 3 },
]

interface ActivityTabProps {
  todaySteps: number
  stepGoal: number
  avgHeartRate: number
  hrv: number | null
  chartData: { date: string; value: number }[]
  caloriesData: { date: string; value: number }[]
  aiInsight: string
}

export function ActivityTab({
  todaySteps,
  stepGoal,
  avgHeartRate,
  hrv,
  chartData,
  caloriesData,
  aiInsight,
}: ActivityTabProps) {
  const [range, setRange] = useState<TimeRange>('7d')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">Aktivite</h2>
        <TimeRangeFilter value={range} onChange={setRange} accentColor="purple" />
      </div>

      {/* Goal Rings */}
      <div className="bg-card/50 border-border/30 rounded-3xl border p-6">
        <p className="text-muted-foreground mb-6 text-xs font-semibold uppercase tracking-wider">
          Bugünkü Hedefler
        </p>
        <div className="flex justify-around">
          <GoalRing
            value={todaySteps}
            max={stepGoal}
            label="Adım"
            unit="adım"
            color="#a855f7"
            size={130}
          />
          <GoalRing
            value={Math.round(todaySteps * 0.04)}
            max={500}
            label="Kalori"
            unit="kcal"
            color="#f97316"
            size={130}
          />
          <GoalRing
            value={Math.min(avgHeartRate, 180)}
            max={180}
            label="Nabız"
            unit="bpm"
            color="#ef4444"
            size={130}
          />
        </div>
      </div>

      {/* Steps Chart */}
      <div className="bg-card/50 border-border/30 rounded-3xl border p-6">
        <p className="text-muted-foreground mb-4 text-xs font-semibold uppercase tracking-wider">
          Haftalık Adım
        </p>
        <WeeklyBarChart data={chartData} color="#a855f7" label="Adım" unit="adım" />
      </div>

      {/* Heart Rate Zones */}
      <div className="bg-card/50 border-border/30 rounded-3xl border p-6">
        <div className="mb-5 flex items-center gap-2">
          <Heart size={16} className="text-red-400" />
          <h3 className="font-bold">Nabız Zonu Dağılımı</h3>
        </div>
        <div className="space-y-3">
          {HEART_ZONES.map((zone, i) => (
            <motion.div
              key={zone.name}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 + i * 0.07 }}
            >
              <div className="mb-1.5 flex justify-between text-xs">
                <span className="font-semibold">{zone.name}</span>
                <div className="flex gap-2">
                  <span className="text-muted-foreground">{zone.range}</span>
                  <span className="font-black">{zone.pct}%</span>
                </div>
              </div>
              <div className="bg-muted/30 h-2.5 overflow-hidden rounded-full">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${zone.pct}%` }}
                  transition={{ delay: 0.3 + i * 0.1, duration: 0.8, ease: 'easeOut' }}
                  className={`h-full ${zone.color} rounded-full`}
                />
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* HRV */}
      {hrv && (
        <div className="grid grid-cols-2 gap-4">
          <HealthMetricCard
            icon={Zap}
            label="HRV"
            value={hrv}
            unit="ms"
            accentColor="emerald"
            status="Toparlanma İyi"
            delay={0}
          />
          <HealthMetricCard
            icon={Flame}
            label="Tahmini Kalori"
            value={Math.round(todaySteps * 0.04)}
            unit="kcal"
            accentColor="red"
            delay={0.07}
          />
        </div>
      )}

      <AIInsightCard insight={aiInsight} accentColor="purple" />
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/app/\(dashboard\)/dashboard/health/components/
git commit -m "feat(health): add ActivityTab with goal rings, charts and heart rate zones"
```

---

### Task 7: Uyku Tab

**Files:**

- Create: `apps/web/app/(dashboard)/dashboard/health/components/SleepTab.tsx`

- [ ] **Step 1: `SleepTab.tsx`**

```tsx
'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Moon, Clock, Star } from 'lucide-react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts'
import { TimeRangeFilter, TimeRange } from '@/components/health/TimeRangeFilter'
import { AIInsightCard } from '@/components/health/AIInsightCard'
import { HealthMetricCard } from '@/components/health/HealthMetricCard'

interface SleepTabProps {
  chartData: { date: string; hours: number }[]
  avg: number
  goal: number
  aiInsight: string
}

export function SleepTab({ chartData, avg, goal, aiInsight }: SleepTabProps) {
  const [range, setRange] = useState<TimeRange>('7d')

  const formatted = chartData.map((d) => ({
    ...d,
    day: new Date(d.date).toLocaleDateString('tr-TR', { weekday: 'short' }),
  }))

  const best = chartData.length ? Math.max(...chartData.map((d) => d.hours)) : 0
  const worst = chartData.length ? Math.min(...chartData.map((d) => d.hours)) : 0
  const qualityScore = Math.min(100, Math.round((avg / goal) * 100))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">Uyku</h2>
        <TimeRangeFilter value={range} onChange={setRange} accentColor="indigo" />
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        <HealthMetricCard
          icon={Moon}
          label="Ortalama"
          value={avg}
          unit="saat"
          accentColor="indigo"
          delay={0}
        />
        <HealthMetricCard
          icon={Star}
          label="En Uzun"
          value={best}
          unit="saat"
          accentColor="purple"
          delay={0.07}
        />
        <HealthMetricCard
          icon={Clock}
          label="En Kısa"
          value={worst}
          unit="saat"
          accentColor="red"
          delay={0.14}
        />
      </div>

      {/* Area Chart */}
      <div className="bg-card/50 border-border/30 rounded-3xl border p-6">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">
            Uyku Süresi Trendi
          </p>
          <span className="rounded-lg border border-indigo-500/20 bg-indigo-500/10 px-2 py-1 text-xs font-bold text-indigo-400">
            Hedef: {goal}s
          </span>
        </div>
        <ResponsiveContainer width="100%" height={180}>
          <AreaChart data={formatted} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="sleepGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis
              dataKey="day"
              tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
              axisLine={false}
              tickLine={false}
              domain={[0, 12]}
            />
            <Tooltip
              contentStyle={{
                background: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: 12,
                fontSize: 12,
              }}
              formatter={(v: number) => [`${v} saat`, 'Uyku']}
            />
            <Area
              type="monotone"
              dataKey="hours"
              stroke="#6366f1"
              strokeWidth={2.5}
              fill="url(#sleepGrad)"
              dot={{ fill: '#6366f1', r: 4 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Quality Score */}
      <div className="rounded-3xl border border-indigo-500/20 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 p-6">
        <p className="text-muted-foreground mb-3 text-xs font-semibold uppercase tracking-wider">
          Uyku Kalitesi
        </p>
        <div className="flex items-center gap-4">
          <div className="text-4xl font-black text-indigo-400">%{qualityScore}</div>
          <div className="flex-1">
            <div className="bg-muted/30 h-3 overflow-hidden rounded-full">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${qualityScore}%` }}
                transition={{ duration: 1.2, ease: 'easeOut' }}
                className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500"
              />
            </div>
            <p className="text-muted-foreground mt-1.5 text-xs">
              {qualityScore >= 85
                ? 'Mükemmel'
                : qualityScore >= 70
                  ? 'İyi'
                  : qualityScore >= 50
                    ? 'Orta'
                    : 'Yetersiz'}
            </p>
          </div>
        </div>
      </div>

      <AIInsightCard insight={aiInsight} accentColor="indigo" />
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/app/\(dashboard\)/dashboard/health/components/
git commit -m "feat(health): add SleepTab with area chart and quality score"
```

---

### Task 8: Su Tab

**Files:**

- Create: `apps/web/app/(dashboard)/dashboard/health/components/WaterTab.tsx`

Mevcut su sayfası (`/dashboard/water`) zaten var. Bu tab oradan adapte edilecek, duplicate olmayacak — sadece health dashboard içine embed edilmiş özet görünüm + link.

- [ ] **Step 1: `WaterTab.tsx`**

```tsx
'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Droplets, Plus, TrendingUp } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { AIInsightCard } from '@/components/health/AIInsightCard'
import Link from 'next/link'

interface WaterTabProps {
  totalMl: number
  goalMl: number
  count: number
  weeklyData: { date: string; totalMl: number }[]
  aiInsight: string
  onAddWater: (ml: number) => Promise<void>
}

const QUICK_AMOUNTS = [150, 200, 250, 330, 500]

export function WaterTab({
  totalMl,
  goalMl,
  count,
  weeklyData,
  aiInsight,
  onAddWater,
}: WaterTabProps) {
  const [adding, setAdding] = useState(false)
  const pct = Math.min((totalMl / goalMl) * 100, 100)
  const glasses = Math.floor(totalMl / 250)
  const goalGlasses = Math.ceil(goalMl / 250)
  const remaining = Math.max(0, goalMl - totalMl)

  const formatted = weeklyData.map((d) => ({
    day: new Date(d.date).toLocaleDateString('tr-TR', { weekday: 'short' }),
    litre: +(d.totalMl / 1000).toFixed(1),
  }))

  async function handleAdd(ml: number) {
    setAdding(true)
    await onAddWater(ml)
    setAdding(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">Su Tüketimi</h2>
        <Link
          href="/dashboard/water"
          className="cursor-pointer text-xs font-semibold text-blue-400 transition-colors hover:text-blue-300"
        >
          Detaylı Görünüm →
        </Link>
      </div>

      {/* Main progress */}
      <div className="rounded-3xl border border-blue-500/20 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 p-6">
        <div className="mb-4 flex items-end justify-between">
          <div>
            <p className="text-muted-foreground mb-1 text-xs font-semibold uppercase tracking-wider">
              Bugün
            </p>
            <p className="text-4xl font-black text-blue-400">
              {(totalMl / 1000).toFixed(1)}
              <span className="text-muted-foreground ml-1 text-lg font-normal">L</span>
            </p>
            <p className="text-muted-foreground mt-1 text-sm">
              {remaining > 0 ? `${(remaining / 1000).toFixed(1)}L daha iç` : 'Hedef tamamlandı! 🎉'}
            </p>
          </div>
          <div className="text-right">
            <p className="text-muted-foreground text-xs">Hedef</p>
            <p className="text-2xl font-black">
              {(goalMl / 1000).toFixed(1)}
              <span className="text-muted-foreground ml-1 text-sm font-normal">L</span>
            </p>
          </div>
        </div>
        <div className="h-3 overflow-hidden rounded-full border border-blue-500/20 bg-blue-500/10">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
            className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-400"
          />
        </div>
        <p className="mt-2 text-xs font-bold text-blue-400">{Math.round(pct)}% tamamlandı</p>
      </div>

      {/* Glass visualization */}
      <div className="bg-card/50 border-border/30 rounded-3xl border p-6">
        <p className="text-muted-foreground mb-4 text-xs font-semibold uppercase tracking-wider">
          Bardaklar ({glasses}/{goalGlasses})
        </p>
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: goalGlasses }).map((_, i) => (
            <motion.div
              key={i}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: i * 0.03 }}
              className={`flex h-12 w-9 items-end justify-center rounded-xl border pb-1 transition-all ${
                i < glasses
                  ? 'border-blue-400 bg-gradient-to-b from-blue-400 to-blue-600 shadow-lg shadow-blue-500/30'
                  : 'bg-muted/20 border-border/30'
              }`}
            >
              <Droplets
                size={12}
                className={i < glasses ? 'text-white' : 'text-muted-foreground/30'}
              />
            </motion.div>
          ))}
        </div>
      </div>

      {/* Quick add */}
      <div className="bg-card/50 border-border/30 rounded-3xl border p-6">
        <p className="text-muted-foreground mb-4 text-xs font-semibold uppercase tracking-wider">
          Hızlı Ekle
        </p>
        <div className="flex flex-wrap gap-2">
          {QUICK_AMOUNTS.map((ml) => (
            <button
              key={ml}
              onClick={() => handleAdd(ml)}
              disabled={adding}
              className="cursor-pointer rounded-xl border border-blue-500/20 bg-blue-500/10 px-4 py-2.5 text-sm font-bold text-blue-300 transition-all hover:border-blue-500/40 hover:bg-blue-500/20 disabled:opacity-50"
            >
              +{ml}ml
            </button>
          ))}
        </div>
      </div>

      {/* Weekly chart */}
      {formatted.length > 0 && (
        <div className="bg-card/50 border-border/30 rounded-3xl border p-6">
          <p className="text-muted-foreground mb-4 text-xs font-semibold uppercase tracking-wider">
            Haftalık Su Trendi
          </p>
          <ResponsiveContainer width="100%" height={140}>
            <BarChart
              data={formatted}
              barSize={24}
              margin={{ top: 4, right: 4, left: -20, bottom: 0 }}
            >
              <XAxis
                dataKey="day"
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  background: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: 12,
                  fontSize: 12,
                }}
                formatter={(v: number) => [`${v}L`, 'Su']}
              />
              <Bar dataKey="litre" fill="#3b82f6" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <AIInsightCard insight={aiInsight} accentColor="blue" />
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/app/\(dashboard\)/dashboard/health/components/
git commit -m "feat(health): add WaterTab with progress, glass viz, quick add and weekly chart"
```

---

### Task 9: Vücut Tab

**Files:**

- Create: `apps/web/app/(dashboard)/dashboard/health/components/BodyTab.tsx`

- [ ] **Step 1: `BodyTab.tsx`**

```tsx
'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Scale, Target, TrendingDown } from 'lucide-react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine,
} from 'recharts'
import { AIInsightCard } from '@/components/health/AIInsightCard'
import { HealthMetricCard } from '@/components/health/HealthMetricCard'
import { TimeRangeFilter, TimeRange } from '@/components/health/TimeRangeFilter'

interface BodyTabProps {
  weightEntries: { date: string; weightKg: number }[]
  heightCm: number
  targetWeightKg: number | null
  aiInsight: string
  onAddWeight: (kg: number, note?: string) => Promise<void>
}

export function BodyTab({
  weightEntries,
  heightCm,
  targetWeightKg,
  aiInsight,
  onAddWeight,
}: BodyTabProps) {
  const [range, setRange] = useState<TimeRange>('30d')
  const [newWeight, setNewWeight] = useState('')
  const [saving, setSaving] = useState(false)

  const latest = weightEntries[0]?.weightKg ?? null
  const bmi = latest ? +(latest / Math.pow(heightCm / 100, 2)).toFixed(1) : null
  const bmiCategory = bmi
    ? bmi < 18.5
      ? 'Zayıf'
      : bmi < 25
        ? 'Normal'
        : bmi < 30
          ? 'Fazla Kilolu'
          : 'Obez'
    : '–'

  const formatted = weightEntries
    .slice()
    .reverse()
    .map((e) => ({
      date: new Date(e.date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' }),
      kg: e.weightKg,
    }))

  async function handleSave() {
    const kg = parseFloat(newWeight)
    if (isNaN(kg) || kg < 20 || kg > 300) return
    setSaving(true)
    await onAddWeight(kg)
    setSaving(false)
    setNewWeight('')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">Vücut</h2>
        <TimeRangeFilter value={range} onChange={setRange} accentColor="emerald" />
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-3 gap-4">
        <HealthMetricCard
          icon={Scale}
          label="Güncel Kilo"
          value={latest ? `${latest}` : '–'}
          unit={latest ? 'kg' : ''}
          accentColor="emerald"
          delay={0}
        />
        <HealthMetricCard
          icon={Target}
          label="BMI"
          value={bmi ?? '–'}
          unit=""
          accentColor="blue"
          delay={0.07}
          status={bmiCategory}
        />
        <HealthMetricCard
          icon={TrendingDown}
          label="Hedef Kilo"
          value={targetWeightKg ? `${targetWeightKg}` : '–'}
          unit={targetWeightKg ? 'kg' : ''}
          accentColor="purple"
          delay={0.14}
        />
      </div>

      {/* Weight input */}
      <div className="bg-card/50 border-border/30 rounded-3xl border p-6">
        <p className="text-muted-foreground mb-4 text-xs font-semibold uppercase tracking-wider">
          Kilo Gir
        </p>
        <div className="flex gap-3">
          <input
            type="number"
            step="0.1"
            value={newWeight}
            onChange={(e) => setNewWeight(e.target.value)}
            placeholder="Örn: 75.5"
            className="bg-muted/30 border-border/50 flex-1 rounded-xl border px-4 py-3 font-bold transition-colors focus:border-emerald-500/50 focus:outline-none"
          />
          <button
            onClick={handleSave}
            disabled={saving || !newWeight}
            className="cursor-pointer rounded-xl border border-emerald-500/30 bg-emerald-500/20 px-5 py-3 text-sm font-bold text-emerald-300 transition-all hover:bg-emerald-500/30 disabled:opacity-50"
          >
            {saving ? '...' : 'Kaydet'}
          </button>
        </div>
      </div>

      {/* Weight trend chart */}
      {formatted.length > 1 && (
        <div className="bg-card/50 border-border/30 rounded-3xl border p-6">
          <p className="text-muted-foreground mb-4 text-xs font-semibold uppercase tracking-wider">
            Kilo Trendi
          </p>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={formatted} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(255,255,255,0.05)"
                vertical={false}
              />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                axisLine={false}
                tickLine={false}
                domain={['auto', 'auto']}
              />
              <Tooltip
                contentStyle={{
                  background: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: 12,
                  fontSize: 12,
                }}
                formatter={(v: number) => [`${v} kg`, 'Kilo']}
              />
              {targetWeightKg && (
                <ReferenceLine
                  y={targetWeightKg}
                  stroke="#a855f7"
                  strokeDasharray="4 4"
                  label={{ value: 'Hedef', fill: '#a855f7', fontSize: 10 }}
                />
              )}
              <Line
                type="monotone"
                dataKey="kg"
                stroke="#10b981"
                strokeWidth={2.5}
                dot={{ fill: '#10b981', r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* BMI Scale */}
      {bmi && (
        <div className="bg-card/50 border-border/30 rounded-3xl border p-6">
          <p className="text-muted-foreground mb-4 text-xs font-semibold uppercase tracking-wider">
            BMI Skalası
          </p>
          <div className="relative flex h-6 overflow-hidden rounded-full">
            {[
              { label: 'Zayıf', color: 'bg-blue-500', width: '20%' },
              { label: 'Normal', color: 'bg-green-500', width: '30%' },
              { label: 'Fazla', color: 'bg-yellow-500', width: '25%' },
              { label: 'Obez', color: 'bg-red-500', width: '25%' },
            ].map((s) => (
              <div
                key={s.label}
                style={{ width: s.width }}
                className={`${s.color} flex items-center justify-center opacity-60`}
              >
                <span className="text-xs font-bold text-white">{s.label}</span>
              </div>
            ))}
          </div>
          <div className="text-muted-foreground mt-2 flex justify-between text-xs">
            <span>16</span>
            <span>18.5</span>
            <span>25</span>
            <span>30</span>
            <span>40</span>
          </div>
          <div className="mt-3 text-center">
            <span className="text-2xl font-black">{bmi}</span>
            <span className="text-muted-foreground ml-2 text-sm">BMI · {bmiCategory}</span>
          </div>
        </div>
      )}

      <AIInsightCard insight={aiInsight} accentColor="emerald" />
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/app/\(dashboard\)/dashboard/health/components/
git commit -m "feat(health): add BodyTab with weight tracking, BMI scale and trend chart"
```

---

### Task 10: Cihazlar Tab

**Files:**

- Create: `apps/web/app/(dashboard)/dashboard/health/components/DevicesTab.tsx`

- [ ] **Step 1: `DevicesTab.tsx`**

```tsx
'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Watch, CheckCircle, Plus, Trash2, RefreshCw, ExternalLink } from 'lucide-react'
import { ManualEntryModal } from '@/components/health/ManualEntryModal'

const PROVIDERS = [
  {
    id: 'google_fit',
    name: 'Google Fit',
    description: 'Android & Wear OS',
    color: 'from-green-500/20 to-emerald-500/10',
    border: 'border-green-500/30',
    text: 'text-green-400',
    logo: '🏃',
  },
  {
    id: 'garmin',
    name: 'Garmin',
    description: 'Garmin Connect',
    color: 'from-blue-500/20 to-cyan-500/10',
    border: 'border-blue-500/30',
    text: 'text-blue-400',
    logo: '⌚',
  },
  {
    id: 'fitbit',
    name: 'Fitbit',
    description: 'Fitbit & Versa',
    color: 'from-cyan-500/20 to-teal-500/10',
    border: 'border-cyan-500/30',
    text: 'text-cyan-400',
    logo: '💪',
  },
]

interface Device {
  id: string
  type: string
  brand: string
  model: string
  isConnected: boolean
  lastSyncedAt: string | null
}

interface DevicesTabProps {
  devices: Device[]
  onConnect: (provider: string) => Promise<void>
  onDisconnect: (id: string) => Promise<void>
  onManualEntry: (type: string, value: number) => Promise<void>
  onSync: () => Promise<void>
}

export function DevicesTab({
  devices,
  onConnect,
  onDisconnect,
  onManualEntry,
  onSync,
}: DevicesTabProps) {
  const [connecting, setConnecting] = useState<string | null>(null)
  const [syncing, setSyncing] = useState(false)
  const [manualOpen, setManualOpen] = useState(false)

  const connectedTypes = new Set(devices.filter((d) => d.isConnected).map((d) => d.type))

  async function handleConnect(provider: string) {
    setConnecting(provider)
    await onConnect(provider)
    setConnecting(null)
  }

  async function handleSync() {
    setSyncing(true)
    await onSync()
    setSyncing(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">Cihazlar & Bağlantılar</h2>
        <button
          onClick={handleSync}
          disabled={syncing || devices.length === 0}
          className="bg-muted/30 border-border/30 hover:border-border/60 flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-xs font-bold transition-all disabled:opacity-50"
        >
          <motion.div
            animate={syncing ? { rotate: 360 } : { rotate: 0 }}
            transition={syncing ? { repeat: Infinity, duration: 1, ease: 'linear' } : {}}
          >
            <RefreshCw size={12} />
          </motion.div>
          {syncing ? 'Senkronize Ediliyor...' : 'Sync Et'}
        </button>
      </div>

      {/* Connected devices */}
      {devices.filter((d) => d.isConnected && d.type !== 'manual').length > 0 && (
        <div className="space-y-3">
          <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">
            Bağlı Cihazlar
          </p>
          {devices
            .filter((d) => d.isConnected && d.type !== 'manual')
            .map((device) => (
              <motion.div
                key={device.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-4 rounded-2xl border border-green-500/20 bg-green-500/5 p-4"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-500/10">
                  <Watch size={18} className="text-green-400" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold">
                    {device.brand} {device.model}
                  </p>
                  <p className="mt-0.5 flex items-center gap-1 text-xs text-green-400">
                    <CheckCircle size={10} />
                    Bağlı{' '}
                    {device.lastSyncedAt
                      ? `· Son sync: ${new Date(device.lastSyncedAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}`
                      : ''}
                  </p>
                </div>
                <button
                  onClick={() => onDisconnect(device.id)}
                  className="text-muted-foreground cursor-pointer rounded-xl p-2 transition-all hover:bg-red-500/10 hover:text-red-400"
                >
                  <Trash2 size={14} />
                </button>
              </motion.div>
            ))}
        </div>
      )}

      {/* Available providers */}
      <div className="space-y-3">
        <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">
          Platform Bağla
        </p>
        {PROVIDERS.map((provider, i) => {
          const isConnected = connectedTypes.has(provider.id)
          const isLoading = connecting === provider.id
          return (
            <motion.button
              key={provider.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
              onClick={() => !isConnected && handleConnect(provider.id)}
              disabled={isConnected || isLoading}
              className={`flex w-full items-center gap-4 bg-gradient-to-r p-4 ${provider.color} border ${provider.border} cursor-pointer rounded-2xl transition-all hover:opacity-90 disabled:cursor-default`}
            >
              <span className="text-2xl">{provider.logo}</span>
              <div className="flex-1 text-left">
                <p className="text-sm font-bold">{provider.name}</p>
                <p className="text-muted-foreground text-xs">{provider.description}</p>
              </div>
              {isConnected ? (
                <CheckCircle size={16} className="text-green-400" />
              ) : isLoading ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                >
                  <RefreshCw size={14} className={provider.text} />
                </motion.div>
              ) : (
                <ExternalLink size={14} className={provider.text} />
              )}
            </motion.button>
          )
        })}
      </div>

      {/* Manual entry */}
      <div className="bg-card/50 border-border/30 rounded-3xl border p-6">
        <p className="text-muted-foreground mb-3 text-xs font-semibold uppercase tracking-wider">
          Cihazın Yoksa
        </p>
        <p className="text-muted-foreground mb-4 text-sm">
          Adım, nabız, uyku gibi verileri manuel olarak girebilirsin.
        </p>
        <button
          onClick={() => setManualOpen(true)}
          className="bg-muted/30 border-border/50 hover:border-border flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-bold transition-all"
        >
          <Plus size={14} />
          Manuel Veri Gir
        </button>
      </div>

      <ManualEntryModal
        open={manualOpen}
        onClose={() => setManualOpen(false)}
        onSave={onManualEntry}
      />
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/app/\(dashboard\)/dashboard/health/components/
git commit -m "feat(health): add DevicesTab with OAuth connect, sync and manual entry"
```

---

## Chunk 4: Main Page & AI Integration

### Task 11: AI Insight Generator

**Files:**

- Create: `apps/web/lib/health/generateHealthInsight.ts`
- Create: `apps/web/app/api/health/insight/route.ts`

- [ ] **Step 1: `generateHealthInsight.ts`**

```typescript
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic()

interface HealthContext {
  tab: 'overview' | 'activity' | 'sleep' | 'water' | 'body'
  heartRate?: number
  avgSteps?: number
  stepGoal?: number
  avgSleepH?: number
  sleepGoal?: number
  waterLiters?: number
  waterGoalL?: number
  weightKg?: number
  targetWeightKg?: number
  bmi?: number
  hrv?: number
  spo2?: number
}

export async function generateHealthInsight(ctx: HealthContext): Promise<string> {
  const tabPrompts: Record<string, string> = {
    overview: `Kullanıcının sağlık genel bakışı: Nabız ${ctx.heartRate ?? '–'} bpm, günlük ortalama adım ${ctx.avgSteps ?? '–'} (hedef: ${ctx.stepGoal ?? 10000}), uyku ortalaması ${ctx.avgSleepH ?? '–'} saat (hedef: ${ctx.sleepGoal ?? 8}), su tüketimi ${ctx.waterLiters ?? '–'}L. Kısa, motive edici 1 cümle öneri ver.`,
    activity: `Kullanıcının aktivite verisi: Günlük adım ${ctx.avgSteps ?? '–'} (hedef: ${ctx.stepGoal ?? 10000}), HRV ${ctx.hrv ?? '–'} ms. Bu veriye göre aktivite veya toparlanma önerisi ver. 1 cümle.`,
    sleep: `Kullanıcının uyku ortalaması ${ctx.avgSleepH ?? '–'} saat, hedef ${ctx.sleepGoal ?? 8} saat. Uyku kalitesini iyileştirmek için 1 kısa somut öneri ver.`,
    water: `Kullanıcı bugün ${ctx.waterLiters ?? '–'}L su içti, hedef ${ctx.waterGoalL ?? 2.5}L. Su tüketimi hakkında 1 kısa motive edici cümle söyle.`,
    body: `Kullanıcının kilosu ${ctx.weightKg ?? '–'} kg, BMI ${ctx.bmi ?? '–'}, hedef kilo ${ctx.targetWeightKg ?? '–'} kg. Vücut kompozisyonu hakkında 1 kısa pratik öneri ver.`,
  }

  const prompt = tabPrompts[ctx.tab]

  try {
    const msg = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 120,
      system:
        'Sen bir Türkçe konuşan kişisel fitness koçusun. Kullanıcının sağlık verilerine göre kısa, samimi ve motive edici öneriler verirsin. Sadece 1 cümle yaz.',
      messages: [{ role: 'user', content: prompt }],
    })
    return (msg.content[0] as { text: string }).text.trim()
  } catch {
    return 'Verilerine bakıyorum, yakında önerin hazır olacak.'
  }
}
```

- [ ] **Step 2: `/api/health/insight/route.ts`**

```typescript
import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { generateHealthInsight } from '@/lib/health/generateHealthInsight'

export async function POST(req: Request) {
  const { userId: clerkId } = await auth()
  if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const ctx = await req.json()
  const insight = await generateHealthInsight(ctx)
  return NextResponse.json({ insight })
}
```

- [ ] **Step 3: Commit**

```bash
git add apps/web/lib/health/ apps/web/app/api/health/insight/
git commit -m "feat(health): add AI health insight generator per tab"
```

---

### Task 12: Ana Sayfa — page.tsx Yeniden Yaz

**Files:**

- Modify: `apps/web/app/(dashboard)/dashboard/health/page.tsx`

Bu dosyayı tamamen sıfırdan yaz. Tüm tab'ları orchestrate eder.

- [ ] **Step 1: Yeni `page.tsx`**

```tsx
'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Activity, Moon, Droplets, Scale, Watch, LayoutDashboard } from 'lucide-react'
import { MacbookLoader } from '@/components/ui/macbook-loader'
import { OverviewTab } from './components/OverviewTab'
import { ActivityTab } from './components/ActivityTab'
import { SleepTab } from './components/SleepTab'
import { WaterTab } from './components/WaterTab'
import { BodyTab } from './components/BodyTab'
import { DevicesTab } from './components/DevicesTab'

type Tab = 'overview' | 'activity' | 'sleep' | 'water' | 'body' | 'devices'

const TABS: { id: Tab; label: string; icon: typeof Activity; color: string }[] = [
  { id: 'overview', label: 'Genel', icon: LayoutDashboard, color: 'text-purple-400' },
  { id: 'activity', label: 'Aktivite', icon: Activity, color: 'text-purple-400' },
  { id: 'sleep', label: 'Uyku', icon: Moon, color: 'text-indigo-400' },
  { id: 'water', label: 'Su', icon: Droplets, color: 'text-blue-400' },
  { id: 'body', label: 'Vücut', icon: Scale, color: 'text-emerald-400' },
  { id: 'devices', label: 'Cihazlar', icon: Watch, color: 'text-slate-400' },
]

export default function HealthPage() {
  const [activeTab, setActiveTab] = useState<Tab>('overview')
  const [loading, setLoading] = useState(true)

  // Data state
  const [overview, setOverview] = useState<any>(null)
  const [activityData, setActivityData] = useState<any>(null)
  const [sleepData, setSleepData] = useState<any>(null)
  const [waterData, setWaterData] = useState<any>({ totalMl: 0, count: 0 })
  const [devices, setDevices] = useState<any[]>([])
  const [goals, setGoals] = useState<any>({
    dailySteps: 10000,
    sleepHours: 8,
    waterMl: 2500,
    targetWeightKg: null,
  })
  const [insights, setInsights] = useState<Record<Tab, string>>({
    overview: 'Sağlık verilerine bakıyorum...',
    activity: 'Aktivite verilerine bakıyorum...',
    sleep: 'Uyku verilerine bakıyorum...',
    water: 'Su verilerine bakıyorum...',
    body: 'Vücut verilerine bakıyorum...',
    devices: '',
  })

  const fetchAll = useCallback(async () => {
    setLoading(true)
    try {
      const [ovRes, actRes, sleepRes, waterRes, devRes, goalRes] = await Promise.all([
        fetch('/api/health'),
        fetch('/api/health/activity?days=7'),
        fetch('/api/health/sleep?days=7'),
        fetch('/api/health/water'),
        fetch('/api/health/devices'),
        fetch('/api/health/goals'),
      ])
      const [ov, act, sleep, water, devs, goal] = await Promise.all([
        ovRes.json(),
        actRes.json(),
        sleepRes.json(),
        waterRes.json(),
        devRes.json(),
        goalRes.json(),
      ])
      setOverview(ov)
      setActivityData(act)
      setSleepData(sleep)
      setWaterData(water)
      setDevices(devs)
      setGoals(goal)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  // Fetch AI insight when tab changes
  useEffect(() => {
    if (activeTab === 'devices') return
    const ctx = buildInsightCtx(activeTab)
    fetch('/api/health/insight', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(ctx),
    })
      .then((r) => r.json())
      .then((d) => setInsights((prev) => ({ ...prev, [activeTab]: d.insight })))
      .catch(() => {})
  }, [activeTab, overview, goals]) // eslint-disable-line

  function buildInsightCtx(tab: Tab) {
    const latest = overview?.latestReadings ?? {}
    const weightEntries = overview?.weightEntries ?? []
    const latestWeight = weightEntries[0]?.weightKg
    const heightCm = overview?.profile?.heightCm
    const bmi =
      latestWeight && heightCm
        ? +(latestWeight / Math.pow(heightCm / 100, 2)).toFixed(1)
        : undefined

    return {
      tab,
      heartRate: latest['heart_rate'],
      avgSteps: overview?.avgSteps,
      stepGoal: goals.dailySteps,
      avgSleepH: sleepData?.avg,
      sleepGoal: goals.sleepHours,
      waterLiters: waterData?.totalMl ? +(waterData.totalMl / 1000).toFixed(1) : undefined,
      waterGoalL: +(goals.waterMl / 1000).toFixed(1),
      weightKg: latestWeight,
      targetWeightKg: goals.targetWeightKg,
      bmi,
      hrv: latest['hrv'],
      spo2: latest['spo2'],
    }
  }

  async function handleAddWater(ml: number) {
    const res = await fetch('/api/health/water', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ml }),
    })
    const data = await res.json()
    setWaterData({ totalMl: data.totalMl, count: waterData.count + 1 })
  }

  async function handleAddWeight(kg: number) {
    await fetch('/api/health/weight', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ weightKg: kg }),
    })
    await fetchAll()
  }

  async function handleConnectDevice(provider: string) {
    const res = await fetch('/api/health/devices/connect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ provider }),
    })
    const { redirectUrl } = await res.json()
    window.location.href = redirectUrl
  }

  async function handleDisconnect(id: string) {
    await fetch('/api/health/devices', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    setDevices((prev) => prev.filter((d) => d.id !== id))
  }

  async function handleManualEntry(type: string, value: number) {
    await fetch('/api/health/manual', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, value }),
    })
    await fetchAll()
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="scale-[1.5]">
          <MacbookLoader />
        </motion.div>
      </div>
    )
  }

  const latest = overview?.latestReadings ?? {}
  const heartRate = latest['heart_rate'] ?? 68
  const spo2 = latest['spo2'] ?? 98
  const hrv = latest['hrv'] ?? null
  const weightEntries = overview?.weightEntries ?? []
  const heightCm = overview?.profile?.heightCm ?? 170

  const activityChartData = (activityData?.chartData ?? []).map((d: any) => ({
    date: d.date,
    value: d.steps ?? 0,
  }))
  const caloriesData = (activityData?.chartData ?? []).map((d: any) => ({
    date: d.date,
    value: d.calories ?? 0,
  }))

  return (
    <div className="max-w-4xl space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="mb-1 text-3xl font-black">Sağlık Merkezi</h1>
        <p className="text-muted-foreground text-sm">
          Tüm sağlık verilerini tek bir yerden takip et
        </p>
      </motion.div>

      {/* Tab Bar */}
      <div className="bg-muted/20 border-border/30 no-scrollbar flex gap-1 overflow-x-auto rounded-2xl border p-1.5">
        {TABS.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex flex-shrink-0 cursor-pointer items-center gap-2 whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-bold transition-all ${
                isActive ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="tab-pill"
                  className="bg-card border-border/50 absolute inset-0 rounded-xl border shadow-sm"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-1.5">
                <Icon size={14} className={isActive ? tab.color : ''} />
                {tab.label}
              </span>
            </button>
          )
        })}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === 'overview' && (
            <OverviewTab
              heartRate={heartRate}
              spo2={spo2}
              avgSteps={overview?.avgSteps ?? 0}
              avgSleepH={sleepData?.avg ?? 0}
              waterLiters={waterData?.totalMl ? waterData.totalMl / 1000 : 0}
              stressScore={null}
              waterGoalL={goals.waterMl / 1000}
              stepGoal={goals.dailySteps}
              sleepGoal={goals.sleepHours}
              aiInsight={insights.overview}
            />
          )}
          {activeTab === 'activity' && (
            <ActivityTab
              todaySteps={overview?.avgSteps ?? 0}
              stepGoal={goals.dailySteps}
              avgHeartRate={heartRate}
              hrv={hrv}
              chartData={activityChartData}
              caloriesData={caloriesData}
              aiInsight={insights.activity}
            />
          )}
          {activeTab === 'sleep' && (
            <SleepTab
              chartData={overview?.sleepData ?? []}
              avg={sleepData?.avg ?? 0}
              goal={goals.sleepHours}
              aiInsight={insights.sleep}
            />
          )}
          {activeTab === 'water' && (
            <WaterTab
              totalMl={waterData?.totalMl ?? 0}
              goalMl={goals.waterMl}
              count={waterData?.count ?? 0}
              weeklyData={[]}
              aiInsight={insights.water}
              onAddWater={handleAddWater}
            />
          )}
          {activeTab === 'body' && (
            <BodyTab
              weightEntries={weightEntries}
              heightCm={heightCm}
              targetWeightKg={goals.targetWeightKg}
              aiInsight={insights.body}
              onAddWeight={handleAddWeight}
            />
          )}
          {activeTab === 'devices' && (
            <DevicesTab
              devices={devices}
              onConnect={handleConnectDevice}
              onDisconnect={handleDisconnect}
              onManualEntry={handleManualEntry}
              onSync={fetchAll}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/app/\(dashboard\)/dashboard/health/page.tsx
git commit -m "feat(health): rewrite health page with 6-tab layout and full orchestration"
```

---

## Chunk 5: URL Params & Polish

### Task 13: URL Tab Sync & Query Param Support

Cihaz OAuth callback'ten dönerken `?tab=devices&connected=google_fit` gibi param geliyor. Bunu handle et.

**Files:**

- Modify: `apps/web/app/(dashboard)/dashboard/health/page.tsx`

- [ ] **Step 1: useSearchParams ile tab sync ekle**

`page.tsx` içindeki `useState<Tab>('overview')` satırını şununla değiştir:

```tsx
import { useSearchParams, useRouter } from 'next/navigation'

// page.tsx içinde:
const searchParams = useSearchParams()
const router = useRouter()
const [activeTab, setActiveTab] = useState<Tab>((searchParams.get('tab') as Tab) ?? 'overview')

function handleTabChange(tab: Tab) {
  setActiveTab(tab)
  router.replace(`/dashboard/health?tab=${tab}`, { scroll: false })
}
```

Tab butonlarında `setActiveTab(tab.id)` → `handleTabChange(tab.id)` olarak güncelle.

- [ ] **Step 2: OAuth success toast ekle**

```tsx
import { useEffect } from 'react'
import { toast } from 'sonner' // veya mevcut toast

useEffect(() => {
  const connected = searchParams.get('connected')
  if (connected) {
    toast.success(`${connected.replace('_', ' ')} başarıyla bağlandı!`)
    router.replace('/dashboard/health?tab=devices', { scroll: false })
  }
}, [])
```

- [ ] **Step 3: Commit**

```bash
git add apps/web/app/\(dashboard\)/dashboard/health/page.tsx
git commit -m "feat(health): add URL tab sync and OAuth success toast"
```

---

### Task 14: Son Kontroller

- [ ] **Step 1: TypeScript hatası kontrol**

```bash
cd apps/web && npx tsc --noEmit 2>&1 | head -50
```

Çıkan hataları düzelt.

- [ ] **Step 2: Dev server başlat ve test et**

```bash
pnpm dev
```

Tarayıcıda `/dashboard/health` aç. Her tab'a gir. Manuel veri gir. Cihaz bağlantısı dene.

- [ ] **Step 3: Checklist**

- [ ] Her tab açılıyor
- [ ] Loading skeleton görünüyor
- [ ] Tab geçişleri animate oluyor
- [ ] Tüm kartlarda `cursor-pointer` var
- [ ] Mobil görünüm (375px) tab bar scroll ediyor
- [ ] AI insight her tab için yükleniyor
- [ ] Manuel giriş modal açılıp kapanıyor
- [ ] Kilo girişi kaydediliyor
- [ ] Su ekleme çalışıyor
- [ ] Cihaz bağlantısı OAuth flow'u başlatıyor

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "feat(health): complete health dashboard rewrite - 6 tabs, OAuth, AI insights, body tracking"
```
