# Nutrition Hub Phase 3B-3 — Başarım Sistemi (Achievement + XP + Animasyon)

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Kullanıcının beslenme, antrenman ve genel sağlık aktivitelerine dayalı sinematik bir başarım sistemi inşa etmek. XP + level sistemi, badge animasyonları ve fire-and-forget achievement kontrolü içerir.

**Architecture:** `Achievement` seed data olarak tanımlanır (kod içinde). `UserAchievement` + `UserXP` Prisma modelleri kullanıcı ilerlemesini saklar. Achievement checker (`lib/achievements/checker.ts`) her önemli API çağrısından sonra background'da çalışır. Web'de Framer Motion (toast/full-screen), mobilde React Native Animated + confetti kullanılır.

**Tech Stack:** Next.js 15, Prisma, Framer Motion, Vitest, React Native Animated, react-native-confetti-cannon (mobil)

---

## Chunk 1: DB + Achievement Definitions

### Task 1: Achievement + UserAchievement + UserXP Prisma modelleri

**Files:**

- Modify: `apps/web/prisma/schema.prisma`

- [ ] **Step 1: User modeline ilişkiler ekle**

`apps/web/prisma/schema.prisma` dosyasında `User` modeline (notificationPrefs satırından sonra) ekle:

```prisma
  userAchievements  UserAchievement[]
  userXP            UserXP?
```

- [ ] **Step 2: Modelleri ekle**

`NotificationPreference` modelinden sonra ekle:

```prisma
model UserAchievement {
  id            String   @id @default(cuid())
  userId        String
  user          User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  achievementId String   // e.g. "streak_7", "calories_goal_30", "first_workout"
  earnedAt      DateTime @default(now())
  xpAwarded     Int

  @@unique([userId, achievementId])
  @@index([userId])
}

model UserXP {
  id        String   @id @default(cuid())
  userId    String   @unique
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  total     Int      @default(0)
  level     Int      @default(1)
  updatedAt DateTime @updatedAt

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
cd c:/Users/TUF/Desktop/Ai-Pt && git add apps/web/prisma/schema.prisma && git commit -m "feat(achievements): add UserAchievement and UserXP Prisma models"
```

---

### Task 2: Achievement definitions + XP helper

**Files:**

- Create: `apps/web/lib/achievements/definitions.ts`
- Create: `apps/web/lib/achievements/__tests__/definitions.test.ts`

- [ ] **Step 1: Failing test yaz**

Create `apps/web/lib/achievements/__tests__/definitions.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { ACHIEVEMENTS, getXpForLevel, getLevelFromXp } from '../definitions'

describe('Achievement definitions', () => {
  it('has at least 15 achievements', () => {
    expect(Object.keys(ACHIEVEMENTS).length).toBeGreaterThanOrEqual(15)
  })

  it('each achievement has required fields', () => {
    for (const [id, a] of Object.entries(ACHIEVEMENTS)) {
      expect(a.id, `${id} missing id`).toBe(id)
      expect(a.title, `${id} missing title`).toBeTruthy()
      expect(a.xp, `${id} missing xp`).toBeGreaterThan(0)
      expect(a.tier, `${id} missing tier`).toMatch(/^(bronze|silver|gold|platinum)$/)
    }
  })

  it('getXpForLevel returns increasing values', () => {
    expect(getXpForLevel(2)).toBeGreaterThan(getXpForLevel(1))
    expect(getXpForLevel(10)).toBeGreaterThan(getXpForLevel(5))
  })

  it('getLevelFromXp returns correct level', () => {
    expect(getLevelFromXp(0)).toBe(1)
    expect(getLevelFromXp(getXpForLevel(1))).toBe(2)
    expect(getLevelFromXp(getXpForLevel(4))).toBe(5)
  })
})
```

- [ ] **Step 2: Test'i çalıştır — FAIL beklenir**

```bash
cd c:/Users/TUF/Desktop/Ai-Pt/apps/web && npx vitest run "lib/achievements/__tests__/definitions.test.ts" 2>&1 | tail -10
```

- [ ] **Step 3: Definitions oluştur**

Create `apps/web/lib/achievements/definitions.ts`:

```typescript
export type AchievementTier = 'bronze' | 'silver' | 'gold' | 'platinum'

export interface AchievementDef {
  id: string
  title: string
  description: string
  xp: number
  tier: AchievementTier
  icon: string // emoji
  fullScreen: boolean // true = büyük açılış animasyonu
}

export const ACHIEVEMENTS: Record<string, AchievementDef> = {
  // ── Beslenme: Streak ──
  streak_3: {
    id: 'streak_3',
    title: '3 Günlük Seri',
    description: '3 gün üst üste öğün logladın',
    xp: 50,
    tier: 'bronze',
    icon: '🔥',
    fullScreen: false,
  },
  streak_7: {
    id: 'streak_7',
    title: 'Haftalık Seri',
    description: '7 gün üst üste öğün logladın',
    xp: 150,
    tier: 'silver',
    icon: '🔥',
    fullScreen: true,
  },
  streak_30: {
    id: 'streak_30',
    title: '30 Günlük Seri',
    description: '30 gün üst üste öğün logladın',
    xp: 500,
    tier: 'gold',
    icon: '🏆',
    fullScreen: true,
  },
  streak_100: {
    id: 'streak_100',
    title: '100 Günlük Efsane',
    description: '100 gün üst üste öğün logladın',
    xp: 2000,
    tier: 'platinum',
    icon: '💎',
    fullScreen: true,
  },

  // ── Beslenme: Kalori hedefi ──
  calorie_goal_1: {
    id: 'calorie_goal_1',
    title: 'İlk Hedef',
    description: 'İlk kez günlük kalori hedefini tuturdun',
    xp: 30,
    tier: 'bronze',
    icon: '🎯',
    fullScreen: false,
  },
  calorie_goal_7: {
    id: 'calorie_goal_7',
    title: 'Haftalık Disiplin',
    description: '7 gün kalori hedefini tuturdun',
    xp: 200,
    tier: 'silver',
    icon: '🎯',
    fullScreen: true,
  },
  calorie_goal_30: {
    id: 'calorie_goal_30',
    title: 'Aylık Şampiyon',
    description: '30 gün kalori hedefini tuturdun',
    xp: 800,
    tier: 'gold',
    icon: '👑',
    fullScreen: true,
  },

  // ── Beslenme: Çeşitlilik ──
  variety_10: {
    id: 'variety_10',
    title: 'Kaşif',
    description: '10 farklı yemek logladın',
    xp: 75,
    tier: 'bronze',
    icon: '🍽️',
    fullScreen: false,
  },
  variety_50: {
    id: 'variety_50',
    title: 'Gurme',
    description: '50 farklı yemek logladın',
    xp: 300,
    tier: 'silver',
    icon: '🍽️',
    fullScreen: false,
  },

  // ── Beslenme: AI Analiz ──
  photo_analysis_1: {
    id: 'photo_analysis_1',
    title: 'İlk Fotoğraf Analizi',
    description: 'AI ile ilk yemek analizini yaptın',
    xp: 40,
    tier: 'bronze',
    icon: '📸',
    fullScreen: false,
  },
  photo_analysis_10: {
    id: 'photo_analysis_10',
    title: 'AI Ustası',
    description: '10 kez yemek fotoğrafı analiz ettin',
    xp: 200,
    tier: 'silver',
    icon: '🤖',
    fullScreen: false,
  },

  // ── Antrenman ──
  first_workout: {
    id: 'first_workout',
    title: 'İlk Adım',
    description: 'İlk antrenman seansını tamamladın',
    xp: 100,
    tier: 'bronze',
    icon: '💪',
    fullScreen: true,
  },
  workout_10: {
    id: 'workout_10',
    title: 'Azimli Sporcu',
    description: '10 antrenman seansı tamamladın',
    xp: 300,
    tier: 'silver',
    icon: '🏋️',
    fullScreen: false,
  },
  workout_50: {
    id: 'workout_50',
    title: 'Demir Kafes',
    description: '50 antrenman seansı tamamladın',
    xp: 1000,
    tier: 'gold',
    icon: '🦁',
    fullScreen: true,
  },

  // ── Genel ──
  first_log: {
    id: 'first_log',
    title: 'Hoş Geldin!',
    description: 'İlk öğününü logladın',
    xp: 20,
    tier: 'bronze',
    icon: '🌟',
    fullScreen: false,
  },
  goal_set: {
    id: 'goal_set',
    title: 'Hedef Belirledim',
    description: 'Beslenme hedeflerini ayarladın',
    xp: 25,
    tier: 'bronze',
    icon: '📋',
    fullScreen: false,
  },
  template_created: {
    id: 'template_created',
    title: 'Öğün Şabloncusu',
    description: 'İlk öğün şablonunu oluşturdun',
    xp: 30,
    tier: 'bronze',
    icon: '📝',
    fullScreen: false,
  },
}

// XP eşikleri: level N için gereken toplam XP
export function getXpForLevel(level: number): number {
  // 1→2: 100, 2→3: 200, ... her level öncekinin 1.3x'i
  if (level <= 1) return 0
  let total = 0
  for (let i = 1; i < level; i++) {
    total += Math.floor(100 * Math.pow(1.3, i - 1))
  }
  return total
}

export function getLevelFromXp(xp: number): number {
  let level = 1
  while (getXpForLevel(level + 1) <= xp) level++
  return level
}
```

- [ ] **Step 4: Test'i çalıştır — PASS beklenir**

```bash
cd c:/Users/TUF/Desktop/Ai-Pt/apps/web && npx vitest run "lib/achievements/__tests__/definitions.test.ts" 2>&1 | tail -10
```

- [ ] **Step 5: Commit**

```bash
cd c:/Users/TUF/Desktop/Ai-Pt && git add apps/web/lib/achievements/ && git commit -m "feat(achievements): add achievement definitions and XP helpers"
```

---

### Task 3: Achievement Checker (TDD)

**Files:**

- Create: `apps/web/lib/achievements/checker.ts`
- Create: `apps/web/lib/achievements/__tests__/checker.test.ts`

- [ ] **Step 1: Failing test yaz**

Create `apps/web/lib/achievements/__tests__/checker.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockDb = {
  userAchievement: {
    findMany: vi.fn(),
    createMany: vi.fn().mockResolvedValue({ count: 1 }),
  },
  userXP: {
    upsert: vi.fn().mockResolvedValue({ total: 150, level: 2 }),
  },
  mealLog: {
    count: vi.fn().mockResolvedValue(5),
    findMany: vi.fn().mockResolvedValue([]),
    groupBy: vi.fn().mockResolvedValue([]),
  },
  nutritionStreak: {
    findUnique: vi.fn().mockResolvedValue({ currentStreak: 7 }),
  },
  workoutSession: {
    count: vi.fn().mockResolvedValue(1),
  },
  nutritionGoal: {
    findUnique: vi.fn().mockResolvedValue(null),
  },
}

vi.mock('@/lib/db/client', () => ({ db: mockDb }))

describe('checkAndAwardAchievements', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockDb.userAchievement.findMany.mockResolvedValue([]) // no prior achievements
  })

  it('awards first_log on first meal log', async () => {
    mockDb.mealLog.count.mockResolvedValue(1)
    const { checkAndAwardAchievements } = await import('../checker')
    const result = await checkAndAwardAchievements('user_1', 'meal_logged')
    expect(result.newAchievements.some((a) => a.id === 'first_log')).toBe(true)
  })

  it('awards streak_7 when streak is 7', async () => {
    mockDb.nutritionStreak.findUnique.mockResolvedValue({ currentStreak: 7 })
    const { checkAndAwardAchievements } = await import('../checker')
    const result = await checkAndAwardAchievements('user_1', 'meal_logged')
    expect(result.newAchievements.some((a) => a.id === 'streak_7')).toBe(true)
  })

  it('awards first_workout on first workout session', async () => {
    mockDb.workoutSession.count.mockResolvedValue(1)
    const { checkAndAwardAchievements } = await import('../checker')
    const result = await checkAndAwardAchievements('user_1', 'workout_completed')
    expect(result.newAchievements.some((a) => a.id === 'first_workout')).toBe(true)
  })

  it('does not re-award already earned achievements', async () => {
    mockDb.userAchievement.findMany.mockResolvedValue([{ achievementId: 'first_log' }])
    mockDb.mealLog.count.mockResolvedValue(1)
    const { checkAndAwardAchievements } = await import('../checker')
    const result = await checkAndAwardAchievements('user_1', 'meal_logged')
    expect(result.newAchievements.some((a) => a.id === 'first_log')).toBe(false)
  })

  it('returns xpGained and newLevel', async () => {
    mockDb.mealLog.count.mockResolvedValue(1)
    const { checkAndAwardAchievements } = await import('../checker')
    const result = await checkAndAwardAchievements('user_1', 'meal_logged')
    expect(typeof result.xpGained).toBe('number')
    expect(typeof result.newLevel).toBe('number')
  })
})
```

- [ ] **Step 2: Test'i çalıştır — FAIL beklenir**

```bash
cd c:/Users/TUF/Desktop/Ai-Pt/apps/web && npx vitest run "lib/achievements/__tests__/checker.test.ts" 2>&1 | tail -10
```

- [ ] **Step 3: Checker oluştur**

Create `apps/web/lib/achievements/checker.ts`:

```typescript
import { db } from '@/lib/db/client'
import { ACHIEVEMENTS, getLevelFromXp, type AchievementDef } from './definitions'

export type TriggerEvent =
  | 'meal_logged'
  | 'workout_completed'
  | 'goal_set'
  | 'template_created'
  | 'photo_analyzed'

interface CheckResult {
  newAchievements: AchievementDef[]
  xpGained: number
  newLevel: number
  leveledUp: boolean
}

export async function checkAndAwardAchievements(
  userId: string,
  event: TriggerEvent
): Promise<CheckResult> {
  // 1. Mevcut achievement'ları al
  const existing = await db.userAchievement.findMany({
    where: { userId },
    select: { achievementId: true },
  })
  const earnedIds = new Set(existing.map((e) => e.achievementId))

  // 2. Event'e göre ilgili verileri çek
  const [mealCount, streak, workoutCount] = await Promise.all([
    db.mealLog.count({ where: { userId } }),
    db.nutritionStreak.findUnique({ where: { userId }, select: { currentStreak: true } }),
    db.workoutSession.count({ where: { userId } }),
  ])

  const currentStreak = streak?.currentStreak ?? 0

  // 3. Kazanılabilecek achievement'ları belirle
  const toAward: AchievementDef[] = []

  const check = (id: string) => {
    if (!earnedIds.has(id) && ACHIEVEMENTS[id]) toAward.push(ACHIEVEMENTS[id])
  }

  if (event === 'meal_logged') {
    if (mealCount >= 1) check('first_log')
    if (currentStreak >= 3) check('streak_3')
    if (currentStreak >= 7) check('streak_7')
    if (currentStreak >= 30) check('streak_30')
    if (currentStreak >= 100) check('streak_100')
  }

  if (event === 'workout_completed') {
    if (workoutCount >= 1) check('first_workout')
    if (workoutCount >= 10) check('workout_10')
    if (workoutCount >= 50) check('workout_50')
  }

  if (event === 'goal_set') check('goal_set')
  if (event === 'template_created') check('template_created')
  if (event === 'photo_analyzed') {
    // fotoğraf analiz sayısını ayrıca çekmek gerekirse buraya ekle
    check('photo_analysis_1')
  }

  if (toAward.length === 0) {
    const xpRecord = await db.userXP.upsert({
      where: { userId },
      create: { userId, total: 0, level: 1 },
      update: {},
    })
    return { newAchievements: [], xpGained: 0, newLevel: xpRecord.level, leveledUp: false }
  }

  // 4. Achievement'ları kaydet
  const xpGained = toAward.reduce((s, a) => s + a.xp, 0)
  await db.userAchievement.createMany({
    data: toAward.map((a) => ({ userId, achievementId: a.id, xpAwarded: a.xp })),
    skipDuplicates: true,
  })

  // 5. XP güncelle
  const xpRecord = await db.userXP.upsert({
    where: { userId },
    create: { userId, total: xpGained, level: getLevelFromXp(xpGained) },
    update: { total: { increment: xpGained } },
  })

  const newLevel = getLevelFromXp(xpRecord.total)
  const leveledUp = newLevel > xpRecord.level

  if (leveledUp) {
    await db.userXP.update({ where: { userId }, data: { level: newLevel } })
  }

  return { newAchievements: toAward, xpGained, newLevel, leveledUp }
}
```

- [ ] **Step 4: Test'i çalıştır — PASS beklenir**

```bash
cd c:/Users/TUF/Desktop/Ai-Pt/apps/web && npx vitest run "lib/achievements/__tests__/checker.test.ts" 2>&1 | tail -10
```

- [ ] **Step 5: Commit**

```bash
cd c:/Users/TUF/Desktop/Ai-Pt && git add apps/web/lib/achievements/checker.ts "apps/web/lib/achievements/__tests__/checker.test.ts" && git commit -m "feat(achievements): add achievement checker with TDD"
```

---

## Chunk 2: API Entegrasyonu (Fire-and-Forget)

### Task 4: Achievement checker'ı meal log API'ye entegre et

**Files:**

- Modify: `apps/web/app/api/nutrition/meals/route.ts` (veya mevcut meal log route'u)

- [ ] **Step 1: Mevcut meal log route'unu oku**

```bash
find c:/Users/TUF/Desktop/Ai-Pt/apps/web/app/api/nutrition -name "*.ts" | head -10
```

Meal log POST yapan route'u bul ve oku.

- [ ] **Step 2: Fire-and-forget çağrı ekle**

Meal log başarıyla kaydedildikten sonra (response gönderilmeden önce), şu pattern ile ekle:

```typescript
import { checkAndAwardAchievements } from '@/lib/achievements/checker'

// meal log create işleminin hemen ardından:
checkAndAwardAchievements(user.id, 'meal_logged').catch(() => {})
```

Bu fire-and-forget — response'u bekletmez, hatalar sessizce geçer.

- [ ] **Step 3: Workout session tamamlanma route'una da ekle**

```bash
find c:/Users/TUF/Desktop/Ai-Pt/apps/web/app/api/sessions -name "*.ts" | head -5
```

Session tamamlama route'unu bul, benzer şekilde ekle:

```typescript
checkAndAwardAchievements(user.id, 'workout_completed').catch(() => {})
```

- [ ] **Step 4: Commit**

```bash
cd c:/Users/TUF/Desktop/Ai-Pt && git add apps/web/app/api/ && git commit -m "feat(achievements): wire achievement checker into meal and workout APIs"
```

---

### Task 5: Achievement API routes (TDD)

**Files:**

- Create: `apps/web/app/api/achievements/route.ts`
- Create: `apps/web/app/api/achievements/__tests__/route.test.ts`

- [ ] **Step 1: Failing test yaz**

Create `apps/web/app/api/achievements/__tests__/route.test.ts`:

```typescript
import { describe, it, expect, vi } from 'vitest'

vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn().mockResolvedValue({ userId: 'clerk_123' }),
}))

vi.mock('@/lib/db/client', () => ({
  db: {
    user: { findUnique: vi.fn().mockResolvedValue({ id: 'user_1' }) },
    userAchievement: {
      findMany: vi.fn().mockResolvedValue([
        { achievementId: 'first_log', earnedAt: new Date('2026-04-14'), xpAwarded: 20 },
        { achievementId: 'streak_3', earnedAt: new Date('2026-04-14'), xpAwarded: 50 },
      ]),
    },
    userXP: {
      findUnique: vi.fn().mockResolvedValue({ total: 70, level: 1 }),
    },
  },
}))

describe('GET /api/achievements', () => {
  it('returns user achievements and XP', async () => {
    const { GET } = await import('../route')
    const response = await GET()
    const data = await response.json()
    expect(response.status).toBe(200)
    expect(Array.isArray(data.achievements)).toBe(true)
    expect(data.achievements[0].achievementId).toBe('first_log')
    expect(data.xp.total).toBe(70)
    expect(data.xp.level).toBe(1)
  })
})
```

- [ ] **Step 2: Test'i çalıştır — FAIL beklenir**

```bash
cd c:/Users/TUF/Desktop/Ai-Pt/apps/web && npx vitest run "app/api/achievements/__tests__/route.test.ts" 2>&1 | tail -10
```

- [ ] **Step 3: Route oluştur**

Create `apps/web/app/api/achievements/route.ts`:

```typescript
import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db/client'
import { ACHIEVEMENTS } from '@/lib/achievements/definitions'

export async function GET() {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const user = await db.user.findUnique({ where: { clerkId } })
    if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const [userAchievements, xp] = await Promise.all([
      db.userAchievement.findMany({
        where: { userId: user.id },
        orderBy: { earnedAt: 'desc' },
      }),
      db.userXP.findUnique({ where: { userId: user.id } }),
    ])

    const achievements = userAchievements.map((ua) => ({
      ...ua,
      definition: ACHIEVEMENTS[ua.achievementId] ?? null,
    }))

    return NextResponse.json({
      achievements,
      xp: xp ?? { total: 0, level: 1 },
      allDefinitions: Object.values(ACHIEVEMENTS),
    })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

- [ ] **Step 4: Test'i çalıştır — PASS beklenir**

```bash
cd c:/Users/TUF/Desktop/Ai-Pt/apps/web && npx vitest run "app/api/achievements/__tests__/route.test.ts" 2>&1 | tail -10
```

- [ ] **Step 5: Commit**

```bash
cd c:/Users/TUF/Desktop/Ai-Pt && git add apps/web/app/api/achievements/ && git commit -m "feat(achievements): add achievements GET API route"
```

---

## Chunk 3: Web UI — Toast + Full-Screen Animasyon

### Task 6: useAchievementNotifier hook + AchievementToast bileşeni

**Files:**

- Create: `apps/web/hooks/useAchievementNotifier.ts`
- Create: `apps/web/components/achievements/AchievementToast.tsx`
- Create: `apps/web/components/achievements/AchievementFullScreen.tsx`

- [ ] **Step 1: AchievementToast oluştur**

Create `apps/web/components/achievements/AchievementToast.tsx`:

```typescript
'use client'

import { motion, AnimatePresence } from 'framer-motion'
import type { AchievementDef } from '@/lib/achievements/definitions'

interface Props {
  achievement: AchievementDef | null
  onDismiss: () => void
}

const TIER_COLORS: Record<string, string> = {
  bronze: 'from-amber-600/20 to-amber-800/10 border-amber-600/30',
  silver: 'from-slate-400/20 to-slate-600/10 border-slate-400/30',
  gold: 'from-yellow-400/20 to-yellow-600/10 border-yellow-400/30',
  platinum: 'from-violet-400/20 to-violet-600/10 border-violet-400/30',
}

export function AchievementToast({ achievement, onDismiss }: Props) {
  return (
    <AnimatePresence>
      {achievement && (
        <motion.div
          initial={{ x: 400, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 400, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 120, damping: 20 }}
          onAnimationComplete={() => {
            setTimeout(onDismiss, 3000)
          }}
          className={`fixed right-4 top-4 z-[100] flex items-center gap-3 rounded-2xl border bg-gradient-to-br p-4 shadow-2xl ${TIER_COLORS[achievement.tier]}`}
        >
          <span className="text-3xl">{achievement.icon}</span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#94A3B8]">
              Yeni Başarım!
            </p>
            <p className="text-sm font-bold text-white">{achievement.title}</p>
            <p className="text-xs text-[#64748B]">+{achievement.xp} XP</p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
```

- [ ] **Step 2: AchievementFullScreen oluştur**

Create `apps/web/components/achievements/AchievementFullScreen.tsx`:

```typescript
'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useState } from 'react'
import type { AchievementDef } from '@/lib/achievements/definitions'

interface Props {
  achievement: AchievementDef | null
  newLevel?: number
  leveledUp?: boolean
  onDismiss: () => void
}

const TIER_GLOW: Record<string, string> = {
  bronze: '#B45309',
  silver: '#94A3B8',
  gold: '#EAB308',
  platinum: '#7C3AED',
}

export function AchievementFullScreen({ achievement, newLevel, leveledUp, onDismiss }: Props) {
  const [particles, setParticles] = useState<{ x: number; y: number; r: number }[]>([])

  useEffect(() => {
    if (!achievement) return
    setParticles(
      Array.from({ length: 30 }, () => ({
        x: Math.random() * 100,
        y: Math.random() * 100,
        r: Math.random() * 6 + 2,
      }))
    )
    const t = setTimeout(onDismiss, 4500)
    return () => clearTimeout(t)
  }, [achievement])

  return (
    <AnimatePresence>
      {achievement && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-black/90 backdrop-blur-md"
          onClick={onDismiss}
        >
          {/* Confetti particles */}
          {particles.map((p, i) => (
            <motion.div
              key={i}
              className="absolute h-2 w-2 rounded-full"
              style={{
                left: `${p.x}%`,
                top: `${p.y}%`,
                width: p.r,
                height: p.r,
                backgroundColor: TIER_GLOW[achievement.tier],
              }}
              initial={{ opacity: 0, scale: 0, y: 0 }}
              animate={{ opacity: [0, 1, 0], scale: [0, 1, 0.5], y: [-20, -80] }}
              transition={{ delay: i * 0.05, duration: 1.5 }}
            />
          ))}

          {/* Main badge */}
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 150, damping: 15, delay: 0.1 }}
            className="flex flex-col items-center gap-4 text-center"
          >
            <motion.div
              animate={{ boxShadow: [`0 0 0px ${TIER_GLOW[achievement.tier]}`, `0 0 60px ${TIER_GLOW[achievement.tier]}`, `0 0 0px ${TIER_GLOW[achievement.tier]}`] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              className="flex h-32 w-32 items-center justify-center rounded-full border-2 bg-black/50"
              style={{ borderColor: TIER_GLOW[achievement.tier] }}
            >
              <span className="text-6xl">{achievement.icon}</span>
            </motion.div>

            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#94A3B8]">
                Başarım Kazanıldı
              </p>
              <h2 className="mt-1 text-3xl font-bold text-white">{achievement.title}</h2>
              <p className="mt-1 text-sm text-[#94A3B8]">{achievement.description}</p>
              <p className="mt-3 text-lg font-bold" style={{ color: TIER_GLOW[achievement.tier] }}>
                +{achievement.xp} XP
              </p>
            </motion.div>

            {leveledUp && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.8, type: 'spring' }}
                className="mt-2 rounded-full border border-yellow-400/30 bg-yellow-400/10 px-6 py-2"
              >
                <p className="text-sm font-bold text-yellow-400">⬆️ Seviye {newLevel}!</p>
              </motion.div>
            )}

            <p className="mt-6 text-xs text-[#475569]">Devam etmek için dokun</p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
```

- [ ] **Step 3: useAchievementNotifier hook oluştur**

Create `apps/web/hooks/useAchievementNotifier.ts`:

```typescript
'use client'

import { useState, useCallback } from 'react'
import type { AchievementDef } from '@/lib/achievements/definitions'

interface QueueItem {
  achievement: AchievementDef
  newLevel?: number
  leveledUp?: boolean
}

export function useAchievementNotifier() {
  const [queue, setQueue] = useState<QueueItem[]>([])
  const [current, setCurrent] = useState<QueueItem | null>(null)

  const notify = useCallback(
    (items: QueueItem[]) => {
      setQueue((prev) => [...prev, ...items])
      if (!current && items.length > 0) {
        setCurrent(items[0])
        setQueue(items.slice(1))
      }
    },
    [current]
  )

  const dismiss = useCallback(() => {
    setCurrent(null)
    setQueue((prev) => {
      if (prev.length === 0) return prev
      const [next, ...rest] = prev
      setTimeout(() => setCurrent(next), 300)
      return rest
    })
  }, [])

  return { current, notify, dismiss }
}
```

- [ ] **Step 4: Commit**

```bash
cd c:/Users/TUF/Desktop/Ai-Pt && git add apps/web/components/achievements/ apps/web/hooks/useAchievementNotifier.ts && git commit -m "feat(achievements): add AchievementToast, AchievementFullScreen, and notifier hook"
```

---

### Task 7: AchievementsPage — Tüm başarımları görüntüle

**Files:**

- Create: `apps/web/app/(dashboard)/dashboard/achievements/page.tsx`
- Create: `apps/web/components/achievements/AchievementCard.tsx`
- Create: `apps/web/components/achievements/XPProgressBar.tsx`

- [ ] **Step 1: XPProgressBar oluştur**

Create `apps/web/components/achievements/XPProgressBar.tsx`:

```typescript
'use client'

import { motion } from 'framer-motion'
import { getXpForLevel } from '@/lib/achievements/definitions'

interface Props {
  total: number
  level: number
}

export function XPProgressBar({ total, level }: Props) {
  const currentLevelXp = getXpForLevel(level)
  const nextLevelXp = getXpForLevel(level + 1)
  const progress = nextLevelXp > currentLevelXp
    ? ((total - currentLevelXp) / (nextLevelXp - currentLevelXp)) * 100
    : 100

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-4">
      <div className="mb-2 flex items-center justify-between">
        <div>
          <p className="text-xs text-[#64748B]">Seviye</p>
          <p className="text-2xl font-bold text-white">{level}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-[#64748B]">Toplam XP</p>
          <p className="text-lg font-semibold text-[#6366F1]">{total.toLocaleString()}</p>
        </div>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-white/[0.06]">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-[#6366F1] to-[#818CF8]"
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(progress, 100)}%` }}
          transition={{ duration: 1, ease: 'easeOut' }}
        />
      </div>
      <p className="mt-1 text-right text-xs text-[#64748B]">
        {total - currentLevelXp} / {nextLevelXp - currentLevelXp} XP → Seviye {level + 1}
      </p>
    </div>
  )
}
```

- [ ] **Step 2: AchievementCard oluştur**

Create `apps/web/components/achievements/AchievementCard.tsx`:

```typescript
'use client'

import { motion } from 'framer-motion'
import type { AchievementDef } from '@/lib/achievements/definitions'

interface Props {
  def: AchievementDef
  earned: boolean
  earnedAt?: string
}

const TIER_STYLES: Record<string, string> = {
  bronze: 'border-amber-600/30 bg-amber-600/5',
  silver: 'border-slate-400/30 bg-slate-400/5',
  gold: 'border-yellow-400/30 bg-yellow-400/5',
  platinum: 'border-violet-400/30 bg-violet-400/5',
}

const TIER_TEXT: Record<string, string> = {
  bronze: 'text-amber-500',
  silver: 'text-slate-400',
  gold: 'text-yellow-400',
  platinum: 'text-violet-400',
}

export function AchievementCard({ def, earned, earnedAt }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative flex items-center gap-3 rounded-xl border p-3 transition-colors ${
        earned ? TIER_STYLES[def.tier] : 'border-white/[0.04] bg-white/[0.02] opacity-40'
      }`}
    >
      <span className={`text-2xl ${!earned ? 'grayscale' : ''}`}>{def.icon}</span>
      <div className="flex-1 min-w-0">
        <p className="truncate text-sm font-semibold text-white">{def.title}</p>
        <p className="truncate text-xs text-[#64748B]">{def.description}</p>
        {earned && earnedAt && (
          <p className="text-xs text-[#475569]">
            {new Date(earnedAt).toLocaleDateString('tr-TR')}
          </p>
        )}
      </div>
      <div className="text-right">
        <p className={`text-xs font-semibold ${earned ? TIER_TEXT[def.tier] : 'text-[#475569]'}`}>
          +{def.xp} XP
        </p>
        <p className={`text-xs capitalize ${earned ? TIER_TEXT[def.tier] : 'text-[#475569]'}`}>
          {def.tier}
        </p>
      </div>
      {!earned && (
        <div className="absolute inset-0 flex items-center justify-center rounded-xl">
          <span className="text-lg">🔒</span>
        </div>
      )}
    </motion.div>
  )
}
```

- [ ] **Step 3: Achievements page oluştur**

Create `apps/web/app/(dashboard)/dashboard/achievements/page.tsx`:

```typescript
import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db/client'
import { ACHIEVEMENTS } from '@/lib/achievements/definitions'
import { XPProgressBar } from '@/components/achievements/XPProgressBar'
import { AchievementCard } from '@/components/achievements/AchievementCard'

export default async function AchievementsPage() {
  const { userId: clerkId } = await auth()
  if (!clerkId) redirect('/sign-in')

  const user = await db.user.findUnique({ where: { clerkId } })
  if (!user) redirect('/sign-in')

  const [userAchievements, xp] = await Promise.all([
    db.userAchievement.findMany({ where: { userId: user.id }, orderBy: { earnedAt: 'desc' } }),
    db.userXP.findUnique({ where: { userId: user.id } }),
  ])

  const earnedMap = new Map(userAchievements.map((a) => [a.achievementId, a]))
  const allDefs = Object.values(ACHIEVEMENTS)

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <h1 className="mb-6 text-xl font-bold text-white">Başarımlarım</h1>

      <div className="mb-6">
        <XPProgressBar total={xp?.total ?? 0} level={xp?.level ?? 1} />
      </div>

      <div className="mb-2 flex items-center justify-between">
        <p className="text-sm text-[#64748B]">
          {userAchievements.length} / {allDefs.length} kazanıldı
        </p>
      </div>

      <div className="space-y-2">
        {/* Kazanılanlar önce */}
        {allDefs
          .sort((a, b) => {
            const aEarned = earnedMap.has(a.id) ? 1 : 0
            const bEarned = earnedMap.has(b.id) ? 1 : 0
            return bEarned - aEarned
          })
          .map((def) => {
            const ua = earnedMap.get(def.id)
            return (
              <AchievementCard
                key={def.id}
                def={def}
                earned={!!ua}
                earnedAt={ua?.earnedAt?.toString()}
              />
            )
          })}
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Commit**

```bash
cd c:/Users/TUF/Desktop/Ai-Pt && git add "apps/web/app/(dashboard)/dashboard/achievements/" apps/web/components/achievements/ && git commit -m "feat(achievements): add achievements page with XP bar and cards"
```

---

### Task 8: Dashboard'a Achievements linki ekle

**Files:**

- Modify: `apps/web/components/dashboard/shared/header.tsx` (veya sidebar)

- [ ] **Step 1: Sidebar/header dosyasını oku**

```bash
find c:/Users/TUF/Desktop/Ai-Pt/apps/web/components/dashboard -name "*.tsx" | head -10
```

Nav bileşenini bul ve oku.

- [ ] **Step 2: Achievements linki ekle**

Mevcut nav linklerine `/dashboard/achievements` linkini ekle:

```typescript
{ href: '/dashboard/achievements', label: 'Başarımlar', icon: Trophy }
```

`Trophy` ikonu `lucide-react`'tan import edilir.

- [ ] **Step 3: Commit**

```bash
cd c:/Users/TUF/Desktop/Ai-Pt && git add apps/web/components/dashboard/ && git commit -m "feat(achievements): add achievements link to navigation"
```

---

### Task 9: Full test suite

- [ ] **Step 1: Tüm achievement testleri çalıştır**

```bash
cd c:/Users/TUF/Desktop/Ai-Pt/apps/web && npx vitest run lib/achievements/ app/api/achievements/ "app/(dashboard)/dashboard/nutrition/components/modals/" 2>&1 | tail -20
```

Expected: Tüm testler PASS

- [ ] **Step 2: Final commit**

```bash
cd c:/Users/TUF/Desktop/Ai-Pt && git add -A && git commit -m "feat(phase3b-3): complete achievement system — definitions, checker, UI, animations"
```
