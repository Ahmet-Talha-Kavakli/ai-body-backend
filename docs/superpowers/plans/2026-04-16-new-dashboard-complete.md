# New Dashboard — Complete Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Sıfırdan yeni nesil, mobil öncelikli, AI destekli, 3D kedi arkadaşlı, gamification içeren bir sağlık & fitness dashboard'u inşa etmek.

**Architecture:** Mevcut Next.js/Prisma/PostgreSQL stack üzerinde, yeni bir navigasyon sistemi (floating bottom bar), yeni sayfalar ve modüller eklenerek geliştirilecek. Her büyük bölüm kendi route'una ve component klasörüne sahip olacak. AI seansları OpenAI üzerinden persona bazlı prompt sistemiyle çalışacak. 3D kedi Three.js ile oluşturulacak.

**Tech Stack:** Next.js 14, TypeScript, Prisma, PostgreSQL, OpenAI API, VAPI (ses), Three.js, Framer Motion, Tailwind CSS, Clerk (auth), Thiings.co ikonları

---

## Chunk 1: Tasarım Sistemi & Navigasyon

### Task 1: Yeni Renk Paleti & Design Tokens

**Files:**

- Modify: `apps/web/app/globals.css`
- Create: `apps/web/lib/design-tokens.ts`

- [ ] **Step 1:** `globals.css` içine yeni CSS değişkenlerini ekle — dark/light tema, accent renkler, gradient tanımları
- [ ] **Step 2:** `design-tokens.ts` dosyası oluştur — renk sabitleri, spacing, border-radius, shadow tanımları
- [ ] **Step 3:** Commit: `feat(design): add new design system tokens`

---

### Task 2: Floating Bottom Navigation Bar

**Files:**

- Create: `apps/web/components/navigation/BottomNav.tsx`
- Create: `apps/web/components/navigation/BottomNavItem.tsx`
- Modify: `apps/web/components/dashboard/shared/layout.tsx`
- Modify: `apps/web/app/(dashboard)/layout.tsx`

- [ ] **Step 1:** `BottomNav.tsx` oluştur — 5 sekme: Ev, Yol Haritası, Seans (büyük orta buton), Takip, Kedi
- [ ] **Step 2:** Floating stil: `fixed bottom-4 left-1/2 -translate-x-1/2`, blur backdrop, rounded-2xl, shadow
- [ ] **Step 3:** Aktif sekme animasyonu — Framer Motion ile yumuşak geçiş, aktif ikon büyür
- [ ] **Step 4:** Orta Seans butonu — gradient, glow efekti, diğerlerinden büyük
- [ ] **Step 5:** `layout.tsx` güncelle — sidebar kaldır, BottomNav ekle, main padding-bottom ayarla
- [ ] **Step 6:** Masaüstünde sidebar korunacak, mobilde bottom nav görünecek (responsive)
- [ ] **Step 7:** Commit: `feat(nav): floating bottom navigation bar`

---

### Task 3: Yeni Dashboard Shell

**Files:**

- Modify: `apps/web/components/dashboard/shared/layout.tsx`
- Create: `apps/web/components/dashboard/shared/MobileHeader.tsx`

- [ ] **Step 1:** Mobil header oluştur — profil avatarı (sol), uygulama logosu (orta), bildirim ikonu (sağ)
- [ ] **Step 2:** Layout'u güncelle — mobilde sidebar gizle, MobileHeader + BottomNav göster
- [ ] **Step 3:** Commit: `feat(layout): new mobile-first dashboard shell`

---

## Chunk 2: Ev Sayfası (Ana Dashboard)

### Task 4: AI Karşılama Bölümü

**Files:**

- Create: `apps/web/components/home/AIGreeting.tsx`
- Create: `apps/web/app/api/home/greeting/route.ts`

- [ ] **Step 1:** API route — kullanıcı verilerini (uyku, su, aktivite) alıp OpenAI'ya gönder, kişisel karşılama mesajı üret
- [ ] **Step 2:** `AIGreeting.tsx` — animasyonlu mesaj balonu, AI avatarı, günün özeti
- [ ] **Step 3:** Typewriter animasyonu ile mesaj göster
- [ ] **Step 4:** Commit: `feat(home): AI personalized greeting`

---

### Task 5: Kedi Widget (Ana Sayfa Önizleme)

**Files:**

- Create: `apps/web/components/home/CatWidget.tsx`
- Create: `apps/web/components/home/CatMood.tsx`

- [ ] **Step 1:** `CatWidget.tsx` — ana sayfada küçük 3D/animasyonlu kedi önizlemesi
- [ ] **Step 2:** Kedinin ruh hali veriye göre değişsin — mutlu (iyi uyku + aktif), üzgün (az su + hareketsiz), enerjik (antrenman günü)
- [ ] **Step 3:** Tıklayınca `/dashboard/pet` sayfasına gitsin
- [ ] **Step 4:** Commit: `feat(home): cat widget with mood system`

---

### Task 6: Günlük Özet Kartları

**Files:**

- Modify: `apps/web/app/(dashboard)/dashboard/page.tsx`
- Create: `apps/web/components/home/DailySummaryCards.tsx`
- Create: `apps/web/components/home/RoadmapPreview.tsx`

- [ ] **Step 1:** `DailySummaryCards.tsx` — Su, Kalori, Uyku, Adım kartları, Thiings.co ikonları ile
- [ ] **Step 2:** Kartlar horizontal scroll (mobil) veya 2x2 grid
- [ ] **Step 3:** `RoadmapPreview.tsx` — bu haftanın yol haritası özeti, progress bar
- [ ] **Step 4:** `page.tsx` yeniden yaz — AI karşılama → Kedi → Özet kartlar → Yol haritası özeti
- [ ] **Step 5:** Commit: `feat(home): new home page layout`

---

## Chunk 3: Onboarding Sistemi

### Task 7: Onboarding Flow & Prisma Schema

**Files:**

- Modify: `packages/db/prisma/schema.prisma`
- Create: `apps/web/app/(auth)/onboarding/steps/` (klasör)
- Create: `apps/web/app/(auth)/onboarding/OnboardingFlow.tsx`
- Create: `apps/web/app/api/onboarding/complete/route.ts`

- [ ] **Step 1:** Prisma schema'ya `OnboardingData` modeli ekle — hedef, sağlık durumu, aktivite seviyesi, beslenme tercihi, boy, kilo vb.
- [ ] **Step 2:** Migration çalıştır: `pnpm prisma migrate dev --name add-onboarding`
- [ ] **Step 3:** 10 onboarding adımı için ayrı step componentleri oluştur:
  - `Step1Welcome.tsx` — Karşılama animasyonu
  - `Step2Goal.tsx` — Hedef seçimi (kilo ver, kas yap, sağlıklı yaşa, hastalık yönetimi)
  - `Step3Personal.tsx` — Ad, yaş, cinsiyet
  - `Step4Body.tsx` — Boy, kilo
  - `Step5Activity.tsx` — Aktivite seviyesi
  - `Step6Health.tsx` — Sağlık sorunları, ilaçlar, sakatlıklar
  - `Step7Diet.tsx` — Beslenme tercihleri
  - `Step8Sleep.tsx` — Uyku alışkanlıkları
  - `Step9Pet.tsx` — Kedi adı seç (kedi sahiplenme)
  - `Step10Ready.tsx` — Hazır! Yol haritası oluşturuluyor animasyonu
- [ ] **Step 4:** `OnboardingFlow.tsx` — swipe geçişli animasyonlu stepper, progress bar
- [ ] **Step 5:** API route — onboarding verilerini kaydet, AI ile başlangıç yol haritası oluştur
- [ ] **Step 6:** Commit: `feat(onboarding): animated 10-step onboarding flow`

---

## Chunk 4: Seans Bölümü (6 AI Persona)

### Task 8: Seans Rotaları & Persona Sistemi

**Files:**

- Create: `apps/web/app/(dashboard)/dashboard/sessions/page.tsx`
- Create: `apps/web/app/(dashboard)/dashboard/sessions/[type]/page.tsx`
- Create: `apps/web/lib/sessions/personas.ts`
- Create: `apps/web/lib/sessions/prompts.ts`

- [ ] **Step 1:** `personas.ts` — 6 persona tanımla:
  ```ts
  export const PERSONAS = {
    fitness: { name: 'Alex', role: 'AI Fitness Antrenörü', personality: 'motive edici, sert ama destekleyici', ... },
    dietitian: { name: 'Dr. Ayşe', role: 'AI Diyetisyen', personality: 'bilimsel, beslenme odaklı', ... },
    health: { name: 'Dr. Can', role: 'AI Sağlık Koçu', personality: 'bütünsel sağlık, dinleyici', ... },
    motivation: { name: 'Max', role: 'Motivasyon Koçu', personality: 'enerjik, ilham verici', ... },
    pt: { name: 'Coach Mert', role: 'Personal Trainer', personality: 'teknik, egzersiz formu odaklı', ... },
    general: { name: 'Aria', role: 'Genel Asistan', personality: 'her şeye hakim, çok yönlü', ... },
  }
  ```
- [ ] **Step 2:** `prompts.ts` — her persona için sistem promptu yaz, kullanıcı verilerini (uyku, beslenme, antrenman geçmişi) prompta enjekte et
- [ ] **Step 3:** Seans listesi sayfası — 6 kart, her kart persona avatarı + açıklama + "Seansı Başlat" butonu
- [ ] **Step 4:** Commit: `feat(sessions): 6 AI persona system`

---

### Task 9: Sesli Seans Deneyimi (VAPI + 3D Karakter)

**Files:**

- Create: `apps/web/app/(dashboard)/dashboard/sessions/[type]/SessionRoom.tsx`
- Create: `apps/web/components/session/VoiceSession.tsx`
- Create: `apps/web/components/session/PersonaAvatar3D.tsx`
- Modify: `apps/web/app/api/ai/chat/route.ts`

- [ ] **Step 1:** `VoiceSession.tsx` — VAPI entegrasyonu, mikrofon kontrolü, ses dalgası animasyonu
- [ ] **Step 2:** `PersonaAvatar3D.tsx` — Three.js ile her persona için farklı renk/stil 3D avatar, konuşurken animasyon
- [ ] **Step 3:** Seans odası UI — tam ekran, koyu arka plan, ortada 3D avatar, altta ses kontrolleri
- [ ] **Step 4:** VAPI assistant ID'lerini her persona için ayarla
- [ ] **Step 5:** Seans bitince özet kaydet (Prisma), AI memory'e aktar
- [ ] **Step 6:** Commit: `feat(sessions): voice session room with 3D persona`

---

## Chunk 5: Dinamik Yol Haritası

### Task 10: Yol Haritası Prisma Schema & API

**Files:**

- Modify: `packages/db/prisma/schema.prisma`
- Create: `apps/web/app/api/roadmap/route.ts`
- Create: `apps/web/app/api/roadmap/week/[weekId]/route.ts`
- Create: `apps/web/lib/roadmap/generator.ts`

- [ ] **Step 1:** Prisma'ya `Roadmap`, `RoadmapWeek`, `RoadmapTask` modelleri ekle
  ```prisma
  model Roadmap {
    id        String   @id @default(cuid())
    userId    String   @unique
    type      String   // fitness | diet | health
    weeks     RoadmapWeek[]
    createdAt DateTime @default(now())
  }
  model RoadmapWeek {
    id         String   @id @default(cuid())
    roadmapId  String
    weekNumber Int
    title      String
    tasks      RoadmapTask[]
    isComplete Boolean  @default(false)
    roadmap    Roadmap  @relation(fields: [roadmapId], references: [id])
  }
  model RoadmapTask {
    id        String  @id @default(cuid())
    weekId    String
    title     String
    isDone    Boolean @default(false)
    week      RoadmapWeek @relation(fields: [weekId], references: [id])
  }
  ```
- [ ] **Step 2:** Migration çalıştır
- [ ] **Step 3:** `generator.ts` — OpenAI ile kullanıcı profiline göre 12 haftalık yol haritası üret
- [ ] **Step 4:** API route — GET (mevcut yol haritası), POST (yeni oluştur), PATCH (hafta tamamla)
- [ ] **Step 5:** Commit: `feat(roadmap): roadmap schema and API`

---

### Task 11: Yol Haritası UI (Harita Teması + Haftalık Kart)

**Files:**

- Create: `apps/web/app/(dashboard)/dashboard/roadmap/page.tsx`
- Create: `apps/web/components/roadmap/RoadmapJourney.tsx`
- Create: `apps/web/components/roadmap/WeekCard.tsx`
- Create: `apps/web/components/roadmap/PathLine.tsx`

- [ ] **Step 1:** `RoadmapJourney.tsx` — yatay/dikey scroll'lu yolculuk haritası, haftalar nokta/istasyon olarak görünür
- [ ] **Step 2:** Tamamlanan haftalar yeşil, aktif hafta parlıyor (glow animasyonu), gelecek haftalar kilitli
- [ ] **Step 3:** `WeekCard.tsx` — tıklanınca açılan kart, o haftanın görevleri, tamamlanma yüzdesi
- [ ] **Step 4:** Kedi bu haritada kullanıcının yanında yürüsün (küçük kedi ikonu ilerler)
- [ ] **Step 5:** 3 yol haritası tipi — Fitness, Diyet, Sağlık — tab ile geçiş
- [ ] **Step 6:** Commit: `feat(roadmap): journey map UI with week cards`

---

## Chunk 6: Takip Modülleri

### Task 12: Su & Kahve Takibi (Geliştirme + Yeni)

**Files:**

- Modify: `apps/web/app/(dashboard)/dashboard/water/page.tsx`
- Create: `apps/web/components/tracking/water/CoffeeTracker.tsx`
- Modify: `packages/db/prisma/schema.prisma`
- Create: `apps/web/app/api/tracking/water/route.ts`

- [ ] **Step 1:** Schema'ya `DrinkLog` modeli ekle — type (water | coffee | tea | juice), amount, timestamp
- [ ] **Step 2:** Su takibi UI'ı yenile — animasyonlu su dalgası, günlük hedef progress
- [ ] **Step 3:** `CoffeeTracker.tsx` — günlük kahve sayısı, mg kafein takibi, limit uyarısı
- [ ] **Step 4:** İçecek geçmişi grafiği — günlük/haftalık
- [ ] **Step 5:** Commit: `feat(tracking): water & coffee tracker`

---

### Task 13: Yemek Takibi (Sıfırdan)

**Files:**

- Modify: `apps/web/app/(dashboard)/dashboard/nutrition/` (tüm klasör)
- Create: `apps/web/app/api/tracking/food/photo/route.ts`
- Create: `apps/web/app/api/tracking/food/barcode/route.ts`
- Create: `apps/web/components/tracking/food/PhotoAnalyzer.tsx`
- Create: `apps/web/components/tracking/food/BarcodeScanner.tsx`
- Create: `apps/web/components/tracking/food/ManualEntry.tsx`
- Create: `apps/web/components/tracking/food/NutritionSummary.tsx`

- [ ] **Step 1:** Fotoğraf analiz API — OpenAI Vision ile yemek tanıma, kalori/makro/mikro tahmini
- [ ] **Step 2:** Barkod API — Open Food Facts veya Edamam API entegrasyonu
- [ ] **Step 3:** Manuel giriş — arama + porsiyon seçimi
- [ ] **Step 4:** Yemek özeti — kalori, protein, karbo, yağ, vitaminler, mineraller
- [ ] **Step 5:** Öğün zaman çizelgesi — sabah, öğle, akşam, atıştırmalık
- [ ] **Step 6:** Haftalık trend grafikleri
- [ ] **Step 7:** Commit: `feat(tracking): advanced food tracker with photo/barcode`

---

### Task 14: Supplement & Vitamin Takibi (Sıfırdan)

**Files:**

- Create: `apps/web/app/(dashboard)/dashboard/supplements/page.tsx`
- Create: `apps/web/components/tracking/supplements/SupplementCard.tsx`
- Create: `apps/web/components/tracking/supplements/AddSupplementModal.tsx`
- Create: `apps/web/app/api/tracking/supplements/route.ts`
- Modify: `packages/db/prisma/schema.prisma`

- [ ] **Step 1:** Schema'ya `Supplement` ve `SupplementLog` modelleri ekle
- [ ] **Step 2:** Supplement ekleme — ad, doz, birim (mg/mcg/IU), zamanlama (sabah/akşam/yemekle)
- [ ] **Step 3:** Günlük alındı/alınmadı takibi, streak sistemi
- [ ] **Step 4:** Popüler supplement kütüphanesi (kreatin, protein tozu, vitamin D, omega-3 vb.)
- [ ] **Step 5:** Commit: `feat(tracking): supplement & vitamin tracker`

---

### Task 15: İlaç Takibi (Sıfırdan)

**Files:**

- Create: `apps/web/app/(dashboard)/dashboard/medications/page.tsx`
- Create: `apps/web/components/tracking/medications/MedicationCard.tsx`
- Create: `apps/web/components/tracking/medications/AddMedicationModal.tsx`
- Create: `apps/web/app/api/tracking/medications/route.ts`
- Modify: `packages/db/prisma/schema.prisma`

- [ ] **Step 1:** Schema'ya `Medication` ve `MedicationLog` modelleri ekle
- [ ] **Step 2:** İlaç ekleme — ad, doz, sıklık (günde 1/2/3), saat hatırlatıcısı
- [ ] **Step 3:** Al/almadım toggle, geçmiş kayıt
- [ ] **Step 4:** Hatırlatma bildirimi API endpoint'i
- [ ] **Step 5:** Commit: `feat(tracking): medication tracker with reminders`

---

### Task 16: Uyku Takibi (Sıfırdan)

**Files:**

- Create: `apps/web/app/(dashboard)/dashboard/sleep/page.tsx`
- Create: `apps/web/components/tracking/sleep/SleepChart.tsx`
- Create: `apps/web/components/tracking/sleep/SleepStageBreakdown.tsx`
- Create: `apps/web/components/tracking/sleep/SleepInsights.tsx`
- Create: `apps/web/app/api/tracking/sleep/route.ts`
- Modify: `packages/db/prisma/schema.prisma`

- [ ] **Step 1:** Schema'ya `SleepLog` modeli ekle — bedtime, wakeTime, duration, quality, deepSleep, remSleep, lightSleep, sleepScore
- [ ] **Step 2:** Manuel giriş — yatış/kalkış saati seçimi, kalite değerlendirmesi
- [ ] **Step 3:** Akıllı saat entegrasyonundan otomatik veri (Chunk 7'de)
- [ ] **Step 4:** `SleepChart.tsx` — haftalık uyku süresi bar chart
- [ ] **Step 5:** `SleepStageBreakdown.tsx` — derin, REM, hafif uyku yüzdeleri
- [ ] **Step 6:** `SleepInsights.tsx` — AI destekli içgörüler: "En iyi uyku saat 22:30-06:30 arası"
- [ ] **Step 7:** Commit: `feat(tracking): comprehensive sleep tracker`

---

## Chunk 7: Sağlık & Akıllı Saat Entegrasyonları

### Task 17: Çoklu Wearable Entegrasyonu

**Files:**

- Create: `apps/web/app/api/health/fitbit/route.ts` (mevcut geliştir)
- Create: `apps/web/app/api/health/apple-health/route.ts`
- Create: `apps/web/app/api/health/google-fit/route.ts`
- Create: `apps/web/app/api/health/garmin/route.ts`
- Create: `apps/web/lib/health/normalizer.ts`
- Create: `apps/web/app/(dashboard)/dashboard/health-devices/page.tsx`

- [ ] **Step 1:** `normalizer.ts` — farklı kaynaklardan gelen veriyi ortak formata dönüştür (adım, kalp atışı, uyku, kalori, SpO2, stres)
- [ ] **Step 2:** Apple Health — HealthKit web API veya iOS shortcut ile veri aktarımı
- [ ] **Step 3:** Google Fit — OAuth 2.0 + Fitness REST API
- [ ] **Step 4:** Garmin — Garmin Connect IQ API
- [ ] **Step 5:** Cihazlar sayfası — bağlı cihazları göster, bağla/bağlantıyı kes
- [ ] **Step 6:** Tüm metrikler — adım, kalp atışı, uyku, kalori, SpO2, stres skoru
- [ ] **Step 7:** Commit: `feat(health): multi-wearable integrations`

---

### Task 18: Sağlık Dashboard Sayfası

**Files:**

- Modify: `apps/web/app/(dashboard)/dashboard/health/page.tsx`
- Create: `apps/web/components/health/HealthMetricCard.tsx`
- Create: `apps/web/components/health/HeartRateChart.tsx`
- Create: `apps/web/components/health/StressChart.tsx`

- [ ] **Step 1:** Sağlık sayfasını yenile — tüm metrikler tek sayfada, sekme tabanlı
- [ ] **Step 2:** Gerçek zamanlı kalp atışı grafiği (wearable bağlıysa)
- [ ] **Step 3:** SpO2, stres skoru kartları
- [ ] **Step 4:** Haftalık/aylık trend görünümü
- [ ] **Step 5:** Commit: `feat(health): health metrics dashboard`

---

## Chunk 8: 3D Kedi Sistemi

### Task 19: Kedi Prisma Schema & State Sistemi

**Files:**

- Modify: `packages/db/prisma/schema.prisma`
- Create: `apps/web/lib/pet/catState.ts`
- Create: `apps/web/lib/pet/catMood.ts`
- Create: `apps/web/app/api/pet/route.ts`
- Create: `apps/web/app/api/pet/interact/route.ts`

- [ ] **Step 1:** Schema'ya `Pet` modeli ekle:
  ```prisma
  model Pet {
    id          String   @id @default(cuid())
    userId      String   @unique
    name        String
    level       Int      @default(1)
    xp          Int      @default(0)
    mood        String   @default("happy")  // happy | sad | energetic | tired | sick | angry
    weight      Float?   // kullanıcının kilosunu yansıtır
    hasInjury   Boolean  @default(false)
    injuredPart String?  // left_leg | right_arm vb.
    outfit      String?  // kostüm ID
    accessories String[] // aksesuar ID listesi
    coins       Int      @default(0)
    createdAt   DateTime @default(now())
    updatedAt   DateTime @updatedAt
  }
  ```
- [ ] **Step 2:** Migration çalıştır
- [ ] **Step 3:** `catMood.ts` — kullanıcı verilerine göre kedi ruh hali hesapla:
  - Uyku < 6 saat → tired
  - 7+ gün giriş yok → angry
  - Su hedefi tuttu + antrenman yaptı → energetic
  - Hastalık/sakatlık var → sick/hasInjury=true
  - Kilo değişimi → kedinin kilosu güncelle
- [ ] **Step 4:** API route — kedi durumu getir, güncelle, etkileşim kaydet
- [ ] **Step 5:** Commit: `feat(pet): cat state and mood system`

---

### Task 20: 3D Kedi Render & Animasyonlar

**Files:**

- Create: `apps/web/components/pet/Cat3D.tsx`
- Create: `apps/web/components/pet/CatAnimations.ts`
- Create: `apps/web/components/pet/CatScene.tsx`
- Create: `apps/web/app/(dashboard)/dashboard/pet/page.tsx`

- [ ] **Step 1:** Three.js ile kedi geometrisi oluştur (veya GLB model yükle) — `Cat3D.tsx`
- [ ] **Step 2:** `CatAnimations.ts` — animasyon durumları: idle, happy_bounce, sad_drooping, running, sleeping, angry_tail, injured_limp
- [ ] **Step 3:** Ruh haline göre animasyon seç ve çal
- [ ] **Step 4:** Kostüm/aksesuar sistemi — texture veya mesh overlay
- [ ] **Step 5:** Kedi sayfası — `pet/page.tsx` — tam ekran kedi görünümü, etkileşim butonları (okşa, besle, oyna)
- [ ] **Step 6:** Tıklama etkileşimi — okşayınca mutlu animasyon + ses efekti
- [ ] **Step 7:** Commit: `feat(pet): 3D cat with animations and interactions`

---

### Task 21: Mini Oyunlar & Kozmetik Mağaza

**Files:**

- Create: `apps/web/app/(dashboard)/dashboard/pet/minigames/page.tsx`
- Create: `apps/web/components/pet/minigames/BallGame.tsx`
- Create: `apps/web/components/pet/shop/CosmeticShop.tsx`
- Create: `apps/web/app/api/pet/shop/route.ts`

- [ ] **Step 1:** Top oyunu mini game — kediye top at, yakala, XP kazan
- [ ] **Step 2:** Kozmetik mağaza — şapkalar, kostümler, aksesuarlar, coin ile satın al
- [ ] **Step 3:** Coin sistemi — başarım/streak tamamlayınca coin kazan
- [ ] **Step 4:** Satın alınan kostümleri DB'ye kaydet, kedi üzerinde göster
- [ ] **Step 5:** Commit: `feat(pet): mini games and cosmetic shop`

---

### Task 22: Kedi Bildirim Sistemi

**Files:**

- Create: `apps/web/app/api/pet/notifications/route.ts`
- Create: `apps/web/lib/pet/notificationMessages.ts`

- [ ] **Step 1:** `notificationMessages.ts` — kedi'nin tavırlı/sevimli mesajları:
  - 3 gün giriş yok: "Neredesin?? Ben burada seni bekliyorum! 😾"
  - 7 gün giriş yok: "Tamam artık seninle konuşmuyorum. (ama özledim) 🐱"
  - Geri dönünce: "Ohh sonunda! Bir daha böyle yapma sakın! 😤"
- [ ] **Step 2:** API route — son giriş tarihine göre bildirim mesajı üret
- [ ] **Step 3:** Geri dönüşte kedi tavırlı animasyon + mesaj göster
- [ ] **Step 4:** Commit: `feat(pet): cat notification and return behavior`

---

## Chunk 9: Gamification Sistemi

### Task 23: XP, Seviye & Rozet Sistemi

**Files:**

- Modify: `packages/db/prisma/schema.prisma`
- Create: `apps/web/lib/gamification/xpSystem.ts`
- Create: `apps/web/lib/gamification/badges.ts`
- Create: `apps/web/lib/gamification/streaks.ts`
- Create: `apps/web/app/api/gamification/route.ts`

- [ ] **Step 1:** Schema'ya `UserProgress` modeli ekle — xp, level, totalCoins, badges (JSON), streaks (JSON)
- [ ] **Step 2:** `xpSystem.ts` — XP kazanma kuralları: antrenman (+50), su hedefi (+10), ilaç al (+15), uyku hedefi (+20), yemek kaydet (+10), seans (+30)
- [ ] **Step 3:** `badges.ts` — rozet tanımları: "İlk Antrenman", "7 Gün Streak", "1000 ML Su", "10 Seans", "Kilo Kaybı" vb.
- [ ] **Step 4:** `streaks.ts` — günlük giriş streak, aktivite streak, su streak, ilaç streak
- [ ] **Step 5:** Commit: `feat(gamification): XP, levels, badges, streaks`

---

### Task 24: Başarımlar & Liderlik Sayfası

**Files:**

- Modify: `apps/web/app/(dashboard)/dashboard/achievements/page.tsx`
- Create: `apps/web/components/achievements/BadgeGrid.tsx`
- Create: `apps/web/components/achievements/LevelProgress.tsx`
- Create: `apps/web/components/achievements/Leaderboard.tsx`
- Create: `apps/web/components/achievements/StreakCalendar.tsx`

- [ ] **Step 1:** Başarımlar sayfasını yeniden yaz
- [ ] **Step 2:** `LevelProgress.tsx` — seviye, XP bar, bir sonraki seviyeye kalan XP
- [ ] **Step 3:** `BadgeGrid.tsx` — kazanılan rozetler parlıyor, kazanılmayanlar kilitli/soluk
- [ ] **Step 4:** `StreakCalendar.tsx` — aylık aktivite takvimi, streak günleri renkli
- [ ] **Step 5:** `Leaderboard.tsx` — genel veya arkadaş liderlik tablosu
- [ ] **Step 6:** Commit: `feat(gamification): achievements and leaderboard page`

---

### Task 25: Ödül Sistemi (Coin → Premium Özellik)

**Files:**

- Create: `apps/web/app/api/rewards/route.ts`
- Create: `apps/web/components/achievements/RewardStore.tsx`

- [ ] **Step 1:** Ödül tanımları — coin ile açılabilecek özellikler: özel kedi kostümü, premium seans teması, ekstra yol haritası
- [ ] **Step 2:** `RewardStore.tsx` — mağaza UI, coin bakiyesi, satın alma
- [ ] **Step 3:** Satın alınan ödülleri kullanıcıya aktif et
- [ ] **Step 4:** Commit: `feat(gamification): reward store with coin system`

---

## Chunk 10: Premium Sistem & Bildirimler

### Task 26: Freemium Model

**Files:**

- Create: `apps/web/lib/premium/features.ts`
- Create: `apps/web/components/premium/PremiumGate.tsx`
- Create: `apps/web/components/premium/UpgradeModal.tsx`
- Modify: `packages/db/prisma/schema.prisma`

- [ ] **Step 1:** `features.ts` — ücretsiz vs premium özellik listesi:
  ```ts
  export const FREE_FEATURES = [
    'water_basic',
    'food_manual',
    'sleep_manual',
    'pet_basic',
    'roadmap_1',
  ]
  export const PREMIUM_FEATURES = [
    'all_sessions',
    'food_photo',
    'food_barcode',
    'all_wearables',
    'pet_cosmetics',
    'pet_minigames',
    'roadmap_all',
    'leaderboard',
    'advanced_analytics',
  ]
  ```
- [ ] **Step 2:** `PremiumGate.tsx` — premium özelliğe erişilince modal göster
- [ ] **Step 3:** Schema'ya `subscription` alanı ekle — free | premium | professional
- [ ] **Step 4:** Commit: `feat(premium): freemium feature gating`

---

### Task 27: Bildirim Sistemi

**Files:**

- Create: `apps/web/app/api/notifications/route.ts`
- Create: `apps/web/lib/notifications/scheduler.ts`
- Create: `apps/web/app/(dashboard)/dashboard/settings/notifications/page.tsx`
- Modify: `packages/db/prisma/schema.prisma`

- [ ] **Step 1:** Schema'ya `NotificationSettings` modeli ekle
- [ ] **Step 2:** Bildirim tipleri:
  - Su hatırlatması (her X saatte)
  - İlaç hatırlatması (belirlenen saatlerde)
  - Uyku vakti
  - Antrenman günü
  - Streak uyarısı
  - Kedi bildirimi
  - Yol haritası haftalık güncelleme
  - Başarım kazanıldı
- [ ] **Step 3:** Web push notification entegrasyonu
- [ ] **Step 4:** Bildirim ayarları sayfası — her tip için açma/kapama + zaman ayarı
- [ ] **Step 5:** Commit: `feat(notifications): comprehensive notification system`

---

## Chunk 11: AI Entegrasyonu & Kullanıcı Verisi Bağlantısı

### Task 28: AI Memory Güncelleme — Tüm Veriler

**Files:**

- Modify: `apps/web/lib/memory/promptInjector.ts`
- Create: `apps/web/lib/ai/userContext.ts`

- [ ] **Step 1:** `userContext.ts` — kullanıcının tüm verilerini (uyku, su, yemek, ilaç, supplement, antrenman, kilo) tek objede topla
- [ ] **Step 2:** Her AI seans promptuna bu context'i enjekte et
- [ ] **Step 3:** Örnekler:
  - "Kullanıcı dün 5 saat uyudu, bugün antrenman seansı öner ama yoğun tutma"
  - "Kullanıcı 3 gündür kahvesini içmedi, sorabilirsin"
  - "Kullanıcı sol bacak sakatlığı bildirdi, egzersizlerde buna dikkat et"
- [ ] **Step 4:** Commit: `feat(ai): comprehensive user context injection`

---

### Task 29: Yol Haritası Dinamik Güncelleme

**Files:**

- Create: `apps/web/lib/roadmap/updater.ts`
- Create: `apps/web/app/api/roadmap/update/route.ts`

- [ ] **Step 1:** `updater.ts` — haftalık cron ile yol haritasını güncelle, kullanıcı performansına göre sonraki haftayı ayarla
- [ ] **Step 2:** Hafta tamamlandıysa bir sonraki haftayı kilidi aç, yetersiz performansta aynı haftayı tekrar et veya kolaylaştır
- [ ] **Step 3:** Commit: `feat(roadmap): dynamic weekly roadmap updates`

---

## Execution Order

1. Chunk 1 → Tasarım & Navigasyon (Foundation)
2. Chunk 2 → Ev Sayfası
3. Chunk 3 → Onboarding
4. Chunk 4 → Seans Sistemi
5. Chunk 5 → Yol Haritası
6. Chunk 6 → Takip Modülleri
7. Chunk 7 → Sağlık & Wearable
8. Chunk 8 → Kedi Sistemi
9. Chunk 9 → Gamification
10. Chunk 10 → Premium & Bildirimler
11. Chunk 11 → AI Entegrasyonu

---

## Notlar

- Her task'tan sonra `pnpm dev` ile test et
- Mobil görünümü her task'ta kontrol et (Chrome DevTools → iPhone 14 Pro)
- Thiings.co ikonları: `https://www.thiings.co/things` — PNG olarak indir veya CDN URL kullan
- Tüm yeni sayfalar dark/light tema destekli olmalı
- TypeScript strict mode — `any` kullanma
- Framer Motion animasyonları her interaktif elemanda
