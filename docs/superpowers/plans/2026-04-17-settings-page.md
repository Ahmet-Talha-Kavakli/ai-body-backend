# Settings Page Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `/dashboard/profile` sayfasını kaldırıp `/dashboard/settings` altında kapsamlı, bölümlere ayrılmış bir Settings sayfası oluşturmak.

**Architecture:** `settings/page.tsx` orchestrator olarak 6 bağımsız section component'ı render eder. Her section kendi API çağrısını yönetir. DB migration ile `User` modeline `timezone`, `country`, `locale` eklenir; `UserPrivacySettings` tablosu oluşturulur.

**Tech Stack:** Next.js 14 App Router, Clerk, Prisma, Framer Motion, THIINGS icons, next-themes, Stripe

**Spec:** `docs/superpowers/specs/2026-04-17-settings-page-design.md`

---

## File Map

### Created

- `apps/web/components/settings/ProfileSection.tsx`
- `apps/web/components/settings/SubscriptionSection.tsx`
- `apps/web/components/settings/AppearanceSection.tsx`
- `apps/web/components/settings/PrivacySection.tsx`
- `apps/web/components/settings/DataPrivacySection.tsx`
- `apps/web/components/settings/DangerZone.tsx`
- `apps/web/components/settings/SettingsSectionCard.tsx` — shared card wrapper
- `apps/web/components/settings/SettingsRow.tsx` — shared iOS-style row
- `apps/web/components/settings/ConfirmDialog.tsx` — reusable confirmation dialog
- `apps/web/app/api/user/export/route.ts`
- `apps/web/app/api/user/data/route.ts`
- `apps/web/app/api/user/privacy-settings/route.ts`
- `apps/web/app/api/user/account/route.ts` — full account deletion (DB cascade + Clerk)
- _(auto-generated)_ `apps/web/prisma/migrations/*_add_settings_fields/` — created by `prisma migrate dev`

### Modified

- `apps/web/prisma/schema.prisma` — add `timezone`, `country`, `locale` to User; add `UserPrivacySettings` model
- `apps/web/app/(dashboard)/dashboard/settings/page.tsx` — sıfırdan yaz
- `apps/web/app/(dashboard)/dashboard/profile/page.tsx` — redirect only
- `apps/web/app/api/user/profile/route.ts` — `timezone`, `country`, `locale`, `profilePublic`, `bio` alanlarını PATCH'e ekle

---

## Chunk 1: DB Migration & API Foundation

### Task 1: Prisma Schema Migration

**Files:**

- Modify: `apps/web/prisma/schema.prisma`

- [ ] **Step 1: Add fields to User model**

`apps/web/prisma/schema.prisma` içinde `User` modeline şu alanları ekle (bio ve profilePublic'in hemen altına):

```prisma
timezone  String?
country   String?
locale    String?  // "tr" | "en"
```

Ve User model'e relation ekle:

```prisma
privacySettings  UserPrivacySettings?
```

- [ ] **Step 2: Add UserPrivacySettings model**

Schema'nın sonuna (diğer modellerin yanına) ekle:

```prisma
model UserPrivacySettings {
  id               String   @id @default(cuid())
  userId           String   @unique
  user             User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  collectWorkout   Boolean  @default(true)
  collectNutrition Boolean  @default(true)
  analytics        Boolean  @default(true)
  marketingEmails  Boolean  @default(false)
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  @@index([userId])
}
```

- [ ] **Step 3: Run migration**

```bash
cd apps/web
npx prisma migrate dev --name add_settings_fields
```

Expected: Migration created and applied successfully. Prisma auto-generates the migration SQL file — do not create it manually.

- [ ] **Step 4: Verify Prisma client regenerated**

```bash
npx prisma generate
```

Expected: `Generated Prisma Client` message.

- [ ] **Step 5: Commit**

```bash
git add apps/web/prisma/schema.prisma apps/web/prisma/migrations/
git commit -m "feat: add timezone/country/locale to User, add UserPrivacySettings model"
```

---

### Task 2: Update `/api/user/profile` PATCH

**Files:**

- Modify: `apps/web/app/api/user/profile/route.ts`

- [ ] **Step 1: Update PATCH handler**

`apps/web/app/api/user/profile/route.ts` dosyasındaki PATCH fonksiyonunu şu şekilde güncelle:

```typescript
export async function PATCH(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { name, bio, country, timezone, locale, profilePublic, healthProfile } = body

    const user = await db.user.findUnique({ where: { clerkId } })
    if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const userUpdateData: Record<string, unknown> = {}
    if (name !== undefined) userUpdateData.name = name
    if (bio !== undefined) userUpdateData.bio = bio
    if (country !== undefined) userUpdateData.country = country
    if (timezone !== undefined) userUpdateData.timezone = timezone
    if (locale !== undefined) userUpdateData.locale = locale
    if (profilePublic !== undefined) userUpdateData.profilePublic = profilePublic

    const updated = await db.user.update({
      where: { clerkId },
      data: userUpdateData,
    })

    if (healthProfile) {
      await db.healthProfile.upsert({
        where: { userId: user.id },
        create: {
          userId: user.id,
          age: healthProfile.age ?? 25,
          gender: healthProfile.gender ?? 'prefer_not_to_say',
          heightCm: healthProfile.heightCm ?? 175,
          weightKg: healthProfile.weightKg ?? 70,
          fitnessLevel: healthProfile.fitnessLevel ?? 'beginner',
          goals: healthProfile.goals ?? [],
          availableDaysPerWeek: healthProfile.availableDaysPerWeek ?? 4,
          sessionDurationMinutes: healthProfile.sessionDurationMinutes ?? 45,
          availableEquipment: healthProfile.availableEquipment ?? [],
        },
        update: {
          ...(healthProfile.age !== undefined && { age: healthProfile.age }),
          ...(healthProfile.gender !== undefined && { gender: healthProfile.gender }),
          ...(healthProfile.heightCm !== undefined && { heightCm: healthProfile.heightCm }),
          ...(healthProfile.weightKg !== undefined && { weightKg: healthProfile.weightKg }),
          ...(healthProfile.fitnessLevel !== undefined && {
            fitnessLevel: healthProfile.fitnessLevel,
          }),
          ...(healthProfile.goals !== undefined && { goals: healthProfile.goals }),
        },
      })
    }

    return NextResponse.json({ success: true, user: updated })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/app/api/user/profile/route.ts
git commit -m "feat: extend profile PATCH with bio/country/timezone/locale/profilePublic"
```

---

### Task 3: Privacy Settings API

**Files:**

- Create: `apps/web/app/api/user/privacy-settings/route.ts`

- [ ] **Step 1: Create route**

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

    const settings = await db.userPrivacySettings.findUnique({
      where: { userId: user.id },
    })

    // Return defaults if not yet created
    return NextResponse.json({
      settings: settings ?? {
        collectWorkout: true,
        collectNutrition: true,
        analytics: true,
        marketingEmails: false,
      },
    })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const user = await db.user.findUnique({ where: { clerkId } })
    if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const body = await req.json()
    const { collectWorkout, collectNutrition, analytics, marketingEmails } = body

    const data: Record<string, boolean> = {}
    if (collectWorkout !== undefined) data.collectWorkout = collectWorkout
    if (collectNutrition !== undefined) data.collectNutrition = collectNutrition
    if (analytics !== undefined) data.analytics = analytics
    if (marketingEmails !== undefined) data.marketingEmails = marketingEmails

    const updated = await db.userPrivacySettings.upsert({
      where: { userId: user.id },
      create: { userId: user.id, ...data },
      update: data,
    })

    return NextResponse.json({ success: true, settings: updated })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/app/api/user/privacy-settings/
git commit -m "feat: add GET/PATCH /api/user/privacy-settings"
```

---

### Task 4: Data Export API

**Files:**

- Create: `apps/web/app/api/user/export/route.ts`

- [ ] **Step 1: Create route**

```typescript
import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db/client'

export async function GET() {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const user = await db.user.findUnique({
      where: { clerkId },
      include: {
        healthProfile: true,
        sessions: { take: 100, orderBy: { createdAt: 'desc' } },
        mealLogs: { take: 100, orderBy: { createdAt: 'desc' } },
        userAchievements: true,
      },
    })

    if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const exportData = {
      exportedAt: new Date().toISOString(),
      user: {
        name: user.name,
        email: user.email,
        bio: user.bio,
        country: user.country,
        timezone: user.timezone,
        createdAt: user.createdAt,
      },
      healthProfile: user.healthProfile,
      sessions: user.sessions,
      nutrition: user.mealLogs,
      achievements: user.userAchievements,
    }

    return new NextResponse(JSON.stringify(exportData, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="fitai-data-${Date.now()}.json"`,
      },
    })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/app/api/user/export/
git commit -m "feat: add GET /api/user/export for data download"
```

---

### Task 5: Delete Data & Account APIs

**Files:**

- Create: `apps/web/app/api/user/data/route.ts`
- Create: `apps/web/app/api/user/account/route.ts`

- [ ] **Step 1: Create route**

```typescript
import { NextResponse } from 'next/server'
import { auth, clerkClient } from '@clerk/nextjs/server'
import { db } from '@/lib/db/client'

export async function DELETE() {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const user = await db.user.findUnique({ where: { clerkId } })
    if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    // Delete workout/nutrition/achievement data — keep User record
    await Promise.all([
      db.workoutSession.deleteMany({ where: { userId: user.id } }),
      db.mealLog.deleteMany({ where: { userId: user.id } }),
      db.userAchievement.deleteMany({ where: { userId: user.id } }),
      db.waterLog.deleteMany({ where: { userId: user.id } }),
      db.sleepRecord.deleteMany({ where: { userId: user.id } }),
    ])

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

> Note: `DELETE /api/user/data` sadece aktivite verilerini siler. Hesap silme için ayrı flow var (DangerZone bölümünde Clerk `deleteUser` çağrısı ile).

- [ ] **Step 2: Create account deletion route**

```typescript
// apps/web/app/api/user/account/route.ts
import { NextResponse } from 'next/server'
import { auth, clerkClient } from '@clerk/nextjs/server'
import { db } from '@/lib/db/client'

export async function DELETE() {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const user = await db.user.findUnique({ where: { clerkId } })
    if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    // Delete DB first (cascade removes all related records)
    await db.user.delete({ where: { clerkId } })

    // Then delete Clerk user — if this fails, DB is already deleted (log only)
    try {
      const client = await clerkClient()
      await client.users.deleteUser(clerkId)
    } catch (clerkErr) {
      console.error('Clerk user deletion failed after DB delete:', clerkErr)
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add apps/web/app/api/user/data/ apps/web/app/api/user/account/
git commit -m "feat: add DELETE /api/user/data and /api/user/account endpoints"
```

---

## Chunk 2: Shared UI Components

### Task 6: Shared Settings UI Components

**Files:**

- Create: `apps/web/components/settings/SettingsSectionCard.tsx`
- Create: `apps/web/components/settings/SettingsRow.tsx`
- Create: `apps/web/components/settings/ConfirmDialog.tsx`

- [ ] **Step 1: Create SettingsSectionCard**

```typescript
// apps/web/components/settings/SettingsSectionCard.tsx
'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'

interface Props {
  icon: string
  title: string
  description: string
  children: React.ReactNode
  delay?: number
  variant?: 'default' | 'danger' | 'premium'
}

export function SettingsSectionCard({
  icon, title, description, children, delay = 0, variant = 'default'
}: Props) {
  const cardClass =
    variant === 'danger'
      ? 'rounded-2xl border border-red-500/20 bg-red-500/5 p-5'
      : variant === 'premium'
        ? 'rounded-2xl border border-blue-500/20 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-pink-500/5 p-5'
        : 'bg-card/50 border-border/30 rounded-2xl border p-5'

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className={cardClass}
    >
      <div className="mb-5 flex items-center gap-3">
        <Image src={icon} alt={title} width={36} height={36} unoptimized className="rounded-xl" />
        <div>
          <h3 className={`font-bold ${variant === 'danger' ? 'text-red-400' : ''}`}>{title}</h3>
          <p className="text-muted-foreground text-xs">{description}</p>
        </div>
      </div>
      {children}
    </motion.div>
  )
}
```

- [ ] **Step 2: Create SettingsRow**

```typescript
// apps/web/components/settings/SettingsRow.tsx
import { ChevronRight } from 'lucide-react'

interface SettingsRowProps {
  label: string
  value?: string
  action?: string
  onAction?: () => void
  last?: boolean
  children?: React.ReactNode
}

export function SettingsRow({ label, value, action, onAction, last, children }: SettingsRowProps) {
  return (
    <div className={`flex items-center justify-between py-3 ${!last ? 'border-b border-border/20' : ''}`}>
      <div className="flex-1">
        <p className="text-sm font-semibold">{label}</p>
        {value && <p className="text-muted-foreground text-xs">{value}</p>}
      </div>
      {children}
      {action && (
        <button
          onClick={onAction}
          className="flex items-center gap-1 text-xs font-medium text-blue-400 hover:text-blue-300"
        >
          {action} <ChevronRight size={12} />
        </button>
      )}
    </div>
  )
}
```

- [ ] **Step 3: Create ConfirmDialog**

```typescript
// apps/web/components/settings/ConfirmDialog.tsx
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'

interface Props {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  description: string
  confirmText: string       // text user must type
  confirmLabel?: string
  loading?: boolean
}

export function ConfirmDialog({
  open, onClose, onConfirm, title, description, confirmText, confirmLabel = 'Onayla', loading
}: Props) {
  const [typed, setTyped] = useState('')

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-card border-border/30 w-full max-w-md rounded-2xl border p-6 shadow-xl">
        <h3 className="mb-2 text-lg font-bold">{title}</h3>
        <p className="text-muted-foreground mb-4 text-sm">{description}</p>
        <p className="mb-2 text-xs font-semibold">
          Devam etmek için <span className="text-red-400">"{confirmText}"</span> yazın:
        </p>
        <input
          value={typed}
          onChange={e => setTyped(e.target.value)}
          className="border-border/30 bg-background mb-4 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-red-500"
          placeholder={confirmText}
        />
        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={() => { setTyped(''); onClose() }}>
            İptal
          </Button>
          <Button
            variant="destructive"
            className="flex-1"
            disabled={typed !== confirmText || loading}
            onClick={onConfirm}
          >
            {loading ? 'İşleniyor...' : confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Commit**

```bash
git add apps/web/components/settings/SettingsSectionCard.tsx apps/web/components/settings/SettingsRow.tsx apps/web/components/settings/ConfirmDialog.tsx
git commit -m "feat: add shared settings UI components (card, row, confirm dialog)"
```

---

## Chunk 3: Section Components

### Task 7: ProfileSection

**Files:**

- Create: `apps/web/components/settings/ProfileSection.tsx`

- [ ] **Step 1: Create ProfileSection**

```typescript
// apps/web/components/settings/ProfileSection.tsx
'use client'

import { useState, useEffect } from 'react'
import { useClerk, useUser } from '@clerk/nextjs'
import Image from 'next/image'
import { Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { THIINGS } from '@/lib/thiings'
import { SettingsSectionCard } from './SettingsSectionCard'
import { SettingsRow } from './SettingsRow'

const FITNESS_LEVELS = [
  { value: 'beginner', label: 'Başlangıç' },
  { value: 'intermediate', label: 'Orta' },
  { value: 'advanced', label: 'İleri' },
  { value: 'elite', label: 'Elit' },
]

const GENDER_OPTIONS = [
  { value: 'male', label: 'Erkek' },
  { value: 'female', label: 'Kadın' },
  { value: 'other', label: 'Diğer' },
  { value: 'prefer_not_to_say', label: 'Belirtmek istemiyorum' },
]

const GOAL_OPTIONS = [
  { value: 'lose_weight', label: 'Kilo Ver' },
  { value: 'gain_muscle', label: 'Kas Kazan' },
  { value: 'improve_endurance', label: 'Dayanıklılık' },
  { value: 'general_fitness', label: 'Genel Form' },
  { value: 'flexibility', label: 'Esneklik' },
]

interface ProfileData {
  name: string
  bio: string
  country: string
  timezone: string
  locale: string
  profilePublic: boolean
  healthProfile: {
    age: number
    gender: string
    heightCm: number
    weightKg: number
    fitnessLevel: string
    goals: string[]
  } | null
}

export function ProfileSection() {
  const { openUserProfile } = useClerk()
  const { user: clerkUser } = useUser()
  const [data, setData] = useState<ProfileData | null>(null)
  const [dirty, setDirty] = useState(false)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/user/profile')
      .then(r => r.json())
      .then(res => {
        const u = res.user
        setData({
          name: u?.name ?? '',
          bio: u?.bio ?? '',
          country: u?.country ?? '',
          timezone: u?.timezone ?? '',
          locale: u?.locale ?? 'tr',
          profilePublic: u?.profilePublic ?? false,
          healthProfile: u?.healthProfile ?? null,
        })
      })
      .finally(() => setLoading(false))
  }, [])

  const update = (patch: Partial<ProfileData>) => {
    setData(prev => prev ? { ...prev, ...patch } : prev)
    setDirty(true)
  }

  const updateHealth = (patch: Partial<ProfileData['healthProfile'] & object>) => {
    setData(prev => prev ? {
      ...prev,
      healthProfile: { ...(prev.healthProfile ?? { age: 25, gender: 'prefer_not_to_say', heightCm: 175, weightKg: 70, fitnessLevel: 'beginner', goals: [] }), ...patch }
    } : prev)
    setDirty(true)
  }

  const handleSave = async () => {
    if (!data) return
    setSaving(true)
    try {
      // Two parallel PATCHes: User fields + HealthProfile fields
      await Promise.all([
        fetch('/api/user/profile', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: data.name,
            bio: data.bio,
            country: data.country,
            timezone: data.timezone,
            locale: data.locale,
          }),
        }),
        data.healthProfile
          ? fetch('/api/user/profile', {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ healthProfile: data.healthProfile }),
            })
          : Promise.resolve(),
      ])
      setDirty(false)
      setToast('Kaydedildi ✓')
      setTimeout(() => setToast(''), 2500)
    } catch {
      setToast('Kaydedilemedi, tekrar dene')
      setTimeout(() => setToast(''), 2500)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <SettingsSectionCard icon={THIINGS.profileIcon} title="Profil Bilgileri" description="Hesap bilgilerini düzenle" delay={0.1}>
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="bg-muted/30 h-12 animate-pulse rounded-xl" />
          ))}
        </div>
      </SettingsSectionCard>
    )
  }

  if (!data) return null

  return (
    <SettingsSectionCard icon={THIINGS.profileIcon} title="Profil Bilgileri" description="Hesap bilgilerini düzenle" delay={0.1}>
      {/* Avatar */}
      <div className="mb-5 flex items-center gap-4">
        <button onClick={() => openUserProfile()} className="relative">
          {clerkUser?.imageUrl ? (
            <Image src={clerkUser.imageUrl} alt="avatar" width={64} height={64} className="rounded-2xl object-cover" />
          ) : (
            <div className="bg-primary/20 flex h-16 w-16 items-center justify-center rounded-2xl text-xl font-bold">
              {data.name?.[0] ?? '?'}
            </div>
          )}
          <span className="bg-primary absolute -bottom-1 -right-1 rounded-full px-1.5 py-0.5 text-[10px] text-white">Düzenle</span>
        </button>
        <div>
          <p className="font-bold">{data.name || '–'}</p>
          <p className="text-muted-foreground text-xs">{clerkUser?.primaryEmailAddress?.emailAddress}</p>
        </div>
      </div>

      {/* Profil Detayları */}
      <div className="mb-1 space-y-0">
        <SettingsRow label="Ad Soyad">
          <input
            value={data.name}
            onChange={e => update({ name: e.target.value })}
            className="bg-transparent text-right text-sm font-semibold outline-none"
          />
        </SettingsRow>
        <SettingsRow label="E-posta" value={clerkUser?.primaryEmailAddress?.emailAddress ?? '–'} />
        <SettingsRow label="Telefon" value={clerkUser?.primaryPhoneNumber?.phoneNumber ?? '–'} />
        <SettingsRow label="Biyografi">
          <textarea
            value={data.bio}
            onChange={e => update({ bio: e.target.value })}
            maxLength={200}
            rows={2}
            className="bg-transparent text-right text-sm font-semibold outline-none resize-none"
            placeholder="Kendinizden bahsedin..."
          />
        </SettingsRow>
      </div>

      {/* Fiziksel */}
      <p className="text-muted-foreground mt-4 mb-2 text-xs font-semibold uppercase">Fiziksel & Kişisel</p>
      <div className="space-y-0">
        <SettingsRow label="Yaş">
          <input type="number" value={data.healthProfile?.age ?? ''} onChange={e => updateHealth({ age: Number(e.target.value) })} className="bg-transparent w-16 text-right text-sm font-semibold outline-none" />
        </SettingsRow>
        <SettingsRow label="Cinsiyet">
          <select value={data.healthProfile?.gender ?? ''} onChange={e => updateHealth({ gender: e.target.value })} className="bg-transparent text-right text-sm font-semibold outline-none">
            {GENDER_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </SettingsRow>
        <SettingsRow label="Boy (cm)">
          <input type="number" value={data.healthProfile?.heightCm ?? ''} onChange={e => updateHealth({ heightCm: Number(e.target.value) })} className="bg-transparent w-16 text-right text-sm font-semibold outline-none" />
        </SettingsRow>
        <SettingsRow label="Kilo (kg)" last>
          <input type="number" value={data.healthProfile?.weightKg ?? ''} onChange={e => updateHealth({ weightKg: Number(e.target.value) })} className="bg-transparent w-16 text-right text-sm font-semibold outline-none" />
        </SettingsRow>
      </div>

      {/* Fitness */}
      <p className="text-muted-foreground mt-4 mb-2 text-xs font-semibold uppercase">Fitness</p>
      <div className="space-y-0">
        <SettingsRow label="Fitness Seviyesi">
          <select value={data.healthProfile?.fitnessLevel ?? ''} onChange={e => updateHealth({ fitnessLevel: e.target.value })} className="bg-transparent text-right text-sm font-semibold outline-none">
            {FITNESS_LEVELS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </SettingsRow>
        <SettingsRow label="Hedefler" last>
          <div className="flex flex-wrap gap-1 justify-end max-w-xs">
            {GOAL_OPTIONS.map(g => {
              const active = data.healthProfile?.goals?.includes(g.value)
              return (
                <button key={g.value} onClick={() => {
                  const goals = data.healthProfile?.goals ?? []
                  updateHealth({ goals: active ? goals.filter(x => x !== g.value) : [...goals, g.value] })
                }} className={`rounded-full px-2 py-0.5 text-xs font-medium transition-colors ${active ? 'bg-primary text-white' : 'bg-muted/30 text-muted-foreground'}`}>
                  {g.label}
                </button>
              )
            })}
          </div>
        </SettingsRow>
      </div>

      {/* Konum */}
      <p className="text-muted-foreground mt-4 mb-2 text-xs font-semibold uppercase">Konum</p>
      <div className="space-y-0">
        <SettingsRow label="Ülke">
          <input value={data.country} onChange={e => update({ country: e.target.value })} className="bg-transparent text-right text-sm font-semibold outline-none" placeholder="Türkiye" />
        </SettingsRow>
        <SettingsRow label="Timezone" last>
          <input value={data.timezone} onChange={e => update({ timezone: e.target.value })} className="bg-transparent text-right text-sm font-semibold outline-none" placeholder="Europe/Istanbul" />
        </SettingsRow>
      </div>

      {/* Save */}
      <div className="mt-5 flex items-center justify-between">
        {toast && <span className={`text-xs font-medium ${toast.includes('✓') ? 'text-green-400' : 'text-red-400'}`}>{toast}</span>}
        <div className="ml-auto">
          <Button onClick={handleSave} disabled={!dirty || saving} size="sm" className="gap-1.5">
            <Save size={12} /> {saving ? 'Kaydediliyor...' : 'Kaydet'}
          </Button>
        </div>
      </div>
    </SettingsSectionCard>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/components/settings/ProfileSection.tsx
git commit -m "feat: add ProfileSection component"
```

---

### Task 8: SubscriptionSection

**Files:**

- Create: `apps/web/components/settings/SubscriptionSection.tsx`

- [ ] **Step 1: Create SubscriptionSection**

```typescript
// apps/web/components/settings/SubscriptionSection.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Star, Zap, CheckCircle, Lock, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { THIINGS } from '@/lib/thiings'
import { SettingsSectionCard } from './SettingsSectionCard'

const TIER_LABELS: Record<string, string> = {
  free: 'Ücretsiz', basic: 'Basic', standard: 'Standart', pro: 'Pro'
}

interface SubscriptionData {
  tier: string
  currentPeriodEnd?: string
  usage: {
    sessions: { used: number; limit: number }
    aiPrograms: { used: number; limit: number }
    aiMeals: { used: number; limit: number }
    aiCoach: { used: number; limit: number }
  }
  features: {
    wearableSync: boolean
    advancedAnalytics: boolean
    prioritySupport: boolean
  }
}

export function SubscriptionSection() {
  const router = useRouter()
  const [data, setData] = useState<SubscriptionData | null>(null)
  const [loading, setLoading] = useState(true)
  const [portalLoading, setPortalLoading] = useState(false)

  useEffect(() => {
    fetch('/api/subscription/usage')
      .then(r => r.json())
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const handlePortal = async () => {
    setPortalLoading(true)
    try {
      const res = await fetch('/api/subscription/portal', { method: 'POST' })
      const d = await res.json()
      if (d.url) window.location.href = d.url
    } finally {
      setPortalLoading(false)
    }
  }

  const limitedItems = data ? [
    { label: 'Seans', usage: data.usage.sessions },
    { label: 'AI Program', usage: data.usage.aiPrograms },
    { label: 'Yemek Analizi', usage: data.usage.aiMeals },
    { label: 'Koç Mesajı', usage: data.usage.aiCoach },
  ].filter(i => isFinite(i.usage.limit) && i.usage.used >= i.usage.limit) : []

  return (
    <SettingsSectionCard
      icon={THIINGS.settings}
      title="Abonelik Planı"
      description="Mevcut planını yönet ve özellik limitleri"
      delay={0.12}
      variant="premium"
    >
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-muted/30 h-10 animate-pulse rounded-xl" />
          ))}
        </div>
      ) : !data ? (
        <p className="text-muted-foreground text-sm">Abonelik bilgisi yüklenemedi.</p>
      ) : (
        <div className="space-y-4">
          {/* Limit uyarısı */}
          {limitedItems.length > 0 && (
            <div className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2">
              <AlertTriangle size={14} className="text-red-400 flex-shrink-0" />
              <p className="text-xs text-red-400">
                {limitedItems.map(i => i.label).join(', ')} limitin doldu. Yükselt veya yenileme tarihini bekle.
              </p>
            </div>
          )}

          {/* Mevcut plan */}
          <div className="bg-card/50 border-border/30 flex items-center justify-between rounded-xl border p-3">
            <div>
              <p className="text-muted-foreground text-xs">Mevcut Plan</p>
              <div className="mt-1 flex items-center gap-2">
                <p className="text-lg font-bold">{TIER_LABELS[data.tier] ?? data.tier}</p>
                {data.tier !== 'pro' && <Zap size={16} className="text-yellow-500" />}
              </div>
              {data.currentPeriodEnd && (
                <p className="text-muted-foreground text-xs mt-0.5">
                  Yenileme: {new Date(data.currentPeriodEnd).toLocaleDateString('tr-TR')}
                </p>
              )}
            </div>
            <div className="flex gap-2">
              {data.tier !== 'free' && (
                <Button variant="outline" size="sm" onClick={handlePortal} disabled={portalLoading} className="h-8 text-xs">
                  {portalLoading ? '...' : 'Planı Yönet'}
                </Button>
              )}
              {data.tier !== 'pro' && (
                <Button size="sm" onClick={() => router.push('/dashboard/settings/premium')} className="h-8 bg-gradient-to-r from-green-500 to-emerald-600 text-xs text-white">
                  Yükselt
                </Button>
              )}
            </div>
          </div>

          {/* Kullanım */}
          <div className="space-y-2">
            <p className="text-muted-foreground text-xs font-semibold uppercase">Aylık Kullanım</p>
            {[
              { label: 'Seans', usage: data.usage.sessions },
              { label: 'AI Program', usage: data.usage.aiPrograms },
              { label: 'Yemek Analizi', usage: data.usage.aiMeals },
              { label: 'Koç Mesajı', usage: data.usage.aiCoach },
            ].map(item => {
              const pct = isFinite(item.usage.limit) ? (item.usage.used / item.usage.limit) * 100 : 0
              return (
                <div key={item.label} className="space-y-1">
                  <div className="flex justify-between">
                    <p className="text-sm font-medium">{item.label}</p>
                    <p className="text-muted-foreground text-xs">
                      {item.usage.used}/{isFinite(item.usage.limit) ? item.usage.limit : '∞'}
                    </p>
                  </div>
                  {isFinite(item.usage.limit) && (
                    <div className="bg-muted/30 h-1.5 w-full rounded-full">
                      <div
                        className={`h-1.5 rounded-full transition-all ${pct >= 100 ? 'bg-red-500' : pct >= 80 ? 'bg-yellow-500' : 'bg-blue-500'}`}
                        style={{ width: `${Math.min(pct, 100)}%` }}
                      />
                    </div>
                  )}
                  {!isFinite(item.usage.limit) && (
                    <p className="text-muted-foreground text-xs">Sınırsız</p>
                  )}
                </div>
              )
            })}
          </div>

          {/* Premium özellikler */}
          <div className="space-y-2">
            <p className="text-muted-foreground text-xs font-semibold uppercase">Premium Özellikler</p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              {[
                { label: 'Akıllı Saat Sync', enabled: data.features.wearableSync },
                { label: 'Gelişmiş Analiz', enabled: data.features.advancedAnalytics },
                { label: 'Öncelikli Destek', enabled: data.features.prioritySupport },
              ].map(f => (
                <div key={f.label} className="bg-card/50 border-border/30 flex items-center gap-2 rounded-lg border p-2">
                  {f.enabled
                    ? <CheckCircle size={14} className="flex-shrink-0 text-green-500" />
                    : <Lock size={14} className="text-muted-foreground flex-shrink-0" />}
                  <span className={`text-xs font-medium ${!f.enabled ? 'text-muted-foreground' : ''}`}>{f.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </SettingsSectionCard>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/components/settings/SubscriptionSection.tsx
git commit -m "feat: add SubscriptionSection component"
```

---

### Task 9: AppearanceSection

**Files:**

- Create: `apps/web/components/settings/AppearanceSection.tsx`

- [ ] **Step 1: Create AppearanceSection**

```typescript
// apps/web/components/settings/AppearanceSection.tsx
'use client'

import { useTheme } from 'next-themes'
import { Sun, Moon } from 'lucide-react'
import { THIINGS } from '@/lib/thiings'
import { SettingsSectionCard } from './SettingsSectionCard'
import { SettingsRow } from './SettingsRow'

export function AppearanceSection() {
  const { theme, setTheme } = useTheme()

  const handleLocale = async (locale: string) => {
    localStorage.setItem('locale', locale)
    await fetch('/api/user/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ locale }),
    })
  }

  return (
    <SettingsSectionCard
      icon={THIINGS.settings}
      title="Görünüm ve Dil"
      description="Tema ve dil tercihlerini seç"
      delay={0.15}
    >
      <SettingsRow label="Tema" value="Açık veya koyu mod">
        <div className="flex gap-2">
          <button
            onClick={() => setTheme('light')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${theme === 'light' ? 'bg-blue-600 text-white' : 'bg-muted/30 text-muted-foreground'}`}
          >
            <Sun size={12} /> Açık
          </button>
          <button
            onClick={() => setTheme('dark')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${theme === 'dark' || theme === 'system' ? 'bg-blue-600 text-white' : 'bg-muted/30 text-muted-foreground'}`}
          >
            <Moon size={12} /> Koyu
          </button>
        </div>
      </SettingsRow>

      <SettingsRow label="Dil" value="Uygulama dili" last>
        <select
          defaultValue={typeof window !== 'undefined' ? localStorage.getItem('locale') ?? 'tr' : 'tr'}
          onChange={e => handleLocale(e.target.value)}
          className="bg-muted/30 border-border/30 rounded-lg border px-3 py-1.5 text-sm focus:outline-none"
        >
          <option value="tr">Türkçe</option>
          <option value="en">English</option>
        </select>
      </SettingsRow>
    </SettingsSectionCard>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/components/settings/AppearanceSection.tsx
git commit -m "feat: add AppearanceSection component"
```

---

### Task 10: PrivacySection

**Files:**

- Create: `apps/web/components/settings/PrivacySection.tsx`

- [ ] **Step 1: Create PrivacySection**

```typescript
// apps/web/components/settings/PrivacySection.tsx
'use client'

import { useState } from 'react'
import { useClerk } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { THIINGS } from '@/lib/thiings'
import { SettingsSectionCard } from './SettingsSectionCard'
import { SettingsRow } from './SettingsRow'

interface Props {
  profilePublic: boolean
  onProfilePublicChange: (val: boolean) => void
}

export function PrivacySection({ profilePublic, onProfilePublicChange }: Props) {
  const { openUserProfile } = useClerk()
  const router = useRouter()
  const [toggling, setToggling] = useState(false)

  const handleProfilePublic = async () => {
    const newVal = !profilePublic
    setToggling(true)
    try {
      await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profilePublic: newVal }),
      })
      onProfilePublicChange(newVal)
    } catch {
      // revert on error
    } finally {
      setToggling(false)
    }
  }

  const handleExport = () => {
    window.location.href = '/api/user/export'
  }

  return (
    <SettingsSectionCard
      icon={THIINGS.settings}
      title="Gizlilik ve Güvenlik"
      description="Hesap güvenliğini yönet"
      delay={0.2}
    >
      <SettingsRow label="İki Faktörlü Doğrulama" value="Hesap güvenliği" action="Yönet" onAction={() => openUserProfile()} />
      <SettingsRow label="Şifre" value="Şifreni değiştir" action="Değiştir" onAction={() => openUserProfile()} />
      <SettingsRow label="Aktif Oturumlar" value="Bağlı cihazlar" action="Görüntüle" onAction={() => openUserProfile()} />
      <SettingsRow label="Hesap Aktivite Logu" value="Son giriş bilgileri" action="Görüntüle" onAction={() => openUserProfile()} />
      <SettingsRow label="Bağlı Cihazlar" value="Akıllı saat ve uygulamalar" action="Yönet" onAction={() => router.push('/dashboard/health')} />
      <SettingsRow label="Profil Görünürlüğü" value={profilePublic ? 'Herkese açık' : 'Gizli'}>
        <button
          onClick={handleProfilePublic}
          disabled={toggling}
          className={`relative h-6 w-11 rounded-full transition-colors ${profilePublic ? 'bg-blue-600' : 'bg-muted'}`}
        >
          <motion.div
            animate={{ x: profilePublic ? 20 : 2 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="absolute top-1 h-4 w-4 rounded-full bg-white shadow"
          />
        </button>
      </SettingsRow>
      <SettingsRow label="Verilerimi İndir" value="JSON formatında export" action="İndir" onAction={handleExport} last />
    </SettingsSectionCard>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/components/settings/PrivacySection.tsx
git commit -m "feat: add PrivacySection component"
```

---

### Task 11: DataPrivacySection

**Files:**

- Create: `apps/web/components/settings/DataPrivacySection.tsx`

- [ ] **Step 1: Create DataPrivacySection**

```typescript
// apps/web/components/settings/DataPrivacySection.tsx
'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { THIINGS } from '@/lib/thiings'
import { SettingsSectionCard } from './SettingsSectionCard'
import { SettingsRow } from './SettingsRow'

interface PrivacySettings {
  collectWorkout: boolean
  collectNutrition: boolean
  analytics: boolean
  marketingEmails: boolean
}

function Toggle({ enabled, onChange }: { enabled: boolean; onChange: () => void }) {
  return (
    <button onClick={onChange} className={`relative h-6 w-11 rounded-full transition-colors ${enabled ? 'bg-blue-600' : 'bg-muted'}`}>
      <motion.div
        animate={{ x: enabled ? 20 : 2 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        className="absolute top-1 h-4 w-4 rounded-full bg-white shadow"
      />
    </button>
  )
}

export function DataPrivacySection() {
  const [settings, setSettings] = useState<PrivacySettings>({
    collectWorkout: true, collectNutrition: true, analytics: true, marketingEmails: false
  })
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState('')

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(''), 2500)
  }

  useEffect(() => {
    fetch('/api/user/privacy-settings')
      .then(r => r.json())
      .then(d => d.settings && setSettings(d.settings))
      .finally(() => setLoading(false))
  }, [])

  const toggle = async (key: keyof PrivacySettings) => {
    const newVal = !settings[key]
    const prev = settings[key]
    setSettings(s => ({ ...s, [key]: newVal }))
    try {
      await fetch('/api/user/privacy-settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [key]: newVal }),
      })
    } catch {
      setSettings(s => ({ ...s, [key]: prev })) // revert
      showToast('Kaydedilemedi, tekrar dene')
    }
  }

  if (loading) {
    return (
      <SettingsSectionCard icon={THIINGS.bell} title="Veri ve Gizlilik" description="Veri toplama tercihlerini yönet" delay={0.22}>
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="bg-muted/30 h-10 animate-pulse rounded-xl" />)}
        </div>
      </SettingsSectionCard>
    )
  }

  return (
    <SettingsSectionCard icon={THIINGS.bell} title="Veri ve Gizlilik" description="Veri toplama tercihlerini yönet" delay={0.22}>
      <SettingsRow label="Antrenman verilerini topla" value="Seans ve egzersiz verileri">
        <Toggle enabled={settings.collectWorkout} onChange={() => toggle('collectWorkout')} />
      </SettingsRow>
      <SettingsRow label="Beslenme verilerini topla" value="Yemek günlüğü verileri">
        <Toggle enabled={settings.collectNutrition} onChange={() => toggle('collectNutrition')} />
      </SettingsRow>
      <SettingsRow label="Analitik ve iyileştirme" value="Uygulama kullanım verileri">
        <Toggle enabled={settings.analytics} onChange={() => toggle('analytics')} />
      </SettingsRow>
      <SettingsRow label="Pazarlama iletişimi" value="Kampanya ve fırsatlar" last>
        <Toggle enabled={settings.marketingEmails} onChange={() => toggle('marketingEmails')} />
      </SettingsRow>

      {toast && <p className="mt-2 text-xs text-red-400">{toast}</p>}

      <div className="mt-4 flex gap-4">
        <a href="/privacy" target="_blank" rel="noopener noreferrer" className="text-xs text-blue-400 hover:text-blue-300">
          Gizlilik Politikası →
        </a>
        <a href="/terms" target="_blank" rel="noopener noreferrer" className="text-xs text-blue-400 hover:text-blue-300">
          Kullanım Şartları →
        </a>
      </div>
    </SettingsSectionCard>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/components/settings/DataPrivacySection.tsx
git commit -m "feat: add DataPrivacySection component"
```

---

### Task 12: DangerZone

**Files:**

- Create: `apps/web/components/settings/DangerZone.tsx`

- [ ] **Step 1: Create DangerZone**

```typescript
// apps/web/components/settings/DangerZone.tsx
'use client'

import { useState } from 'react'
import { useClerk } from '@clerk/nextjs'
import { LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { THIINGS } from '@/lib/thiings'
import { SettingsSectionCard } from './SettingsSectionCard'
import { ConfirmDialog } from './ConfirmDialog'

export function DangerZone() {
  const { signOut } = useClerk()
  const [deleteDataOpen, setDeleteDataOpen] = useState(false)
  const [deleteAccountOpen, setDeleteAccountOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleDeleteData = async () => {
    setLoading(true)
    try {
      await fetch('/api/user/data', { method: 'DELETE' })
      setDeleteDataOpen(false)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteAccount = async () => {
    setLoading(true)
    try {
      // Deletes DB User record (cascade) + Clerk account
      await fetch('/api/user/account', { method: 'DELETE' })
      await signOut({ redirectUrl: '/' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <SettingsSectionCard
        icon={THIINGS.trashBin}
        title="Tehlikeli Alan"
        description="Geri alınamaz işlemler"
        delay={0.3}
        variant="danger"
      >
        <div className="flex items-center justify-between border-b border-red-500/20 py-3">
          <div>
            <p className="text-sm font-semibold">Tüm Verilerimi Sil</p>
            <p className="text-muted-foreground text-xs">Antrenman, beslenme ve sağlık verileri silinir</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => setDeleteDataOpen(true)} className="border-red-500/30 text-xs text-red-400 hover:bg-red-500/10">
            Sil
          </Button>
        </div>

        <div className="flex items-center justify-between border-b border-red-500/20 py-3">
          <div>
            <p className="text-sm font-semibold">Hesabı Sil</p>
            <p className="text-muted-foreground text-xs">FitAI hesabın kalıcı olarak silinir</p>
          </div>
          <Button variant="destructive" size="sm" onClick={() => setDeleteAccountOpen(true)} className="text-xs">
            Hesabı Sil
          </Button>
        </div>

        <div className="flex items-center justify-between py-3">
          <div>
            <p className="text-sm font-semibold">Çıkış Yap</p>
            <p className="text-muted-foreground text-xs">Tüm cihazlardan çıkış yap</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => signOut({ redirectUrl: '/' })} className="gap-1.5 border-red-500/30 text-xs text-red-400 hover:bg-red-500/10">
            <LogOut size={12} /> Çıkış Yap
          </Button>
        </div>
      </SettingsSectionCard>

      <ConfirmDialog
        open={deleteDataOpen}
        onClose={() => setDeleteDataOpen(false)}
        onConfirm={handleDeleteData}
        title="Tüm Verilerini Sil"
        description="Antrenman geçmişi, beslenme günlüğü ve sağlık verilerin kalıcı olarak silinir. Hesabın korunur."
        confirmText="SİL"
        confirmLabel="Verileri Sil"
        loading={loading}
      />

      <ConfirmDialog
        open={deleteAccountOpen}
        onClose={() => setDeleteAccountOpen(false)}
        onConfirm={handleDeleteAccount}
        title="Hesabını Sil"
        description="FitAI hesabın ve tüm verilerin kalıcı olarak silinir. Bu işlem geri alınamaz."
        confirmText="HESABIMI SİL"
        confirmLabel="Hesabı Sil"
        loading={loading}
      />
    </>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/components/settings/DangerZone.tsx
git commit -m "feat: add DangerZone component with typed confirmation dialogs"
```

---

## Chunk 4: Page Assembly & Redirect

### Task 13: Settings Page Orchestrator

**Files:**

- Modify: `apps/web/app/(dashboard)/dashboard/settings/page.tsx`

- [ ] **Step 1: Rewrite settings page**

```typescript
// apps/web/app/(dashboard)/dashboard/settings/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useUser } from '@clerk/nextjs'
import { ProfileSection } from '@/components/settings/ProfileSection'
import { SubscriptionSection } from '@/components/settings/SubscriptionSection'
import { AppearanceSection } from '@/components/settings/AppearanceSection'
import { PrivacySection } from '@/components/settings/PrivacySection'
import { DataPrivacySection } from '@/components/settings/DataPrivacySection'
import { DangerZone } from '@/components/settings/DangerZone'

export default function SettingsPage() {
  const { user: clerkUser } = useUser()
  const [profilePublic, setProfilePublic] = useState(false)

  useEffect(() => {
    fetch('/api/user/profile')
      .then(r => r.json())
      .then(d => {
        if (d.user?.profilePublic !== undefined) setProfilePublic(d.user.profilePublic)
      })
  }, [])

  return (
    <div className="max-w-2xl space-y-6 pb-16">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="mb-1 text-3xl font-black">Ayarlar</h1>
        <p className="text-muted-foreground text-sm">
          {clerkUser?.primaryEmailAddress?.emailAddress ?? 'Hesap ve tercihlerini yönet'}
        </p>
      </motion.div>

      <ProfileSection />
      <SubscriptionSection />
      <AppearanceSection />
      <PrivacySection profilePublic={profilePublic} onProfilePublicChange={setProfilePublic} />
      <DataPrivacySection />
      <DangerZone />
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/app/\(dashboard\)/dashboard/settings/page.tsx
git commit -m "feat: rewrite settings page with modular section components"
```

---

### Task 14: Profile Page Redirect

**Files:**

- Modify: `apps/web/app/(dashboard)/dashboard/profile/page.tsx`

- [ ] **Step 1: Replace with redirect**

```typescript
// apps/web/app/(dashboard)/dashboard/profile/page.tsx
import { redirect } from 'next/navigation'

export default function ProfilePage() {
  redirect('/dashboard/settings')
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/app/\(dashboard\)/dashboard/profile/page.tsx
git commit -m "feat: redirect /dashboard/profile to /dashboard/settings"
```

---

### Task 15: Sidebar Update

**Files:**

- Modify: `apps/web/components/dashboard/shared/sidebar.tsx` (already has "Ayarlar" at `/dashboard/settings` — verify and keep as-is)

- [ ] **Step 1: Verify sidebar already correct**

Open `apps/web/components/dashboard/shared/sidebar.tsx` and confirm:

```typescript
{ label: 'Ayarlar', href: '/dashboard/settings', icon: THIINGS.settings },
```

This entry already exists. No change needed. The sidebar does NOT have a "Profile" entry pointing to `/dashboard/profile`.

- [ ] **Step 2: Commit (no-op if already correct)**

```bash
git status  # confirm no change needed
```

---

### Task 16: Verify & Build Check

- [ ] **Step 1: TypeScript check**

```bash
cd apps/web
npx tsc --noEmit
```

Expected: No errors (or only pre-existing errors).

- [ ] **Step 2: Manual test checklist**

Navigate to `/dashboard/settings` and verify:

- [ ] Profile section loads with user data
- [ ] Avatar click opens Clerk modal
- [ ] Edit fields and Save button activates
- [ ] Subscription section shows usage bars
- [ ] Appearance theme toggle works
- [ ] Privacy section rows render
- [ ] Data privacy toggles persist
- [ ] DangerZone confirmation dialogs require typed text
- [ ] `/dashboard/profile` redirects to `/dashboard/settings`

- [ ] **Step 3: Final commit**

```bash
git add -A
git commit -m "feat: complete settings page implementation"
```
