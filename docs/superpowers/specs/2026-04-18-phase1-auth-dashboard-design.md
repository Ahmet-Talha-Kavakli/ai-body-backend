# Phase 1: Auth + Core Dashboard Design

> **For agentic workers:** Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan.

**Goal:** Port web's authentication and core dashboard to mobile with full parity, optimized for mobile UX.

**Architecture:** Mobile-first React Native + Expo app with shared API client, local SQLite caching for offline support, Zustand state management, and Nativewind for UI consistency with web.

**Tech Stack:** React Native, Expo 54, Clerk (@clerk/expo), Zustand, SQLite, AsyncStorage, Axios, Nativewind, TypeScript

---

## 1. Overview

Phase 1 establishes the foundation for FitAI mobile:

- **Authentication:** Sign in, sign up, Clerk integration (identical to web)
- **Onboarding:** 5-step mobile-optimized form (vs 10-step on web)
- **Core Dashboard:** Home screen, health profile, user profile, settings
- **Offline Support:** SQLite caching + AsyncStorage for offline UX
- **API Layer:** New `@fitai/api-client` package for type-safe, reusable API calls
- **UI Consistency:** Nativewind ensures Tailwind classes work on both web and mobile

This phase is **fully testable, deployable, and independent** — subsequent phases (Workouts, Nutrition, Health, Social) build on this foundation.

---

## 2. Architecture

### Data Flow

```
Mobile App (React Native)
    ↓ (Clerk auth + SecureStore)
Auth State (Zustand)
    ↓ (User data)
SQLite Cache + AsyncStorage
    ↓ (fetch on mount if stale)
@fitai/api-client
    ↓ (HTTP requests)
Web Backend (Node.js + PostgreSQL)
```

### Layer Breakdown

**UI Layer (Screens + Components)**

- Auth screens: `SignInScreen`, `SignUpScreen`, `OnboardingScreen`
- Dashboard screens: `HomeScreen`, `HealthProfileScreen`, `ProfileScreen`, `SettingsScreen`
- Shared components: `Button`, `Input`, `Card`, `Avatar` (Nativewind-based, reusable with web)
- Error boundaries and loading states

**State Management (Zustand)**

- `authStore`: User login state, tokens, auth status
- `userStore`: Profile data, preferences, cached user info
- `dashboardStore`: Home stats, health metrics, quick actions

**Storage Layer**

- **SQLite:** Persistent cache for user data, dashboard metrics, health profiles
- **AsyncStorage:** Sync queue, auth tokens (backup), preferences
- **SecureStore:** Sensitive data (Clerk tokens, API keys)

**API Client (`@fitai/api-client`)**

- HTTP client (Axios)
- Type-safe endpoints: `/auth`, `/user`, `/dashboard`, `/health`
- Error handling + retry logic
- Request/response types shared with web
- Offline queue management

---

## 3. Screens & Components

### Auth Flow

**SignInScreen**

- Email + Password inputs
- Sign in button (calls `/api/auth/sign-in`)
- "Don't have account?" → Sign up
- Error handling + loading state
- On success: save token → redirect to Onboarding or Home

**SignUpScreen**

- Email + Password + Confirm password
- Validation (password strength, email format)
- Sign up button (calls `/api/auth/sign-up`)
- "Already have account?" → Sign in
- On success: redirect to Onboarding

**OnboardingScreen** (Mobile-optimized, 5 steps vs web's 10)

1. **Welcome** - Intro + goal selection (Fat loss, Muscle gain, Endurance)
2. **Personal Info** - Name, age, gender
3. **Body Metrics** - Height, weight, body type
4. **Activity Level** - Sedentary, light, moderate, vigorous
5. **Health Profile** - Conditions, injuries, dietary preferences

Flow: Step 1 → Step 2 → ... → Step 5 → Save to backend → Redirect to Home

**AuthGuard**

- Runs on app launch
- Checks Clerk auth status
- Redirects unauthenticated → Sign in
- Redirects authenticated at auth screens → Home
- Handles token refresh

### Dashboard Screens

**HomeScreen**

- Header: User avatar, greeting, date
- Quick stats: Today's calories, water intake, steps, workout time
- Quick actions: Start workout, Log meal, Add water, View achievements
- Upcoming: Next scheduled workout
- Recent activity: Last 3 completed workouts
- Pull-to-refresh to update from backend

**HealthProfileScreen**

- Tabs: Overview, Activity, Body, Health, Sleep, Water, Devices (like web)
- Each tab displays detailed metrics with charts/progress bars
- Data fetched on mount, cached in SQLite
- Edit buttons where applicable

**ProfileScreen**

- Avatar (editable)
- Name, email, phone (editable)
- Stats: Total workouts, total calories burned, current streak
- Edit profile button → edit form
- Save to backend + SQLite

**SettingsScreen**

- Account: Email, phone, password change
- Preferences: Theme (light/dark), notifications, language
- Data Privacy: Data export, account deletion
- About: App version, credits
- Logout button with confirmation

### Shared Components (Nativewind-based)

```tsx
// Button.tsx
<View className="bg-blue-500 rounded-lg p-3">
  <Text className="text-white font-bold text-center">Press me</Text>
</View>

// Input.tsx
<TextInput
  className="border border-gray-300 rounded-lg p-3 text-base"
  placeholder="Enter email"
/>

// Card.tsx
<View className="bg-white rounded-lg p-4 shadow-sm">
  {children}
</View>

// Avatar.tsx
<Image
  source={{ uri: avatarUrl }}
  className="w-16 h-16 rounded-full"
/>
```

These components use Tailwind classes via Nativewind, making them shareable with web if wrapped with conditional rendering.

---

## 4. Data Models

### User (from web, synced to mobile SQLite)

```typescript
{
  id: string;
  clerkId: string;
  email: string;
  name: string;
  avatar?: string;
  age?: number;
  gender?: 'male' | 'female' | 'other';
  height?: number; // cm
  weight?: number; // kg
  goalType?: 'fat_loss' | 'muscle_gain' | 'endurance';
  activityLevel?: 'sedentary' | 'light' | 'moderate' | 'vigorous';
  healthConditions?: string[];
  createdAt: date;
  updatedAt: date;
}
```

### DashboardCache (SQLite, for offline)

```typescript
{
  userId: string
  type: 'home' | 'health' | 'profile'
  data: JSON
  cachedAt: timestamp
  expiresAt: timestamp
}
```

### SyncQueue (AsyncStorage, for offline sync)

```typescript
{
  id: string
  action: 'POST' | 'PUT' | 'DELETE'
  endpoint: string
  payload: JSON
  createdAt: timestamp
  retries: number
}
```

---

## 5. API Endpoints (via @fitai/api-client)

The app calls these existing web endpoints:

```
POST   /api/auth/sign-in           → { token, user }
POST   /api/auth/sign-up           → { token, user }
GET    /api/user/profile           → { user }
PUT    /api/user/profile           → { user }
GET    /api/dashboard/home         → { stats, recentWorkouts, upcoming }
GET    /api/health/overview        → { metrics }
GET    /api/health/activity        → { data }
GET    /api/health/body            → { data }
GET    /api/health/sleep           → { data }
GET    /api/water/dashboard        → { data }
POST   /api/user/settings          → { success }
POST   /api/auth/logout            → { success }
```

All wrapped by `@fitai/api-client` with:

- Automatic token injection (from SecureStore)
- Error handling + retry
- Type-safe requests/responses
- Offline queue fallback

---

## 6. State Management (Zustand)

### authStore

```typescript
{
  // State
  isSignedIn: boolean
  user: User | null
  token: string | null
  isLoading: boolean
  error: string | null

  // Actions
  signIn(email, password)
  signUp(email, password)
  logout()
  refreshToken()
  setUser(user)
}
```

### userStore

```typescript
{
  // State
  profile: User | null
  isLoading: boolean
  error: string | null

  // Actions
  fetchProfile()
  updateProfile(updates)
  setProfile(profile)
}
```

### dashboardStore

```typescript
{
  // State
  stats: DashboardStats | null;
  health: HealthMetrics | null;
  recentWorkouts: Workout[];
  isLoading: boolean;
  error: string | null;
  lastFetch: timestamp;

  // Actions
  fetchDashboard();
  fetchHealth();
  setStats(stats);
  clearCache();
}
```

---

## 7. Storage Layer

### SQLite Schema

```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  clerkId TEXT UNIQUE,
  email TEXT,
  name TEXT,
  avatar TEXT,
  age INTEGER,
  gender TEXT,
  height REAL,
  weight REAL,
  goalType TEXT,
  activityLevel TEXT,
  healthConditions TEXT,
  createdAt TIMESTAMP,
  updatedAt TIMESTAMP
);

CREATE TABLE dashboard_cache (
  id TEXT PRIMARY KEY,
  userId TEXT,
  type TEXT,
  data TEXT,
  cachedAt TIMESTAMP,
  expiresAt TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id)
);

CREATE TABLE sync_queue (
  id TEXT PRIMARY KEY,
  userId TEXT,
  action TEXT,
  endpoint TEXT,
  payload TEXT,
  createdAt TIMESTAMP,
  retries INTEGER,
  FOREIGN KEY (userId) REFERENCES users(id)
);
```

### AsyncStorage Keys

- `fitai:auth_token` - Clerk token backup
- `fitai:user_id` - Current user ID
- `fitai:theme` - light | dark
- `fitai:language` - en | tr | etc
- `fitai:notification_settings` - JSON

---

## 8. Offline Support

**When online:**

- Fetch from backend
- Update SQLite cache
- Update Zustand state
- Clear sync queue

**When offline:**

- Check SQLite cache
- If cache exists and fresh (< 1 hour), display cached data
- If cache stale or missing, show "Offline - Last updated X minutes ago"
- Queue mutations (profile update, etc.) in AsyncStorage
- On reconnect, flush sync queue (with retry logic)

**Sync Queue Processing:**

```typescript
// On reconnect detected:
for (const item of syncQueue) {
  try {
    const response = await apiClient[item.action](item.endpoint, item.payload)
    await db.deleteSyncQueueItem(item.id)
  } catch (error) {
    item.retries++
    if (item.retries > 3) {
      notifyUserOfSyncFailure(item)
    }
  }
}
```

---

## 9. Error Handling

**Network Errors:**

- Detect offline → show offline banner
- On API error (4xx/5xx) → show toast + log
- Retry logic in apiClient (exponential backoff)

**Auth Errors:**

- 401 Unauthorized → refresh token or redirect to sign in
- 403 Forbidden → show permission error

**Validation Errors:**

- Form validation on input change
- Show inline error messages
- Submit disabled if form invalid

---

## 10. Testing Strategy

### Unit Tests (Vitest)

- Store actions (authStore, userStore, dashboardStore)
- Utility functions (formatters, validators)
- SQLite operations (CRUD)

### Integration Tests

- Auth flow: sign up → onboarding → home
- Dashboard: fetch → cache → offline display
- Sync queue: queue item → flush on reconnect

### E2E Tests (Playwright)

- Full auth + dashboard flow on Expo
- Offline scenario (toggle network, check cache)
- Settings changes persist

### Coverage Goal

- 80%+ for critical paths (auth, dashboard, sync)
- 60%+ for UI components

---

## 11. File Structure

```
apps/mobile/
├── app/
│   ├── (auth)/
│   │   ├── _layout.tsx
│   │   ├── sign-in.tsx
│   │   ├── sign-up.tsx
│   │   └── onboarding/
│   │       ├── _layout.tsx
│   │       └── index.tsx
│   ├── (app)/
│   │   ├── _layout.tsx
│   │   ├── home.tsx
│   │   ├── health.tsx
│   │   ├── profile.tsx
│   │   └── settings.tsx
│   ├── _layout.tsx (Root + AuthGuard)
│   └── index.tsx (Splash)
├── components/
│   ├── shared/
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Card.tsx
│   │   ├── Avatar.tsx
│   │   ├── LoadingSpinner.tsx
│   │   └── ErrorBoundary.tsx
│   ├── auth/
│   │   ├── AuthGuard.tsx
│   │   ├── SignInForm.tsx
│   │   ├── SignUpForm.tsx
│   │   └── OnboardingForm.tsx
│   └── dashboard/
│       ├── DashboardHeader.tsx
│       ├── QuickStats.tsx
│       ├── QuickActions.tsx
│       ├── HealthTabs.tsx
│       └── ActivityCard.tsx
├── lib/
│   ├── store/
│   │   ├── authStore.ts
│   │   ├── userStore.ts
│   │   └── dashboardStore.ts
│   ├── db/
│   │   ├── init.ts
│   │   ├── user.ts
│   │   ├── cache.ts
│   │   ├── syncQueue.ts
│   │   └── schema.sql
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useDashboard.ts
│   │   ├── useOffline.ts
│   │   └── useHealth.ts
│   ├── utils/
│   │   ├── formatters.ts
│   │   ├── validators.ts
│   │   └── errors.ts
│   └── types/
│       └── index.ts (Shared types from web)
├── __tests__/
│   ├── store/
│   ├── db/
│   ├── lib/
│   └── integration/
├── global.css (Tailwind)
├── app.json
├── eas.json
├── tsconfig.json
├── nativewind.config.js
└── package.json

packages/api-client/ (NEW)
├── src/
│   ├── index.ts (exports)
│   ├── client.ts (Axios instance + interceptors)
│   ├── auth.ts (POST /auth/sign-in, /auth/sign-up)
│   ├── user.ts (GET/PUT /user/profile, /user/settings)
│   ├── dashboard.ts (GET /dashboard/home)
│   ├── health.ts (GET /health/*)
│   ├── types.ts (Request/response types)
│   ├── errors.ts (Error classes + handlers)
│   └── __tests__/
│       ├── client.test.ts
│       ├── auth.test.ts
│       ├── user.test.ts
│       └── dashboard.test.ts
├── package.json (dependencies: axios, @fitai/shared-types)
└── tsconfig.json
```

---

## 12. Implementation Phases (Rough Timeline)

1. **Setup** (1 day): Expo project init, Nativewind setup, dependency config
2. **API Client** (1.5 days): `@fitai/api-client` package + tests
3. **Auth Flow** (2 days): Sign in, sign up, onboarding screens + Clerk integration
4. **Dashboard** (2.5 days): Home, health, profile, settings screens
5. **Storage + Offline** (1.5 days): SQLite, AsyncStorage, sync queue
6. **Testing + Bug Fixes** (1 day): Unit + integration tests, Expo Go testing
7. **Polish + Deploy** (0.5 days): Error handling, loading states, EAS build

**Total: ~10 days for Phase 1**

---

## 13. Success Criteria

✅ All 5 onboarding steps work correctly
✅ Dashboard fully mirrors web (home, health, profile, settings)
✅ Offline mode works (SQLite cache + sync queue)
✅ Auth flow tested end-to-end
✅ Nativewind UI consistent with web
✅ 80%+ test coverage for critical paths
✅ Runs on Expo Go without errors
✅ EAS build compiles for iOS/Android
✅ No TypeScript errors
✅ Zero Clerk integration issues

---

## 14. Dependencies to Install

```json
{
  "dependencies": {
    "@clerk/expo": "^3.1.9",
    "@fitai/shared-types": "workspace:*",
    "@fitai/api-client": "workspace:*",
    "@react-native-async-storage/async-storage": "^1.21.0",
    "expo": "~54.0.0",
    "expo-router": "~6.0.0",
    "expo-secure-store": "~15.0.0",
    "nativewind": "^4.2.3",
    "react": "19.1.0",
    "react-native": "0.81.5",
    "zustand": "^5.0.0"
  },
  "devDependencies": {
    "@types/react": "~19.1.0",
    "typescript": "~5.9.0",
    "vitest": "^3.1.0"
  }
}
```

---

## 15. Notes

- **Web Parity:** Every feature on web's auth + dashboard will be on mobile
- **Mobile UX:** Onboarding condensed from 10 → 5 steps, but same data collected
- **Offline First:** SQLite cache + async sync prioritize offline UX
- **Type Safety:** All API calls typed via `@fitai/api-client`
- **Testing:** 80%+ coverage for critical paths before Phase 2
- **No Technical Debt:** Clean slate, no legacy code, full test suite from day 1
