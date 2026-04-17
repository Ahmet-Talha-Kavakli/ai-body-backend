# Notification System Design Spec

**Date:** 2026-04-17
**Status:** Draft

## Overview

Dashboard header'daki Bell butonu gerçek çalışan bir bildirim sistemine bağlanır. In-app bildirimler DB'de saklanır, popover'da listelenir. Kullanıcı tercihine göre web push bildirimleri de gönderilir. Tetikleyiciler: aksiyon bazlı (antrenman, başarım, seri) + cron bazlı (su, ilaç, uyku hatırlatmaları).

---

## Architecture

### DB: `Notification` Model (yeni)

```prisma
model Notification {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  type      String   // achievement | workout | streak | water | medication | sleep | pet | roadmap | system | meal
  title     String
  body      String
  link      String?  // tıklanınca yönlendirilecek URL
  read      Boolean  @default(false)
  createdAt DateTime @default(now())

  @@index([userId, read])
  @@index([userId, createdAt])
}
```

`User` modeline relation eklenir:

```prisma
notifications Notification[]
```

### Utility: `createNotification()`

`apps/web/lib/notifications/create-notification.ts`

```ts
createNotification(userId: string, payload: {
  type: NotificationType
  title: string
  body: string
  link?: string
}): Promise<void>
```

- DB'ye `Notification` kaydı yazar
- Kullanıcının `NotificationPreference`'ından ilgili toggle'ı kontrol eder
- Toggle açıksa ve `webPushEnabled` ise web push gönderir (`web-push` paketi)
- Toggle kapalıysa sadece DB'ye yazar (in-app görünür, push gitmez)

### NotificationType → Toggle mapping

| type        | preference field       |
| ----------- | ---------------------- |
| water       | waterReminder          |
| meal        | mealReminder           |
| medication  | medicationReminder     |
| sleep       | sleepReminder          |
| workout     | workoutReminder        |
| pet         | petNotification        |
| streak      | streakWarning          |
| achievement | achievementAlert       |
| roadmap     | roadmapUpdate          |
| system      | (her zaman gönderilir) |

---

## API Endpoints

### `GET /api/notifications`

- Auth: required
- Returns: `{ notifications: Notification[], unreadCount: number }`
- Son 30 bildirim, `createdAt desc`

### `POST /api/notifications/[id]/read`

- Auth: required
- Body: yok
- Action: `read = true` set eder
- Returns: `{ success: true }`

### `POST /api/notifications/read-all`

- Auth: required
- Action: tüm okunmamışları `read = true` yapar
- Returns: `{ success: true }`

Mevcut endpointler (`/api/notifications/preferences`, `/api/notifications/register`, `/api/notifications/settings`) **korunur**, değiştirilmez.

---

## Frontend

### Hook: `useInAppNotifications`

`apps/web/hooks/useInAppNotifications.ts`

- `GET /api/notifications` her 30 saniyede bir çağırır (setInterval)
- Returns: `{ notifications, unreadCount, markRead, markAllRead, loading }`
- Sayfa odak değişiminde (visibilitychange) refresh eder

### Header Bell Butonu

`apps/web/components/dashboard/shared/header.tsx` güncellenir:

- `useInAppNotifications` hook'u kullanır
- Statik "3" badge → gerçek `unreadCount`
- `unreadCount === 0` → badge gizlenir
- Tıklanınca `NotificationPopover` açılır

### `NotificationPopover`

`apps/web/components/notifications/NotificationPopover.tsx`

- Radix `Popover` bileşeni
- Header: "Bildirimler" + "Hepsini okundu işaretle" butonu (unread varsa)
- Liste: son 30 bildirim, okunmamışlar üstte hafif highlight
- Her item:
  - Sol: type'a göre ikon + renk (achievement → Trophy/yellow, workout → Zap/green, vb.)
  - Orta: title (bold) + body (muted, truncate) + zaman (relative, "2 dk önce")
  - Tıklanınca: `markRead(id)` → `router.push(link)` → popover kapanır
- Boş state: "Henüz bildirim yok" mesajı
- Loading: 3 satır skeleton

### Relative time utility

`apps/web/lib/notifications/relative-time.ts`  
"2 dk önce", "1 sa önce", "3 gün önce" formatında Türkçe

---

## Trigger Points

### Aksiyon bazlı (API route içinde `createNotification` çağrısı)

| Olay                              | API Route                                           | Type          | Link                  |
| --------------------------------- | --------------------------------------------------- | ------------- | --------------------- |
| Antrenman tamamlandı              | `POST /api/sessions` veya workout complete endpoint | `workout`     | `/dashboard/workouts` |
| Başarım kazanıldı                 | Achievement award logic                             | `achievement` | `/dashboard/progress` |
| Seri güncellendi (kırılmak üzere) | Streak update logic                                 | `streak`      | `/dashboard/progress` |
| Yol haritası güncellendi          | Roadmap update endpoint                             | `roadmap`     | `/dashboard/workouts` |

### Cron bazlı (`/api/cron/notifications`)

`apps/web/app/api/cron/notifications/route.ts`

- Vercel Cron: `0 * * * *` (saatlik) — su hatırlatması (her 2 saatte bir gönderir, son bildirim zamanına göre)
- `0 8 * * *` (günlük 08:00) — ilaç, uyku, antrenman hatırlatmaları
- `0 20 * * *` (günlük 20:00) — streak uyarısı (gün bitmeden, henüz aktivite yoksa)

Her cron çalıştığında:

1. İlgili tercihi açık olan tüm kullanıcıları çeker
2. Her biri için `createNotification()` çağırır

---

## Mevcut Notifications Settings Sayfası

`/dashboard/settings/notifications/page.tsx` **korunur**, değiştirilmez.  
Push subscription akışı mevcut `useNotifications` hook üzerinden çalışmaya devam eder.

---

## Web Push

- Paket: `web-push` (zaten projeye eklenmiş mi kontrol edilir, yoksa eklenir)
- VAPID keys: `NEXT_PUBLIC_VAPID_PUBLIC_KEY` + `VAPID_PRIVATE_KEY` env vars (mevcut)
- `createNotification()` içinde push gönderimi: fire-and-forget (await olmadan, hata log'lanır)

---

## File Structure

```
apps/web/
  lib/notifications/
    create-notification.ts    ← utility, DB write + push
    relative-time.ts          ← "2 dk önce" formatter
  hooks/
    useInAppNotifications.ts  ← polling hook
  components/notifications/
    NotificationPopover.tsx   ← popover UI
  app/api/
    notifications/
      route.ts                ← GET list
      [id]/read/route.ts      ← POST mark read
      read-all/route.ts       ← POST mark all read
    cron/
      notifications/route.ts  ← cron triggers
  prisma/schema.prisma        ← Notification model eklenir
```

---

## Error Handling

- `createNotification()`: DB yazma başarısız → hata fırlatır (caller handle eder)
- Web push gönderimi: hata → console.error, DB kaydı yine de yazılır
- Popover: API hatası → "Bildirimler yüklenemedi" inline mesaj
- `markRead`: optimistic update, hata olursa revert yok (non-critical)
- Cron: her user için try/catch, bir kullanıcı patlarsa diğerleri etkilenmez

---

## Tech Stack

- Prisma + PostgreSQL
- `web-push` npm paketi
- Radix UI Popover (zaten projede mevcut)
- Framer Motion (animasyonlar)
- Vercel Cron Jobs
- Existing: `useNotifications` hook, `NotificationPreference` model
