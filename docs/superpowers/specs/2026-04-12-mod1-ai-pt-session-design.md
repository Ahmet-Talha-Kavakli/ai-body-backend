# Mod 1: AI PT + Egzersiz Seansı — Design Spec

## Özet

Seans ekranını baştan tasarlamak: sol panelde kişiselleştirilmiş low-poly 3D PT karakteri egzersiz animasyonları gösterir, sağ panelde kullanıcı kamerası form analizi yapar. Karakter kullanıcının onboarding verilerine göre şekillenir ve haftalık güncellenen body morph ile zamanla gelişir.

Mevcut `session/page.tsx` **tamamen yeniden yazılır** — çöp adam yerine gerçek 3D karakter gelir.

---

## Kararlar

| Konu                    | Karar                                                  |
| ----------------------- | ------------------------------------------------------ |
| Karakter stili          | Low-poly atletik (Three.js / React Three Fiber)        |
| Gelişim sistemi         | Body morph + seviye bazlı görsel değişim               |
| Morph güncelleme        | Haftalık (mevcut weekly summary cron'a eklenir)        |
| Morph trigger           | Onboarding bitince ilk hesap; sonrasında haftalık cron |
| Platform                | Web (Next.js) + Mobil (Expo/React Native, Babylon.js)  |
| Layout                  | Sol %40 3D karakter + Sağ %60 kamera + Alt metrik bar  |
| Mevcut session/page.tsx | Yeniden yazılır, yerine SessionPage.tsx geçer          |

---

## 1. Karakter Sistemi

### 1.1 Body Morph Parametreleri

`HealthProfile` → `CharacterMorphParams` dönüşümü `morph-calculator.ts` içinde yapılır:

```typescript
// packages/shared-types/src/character.ts
interface CharacterMorphParams {
  bmi: number // weightKg / (heightCm/100)^2
  muscleLevel: number // 0–1, fitnessLevel + toplam antrenman sayısından
  heightNorm: number // heightCm / 175 (normalize)
  gender: 'male' | 'female' | 'other'
  fitnessLevel: 'beginner' | 'intermediate' | 'advanced' | 'elite'
  updatedAt: string // ISO timestamp
}

// morph-calculator.ts girdisi — doğrudan HealthProfile + workoutCount
interface MorphCalculatorInput {
  weightKg: number
  heightCm: number
  fitnessLevel: string
  gender: string
  totalWorkoutCount: number // DB'den: WorkoutSession count
}
```

**BMI → Gövde Scale:**

| BMI       | Scale X (gövde genişliği) |
| --------- | ------------------------- |
| < 18.5    | 0.85                      |
| 18.5–24.9 | 1.0                       |
| 25–29.9   | 1.15                      |
| 30–34.9   | 1.30                      |
| ≥ 35      | 1.45                      |

**Fitness Level → Kas Detayı (shoulder/arm scale, renk):**

| Seviye       | Omuz | Kol  | Renk               |
| ------------ | ---- | ---- | ------------------ |
| Beginner     | 1.0  | 1.0  | Mat (#10b981)      |
| Intermediate | 1.05 | 1.08 | Canlı (#34d399)    |
| Advanced     | 1.12 | 1.18 | Parlak + glow      |
| Elite        | 1.20 | 1.28 | Metalik + partikül |

**muscleLevel hesabı:**

```typescript
// 0 workout = 0.0, 100+ workout = 1.0 (lineer clamp)
muscleLevel = Math.min(totalWorkoutCount / 100, 1.0)
```

### 1.2 Morph Güncelleme Zamanlaması

**İlk hesap:** Onboarding POST `/api/onboarding` tamamlanınca `morph-calculator` çağrılır, sonuç `User.characterMorphCache` alanına yazılır.

**Haftalık:** Mevcut `apps/web/app/api/cron/weekly-summary/route.ts` içine eklenir:

```typescript
// weekly-summary cron'a eklenir
await updateCharacterMorphCache(userId, {
  weightKg: latestWeightFromMetrics ?? profile.weightKg,
  totalWorkoutCount: allTimeWorkoutCount,
})
```

### 1.3 DB Değişikliği

```prisma
// schema.prisma — User modeline eklenir
characterMorphCache  Json?
// Format: CharacterMorphParams (bmi, muscleLevel, heightNorm, gender, fitnessLevel, updatedAt)
```

### 1.4 Seviye Bazlı Görsel Değişim

Her seviyede karakter farklı görünür — Three.js material + scale değişimi:

| Seviye       | Kıyafet rengi | Efekt                          |
| ------------ | ------------- | ------------------------------ |
| Beginner     | Gri/mat       | Yok                            |
| Intermediate | Mavi/canlı    | Hafif point light              |
| Advanced     | Yeşil/parlak  | Emissive glow                  |
| Elite        | Altın/metalik | Partikül sistemi (Points mesh) |

---

## 2. Egzersiz Animasyonları

### 2.1 Animasyon Sistemi (Web — Three.js)

`PTCharacter3D.tsx` içinde Three.js `AnimationMixer` kullanılır. Her egzersiz için prosedürel keyframe animasyonu:

```typescript
// apps/web/components/session/character/animations/squat.ts
import { AnimationClip, KeyframeTrack, VectorKeyframeTrack } from 'three'

export function createSquatAnimation(): AnimationClip {
  // Bacaklar aşağı/yukarı keyframe'leri
  const kneeTrack = new VectorKeyframeTrack(
    '.children[4].position', // sol diz mesh
    [0, 0.5, 1.0],           // zaman (sn)
    [0,0,0, 0,-0.3,0, 0,0,0] // pozisyonlar
  )
  return new AnimationClip('squat', 1.0, [kneeTrack, ...])
}
```

MVP animasyon listesi: `squat`, `pushup`, `plank`, `lunge`, `deadlift`, `idle`, `rest`

### 2.2 Kullanıcı Rep Hızına Senkronizasyon

```typescript
// useExerciseAnimation.ts
useEffect(() => {
  if (userRepDurationMs > 0) {
    mixer.timeScale = animClip.duration / (userRepDurationMs / 1000)
  }
}, [userRepDurationMs])
```

### 2.3 Mobil Animasyon (Babylon.js)

Mevcut `avatar-loader.ts` genişletilir. Yeni parametre yapısı `CharacterMorphParams` ile uyumlu hale getirilir:

```typescript
// avatar-morpher.ts GÜNCELLENİR
// Mevcut: startingWeight/currentWeight (weight-only)
// Yeni: CharacterMorphParams (bmi + muscleLevel + fitnessLevel)
applyMorphParams(scene: Scene, params: CharacterMorphParams): void {
  const bodyScale = bmiToScale(params.bmi)
  const armScale = fitnessToArmScale(params.fitnessLevel, params.muscleLevel)
  // Mevcut weight-based scale mantığı → params-based'e migrate
}
```

---

## 3. Seans UI — Web

### 3.1 Layout (mevcut session/page.tsx YERİNE GEÇİR)

```
┌─────────────────────────────────────────────────────┐
│  HEADER: Egzersiz adı | Set X/Y | Rep X/Y | Timer   │
├──────────────────────┬──────────────────────────────┤
│                      │                              │
│   3D PT KARAKTERİ   │     KULLANICI KAMERASI       │
│   (React Three       │     (PoseDetectionCamera)    │
│    Fiber canvas)     │     + skeleton overlay       │
│                      │     + form score badge       │
│   - Egzersiz anim.   │                              │
│   - Form cue okları  │                              │
│   - Set arası rest   │                              │
│        40%           │           60%                │
├──────────────────────┴──────────────────────────────┤
│  METRIK BAR: Form Skoru | Kalori | BPM | Ses toggle │
├─────────────────────────────────────────────────────┤
│  KOÇLUK MESAJI (AI mesajı, ses dalgası animasyonu)  │
└─────────────────────────────────────────────────────┘
```

### 3.2 Seans Modu Seçim Ekranı

`/dashboard/session` açılınca önce mod seçimi:

```
┌──────────────────────┬──────────────────────────────┐
│   🏋️ AI PT ile Spor │   💬 Fitness Koçu            │
│   [Başla →]          │   [Başla →]                  │
└──────────────────────┴──────────────────────────────┘
```

### 3.3 Set Arası Dinlenme

Karakter rest animasyonuna geçer, geri sayım sayacı gösterilir. "Hazırım" ile erken başlanabilir.

---

## 4. Seans UI — Mobil

### 4.1 Layout

```
┌─────────────────────────┐
│  Egzersiz | Set | Rep   │
├─────────────────────────┤
│   3D KARAKTERİ          │
│   (Babylon.js canvas)   │
│         45%             │
├─────────────────────────┤
│   KULLANICI KAMERASI    │
│   + Skeleton overlay    │
│         45%             │
├─────────────────────────┤
│  Form: ██░░ | BPM | Cal │
└─────────────────────────┘
```

### 4.2 Performans Katmanları

| Tier | 3D                       | FPS   |
| ---- | ------------------------ | ----- |
| HIGH | Full low-poly + efektler | 30fps |
| MID  | Low-poly, efekt yok      | 20fps |
| LOW  | 2D CSS sprite fallback   | 15fps |

---

## 5. Dosya Yapısı

### Web (apps/web)

```
app/(dashboard)/dashboard/session/
  page.tsx                       ← MOD SEÇİM EKRANIYLA GÜNCELLENİR
  workout/page.tsx               ← YENİ: Mod 1 egzersiz sayfası
  fitness-coach/page.tsx         ← YENİ: Mod 2 (ayrı spec)

components/session/
  SessionModeSelector.tsx        ← YENİ: Mod seçim bileşeni
  panels/
    CharacterPanel.tsx           ← YENİ: Sol panel (3D karakter wrapper)
    CameraPanel.tsx              ← YENİ: Sağ panel (mevcut kamera + pose)
  character/
    PTCharacter3D.tsx            ← YENİ: Ana R3F bileşen
    useCharacterMorph.ts         ← YENİ: HealthProfile → morph hook
    useExerciseAnimation.ts      ← YENİ: Animasyon yönetimi
    animations/
      squat.ts                   ← YENİ
      pushup.ts                  ← YENİ
      plank.ts                   ← YENİ
      lunge.ts                   ← YENİ
      deadlift.ts                ← YENİ
      idle.ts                    ← YENİ
      rest.ts                    ← YENİ
  metrics/
    SessionMetricBar.tsx         ← YENİ: Alt metrik bar
    CoachMessageBubble.tsx       ← YENİ: Koçluk mesajı

lib/character/
  morph-calculator.ts            ← YENİ: HealthProfile → CharacterMorphParams
  level-calculator.ts            ← YENİ: workoutCount → fitnessLevel

app/api/character/
  morph/route.ts                 ← YENİ: GET kullanıcı morph params

prisma/schema.prisma             ← GÜNCELLENİR: characterMorphCache Json?
```

### Mobil (apps/mobile)

```
lib/session/
  avatar-morpher.ts              ← GÜNCELLENİR: weight-only → CharacterMorphParams
  animations/
    squat-animation.ts           ← YENİ
    pushup-animation.ts          ← YENİ
    plank-animation.ts           ← YENİ
    idle-animation.ts            ← YENİ
    rest-animation.ts            ← YENİ
app/session/
  session-view.tsx               ← GÜNCELLENİR: layout yenileme
```

### Shared Types (packages/shared-types)

```
src/character.ts                 ← YENİ: CharacterMorphParams, CharacterLevel
```

---

## 6. Veri Akışı

```
Onboarding POST → HealthProfile kaydedilir
                        ↓
              morph-calculator.ts(HealthProfile + workoutCount=0)
                        ↓
              characterMorphCache → User DB alanına yazılır
                        ↓
              [Her hafta: weekly-summary cron]
              updateCharacterMorphCache(userId, latestWeight, workoutCount)
                        ↓
              [Seans açılır]
              GET /api/character/morph → characterMorphCache okunur
                        ↓
              PTCharacter3D.tsx → useCharacterMorph(params)
              → Three.js scale/material/effect uygulanır
                        ↓
              useExerciseAnimation(exerciseSlug)
              → AnimationMixer.play() → egzersiz animasyonu başlar
                        ↓
              SessionOrchestrator → userRepDurationMs
              → animationMixer.timeScale sync
```

---

## 7. Hata Yönetimi

| Durum                                     | Davranış                                  |
| ----------------------------------------- | ----------------------------------------- |
| WebGL desteksiz                           | 2D CSS animasyonlu fallback karakter      |
| characterMorphCache null (yeni kullanıcı) | Varsayılan params: BMI=22, beginner, male |
| Animasyon yüklenemedi                     | idle pozu göster, logger.error            |
| Mobil LOW tier                            | 2D sprite fallback                        |
| /api/character/morph 404                  | Varsayılan params ile devam               |

---

## 8. Test Kapsamı

```typescript
// lib/character/morph-calculator.test.ts
it('normal BMI → scale 1.0')
it('obese BMI → scale 1.45')
it('elite level → arm scale 1.28')

// lib/character/level-calculator.test.ts
it('0 workouts → beginner')
it('100+ workouts → advanced')

// components/session/character/PTCharacter3D.test.tsx
it('renders without crashing with default params') // WebGL mock

// app/api/character/morph/route.test.ts
it('returns 401 when unauthenticated')
it('returns cached morph params for authenticated user')
it('returns default params when cache is null')
```

---

## 9. Kapsam Dışı

- Mod 2 (Fitness Koçu / Sohbet)
- Mixamo animasyon entegrasyonu (Aşama 2)
- Çoklu karakter seçeneği
- Karakter özelleştirme UI
