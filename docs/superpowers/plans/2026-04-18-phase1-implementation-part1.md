# Phase 1: Auth + Core Dashboard Implementation Plan (Part 1)

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement complete Clerk authentication, 5-step onboarding, core dashboard with 6 health tabs, and offline SQLite caching with sync queue.

**Architecture:** React Native + Expo app with Clerk SDK for auth, Zustand for state, SQLite for offline cache, AsyncStorage for sync queue, @fitai/api-client wrapper for API calls.

**Tech Stack:** React Native 0.81.5, Expo 54, TypeScript, Zustand, Clerk, sqlite, AsyncStorage, Nativewind, Axios, Vitest

---

## File Structure Summary

```
apps/mobile/
├── app.tsx                      # Root entry
├── src/types/                   # Type definitions
├── src/store/                   # Zustand stores (3)
├── src/db/                      # SQLite + cache (4)
├── src/api/                     # HTTP client
├── src/screens/                 # Auth + Dashboard screens
├── src/components/              # Shared UI components
├── src/hooks/                   # React hooks
├── src/utils/                   # Utility functions
├── src/navigation/              # Navigation setup
├── tests/                       # Test files
└── package.json                 # Dependencies
```

---

## Chunk 1: Project Setup & Infrastructure

### Task 1: Initialize Expo project with TypeScript & Nativewind

**Files:**

- Create: `apps/mobile/app.json`
- Create: `apps/mobile/package.json`
- Create: `apps/mobile/tsconfig.json`
- Create: `apps/mobile/tailwind.config.js`

- [ ] **Step 1: Create Expo project structure**

Run: `cd apps && npx create-expo-app mobile --template`

Expected: Expo project initialized

- [ ] **Step 2: Install dependencies**

```bash
cd apps/mobile
pnpm install react-native expo @react-navigation/native @react-navigation/bottom-tabs \
  zustand sqlite @react-native-async-storage/async-storage @clerk/clerk-react-native \
  nativewind tailwindcss axios expo-secure-store vitest @testing-library/react-native
```

- [ ] **Step 3: Configure TypeScript**

```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "lib": ["es2022"],
    "jsx": "react-jsx",
    "resolveJsonModule": true
  }
}
```

- [ ] **Step 4: Configure Nativewind**

```javascript
module.exports = {
  content: ['./app.tsx', './src/**/*.{ts,tsx}'],
  theme: { extend: { colors: { primary: '#3366FF' } } },
}
```

- [ ] **Step 5: Commit**

```bash
git add apps/mobile/
git commit -m "feat: initialize Expo project with TypeScript and Nativewind"
```

---

### Task 2: Set up SQLite with migrations

**Files:**

- Create: `apps/mobile/src/db/sqlite.ts`
- Create: `apps/mobile/src/db/migrations.ts`

- [ ] **Step 1: Create SQLite module**

```typescript
// apps/mobile/src/db/sqlite.ts
import * as SQLite from 'expo-sqlite'
import { executeMigrations } from './migrations'

let database: SQLite.SQLiteDatabase | null = null

export async function initializeDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (database) return database
  database = await SQLite.openDatabaseAsync(':memory:')
  await executeMigrations(database)
  return database
}

export function getDatabase(): SQLite.SQLiteDatabase {
  if (!database) throw new Error('Database not initialized')
  return database
}
```

- [ ] **Step 2: Create migrations**

```typescript
// apps/mobile/src/db/migrations.ts
const MIGRATIONS = [
  {
    version: 1,
    sql: `
      CREATE TABLE IF NOT EXISTS dashboard_cache (
        userId TEXT NOT NULL, date TEXT NOT NULL,
        todayCalories INTEGER, calorieGoal INTEGER,
        cachedAt INTEGER, expiresAt INTEGER,
        UNIQUE(userId, date)
      );
    `,
  },
  { version: 2, sql: `CREATE TABLE IF NOT EXISTS user_cache (...)` },
  { version: 3, sql: `CREATE TABLE IF NOT EXISTS sync_queue (...)` },
]

export async function executeMigrations(db: SQLite.SQLiteDatabase) {
  for (const migration of MIGRATIONS) {
    await db.execAsync(migration.sql)
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add apps/mobile/src/db/
git commit -m "feat: set up SQLite database with migrations"
```

---

### Task 3: Create API client wrapper

**Files:**

- Create: `apps/mobile/src/api/client.ts`

- [ ] **Step 1: Create API client**

```typescript
// apps/mobile/src/api/client.ts
import axios, { AxiosInstance } from 'axios'
import * as SecureStore from 'expo-secure-store'

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api'

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export function createApiClient(token: string): AxiosInstance {
  const client = axios.create({
    baseURL: API_URL,
    headers: { Authorization: `Bearer ${token}` },
  })

  client.interceptors.response.use(
    (res) => res,
    (error) => {
      const status = error.response?.status ?? 500
      const message = error.response?.data?.message ?? error.message
      throw new ApiError(status, 'API_ERROR', message)
    }
  )

  return client
}

export async function getAuthenticatedClient(): Promise<AxiosInstance> {
  const token = await SecureStore.getItemAsync('auth_token')
  if (!token) throw new Error('No token')
  return createApiClient(token)
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/mobile/src/api/
git commit -m "feat: create API client with token injection"
```

---

### Task 4: Set up Zustand stores

**Files:**

- Create: `apps/mobile/src/types/auth.ts`
- Create: `apps/mobile/src/store/authStore.ts`
- Create: `apps/mobile/src/store/userStore.ts`
- Create: `apps/mobile/src/store/dashboardStore.ts`

- [ ] **Step 1: Define auth types**

```typescript
// apps/mobile/src/types/auth.ts
export interface User {
  id: string
  email: string
  name: string
  avatarUrl?: string
}

export interface AuthState {
  isSignedIn: boolean
  user: User | null
  token: string | null
  isLoading: boolean
  error: string | null
}
```

- [ ] **Step 2: Create auth store**

```typescript
// apps/mobile/src/store/authStore.ts
import { create } from 'zustand'
import { AuthState, User } from '../types/auth'

type Store = AuthState & {
  setSignedIn(v: boolean): void
  setUser(u: User | null): void
  setToken(t: string | null): void
  setLoading(l: boolean): void
  reset(): void
}

export const useAuthStore = create<Store>((set) => ({
  isSignedIn: false,
  user: null,
  token: null,
  isLoading: false,
  error: null,
  setSignedIn: (v) => set({ isSignedIn: v }),
  setUser: (u) => set({ user: u }),
  setToken: (t) => set({ token: t }),
  setLoading: (l) => set({ isLoading: l }),
  reset: () =>
    set({
      isSignedIn: false,
      user: null,
      token: null,
      isLoading: false,
      error: null,
    }),
}))
```

- [ ] **Step 3: Create user and dashboard stores**

```typescript
// apps/mobile/src/store/userStore.ts
import { create } from 'zustand'

export const useUserStore = create((set) => ({
  profile: null,
  isLoading: false,
  setProfile: (p) => set({ profile: p }),
  reset: () => set({ profile: null, isLoading: false }),
}))

// apps/mobile/src/store/dashboardStore.ts
import { create } from 'zustand'

export const useDashboardStore = create((set) => ({
  stats: null,
  isLoading: false,
  setStats: (s) => set({ stats: s }),
  reset: () => set({ stats: null, isLoading: false }),
}))
```

- [ ] **Step 4: Commit**

```bash
git add apps/mobile/src/store/ apps/mobile/src/types/
git commit -m "feat: set up Zustand stores for auth, user, dashboard"
```

---

## Chunk 2: Database & Cache Operations

### Task 5: Implement database cache operations

**Files:**

- Create: `apps/mobile/src/db/dashboardCache.ts`
- Create: `apps/mobile/src/db/userCache.ts`
- Create: `apps/mobile/src/db/syncQueue.ts`

- [ ] **Step 1: Create dashboard cache**

```typescript
// apps/mobile/src/db/dashboardCache.ts
import { getDatabase } from './sqlite'

const CACHE_TTL = 60 * 60 * 1000 // 1 hour

export async function saveDashboardCache(userId: string, stats: any): Promise<void> {
  const db = getDatabase()
  const now = Date.now()

  await db.runAsync(
    `INSERT OR REPLACE INTO dashboard_cache (userId, date, todayCalories, calorieGoal, cachedAt, expiresAt)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      userId,
      new Date().toISOString().split('T')[0],
      stats.todayCalories,
      stats.calorieGoal,
      now,
      now + CACHE_TTL,
    ]
  )
}

export async function getDashboardCache(userId: string): Promise<any | null> {
  const db = getDatabase()
  const now = Date.now()

  const row = await db.getFirstAsync(
    `SELECT * FROM dashboard_cache WHERE userId = ? AND expiresAt > ? LIMIT 1`,
    [userId, now]
  )

  return row || null
}
```

- [ ] **Step 2: Create user cache**

```typescript
// apps/mobile/src/db/userCache.ts
import { getDatabase } from './sqlite'

export async function saveUserCache(profile: any): Promise<void> {
  const db = getDatabase()
  await db.runAsync(
    `INSERT OR REPLACE INTO user_cache (userId, email, name, cachedAt, expiresAt)
     VALUES (?, ?, ?, ?, ?)`,
    [profile.id, profile.email, profile.name, Date.now(), Date.now() + 60 * 60 * 1000]
  )
}

export async function getUserCache(userId: string): Promise<any | null> {
  const db = getDatabase()
  const row = await db.getFirstAsync(
    `SELECT * FROM user_cache WHERE userId = ? AND expiresAt > ? LIMIT 1`,
    [userId, Date.now()]
  )
  return row || null
}
```

- [ ] **Step 3: Create sync queue**

```typescript
// apps/mobile/src/db/syncQueue.ts
import { getDatabase } from './sqlite'

export async function queueSync(
  userId: string,
  action: string,
  endpoint: string,
  payload: any
): Promise<void> {
  const db = getDatabase()
  await db.runAsync(
    `INSERT INTO sync_queue (userId, action, endpoint, payload, createdAt, retries)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [userId, action, endpoint, JSON.stringify(payload), Date.now(), 0]
  )
}

export async function getPendingSyncQueue(userId: string): Promise<any[]> {
  const db = getDatabase()
  return await db.getAllAsync(`SELECT * FROM sync_queue WHERE userId = ? ORDER BY createdAt ASC`, [
    userId,
  ])
}

export async function removeSyncQueueItem(id: string): Promise<void> {
  const db = getDatabase()
  await db.runAsync(`DELETE FROM sync_queue WHERE id = ?`, [id])
}
```

- [ ] **Step 4: Commit**

```bash
git add apps/mobile/src/db/
git commit -m "feat: implement database cache and sync queue operations"
```

---

### Task 6: Create utility functions

**Files:**

- Create: `apps/mobile/src/utils/validation.ts`
- Create: `apps/mobile/src/utils/formatters.ts`
- Create: `apps/mobile/src/utils/errorMapper.ts`
- Create: `apps/mobile/src/utils/retry.ts`
- Create: `apps/mobile/src/utils/tokenStorage.ts`

- [ ] **Step 1: Create validation utils**

```typescript
// apps/mobile/src/utils/validation.ts
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function validatePassword(password: string): { isValid: boolean; strength: string } {
  return {
    isValid: password.length >= 8,
    strength: password.length >= 12 ? 'strong' : password.length >= 8 ? 'medium' : 'weak',
  }
}

export function validateForm(data: any, requiredFields: string[]): Record<string, string> {
  const errors: Record<string, string> = {}
  requiredFields.forEach((field) => {
    if (!data[field]) errors[field] = `${field} is required`
  })
  return errors
}
```

- [ ] **Step 2: Create formatters**

```typescript
// apps/mobile/src/utils/formatters.ts
export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString()
}

export function formatCalories(cal: number): string {
  return `${cal.toLocaleString()} kcal`
}

export function formatWater(ml: number): string {
  return ml >= 1000 ? `${(ml / 1000).toFixed(1)}L` : `${ml}ml`
}

export function formatProgress(current: number, goal: number): string {
  return `${Math.round((current / goal) * 100)}%`
}

export function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}
```

- [ ] **Step 3: Create error mapper**

```typescript
// apps/mobile/src/utils/errorMapper.ts
export function mapApiError(error: any): { title: string; message: string; isRetryable: boolean } {
  const status = error.status || 500

  if (status === 401) {
    return {
      title: 'Authentication Failed',
      message: 'Please sign in again',
      isRetryable: false,
    }
  }

  if (status >= 500) {
    return {
      title: 'Server Error',
      message: 'Something went wrong. Please try again.',
      isRetryable: true,
    }
  }

  return {
    title: 'Error',
    message: error.message || 'An unexpected error occurred',
    isRetryable: true,
  }
}
```

- [ ] **Step 4: Create retry logic**

```typescript
// apps/mobile/src/utils/retry.ts
export async function retryWithExponentialBackoff<T>(
  fn: () => Promise<T>,
  maxAttempts: number = 3
): Promise<T> {
  let lastError: Error | null = null

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error as Error
      if (attempt < maxAttempts) {
        const delay = 500 * Math.pow(2, attempt - 1)
        await new Promise((resolve) => setTimeout(resolve, delay))
      }
    }
  }

  throw lastError
}
```

- [ ] **Step 5: Create token storage**

```typescript
// apps/mobile/src/utils/tokenStorage.ts
import * as SecureStore from 'expo-secure-store'

export async function saveAuthToken(token: string): Promise<void> {
  await SecureStore.setItemAsync('auth_token', token)
}

export async function getAuthToken(): Promise<string | null> {
  return await SecureStore.getItemAsync('auth_token')
}

export async function removeAuthToken(): Promise<void> {
  await SecureStore.deleteItemAsync('auth_token')
}
```

- [ ] **Step 6: Commit**

```bash
git add apps/mobile/src/utils/
git commit -m "feat: add validation, formatting, error mapping, retry, and token storage utilities"
```

---

### Task 7: Create custom hooks

**Files:**

- Create: `apps/mobile/src/hooks/useAuth.ts`
- Create: `apps/mobile/src/hooks/useUserProfile.ts`
- Create: `apps/mobile/src/hooks/useSyncQueue.ts`
- Create: `apps/mobile/src/hooks/useOfflineDetection.ts`

- [ ] **Step 1: Create useAuth hook**

```typescript
// apps/mobile/src/hooks/useAuth.ts
import { useCallback, useEffect, useState } from 'react'
import { useAuthStore } from '../store/authStore'
import { useUserStore } from '../store/userStore'
import { getAuthenticatedClient } from '../api/client'
import { saveAuthToken, removeAuthToken, getAuthToken } from '../utils/tokenStorage'

export function useAuth() {
  const authStore = useAuthStore()
  const userStore = useUserStore()
  const [isInitializing, setIsInitializing] = useState(true)

  useEffect(() => {
    initializeAuth()
  }, [])

  async function initializeAuth() {
    const token = await getAuthToken()
    if (token) {
      authStore.setToken(token)
      authStore.setSignedIn(true)
    }
    setIsInitializing(false)
  }

  const signIn = useCallback(
    async (email: string, password: string) => {
      try {
        authStore.setLoading(true)
        const client = await getAuthenticatedClient()
        const response = await client.post('/auth/sign-in', { email, password })

        await saveAuthToken(response.data.token)
        authStore.setToken(response.data.token)
        authStore.setUser(response.data.user)
        authStore.setSignedIn(true)
      } catch (error: any) {
        authStore.setError(error.message)
        throw error
      } finally {
        authStore.setLoading(false)
      }
    },
    [authStore]
  )

  const signOut = useCallback(async () => {
    await removeAuthToken()
    authStore.reset()
    userStore.reset()
  }, [authStore, userStore])

  return {
    ...authStore,
    isInitializing,
    signIn,
    signOut,
  }
}
```

- [ ] **Step 2: Create useUserProfile hook**

```typescript
// apps/mobile/src/hooks/useUserProfile.ts
import { useCallback, useEffect } from 'react'
import { useUserStore } from '../store/userStore'
import { getAuthenticatedClient } from '../api/client'
import { getUserCache, saveUserCache } from '../db/userCache'

export function useUserProfile(userId: string | null) {
  const store = useUserStore()

  useEffect(() => {
    if (userId) loadUserProfile()
  }, [userId])

  async function loadUserProfile() {
    if (!userId) return

    const cached = await getUserCache(userId)
    if (cached) {
      store.setProfile(cached)
      return
    }

    try {
      const client = await getAuthenticatedClient()
      const response = await client.get('/user/profile')
      store.setProfile(response.data.user)
      await saveUserCache(response.data.user)
    } catch (error) {
      console.error('Failed to load profile:', error)
    }
  }

  const refetch = useCallback(() => loadUserProfile(), [userId])

  return { ...store, refetch }
}
```

- [ ] **Step 3: Create useSyncQueue hook**

```typescript
// apps/mobile/src/hooks/useSyncQueue.ts
import { useEffect, useRef } from 'react'
import { useAuthStore } from '../store/authStore'
import { getAuthenticatedClient } from '../api/client'
import { getPendingSyncQueue, removeSyncQueueItem } from '../db/syncQueue'
import { useOfflineDetection } from './useOfflineDetection'

export function useSyncQueue() {
  const { isOnline } = useOfflineDetection()
  const syncInProgressRef = useRef(false)
  const authStore = useAuthStore()

  useEffect(() => {
    if (isOnline && authStore.user?.id) {
      flushSyncQueue()
    }
  }, [isOnline, authStore.user?.id])

  async function flushSyncQueue() {
    if (syncInProgressRef.current) return
    syncInProgressRef.current = true

    try {
      const queue = await getPendingSyncQueue(authStore.user?.id || '')

      for (const item of queue) {
        try {
          const client = await getAuthenticatedClient()

          if (item.action === 'POST') {
            await client.post(item.endpoint, JSON.parse(item.payload))
          } else if (item.action === 'PUT') {
            await client.put(item.endpoint, JSON.parse(item.payload))
          }

          await removeSyncQueueItem(item.id)
        } catch (error) {
          console.error('Sync item failed:', error)
        }
      }
    } finally {
      syncInProgressRef.current = false
    }
  }

  return { flushSyncQueue, isOnline }
}
```

- [ ] **Step 4: Create useOfflineDetection hook**

```typescript
// apps/mobile/src/hooks/useOfflineDetection.ts
import { useEffect, useState } from 'react'
import NetInfo from '@react-native-community/netinfo'

export function useOfflineDetection() {
  const [isOnline, setIsOnline] = useState(true)

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      const online = state.isConnected && state.isInternetReachable !== false
      setIsOnline(online)
    })

    return unsubscribe
  }, [])

  return { isOnline }
}
```

- [ ] **Step 5: Commit**

```bash
git add apps/mobile/src/hooks/
git commit -m "feat: implement auth, profile, sync queue, and offline detection hooks"
```

---

**End of Part 1 Summary:**

- ✅ Expo project setup with TypeScript and Nativewind
- ✅ SQLite database with migrations
- ✅ API client with token injection and error handling
- ✅ Zustand stores (auth, user, dashboard)
- ✅ Database cache and sync queue operations
- ✅ Utility functions (validation, formatting, error mapping, retry, token storage)
- ✅ Custom hooks (auth, profile, sync queue, offline detection)

**Next Part:** Shared UI components, authentication screens, and dashboard screens.
