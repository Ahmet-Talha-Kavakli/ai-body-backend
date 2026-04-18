# Phase 1: Complete Auth + Core Dashboard (Mobile)

> **For agentic workers:** Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan.

**Goal:** Port web's complete authentication + core dashboard to mobile with full parity, optimized for mobile UX, with offline SQLite caching.

**Architecture:** Fresh React Native + Expo with Clerk auth, Zustand state, SQLite offline cache, Nativewind UI, and shared `@fitai/api-client` package for type-safe API calls.

**Tech Stack:** React Native 0.81.5, Expo 54, TypeScript, Zustand, Clerk, SQLite, AsyncStorage, Nativewind, Axios, Vitest

---

## 1. Overview

Phase 1 is the foundation for all mobile features. Port web's entire auth flow + dashboard to mobile with offline-first approach:

### Features to Port

- **Auth:** Clerk sign in/up, token management (SecureStore)
- **Onboarding:** 5-step form (condensed from web's 10 steps)
- **Dashboard:** Home screen with stats, quick actions, recent activity
- **Health Profile:** All 6 health tabs (Overview, Activity, Body, Health, Sleep, Water)
- **User Profile:** Avatar, name, email, stats (workouts, calories, streak)
- **Settings:** Theme, notifications, data privacy, logout
- **Offline Support:** SQLite caching + AsyncStorage sync queue

### Data Syncing Strategy

- SQLite as local cache for offline access
- AsyncStorage for sync queue (mutations while offline)
- Optimistic UI updates
- Background sync on reconnect (exponential backoff retry)

---

## 2. Architecture

### Data Flow

```
Mobile App (React Native)
    ↓
Clerk Auth (SecureStore token)
    ↓
Zustand Stores (authStore, userStore, dashboardStore)
    ↓
SQLite Cache (DashboardCache, UserCache, SyncQueue)
    ↓
@fitai/api-client (with token injection)
    ↓
Web Backend (PostgreSQL)
```

### Layer Breakdown

**UI Layer**

- Auth screens: SignIn, SignUp, Onboarding (5 steps)
- Dashboard screens: Home, HealthProfile (6 tabs), Profile, Settings
- Shared components: Button, Input, Card, Avatar (Nativewind-based, reusable)
- Error boundaries, loading states, offline indicators

**State Management (Zustand)**

- `authStore`: isSignedIn, user, token, isLoading, error
- `userStore`: profile, healthMetrics, isLoading, error
- `dashboardStore`: stats, health, recentActivity, lastFetch, isLoading

**Storage Layer**

- **SQLite:** User profile, health data, dashboard stats (1-hour TTL)
- **AsyncStorage:** Sync queue, preferences (theme, notifications)
- **SecureStore:** Clerk tokens, API keys (sensitive)

**API Client**

- New package: `@fitai/api-client`
- HTTP client with Axios
- Automatic token injection from SecureStore
- Retry logic (exponential backoff)
- Error handling + mapping to custom error classes
- Type-safe requests/responses

---

## 3. Screens & Components

### Auth Flow

**SignInScreen**

- Email + Password inputs (validation)
- Sign in button → POST /api/auth/sign-in (Clerk)
- "Don't have account?" → SignUp
- Error toast on failure
- Loading state during request
- On success: save token → fetch user profile → redirect to Home

**SignUpScreen**

- Email + Password + Confirm password
- Password strength indicator
- Sign up button → POST /api/auth/sign-up (Clerk)
- "Already have account?" → SignIn
- Validation: email format, password 8+ chars, no special requirements
- On success: redirect to Onboarding

**OnboardingScreen** (5 steps, mobile-optimized)

```
Step 1: Welcome
  - Welcome message + goal selection (Fat loss, Muscle gain, Endurance)

Step 2: Personal Info
  - Name, age, gender (male|female|other)

Step 3: Body Metrics
  - Height (cm), weight (kg), body type

Step 4: Activity Level
  - Sedentary, light, moderate, vigorous

Step 5: Health Profile
  - Health conditions (checkboxes: diabetes, hypertension, etc.)
  - Injuries (open text)
  - Dietary preferences (vegetarian, vegan, etc.)
  - Complete onboarding → POST /api/onboarding/complete
  - On success: redirect to Home
```

Each step: Previous/Next buttons, progress indicator, auto-save to AsyncStorage (recover on crash)

**AuthGuard**

- Runs on app launch
- Checks Clerk auth status
- Redirects unauthenticated → SignIn
- Redirects authenticated at auth screens → Home
- Handles token refresh

### Dashboard Screens

**HomeScreen**

- Header: User avatar, greeting ("Good morning, Ahmed"), date
- Quick stats:
  - Today's calories (current/goal with progress bar)
  - Water intake (current/goal)
  - Steps (current/goal)
  - Workout time (duration in minutes)
- Quick actions (4 buttons):
  - Start workout
  - Log meal
  - Add water
  - View achievements
- Upcoming: Next scheduled workout (if exists)
- Recent activity: Last 3 completed workouts (exercise, date, form score)
- Pull-to-refresh: Syncs with backend

Data source: DashboardStore → `/api/dashboard/stats` (cached, 1-hour TTL)

**HealthProfileScreen**
Tabs (SwipeableTabView or BottomTabNavigator):

1. **Overview Tab**
   - Current health status summary
   - Key metrics: BMI, age, fitness level
   - Health goals progress

2. **Activity Tab**
   - Steps (today/week/month chart)
   - Active minutes
   - Calories burned
   - Data from: `/api/health/activity`

3. **Body Tab**
   - Weight trend (line chart, last 30 days)
   - Body metrics (height, current weight vs target)
   - Progress: Days until target weight (if set)
   - Add weight button → POST `/api/health/weight`
   - Data from: `/api/health/body`

4. **Health Tab**
   - Health conditions (from profile)
   - Injuries (active status)
   - Health metrics (BP, heart rate, glucose if logged)
   - Data from: `/api/health`

5. **Sleep Tab**
   - Sleep hours (last 7 days)
   - Sleep quality (1-10 scale)
   - Average sleep time
   - Data from: `/api/health/sleep`

6. **Water Tab**
   - Daily goal progress (visual circle)
   - Glasses logged today
   - Quick add button ("+250ml", "+500ml")
   - Today's streak
   - Weekly trend
   - Data from: `/api/water/dashboard`

**ProfileScreen**

- Avatar (editable, tap to change)
- User info:
  - Name (editable)
  - Email (display only)
  - Phone (if available)
- Stats section:
  - Total workouts (all-time)
  - Total calories burned (all-time)
  - Current streak (days)
  - XP/Level (if gamification enabled)
- Edit profile button → edit form
- Save → PUT `/api/user/profile`

**SettingsScreen**
Sections (expandable):

1. **Account**
   - Email (display)
   - Phone (editable)
   - Password change → navigate to password form
   - Two-factor auth toggle (if available)

2. **Preferences**
   - Theme: Light/Dark toggle
   - Language: English/Turkish
   - Timezone: picker

3. **Notifications**
   - Master toggle
   - Individual toggles:
     - Water reminders
     - Meal reminders
     - Workout reminders
     - Streak warnings
     - Achievement alerts
   - GET/PUT `/api/notifications/preferences`

4. **Data & Privacy**
   - Data collection toggles
   - Analytics toggle
   - Export data button → POST `/api/user/export`
   - Delete account button → confirmation dialog → DELETE user

5. **About**
   - App version
   - Credits
   - Terms of service link
   - Privacy policy link

6. **Logout**
   - Logout button → confirmation → clear auth state → redirect to SignIn

### Shared Components (Nativewind)

```tsx
// Button.tsx - Uses Tailwind classes via Nativewind
<Pressable className="bg-blue-500 rounded-lg px-4 py-2">
  <Text className="text-white font-bold text-center">{label}</Text>
</Pressable>

// Input.tsx - Text input with Tailwind styling
<TextInput
  className="border border-gray-300 rounded-lg px-3 py-2 text-base"
  placeholder={placeholder}
  {...props}
/>

// Card.tsx - Container with shadow
<View className="bg-white rounded-lg p-4 shadow-sm border border-gray-200/50">
  {children}
</View>

// Avatar.tsx - User avatar
<Image
  source={{ uri: avatarUrl }}
  className="w-16 h-16 rounded-full"
/>

// ProgressBar.tsx - Linear progress with percentage
<View className="h-2 bg-gray-200 rounded-full overflow-hidden">
  <View className="h-full bg-blue-500" style={{ width: `${percentage}%` }} />
</View>

// LoadingSpinner.tsx - Activity indicator
<ActivityIndicator size="large" color="#3366FF" />

// ErrorMessage.tsx - Error toast
<View className="bg-red-100 border border-red-300 rounded-lg p-3">
  <Text className="text-red-700">{message}</Text>
</View>
```

---

## 4. Data Models

### User Profile (SQLite + State)

```typescript
{
  id: string;
  clerkId: string;
  email: string;
  name: string;
  avatarUrl?: string;
  age?: number;
  gender?: 'male' | 'female' | 'other';
  height?: number; // cm
  weight?: number; // kg
  goalType?: 'fat_loss' | 'muscle_gain' | 'endurance';
  activityLevel?: 'sedentary' | 'light' | 'moderate' | 'vigorous';
  healthConditions?: string[];
  injuries?: Array<{ bodyPart: string; severity: string; description: string }>;
  createdAt: string;
  updatedAt: string;
}
```

### Dashboard Stats (SQLite Cache)

```typescript
{
  userId: string;
  date: string;
  todayCalories: number;
  calorieGoal: number;
  todayWater: number; // ml
  waterGoal: number;
  todaySteps: number;
  stepsGoal: number;
  workoutTime: number; // minutes
  recentWorkouts: Array<{
    id: string;
    name: string;
    completedAt: string;
    duration: number;
    calories: number;
    formScore?: number;
  }>;
  upcomingWorkout?: {
    id: string;
    name: string;
    scheduledAt: string;
  };
  cachedAt: timestamp;
  expiresAt: timestamp; // 1 hour TTL
}
```

### Health Metrics (SQLite)

```typescript
{
  userId: string;
  date: string;
  steps: number;
  activeMinutes: number;
  calories: number;
  sleepHours: number;
  sleepQuality: number;
  weight?: number;
  heartRate?: number;
  bloodPressure?: { systolic: number; diastolic: number };
  bloodGlucose?: number;
}
```

### Sync Queue (AsyncStorage)

```typescript
{
  id: string;
  userId: string;
  action: 'POST' | 'PUT' | 'DELETE';
  endpoint: string;
  payload: JSON;
  createdAt: timestamp;
  retries: number;
  lastRetryAt?: timestamp;
}
```

---

## 5. API Endpoints

Mobile uses existing web API endpoints:

```
POST   /api/auth/sign-in              → { token, user }
POST   /api/auth/sign-up              → { token, user }
GET    /api/user/profile              → { user }
PUT    /api/user/profile              → { user }
GET    /api/user/profile/health       → { healthProfile }
PUT    /api/user/profile/health       → { healthProfile }
GET    /api/dashboard/stats           → { stats, recentWorkouts, upcoming }
GET    /api/health/overview           → { overview metrics }
GET    /api/health/activity           → { steps, activeMinutes, calories }
GET    /api/health/body               → { weight, bmi, progress }
GET    /api/health                    → { conditions, injuries }
GET    /api/health/sleep              → { sleepHours, sleepQuality, trend }
GET    /api/water/dashboard           → { todayWater, goal, streak }
POST   /api/health/weight             → { entry }
POST   /api/nutrition/water           → { logged }
GET    /api/notifications/preferences → { prefs }
PUT    /api/notifications/preferences → { prefs }
POST   /api/onboarding/complete       → { success }
GET    /api/user/export               → { csv/json file }
DELETE /api/user/account              → { success }
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
  isSignedIn: boolean;
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;

  setSignedIn(signed: boolean): void;
  setUser(user: User | null): void;
  setToken(token: string | null): void;
  setLoading(loading: boolean): void;
  setError(error: string | null): void;
  reset(): void;
}
```

### userStore

```typescript
{
  profile: UserProfile | null;
  isLoading: boolean;
  error: string | null;
  lastFetch: number | null;

  setProfile(profile: UserProfile | null): void;
  setLoading(loading: boolean): void;
  setError(error: string | null): void;
  setLastFetch(time: number): void;
  reset(): void;
}
```

### dashboardStore

```typescript
{
  stats: DashboardStats | null;
  health: HealthMetrics | null;
  isLoading: boolean;
  error: string | null;
  lastFetch: number | null;

  setStats(stats: DashboardStats): void;
  setHealth(health: HealthMetrics): void;
  setLoading(loading: boolean): void;
  setError(error: string | null): void;
  setLastFetch(time: number): void;
  reset(): void;
}
```

---

## 7. Offline Support

### Strategy

- **Check cache first:** SQLite (1-hour TTL)
- **If stale/missing:** Fetch from backend, update cache
- **Mutations offline:** Queue in AsyncStorage
- **On reconnect:** Flush queue with retry logic

### Cache TTL

- Dashboard stats: 1 hour
- User profile: 1 hour
- Health metrics: 1 hour
- Exercise library: 24 hours

### Sync Queue Processing

```typescript
async function flushSyncQueue() {
  const items = await AsyncStorage.getItem('syncQueue') // Array<SyncQueueItem>

  for (const item of items) {
    try {
      const response = await apiClient[item.action](item.endpoint, item.payload)
      await AsyncStorage.removeItem(`sync_${item.id}`)
      showNotification('Synced: ' + item.endpoint)
    } catch (error) {
      if (item.retries < 3) {
        item.retries++
        item.lastRetryAt = now()
        // Exponential backoff: 1s, 2s, 4s
        const delay = Math.pow(2, item.retries) * 1000
        setTimeout(() => flushSyncQueue(), delay)
      } else {
        showNotification('Sync failed: ' + item.endpoint + ', retry later')
      }
    }
  }
}
```

### Offline Indicators

- Show "Offline mode" banner when no network
- Show "Syncing..." badge on items in queue
- Show last updated timestamp on cached data

---

## 8. Error Handling

**Network Errors**

- Detect offline → show offline banner + queue mutation
- Retry with exponential backoff (max 3 retries)
- Show "Failed to sync" toast after retries exhausted

**Auth Errors**

- 401 Unauthorized → refresh token or redirect to SignIn
- 403 Forbidden → show permission error

**Validation Errors**

- Form validation on input change
- Show inline error messages
- Submit button disabled if invalid

**API Errors**

- 4xx → show user-friendly error message
- 5xx → retry with backoff + show error after retries

---

## 9. Testing Strategy

### Unit Tests (Vitest)

- Store actions (authStore, userStore, dashboardStore)
- Utility functions (formatters, validators, cache logic)
- SQLite operations (CRUD)
- Sync queue processing

### Integration Tests

- Auth flow: sign up → onboarding → home
- Dashboard: fetch → cache → offline display
- Sync queue: queue item → flush on reconnect
- Settings: change preference → persist → sync

### E2E Tests (Playwright - optional for Phase 1)

- Full auth + dashboard flow
- Offline scenario (toggle network, verify cache)

### Coverage Goal

- 80%+ for critical paths (auth, dashboard, sync)
- 60%+ for UI components

---

## 10. File Structure

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
│   │   ├── health/
│   │   │   ├── _layout.tsx
│   │   │   └── index.tsx
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
│   │   ├── ProgressBar.tsx
│   │   ├── ErrorMessage.tsx
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
│       ├── RecentActivity.tsx
│       ├── HealthTabs.tsx
│       ├── ActivityTab.tsx
│       ├── BodyTab.tsx
│       ├── HealthTab.tsx
│       ├── SleepTab.tsx
│       └── WaterTab.tsx
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
│   │   ├── useHealth.ts
│   │   ├── useOffline.ts
│   │   └── useSyncQueue.ts
│   ├── utils/
│   │   ├── formatters.ts
│   │   ├── validators.ts
│   │   ├── errors.ts
│   │   ├── cache.ts
│   │   └── sync.ts
│   └── types/
│       └── index.ts (Shared types from web)
├── __tests__/
│   ├── store/
│   ├── db/
│   ├── lib/
│   ├── hooks/
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
│   ├── user.ts (GET/PUT /user/profile, /user/profile/health, etc.)
│   ├── dashboard.ts (GET /dashboard/stats)
│   ├── health.ts (GET /health/*, POST /health/weight)
│   ├── water.ts (GET /water/*, POST /nutrition/water)
│   ├── notifications.ts (GET/PUT /notifications/preferences)
│   ├── onboarding.ts (POST /onboarding/complete)
│   ├── types.ts (Request/response types)
│   ├── errors.ts (Error classes + handlers)
│   └── __tests__/
│       ├── client.test.ts
│       ├── auth.test.ts
│       ├── user.test.ts
│       ├── dashboard.test.ts
│       └── health.test.ts
├── package.json
└── tsconfig.json
```

---

## 11. Dependencies

```json
{
  "dependencies": {
    "@clerk/expo": "^3.1.9",
    "@fitai/shared-types": "workspace:*",
    "@fitai/api-client": "workspace:*",
    "@react-native-async-storage/async-storage": "^1.21.0",
    "expo": "~54.0.33",
    "expo-router": "~6.0.23",
    "expo-secure-store": "~15.0.8",
    "nativewind": "^4.2.3",
    "react": "19.1.0",
    "react-native": "0.81.5",
    "zustand": "^5.0.3"
  },
  "devDependencies": {
    "@types/react": "~19.1.0",
    "typescript": "~5.9.2",
    "vitest": "^3.1.0"
  }
}
```

---

## 12. Success Criteria

✅ Clerk auth works (sign in, sign up, token refresh)
✅ Onboarding flow complete (5 steps, save to backend)
✅ Dashboard home screen with today's stats
✅ Health profile with all 6 tabs
✅ User profile with editable fields
✅ Settings: theme, notifications, logout
✅ SQLite caching + 1-hour TTL
✅ AsyncStorage sync queue + retry logic
✅ Offline mode works (cache serves data)
✅ Error handling + user-friendly messages
✅ 80%+ test coverage for critical paths
✅ Nativewind UI consistent with web
✅ No TypeScript errors
✅ Runs on Expo Go without errors
✅ EAS build compiles for iOS/Android

---

## 13. Timeline

~10 days (setup + implementation + testing):

- Days 1-2: Project setup, Nativewind, Vitest
- Days 3-4: @fitai/api-client package
- Days 5-6: Auth flow (sign in, sign up, onboarding)
- Days 7-8: Dashboard + settings
- Days 9-10: Offline support + testing + bug fixes

---

## 14. Notes

- **Offline-first:** SQLite is source of truth when offline, backend when online
- **Type safety:** All API calls typed via `@fitai/api-client`, shared types
- **Nativewind:** Tailwind classes work on both web + mobile
- **No legacy code:** Clean slate, test-driven development
- **Sync queue:** Fire-and-forget mutations, guaranteed delivery
- **Error resilience:** Graceful handling of network, auth, validation errors
