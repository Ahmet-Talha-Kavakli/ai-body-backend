# Nutrition Hub — Design Spec

**Date:** 2026-04-14  
**Status:** Approved for implementation  
**Approach:** Tab-Based Hub  
**Replaces:** 2026-04-13-nutrition-redesign.md (deprecated)

---

## 1. Goal

Complete ground-up rebuild of `/dashboard/nutrition`. Deliver a world-class nutrition tracking experience on par with FatSecret — and beyond. Serves all user types: weight loss, muscle gain, general wellness. Built for global scale: Turkish + English initially, i18n-ready for 30+ languages.

---

## 2. Design System

### Color Palette

| Token             | Value     | Usage                                        |
| ----------------- | --------- | -------------------------------------------- |
| `--bg-base`       | `#0D0D14` | Page background                              |
| `--bg-surface`    | `#12121E` | Card surface                                 |
| `--bg-elevated`   | `#1A1A2E` | Hover / active card                          |
| `--accent-green`  | `#22C55E` | Below calorie goal (positive)                |
| `--accent-orange` | `#F97316` | Above calorie goal (warning)                 |
| `--accent-blue`   | `#3B82F6` | Protein, primary CTA                         |
| `--accent-amber`  | `#F59E0B` | Carbohydrates                                |
| `--accent-pink`   | `#EC4899` | Fat                                          |
| `--accent-indigo` | `#6366F1` | General accent (existing `--accent-primary`) |
| `--text-primary`  | `#F1F5F9` | Primary text                                 |
| `--text-muted`    | `#64748B` | Secondary text                               |

### Typography

- **Headings / Numbers / Calorie values:** `Barlow Condensed` (400/600/700) — athletic, energetic, impactful numbers
- **Body / UI text:** `Geist` (existing project font) — clean, modern
- Barlow Condensed loaded via `next/font/google`

### Card Architecture (Glassmorphism)

```
Outer shell:  border border-white/[0.06]  rounded-[1.5rem]  p-[1px]
Inner core:   bg-[#12121E]  rounded-[calc(1.5rem-1px)]  backdrop-blur-sm
Hover state:  bg-[#1A1A2E]  transition-colors  duration-150
```

No neon outer glows. Inner borders and tinted shadows only.

### Icon Set

Lucide React exclusively. No emojis as icons.

### Accessibility

- All color contrast minimum 4.5:1 (WCAG AA)
- All interactive elements minimum 44×44px touch target
- `prefers-reduced-motion` respected on all animations
- Focus states visible for keyboard navigation
- Form inputs with proper labels

---

## 3. Page Structure

### Header (always visible)

```
"Nutrition" title (Barlow Condensed, 32px)
subtitle: "Daily tracking"
Right: [+ Add Meal] pill CTA  [Photo Analysis] ghost pill
```

### Tab Bar

```
[ Today ] [ Explore ] [ History ] [ Profile ]
```

Active tab: indigo underline + text-primary. Inactive: text-muted.  
Tab switching: `opacity + translateX` 250ms spring transition.

---

## 4. Tab Designs

### Tab 1 — Today

#### Hero Row (2-col split)

**Left 55% — Calorie Ring**

- SVG `<circle>` stroke-dashoffset animation, Framer Motion on mount
- Center: consumed / goal kcal (Barlow Condensed, 48px)
- Below: "X kcal remaining" (green) or "X kcal over" (red)
- Ring fill color: `--accent-indigo` filled → `rgba(99,102,241,0.15)` empty
- Animation: 1200ms, `cubic-bezier(0.4,0,0.2,1)`

**Right 45% — Macro Bars + Water**

- Protein bar (blue gradient) — current / goal + animated fill
- Carbohydrate bar (amber gradient)
- Fat bar (pink gradient)
- Each bar: `scaleX` 0→1, stagger 80ms, 700ms ease-out
- Water tracker inline: 8 glass icons, tap fills (scale + fill opacity, 180ms spring)

#### Meal Timeline

- Left border line with dot per meal
- Each item: timestamp + meal type icon + food names + kcal (Barlow Condensed, 24px, right)
- Expand on tap: inline macro breakdown (AnimatePresence)
- AI-analyzed meals: `AI` badge + subtle purple tint
- Delete: visible on hover, destructive red
- Animation: `slideUpFade`, stagger 50ms, 350ms spring
- Empty state: illustration + two action buttons

#### Quick Add Bar

- Horizontal scroll, thumbnail image cards (uses existing `QUICK_ADD` list: `{ name, cals, img, type, protein, carbs, fat }`)
- Existing QUICK_ADD list preserved
- Tap: optimistic immediate add, spinner inside card
- Scale(0.94) tap feedback, 120ms linear

---

### Tab 2 — Explore

#### Search Bar

- Debounced input (300ms), placeholder: "Search food..."
- Right side: [Photo] icon button + [Barcode] icon button
- Open Food Facts API integration

#### Search Results

Each result card:

- Food name + brand (if available)
- Per 100g defaults: kcal, P/C/F grams
- [+ Add] button → opens FoodDetailModal with portion selector

#### Recent / Frequent Foods

- Horizontal chip scroll
- Last 10 used foods from user's log history

---

### Tab 3 — History

#### Weekly Chart

- 7-day bar chart (Recharts `BarChart`)
- Bar color: green if at/below goal, orange if above
- Hover tooltip: that day's macros
- Header: "This Week" + average kcal badge
- Animation: bars `scaleY` 0→1, stagger 60ms, 600ms ease-out

#### Monthly Heatmap

- Calendar grid, each day = colored square
- Color intensity = calorie % of goal: empty → light → full → exceeded
- Hover tooltip: that day's summary
- Current day highlighted with indigo border

#### Stats Row

- 3 cards: Average daily kcal / Best day / Goal hit rate %
- All from `/api/nutrition/history`

---

### Tab 4 — Profile

#### Goal Editor

- Calorie goal (kcal)
- Protein (g) / Carbs (g) / Fat (g)
- Water goal (ml)
- Inline edit, save with optimistic update

#### Meal Templates

- List of user-saved templates
- Each: name + meal type + total kcal + [Use] [Delete]
- [+ New Template] → modal with name + macros

#### AI Daily Tip

- Indigo gradient card
- Short AI-generated tip based on today's log
- "Detailed Analysis" link
- Fallback: static message if API fails ("Keep eating healthy today!")
- Auto-refresh on page load

---

## 5. Modals

### AddMealModal

- `layoutId` morph: "+" button expands into modal (Framer Motion)
- Meal type: horizontal pill selector (not dropdown)
- Portion: gram input + unit selector (g / piece / cup / slice)
- Macros: auto-filled from search, manually editable
- "Scan with Camera" shortcut button inside modal
- Submit: optimistic update, spinner inside button
- Animation: 380ms, `{ type: "spring", bounce: 0.34 }` (Framer Motion spring)

### FoodDetailModal

- Food name + brand
- Portion selector: number input + unit dropdown
- Live macro recalculation as portion changes
- Meal type selector
- [Add to Log] CTA

### BarcodeModal

- Camera view fullscreen (mobile) / centered (desktop)
- `@ericblade/quagga2` for barcode reading
- On success: FoodDetailModal opens with scanned product
- On failure: "Product not found" + [Enter Manually] fallback

### MealPhotoAnalyzer (rewrite)

- Drag & drop zone + camera button
- Upload progress: real-size skeleton loader
- Result: editable macro values, user confirms before adding
- Error: inline error message (modal stays open) + [Retry] button

---

## 6. Animation System

| Element        | Animation                   | Duration | Easing                                            |
| -------------- | --------------------------- | -------- | ------------------------------------------------- |
| Calorie ring   | `strokeDashoffset` 0→target | 1200ms   | `cubic-bezier(0.4,0,0.2,1)`                       |
| Macro bars     | `scaleX` 0→1, stagger 80ms  | 700ms    | `ease-out`                                        |
| Tab switch     | `opacity + translateX`      | 250ms    | `{ type: "spring", stiffness: 100, damping: 20 }` |
| Timeline items | `slideUpFade`, stagger 50ms | 350ms    | `{ type: "spring", stiffness: 120, damping: 18 }` |
| Modal open     | `layoutId` morph            | 380ms    | `{ type: "spring", bounce: 0.34 }`                |
| Quick add tap  | `scale(0.94)` → return      | 120ms    | `linear`                                          |
| Water glass    | `scale + fill opacity`      | 180ms    | `{ type: "spring", stiffness: 200, damping: 15 }` |
| Bar chart bars | `scaleY` 0→1, stagger 60ms  | 600ms    | `ease-out`                                        |
| Hover buttons  | `scale(0.98)` active        | 80ms     | `linear`                                          |

All animations respect `prefers-reduced-motion`.

---

## 7. Component Architecture

```
app/(dashboard)/dashboard/nutrition/
  page.tsx                        ← server component, data prefetch
  layout.tsx                      ← tab bar wrapper
  components/
    NutritionTabs.tsx             ← tab state management (URL-based)
    tabs/
      TodayTab.tsx                ← Phase 1
      ExploreTab.tsx              ← Phase 1
      HistoryTab.tsx              ← Phase 2
      ProfileTab.tsx              ← Phase 3
    today/                        ← Phase 1
      CalorieRing.tsx             ← SVG ring, 'use client'
      MacroBars.tsx               ← protein/carb/fat bars, 'use client'
      WaterTracker.tsx            ← 8-glass UI, 'use client'
      MealTimeline.tsx            ← timeline wrapper
      MealTimelineItem.tsx        ← single item, expandable
      QuickAddBar.tsx             ← horizontal scroll
    explore/                      ← Phase 1
      FoodSearchBar.tsx           ← debounced input + action buttons
      FoodSearchResults.tsx       ← Open Food Facts results list
      RecentFoods.tsx             ← recent/frequent chips (data from /api/nutrition/recent-foods)
      BarcodeScanner.tsx          ← inner camera logic + quagga2, embedded inside BarcodeModal
    history/                      ← Phase 2
      WeeklyChart.tsx             ← Recharts BarChart
      MonthlyHeatmap.tsx          ← calendar grid
      StatsRow.tsx                ← summary stats
    profile/                      ← Phase 3
      GoalEditor.tsx              ← inline goal editing (saves to /api/nutrition/goal)
      MealTemplates.tsx           ← template CRUD
      AiNutritionTip.tsx          ← AI tip card (Phase 2 for Today tab, Phase 3 for Profile tab)
    modals/
      AddMealModal.tsx            ← layoutId morph modal (Phase 1)
      FoodDetailModal.tsx         ← food + portion selector (Phase 1)
      BarcodeModal.tsx            ← presentation wrapper: renders BarcodeScanner inside (Phase 1)
      MealPhotoAnalyzer.tsx       ← photo analysis rewrite (Phase 1)
  hooks/
    useNutritionToday.ts          ← today's data + optimistic updates (Phase 1)
    useFoodSearch.ts              ← Open Food Facts search (Phase 1)
    useWaterTracker.ts            ← water state + optimistic (Phase 1)
    useRecentFoods.ts             ← last 10 foods from log history (Phase 1)
    useNutritionHistory.ts        ← weekly/monthly data (Phase 2)
    useMealTemplates.ts           ← template CRUD (Phase 3)
```

**BarcodeScanner vs BarcodeModal:** `BarcodeScanner.tsx` is the inner logic component (camera stream + quagga2 detection, emits `onDetected(barcode: string)`). `BarcodeModal.tsx` is the full-screen presentation wrapper that renders `BarcodeScanner` and handles the Open Food Facts barcode lookup + fallback UI. The [Barcode] button in ExploreTab opens `BarcodeModal`.

Each animated component is an isolated `'use client'` leaf. Perpetual motion wrapped in `React.memo`.

---

## 8. API Layer

### Existing (preserved)

| Endpoint              | Method  | Description                                                                             |
| --------------------- | ------- | --------------------------------------------------------------------------------------- |
| `/api/nutrition`      | GET     | Today's meals                                                                           |
| `/api/nutrition`      | POST    | Add meal                                                                                |
| `/api/nutrition/goal` | GET/PUT | Macro goals + water goal (`dailyCalories`, `proteinG`, `carbsG`, `fatG`, `waterGoalMl`) |

### New

| Endpoint                        | Method | Description                                 |
| ------------------------------- | ------ | ------------------------------------------- |
| `/api/nutrition/[id]`           | DELETE | Delete meal                                 |
| `/api/nutrition/history`        | GET    | Weekly + monthly summary                    |
| `/api/nutrition/water`          | GET    | Today's water count                         |
| `/api/nutrition/water`          | POST   | Add/update water glasses                    |
| `/api/nutrition/templates`      | GET    | List templates                              |
| `/api/nutrition/templates`      | POST   | Create template                             |
| `/api/nutrition/templates/[id]` | DELETE | Delete template                             |
| `/api/nutrition/recent-foods`   | GET    | Last 10 distinct foods from user's meal log |
| `/api/ai/nutrition-tip`         | GET    | AI daily nutrition tip                      |

### External

| Service                                                                               | Usage               |
| ------------------------------------------------------------------------------------- | ------------------- |
| Open Food Facts API (`https://world.openfoodfacts.org/cgi/search.pl`)                 | Food search by name |
| Open Food Facts API (`https://world.openfoodfacts.org/api/v0/product/{barcode}.json`) | Barcode lookup      |

---

## 9. Database Changes (Prisma)

```prisma
model WaterLog {
  id       String   @id @default(cuid())
  userId   String
  user     User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  glasses  Int      @default(0)
  date     DateTime @db.Date  // date-only, no time component — enforces true per-day uniqueness
  loggedAt DateTime @default(now())

  @@unique([userId, date])
}
// Application layer must pass date as UTC midnight: new Date(new Date().toDateString()).toISOString()

model MealTemplate {
  id            String   @id @default(cuid())
  userId        String
  user          User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  name          String
  mealType      String
  items         Json
  totalCalories Int
  totalProteinG Float
  totalCarbsG   Float
  totalFatG     Float
  createdAt     DateTime @default(now())
}
```

---

## 10. Optimistic UI & Error Strategy

- **Meal add:** Optimistic — instant timeline update. Rollback on API failure + toast error.
- **Water update:** Optimistic — instant glass fill. Rollback on failure.
- **Quick add:** Optimistic — spinner inside card, instant count update.
- **Photo analysis error:** Inline error in modal (modal stays open) + Retry button.
- **AI tip error:** Static fallback message shown, never empty card.
- **Network error:** Each section has independent loading state. One failure does not affect others.
- **Rollback pattern:** `prevState` snapshot before every optimistic action. `catch` block restores it.

---

## 11. i18n Architecture

**Library:** `next-intl` — install via `pnpm add next-intl`

**Setup (Phase 1):**

- Add `middleware.ts` at project root with `createMiddleware({ locales: ['tr', 'en'], defaultLocale: 'tr' })`
- Wrap `app/layout.tsx` with `NextIntlClientProvider`
- Locale files: `messages/tr.json`, `messages/en.json`
- Routing: `/tr/dashboard/nutrition` and `/en/dashboard/nutrition`

**Usage:**

- All UI strings via `useTranslations('nutrition')` hook
- API responses: food names remain in source language (Open Food Facts)
- Date/number formatting: `Intl.DateTimeFormat` / `Intl.NumberFormat` with locale

**Phase 1 scope:** TR + EN only. Architecture is ready for 30+ languages in Phase 3.

---

## 12. Phase Boundaries

### Phase 1 — Core Logging (this spec)

- `TodayTab` (CalorieRing, MacroBars, WaterTracker, MealTimeline, QuickAddBar)
- `ExploreTab` (FoodSearchBar, FoodSearchResults, RecentFoods, BarcodeScanner)
- All modals (AddMeal, FoodDetail, Barcode, PhotoAnalyzer)
- DB migration (WaterLog, MealTemplate)
- New API routes
- i18n foundation (TR + EN)

### Phase 2 — History & Insights

- `HistoryTab` (WeeklyChart, MonthlyHeatmap, StatsRow)
- `AiNutritionTip`
- Water goal progress

### Phase 3 — Advanced & Social

- `ProfileTab` + MealTemplates
- Turkish food database (custom DB)
- Friends comparison
- 30+ language i18n expansion

---

## 13. Out of Scope (Phase 1)

- Push notification reminders
- PDF/export reports
- Social feed
- Custom food database (Open Food Facts only for Phase 1)

---

## 14. Success Criteria

- Calorie ring animates at 60fps on first render
- Food search returns results within 500ms (debounced 300ms + API)
- All meal add actions feel instant (optimistic UI)
- No layout breaks at 375px, 768px, 1024px, 1440px
- `prefers-reduced-motion` disables all animations
- Barcode scan identifies product within 2 seconds
- TR/EN language switch works without page reload
