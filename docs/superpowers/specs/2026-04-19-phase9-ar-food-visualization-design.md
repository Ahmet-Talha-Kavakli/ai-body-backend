# Phase 9: AR Food Visualization - Specification

**Date:** 2026-04-19
**Status:** Design In Progress
**Target Timeline:** 5-6 days (balanced approach)
**Success Criteria:** 150+ tests, photorealistic AR food detection, production-ready

---

## 1. Overview

Phase 9 adds augmented reality (AR) food visualization to the mobile app. Users can point their camera at food, instantly see a photorealistic 3D model with calorie and macro estimates, and log the meal to their nutrition tracker with one tap.

**Key Features:**
- Real-time food detection (YOLO v8 nano)
- Photorealistic 3D food models (AI-generated)
- AR overlay with nutrition info (calories, macros)
- Dual mode: real-time detection + photo capture
- Hybrid nutrition database (USDA + GPT-4 Vision)
- Online-first architecture (minimal offline cache)
- Seamless Phase 3 nutrition integration

**Key Differentiator:** Fast, accurate, photorealistic — no model library limitations.

---

## 2. Scope Decisions (Approved)

✅ **Food Detection** — Real-time YOLO v8 nano (50ms, 99%+ accuracy)
✅ **3D Models** — AI-generated photorealistic (Meshy.ai), smart caching
✅ **AR Rendering** — Three.js + React Native Vision Camera
✅ **Nutrition Data** — USDA FoodData Central (primary) + GPT-4 Vision (fallback)
✅ **Dual Mode** — Real-time detection + photo capture with approval screen
✅ **User Corrections** — Allow macro adjustments, system learns
✅ **Offline Strategy** — Online-first, cache popular foods, background sync
✅ **Phase 3 Integration** — Auto-populate MealLog with detected food + photo

---

## 3. Architecture

### 3.1 Data Flow

```
User opens FoodARScreen
  ↓
Vision Camera Feed (30fps real-time stream)
  ↓
YOLO v8 nano Food Detection
  │ (confidence > 0.7)
  ├→ Food identified
  │   ↓
  │   Nutrition lookup (USDA FoodData Central)
  │   ├→ Found: instant result
  │   └→ Not found: GPT-4 Vision estimate
  │   ↓
  │   3D Model generation request (Meshy.ai)
  │   ├→ Cached: instant display
  │   └→ New: generate (3-5s), cache for future
  │   ↓
  │   Three.js AR render (camera overlay)
  │   ├→ 3D food model
  │   ├→ Nutrition label (calories, macros)
  │   ├→ Confidence badge (87%)
  │   └→ User actions (Ekle, Düzelt, Iptal)
  │
  └→ Food not detected: "Try different angle"

User taps "Ekle"
  ↓
MealLog created with:
  ├→ Detected food name
  ├→ Photo snapshot
  ├→ AI-estimated nutrition
  ├→ Confidence score
  └→ User-editable fields
  ↓
Save to Phase 3 Nutrition system
  ↓
Sync to backend (online-first)
```

### 3.2 Databases

**SQLite (Local Cache):**
- `ar_food_models` table: id, foodName, modelUrl, texture, confidence, createdAt
- `ar_detection_cache` table: id, foodName, nutrition, confidence, lastUsed
- `ar_sync_queue` table: id, action, mealLogId, status, retryCount, createdAt

**PostgreSQL (Backend):**
- ar_food_models (store generated 3D models)
- nutrition_logs (already exists in Phase 3)
- ar_detection_history (user's detection history for learning)

**External APIs:**
- **USDA FoodData Central** — 50k+ foods + nutrition (free)
- **Meshy.ai** — 3D model generation from text (paid, $0.01-0.05 per model)
- **OpenAI GPT-4 Vision** — Food recognition + macro estimation (fallback)
- **TensorFlow.js (MoveNet)** — Optional: portion size estimation from pose

---

## 4. Core Features

✅ **Real-Time Food Detection** — YOLO v8 nano, 50ms latency, 99%+ accuracy
✅ **Photorealistic 3D Models** — AI-generated, cached, rotatable/zoomable
✅ **AR Nutrition Overlay** — Calories, protein, carbs, fat, fiber on 3D model
✅ **Dual Mode** — Real-time stream OR photo capture + approval
✅ **Nutrition Database** — USDA (50k) + GPT-4 Vision (fallback)
✅ **User Corrections** — Edit detected food, adjust macros, submit correction
✅ **Photo Logging** — Save detection photo with MealLog
✅ **Confidence Scoring** — Show detection confidence (85%, 92%, etc.)
✅ **Offline Cache** — Popular foods cached, online-first sync
✅ **Phase 3 Integration** — Auto-create MealLog, sync nutrition

---

## 5. Data Models

```typescript
// AR Food Detection Result
interface FoodDetectionResult {
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

// 3D Model Info
interface ARFoodModel {
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

// AR Detection Cache (local)
interface ARDetectionCache {
  id: string
  foodName: string
  nutrition: Nutrition
  modelUrl?: string
  confidence: number
  lastUsed: string
  usageCount: number
}

// AR Sync Queue (offline)
interface ARSyncQueueItem {
  id: string
  action: 'detect_food' | 'create_meal_log' | 'correction_submitted'
  mealLogId: string
  data: FoodDetectionResult
  status: 'pending' | 'synced' | 'failed'
  retryCount: number
  createdAt: string
}

// Nutrition (from Phase 3 - reused)
interface Nutrition {
  calories: number
  proteinG: number
  carbsG: number
  fatG: number
  fiberG: number
  fiber?: number
  glycemicIndex?: number
  allergens?: string[]
}
```

---

## 6. Screens & Components

### Screens (3 total)

**1. FoodARScreen** (main AR view)
- Real-time camera feed (top, full screen)
- Detected food info overlay (bottom sheet)
  - Food name, confidence
  - 3D model preview (rotatable)
  - Nutrition badge (calories, macros)
- Action buttons: "Ekle", "Düzelt", "Iptal"
- Mode toggle: Real-time ↔ Photo Capture
- Settings button (camera permissions, cache, history)

**2. FoodApprovalScreen** (photo capture mode)
- Captured photo (top)
- Detected food name + confidence
- 3D model preview (swipeable)
- Edit fields: food name, macros, portion
- "Confirm & Add" button
- "Try Again" button

**3. FoodARHistoryScreen** (detection history)
- List of recent detections
- Each item: photo, food name, nutrition, timestamp
- Tap to view details or log again
- Search/filter by food name
- Clear history button

### Components (5 total)

**ARFoodOverlay**
- 3D model renderer (Three.js)
- Nutrition label (calories, macros, fiber)
- Confidence badge
- Rotation/zoom gestures

**NutritionBadge**
- Circular display: calories center, macros around
- Color coding (protein=red, carbs=blue, fat=yellow)
- Quick view

**FoodDetectionCard**
- Food name, confidence, portion
- Quick edit buttons
- Timestamp

**ConfidenceIndicator**
- Visual bar (0-100%)
- Color gradient (red→green)
- Text label

**ARCameraOverlay**
- Crosshair for food positioning
- FPS counter (dev mode)
- Detection status ("Detecting...", "Found: Pizza")

---

## 7. Integration Points

**Existing Systems (Phase 1-8):**
- User profiles (Phase 1) — for detection history
- Nutrition logs (Phase 3) — auto-create MealLog with detected food
- Health data (Phase 4) — optional: portion size estimation
- Workouts (Phase 2) — optional: post-workout meal detection
- Analytics (Phase 6) — track detection accuracy, popular foods
- Teams (Phase 8) — optional: team nutrition challenges

**New Services:**
- Food detection service (YOLO v8 nano)
- Nutrition lookup service (USDA + GPT-4 Vision)
- 3D model generation service (Meshy.ai)
- AR rendering service (Three.js)
- AR cache manager (SQLite)

---

## 8. Tech Stack

**Frontend:**
- React Native 0.81.5
- Expo 54
- React Native Vision Camera (camera + real-time processing)
- Three.js (3D rendering)
- TensorFlow.js (optional: pose detection)
- Zustand (state management)

**Backend:**
- PostgreSQL (models, nutrition, history)
- S3/CDN (3D model storage)
- USDA FoodData Central API (free)
- Meshy.ai API (3D generation, ~$0.01-0.05/model)
- OpenAI GPT-4 Vision API (fallback nutrition)

**ML/AI:**
- YOLO v8 nano (food detection, on-device)
- Meshy.ai (3D model generation)
- GPT-4 Vision (nutrition estimation)

---

## 9. Testing Strategy

- **Unit:** 40+ tests (detection, nutrition lookup, cache)
- **Component:** 25+ tests (AR overlay, cards, screens)
- **Integration:** 35+ tests (full detection→logging flow)
- **E2E:** 10+ tests (end-to-end AR experiences)

**Target:** 150+ total tests, 85%+ coverage

---

## 10. Offline Strategy

**Online-First:**
- Every detection attempt requires USDA/GPT-4 lookup
- 3D models generated on-demand (Meshy.ai)
- Results cached locally (SQLite) for next 7 days

**Fallback Cache:**
- Top 100 foods (pizza, burger, salad, etc.) pre-cached with models
- If offline: use cache, queue for sync
- When online: refresh cache, generate new models

**Background Sync:**
- Sync queue for pending detections
- Exponential backoff (1s, 2s, 4s, 8s, 16s)
- Auto-sync on app open, every 30 minutes, on network change

---

## 11. Success Criteria

✅ Real-time food detection works (50ms latency, 99%+ accuracy)
✅ 3D models photorealistic and render smoothly (60fps)
✅ Nutrition data accurate (USDA primary, GPT-4 fallback)
✅ AR overlay smooth and intuitive
✅ Photo capture mode works with approval
✅ User corrections stored and learned
✅ Phase 3 integration seamless (MealLog auto-created)
✅ Offline cache working (popular foods available)
✅ 150+ tests passing
✅ Zero TypeScript errors
✅ No regressions in Phase 1-8 (2312 tests still passing)

---

## 12. Timeline (5-6 days)

- **Day 1-2:** Types + Services (detection, nutrition, 3D models)
- **Day 3:** AR Rendering + Screens
- **Day 4:** Phase 3 Integration + Testing
- **Day 5:** Polish, caching, offline sync
- **Day 6 (buffer):** Documentation + final polish

---

## 13. Dependencies

**Existing (Phase 1-8):**
- User auth, profiles
- Nutrition data (Phase 3)
- Workout data (Phase 2)
- Health data (Phase 4)

**New:**
- YOLO v8 nano model (open source)
- Meshy.ai API key
- OpenAI GPT-4 Vision API key
- React Native Vision Camera library

---

## 14. Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| YOLO detection fails on unusual foods | Use GPT-4 Vision fallback + user correction |
| 3D model generation slow (Meshy.ai) | Cache models, show cached result while new generates |
| AR rendering janky (30fps instead of 60) | Optimize Three.js, use lower polygon models |
| USDA API rate limits | Implement Redis cache on backend, batch requests |
| Meshy.ai API costs high | Use selective generation (high-confidence only), cache aggressively |
| User privacy (food photos) | Encrypt photos, delete after 30 days, user control |

---

## 15. Future Work (Deferred)

- **Phase 10+:** Portion size estimation (MoveNet pose detection)
- **Phase 10+:** Barcode scanning (fallback to detection)
- **Phase 10+:** Meal plan suggestions based on AR detections
- **Phase 10+:** Social sharing of detected foods
- **Phase 10+:** Restaurant menu AR visualization

---

**Status:** ✅ Design complete, ready for user approval
