# Water Features C: Vücut Ağırlığı Hedefi + Hava Sıcaklığı + Streak Freeze Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** (1) HealthProfile.weightKg'dan otomatik günlük su hedefi hesapla, (2) profildeki şehre göre Open-Meteo API ile hava sıcaklığına bağlı bonus ml ekle, (3) streak kırılmadan önce freeze charge kullan.

**Architecture:**

- Vücut hedefi: Sayfa yüklendiğinde `HealthProfile.weightKg` çekilir, `isManualGoal=false` ise `weightKg × 33` otomatik hedef olarak kaydedilir.
- Hava sıcaklığı: `morning-sync` cron job'u Open-Meteo API'yi çağırır, `WaterSettings.tempBonusMl` günceller. Sayfa bu bonusu gösterir.
- Streak Freeze: Gece cron'u `WaterStreak`'i kontrol eder, dün hedefe ulaşılmadıysa ve `freezeCharges > 0` ise otomatik kullanır. 7/30 günlük streak milestone'larında +1 charge verilir.

**Tech Stack:** Next.js 15, Prisma, Open-Meteo API (ücretsiz, key gerektirmez), Vitest, Framer Motion

**Önemli bağlam:**

- `apps/web/prisma/schema.prisma` — Plan A'da `WaterSettings`'e `isManualGoal`, `city`, `tempBonusMl` ve `WaterStreak`'e `freezeCharges`, `freezeUsedDates` eklendi.
- `apps/web/app/api/cron/morning-sync/route.ts` — Mevcut cron job, her sabah 07:00'de çalışır.
- `apps/web/app/api/nutrition/water/settings/route.ts` — Plan A'da güncellendi, `city` ve `isManualGoal` kabul ediyor.
- `apps/web/vercel.json` — Cron job'ları burada tanımlı.
- Open-Meteo API: `https://geocoding-api.open-meteo.com/v1/search?name={city}&count=1&language=tr` → lat/lon al, sonra `https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&current=temperature_2m` → sıcaklık al.

---

## Chunk 1: Vücut Ağırlığına Göre Otomatik Hedef

### Task 1: Auto-goal API endpoint (TDD)

**Files:**

- Create: `apps/web/app/api/nutrition/water/auto-goal/route.ts`
- Create: `apps/web/app/api/nutrition/water/__tests__/auto-goal.test.ts`

Bu endpoint sayfa yüklendiğinde çağrılır. `HealthProfile.weightKg` okur, `isManualGoal=false` ise `weightKg × 33` hesaplar ve `WaterSettings.dailyGoalMl`'i günceller. Güncel hedefi döner.

- [ ] **Step 1: Test dosyası oluştur**

`apps/web/app/api/nutrition/water/__tests__/auto-goal.test.ts` oluştur:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

const mockDb = {
  user: { findUnique: vi.fn() },
  healthProfile: { findUnique: vi.fn() },
  waterSettings: { findUnique: vi.fn(), upsert: vi.fn() },
}

vi.mock('@/lib/db/client', () => ({ db: mockDb }))
vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn().mockResolvedValue({ userId: 'clerk_123' }),
}))

describe('POST /api/nutrition/water/auto-goal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockDb.user.findUnique.mockResolvedValue({ id: 'user_1' })
  })

  it('calculates goal from weight when isManualGoal is false', async () => {
    mockDb.healthProfile.findUnique.mockResolvedValue({ weightKg: 70 })
    mockDb.waterSettings.findUnique.mockResolvedValue({ isManualGoal: false, dailyGoalMl: 2500 })
    mockDb.waterSettings.upsert.mockResolvedValue({ dailyGoalMl: 2310 })

    const req = new NextRequest('http://localhost/api/nutrition/water/auto-goal', {
      method: 'POST',
    })

    const { POST } = await import('../auto-goal/route')
    const res = await POST(req)
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.dailyGoalMl).toBe(2310) // 70 * 33
    expect(mockDb.waterSettings.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        update: expect.objectContaining({ dailyGoalMl: 2310 }),
      })
    )
  })

  it('does NOT update goal when isManualGoal is true', async () => {
    mockDb.healthProfile.findUnique.mockResolvedValue({ weightKg: 70 })
    mockDb.waterSettings.findUnique.mockResolvedValue({ isManualGoal: true, dailyGoalMl: 3000 })

    const req = new NextRequest('http://localhost/api/nutrition/water/auto-goal', {
      method: 'POST',
    })

    const { POST } = await import('../auto-goal/route')
    const res = await POST(req)
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.dailyGoalMl).toBe(3000)
    expect(mockDb.waterSettings.upsert).not.toHaveBeenCalled()
  })

  it('returns 2500 default when no health profile', async () => {
    mockDb.healthProfile.findUnique.mockResolvedValue(null)
    mockDb.waterSettings.findUnique.mockResolvedValue({ isManualGoal: false, dailyGoalMl: 2500 })

    const req = new NextRequest('http://localhost/api/nutrition/water/auto-goal', {
      method: 'POST',
    })

    const { POST } = await import('../auto-goal/route')
    const res = await POST(req)
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.dailyGoalMl).toBe(2500)
    expect(mockDb.waterSettings.upsert).not.toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: Testi çalıştır, FAIL olduğunu doğrula**

```bash
cd c:/Users/TUF/Desktop/Ai-Pt/apps/web && npx vitest run app/api/nutrition/water/__tests__/auto-goal.test.ts --reporter=verbose 2>&1 | tail -20
```

Expected: FAIL — route not found

- [ ] **Step 3: Auto-goal route oluştur**

`apps/web/app/api/nutrition/water/auto-goal/route.ts` oluştur:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db/client'

export async function POST(_req: NextRequest) {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const user = await db.user.findUnique({ where: { clerkId } })
    if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const [healthProfile, settings] = await Promise.all([
      db.healthProfile.findUnique({ where: { userId: user.id } }),
      db.waterSettings.findUnique({ where: { userId: user.id } }),
    ])

    const currentGoal = settings?.dailyGoalMl ?? 2500
    const isManualGoal = settings?.isManualGoal ?? false

    // Manuel hedef varsa dokunma
    if (isManualGoal || !healthProfile?.weightKg) {
      return NextResponse.json({ dailyGoalMl: currentGoal })
    }

    const autoGoal = Math.round(healthProfile.weightKg * 33)

    await db.waterSettings.upsert({
      where: { userId: user.id },
      create: { userId: user.id, dailyGoalMl: autoGoal, cupSizeMl: 200 },
      update: { dailyGoalMl: autoGoal },
    })

    return NextResponse.json({ dailyGoalMl: autoGoal })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

- [ ] **Step 4: Testi çalıştır, PASS olduğunu doğrula**

```bash
cd c:/Users/TUF/Desktop/Ai-Pt/apps/web && npx vitest run app/api/nutrition/water/__tests__/auto-goal.test.ts --reporter=verbose 2>&1 | tail -20
```

Expected: All tests PASS

- [ ] **Step 5: Commit**

```bash
cd c:/Users/TUF/Desktop/Ai-Pt && git add apps/web/app/api/nutrition/water/auto-goal/ apps/web/app/api/nutrition/water/__tests__/auto-goal.test.ts && git commit -m "feat(water): add auto-goal from body weight API"
```

---

### Task 2: Water Page'e Auto-goal Entegrasyonu + Şehir UI

**Files:**

- Modify: `apps/web/app/(dashboard)/dashboard/water/page.tsx`
- Modify: `apps/web/components/water/WaterSettingsPanel.tsx`

- [ ] **Step 1: Water page'de auto-goal çağrısı ekle**

`apps/web/app/(dashboard)/dashboard/water/page.tsx` dosyasında `fetchAll` fonksiyonundaki `Promise.all` çağrısını **tamamen** şununla değiştir (Plan A'da 4 endpoint vardı, şimdi 5'e çıkıyor):

```typescript
const [waterRes, streakRes, historyRes, settingsRes, autoGoalRes] = await Promise.all([
  fetch('/api/nutrition/water').then((r) => r.json()),
  fetch('/api/nutrition/water/streak').then((r) => r.json()),
  fetch(`/api/nutrition/water/history?period=${p}`).then((r) => r.json()),
  fetch('/api/nutrition/water/settings').then((r) => r.json()),
  fetch('/api/nutrition/water/auto-goal', { method: 'POST' }).then((r) => r.json()),
])
```

`setWater` çağrısında `dailyGoalMl` için auto-goal değerini kullan:

```typescript
      dailyGoalMl: autoGoalRes.dailyGoalMl ?? settingsRes.settings?.dailyGoalMl ?? 2500,
```

- [ ] **Step 2: WaterSettingsPanel'e şehir ve isManualGoal ekle**

`apps/web/components/water/WaterSettingsPanel.tsx` dosyasında:

Interface'e ekle:

```typescript
city: string
isManualGoal: boolean
```

State'e ekle:

```typescript
const [city, setCity] = useState(props.city ?? '')
const [isManualGoal, setIsManualGoal] = useState(props.isManualGoal)
```

`onSave` signature'ını güncelle — şehir ve isManualGoal da geçirilsin:

```typescript
onSave: (
  dailyGoalMl: number,
  cupSizeMl: number,
  reminder: ReminderSettings,
  city: string,
  isManualGoal: boolean
) => Promise<void>
```

`handleSave` içinde:

```typescript
await onSave(
  goal,
  cup,
  { reminderMode: mode, reminderIntervalHours: intervalHours, reminderTimes: times },
  city,
  isManualGoal
)
```

Hedef kısmında, custom input'un altına şunu ekle:

```tsx
<div className="mt-2 flex items-center gap-2">
  <input
    type="checkbox"
    id="manualGoal"
    checked={isManualGoal}
    onChange={(e) => setIsManualGoal(e.target.checked)}
    className="rounded"
  />
  <label htmlFor="manualGoal" className="text-xs text-[#64748B]">
    Manuel hedef (kiloya göre otomatik hesaplama kapalı)
  </label>
</div>
```

Hatırlatıcılar bölümünün altına şehir girişi ekle:

```tsx
{
  /* Şehir (Hava Sıcaklığı için) */
}
;<div>
  <label className="mb-2 block text-xs text-[#64748B]">🌡 Hava Sıcaklığı Şehri</label>
  <input
    type="text"
    value={city}
    onChange={(e) => setCity(e.target.value)}
    placeholder="ör. Istanbul, Ankara, Izmir"
    className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-sm text-white outline-none placeholder:text-[#64748B] focus:border-[#3B82F6]/50"
  />
  <p className="mt-1 text-[10px] text-[#64748B]">Sıcak havalarda su hedefiniz otomatik artırılır</p>
</div>
```

- [ ] **Step 3: Water page'de handleSaveSettings güncelle**

```typescript
const handleSaveSettings = async (
  dailyGoalMl: number,
  cupSizeMl: number,
  reminder: {
    reminderMode: 'interval' | 'manual'
    reminderIntervalHours: number
    reminderTimes: string[]
  },
  city: string,
  isManualGoal: boolean
) => {
  await fetch('/api/nutrition/water/settings', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ dailyGoalMl, cupSizeMl, ...reminder, city, isManualGoal }),
  })
  setWater((prev) => ({ ...prev, dailyGoalMl, cupSizeMl, ...reminder }))
}
```

WaterSettingsPanel'e yeni props geçir (city ve isManualGoal):

```tsx
<WaterSettingsPanel
  dailyGoalMl={water.dailyGoalMl}
  cupSizeMl={water.cupSizeMl}
  reminderMode={water.reminderMode}
  reminderIntervalHours={water.reminderIntervalHours}
  reminderTimes={water.reminderTimes}
  city={water.city ?? ''}
  isManualGoal={water.isManualGoal ?? false}
  onSave={handleSaveSettings}
/>
```

`WaterState` interface'ine ekle:

```typescript
  city?: string
  isManualGoal?: boolean
```

`fetchAll`'da `setWater`'a ekle:

```typescript
      city: settingsRes.settings?.city ?? '',
      isManualGoal: settingsRes.settings?.isManualGoal ?? false,
```

- [ ] **Step 4: Dev server'da test et**

`http://localhost:3000/dashboard/water` → Ayarlar → Şehir gir (ör. "Istanbul") → Kaydet. Sayfa yenilenince auto-goal'un çalıştığını (terminalde DB log'larına bakarak) doğrula.

- [ ] **Step 5: Commit**

```bash
cd c:/Users/TUF/Desktop/Ai-Pt && git add apps/web/app/\(dashboard\)/dashboard/water/page.tsx apps/web/components/water/WaterSettingsPanel.tsx && git commit -m "feat(water): integrate auto-goal and city settings in UI"
```

---

## Chunk 2: Hava Sıcaklığı Entegrasyonu

### Task 3: Morning-sync Cron'a Hava Sıcaklığı Ekle (TDD)

**Files:**

- Create: `apps/web/lib/water/weather.ts`
- Create: `apps/web/lib/water/__tests__/weather.test.ts`
- Modify: `apps/web/app/api/cron/morning-sync/route.ts`

- [ ] **Step 1: Weather utility testi yaz**

`apps/web/lib/water/__tests__/weather.test.ts` oluştur:

```typescript
import { describe, it, expect, vi } from 'vitest'

// fetch'i mock'la
global.fetch = vi.fn()

describe('getTempBonusMl', () => {
  it('returns 0 for cold weather (<15°C)', async () => {
    ;(global.fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({
        json: () => Promise.resolve({ results: [{ latitude: 41.01, longitude: 28.97 }] }),
      })
      .mockResolvedValueOnce({
        json: () => Promise.resolve({ current: { temperature_2m: 10 } }),
      })

    const { getTempBonusMl } = await import('../weather')
    const result = await getTempBonusMl('Istanbul')
    expect(result).toBe(0)
  })

  it('returns 200 for moderate weather (15-25°C)', async () => {
    ;(global.fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({
        json: () => Promise.resolve({ results: [{ latitude: 41.01, longitude: 28.97 }] }),
      })
      .mockResolvedValueOnce({
        json: () => Promise.resolve({ current: { temperature_2m: 20 } }),
      })

    const { getTempBonusMl } = await import('../weather')
    const result = await getTempBonusMl('Istanbul')
    expect(result).toBe(200)
  })

  it('returns 400 for hot weather (25-35°C)', async () => {
    ;(global.fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({
        json: () => Promise.resolve({ results: [{ latitude: 41.01, longitude: 28.97 }] }),
      })
      .mockResolvedValueOnce({
        json: () => Promise.resolve({ current: { temperature_2m: 30 } }),
      })

    const { getTempBonusMl } = await import('../weather')
    const result = await getTempBonusMl('Istanbul')
    expect(result).toBe(400)
  })

  it('returns 600 for very hot weather (>35°C)', async () => {
    ;(global.fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({
        json: () => Promise.resolve({ results: [{ latitude: 41.01, longitude: 28.97 }] }),
      })
      .mockResolvedValueOnce({
        json: () => Promise.resolve({ current: { temperature_2m: 38 } }),
      })

    const { getTempBonusMl } = await import('../weather')
    const result = await getTempBonusMl('Istanbul')
    expect(result).toBe(600)
  })

  it('returns null when city not found', async () => {
    ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      json: () => Promise.resolve({ results: [] }),
    })

    const { getTempBonusMl } = await import('../weather')
    const result = await getTempBonusMl('XYZUnknownCity')
    expect(result).toBeNull()
  })
})
```

- [ ] **Step 2: Testi çalıştır, FAIL olduğunu doğrula**

```bash
cd c:/Users/TUF/Desktop/Ai-Pt/apps/web && npx vitest run lib/water/__tests__/weather.test.ts --reporter=verbose 2>&1 | tail -20
```

Expected: FAIL — module not found

- [ ] **Step 3: Weather utility oluştur**

`apps/web/lib/water/weather.ts` oluştur:

```typescript
export async function getTempBonusMl(city: string): Promise<number | null> {
  try {
    // Şehrin koordinatlarını al
    const geoRes = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=tr`
    )
    const geoData = await geoRes.json()

    if (!geoData.results || geoData.results.length === 0) return null

    const { latitude, longitude } = geoData.results[0]

    // Anlık sıcaklığı al
    const weatherRes = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m`
    )
    const weatherData = await weatherRes.json()
    const temp: number = weatherData.current?.temperature_2m

    if (temp === undefined || temp === null) return null

    // Sıcaklığa göre bonus ml
    if (temp < 15) return 0
    if (temp < 25) return 200
    if (temp < 35) return 400
    return 600
  } catch {
    return null
  }
}
```

- [ ] **Step 4: Testi çalıştır, PASS olduğunu doğrula**

```bash
cd c:/Users/TUF/Desktop/Ai-Pt/apps/web && npx vitest run lib/water/__tests__/weather.test.ts --reporter=verbose 2>&1 | tail -20
```

Expected: All tests PASS

- [ ] **Step 5: Morning-sync cron'a hava sıcaklığı güncelleme ekle**

`apps/web/app/api/cron/morning-sync/route.ts` dosyasında, dosyanın başına import ekle:

```typescript
import { getTempBonusMl } from '@/lib/water/weather'
```

Mevcut `for (const user of users)` döngüsünün içinde (döngünün sonuna yakın, `syncedCount++` satırından önce) şunu ekle:

```typescript
// Hava sıcaklığına göre su bonusu güncelle
try {
  const waterSettings = await prisma.waterSettings.findUnique({
    where: { userId: user.id },
  })
  if (waterSettings?.city) {
    const bonus = await getTempBonusMl(waterSettings.city)
    if (bonus !== null) {
      await prisma.waterSettings.update({
        where: { userId: user.id },
        data: { tempBonusMl: bonus },
      })
    }
  }
} catch {
  // Hava sıcaklığı hatası tüm sync'i durdurmasın
}
```

- [ ] **Step 6: Commit**

```bash
cd c:/Users/TUF/Desktop/Ai-Pt && git add apps/web/lib/water/ apps/web/app/api/cron/morning-sync/route.ts && git commit -m "feat(water): add weather-based hydration bonus via Open-Meteo API"
```

---

### Task 4: Hava Sıcaklığı Bonus'unu Water Page'de Göster

**Files:**

- Modify: `apps/web/app/(dashboard)/dashboard/water/page.tsx`

`tempBonusMl` settings'ten gelir. Sayfada küçük bir bilgi göstergesi ekle.

- [ ] **Step 1: WaterState'e tempBonusMl ekle**

`apps/web/app/(dashboard)/dashboard/water/page.tsx` dosyasında:

`WaterState` interface'ine ekle:

```typescript
  tempBonusMl?: number
```

`fetchAll`'da `setWater`'a ekle:

```typescript
      tempBonusMl: settingsRes.settings?.tempBonusMl ?? 0,
```

- [ ] **Step 2: Water Wave'in altına sıcaklık banner'ı ekle**

`WaterWave` motion.div'inden hemen sonra (CoachToast'tan önce) ekle:

```tsx
{
  /* Hava Sıcaklığı Bonusu */
}
{
  ;(water.tempBonusMl ?? 0) > 0 && (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-2 rounded-2xl border border-orange-500/20 bg-orange-500/10 px-4 py-2.5"
    >
      <span className="text-base">🌡</span>
      <div>
        <p className="text-xs font-semibold text-orange-400">Sıcak Hava Bonusu</p>
        <p className="text-[10px] text-[#64748B]">
          Bugün +{water.tempBonusMl}ml eklendi ({water.city} için)
        </p>
      </div>
    </motion.div>
  )
}
```

- [ ] **Step 3: Effective goal'u ayrı hesapla — state'e bake etme**

`tempBonusMl` state'e ayrı tutulur, `dailyGoalMl`'e eklenmez. Bunun yerine `percentage` ve `WaterWave`'e geçirilen değeri hesaplama noktasında topla.

`fetchAll`'daki `dailyGoalMl` satırı şu şekilde kalır (tempBonusMl eklenmez):

```typescript
      dailyGoalMl: autoGoalRes.dailyGoalMl ?? settingsRes.settings?.dailyGoalMl ?? 2500,
```

Sayfada `percentage` hesabını güncelle:

```typescript
const effectiveGoal = water.dailyGoalMl + (water.tempBonusMl ?? 0)
const percentage = effectiveGoal > 0 ? (water.amountMl / effectiveGoal) * 100 : 0
```

`WaterWave` ve `WaterHistory`'e `dailyGoalMl` yerine `effectiveGoal` geçir:

```tsx
<WaterWave percentage={percentage} amountMl={water.amountMl} goalMl={effectiveGoal} />
// WaterHistory'de:
<WaterHistory history={history} dailyGoalMl={effectiveGoal} ... />
```

Bu şekilde Settings panelinden kayıt yapıldığında `dailyGoalMl` bozulmaz.

- [ ] **Step 4: Dev server'da test et**

`http://localhost:3000/dashboard/water` → Ayarlar → "Istanbul" şehri gir → Kaydet. `tempBonusMl` > 0 ise orange banner görünür. Cron manuel tetiklemek için: `curl -X POST http://localhost:3000/api/cron/morning-sync -H "Authorization: Bearer aipt_cron_s3cr3t_2026"`.

- [ ] **Step 5: Commit**

```bash
cd c:/Users/TUF/Desktop/Ai-Pt && git add apps/web/app/\(dashboard\)/dashboard/water/page.tsx && git commit -m "feat(water): show weather bonus banner on water page"
```

---

## Chunk 3: Streak Freeze

### Task 5: Streak Freeze Cron + Milestone Logic (TDD)

**Files:**

- Create: `apps/web/lib/water/streak-freeze.ts`
- Create: `apps/web/lib/water/__tests__/streak-freeze.test.ts`
- Create: `apps/web/app/api/cron/water-streak-check/route.ts`
- Modify: `apps/web/vercel.json`

- [ ] **Step 1: Streak freeze utility testi yaz**

`apps/web/lib/water/__tests__/streak-freeze.test.ts` oluştur:

```typescript
import { describe, it, expect } from 'vitest'
import { calcNewStreak } from '../streak-freeze'

describe('calcNewStreak', () => {
  const today = new Date('2026-04-14T00:00:00.000Z')
  const yesterday = new Date('2026-04-13T00:00:00.000Z')
  const twoDaysAgo = new Date('2026-04-12T00:00:00.000Z')

  it('breaks streak when no freeze charges and goal not met yesterday', () => {
    const result = calcNewStreak({
      currentStreak: 5,
      longestStreak: 10,
      lastGoalDate: twoDaysAgo,
      freezeCharges: 0,
      freezeUsedDates: [],
      today,
    })
    expect(result.currentStreak).toBe(0)
    expect(result.freezeUsed).toBe(false)
    expect(result.freezeCharges).toBe(0)
  })

  it('uses freeze charge when goal not met yesterday and charges available', () => {
    const result = calcNewStreak({
      currentStreak: 5,
      longestStreak: 10,
      lastGoalDate: twoDaysAgo,
      freezeCharges: 2,
      freezeUsedDates: [],
      today,
    })
    expect(result.currentStreak).toBe(5) // streak korunur
    expect(result.freezeUsed).toBe(true)
    expect(result.freezeCharges).toBe(1) // 1 azaldı
    expect(result.freezeUsedDates).toContain('2026-04-13') // dün kullanıldı
  })

  it('does nothing when goal was met yesterday', () => {
    const result = calcNewStreak({
      currentStreak: 5,
      longestStreak: 10,
      lastGoalDate: yesterday,
      freezeCharges: 2,
      freezeUsedDates: [],
      today,
    })
    expect(result.currentStreak).toBe(5)
    expect(result.freezeUsed).toBe(false)
    expect(result.freezeCharges).toBe(2) // değişmez
  })

  it('awards +1 freeze charge at 7-day milestone', () => {
    const result = calcNewStreak({
      currentStreak: 6, // 7. gün tamamlandıktan sonra kontrol edilir
      longestStreak: 10,
      lastGoalDate: yesterday,
      freezeCharges: 0,
      freezeUsedDates: [],
      today,
      newStreakAfterGoal: 7, // dışarıdan gelir (streak POST'tan)
    })
    expect(result.bonusCharge).toBe(1)
  })

  it('awards +1 freeze charge at 30-day milestone', () => {
    const result = calcNewStreak({
      currentStreak: 29,
      longestStreak: 30,
      lastGoalDate: yesterday,
      freezeCharges: 1,
      freezeUsedDates: [],
      today,
      newStreakAfterGoal: 30,
    })
    expect(result.bonusCharge).toBe(1)
  })
})
```

- [ ] **Step 2: Testi çalıştır, FAIL olduğunu doğrula**

```bash
cd c:/Users/TUF/Desktop/Ai-Pt/apps/web && npx vitest run lib/water/__tests__/streak-freeze.test.ts --reporter=verbose 2>&1 | tail -20
```

Expected: FAIL — module not found

- [ ] **Step 3: Streak freeze utility oluştur**

`apps/web/lib/water/streak-freeze.ts` oluştur:

```typescript
interface CalcStreakInput {
  currentStreak: number
  longestStreak: number
  lastGoalDate: Date | null
  freezeCharges: number
  freezeUsedDates: string[]
  today: Date
  newStreakAfterGoal?: number
}

interface CalcStreakResult {
  currentStreak: number
  longestStreak: number
  freezeCharges: number
  freezeUsedDates: string[]
  freezeUsed: boolean
  bonusCharge: number
}

export function calcNewStreak(input: CalcStreakInput): CalcStreakResult {
  const {
    currentStreak,
    longestStreak,
    lastGoalDate,
    freezeCharges,
    freezeUsedDates,
    today,
    newStreakAfterGoal,
  } = input

  // Milestone kontrolü (7 veya 30)
  let bonusCharge = 0
  if (newStreakAfterGoal === 7 || newStreakAfterGoal === 30) {
    bonusCharge = 1
  }

  // Dün hedefe ulaşıldı mı kontrol et
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  yesterday.setHours(0, 0, 0, 0)

  const lastGoalNorm = lastGoalDate ? new Date(lastGoalDate) : null
  if (lastGoalNorm) lastGoalNorm.setHours(0, 0, 0, 0)

  const metYesterday = lastGoalNorm && lastGoalNorm.toDateString() === yesterday.toDateString()

  // Dün hedefe ulaşıldıysa hiçbir şey yapma (streak POST'ta zaten güncellendi)
  if (metYesterday) {
    return {
      currentStreak,
      longestStreak,
      freezeCharges: freezeCharges + bonusCharge,
      freezeUsedDates,
      freezeUsed: false,
      bonusCharge,
    }
  }

  // Dün hedefe ulaşılmadı — freeze var mı?
  if (freezeCharges > 0) {
    const yesterdayStr = yesterday.toISOString().slice(0, 10)
    return {
      currentStreak, // streak korunur
      longestStreak,
      freezeCharges: freezeCharges - 1 + bonusCharge,
      freezeUsedDates: [...freezeUsedDates, yesterdayStr],
      freezeUsed: true,
      bonusCharge,
    }
  }

  // Freeze yok — streak sıfırlanır
  return {
    currentStreak: 0,
    longestStreak,
    freezeCharges: bonusCharge,
    freezeUsedDates,
    freezeUsed: false,
    bonusCharge,
  }
}
```

- [ ] **Step 4: Testi çalıştır, PASS olduğunu doğrula**

```bash
cd c:/Users/TUF/Desktop/Ai-Pt/apps/web && npx vitest run lib/water/__tests__/streak-freeze.test.ts --reporter=verbose 2>&1 | tail -20
```

Expected: All tests PASS

- [ ] **Step 5: Streak check cron route oluştur**

`apps/web/app/api/cron/water-streak-check/route.ts` oluştur:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/client'
import { isValidCronRequest } from '@/lib/env/validate'
import { calcNewStreak } from '@/lib/water/streak-freeze'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (!isValidCronRequest(authHeader)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const streaks = await prisma.waterStreak.findMany({
      where: { currentStreak: { gt: 0 } },
    })

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    let processed = 0

    for (const streak of streaks) {
      const result = calcNewStreak({
        currentStreak: streak.currentStreak,
        longestStreak: streak.longestStreak,
        lastGoalDate: streak.lastGoalDate,
        freezeCharges: streak.freezeCharges,
        freezeUsedDates: streak.freezeUsedDates,
        today,
      })

      await prisma.waterStreak.update({
        where: { id: streak.id },
        data: {
          currentStreak: result.currentStreak,
          longestStreak: result.longestStreak,
          freezeCharges: result.freezeCharges,
          freezeUsedDates: result.freezeUsedDates,
        },
      })
      processed++
    }

    return NextResponse.json({ success: true, processed })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

- [ ] **Step 6: vercel.json'a cron ekle**

`apps/web/vercel.json` dosyasında `crons` array'ine ekle:

```json
{
  "path": "/api/cron/water-streak-check",
  "schedule": "0 1 * * *"
}
```

Gece 01:00'de çalışır (gün bitiminden sonra).

- [ ] **Step 7: Commit**

```bash
cd c:/Users/TUF/Desktop/Ai-Pt && git add apps/web/lib/water/streak-freeze.ts apps/web/lib/water/__tests__/streak-freeze.test.ts apps/web/app/api/cron/water-streak-check/ apps/web/vercel.json && git commit -m "feat(water): add streak freeze utility and nightly cron"
```

---

### Task 6: Streak Freeze UI

**Files:**

- Modify: `apps/web/components/water/WaterStreakCard.tsx`

Streak kartında freeze charge sayısını göster. Kullanıcı manuel freeze kullanabilsin.

- [ ] **Step 1: WaterStreakCard'a freezeCharges prop ekle**

`apps/web/components/water/WaterStreakCard.tsx` dosyasını tamamen şununla değiştir:

```typescript
'use client'

import { motion } from 'framer-motion'
import { Flame, Trophy, Calendar, Snowflake } from 'lucide-react'

interface WaterStreakCardProps {
  currentStreak: number
  longestStreak: number
  totalDaysGoal: number
  freezeCharges?: number
}

export function WaterStreakCard({
  currentStreak,
  longestStreak,
  totalDaysGoal,
  freezeCharges = 0,
}: WaterStreakCardProps) {
  return (
    <div className="space-y-2">
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
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              className={`text-2xl font-black ${item.color}`}
            >
              {item.value}
            </motion.span>
            <span className="text-center text-[10px] leading-tight text-[#64748B]">{item.label}</span>
          </motion.div>
        ))}
      </div>

      {/* Freeze Charges */}
      <div className="flex items-center gap-2 rounded-2xl border border-cyan-500/20 bg-cyan-500/10 px-4 py-2.5">
        <Snowflake size={15} className="text-cyan-400 shrink-0" />
        <div className="flex-1">
          <p className="text-xs font-semibold text-cyan-400">
            {freezeCharges} Dondurma Hakkı
          </p>
          <p className="text-[10px] text-[#64748B]">
            7 ve 30 günlük serilerde kazanılır. Streak kırılmadan önce otomatik kullanılır.
          </p>
        </div>
        <div className="flex gap-0.5">
          {Array.from({ length: Math.min(freezeCharges, 5) }).map((_, i) => (
            <div key={i} className="h-4 w-4 rounded-full bg-cyan-500/40 flex items-center justify-center">
              <div className="h-2 w-2 rounded-full bg-cyan-400" />
            </div>
          ))}
          {freezeCharges === 0 && (
            <span className="text-[10px] text-[#64748B]">Henüz hak yok</span>
          )}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Water page'e freezeCharges geçir**

`apps/web/app/(dashboard)/dashboard/water/page.tsx` dosyasında:

`StreakState` interface'ine ekle:

```typescript
freezeCharges: number
```

`useState` başlangıcına ekle:

```typescript
    freezeCharges: 0,
```

`fetchAll`'da streak fetch'ten sonra ekle:

```typescript
        freezeCharges: streakRes.streak?.freezeCharges ?? 0,
```

Streak API route'unun `freezeCharges` döndürdüğünden emin ol — `apps/web/app/api/nutrition/water/streak/route.ts` dosyasını aç ve response'u kontrol et. Eğer `freezeCharges` dönmüyorsa ekle:

```typescript
return NextResponse.json({
  streak: {
    currentStreak: streak?.currentStreak ?? 0,
    longestStreak: streak?.longestStreak ?? 0,
    totalDaysGoal: streak?.totalDaysGoal ?? 0,
    lastGoalDate: streak?.lastGoalDate ?? null,
    freezeCharges: streak?.freezeCharges ?? 0,
  },
})
```

`WaterStreakCard`'a prop geçir:

```tsx
<WaterStreakCard
  currentStreak={streak.currentStreak}
  longestStreak={streak.longestStreak}
  totalDaysGoal={streak.totalDaysGoal}
  freezeCharges={streak.freezeCharges}
/>
```

- [ ] **Step 3: Streak POST route'da milestone kontrolü ekle**

`apps/web/app/api/nutrition/water/route.ts` dosyasında mevcut streak upsert bloğu içinde (içinde `newCurrent` değişkeni zaten hesaplanıyor). Streak upsert'in hemen altına (return'den önce) ekle:

```typescript
// Freeze milestone kontrolü (7 ve 30 günlük streak) — sadece BUGÜN yeni hedefe ulaşıldıysa
// alreadyCountedToday = false olunca bu gün ilk kez hedef tamamlandı demek
if (newAmountMl >= dailyGoalMl && !alreadyCountedToday && (newCurrent === 7 || newCurrent === 30)) {
  await db.waterStreak.update({
    where: { userId: user.id },
    data: { freezeCharges: { increment: 1 } },
  })
}
```

**Not:** `newCurrent` ve `alreadyCountedToday` mevcut streak bloğunda zaten tanımlı. Bu kod o bloğun içine, upsert çağrısından sonra gelir. Böylece her log'da değil, sadece o gün ilk kez milestone'a ulaşıldığında charge verilir.

- [ ] **Step 4: Dev server'da test et**

`http://localhost:3000/dashboard/water` → Streak kartının altında "0 Dondurma Hakkı" kutusunu gör. 7 gün streak tamamlanınca +1 hak verilir (test için DB'ye direkt 7 streak yazılabilir).

- [ ] **Step 5: Commit**

```bash
cd c:/Users/TUF/Desktop/Ai-Pt && git add apps/web/components/water/WaterStreakCard.tsx apps/web/app/\(dashboard\)/dashboard/water/page.tsx apps/web/app/api/nutrition/water/route.ts apps/web/app/api/nutrition/water/streak/ && git commit -m "feat(water): add streak freeze UI and milestone charge rewards"
```

---
