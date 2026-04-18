# Production Hardening Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Analiz sonuçlarında tespit edilen kritik güvenlik, güvenilirlik ve kod kalitesi sorunlarını gidererek uygulamayı production'a hazır hale getirmek.

**Architecture:** Her görev bağımsız, test-first (TDD) yaklaşımıyla uygulanır. Her fix kendi commit'ini alır. Büyük bir refactor yok — sadece tespit edilen sorunların minimum değişiklikle giderilmesi.

**Tech Stack:** Next.js 15, TypeScript 5.8, Zod, Vitest, Pino logger, Prisma

---

## Chunk 1: Input Validation & Security

### Task 1: Base64 Image Validation — mealAnalyzeSchema

**Sorun:** `mealAnalyzeSchema.imageBase64` sadece `z.string().min(1)` yapıyor. SVG injection, gizlenmiş payloads, dev boyutlu dosyalar gönderilerek sisteme zarar verilebilir.

**Files:**

- Modify: `apps/web/lib/validation/schemas.ts`
- Modify: `apps/web/__tests__/lib/validation.test.ts`

- [ ] **Step 1: Failing test yaz**

`apps/web/__tests__/lib/validation.test.ts` dosyasına ekle:

```typescript
describe('mealAnalyzeSchema - imageBase64 validation', () => {
  it('rejects empty string', () => {
    const result = mealAnalyzeSchema.safeParse({ imageBase64: '' })
    expect(result.success).toBe(false)
  })

  it('rejects non-base64 string', () => {
    const result = mealAnalyzeSchema.safeParse({ imageBase64: 'not-base64!!!' })
    expect(result.success).toBe(false)
  })

  it('rejects oversized base64 (> 5MB)', () => {
    const big = 'A'.repeat(7 * 1024 * 1024) // 7MB
    const result = mealAnalyzeSchema.safeParse({ imageBase64: big })
    expect(result.success).toBe(false)
  })

  it('accepts valid base64 string', () => {
    const valid = Buffer.from('fake image data').toString('base64')
    const result = mealAnalyzeSchema.safeParse({ imageBase64: valid })
    expect(result.success).toBe(true)
  })
})
```

- [ ] **Step 2: Testi çalıştır, fail olduğunu doğrula**

```bash
cd apps/web && npx vitest run __tests__/lib/validation.test.ts
```

Expected: FAIL — "rejects non-base64" ve "rejects oversized" testleri geçmemeli.

- [ ] **Step 3: Schema'yı güncelle**

`apps/web/lib/validation/schemas.ts` içindeki `mealAnalyzeSchema`'yı değiştir:

```typescript
// Base64 regex: sadece A-Z, a-z, 0-9, +, /, = karakterleri
const BASE64_REGEX = /^[A-Za-z0-9+/]+=*$/
const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024 // 5MB → base64 ~6.7MB string

export const mealAnalyzeSchema = z.object({
  imageBase64: z
    .string()
    .min(1, 'Görsel boş olamaz')
    .max(MAX_IMAGE_SIZE_BYTES * 1.4, 'Görsel 5MB limitini aşıyor') // base64 ~%37 büyütür
    .refine((val) => BASE64_REGEX.test(val), 'Geçersiz base64 formatı'),
  mealType: z.enum(['breakfast', 'lunch', 'dinner', 'snack']).optional(),
})
```

- [ ] **Step 4: Testleri çalıştır, pass olduğunu doğrula**

```bash
cd apps/web && npx vitest run __tests__/lib/validation.test.ts
```

Expected: tüm testler PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/web/lib/validation/schemas.ts apps/web/__tests__/lib/validation.test.ts
git commit -m "fix(security): add strict base64 validation and size limit to meal analyze schema"
```

---

### Task 2: Onboarding Route — Güvenli JSON Parse

**Sorun:** `/api/onboarding` route'unda `req.json()` try/catch içinde değil. Malformed JSON gelirse unhandled exception fırlar.

**Files:**

- Modify: `apps/web/app/api/onboarding/route.ts`
- Create: `apps/web/__tests__/api/onboarding/onboarding.test.ts`

- [ ] **Step 1: Failing test yaz**

```typescript
// apps/web/__tests__/api/onboarding/onboarding.test.ts
import { POST } from '@/app/api/onboarding/route'
import { NextRequest } from 'next/server'
import { vi } from 'vitest'

vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn().mockResolvedValue({ userId: 'user_test123' }),
}))

vi.mock('@/lib/db/client', () => ({
  db: {
    user: { findUnique: vi.fn().mockResolvedValue({ id: 'db-user-1', clerkId: 'user_test123' }) },
    healthProfile: { upsert: vi.fn().mockResolvedValue({}) },
    injury: { updateMany: vi.fn(), createMany: vi.fn() },
  },
}))

describe('POST /api/onboarding', () => {
  it('returns 400 for malformed JSON body', async () => {
    const req = new NextRequest('http://localhost/api/onboarding', {
      method: 'POST',
      body: '{ invalid json !!!',
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toBeDefined()
  })

  it('returns 200 for valid onboarding data', async () => {
    const req = new NextRequest('http://localhost/api/onboarding', {
      method: 'POST',
      body: JSON.stringify({ fitnessLevel: 'beginner', goals: ['lose_weight'], injuries: [] }),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await POST(req)
    expect(res.status).toBe(200)
  })
})
```

- [ ] **Step 2: Testi çalıştır, fail olduğunu doğrula**

```bash
cd apps/web && npx vitest run __tests__/api/onboarding/onboarding.test.ts
```

Expected: FAIL — malformed JSON testi 500 dönüyor, 400 bekleniyordu.

- [ ] **Step 3: Route'u güncelle**

`apps/web/app/api/onboarding/route.ts` dosyasında POST handler başına ekle:

```typescript
// req.json() yerine güvenli parse
let body: Record<string, unknown>
try {
  body = await req.json()
} catch {
  return NextResponse.json({ error: 'Geçersiz JSON formatı' }, { status: 400 })
}
const {
  fitnessLevel,
  goals,
  sessionDuration,
  injuries,
  equipment,
  age,
  weightKg,
  heightCm,
  gender,
} = body
```

Mevcut `const body = await req.json()` ve destructuring satırlarını yukarıdakiyle değiştir.

- [ ] **Step 4: Testleri çalıştır, pass olduğunu doğrula**

```bash
cd apps/web && npx vitest run __tests__/api/onboarding/onboarding.test.ts
```

Expected: 2/2 PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/web/app/api/onboarding/route.ts apps/web/__tests__/api/onboarding/onboarding.test.ts
git commit -m "fix(security): handle malformed JSON in onboarding route with 400 response"
```

---

## Chunk 2: Infrastructure & Observability

### Task 3: /api/ping — Health Check Endpoint

**Sorun:** Load balancer, Kubernetes ve monitoring sistemleri için sağlık kontrolü endpoint'i yok. Mevcut `/api/health` kullanıcıya özel bir route, sistem sağlığını ölçmüyor.

**Files:**

- Create: `apps/web/app/api/ping/route.ts`
- Create: `apps/web/__tests__/api/ping/ping.test.ts`

- [ ] **Step 1: Failing test yaz**

```typescript
// apps/web/__tests__/api/ping/ping.test.ts
import { GET } from '@/app/api/ping/route'
import { NextRequest } from 'next/server'

describe('GET /api/ping', () => {
  it('returns 200 with status ok', async () => {
    const req = new NextRequest('http://localhost/api/ping')
    const res = await GET(req)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.status).toBe('ok')
    expect(body.timestamp).toBeDefined()
  })

  it('returns version if env is set', async () => {
    process.env.npm_package_version = '1.0.0'
    const req = new NextRequest('http://localhost/api/ping')
    const res = await GET(req)
    const body = await res.json()
    expect(body.version).toBeDefined()
  })
})
```

- [ ] **Step 2: Testi çalıştır, fail olduğunu doğrula**

```bash
cd apps/web && npx vitest run __tests__/api/ping/ping.test.ts
```

Expected: FAIL — route yok.

- [ ] **Step 3: Endpoint oluştur**

```typescript
// apps/web/app/api/ping/route.ts
import { NextResponse } from 'next/server'

export const runtime = 'nodejs'
// No auth — public health check endpoint
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version ?? 'unknown',
  })
}
```

- [ ] **Step 4: Testleri çalıştır, pass olduğunu doğrula**

```bash
cd apps/web && npx vitest run __tests__/api/ping/ping.test.ts
```

Expected: 2/2 PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/web/app/api/ping/route.ts apps/web/__tests__/api/ping/ping.test.ts
git commit -m "feat(infra): add /api/ping health check endpoint for load balancer and monitoring"
```

---

### Task 4: console.error → logger Migration

**Sorun:** Apple Health connect/callback ve diğer route'larda `console.error` kullanılıyor. Bu loglar Pino'nun yapılandırılmış log pipeline'ına girmez, Sentry entegrasyonundan geçmez.

**Files:**

- Modify: `apps/web/app/api/wearables/apple/connect/route.ts`
- Modify: `apps/web/app/api/wearables/apple/callback/route.ts`

Bu iki dosyadaki tüm `console.error(...)` çağrılarını `logger.error(...)` ile değiştir.

- [ ] **Step 1: connect/route.ts güncelle**

```typescript
// Ekle (dosyanın üstüne):
import { logger } from '@/lib/logger'

// Değiştir:
// console.error("[Apple Connect]", error)
logger.error({ err: error }, '[Apple Connect] failed to initiate connection')
```

- [ ] **Step 2: callback/route.ts güncelle**

```typescript
// Ekle:
import { logger } from '@/lib/logger'

// Değiştir:
// console.error('[Apple Callback]', error)
logger.error({ err: error }, '[Apple Callback] failed to connect Apple Health')
```

- [ ] **Step 3: Kalan console.error'ları tara**

```bash
cd apps/web && grep -rn "console\.error\|console\.log\|console\.warn" app/api/ --include="*.ts"
```

Çıktıda kalan her `console.*` için aynı dönüşümü uygula.

- [ ] **Step 4: Build kontrolü**

```bash
cd apps/web && npx tsc --noEmit
```

Expected: TypeScript hata yok.

- [ ] **Step 5: Commit**

```bash
git add apps/web/app/api/wearables/
git commit -m "fix(observability): replace console.error with structured logger in wearable routes"
```

---

### Task 5: Silent Failure Logging

**Sorun:** `writeSessionMemory({...}).catch(() => {})` fire-and-forget pattern hata loglamıyor. Hafıza sistemi sessizce başarısız olabilir.

**Files:**

- Modify: `apps/web/app/api/ai/coach-message/route.ts`
- Modify: `apps/web/app/api/sessions/[id]/route.ts` (veya hangi dosyada fire-and-forget varsa)

- [ ] **Step 1: Fire-and-forget lokasyonlarını bul**

```bash
cd apps/web && grep -rn "\.catch(() => {})\|\.catch((_) => {})\|\.catch((e) => {})" app/ lib/ --include="*.ts"
```

- [ ] **Step 2: Her `.catch(() => {})` satırını güncelle**

```typescript
// Önce:
writeSessionMemory(data).catch(() => {})

// Sonra:
writeSessionMemory(data).catch((err) => {
  logger.error({ err }, 'writeSessionMemory: fire-and-forget failed silently')
})
```

- [ ] **Step 3: TypeScript kontrolü**

```bash
cd apps/web && npx tsc --noEmit
```

- [ ] **Step 4: Commit**

```bash
git add -p  # sadece ilgili dosyaları seç
git commit -m "fix(observability): log errors in fire-and-forget memory operations instead of swallowing"
```

---

## Chunk 3: API Quality

### Task 6: Standart API Response Helper

**Sorun:** Route'lar `{ success, data }`, `{ error }`, `{ message }` gibi farklı response formatları dönüyor. Frontend'de tutarlı hata yakalama zor.

**Files:**

- Create: `apps/web/lib/api/response.ts`
- Create: `apps/web/__tests__/lib/api-response.test.ts`

- [ ] **Step 1: Failing test yaz**

```typescript
// apps/web/__tests__/lib/api-response.test.ts
import { apiSuccess, apiError } from '@/lib/api/response'

describe('apiSuccess', () => {
  it('returns 200 with data and timestamp', async () => {
    const res = apiSuccess({ name: 'test' })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.data).toEqual({ name: 'test' })
    expect(body.timestamp).toBeDefined()
  })

  it('accepts custom status code', async () => {
    const res = apiSuccess({ id: 1 }, 201)
    expect(res.status).toBe(201)
  })
})

describe('apiError', () => {
  it('returns error with message and status', async () => {
    const res = apiError('Not found', 404)
    expect(res.status).toBe(404)
    const body = await res.json()
    expect(body.error).toBe('Not found')
    expect(body.timestamp).toBeDefined()
  })

  it('includes errorCode if provided', async () => {
    const res = apiError('Limit aşıldı', 429, 'LIMIT_REACHED')
    const body = await res.json()
    expect(body.errorCode).toBe('LIMIT_REACHED')
  })
})
```

- [ ] **Step 2: Testi çalıştır, fail olduğunu doğrula**

```bash
cd apps/web && npx vitest run __tests__/lib/api-response.test.ts
```

Expected: FAIL — modül yok.

- [ ] **Step 3: Helper oluştur**

```typescript
// apps/web/lib/api/response.ts
import { NextResponse } from 'next/server'

export function apiSuccess<T>(data: T, status = 200) {
  return NextResponse.json({ data, timestamp: new Date().toISOString() }, { status })
}

export function apiError(message: string, status: number, errorCode?: string) {
  return NextResponse.json(
    { error: message, ...(errorCode ? { errorCode } : {}), timestamp: new Date().toISOString() },
    { status }
  )
}
```

- [ ] **Step 4: Testleri çalıştır, pass olduğunu doğrula**

```bash
cd apps/web && npx vitest run __tests__/lib/api-response.test.ts
```

Expected: 4/4 PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/web/lib/api/response.ts apps/web/__tests__/lib/api-response.test.ts
git commit -m "feat(api): add standardized apiSuccess/apiError response helpers"
```

---

### Task 7: AI Route Testleri — coach-message

**Sorun:** `/api/ai/coach-message` hiç test edilmemiş. Rate limiting, auth, input validation yanıtları doğrulanmamış.

**Files:**

- Create: `apps/web/__tests__/api/ai/coach-message.test.ts`
- Read first: `apps/web/app/api/ai/coach-message/route.ts`

- [ ] **Step 1: Route'u oku**

```bash
cat apps/web/app/api/ai/coach-message/route.ts
```

- [ ] **Step 2: Failing testler yaz**

```typescript
// apps/web/__tests__/api/ai/coach-message.test.ts
import { POST } from '@/app/api/ai/coach-message/route'
import { NextRequest } from 'next/server'
import { vi } from 'vitest'

vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn().mockResolvedValue({ userId: null }), // default: unauthenticated
}))
vi.mock('@/lib/redis/ratelimit-middleware', () => ({
  withAiRateLimit: vi.fn().mockResolvedValue(null),
}))
vi.mock('@/lib/db/client', () => ({
  db: { user: { findUnique: vi.fn() }, subscription: { update: vi.fn() } },
}))
vi.mock('@/lib/ai/client', () => ({
  openai: { chat: { completions: { create: vi.fn() } } },
}))
vi.mock('@/lib/memory', () => ({
  retrieveMemoryContext: vi.fn().mockResolvedValue([]),
  injectMemoryIntoPrompt: vi.fn((p) => p),
}))

const { auth } = await import('@clerk/nextjs/server')
const { db } = await import('@/lib/db/client')
const { openai } = await import('@/lib/ai/client')

describe('POST /api/ai/coach-message', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 401 when not authenticated', async () => {
    vi.mocked(auth).mockResolvedValue({ userId: null } as any)
    const req = new NextRequest('http://localhost/api/ai/coach-message', {
      method: 'POST',
      body: JSON.stringify({
        exercise: 'squat',
        repCount: 5,
        targetReps: 10,
        setNumber: 1,
        totalSets: 3,
      }),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await POST(req)
    expect(res.status).toBe(401)
  })

  it('returns 400 for invalid input', async () => {
    vi.mocked(auth).mockResolvedValue({ userId: 'user_123' } as any)
    const req = new NextRequest('http://localhost/api/ai/coach-message', {
      method: 'POST',
      body: JSON.stringify({ exercise: '' }), // invalid
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('returns 404 when user not found in DB', async () => {
    vi.mocked(auth).mockResolvedValue({ userId: 'user_123' } as any)
    vi.mocked(db.user.findUnique).mockResolvedValue(null)
    const req = new NextRequest('http://localhost/api/ai/coach-message', {
      method: 'POST',
      body: JSON.stringify({
        exercise: 'squat',
        repCount: 5,
        targetReps: 10,
        setNumber: 1,
        totalSets: 3,
      }),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await POST(req)
    expect(res.status).toBe(404)
  })
})
```

- [ ] **Step 3: Testleri çalıştır**

```bash
cd apps/web && npx vitest run __tests__/api/ai/coach-message.test.ts
```

Expected: Mock yapısına göre bazı pass, bazı fail. Route yapısına göre mock'ları düzelt.

- [ ] **Step 4: Tüm testler pass olana kadar mock'ları ayarla**

- [ ] **Step 5: Commit**

```bash
git add apps/web/__tests__/api/ai/coach-message.test.ts
git commit -m "test(ai): add auth, validation, and user-not-found tests for coach-message route"
```

---

### Task 8: AI Route Testleri — analyze-meal

**Files:**

- Create: `apps/web/__tests__/api/ai/analyze-meal.test.ts`

- [ ] **Step 1: Failing testler yaz**

```typescript
// apps/web/__tests__/api/ai/analyze-meal.test.ts
import { POST } from '@/app/api/ai/analyze-meal/route'
import { NextRequest } from 'next/server'
import { vi } from 'vitest'

vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn().mockResolvedValue({ userId: null }),
}))
vi.mock('@/lib/redis/ratelimit-middleware', () => ({
  withAiRateLimit: vi.fn().mockResolvedValue(null),
}))
vi.mock('@/lib/db/client', () => ({
  db: {
    user: { findUnique: vi.fn() },
    subscription: { update: vi.fn() },
    mealLog: { create: vi.fn().mockResolvedValue({}) },
  },
}))
vi.mock('@/lib/ai/client', () => ({
  openai: { chat: { completions: { create: vi.fn() } } },
}))
vi.mock('@/lib/memory', () => ({
  retrieveMemoryContext: vi.fn().mockResolvedValue([]),
  injectMemoryIntoPrompt: vi.fn((p) => p),
}))

const { auth } = await import('@clerk/nextjs/server')
const { db } = await import('@/lib/db/client')
const { openai } = await import('@/lib/ai/client')

const validBase64 = Buffer.from('fake image').toString('base64')

describe('POST /api/ai/analyze-meal', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 401 when unauthenticated', async () => {
    const req = new NextRequest('http://localhost/api/ai/analyze-meal', {
      method: 'POST',
      body: JSON.stringify({ imageBase64: validBase64 }),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await POST(req)
    expect(res.status).toBe(401)
  })

  it('returns 400 for invalid base64', async () => {
    vi.mocked(auth).mockResolvedValue({ userId: 'user_123' } as any)
    const req = new NextRequest('http://localhost/api/ai/analyze-meal', {
      method: 'POST',
      body: JSON.stringify({ imageBase64: 'not!!valid!!base64' }),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('returns 200 with analysis on success', async () => {
    vi.mocked(auth).mockResolvedValue({ userId: 'user_123' } as any)
    vi.mocked(db.user.findUnique).mockResolvedValue({
      id: 'db-1',
      clerkId: 'user_123',
      subscriptionTier: 'STANDARD',
      subscription: { id: 'sub-1', aiMealsUsed: 0, usageResetAt: new Date(Date.now() - 1000) },
    } as any)
    vi.mocked(openai.chat.completions.create).mockResolvedValue({
      choices: [{ message: { content: JSON.stringify({ foodItems: [], totalCalories: 500 }) } }],
    } as any)

    const req = new NextRequest('http://localhost/api/ai/analyze-meal', {
      method: 'POST',
      body: JSON.stringify({ imageBase64: validBase64, mealType: 'lunch' }),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await POST(req)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.success).toBe(true)
  })
})
```

- [ ] **Step 2: Testleri çalıştır ve pass olana kadar düzelt**

```bash
cd apps/web && npx vitest run __tests__/api/ai/analyze-meal.test.ts
```

- [ ] **Step 3: Commit**

```bash
git add apps/web/__tests__/api/ai/analyze-meal.test.ts
git commit -m "test(ai): add auth, base64 validation, and success path tests for analyze-meal route"
```

---

## Chunk 4: Final Verification

### Task 9: Tam Test Suite Çalıştır

- [ ] **Step 1: Tüm testleri çalıştır**

```bash
cd apps/web && npx vitest run
```

Expected: Önceki 524+ test + yeni testler, hepsi PASS.

- [ ] **Step 2: TypeScript kontrolü**

```bash
cd apps/web && npx tsc --noEmit
```

Expected: 0 hata.

- [ ] **Step 3: Özet**

Başarıyla tamamlanan işler:

1. ✅ Base64 validation + size limit (güvenlik)
2. ✅ Onboarding JSON parse güvenliği
3. ✅ `/api/ping` health check endpoint
4. ✅ console.error → structured logger
5. ✅ Silent failure logging
6. ✅ Standart API response helper
7. ✅ coach-message route testleri
8. ✅ analyze-meal route testleri

---

## Sonraki Adımlar (Bu Plan Kapsamı Dışında)

Aşağıdakiler ayrı planlar olarak ele alınmalı:

1. **Leaderboard refactor** — `entries: Json` → ayrı `LeaderboardEntry` tablosu
2. **Pagination** — cursor-based pagination tüm liste endpoint'lerine
3. **OpenAPI** — Swagger/OpenAPI dokümantasyonu
4. **Load testing** — k6 scripts
5. **Backup stratejisi** — PostgreSQL PITR setup
6. **Monitoring alerting** — Grafana/Datadog kuralları
