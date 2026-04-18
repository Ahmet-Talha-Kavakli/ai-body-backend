# Phase 4: Complete Health Integration (Mobile)

**Goal:** Sync wearable devices (Apple Health, Google Fit, Garmin, Fitbit), track sleep, readiness, health metrics.

**Architecture:** HealthKit SDK (iOS) + Google Fit API (Android), background sync (every 6 hours), WearableDevice + WearableReading models, ReadinessScore calculation.

---

## Screens

**HealthDashboard**

- Today's stats: steps, heart rate, calories, sleep duration
- Activity rings (progress circles)
- Wearable sync status
- Quick connect button for new devices

**DevicesScreen**

- Connected wearables list
- Sync status + last synced time
- Connect new device button (OAuth flow)
- Disconnect option

**HealthAnalyticsScreen**

- Weekly/monthly trends (line charts)
- Sleep quality analysis
- Activity patterns
- Heart rate variability (HRV)

## Models (Prisma)

- **Wearable**: type (APPLE_HEALTH|GARMIN|FITBIT|GOOGLE_FIT), tokens, sync status
- **WearableReading**: type (heart_rate|steps|calories|sleep|hrv|spo2), value, recorded timestamp
- **SleepRecord**: duration (minutes), quality (0-100)
- **ReadinessScore**: 0-100, calculated from sleep + HRV + recovery

## API Endpoints

```
POST   /api/wearables/apple/connect      → OAuth start
GET    /api/wearables/apple/callback     → OAuth complete
POST   /api/health/devices                → Connect wearable
GET    /api/health/devices                → List devices
POST   /api/health/devices/sync           → Manual sync
GET    /api/health/activity               → Activity data
GET    /api/health/sleep                  → Sleep data
GET    /api/readiness                     → Readiness score
```

## Key Features

- OAuth flows for each wearable type
- Background sync (Expo Task Scheduler)
- Historical data backfill (30 days)
- Trend analysis + anomaly detection
- Auto-sync on app launch
- Manual refresh button

## Timeline

~4-5 days (after Phase 1)
