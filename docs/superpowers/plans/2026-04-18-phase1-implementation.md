# Phase 1: Auth + Core Dashboard Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a mobile app from scratch with full authentication, 5-step onboarding, and complete dashboard mirroring the web version, with offline support and type-safe API calls.

**Architecture:** Fresh React Native + Expo project with modular component architecture, Zustand for state management, SQLite + AsyncStorage for offline support, and a new shared `@fitai/api-client` package for all HTTP communication.

**Tech Stack:** React Native 0.81.5, Expo 54, TypeScript, Zustand, Clerk, SQLite, AsyncStorage, Nativewind, Axios, Vitest

---

## Chunk 1: Project Setup & Infrastructure

### Task 1: Clean Expo Project Setup

**Files:**

- Delete: `apps/mobile/` (entire existing dir)
- Create: New Expo project with TypeScript template
- Create: `apps/mobile/app.json`
- Create: `apps/mobile/tsconfig.json`
- Create: `apps/mobile/tailwind.config.js`
- Create: `apps/mobile/nativewind.config.js`
- Create: `apps/mobile/package.json`
- Modify: `pnpm-lock.yaml` (add mobile dependencies)

- [ ] **Step 1: Remove old mobile directory**

```bash
cd c:/Users/TUF/Desktop/Ai-Pt
rm -rf apps/mobile
```

- [ ] **Step 2: Initialize new Expo project with TypeScript**

```bash
cd apps
npx create-expo-app@latest mobile --template
cd mobile
```

- [ ] **Step 3: Create package.json with all dependencies**

```json
{
  "name": "mobile",
  "version": "1.0.0",
  "main": "expo-router/entry",
  "scripts": {
    "start": "expo start",
    "android": "expo start --android",
    "ios": "expo start --ios",
    "web": "expo start --web",
    "test": "vitest",
    "test:watch": "vitest --watch",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@clerk/expo": "^3.1.9",
    "@fitai/api-client": "workspace:*",
    "@fitai/shared-types": "workspace:*",
    "@react-native-async-storage/async-storage": "^1.21.0",
    "@react-native-camera-roll/camera-roll": "^7.10.2",
    "expo": "~54.0.33",
    "expo-constants": "~18.0.13",
    "expo-linking": "~8.0.11",
    "expo-router": "~6.0.23",
    "expo-secure-store": "~15.0.8",
    "expo-splash-screen": "~0.27.5",
    "expo-status-bar": "~3.0.9",
    "nativewind": "^4.2.3",
    "react": "19.1.0",
    "react-native": "0.81.5",
    "react-native-reanimated": "~4.1.7",
    "react-native-safe-area-context": "~5.6.2",
    "sqlite3": "^5.1.6",
    "zustand": "^5.0.3"
  },
  "devDependencies": {
    "@babel/core": "^7.24.0",
    "@testing-library/react-native": "^12.4.0",
    "@types/react": "~19.1.0",
    "@types/react-native": "~0.73.0",
    "typescript": "~5.9.2",
    "vitest": "^3.1.0"
  }
}
```

- [ ] **Step 4: Create tsconfig.json**

```json
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"]
    },
    "types": ["vitest/globals"]
  }
}
```

- [ ] **Step 5: Create app.json (Expo config)**

```json
{
  "expo": {
    "name": "FitAI",
    "slug": "fitai",
    "scheme": "fitai",
    "version": "1.0.0",
    "platforms": ["ios", "android"],
    "icon": "./assets/icon.png",
    "splash": {
      "image": "./assets/splash-icon.png",
      "resizeMode": "contain",
      "backgroundColor": "#0A0A0F"
    },
    "updates": {
      "enabled": true,
      "checkOnLaunch": "ALWAYS",
      "fallbackToCacheTimeout": 30000
    },
    "ios": {
      "bundleIdentifier": "com.fitai.app",
      "buildNumber": "1",
      "infoPlist": {
        "NSCameraUsageDescription": "Egzersiz form analizi için kamera gerekli.",
        "NSMicrophoneUsageDescription": "Sesli koç için mikrofon gerekli.",
        "NSHealthShareUsageDescription": "Sağlık verilerinizi analiz etmek için.",
        "NSLocationWhenInUseUsageDescription": "Antrenman takibi için konum gerekli."
      }
    },
    "android": {
      "package": "com.fitai.app",
      "versionCode": 1,
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#0A0A0F"
      },
      "permissions": ["CAMERA", "RECORD_AUDIO", "ACCESS_FINE_LOCATION", "ACCESS_COARSE_LOCATION"]
    }
  }
}
```

- [ ] **Step 6: Create tailwind.config.js**

```js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './components/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#0A0A0F',
        secondary: '#1A1A2E',
        accent: '#3366FF',
      },
    },
  },
  plugins: [],
}
```

- [ ] **Step 7: Create nativewind.config.js**

```js
import { withNativewind } from 'nativewind'

export default withNativewind({
  inlineRem: 16,
})
```

- [ ] **Step 8: Create global.css**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  body {
    @apply bg-primary text-white;
  }
}
```

- [ ] **Step 9: Create .env.local**

```
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_key_here
EXPO_PUBLIC_API_URL=http://localhost:3000
```

- [ ] **Step 10: Install dependencies**

```bash
cd c:/Users/TUF/Desktop/Ai-Pt
pnpm install
```

Expected: All deps installed, no errors

- [ ] **Step 11: Verify project structure**

```bash
cd apps/mobile
ls -la app/
# Expected: app/_layout.tsx (will create next)
```

- [ ] **Step 12: Commit**

```bash
cd c:/Users/TUF/Desktop/Ai-Pt
git add apps/mobile/
git commit -m "chore: initialize fresh Expo project with dependencies"
```

---

### Task 2: Set up Vitest + TypeScript checking

**Files:**

- Create: `apps/mobile/vitest.config.ts`
- Create: `apps/mobile/__tests__/setup.ts`

- [ ] **Step 1: Create vitest.config.ts**

```typescript
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['.//__tests__/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
    },
  },
})
```

- [ ] **Step 2: Create test setup file**

```typescript
// __tests__/setup.ts
import { expect, afterEach, vi } from 'vitest'

// Mock native modules
vi.mock('expo-secure-store', () => ({
  getItemAsync: vi.fn(),
  setItemAsync: vi.fn(),
  deleteItemAsync: vi.fn(),
}))

vi.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    multiGet: vi.fn(),
    multiSet: vi.fn(),
  },
}))

vi.mock('react-native', () => ({
  View: () => null,
  Text: () => null,
  TextInput: () => null,
  Image: () => null,
  ScrollView: () => null,
  FlatList: () => null,
  ActivityIndicator: () => null,
}))

afterEach(() => {
  vi.clearAllMocks()
})
```

- [ ] **Step 3: Test that vitest works**

```bash
cd apps/mobile
pnpm test
# Expected: 0 tests, 0 failures (no tests yet)
```

- [ ] **Step 4: Commit**

```bash
git add apps/mobile/vitest.config.ts apps/mobile/__tests__/setup.ts
git commit -m "chore: setup vitest with mocks"
```

---

## Chunk 2: API Client Package

### Task 3: Create @fitai/api-client package

**Files:**

- Create: `packages/api-client/package.json`
- Create: `packages/api-client/tsconfig.json`
- Create: `packages/api-client/src/index.ts`
- Create: `packages/api-client/src/client.ts`
- Create: `packages/api-client/src/types.ts`
- Create: `packages/api-client/src/errors.ts`

- [ ] **Step 1: Create packages/api-client directory**

```bash
cd c:/Users/TUF/Desktop/Ai-Pt
mkdir -p packages/api-client/src
```

- [ ] **Step 2: Create package.json**

```json
{
  "name": "@fitai/api-client",
  "version": "1.0.0",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "private": true,
  "scripts": {
    "build": "tsc",
    "test": "vitest"
  },
  "dependencies": {
    "@fitai/shared-types": "workspace:*",
    "axios": "^1.15.0"
  },
  "devDependencies": {
    "@types/node": "^22.14.1",
    "typescript": "^5.8.3"
  }
}
```

- [ ] **Step 3: Create tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020"],
    "module": "ESNext",
    "skipLibCheck": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "outDir": "./dist",
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src"],
  "references": [{ "path": "../shared-types" }]
}
```

- [ ] **Step 4: Create types.ts**

```typescript
// packages/api-client/src/types.ts

export interface ApiError {
  code: string
  message: string
  status: number
  details?: Record<string, any>
}

export interface ApiResponse<T> {
  data?: T
  error?: ApiError
  success: boolean
}

export interface SignInRequest {
  email: string
  password: string
}

export interface SignInResponse {
  token: string
  user: {
    id: string
    email: string
    name: string
    clerkId: string
  }
}

export interface SignUpRequest {
  email: string
  password: string
  name: string
}

export interface SignUpResponse {
  token: string
  user: {
    id: string
    email: string
    name: string
    clerkId: string
  }
}

export interface UserProfile {
  id: string
  clerkId: string
  email: string
  name: string
  avatar?: string
  age?: number
  gender?: 'male' | 'female' | 'other'
  height?: number
  weight?: number
  goalType?: 'fat_loss' | 'muscle_gain' | 'endurance'
  activityLevel?: 'sedentary' | 'light' | 'moderate' | 'vigorous'
  healthConditions?: string[]
  createdAt: string
  updatedAt: string
}

export interface UpdateProfileRequest {
  name?: string
  age?: number
  gender?: 'male' | 'female' | 'other'
  height?: number
  weight?: number
  goalType?: 'fat_loss' | 'muscle_gain' | 'endurance'
  activityLevel?: 'sedentary' | 'light' | 'moderate' | 'vigorous'
  healthConditions?: string[]
}

export interface DashboardStats {
  todayCalories: number
  todayWater: number
  todaySteps: number
  workoutTime: number
  upcomingWorkout?: {
    id: string
    name: string
    scheduledAt: string
  }
  recentWorkouts: Array<{
    id: string
    name: string
    completedAt: string
    duration: number
    calories: number
  }>
}

export interface HealthMetrics {
  overview: Record<string, any>
  activity: Record<string, any>
  body: Record<string, any>
  health: Record<string, any>
  sleep: Record<string, any>
  water: Record<string, any>
  devices: Record<string, any>
}

export interface OnboardingData {
  goalType: 'fat_loss' | 'muscle_gain' | 'endurance'
  name: string
  age: number
  gender: 'male' | 'female' | 'other'
  height: number
  weight: number
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'vigorous'
  healthConditions: string[]
}
```

- [ ] **Step 5: Create errors.ts**

```typescript
// packages/api-client/src/errors.ts

export class ApiClientError extends Error {
  constructor(
    public code: string,
    message: string,
    public status?: number,
    public details?: Record<string, any>
  ) {
    super(message)
    this.name = 'ApiClientError'
  }
}

export class NetworkError extends ApiClientError {
  constructor(message = 'Network error') {
    super('NETWORK_ERROR', message)
    this.name = 'NetworkError'
  }
}

export class UnauthorizedError extends ApiClientError {
  constructor(message = 'Unauthorized') {
    super('UNAUTHORIZED', message, 401)
    this.name = 'UnauthorizedError'
  }
}

export class ValidationError extends ApiClientError {
  constructor(message = 'Validation error', details?: Record<string, any>) {
    super('VALIDATION_ERROR', message, 400, details)
    this.name = 'ValidationError'
  }
}

export class ServerError extends ApiClientError {
  constructor(message = 'Server error', status = 500) {
    super('SERVER_ERROR', message, status)
    this.name = 'ServerError'
  }
}

export function isApiClientError(error: unknown): error is ApiClientError {
  return error instanceof ApiClientError
}
```

- [ ] **Step 6: Create client.ts**

```typescript
// packages/api-client/src/client.ts
import axios, { AxiosInstance, AxiosError } from 'axios'
import {
  ApiClientError,
  NetworkError,
  UnauthorizedError,
  ValidationError,
  ServerError,
} from './errors'

export interface ApiClientConfig {
  baseURL: string
  getToken?: () => Promise<string | null>
  onUnauthorized?: () => void
}

export class ApiClient {
  private axios: AxiosInstance
  private config: ApiClientConfig

  constructor(config: ApiClientConfig) {
    this.config = config
    this.axios = axios.create({
      baseURL: config.baseURL,
      timeout: 30000,
    })

    // Add token interceptor
    this.axios.interceptors.request.use(async (req) => {
      if (this.config.getToken) {
        const token = await this.config.getToken()
        if (token) {
          req.headers.Authorization = `Bearer ${token}`
        }
      }
      return req
    })

    // Add error interceptor
    this.axios.interceptors.response.use(
      (res) => res,
      (error) => {
        if (error.response?.status === 401) {
          this.config.onUnauthorized?.()
        }
        throw this.handleError(error)
      }
    )
  }

  private handleError(error: AxiosError): ApiClientError {
    if (!error.response) {
      return new NetworkError(error.message || 'Network error')
    }

    const { status, data } = error.response
    const message = (data as any)?.message || error.message || 'Unknown error'

    if (status === 401) {
      return new UnauthorizedError(message)
    }

    if (status === 400) {
      return new ValidationError(message, (data as any)?.details)
    }

    if (status >= 500) {
      return new ServerError(message, status)
    }

    return new ApiClientError('API_ERROR', message, status)
  }

  async get<T>(url: string): Promise<T> {
    const response = await this.axios.get<T>(url)
    return response.data
  }

  async post<T>(url: string, data?: any): Promise<T> {
    const response = await this.axios.post<T>(url, data)
    return response.data
  }

  async put<T>(url: string, data?: any): Promise<T> {
    const response = await this.axios.put<T>(url, data)
    return response.data
  }

  async delete<T>(url: string): Promise<T> {
    const response = await this.axios.delete<T>(url)
    return response.data
  }
}

export function createApiClient(config: ApiClientConfig): ApiClient {
  return new ApiClient(config)
}
```

- [ ] **Step 7: Create index.ts (exports)**

```typescript
// packages/api-client/src/index.ts
export { ApiClient, createApiClient } from './client'
export type { ApiClientConfig } from './client'
export * from './types'
export * from './errors'
```

- [ ] **Step 8: Create **tests**/client.test.ts**

```typescript
// packages/api-client/__tests__/client.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createApiClient } from '../src/client'
import { UnauthorizedError, NetworkError } from '../src/errors'

describe('ApiClient', () => {
  let client: ReturnType<typeof createApiClient>
  let getTokenMock: ReturnType<typeof vi.fn>
  let onUnauthorizedMock: ReturnType<typeof vi.fn>

  beforeEach(() => {
    getTokenMock = vi.fn().mockResolvedValue('test-token')
    onUnauthorizedMock = vi.fn()

    client = createApiClient({
      baseURL: 'http://localhost:3000',
      getToken: getTokenMock,
      onUnauthorized: onUnauthorizedMock,
    })
  })

  it('should initialize with config', () => {
    expect(client).toBeDefined()
  })

  it('should have get, post, put, delete methods', () => {
    expect(client.get).toBeDefined()
    expect(client.post).toBeDefined()
    expect(client.put).toBeDefined()
    expect(client.delete).toBeDefined()
  })
})
```

- [ ] **Step 9: Install api-client dependencies**

```bash
cd c:/Users/TUF/Desktop/Ai-Pt
pnpm install
```

Expected: api-client package linked

- [ ] **Step 10: Test api-client**

```bash
cd packages/api-client
pnpm test
# Expected: 1 test passes
```

- [ ] **Step 11: Commit**

```bash
cd c:/Users/TUF/Desktop/Ai-Pt
git add packages/api-client/
git commit -m "feat: create @fitai/api-client package with type-safe HTTP client"
```

---

## Chunk 3: Auth Infrastructure (Stores + Screens)

### Task 4: Create Zustand stores (authStore, userStore, dashboardStore)

**Files:**

- Create: `apps/mobile/lib/store/authStore.ts`
- Create: `apps/mobile/lib/store/userStore.ts`
- Create: `apps/mobile/lib/store/dashboardStore.ts`
- Create: `apps/mobile/__tests__/store/authStore.test.ts`

- [ ] **Step 1: Create authStore.ts**

```typescript
// apps/mobile/lib/store/authStore.ts
import { create } from 'zustand'

export interface User {
  id: string
  clerkId: string
  email: string
  name: string
  avatar?: string
}

interface AuthStore {
  isSignedIn: boolean
  user: User | null
  token: string | null
  isLoading: boolean
  error: string | null

  setSignedIn: (signed: boolean) => void
  setUser: (user: User | null) => void
  setToken: (token: string | null) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  reset: () => void
}

export const useAuthStore = create<AuthStore>((set) => ({
  isSignedIn: false,
  user: null,
  token: null,
  isLoading: false,
  error: null,

  setSignedIn: (signed) => set({ isSignedIn: signed }),
  setUser: (user) => set({ user }),
  setToken: (token) => set({ token }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
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

- [ ] **Step 2: Create userStore.ts**

```typescript
// apps/mobile/lib/store/userStore.ts
import { create } from 'zustand'

export interface UserProfile {
  id: string
  clerkId: string
  email: string
  name: string
  avatar?: string
  age?: number
  gender?: 'male' | 'female' | 'other'
  height?: number
  weight?: number
  goalType?: 'fat_loss' | 'muscle_gain' | 'endurance'
  activityLevel?: 'sedentary' | 'light' | 'moderate' | 'vigorous'
  healthConditions?: string[]
  createdAt: string
  updatedAt: string
}

interface UserStore {
  profile: UserProfile | null
  isLoading: boolean
  error: string | null

  setProfile: (profile: UserProfile | null) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  reset: () => void
}

export const useUserStore = create<UserStore>((set) => ({
  profile: null,
  isLoading: false,
  error: null,

  setProfile: (profile) => set({ profile }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  reset: () =>
    set({
      profile: null,
      isLoading: false,
      error: null,
    }),
}))
```

- [ ] **Step 3: Create dashboardStore.ts**

```typescript
// apps/mobile/lib/store/dashboardStore.ts
import { create } from 'zustand'

export interface DashboardStats {
  todayCalories: number
  todayWater: number
  todaySteps: number
  workoutTime: number
  upcomingWorkout?: {
    id: string
    name: string
    scheduledAt: string
  }
  recentWorkouts: Array<{
    id: string
    name: string
    completedAt: string
    duration: number
    calories: number
  }>
}

interface DashboardStore {
  stats: DashboardStats | null
  isLoading: boolean
  error: string | null
  lastFetch: number | null

  setStats: (stats: DashboardStats) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  setLastFetch: (time: number) => void
  reset: () => void
}

export const useDashboardStore = create<DashboardStore>((set) => ({
  stats: null,
  isLoading: false,
  error: null,
  lastFetch: null,

  setStats: (stats) => set({ stats }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  setLastFetch: (time) => set({ lastFetch: time }),
  reset: () =>
    set({
      stats: null,
      isLoading: false,
      error: null,
      lastFetch: null,
    }),
}))
```

- [ ] **Step 4: Create authStore.test.ts**

```typescript
// apps/mobile/__tests__/store/authStore.test.ts
import { describe, it, expect } from 'vitest'
import { useAuthStore } from '../../lib/store/authStore'

describe('authStore', () => {
  it('should initialize with default state', () => {
    const { getState } = useAuthStore

    expect(getState().isSignedIn).toBe(false)
    expect(getState().user).toBeNull()
    expect(getState().token).toBeNull()
    expect(getState().isLoading).toBe(false)
    expect(getState().error).toBeNull()
  })

  it('should set signed in state', () => {
    const { getState, setState } = useAuthStore
    setState({ isSignedIn: true })

    expect(getState().isSignedIn).toBe(true)
  })

  it('should set user', () => {
    const mockUser = {
      id: '1',
      clerkId: 'clerk_1',
      email: 'test@example.com',
      name: 'Test User',
    }
    const { getState, setState } = useAuthStore
    setState({ user: mockUser })

    expect(getState().user).toEqual(mockUser)
  })

  it('should reset state', () => {
    const { getState, setState } = useAuthStore
    setState({
      isSignedIn: true,
      user: { id: '1', clerkId: 'c1', email: 'e@e.com', name: 'n' },
      token: 'token',
    })

    getState().reset()

    expect(getState().isSignedIn).toBe(false)
    expect(getState().user).toBeNull()
    expect(getState().token).toBeNull()
  })
})
```

- [ ] **Step 5: Create directory structure**

```bash
cd apps/mobile
mkdir -p lib/store __tests__/store
```

- [ ] **Step 6: Run store tests**

```bash
cd apps/mobile
pnpm test
# Expected: 4 tests pass
```

- [ ] **Step 7: Commit**

```bash
cd c:/Users/TUF/Desktop/Ai-Pt
git add apps/mobile/lib/store/ apps/mobile/__tests__/store/
git commit -m "feat: create Zustand stores (auth, user, dashboard)"
```

---

## Chunk 4: Root Layout + Auth Guard

### Task 5: Set up app layout with Clerk + AuthGuard

**Files:**

- Create: `apps/mobile/app/_layout.tsx`
- Create: `apps/mobile/app.json`
- Create: `apps/mobile/components/auth/AuthGuard.tsx`
- Create: `apps/mobile/lib/hooks/useAuth.ts`

- [ ] **Step 1: Create AuthGuard.tsx**

```typescript
// apps/mobile/components/auth/AuthGuard.tsx
import { useAuth } from '@clerk/expo'
import { useSegments, useRouter } from 'expo-router'
import { useEffect } from 'react'
import { useAuthStore } from '@/lib/store/authStore'

export function AuthGuard() {
  const { isSignedIn, isLoaded } = useAuth()
  const segments = useSegments()
  const router = useRouter()
  const setSignedIn = useAuthStore((state) => state.setSignedIn)

  useEffect(() => {
    if (!isLoaded) return

    const inAuthGroup = segments[0] === '(auth)'
    const inPublicRoute = segments[0] === 'index' || segments.length === 0

    // Update Zustand store
    setSignedIn(!!isSignedIn)

    // Redirect logic
    if (!isSignedIn && !inAuthGroup && !inPublicRoute) {
      router.replace('/(auth)/sign-in')
    } else if (isSignedIn && inAuthGroup) {
      router.replace('/(app)/home')
    }
  }, [isSignedIn, isLoaded, segments])

  return null
}
```

- [ ] **Step 2: Create useAuth.ts hook**

```typescript
// apps/mobile/lib/hooks/useAuth.ts
import { useAuth as useClerkAuth } from '@clerk/expo'
import { useAuthStore } from '../store/authStore'
import { useUserStore } from '../store/userStore'

export function useAuth() {
  const clerkAuth = useClerkAuth()
  const authStore = useAuthStore()
  const userStore = useUserStore()

  const logout = async () => {
    try {
      await clerkAuth.signOut()
      authStore.reset()
      userStore.reset()
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  return {
    ...clerkAuth,
    logout,
    ...authStore,
    profile: userStore.profile,
  }
}
```

- [ ] **Step 3: Create root \_layout.tsx**

```typescript
// apps/mobile/app/_layout.tsx
import { ClerkProvider, useAuth } from '@clerk/expo'
import * as SecureStore from 'expo-secure-store'
import { Stack } from 'expo-router'
import { useEffect } from 'react'
import '../global.css'
import { AuthGuard } from '@/components/auth/AuthGuard'

const tokenCache = {
  async getToken(key: string) {
    try {
      return await SecureStore.getItemAsync(key)
    } catch (err) {
      return null
    }
  },
  async saveToken(key: string, value: string) {
    try {
      return await SecureStore.setItemAsync(key, value)
    } catch (err) {
      return
    }
  },
  async clearToken(key: string) {
    try {
      return await SecureStore.deleteItemAsync(key)
    } catch (err) {
      return
    }
  },
}

export default function RootLayout() {
  return (
    <ClerkProvider
      publishableKey={process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY || ''}
      tokenCache={tokenCache}
    >
      <AuthGuard />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#0A0A0F' },
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(app)" />
      </Stack>
    </ClerkProvider>
  )
}
```

- [ ] **Step 4: Create index.tsx (splash screen)**

```typescript
// apps/mobile/app/index.tsx
import { useRouter } from 'expo-router'
import { View, Text } from 'react-native'
import { useEffect } from 'react'

export default function SplashScreen() {
  const router = useRouter()

  useEffect(() => {
    // Quick redirect to actual app
    router.replace('/(auth)/sign-in')
  }, [])

  return (
    <View className="flex-1 items-center justify-center bg-primary">
      <Text className="text-white text-2xl font-bold">FitAI</Text>
    </View>
  )
}
```

- [ ] **Step 5: Create (auth) layout**

```typescript
// apps/mobile/app/(auth)/_layout.tsx
import { Stack } from 'expo-router'

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="sign-in" />
      <Stack.Screen name="sign-up" />
      <Stack.Screen name="onboarding" />
    </Stack>
  )
}
```

- [ ] **Step 6: Create (app) layout**

```typescript
// apps/mobile/app/(app)/_layout.tsx
import { Stack } from 'expo-router'

export default function AppLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="home" />
      <Stack.Screen name="health" />
      <Stack.Screen name="profile" />
      <Stack.Screen name="settings" />
    </Stack>
  )
}
```

- [ ] **Step 7: Create placeholder screens (empty for now)**

```bash
cd apps/mobile/app
touch (auth)/sign-in.tsx (auth)/sign-up.tsx (auth)/onboarding.tsx
touch (app)/home.tsx (app)/health.tsx (app)/profile.tsx (app)/settings.tsx
```

- [ ] **Step 8: Add basic content to placeholder screens**

For each file, add minimal content:

```typescript
// Example: apps/mobile/app/(auth)/sign-in.tsx
import { View, Text } from 'react-native'

export default function SignInScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-primary">
      <Text className="text-white">Sign In (Coming soon)</Text>
    </View>
  )
}
```

Repeat for all 7 screens.

- [ ] **Step 9: Install all dependencies again**

```bash
cd c:/Users/TUF/Desktop/Ai-Pt
pnpm install
```

- [ ] **Step 10: Test Expo Go startup**

```bash
cd apps/mobile
pnpm start
# Expected: Expo dev server starts on port 8081
# Scan QR code with Expo Go
```

- [ ] **Step 11: Commit**

```bash
cd c:/Users/TUF/Desktop/Ai-Pt
git add apps/mobile/app/ apps/mobile/components/auth/ apps/mobile/lib/hooks/
git commit -m "feat: setup app layout with Clerk integration and AuthGuard"
```

---

**[CONTINUED IN NEXT CHUNK - Due to length, chunks 5-7 follow in next part]**

This is Chunk 1-4 (Project Setup + API Client + Auth Infrastructure).

Would you like me to continue with **Chunk 5-7** (Auth Screens, Dashboard Screens, Storage + Tests)?
