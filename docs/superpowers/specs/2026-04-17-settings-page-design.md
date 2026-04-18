# Settings Page Design Spec

**Date:** 2026-04-17  
**Status:** Approved

## Overview

`/dashboard/profile` sayfası kaldırılarak `/dashboard/settings` URL'i altında kapsamlı bir Settings sayfası oluşturulacak. Sidebar'da "Profile" → "Ayarlar" olarak güncellenir.

## URL & Navigation Changes

- `/dashboard/profile/page.tsx` → redirect to `/dashboard/settings`
- `/dashboard/settings/page.tsx` → sıfırdan yazılır
- Sidebar: "Profile" nav item → "Ayarlar", icon settings, URL `/dashboard/settings`

## Architecture

```
/app/(dashboard)/dashboard/settings/page.tsx     ← orchestrator
/app/(dashboard)/dashboard/profile/page.tsx      ← redirect only

/components/settings/
  ProfileSection.tsx
  SubscriptionSection.tsx
  AppearanceSection.tsx
  PrivacySection.tsx
  DataPrivacySection.tsx
  DangerZone.tsx
```

## Layout

- `max-w-2xl` container, dikey scroll
- Bölümler arası `gap-6`
- Her bölüm: `rounded-2xl border bg-card/50` kart
- İçi iOS-tarzı liste satırları: `border-b border-border/20 py-3`
- Sayfa başlığı: "Ayarlar" + kullanıcı email subtitle
- Bölüm header: THIINGS ikon + başlık + açıklama (THIINGS zaten projede mevcut)
- Framer Motion ile fade-in animasyonlar
- Loading state: skeleton (pulse) her bölüm için ayrı
- Error state: toast notification (mevcut toast sistemi kullanılır)

## DB Migration

Yeni alanlar `User` tablosuna (bio ve profilePublic zaten mevcut):

```prisma
timezone  String?
country   String?
locale    String?   // dil tercihi: "tr" | "en"
```

Yeni tablo `UserPrivacySettings`:

```prisma
model UserPrivacySettings {
  id                  String   @id @default(cuid())
  userId              String   @unique
  user                User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  collectWorkout      Boolean  @default(true)
  collectNutrition    Boolean  @default(true)
  analytics           Boolean  @default(true)
  marketingEmails     Boolean  @default(false)
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt
}
```

## Sections

### 1. ProfileSection

**Avatar block:**

- Clerk avatar gösterilir, tıklanınca `useClerk().openUserProfile()` açar (modal mode)
- Ad Soyad + email subtitle

**Profil Detayları:**
| Alan | Tip | Kaynak |
|------|-----|--------|
| Ad Soyad | inline edit | `User.name` |
| E-posta | readonly | Clerk `primaryEmailAddress` |
| Telefon | readonly | Clerk `primaryPhoneNumber` |
| Biyografi | textarea, max 200 chr | `User.bio` (mevcut) |

**Fiziksel & Kişisel:**
| Alan | Tip | Kaynak |
|------|-----|--------|
| Yaş | number input | `HealthProfile.age` |
| Cinsiyet | select (Erkek/Kadın/Diğer/Belirtmek istemiyorum) | `HealthProfile.gender` |
| Boy (cm) | number input | `HealthProfile.heightCm` |
| Kilo (kg) | number input | `HealthProfile.weightKg` |

**Fitness:**
| Alan | Tip | Kaynak |
|------|-----|--------|
| Fitness Seviyesi | select (beginner/intermediate/advanced) | `HealthProfile.fitnessLevel` |
| Hedefler | multi-select chips | `HealthProfile.goals` |

**Konum:**
| Alan | Tip | Kaynak |
|------|-----|--------|
| Ülke | select | `User.country` |
| Timezone | select | `User.timezone` |

**Kaydet butonu davranışı:**

- Değişiklik olmadığında disabled
- Tıklanınca iki paralel PATCH:
  1. `PATCH /api/user/profile` → `User` alanları (name, bio, country, timezone)
  2. `PATCH /api/user/sync-health-profile` → `HealthProfile` alanları (age, gender, height, weight, fitnessLevel, goals)
- Başarıda: "Kaydedildi ✓" toast
- Hata: "Kaydedilemedi, tekrar dene" toast, UI değerleri revert edilmez (kullanıcı tekrar deneyebilir)
- Toggle'lar (profilePublic vb.): server-confirmed update — flip sonrası PATCH, hata olursa revert

---

### 2. SubscriptionSection

**Mevcut Plan block:**

- Tier: free → "Ücretsiz", basic → "Basic", standard → "Standart", pro → "Pro"
- ⚡ icon (pro değilse)
- Yenileme tarihi: subscription `currentPeriodEnd` alanından formatlanır
- Free değilse → "Planı Yönet" (Stripe portal via `POST /api/subscription/portal`)
- Pro değilse → "Yükselt" → `/dashboard/settings/premium` (mevcut sayfa)
- Herhangi limit %100 doluysa → kırmızı banner: "[X] limitin doldu. Yükselt veya yenileme tarihini bekle."

**Aylık Kullanım:**

- Seans, AI Program, Yemek Analizi, Koç Mesajı
- Progress bar: used/limit, %80+ sarı, %100 kırmızı
- Limit Infinity ise bar gösterilmez, "Sınırsız" yazısı

**Premium Özellikler:**

- Akıllı Saat Sync, Gelişmiş Analiz, Öncelikli Destek
- ✅ aktif / 🔒 kilitli

**Loading:** skeleton 3 satır. **Error:** "Abonelik bilgisi yüklenemedi" inline mesaj.

---

### 3. AppearanceSection

- Tema toggle: Açık / Koyu → `next-themes setTheme()`
- Dil select: Türkçe (tr) / English (en) → `PATCH /api/user/profile` ile `User.locale` kaydedilir, `localStorage` da güncellenir (i18n için hazırlık)

---

### 4. PrivacySection (Gizlilik ve Güvenlik)

| Satır                  | Açıklama                                    | Aksiyon                                                          |
| ---------------------- | ------------------------------------------- | ---------------------------------------------------------------- |
| İki Faktörlü Doğrulama | Clerk'ten durum gösterilir                  | `openUserProfile()`                                              |
| Şifre                  | Son değişim tarihi                          | `openUserProfile()`                                              |
| Aktif Oturumlar        | Clerk session sayısı (cihaz adedi)          | `openUserProfile()` → Sessions tab                               |
| Hesap Aktivite Logu    | Son giriş IP + zaman (Clerk `lastSignInAt`) | `openUserProfile()`                                              |
| Bağlı Cihazlar         | Wearable bağlantı durumu                    | `/dashboard/health`'e link                                       |
| Profil Görünürlüğü     | Herkese açık / Gizli                        | Toggle → `PATCH /api/user/profile` `profilePublic` (mevcut alan) |
| Verilerimi İndir       | Tüm kullanıcı verisi JSON                   | `GET /api/user/export` → download                                |

**`/api/user/export` response shape:**

```json
{
  "exportedAt": "ISO date",
  "user": { "name", "email", "bio", "country", "timezone" },
  "healthProfile": { "age", "gender", "heightCm", "weightKg", "fitnessLevel", "goals" },
  "sessions": [...],
  "nutrition": [...],
  "achievements": [...]
}
```

Sync response (no email delivery), JSON dosya olarak indirilir.

---

### 5. DataPrivacySection (Veri ve Gizlilik)

**Veri Toplama toggles** → `PATCH /api/user/privacy-settings` → `UserPrivacySettings`:

- Antrenman verilerini topla (`collectWorkout`)
- Beslenme verilerini topla (`collectNutrition`)
- Analitik ve iyileştirme (`analytics`)
- Pazarlama iletişimi (`marketingEmails`)

Toggle davranışı: server-confirmed — flip sonrası PATCH, hata olursa revert + toast.

**Yasal linkler** (yeni sekme):

- Gizlilik Politikası → `/privacy`
- Kullanım Şartları → `/terms`

---

### 6. DangerZone

Kırmızı border `border-red-500/20`, bg `bg-red-500/5`.

| Aksiyon            | Confirmation                                                                      | Operasyon                                                                                                                    |
| ------------------ | --------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Tüm Verilerimi Sil | Dialog: "Bu işlem geri alınamaz. Devam etmek için 'SİL' yazın."                   | `DELETE /api/user/data` → sessions, nutrition, achievements, health records silinir. Clerk hesabı ve User kaydı **korunur**. |
| Hesabı Sil         | Dialog: "Hesabın kalıcı olarak silinecek. Devam etmek için 'HESABIMI SİL' yazın." | Önce DB (`User` cascade), sonra Clerk `deleteUser()`. DB başarılıysa Clerk silinir. Hata: toast + log.                       |
| Çıkış Yap          | Yok                                                                               | `clerk.signOut({ redirectUrl: '/' })`                                                                                        |

## API Endpoints

| Endpoint                        | Method      | Açıklama                                                            |
| ------------------------------- | ----------- | ------------------------------------------------------------------- |
| `/api/user/profile`             | GET / PATCH | User alanları (name, bio, country, timezone, locale, profilePublic) |
| `/api/user/sync-health-profile` | PATCH       | HealthProfile alanları (mevcut endpoint)                            |
| `/api/user/export`              | GET         | JSON data export, sync download                                     |
| `/api/user/data`                | DELETE      | Workout/nutrition/achievement verileri sil (User kaydı korunur)     |
| `/api/user/privacy-settings`    | GET / PATCH | UserPrivacySettings                                                 |
| `/api/subscription/usage`       | GET         | Abonelik kullanımı + currentPeriodEnd                               |
| `/api/subscription/checkout`    | POST        | Stripe checkout                                                     |
| `/api/subscription/portal`      | POST        | Stripe portal                                                       |

## Tech Stack

- Clerk: auth, avatar, 2FA, sessions → `useClerk()`, `openUserProfile()` (modal mode, mevcut Clerk config destekliyor)
- next-themes: tema
- Framer Motion: animasyonlar
- THIINGS: bölüm ikonları (mevcut `@/lib/thiings`)
- Prisma: DB operasyonları
- Stripe: abonelik yönetimi
