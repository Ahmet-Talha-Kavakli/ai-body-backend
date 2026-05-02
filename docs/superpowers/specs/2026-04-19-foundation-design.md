# FitAI Mobile Foundation — Tasarım Spec'i

**Tarih:** 2026-04-19
**Alt proje:** Foundation (mobile rewrite'ın ilk katmanı)
**Durum:** Tasarım onaylandı — implementation plan bir sonraki adım
**Referans:** [Brainstorm Kararları](./2026-04-19-fitai-mobile-brainstorm-decisions.md)

---

## Amaç

FitAI mobile uygulamasının yeniden yazımının **iskelet katmanı**. Foundation bitince her bir feature-slice (auth, home, workout, nutrition vs) bu çakılmış zemine oturacak. Foundation'ın kalitesi = uygulamanın tavanı. Burada yapılan her kısa yol 100k+ kullanıcı ölçeğinde patlar.

## Kalite çubuğu

Tüm Foundation kararları bu iki durable memory dokümanına uyar:

- [Global Top-Tier Quality Bar](../../../.claude/projects/-Users-talha-Desktop-AiPt/memory/feedback_quality_bar.md)
- [FitAI Product Essence](../../../.claude/projects/-Users-talha-Desktop-AiPt/memory/project_fitai_product_essence.md)

---

## 1. Kapsam & İlkeler

### Kapsam (Foundation ne içerir)

- Design tokens (renkler, tipografi, spacing, radius, shadow, motion)
- ~20 core base component + FitAI özel "hero" componentleri (feature'lar ilerledikçe genişler)
- Navigasyon iskeleti (5 tab, auth group, modal stack, deep linking)
- Core provider'lar (Clerk, TanStack Query, Theme, i18n, Sentry, Error Boundary, Toast, Haptic, Sheet, MMKV)
- Data layer mimarisi (offline-first, sync queue, optimistic update)
- Accessibility altyapı (WCAG 2.1 AA)
- i18n (Türkçe + İngilizce Day 1, 10+ dil genişletilebilir)
- Animasyon sistemi (Reanimated 3 worklet, 60fps, spring configs)
- Dev altyapı (CI/CD, test, EAS Build/Update, Sentry, feature flags, analytics)
- Microcopy & content standartları (ses tonu, mesaj kalıpları, i18n anahtarlama)
- Klasör yapısı (feature-slice, ≤300 satır hedefi)

### Kapsam dışı (sonraki alt projeler)

- Hiçbir iş özelliği (auth screens, home içeriği, workout logic vs)
- Backend değişiklikleri (apps/web dokunulmaz)
- 3D / AR / camera pipeline
- Push notification gönderme mantığı (altyapı var, içerik feature-slice'ta)
- **Live Activity / Dynamic Island / Widget** — custom native module gerektirir, Expo Modules API sınırlı; ayrı sub-project (#13 iOS Native Layer)
- Feature-specific components (FormFeedbackOverlay, RepCounter gibi feature-slice'lara ait)

### Tartışmasız ilkeler

1. Her kod "global top" kalite çubuğuna uymalı
2. TypeScript strict, zero `any`
3. 60fps her animasyon — Reanimated worklet, native driver
4. WCAG 2.1 AA — kontrast 4.5:1+, dokunma ≥44pt, dynamic type
5. Hardcoded string YOK — her görünür yazı i18n'den
6. Her async: loading + empty + error state
7. Test coverage %80+ core lib'lerde, %60+ feature'larda
8. Error boundary her feature slice
9. Haptic feedback major aksiyonda
10. Dosya ≤300 satır hedefi (gerekçeli esneklik), tek sorumluluk

### Başarı kriterleri

- Splash + 1 sign-in ekran + 1 boş tab ekran render 60fps
- `pnpm test` / `lint` / `typecheck` / `build` hepsi yeşil
- Sentry bağlı, test crash raporu düşüyor
- EAS Build iOS + Android başarılı, TestFlight upload hazır
- Dark ↔ light mode switch çalışır
- Türkçe ↔ İngilizce dil switch çalışır
- ~20 core component + hero component'lerin dev showcase ekranı var
- SecurityProvider: root detection + SSL pinning dev-build'de logu veriyor
- Backend circuit breaker retry davranışı test ile doğrulanmış

---

## 2. Design Tokens

### Renk paleti (Dark-primary, OLED optimize)

**Backgrounds:**

```
bg.primary           #000000   True black (OLED %0 güç)
bg.canvas            #08080B   Slight blue tint, LCD Android depth
bg.surface           #12121A   Cards
bg.surface-elevated  #1A1A26   Modal, sheet
bg.surface-hover     #20202C   Pressed state
```

**Text hierarchy:**

```
text.primary         #F8FAFC   Body (19.7:1 ✅ AAA)
text.secondary       #CBD5E1   Label (14.5:1 ✅ AAA)
text.tertiary        #94A3B8   Caption (7.8:1 ✅ AAA)
text.disabled        #475569   4.6:1 (AA sınır — sadece disabled)
```

**Borders:**

```
border.subtle        #0F172A
border.default       #1E293B
border.strong        #334155
border.focus         #2DD4BF   Mint — focus ring
```

**Ana accent — FitAI kimliği (Mint/Aqua):**

```
accent.primary        #2DD4BF   teal-400 — marka CTA ★
accent.primary-bright #5EEAD4   teal-300 — pressed
accent.primary-dim    #14B8A6   teal-500 — gradient end
accent.muted          #134E4A   teal-900 — soft background
```

**Semantic:**

```
success              #10B981   emerald (ikon + renk birlikte — mint ile karışmasın)
warning              #F59E0B   amber
danger               #EF4444   red
info                 #3B82F6   blue
recovery             #8B5CF6   violet (sınırlı kullanım)
```

**AI signature (bilinçli olarak brand-mint'ten ayrı):**

```
ai.glow-start        #6366F1   indigo
ai.glow-end          #8B5CF6   violet
```

**Data visualization:**

```
data.readiness.high  #10B981   (80+)
data.readiness.mid   #F59E0B   (60-79)
data.readiness.low   #EF4444   (<60)
data.hr-zone1..5     #60A5FA → #34D399 → #FBBF24 → #F97316 → #DC2626
```

**Light mode variants:** Her token'ın light mode versiyonu tanımlı. bg.primary → #FFFFFF, text.primary → #0F172A, vb. Kullanıcı iOS sistem settings'ine saygı.

### Tipografi

**Fontlar:**

- iOS: SF Pro Display (≥20pt), SF Pro Text (<20pt) — Dynamic Type zorunlu
- Android: Roboto Flex (variable) — sp birim zorunlu
- Mono: SF Mono / Roboto Mono

**Özel font:** Yok (sistem fontları yeterli, Türkçe %100, bundle +0). Gerektiğinde ileride display font eklenir.

**Type scale (12 stil):**

```
display       40/44  Bold       hero PR, achievement
title1        34/41  Bold       screen başlığı
title2        28/34  Bold       section başlığı
title3        22/28  Semibold   card başlığı
title4        20/25  Semibold   sub-section
headline      17/22  Semibold   list item başlığı
body          17/22  Regular    paragraph (min vücut) ★
body-medium   17/22  Medium     vurgulu body
callout       16/21  Regular    info card
subhead       15/20  Regular    secondary info
footnote      13/18  Regular    meta
caption1      12/16  Regular    date, duration
caption2      11/13  Regular    en alt seviye
mono          14/20  Regular    kod, sayı
```

**Weights:** 400 / 500 / 600 / 700. **300 ve 800 YASAK** (dark arkaplanda okunmaz / chunky).

**Dynamic Type:** Tüm stiller `relativeTo` ile scale eder. %200'de overflow test zorunlu.

### Spacing (4pt grid)

```
0=0  1=2  2=4  3=8  4=12  5=16★  6=20  7=24  8=32  9=40  10=48  11=64
```

★ = en yaygın (card padding).

### Radius

```
xs=4   sm=8   md=12   lg=16   xl=20★   2xl=24   full=9999
```

★ = iOS 17 sheet standardı.

### Shadow

Dark mode'da klasik shadow yerine **elevation = surface renk açma**. Light mode'da klasik shadow kullanılır.

**Glow shadow (özel):**

```
shadow.glow    0 0 40px rgba(45,212,191,0.40)   // readiness ring, hero moments
```

### Motion (Reanimated 3 spring)

```
motion.snappy    damping:22 stiffness:400 mass:1    button press
motion.smooth    damping:20 stiffness:180 mass:1    screen transition ★
motion.gentle    damping:18 stiffness:120 mass:1    sheet, large element
motion.bouncy    damping:12 stiffness:200 mass:1    PR, achievement celebration
motion.soft      damping:30 stiffness:100 mass:1    slow reveal
```

**Duration (non-spring):** instant 100ms, fast 200ms, normal 300ms, slow 500ms, slower 800ms

**Easing:** ios (0.25, 0.1, 0.25, 1) default, emphasize (0.2, 0, 0, 1) enter, accelerate (0.4, 0, 1, 1) exit

---

## 3. Component Library

Foundation'da **~20 core component**. Ek componentler feature-slice'lar geliştikçe design-system'e eklenir (YAGNI). Erken aşırı component genişlemesi = her feature-slice'ta test yükü + maintainability borcu.

### Core (Foundation'da teslim edilir)

**Primitives (6):** Box, Text, Pressable, Stack, Divider, SafeAreaWrapper

**Inputs (3):** Button (5 variant — primary/secondary/ghost/danger/ai), TextInput, Switch

**Display (5):** Card, Badge, Skeleton, EmptyState, Icon

**Feedback (4):** Toast, Sheet (bottom), Modal, LoadingSpinner

**FitAI Hero (5 — brand differentiators, Day 1 gerekli):**

- ReadinessRing (0-100, renk geçişli, spring animasyon)
- PetWidget (mood-aware, Lottie)
- AIMessage (indigo→violet glow, gradient border)
- StreakIndicator (ateş emoji + gün sayısı)
- XPBar (level progress)

### Feature-slice'larda eklenir (kapsam dışı)

OTPInput, PasswordInput, Slider, Checkbox, Radio, SegmentedControl, Avatar, Tag, Alert, ProgressBar, ProgressRing, SwipeableListItem, RepCounter, FormFeedbackOverlay, WorkoutCard, MealCard, HealthMetricTile, vb.

### Her component standardı

- TypeScript strict typed, sıfır `any`
- accessibilityLabel + accessibilityHint
- Haptic hook (gerekli yerlerde)
- i18n-ready props (string prop değil key prop)
- Dark/light variant (ThemeProvider ile otomatik)
- Showcase ekranında görüntülenebilir

---

## 4. Navigation Mimarisi

### Tab yapısı (5 tab)

```
┌───────┬────────┬──────────┬────────┬─────┐
│ Home  │ Train  │ Nutrition│ Health │ You │
└───────┴────────┴──────────┴────────┴─────┘
```

**Home:** Günaydın kartı (AI), Readiness ring, Pet widget, Streak, hızlı eylemler, bugünün programı özeti, AI chat kısayolu (glow butonu)

**Train:** Bugünün programı, session başlat, geçmiş, egzersiz kütüphanesi, roadmap, analytics + advanced, progress, AR fitting, form analizi arşivi

**Nutrition:** Today + History + Explore + Profile tabları (web paritesi), öğün log, AI foto, su, içecekler, templates, streak, restoran tarayıcı, tarif builder, kiler, kafein curfew

**Health:** Overview / Activity / Sleep / Body / Devices / Metrics tabları (web paritesi), uyku dashboard, supplementler, ilaçlar, soğuk/sauna, kan tahlili, nefes seansı, stres günlüğü

**You:** Profil, Social (Friends/Leaderboard/Teams/Activity feed/Story/Mentor/Canlı sesli oda), Pet deep (evrim/shop/minigame), Achievements & XP, Challenges, Messaging, Notifications, Settings, Billing, Privacy, Data export, Devices yönetimi

### Icon stili

SF Symbols (iOS) + Material Symbols (Android) — platform native, kullanıcıya tanıdık.

### Modal stack (tab bar kapatan akışlar)

- Active workout session (fullscreen, minimize gesture)
- AR food scanner (fullscreen)
- Restaurant menu scanner (fullscreen)
- Voice coach room (fullscreen)
- Meal log with AI photo (sheet)
- Pet interaction tap-full (fullscreen animation)
- Onboarding (post-auth, fullscreen)
- AI coach chat (sheet, yarı-ekran)

### Auth grubu

`(auth)` — sign-in, sign-up, onboarding (10 step), check-in. Tab yok.

### Deep linking

`fitai://` URL scheme. Her önemli ekran URL'e maplenir:

- `fitai://home`
- `fitai://workout/session/{id}`
- `fitai://nutrition/today`
- `fitai://pet`
- `fitai://coach`

### iOS native katman (Apple Native hero)

- Handoff: NSUserActivity ile her ekran Mac'te devam
- Focus mode: Workout Focus → app ana ekranda
- Siri Shortcuts: "Bugünün antrenmanı başlat" vs
- iMessage extension: paylaşım kartı

> **NOT:** Live Activity (Dynamic Island) ve Widget'lar (#13 iOS Native Layer sub-project'e ertelendi). Bu özellikler Expo Modules API + custom native Swift kodu gerektirir; Foundation scope'unda değil.

---

## 5. Core Providers

1. **ClerkProvider** — expo-secure-store token cache (Keychain/Keystore)
2. **QueryClientProvider** — TanStack Query (retry, background refetch, optimistic)
3. **ThemeProvider** — tokens + dark/light/system mode + Reanimated
4. **I18nProvider** — TR/EN + ICU message format + Dynamic Type integration
5. **SentryProvider** — crash + error tracking + breadcrumbs + user context
6. **ErrorBoundaryProvider** — her feature slice'ın üstünde
7. **ToastProvider** — non-blocking notifications
8. **HapticProvider** — centralized haptic calls (impact/selection/success/error)
9. **SheetProvider** — global bottom sheet manager
10. **StorageProvider** — MMKV wrapper + typed helpers

11. **SecurityProvider** — root/jailbreak detection, SSL pinning, App Attest (production), biometric re-auth gate

**Sıralama:** Sentry → Security → Clerk → Query → Theme → I18n → ErrorBoundary → Storage → Toast/Haptic/Sheet → App

---

## 6. Data Layer

### Offline-first stratejisi

**Her aksiyon:**

1. Optimistic update (UI anında güncellenir)
2. MMKV'ye yazılır (yerel cache, AES-256 şifreli — key Keychain'de)
3. Sync queue'ya eklenir (Zustand slice in-memory; uygulama başlarken MMKV'den hydrate edilir — Zustand persist middleware kullanılmaz)
4. Sync worker arka planda sunucuya yollar
5. Başarısızlık → exponential backoff retry (max 5, sonra dead letter)
6. Conflict → domain bazlı çözüm (aşağıya bkz.)

### Conflict Resolution Matrix

| Domain                      | Strateji                       | Gerekçe                          |
| --------------------------- | ------------------------------ | -------------------------------- |
| Workout session             | Server-wins (timestamp)        | Çift session tehlikeli           |
| Health metrics (sleep, HRV) | Wearable-wins                  | Cihaz verisi daha güvenilir      |
| User profile                | Last-write-wins                | Değişim seyrek, kayıp düşük risk |
| Meal log                    | Append (her kayıt unique UUID) | Silinme çakışması yok            |
| Pet interaction             | Server-wins                    | Ekonomi tutarlılığı kritik       |
| Streak/XP                   | Server-wins                    | Cheat prevention                 |
| Settings                    | Last-write-wins                | Kullanıcı tercihi                |

> Tüm conflicts server'a iletilir; server-side idempotency anahtarı `X-Idempotency-Key: <uuid>` header ile.

### Backend API Contract

Her API çağrısı şu kontratı uygular:

**İstek standardı:**

- `Authorization: Bearer <clerk-token>` her istek
- `X-Idempotency-Key: <uuid-v4>` mutasyonlarda (POST/PATCH/DELETE)
- `X-Client-Version: <semver>` — sunucu eski istemciyi uyarabilir
- `Content-Type: application/json`

**Circuit breaker (Axios interceptor):**

- 5 saniye timeout (default)
- 3 ardışık 5xx → devre aç (30 saniye bekle)
- 429 Too Many Requests → `Retry-After` header'a saygı + local backoff
- 401 Unauthorized → Clerk token yenile, 1 kez retry; başarısız → sign-out

**Hata dönüş standardı:**

```json
{
  "error": { "code": "RATE_LIMITED", "message": "...", "retryAfter": 30 }
}
```

**Rate limit farkındalığı:**

- Kullanıcıya limit mesajı "Biraz bekleyin, sunucu meşgul" formunda
- Background sync devre dışı bırakılır; foreground sadece kritik istek

### Tech stack

- **Server state:** TanStack Query 5
- **Client state:** Zustand (UI-only, küçük)
- **Cache:** MMKV (AsyncStorage'dan 10x hızlı, sync, AES-256 şifreli)
- **Sync queue:** Custom (Zustand slice in-memory + doğrudan MMKV okuma/yazma; Zustand `persist` middleware YASAK — monorepo'da SSR crash precedent'i var)
- **Offline detection:** NetInfo
- **API client:** Axios + interceptor chain (auth, idempotency, circuit breaker, error normalize)

### Query conventions

- Her endpoint için `useXxxQuery()` + `useXxxMutation()` hook
- Stale time: 5 dakika default, kritik data 30 saniye
- Retry: 3 kez, 2^n saniye bekleme (TanStack built-in)
- Background refetch: foreground gelince + window focus
- Mutation onSuccess: cache invalidation + optimistic rollback onError

---

## 7. Accessibility & i18n

### WCAG 2.1 AA zorunluluklar

- Screen reader: VoiceOver (iOS) + TalkBack (Android)
- accessibilityLabel + accessibilityHint her etkileşimde
- Dynamic Type: %200'de overflow yok
- Kontrast: 4.5:1 normal text, 3:1 büyük text, 3:1 UI
- Touch target: 44pt (iOS) / 48dp (Android) minimum
- Reduced motion support: prefers-reduced-motion → animasyonlar kısalır
- Haptic + görsel geri bildirim (sessiz mod için görsel önemli)

### Diller (Day 1)

- 🇹🇷 Türkçe (default)
- 🇬🇧 English

### Genişleme hazırlığı

RTL desteği Day 1'de var (Arabic için). expo-localization + i18n-js. ICU message format (pluralization, gender, interpolation).

---

## 8. Animasyon Sistemi

### Türler

1. **Spring** — button, sheet, layout
2. **Shared element** — tab'lar arası ortak öğe transitions
3. **Layout animation** — Reanimated layoutAnimation
4. **Gesture** — pan/swipe/pinch, Reanimated worklet
5. **Lottie** — kompleks (pet, achievement cinema)
6. **Parallax** — scroll-driven depth
7. **Haptic-sync** — titreşim + animasyon eş zamanlı

### FitAI hero animations

- **Readiness ring** — spring daire dolma + renk geçişi
- **AI glow shimmer** — AI içerikte subtle gradient akış
- **Pet mood shift** — mood değişiminde morph
- **PR unlock cinema** — fullscreen achievement animation
- **XP bar** — seviye atlarken explode + level up
- **Streak fire** — streak büyüdükçe alev büyür

### Performans kuralları

- Tüm animasyonlar Reanimated 3 worklet (JS bridge'e dokunmaz)
- Only GPU properties: transform, opacity
- LayoutShift yasak (animate width/height direkt)
- FPS takibi: dev menu'de 60fps gauge
- Reduced motion: tüm animasyonlar %50 duration veya iptal

---

## 9. Dev Altyapı

### CI (GitHub Actions)

Her PR'da bloklayıcı:

- `pnpm typecheck`
- `pnpm lint`
- `pnpm test`
- `pnpm build` (iOS + Android)

### Test

- **Unit:** Jest + jest-expo (React Native'in standart test runner'ı; Vitest RN ile uyumsuz)
- **Integration:** feature düzeyi, MSW (Mock Service Worker) ile API mock + MMKV mock (`react-native-mmkv/jest` — paketle gelen resmi jest mock)
- **E2E:** Maestro (iOS Simulator + Android Emulator)
- **Visual regression:** opsiyonel, Chromatic entegrasyonu

> **NOT:** Vitest React Native'de çalışmaz (metro bundler/jsdom uyumsuzluğu). "Real Prisma" mobile istemcide mevcut değil; integration test katmanı MSW ile web API'yi mock eder.

### EAS (Expo Application Services)

- **EAS Build:** iOS IPA + Android APK/AAB otomatik
- **EAS Update:** OTA hot patches (store review beklemez)
- **EAS Submit:** TestFlight + Play Store otomatik upload
- **Channels:** canary (internal) → beta (TestFlight beta) → production

### Monitoring

- **Sentry:** crash, error, user context, breadcrumbs, release tracking
- **PostHog:** product analytics, funnel, cohort, feature flag evaluation
- **Expo Insights:** Update adoption, crash-free session rate

### Feature flags

**GrowthBook** — her riskli feature flag arkasında. %5 → %50 → %100 progressive rollout.

---

## 10. Klasör Yapısı

```
apps/mobile/
├── app/                   # Expo Router (file-based routing)
│   ├── (auth)/           # Auth group: sign-in, sign-up, onboarding, check-in
│   ├── (tabs)/           # 5 ana tab
│   ├── workout/          # Modal routes
│   ├── nutrition/
│   └── _layout.tsx       # Root layout (providers)
│
├── src/
│   ├── features/         # Feature-slice — her özellik kendi klasörü
│   │   ├── auth/
│   │   ├── home/
│   │   ├── workout/
│   │   ├── nutrition/
│   │   ├── health/
│   │   ├── pet/
│   │   ├── social/
│   │   ├── coach/
│   │   └── ...
│   │
│   ├── design-system/    # Tokens + primitives + components
│   │   ├── tokens/       # colors, typography, spacing, motion
│   │   ├── primitives/   # Box, Text, Pressable
│   │   ├── components/   # Button, Card, Input, Sheet vs
│   │   └── icons/
│   │
│   ├── providers/        # Clerk, Query, Theme, i18n, Sentry
│   ├── api/              # Backend API clients
│   ├── lib/              # Utilities (haptic, toast, format)
│   ├── hooks/            # Shared hooks
│   ├── stores/           # Zustand
│   ├── db/               # MMKV, SQLite
│   ├── services/         # Complex logic (sync queue, memory)
│   ├── i18n/             # messages/tr.json, en.json
│   └── types/            # Shared TS types
│
├── assets/               # fonts, images, Lottie
├── __tests__/            # Unit + integration tests
├── e2e/                  # Maestro flows
└── Config: env, babel, metro, tailwind, eas.json, tsconfig
```

### Feature-slice kuralı

Bir feature, başka feature'ın iç detayına bakamaz. Shared olanlar: `design-system`, `lib`, `hooks`, `api`.

### Dosya boyutu

Hedef ≤300 satır. Gerekçeli aşım OK (generated types, constants, complex state machines). Gerçek kural: tek sorumluluk, açıklayıcı isim, 5 dakikada anlaşılır.

---

## 11. Microcopy & İçerik Standartları

### Marka sesi

FitAI'nin konuşma tarzı:

- Samimi ama saygılı
- Net ve eylem odaklı
- Motive edici ama sahte değil
- Kullanıcıyı tanıdığını gösterir
- Bilgiçlik yok, komut yok

**Yasak:** klişe fitness coşkusu, ruhsuz sistem dili, aşırı teknik jargon, yapay WOW.

### Mesaj kalıpları

**Hata mesajı:** [ne oldu insanca] + [ne yapabilirsin] + [CTA buton]

**Empty state:** [durum + duygusal ton] + [doğal sonraki adım]

**Success:** [kısa onay] + [opsiyonel: ilerlemenle bağlantı]

**Loading:** [AI varsa ne yaptığını söyle] + [progress %]

**Push:**

- Başlık ≤30 karakter
- Body ≤100 karakter
- 1 emoji max
- Action button: "Hızlı yanıt"

**Alert/Confirm:** [durum] + [sonuç] + [İptal] / [Doğrula]

### i18n standardı

- Hiçbir string kod içinde hardcoded değil
- Key yapısı: `<domain>.<category>.<context>`
- ICU message format
- Namespace'ler: common, home, workout, nutrition, health, pet, social, error, empty, success, notification

### Zengin bildirimler (iOS)

- Pet bildirimleri → Pamuk mood animasyonu
- PR unlock → açıldığında kutlama inline
- Weekly summary → ilerleme grafiği inline

---

## 12. Foundation İmplementasyon Milestone'ları

### M1: Tokens & Core Config (~2 gün)

- Design tokens (colors, typography, spacing, motion) — `src/design-system/tokens/`
- TypeScript strict + ESLint + Prettier config
- pnpm workspace, engines pinli (Node 20+, pnpm 10+)
- Environment variable validation (zod)
- CI pipeline iskelet (typecheck + lint)
- Expo 54 + React Native 0.81 sabitlenmiş

### M2: Primitives + Theme (~3 gün)

- Primitive componentler (Box, Text, Pressable, Stack)
- ThemeProvider (dark/light/system + listens iOS settings)
- i18n altyapı (i18n-js + expo-localization + TR/EN seed)
- Light ↔ Dark mode switch runtime
- Dynamic Type support
- Accessibility base setup

### M3: Component Library (~6-7 gün)

- ~20 core component (Button, TextInput, Switch, Card, Badge, Skeleton, EmptyState, Icon, Toast, Sheet, Modal, LoadingSpinner + Box/Text/Pressable/Stack/Divider/SafeAreaWrapper)
- FitAI hero (5): ReadinessRing, PetWidget, AIMessage, StreakIndicator, XPBar
- Her component: accessibility labels, haptic hooks, i18n props, showcase ekranı
- Reanimated 3 motion system entegre
- Lottie seti seed (pet moods, celebration animations)

### M4: Navigation + Providers + Security (~4-5 gün)

- Expo Router: 5 tab iskelet + auth group + modal stack
- Tab bar custom component (SF Symbols + Material Symbols)
- ClerkProvider + QueryClientProvider + SentryProvider entegre
- SecurityProvider: expo-device root/jailbreak detection, SSL pinning (react-native-ssl-pinning), App Attest dev stub
- MMKV + AES-256 şifreleme (key Keychain'de) + sync queue altyapı
- Axios interceptor chain: auth token, idempotency, circuit breaker, error normalize
- Deep linking (fitai:// scheme)
- Handoff + Focus mode + Siri Shortcuts: **sadece entitlement ve Info.plist ayarları** (app.json config). Runtime NSUserActivity / INIntent implementasyonu → #13 iOS Native Layer sub-project. Expo managed workflow'da tam implementasyon native kod gerektirir.

### M5: Dev Altyapı Finalize (~2 gün)

- EAS Build (iOS + Android) çalışır
- EAS Update kanalları (canary/beta/production)
- EAS Submit (TestFlight auto upload)
- Jest + jest-expo + Maestro setup + CI entegrasyon
- GrowthBook feature flag entegrasyon
- PostHog analytics
- Sentry production alerting kuralları
- Crash-free session monitoring

**Milestone toplamı: ~17-19 iş günü (net kod yazma).** Toplam proje süresi: **~25-30 iş günü** — kalan 8-11 gün şunları kapsar: PR review döngüleri (milestone başına ~1-2 gün), kullanıcı approval gate'leri, environment setup/debugging, beklenmedik version uyumsuzlukları (Expo ekosistemi). Her milestone: kod → PR → review → approval → merge, sonra sıradakine geçilir.

Her milestone sonunda: çalışır durum + PR review + user approval + merge. Sonra sıradakine.

---

## 13. Başarı Tanımı (Definition of Done)

Foundation bittiğinde:

- [ ] 5 tab'lık iskelet uygulama simulator'da açılır, her tab'a tıklanabilir
- [ ] Splash → sign-in → onboarding mock → home gezilebilir (içerik boş, akış çalışır)
- [ ] Dark ↔ Light mode runtime switch
- [ ] Türkçe ↔ İngilizce runtime switch
- [ ] ~20 core + 5 hero component Showcase ekranında görüntülenebilir
- [ ] Hero componentler (ReadinessRing, PetWidget, AIMessage) çalışır demo
- [ ] `pnpm typecheck` / `lint` / `test` / `build` hepsi yeşil
- [ ] Sentry'e test crash düşüyor
- [ ] EAS Build iOS IPA + Android AAB production-ready
- [ ] EAS Update canary kanalına deploy denemiş
- [ ] 60fps perf test — scroll + modal + transitions hepsi smooth
- [ ] WCAG 2.1 AA audit geçti (Xcode Accessibility Inspector + react-native-testing-library accessibility assertions; axe-core web'e özgü, RN'de çalışmaz)
- [ ] %200 Dynamic Type test: overflow yok
- [ ] Reduced motion test: animasyonlar saygılı
- [ ] VoiceOver + TalkBack kritik akışlarda çalışır
- [ ] Offline mode: airplane mode'da uygulama crash yok
- [ ] Crash-free session rate ≥99.5% (Sentry)
- [ ] SecurityProvider: root detection logu veriyor (dev build)
- [ ] SSL pinning: staging domain'e bağlantı sertifika hash doğrulama test
- [ ] MMKV şifreli: plaintext key cihazda görünmüyor (Xcode device file inspector)
- [ ] Privacy Manifest (PrivacyInfo.xcprivacy) EAS Build'de dahil
- [ ] Medikal disclaimer: ilk açılışta modal gösteriliyor
- [ ] Performance bütçesi: cold start <2s (iPhone 13 fiziksel cihaz), screen transition <300ms (Sentry App Start Transaction)

---

## 14. Güvenlik Mimarisi (SecurityProvider)

### Token & Kimlik Bilgisi Koruması

- Clerk token: `expo-secure-store` → iOS Keychain / Android Keystore
- MMKV şifreleme anahtarı: Keychain'de saklanır, uygulama her açılışta retrieve eder
- Hiçbir token/secret AsyncStorage veya MMKV plaintext'e gitmez
- Hassas log yasağı: token, email, PII hiçbir zaman console.log veya Sentry breadcrumb'da

### SSL Pinning

- **Kütüphane:** `react-native-ssl-pinning` (EAS Build'de native module linking gerektirir; `app.json` plugin config veya `expo-build-properties` aracılığıyla entegre edilir — managed workflow'da otomatik bağlanmaz)
- **Production:** backend domain için public key hash pinlendi
- **Dev/Staging:** pinning devre dışı (cert rotasyonu kolaylığı için)
- **Rotasyon prosedürü:** Eski + yeni hash aynı anda eklenir (overlap window), sonra eski kaldırılır

### Root / Jailbreak Detection

- **Kütüphane:** `react-native-jail-monkey` (iOS jailbreak + Android root detection, Expo dev client uyumlu). `expo-device.isDevice` ek sinyal olarak kullanılır (emulator tespiti) ancak güvenlik kontrolü değil.
- **Aksiyon:** Root/jailbreak tespit → kullanıcıya uyarı + hassas feature'lar (kan tahlili, supplement log) devre dışı
- **Premium block değil:** UX uyarısı + devam seçeneği (veri kaybı sorumluluğu kullanıcıda)

### App Attest (iOS 14+)

- **Amaç:** Gerçek Apple cihazından gelen istek doğrulaması (bot/emulator önlemi)
- **Foundation'da:** Stub implementasyon (header gönderilen, sunucu henüz validate etmiyor)
- **Production'da:** `DCAppAttestService` tam entegrasyon (ayrı görev)

### Biometric Re-auth

- Hassas ekranlar (fatura, data export, hesap silme): `expo-local-authentication` Face ID / Touch ID kapısı
- Başarısız → ilgili ekran açılmaz, ana tab'a döner

---

## 15. Compliance & Legal

### GDPR (AB) / KVKK (Türkiye)

- **Veri kategorisi:** Sağlık verisi (GDPR Madde 9 — özel kategori). Kullanıcı açık rızası zorunlu.
- **Rıza akışı:** Onboarding'de ayrı ekran, checkbox yok — aktif seçim butonu
- **Veri silme:** "Hesabı sil" → 30 gün içinde tüm kişisel veri (Supabase, Clerk, Redis, S3) silinir, cron job
- **Veri taşınabilirliği:** "Verilerimi indir" → JSON export (Settings sub-project'te implemente edilir)
- **Log retention:** Sentry events 90 gün, yapısal loglar 30 gün
- **DPA:** Clerk, Supabase, OpenAI, Sentry ile Data Processing Agreement imzalanmış olmalı

### Apple App Store Gereksinimleri

- **Privacy Manifest (`PrivacyInfo.xcprivacy`):** Expo SDK 53+ zorunlu kılıyor. Minimum baseline API'lar: NSUserDefaults, FileTimestamp, SystemBootTime. **Bu liste statik değil** — EAS Build sonrası Xcode'un Privacy Report aracıyla transitive dependency taraması yapılmalı; eksik bildirim App Store Review reddi getirir.
- **Nutrition Disclaimer:** "Bu uygulama tıbbi tavsiye vermez." App Store metadata + uygulama içi modal (ilk açılışta)
- **HealthKit kullanım açıklaması:** `NSHealthShareUsageDescription` + `NSHealthUpdateUsageDescription` Info.plist'te
- **Kamera / Mikrofon:** Her kullanımda OS izin diyaloğu + ön açıklama ekranı
- **Çocuk koruması:** 17+ yaş sınırı (sağlık + sosyal içerik)

### Medikal Sorumluluk Reddi

Her AI koç cevabının altında: "AI önerisi — sağlık kararları için doktorunuza danışın."
Onboarding'de imzalatılan kullanıcı sözleşmesi bu reddiyeyi içerir.

---

## 16. Observability Mimarisi

### Katmanlar

| Katman            | Araç               | Ne izlenir                                     |
| ----------------- | ------------------ | ---------------------------------------------- |
| Crash/Error       | Sentry RN SDK      | Unhandled exception, promise rejection, ANR    |
| Product Analytics | PostHog            | Screen view, feature event, funnel, cohort     |
| Performance       | Sentry Performance | App start time, screen render, API latency     |
| Update Adoption   | Expo Insights      | OTA update crash-free rate, adoption %         |
| Business Metrics  | PostHog + custom   | DAU, session length, feature usage, conversion |

### Sentry Kurulumu (Foundation'da tamamlanır)

- `@sentry/react-native` SDK initialize — release + dist tag (EAS build number)
- User context: Clerk userId (PII olmayan hash)
- Breadcrumb: navigation change, API call success/fail, feature flag evaluation
- Performance transaction: her screen transition + API call

### PostHog Event Taxonomy (temel)

Foundation'da sadece altyapı kurulur; event isimlerini feature-slice'lar ekler.

**Naming convention:** `<domain>_<object>_<verb>` — örn. `workout_session_started`, `nutrition_meal_logged`

**Zorunlu her event'te:** `user_id (hash)`, `session_id`, `platform`, `app_version`, `feature_flag_context`

### Performance Bütçesi

| Metrik                      | Hedef                                                                                   | Ölçüm                        |
| --------------------------- | --------------------------------------------------------------------------------------- | ---------------------------- |
| Cold start (JS bundle load) | < 2s (iPhone 13 veya eşdeğer Android mid-range; process launch → ilk interactive frame) | Sentry App Start Transaction |
| Screen transition           | < 300ms                                                                                 | Sentry Performance           |
| List scroll FPS             | 60fps sustained                                                                         | Flipper + Sentry             |
| API response (p95)          | < 800ms                                                                                 | Sentry Performance           |
| Memory (idle)               | < 150MB                                                                                 | Xcode Instruments            |
| Bundle size (iOS IPA)       | < 40MB                                                                                  | EAS Build output             |
| Crash-free session rate     | > 99.5%                                                                                 | Sentry + Expo Insights       |

---

## 17. Design System Governance

### Token yönetimi

- Tüm token'lar `src/design-system/tokens/` altında TypeScript const olarak tanımlanır
- **Style Dictionary** ile platform çıktısı üretilir: RN StyleSheet values, CSS variables (web için hazırlık)
- Token eklemek/değiştirmek → PR + design review (sadece Foundation sub-project maintainer'ı merge edebilir)

### Component ekleme süreci

1. Feature-slice geliştirici ihtiyaç tespiti yapar
2. `design-system/components/` altında PR açar
3. Showcase ekranına ekler + accessibility test yazar
4. Foundation maintainer review + merge
5. CHANGELOG.md güncellenir (semver: patch için ekleme, minor için API değişimi)

### Breaking change politikası

- Component prop API değişimi → minor version bump + deprecation warning (1 sprint)
- Token rename → global find-replace + PR (atomic)
- Kaldırma → 2 sprint deprecation window

---

## 18. Risk & Hafifletme

| Risk                                  | Etki                     | Hafifletme                                                                                                |
| ------------------------------------- | ------------------------ | --------------------------------------------------------------------------------------------------------- |
| Expo SDK sürüm uyumsuzluğu            | Runtime crash            | Tüm paketler `npx expo install` ile SDK'ya hizalı                                                         |
| Reanimated worklet karmaşıklığı       | 60fps kaçış              | Her animasyon öncesi Flipper perf profile                                                                 |
| Clerk Expo minor version API değişimi | Auth broken              | `@clerk/expo` changelog takibi; `<SignedIn>/<SignedOut>` ve token hook API'larını version bump'ta doğrula |
| MMKV native module + Expo             | Build fail               | Expo dev build, MMKV resmi Expo destekli; Keychain key yönetimi test                                      |
| SSL pinning + cert rotation           | App erişilmez            | Overlap window: eski+yeni hash aynı anda; rotation runbook doküman                                        |
| GDPR/KVKK compliance                  | App Store reject / yasal | Privacy Manifest + rıza akışı + medikal disclaimer M4'te                                                  |
| Live Activity / Widget (ertelendi)    | Beklenti yönetimi        | Kapsam dışı olduğu brainstorm doc'ta belgelenmiş; #13 sub-project                                         |
| Çoklu dil (RTL)                       | Layout bozukluğu         | Day 1 RTL test (Arabic seed key'ler)                                                                      |
| Offline sync conflict (sağlık verisi) | Data loss                | Domain bazlı conflict matrix §6'da; wearable-wins health için                                             |
| CI secret yönetimi                    | Key leak                 | EAS Secret + GitHub Actions encrypted secrets; `.env` gitignore                                           |

---

## 19. Sıradaki adımlar (Foundation sonrası)

Foundation onaylanıp merge edildikten sonra:

1. **Auth & Onboarding** sub-project (spec + plan + impl)
2. **Home** sub-project
3. **Workouts** sub-project
4. ...sırasıyla 15 sub-project (Brainstorm Kararları dokümanında liste)

Her biri bu Foundation'a oturur. Foundation'ın 2 hafta yatırımı, sonraki 15 alt projenin her birini 3-4x hızlandırır.

---

**Tasarımcı:** Claude (Anthropic) + Talha Kavakli
**Onay tarihi:** 2026-04-19
**Sonraki adım:** Spec review loop → user review → writing-plans ile implementation plan.
