# Nutrition Page Redesign — Design Spec

**Date:** 2026-04-13  
**Status:** Approved for implementation

---

## 1. Goal

Full redesign of the nutrition page (`/dashboard/nutrition`). Replace the current generic card-grid layout with a premium, high-density dashboard that feels alive — not like a template. Every user type (weight loss, muscle gain, general wellness) should feel at home.

---

## 2. Design Language

### Vibe Archetype: Ethereal Glass (SaaS/Fitness)

- Background: `#0A0A0F` (existing `--bg-primary`)
- Surfaces: `--bg-surface` (#12121A) with `backdrop-blur` on fixed overlays only
- Cards: Double-bezel architecture — outer shell (`border border-white/6`, `p-1.5`, `rounded-[1.75rem]`) + inner core (`rounded-[calc(1.75rem-0.375rem)]`, `bg-[#12121A]`, `shadow-[inset_0_1px_1px_rgba(255,255,255,0.06)]`)
- No neon outer glows — use inner borders and tinted shadows
- No Inter font — use `Geist` via existing Next.js font setup (already used in project)
- Accent: `#6366F1` (existing `--accent-primary`) — used sparingly

### Layout Archetype: Asymmetric Bento Grid

- Hero row: 2-col split — large calorie ring (left, 60%) + stacked info cards (right, 40%)
- Below hero: full-width öğün timeline
- Below timeline: 3-col bento — haftalık trend / su takibi / AI öneri
- Below bento: aylık ısı haritası + öğün şablonları
- Mobile: single column, `px-4`, all asymmetry removed

---

## 3. Page Structure

### Section 1 — Hero (always visible above fold)

**Left (60%):** Animasyonlu Kalori Ring

- SVG `<circle>` stroke-dashoffset animasyonu, Framer Motion ile mount'ta çizilir
- Ortada büyük sayı: tüketilen / hedef kcal
- Altında "X kcal kalan" veya "X kcal aşıldı" (yeşil / kırmızı)
- Ring rengi: `#6366F1` (doldurulan) → `rgba(99,102,241,0.15)` (boş)

**Sağ (40%):** Dikey yığılı 3 mini kart

- Protein bar (mavi gradient)
- Karbonhidrat bar (amber gradient)
- Yağ bar (pembe gradient)
- Her bar: current / goal sayıları + animasyonlu dolum
- Su takibi inline: damlacık ikonları (8 bardak, dolan mavi olur)

**Eylem butonları (sağ üst):**

- "Fotoğrafla Analiz" — primary pill button (Button-in-Button pattern, ikon içi circle)
- "+ Öğün Ekle" — ghost pill
- "Şablon Ekle" — ghost pill

---

### Section 2 — Bugünkü Öğünler (Timeline)

Kart grid değil, **sol kenar çizgisi olan timeline**:

- Her öğün: sol kenar noktası + zaman damgası + öğün tipi ikonu
- Genişletildiğinde: yemek listesi + makro detayları inline expand (Framer `AnimatePresence`)
- AI analizi yapılanlar: `AI` badge + hafif mor arka plan
- Sağ taraf: kalori sayısı büyük, font-mono
- Silme butonu: hover'da görünür, destructive kırmızı
- Boş durum: güzel compose edilmiş "Henüz öğün eklenmedi" + iki aksiyon butonu

---

### Section 3 — Bento Grid (Haftalık / Su / AI)

**Sol (col-span-2):** Haftalık Kalori Trend Grafiği

- 7 günlük çubuk grafik — Recharts (`recharts@^2.15.2` kurulu, kullanılacak)
- Her çubuk: hedefin altında yeşil, üstünde turuncu
- Hover tooltip: o günün makroları
- Başlık: "Bu Hafta" + ortalama kalori badge

**Orta (col-span-1):** Su Takibi

- 8 bardak = hedef 2L
- Her bardak tıklanabilir → dolar animasyonu (transform scale + opacity)
- Toplam ml gösterimi
- Hedef tamamlanınca küçük konfeti efekti (`canvas-confetti` paketi, hafif — ~3kb)

**Sağ (col-span-1):** AI Günlük Öneri

- Mor/indigo gradient kart
- AI ikonuyla birlikte kısa öneri metni ("Bugün protein %30 eksik — akşam yemeine tavuk ekle")
- "Detaylı Analiz" linki
- Her gün otomatik refresh (sayfa yüklendiğinde API çağrısı)

---

### Section 4 — Aylık Görünüm

**Sol:** Isı haritası takvim

- Her gün bir kare: kalori hedefine göre renk yoğunluğu (boş → açık → dolu → aşıldı)
- Hover'da o günün özeti tooltip

**Sağ:** Aylık istatistikler

- Ortalama günlük kalori
- En iyi gün / en kötü gün
- Hedef tutturma oranı (%)
- Toplam protein bu ay

---

### Section 5 — Hızlı Ekle & Öğün Şablonları

**Hızlı ekle:** Yatay scroll, thiings görselli kartlar (mevcut QUICK_ADD listesi korunur)

- Her kart: hover'da scale + border glow
- Tıklanınca: optimistic UI ile anında eklenir, spinner kart içinde

**Öğün Şablonları:**

- Kullanıcının kaydettiği sık öğünler
- "+ Yeni Şablon" butonu → modal ile isim + besin değerleri
- Şablon silinebilir

---

## 4. Modaller

### Öğün Ekle Modalı (yeniden tasarlandı)

- Morphing modal: buton genişleyerek modalı açar (`layoutId` ile Framer)
- Öğün tipi: yatay pill seçici (dropdown değil)
- Makrolar: 3 input yan yana, label üstte
- "Fotoğrafla Tara" shortcut butonu modal içinde
- Submit: optimistic update, spinner buton içinde

### Fotoğraf Analiz Modalı (mevcut `MealPhotoAnalyzer` güncellenir)

- Drag & drop destekli upload alanı
- Analiz sırasında: skeleton loader (gerçek boyutlarda)
- Sonuç: düzenlenebilir — kullanıcı porsiyon değiştirebilir

---

## 5. Animasyon Sistemi

| Element             | Animasyon                 | Süre                  | Easing                      |
| ------------------- | ------------------------- | --------------------- | --------------------------- |
| Kalori ring         | strokeDashoffset 0→target | 1200ms                | `cubic-bezier(0.4,0,0.2,1)` |
| Makro barlar        | scaleX 0→1                | 800ms + stagger 100ms | ease-out                    |
| Öğün timeline items | slideUpFade, stagger 60ms | 400ms                 | spring                      |
| Bento kartları      | scaleIn                   | 500ms, stagger 80ms   | spring(100,20)              |
| Su bardakları       | scale+opacity             | 200ms                 | spring(200,15)              |
| Modal açılış        | layoutId morph            | 400ms                 | spring(0.34,1.56,0.64,1)    |
| Hover butonları     | scale(0.98) active        | 80ms                  | linear                      |

Tüm animasyonlar `prefers-reduced-motion` bloğuna saygı gösterir.

---

## 6. Yeni API İhtiyaçları

| Endpoint                   | Method          | Açıklama                           |
| -------------------------- | --------------- | ---------------------------------- |
| `/api/nutrition`           | GET             | Mevcut — bugünkü öğünler (korunur) |
| `/api/nutrition`           | POST            | Mevcut — öğün ekle (korunur)       |
| `/api/nutrition/history`   | GET             | YENİ — haftalık + aylık özet       |
| `/api/nutrition/water`     | POST            | YENİ — su bardağı ekle/çıkar       |
| `/api/nutrition/water`     | GET             | YENİ — günlük su miktarı           |
| `/api/nutrition/templates` | GET/POST/DELETE | YENİ — öğün şablonları             |
| `/api/ai/nutrition-tip`    | GET             | YENİ — günlük AI beslenme önerisi  |

---

## 7. DB Değişiklikleri

```prisma
model WaterLog {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  glasses   Int      @default(0)  // 0-8 bardak
  date      DateTime // sadece tarih (time 00:00:00 olarak saklı)
  loggedAt  DateTime @default(now())

  @@unique([userId, date])  // günde bir kayıt, upsert ile güncellenir
}

model MealTemplate {
  id           String   @id @default(cuid())
  userId       String
  name         String
  mealType     String
  items        Json
  totalCalories Int
  totalProteinG Float
  totalCarbsG   Float
  totalFatG     Float
  createdAt    DateTime @default(now())
}
```

---

## 8. Bileşen Mimarisi

```
nutrition/
  page.tsx                    ← orchestrator, data fetch
  components/
    CalorieRing.tsx           ← SVG ring, client
    MacroBars.tsx             ← protein/carb/fat bars, client
    MealTimeline.tsx          ← timeline list, client
    MealTimelineItem.tsx      ← single item, expandable
    WeeklyChart.tsx           ← bar chart, client
    WaterTracker.tsx          ← 8-glass UI, client
    AiNutritionTip.tsx        ← AI öneri kartı, client
    MonthlyHeatmap.tsx        ← calendar grid, client
    QuickAddBar.tsx           ← horizontal scroll, client
    MealTemplates.tsx         ← template list + CRUD, client
    AddMealModal.tsx          ← morphing modal, client
    MealPhotoAnalyzer.tsx     ← mevcut, güncellenir
```

Her animasyonlu bileşen kendi `'use client'` izole leaf komponenti. Perpetual motion'lar `React.memo` ile sarılır.

---

## 9. Hata & Optimistic UI Stratejisi

- **Optimistic updates:** Öğün ekleme ve su güncelleme anlık UI'da yansır. API başarısız olursa state eski haline döner ve toast hata mesajı gösterilir.
- **Rollback:** Her optimistic işlem öncesi önceki state snapshot'ı alınır (`prevState`). `catch` bloğunda `setState(prevState)` çağrılır.
- **Foto analiz hatası:** Spinner → hata mesajı inline (modal kapanmaz), "Tekrar Dene" butonu.
- **AI öneri hatası:** Kart boş gösterilmez — statik fallback mesaj ("Bugün de sağlıklı ye!") gösterilir.
- **Ağ hatası genel:** Her section bağımsız loading state tutar, birinin hata vermesi diğerlerini etkilemez.

---

## 10. Kapsam Dışı

- Barkod tarama (teknik kompleksite yüksek, Phase 2)
- Push notification önerileri
- Export / PDF raporu

---

## 10. Başarı Kriterleri

- Sayfa ilk açılışta 60fps'de kalori ring animasyonu oynar
- Tüm öğün ekleme aksiyonları optimistic UI ile anlık hissedilir
- Haftalık ve aylık veriler tek API çağrısıyla gelir
- Mobilde layout bozulmaz, tüm aksiyonlar erişilebilir
- `prefers-reduced-motion` aktifken tüm animasyonlar devre dışı
