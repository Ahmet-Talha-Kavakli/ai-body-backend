# Nutrition Hub Phase 3B-2 — Bildirim Sistemi

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Web (Browser Push) ve Mobil (Expo Notifications) için su hatırlatıcısı, öğün zamanı ve akıllı kalori bildirimleri göndermek.

**Architecture:** `NotificationPreference` Prisma modeli kullanıcı tercihlerini saklar. Backend'de `/api/notifications/register` token kaydeder, `/api/notifications/send` bildirim gönderir. Web'de Service Worker + browser Push API, mobilde `expo-notifications` kullanılır. Cron job (Next.js route handler) günlük akıllı bildirimleri tetikler. Temel bildirimler (su, öğün) kullanıcı cihazında zamanlanır — backend'e ihtiyaç duymaz.

**Tech Stack:** Next.js 15, Service Worker (Web Push API), expo-notifications, Prisma, Vitest, web-push npm paketi

---

## Chunk 1: Backend — DB + API

### Task 1: NotificationPreference Prisma modeli

**Files:**

- Modify: `apps/web/prisma/schema.prisma`

- [ ] **Step 1: User modeline ilişki ekle**

`apps/web/prisma/schema.prisma` dosyasında `User` modeline şunu ekle (mealTemplates satırından sonra):

```prisma
  notificationPrefs NotificationPreference?
```

- [ ] **Step 2: NotificationPreference modelini ekle**

`MealTemplate` modelinden sonra ekle:

```prisma
model NotificationPreference {
  id              String   @id @default(cuid())
  userId          String   @unique
  user            User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  // Web push
  webPushEnabled  Boolean  @default(false)
  webPushEndpoint String?
  webPushAuth     String?
  webPushP256dh   String?

  // Mobile push
  mobilePushEnabled Boolean @default(false)
  expoPushToken     String?

  // Temel bildirimler
  waterReminder     Boolean @default(true)
  mealReminder      Boolean @default(true)

  // Akıllı bildirimler
  smartCalorie      Boolean @default(true)

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@index([userId])
}
```

- [ ] **Step 3: Prisma generate + db push**

```bash
cd c:/Users/TUF/Desktop/Ai-Pt/apps/web && npx prisma generate && npx prisma db push --accept-data-loss 2>&1 | tail -5
```

Expected: `Your database is now in sync with your Prisma schema`

- [ ] **Step 4: Commit**

```bash
cd c:/Users/TUF/Desktop/Ai-Pt && git add apps/web/prisma/schema.prisma && git commit -m "feat(notifications): add NotificationPreference Prisma model"
```

---

### Task 2: web-push paketi kur + VAPID key oluştur

**Files:**

- Modify: `apps/web/package.json` (otomatik)
- Modify: `.env.local` (manuel)

- [ ] **Step 1: web-push paketini kur**

```bash
cd c:/Users/TUF/Desktop/Ai-Pt/apps/web && npm install web-push && npm install --save-dev @types/web-push
```

- [ ] **Step 2: VAPID key oluştur**

```bash
cd c:/Users/TUF/Desktop/Ai-Pt/apps/web && node -e "const wp = require('web-push'); const keys = wp.generateVAPIDKeys(); console.log('PUBLIC:', keys.publicKey); console.log('PRIVATE:', keys.privateKey);"
```

Çıktıdaki PUBLIC ve PRIVATE key'leri `.env.local` dosyasına ekle:

```
NEXT_PUBLIC_VAPID_PUBLIC_KEY=<public_key>
VAPID_PRIVATE_KEY=<private_key>
VAPID_EMAIL=mailto:admin@yourapp.com
```

- [ ] **Step 3: Commit (sadece package.json, env değil)**

```bash
cd c:/Users/TUF/Desktop/Ai-Pt && git add apps/web/package.json apps/web/package-lock.json && git commit -m "feat(notifications): install web-push package"
```

---

### Task 3: Notification Register + Preferences API (TDD)

**Files:**

- Create: `apps/web/app/api/notifications/register/route.ts`
- Create: `apps/web/app/api/notifications/preferences/route.ts`
- Create: `apps/web/app/api/notifications/__tests__/notifications.test.ts`

- [ ] **Step 1: Failing test yaz**

Create `apps/web/app/api/notifications/__tests__/notifications.test.ts`:

```typescript
import { describe, it, expect, vi } from 'vitest'

vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn().mockResolvedValue({ userId: 'clerk_123' }),
}))

vi.mock('@/lib/db/client', () => ({
  db: {
    user: { findUnique: vi.fn().mockResolvedValue({ id: 'user_1' }) },
    notificationPreference: {
      upsert: vi.fn().mockResolvedValue({
        id: 'pref_1',
        webPushEnabled: true,
        webPushEndpoint: 'https://push.example.com/endpoint',
        mobilePushEnabled: false,
        expoPushToken: null,
        waterReminder: true,
        mealReminder: true,
        smartCalorie: true,
      }),
      findUnique: vi.fn().mockResolvedValue({
        webPushEnabled: true,
        mobilePushEnabled: false,
        waterReminder: true,
        mealReminder: true,
        smartCalorie: true,
      }),
    },
  },
}))

describe('POST /api/notifications/register', () => {
  it('registers web push subscription', async () => {
    const { POST } = await import('../register/route')
    const req = new Request('http://localhost/api/notifications/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'web',
        endpoint: 'https://push.example.com/endpoint',
        auth: 'auth_key',
        p256dh: 'p256dh_key',
      }),
    })
    const response = await POST(req as any)
    const data = await response.json()
    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
  })

  it('registers expo push token', async () => {
    const { POST } = await import('../register/route')
    const req = new Request('http://localhost/api/notifications/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'expo',
        token: 'ExponentPushToken[xxxxxx]',
      }),
    })
    const response = await POST(req as any)
    const data = await response.json()
    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
  })
})

describe('GET /api/notifications/preferences', () => {
  it('returns user notification preferences', async () => {
    const { GET } = await import('../preferences/route')
    const response = await GET()
    const data = await response.json()
    expect(response.status).toBe(200)
    expect(typeof data.prefs.waterReminder).toBe('boolean')
  })
})

describe('PUT /api/notifications/preferences', () => {
  it('updates notification preferences', async () => {
    const { PUT } = await import('../preferences/route')
    const req = new Request('http://localhost/api/notifications/preferences', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ waterReminder: false, mealReminder: true, smartCalorie: true }),
    })
    const response = await PUT(req as any)
    const data = await response.json()
    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
  })
})
```

- [ ] **Step 2: Test'i çalıştır — FAIL beklenir**

```bash
cd c:/Users/TUF/Desktop/Ai-Pt/apps/web && npx vitest run "app/api/notifications/__tests__/notifications.test.ts" 2>&1 | tail -10
```

- [ ] **Step 3: Register route oluştur**

Create `apps/web/app/api/notifications/register/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db/client'

export async function POST(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const user = await db.user.findUnique({ where: { clerkId } })
    if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const body = await req.json()

    if (body.type === 'web') {
      await db.notificationPreference.upsert({
        where: { userId: user.id },
        create: {
          userId: user.id,
          webPushEnabled: true,
          webPushEndpoint: body.endpoint,
          webPushAuth: body.auth,
          webPushP256dh: body.p256dh,
        },
        update: {
          webPushEnabled: true,
          webPushEndpoint: body.endpoint,
          webPushAuth: body.auth,
          webPushP256dh: body.p256dh,
        },
      })
    } else if (body.type === 'expo') {
      await db.notificationPreference.upsert({
        where: { userId: user.id },
        create: {
          userId: user.id,
          mobilePushEnabled: true,
          expoPushToken: body.token,
        },
        update: {
          mobilePushEnabled: true,
          expoPushToken: body.token,
        },
      })
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

- [ ] **Step 4: Preferences route oluştur**

Create `apps/web/app/api/notifications/preferences/route.ts`:

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

    const prefs = await db.notificationPreference.findUnique({ where: { userId: user.id } })
    return NextResponse.json({
      prefs: prefs ?? {
        webPushEnabled: false,
        mobilePushEnabled: false,
        waterReminder: true,
        mealReminder: true,
        smartCalorie: true,
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

    const body = await req.json()
    const { waterReminder, mealReminder, smartCalorie } = body

    await db.notificationPreference.upsert({
      where: { userId: user.id },
      create: { userId: user.id, waterReminder, mealReminder, smartCalorie },
      update: { waterReminder, mealReminder, smartCalorie },
    })

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

- [ ] **Step 5: Test'i çalıştır — PASS beklenir**

```bash
cd c:/Users/TUF/Desktop/Ai-Pt/apps/web && npx vitest run "app/api/notifications/__tests__/notifications.test.ts" 2>&1 | tail -10
```

Expected: 4 tests PASS

- [ ] **Step 6: Commit**

```bash
cd c:/Users/TUF/Desktop/Ai-Pt && git add apps/web/app/api/notifications/ && git commit -m "feat(notifications): add register and preferences API routes"
```

---

### Task 4: Akıllı Kalori Bildirimi — Cron Route (TDD)

**Files:**

- Create: `apps/web/app/api/cron/smart-notification/route.ts`
- Create: `apps/web/app/api/cron/smart-notification/__tests__/route.test.ts`

- [ ] **Step 1: Failing test yaz**

Create `apps/web/app/api/cron/smart-notification/__tests__/route.test.ts`:

```typescript
import { describe, it, expect, vi } from 'vitest'

vi.mock('@/lib/db/client', () => ({
  db: {
    notificationPreference: {
      findMany: vi.fn().mockResolvedValue([
        {
          userId: 'user_1',
          webPushEnabled: true,
          webPushEndpoint: 'https://push.example.com',
          webPushAuth: 'auth',
          webPushP256dh: 'p256dh',
          smartCalorie: true,
          user: {
            mealLogs: [{ totalCalories: 800 }],
            nutritionGoal: { dailyCalories: 2000 },
          },
        },
      ]),
    },
  },
}))

vi.mock('web-push', () => ({
  setVapidDetails: vi.fn(),
  sendNotification: vi.fn().mockResolvedValue({}),
}))

describe('GET /api/cron/smart-notification', () => {
  it('returns 200 and sent count', async () => {
    const { GET } = await import('../route')
    const req = new Request('http://localhost/api/cron/smart-notification', {
      headers: { authorization: `Bearer ${process.env.CRON_SECRET ?? 'test-secret'}` },
    })
    const response = await GET(req as any)
    const data = await response.json()
    expect(response.status).toBe(200)
    expect(typeof data.sent).toBe('number')
  })
})
```

- [ ] **Step 2: Test'i çalıştır — FAIL beklenir**

```bash
cd c:/Users/TUF/Desktop/Ai-Pt/apps/web && npx vitest run "app/api/cron/smart-notification/__tests__/route.test.ts" 2>&1 | tail -10
```

- [ ] **Step 3: Cron route oluştur**

Create `apps/web/app/api/cron/smart-notification/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import webPush from 'web-push'

webPush.setVapidDetails(
  process.env.VAPID_EMAIL ?? 'mailto:admin@example.com',
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? '',
  process.env.VAPID_PRIVATE_KEY ?? ''
)

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const prefs = await db.notificationPreference.findMany({
    where: { smartCalorie: true, webPushEnabled: true, webPushEndpoint: { not: null } },
    include: {
      user: {
        select: {
          mealLogs: {
            where: { loggedAt: { gte: today } },
            select: { totalCalories: true },
          },
          nutritionGoal: { select: { dailyCalories: true } },
        },
      },
    },
  })

  let sent = 0
  for (const pref of prefs) {
    const total = pref.user.mealLogs.reduce((s, m) => s + m.totalCalories, 0)
    const goal = pref.user.nutritionGoal?.dailyCalories ?? 2000
    const remaining = goal - total
    if (remaining <= 0) continue

    const payload = JSON.stringify({
      title: 'Günlük Hedefin',
      body: `Hedefe ulaşmak için ${remaining} kcal kaldı. Sağlıklı bir öğün planla!`,
    })

    try {
      await webPush.sendNotification(
        {
          endpoint: pref.webPushEndpoint!,
          keys: { auth: pref.webPushAuth!, p256dh: pref.webPushP256dh! },
        },
        payload
      )
      sent++
    } catch {
      // Geçersiz token — sessizce geç
    }
  }

  return NextResponse.json({ sent })
}
```

- [ ] **Step 4: Test'i çalıştır — PASS beklenir**

```bash
cd c:/Users/TUF/Desktop/Ai-Pt/apps/web && npx vitest run "app/api/cron/smart-notification/__tests__/route.test.ts" 2>&1 | tail -10
```

- [ ] **Step 5: Commit**

```bash
cd c:/Users/TUF/Desktop/Ai-Pt && git add apps/web/app/api/cron/smart-notification/ && git commit -m "feat(notifications): add smart calorie cron notification route"
```

---

## Chunk 2: Web Push Frontend

### Task 5: Service Worker + useNotifications hook (Web)

**Files:**

- Create: `apps/web/public/sw.js`
- Create: `apps/web/hooks/useNotifications.ts`
- Create: `apps/web/hooks/__tests__/useNotifications.test.ts`

- [ ] **Step 1: Service Worker oluştur**

Create `apps/web/public/sw.js`:

```javascript
self.addEventListener('push', (event) => {
  const data = event.data?.json() ?? {}
  event.waitUntil(
    self.registration.showNotification(data.title ?? 'AI PT', {
      body: data.body ?? '',
      icon: '/icon-192.png',
      badge: '/icon-192.png',
    })
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  event.waitUntil(clients.openWindow('/dashboard/nutrition'))
})
```

- [ ] **Step 2: Failing test yaz**

Create `apps/web/hooks/__tests__/useNotifications.test.ts`:

```typescript
// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useNotifications } from '../useNotifications'

describe('useNotifications', () => {
  it('returns supported=false when Notification API unavailable', () => {
    Object.defineProperty(global, 'Notification', { value: undefined, configurable: true })
    const { result } = renderHook(() => useNotifications())
    expect(result.current.supported).toBe(false)
  })

  it('returns supported=true when Notification API available', () => {
    Object.defineProperty(global, 'Notification', {
      value: { permission: 'default', requestPermission: vi.fn() },
      configurable: true,
    })
    const { result } = renderHook(() => useNotifications())
    expect(result.current.supported).toBe(true)
  })
})
```

- [ ] **Step 3: Test'i çalıştır — FAIL beklenir**

```bash
cd c:/Users/TUF/Desktop/Ai-Pt/apps/web && npx vitest run "hooks/__tests__/useNotifications.test.ts" 2>&1 | tail -10
```

- [ ] **Step 4: useNotifications hook oluştur**

Create `apps/web/hooks/useNotifications.ts`:

```typescript
'use client'

import { useState, useEffect } from 'react'

interface UseNotificationsResult {
  supported: boolean
  permission: NotificationPermission | 'unsupported'
  subscribe: () => Promise<void>
}

export function useNotifications(): UseNotificationsResult {
  const supported =
    typeof window !== 'undefined' && 'Notification' in window && 'serviceWorker' in navigator
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>(
    supported ? Notification.permission : 'unsupported'
  )

  useEffect(() => {
    if (!supported) return
    setPermission(Notification.permission)
  }, [supported])

  const subscribe = async () => {
    if (!supported) return
    const perm = await Notification.requestPermission()
    setPermission(perm)
    if (perm !== 'granted') return

    const reg = await navigator.serviceWorker.register('/sw.js')
    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    })

    const json = sub.toJSON()
    await fetch('/api/notifications/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'web',
        endpoint: json.endpoint,
        auth: json.keys?.auth,
        p256dh: json.keys?.p256dh,
      }),
    })
  }

  return { supported, permission, subscribe }
}
```

- [ ] **Step 5: Test'i çalıştır — PASS beklenir**

```bash
cd c:/Users/TUF/Desktop/Ai-Pt/apps/web && npx vitest run "hooks/__tests__/useNotifications.test.ts" 2>&1 | tail -10
```

- [ ] **Step 6: Commit**

```bash
cd c:/Users/TUF/Desktop/Ai-Pt && git add apps/web/public/sw.js apps/web/hooks/useNotifications.ts "apps/web/hooks/__tests__/useNotifications.test.ts" && git commit -m "feat(notifications): add service worker and useNotifications hook"
```

---

### Task 6: NotificationSettings UI bileşeni

**Files:**

- Create: `apps/web/components/settings/NotificationSettings.tsx`

- [ ] **Step 1: Bileşen oluştur**

Create `apps/web/components/settings/NotificationSettings.tsx`:

```typescript
'use client'

import { useState, useEffect } from 'react'
import { Bell, BellOff, Loader2 } from 'lucide-react'
import { useNotifications } from '@/hooks/useNotifications'

interface Prefs {
  waterReminder: boolean
  mealReminder: boolean
  smartCalorie: boolean
}

export function NotificationSettings() {
  const { supported, permission, subscribe } = useNotifications()
  const [prefs, setPrefs] = useState<Prefs>({ waterReminder: true, mealReminder: true, smartCalorie: true })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch('/api/notifications/preferences')
      .then((r) => r.json())
      .then((d) => {
        if (d.prefs) setPrefs({ waterReminder: d.prefs.waterReminder, mealReminder: d.prefs.mealReminder, smartCalorie: d.prefs.smartCalorie })
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const save = async (next: Prefs) => {
    setSaving(true)
    await fetch('/api/notifications/preferences', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(next),
    }).catch(() => {})
    setSaving(false)
  }

  const toggle = (key: keyof Prefs) => {
    const next = { ...prefs, [key]: !prefs[key] }
    setPrefs(next)
    save(next)
  }

  if (loading) return <div className="h-32 animate-pulse rounded-2xl bg-white/[0.04]" />

  return (
    <div className="space-y-3 rounded-2xl border border-white/[0.06] bg-white/[0.03] p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white">Bildirimler</h3>
        {saving && <Loader2 size={14} className="animate-spin text-[#64748B]" />}
      </div>

      {!supported ? (
        <p className="text-xs text-[#64748B]">Tarayıcın push bildirimleri desteklemiyor.</p>
      ) : permission !== 'granted' ? (
        <button
          onClick={subscribe}
          className="flex items-center gap-2 rounded-xl bg-[#6366F1]/10 px-4 py-2.5 text-sm font-medium text-[#6366F1] transition-colors hover:bg-[#6366F1]/20"
        >
          <Bell size={14} /> Bildirimlere İzin Ver
        </button>
      ) : (
        <div className="space-y-2">
          {[
            { key: 'waterReminder' as const, label: 'Su Hatırlatıcısı', desc: 'Her 2 saatte bir' },
            { key: 'mealReminder' as const, label: 'Öğün Hatırlatıcısı', desc: 'Kahvaltı, öğle, akşam' },
            { key: 'smartCalorie' as const, label: 'Akıllı Kalori Bildirimi', desc: 'Günlük hedefe göre kişisel' },
          ].map(({ key, label, desc }) => (
            <div key={key} className="flex items-center justify-between rounded-xl bg-white/[0.02] px-3 py-2.5">
              <div>
                <p className="text-sm text-white">{label}</p>
                <p className="text-xs text-[#64748B]">{desc}</p>
              </div>
              <button
                onClick={() => toggle(key)}
                className={`relative h-5 w-9 rounded-full transition-colors ${prefs[key] ? 'bg-[#6366F1]' : 'bg-white/[0.1]'}`}
              >
                <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform ${prefs[key] ? 'translate-x-4' : 'translate-x-0.5'}`} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
cd c:/Users/TUF/Desktop/Ai-Pt && git add apps/web/components/settings/NotificationSettings.tsx && git commit -m "feat(notifications): add NotificationSettings UI component"
```

---

## Chunk 3: Mobil Push (Expo)

### Task 7: expo-notifications kurulumu + mobil hook

**Files:**

- Modify: `apps/mobile/package.json` (otomatik)
- Create: `apps/mobile/hooks/useNotifications.ts`

- [ ] **Step 1: expo-notifications kur**

```bash
cd c:/Users/TUF/Desktop/Ai-Pt/apps/mobile && npx expo install expo-notifications
```

- [ ] **Step 2: Mobil useNotifications hook oluştur**

Create `apps/mobile/hooks/useNotifications.ts`:

```typescript
import { useState, useEffect, useRef } from 'react'
import * as Notifications from 'expo-notifications'
import Constants from 'expo-constants'
import { Platform } from 'react-native'

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
})

const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000'

export function useNotifications() {
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null)
  const [permission, setPermission] = useState<string>('undetermined')
  const notificationListener = useRef<Notifications.EventSubscription>()

  useEffect(() => {
    registerForPushNotifications()
    notificationListener.current = Notifications.addNotificationReceivedListener((n) => {
      console.log('Notification received:', n)
    })
    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current)
      }
    }
  }, [])

  const registerForPushNotifications = async () => {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
      })
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync()
    let finalStatus = existingStatus
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync()
      finalStatus = status
    }
    setPermission(finalStatus)
    if (finalStatus !== 'granted') return

    const projectId = Constants.expoConfig?.extra?.eas?.projectId
    if (!projectId) return

    const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data
    setExpoPushToken(token)

    // Backend'e kaydet
    await fetch(`${API_BASE}/api/notifications/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'expo', token }),
    }).catch(() => {})
  }

  // Temel bildirimler — cihaz üzerinde zamanla (internet gerektirmez)
  const scheduleWaterReminders = async () => {
    await Notifications.cancelAllScheduledNotificationsAsync()
    // Her 2 saatte bir, 08:00-22:00 arası
    for (let hour = 8; hour <= 22; hour += 2) {
      await Notifications.scheduleNotificationAsync({
        content: { title: '💧 Su İçmeyi Unutma!', body: 'Günde 8 bardak su içmeyi hedefle.' },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour, minute: 0 },
      })
    }
  }

  const scheduleMealReminders = async () => {
    const meals = [
      {
        hour: 8,
        minute: 0,
        title: '🌅 Kahvaltı Vakti',
        body: 'Güne enerjik başlamak için kahvaltını yap!',
      },
      {
        hour: 12,
        minute: 30,
        title: '☀️ Öğle Yemeği Vakti',
        body: 'Öğle yemeğini loglamayı unutma.',
      },
      {
        hour: 19,
        minute: 0,
        title: '🌙 Akşam Yemeği Vakti',
        body: 'Akşam yemeğini kaydet ve hedeflerini gör.',
      },
    ]
    for (const meal of meals) {
      await Notifications.scheduleNotificationAsync({
        content: { title: meal.title, body: meal.body },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour: meal.hour,
          minute: meal.minute,
        },
      })
    }
  }

  return { expoPushToken, permission, scheduleWaterReminders, scheduleMealReminders }
}
```

- [ ] **Step 3: Commit**

```bash
cd c:/Users/TUF/Desktop/Ai-Pt && git add apps/mobile/ && git commit -m "feat(notifications): add expo-notifications mobile hook"
```
