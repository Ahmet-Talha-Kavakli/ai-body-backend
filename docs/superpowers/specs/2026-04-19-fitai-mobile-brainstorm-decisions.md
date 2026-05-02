# FitAI Mobile Rewrite — Brainstorm Decisions

**Tarih:** 2026-04-19
**Durum:** Brainstorm kararları sabitlendi. Tasarım spec'i ve implementasyon planı bundan türetilecek.

---

## Vizyon

FitAI, bir fitness tracker değil — **davranışsal psikoloji + AI hafıza + uyarlanan sistem + holistik yaşam ortağı**. Mobil yeniden yazımı bu ruhu korumalı.

## Kararlar

### Hedef kullanıcı

**Herkese derinlemesine hizmet** (E) — yeni başlayandan elit atlet'e kadar. Her seviyede derin değer sunar.

### Hero story (konum)

**A + C + D** — "Akıllı, adaptif, hatırlayan koç":

- **A** Hafıza: 90 gün semantik memory, pgvector, decay
- **C** Adaptasyon: günlük readiness → bugünün yoğunluğu
- **D** Tarih: her rep'in psikolojik tarihi + form analizi

Landing copy pozisyonu: "Seni hatırlayan, bugününü okuyan, her tekrarını bilen koç."

### Lansman scope'u

**B — Tam parite, bitene kadar yayınlama**. Web'de olan 85+ özelliğin hepsi mobile'da çalışır olmadan mağazaya çıkmıyor.

### Görsel stil

**A + animasyonlu** — Apple Native (iOS Health/Fitness estetiği: temiz, minimal, güvenilir) + motion (spring animasyonları, smooth geçişler, mikro etkileşimler, Apple Watch animasyon dili).

### Platform öncelik (implicit)

iOS önce (simülatörde test ediyoruz, Xcode kuruldu). Expo ile Android paralel gelişir ama polish iOS'ta önce.

---

## Yeni Özellikler (web paritesinin üstüne, 30 adet)

### iOS Native katman (10)

1. Apple Watch uygulaması
2. Home Screen widget
3. Lock Screen widget
4. Live Activity (Dynamic Island)
5. Siri shortcuts
6. iOS Focus mode entegrasyonu
7. HealthKit'e yazma (bidirectional)
8. Handoff (telefon↔Mac)
9. iMessage extension (paylaşım kartı)

### Giyilebilir / Sensör (1)

16. Apple Watch uyku REM/Deep/Light gerçek veri

### Sosyal (1)

23. Story formatı antrenman özeti (paylaşılabilir kart)

### AI Koç evrimi (7)

25. Koç kişilik seçimi (sert/motivatör/esprili/sakin)
26. Çok dilli koç (TR↔EN anlık geçiş)
27. Yıllar arası hafıza
28. Uykuya duyarlı otomatik volume ayarı
29. Rehab modu (sakatlandığında otomatik)
30. Plateau detektörü
31. Ses komutlu workout (hands-free)

### Beslenme derinlemesine (5)

33. Restoran menü tarayıcı (OCR + AI)
34. Tarif oluşturucu (elindeki malzemelerden)
35. Kiler takibi (barkodla ev malzemesi)
36. Akıllı hidrasyon (hava + aktivite)
37. Kafein curfew (uyku penceresi uyarısı)

### Mental/Recovery (3)

40. Rehberli nefes (uyku öncesi, ağır lift öncesi, stres)
41. Stres günlüğü + AI pattern tespiti
42. Soğuk/sauna loglama (HR etkisi)

### Oyunlaştırma/Narratif (4)

45. Sezonsal eventler (aylık temalı challenge + özel kostümler)
46. Pet evrim (Pamuk: yavru → yetişkin → bilge)
47. AI rakip karakter (dijital ikiz haftalık yarış)
48. Milestone hediye (fiziksel kart/NFT/kargo)

---

## Toplam Feature Surface

- **Web paritesi:** 85+ özellik
- **Yeni:** 30 özellik
- **Toplam:** ~115 özellik alanı

Bu çap tek bir spec'e sığmaz → sub-project decomposition şart.

## Sub-Project Dekompozisyonu (önerilen)

Her biri kendi spec→plan→implementasyon döngüsüne girecek:

1. **Foundation** — Design system (tokens, typography, components), navigasyon iskeleti, Expo Router yapısı
2. **Auth & Onboarding** — Clerk, 10 adımlı onboarding, check-in
3. **Home** — Dashboard (AI greeting, readiness, pet widget, hızlı eylemler)
4. **Workouts** — Session live, program, history, form analizi (kamera+pose), voice coach
5. **Nutrition** — Meal log, AI photo, water, templates, streak, restoran tarayıcı, tarif builder, kiler
6. **Health** — 6 tab (overview/activity/sleep/water/body/devices), health metrics, uyku analizi, soğuk/sauna
7. **Pet & Gamification** — Pet (evrim, mood, shop, minigame), achievements, challenges, sezonsal event, AI rakip
8. **Social** — Friends, leaderboard, activity feed, story paylaşım, mentor eşleşme, canlı sesli oda
9. **AI Coach** — Chat (text + voice), memory timeline, plateau detektörü, kişilik seçimi, rehab mode
10. **Analytics & Progress** — Analytics, advanced analytics, progress, AR fitting, body model
11. **Settings & Billing** — Profile, privacy, notifications, Stripe, data export
12. **Wearables & Sensors** — Apple Watch app, HealthKit bidirectional, Bluetooth HR, LiDAR body scan
13. **iOS Native Katman** — Widgets, Live Activity, Siri, Focus, Handoff, iMessage
14. **Mental & Recovery** — Rehberli nefes, meditasyon, stres günlüğü, uyku hikayesi
15. **Utilities** — Notifications, push, offline sync, memory decay senkronu

## İmplementasyon Sırası Önerisi

**Foundation → Auth → Home** kritik yoldur. Bunlar bitmeden diğerleri anlamsız.

Sonrası kullanıcı değer önceliğine göre:

- **Faz 1:** Foundation + Auth + Home (iskelet + ilk deneyim)
- **Faz 2:** Workouts + Nutrition + Health (core kullanım)
- **Faz 3:** Pet/Gamification + Social (bağlılık)
- **Faz 4:** AI Coach + Analytics + Wearables (zeka katmanı)
- **Faz 5:** iOS Native + Mental/Recovery + Utilities (premium tecrübe)
- **Faz 6:** Settings + Billing (monetizasyon)

Her faz kendi spec'ini alır. Her spec'ten writing-plans çıkarılır. Her plan execution döngüsüne girer.
