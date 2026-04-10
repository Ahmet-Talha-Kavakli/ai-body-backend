# FitAI V2 — Tam Sistem Tasarım Dokümanı
**Tarih:** 2026-04-10  
**Versiyon:** 2.0  
**Kapsam:** Tam yeniden yazım + yeni özellikler  

---

## 1. VİZYON

FitAI, sadece bir fitness uygulaması değil — kullanıcının bedenini, zihnini ve yaşam tarzını gerçek zamanlı olarak anlayan, sürekli öğrenen, global standartlarda bir **AI Beden Koçu** platformudur.

Rakiplerden farkı:
- Gerçek bir PT gibi **bedeni tanır** (kan tahlili, uyku, sakatlık, vücut kompozisyonu)
- Praktika gibi **yolculuk** oluşturur — her seans bir öncekinden beslenir
- VAPI ile **gerçek sesli koç** deneyimi sunar
- **Sürekli öğrenir** — kullanıcı geliştikçe sistem de gelişir
- Web + iOS + Android'de **tek kod tabanı**

---

## 2. MİMARİ KARARLAR

### 2.1 Teknoloji Stack

| Katman | Mevcut | V2 |
|--------|--------|----|
| Frontend (Web) | Next.js 15 + Tailwind | Next.js 15 + Tailwind + tamamen yeni UI sistemi |
| Mobile | Yok | Expo SDK 52 (React Native) — business logic paylaşımlı |
| Cross-platform UI | Yok | **NativeWind v4** — Tailwind sınıfları web + native'de çalışır |
| Sesli Koç | OpenAI Whisper + TTS | **VAPI** (gerçek zamanlı, <800ms latency) |
| AI/LLM | GPT-4o-mini | GPT-4o (primary) + GPT-4o-mini (hızlı işlemler) |
| ML | TensorFlow.js (bozuk) | TensorFlow.js — düzeltilmiş, gerçekten eğitilmiş |
| Uzun Dönem Hafıza | Yok | **pgvector** (Supabase üzerinde — SQL ile joinable, self-hosted) |
| Egzersiz Veritabanı | 5 egzersiz | **ExerciseDB API** + custom (1300+ egzersiz) |
| State Management | Zustand (minimal) | Zustand + React Query (TanStack) |
| Animasyon (Web) | Framer Motion | Framer Motion + GSAP + CSS shader (canvas tabanlı aurora) |
| Animasyon (Mobile) | Yok | Reanimated 3 + Lottie |
| Vücut Analizi | Yok | MediaPipe (web) + TF Lite MoveNet (mobile) |
| Backend API | Next.js API routes | Next.js API routes (web + mobile ortak REST API) |

### 2.2 Shared Package Stratejisi (Monorepo)

```
apps/
  web/          # Next.js 15 web app (mevcut, yeniden yazılacak)
  mobile/       # Expo SDK 52 (YENİ — Faz 3'te)

packages/
  shared-types/   # Mevcut — Prisma tipleri + domain modelleri
  shared-ai/      # YENİ — prompt builders, memory orchestrator, context assembler
  shared-hooks/   # YENİ — iş mantığı hook'ları (platform-agnostic)
  shared-utils/   # YENİ — hesaplama fonksiyonları (ReadinessScore, ProgressiveOverload vb.)
```

**Neden shared-ui yok:** React DOM ve React Native farklı render primitifi kullanır. NativeWind v4 ile Tailwind sınıfları her iki platformda çalışır, ama bileşen yapısı platforma özgü kalır. `shared-ui` yerine her app kendi UI katmanını yazar, business logic `shared-hooks`'ta yaşar.

### 2.3 Hafıza Mimarisi — "Kullanıcı Modeli"

Her kullanıcı için 4 katmanlı hafıza:

```
┌─────────────────────────────────────┐
│  L1: Session Memory (Redis)         │  ← Bu seansın bağlamı (~500 token)
│  L2: Weekly Memory (PostgreSQL)     │  ← Son 4 hafta JSON özeti (~800 token)
│  L3: Long-term Memory (pgvector)    │  ← Semantik arama ile en alakalı geçmiş (~400 token)
│  L4: Body Model (PostgreSQL)        │  ← Statik beden profili (~300 token)
└─────────────────────────────────────┘
```

**Context Assembler** (`packages/shared-ai/context-assembler.ts`):
Her AI çağrısından önce çalışır, 4 katmanı okur, toplam ~2000 token'lık kullanıcı bağlamı üretir. Bu bağlam tüm AI kararlarına (antrenman, beslenme, VAPI system prompt) enjekte edilir.

```typescript
// packages/shared-ai/context-assembler.ts
async function assembleUserContext(userId: string): Promise<UserContext> {
  const [session, weekly, longTerm, body] = await Promise.all([
    redis.get(`session:${userId}`),          // L1
    getWeeklySummary(userId),                // L2
    searchRelevantMemories(userId, query),   // L3 — pgvector similarity search
    getBodyModel(userId),                    // L4
  ]);
  return buildContextString({ session, weekly, longTerm, body }); // ~2000 token
}
```

---

## 3. BEDEN ZEKASI SİSTEMİ ("Body Intelligence Layer")

Bu, V2'nin kalbidir. Her özellik bu katmandan beslenir.

### 3.1 Veri Kaynakları

| Kaynak | Veri | Nasıl Toplanır |
|--------|------|----------------|
| Kan Tahlili | Hemoglobin, demir, D vitamini, B12, tiroit, hormonlar | Manuel upload (PDF parse) veya manuel giriş |
| Uyku | Süre, kalite, REM, deep sleep | Apple Health / Garmin / Fitbit OAuth |
| Sakatlık | Lokasyon, şiddet, aktif/geçmiş, kısıtlamalar | Onboarding + seans içi güncelleme |
| Vücut Ölçüleri | Kilo, boy, bel, kalça, göğüs, boyun | Manuel haftalık giriş |
| Vücut Kompozisyonu | Yağ %, kas kütlesi, BMI, FFMI | Hesaplama (ölçülerden) + wearable |
| Hareket Kalitesi | FMS skoru, dominant taraf, zayıf noktalar | Otomatik (pose analysis'ten) |
| HRV / Kalp Hızı | Dinlenme kalp hızı, HRV | Wearable |
| Günlük Biyometri | Stres, enerji, ağrı, ruh hali | Günlük check-in (30 sn) |
| Beslenme | Makro/mikro geçmişi, eksiklikler | Yemek logu + AI analizi |

### 3.2 "Günlük Beden Skoru" (Daily Readiness Score)

Her sabah sistem otomatik olarak hesaplar. Skor 0-100 arası.

**Girdi Tanımları:**

| Girdi | Kaynak | Nasıl Normalize Edilir |
|-------|--------|----------------------|
| `uyku_kalitesi` (0-1) | Wearable veya manuel giriş | <5 saat=0.2, 5-6=0.5, 6-7=0.7, 7-8=0.9, >8=1.0 |
| `HRV_trend` (0-1) | Wearable HRV; wearable yoksa 0.5 default | Kişisel 30 günlük ortalamaya göre sapma: +%10=1.0, -%10=0.3 |
| `seans_yorgunluğu` (0-1) | Son 48 saatteki CompletedSet.volume toplamı | Kişisel max volume'un %80+ ise=0.2, %40-80=0.6, <%40=1.0 |
| `stres_seviyesi` (0-1) | DailyMetrics.stressLevel (1-10) | (10 - stres) / 10 |
| `beslenme_yeterliliği` (0-1) | Dünün protein gramı / NutritionGoal.proteinTarget | 0-1 arasına clamp |
| `aktif_ağrı` (0-1) | Injury tablosundaki aktif, şiddeti yüksek kayıtlar | 0 injury=1.0, 1 minor=0.8, 1 major=0.5, 2+=0.3 |

```typescript
// packages/shared-utils/readiness-score.ts
function calculateReadinessScore(inputs: ReadinessInputs): number {
  const score =
    inputs.sleepQuality * 0.30 +
    inputs.hrvTrend     * 0.20 +
    inputs.fatigue      * 0.20 +  // (1 - yorgunluk) olarak geçilir
    inputs.stressLevel  * 0.15 +
    inputs.nutrition    * 0.10 +
    inputs.painLevel    * 0.05;
  return Math.round(score * 100); // 0-100
}
```

Wearable bağlı değilse HRV default 0.5, uyku manuel girişe dayalı. Skor 0-100 arası. Kullanıcı uygulamayı açtığında ilk gördüğü bu skor ve kısa gerekçesi ("Dün az uyudun, hafif antrenman öneriliyor").

### 3.3 Injury Shield

- Sakatlık profili → etkilenen kas grupları ve hareketler otomatik haritalanır
- Program üretilirken yasaklı hareketler filtrelenir
- Seans sırasında etkilenen bölgeye aşırı yük tespit edilince sesli + görsel uyarı
- "Alternatif egzersiz öner" butonu anlık devreye girer
- Fizyoterapist notları saklanır ve AI'a aktarılır

### 3.4 Body Twin (Dijital Beden Modeli)

Kullanıcının bedeninin dinamik dijital temsili:

- 3D anatomik model (Three.js) üzerinde renk kodlaması:
  - 🟢 Güçlü / gelişmiş bölgeler
  - 🟡 Orta / çalışılması gereken bölgeler  
  - 🔴 Zayıf / sakatlıklı / riskli bölgeler
- Her seanstan sonra güncellenir
- Kullanıcı herhangi bir kas grubuna tıklayıp geçmiş + öneri görebilir
- Biomechanical Passport olarak PDF export edilebilir

---

## 4. ÖĞRENEN AI SİSTEMİ

### 4.1 Kullanıcı Profil Hafızası

`packages/shared-ai/memory/` altında:

```typescript
interface UserMemory {
  // Statik (nadiren değişir)
  bodyModel: BodyModel;
  injuryProfile: InjuryProfile;
  
  // Dinamik (sık güncellenir)
  recentPerformance: PerformanceSummary;  // Son 4 hafta
  progressionRate: ProgressionRate;       // Her egzersiz için
  preferredCoachingStyle: CoachStyle;     // Öğrenilen tercih
  nutritionPatterns: NutritionPattern;    // Yeme alışkanlıkları
  
  // Uzun dönem (embedding)
  milestones: Milestone[];
  plateauHistory: Plateau[];
  successPatterns: Pattern[];
}
```

### 4.2 Adaptive Program Engine

**Prisma Veri Modeli (Program):**

```prisma
model WorkoutProgram {
  id          String        @id @default(cuid())
  userId      String
  name        String
  status      ProgramStatus @default(ACTIVE)  // ACTIVE | COMPLETED | PAUSED
  mesoCycleWeeks Int        @default(4)       // 4-6 hafta
  currentWeek Int           @default(1)
  deloadWeek  Int?                            // hangi haftada deload
  weeks       ProgramWeek[]
  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt
}

model ProgramWeek {
  id         String      @id @default(cuid())
  programId  String
  weekNumber Int
  volumeLoad Float       // bu haftanın toplam hacim hedefi (set × rep × kg)
  intensity  Float       // 0.6-1.0 arası (ReadinessScore'dan güncellenir)
  days       ProgramDay[]
}

model ProgramDay {
  id           String            @id @default(cuid())
  weekId       String
  dayNumber    Int               // 1-7
  muscleGroups String[]          // hedef kas grupları
  exercises    PlannedExercise[]
}

model PlannedExercise {
  id           String  @id @default(cuid())
  dayId        String
  exerciseId   String  // ExerciseDB'den veya local
  sets         Int
  repsMin      Int
  repsMax      Int
  weightKg     Float?  // null = bodyweight
  rpe          Float?  // Rate of Perceived Exertion 6-10
  restSeconds  Int
  order        Int
  notes        String?
}
```

**Progressive Overload Algoritması:**

```typescript
// packages/shared-utils/progressive-overload.ts
function calculateNextLoad(history: CompletedSet[]): PlannedExercise {
  const lastSets = history.slice(-3); // son 3 seans
  const avgRepsAchieved = mean(lastSets.map(s => s.repsCompleted));
  const avgRPE = mean(lastSets.map(s => s.rpe ?? 7));

  if (avgRepsAchieved >= targetRepsMax && avgRPE <= 7) {
    // Kullanıcı kolayca tamamlıyor → ağırlık artır
    return { ...current, weightKg: current.weightKg * 1.025 }; // %2.5 artış
  } else if (avgRepsAchieved < targetRepsMin) {
    // Kullanıcı tamamlayamıyor → ağırlık azalt
    return { ...current, weightKg: current.weightKg * 0.95 };
  }
  return current; // aynı kal
}
```

**Güncelleme Döngüleri:**
1. **Seans sonrası:** Her `CompletedSet` kaydedilince o egzersizin bir sonraki yükü hesaplanır
2. **Haftalık:** ReadinessScore ortalaması < 55 ise hafta intensitysi 0.85'e düşer
3. **Mezo döngü sonu (4-6 hafta):** GPT-4o ile program varyasyonu üretilir
4. **Plateau tespiti:** Aynı ağırlıkta 3 hafta ilerlemediyse → egzersiz değişimi

### 4.3 Coach Persona Engine

İlk 3 seanste kullanıcının tercih ettiği koçluk stili öğrenilir:

| Stil | Açıklama |
|------|----------|
| Sert / Askeri | Kısa, keskin, baskılayıcı |
| Bilimsel | Açıklayıcı, veri odaklı |
| Nazik / Destekleyici | Teşvik edici, sabırlı |
| Arkadaş Canlısı | Samimi, eğlenceli |

Kullanıcı tepkilerine göre (ses tonu algısı, seans tamamlama oranı) sistem otomatik ayarlar.

### 4.4 Egzersiz Öğrenmesi

- ExerciseDB API entegrasyonu: 1300+ egzersiz
- Her egzersiz için kullanıcıya özgü form profili oluşturulur
- Zaman içinde kullanıcının hangi egzersizlerde iyi/kötü olduğu öğrenilir
- Program üretiminde güçlü olduğu hareketler reward, zayıf olanlar remedial olarak kullanılır

---

## 5. VAPI SESLI KOÇ

### 5.1 Neden VAPI

Mevcut sistem: Whisper → GPT → TTS → ~3-5 sn latency. Egzersiz ortamında kullanılamaz.

VAPI: End-to-end <800ms latency. Gerçek zamanlı, doğal konuşma.

### 5.2 Entegrasyon Mimarisi

```
Kullanıcı konuşur
    ↓
VAPI SDK (browser WebRTC — real-time STT)
    ↓
VAPI Cloud → Custom VAPI Assistant
    ↓ (system prompt = UserContext ~2000 token, her seans başında set edilir)
GPT-4o backend (Anthropic değil OpenAI — VAPI requirement)
    ↓
VAPI Cloud (real-time TTS, nova voice)
    ↓
Kullanıcı duyar (<800ms)
```

**VAPI Entegrasyon Kodu:**

```typescript
// apps/web/lib/vapi/session.ts
import Vapi from '@vapi-ai/web';

export async function startCoachSession(userId: string, sessionId: string) {
  const userContext = await assembleUserContext(userId);  // shared-ai
  const coachPersona = await getUserCoachPersona(userId); // coach_military | coach_scientific | ...

  const vapi = new Vapi(process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY!);

  vapi.start({
    assistantId: VAPI_ASSISTANT_IDS[coachPersona],
    assistantOverrides: {
      // Kullanıcı bağlamı her seans başında system prompt'a enjekte edilir
      model: {
        systemPrompt: buildCoachSystemPrompt(userContext),
      },
    },
  });

  return vapi;
}
```

**Pose-to-Voice Bridge:**

Form analizi tespit ettiği hataları VAPI'ye `say()` ile gerçek zamanlı iletir:

```typescript
// Seans sırasında pose analysis callback'inden
function onFormError(error: FormError, vapi: Vapi) {
  if (error.severity === 'high' && !recentlySpoke) {
    vapi.say(error.coachMessage, false); // false = interrupt current speech
    recentlySpoke = true;
    setTimeout(() => { recentlySpoke = false; }, 4000); // 4 sn cooldown
  }
}
```

### 5.3 Koç Kişilikleri

Her kişilik için Pika VAPI Dashboard'da ayrı assistant oluşturulur:

| Persona ID | Stil | System Prompt Tonu |
|-----------|------|-------------------|
| `coach_military` | Sert, motive edici | "Kısa, keskin, baskılayıcı komutlar. 'Devam et!', 'Bırakma!'" |
| `coach_scientific` | Analitik, açıklayıcı | "Veri odaklı. 'Diz açın 90° altında, quadriceps aktivasyonu için...'" |
| `coach_supportive` | Nazik, destekleyici | "Teşvik edici, sabırlı. 'Harikasın, biraz daha...'" |
| `coach_friendly` | Samimi, arkadaş | "Rahat, eğlenceli. 'Hadi be, neredeyse bitti!'" |

**Öğrenen Stil:** İlk 3 seanste kullanıcı her seans sonunda 1 soru ile geri bildirim verir ("Koçluk tarzı nasıldı?"). 4. seanstan itibaren en yüksek skoru alan persona otomatik seçilir.

---

## 6. YENİ NESIL UI SİSTEMİ

### 6.1 Tasarım Felsefesi

- **Dark-first:** Koyu zemin, neon aksan renkleri (fitness estetiği)
- **Glassmorphism + Neumorphism karışımı:** Derin, katmanlı görünüm
- **Data visualization odaklı:** Her metrik görsel olarak anlamlı
- **Motion-first:** Statik hiçbir şey yok — her eleman hayatta

### 6.2 Renk Sistemi

```css
--bg-primary: #0A0A0F;        /* Derin siyah */
--bg-surface: #12121A;        /* Yüzey */
--bg-elevated: #1A1A26;       /* Elevated card */
--accent-primary: #6366F1;    /* İndigo — primary */
--accent-energy: #F59E0B;     /* Amber — enerji/uyarı */
--accent-success: #10B981;    /* Emerald — başarı */
--accent-danger: #EF4444;     /* Kırmızı — hata/injury */
--accent-recovery: #8B5CF6;   /* Mor — recovery */
--text-primary: #F1F5F9;
--text-secondary: #94A3B8;
```

### 6.3 Animasyon Sistemi

**Arka plan:** Aurora animasyonu — web'de `<canvas>` tabanlı CSS + JS (Three.js ShaderMaterial değil, saf canvas — mobile'da GPU çatışması yok). Mobile'da Reanimated 3 ile gradient animasyonu.
**Kart girişleri:** Framer Motion staggered entrance
**Veri grafikleri:** Recharts + custom animated paths
**Geçişler:** Page transitions with shared layout animations
**Micro-interactions:** Her butonda haptic feedback (mobile) + subtle glow

### 6.4 Ana Ekranlar (Yeniden Tasarlanan)

1. **Home Dashboard** — ReadinessScore büyük ve merkezi, bugünkü plan, hızlı aksiyonlar
2. **Seans Ekranı** — Pose overlay + form score + VAPI koç — karanlık, focus mode
3. **Beden Haritası** — Body Twin 3D interaktif model
4. **İlerleme** — Milestone Cinema, form history, güç eğrileri
5. **Beslenme** — Barkod tarama + AI fotoğraf analizi + eksiklik uyarıları
6. **Keşif** — Yeni egzersizler, challenge'lar, topluluk

### 6.5 Milestone Cinema

Her büyük başarıda (ilk pull-up, 30 gün streak, %10 güç artışı):
- Kişiselleştirilmiş, sinematik kutlama animasyonu
- Kullanıcının ismi + gerçek verileri
- Paylaşılabilir (Instagram Story formatında)

---

## 7. MOBILE APP (EXPO)

### 7.1 Strateji

Expo SDK 52 (React Native) kullanılır. Web ile maksimum business logic paylaşımı:

- **Paylaşılan:** `shared-types`, `shared-ai`, `shared-hooks`, `shared-utils`
- **Platforma özgü:** UI katmanı (NativeWind v4 ile Tailwind sınıfları, ama native `View`/`Text` primitifleri)

**Authentication (Mobile):**
Clerk'in `@clerk/expo` SDK'sı kullanılır. Web ile aynı JWT ekosistemi. Expo SecureStore'da token'lar saklanır. Refresh token rotasyonu Clerk SDK tarafından yönetilir.

**API Paylaşımı:**
Mobile, web ile aynı Next.js API route'larını çağırır (`https://app.fitai.com/api/*`). Ek bir backend servisi gerekmez. `Authorization: Bearer <clerk_token>` header'ı tüm isteklerde kullanılır.

**Pose Detection (Mobile vs Web):**

| | Web | Mobile |
|--|-----|--------|
| Model | MediaPipe Pose Landmarker | TensorFlow Lite MoveNet (Lightning) |
| Çıktı | 33 keypoint (x,y,z + visibility) | 17 keypoint (x,y + confidence) |
| Normalizasyon | `shared-types/PoseResult` — 17 ortak keypoint | aynı tip |
| Form skoru | Aynı `form-analyzer.ts` (shared-utils) | Aynı |

17 ortak keypoint kullanılır, web'deki ekstra 16 keypoint (parmaklar vb.) form analizinde kullanılmaz.

### 7.2 Mobile-Öncelikli Özellikler

- **Kamera pose detection:** TensorFlow Lite (mobil optimize)
- **Haptic feedback:** Seans sırasında form hatalarında titreşim
- **Native health integration:** Apple HealthKit + Google Fit (Expo Health)
- **Offline-first:** Seans verisi offline toplanır, sonra sync edilir
- **Push notifications:** Günlük check-in hatırlatması, streak bildirimleri

### 7.3 Navigation

- **Tab bar:** Ana sekme navigasyonu (Home, Seans, Beden, Beslenme, Profil)
- **Modal:** Seans başlatma, detay ekranları
- **Gesture:** Swipe to dismiss, pull to refresh

---

## 8. ÖZEL ÖZELLİKLER

### 8.1 Sleep-to-Train Bridge

Her sabah:
1. Wearable'dan uyku verisi otomatik çekilir (OAuth)
2. HRV, uyku süresi, deep sleep % analiz edilir
3. ReadinessScore hesaplanır
4. Bugünkü antrenman planı bu skora göre otomatik modifiye edilir
5. Kullanıcıya bildirim: "Bugün 5.2 saat uyudun. Hafif antrenman önerilir."

### 8.2 Recovery Science

Takip edilen recovery modalities:
- Soğuk duş / buz banyosu
- Sauna
- Foam rolling / masaj
- Nefes egzersizleri
- Aktif recovery (hafif yürüyüş)

Korelasyon analizi: "Sauna yaptığın günlerin ertesi form skorun ortalama %11 daha yüksek."

### 8.3 AI Nutrition Vision

- **Fotoğraf:** GPT-4o Vision ile makro tahmini (mevcut, doğruluk iyileştirilecek)
- **Barkod tarama:** Open Food Facts API — ücretsiz, 3M+ ürün, self-hostable cache
- **Kan tahlili bazlı öneriler:** D vitamini düşükse menüde yağlı balık öner; demir düşükse kırmızı et/ıspanak öner
- **Mikro besin takibi:** Demir, D vitamini, magnezyum, B12, Omega-3, Çinko

**Buzdolabı tarama pipeline (Faz 3):**
1. Kullanıcı buzdolabı fotoğrafı çeker
2. GPT-4o Vision → malzeme listesi çıkarır
3. Kullanıcının makro hedefleri + kan tahlili eksiklikleri + bu haftaki antrenman planı bağlama eklenir
4. GPT-4o → 3 günlük yemek planı üretir (mevcut malzemelerden)
5. Eksik malzemeler alışveriş listesi olarak gösterilir

### 8.4 Group Challenge Engine

**Veri Modeli:**
```prisma
model ChallengeGroup {
  id          String   @id @default(cuid())
  weekStart   DateTime
  ageRange    String   // "25-30"
  fitnessLevel FitnessLevel
  goal        FitnessGoal
  avgSessions Float    // o grubun haftalık ortalama seans sayısı
  memberCount Int      // kaç kişi bu grupta (referans büyüklüğü için)
  updatedAt   DateTime @updatedAt
}
```

- **Anonim:** Gerçek isim, profil fotoğrafı yok
- **Eşleştirme:** Yaş aralığı (±5 yıl) + fitness seviyesi + birincil hedef
- **Haftalık cron job** her Pazartesi grup ortalamalarını hesaplar
- **Kullanıcıya gösterim:** "Senin gibi 28-33 yaş, kas kazanımı hedefli kullanıcılar bu hafta ortalama 3.8 seans yaptı. Sen: 3 seans."
- **Rekabet değil, referans:** Sıralama yok, sadece grup ortalaması ile kıyaslama

### 8.5 Biomechanical Passport

- Kullanıcının hareket profili (dominant taraf, güçlü/zayıf eklemler, tipik form hataları)
- QR kodlu PDF — fizyoterapiste gösterilebilir
- Her 4 haftada bir otomatik güncellenir

---

## 9. PRATIKA TARZI YOLCULUK AKIŞı

### 9.1 Onboarding (İlk 10 Dakika)

```
Adım 1: Temel bilgiler (2 dk)
  → Yaş, cinsiyet, boy, kilo, hedef

Adım 2: Beden analizi (3 dk)
  → Fotoğraf çek (opsiyonel) → AI vücut kompozisyonu tahmini
  → Vücut ölçüleri gir

Adım 3: Sağlık profili (3 dk)
  → Sakatlıklar, hastalıklar, ilaçlar
  → Kan tahlili upload (opsiyonel PDF)

Adım 4: Fitness değerlendirmesi (2 dk)
  → 5 temel hareket testi (squat, push-up, plank, lunge, row)
  → AI movement quality skoru → başlangıç seviyesi belirlenir

Adım 5: Hedef & taahhüt
  → Haftalık seans sayısı seç
  → VAPI koçuyla ilk konuşma → koçluk stili belirlenir
```

### 9.2 Seans Akışı (Her Seans)

```
1. Giriş (30 sn)
   → ReadinessScore göster
   → "Bugün [X] antrenman öneriyor, devam?" veya otomatik modifiye

2. Isınma (5 dk)
   → AI seçtiği dinamik ısınma (günün antrenmanına göre)
   → VAPI koç rehberlik eder

3. Ana Antrenman
   → Egzersiz → pose detection → form skorlama → VAPI feedback
   → Set tamamlandıkça hafıza güncellenir

4. Soğuma (3 dk)
   → Kullanılan kas gruplarına özel stretching

5. Seans Sonu (1 dk)
   → Özet: kalori, form skoru, kişisel rekor?
   → Recovery önerisi
   → Milestone tetiklenirse → Milestone Cinema
```

### 9.3 Haftalık Yolculuk

- Pazartesi: Haftalık plan özeti, geçen haftanın analizi
- Her gün: Sabah ReadinessScore bildirimi
- Cuma: Haftalık ilerleme raporu (AI analizi + önümüzdeki hafta planı)

---

## 10. FAZ PLANI

### Faz 1 — Temel Yeniden Yapı (6-8 hafta)
**Hedef:** Çalışan, güzel, sesli koçlu bir MVP

**Hafta 1-2: Altyapı & Veri Modeli**
- [ ] Prisma şeması güncelle (yeni Program modeli, pgvector extension)
- [ ] `shared-utils` paketi kur (ReadinessScore, ProgressiveOverload, FormAnalyzer)
- [ ] `shared-ai` paketi kur (ContextAssembler, prompt builders)
- [ ] ExerciseDB API entegrasyonu + local cache (Prisma Exercise tablosu doldur)
- [ ] ML model bug fix (`train-models.ts` import düzelt, training pipeline)
- [ ] ENV secrets güvenliği (.env.local → .gitignore kontrolü)

**Hafta 2-3: VAPI + Sesli Koç**
- [ ] VAPI SDK entegrasyonu (`@vapi-ai/web`)
- [ ] 4 koç personası için VAPI assistant'ları oluştur
- [ ] `startCoachSession` / `endCoachSession` implementasyonu
- [ ] Pose-to-Voice Bridge (`vapi.say()` ile form hata bildirimi)
- [ ] Web Speech API fallback (ücretsiz tier)

**Hafta 3-4: Beden Zekası Temeli**
- [ ] Body Model Prisma şeması + API route'ları
- [ ] Injury Shield: sakatlık → kas grubu haritalama + program filtresi
- [ ] ReadinessScore hesaplama motoru + sabah bildirimi
- [ ] Günlük check-in akışı (30 sn)

**Hafta 4-5: Onboarding Yeniden Yazımı**
- [ ] 5 adımlı Praktika stili onboarding UI
- [ ] Fitness değerlendirme seansı (5 temel hareket testi)
- [ ] VAPI ile ilk koç konuşması (onboarding adım 5)
- [ ] Koçluk stili ilk belirleme anketi

**Hafta 5-6: Adaptive Program Engine**
- [ ] Program üretimi (GPT-4o + yeni Prisma modeli)
- [ ] ProgressiveOverload algoritması implementasyonu
- [ ] Seans sonrası otomatik yük güncelleme

**Hafta 6-8: UI Yeniden Tasarımı**
- [ ] Tasarım token sistemi (renk, tipografi, spacing)
- [ ] Aurora canvas arka plan animasyonu
- [ ] Home Dashboard (ReadinessScore merkezi)
- [ ] Seans Ekranı (pose overlay + VAPI + form score)
- [ ] Beslenme sayfası (barkod + fotoğraf)
- [ ] Profil & Ayarlar

---

### Faz 2 — Zeka Katmanı (6-8 hafta)
**Hedef:** Gerçekten öğrenen, kişiselleşen sistem

**Hafta 1-2: Uzun Dönem Hafıza**
- [ ] Supabase pgvector extension aktifleştir
- [ ] `UserMemoryEmbedding` Prisma modeli
- [ ] Hafıza yazma pipeline (her seans sonunda özet → embedding)
- [ ] `searchRelevantMemories()` similarity search

**Hafta 2-3: Wearable OAuth (Sleep-to-Train Bridge)**
- [ ] Apple HealthKit web entegrasyonu (Health Connect API)
- [ ] Garmin Connect OAuth
- [ ] Fitbit OAuth
- [ ] Sabah otomatik uyku verisi çekme + ReadinessScore güncelleme

**Hafta 3-4: Coach Persona Engine**
- [ ] Seans sonrası koçluk stili geri bildirimi
- [ ] 3 seans sonrası otomatik persona seçimi
- [ ] Persona öğrenme skoru hesaplama

**Hafta 4-5: Injury Shield Tamamlama**
- [ ] Seans içi gerçek zamanlı bölge yükü hesaplama
- [ ] Tehlike eşiği aşılınca sesli + görsel uyarı
- [ ] Alternatif egzersiz önerme motoru

**Hafta 5-6: Body Twin 3D**
- [ ] Three.js anatomik model (web)
- [ ] Kas grubu → renk haritalama
- [ ] Tıklanabilir kas grubu → geçmiş + öneri

**Hafta 6-7: Recovery Science**
- [ ] Recovery modality logu
- [ ] Korelasyon analizi (recovery → form skoru)
- [ ] Recovery önerileri

**Hafta 7-8: Periyodizasyon + Kan Tahlili**
- [ ] Mezo döngü (4-6 hafta) + deload otomasyonu
- [ ] Plateau tespiti algoritması
- [ ] Kan tahlili PDF parse (GPT-4o Vision)
- [ ] Mikro besin takibi + eksiklik uyarıları

---

### Faz 3 — Mobile + Global (6-8 hafta)
**Hedef:** iOS + Android + viral özellikler

**Hafta 1-2: Expo Temeli**
- [ ] `apps/mobile` — Expo SDK 52 kurulumu
- [ ] Clerk Expo SDK — authentication
- [ ] NativeWind v4 — styling
- [ ] Navigation (Expo Router)
- [ ] Shared packages entegrasyonu

**Hafta 2-4: Core Mobile Features**
- [ ] TF Lite MoveNet pose detection (kamera)
- [ ] VAPI mobile entegrasyonu
- [ ] Haptic feedback (form hatalarında)
- [ ] Apple HealthKit + Google Fit native entegrasyonu
- [ ] Push notifications (Expo Notifications)

**Hafta 4-5: Offline-First**
- [ ] WatermelonDB — local session storage
- [ ] Sync queue (offline seans → online sync)
- [ ] Conflict resolution (idempotency key ile)

**Hafta 5-6: Viral Özellikler**
- [ ] Milestone Cinema (Remotion ile video render)
- [ ] Instagram Story formatında paylaşım
- [ ] Biomechanical Passport PDF export

**Hafta 6-7: AI Nutrition Vision Tamamlama**
- [ ] Buzdolabı tarama pipeline
- [ ] Barkod tarama (Open Food Facts)
- [ ] Alışveriş listesi üretimi

**Hafta 7-8: Store Yayını**
- [ ] App Store Connect hazırlığı
- [ ] HealthKit entegrasyonu için Apple review belgesi
- [ ] Play Store hazırlığı
- [ ] Beta test (TestFlight + Google Play Beta)

---

## 11. TEKNİK BORÇ (Faz 1'de Çözülecek)

| Sorun | Dosya | Çözüm | Faz |
|-------|-------|-------|-----|
| ML models hiç eğitilmemiş | `lib/ml/train-models.ts` | Training pipeline + cron job | 1 |
| `train-models.ts` import bug | `lib/ml/train-models.ts:L3` | `db` → `prisma` (1 satır fix) | 1 |
| Form analyzer 5 egzersizle sınırlı | `lib/ai/form-analyzer.ts` | ExerciseDB entegrasyonu | 1 |
| Hareket hızı hardcoded `'optimal'` | `lib/ai/form-analyzer.ts:163` | Frame history buffer (son 5 frame) | 1 |
| Consistency her zaman 0.5 | `lib/ai/form-analyzer.ts:262` | Gerçek seans form skorları karşılaştırma | 1 |
| Wearable OAuth yok | `app/api/user/sync/` | Apple Health Connect + Garmin + Fitbit | 2 |
| Voice chat stub | `hooks/useVoiceChat.ts` | VAPI ile komple yeniden yaz | 1 |
| ENV secrets .env.local'de committed | `.env.local` | .gitignore'a ekle, secret'ları rotate et | 1 (acil) |
| ExerciseDB sayı tutarsızlığı | Spec | 1300+ olarak standardize edildi | — |

---

## 12. BAŞARI KRİTERLERİ

### Faz 1 Bitti mi?
- [ ] Kullanıcı kayıt olup 10 dakikada ilk seansını tamamlayabiliyor
- [ ] VAPI koç seans sırasında gerçek zamanlı konuşuyor (<1 sn latency)
- [ ] ReadinessScore her sabah doğru hesaplanıyor
- [ ] Injury Shield aktif sakatlıkta uyarı veriyor
- [ ] UI test kullanıcısı "bu profesyonel görünüyor" diyor

### Faz 2 Bitti mi?
- [ ] 10 seans sonra program kullanıcının gerçek performansına göre değişmiş
- [ ] Wearable verisi günlük otomatik senkronize oluyor
- [ ] Body Twin kullanıcının gerçek zayıf noktalarını gösteriyor

### Faz 3 Bitti mi?
- [ ] App Store + Play Store'da yayında
- [ ] Milestone Cinema video paylaşılabilir
- [ ] Offline seans tamamlanıp sonra sync edilebiliyor

---

## 13. RİSKLER & AZALTMA

| Risk | Olasılık | Etki | Azaltma |
|------|----------|------|---------|
| VAPI maliyeti yüksek olabilir | Orta | Orta | Free tier = Web Speech fallback; Basic+ tier = VAPI dakika limiti (30dk/ay); Pro = sınırsız |
| Apple App Store HealthKit review | Yüksek | Yüksek | Expo Health kullan (HealthKit wrapper); Faz 3 başında Apple Developer dokümanını hazırla; "medical device" sınıfından kaçın |
| ML model training yetersiz data | Orta | Düşük | Cold-start: kural tabanlı ReadinessScore; 30+ seans sonrası ML devreye girer |
| Expo + TF Lite + VAPI aynı anda GPU/CPU baskısı | Yüksek | Yüksek | Seans sırasında aurora animasyonu durdur; TF Lite Lightning modeli (hafif); VAPI sadece ses (WebRTC) |
| pgvector Supabase | Düşük | Düşük | Supabase pgvector extension mevcut; migration ile aktifleştirilir |
| ExerciseDB API kesintisi | Orta | Orta | İlk kurulumda tüm egzersiz veritabanını Prisma'ya import et (snapshot); ExerciseDB sadece yeni egzersizler için polling |
| GDPR / KVKK — sağlık verisi | Yüksek | Çok Yüksek | Kan tahlili, uyku, HRV = GDPR Madde 9 özel kategori veri; Çözüm: açık rıza formu onboarding'de; at-rest encryption (Supabase column encryption); data retention policy (2 yıl); silme hakkı (account delete → tüm verileri sil) |
| Kan tahlili PDF güvenliği | Orta | Yüksek | PDF'leri doğrudan sunucuya almak yerine Vercel Blob'a yükle; GPT-4o Vision ile parse et; orijinal PDF'i 24 saat sonra sil; malicious PDF için mime-type + boyut kontrolü |
| Aurora canvas + pose detection aynı anda | Orta | Orta | Seans ekranında aurora tamamen kapalı; sadece dashboard ve profil ekranlarında aktif |
