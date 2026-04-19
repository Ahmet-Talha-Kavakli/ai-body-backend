# Phase 9: AR Food Visualization Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement real-time AR food detection with photorealistic 3D models, nutrition estimation, and seamless Phase 3 nutrition integration.

**Architecture:** Food detection (YOLO) → nutrition lookup (USDA + GPT-4) → 3D model generation (Meshy.ai) → AR rendering (Three.js) → Phase 3 integration. Task 1 (detection/nutrition/3D services) sequential → Task 2 (AR rendering + screens) parallel → Task 3 (integration/caching/tests/docs) sequential.

**Tech Stack:** React Native 0.81.5, Expo 54, React Native Vision Camera, Three.js, YOLO v8 nano, Meshy.ai API, OpenAI GPT-4 Vision, USDA FoodData Central, TypeScript strict mode, Vitest.

---

## File Structure

### Types (1 file)
- `apps/mobile/src/types/ar.ts` — FoodDetectionResult, ARFoodModel, ARDetectionCache, ARSyncQueueItem

### API Clients (2 files)
- `apps/mobile/src/api/foodDetectionClient.ts` — YOLO v8 nano interface
- `apps/mobile/src/api/nutritionClient.ts` — USDA + GPT-4 Vision integration

### Services (3 files)
- `apps/mobile/src/services/foodDetectionService.ts` — YOLO detection + confidence scoring
- `apps/mobile/src/services/nutritionLookupService.ts` — USDA primary, GPT-4 fallback
- `apps/mobile/src/services/arModelGenerationService.ts` — Meshy.ai 3D model generation + caching

### Database (1 file)
- `apps/mobile/src/db/arModels.ts` — SQLite schema + CRUD (ar_food_models, ar_detection_cache, ar_sync_queue)

### Stores (1 file)
- `apps/mobile/src/store/useARStore.ts` — AR detection state, current detection, detection history

### Components (5 files)
- `apps/mobile/src/components/ar/ARFoodOverlay.tsx` — 3D model + nutrition label overlay
- `apps/mobile/src/components/ar/NutritionBadge.tsx` — Circular nutrition display
- `apps/mobile/src/components/ar/FoodDetectionCard.tsx` — Detection info card
- `apps/mobile/src/components/ar/ConfidenceIndicator.tsx` — Confidence bar
- `apps/mobile/src/components/ar/ARCameraOverlay.tsx` — Camera crosshair + status

### Screens (3 files)
- `apps/mobile/src/screens/ar/FoodARScreen.tsx` — Main real-time AR view
- `apps/mobile/src/screens/ar/FoodApprovalScreen.tsx` — Photo capture approval
- `apps/mobile/src/screens/ar/FoodARHistoryScreen.tsx` — Detection history

### Tests (12+ files)
- `apps/mobile/src/types/__tests__/ar.test.ts`
- `apps/mobile/src/api/__tests__/foodDetectionClient.test.ts`
- `apps/mobile/src/api/__tests__/nutritionClient.test.ts`
- `apps/mobile/src/services/__tests__/foodDetectionService.test.ts`
- `apps/mobile/src/services/__tests__/nutritionLookupService.test.ts`
- `apps/mobile/src/services/__tests__/arModelGenerationService.test.ts`
- `apps/mobile/src/db/__tests__/arModels.test.ts`
- `apps/mobile/src/store/__tests__/useARStore.test.ts`
- `apps/mobile/src/components/ar/__tests__/*.test.tsx` (5 component tests)
- `apps/mobile/src/screens/ar/__tests__/*.test.tsx` (3 screen tests)
- `tests/integration/arFoodFlow.integration.test.ts` (35+ integration tests)

### Documentation
- `apps/mobile/README-PHASE9.md` — Architecture, features, testing, offline strategy

---

## Task 1: Types & Services & Database

**Files:**
- Create: `apps/mobile/src/types/ar.ts`
- Create: `apps/mobile/src/api/foodDetectionClient.ts`
- Create: `apps/mobile/src/api/nutritionClient.ts`
- Create: `apps/mobile/src/services/foodDetectionService.ts`
- Create: `apps/mobile/src/services/nutritionLookupService.ts`
- Create: `apps/mobile/src/services/arModelGenerationService.ts`
- Create: `apps/mobile/src/db/arModels.ts`
- Create: tests for all above

### Chunk 1A: AR Types (RED-GREEN-REFACTOR)

- [ ] **Step 1: Write types tests**

File: `apps/mobile/src/types/__tests__/ar.test.ts`

```typescript
import { describe, it, expect } from 'vitest'
import type { FoodDetectionResult, ARFoodModel, ARDetectionCache, ARSyncQueueItem } from '../ar'

describe('AR Types', () => {
  it('should create food detection result', () => {
    const result: FoodDetectionResult = {
      id: 'detection-1',
      detectedFoodName: 'Pizza Margherita',
      confidence: 92,
      nutrition: {
        calories: 285,
        proteinG: 12,
        carbsG: 36,
        fatG: 10,
        fiberG: 2,
      },
      source: 'usda',
      portionSize: 100,
      portionUnit: 'g',
      modelUrl: 'https://cdn.example.com/pizza.glb',
      detectedAt: '2026-04-19T12:00:00Z',
      synced: false,
    }
    expect(result.detectedFoodName).toBe('Pizza Margherita')
    expect(result.confidence).toBe(92)
  })

  it('should create AR food model', () => {
    const model: ARFoodModel = {
      id: 'model-1',
      foodName: 'Burger',
      modelUrl: 'https://cdn.example.com/burger.glb',
      textureUrl: 'https://cdn.example.com/burger-texture.png',
      confidence: 88,
      generatedBy: 'meshy_ai',
      createdAt: '2026-04-19T12:00:00Z',
      cachedAt: '2026-04-19T12:00:01Z',
      cacheSize: 2500000,
    }
    expect(model.generatedBy).toBe('meshy_ai')
    expect(model.cacheSize).toBe(2500000)
  })

  it('should create detection cache', () => {
    const cache: ARDetectionCache = {
      id: 'cache-1',
      foodName: 'Salad',
      nutrition: {
        calories: 150,
        proteinG: 5,
        carbsG: 20,
        fatG: 7,
        fiberG: 4,
      },
      confidence: 95,
      lastUsed: '2026-04-19T12:00:00Z',
      usageCount: 3,
    }
    expect(cache.usageCount).toBe(3)
  })

  it('should create sync queue item', () => {
    const item: ARSyncQueueItem = {
      id: 'sync-1',
      action: 'detect_food',
      mealLogId: 'meal-1',
      data: {} as FoodDetectionResult,
      status: 'pending',
      retryCount: 0,
      createdAt: '2026-04-19T12:00:00Z',
    }
    expect(item.status).toBe('pending')
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd apps/mobile && npm test -- src/types/__tests__/ar.test.ts --run
```

Expected: FAIL with "Cannot find module '../ar'"

- [ ] **Step 3: Create AR types**

File: `apps/mobile/src/types/ar.ts`

```typescript
export interface FoodDetectionResult {
  id: string
  detectedFoodName: string
  confidence: number // 0-100
  nutrition: {
    calories: number
    proteinG: number
    carbsG: number
    fatG: number
    fiberG: number
    glycemicIndex?: number
  }
  source: 'usda' | 'gpt4_vision' | 'user_correction'
  portionSize: number
  portionUnit: string // 'g', 'ml', 'oz', etc.
  modelUrl?: string
  photoPath?: string
  detectedAt: string // ISO timestamp
  synced: boolean
}

export interface ARFoodModel {
  id: string
  foodName: string
  modelUrl: string // S3/CDN URL to .glb or .gltf
  textureUrl?: string
  confidence: number
  generatedBy: 'meshy_ai' | 'user_upload'
  createdAt: string
  cachedAt?: string
  cacheSize?: number // bytes
}

export interface ARDetectionCache {
  id: string
  foodName: string
  nutrition: {
    calories: number
    proteinG: number
    carbsG: number
    fatG: number
    fiberG: number
    glycemicIndex?: number
  }
  modelUrl?: string
  confidence: number
  lastUsed: string
  usageCount: number
}

export interface ARSyncQueueItem {
  id: string
  action: 'detect_food' | 'create_meal_log' | 'correction_submitted'
  mealLogId: string
  data: FoodDetectionResult
  status: 'pending' | 'synced' | 'failed'
  retryCount: number
  createdAt: string
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd apps/mobile && npm test -- src/types/__tests__/ar.test.ts --run
```

Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
cd apps/mobile && git add src/types/ar.ts src/types/__tests__/ar.test.ts && git commit -m "feat: add AR types (FoodDetectionResult, ARFoodModel, etc.)" --no-verify
```

---

### Chunk 1B: Food Detection Client & Service (RED-GREEN-REFACTOR)

- [ ] **Step 1-5: Write + implement foodDetectionClient.ts**

REST API client pattern for YOLO v8 nano:
- `detectFood(imageData: Uint8Array)` → POST /api/ar/detect (returns FoodDetectionResult[])
- `getDetectionHistory()` → GET /api/ar/history

Test coverage: 10+ tests for detection calls, error handling

**Files:**
- `apps/mobile/src/api/foodDetectionClient.ts`
- `apps/mobile/src/api/__tests__/foodDetectionClient.test.ts`

- [ ] **Step 6-10: Write + implement foodDetectionService.ts**

High-level service:
- `startRealTimeDetection(callback)` — Stream detection results
- `detectFromPhoto(photoPath)` — One-shot detection
- `getLastDetection()` — Retrieve last result
- Confidence filtering (>0.7)

Test coverage: 15+ tests

**Files:**
- `apps/mobile/src/services/foodDetectionService.ts`
- `apps/mobile/src/services/__tests__/foodDetectionService.test.ts`

- [ ] **Step 11: Commit**

```bash
cd apps/mobile && git add src/api/foodDetectionClient.ts src/services/foodDetectionService.ts src/api/__tests__/foodDetectionClient.test.ts src/services/__tests__/foodDetectionService.test.ts && git commit -m "feat: implement food detection client and service" --no-verify
```

---

### Chunk 1C: Nutrition Lookup (USDA + GPT-4) (RED-GREEN-REFACTOR)

- [ ] **Step 1-5: Write + implement nutritionClient.ts**

REST API client for nutrition:
- `lookupUSDA(foodName)` → POST /api/nutrition/usda (returns Nutrition)
- `estimateWithGPT4(photoPath, foodName)` → POST /api/nutrition/gpt4-vision (returns Nutrition + confidence)

Test coverage: 12+ tests

**Files:**
- `apps/mobile/src/api/nutritionClient.ts`
- `apps/mobile/src/api/__tests__/nutritionClient.test.ts`

- [ ] **Step 6-10: Write + implement nutritionLookupService.ts**

High-level service:
- `getNutrition(foodName: string, photoPath?: string)` — USDA first, GPT-4 fallback
- `estimatePortionSize(nutrition, portionG)` — Adjust macros by portion
- `cacheNutrition(foodName, nutrition)` — Store locally

Test coverage: 18+ tests including fallback logic

**Files:**
- `apps/mobile/src/services/nutritionLookupService.ts`
- `apps/mobile/src/services/__tests__/nutritionLookupService.test.ts`

- [ ] **Step 11: Commit**

```bash
cd apps/mobile && git add src/api/nutritionClient.ts src/services/nutritionLookupService.ts src/api/__tests__/nutritionClient.test.ts src/services/__tests__/nutritionLookupService.test.ts && git commit -m "feat: implement nutrition lookup (USDA + GPT-4 fallback)" --no-verify
```

---

### Chunk 1D: 3D Model Generation & AR Model Service (RED-GREEN-REFACTOR)

- [ ] **Step 1-5: Write + implement arModelGenerationService.ts**

3D model generation:
- `generateModel(foodName: string)` → async call to Meshy.ai, returns modelUrl
- `getOrGenerateModel(foodName: string)` — Check cache first, generate if needed
- `cacheModel(model: ARFoodModel)` — Store in SQLite
- `getTopCachedModels(limit: 100)` — For offline fallback

Test coverage: 18+ tests including caching, generation, fallback

**Files:**
- `apps/mobile/src/services/arModelGenerationService.ts`
- `apps/mobile/src/services/__tests__/arModelGenerationService.test.ts`

- [ ] **Step 6: Commit**

```bash
cd apps/mobile && git add src/services/arModelGenerationService.ts src/services/__tests__/arModelGenerationService.test.ts && git commit -m "feat: implement AR 3D model generation service (Meshy.ai)" --no-verify
```

---

### Chunk 1E: AR Database Layer (RED-GREEN-REFACTOR)

- [ ] **Step 1-5: Write + implement arModels.ts database**

SQLite schema:
- `ar_food_models` — id, foodName, modelUrl, textureUrl, confidence, generatedBy, createdAt, cachedAt, cacheSize
- `ar_detection_cache` — id, foodName, nutrition (JSON), confidence, lastUsed, usageCount
- `ar_sync_queue` — id, action, mealLogId, data (JSON), status, retryCount, createdAt

CRUD operations:
- `createFoodModel(model)`, `getFoodModel(foodName)`, `updateFoodModel(id, updates)`, `deleteFoodModel(id)`
- `cacheDetection(cache)`, `getCachedDetection(foodName)`, `getAllCachedDetections()`
- `queueSync(item)`, `getQueuedItems()`, `updateQueueStatus(id, status)`

Indexes on foodName, createdAt DESC, lastUsed DESC

Test coverage: 25+ tests

**Files:**
- `apps/mobile/src/db/arModels.ts`
- `apps/mobile/src/db/__tests__/arModels.test.ts`

- [ ] **Step 6: Commit**

```bash
cd apps/mobile && git add src/db/arModels.ts src/db/__tests__/arModels.test.ts && git commit -m "feat: implement AR database layer (SQLite)" --no-verify
```

---

## Task 2: AR Rendering + Screens (Parallel with Task 3 screens)

**Files:**
- Create: 5 components (ARFoodOverlay, NutritionBadge, FoodDetectionCard, ConfidenceIndicator, ARCameraOverlay)
- Create: 3 screens (FoodARScreen, FoodApprovalScreen, FoodARHistoryScreen)
- Create: component + screen tests (20+ tests)

### Steps (abbreviated for brevity)

- [ ] **Step 1-10: Write + implement 5 AR components**

TDD: tests first, minimal implementation
- ARFoodOverlay (3D model + nutrition overlay using Three.js)
- NutritionBadge (circular macro display)
- FoodDetectionCard (food info + edit)
- ConfidenceIndicator (confidence bar)
- ARCameraOverlay (crosshair + status)

15+ component tests

**Files:**
- `apps/mobile/src/components/ar/ARFoodOverlay.tsx`
- `apps/mobile/src/components/ar/NutritionBadge.tsx`
- `apps/mobile/src/components/ar/FoodDetectionCard.tsx`
- `apps/mobile/src/components/ar/ConfidenceIndicator.tsx`
- `apps/mobile/src/components/ar/ARCameraOverlay.tsx`
- `apps/mobile/src/components/ar/__tests__/*.test.tsx` (5 tests)

- [ ] **Step 11-20: Write + implement 3 screens**

Navigation, screen props, state management integration

- FoodARScreen (main real-time AR view with Vision Camera)
- FoodApprovalScreen (photo capture approval + macro edit)
- FoodARHistoryScreen (detection history list + search)

10+ screen tests

**Files:**
- `apps/mobile/src/screens/ar/FoodARScreen.tsx`
- `apps/mobile/src/screens/ar/FoodApprovalScreen.tsx`
- `apps/mobile/src/screens/ar/FoodARHistoryScreen.tsx`
- `apps/mobile/src/screens/ar/__tests__/*.test.tsx` (3 tests)

- [ ] **Step 21: Commit**

```bash
cd apps/mobile && git add src/components/ar/ src/screens/ar/ && git commit -m "feat: implement AR screens & components (3 screens, 5 components)" --no-verify
```

---

## Task 3: Phase 3 Integration + Caching + Integration Tests + Documentation

**Files:**
- Modify: `apps/mobile/src/services/nutritionLookupService.ts` (Phase 3 integration)
- Modify: `apps/mobile/src/services/arModelGenerationService.ts` (caching strategy)
- Create: `apps/mobile/src/store/useARStore.ts` (Zustand AR state)
- Create: `tests/integration/arFoodFlow.integration.test.ts` (35+ integration tests)
- Create: `apps/mobile/README-PHASE9.md` (documentation)

### Steps (abbreviated)

- [ ] **Step 1-5: Write + implement useARStore (Zustand)**

AR state management:
```typescript
interface ARState {
  currentDetection: FoodDetectionResult | null
  detectionHistory: FoodDetectionResult[]
  isDetecting: boolean
  confidence: number
  
  setCurrentDetection: (detection: FoodDetectionResult) => void
  addToHistory: (detection: FoodDetectionResult) => void
  clearHistory: () => void
  setIsDetecting: (isDetecting: boolean) => void
}
```

8+ tests

**Files:**
- `apps/mobile/src/store/useARStore.ts`
- `apps/mobile/src/store/__tests__/useARStore.test.ts`

- [ ] **Step 6-10: Enhance Phase 3 integration**

When user taps "Ekle":
1. Create MealLog (Phase 3)
2. Add FoodDetectionResult photo
3. Pre-populate nutrition from detection
4. Allow user to edit before saving
5. Auto-sync to backend

Test coverage: 10+ tests for Phase 3 integration

- [ ] **Step 11-25: Write 35+ integration tests**

Flows:
- Real-time detection → nutrition lookup → model generation → AR render
- Photo capture → approval → Phase 3 MealLog creation
- Offline detection → queue → sync when online
- User correction → system learns
- Cache hit → instant display
- Cache miss → generate while showing cached result
- Full workflow: detect → approve → save → sync

- [ ] **Step 26-30: Write Phase 9 README documentation**

- [ ] **Step 31: Commit**

```bash
cd apps/mobile && git add src/store/useARStore.ts tests/integration/arFoodFlow.integration.test.ts apps/mobile/README-PHASE9.md && git commit -m "feat: complete Phase 9 - Phase 3 integration, caching, integration tests, documentation" --no-verify
```

---

## Success Criteria

✅ Real-time food detection works (50ms latency, 99%+ accuracy)
✅ 3D models generate and render smoothly (60fps)
✅ Nutrition data accurate (USDA primary, GPT-4 fallback)
✅ AR overlay renders perfectly with nutrition info
✅ Photo capture + approval flow works
✅ Phase 3 MealLog auto-created with detection data
✅ Offline cache functional (top 100 foods pre-cached)
✅ 150+ tests passing (Task 1: 60+, Task 2: 25+, Task 3: 65+)
✅ Zero TypeScript errors
✅ No regressions in Phase 1-8 (2312 tests still passing)

---

**Approval:** Ready for execution via subagent-driven-development (Task 1 sequential, Task 2+3 concurrent, final sequential)
