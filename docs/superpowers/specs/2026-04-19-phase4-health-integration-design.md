# Phase 4: Health Integration (HealthKit) - Specification

**Date:** 2026-04-19
**Status:** Approved Design
**Target Timeline:** 4-5 days (parallel subagents)
**Success Criteria:** 50+ tests, offline-first, production-ready HealthKit integration

---

## 1. Overview

Phase 4 adds Apple HealthKit integration to the mobile app, enabling read-only access to core health metrics (heart rate, sleep, steps, energy burned). Built on Phase 1 (auth, dashboard) + Phase 2 (workout) + Phase 3 (nutrition) foundations.

**Key differentiator:** Offline-first HealthKit cache with intelligent aggregation, dedicated Health tab with detailed visualizations, and minimal dashboard widget for quick glance.

---

## 2. Scope Decisions (Approved)

✅ **Read-only HealthKit** (no writes to avoid duplicate/conflict issues)
✅ **Core health metrics only** (heart rate, sleep, steps, energy burned)
✅ **Dedicated Health tab** + minimal dashboard widget
✅ **iOS only** for Phase 4 (Android Google Fit deferred to Phase 5+)

---

## 3. Architecture

### 3.1 Data Flow

```
HealthKit (iOS)
  ↓ react-native-health
HealthKit Service Layer (permission + reads)
  ↓
Zustand Store (healthStore - in-memory state)
  ↓
SQLite Cache (offline persistence)
  ↓
UI Layer (Health tab + dashboard widget)
```

### 3.2 Offline-First Strategy

- **Local cache:** SQLite stores last 90 days of daily aggregates
- **Fresh reads:** Background sync on app open + pull-to-refresh
- **Stale handling:** Show cached data immediately, fetch fresh in background
- **Permission fallback:** If HealthKit denied, show permission request UI

---

## 4. Core Features

✅ **Heart Rate Tracking** (current, resting, average, trends)
✅ **Sleep Monitoring** (duration, stages, weekly patterns)
✅ **Step Counter** (daily count, goal progress, history)
✅ **Energy Burned** (active calories, total calories, daily)
✅ **Dashboard Widget** (minimal today's summary)
✅ **Health Tab** (detailed views, charts, trends)
✅ **Offline Access** (SQLite cache)

---

## 5. Data Models

```typescript
interface HeartRateReading {
  id: string
  userId: string
  bpm: number
  timestamp: string // ISO
  sourceDevice: string
  context?: 'resting' | 'active' | 'workout'
}

interface SleepSession {
  id: string
  userId: string
  startTime: string
  endTime: string
  durationMinutes: number
  stages: {
    remMinutes: number
    deepMinutes: number
    lightMinutes: number
    awakeMinutes: number
  }
}

interface StepData {
  date: string // YYYY-MM-DD
  count: number
  goalCount: number // default 10,000
  distance?: number // meters
}

interface EnergyBurned {
  date: string
  activeCalories: number
  basalCalories: number
  totalCalories: number
}

interface DailyHealthSummary {
  date: string
  heartRateAvg: number
  heartRateResting: number
  sleepDurationMinutes: number
  stepCount: number
  activeCalories: number
}

interface HealthPermissionStatus {
  heartRate: boolean
  sleep: boolean
  steps: boolean
  energy: boolean
  granted: boolean
  requestedAt?: string
}
```

---

## 6. Screens & Components

**Main Screens:**

- HealthPermissionScreen (initial setup + re-request if denied)
- HealthScreen (main dashboard for Health tab)
- HeartRateDetailScreen (trends + current)
- SleepDetailScreen (stages + patterns)
- StepsDetailScreen (daily + weekly)
- EnergyDetailScreen (active + basal)

**Components:**

- HealthDashboardWidget (home screen card)
- HeartRateChart (SVG line chart)
- SleepStagesChart (stacked bars)
- StepProgressRing (circular progress)
- EnergyBurnedCard
- HealthSummaryCard
- PermissionRequestCard

---

## 7. Integration Points

**react-native-health:** HealthKit wrapper for iOS
**Zustand:** In-memory state management
**SQLite:** Local caching
**expo-device:** Platform detection (iOS check)
**Dashboard Integration:** Add widget to existing home screen

---

## 8. Testing Strategy

- **Unit:** 15+ tests (service methods, aggregations, permission logic)
- **Integration:** 20+ tests (read → cache → store flow, offline scenarios)
- **Component:** 15+ tests (widgets + screens rendering)

**Target:** 50+ total tests, 80%+ coverage

---

## 9. Success Criteria

✅ HealthKit permission flow works (granted, denied, partial)
✅ 4 core metrics readable (heart, sleep, steps, energy)
✅ Dashboard widget shows today's summary
✅ Health tab has detailed views with charts
✅ Offline-first: cached data available without internet
✅ 50+ tests passing
✅ Zero TypeScript errors
✅ No regressions in Phase 1-3
✅ Platform check: iOS shows HealthKit, Android shows "Coming soon"

---

## 10. Timeline (4-5 days)

- **Day 1:** Types + permission layer + HealthKit service setup (Tasks 1-2 start)
- **Day 2:** HealthKit read operations + service layer (Task 2 complete)
- **Day 3:** Store + SQLite cache + data aggregation (Task 3)
- **Day 4:** UI components + Health tab + dashboard widget (Task 4)
- **Day 5:** Integration tests + documentation (Task 5)

---

## 11. Dependencies

**Existing (from Phase 1-3):**

- Auth, dashboard layout, Zustand patterns
- SQLite helpers, sync queue patterns
- TypeScript strict mode

**New:**

- `react-native-health` npm package
- iOS HealthKit entitlements
- Info.plist health usage descriptions

---

## 12. Risks & Mitigations

| Risk                          | Mitigation                                            |
| ----------------------------- | ----------------------------------------------------- |
| HealthKit permission denied   | Show clear re-request UI with benefits explanation    |
| No HealthKit data (new users) | Empty state with "Start tracking in Apple Health" CTA |
| Android users in Phase 4      | Platform check + "Coming soon" placeholder            |
| Expo managed workflow limits  | Use prebuild/bare workflow for native modules         |
| Large historical data fetch   | Paginate by date range (7, 30, 90 day windows)        |

---

## 13. Future Work (Deferred)

- **Phase 5+:** Google Fit / Health Connect integration (Android)
- **Phase 5+:** HealthKit write operations (log workouts back to HealthKit)
- **Phase 5+:** Apple Watch direct connection + real-time heart rate
- **Phase 6+:** HRV, VO2max, advanced metrics
- **Phase 6+:** AI-powered health insights from combined data

---

**Approval:** ✅ Design approved by user on 2026-04-19
