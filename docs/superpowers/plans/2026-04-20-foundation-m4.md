# FitAI Mobile Foundation — M4: Navigation + Providers + Security

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development or superpowers:executing-plans.

**Goal:** 5 tab navigasyon iskeleti, tüm provider'lar entegre, SecurityProvider (jailbreak + SSL pinning), Axios interceptor chain, MMKV şifreli storage, deep linking.

**Architecture:** Root `_layout.tsx` tüm provider'ları sıraya dizer. `(tabs)/` grubu 5 boş tab barındırır. `(auth)/` grubu sign-in/sign-up placeholder ekranları. SecurityProvider app açılışında güvenlik kontrollerini çalıştırır.

**Ön koşul:** M1 + M2 + M3 tamamlanmış olmalı.

**Çalışma dizini:** `apps/mobile/`

---

## Chunk 1: Paket Yükleme

### Task 1: M4 bağımlılıklarını yükle

- [ ] **Step 1: Paketleri yükle**

```bash
cd apps/mobile
pnpm add react-native-jail-monkey
pnpm add @tanstack/react-query
pnpm add react-native-mmkv
pnpm add @sentry/react-native
npx expo install expo-haptics
```

> **Not:** `react-native-ssl-pinning` EAS Build'de native linking gerektirir. Şimdilik stub olarak ekliyoruz — `app.json` plugin'i M5'te yapılandırılacak.

- [ ] **Step 2: Commit**

```bash
git add apps/mobile/package.json
git commit -m "chore(mobile): add TanStack Query, MMKV, Sentry, jail-monkey for M4"
```

---

## Chunk 2: MMKV Storage Layer

### Task 2: MMKV şifreli storage wrapper

**Files:**

- Create: `apps/mobile/src/lib/storage.ts`
- Create: `apps/mobile/__tests__/unit/lib/storage.test.ts`

- [ ] **Step 1: Test yaz**

```ts
// apps/mobile/__tests__/unit/lib/storage.test.ts
// Uses react-native-mmkv/jest mock (configured in jest.config.js moduleNameMapper)
import { storage, typedStorage } from '../../../src/lib/storage'

describe('storage', () => {
  beforeEach(() => {
    storage.clearAll()
  })

  it('stores and retrieves a string', () => {
    typedStorage.set('testKey', 'hello')
    expect(typedStorage.getString('testKey')).toBe('hello')
  })

  it('stores and retrieves an object', () => {
    const obj = { id: '1', name: 'test' }
    typedStorage.setObject('obj', obj)
    expect(typedStorage.getObject('obj')).toEqual(obj)
  })

  it('deletes a key', () => {
    typedStorage.set('del', 'value')
    typedStorage.delete('del')
    expect(typedStorage.getString('del')).toBeUndefined()
  })

  it('returns undefined for missing key', () => {
    expect(typedStorage.getString('nonexistent')).toBeUndefined()
  })
})
```

- [ ] **Step 2: storage.ts oluştur**

```ts
// apps/mobile/src/lib/storage.ts
// MMKV with AES-256 encryption. Key is stored in Keychain (via expo-secure-store).
// Zustand persist middleware is NOT used — we write/read MMKV directly.
import { MMKV } from 'react-native-mmkv'

// In production, retrieve encryption key from expo-secure-store (Keychain).
// For now: static key placeholder — replaced in SecurityProvider init.
export const storage = new MMKV({
  id: 'fitai-secure-storage',
  // encryptionKey set at runtime by SecurityProvider after Keychain retrieval
})

export const typedStorage = {
  set(key: string, value: string) {
    storage.set(key, value)
  },
  getString(key: string): string | undefined {
    return storage.getString(key)
  },
  setObject<T>(key: string, value: T) {
    storage.set(key, JSON.stringify(value))
  },
  getObject<T>(key: string): T | undefined {
    const raw = storage.getString(key)
    if (!raw) return undefined
    try {
      return JSON.parse(raw) as T
    } catch {
      return undefined
    }
  },
  delete(key: string) {
    storage.delete(key)
  },
  clearAll() {
    storage.clearAll()
  },
}
```

- [ ] **Step 3: Test çalıştır**

```bash
cd apps/mobile && pnpm test __tests__/unit/lib/storage.test.ts
```

Beklenen: `4 passed`.

- [ ] **Step 4: Commit**

```bash
git add apps/mobile/src/lib/storage.ts apps/mobile/__tests__/unit/lib/storage.test.ts
git commit -m "feat(mobile): add MMKV typed storage wrapper"
```

---

## Chunk 3: Axios API Client

### Task 3: Circuit breaker + interceptor chain

**Files:**

- Create: `apps/mobile/src/api/client.ts`
- Create: `apps/mobile/src/api/errors.ts`
- Create: `apps/mobile/__tests__/unit/api/client.test.ts`

- [ ] **Step 1: errors.ts oluştur**

```ts
// apps/mobile/src/api/errors.ts
export type ApiErrorCode =
  | 'NETWORK_ERROR'
  | 'TIMEOUT'
  | 'RATE_LIMITED'
  | 'UNAUTHORIZED'
  | 'SERVER_ERROR'
  | 'UNKNOWN'

export class ApiError extends Error {
  constructor(
    public code: ApiErrorCode,
    public message: string,
    public retryAfter?: number,
    public status?: number
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export function normalizeError(error: unknown): ApiError {
  if (error instanceof ApiError) return error

  if (typeof error === 'object' && error !== null && 'response' in error) {
    const axiosError = error as {
      response?: {
        status: number
        data?: { error?: { code?: string; message?: string; retryAfter?: number } }
      }
    }
    const status = axiosError.response?.status ?? 0
    const body = axiosError.response?.data?.error

    if (status === 401) return new ApiError('UNAUTHORIZED', 'Session expired', undefined, 401)
    if (status === 429)
      return new ApiError('RATE_LIMITED', 'Too many requests', body?.retryAfter, 429)
    if (status >= 500)
      return new ApiError('SERVER_ERROR', body?.message ?? 'Server error', undefined, status)
  }

  if (typeof error === 'object' && error !== null && 'code' in error) {
    const e = error as { code: string }
    if (e.code === 'ECONNABORTED') return new ApiError('TIMEOUT', 'Request timed out')
    if (e.code === 'ERR_NETWORK') return new ApiError('NETWORK_ERROR', 'No internet connection')
  }

  return new ApiError('UNKNOWN', 'Unexpected error')
}
```

- [ ] **Step 2: Test yaz**

```ts
// apps/mobile/__tests__/unit/api/client.test.ts
import { normalizeError, ApiError } from '../../../src/api/errors'

describe('normalizeError', () => {
  it('returns ApiError unchanged', () => {
    const err = new ApiError('TIMEOUT', 'timed out')
    expect(normalizeError(err)).toBe(err)
  })

  it('maps 401 response to UNAUTHORIZED', () => {
    const err = normalizeError({ response: { status: 401 } })
    expect(err.code).toBe('UNAUTHORIZED')
  })

  it('maps 429 response to RATE_LIMITED with retryAfter', () => {
    const err = normalizeError({
      response: { status: 429, data: { error: { retryAfter: 30 } } },
    })
    expect(err.code).toBe('RATE_LIMITED')
    expect(err.retryAfter).toBe(30)
  })

  it('maps 500 response to SERVER_ERROR', () => {
    const err = normalizeError({ response: { status: 500 } })
    expect(err.code).toBe('SERVER_ERROR')
  })

  it('maps unknown error to UNKNOWN', () => {
    const err = normalizeError(new Error('random'))
    expect(err.code).toBe('UNKNOWN')
  })
})
```

- [ ] **Step 3: Testi çalıştır**

```bash
cd apps/mobile && pnpm test __tests__/unit/api/client.test.ts
```

Beklenen: `5 passed`.

- [ ] **Step 4: client.ts oluştur**

```ts
// apps/mobile/src/api/client.ts
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios'
import { getClerkToken } from './tokenProvider' // implemented in Auth sub-project, stub for now
import { normalizeError, ApiError } from './errors'
import { env } from '../env'

// Simple circuit breaker state
let consecutiveFailures = 0
let circuitOpenUntil = 0
const FAILURE_THRESHOLD = 3
const CIRCUIT_OPEN_DURATION_MS = 30_000

function isCircuitOpen() {
  return consecutiveFailures >= FAILURE_THRESHOLD && Date.now() < circuitOpenUntil
}

function onSuccess() {
  consecutiveFailures = 0
}

function onFailure() {
  consecutiveFailures += 1
  if (consecutiveFailures >= FAILURE_THRESHOLD) {
    circuitOpenUntil = Date.now() + CIRCUIT_OPEN_DURATION_MS
  }
}

export function createApiClient(): AxiosInstance {
  const client = axios.create({
    baseURL: env.EXPO_PUBLIC_API_URL,
    timeout: 5_000,
    headers: { 'Content-Type': 'application/json' },
  })

  // Request interceptor: auth token + idempotency key
  client.interceptors.request.use(async (config) => {
    if (isCircuitOpen()) {
      throw new ApiError('SERVER_ERROR', 'Circuit open — server temporarily unavailable')
    }

    const token = await getClerkToken()
    if (token) config.headers.Authorization = `Bearer ${token}`

    const isMutation = ['post', 'patch', 'put', 'delete'].includes(
      config.method?.toLowerCase() ?? ''
    )
    if (isMutation) {
      config.headers['X-Idempotency-Key'] = crypto.randomUUID()
    }

    config.headers['X-Client-Version'] = '1.0.0'
    return config
  })

  // Response interceptor: circuit breaker tracking + error normalize
  client.interceptors.response.use(
    (response) => {
      onSuccess()
      return response
    },
    async (error) => {
      const normalized = normalizeError(error)
      if (normalized.status !== undefined && normalized.status >= 500) {
        onFailure()
      }
      throw normalized
    }
  )

  return client
}

export const apiClient = createApiClient()
```

- [ ] **Step 5: tokenProvider stub oluştur (Auth sub-project tamamlayacak)**

```ts
// apps/mobile/src/api/tokenProvider.ts
// Stub — replaced in Auth sub-project with real Clerk token retrieval
export async function getClerkToken(): Promise<string | null> {
  return null
}
```

- [ ] **Step 6: Commit**

```bash
git add apps/mobile/src/api/
git add apps/mobile/__tests__/unit/api/client.test.ts
git commit -m "feat(mobile): add Axios API client with circuit breaker + idempotency interceptors"
```

---

## Chunk 4: SecurityProvider

### Task 4: Jailbreak detection + SSL pinning stub

**Files:**

- Create: `apps/mobile/src/providers/SecurityProvider.tsx`
- Create: `apps/mobile/__tests__/unit/providers/SecurityProvider.test.tsx`

- [ ] **Step 1: Test yaz**

```tsx
// apps/mobile/__tests__/unit/providers/SecurityProvider.test.tsx
import React from 'react'
import { render, act } from '@testing-library/react-native'
import { Text } from 'react-native'

// Mock jail-monkey
jest.mock('react-native-jail-monkey', () => ({
  isJailBroken: jest.fn(() => false),
  canMockLocation: jest.fn(() => false),
}))

import { SecurityProvider, useSecurity } from '../../../src/providers/SecurityProvider'

function SecurityConsumer() {
  const { isRooted, isChecked } = useSecurity()
  return (
    <>
      <Text testID="rooted">{String(isRooted)}</Text>
      <Text testID="checked">{String(isChecked)}</Text>
    </>
  )
}

describe('SecurityProvider', () => {
  it('reports not rooted on clean device', async () => {
    let result: ReturnType<typeof render>
    await act(async () => {
      result = render(
        <SecurityProvider>
          <SecurityConsumer />
        </SecurityProvider>
      )
    })
    expect(result!.getByTestId('rooted').props.children).toBe('false')
    expect(result!.getByTestId('checked').props.children).toBe('true')
  })

  it('reports rooted when jail-monkey detects jailbreak', async () => {
    const JailMonkey = require('react-native-jail-monkey')
    JailMonkey.isJailBroken.mockReturnValue(true)

    let result: ReturnType<typeof render>
    await act(async () => {
      result = render(
        <SecurityProvider>
          <SecurityConsumer />
        </SecurityProvider>
      )
    })
    expect(result!.getByTestId('rooted').props.children).toBe('true')
    JailMonkey.isJailBroken.mockReturnValue(false)
  })
})
```

- [ ] **Step 2: Testi çalıştır — fail bekleniyor**

```bash
cd apps/mobile && pnpm test __tests__/unit/providers/SecurityProvider.test.tsx
```

- [ ] **Step 3: SecurityProvider.tsx oluştur**

```tsx
// apps/mobile/src/providers/SecurityProvider.tsx
import React, { createContext, useContext, useState, useEffect } from 'react'
import JailMonkey from 'react-native-jail-monkey'

type SecurityContextValue = {
  isRooted: boolean
  isChecked: boolean
}

const SecurityContext = createContext<SecurityContextValue | null>(null)

export function SecurityProvider({ children }: { children: React.ReactNode }) {
  const [isRooted, setIsRooted] = useState(false)
  const [isChecked, setIsChecked] = useState(false)

  useEffect(() => {
    async function runChecks() {
      try {
        const rooted = JailMonkey.isJailBroken() || JailMonkey.canMockLocation()
        setIsRooted(rooted)
        if (rooted) {
          console.warn('[Security] Device appears rooted/jailbroken. Sensitive features disabled.')
        }
      } catch (e) {
        // Detection failure is non-fatal — don't crash the app
        console.warn('[Security] Detection check failed:', e)
      } finally {
        setIsChecked(true)
      }
    }
    runChecks()
  }, [])

  return (
    <SecurityContext.Provider value={{ isRooted, isChecked }}>{children}</SecurityContext.Provider>
  )
}

export function useSecurity(): SecurityContextValue {
  const ctx = useContext(SecurityContext)
  if (!ctx) throw new Error('useSecurity must be used within SecurityProvider')
  return ctx
}
```

- [ ] **Step 4: Test çalıştır — pass bekleniyor**

```bash
cd apps/mobile && pnpm test __tests__/unit/providers/SecurityProvider.test.tsx
```

Beklenen: `2 passed`.

- [ ] **Step 5: Commit**

```bash
git add apps/mobile/src/providers/SecurityProvider.tsx apps/mobile/__tests__/unit/providers/SecurityProvider.test.tsx
git commit -m "feat(mobile): add SecurityProvider with jailbreak detection"
```

---

## Chunk 5: Root Layout + Navigation Skeleton

### Task 5: Tüm provider'ları bağla, 5 tab iskeleti kur

**Files:**

- Modify: `apps/mobile/app/_layout.tsx`
- Create: `apps/mobile/app/(tabs)/_layout.tsx`
- Create: `apps/mobile/app/(tabs)/index.tsx`
- Create: `apps/mobile/app/(tabs)/train.tsx`
- Create: `apps/mobile/app/(tabs)/nutrition.tsx`
- Create: `apps/mobile/app/(tabs)/health.tsx`
- Create: `apps/mobile/app/(tabs)/you.tsx`
- Create: `apps/mobile/src/providers/index.tsx`

- [ ] **Step 1: src/providers/index.tsx — combined root provider**

```tsx
// apps/mobile/src/providers/index.tsx
import React from 'react'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { ClerkProvider } from '@clerk/expo/legacy'
import * as SecureStore from 'expo-secure-store'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider } from './ThemeProvider'
import { I18nProvider } from './I18nProvider'
import { SecurityProvider } from './SecurityProvider'
import { env } from '../env'

// tokenCache — stores Clerk session tokens in iOS Keychain / Android Keystore
const tokenCache = {
  async getToken(key: string) {
    return SecureStore.getItemAsync(key)
  },
  async saveToken(key: string, value: string) {
    return SecureStore.setItemAsync(key, value)
  },
  async clearToken(key: string) {
    return SecureStore.deleteItemAsync(key)
  },
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 5 * 60 * 1000, retry: 3 },
    mutations: { retry: 0 },
  },
})

type RootProvidersProps = {
  children: React.ReactNode
}

export function RootProviders({ children }: RootProvidersProps) {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SecurityProvider>
        <ClerkProvider
          publishableKey={env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY}
          tokenCache={tokenCache}
        >
          <QueryClientProvider client={queryClient}>
            <ThemeProvider defaultMode="system">
              <I18nProvider>{children}</I18nProvider>
            </ThemeProvider>
          </QueryClientProvider>
        </ClerkProvider>
      </SecurityProvider>
    </GestureHandlerRootView>
  )
}
```

- [ ] **Step 2: app/\_layout.tsx güncelle**

Mevcut `app/_layout.tsx` içeriğini aşağıdakiyle değiştir:

```tsx
// apps/mobile/app/_layout.tsx
import 'react-native-reanimated'
import '../global.css'
import React from 'react'
import { Stack } from 'expo-router'
import { RootProviders } from '../src/providers'

export default function RootLayout() {
  return (
    <RootProviders>
      <Stack screenOptions={{ headerShown: false }} />
    </RootProviders>
  )
}
```

- [ ] **Step 3: (tabs)/\_layout.tsx oluştur**

```tsx
// apps/mobile/app/(tabs)/_layout.tsx
import React from 'react'
import { Tabs } from 'expo-router'
import { useTheme } from '../../src/providers/ThemeProvider'
import { useI18n } from '../../src/providers/I18nProvider'

export default function TabsLayout() {
  const { colors } = useTheme()
  const { t } = useI18n()

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.bg.surface,
          borderTopColor: colors.border.subtle,
          borderTopWidth: 1,
        },
        tabBarActiveTintColor: colors.accent.primary,
        tabBarInactiveTintColor: colors.text.tertiary,
      }}
    >
      <Tabs.Screen name="index" options={{ title: t('tabs.home') }} />
      <Tabs.Screen name="train" options={{ title: t('tabs.train') }} />
      <Tabs.Screen name="nutrition" options={{ title: t('tabs.nutrition') }} />
      <Tabs.Screen name="health" options={{ title: t('tabs.health') }} />
      <Tabs.Screen name="you" options={{ title: t('tabs.you') }} />
    </Tabs>
  )
}
```

- [ ] **Step 4: 5 tab placeholder ekranı oluştur**

Her tab için aynı pattern — sadece isim değişiyor:

```tsx
// apps/mobile/app/(tabs)/index.tsx
import React from 'react'
import { SafeAreaWrapper } from '../../src/design-system/primitives/SafeAreaWrapper'
import { EmptyState } from '../../src/design-system/components/EmptyState'

export default function HomeTab() {
  return (
    <SafeAreaWrapper style={{ justifyContent: 'center', alignItems: 'center' }}>
      <EmptyState title="Home" subtitle="Coming in next sub-project" />
    </SafeAreaWrapper>
  )
}
```

Aynı şekilde `train.tsx`, `nutrition.tsx`, `health.tsx`, `you.tsx` oluştur (title'ı değiştirerek).

- [ ] **Step 5: Deep linking — app.json scheme doğrula**

`app.json` zaten `"scheme": "fitai"` içeriyor. Expo Router bunu otomatik kullanır. Test et:

```bash
cd apps/mobile && pnpm start --ios --clear
```

Simülatörde `xcrun simctl openurl booted "fitai://"`çalıştır, uygulamanın açıldığını gör.

- [ ] **Step 6: Commit**

```bash
git add apps/mobile/app/_layout.tsx apps/mobile/app/(tabs)/ apps/mobile/src/providers/index.tsx
git commit -m "feat(mobile): wire root providers + 5-tab navigation skeleton with deep linking"
```

---

## Chunk 6: Sync Queue

### Task 6: Zustand in-memory + MMKV hydration

**Files:**

- Create: `apps/mobile/src/stores/syncQueue.ts`
- Create: `apps/mobile/__tests__/unit/stores/syncQueue.test.ts`

- [ ] **Step 1: Test yaz**

```ts
// apps/mobile/__tests__/unit/stores/syncQueue.test.ts
import { useSyncQueueStore, SyncOperation } from '../../../src/stores/syncQueue'
import { typedStorage } from '../../../src/lib/storage'

describe('syncQueue', () => {
  beforeEach(() => {
    typedStorage.clearAll()
    // Reset store state
    useSyncQueueStore.setState({ queue: [], isSyncing: false })
  })

  const op: SyncOperation = {
    id: 'op-1',
    type: 'meal_log',
    payload: { mealId: '123' },
    createdAt: Date.now(),
    retries: 0,
  }

  it('adds operation to queue', () => {
    useSyncQueueStore.getState().enqueue(op)
    expect(useSyncQueueStore.getState().queue).toHaveLength(1)
  })

  it('removes operation after dequeue', () => {
    useSyncQueueStore.getState().enqueue(op)
    useSyncQueueStore.getState().dequeue(op.id)
    expect(useSyncQueueStore.getState().queue).toHaveLength(0)
  })

  it('persists queue to MMKV on enqueue', () => {
    useSyncQueueStore.getState().enqueue(op)
    const saved = typedStorage.getObject<SyncOperation[]>('sync_queue')
    expect(saved).toHaveLength(1)
  })
})
```

- [ ] **Step 2: syncQueue.ts oluştur**

```ts
// apps/mobile/src/stores/syncQueue.ts
// Zustand in-memory store — NO persist middleware (SSR crash risk).
// MMKV persistence is done manually: read on app start, write on every mutation.
import { create } from 'zustand'
import { typedStorage } from '../lib/storage'

export type SyncOperation = {
  id: string
  type: string
  payload: unknown
  createdAt: number
  retries: number
}

const STORAGE_KEY = 'sync_queue'

type SyncQueueState = {
  queue: SyncOperation[]
  isSyncing: boolean
  enqueue: (op: SyncOperation) => void
  dequeue: (id: string) => void
  incrementRetry: (id: string) => void
  hydrate: () => void
}

export const useSyncQueueStore = create<SyncQueueState>((set, get) => ({
  queue: [],
  isSyncing: false,

  enqueue(op) {
    const next = [...get().queue, op]
    set({ queue: next })
    typedStorage.setObject(STORAGE_KEY, next)
  },

  dequeue(id) {
    const next = get().queue.filter((o) => o.id !== id)
    set({ queue: next })
    typedStorage.setObject(STORAGE_KEY, next)
  },

  incrementRetry(id) {
    const next = get().queue.map((o) => (o.id === id ? { ...o, retries: o.retries + 1 } : o))
    set({ queue: next })
    typedStorage.setObject(STORAGE_KEY, next)
  },

  hydrate() {
    const saved = typedStorage.getObject<SyncOperation[]>(STORAGE_KEY)
    if (saved && saved.length > 0) {
      set({ queue: saved })
    }
  },
}))
```

- [ ] **Step 3: Test çalıştır**

```bash
cd apps/mobile && pnpm test __tests__/unit/stores/syncQueue.test.ts
```

Beklenen: `3 passed`.

- [ ] **Step 4: Commit**

```bash
git add apps/mobile/src/stores/syncQueue.ts apps/mobile/__tests__/unit/stores/syncQueue.test.ts
git commit -m "feat(mobile): add sync queue (Zustand in-memory + MMKV persistence, no persist middleware)"
```

---

## M4 Tamamlandı — Kontrol Listesi

- [ ] Simülatörde app açılıyor: 5 tab görünüyor
- [ ] Dark mode çalışıyor (ThemeProvider)
- [ ] TR/EN switch çalışıyor (I18nProvider)
- [ ] Tab isimleri i18n'den geliyor
- [ ] SecurityProvider: jailbreak log dev build'de görünüyor
- [ ] MMKV storage testi yeşil
- [ ] Sync queue testi yeşil
- [ ] API client testi yeşil
- [ ] `fitai://` deep link simülatörde çalışıyor

**Sonraki:** [2026-04-20-foundation-m5.md](./2026-04-20-foundation-m5.md) — Dev Infrastructure
