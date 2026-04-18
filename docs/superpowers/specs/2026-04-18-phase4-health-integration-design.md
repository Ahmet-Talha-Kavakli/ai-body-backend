# Phase 4: Health Integration Design

**Goal:** Sync with device health sensors for automatic tracking of steps, sleep, heart rate.

**Architecture:** HealthKit (iOS) + Google Fit (Android) integration, background sync, health metric aggregation.

**Tech Stack:** Expo HealthKit, Expo Sensors, Background Tasks

---

## 1. Overview

- **HealthKit/Google Fit sync:** Steps, calories, heart rate, sleep
- **Background tracking:** Automatic sync every 6 hours
- **Health dashboard:** Unified view of all metrics
- **Wearable integration:** Apple Watch, Wear OS support

---

## 2. Screens

**HealthDashboard**

- Steps today
- Sleep last night
- Heart rate current
- Calories burned
- Activity rings/goals

**DevicesScreen**

- Connected wearables
- Health data sync status
- Permission management

**HealthAnalytics**

- Weekly/monthly trends
- Sleep quality analysis
- Activity patterns

---

## 3. Data Models

### HealthMetric (SQLite)

```typescript
{
  userId: string
  date: date
  steps: number
  calories: number
  heartRate: number
  sleep: {
    duration: number
    quality: number
  }
  distance: number
  activeTime: number
  synced: boolean
}
```

---

## 4. Key Features

- Automatic background sync
- Wearable data aggregation
- Health goal tracking
- Trend analysis

---

## 5. Timeline

~4-5 days
