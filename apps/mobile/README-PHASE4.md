# Phase 4: Health Integration - Implementation Complete

## Overview

Phase 4 delivers native HealthKit integration for the iOS mobile app, unifying
vitals, activity, sleep, and energy expenditure into a single offline-first
health layer. The app becomes a true companion to Apple Health: reads data,
caches it locally via SQLite, aggregates it into daily summaries, and surfaces
it through a dashboard widget, a dedicated Health tab, and four detail
screens (Heart Rate / Sleep / Steps / Energy).

**Status:** Complete (5/5 Tasks + Integration Tests)
**Timeline:** 4-5 days (achieved with parallel subagent deployment)
**Test Coverage:** 50+ tests (unit + integration)

## Key Features

### 1. Heart Rate Tracking

- Real-time heart rate samples from Apple Watch / iPhone sensors
- Resting heart rate detection (lowest value of the day)
- Min / max / average aggregation per day, week, month
- BPM time-series chart on the Heart Rate detail screen
- Source attribution (Apple Watch, iPhone, third-party rings)

### 2. Sleep Analysis

- Sleep session extraction with stage mapping (awake / light / deep / REM / asleep / in-bed)
- Total minutes slept per night + quality score proxy
- Weekly / monthly trend visualization
- Bedtime / wake-time tracking for consistency analytics

### 3. Step Counting

- Daily step totals pulled from HealthKit step samples
- Configurable step goal (default 10,000 steps)
- Percent-to-goal progress ring on dashboard widget
- Multi-day bar chart in the Steps detail screen

### 4. Energy Burned

- Active calories (workout / movement) + basal calories (BMR)
- Total daily energy expenditure (TDEE) computed per day
- Bucketed aggregation by `YYYY-MM-DD`
- Fuels Nutrition System's TDEE-aware macro adjustments (Phase 3 integration)

## Architecture

### Data Flow Diagram

```
+---------------------------------------------------------------+
|                 HEALTH DATA FLOW (Phase 4)                    |
+---------------------------------------------------------------+

PERMISSION LAYER
  User opens Health tab
    -> platform check (iOS required)
    -> request HealthKit read permissions (HR, Sleep, Steps, Energy)
    -> store grant state (full / partial / denied)

                         |
                         v

FETCH LAYER
  healthKitService.getHeartRate / getSleep / getSteps / getEnergyBurned
    -> calls into react-native-health (callback-based native bridge)
    -> promisified via callHealthKit() helper
    -> fail-soft: returns [] on any error

                         |
                         v

NORMALIZATION LAYER
  Raw HealthKit samples -> typed domain models:
    HeartRateReading | SleepSession | StepData | EnergyBurned
  Sleep stage mapping: 'CORE' -> 'light', 'DEEP' -> 'deep', etc.

                         |
                         v

CACHE LAYER
  SQLite `health_cache` table, keyed by (metric, rangeType, rangeStart, rangeEnd)
    -> 15-minute freshness window
    -> stale cache triggers network re-fetch
    -> offline mode reads cache directly

                         |
                         v

AGGREGATION LAYER
  healthStore.buildDailySummary()
    -> heartRate: { average, min, max, resting }
    -> sleep: { totalMinutes, quality }
    -> steps: { count, goal, percent }
    -> energy: { active, basal, total }

                         |
                         v

UI LAYER
  DashboardWidget (summary cards) --tap--> HealthTab (range selector)
                                     -> 4 detail screens (chart + stats)
```

### Module Map

| Layer | File(s) |
|-------|---------|
| Types | `src/types/health.ts` |
| Service | `src/services/healthKitService.ts` |
| Store (Zustand) | `src/store/healthStore.ts` |
| DB Cache | `src/db/healthCache.ts` |
| Dashboard Widget | `src/components/dashboard/HealthWidget.tsx` |
| Health Tab | `src/screens/dashboard/tabs/HealthTab.tsx` |
| Detail Screens | `src/screens/health/HeartRateDetailScreen.tsx`, `SleepDetailScreen.tsx`, `StepsDetailScreen.tsx`, `EnergyDetailScreen.tsx` |
| Tests (unit) | `src/services/__tests__/healthKitService.test.ts`, `src/store/__tests__/healthStore.test.ts` |
| Tests (integration) | `tests/integration/healthFlow.integration.test.ts` |

## Dependencies

### Runtime

- `react-native-health` — Apple HealthKit bridge (iOS only)
- `react-native` — `Platform.OS` detection for iOS/Android gating
- `expo-sqlite` — Local cache persistence
- `zustand` — In-memory reactive state

### Platform Requirements

- **iOS:** 15.0+, HealthKit entitlement, physical device or paired simulator with seeded data
- **Android:** Not supported in Phase 4 (coming-soon UI in Health Connect Phase 5+)

## Setup

### iOS Entitlements

In `ios/{AppName}/{AppName}.entitlements`:

```xml
<key>com.apple.developer.healthkit</key>
<true/>
<key>com.apple.developer.healthkit.access</key>
<array/>
```

### Info.plist

```xml
<key>NSHealthShareUsageDescription</key>
<string>AI-PT reads your heart rate, sleep, steps, and energy data to personalize your training and nutrition plans.</string>
<key>NSHealthUpdateUsageDescription</key>
<string>AI-PT does not write to HealthKit in this version.</string>
```

### Podfile / Build

```bash
cd apps/mobile/ios
pod install
cd ..
pnpm ios
```

### Running Tests

```bash
# Unit + integration, Phase 4 only
cd apps/mobile && pnpm test -- health

# Full mobile test suite (912+ tests targeted)
cd apps/mobile && pnpm test
```

## Testing

### Test Breakdown (50+ tests)

| Category | File | Test Count |
|----------|------|------------|
| Service unit tests | `src/services/__tests__/healthKitService.test.ts` | ~20 |
| Store unit tests | `src/store/__tests__/healthStore.test.ts` | ~12 |
| DB cache tests | `src/db/__tests__/healthCache.test.ts` | ~8 |
| Integration tests | `tests/integration/healthFlow.integration.test.ts` | 25+ |

### Integration Test Scenarios

The integration suite covers:

1. Permission request on first launch
2. Granted / denied / re-request permission cycles
3. iOS platform detection
4. Android coming-soon fallback
5. Partial permission grants (HR yes, sleep no)
6. Heart rate / sleep / steps / energy fetch
7. Multi-day range fetch (today / week / month)
8. SQLite cache write on fetch
9. Offline cache read when network unavailable
10. Force refresh writes fresh cache row
11. Fail-soft to cache when HealthKit errors
12. Stale cache detection and re-fetch
13. Daily HR average / min / max / resting aggregation
14. Total daily steps and percent-to-goal
15. Total sleep duration in minutes
16. Daily energy breakdown (active / basal / total)
17. Dashboard widget renders with today's summary
18. Navigation from widget to detail screens
19. Pull-to-refresh triggers fresh fetch
20. Loading state during fetch
21. Error state on fetch failure
22. Empty-data UI when no samples exist
23. Date range switching (today -> week)
24. Chart-ready data shape for empty datasets
25. End-to-end: permission -> fetch -> cache -> aggregate -> navigate -> offline

## Offline-First Strategy

- **Write-through cache:** Every successful HealthKit fetch writes to the
  `health_cache` SQLite table with a `cachedAt` timestamp.
- **Freshness window:** 15 minutes — within this window the store skips the
  native bridge and reads from cache. Past this window the app re-fetches
  (if online) and overwrites the row.
- **Offline mode:** `useOfflineDetection` gates network attempts. When offline,
  the store reads cache unconditionally and shows a subtle "offline" indicator.
- **Fail-soft:** Any native error (permission revoked, HealthKit unavailable,
  corrupt sample) resolves to `[]` rather than throwing, and the UI falls back
  to the last cached snapshot. `state.error` is still set so the app can show
  a banner.

## UI Structure

- **Dashboard Widget** (`HealthWidget`): 2x2 grid of metric cards — steps,
  heart rate, sleep, energy — each showing today's headline number and a small
  trend indicator. Tapping any card navigates to its detail screen.
- **Health Tab** (`HealthTab`): Date range selector (today / week / month) and
  a scrollable summary of all four metrics with mini-charts.
- **Detail Screens** (4): Each renders a full chart (line for HR, bar for steps,
  stacked bar for sleep stages, dual-stack for energy), summary stats (avg / min / max),
  and a recent-samples list. All screens support pull-to-refresh.

## Known Limitations

- **iOS only.** Android support via Health Connect lands in a later phase.
- **Read-only.** Phase 4 does not write workouts, weight, or any other data
  back to HealthKit. Write flows are deferred.
- **No direct Apple Watch pairing.** We rely on the user's Apple Health app
  to aggregate Watch data; we don't query the Watch directly.
- **Fifteen-minute cache window** is a global default. Per-metric TTLs are a
  future enhancement (sleep changes hourly at most, HR changes every minute).
- **Background fetch** is not wired in Phase 4. The app refreshes on
  foreground, pull-to-refresh, or explicit tab switch.

## Future Work (Phase 5+ Roadmap)

- **Health Connect (Android)** — parity with iOS HealthKit via Google's
  unified health store.
- **Write APIs** — log workouts, weight, nutrition macros back to HealthKit
  so third-party apps can pick them up.
- **Background sync** — silent push + BGAppRefreshTask to pre-warm caches
  before the user opens the app.
- **Apple Watch companion app** — direct complication and live HR during
  workouts without relying on Health aggregation.
- **Wearable fusion** — merge Fitbit / Garmin / Oura via each vendor's SDK,
  deduplicate against HealthKit.
- **Anomaly detection** — resting HR spikes, sleep-debt alerts, inactivity
  nudges — powered by the AI memory layer from Phase 6.
- **Trends & insights** — 30/60/90-day rolling comparisons, correlation
  between sleep quality and workout performance.
