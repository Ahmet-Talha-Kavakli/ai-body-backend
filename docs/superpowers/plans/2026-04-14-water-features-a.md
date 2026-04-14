# Water Features A: AI Su Koçu + Hatırlatıcı Saatleri Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Su eklenince AI'dan anlık yorum (toast) + kullanıcının kendi hatırlatıcı saatlerini ayarlayabilmesi (interval veya manuel saatler).

**Architecture:** `WaterSettings` modeline `reminderMode`, `reminderIntervalHours`, `reminderTimes` alanları eklenir. Water POST route'una AI yorum üretimi eklenir (fire-and-forget değil, response'a dahil). Frontend'de `CoachToast` komponenti eklenir. Settings paneline "Hatırlatıcılar" bölümü eklenir.

**Tech Stack:** Next.js 15, Prisma, OpenAI API (`gpt-4o-mini`), Framer Motion, Tailwind CSS, Vitest

---

## Chunk 1: DB Schema + Settings API

### Task 1: WaterSettings Schema Güncelleme

**Files:**

- Modify: `apps/web/prisma/schema.prisma`

- [ ] **Step 1: WaterSettings modeline alanlar ekle**

`apps/web/prisma/schema.prisma` dosyasında `WaterSettings` modelini bul ve şu alanları ekle (cupSizeMl'den sonra):

```prisma
  reminderMode          String   @default("interval") // "interval" | "manual"
  reminderIntervalHours Int      @default(2)
  reminderTimes         String[] @default([])
  isManualGoal          Boolean  @default(false)
  city                  String?
  tempBonusMl           Int      @default(0)
```

- [ ] **Step 2: WaterStreak modeline freeze alanları ekle**

`WaterStreak` modelinde `totalDaysGoal` satırından sonra ekle:

```prisma
  freezeCharges         Int      @default(0)
  freezeUsedDates       String[] @default([])
```

- [ ] **Step 3: Prisma generate + db push**

```bash
cd c:/Users/TUF/Desktop/Ai-Pt/apps/web && npx prisma generate && npx prisma db push --accept-data-loss 2>&1 | tail -5
```

Expected: `Your database is now in sync with your Prisma schema`

- [ ] **Step 4: Commit**

```bash
cd c:/Users/TUF/Desktop/Ai-Pt && git add apps/web/prisma/schema.prisma && git commit -m "feat(water): extend WaterSettings and WaterStreak schema for new features"
```

---

### Task 2: Settings API — Reminder alanlarını destekle (TDD)

**Files:**

- Modify: `apps/web/app/api/nutrition/water/settings/route.ts`
- Create: `apps/web/app/api/nutrition/water/__tests__/water-settings-reminder.test.ts`

Mevcut settings route'u şu an sadece `dailyGoalMl` ve `cupSizeMl` alıyor. Yeni alanları da kabul etmeli.

**Not:** Mevcut `water-api.test.ts` dosyasına ekleme yapma — o dosyadaki `mockDb` farklı bir pattern kullanıyor. Ayrı bir test dosyası oluştur.

- [ ] **Step 1: Ayrı test dosyası oluştur**

`apps/web/app/api/nutrition/water/__tests__/water-settings-reminder.test.ts` oluştur:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

const mockDb = {
  user: { findUnique: vi.fn() },
  waterSettings: { findUnique: vi.fn(), upsert: vi.fn() },
}

vi.mock('@/lib/db/client', () => ({ db: mockDb }))
vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn().mockResolvedValue({ userId: 'clerk_123' }),
}))

describe('PUT /api/nutrition/water/settings - reminder fields', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockDb.user.findUnique.mockResolvedValue({ id: 'user_1' })
  })

  it('saves reminderMode and reminderIntervalHours', async () => {
    mockDb.waterSettings.upsert.mockResolvedValue({
      dailyGoalMl: 2500,
      cupSizeMl: 200,
      reminderMode: 'interval',
      reminderIntervalHours: 3,
      reminderTimes: [],
      isManualGoal: false,
      city: null,
      tempBonusMl: 0,
    })

    const req = new NextRequest('http://localhost/api/nutrition/water/settings', {
      method: 'PUT',
      body: JSON.stringify({
        dailyGoalMl: 2500,
        cupSizeMl: 200,
        reminderMode: 'interval',
        reminderIntervalHours: 3,
        reminderTimes: [],
        isManualGoal: false,
      }),
      headers: { 'Content-Type': 'application/json' },
    })

    const { PUT } = await import('../settings/route')
    const res = await PUT(req)
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.success).toBe(true)
    expect(mockDb.waterSettings.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        update: expect.objectContaining({
          reminderMode: 'interval',
          reminderIntervalHours: 3,
        }),
      })
    )
  })

  it('saves manual reminder times', async () => {
    mockDb.waterSettings.upsert.mockResolvedValue({})

    const req = new NextRequest('http://localhost/api/nutrition/water/settings', {
      method: 'PUT',
      body: JSON.stringify({
        dailyGoalMl: 2500,
        cupSizeMl: 200,
        reminderMode: 'manual',
        reminderIntervalHours: 2,
        reminderTimes: ['09:00', '12:00', '18:00'],
        isManualGoal: false,
      }),
      headers: { 'Content-Type': 'application/json' },
    })

    const { PUT } = await import('../settings/route')
    const res = await PUT(req)
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(mockDb.waterSettings.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        update: expect.objectContaining({
          reminderMode: 'manual',
          reminderTimes: ['09:00', '12:00', '18:00'],
        }),
      })
    )
  })
})
```

- [ ] **Step 2: Testi çalıştır, FAIL olduğunu doğrula**

```bash
cd c:/Users/TUF/Desktop/Ai-Pt/apps/web && npx vitest run app/api/nutrition/water/__tests__/water-settings-reminder.test.ts --reporter=verbose 2>&1 | tail -20
```

Expected: FAIL — upsert'te yeni alanlar yok

- [ ] **Step 3: Settings route'u güncelle**

`apps/web/app/api/nutrition/water/settings/route.ts` dosyasını tamamen şununla değiştir:

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
      settings: settings ?? {
        dailyGoalMl: 2500,
        cupSizeMl: 200,
        reminderMode: 'interval',
        reminderIntervalHours: 2,
        reminderTimes: [],
        isManualGoal: false,
        city: null,
        tempBonusMl: 0,
      },
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

    const {
      dailyGoalMl,
      cupSizeMl,
      reminderMode,
      reminderIntervalHours,
      reminderTimes,
      isManualGoal,
      city,
    } = await req.json()

    const data: Record<string, unknown> = {}
    if (dailyGoalMl !== undefined) data.dailyGoalMl = dailyGoalMl
    if (cupSizeMl !== undefined) data.cupSizeMl = cupSizeMl
    if (reminderMode !== undefined) data.reminderMode = reminderMode
    if (reminderIntervalHours !== undefined) data.reminderIntervalHours = reminderIntervalHours
    if (reminderTimes !== undefined) data.reminderTimes = reminderTimes
    if (isManualGoal !== undefined) data.isManualGoal = isManualGoal
    if (city !== undefined) data.city = city

    await db.waterSettings.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        dailyGoalMl: dailyGoalMl ?? 2500,
        cupSizeMl: cupSizeMl ?? 200,
        ...data,
      },
      update: data,
    })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

- [ ] **Step 4: Testi çalıştır, PASS olduğunu doğrula**

```bash
cd c:/Users/TUF/Desktop/Ai-Pt/apps/web && npx vitest run app/api/nutrition/water/__tests__/water-settings-reminder.test.ts --reporter=verbose 2>&1 | tail -20
```

Expected: All tests PASS

- [ ] **Step 5: Commit**

```bash
cd c:/Users/TUF/Desktop/Ai-Pt && git add apps/web/app/api/nutrition/water/settings/route.ts apps/web/app/api/nutrition/water/__tests__/water-settings-reminder.test.ts && git commit -m "feat(water): extend settings API with reminder and goal fields"
```

---

## Chunk 2: AI Su Koçu

### Task 3: Water POST route'una AI yorum ekle (TDD)

**Files:**

- Modify: `apps/web/app/api/nutrition/water/route.ts`
- Create: `apps/web/app/api/nutrition/water/__tests__/water-coach.test.ts`

Su eklenince `coachMessage` field'ı response'a eklenir. OpenAI `gpt-4o-mini` ile kısa Türkçe yorum üretilir.

- [ ] **Step 1: Test dosyası oluştur**

`apps/web/app/api/nutrition/water/__tests__/water-coach.test.ts` dosyasını oluştur:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

process.env.CRON_SECRET = 'test-secret'

const mockDb = {
  user: { findUnique: vi.fn() },
  waterLog: { findUnique: vi.fn(), upsert: vi.fn() },
  waterSettings: { findUnique: vi.fn() },
  waterStreak: { findUnique: vi.fn(), upsert: vi.fn() },
}

vi.mock('@/lib/db/client', () => ({ db: mockDb }))
vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn().mockResolvedValue({ userId: 'clerk_123' }),
}))

const mockCreate = vi.fn()
vi.mock('@/lib/ai/client', () => ({
  openai: {
    chat: {
      completions: {
        create: mockCreate,
      },
    },
  },
}))

describe('POST /api/nutrition/water - coach message', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockDb.user.findUnique.mockResolvedValue({ id: 'user_1' })
    mockDb.waterSettings.findUnique.mockResolvedValue({ cupSizeMl: 200, dailyGoalMl: 2500 })
    mockDb.waterLog.findUnique.mockResolvedValue(null)
    mockDb.waterLog.upsert.mockResolvedValue({ glasses: 1, amountMl: 200 })
    mockDb.waterStreak.findUnique.mockResolvedValue(null)
    mockDb.waterStreak.upsert.mockResolvedValue({})
    mockCreate.mockResolvedValue({
      choices: [{ message: { content: 'Harika, güne iyi başladın!' } }],
    })
  })

  it('returns coachMessage in response after adding water', async () => {
    const req = new NextRequest('http://localhost/api/nutrition/water', {
      method: 'POST',
      body: JSON.stringify({ ml: 200 }),
      headers: { 'Content-Type': 'application/json' },
    })

    const { POST } = await import('../route')
    const res = await POST(req)
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.coachMessage).toBe('Harika, güne iyi başladın!')
  })

  it('returns null coachMessage if AI fails', async () => {
    mockCreate.mockRejectedValue(new Error('AI error'))

    const req = new NextRequest('http://localhost/api/nutrition/water', {
      method: 'POST',
      body: JSON.stringify({ ml: 200 }),
      headers: { 'Content-Type': 'application/json' },
    })

    const { POST } = await import('../route')
    const res = await POST(req)
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.coachMessage).toBeNull()
  })
})
```

- [ ] **Step 2: Testi çalıştır, FAIL olduğunu doğrula**

```bash
cd c:/Users/TUF/Desktop/Ai-Pt/apps/web && npx vitest run app/api/nutrition/water/__tests__/water-coach.test.ts --reporter=verbose 2>&1 | tail -20
```

Expected: FAIL — coachMessage not in response

- [ ] **Step 3: Water POST route'una AI yorum ekle**

`apps/web/app/api/nutrition/water/route.ts` dosyasındaki `POST` fonksiyonunu güncelle. Dosyanın başına import ekle:

```typescript
import { openai } from '@/lib/ai/client'
```

Sonra POST fonksiyonunda `return NextResponse.json({ success: true, glasses: log.glasses, amountMl: log.amountMl })` satırını şununla değiştir:

```typescript
// AI koç yorumu üret
let coachMessage: string | null = null
try {
  const hour = new Date().getHours()
  const timeOfDay = hour < 12 ? 'sabah' : hour < 17 ? 'öğleden sonra' : 'akşam'
  const percentage = Math.round((newAmountMl / dailyGoalMl) * 100)

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content:
          'Sen bir su içme koçusun. Kullanıcıya kısa (1-2 cümle), samimi ve motive edici Türkçe yorumlar yap. Emoji kullanabilirsin.',
      },
      {
        role: 'user',
        content: `Kullanıcı ${timeOfDay} saatinde ${addMl}ml su içti. Günlük hedefe ulaşma oranı: %${percentage}. Kısa bir yorum yap.`,
      },
    ],
    max_tokens: 80,
    temperature: 0.8,
  })
  coachMessage = completion.choices[0]?.message?.content ?? null
} catch {
  // AI başarısız olursa sessizce devam et
  coachMessage = null
}

return NextResponse.json({
  success: true,
  glasses: log.glasses,
  amountMl: log.amountMl,
  coachMessage,
})
```

- [ ] **Step 4: Testi çalıştır, PASS olduğunu doğrula**

```bash
cd c:/Users/TUF/Desktop/Ai-Pt/apps/web && npx vitest run app/api/nutrition/water/__tests__/water-coach.test.ts --reporter=verbose 2>&1 | tail -20
```

Expected: All tests PASS

- [ ] **Step 5: Commit**

```bash
cd c:/Users/TUF/Desktop/Ai-Pt && git add apps/web/app/api/nutrition/water/route.ts apps/web/app/api/nutrition/water/__tests__/water-coach.test.ts && git commit -m "feat(water): add AI coach message to water POST response"
```

---

### Task 4: CoachToast UI Komponenti

**Files:**

- Create: `apps/web/components/water/CoachToast.tsx`
- Modify: `apps/web/app/(dashboard)/dashboard/water/page.tsx`

- [ ] **Step 1: CoachToast.tsx oluştur**

`apps/web/components/water/CoachToast.tsx` dosyasını oluştur:

```typescript
'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Bot } from 'lucide-react'

interface CoachToastProps {
  message: string | null
}

export function CoachToast({ message }: CoachToastProps) {
  return (
    <AnimatePresence>
      {message && (
        <motion.div
          key={message}
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className="flex items-start gap-3 rounded-2xl border border-[#3B82F6]/20 bg-[#3B82F6]/10 p-4"
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#3B82F6]/20">
            <Bot size={16} className="text-[#3B82F6]" />
          </div>
          <p className="text-sm leading-relaxed text-white/90">{message}</p>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
```

- [ ] **Step 2: Water page'e CoachToast entegre et**

`apps/web/app/(dashboard)/dashboard/water/page.tsx` dosyasını aç.

Import'lara ekle:

```typescript
import { CoachToast } from '@/components/water/CoachToast'
```

State'e ekle (diğer useState'lerin yanına):

```typescript
const [coachMessage, setCoachMessage] = useState<string | null>(null)
```

`handleAdd` fonksiyonunu güncelle — mevcut `setWater` satırından sonra ekle:

```typescript
if (res.coachMessage) {
  setCoachMessage(res.coachMessage)
  setTimeout(() => setCoachMessage(null), 5000)
}
```

JSX'te `WaterWave` motion.div'inden önce (Hızlı Ekleme'den önce) CoachToast ekle:

```tsx
{
  /* AI Koç Yorumu */
}
;<CoachToast message={coachMessage} />
```

- [ ] **Step 3: Dev server'da test et**

`http://localhost:3000/dashboard/water` aç. Su ekle (1 Bardak veya 500ml), AI koç mesajının mavi kutuda belirip 5 saniye sonra kaybolduğunu doğrula.

- [ ] **Step 4: Commit**

```bash
cd c:/Users/TUF/Desktop/Ai-Pt && git add apps/web/components/water/CoachToast.tsx apps/web/app/\(dashboard\)/dashboard/water/page.tsx && git commit -m "feat(water): add AI coach toast on water intake"
```

---

## Chunk 3: Hatırlatıcı Saatleri UI

### Task 5: WaterSettingsPanel'e Hatırlatıcılar Bölümü

**Files:**

- Modify: `apps/web/components/water/WaterSettingsPanel.tsx`
- Modify: `apps/web/app/(dashboard)/dashboard/water/page.tsx`

Settings paneline "Hatırlatıcılar" bölümü eklenir — interval modu ve manuel saat seçimi.

- [ ] **Step 1: WaterSettingsPanel interface ve props güncelle**

`apps/web/components/water/WaterSettingsPanel.tsx` dosyasını tamamen şununla değiştir:

```typescript
'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Settings, X, Loader2, Plus, Trash2 } from 'lucide-react'

interface ReminderSettings {
  reminderMode: 'interval' | 'manual'
  reminderIntervalHours: number
  reminderTimes: string[]
}

interface WaterSettingsPanelProps {
  dailyGoalMl: number
  cupSizeMl: number
  reminderMode: 'interval' | 'manual'
  reminderIntervalHours: number
  reminderTimes: string[]
  onSave: (
    dailyGoalMl: number,
    cupSizeMl: number,
    reminder: ReminderSettings
  ) => Promise<void>
}

export function WaterSettingsPanel({
  dailyGoalMl,
  cupSizeMl,
  reminderMode,
  reminderIntervalHours,
  reminderTimes,
  onSave,
}: WaterSettingsPanelProps) {
  const [open, setOpen] = useState(false)
  const [goal, setGoal] = useState(dailyGoalMl)
  const [cup, setCup] = useState(cupSizeMl)
  const [mode, setMode] = useState<'interval' | 'manual'>(reminderMode)
  const [intervalHours, setIntervalHours] = useState(reminderIntervalHours)
  const [times, setTimes] = useState<string[]>(reminderTimes)
  const [newTime, setNewTime] = useState('09:00')
  const [saving, setSaving] = useState(false)

  const addTime = () => {
    if (!times.includes(newTime)) {
      setTimes((prev) => [...prev, newTime].sort())
    }
  }

  const removeTime = (t: string) => setTimes((prev) => prev.filter((x) => x !== t))

  const handleSave = async () => {
    setSaving(true)
    await onSave(goal, cup, {
      reminderMode: mode,
      reminderIntervalHours: intervalHours,
      reminderTimes: times,
    })
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
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 backdrop-blur-sm sm:items-center"
            onClick={() => setOpen(false)}
          >
            <motion.div
              initial={{ y: 60, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 60, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm space-y-5 rounded-3xl border border-white/[0.08] bg-[#111118] p-6 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-white">Su Takip Ayarları</h3>
                <button onClick={() => setOpen(false)} className="text-[#64748B] hover:text-white">
                  <X size={18} />
                </button>
              </div>

              {/* Günlük Hedef */}
              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-xs text-[#64748B]">Günlük Hedef (ml)</label>
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
                    className="mt-2 w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-sm text-white outline-none focus:border-[#3B82F6]/50"
                  />
                </div>

                {/* Bardak Boyutu */}
                <div>
                  <label className="mb-2 block text-xs text-[#64748B]">Bardak Boyutu (ml)</label>
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

                {/* Hatırlatıcılar */}
                <div>
                  <label className="mb-2 block text-xs text-[#64748B]">Hatırlatıcı Modu</label>
                  <div className="flex gap-2">
                    {(['interval', 'manual'] as const).map((m) => (
                      <button
                        key={m}
                        onClick={() => setMode(m)}
                        className={`flex-1 rounded-xl py-2 text-xs font-semibold transition-colors ${
                          mode === m
                            ? 'bg-[#3B82F6] text-white'
                            : 'bg-white/[0.04] text-[#64748B] hover:bg-white/[0.08]'
                        }`}
                      >
                        {m === 'interval' ? '⏱ Aralıklı' : '🕐 Manuel Saatler'}
                      </button>
                    ))}
                  </div>

                  <AnimatePresence mode="wait">
                    {mode === 'interval' ? (
                      <motion.div
                        key="interval"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-3"
                      >
                        <label className="mb-2 block text-xs text-[#64748B]">
                          Her kaç saatte bir?
                        </label>
                        <div className="flex gap-2">
                          {[1, 2, 3, 4].map((h) => (
                            <button
                              key={h}
                              onClick={() => setIntervalHours(h)}
                              className={`flex-1 rounded-xl py-2 text-xs font-semibold transition-colors ${
                                intervalHours === h
                                  ? 'bg-[#3B82F6] text-white'
                                  : 'bg-white/[0.04] text-[#64748B] hover:bg-white/[0.08]'
                              }`}
                            >
                              {h}s
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="manual"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-3 space-y-2"
                      >
                        <div className="flex gap-2">
                          <input
                            type="time"
                            value={newTime}
                            onChange={(e) => setNewTime(e.target.value)}
                            className="flex-1 rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-sm text-white outline-none focus:border-[#3B82F6]/50"
                          />
                          <button
                            onClick={addTime}
                            className="flex items-center gap-1 rounded-xl bg-[#3B82F6]/20 px-3 py-2 text-xs text-[#3B82F6] hover:bg-[#3B82F6]/30"
                          >
                            <Plus size={14} /> Ekle
                          </button>
                        </div>
                        <div className="space-y-1">
                          {times.map((t) => (
                            <div
                              key={t}
                              className="flex items-center justify-between rounded-xl bg-white/[0.03] px-3 py-2"
                            >
                              <span className="text-sm text-white">{t}</span>
                              <button
                                onClick={() => removeTime(t)}
                                className="text-red-400/60 hover:text-red-400"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          ))}
                          {times.length === 0 && (
                            <p className="text-center text-xs text-[#64748B]">
                              Henüz saat eklenmedi
                            </p>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              <button
                onClick={handleSave}
                disabled={saving}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#3B82F6] py-3 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
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

- [ ] **Step 2: Water page'de state ve handler güncelle**

`apps/web/app/(dashboard)/dashboard/water/page.tsx` dosyasında:

`WaterState` interface'ine ekle:

```typescript
  reminderMode: 'interval' | 'manual'
  reminderIntervalHours: number
  reminderTimes: string[]
```

`useState` başlangıç değerlerine ekle:

```typescript
    reminderMode: 'interval',
    reminderIntervalHours: 2,
    reminderTimes: [],
```

`fetchAll` içinde `setWater` çağrısına ekle:

```typescript
        reminderMode: waterRes.reminderMode ?? 'interval',
        reminderIntervalHours: waterRes.reminderIntervalHours ?? 2,
        reminderTimes: waterRes.reminderTimes ?? [],
```

**Not:** GET `/api/nutrition/water` şu an reminderMode dönmüyor. Settings route'dan ayrıca çek veya su route'unu güncelle. En temiz yol: `fetchAll` içine settings fetch ekle:

```typescript
const [waterRes, streakRes, historyRes, settingsRes] = await Promise.all([
  fetch('/api/nutrition/water').then((r) => r.json()),
  fetch('/api/nutrition/water/streak').then((r) => r.json()),
  fetch(`/api/nutrition/water/history?period=${p}`).then((r) => r.json()),
  fetch('/api/nutrition/water/settings').then((r) => r.json()),
])
```

Sonra setWater'da:

```typescript
      reminderMode: settingsRes.settings?.reminderMode ?? 'interval',
      reminderIntervalHours: settingsRes.settings?.reminderIntervalHours ?? 2,
      reminderTimes: settingsRes.settings?.reminderTimes ?? [],
```

`handleSaveSettings` fonksiyonunu güncelle:

```typescript
const handleSaveSettings = async (
  dailyGoalMl: number,
  cupSizeMl: number,
  reminder: {
    reminderMode: 'interval' | 'manual'
    reminderIntervalHours: number
    reminderTimes: string[]
  }
) => {
  await fetch('/api/nutrition/water/settings', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ dailyGoalMl, cupSizeMl, ...reminder }),
  })
  setWater((prev) => ({ ...prev, dailyGoalMl, cupSizeMl, ...reminder }))
}
```

`WaterSettingsPanel` bileşenine yeni props geçir:

```tsx
<WaterSettingsPanel
  dailyGoalMl={water.dailyGoalMl}
  cupSizeMl={water.cupSizeMl}
  reminderMode={water.reminderMode}
  reminderIntervalHours={water.reminderIntervalHours}
  reminderTimes={water.reminderTimes}
  onSave={handleSaveSettings}
/>
```

- [ ] **Step 3: Dev server'da test et**

`http://localhost:3000/dashboard/water` → Ayarlar butonuna tıkla → "Hatırlatıcılar" bölümünü gör → Aralıklı / Manuel Saatler modunu değiştir → Kaydet.

- [ ] **Step 4: Commit**

```bash
cd c:/Users/TUF/Desktop/Ai-Pt && git add apps/web/components/water/WaterSettingsPanel.tsx apps/web/app/\(dashboard\)/dashboard/water/page.tsx && git commit -m "feat(water): add reminder settings UI (interval and manual modes)"
```

---
