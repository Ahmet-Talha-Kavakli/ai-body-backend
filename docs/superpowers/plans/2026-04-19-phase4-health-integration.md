# Phase 4: Health Integration Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development to implement this plan.

**Goal:** Add HealthKit integration (read-only) for heart rate, sleep, steps, energy burned with offline-first caching.

**Architecture:** HealthKit → Service Layer → Zustand Store → SQLite Cache → UI (dedicated Health tab + dashboard widget)

**Tech Stack:** react-native-health, Zustand, SQLite, React Native 0.81.5, Expo 54

---

## Task 1: Types & Permission Layer

**Files:**

- Create: `apps/mobile/src/types/health.ts`
- Create: `apps/mobile/src/types/health-permission.ts`
- Create: `apps/mobile/src/services/healthPermission.ts`

**Steps:**

1. Write type definitions (HeartRateReading, SleepSession, StepData, EnergyBurned, DailyHealthSummary, HealthPermissionStatus)
2. Write permission tests
3. Implement healthPermission.ts (requestPermissions, checkPermissions)
4. Platform check (iOS only)
5. Commit: "feat: add health types and permission layer"

---

## Task 2: HealthKit Service

**Files:**

- Create: `apps/mobile/src/services/healthKitService.ts`
- Create: `apps/mobile/src/services/__tests__/healthKitService.test.ts`

**Steps:**

1. Write service tests (mock react-native-health)
2. Implement getHeartRate(dateRange)
3. Implement getSleep(dateRange)
4. Implement getSteps(dateRange)
5. Implement getEnergyBurned(dateRange)
6. Date aggregation helpers (today, week, month)
7. Commit: "feat: implement HealthKit read service"

---

## Task 3: Store & Database

**Files:**

- Create: `apps/mobile/src/store/healthStore.ts`
- Create: `apps/mobile/src/db/health.ts`
- Create: `apps/mobile/src/db/__tests__/health.test.ts`
- Create: `apps/mobile/src/store/__tests__/healthStore.test.ts`

**Steps:**

1. Write store tests (state management)
2. Write DB tests (CRUD + aggregation)
3. Create SQLite tables: heart_rate_readings, sleep_sessions, step_data, energy_burned, daily_health_summary
4. Implement Zustand store with loading/error states
5. Implement cache operations (saveReading, getReadings, getDailySummary)
6. Commit: "feat: add health store and SQLite cache"

---

## Task 4: UI Components & Screens

**Files:**

- Create: `apps/mobile/src/components/health/HealthDashboardWidget.tsx`
- Create: `apps/mobile/src/components/health/HeartRateChart.tsx`
- Create: `apps/mobile/src/components/health/SleepStagesChart.tsx`
- Create: `apps/mobile/src/components/health/StepProgressRing.tsx`
- Create: `apps/mobile/src/components/health/EnergyBurnedCard.tsx`
- Create: `apps/mobile/src/components/health/PermissionRequestCard.tsx`
- Create: `apps/mobile/src/screens/health/HealthScreen.tsx`
- Create: `apps/mobile/src/screens/health/HealthPermissionScreen.tsx`
- Create: `apps/mobile/src/screens/health/HeartRateDetailScreen.tsx`
- Create: `apps/mobile/src/screens/health/SleepDetailScreen.tsx`
- Create: `apps/mobile/src/screens/health/StepsDetailScreen.tsx`
- Create: `apps/mobile/src/screens/health/EnergyDetailScreen.tsx`

**Steps:**

1. Write component tests
2. Implement HealthDashboardWidget (today summary card)
3. Implement 4 chart components (heart rate, sleep, steps, energy)
4. Implement HealthScreen (tab main)
5. Implement 4 detail screens
6. Implement HealthPermissionScreen (onboarding)
7. Commit: "feat: create health UI components and screens"

---

## Task 5: Integration Tests + Documentation

**Files:**

- Create: `apps/mobile/tests/integration/healthFlow.integration.test.ts`
- Create: `apps/mobile/README-PHASE4.md`

**Steps:**

1. Write 15+ integration tests (full flow scenarios)
2. Test: permission request → granted → read data → display
3. Test: permission denied → re-request UI
4. Test: offline → cached data → online → fresh fetch
5. Create Phase 4 README
6. Run full test suite (target: 912+ passing)
7. Commit: "feat: complete Phase 4 with integration tests and documentation"

---

## Success Criteria

✅ 50+ new tests passing
✅ All 4 HealthKit metrics readable (heart, sleep, steps, energy)
✅ Dashboard widget + Health tab + 4 detail screens
✅ Offline-first with SQLite cache
✅ Platform check (iOS vs Android coming soon)
✅ Zero TypeScript errors in health module
✅ No regressions in Phase 1-3

---

**Approval:** Ready for execution via subagent-driven-development
