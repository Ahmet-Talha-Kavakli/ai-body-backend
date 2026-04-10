# FitAI V2 — Faz 1: Temel Yeniden Yapı

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Çalışan, güzel görünen, VAPI sesli koçlu, Beden Zekası altyapısı kurulu bir MVP üretmek.

**Architecture:** Mevcut Next.js 15 monorepo üzerine 3 yeni shared package eklenir (`shared-ai`, `shared-hooks`, `shared-utils`). Tüm AI kararları `ContextAssembler` üzerinden geçer. VAPI SDK sesli koçu yönetir. ReadinessScore motoru her sabah wearable/manuel veri + DailyMetrics'ten çalışır.

**Tech Stack:** Next.js 15, Prisma + Supabase (pgvector), VAPI Web SDK, GPT-4o, ExerciseDB API, TensorFlow.js, Framer Motion, GSAP, NativeWind v4 (Faz 3 hazırlığı için)

**Spec:** `docs/superpowers/specs/2026-04-10-fitai-v2-design.md`

---

## Chunk 1: Güvenlik & Altyapı Temeli

### Task 1: ENV Güvenliği (ACİL)

**Files:**
- Modify: `.gitignore` (root)
- Modify: `apps/web/.env.example`

- [ ] **Step 1: .gitignore'u kontrol et**

```bash
cat .gitignore | grep env
```

- [ ] **Step 2: .env.local'i gitignore'a ekle**

Root `.gitignore`'a şunu ekle (yoksa):
```
apps/web/.env.local
*.env.local
```

- [ ] **Step 3: .env.example güncelle**

`apps/web/.env.example` dosyasına tüm yeni key'leri ekle:
```env
# Auth
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
CLERK_WEBHOOK_SECRET=

# Database
DATABASE_URL=
DIRECT_URL=

# OpenAI
OPENAI_API_KEY=

# VAPI (YENİ)
NEXT_PUBLIC_VAPI_PUBLIC_KEY=
VAPI_PRIVATE_KEY=

# Stripe
STRIPE_SECRET_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_BASIC_PRICE_ID=
STRIPE_STANDARD_PRICE_ID=
STRIPE_PRO_PRICE_ID=

# Redis (Upstash)
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

# Storage
BLOB_READ_WRITE_TOKEN=

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

- [ ] **Step 4: Commit**

```bash
git add .gitignore apps/web/.env.example
git commit -m "security: add .env.local to gitignore, update .env.example with VAPI keys"
```

---

### Task 2: Shared Packages Kurulumu

**Files:**
- Create: `packages/shared-utils/package.json`
- Create: `packages/shared-utils/tsconfig.json`
- Create: `packages/shared-utils/src/index.ts`
- Create: `packages/shared-ai/package.json`
- Create: `packages/shared-ai/tsconfig.json`
- Create: `packages/shared-ai/src/index.ts`
- Create: `packages/shared-hooks/package.json`
- Create: `packages/shared-hooks/tsconfig.json`
- Create: `packages/shared-hooks/src/index.ts`
- Modify: `pnpm-workspace.yaml`
- Modify: `turbo.json`

- [ ] **Step 1: shared-utils paketi oluştur**

```bash
mkdir -p packages/shared-utils/src
```

`packages/shared-utils/package.json`:
```json
{
  "name": "@fitai/shared-utils",
  "version": "0.0.1",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "scripts": {
    "typecheck": "tsc --noEmit"
  },
  "devDependencies": {
    "typescript": "^5.8.3"
  }
}
```

`packages/shared-utils/tsconfig.json`:
```json
{
  "extends": "../../apps/web/tsconfig.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"]
}
```

`packages/shared-utils/src/index.ts`:
```typescript
export * from './readiness-score';
export * from './progressive-overload';
export * from './form-analyzer-utils';
```

- [ ] **Step 2: shared-ai paketi oluştur**

```bash
mkdir -p packages/shared-ai/src
```

`packages/shared-ai/package.json`:
```json
{
  "name": "@fitai/shared-ai",
  "version": "0.0.1",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "dependencies": {
    "@fitai/shared-utils": "workspace:*",
    "@fitai/shared-types": "workspace:*"
  },
  "devDependencies": {
    "typescript": "^5.8.3"
  }
}
```

`packages/shared-ai/src/index.ts`:
```typescript
export * from './context-assembler';
export * from './prompt-builders';
```

- [ ] **Step 3: shared-hooks paketi oluştur**

```bash
mkdir -p packages/shared-hooks/src
```

`packages/shared-hooks/package.json`:
```json
{
  "name": "@fitai/shared-hooks",
  "version": "0.0.1",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "dependencies": {
    "@fitai/shared-utils": "workspace:*",
    "@fitai/shared-types": "workspace:*"
  }
}
```

- [ ] **Step 4: pnpm workspace güncelle**

`pnpm-workspace.yaml` içinde `packages/*` zaten varsa bu step atlanır. Yoksa:
```yaml
packages:
  - "apps/*"
  - "packages/*"
```

- [ ] **Step 5: Bağımlılıkları yükle**

```bash
pnpm install
```

Beklenen: Yeni paketler workspace'e eklendi, hata yok.

- [ ] **Step 6: Web app'e shared paketleri ekle**

`apps/web/package.json` → `dependencies`'e ekle:
```json
"@fitai/shared-utils": "workspace:*",
"@fitai/shared-ai": "workspace:*",
"@fitai/shared-hooks": "workspace:*"
```

```bash
pnpm install
```

- [ ] **Step 7: Commit**

```bash
git add packages/ apps/web/package.json pnpm-workspace.yaml
git commit -m "feat: add shared-utils, shared-ai, shared-hooks packages"
```

---

### Task 3: ML Model Bug Fix

**Files:**
- Modify: `apps/web/lib/ml/train-models.ts` (L3 import bug)
- Modify: `apps/web/lib/ml/models/form-score-predictor.ts`
- Modify: `apps/web/lib/ml/models/recovery-classifier.ts`

- [ ] **Step 1: Import bug'ı düzelt**

`apps/web/lib/ml/train-models.ts` dosyasında `db` import'unu `prisma` ile değiştir:
```typescript
// ESKİ (bozuk):
import { db } from '../db';

// YENİ:
import { prisma } from '../db';
```

Ve dosyanın geri kalanında `db.` → `prisma.` olarak değiştir.

- [ ] **Step 2: Tip kontrolü çalıştır**

```bash
cd apps/web && pnpm typecheck
```

Beklenen: train-models.ts'de hata yok.

- [ ] **Step 3: Commit**

```bash
git add apps/web/lib/ml/train-models.ts
git commit -m "fix: correct prisma import in train-models.ts (db -> prisma)"
```

---

## Chunk 2: Prisma Şema Güncellemesi

### Task 4: Yeni Prisma Modelleri

**Files:**
- Modify: `apps/web/prisma/schema.prisma`
- Create: `apps/web/prisma/migrations/` (otomatik)

- [ ] **Step 1: pgvector extension ekle**

`schema.prisma` başına ekle:
```prisma
generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["postgresqlExtensions"]
}

datasource db {
  provider   = "postgresql"
  url        = env("DATABASE_URL")
  directUrl  = env("DIRECT_URL")
  extensions = [vector]
}
```

- [ ] **Step 2: Program modeli güncelle**

Mevcut `WorkoutProgram` modelini koru, şu field'ları ekle:
```prisma
model WorkoutProgram {
  // ... mevcut field'lar ...
  status         ProgramStatus @default(ACTIVE)
  mesoCycleWeeks Int           @default(4)
  currentWeek    Int           @default(1)
  deloadWeek     Int?
}

enum ProgramStatus {
  ACTIVE
  COMPLETED
  PAUSED
}
```

`PlannedExercise` modeline ekle:
```prisma
model PlannedExercise {
  // ... mevcut field'lar ...
  repsMin     Int     @default(8)
  repsMax     Int     @default(12)
  rpe         Float?
  order       Int     @default(0)
  notes       String?
}
```

- [ ] **Step 3: UserMemoryEmbedding modeli ekle**

```prisma
model UserMemoryEmbedding {
  id        String                 @id @default(cuid())
  userId    String
  content   String                 // özet metin
  embedding Unsupported("vector(1536)")?  // OpenAI text-embedding-3-small
  type      MemoryType
  createdAt DateTime               @default(now())
  user      User                   @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
}

enum MemoryType {
  SESSION_SUMMARY
  WEEKLY_SUMMARY
  MILESTONE
  PATTERN
}
```

- [ ] **Step 4: ChallengeGroup modeli ekle**

```prisma
model ChallengeGroup {
  id           String       @id @default(cuid())
  weekStart    DateTime
  ageRange     String       // "25-30"
  fitnessLevel FitnessLevel
  goal         FitnessGoal
  avgSessions  Float        @default(0)
  memberCount  Int          @default(0)
  updatedAt    DateTime     @updatedAt
}
```

- [ ] **Step 5: Migration oluştur**

```bash
cd apps/web && npx prisma migrate dev --name "v2_program_memory_challenge"
```

Beklenen: Migration dosyası oluştu, DB güncellendi.

- [ ] **Step 6: Prisma client regenerate**

```bash
cd apps/web && npx prisma generate
```

- [ ] **Step 7: Tip kontrolü**

```bash
cd apps/web && pnpm typecheck
```

- [ ] **Step 8: Commit**

```bash
git add apps/web/prisma/
git commit -m "feat: add pgvector extension, UserMemoryEmbedding, ChallengeGroup, update Program schema"
```

---

## Chunk 3: ReadinessScore Motoru

### Task 5: ReadinessScore Implementasyonu

**Files:**
- Create: `packages/shared-utils/src/readiness-score.ts`
- Create: `packages/shared-utils/src/__tests__/readiness-score.test.ts`
- Create: `apps/web/app/api/readiness/route.ts`

- [ ] **Step 1: Failing test yaz**

`packages/shared-utils/src/__tests__/readiness-score.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import { calculateReadinessScore, normalizeInputs } from '../readiness-score';

describe('calculateReadinessScore', () => {
  it('returns 100 for perfect inputs', () => {
    const score = calculateReadinessScore({
      sleepHours: 8,
      hrvDelta: 0.1,       // +10% kişisel ortalamanın üstünde
      sessionFatigue: 0.1, // son 48 saat düşük yük
      stressLevel: 1,      // 1/10
      proteinRatio: 1.0,   // hedefin %100'ü
      activeInjuries: 0,
    });
    expect(score).toBeGreaterThanOrEqual(95);
  });

  it('returns low score for poor sleep and high stress', () => {
    const score = calculateReadinessScore({
      sleepHours: 4,
      hrvDelta: -0.15,
      sessionFatigue: 0.9,
      stressLevel: 9,
      proteinRatio: 0.4,
      activeInjuries: 2,
    });
    expect(score).toBeLessThan(40);
  });

  it('clamps output between 0 and 100', () => {
    const score = calculateReadinessScore({
      sleepHours: 0,
      hrvDelta: -1,
      sessionFatigue: 1,
      stressLevel: 10,
      proteinRatio: 0,
      activeInjuries: 5,
    });
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });

  it('uses 0.5 default for HRV when wearable not connected', () => {
    const withHRV = calculateReadinessScore({
      sleepHours: 7, hrvDelta: 0, sessionFatigue: 0.3,
      stressLevel: 4, proteinRatio: 0.9, activeInjuries: 0,
    });
    const withoutHRV = calculateReadinessScore({
      sleepHours: 7, hrvDelta: null, sessionFatigue: 0.3,
      stressLevel: 4, proteinRatio: 0.9, activeInjuries: 0,
    });
    // null HRV → 0.5 default → scores should be close
    expect(Math.abs(withHRV - withoutHRV)).toBeLessThan(15);
  });
});
```

- [ ] **Step 2: Test'i çalıştır — FAIL bekleniyor**

```bash
cd packages/shared-utils && npx vitest run src/__tests__/readiness-score.test.ts
```

Beklenen: "Cannot find module '../readiness-score'"

- [ ] **Step 3: Implementasyonu yaz**

`packages/shared-utils/src/readiness-score.ts`:
```typescript
export interface ReadinessInputs {
  sleepHours: number;
  hrvDelta: number | null;  // kişisel 30 günlük ortalamanın üstünde/altında oran (-1 to +1)
  sessionFatigue: number;   // 0-1 (son 48 saatteki yükün kişisel max'a oranı)
  stressLevel: number;      // 1-10 (DailyMetrics.stressLevel)
  proteinRatio: number;     // 0-1 (dün alınan protein / hedef)
  activeInjuries: number;   // aktif yaralanma sayısı
}

function normalizeSleep(hours: number): number {
  if (hours < 5) return 0.2;
  if (hours < 6) return 0.5;
  if (hours < 7) return 0.7;
  if (hours <= 8) return 0.9;
  return 1.0;
}

function normalizeHRV(delta: number | null): number {
  if (delta === null) return 0.5; // wearable yok → nötr
  // -0.2 → 0.3, 0 → 0.5, +0.2 → 1.0
  return Math.min(1, Math.max(0, 0.5 + delta * 2.5));
}

function normalizeFatigue(fatigue: number): number {
  return 1 - fatigue; // yüksek yorgunluk = düşük skor
}

function normalizeStress(level: number): number {
  return (10 - level) / 10; // 1=1.0, 10=0.0
}

function normalizeInjuries(count: number): number {
  if (count === 0) return 1.0;
  if (count === 1) return 0.8;
  if (count === 2) return 0.5;
  return 0.3;
}

export function calculateReadinessScore(inputs: ReadinessInputs): number {
  const components = {
    sleep:      normalizeSleep(inputs.sleepHours)      * 0.30,
    hrv:        normalizeHRV(inputs.hrvDelta)          * 0.20,
    fatigue:    normalizeFatigue(inputs.sessionFatigue)* 0.20,
    stress:     normalizeStress(inputs.stressLevel)    * 0.15,
    nutrition:  Math.min(1, inputs.proteinRatio)       * 0.10,
    injuries:   normalizeInjuries(inputs.activeInjuries) * 0.05,
  };

  const raw = Object.values(components).reduce((a, b) => a + b, 0);
  return Math.round(Math.min(100, Math.max(0, raw * 100)));
}
```

- [ ] **Step 4: Test'i çalıştır — PASS bekleniyor**

```bash
cd packages/shared-utils && npx vitest run src/__tests__/readiness-score.test.ts
```

Beklenen: 4/4 PASS

- [ ] **Step 5: API route yaz**

`apps/web/app/api/readiness/route.ts`:
```typescript
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db';
import { calculateReadinessScore } from '@fitai/shared-utils';

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { clerkId: userId } });
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  // Son DailyMetrics
  const today = await prisma.dailyMetrics.findFirst({
    where: { userId: user.id },
    orderBy: { date: 'desc' },
  });

  // Son 48 saatteki seans yükü
  const recentSessions = await prisma.workoutSession.findMany({
    where: {
      userId: user.id,
      completedAt: { gte: new Date(Date.now() - 48 * 60 * 60 * 1000) },
    },
    include: { completedSets: true },
  });

  const sessionVolume = recentSessions.reduce((sum, s) =>
    sum + s.completedSets.reduce((sv, set) =>
      sv + (set.repsCompleted * (set.weightKg ?? 1)), 0), 0);

  // Aktif yaralanma sayısı
  const activeInjuries = await prisma.injury.count({
    where: { userId: user.id, isActive: true },
  });

  const score = calculateReadinessScore({
    sleepHours: today?.sleepHours ?? 7,
    hrvDelta: null, // Faz 2'de wearable entegre edilince dolacak
    sessionFatigue: Math.min(1, sessionVolume / 5000), // basit normalizasyon
    stressLevel: today?.stressLevel ?? 5,
    proteinRatio: today?.proteinGrams && user.proteinTarget
      ? today.proteinGrams / user.proteinTarget
      : 0.7,
    activeInjuries,
  });

  const reason = buildReadinessReason(score, today, activeInjuries);

  return NextResponse.json({ score, reason, updatedAt: new Date() });
}

function buildReadinessReason(score: number, metrics: any, injuries: number): string {
  if (score >= 80) return 'Harika durumdasın, tam gaz antrenman zamanı!';
  if (score >= 60) return 'İyi durumdasın, normal antrenmanına devam edebilirsin.';
  if (score >= 40) {
    if (injuries > 0) return 'Aktif yaralanman var, dikkatli ol.';
    if (metrics?.sleepHours < 6) return 'Az uyudun, hafif antrenman önerilir.';
    return 'Orta hazırlık seviyesi, yoğunluğu biraz düşür.';
  }
  return 'Bugün dinlenmen daha iyi olur, recovery day önerilir.';
}
```

- [ ] **Step 6: Tip kontrolü**

```bash
cd apps/web && pnpm typecheck
```

- [ ] **Step 7: Commit**

```bash
git add packages/shared-utils/src/ apps/web/app/api/readiness/
git commit -m "feat: add ReadinessScore calculator with API route"
```

---

## Chunk 4: ExerciseDB Entegrasyonu

### Task 6: Egzersiz Veritabanı

**Files:**
- Create: `apps/web/lib/exercise-db/client.ts`
- Create: `apps/web/lib/exercise-db/seed.ts`
- Create: `apps/web/app/api/exercises/route.ts`
- Modify: `apps/web/prisma/schema.prisma` (Exercise modeli genişletme)

- [ ] **Step 1: Exercise modeli genişlet**

`apps/web/prisma/schema.prisma` Exercise modeline ekle:
```prisma
model Exercise {
  id            String   @id @default(cuid())
  externalId    String?  @unique  // ExerciseDB'den gelen ID
  name          String
  bodyPart      String   // chest, back, legs, shoulders, arms, core, cardio
  equipment     String   // barbell, dumbbell, machine, bodyweight, cable, etc.
  target        String   // hedef kas
  secondaryMuscles String[]
  instructions  String[]
  gifUrl        String?
  formCriteria  Json?    // form analizi için açı tanımları
  createdAt     DateTime @default(now())
}
```

```bash
cd apps/web && npx prisma migrate dev --name "exercise_external_id"
npx prisma generate
```

- [ ] **Step 2: ExerciseDB client yaz**

`apps/web/lib/exercise-db/client.ts`:
```typescript
const EXERCISE_DB_BASE = 'https://exercisedb.p.rapidapi.com';

const headers = {
  'X-RapidAPI-Key': process.env.RAPIDAPI_KEY!,
  'X-RapidAPI-Host': 'exercisedb.p.rapidapi.com',
};

export async function fetchAllExercises() {
  const res = await fetch(`${EXERCISE_DB_BASE}/exercises?limit=1300&offset=0`, { headers });
  if (!res.ok) throw new Error(`ExerciseDB error: ${res.status}`);
  return res.json();
}

export async function fetchExercisesByBodyPart(bodyPart: string) {
  const res = await fetch(`${EXERCISE_DB_BASE}/exercises/bodyPart/${bodyPart}`, { headers });
  if (!res.ok) throw new Error(`ExerciseDB error: ${res.status}`);
  return res.json();
}
```

- [ ] **Step 3: Seed script yaz**

`apps/web/lib/exercise-db/seed.ts`:
```typescript
// @ts-nocheck
import { fetchAllExercises } from './client';
import { prisma } from '../db';

async function seedExercises() {
  console.log('ExerciseDB\'den egzersizler çekiliyor...');
  const exercises = await fetchAllExercises();
  console.log(`${exercises.length} egzersiz bulundu`);

  let count = 0;
  for (const ex of exercises) {
    await prisma.exercise.upsert({
      where: { externalId: ex.id },
      update: {
        name: ex.name,
        bodyPart: ex.bodyPart,
        equipment: ex.equipment,
        target: ex.target,
        secondaryMuscles: ex.secondaryMuscles ?? [],
        instructions: ex.instructions ?? [],
        gifUrl: ex.gifUrl,
      },
      create: {
        externalId: ex.id,
        name: ex.name,
        bodyPart: ex.bodyPart,
        equipment: ex.equipment,
        target: ex.target,
        secondaryMuscles: ex.secondaryMuscles ?? [],
        instructions: ex.instructions ?? [],
        gifUrl: ex.gifUrl,
      },
    });
    count++;
    if (count % 100 === 0) console.log(`${count}/${exercises.length}`);
  }
  console.log('Seed tamamlandı.');
}

seedExercises().catch(console.error).finally(() => prisma.$disconnect());
```

- [ ] **Step 4: `RAPIDAPI_KEY` env'e ekle**

`apps/web/.env.local`'e ekle:
```
RAPIDAPI_KEY=your_key_here
```

`apps/web/.env.example`'a ekle:
```
RAPIDAPI_KEY=
```

- [ ] **Step 5: Seed çalıştır**

```bash
cd apps/web && npx tsx lib/exercise-db/seed.ts
```

Beklenen: "Seed tamamlandı." — DB'de 1300+ egzersiz.

- [ ] **Step 6: API route yaz**

`apps/web/app/api/exercises/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db';

export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const bodyPart = searchParams.get('bodyPart');
  const equipment = searchParams.get('equipment');
  const search = searchParams.get('q');
  const limit = parseInt(searchParams.get('limit') ?? '20');

  const exercises = await prisma.exercise.findMany({
    where: {
      ...(bodyPart && { bodyPart }),
      ...(equipment && { equipment }),
      ...(search && { name: { contains: search, mode: 'insensitive' } }),
    },
    take: limit,
    orderBy: { name: 'asc' },
  });

  return NextResponse.json({ exercises });
}
```

- [ ] **Step 7: Commit**

```bash
git add apps/web/lib/exercise-db/ apps/web/app/api/exercises/ apps/web/prisma/
git commit -m "feat: ExerciseDB integration with 1300+ exercises seeded to DB"
```

---

## Chunk 5: VAPI Sesli Koç

### Task 7: VAPI SDK Entegrasyonu

**Files:**
- Create: `apps/web/lib/vapi/session.ts`
- Create: `apps/web/lib/vapi/prompt-builder.ts`
- Create: `apps/web/hooks/useVapiCoach.ts`
- Modify: `apps/web/package.json` (VAPI SDK ekle)

- [ ] **Step 1: VAPI SDK yükle**

```bash
cd apps/web && pnpm add @vapi-ai/web
```

- [ ] **Step 2: VAPI session manager yaz**

`apps/web/lib/vapi/session.ts`:
```typescript
import Vapi from '@vapi-ai/web';

export type CoachPersona = 'military' | 'scientific' | 'supportive' | 'friendly';

// VAPI Dashboard'da oluşturulan assistant ID'leri
const VAPI_ASSISTANT_IDS: Record<CoachPersona, string> = {
  military:   process.env.NEXT_PUBLIC_VAPI_ASSISTANT_MILITARY!,
  scientific: process.env.NEXT_PUBLIC_VAPI_ASSISTANT_SCIENTIFIC!,
  supportive: process.env.NEXT_PUBLIC_VAPI_ASSISTANT_SUPPORTIVE!,
  friendly:   process.env.NEXT_PUBLIC_VAPI_ASSISTANT_FRIENDLY!,
};

export function createVapiInstance() {
  return new Vapi(process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY!);
}

export async function startCoachSession(
  vapi: Vapi,
  persona: CoachPersona,
  systemPrompt: string
) {
  await vapi.start({
    assistantId: VAPI_ASSISTANT_IDS[persona],
    assistantOverrides: {
      model: {
        provider: 'openai',
        model: 'gpt-4o',
        systemPrompt,
      },
    },
  });
}

export function sendFormFeedback(vapi: Vapi, message: string) {
  // VAPI'ye form hatası bildir — koç sesli olarak söyler
  vapi.say(message, false);
}
```

- [ ] **Step 3: System prompt builder yaz**

`apps/web/lib/vapi/prompt-builder.ts`:
```typescript
import type { CoachPersona } from './session';

const PERSONA_PROMPTS: Record<CoachPersona, string> = {
  military: `Sen sert, disiplinli bir askeri antrenörsün. Kısa, keskin komutlar kullan. 
    'Dur!', 'Devam et!', 'Bırakma!' gibi ifadeler kullan. Türkçe konuş.`,
  scientific: `Sen bilimsel, analitik bir fitness koçusun. Her hareketi biyomekanik açıdan açıkla.
    Veri ve açıları kullan. Türkçe konuş.`,
  supportive: `Sen nazik, destekleyici bir koçsun. Kullanıcıyı her zaman teşvik et.
    'Harikasın!', 'Devam et, neredeyse bitti!' gibi ifadeler kullan. Türkçe konuş.`,
  friendly: `Sen samimi, arkadaş canlısı bir koçsun. Rahat ve eğlenceli bir ton kullan.
    Kullanıcıyla sohbet eder gibi konuş. Türkçe konuş.`,
};

interface UserContext {
  name: string;
  fitnessLevel: string;
  primaryGoal: string;
  activeInjuries: string[];
  readinessScore: number;
  currentExercise: string;
  sessionNumber: number;
}

export function buildCoachSystemPrompt(
  persona: CoachPersona,
  context: UserContext
): string {
  return `${PERSONA_PROMPTS[persona]}

KULLANICI BİLGİLERİ:
- İsim: ${context.name}
- Fitness seviyesi: ${context.fitnessLevel}
- Hedef: ${context.primaryGoal}
- Hazırlık skoru bugün: ${context.readinessScore}/100
- Aktif yaralanmalar: ${context.activeInjuries.join(', ') || 'Yok'}
- Şu an yapılan egzersiz: ${context.currentExercise}
- Bu ${context.sessionNumber}. seansı

KURALLAR:
- Cevapların 1-2 cümle. Kısa tut.
- Yaralanmalı bölgeye yüklenirse HEMen uyar.
- Hazırlık skoru 40'ın altındaysa antrenmanı hafifletmesini öner.
- Türkçe konuş.`;
}
```

- [ ] **Step 4: useVapiCoach hook yaz**

`apps/web/hooks/useVapiCoach.ts`:
```typescript
'use client';

import { useRef, useState, useCallback } from 'react';
import Vapi from '@vapi-ai/web';
import { createVapiInstance, startCoachSession, sendFormFeedback } from '@/lib/vapi/session';
import { buildCoachSystemPrompt } from '@/lib/vapi/prompt-builder';
import type { CoachPersona } from '@/lib/vapi/session';

interface UseVapiCoachOptions {
  persona: CoachPersona;
  userContext: Parameters<typeof buildCoachSystemPrompt>[1];
}

export function useVapiCoach({ persona, userContext }: UseVapiCoachOptions) {
  const vapiRef = useRef<Vapi | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const lastFeedbackTime = useRef(0);

  const connect = useCallback(async () => {
    const vapi = createVapiInstance();
    vapiRef.current = vapi;

    vapi.on('call-start', () => setIsConnected(true));
    vapi.on('call-end', () => setIsConnected(false));
    vapi.on('speech-start', () => setIsSpeaking(true));
    vapi.on('speech-end', () => setIsSpeaking(false));

    const systemPrompt = buildCoachSystemPrompt(persona, userContext);
    await startCoachSession(vapi, persona, systemPrompt);
  }, [persona, userContext]);

  const disconnect = useCallback(() => {
    vapiRef.current?.stop();
    vapiRef.current = null;
    setIsConnected(false);
  }, []);

  // Form hatası bildir — 4 sn cooldown ile
  const reportFormError = useCallback((message: string, severity: 'low' | 'medium' | 'high') => {
    if (!vapiRef.current || !isConnected) return;
    if (severity === 'low') return; // düşük şiddette sessiz kal

    const now = Date.now();
    const cooldown = severity === 'high' ? 3000 : 5000;
    if (now - lastFeedbackTime.current < cooldown) return;

    sendFormFeedback(vapiRef.current, message);
    lastFeedbackTime.current = now;
  }, [isConnected]);

  return { connect, disconnect, reportFormError, isConnected, isSpeaking };
}
```

- [ ] **Step 5: .env.example'a VAPI assistant ID'leri ekle**

```env
NEXT_PUBLIC_VAPI_ASSISTANT_MILITARY=
NEXT_PUBLIC_VAPI_ASSISTANT_SCIENTIFIC=
NEXT_PUBLIC_VAPI_ASSISTANT_SUPPORTIVE=
NEXT_PUBLIC_VAPI_ASSISTANT_FRIENDLY=
```

- [ ] **Step 6: Tip kontrolü**

```bash
cd apps/web && pnpm typecheck
```

- [ ] **Step 7: Commit**

```bash
git add apps/web/lib/vapi/ apps/web/hooks/useVapiCoach.ts apps/web/.env.example
git commit -m "feat: VAPI voice coach integration with 4 personas and pose-to-voice bridge"
```

---

## Chunk 6: Context Assembler

### Task 8: ContextAssembler Implementasyonu

**Files:**
- Create: `packages/shared-ai/src/context-assembler.ts`
- Create: `packages/shared-ai/src/__tests__/context-assembler.test.ts`

- [ ] **Step 1: Failing test yaz**

`packages/shared-ai/src/__tests__/context-assembler.test.ts`:
```typescript
import { describe, it, expect, vi } from 'vitest';
import { buildContextString } from '../context-assembler';

describe('buildContextString', () => {
  it('includes all context sections', () => {
    const ctx = buildContextString({
      body: { fitnessLevel: 'intermediate', primaryGoal: 'muscle_gain', weight: 80, height: 178 },
      weekly: { avgFormScore: 72, sessionsCompleted: 3, avgReadiness: 68 },
      session: null,
      injuries: [{ location: 'left_shoulder', severity: 'moderate' }],
    });
    expect(ctx).toContain('intermediate');
    expect(ctx).toContain('muscle_gain');
    expect(ctx).toContain('sol omuz');
    expect(ctx).toContain('3 seans');
  });

  it('stays under 2000 tokens estimate (8000 chars)', () => {
    const ctx = buildContextString({
      body: { fitnessLevel: 'beginner', primaryGoal: 'weight_loss', weight: 90, height: 170 },
      weekly: { avgFormScore: 60, sessionsCompleted: 1, avgReadiness: 55 },
      session: { currentExercise: 'squat', repCount: 5, formScore: 65 },
      injuries: [],
    });
    expect(ctx.length).toBeLessThan(8000);
  });
});
```

- [ ] **Step 2: Test'i çalıştır — FAIL bekleniyor**

```bash
cd packages/shared-ai && npx vitest run src/__tests__/context-assembler.test.ts
```

- [ ] **Step 3: Implementasyon yaz**

`packages/shared-ai/src/context-assembler.ts`:
```typescript
const INJURY_LOCATION_TR: Record<string, string> = {
  left_shoulder: 'sol omuz', right_shoulder: 'sağ omuz',
  left_knee: 'sol diz', right_knee: 'sağ diz',
  lower_back: 'bel', upper_back: 'sırt üstü',
  left_hip: 'sol kalça', right_hip: 'sağ kalça',
};

interface BodyContext {
  fitnessLevel: string;
  primaryGoal: string;
  weight: number;
  height: number;
}

interface WeeklyContext {
  avgFormScore: number;
  sessionsCompleted: number;
  avgReadiness: number;
}

interface SessionContext {
  currentExercise: string;
  repCount: number;
  formScore: number;
} | null

interface AssembleOptions {
  body: BodyContext;
  weekly: WeeklyContext;
  session: SessionContext;
  injuries: Array<{ location: string; severity: string }>;
}

export function buildContextString(opts: AssembleOptions): string {
  const parts: string[] = [];

  // Beden profili (~200 token)
  parts.push(`[KULLANICI PROFİLİ]
Seviye: ${opts.body.fitnessLevel} | Hedef: ${opts.body.primaryGoal}
Kilo: ${opts.body.weight}kg | Boy: ${opts.body.height}cm`);

  // Yaralanmalar
  if (opts.injuries.length > 0) {
    const injuryList = opts.injuries
      .map(i => `${INJURY_LOCATION_TR[i.location] ?? i.location} (${i.severity})`)
      .join(', ');
    parts.push(`[YARALANMALAR] ${injuryList} — bu bölgelere yüklenme!`);
  }

  // Haftalık özet (~300 token)
  parts.push(`[HAFTALIK ÖZET]
Bu hafta ${opts.weekly.sessionsCompleted} seans | Ort. form skoru: ${opts.weekly.avgFormScore}/100
Ort. hazırlık: ${opts.weekly.avgReadiness}/100`);

  // Aktif seans (varsa)
  if (opts.session) {
    parts.push(`[AKTİF SEANS]
Egzersiz: ${opts.session.currentExercise} | Rep: ${opts.session.repCount} | Form: ${opts.session.formScore}/100`);
  }

  return parts.join('\n\n');
}
```

- [ ] **Step 4: Test'i çalıştır — PASS bekleniyor**

```bash
cd packages/shared-ai && npx vitest run src/__tests__/context-assembler.test.ts
```

Beklenen: 2/2 PASS

- [ ] **Step 5: index.ts güncelle**

`packages/shared-ai/src/index.ts`:
```typescript
export * from './context-assembler';
```

- [ ] **Step 6: Commit**

```bash
git add packages/shared-ai/
git commit -m "feat: add ContextAssembler for AI context injection"
```

---

## Chunk 7: Progressive Overload Algoritması

### Task 9: Progressive Overload Implementasyonu

**Files:**
- Create: `packages/shared-utils/src/progressive-overload.ts`
- Create: `packages/shared-utils/src/__tests__/progressive-overload.test.ts`
- Create: `apps/web/app/api/sessions/[id]/complete/route.ts`

- [ ] **Step 1: Failing test yaz**

`packages/shared-utils/src/__tests__/progressive-overload.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import { calculateNextLoad } from '../progressive-overload';

describe('calculateNextLoad', () => {
  it('increases weight when user hits top of rep range with low RPE', () => {
    const result = calculateNextLoad({
      currentWeightKg: 100,
      targetRepsMin: 8,
      targetRepsMax: 12,
      history: [
        { repsCompleted: 12, rpe: 6 },
        { repsCompleted: 12, rpe: 7 },
        { repsCompleted: 11, rpe: 6 },
      ],
    });
    expect(result.weightKg).toBeGreaterThan(100);
  });

  it('decreases weight when user cannot complete min reps', () => {
    const result = calculateNextLoad({
      currentWeightKg: 100,
      targetRepsMin: 8,
      targetRepsMax: 12,
      history: [
        { repsCompleted: 5, rpe: 9 },
        { repsCompleted: 6, rpe: 10 },
        { repsCompleted: 5, rpe: 9 },
      ],
    });
    expect(result.weightKg).toBeLessThan(100);
  });

  it('keeps weight the same when in target range', () => {
    const result = calculateNextLoad({
      currentWeightKg: 100,
      targetRepsMin: 8,
      targetRepsMax: 12,
      history: [
        { repsCompleted: 10, rpe: 7 },
        { repsCompleted: 9, rpe: 8 },
        { repsCompleted: 10, rpe: 7 },
      ],
    });
    expect(result.weightKg).toBe(100);
  });

  it('rounds to nearest 2.5kg', () => {
    const result = calculateNextLoad({
      currentWeightKg: 100,
      targetRepsMin: 8,
      targetRepsMax: 12,
      history: [
        { repsCompleted: 12, rpe: 6 },
        { repsCompleted: 12, rpe: 6 },
        { repsCompleted: 12, rpe: 6 },
      ],
    });
    expect(result.weightKg % 2.5).toBe(0);
  });
});
```

- [ ] **Step 2: Test çalıştır — FAIL bekleniyor**

```bash
cd packages/shared-utils && npx vitest run src/__tests__/progressive-overload.test.ts
```

- [ ] **Step 3: Implementasyon yaz**

`packages/shared-utils/src/progressive-overload.ts`:
```typescript
interface SetHistory {
  repsCompleted: number;
  rpe: number | null;
}

interface OverloadInput {
  currentWeightKg: number;
  targetRepsMin: number;
  targetRepsMax: number;
  history: SetHistory[];  // son 3 seans
}

interface OverloadResult {
  weightKg: number;
  action: 'increase' | 'decrease' | 'maintain';
  reason: string;
}

function roundToNearest2_5(kg: number): number {
  return Math.round(kg / 2.5) * 2.5;
}

function mean(arr: number[]): number {
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

export function calculateNextLoad(input: OverloadInput): OverloadResult {
  if (input.history.length === 0) {
    return { weightKg: input.currentWeightKg, action: 'maintain', reason: 'Geçmiş veri yok' };
  }

  const avgReps = mean(input.history.map(s => s.repsCompleted));
  const avgRPE = mean(input.history.map(s => s.rpe ?? 7));

  if (avgReps >= input.targetRepsMax && avgRPE <= 7) {
    // Kolay tamamlıyor → ağırlık artır %2.5
    const newWeight = roundToNearest2_5(input.currentWeightKg * 1.025);
    return {
      weightKg: newWeight,
      action: 'increase',
      reason: `${input.targetRepsMax} tekrar kolayca tamamlandı, ağırlık artırıldı`,
    };
  }

  if (avgReps < input.targetRepsMin) {
    // Tamamlayamıyor → ağırlık azalt %5
    const newWeight = roundToNearest2_5(input.currentWeightKg * 0.95);
    return {
      weightKg: newWeight,
      action: 'decrease',
      reason: 'Minimum tekrar tamamlanamıyor, ağırlık düşürüldü',
    };
  }

  return {
    weightKg: input.currentWeightKg,
    action: 'maintain',
    reason: 'Hedef aralığında, ağırlık korunuyor',
  };
}
```

- [ ] **Step 4: Test çalıştır — PASS bekleniyor**

```bash
cd packages/shared-utils && npx vitest run src/__tests__/progressive-overload.test.ts
```

Beklenen: 4/4 PASS

- [ ] **Step 5: Seans tamamlama route'u yaz**

`apps/web/app/api/sessions/[id]/complete/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db';
import { calculateNextLoad } from '@fitai/shared-utils';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { clerkId: userId } });
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const session = await prisma.workoutSession.findUnique({
    where: { id: params.id, userId: user.id },
    include: { completedSets: true },
  });

  if (!session) return NextResponse.json({ error: 'Session not found' }, { status: 404 });

  // Her egzersiz için progressive overload hesapla
  const updates: Array<{ exerciseId: string; newWeight: number; action: string }> = [];

  const exerciseGroups = session.completedSets.reduce((acc, set) => {
    if (!acc[set.exerciseId]) acc[set.exerciseId] = [];
    acc[set.exerciseId].push(set);
    return acc;
  }, {} as Record<string, typeof session.completedSets>);

  for (const [exerciseId, sets] of Object.entries(exerciseGroups)) {
    // Bu egzersizin son 3 seans geçmişi
    const history = await prisma.completedSet.findMany({
      where: {
        exerciseId,
        workoutSession: { userId: user.id },
        completedAt: { lt: session.createdAt },
      },
      orderBy: { completedAt: 'desc' },
      take: 3,
    });

    const currentWeight = sets[0].weightKg ?? 0;
    const plannedExercise = await prisma.plannedExercise.findFirst({
      where: { exerciseId },
    });

    const result = calculateNextLoad({
      currentWeightKg: currentWeight,
      targetRepsMin: plannedExercise?.repsMin ?? 8,
      targetRepsMax: plannedExercise?.repsMax ?? 12,
      history: history.map(h => ({ repsCompleted: h.repsCompleted, rpe: null })),
    });

    if (result.action !== 'maintain' && plannedExercise) {
      await prisma.plannedExercise.update({
        where: { id: plannedExercise.id },
        data: { weightKg: result.weightKg },
      });
      updates.push({ exerciseId, newWeight: result.weightKg, action: result.action });
    }
  }

  // Seansı tamamla
  await prisma.workoutSession.update({
    where: { id: params.id },
    data: { completedAt: new Date() },
  });

  return NextResponse.json({ success: true, programUpdates: updates });
}
```

- [ ] **Step 6: Tip kontrolü**

```bash
cd apps/web && pnpm typecheck
```

- [ ] **Step 7: Commit**

```bash
git add packages/shared-utils/src/ apps/web/app/api/sessions/
git commit -m "feat: progressive overload algorithm with automatic program weight updates"
```

---

## Chunk 8: Injury Shield

### Task 10: Injury Shield Implementasyonu

**Files:**
- Create: `packages/shared-utils/src/injury-shield.ts`
- Create: `packages/shared-utils/src/__tests__/injury-shield.test.ts`
- Modify: `apps/web/app/api/ai/generate-program/route.ts`

- [ ] **Step 1: Failing test yaz**

`packages/shared-utils/src/__tests__/injury-shield.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import { getRestrictedMuscleGroups, filterExercisesForInjuries } from '../injury-shield';

describe('getRestrictedMuscleGroups', () => {
  it('maps left_shoulder to shoulder muscles', () => {
    const groups = getRestrictedMuscleGroups([
      { location: 'left_shoulder', severity: 'moderate' }
    ]);
    expect(groups).toContain('delts');
    expect(groups).toContain('traps');
  });

  it('maps lower_back correctly', () => {
    const groups = getRestrictedMuscleGroups([
      { location: 'lower_back', severity: 'severe' }
    ]);
    expect(groups).toContain('spine');
    expect(groups).toContain('lower back');
  });
});

describe('filterExercisesForInjuries', () => {
  it('removes overhead exercises for shoulder injury', () => {
    const exercises = [
      { name: 'overhead press', target: 'delts', bodyPart: 'shoulders' },
      { name: 'squat', target: 'quads', bodyPart: 'upper legs' },
    ];
    const restricted = getRestrictedMuscleGroups([
      { location: 'left_shoulder', severity: 'moderate' }
    ]);
    const filtered = filterExercisesForInjuries(exercises as any, restricted);
    expect(filtered).toHaveLength(1);
    expect(filtered[0].name).toBe('squat');
  });
});
```

- [ ] **Step 2: Test çalıştır — FAIL**

```bash
cd packages/shared-utils && npx vitest run src/__tests__/injury-shield.test.ts
```

- [ ] **Step 3: Implementasyon yaz**

`packages/shared-utils/src/injury-shield.ts`:
```typescript
const INJURY_MUSCLE_MAP: Record<string, string[]> = {
  left_shoulder:  ['delts', 'traps', 'rotator cuff', 'shoulders'],
  right_shoulder: ['delts', 'traps', 'rotator cuff', 'shoulders'],
  left_knee:      ['quads', 'hamstrings', 'calves', 'knees'],
  right_knee:     ['quads', 'hamstrings', 'calves', 'knees'],
  lower_back:     ['spine', 'lower back', 'erector spinae'],
  upper_back:     ['traps', 'rhomboids', 'upper back'],
  left_hip:       ['glutes', 'hip flexors', 'abductors'],
  right_hip:      ['glutes', 'hip flexors', 'abductors'],
  left_elbow:     ['biceps', 'triceps', 'forearms'],
  right_elbow:    ['biceps', 'triceps', 'forearms'],
  neck:           ['traps', 'neck', 'cervical'],
};

interface Injury {
  location: string;
  severity: 'mild' | 'moderate' | 'severe';
}

export function getRestrictedMuscleGroups(injuries: Injury[]): string[] {
  const restricted = new Set<string>();
  for (const injury of injuries) {
    const muscles = INJURY_MUSCLE_MAP[injury.location] ?? [];
    muscles.forEach(m => restricted.add(m));
  }
  return Array.from(restricted);
}

export function filterExercisesForInjuries(
  exercises: Array<{ name: string; target: string; bodyPart: string }>,
  restrictedGroups: string[]
): typeof exercises {
  if (restrictedGroups.length === 0) return exercises;

  return exercises.filter(ex => {
    const lowerTarget = ex.target.toLowerCase();
    const lowerBodyPart = ex.bodyPart.toLowerCase();
    return !restrictedGroups.some(
      g => lowerTarget.includes(g) || lowerBodyPart.includes(g)
    );
  });
}

export function buildInjuryPromptSection(injuries: Injury[]): string {
  if (injuries.length === 0) return '';
  const list = injuries.map(i => `${i.location} (${i.severity})`).join(', ');
  return `\nÖNEMLİ KISITLAMALAR: ${list} bölgelerinde yaralanma var. Bu bölgeleri zorlayan egzersizleri KESINLIKLE programa dahil etme.`;
}
```

- [ ] **Step 4: Test çalıştır — PASS**

```bash
cd packages/shared-utils && npx vitest run src/__tests__/injury-shield.test.ts
```

- [ ] **Step 5: Program generation'a Injury Shield ekle**

`apps/web/app/api/ai/generate-program/route.ts` içinde, GPT prompt'u oluşturan kısma ekle:

```typescript
import { buildInjuryPromptSection, filterExercisesForInjuries } from '@fitai/shared-utils';

// ... mevcut kod içinde, prompt oluştururken:
const injuries = await prisma.injury.findMany({
  where: { userId: user.id, isActive: true },
  select: { location: true, severity: true },
});

const injurySection = buildInjuryPromptSection(injuries as any);
// injurySection'ı GPT prompt'una ekle
```

- [ ] **Step 6: Commit**

```bash
git add packages/shared-utils/src/ apps/web/app/api/ai/generate-program/
git commit -m "feat: Injury Shield — program generation filters injured muscle groups"
```

---

## Chunk 9: Yeni UI Sistemi

### Task 11: Tasarım Token Sistemi

**Files:**
- Modify: `apps/web/app/globals.css`
- Modify: `apps/web/tailwind.config.ts`
- Create: `apps/web/components/ui/aurora-background.tsx`

- [ ] **Step 1: CSS tasarım tokenları tanımla**

`apps/web/app/globals.css` başına ekle:
```css
:root {
  /* Backgrounds */
  --bg-primary: #0A0A0F;
  --bg-surface: #12121A;
  --bg-elevated: #1A1A26;
  --bg-overlay: rgba(10, 10, 15, 0.8);

  /* Accents */
  --accent-primary: #6366F1;
  --accent-primary-hover: #4F46E5;
  --accent-energy: #F59E0B;
  --accent-success: #10B981;
  --accent-danger: #EF4444;
  --accent-recovery: #8B5CF6;

  /* Text */
  --text-primary: #F1F5F9;
  --text-secondary: #94A3B8;
  --text-muted: #475569;

  /* Borders */
  --border-subtle: rgba(255,255,255,0.06);
  --border-default: rgba(255,255,255,0.10);
  --border-strong: rgba(255,255,255,0.20);

  /* Glow effects */
  --glow-primary: 0 0 20px rgba(99, 102, 241, 0.3);
  --glow-energy: 0 0 20px rgba(245, 158, 11, 0.3);
  --glow-success: 0 0 20px rgba(16, 185, 129, 0.3);
}

body {
  background-color: var(--bg-primary);
  color: var(--text-primary);
  font-family: 'Inter', system-ui, sans-serif;
}
```

- [ ] **Step 2: Tailwind config güncelle**

`apps/web/tailwind.config.ts`:
```typescript
import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: {
          primary: 'var(--bg-primary)',
          surface: 'var(--bg-surface)',
          elevated: 'var(--bg-elevated)',
        },
        accent: {
          primary: 'var(--accent-primary)',
          energy: 'var(--accent-energy)',
          success: 'var(--accent-success)',
          danger: 'var(--accent-danger)',
          recovery: 'var(--accent-recovery)',
        },
        text: {
          primary: 'var(--text-primary)',
          secondary: 'var(--text-secondary)',
          muted: 'var(--text-muted)',
        },
      },
      boxShadow: {
        'glow-primary': 'var(--glow-primary)',
        'glow-energy': 'var(--glow-energy)',
        'glow-success': 'var(--glow-success)',
      },
      animation: {
        'aurora': 'aurora 8s ease-in-out infinite alternate',
        'pulse-slow': 'pulse 3s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        aurora: {
          '0%': { backgroundPosition: '0% 50%' },
          '100%': { backgroundPosition: '100% 50%' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
```

- [ ] **Step 3: Aurora arka plan bileşeni**

`apps/web/components/ui/aurora-background.tsx`:
```tsx
'use client';

import { useEffect, useRef } from 'react';

export function AuroraBackground({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let t = 0;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    const draw = () => {
      t += 0.003;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // İndigo blob
      const g1 = ctx.createRadialGradient(
        canvas.width * (0.3 + Math.sin(t) * 0.1),
        canvas.height * (0.3 + Math.cos(t * 0.7) * 0.1),
        0,
        canvas.width * 0.3, canvas.height * 0.3,
        canvas.width * 0.5
      );
      g1.addColorStop(0, 'rgba(99,102,241,0.15)');
      g1.addColorStop(1, 'transparent');
      ctx.fillStyle = g1;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Mor blob
      const g2 = ctx.createRadialGradient(
        canvas.width * (0.7 + Math.cos(t * 0.8) * 0.1),
        canvas.height * (0.6 + Math.sin(t * 0.6) * 0.1),
        0,
        canvas.width * 0.7, canvas.height * 0.6,
        canvas.width * 0.4
      );
      g2.addColorStop(0, 'rgba(139,92,246,0.12)');
      g2.addColorStop(1, 'transparent');
      ctx.fillStyle = g2;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      animId = requestAnimationFrame(draw);
    };

    resize();
    window.addEventListener('resize', resize);
    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={`fixed inset-0 pointer-events-none z-0 ${className ?? ''}`}
    />
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add apps/web/app/globals.css apps/web/tailwind.config.ts apps/web/components/ui/aurora-background.tsx
git commit -m "feat: new dark UI design token system and aurora background component"
```

---

### Task 12: Home Dashboard Yeniden Tasarımı

**Files:**
- Modify: `apps/web/app/(dashboard)/dashboard/page.tsx`
- Create: `apps/web/components/dashboard/readiness-card.tsx`
- Create: `apps/web/components/dashboard/today-plan-card.tsx`

- [ ] **Step 1: ReadinessCard bileşeni**

`apps/web/components/dashboard/readiness-card.tsx`:
```tsx
'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface ReadinessData {
  score: number;
  reason: string;
}

export function ReadinessCard() {
  const [data, setData] = useState<ReadinessData | null>(null);

  useEffect(() => {
    fetch('/api/readiness')
      .then(r => r.json())
      .then(setData);
  }, []);

  if (!data) return <ReadinessCardSkeleton />;

  const color = data.score >= 80 ? '#10B981'
    : data.score >= 60 ? '#6366F1'
    : data.score >= 40 ? '#F59E0B'
    : '#EF4444';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative rounded-2xl p-6 overflow-hidden"
      style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)' }}
    >
      {/* Glow efekti */}
      <div
        className="absolute inset-0 opacity-10 rounded-2xl"
        style={{ background: `radial-gradient(circle at center, ${color}, transparent)` }}
      />

      <div className="relative flex items-center gap-6">
        {/* Dairesel skor */}
        <div className="relative w-24 h-24 flex-shrink-0">
          <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
            <circle cx="50" cy="50" r="40" fill="none" stroke="var(--border-default)" strokeWidth="8" />
            <circle
              cx="50" cy="50" r="40" fill="none"
              stroke={color} strokeWidth="8"
              strokeDasharray={`${data.score * 2.51} 251`}
              strokeLinecap="round"
              style={{ transition: 'stroke-dasharray 1s ease' }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-2xl font-bold" style={{ color }}>{data.score}</span>
          </div>
        </div>

        <div>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Bugünkü Hazırlık</p>
          <p className="text-lg font-semibold mt-1" style={{ color: 'var(--text-primary)' }}>
            {data.score >= 80 ? 'Harika' : data.score >= 60 ? 'İyi' : data.score >= 40 ? 'Orta' : 'Düşük'}
          </p>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>{data.reason}</p>
        </div>
      </div>
    </motion.div>
  );
}

function ReadinessCardSkeleton() {
  return (
    <div className="rounded-2xl p-6 animate-pulse"
      style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)' }}>
      <div className="flex items-center gap-6">
        <div className="w-24 h-24 rounded-full" style={{ background: 'var(--border-default)' }} />
        <div className="space-y-2 flex-1">
          <div className="h-4 rounded w-32" style={{ background: 'var(--border-default)' }} />
          <div className="h-6 rounded w-20" style={{ background: 'var(--border-default)' }} />
          <div className="h-4 rounded w-48" style={{ background: 'var(--border-default)' }} />
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Dashboard ana sayfasını güncelle**

`apps/web/app/(dashboard)/dashboard/page.tsx` içinde `ReadinessCard`'ı en üste ekle:

```tsx
import { AuroraBackground } from '@/components/ui/aurora-background';
import { ReadinessCard } from '@/components/dashboard/readiness-card';

// Mevcut sayfanın JSX'ine ekle:
// <AuroraBackground /> (sayfanın en başında)
// <ReadinessCard /> (içerik başlangıcına)
```

- [ ] **Step 3: Commit**

```bash
git add apps/web/app/(dashboard)/dashboard/ apps/web/components/dashboard/
git commit -m "feat: new Home Dashboard with ReadinessScore card and aurora background"
```

---

## Chunk 10: Onboarding Yeniden Yazımı

### Task 13: 5 Adımlı Onboarding

**Files:**
- Modify: `apps/web/app/onboarding/page.tsx`
- Create: `apps/web/components/onboarding/step-basic.tsx`
- Create: `apps/web/components/onboarding/step-body.tsx`
- Create: `apps/web/components/onboarding/step-health.tsx`
- Create: `apps/web/components/onboarding/step-assessment.tsx`
- Create: `apps/web/components/onboarding/step-commitment.tsx`
- Create: `apps/web/components/onboarding/progress-bar.tsx`

- [ ] **Step 1: Onboarding progress bar**

`apps/web/components/onboarding/progress-bar.tsx`:
```tsx
'use client';

import { motion } from 'framer-motion';

interface Props {
  currentStep: number; // 1-5
  totalSteps: number;
  stepLabels: string[];
}

export function OnboardingProgressBar({ currentStep, totalSteps, stepLabels }: Props) {
  return (
    <div className="w-full">
      <div className="flex justify-between mb-2">
        {stepLabels.map((label, i) => (
          <span
            key={i}
            className="text-xs"
            style={{ color: i + 1 <= currentStep ? 'var(--accent-primary)' : 'var(--text-muted)' }}
          >
            {label}
          </span>
        ))}
      </div>
      <div className="h-1 rounded-full" style={{ background: 'var(--border-default)' }}>
        <motion.div
          className="h-full rounded-full"
          style={{ background: 'var(--accent-primary)' }}
          initial={{ width: 0 }}
          animate={{ width: `${((currentStep - 1) / (totalSteps - 1)) * 100}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Ana onboarding page'i güncelle**

`apps/web/app/onboarding/page.tsx` — mevcut formu 5 adımlı flow ile değiştir:

```tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AuroraBackground } from '@/components/ui/aurora-background';
import { OnboardingProgressBar } from '@/components/onboarding/progress-bar';
import { StepBasic } from '@/components/onboarding/step-basic';
import { StepBody } from '@/components/onboarding/step-body';
import { StepHealth } from '@/components/onboarding/step-health';
import { StepAssessment } from '@/components/onboarding/step-assessment';
import { StepCommitment } from '@/components/onboarding/step-commitment';
import { motion, AnimatePresence } from 'framer-motion';

const STEP_LABELS = ['Temel', 'Beden', 'Sağlık', 'Test', 'Taahhüt'];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({});

  const next = (data: object) => {
    setFormData(prev => ({ ...prev, ...data }));
    if (step < 5) setStep(s => s + 1);
    else handleSubmit({ ...formData, ...data });
  };

  const handleSubmit = async (data: object) => {
    await fetch('/api/onboarding', { method: 'POST', body: JSON.stringify(data),
      headers: { 'Content-Type': 'application/json' } });
    router.push('/dashboard');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6"
      style={{ background: 'var(--bg-primary)' }}>
      <AuroraBackground />

      <div className="relative z-10 w-full max-w-lg">
        <OnboardingProgressBar currentStep={step} totalSteps={5} stepLabels={STEP_LABELS} />

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.25 }}
            className="mt-8"
          >
            {step === 1 && <StepBasic onNext={next} />}
            {step === 2 && <StepBody onNext={next} />}
            {step === 3 && <StepHealth onNext={next} />}
            {step === 4 && <StepAssessment onNext={next} />}
            {step === 5 && <StepCommitment onNext={next} />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: StepBasic bileşeni** (`step-basic.tsx`) — mevcut onboarding field'larını yeni tasarıma taşı (yaş, cinsiyet, boy, kilo, hedef)

- [ ] **Step 4: StepHealth bileşeni** (`step-health.tsx`) — sakatlık girişi, ilaçlar, kan tahlili upload alanı

- [ ] **Step 5: StepAssessment bileşeni** (`step-assessment.tsx`) — 5 temel hareket testi UI'ı (kamera erişimi + pose detection başlatma)

- [ ] **Step 6: StepCommitment bileşeni** (`step-commitment.tsx`) — haftalık seans sayısı seçimi + VAPI ile ilk koç konuşması

- [ ] **Step 7: Commit**

```bash
git add apps/web/app/onboarding/ apps/web/components/onboarding/
git commit -m "feat: 5-step Praktika-style onboarding with progress bar and animations"
```

---

## Chunk 11: Son Entegrasyon & Test

### Task 14: Seans Ekranı VAPI Entegrasyonu

**Files:**
- Modify: `apps/web/app/(dashboard)/dashboard/session/page.tsx`
- Modify: `apps/web/hooks/usePoseDetection.ts` (form error callback)

- [ ] **Step 1: Seans ekranına useVapiCoach ekle**

`apps/web/app/(dashboard)/dashboard/session/page.tsx` içine:

```tsx
import { useVapiCoach } from '@/hooks/useVapiCoach';

// Seans başlarken:
const { connect, disconnect, reportFormError, isConnected } = useVapiCoach({
  persona: userProfile?.coachPersona ?? 'supportive',
  userContext: {
    name: user.name,
    fitnessLevel: healthProfile?.fitnessLevel ?? 'intermediate',
    primaryGoal: healthProfile?.primaryGoal ?? 'general_fitness',
    activeInjuries: injuries.map(i => i.location),
    readinessScore: readiness?.score ?? 70,
    currentExercise: currentExercise.name,
    sessionNumber: totalSessionCount,
  },
});

// Pose analizi form hatası tespit edince:
onFormError={(error) => reportFormError(error.coachMessage, error.severity)}
```

- [ ] **Step 2: VAPI bağlantı göstergesi ekle**

Seans ekranına bağlantı durumu göster:
```tsx
{isConnected && (
  <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--accent-success)' }}>
    <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: 'var(--accent-success)' }} />
    Koç bağlı
  </div>
)}
```

- [ ] **Step 3: E2E manuel test**

```
1. Uygulamayı çalıştır: pnpm dev
2. Kayıt ol → Onboarding tamamla
3. Dashboard'da ReadinessScore görünüyor mu?
4. Seans başlat → VAPI bağlanıyor mu?
5. Squat yap → Form hatası olunca koç uyarıyor mu?
6. Seansı tamamla → Program güncellendi mi?
```

- [ ] **Step 4: Tip kontrolü + build**

```bash
cd apps/web && pnpm typecheck && pnpm build
```

Beklenen: 0 hata.

- [ ] **Step 5: Tüm testleri çalıştır**

```bash
pnpm test
```

- [ ] **Step 6: Final commit**

```bash
git add .
git commit -m "feat: Faz 1 complete — VAPI coach, ReadinessScore, Injury Shield, Progressive Overload, new UI"
```

---

---

## Chunk 12: Body Model & Günlük Check-in

### Task 15: Body Model API

**Files:**
- Create: `apps/web/app/api/user/body-model/route.ts`
- Modify: `apps/web/prisma/schema.prisma` (UserBodyModel modeli)

- [ ] **Step 1: UserBodyModel prisma modeli ekle**

`apps/web/prisma/schema.prisma`:
```prisma
model UserBodyModel {
  id                String   @id @default(cuid())
  userId            String   @unique
  weightKg          Float?
  heightCm          Float?
  bodyFatPct        Float?   // hesaplanan tahmini
  waistCm           Float?
  hipCm             Float?
  chestCm           Float?
  neckCm            Float?
  dominantSide      String?  // "right" | "left"
  muscleStrengths   Json?    // { "chest": 72, "back": 65, ... } 0-100 arası
  muscleWeaknesses  Json?    // aynı format
  updatedAt         DateTime @updatedAt
  user              User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

```bash
cd apps/web && npx prisma migrate dev --name "user_body_model"
npx prisma generate
```

- [ ] **Step 2: API route yaz**

`apps/web/app/api/user/body-model/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db';

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const user = await prisma.user.findUnique({ where: { clerkId: userId } });
  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const model = await prisma.userBodyModel.findUnique({ where: { userId: user.id } });
  return NextResponse.json({ model });
}

export async function PUT(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const user = await prisma.user.findUnique({ where: { clerkId: userId } });
  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const body = await req.json();

  // Vücut yağ % tahmini (Navy formülü — bel + boyun + boy)
  let bodyFatPct = body.bodyFatPct;
  if (!bodyFatPct && body.waistCm && body.neckCm && body.heightCm) {
    // Erkek için Navy formülü: 495/(1.0324-0.19077*log10(bel-boyun)+0.15456*log10(boy))-450
    const waistNeck = body.waistCm - body.neckCm;
    if (waistNeck > 0) {
      bodyFatPct = Math.round(
        495 / (1.0324 - 0.19077 * Math.log10(waistNeck) + 0.15456 * Math.log10(body.heightCm)) - 450
      );
    }
  }

  const model = await prisma.userBodyModel.upsert({
    where: { userId: user.id },
    update: { ...body, bodyFatPct },
    create: { userId: user.id, ...body, bodyFatPct },
  });

  return NextResponse.json({ model });
}
```

- [ ] **Step 3: Tip kontrolü**

```bash
cd apps/web && pnpm typecheck
```

- [ ] **Step 4: Commit**

```bash
git add apps/web/prisma/ apps/web/app/api/user/body-model/
git commit -m "feat: UserBodyModel schema and API with body fat estimation"
```

---

### Task 16: Günlük Check-in UI (30 Saniye)

**Files:**
- Create: `apps/web/components/dashboard/daily-checkin.tsx`
- Modify: `apps/web/app/(dashboard)/dashboard/page.tsx`

- [ ] **Step 1: DailyCheckin bileşeni**

`apps/web/components/dashboard/daily-checkin.tsx`:
```tsx
'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface CheckinData {
  sleepHours: number;
  stressLevel: number;
  energyLevel: number;
  painAreas: string[];
  proteinGrams: number;
}

const PAIN_AREAS = [
  { id: 'lower_back', label: 'Bel' },
  { id: 'left_knee', label: 'Sol Diz' },
  { id: 'right_knee', label: 'Sağ Diz' },
  { id: 'left_shoulder', label: 'Sol Omuz' },
  { id: 'right_shoulder', label: 'Sağ Omuz' },
  { id: 'neck', label: 'Boyun' },
];

interface Props {
  onComplete: (data: CheckinData) => void;
  onSkip: () => void;
}

export function DailyCheckin({ onComplete, onSkip }: Props) {
  const [step, setStep] = useState(0);
  const [data, setData] = useState<Partial<CheckinData>>({});

  const steps = [
    {
      question: 'Kaç saat uyudun?',
      type: 'slider' as const,
      min: 2, max: 12, unit: 'saat',
      key: 'sleepHours' as keyof CheckinData,
      defaultVal: 7,
    },
    {
      question: 'Stres seviyeni nasıl?',
      type: 'scale' as const,
      min: 1, max: 10,
      key: 'stressLevel' as keyof CheckinData,
      defaultVal: 5,
    },
    {
      question: 'Enerji seviyeni nasıl?',
      type: 'scale' as const,
      min: 1, max: 10,
      key: 'energyLevel' as keyof CheckinData,
      defaultVal: 6,
    },
  ];

  if (step >= steps.length) {
    onComplete(data as CheckinData);
    return null;
  }

  const current = steps[step];

  const handleValue = (val: number) => {
    const newData = { ...data, [current.key]: val };
    setData(newData);
    setTimeout(() => setStep(s => s + 1), 300);
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={step}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="rounded-2xl p-6"
        style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)' }}
      >
        <div className="flex justify-between items-center mb-4">
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Günlük check-in {step + 1}/{steps.length}
          </span>
          <button onClick={onSkip} className="text-xs" style={{ color: 'var(--text-muted)' }}>Atla</button>
        </div>

        <p className="text-lg font-medium mb-6" style={{ color: 'var(--text-primary)' }}>
          {current.question}
        </p>

        {current.type === 'slider' && (
          <div className="space-y-3">
            <input
              type="range" min={current.min} max={current.max} defaultValue={current.defaultVal}
              className="w-full accent-indigo-500"
              onChange={e => handleValue(Number(e.target.value))}
            />
            <div className="flex justify-between text-xs" style={{ color: 'var(--text-secondary)' }}>
              <span>{current.min} {current.unit}</span>
              <span>{current.max} {current.unit}</span>
            </div>
          </div>
        )}

        {current.type === 'scale' && (
          <div className="flex gap-2 flex-wrap">
            {Array.from({ length: 10 }, (_, i) => i + 1).map(n => (
              <button
                key={n}
                onClick={() => handleValue(n)}
                className="w-10 h-10 rounded-xl text-sm font-medium transition-all"
                style={{
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-default)',
                  color: 'var(--text-primary)',
                }}
              >
                {n}
              </button>
            ))}
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
```

- [ ] **Step 2: Dashboard'a check-in ekle**

`apps/web/app/(dashboard)/dashboard/page.tsx` içinde, sayfa yüklenince bugün check-in yapılmadıysa göster:

```tsx
// Bugün check-in var mı kontrol et
const [showCheckin, setShowCheckin] = useState(false);
useEffect(() => {
  fetch('/api/user/daily-metrics')
    .then(r => r.json())
    .then(d => { if (!d.todayCheckin) setShowCheckin(true); });
}, []);

const handleCheckinComplete = async (data: CheckinData) => {
  await fetch('/api/user/daily-metrics', {
    method: 'POST',
    body: JSON.stringify(data),
    headers: { 'Content-Type': 'application/json' },
  });
  setShowCheckin(false);
};
```

- [ ] **Step 3: Commit**

```bash
git add apps/web/components/dashboard/daily-checkin.tsx apps/web/app/(dashboard)/dashboard/
git commit -m "feat: 30-second daily check-in UI for sleep/stress/energy tracking"
```

---

### Task 17: Injury Shield Müsküler Eşleme Düzeltmesi

**Files:**
- Modify: `packages/shared-utils/src/injury-shield.ts`
- Modify: `packages/shared-utils/src/__tests__/injury-shield.test.ts`

- [ ] **Step 1: Test'e false positive case ekle**

`injury-shield.test.ts`'e ekle:
```typescript
it('does NOT block "back squat" for lower_back injury of minor severity', () => {
  // minor severity = warning, not block
  const restricted = getRestrictedMuscleGroups([
    { location: 'lower_back', severity: 'mild' }
  ]);
  // mild injury — egzersizleri filtrelemez, sadece uyarır
  expect(restricted).toHaveLength(0);
});

it('blocks deadlift for severe lower_back injury', () => {
  const restricted = getRestrictedMuscleGroups([
    { location: 'lower_back', severity: 'severe' }
  ]);
  expect(restricted.length).toBeGreaterThan(0);
});
```

- [ ] **Step 2: Severity-aware filtreleme yaz**

`injury-shield.ts` güncellemesi — mild yaralanmalarda egzersiz filtrelenmez, sadece uyarı verilir:

```typescript
export function getRestrictedMuscleGroups(injuries: Injury[]): string[] {
  const restricted = new Set<string>();
  for (const injury of injuries) {
    // Mild yaralanmalarda filtreleme yapma — sadece uyarı
    if (injury.severity === 'mild') continue;

    const muscles = INJURY_MUSCLE_MAP[injury.location] ?? [];
    muscles.forEach(m => restricted.add(m));
  }
  return Array.from(restricted);
}

export function getWarningMuscleGroups(injuries: Injury[]): string[] {
  // Mild yaralanmalar için uyarı grubu (filtrelemez, uyarır)
  const warnings = new Set<string>();
  for (const injury of injuries) {
    if (injury.severity !== 'mild') continue;
    const muscles = INJURY_MUSCLE_MAP[injury.location] ?? [];
    muscles.forEach(m => warnings.add(m));
  }
  return Array.from(warnings);
}
```

- [ ] **Step 3: Test çalıştır — PASS**

```bash
cd packages/shared-utils && npx vitest run src/__tests__/injury-shield.test.ts
```

- [ ] **Step 4: Commit**

```bash
git add packages/shared-utils/src/
git commit -m "fix: injury shield severity-aware filtering — mild injuries warn, not block"
```

---

## Özet: Faz 1 Tamamlandığında Çalışacak Özellikler

| Özellik | Durum |
|---------|-------|
| ENV güvenliği | ✅ |
| shared-utils / shared-ai / shared-hooks | ✅ |
| ML model import bug fix | ✅ |
| pgvector + yeni Prisma modelleri | ✅ |
| ReadinessScore motoru + API | ✅ |
| 1300+ egzersiz (ExerciseDB) | ✅ |
| VAPI sesli koç (4 persona) | ✅ |
| Pose-to-Voice Bridge | ✅ |
| ContextAssembler | ✅ |
| Progressive Overload algoritması | ✅ |
| Injury Shield (program filtreleme) | ✅ |
| Yeni UI token sistemi + Aurora arka plan | ✅ |
| Home Dashboard (ReadinessCard) | ✅ |
| 5 adımlı Onboarding | ✅ |
| Seans ekranı VAPI entegrasyonu | ✅ |
| UserBodyModel şema + API | ✅ |
| Günlük check-in UI (30 sn) | ✅ |
| Injury Shield severity-aware filtreleme | ✅ |
