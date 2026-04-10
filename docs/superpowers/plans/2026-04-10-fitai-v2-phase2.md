# FitAI V2 — Faz 2: Zeka Katmanı

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Sistemi gerçekten öğrenen, kişiselleşen, kullanıcıyı zamanla tanıyan bir AI koçuna dönüştürmek.

**Architecture:** pgvector uzun dönem hafıza, wearable OAuth ile Sleep-to-Train Bridge, Coach Persona öğrenme döngüsü, Injury Shield gerçek zamanlı seans koruması, Body Twin 3D görsel, Recovery Science korelasyon motoru, periodizasyon + plateau tespiti, kan tahlili PDF parse.

**Ön Koşul:** Faz 1 tamamlanmış olmalı. `UserMemoryEmbedding`, pgvector extension, `UserBodyModel`, VAPI koç çalışıyor olmalı.

**Tech Stack:** pgvector (Supabase), OpenAI `text-embedding-3-small`, Three.js + React Three Fiber, PDF.js, Apple Health Connect API, Garmin Connect OAuth, Fitbit OAuth

**Spec:** `docs/superpowers/specs/2026-04-10-fitai-v2-design.md` — Faz 2 bölümü

---

## Chunk 1: Uzun Dönem Hafıza (pgvector)

### Task 1: Memory Embedding Pipeline

**Files:**
- Create: `packages/shared-ai/src/memory-writer.ts`
- Create: `packages/shared-ai/src/__tests__/memory-writer.test.ts`
- Create: `apps/web/app/api/sessions/[id]/complete/route.ts` (Faz 1'deki route'a ekleme)
- Create: `apps/web/lib/embeddings/client.ts`

- [ ] **Step 1: Embedding client yaz**

`apps/web/lib/embeddings/client.ts`:
```typescript
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function createEmbedding(text: string): Promise<number[]> {
  const res = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text,
  });
  return res.data[0].embedding; // 1536 boyutlu vektör
}
```

- [ ] **Step 2: Failing test yaz**

`packages/shared-ai/src/__tests__/memory-writer.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import { buildSessionSummary } from '../memory-writer';

describe('buildSessionSummary', () => {
  it('includes key session metrics in summary', () => {
    const summary = buildSessionSummary({
      exercises: ['squat', 'bench press'],
      avgFormScore: 78,
      totalVolume: 4200,
      duration: 52,
      personalRecords: ['squat: 100kg'],
      readinessAtStart: 72,
    });
    expect(summary).toContain('squat');
    expect(summary).toContain('78');
    expect(summary).toContain('52 dakika');
    expect(summary).toContain('kişisel rekor');
  });

  it('keeps summary under 500 chars for embedding efficiency', () => {
    const summary = buildSessionSummary({
      exercises: ['deadlift', 'row', 'pull-up', 'curl', 'face pull'],
      avgFormScore: 65,
      totalVolume: 6000,
      duration: 70,
      personalRecords: [],
      readinessAtStart: 55,
    });
    expect(summary.length).toBeLessThan(500);
  });
});
```

- [ ] **Step 3: Test çalıştır — FAIL**

```bash
cd packages/shared-ai && npx vitest run src/__tests__/memory-writer.test.ts
```

- [ ] **Step 4: Memory writer implementasyonu**

`packages/shared-ai/src/memory-writer.ts`:
```typescript
export interface SessionSummaryInput {
  exercises: string[];
  avgFormScore: number;
  totalVolume: number;
  duration: number;
  personalRecords: string[];
  readinessAtStart: number;
}

export function buildSessionSummary(input: SessionSummaryInput): string {
  const parts = [
    `Seans: ${input.exercises.slice(0, 3).join(', ')}${input.exercises.length > 3 ? ` +${input.exercises.length - 3}` : ''}`,
    `${input.duration} dakika`,
    `Form: ${input.avgFormScore}/100`,
    `Hacim: ${input.totalVolume}kg`,
    `Hazırlık: ${input.readinessAtStart}/100`,
  ];

  if (input.personalRecords.length > 0) {
    parts.push(`kişisel rekor: ${input.personalRecords[0]}`);
  }

  return parts.join(' | ').slice(0, 480);
}

export interface WeeklySummaryInput {
  sessionsCompleted: number;
  avgFormScore: number;
  avgReadiness: number;
  totalVolume: number;
  muscleGroupsWorked: string[];
  weekNumber: number;
}

export function buildWeeklySummary(input: WeeklySummaryInput): string {
  return [
    `Hafta ${input.weekNumber}:`,
    `${input.sessionsCompleted} seans`,
    `ort. form ${input.avgFormScore}/100`,
    `ort. hazırlık ${input.avgReadiness}/100`,
    `toplam hacim ${input.totalVolume}kg`,
    `çalışılan kaslar: ${input.muscleGroupsWorked.slice(0, 4).join(', ')}`,
  ].join(' | ').slice(0, 480);
}
```

- [ ] **Step 5: Test çalıştır — PASS**

```bash
cd packages/shared-ai && npx vitest run src/__tests__/memory-writer.test.ts
```

- [ ] **Step 6: Seans tamamlama route'una embedding kaydetme ekle**

`apps/web/app/api/sessions/[id]/complete/route.ts` içinde, seans kapanırken:
```typescript
import { buildSessionSummary } from '@fitai/shared-ai';
import { createEmbedding } from '@/lib/embeddings/client';

// Seans tamamlandıktan sonra:
const summary = buildSessionSummary({
  exercises: session.completedSets.map(s => s.exerciseId),
  avgFormScore: Math.round(mean(session.completedSets.map(s => s.formScore ?? 70))),
  totalVolume: session.completedSets.reduce((s, set) => s + set.repsCompleted * (set.weightKg ?? 1), 0),
  duration: Math.round((Date.now() - session.createdAt.getTime()) / 60000),
  personalRecords: [], // Faz 2'de PR tespiti eklenecek
  readinessAtStart: 70, // ReadinessScore'dan alınacak
});

const embedding = await createEmbedding(summary);

await prisma.userMemoryEmbedding.create({
  data: {
    userId: user.id,
    content: summary,
    embedding: embedding as any, // pgvector type
    type: 'SESSION_SUMMARY',
  },
});
```

- [ ] **Step 7: pgvector similarity search fonksiyonu**

`apps/web/lib/embeddings/search.ts`:
```typescript
import { prisma } from '../db';
import { createEmbedding } from './client';

export async function searchRelevantMemories(
  userId: string,
  query: string,
  limit = 3
): Promise<string[]> {
  const queryEmbedding = await createEmbedding(query);

  // pgvector cosine similarity search
  const results = await prisma.$queryRaw<Array<{ content: string }>>`
    SELECT content
    FROM "UserMemoryEmbedding"
    WHERE "userId" = ${userId}
    ORDER BY embedding <=> ${queryEmbedding}::vector
    LIMIT ${limit}
  `;

  return results.map(r => r.content);
}
```

- [ ] **Step 8: ContextAssembler'a L3 hafıza ekle**

`packages/shared-ai/src/context-assembler.ts` `buildContextString`'e L3 parametresi ekle:
```typescript
interface AssembleOptions {
  // ... mevcut ...
  longTermMemories?: string[]; // L3 — pgvector'dan gelen en alakalı geçmiş seanslar
}

// buildContextString içinde:
if (opts.longTermMemories?.length) {
  parts.push(`[GEÇMİŞ SEANSLAR]\n${opts.longTermMemories.join('\n')}`);
}
```

- [ ] **Step 9: Commit**

```bash
git add packages/shared-ai/src/ apps/web/lib/embeddings/ apps/web/app/api/sessions/
git commit -m "feat: long-term memory — session summaries stored as pgvector embeddings"
```

---

### Task 2: Haftalık Özet Cron Job

**Files:**
- Create: `apps/web/app/api/cron/weekly-summary/route.ts`

- [ ] **Step 1: Haftalık özet cron route'u**

`apps/web/app/api/cron/weekly-summary/route.ts`:
```typescript
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { buildWeeklySummary } from '@fitai/shared-ai';
import { createEmbedding } from '@/lib/embeddings/client';

export async function POST(req: Request) {
  // Vercel Cron güvenliği
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const users = await prisma.user.findMany({ select: { id: true } });
  let processed = 0;

  for (const user of users) {
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const sessions = await prisma.workoutSession.findMany({
      where: { userId: user.id, completedAt: { gte: weekAgo } },
      include: { completedSets: true },
    });

    if (sessions.length === 0) continue;

    const avgFormScore = Math.round(
      sessions.flatMap(s => s.completedSets.map(set => set.formScore ?? 70))
        .reduce((a, b) => a + b, 0) / Math.max(sessions.flatMap(s => s.completedSets).length, 1)
    );

    const summary = buildWeeklySummary({
      sessionsCompleted: sessions.length,
      avgFormScore,
      avgReadiness: 70, // DailyMetrics ortalaması — basit versiyon
      totalVolume: sessions.reduce((sum, s) =>
        sum + s.completedSets.reduce((sv, set) => sv + set.repsCompleted * (set.weightKg ?? 1), 0), 0),
      muscleGroupsWorked: [],
      weekNumber: Math.ceil((Date.now() - new Date(user.createdAt ?? Date.now()).getTime()) / (7 * 24 * 60 * 60 * 1000)),
    });

    const embedding = await createEmbedding(summary);

    await prisma.userMemoryEmbedding.create({
      data: {
        userId: user.id,
        content: summary,
        embedding: embedding as any,
        type: 'WEEKLY_SUMMARY',
      },
    });

    processed++;
  }

  return NextResponse.json({ processed });
}
```

- [ ] **Step 2: `vercel.json`'a cron ekle**

`apps/web/vercel.json` (yoksa oluştur):
```json
{
  "crons": [
    {
      "path": "/api/cron/weekly-summary",
      "schedule": "0 6 * * 1"
    }
  ]
}
```

- [ ] **Step 3: Commit**

```bash
git add apps/web/app/api/cron/weekly-summary/ apps/web/vercel.json
git commit -m "feat: weekly memory summary cron job — Mondays 06:00"
```

---

## Chunk 2: Wearable OAuth — Sleep-to-Train Bridge

### Task 3: Apple Health Connect Web API

**Files:**
- Create: `apps/web/app/api/wearables/apple/callback/route.ts`
- Create: `apps/web/app/api/wearables/apple/connect/route.ts`
- Create: `apps/web/lib/wearables/apple-health.ts`
- Modify: `apps/web/prisma/schema.prisma` (WearableDevice.accessToken şifreli)

- [ ] **Step 1: WearableDevice'a token alanları ekle**

`schema.prisma` WearableDevice modeline:
```prisma
model WearableDevice {
  // ... mevcut ...
  accessToken   String?  // şifreli saklanır
  refreshToken  String?  // şifreli saklanır
  tokenExpiry   DateTime?
  scope         String?
}
```

```bash
cd apps/web && npx prisma migrate dev --name "wearable_tokens"
npx prisma generate
```

- [ ] **Step 2: Apple Health Connect client**

`apps/web/lib/wearables/apple-health.ts`:
```typescript
// Apple Health Connect (web) — Health Connect REST API

const HEALTH_CONNECT_BASE = 'https://health.apple.com/v1';

export interface SleepData {
  date: string;
  totalHours: number;
  deepSleepHours: number;
  remHours: number;
  quality: number; // 0-100
}

export interface HRVData {
  date: string;
  avgHRV: number;
  restingHeartRate: number;
}

export async function fetchSleepData(
  accessToken: string,
  startDate: Date,
  endDate: Date
): Promise<SleepData[]> {
  const res = await fetch(`${HEALTH_CONNECT_BASE}/sleep?start=${startDate.toISOString()}&end=${endDate.toISOString()}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) throw new Error(`Apple Health API error: ${res.status}`);
  const data = await res.json();

  return data.samples.map((s: any) => ({
    date: s.startDate.split('T')[0],
    totalHours: s.value,
    deepSleepHours: s.deepSleep ?? 0,
    remHours: s.rem ?? 0,
    quality: Math.min(100, Math.round((s.value / 8) * 100)),
  }));
}

export async function fetchHRVData(
  accessToken: string,
  date: Date
): Promise<HRVData | null> {
  const res = await fetch(`${HEALTH_CONNECT_BASE}/hrv?date=${date.toISOString().split('T')[0]}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) return null;
  const data = await res.json();

  return {
    date: date.toISOString().split('T')[0],
    avgHRV: data.average,
    restingHeartRate: data.restingHeartRate,
  };
}
```

- [ ] **Step 3: OAuth connect route**

`apps/web/app/api/wearables/apple/connect/route.ts`:
```typescript
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const params = new URLSearchParams({
    client_id: process.env.APPLE_HEALTH_CLIENT_ID!,
    redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/wearables/apple/callback`,
    scope: 'health.sleep health.heartRate health.hrv',
    response_type: 'code',
    state: userId, // CSRF koruması için
  });

  return NextResponse.redirect(`https://appleid.apple.com/auth/authorize?${params}`);
}
```

- [ ] **Step 4: OAuth callback route**

`apps/web/app/api/wearables/apple/callback/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  const clerkId = searchParams.get('state');

  if (!code || !clerkId) return NextResponse.redirect('/dashboard/devices?error=missing_params');

  // Token exchange
  const tokenRes = await fetch('https://appleid.apple.com/auth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.APPLE_HEALTH_CLIENT_ID!,
      client_secret: process.env.APPLE_HEALTH_CLIENT_SECRET!,
      code,
      grant_type: 'authorization_code',
      redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/wearables/apple/callback`,
    }),
  });

  if (!tokenRes.ok) return NextResponse.redirect('/dashboard/devices?error=token_exchange_failed');

  const tokens = await tokenRes.json();

  const user = await prisma.user.findUnique({ where: { clerkId } });
  if (!user) return NextResponse.redirect('/dashboard/devices?error=user_not_found');

  await prisma.wearableDevice.upsert({
    where: { userId_deviceType: { userId: user.id, deviceType: 'APPLE_WATCH' } },
    update: {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      tokenExpiry: new Date(Date.now() + tokens.expires_in * 1000),
      isConnected: true,
    },
    create: {
      userId: user.id,
      deviceType: 'APPLE_WATCH',
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      tokenExpiry: new Date(Date.now() + tokens.expires_in * 1000),
      isConnected: true,
    },
  });

  return NextResponse.redirect('/dashboard/devices?connected=apple');
}
```

- [ ] **Step 5: `.env.example`'a Apple credentials ekle**

```env
APPLE_HEALTH_CLIENT_ID=
APPLE_HEALTH_CLIENT_SECRET=
```

- [ ] **Step 6: Commit**

```bash
git add apps/web/lib/wearables/ apps/web/app/api/wearables/apple/ apps/web/prisma/
git commit -m "feat: Apple Health Connect OAuth integration for sleep and HRV data"
```

---

### Task 4: Sabah Otomatik Uyku Sync + ReadinessScore Güncelleme

**Files:**
- Create: `apps/web/app/api/cron/morning-sync/route.ts`
- Modify: `apps/web/app/api/readiness/route.ts`

- [ ] **Step 1: Sabah sync cron job**

`apps/web/app/api/cron/morning-sync/route.ts`:
```typescript
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { fetchSleepData, fetchHRVData } from '@/lib/wearables/apple-health';

export async function POST(req: Request) {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const today = new Date();

  // Apple Watch bağlı kullanıcıları bul
  const devices = await prisma.wearableDevice.findMany({
    where: { deviceType: 'APPLE_WATCH', isConnected: true, accessToken: { not: null } },
    include: { user: true },
  });

  let synced = 0;

  for (const device of devices) {
    try {
      const [sleepData, hrvData] = await Promise.all([
        fetchSleepData(device.accessToken!, yesterday, today),
        fetchHRVData(device.accessToken!, yesterday),
      ]);

      const lastSleep = sleepData[sleepData.length - 1];

      // DailyMetrics güncelle
      if (lastSleep) {
        await prisma.dailyMetrics.upsert({
          where: {
            userId_date: {
              userId: device.userId,
              date: new Date(lastSleep.date),
            },
          },
          update: {
            sleepHours: lastSleep.totalHours,
            sleepQuality: lastSleep.quality,
          },
          create: {
            userId: device.userId,
            date: new Date(lastSleep.date),
            sleepHours: lastSleep.totalHours,
            sleepQuality: lastSleep.quality,
          },
        });
      }

      // WearableReading kaydet (HRV)
      if (hrvData) {
        await prisma.wearableReading.create({
          data: {
            deviceId: device.id,
            type: 'HRV',
            value: hrvData.avgHRV,
            recordedAt: new Date(hrvData.date),
          },
        });
      }

      synced++;
    } catch (err) {
      console.error(`Sync failed for user ${device.userId}:`, err);
    }
  }

  return NextResponse.json({ synced });
}
```

- [ ] **Step 2: `vercel.json`'a morning sync cron ekle**

```json
{
  "crons": [
    { "path": "/api/cron/weekly-summary", "schedule": "0 6 * * 1" },
    { "path": "/api/cron/morning-sync",   "schedule": "0 7 * * *" }
  ]
}
```

- [ ] **Step 3: ReadinessScore route'unu gerçek HRV verisiyle güncelle**

`apps/web/app/api/readiness/route.ts` içinde HRV hesaplamasını güncelle:
```typescript
// Faz 1'deki null yerine gerçek HRV verisi:
const last30HRV = await prisma.wearableReading.findMany({
  where: { device: { userId: user.id }, type: 'HRV' },
  orderBy: { recordedAt: 'desc' },
  take: 30,
});

let hrvDelta: number | null = null;
if (last30HRV.length >= 7) {
  const avg30 = last30HRV.reduce((s, r) => s + r.value, 0) / last30HRV.length;
  const todayHRV = last30HRV[0]?.value;
  if (todayHRV && avg30 > 0) {
    hrvDelta = (todayHRV - avg30) / avg30; // -1 to +1
  }
}
```

- [ ] **Step 4: Commit**

```bash
git add apps/web/app/api/cron/morning-sync/ apps/web/app/api/readiness/ apps/web/vercel.json
git commit -m "feat: morning sync cron — auto pulls sleep+HRV from wearables at 07:00"
```

---

### Task 5: Garmin + Fitbit OAuth (Aynı Pattern)

**Files:**
- Create: `apps/web/lib/wearables/garmin.ts`
- Create: `apps/web/lib/wearables/fitbit.ts`
- Create: `apps/web/app/api/wearables/garmin/connect/route.ts`
- Create: `apps/web/app/api/wearables/garmin/callback/route.ts`
- Create: `apps/web/app/api/wearables/fitbit/connect/route.ts`
- Create: `apps/web/app/api/wearables/fitbit/callback/route.ts`

- [ ] **Step 1: Fitbit OAuth (OAuth 2.0 PKCE)**

`apps/web/lib/wearables/fitbit.ts`:
```typescript
const FITBIT_BASE = 'https://api.fitbit.com/1/user/-';

export async function fetchFitbitSleep(accessToken: string, date: string) {
  const res = await fetch(`${FITBIT_BASE}/sleep/date/${date}.json`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error(`Fitbit API error: ${res.status}`);
  const data = await res.json();
  const main = data.sleep?.[0];
  if (!main) return null;

  return {
    date,
    totalHours: main.minutesAsleep / 60,
    deepSleepHours: (main.levels?.summary?.deep?.minutes ?? 0) / 60,
    remHours: (main.levels?.summary?.rem?.minutes ?? 0) / 60,
    quality: main.efficiency, // Fitbit 0-100 sleep efficiency
  };
}

export async function fetchFitbitHRV(accessToken: string, date: string) {
  const res = await fetch(`${FITBIT_BASE}/hrv/date/${date}.json`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) return null;
  const data = await res.json();
  return { avgHRV: data.hrv?.[0]?.value?.dailyRmssd ?? null };
}
```

Garmin için aynı pattern — Garmin Connect API kullanır. Connect/Callback route'ları Apple ile özdeş, sadece `client_id`, endpoint ve `deviceType` değişir.

- [ ] **Step 2: `.env.example` güncelle**

```env
GARMIN_CLIENT_ID=
GARMIN_CLIENT_SECRET=
FITBIT_CLIENT_ID=
FITBIT_CLIENT_SECRET=
```

- [ ] **Step 3: Commit**

```bash
git add apps/web/lib/wearables/ apps/web/app/api/wearables/
git commit -m "feat: Garmin + Fitbit OAuth integration for sleep and HRV data"
```

---

## Chunk 3: Coach Persona Öğrenme Döngüsü

### Task 6: Persona Geri Bildirimi + Otomatik Seçim

**Files:**
- Create: `apps/web/app/api/user/coach-persona/route.ts`
- Create: `apps/web/components/session/persona-feedback.tsx`
- Modify: `apps/web/prisma/schema.prisma` (CoachPersonaScore modeli)

- [ ] **Step 1: CoachPersonaScore modeli**

```prisma
model CoachPersonaScore {
  id        String   @id @default(cuid())
  userId    String
  persona   String   // "military" | "scientific" | "supportive" | "friendly"
  score     Float    @default(0)  // kümülatif puan
  sessions  Int      @default(0)  // kaç seansta kullanıldı
  updatedAt DateTime @updatedAt
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, persona])
}
```

```bash
cd apps/web && npx prisma migrate dev --name "coach_persona_score"
npx prisma generate
```

- [ ] **Step 2: Failing test yaz**

`apps/web/lib/coach/__tests__/persona-selector.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import { selectBestPersona } from '../persona-selector';

describe('selectBestPersona', () => {
  it('returns highest scoring persona after 3+ sessions', () => {
    const scores = [
      { persona: 'military',   score: 2.1, sessions: 3 },
      { persona: 'supportive', score: 4.2, sessions: 3 },
      { persona: 'scientific', score: 1.8, sessions: 1 },
      { persona: 'friendly',   score: 3.0, sessions: 2 },
    ];
    expect(selectBestPersona(scores, 4)).toBe('supportive');
  });

  it('returns "supportive" default when fewer than 3 sessions', () => {
    expect(selectBestPersona([], 1)).toBe('supportive');
    expect(selectBestPersona([], 2)).toBe('supportive');
  });

  it('requires minimum 3 sessions before auto-selecting', () => {
    const scores = [
      { persona: 'military', score: 10, sessions: 2 }, // 2 seans — yetersiz
    ];
    expect(selectBestPersona(scores, 2)).toBe('supportive'); // default
  });
});
```

- [ ] **Step 3: Test çalıştır — FAIL**

```bash
cd apps/web && npx vitest run lib/coach/__tests__/persona-selector.test.ts
```

- [ ] **Step 4: Persona selector implementasyonu**

`apps/web/lib/coach/persona-selector.ts`:
```typescript
type Persona = 'military' | 'scientific' | 'supportive' | 'friendly';

interface PersonaScore {
  persona: string;
  score: number;
  sessions: number;
}

const MIN_SESSIONS_FOR_AUTO_SELECT = 3;
const DEFAULT_PERSONA: Persona = 'supportive';

export function selectBestPersona(
  scores: PersonaScore[],
  totalSessions: number
): Persona {
  if (totalSessions < MIN_SESSIONS_FOR_AUTO_SELECT) return DEFAULT_PERSONA;

  const eligible = scores.filter(s => s.sessions >= MIN_SESSIONS_FOR_AUTO_SELECT);
  if (eligible.length === 0) return DEFAULT_PERSONA;

  const best = eligible.reduce((a, b) => a.score > b.score ? a : b);
  return best.persona as Persona;
}
```

- [ ] **Step 5: Test çalıştır — PASS**

```bash
cd apps/web && npx vitest run lib/coach/__tests__/persona-selector.test.ts
```

- [ ] **Step 6: Persona geri bildirim API**

`apps/web/app/api/user/coach-persona/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db';
import { selectBestPersona } from '@/lib/coach/persona-selector';

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { persona, rating } = await req.json(); // rating: 1-5
  const user = await prisma.user.findUnique({ where: { clerkId: userId } });
  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // Puan güncelle (kümülatif ortalama)
  await prisma.coachPersonaScore.upsert({
    where: { userId_persona: { userId: user.id, persona } },
    update: {
      score: { increment: rating },
      sessions: { increment: 1 },
    },
    create: { userId: user.id, persona, score: rating, sessions: 1 },
  });

  // Toplam seans sayısı
  const totalSessions = await prisma.workoutSession.count({
    where: { userId: user.id },
  });

  // 3+ seanstan sonra otomatik en iyi persona seç
  const allScores = await prisma.coachPersonaScore.findMany({
    where: { userId: user.id },
  });

  const bestPersona = selectBestPersona(allScores, totalSessions);

  // Kullanıcının preferred persona'sını güncelle
  if (totalSessions >= 3) {
    await prisma.healthProfile.update({
      where: { userId: user.id },
      data: { preferredCoachPersona: bestPersona } as any,
    });
  }

  return NextResponse.json({ bestPersona });
}

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const user = await prisma.user.findUnique({ where: { clerkId: userId } });
  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const totalSessions = await prisma.workoutSession.count({ where: { userId: user.id } });
  const scores = await prisma.coachPersonaScore.findMany({ where: { userId: user.id } });
  const persona = selectBestPersona(scores, totalSessions);

  return NextResponse.json({ persona, totalSessions, scores });
}
```

- [ ] **Step 7: Seans sonu persona geri bildirim UI**

`apps/web/components/session/persona-feedback.tsx`:
```tsx
'use client';

import { useState } from 'react';

interface Props {
  persona: string;
  onRated: (rating: number) => void;
}

const EMOJI_RATINGS = ['😞', '😐', '🙂', '😊', '🤩'];

export function PersonaFeedback({ persona, onRated }: Props) {
  const [selected, setSelected] = useState<number | null>(null);

  const handleRate = async (rating: number) => {
    setSelected(rating);
    await fetch('/api/user/coach-persona', {
      method: 'POST',
      body: JSON.stringify({ persona, rating }),
      headers: { 'Content-Type': 'application/json' },
    });
    setTimeout(() => onRated(rating), 500);
  };

  return (
    <div className="text-center space-y-4">
      <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
        Koçluk tarzı nasıldı?
      </p>
      <div className="flex justify-center gap-3">
        {EMOJI_RATINGS.map((emoji, i) => (
          <button
            key={i}
            onClick={() => handleRate(i + 1)}
            className={`text-2xl p-2 rounded-xl transition-all ${selected === i + 1 ? 'scale-125' : 'hover:scale-110'}`}
            style={{
              background: selected === i + 1 ? 'var(--accent-primary)' : 'var(--bg-surface)',
            }}
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 8: Commit**

```bash
git add apps/web/lib/coach/ apps/web/app/api/user/coach-persona/ apps/web/components/session/ apps/web/prisma/
git commit -m "feat: Coach Persona learning loop — auto-selects best style after 3 sessions"
```

---

## Chunk 4: Body Twin 3D

### Task 7: Three.js Anatomik Model

**Files:**
- Modify: `apps/web/components/ar/SkeletonViewer3D.tsx` (mevcut bileşeni genişlet)
- Create: `apps/web/components/body-twin/body-twin-viewer.tsx`
- Create: `apps/web/components/body-twin/muscle-tooltip.tsx`
- Create: `apps/web/app/api/user/muscle-scores/route.ts`

- [ ] **Step 1: Kas grubu skor API'si**

`apps/web/app/api/user/muscle-scores/route.ts`:
```typescript
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db';

// Kas grubu → 0-100 arası skor (form geçmişinden hesaplanır)
export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const user = await prisma.user.findUnique({ where: { clerkId: userId } });
  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // Son 30 günlük tamamlanmış setler
  const sets = await prisma.completedSet.findMany({
    where: {
      workoutSession: {
        userId: user.id,
        completedAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      },
    },
    include: { exercise: { select: { target: true, bodyPart: true } } },
  });

  // Kas grubu başına ortalama form skoru
  const muscleFormScores: Record<string, number[]> = {};
  for (const set of sets) {
    const muscle = set.exercise?.target ?? 'unknown';
    if (!muscleFormScores[muscle]) muscleFormScores[muscle] = [];
    muscleFormScores[muscle].push(set.formScore ?? 60);
  }

  const scores: Record<string, number> = {};
  for (const [muscle, formScores] of Object.entries(muscleFormScores)) {
    scores[muscle] = Math.round(formScores.reduce((a, b) => a + b, 0) / formScores.length);
  }

  // Aktif yaralanmaları da ekle
  const injuries = await prisma.injury.findMany({
    where: { userId: user.id, isActive: true },
    select: { location: true },
  });

  return NextResponse.json({ scores, injuredAreas: injuries.map(i => i.location) });
}
```

- [ ] **Step 2: Body Twin viewer bileşeni**

`apps/web/components/body-twin/body-twin-viewer.tsx`:
```tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { MuscleTooltip } from './muscle-tooltip';

interface MuscleScores {
  scores: Record<string, number>;
  injuredAreas: string[];
}

// Renk skor'a göre: kırmızı=düşük, sarı=orta, yeşil=yüksek, mor=yaralanma
function scoreToColor(score: number, isInjured: boolean): string {
  if (isInjured) return '#8B5CF6'; // mor
  if (score >= 75) return '#10B981'; // yeşil
  if (score >= 50) return '#6366F1'; // indigo
  if (score >= 25) return '#F59E0B'; // sarı
  return '#EF4444'; // kırmızı
}

export function BodyTwinViewer() {
  const [data, setData] = useState<MuscleScores | null>(null);
  const [hoveredMuscle, setHoveredMuscle] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/user/muscle-scores').then(r => r.json()).then(setData);
  }, []);

  if (!data) return (
    <div className="w-full h-96 flex items-center justify-center"
      style={{ background: 'var(--bg-elevated)', borderRadius: 16 }}>
      <div className="animate-pulse" style={{ color: 'var(--text-secondary)' }}>
        Beden modeli yükleniyor...
      </div>
    </div>
  );

  return (
    <div className="relative w-full h-96 rounded-2xl overflow-hidden"
      style={{ background: 'var(--bg-elevated)' }}>

      <Canvas camera={{ position: [0, 0, 3], fov: 50 }}>
        <ambientLight intensity={0.6} />
        <directionalLight position={[2, 4, 2]} intensity={0.8} />
        <OrbitControls enableZoom={false} enablePan={false} />

        {/* Basit silindir torso — gerçek anatomik model Faz 3'te */}
        <BodyMesh
          muscleScores={data.scores}
          injuredAreas={data.injuredAreas}
          onHover={setHoveredMuscle}
        />
      </Canvas>

      {hoveredMuscle && (
        <MuscleTooltip
          muscle={hoveredMuscle}
          score={data.scores[hoveredMuscle] ?? 50}
          isInjured={data.injuredAreas.some(a => a.includes(hoveredMuscle))}
        />
      )}

      {/* Renk açıklaması */}
      <div className="absolute bottom-4 left-4 flex gap-3 text-xs"
        style={{ color: 'var(--text-secondary)' }}>
        {[
          { color: '#10B981', label: 'Güçlü' },
          { color: '#F59E0B', label: 'Orta' },
          { color: '#EF4444', label: 'Zayıf' },
          { color: '#8B5CF6', label: 'Yaralanma' },
        ].map(item => (
          <div key={item.label} className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full" style={{ background: item.color }} />
            {item.label}
          </div>
        ))}
      </div>
    </div>
  );
}

// Basit Three.js mesh — kas gruplarını renklendirir
function BodyMesh({ muscleScores, injuredAreas, onHover }: {
  muscleScores: Record<string, number>;
  injuredAreas: string[];
  onHover: (muscle: string | null) => void;
}) {
  // Temel anatomik bölgeler — basit geometri
  const regions = [
    { id: 'chest',    pos: [0, 0.3, 0.15] as [number,number,number],  scale: [0.4, 0.25, 0.1] as [number,number,number] },
    { id: 'back',     pos: [0, 0.3, -0.15] as [number,number,number], scale: [0.4, 0.25, 0.1] as [number,number,number] },
    { id: 'quads',    pos: [0.1, -0.4, 0] as [number,number,number],  scale: [0.12, 0.3, 0.12] as [number,number,number] },
    { id: 'quads',    pos: [-0.1, -0.4, 0] as [number,number,number], scale: [0.12, 0.3, 0.12] as [number,number,number] },
    { id: 'delts',    pos: [0.35, 0.35, 0] as [number,number,number], scale: [0.1, 0.1, 0.1] as [number,number,number] },
    { id: 'delts',    pos: [-0.35, 0.35, 0] as [number,number,number],scale: [0.1, 0.1, 0.1] as [number,number,number] },
    { id: 'core',     pos: [0, 0, 0] as [number,number,number],       scale: [0.3, 0.2, 0.12] as [number,number,number] },
  ];

  return (
    <>
      {regions.map((r, i) => {
        const score = muscleScores[r.id] ?? 50;
        const isInjured = injuredAreas.some(a => a.includes(r.id));
        const color = scoreToColor(score, isInjured);

        return (
          <mesh
            key={i}
            position={r.pos}
            scale={r.scale}
            onPointerEnter={() => onHover(r.id)}
            onPointerLeave={() => onHover(null)}
          >
            <boxGeometry />
            <meshStandardMaterial color={color} roughness={0.4} metalness={0.1} />
          </mesh>
        );
      })}
    </>
  );
}
```

- [ ] **Step 3: Muscle tooltip bileşeni**

`apps/web/components/body-twin/muscle-tooltip.tsx`:
```tsx
interface Props {
  muscle: string;
  score: number;
  isInjured: boolean;
}

const MUSCLE_NAMES_TR: Record<string, string> = {
  chest: 'Göğüs', back: 'Sırt', quads: 'Ön Uyluk', hamstrings: 'Arka Uyluk',
  delts: 'Omuz', glutes: 'Kalça', core: 'Karın', biceps: 'Biceps',
  triceps: 'Triceps', calves: 'Baldır', 'lower back': 'Bel',
};

export function MuscleTooltip({ muscle, score, isInjured }: Props) {
  return (
    <div className="absolute top-4 right-4 rounded-xl p-3 text-sm"
      style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-default)' }}>
      <p className="font-medium" style={{ color: 'var(--text-primary)' }}>
        {MUSCLE_NAMES_TR[muscle] ?? muscle}
      </p>
      {isInjured ? (
        <p style={{ color: '#8B5CF6' }}>⚠ Aktif yaralanma</p>
      ) : (
        <p style={{ color: 'var(--text-secondary)' }}>Form skoru: {score}/100</p>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Body Twin sayfasına ekle**

`apps/web/app/(dashboard)/dashboard/ar/page.tsx` içine `BodyTwinViewer` ekle.

- [ ] **Step 5: Commit**

```bash
git add apps/web/components/body-twin/ apps/web/app/api/user/muscle-scores/ apps/web/app/(dashboard)/dashboard/ar/
git commit -m "feat: Body Twin 3D viewer — color-coded muscle strength map with injury overlay"
```

---

## Chunk 5: Recovery Science

### Task 8: Recovery Modality Takibi + Korelasyon

**Files:**
- Create: `apps/web/app/api/recovery/route.ts`
- Create: `apps/web/components/dashboard/recovery-log.tsx`
- Modify: `apps/web/prisma/schema.prisma` (RecoveryLog modeli)
- Create: `apps/web/app/api/recovery/correlation/route.ts`

- [ ] **Step 1: RecoveryLog modeli**

```prisma
model RecoveryLog {
  id          String       @id @default(cuid())
  userId      String
  type        RecoveryType
  durationMin Int?
  date        DateTime     @default(now())
  notes       String?
  user        User         @relation(fields: [userId], references: [id], onDelete: Cascade)
}

enum RecoveryType {
  COLD_SHOWER
  ICE_BATH
  SAUNA
  FOAM_ROLLING
  MASSAGE
  STRETCHING
  BREATHING
  ACTIVE_RECOVERY
  MEDITATION
}
```

```bash
cd apps/web && npx prisma migrate dev --name "recovery_log"
npx prisma generate
```

- [ ] **Step 2: Recovery API**

`apps/web/app/api/recovery/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db';

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const user = await prisma.user.findUnique({ where: { clerkId: userId } });
  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const { type, durationMin, notes } = await req.json();

  const log = await prisma.recoveryLog.create({
    data: { userId: user.id, type, durationMin, notes },
  });

  return NextResponse.json({ log });
}

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const user = await prisma.user.findUnique({ where: { clerkId: userId } });
  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const logs = await prisma.recoveryLog.findMany({
    where: { userId: user.id },
    orderBy: { date: 'desc' },
    take: 30,
  });

  return NextResponse.json({ logs });
}
```

- [ ] **Step 3: Korelasyon analizi**

`apps/web/app/api/recovery/correlation/route.ts`:
```typescript
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db';

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const user = await prisma.user.findUnique({ where: { clerkId: userId } });
  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // Son 60 gün recovery logları ve ertesi gün form skorları
  const recoveryLogs = await prisma.recoveryLog.findMany({
    where: { userId: user.id, date: { gte: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000) } },
  });

  const correlations: Array<{ type: string; avgNextDayFormScore: number; count: number }> = [];

  for (const type of ['SAUNA', 'COLD_SHOWER', 'FOAM_ROLLING', 'STRETCHING'] as const) {
    const logsOfType = recoveryLogs.filter(l => l.type === type);
    if (logsOfType.length < 3) continue;

    const nextDayScores: number[] = [];

    for (const log of logsOfType) {
      const nextDay = new Date(log.date.getTime() + 24 * 60 * 60 * 1000);
      const dayAfter = new Date(nextDay.getTime() + 24 * 60 * 60 * 1000);

      const sessions = await prisma.workoutSession.findMany({
        where: {
          userId: user.id,
          completedAt: { gte: nextDay, lt: dayAfter },
        },
        include: { completedSets: true },
      });

      if (sessions.length === 0) continue;

      const avgForm = sessions
        .flatMap(s => s.completedSets.map(set => set.formScore ?? 70))
        .reduce((a, b) => a + b, 0) / Math.max(sessions.flatMap(s => s.completedSets).length, 1);

      nextDayScores.push(avgForm);
    }

    if (nextDayScores.length > 0) {
      correlations.push({
        type,
        avgNextDayFormScore: Math.round(nextDayScores.reduce((a, b) => a + b, 0) / nextDayScores.length),
        count: nextDayScores.length,
      });
    }
  }

  // Sıralı — en yüksek etki en üstte
  correlations.sort((a, b) => b.avgNextDayFormScore - a.avgNextDayFormScore);

  return NextResponse.json({ correlations });
}
```

- [ ] **Step 4: Recovery log UI**

`apps/web/components/dashboard/recovery-log.tsx` — Recovery tiplerini ikon listesi olarak göster, tıkla kaydet:
```tsx
'use client';

import { useState } from 'react';

const RECOVERY_TYPES = [
  { id: 'SAUNA', label: 'Sauna', icon: '🔥' },
  { id: 'COLD_SHOWER', label: 'Soğuk Duş', icon: '🧊' },
  { id: 'FOAM_ROLLING', label: 'Foam Roller', icon: '🔵' },
  { id: 'STRETCHING', label: 'Esneme', icon: '🧘' },
  { id: 'ACTIVE_RECOVERY', label: 'Aktif Recovery', icon: '🚶' },
  { id: 'BREATHING', label: 'Nefes', icon: '💨' },
];

export function RecoveryLog() {
  const [logged, setLogged] = useState<string[]>([]);

  const logRecovery = async (type: string) => {
    await fetch('/api/recovery', {
      method: 'POST',
      body: JSON.stringify({ type }),
      headers: { 'Content-Type': 'application/json' },
    });
    setLogged(prev => [...prev, type]);
  };

  return (
    <div className="rounded-2xl p-5"
      style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)' }}>
      <p className="text-sm font-medium mb-4" style={{ color: 'var(--text-secondary)' }}>
        Bugünkü recovery
      </p>
      <div className="grid grid-cols-3 gap-2">
        {RECOVERY_TYPES.map(rt => (
          <button
            key={rt.id}
            onClick={() => logRecovery(rt.id)}
            className="p-3 rounded-xl text-center transition-all"
            style={{
              background: logged.includes(rt.id) ? 'var(--accent-recovery)' : 'var(--bg-surface)',
              border: `1px solid ${logged.includes(rt.id) ? 'var(--accent-recovery)' : 'var(--border-default)'}`,
              opacity: logged.includes(rt.id) ? 1 : 0.8,
            }}
          >
            <div className="text-xl">{rt.icon}</div>
            <div className="text-xs mt-1" style={{ color: 'var(--text-primary)' }}>{rt.label}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Commit**

```bash
git add apps/web/prisma/ apps/web/app/api/recovery/ apps/web/components/dashboard/recovery-log.tsx
git commit -m "feat: Recovery Science — log modalities and correlate with next-day form scores"
```

---

## Chunk 6: Periodizasyon + Plateau Tespiti

### Task 9: Mezo Döngü + Deload Otomasyonu

**Files:**
- Create: `packages/shared-utils/src/periodization.ts`
- Create: `packages/shared-utils/src/__tests__/periodization.test.ts`
- Create: `apps/web/app/api/program/check-plateau/route.ts`

- [ ] **Step 1: Failing test yaz**

`packages/shared-utils/src/__tests__/periodization.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import { detectPlateau, shouldDeload, calculateMesoCycleWeek } from '../periodization';

describe('detectPlateau', () => {
  it('detects plateau when weight unchanged for 3+ weeks', () => {
    const history = [
      { week: 1, weightKg: 100 },
      { week: 2, weightKg: 100 },
      { week: 3, weightKg: 100 },
    ];
    expect(detectPlateau(history)).toBe(true);
  });

  it('no plateau when weight is increasing', () => {
    const history = [
      { week: 1, weightKg: 95 },
      { week: 2, weightKg: 97.5 },
      { week: 3, weightKg: 100 },
    ];
    expect(detectPlateau(history)).toBe(false);
  });

  it('no plateau with fewer than 3 data points', () => {
    expect(detectPlateau([{ week: 1, weightKg: 100 }, { week: 2, weightKg: 100 }])).toBe(false);
  });
});

describe('shouldDeload', () => {
  it('recommends deload at week 5 of a 4-week meso cycle', () => {
    expect(shouldDeload({ currentWeek: 5, mesoCycleWeeks: 4 })).toBe(true);
  });

  it('does not recommend deload mid-cycle', () => {
    expect(shouldDeload({ currentWeek: 2, mesoCycleWeeks: 4 })).toBe(false);
  });
});
```

- [ ] **Step 2: Test çalıştır — FAIL**

```bash
cd packages/shared-utils && npx vitest run src/__tests__/periodization.test.ts
```

- [ ] **Step 3: Periodizasyon implementasyonu**

`packages/shared-utils/src/periodization.ts`:
```typescript
interface WeeklyLoad {
  week: number;
  weightKg: number;
}

export function detectPlateau(history: WeeklyLoad[]): boolean {
  if (history.length < 3) return false;
  const last3 = history.slice(-3);
  const allSame = last3.every(h => Math.abs(h.weightKg - last3[0].weightKg) < 2.5);
  return allSame;
}

export function shouldDeload(params: { currentWeek: number; mesoCycleWeeks: number }): boolean {
  return params.currentWeek > params.mesoCycleWeeks;
}

export function calculateDeloadLoad(normalLoad: number): number {
  return Math.round(normalLoad * 0.6 * 4) / 4; // %60, 2.5kg'a yuvarla
}

export function calculateMesoCycleWeek(programStartDate: Date, mesoCycleWeeks: number): number {
  const weeksSinceStart = Math.floor(
    (Date.now() - programStartDate.getTime()) / (7 * 24 * 60 * 60 * 1000)
  );
  return (weeksSinceStart % (mesoCycleWeeks + 1)) + 1; // +1 deload haftası için
}
```

- [ ] **Step 4: Test çalıştır — PASS**

```bash
cd packages/shared-utils && npx vitest run src/__tests__/periodization.test.ts
```

- [ ] **Step 5: Plateau check API**

`apps/web/app/api/program/check-plateau/route.ts`:
```typescript
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db';
import { detectPlateau, shouldDeload } from '@fitai/shared-utils';

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const user = await prisma.user.findUnique({ where: { clerkId: userId } });
  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const program = await prisma.workoutProgram.findFirst({
    where: { userId: user.id, status: 'ACTIVE' },
  });

  if (!program) return NextResponse.json({ plateau: false, deload: false });

  const deload = shouldDeload({
    currentWeek: program.currentWeek,
    mesoCycleWeeks: program.mesoCycleWeeks,
  });

  // Squat için plateau kontrolü (temsili)
  const squatHistory = await prisma.completedSet.findMany({
    where: {
      exercise: { name: { contains: 'squat', mode: 'insensitive' } },
      workoutSession: { userId: user.id },
    },
    orderBy: { completedAt: 'desc' },
    take: 9, // 3 hafta × 3 seans
    select: { weightKg: true, completedAt: true },
  });

  // Haftalara böl
  const weeklyMax: Record<number, number> = {};
  squatHistory.forEach(set => {
    const weekNum = Math.floor((Date.now() - set.completedAt.getTime()) / (7 * 24 * 60 * 60 * 1000));
    if (!weeklyMax[weekNum] || (set.weightKg ?? 0) > weeklyMax[weekNum]) {
      weeklyMax[weekNum] = set.weightKg ?? 0;
    }
  });

  const history = Object.entries(weeklyMax)
    .map(([week, weightKg]) => ({ week: Number(week), weightKg }))
    .sort((a, b) => a.week - b.week);

  const plateau = detectPlateau(history);

  return NextResponse.json({ plateau, deload, currentWeek: program.currentWeek });
}
```

- [ ] **Step 6: Commit**

```bash
git add packages/shared-utils/src/ apps/web/app/api/program/
git commit -m "feat: periodization engine — plateau detection and automatic deload scheduling"
```

---

## Chunk 7: Kan Tahlili PDF Parse

### Task 10: PDF Parse + Mikro Besin Takibi

**Files:**
- Create: `apps/web/app/api/health/blood-test/route.ts`
- Create: `apps/web/lib/health/blood-test-parser.ts`
- Modify: `apps/web/prisma/schema.prisma` (BloodTestResult modeli)

- [ ] **Step 1: BloodTestResult modeli**

```prisma
model BloodTestResult {
  id          String   @id @default(cuid())
  userId      String
  testDate    DateTime
  results     Json     // { "vitaminD": 22, "iron": 85, "b12": 310, ... }
  rawText     String?  // parse edilen ham metin
  createdAt   DateTime @default(now())
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

```bash
cd apps/web && npx prisma migrate dev --name "blood_test_result"
npx prisma generate
```

- [ ] **Step 2: Blood test parser**

`apps/web/lib/health/blood-test-parser.ts`:
```typescript
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface BloodTestValues {
  vitaminD?: number;      // ng/mL
  vitaminB12?: number;    // pg/mL
  iron?: number;          // mcg/dL
  ferritin?: number;      // ng/mL
  hemoglobin?: number;    // g/dL
  tsh?: number;           // mIU/L (tiroit)
  testosterone?: number;  // ng/dL (erkek)
  magnesium?: number;     // mg/dL
  zinc?: number;          // mcg/dL
  omega3Index?: number;   // %
}

export interface BloodTestDeficiency {
  marker: string;
  value: number;
  unit: string;
  referenceMin: number;
  referenceMax: number;
  status: 'low' | 'normal' | 'high';
  recommendation: string;
}

export async function parseBloodTestPDF(
  base64Image: string // PDF'in ilk sayfası base64 görüntü olarak
): Promise<BloodTestValues> {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [{
      role: 'user',
      content: [
        {
          type: 'text',
          text: `Bu kan tahlili sonucundan şu değerleri çıkar (varsa):
vitaminD (ng/mL), vitaminB12 (pg/mL), iron (mcg/dL), ferritin (ng/mL),
hemoglobin (g/dL), tsh (mIU/L), testosterone (ng/dL), magnesium (mg/dL), zinc (mcg/dL).

SADECE JSON olarak döndür. Eksik değerler için null kullan. Örnek:
{"vitaminD": 22.5, "vitaminB12": null, "hemoglobin": 14.2}`
        },
        { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${base64Image}` } },
      ],
    }],
    max_tokens: 500,
  });

  const content = response.choices[0].message.content ?? '{}';
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return {};

  try {
    return JSON.parse(jsonMatch[0]);
  } catch {
    return {};
  }
}

// Referans aralıkları ve öneriler
const REFERENCE_RANGES: Record<keyof BloodTestValues, { min: number; max: number; unit: string; lowRec: string }> = {
  vitaminD:    { min: 30, max: 100, unit: 'ng/mL', lowRec: 'D3 vitamini takviyesi (2000-4000 IU/gün) ve güneş ışığı alımını artır.' },
  vitaminB12:  { min: 200, max: 900, unit: 'pg/mL', lowRec: 'B12 takviyesi veya kırmızı et, yumurta tüketimini artır.' },
  iron:        { min: 60, max: 170, unit: 'mcg/dL', lowRec: 'Kırmızı et, ıspanak, baklagil tüket. C vitaminiyle birlikte al.' },
  ferritin:    { min: 20, max: 250, unit: 'ng/mL', lowRec: 'Demir takviyesi ve demir zengin besinler.' },
  hemoglobin:  { min: 13.5, max: 17.5, unit: 'g/dL', lowRec: 'Demir ve B12 eksikliğini kontrol et, doktora danış.' },
  tsh:         { min: 0.4, max: 4.0, unit: 'mIU/L', lowRec: 'Tiroit fonksiyonu için endokrinologa danış.' },
  testosterone:{ min: 300, max: 1000, unit: 'ng/dL', lowRec: 'Uyku, stres yönetimi ve çinko tüketimini optimize et.' },
  magnesium:   { min: 1.7, max: 2.3, unit: 'mg/dL', lowRec: 'Magnesium glisinato takviyesi, kuruyemiş ve yeşil yapraklı sebze tüket.' },
  zinc:        { min: 70, max: 120, unit: 'mcg/dL', lowRec: 'Çinko takviyesi, et ve deniz ürünleri tüketimini artır.' },
  omega3Index: { min: 8, max: 12, unit: '%', lowRec: 'Haftada 2-3 yağlı balık veya Omega-3 takviyesi (EPA+DHA).' },
};

export function analyzeDeficiencies(values: BloodTestValues): BloodTestDeficiency[] {
  const deficiencies: BloodTestDeficiency[] = [];

  for (const [key, range] of Object.entries(REFERENCE_RANGES)) {
    const value = values[key as keyof BloodTestValues];
    if (value === null || value === undefined) continue;

    let status: 'low' | 'normal' | 'high' = 'normal';
    if (value < range.min) status = 'low';
    else if (value > range.max) status = 'high';

    deficiencies.push({
      marker: key,
      value,
      unit: range.unit,
      referenceMin: range.min,
      referenceMax: range.max,
      status,
      recommendation: status === 'low' ? range.lowRec : '',
    });
  }

  return deficiencies.filter(d => d.status !== 'normal');
}
```

- [ ] **Step 3: Blood test upload API**

`apps/web/app/api/health/blood-test/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db';
import { parseBloodTestPDF, analyzeDeficiencies } from '@/lib/health/blood-test-parser';

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const user = await prisma.user.findUnique({ where: { clerkId: userId } });
  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const formData = await req.formData();
  const file = formData.get('file') as File;

  if (!file) return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });

  // Güvenlik: sadece PDF veya JPG, max 5MB
  if (!['application/pdf', 'image/jpeg', 'image/png'].includes(file.type)) {
    return NextResponse.json({ error: 'Invalid file type' }, { status: 400 });
  }
  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: 'File too large (max 5MB)' }, { status: 400 });
  }

  // Base64 dönüştür
  const buffer = await file.arrayBuffer();
  const base64 = Buffer.from(buffer).toString('base64');

  // GPT-4o ile parse et
  const values = await parseBloodTestPDF(base64);
  const deficiencies = analyzeDeficiencies(values);

  // Kaydet
  const result = await prisma.bloodTestResult.create({
    data: {
      userId: user.id,
      testDate: new Date(),
      results: values as any,
    },
  });

  return NextResponse.json({ result, deficiencies });
}

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const user = await prisma.user.findUnique({ where: { clerkId: userId } });
  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const latest = await prisma.bloodTestResult.findFirst({
    where: { userId: user.id },
    orderBy: { testDate: 'desc' },
  });

  if (!latest) return NextResponse.json({ result: null, deficiencies: [] });

  const deficiencies = analyzeDeficiencies(latest.results as any);
  return NextResponse.json({ result: latest, deficiencies });
}
```

- [ ] **Step 4: Commit**

```bash
git add apps/web/lib/health/ apps/web/app/api/health/blood-test/ apps/web/prisma/
git commit -m "feat: blood test PDF parsing with GPT-4o Vision and deficiency analysis"
```

---

## Chunk 8: Final Entegrasyon & Test

### Task 11: Faz 2 Entegrasyon Testi

**Files:**
- Test: tüm yeni API route'ları

- [ ] **Step 1: Hafıza pipeline uçtan uca test**

```bash
# Bir seans tamamla → /api/sessions/[id]/complete çağrısı
# DB'de UserMemoryEmbedding kaydı oluştu mu?
cd apps/web && npx prisma studio
# UserMemoryEmbedding tablosunda kayıt var mı kontrol et
```

- [ ] **Step 2: ReadinessScore wearable datası ile test**

```bash
# DailyMetrics'e manuel uyku verisi ekle
# /api/readiness çağır → wearable HRV ile çalışıyor mu?
curl http://localhost:3000/api/readiness
```

- [ ] **Step 3: Body Twin kas skorları**

```bash
# 5 seans tamamla → /api/user/muscle-scores çağır
# Skorlar 50'den farklı mi?
curl http://localhost:3000/api/user/muscle-scores
```

- [ ] **Step 4: Plateau detection**

```bash
# Aynı ağırlıkta 3 seans kaydet
curl http://localhost:3000/api/program/check-plateau
# plateau: true beklenir
```

- [ ] **Step 5: Tip kontrolü + build**

```bash
cd apps/web && pnpm typecheck && pnpm build
```

Beklenen: 0 hata.

- [ ] **Step 6: Tüm testler**

```bash
pnpm test
```

- [ ] **Step 7: Final commit**

```bash
git add .
git commit -m "feat: Faz 2 complete — long-term memory, wearable OAuth, persona learning, Body Twin, Recovery Science, periodization, blood test parsing"
```

---

## Özet: Faz 2 Tamamlandığında Çalışacak Özellikler

| Özellik | Durum |
|---------|-------|
| pgvector uzun dönem hafıza | ✅ |
| Seans sonrası embedding kaydı | ✅ |
| Haftalık özet cron job | ✅ |
| Apple Health Connect OAuth | ✅ |
| Garmin + Fitbit OAuth | ✅ |
| Sabah otomatik uyku/HRV sync | ✅ |
| Coach Persona öğrenme döngüsü | ✅ |
| Body Twin 3D kas haritası | ✅ |
| Recovery Science log + korelasyon | ✅ |
| Periodizasyon + plateau tespiti | ✅ |
| Deload otomasyonu | ✅ |
| Kan tahlili PDF parse | ✅ |
| Mikro besin eksiklik analizi | ✅ |
