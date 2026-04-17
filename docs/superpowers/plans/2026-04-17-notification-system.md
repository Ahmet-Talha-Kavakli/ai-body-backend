# Notification System Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a real working notification system — in-app bell popover with DB-backed notifications, 30s polling, web push support, and cron-triggered reminders.

**Architecture:** A `Notification` Prisma model stores all in-app notifications. A single `createNotification()` utility handles DB writes + optional web push. The header Bell button uses a `useInAppNotifications` polling hook and opens a `NotificationPopover`. Three cron routes handle time-based reminders; action-based triggers call `createNotification()` at existing API route touchpoints.

**Tech Stack:** Next.js 14 App Router, Prisma + PostgreSQL, `web-push` (already installed), Radix UI Popover, Framer Motion, Vitest, Vercel Cron Jobs

---

## Chunk 1: DB Schema + Core Utility

### Task 1: Prisma Schema — `Notification` model + enum

**Files:**

- Modify: `apps/web/prisma/schema.prisma`

**Context:**

- Existing enums are at bottom of file (line ~828): `ProgramStatus`, `FitnessLevel`, `FitnessGoal`
- `User` model is at line 19 — add `notifications Notification[]` relation
- Run `prisma db push` (not `migrate dev`) — project uses Supabase which requires this
- After schema change run `pnpm --filter web exec prisma generate` to regenerate client

- [ ] **Step 1: Add `NotificationType` enum to schema**

Open `apps/web/prisma/schema.prisma`. After the last existing enum, add:

```prisma
enum NotificationType {
  water
  meal
  medication
  sleep
  workout
  pet
  streak
  achievement
  roadmap
  system
}
```

- [ ] **Step 2: Add `Notification` model to schema**

After the enum, add:

```prisma
model Notification {
  id        String           @id @default(cuid())
  userId    String
  user      User             @relation(fields: [userId], references: [id], onDelete: Cascade)
  type      NotificationType
  title     String
  body      String
  link      String?
  read      Boolean          @default(false)
  createdAt DateTime         @default(now())

  @@index([userId, read])
  @@index([userId, createdAt])
}
```

- [ ] **Step 3: Add relation to `User` model**

In `apps/web/prisma/schema.prisma`, find the `User` model's relation fields section (around line 83 where `notificationPrefs` is). Add after `notificationPrefs`:

```prisma
  notifications         Notification[]
```

- [ ] **Step 4: Push schema to DB**

```bash
cd apps/web && pnpm exec prisma db push
```

Expected: `✓ Your database is now in sync with your Prisma schema.`

- [ ] **Step 5: Regenerate Prisma client**

Kill any running dev server first (it locks the DLL on Windows):

```bash
# In PowerShell: Stop-Process -Name node -Force
cd apps/web && pnpm exec prisma generate
```

Expected: `✓ Generated Prisma Client`

- [ ] **Step 6: Commit**

```bash
git add apps/web/prisma/schema.prisma
git commit -m "feat: add Notification model and NotificationType enum to schema"
```

---

### Task 2: `createNotification()` utility

**Files:**

- Create: `apps/web/lib/notifications/create-notification.ts`
- Create: `apps/web/lib/notifications/__tests__/create-notification.test.ts`

**Context:**

- `web-push` is already installed (`"web-push": "^3.6.7"`)
- VAPID env vars: `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_EMAIL`
- `NotificationPreference` model has all toggle fields — see schema around line 417
- Existing cron route (`apps/web/app/api/cron/smart-notification/route.ts`) shows how `web-push` is used — reference that pattern
- Test command: `cd apps/web && pnpm test`

- [ ] **Step 1: Write failing test**

Create `apps/web/lib/notifications/__tests__/create-notification.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock Prisma
vi.mock('@/lib/db/client', () => ({
  db: {
    notification: {
      create: vi.fn().mockResolvedValue({ id: 'notif-1' }),
    },
    notificationPreference: {
      findUnique: vi.fn(),
    },
  },
}))

// Mock web-push
vi.mock('web-push', () => ({
  default: {
    setVapidDetails: vi.fn(),
    sendNotification: vi.fn().mockResolvedValue({}),
  },
}))

import { createNotification } from '../create-notification'
import { db } from '@/lib/db/client'
import webPush from 'web-push'

describe('createNotification', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('writes notification to DB', async () => {
    vi.mocked(db.notificationPreference.findUnique).mockResolvedValue(null)

    await createNotification('user-1', {
      type: 'achievement',
      title: 'Yeni Başarım!',
      body: 'İlk antrenmanını tamamladın.',
      link: '/dashboard/progress',
    })

    expect(db.notification.create).toHaveBeenCalledWith({
      data: {
        userId: 'user-1',
        type: 'achievement',
        title: 'Yeni Başarım!',
        body: 'İlk antrenmanını tamamladın.',
        link: '/dashboard/progress',
        read: false,
      },
    })
  })

  it('does not send push when preference toggle is off', async () => {
    vi.mocked(db.notificationPreference.findUnique).mockResolvedValue({
      achievementAlert: false,
      webPushEnabled: true,
      webPushEndpoint: 'https://fcm.example.com/sub',
      webPushAuth: 'auth-key',
      webPushP256dh: 'p256dh-key',
    } as any)

    await createNotification('user-1', {
      type: 'achievement',
      title: 'Test',
      body: 'Body',
    })

    expect(webPush.sendNotification).not.toHaveBeenCalled()
  })

  it('sends push when toggle is on and webPushEnabled', async () => {
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY = 'pub-key'
    process.env.VAPID_PRIVATE_KEY = 'priv-key'
    process.env.VAPID_EMAIL = 'mailto:test@example.com'

    vi.mocked(db.notificationPreference.findUnique).mockResolvedValue({
      achievementAlert: true,
      webPushEnabled: true,
      webPushEndpoint: 'https://fcm.example.com/sub',
      webPushAuth: 'auth-key',
      webPushP256dh: 'p256dh-key',
    } as any)

    await createNotification('user-1', {
      type: 'achievement',
      title: 'Test',
      body: 'Body',
    })

    expect(webPush.sendNotification).toHaveBeenCalled()
  })

  it('sends system notifications regardless of preference toggle', async () => {
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY = 'pub-key'
    process.env.VAPID_PRIVATE_KEY = 'priv-key'

    vi.mocked(db.notificationPreference.findUnique).mockResolvedValue({
      webPushEnabled: true,
      webPushEndpoint: 'https://fcm.example.com/sub',
      webPushAuth: 'auth-key',
      webPushP256dh: 'p256dh-key',
    } as any)

    await createNotification('user-1', {
      type: 'system',
      title: 'Sistem mesajı',
      body: 'Yeni özellik!',
    })

    expect(db.notification.create).toHaveBeenCalled()
    expect(webPush.sendNotification).toHaveBeenCalled()
  })

  it('still writes to DB even if push throws', async () => {
    vi.mocked(db.notificationPreference.findUnique).mockResolvedValue({
      achievementAlert: true,
      webPushEnabled: true,
      webPushEndpoint: 'https://fcm.example.com/sub',
      webPushAuth: 'auth-key',
      webPushP256dh: 'p256dh-key',
    } as any)
    vi.mocked(webPush.sendNotification).mockRejectedValue(new Error('Push failed'))

    // Should NOT throw
    await expect(
      createNotification('user-1', { type: 'achievement', title: 'T', body: 'B' })
    ).resolves.not.toThrow()

    expect(db.notification.create).toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd apps/web && pnpm test lib/notifications/__tests__/create-notification.test.ts
```

Expected: FAIL — `Cannot find module '../create-notification'`

- [ ] **Step 3: Implement `create-notification.ts`**

Create `apps/web/lib/notifications/create-notification.ts`:

```typescript
import { db } from '@/lib/db/client'
import type { NotificationType } from '@prisma/client'
import webPush from 'web-push'

const PREFERENCE_FIELD: Partial<Record<NotificationType, string>> = {
  water: 'waterReminder',
  meal: 'mealReminder',
  medication: 'medicationReminder',
  sleep: 'sleepReminder',
  workout: 'workoutReminder',
  pet: 'petNotification',
  streak: 'streakWarning',
  achievement: 'achievementAlert',
  roadmap: 'roadmapUpdate',
}

interface NotificationPayload {
  type: NotificationType
  title: string
  body: string
  link?: string
}

export async function createNotification(
  userId: string,
  payload: NotificationPayload
): Promise<void> {
  await db.notification.create({
    data: {
      userId,
      type: payload.type,
      title: payload.title,
      body: payload.body,
      link: payload.link,
      read: false,
    },
  })

  const prefs = await db.notificationPreference.findUnique({ where: { userId } })
  if (!prefs) return

  const prefField = PREFERENCE_FIELD[payload.type]
  const toggleOn = payload.type === 'system' || (prefField && (prefs as any)[prefField] === true)
  if (!toggleOn) return

  if (!prefs.webPushEnabled || !prefs.webPushEndpoint || !prefs.webPushAuth || !prefs.webPushP256dh)
    return

  const vapidPublic = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  const vapidPrivate = process.env.VAPID_PRIVATE_KEY
  if (!vapidPublic || !vapidPrivate) return

  webPush.setVapidDetails(
    process.env.VAPID_EMAIL ?? 'mailto:admin@example.com',
    vapidPublic,
    vapidPrivate
  )

  try {
    await webPush.sendNotification(
      {
        endpoint: prefs.webPushEndpoint,
        keys: { auth: prefs.webPushAuth, p256dh: prefs.webPushP256dh },
      },
      JSON.stringify({ title: payload.title, body: payload.body, link: payload.link })
    )
  } catch (err) {
    console.error('[createNotification] push failed', err)
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd apps/web && pnpm test lib/notifications/__tests__/create-notification.test.ts
```

Expected: 5 tests pass

- [ ] **Step 5: Commit**

```bash
git add apps/web/lib/notifications/
git commit -m "feat: add createNotification utility with DB write and web push"
```

---

### Task 3: `relative-time` utility

**Files:**

- Create: `apps/web/lib/notifications/relative-time.ts`
- Create: `apps/web/lib/notifications/__tests__/relative-time.test.ts`

- [ ] **Step 1: Write failing test**

Create `apps/web/lib/notifications/__tests__/relative-time.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { relativeTime } from '../relative-time'

describe('relativeTime', () => {
  const now = new Date('2026-04-17T12:00:00Z')

  it('returns "az önce" for < 60 seconds', () => {
    const d = new Date(now.getTime() - 30 * 1000)
    expect(relativeTime(d, now)).toBe('az önce')
  })

  it('returns "X dk önce" for minutes', () => {
    const d = new Date(now.getTime() - 5 * 60 * 1000)
    expect(relativeTime(d, now)).toBe('5 dk önce')
  })

  it('returns "1 sa önce" for 1 hour', () => {
    const d = new Date(now.getTime() - 60 * 60 * 1000)
    expect(relativeTime(d, now)).toBe('1 sa önce')
  })

  it('returns "X sa önce" for hours', () => {
    const d = new Date(now.getTime() - 3 * 60 * 60 * 1000)
    expect(relativeTime(d, now)).toBe('3 sa önce')
  })

  it('returns "dün" for yesterday', () => {
    const d = new Date(now.getTime() - 25 * 60 * 60 * 1000)
    expect(relativeTime(d, now)).toBe('dün')
  })

  it('returns "X gün önce" for days', () => {
    const d = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000)
    expect(relativeTime(d, now)).toBe('3 gün önce')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd apps/web && pnpm test lib/notifications/__tests__/relative-time.test.ts
```

Expected: FAIL

- [ ] **Step 3: Implement `relative-time.ts`**

Create `apps/web/lib/notifications/relative-time.ts`:

```typescript
export function relativeTime(date: Date, now: Date = new Date()): string {
  const diffMs = now.getTime() - date.getTime()
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHour = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHour / 24)

  if (diffSec < 60) return 'az önce'
  if (diffMin < 60) return `${diffMin} dk önce`
  if (diffHour < 24) return `${diffHour} sa önce`
  if (diffDay === 1) return 'dün'
  return `${diffDay} gün önce`
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd apps/web && pnpm test lib/notifications/__tests__/relative-time.test.ts
```

Expected: 6 tests pass

- [ ] **Step 5: Commit**

```bash
git add apps/web/lib/notifications/relative-time.ts apps/web/lib/notifications/__tests__/relative-time.test.ts
git commit -m "feat: add Turkish relative time utility"
```

---

## Chunk 2: API Routes

### Task 4: `GET /api/notifications` — list endpoint

**Files:**

- Create: `apps/web/app/api/notifications/route.ts`
- Create: `apps/web/app/api/notifications/__tests__/list.test.ts`

**Context:**

- `withAuth` helper is at `apps/web/lib/api/with-auth.ts` — use it like other routes
- Existing test pattern: `apps/web/app/api/notifications/__tests__/notifications.test.ts`
- Return last 30 notifications ordered by `createdAt desc`

- [ ] **Step 1: Write failing test**

Create `apps/web/app/api/notifications/__tests__/list.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET } from '../route'
import { NextRequest } from 'next/server'

vi.mock('@/lib/db/client', () => ({
  db: {
    notification: {
      findMany: vi.fn(),
      count: vi.fn(),
    },
    user: {
      findUnique: vi.fn().mockResolvedValue({ id: 'user-1', clerkId: 'clerk-1' }),
    },
  },
}))

vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn().mockResolvedValue({ userId: 'clerk-1' }),
}))

import { db } from '@/lib/db/client'
import { auth } from '@clerk/nextjs/server'

describe('GET /api/notifications', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns notifications and unreadCount', async () => {
    const mockNotifs = [
      {
        id: 'n1',
        type: 'achievement',
        title: 'Test',
        body: 'B',
        read: false,
        createdAt: new Date(),
        link: null,
      },
    ]
    vi.mocked(auth).mockResolvedValue({ userId: 'clerk-1' } as any)
    vi.mocked(db.notification.findMany).mockResolvedValue(mockNotifs as any)
    vi.mocked(db.notification.count).mockResolvedValue(1)

    const req = new NextRequest('http://localhost/api/notifications')
    const res = await GET(req)
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.notifications).toHaveLength(1)
    expect(json.unreadCount).toBe(1)
    expect(db.notification.findMany).toHaveBeenCalledWith({
      where: { userId: 'user-1' },
      orderBy: { createdAt: 'desc' },
      take: 30,
    })
  })

  it('returns 401 when not authenticated', async () => {
    vi.mocked(auth).mockResolvedValueOnce({ userId: null } as any)

    const req = new NextRequest('http://localhost/api/notifications')
    const res = await GET(req)
    expect(res.status).toBe(401)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd apps/web && pnpm test app/api/notifications/__tests__/list.test.ts
```

Expected: FAIL

- [ ] **Step 3: Implement `route.ts`**

Create `apps/web/app/api/notifications/route.ts`:

```typescript
import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/api/with-auth'
import { db } from '@/lib/db/client'

export const GET = withAuth(async (_req, { user }) => {
  const [notifications, unreadCount] = await Promise.all([
    db.notification.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 30,
    }),
    db.notification.count({
      where: { userId: user.id, read: false },
    }),
  ])

  return NextResponse.json({ notifications, unreadCount })
})
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd apps/web && pnpm test app/api/notifications/__tests__/list.test.ts
```

Expected: 2 tests pass

- [ ] **Step 5: Commit**

```bash
git add apps/web/app/api/notifications/route.ts apps/web/app/api/notifications/__tests__/list.test.ts
git commit -m "feat: add GET /api/notifications list endpoint"
```

---

### Task 5: `POST /api/notifications/[id]/read` + `POST /api/notifications/read-all`

**Files:**

- Create: `apps/web/app/api/notifications/[id]/read/route.ts`
- Create: `apps/web/app/api/notifications/read-all/route.ts`
- Create: `apps/web/app/api/notifications/__tests__/read.test.ts`

- [ ] **Step 1: Write failing tests**

Create `apps/web/app/api/notifications/__tests__/read.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/db/client', () => ({
  db: {
    notification: {
      update: vi.fn().mockResolvedValue({}),
      updateMany: vi.fn().mockResolvedValue({ count: 3 }),
    },
    user: {
      findUnique: vi.fn().mockResolvedValue({ id: 'user-1', clerkId: 'clerk-1' }),
    },
  },
}))

vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn().mockResolvedValue({ userId: 'clerk-1' }),
}))

import { NextRequest } from 'next/server'
import { db } from '@/lib/db/client'

describe('POST /api/notifications/[id]/read', () => {
  beforeEach(() => vi.clearAllMocks())

  it('marks single notification as read', async () => {
    const { POST } = await import('../[id]/read/route')
    const req = new NextRequest('http://localhost/api/notifications/notif-1/read', {
      method: 'POST',
    })
    const res = await POST(req, { params: Promise.resolve({ id: 'notif-1' }) })
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.success).toBe(true)
    expect(db.notification.update).toHaveBeenCalledWith({
      where: { id: 'notif-1', userId: 'user-1' },
      data: { read: true },
    })
  })
})

describe('POST /api/notifications/read-all', () => {
  it('marks all notifications as read', async () => {
    const { POST } = await import('../read-all/route')
    const req = new NextRequest('http://localhost/api/notifications/read-all', { method: 'POST' })
    const res = await POST(req)
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.success).toBe(true)
    expect(db.notification.updateMany).toHaveBeenCalledWith({
      where: { userId: 'user-1', read: false },
      data: { read: true },
    })
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd apps/web && pnpm test app/api/notifications/__tests__/read.test.ts
```

Expected: FAIL

- [ ] **Step 3: Implement `[id]/read/route.ts`**

Create `apps/web/app/api/notifications/[id]/read/route.ts`:

```typescript
import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/api/with-auth'
import { db } from '@/lib/db/client'

export const POST = withAuth(async (_req, { user, params }) => {
  const resolvedParams = await params
  const id = resolvedParams?.id as string

  await db.notification.update({
    where: { id, userId: user.id },
    data: { read: true },
  })

  return NextResponse.json({ success: true })
})
```

- [ ] **Step 4: Implement `read-all/route.ts`**

Create `apps/web/app/api/notifications/read-all/route.ts`:

```typescript
import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/api/with-auth'
import { db } from '@/lib/db/client'

export const POST = withAuth(async (_req, { user }) => {
  await db.notification.updateMany({
    where: { userId: user.id, read: false },
    data: { read: true },
  })

  return NextResponse.json({ success: true })
})
```

- [ ] **Step 5: Run tests to verify they pass**

```bash
cd apps/web && pnpm test app/api/notifications/__tests__/read.test.ts
```

Expected: 2 tests pass

- [ ] **Step 6: Commit**

```bash
git add apps/web/app/api/notifications/
git commit -m "feat: add mark-read and read-all notification endpoints"
```

---

## Chunk 3: Frontend

### Task 6: `useInAppNotifications` hook

**Files:**

- Create: `apps/web/hooks/useInAppNotifications.ts`
- Create: `apps/web/hooks/__tests__/useInAppNotifications.test.ts`

- [ ] **Step 1: Write failing test**

Create `apps/web/hooks/__tests__/useInAppNotifications.test.ts`:

```typescript
// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'

global.fetch = vi.fn()

describe('useInAppNotifications', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({
        notifications: [
          {
            id: 'n1',
            type: 'achievement',
            title: 'Test',
            body: 'B',
            read: false,
            createdAt: new Date().toISOString(),
            link: null,
          },
        ],
        unreadCount: 1,
      }),
    } as any)
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.clearAllMocks()
  })

  it('fetches notifications on mount', async () => {
    const { useInAppNotifications } = await import('../useInAppNotifications')
    const { result } = renderHook(() => useInAppNotifications())

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.unreadCount).toBe(1)
    expect(result.current.notifications).toHaveLength(1)
  })

  it('polls every 30 seconds', async () => {
    const { useInAppNotifications } = await import('../useInAppNotifications')
    renderHook(() => useInAppNotifications())

    await act(async () => {
      await Promise.resolve()
    })
    const initialCalls = vi.mocked(fetch).mock.calls.length

    await act(async () => {
      vi.advanceTimersByTime(30000)
    })
    await act(async () => {
      await Promise.resolve()
    })

    expect(vi.mocked(fetch).mock.calls.length).toBeGreaterThan(initialCalls)
  })

  it('markRead updates local state optimistically', async () => {
    const { useInAppNotifications } = await import('../useInAppNotifications')

    // beforeEach mock returns the list shape — keep it for initial fetch
    // Use mockResolvedValueOnce for the POST /read call (success response)
    vi.mocked(fetch)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          notifications: [
            {
              id: 'n1',
              type: 'achievement',
              title: 'Test',
              body: 'B',
              read: false,
              createdAt: new Date().toISOString(),
              link: null,
            },
          ],
          unreadCount: 1,
        }),
      } as any)
      .mockResolvedValueOnce({ ok: true, json: async () => ({ success: true }) } as any)

    const { result } = renderHook(() => useInAppNotifications())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.notifications).toHaveLength(1)

    await act(async () => {
      await result.current.markRead('n1')
    })

    const notif = result.current.notifications.find((n) => n.id === 'n1')
    expect(notif?.read).toBe(true)
    expect(result.current.unreadCount).toBe(0)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd apps/web && pnpm test hooks/__tests__/useInAppNotifications.test.ts
```

Expected: FAIL

- [ ] **Step 3: Implement `useInAppNotifications.ts`**

Create `apps/web/hooks/useInAppNotifications.ts`:

```typescript
'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import type { NotificationType } from '@prisma/client'

export interface InAppNotification {
  id: string
  type: NotificationType
  title: string
  body: string
  link: string | null
  read: boolean
  createdAt: string
}

interface UseInAppNotificationsResult {
  notifications: InAppNotification[]
  unreadCount: number
  loading: boolean
  markRead: (id: string) => Promise<void>
  markAllRead: () => Promise<void>
  refresh: () => void
}

export function useInAppNotifications(): UseInAppNotificationsResult {
  const [notifications, setNotifications] = useState<InAppNotification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const isMounted = useRef(true)

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications')
      if (!res.ok) return
      const data = await res.json()
      if (!isMounted.current) return
      setNotifications(data.notifications)
      setUnreadCount(data.unreadCount)
    } catch {
      // silent
    } finally {
      if (isMounted.current) setLoading(false)
    }
  }, [])

  useEffect(() => {
    isMounted.current = true
    fetchNotifications()

    const interval = setInterval(fetchNotifications, 30_000)

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') fetchNotifications()
    }
    document.addEventListener('visibilitychange', handleVisibility)

    return () => {
      isMounted.current = false
      clearInterval(interval)
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [fetchNotifications])

  const markRead = useCallback(async (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
    setUnreadCount((prev) => Math.max(0, prev - 1))

    await fetch(`/api/notifications/${id}/read`, { method: 'POST' }).catch(() => {})
  }, [])

  const markAllRead = useCallback(async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
    setUnreadCount(0)

    await fetch('/api/notifications/read-all', { method: 'POST' }).catch(() => {})
  }, [])

  return {
    notifications,
    unreadCount,
    loading,
    markRead,
    markAllRead,
    refresh: fetchNotifications,
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd apps/web && pnpm test hooks/__tests__/useInAppNotifications.test.ts
```

Expected: 3 tests pass

- [ ] **Step 5: Commit**

```bash
git add apps/web/hooks/useInAppNotifications.ts apps/web/hooks/__tests__/useInAppNotifications.test.ts
git commit -m "feat: add useInAppNotifications polling hook"
```

---

### Task 7: `NotificationPopover` component

**Files:**

- Create: `apps/web/components/notifications/NotificationPopover.tsx`

**Context:**

- Radix Popover is already used in the project — check `apps/web/components/ui/popover.tsx`
- Dark theme: `bg-black/90 border-white/10 text-white` pattern (match existing dashboard components)
- Type-to-icon mapping:
  - `achievement` → Trophy (yellow-400)
  - `workout` → Zap (green-400)
  - `streak` → Flame (orange-400)
  - `water` → Droplets (blue-400)
  - `medication` → Pill (red-400)
  - `sleep` → Moon (purple-400)
  - `pet` → Cat (amber-400)
  - `roadmap` → Map (indigo-400)
  - `meal` → Utensils (emerald-400)
  - `system` → Bell (white/70)
- `relativeTime` is at `@/lib/notifications/relative-time`
- `useInAppNotifications` is at `@/hooks/useInAppNotifications`
- `useRouter` from `next/navigation` for navigation on click

- [ ] **Step 1: Implement `NotificationPopover.tsx`**

Create `apps/web/components/notifications/NotificationPopover.tsx`:

```typescript
'use client'

import { useRouter } from 'next/navigation'
import { Bell, Trophy, Zap, Flame, Droplets, Pill, Moon, Cat, Map, Utensils } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { motion, AnimatePresence } from 'framer-motion'
import { relativeTime } from '@/lib/notifications/relative-time'
import { useInAppNotifications } from '@/hooks/useInAppNotifications'
import type { InAppNotification } from '@/hooks/useInAppNotifications'
import type { NotificationType } from '@prisma/client'
import { useState } from 'react'

const TYPE_CONFIG: Record<NotificationType, { icon: React.ElementType; color: string }> = {
  achievement: { icon: Trophy, color: 'text-yellow-400' },
  workout: { icon: Zap, color: 'text-green-400' },
  streak: { icon: Flame, color: 'text-orange-400' },
  water: { icon: Droplets, color: 'text-blue-400' },
  medication: { icon: Pill, color: 'text-red-400' },
  sleep: { icon: Moon, color: 'text-purple-400' },
  pet: { icon: Cat, color: 'text-amber-400' },
  roadmap: { icon: Map, color: 'text-indigo-400' },
  meal: { icon: Utensils, color: 'text-emerald-400' },
  system: { icon: Bell, color: 'text-white/70' },
}

function NotificationItem({
  notif,
  onRead,
}: {
  notif: InAppNotification
  onRead: () => void
}) {
  const router = useRouter()
  const cfg = TYPE_CONFIG[notif.type] ?? TYPE_CONFIG.system
  const Icon = cfg.icon

  const handleClick = () => {
    onRead()
    if (notif.link) router.push(notif.link)
  }

  return (
    <motion.button
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      onClick={handleClick}
      className={`flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-white/5 ${!notif.read ? 'bg-white/[0.03]' : ''}`}
    >
      <div className={`mt-0.5 shrink-0 ${cfg.color}`}>
        <Icon size={16} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className={`truncate text-sm font-semibold ${notif.read ? 'text-white/60' : 'text-white'}`}>
            {notif.title}
          </p>
          <span className="shrink-0 text-[10px] text-white/30">
            {relativeTime(new Date(notif.createdAt))}
          </span>
        </div>
        <p className="mt-0.5 truncate text-xs text-white/40">{notif.body}</p>
      </div>
      {!notif.read && (
        <div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-400" />
      )}
    </motion.button>
  )
}

export function NotificationPopover() {
  const { notifications, unreadCount, loading, markRead, markAllRead } = useInAppNotifications()
  const [open, setOpen] = useState(false)

  const handleRead = async (id: string) => {
    await markRead(id)
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className="relative flex h-9 w-9 items-center justify-center rounded-lg transition-colors hover:bg-white/5">
          <Bell size={20} className="text-white/70" />
          <AnimatePresence>
            {unreadCount > 0 && (
              <motion.span
                key="badge"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-indigo-500 text-[9px] font-bold text-white"
              >
                {unreadCount > 9 ? '9+' : unreadCount}
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-80 border-white/10 bg-black/90 p-0 shadow-2xl backdrop-blur-xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
          <span className="text-sm font-bold text-white">Bildirimler</span>
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              Hepsini okundu işaretle
            </button>
          )}
        </div>

        {/* Content */}
        <div className="max-h-96 overflow-y-auto">
          {loading ? (
            <div className="space-y-0">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex gap-3 px-4 py-3">
                  <div className="h-4 w-4 animate-pulse rounded-full bg-white/10" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-3/4 animate-pulse rounded bg-white/10" />
                    <div className="h-2 w-1/2 animate-pulse rounded bg-white/10" />
                  </div>
                </div>
              ))}
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-10 text-center">
              <Bell size={24} className="text-white/20" />
              <p className="text-sm text-white/40">Henüz bildirim yok</p>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {notifications.map((notif) => (
                <NotificationItem
                  key={notif.id}
                  notif={notif}
                  onRead={() => handleRead(notif.id)}
                />
              ))}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/components/notifications/NotificationPopover.tsx
git commit -m "feat: add NotificationPopover component"
```

---

### Task 8: Wire Bell button in header

**Files:**

- Modify: `apps/web/components/dashboard/shared/header.tsx`

**Context:**

- Current header has two static bell buttons (mobile + desktop) with hardcoded badge "3"
- Replace both with `<NotificationPopover />`
- Remove `Bell` import from lucide (NotificationPopover uses it internally now)

- [ ] **Step 1: Update header**

Open `apps/web/components/dashboard/shared/header.tsx`.

Replace the entire file content with:

```typescript
'use client'

import { useUser } from '@clerk/nextjs'
import { Menu } from 'lucide-react'
import Image from 'next/image'
import { NotificationPopover } from '@/components/notifications/NotificationPopover'

interface DashboardHeaderProps {
  onMenuClick: () => void
}

export function DashboardHeader({ onMenuClick }: DashboardHeaderProps) {
  const { user } = useUser()
  const avatarUrl = user?.imageUrl
  const initials = user?.firstName?.[0] ?? 'U'

  return (
    <header className="sticky top-0 z-40 border-b border-white/5 bg-black/60 backdrop-blur-xl">
      <div className="flex h-16 items-center justify-between px-4">
        {/* MOBILE */}
        <div className="flex w-full items-center justify-between lg:hidden">
          {/* Sol: Avatar */}
          <div className="h-9 w-9 overflow-hidden rounded-full ring-2 ring-indigo-500/30">
            {avatarUrl ? (
              <Image
                src={avatarUrl}
                alt="avatar"
                width={36}
                height={36}
                className="h-full w-full object-cover"
                unoptimized
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-indigo-500 text-sm font-bold text-white">
                {initials}
              </div>
            )}
          </div>

          {/* Orta: Logo */}
          <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-lg font-black text-transparent">
            FitAI
          </span>

          {/* Sağ: Bildirim */}
          <NotificationPopover />
        </div>

        {/* DESKTOP */}
        <div className="hidden w-full items-center justify-between lg:flex">
          {/* Sol: Hamburger menü */}
          <button
            onClick={onMenuClick}
            className="rounded-lg p-2 text-white/70 transition-colors hover:bg-white/5"
          >
            <Menu size={20} />
          </button>

          {/* Sağ: Bildirim + Avatar */}
          <div className="flex items-center gap-4">
            <NotificationPopover />

            <div className="h-8 w-8 overflow-hidden rounded-full ring-2 ring-indigo-500/30">
              {avatarUrl ? (
                <Image
                  src={avatarUrl}
                  alt="avatar"
                  width={32}
                  height={32}
                  className="h-full w-full object-cover"
                  unoptimized
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-indigo-500 text-xs font-bold text-white">
                  {initials}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/components/dashboard/shared/header.tsx
git commit -m "feat: wire NotificationPopover into dashboard header"
```

---

## Chunk 4: Cron Routes + Trigger Points

### Task 9: Cron — water reminders

**Files:**

- Create: `apps/web/app/api/cron/notifications-water/route.ts`
- Modify: `apps/web/vercel.json`

**Context:**

- Auth pattern: check `Authorization: Bearer ${CRON_SECRET}` — see `apps/web/app/api/cron/smart-notification/route.ts` for exact pattern
- Query users with `waterReminder: true` via `notificationPrefs`
- Check last `water` Notification per user — if ≥ 2 hours ago (or none), call `createNotification()`
- `WorkoutSession` is related via `userId` field

- [ ] **Step 1: Implement water cron route**

Create `apps/web/app/api/cron/notifications-water/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { createNotification } from '@/lib/notifications/create-notification'

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const prefs = await db.notificationPreference.findMany({
    where: { waterReminder: true },
    select: { userId: true },
  })

  const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000)
  let sent = 0

  for (const { userId } of prefs) {
    try {
      const lastWater = await db.notification.findFirst({
        where: { userId, type: 'water' },
        orderBy: { createdAt: 'desc' },
      })

      if (lastWater && lastWater.createdAt > twoHoursAgo) continue

      await createNotification(userId, {
        type: 'water',
        title: 'Su İçme Vakti! 💧',
        body: 'Günlük su hedefine ulaşmak için bir bardak su iç.',
        link: '/dashboard/health',
      })
      sent++
    } catch (err) {
      console.error(`[cron/water] failed for userId=${userId}`, err)
    }
  }

  return NextResponse.json({ ok: true, sent })
}
```

- [ ] **Step 2: Add cron entries to `vercel.json`**

Open `apps/web/vercel.json`. Add 3 new entries to the `crons` array (keep existing 4):

```json
{
  "buildCommand": "pnpm install && pnpm build",
  "installCommand": "pnpm install",
  "crons": [
    { "path": "/api/cron/weekly-summary", "schedule": "0 6 * * 1" },
    { "path": "/api/cron/morning-sync", "schedule": "0 7 * * *" },
    { "path": "/api/cron/smart-notification", "schedule": "0 18 * * *" },
    { "path": "/api/cron/water-streak-check", "schedule": "0 1 * * *" },
    { "path": "/api/cron/notifications-water", "schedule": "0 * * * *" },
    { "path": "/api/cron/notifications-daily", "schedule": "0 8 * * *" },
    { "path": "/api/cron/notifications-streak", "schedule": "0 20 * * *" }
  ]
}
```

- [ ] **Step 3: Commit**

```bash
git add apps/web/app/api/cron/notifications-water/route.ts apps/web/vercel.json
git commit -m "feat: add water reminder cron route"
```

---

### Task 10: Cron — daily reminders (medication, sleep, workout)

**Files:**

- Create: `apps/web/app/api/cron/notifications-daily/route.ts`

- [ ] **Step 1: Implement daily cron route**

Create `apps/web/app/api/cron/notifications-daily/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { createNotification } from '@/lib/notifications/create-notification'

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const prefs = await db.notificationPreference.findMany({
    where: {
      OR: [{ medicationReminder: true }, { sleepReminder: true }, { workoutReminder: true }],
    },
    select: {
      userId: true,
      medicationReminder: true,
      sleepReminder: true,
      workoutReminder: true,
    },
  })

  let sent = 0

  for (const pref of prefs) {
    try {
      if (pref.medicationReminder) {
        await createNotification(pref.userId, {
          type: 'medication',
          title: 'İlaç Vakti 💊',
          body: 'Günlük ilaçlarını almayı unutma.',
          link: '/dashboard/supplements',
        })
        sent++
      }
      if (pref.sleepReminder) {
        await createNotification(pref.userId, {
          type: 'sleep',
          title: 'Uyku Kaliteni Takip Et 🌙',
          body: 'Dün gece kaç saat uyudun? Verilerini kaydet.',
          link: '/dashboard/health',
        })
        sent++
      }
      if (pref.workoutReminder) {
        await createNotification(pref.userId, {
          type: 'workout',
          title: 'Antrenman Günü! 💪',
          body: 'Bugün antrenman planında var. Hazır mısın?',
          link: '/dashboard/workouts',
        })
        sent++
      }
    } catch (err) {
      console.error(`[cron/daily] failed for userId=${pref.userId}`, err)
    }
  }

  return NextResponse.json({ ok: true, sent })
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/app/api/cron/notifications-daily/route.ts
git commit -m "feat: add daily reminders cron route (medication, sleep, workout)"
```

---

### Task 11: Cron — streak warning

**Files:**

- Create: `apps/web/app/api/cron/notifications-streak/route.ts`

**Context:**

- `WorkoutSession` model has `userId` and `startedAt` fields
- "Today" = since midnight UTC

- [ ] **Step 1: Implement streak cron route**

Create `apps/web/app/api/cron/notifications-streak/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { createNotification } from '@/lib/notifications/create-notification'

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const todayStart = new Date()
  todayStart.setUTCHours(0, 0, 0, 0)

  const prefs = await db.notificationPreference.findMany({
    where: { streakWarning: true },
    select: { userId: true },
  })

  let sent = 0

  for (const { userId } of prefs) {
    try {
      const todaySession = await db.workoutSession.findFirst({
        where: { userId, startedAt: { gte: todayStart } },
      })

      if (todaySession) continue

      await createNotification(userId, {
        type: 'streak',
        title: 'Serini Koru! 🔥',
        body: 'Bugün henüz antrenman yapmadın. Serinini kırmamak için harekete geç!',
        link: '/dashboard/workouts',
      })
      sent++
    } catch (err) {
      console.error(`[cron/streak] failed for userId=${userId}`, err)
    }
  }

  return NextResponse.json({ ok: true, sent })
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/app/api/cron/notifications-streak/route.ts
git commit -m "feat: add streak warning cron route"
```

---

### Task 12: Action-based trigger points

**Files:**

- Modify: `apps/web/app/api/sessions/[id]/route.ts` (workout complete + achievement)
- Modify: `apps/web/app/api/roadmap/week/[weekId]/route.ts` (roadmap update)

**Context:**

- Workout session completion is at `apps/web/app/api/sessions/[id]/route.ts` line 90 — after the `$transaction` block resolves and `checkAndAwardAchievements` is called
- Achievement notification is triggered at the same file — generic message since achievement name is not available at this call site
- Roadmap update is at `apps/web/app/api/roadmap/week/[weekId]/route.ts` — after task/week update
- All triggers are fire-and-forget: `.catch(console.error)` — never block the response

- [ ] **Step 1: Add workout + achievement trigger to `apps/web/app/api/sessions/[id]/route.ts`**

Open `apps/web/app/api/sessions/[id]/route.ts`. Add import at top:

```typescript
import { createNotification } from '@/lib/notifications/create-notification'
```

After line 90 (`checkAndAwardAchievements(user.id, 'workout_completed').catch(() => {})`), replace that line with:

```typescript
// Workout completion notification — fire-and-forget
createNotification(user.id, {
  type: 'workout',
  title: 'Antrenman Tamamlandı! 💪',
  body: 'Harika iş! Antrenmanını başarıyla bitirdin.',
  link: '/dashboard/workouts',
}).catch(console.error)

// Achievement checker — fire-and-forget, sends notification if badges awarded
// checkAndAwardAchievements returns { newAchievements: AchievementDef[], ... }
checkAndAwardAchievements(user.id, 'workout_completed')
  .then(({ newAchievements }) => {
    if (newAchievements.length > 0) {
      createNotification(user.id, {
        type: 'achievement',
        title: 'Yeni Başarım Kazandın! 🏆',
        body: `${newAchievements.length} yeni rozet kazandın!`,
        link: '/dashboard/progress',
      }).catch(console.error)
    }
  })
  .catch(() => {})
```

- [ ] **Step 2: Verify the import was added**

Confirm `import { createNotification } from '@/lib/notifications/create-notification'` is at the top of the file alongside existing imports.

- [ ] **Step 3: Add roadmap trigger to `apps/web/app/api/roadmap/week/[weekId]/route.ts`**

Open the file. After the roadmap task/week update DB call, add:

```typescript
import { createNotification } from '@/lib/notifications/create-notification'

// After roadmap update:
createNotification(user.id, {
  type: 'roadmap',
  title: 'Yol Haritası Güncellendi! 🗺️',
  body: 'Haftalık görevin tamamlandı, yeni görev hazır.',
  link: '/dashboard/workouts',
}).catch(console.error)
```

- [ ] **Step 4: Commit**

```bash
git add apps/web/app/api/sessions/[id]/route.ts apps/web/app/api/roadmap/week/[weekId]/route.ts
git commit -m "feat: add createNotification triggers to workout completion, achievement, and roadmap"
```

---

## Chunk 5: TypeScript Check + Final Verification

### Task 13: TypeScript check and fix

**Files:** Any files with type errors

- [ ] **Step 1: Run TypeScript check**

```bash
cd apps/web && pnpm exec tsc --noEmit 2>&1 | grep -v "node_modules" | grep "error TS" | head -30
```

- [ ] **Step 2: Fix any errors in new files**

Common issues to watch for:

- `withAuth` handler context param type — check `apps/web/lib/api/with-auth.ts` for the exact handler signature if params are needed
- `NotificationType` import from `@prisma/client`
- `db.notification` not existing until `prisma generate` was run

- [ ] **Step 3: Run all tests**

```bash
cd apps/web && pnpm test
```

Expected: all existing tests still pass + new tests pass

- [ ] **Step 4: Commit any fixes**

```bash
git add -p
git commit -m "fix: resolve TypeScript errors in notification system"
```

---

### Task 14: Manual smoke test

- [ ] **Step 1: Start dev server**

```bash
pnpm --filter web dev
```

- [ ] **Step 2: Open `http://localhost:3000/dashboard` and verify:**
  - Bell button shows (no badge when no notifications)
  - Click bell → popover opens with skeleton then "Henüz bildirim yok"

- [ ] **Step 3: Seed a test notification via Prisma Studio or direct DB query**

```bash
cd apps/web && pnpm exec prisma studio
```

Create a `Notification` record for your user's DB `id` with any type. Refresh dashboard — badge should appear within 30s (or immediately on tab refocus).

- [ ] **Step 4: Click notification item — verify it navigates to the link and badge decreases**

- [ ] **Step 5: Click "Hepsini okundu işaretle" — verify badge disappears**
