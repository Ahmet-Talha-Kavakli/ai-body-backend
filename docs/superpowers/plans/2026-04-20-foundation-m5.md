# FitAI Mobile Foundation — M5: Dev Infrastructure

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development or superpowers:executing-plans.

**Goal:** EAS Build/Update kanalları çalışır, Sentry production bağlı, GrowthBook feature flags entegre, PostHog analytics kuruldu, Maestro E2E smoke test geçiyor.

**Architecture:** EAS servisleri `eas.json` ile yapılandırılır. Sentry `@sentry/react-native` ile root layout'ta başlatılır. GrowthBook SDK feature flag context'ini root provider'a ekler. PostHog event'leri screen navigation ile otomatik tetiklenir.

**Ön koşul:** M1–M4 tamamlanmış olmalı. EAS hesabı mevcut olmalı (expo.dev).

**Çalışma dizini:** `apps/mobile/`

---

## Chunk 1: Sentry Entegrasyonu

### Task 1: Sentry kurulum ve test

**Files:**

- Modify: `apps/mobile/app/_layout.tsx`
- Modify: `apps/mobile/app.json`
- Create: `apps/mobile/src/lib/sentry.ts`
- Modify: `apps/mobile/.env.local`

- [ ] **Step 1: Sentry kurulum**

```bash
cd apps/mobile
npx expo install @sentry/react-native
```

- [ ] **Step 2: .env.local'e Sentry DSN ekle**

`apps/mobile/.env.local` dosyasına şunu ekle (expo.dev → Sentry → Project DSN):

```
EXPO_PUBLIC_SENTRY_DSN=https://your-dsn@sentry.io/project-id
```

- [ ] **Step 3: env.ts Sentry DSN ekle**

`apps/mobile/src/env.ts` içindeki schema'ya ekle:

```ts
EXPO_PUBLIC_SENTRY_DSN: z.string().url().optional(),
```

- [ ] **Step 4: sentry.ts oluştur**

```ts
// apps/mobile/src/lib/sentry.ts
import * as Sentry from '@sentry/react-native'
import { env } from '../env'

export function initSentry() {
  if (!env.EXPO_PUBLIC_SENTRY_DSN) return

  Sentry.init({
    dsn: env.EXPO_PUBLIC_SENTRY_DSN,
    environment: __DEV__ ? 'development' : 'production',
    enableNative: true,
    tracesSampleRate: __DEV__ ? 1.0 : 0.1,
    _experiments: { profilesSampleRate: 0.1 },
    // PII protection — no user email in breadcrumbs
    beforeBreadcrumb(breadcrumb) {
      if (breadcrumb.category === 'console') return null // skip console logs
      return breadcrumb
    },
  })
}

export function setSentryUser(userId: string) {
  // Use hashed ID only — no PII
  Sentry.setUser({ id: userId })
}

export function clearSentryUser() {
  Sentry.setUser(null)
}
```

- [ ] **Step 5: \_layout.tsx'e Sentry init ekle**

`app/_layout.tsx` başına `initSentry()` çağrısı ekle:

```tsx
// apps/mobile/app/_layout.tsx
import 'react-native-reanimated'
import '../global.css'
import React, { useEffect } from 'react'
import { Stack } from 'expo-router'
import { RootProviders } from '../src/providers'
import { initSentry } from '../src/lib/sentry'

initSentry() // Call before any render

export default function RootLayout() {
  return (
    <RootProviders>
      <Stack screenOptions={{ headerShown: false }} />
    </RootProviders>
  )
}
```

- [ ] **Step 6: Test crash — Sentry bağlantısını doğrula**

```bash
cd apps/mobile && pnpm start --ios --clear
```

Uygulamada geliştirici menüsünden veya kodu ile test crash gönder:

```ts
// Geçici — doğruladıktan sonra kaldır
import * as Sentry from '@sentry/react-native'
Sentry.captureMessage('Foundation M5 test — Sentry connected ✅')
```

Sentry dashboard'da event görünüyor mu? → Görünüyorsa geçti.

- [ ] **Step 7: app.json'a Sentry plugin ekle**

```json
// apps/mobile/app.json plugins array'ine ekle:
"@sentry/react-native/expo"
```

- [ ] **Step 8: Commit**

```bash
git add apps/mobile/src/lib/sentry.ts apps/mobile/app/_layout.tsx apps/mobile/app.json
git commit -m "feat(mobile): integrate Sentry crash reporting with PII protection"
```

---

## Chunk 2: GrowthBook Feature Flags

### Task 2: GrowthBook SDK entegrasyonu

**Files:**

- Create: `apps/mobile/src/lib/featureFlags.ts`
- Modify: `apps/mobile/src/providers/index.tsx`
- Modify: `apps/mobile/.env.local`

- [ ] **Step 1: GrowthBook yükle**

```bash
cd apps/mobile && pnpm add @growthbook/growthbook-react-native
```

- [ ] **Step 2: .env.local'e GrowthBook key ekle**

```
EXPO_PUBLIC_GROWTHBOOK_CLIENT_KEY=sdk-your-client-key
```

- [ ] **Step 3: env.ts'e ekle**

```ts
EXPO_PUBLIC_GROWTHBOOK_CLIENT_KEY: z.string().optional(),
```

- [ ] **Step 4: featureFlags.ts oluştur**

```ts
// apps/mobile/src/lib/featureFlags.ts
// Uses @growthbook/growthbook (core JS SDK) — the RN wrapper re-exports it.
// GrowthBook core API: https://docs.growthbook.io/lib/js
import { GrowthBook } from '@growthbook/growthbook'
import { env } from '../env'

export const growthbook = new GrowthBook({
  apiHost: 'https://cdn.growthbook.io',
  clientKey: env.EXPO_PUBLIC_GROWTHBOOK_CLIENT_KEY ?? '',
  enableDevMode: __DEV__,
  trackingCallback: (experiment, result) => {
    console.warn('[GrowthBook] Experiment:', experiment.key, result.variationId)
  },
})

export async function initFeatureFlags(userId?: string) {
  if (userId) growthbook.setAttributes({ id: userId, loggedIn: true })
  await growthbook.loadFeatures({ autoRefresh: true })
}

export function isFeatureEnabled(key: string): boolean {
  return growthbook.isOn(key)
}
```

- [ ] **Step 5: Test yaz**

```ts
// apps/mobile/__tests__/unit/lib/featureFlags.test.ts
import { isFeatureEnabled, growthbook } from '../../../src/lib/featureFlags'

describe('featureFlags', () => {
  it('returns false for unknown feature', () => {
    expect(isFeatureEnabled('nonexistent_feature')).toBe(false)
  })

  it('can override feature in dev mode', () => {
    growthbook.setForcedVariations({ test_feature: 1 })
    // Without a feature definition, isOn returns false regardless
    expect(typeof isFeatureEnabled('test_feature')).toBe('boolean')
    growthbook.setForcedVariations({})
  })
})
```

- [ ] **Step 6: Test çalıştır**

```bash
cd apps/mobile && pnpm test __tests__/unit/lib/featureFlags.test.ts
```

Beklenen: `2 passed`.

- [ ] **Step 7: Commit**

```bash
git add apps/mobile/src/lib/featureFlags.ts apps/mobile/__tests__/unit/lib/featureFlags.test.ts
git commit -m "feat(mobile): add GrowthBook feature flags with dev mode override"
```

---

## Chunk 3: PostHog Analytics

### Task 3: PostHog event tracking altyapısı

**Files:**

- Create: `apps/mobile/src/lib/analytics.ts`
- Modify: `apps/mobile/.env.local`

- [ ] **Step 1: PostHog yükle**

```bash
cd apps/mobile && pnpm add posthog-react-native
# Also install peer dependency:
npx expo install expo-file-system expo-application expo-device expo-localization
```

- [ ] **Step 2: .env.local'e PostHog key ekle**

```
EXPO_PUBLIC_POSTHOG_KEY=phc_your-project-api-key
EXPO_PUBLIC_POSTHOG_HOST=https://app.posthog.com
```

- [ ] **Step 3: env.ts'e ekle**

```ts
EXPO_PUBLIC_POSTHOG_KEY: z.string().optional(),
EXPO_PUBLIC_POSTHOG_HOST: z.string().url().optional(),
```

- [ ] **Step 4: analytics.ts oluştur**

```ts
// apps/mobile/src/lib/analytics.ts
// Event naming convention: <domain>_<object>_<verb>
// Required fields on every event: platform, app_version
// PostHog RN v3 uses named export `PostHog` and a direct instantiation pattern.
import { PostHog } from 'posthog-react-native'
import { Platform } from 'react-native'
import { env } from '../env'

let client: PostHog | null = null

export async function initAnalytics() {
  if (!env.EXPO_PUBLIC_POSTHOG_KEY) return
  if (client) return // already initialized

  client = await PostHog.initAsync(env.EXPO_PUBLIC_POSTHOG_KEY, {
    host: env.EXPO_PUBLIC_POSTHOG_HOST ?? 'https://app.posthog.com',
    // In dev, events are captured but you can inspect them via PostHog debug panel
  })
}

type EventProperties = Record<string, string | number | boolean | null>

function baseProps(): EventProperties {
  return {
    platform: Platform.OS,
    app_version: '1.0.0',
  }
}

export function trackEvent(name: string, properties?: EventProperties) {
  if (!client) return
  client.capture(name, { ...baseProps(), ...properties })
}

export function identifyUser(userId: string, traits?: EventProperties) {
  if (!client) return
  client.identify(userId, { ...baseProps(), ...traits })
}

export function trackScreen(screenName: string) {
  trackEvent('screen_viewed', { screen_name: screenName })
}

export function resetAnalytics() {
  client?.reset()
}
```

- [ ] **Step 5: Commit**

```bash
git add apps/mobile/src/lib/analytics.ts
git commit -m "feat(mobile): add PostHog analytics with screen tracking and event taxonomy"
```

---

## Chunk 4: EAS Build & Update

### Task 4: EAS kanalları yapılandır

**Files:**

- Modify: `apps/mobile/eas.json`
- Modify: `apps/mobile/app.json`

- [ ] **Step 1: EAS CLI yükle (globale)**

```bash
npm install -g eas-cli
eas login   # expo.dev credentials ile
```

- [ ] **Step 2: eas.json güncelle**

```json
{
  "cli": { "version": ">= 10.0.0" },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "channel": "canary"
    },
    "preview": {
      "distribution": "internal",
      "channel": "beta",
      "ios": { "simulator": true },
      "android": { "buildType": "apk" }
    },
    "production": {
      "channel": "production",
      "ios": { "buildConfiguration": "Release" },
      "android": { "buildType": "aab" }
    }
  },
  "submit": {
    "production": {
      "ios": { "appleId": "YOUR_APPLE_ID", "ascAppId": "YOUR_ASC_APP_ID" },
      "android": { "serviceAccountKeyPath": "./google-play-key.json" }
    }
  },
  "update": {
    "channel": "production"
  }
}
```

- [ ] **Step 3: EAS Update (OTA) — app.json'u güncelle**

`app.json` içindeki `updates` bölümünü şunla değiştir:

```json
"updates": {
  "url": "https://u.expo.dev/YOUR_PROJECT_ID",
  "enabled": true,
  "checkOnLaunch": "ALWAYS",
  "fallbackToCacheTimeout": 30000
},
"runtimeVersion": {
  "policy": "sdkVersion"
}
```

`YOUR_PROJECT_ID`'yi `eas init` sonrası elde ettiğin ID ile değiştir.

- [ ] **Step 4: EAS init**

```bash
cd apps/mobile && eas init
```

Beklenen: `app.json`'a `extra.eas.projectId` eklenir.

- [ ] **Step 5: Test build (iOS Simulator)**

```bash
cd apps/mobile && eas build --profile preview --platform ios --local
```

Beklenen: IPA başarıyla oluşturulur.

> **Not:** `--local` flag'i EAS sunucusuna göndermeden local build yapar. Xcode gerektirir.

- [ ] **Step 6: Commit**

```bash
git add apps/mobile/eas.json apps/mobile/app.json
git commit -m "feat(mobile): configure EAS Build channels (canary/beta/production) + EAS Update OTA"
```

---

## Chunk 5: Maestro E2E Smoke Test

### Task 5: Navigation smoke test

**Files:**

- Create: `apps/mobile/e2e/navigation-smoke.yaml`

- [ ] **Step 1: Maestro yükle**

```bash
curl -Ls "https://get.maestro.mobile.dev" | bash
```

- [ ] **Step 2: navigation-smoke.yaml oluştur**

```yaml
# apps/mobile/e2e/navigation-smoke.yaml
appId: com.fitai.app
---
- launchApp
- assertVisible: 'Home' # Home tab boş ekran görünüyor
- tapOn: 'Antrenman' # Train tab
- assertVisible: 'Train'
- tapOn: 'Beslenme' # Nutrition tab
- assertVisible: 'Nutrition'
- tapOn: 'Sağlık' # Health tab
- assertVisible: 'Health'
- tapOn: 'Sen' # You tab
- assertVisible: 'You'
- tapOn: 'Ana Sayfa' # Back to Home
- assertVisible: 'Home'
```

> **Not:** Tab label'ları i18n'den geliyor. Türkçe locale'de `t('tabs.train')` = "Antrenman". Eğer simülatör cihaz dili İngilizce ise English label'ları kullan.

- [ ] **Step 3: Smoke test çalıştır**

Simülatörde uygulama açık iken:

```bash
maestro test apps/mobile/e2e/navigation-smoke.yaml
```

Beklenen: `6/6 steps passed`.

- [ ] **Step 4: Commit**

```bash
git add apps/mobile/e2e/navigation-smoke.yaml
git commit -m "test(mobile/e2e): add Maestro navigation smoke test"
```

---

## Chunk 6: Son Kontroller

### Task 6: Full test suite + lint + typecheck

- [ ] **Step 1: Tüm testleri çalıştır**

```bash
cd apps/mobile && pnpm test:coverage
```

Beklenen: `40+ tests`, coverage `>80%` core lib'lerde.

- [ ] **Step 2: Lint temiz mi?**

```bash
cd apps/mobile && pnpm lint
```

Beklenen: `0 errors`. Warning'ler not edilir, sonraki sprint'te temizlenir.

- [ ] **Step 3: Typecheck**

```bash
cd apps/mobile && pnpm typecheck
```

Beklenen: Yeni `src/` kodunda `0 errors`.

- [ ] **Step 4: Simulator smoke run**

```bash
cd apps/mobile && pnpm start --ios --clear
```

Kontrol et:

- Splash açılıyor
- 5 tab bar görünüyor
- Her taba tıklanabiliyor
- Dark mode doğru
- Showcase ekranı tüm componentleri gösteriyor
- Console'da kırmızı error yok

- [ ] **Step 5: Foundation completion commit**

```bash
git add -A
git commit -m "feat(mobile): Foundation complete — M1-M5 all milestones delivered"
```

---

## Foundation Tamamlandı — Final Kontrol Listesi

- [ ] `pnpm test:coverage` — 40+ test, %80+ coverage
- [ ] `pnpm lint` — 0 error
- [ ] `pnpm typecheck` — 0 error yeni kodda
- [ ] 5 tab iskelet simulator'da açılıyor
- [ ] Dark/Light mode runtime switch çalışıyor
- [ ] TR/EN dil switch çalışıyor
- [ ] ~20 core + 5 hero component Showcase'de görünüyor
- [ ] ReadinessRing animasyonu 60fps smooth
- [ ] SecurityProvider jailbreak logu dev build'de
- [ ] Sentry test event dashboard'da görünüyor
- [ ] EAS Build preview başarılı
- [ ] Maestro smoke test 6/6 passed
- [ ] Deep link `fitai://` çalışıyor
- [ ] MMKV sync queue test yeşil

**Foundation tamamlandı. Sıradaki:** Auth & Onboarding sub-project.
