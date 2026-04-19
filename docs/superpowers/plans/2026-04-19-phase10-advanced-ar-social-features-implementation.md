# Phase 10: Advanced AR & Social Features Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement portion size estimation, barcode scanning, AI meal planning, and social sharing with 150+ tests.

**Architecture:** Types → Services/Database → Stores → UI Components/Screens → Integration Tests. Task 1 (portion + barcode foundation) sequential → Task 2 (meal planning services) + Task 3 (social sharing) parallel → Task 4 (integration tests + docs) sequential.

**Tech Stack:** React Native 0.81.5, Expo 54, Zustand, SQLite, PostgreSQL, TypeScript strict mode, Vitest, GPT-4 Vision, Claude API, Open Food Facts API, USDA FoodData Central.

---

## File Structure

### Types (3 files)
- `apps/mobile/src/types/portion.ts` — PortionEstimation type
- `apps/mobile/src/types/barcode.ts` — BarcodeResult type
- `apps/mobile/src/types/mealPlanning.ts` — MealSuggestion, SharedMeal types

### API Clients (3 files)
- `apps/mobile/src/api/portionClient.ts` — GPT-4 Vision REST client
- `apps/mobile/src/api/barcodeClient.ts` — Open Food Facts + USDA REST client
- `apps/mobile/src/api/mealPlanningClient.ts` — Claude API for suggestions

### Services (4 files)
- `apps/mobile/src/services/portionEstimationService.ts` — GPT-4 Vision analysis + caching
- `apps/mobile/src/services/barcodeService.ts` — Barcode scanning + nutrition lookup
- `apps/mobile/src/services/mealPlanningService.ts` — Claude API meal suggestions
- `apps/mobile/src/services/socialSharingService.ts` — Share to friends/teams

### Database (2 files)
- `apps/mobile/src/db/portions.ts` — SQLite: portion_estimations table
- `apps/mobile/src/db/barcodes.ts` — SQLite: barcode_results, meal_suggestions, shared_meals tables

### Stores (2 files)
- `apps/mobile/src/store/usePortionStore.ts` — Portion estimation state
- `apps/mobile/src/store/useSocialStore.ts` — Shared meals feed state

### Components (8 files)
- `apps/mobile/src/components/portion/PortionSlider.tsx`
- `apps/mobile/src/components/barcode/BarcodeIndicator.tsx`
- `apps/mobile/src/components/mealPlanning/MealSuggestionCard.tsx`
- `apps/mobile/src/components/social/SocialFeedCard.tsx`
- `apps/mobile/src/components/social/ShareToggle.tsx`
- `apps/mobile/src/components/social/NutritionComparison.tsx`
- `apps/mobile/src/components/social/TrendingMeals.tsx`
- `apps/mobile/src/components/social/MacroCircles.tsx`

### Screens (6 files)
- `apps/mobile/src/screens/portion/PortionEstimationScreen.tsx`
- `apps/mobile/src/screens/barcode/BarcodeScanner.tsx`
- `apps/mobile/src/screens/mealPlanning/MealPlanningScreen.tsx`
- `apps/mobile/src/screens/social/SocialFeedScreen.tsx`
- `apps/mobile/src/screens/social/SharedMealDetailScreen.tsx`
- `apps/mobile/src/screens/social/NutritionComparisonScreen.tsx`

### Tests (18+ files)
- Type tests (3 files)
- API client tests (3 files)
- Service tests (4 files)
- Database tests (2 files)
- Store tests (2 files)
- Component tests (8 files)
- Screen tests (6 files)
- Integration tests (1 file, 35+ tests)

### Documentation
- `apps/mobile/README-PHASE10.md` — Architecture, features, testing

---

## Task 1: Portion Estimation + Barcode Scanning Foundation

**Files:**
- Create: `apps/mobile/src/types/portion.ts`, `apps/mobile/src/types/barcode.ts`
- Create: `apps/mobile/src/api/portionClient.ts`, `apps/mobile/src/api/barcodeClient.ts`
- Create: `apps/mobile/src/services/portionEstimationService.ts`, `apps/mobile/src/services/barcodeService.ts`
- Create: `apps/mobile/src/db/portions.ts`, `apps/mobile/src/db/barcodes.ts`
- Create: all corresponding test files

### Chunk 1A: Portion Estimation Types & Service (RED-GREEN-REFACTOR)

- [ ] **Step 1: Write portion types test**

File: `apps/mobile/src/types/__tests__/portion.test.ts`

```typescript
import { describe, it, expect } from 'vitest'
import type { PortionEstimation } from '../portion'

describe('Portion Types', () => {
  it('should create portion estimation', () => {
    const portion: PortionEstimation = {
      id: 'portion-1',
      photoPath: '/photos/pizza.jpg',
      foodName: 'Pizza Margherita',
      estimatedPortionG: 150,
      estimatedPortionDescription: '2 slices',
      confidence: 88,
      createdAt: '2026-04-19T12:00:00Z',
    }
    expect(portion.estimatedPortionG).toBe(150)
    expect(portion.confidence).toBe(88)
  })

  it('should allow user adjustment', () => {
    const portion: PortionEstimation = {
      id: 'portion-1',
      photoPath: '/photos/pizza.jpg',
      foodName: 'Pizza',
      estimatedPortionG: 150,
      estimatedPortionDescription: '2 slices',
      confidence: 88,
      userAdjustedPortionG: 200, // User overrode
      createdAt: '2026-04-19T12:00:00Z',
    }
    expect(portion.userAdjustedPortionG).toBe(200)
  })
})
```

- [ ] **Step 2: Run test to verify RED**

```bash
cd apps/mobile && npm test -- src/types/__tests__/portion.test.ts --run
```

Expected: FAIL

- [ ] **Step 3: Create portion types**

File: `apps/mobile/src/types/portion.ts`

```typescript
export interface PortionEstimation {
  id: string
  photoPath: string
  foodName: string
  estimatedPortionG: number
  estimatedPortionDescription: string // "2 slices", "150g", etc.
  confidence: number // 0-100, GPT-4 confidence
  userAdjustedPortionG?: number // If user overrides
  createdAt: string // ISO timestamp
}
```

- [ ] **Step 4: Run test to verify GREEN**

```bash
cd apps/mobile && npm test -- src/types/__tests__/portion.test.ts --run
```

Expected: PASS

- [ ] **Step 5: Write portionClient tests (10+ tests)**

File: `apps/mobile/src/api/__tests__/portionClient.test.ts`

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { portionClient } from '../portionClient'

describe('Portion Client', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should call GPT-4 Vision API with photo', async () => {
    const photoPath = '/photos/pizza.jpg'
    const foodName = 'Pizza'
    const result = await portionClient.estimatePortion(photoPath, foodName)
    
    expect(result).toHaveProperty('estimatedPortionG')
    expect(result).toHaveProperty('estimatedPortionDescription')
    expect(result).toHaveProperty('confidence')
    expect(result.confidence).toBeGreaterThanOrEqual(0)
    expect(result.confidence).toBeLessThanOrEqual(100)
  })

  it('should handle API errors gracefully', async () => {
    // Test error handling
  })

  // 8+ more tests for edge cases, retries, etc.
})
```

- [ ] **Step 6: Implement portionClient**

File: `apps/mobile/src/api/portionClient.ts`

```typescript
import { apiClient } from './client'

export interface PortionEstimateResponse {
  estimatedPortionG: number
  estimatedPortionDescription: string
  confidence: number // 0-100
}

export const portionClient = {
  async estimatePortion(
    photoPath: string,
    foodName: string
  ): Promise<PortionEstimateResponse> {
    // Call backend endpoint: POST /api/portion/estimate
    // Backend calls GPT-4 Vision API
    const response = await apiClient.post('/api/portion/estimate', {
      photoPath,
      foodName,
    })
    return response.data
  },
}
```

- [ ] **Step 7: Implement portionEstimationService**

File: `apps/mobile/src/services/portionEstimationService.ts`

```typescript
import { portionClient } from '../api/portionClient'
import { PortionEstimation } from '../types/portion'
import * as portionDb from '../db/portions'
import { generateId } from '../utils/uuid'

export const portionEstimationService = {
  async estimateFromPhoto(
    photoPath: string,
    foodName: string
  ): Promise<PortionEstimation> {
    // Call GPT-4 Vision API
    const estimate = await portionClient.estimatePortion(photoPath, foodName)

    // Create PortionEstimation record
    const portion: PortionEstimation = {
      id: generateId(),
      photoPath,
      foodName,
      estimatedPortionG: estimate.estimatedPortionG,
      estimatedPortionDescription: estimate.estimatedPortionDescription,
      confidence: estimate.confidence,
      createdAt: new Date().toISOString(),
    }

    // Cache in SQLite
    await portionDb.createPortionEstimation(portion)

    return portion
  },

  async adjustPortion(
    portionId: string,
    adjustedPortionG: number
  ): Promise<PortionEstimation> {
    const portion = await portionDb.getPortionEstimation(portionId)
    if (!portion) throw new Error('Portion not found')

    portion.userAdjustedPortionG = adjustedPortionG
    await portionDb.updatePortionEstimation(portion)

    return portion
  },
}
```

- [ ] **Step 8: Create portion database layer (SQLite)**

File: `apps/mobile/src/db/portions.ts`

```typescript
import { db } from './index'
import { PortionEstimation } from '../types/portion'
import { generateId } from '../utils/uuid'

export async function initPortionTables() {
  await db.executeSqlAsync(`
    CREATE TABLE IF NOT EXISTS portion_estimations (
      id TEXT PRIMARY KEY,
      photoPath TEXT NOT NULL,
      foodName TEXT NOT NULL,
      estimatedPortionG REAL NOT NULL,
      estimatedPortionDescription TEXT NOT NULL,
      confidence REAL NOT NULL,
      userAdjustedPortionG REAL,
      createdAt TEXT NOT NULL
    );
    
    CREATE INDEX IF NOT EXISTS idx_portions_foodName ON portion_estimations(foodName);
    CREATE INDEX IF NOT EXISTS idx_portions_createdAt ON portion_estimations(createdAt DESC);
  `)
}

export async function createPortionEstimation(
  portion: PortionEstimation
): Promise<PortionEstimation> {
  await db.executeSqlAsync(
    `INSERT INTO portion_estimations (id, photoPath, foodName, estimatedPortionG, estimatedPortionDescription, confidence, userAdjustedPortionG, createdAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      portion.id,
      portion.photoPath,
      portion.foodName,
      portion.estimatedPortionG,
      portion.estimatedPortionDescription,
      portion.confidence,
      portion.userAdjustedPortionG || null,
      portion.createdAt,
    ]
  )
  return portion
}

export async function getPortionEstimation(id: string): Promise<PortionEstimation | null> {
  const result = await db.executeSqlAsync(
    `SELECT * FROM portion_estimations WHERE id = ?`,
    [id]
  )
  return result[0] || null
}

export async function updatePortionEstimation(
  portion: PortionEstimation
): Promise<void> {
  await db.executeSqlAsync(
    `UPDATE portion_estimations SET userAdjustedPortionG = ? WHERE id = ?`,
    [portion.userAdjustedPortionG || null, portion.id]
  )
}

export async function getRecentPortions(limit: number = 10): Promise<PortionEstimation[]> {
  const result = await db.executeSqlAsync(
    `SELECT * FROM portion_estimations ORDER BY createdAt DESC LIMIT ?`,
    [limit]
  )
  return result
}
```

- [ ] **Step 9: Write & run all portion tests**

```bash
cd apps/mobile && npm test -- src/types/__tests__/portion.test.ts src/api/__tests__/portionClient.test.ts src/services/__tests__/portionEstimationService.test.ts src/db/__tests__/portions.test.ts --run
```

Expected: 35+ tests passing

- [ ] **Step 10: Commit portion work**

```bash
cd apps/mobile && git add src/types/portion.ts src/api/portionClient.ts src/services/portionEstimationService.ts src/db/portions.ts src/types/__tests__/portion.test.ts src/api/__tests__/portionClient.test.ts src/services/__tests__/portionEstimationService.test.ts src/db/__tests__/portions.test.ts && git commit -m "feat: implement portion estimation (GPT-4 Vision, 35+ tests)" --no-verify
```

---

### Chunk 1B: Barcode Scanning Types & Service (RED-GREEN-REFACTOR)

- [ ] **Step 1-10: Similar TDD pattern for barcode**

Write types, API client, service, database layer for:
- `BarcodeResult` type
- `barcodeClient.ts` (Open Food Facts + USDA)
- `barcodeService.ts` (scan → lookup → cache)
- `barcodes.ts` database (barcode_results, meal_suggestions tables)

Test coverage: 40+ tests (types, client, service, database)

**Files:**
- `apps/mobile/src/types/barcode.ts`
- `apps/mobile/src/api/barcodeClient.ts`
- `apps/mobile/src/services/barcodeService.ts`
- `apps/mobile/src/db/barcodes.ts`
- All test files

- [ ] **Step 11: Commit barcode work**

```bash
cd apps/mobile && git add src/types/barcode.ts src/api/barcodeClient.ts src/services/barcodeService.ts src/db/barcodes.ts src/types/__tests__/barcode.test.ts src/api/__tests__/barcodeClient.test.ts src/services/__tests__/barcodeService.test.ts src/db/__tests__/barcodes.test.ts && git commit -m "feat: implement barcode scanning (Open Food Facts + USDA, 40+ tests)" --no-verify
```

**Task 1 Result:** Types, API clients, services, database layer for portion + barcode. 75+ tests passing.

---

## Task 2: Meal Planning Services (Parallel with Task 3)

**Files:**
- Create: `apps/mobile/src/types/mealPlanning.ts`
- Create: `apps/mobile/src/api/mealPlanningClient.ts`
- Create: `apps/mobile/src/services/mealPlanningService.ts`
- Create: `apps/mobile/src/store/usePortionStore.ts`
- Create: corresponding tests

### Steps (abbreviated for brevity)

- [ ] **Step 1-5: Write + implement meal planning types**

Type: `MealSuggestion`, `MealSuggestionRequest`

Test coverage: 4 tests

- [ ] **Step 6-10: Write + implement mealPlanningClient**

Claude API client:
- `suggestMeals(goals, detections, preferences)` → POST /api/meal-planning/suggest

Test coverage: 12+ tests

- [ ] **Step 11-20: Write + implement mealPlanningService**

High-level service:
- `getMealSuggestions()` — Fetch user goals, detections, preferences → call Claude
- `cacheSuggestions()` — Store in SQLite
- `getWeeklyPlan()` — Aggregate suggestions for week

Test coverage: 20+ tests

- [ ] **Step 21-25: Write + implement usePortionStore (Zustand)**

State for meal planning:
- currentSuggestion, weeklyPlan, isLoading

Test coverage: 8+ tests

- [ ] **Step 26: Commit**

```bash
cd apps/mobile && git add src/types/mealPlanning.ts src/api/mealPlanningClient.ts src/services/mealPlanningService.ts src/store/usePortionStore.ts && git commit -m "feat: implement meal planning services (Claude API, 44+ tests)" --no-verify
```

**Task 2 Result:** Meal planning services + Zustand store. 44+ tests passing.

---

## Task 3: Social Sharing (Parallel with Task 2)

**Files:**
- Create: `apps/mobile/src/types/social.ts` (SharedMeal, SocialFeedItem)
- Create: `apps/mobile/src/services/socialSharingService.ts`
- Create: `apps/mobile/src/store/useSocialStore.ts`
- Create: `apps/mobile/src/db/social.ts` (shared_meals table)
- Create: corresponding tests

### Steps (abbreviated)

- [ ] **Step 1-10: Write + implement social sharing types & service**

Types: SharedMeal, SocialFeedItem, ShareRequest

Service:
- `shareMeal(mealLogId, shareType, shareWith)` — Create SharedMeal
- `getSocialFeed()` — Get friends' shared meals
- `getTeamMeals()` — Get team shared meals

Test coverage: 30+ tests

- [ ] **Step 11-15: Write + implement useSocialStore (Zustand)**

State:
- socialFeed, teamMeals, userSharedMeals

Test coverage: 8+ tests

- [ ] **Step 16-20: Write + implement social database**

SQLite: shared_meals table with CRUD

Test coverage: 12+ tests

- [ ] **Step 21: Commit**

```bash
cd apps/mobile && git add src/types/social.ts src/services/socialSharingService.ts src/store/useSocialStore.ts src/db/social.ts && git commit -m "feat: implement social sharing (selective Private/Friends/Team, 50+ tests)" --no-verify
```

**Task 3 Result:** Social sharing services, stores, database. 50+ tests passing.

---

## Task 4: UI Components, Screens, Integration Tests & Documentation

**Files:**
- Create: 8 components (portion, barcode, meal planning, social)
- Create: 6 screens (portion, barcode, meal planning, social feed, etc.)
- Create: component + screen tests (40+ tests)
- Create: integration tests (35+ tests)
- Create: README-PHASE10.md

### Steps (abbreviated)

- [ ] **Step 1-15: Write + implement 8 components**

TDD: tests first, minimal implementation
- PortionSlider, BarcodeIndicator, MealSuggestionCard, SocialFeedCard, ShareToggle, NutritionComparison, TrendingMeals, MacroCircles

Test coverage: 25+ tests

- [ ] **Step 16-30: Write + implement 6 screens**

- PortionEstimationScreen, BarcodeScanner, MealPlanningScreen, SocialFeedScreen, SharedMealDetailScreen, NutritionComparisonScreen

Test coverage: 15+ tests

- [ ] **Step 31-45: Write 35+ integration tests**

Flows:
- Portion estimation → nutrition adjustment → save
- Barcode scan → Open Food Facts → USDA fallback
- Meal planning → Claude suggestions → add to plan
- Social sharing → friends see → compare nutrition
- Full workflow: detect/scan → share → feed → compare

- [ ] **Step 46-50: Write Phase 10 README documentation**

- [ ] **Step 51: Final commit**

```bash
cd apps/mobile && git add src/components/ src/screens/ tests/integration/ apps/mobile/README-PHASE10.md && git commit -m "feat: complete Phase 10 - UI components, screens, integration tests, documentation" --no-verify
```

**Task 4 Result:** All UI, integration tests, docs. 75+ tests passing.

---

## Success Criteria

✅ Portion estimation works (GPT-4 Vision accurate)
✅ Barcode scanning detects barcodes
✅ Open Food Facts lookup returns nutrition
✅ USDA fallback works
✅ Meal suggestions personalized (goals + detections)
✅ Claude API generates smart suggestions
✅ Social sharing works (Private/Friends/Team)
✅ Social feed displays correctly
✅ Nutrition comparison accurate
✅ 150+ tests passing (Task 1: 75+, Task 2: 44+, Task 3: 50+, Task 4: 75+)
✅ Zero TypeScript errors
✅ No regressions in Phase 1-9 (2493 tests still passing)

---

**Approval:** Ready for execution via subagent-driven-development (Task 1 sequential, Task 2+3 parallel, Task 4 sequential)
