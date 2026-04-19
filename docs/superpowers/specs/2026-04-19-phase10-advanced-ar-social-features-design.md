# Phase 10: Advanced AR & Social Features - Specification

**Date:** 2026-04-19
**Status:** Approved Design
**Target Timeline:** 10-12 days (4 parallel tasks)
**Success Criteria:** 150+ tests, full advanced AR + social features, production-ready

---

## 1. Overview

Phase 10 adds four advanced features to enhance AR food detection and enable social collaboration:

1. **Portion Size Estimation** — AI-powered portion estimation from food photos (GPT-4 Vision)
2. **Barcode Scanning** — Quick nutrition lookup via barcode (Open Food Facts + USDA)
3. **AI Meal Planning** — Personalized meal suggestions based on goals and preferences
4. **Social Sharing** — Share detected meals with friends and teams selectively

**Key Differentiator:** Combines AI vision (portion estimation), barcode convenience, smart recommendations, and social features into one cohesive advanced system.

---

## 2. Scope Decisions (Approved)

✅ **Portion Size Estimation** — GPT-4 Vision image analysis (no special setup required)
✅ **Barcode Scanning** — Open Food Facts primary + USDA fallback (2M+ coverage)
✅ **AI Meal Planning** — Goals + Past Detections + Claude API (personalized)
✅ **Social Sharing** — Selective: Private/Friends/Team (user control)
✅ **Integration** — Phase 3 (nutrition), Phase 6 (analytics), Phase 8 (teams), Phase 9 (AR)
✅ **Offline Strategy** — Cache popular foods, barcode results, meal suggestions
✅ **Testing** — 150+ tests (unit, component, integration)

---

## 3. Architecture

### 3.1 Data Flow

```
FEATURE 1: Portion Size Estimation
─────────────────────────────────
AR Detection photo
  ↓
GPT-4 Vision analysis ("estimate portion size")
  ↓
Response: "approximately 150g" or "2 slices"
  ↓
Nutrition adjusted by portion
  ↓
User can override if needed

FEATURE 2: Barcode Scanning
───────────────────────────
User opens barcode scanner
  ↓
Camera scans barcode (EAN-13, UPC, etc.)
  ↓
Query Open Food Facts API
  ├→ Found: return nutrition, cached
  └→ Not found: Query USDA
      ├→ Found: return nutrition, cached
      └→ Not found: "Product not found"
  ↓
Create MealLog (Phase 3) with barcode nutrition
  ↓
Sync to backend

FEATURE 3: AI Meal Planning
──────────────────────────
User opens Meal Planning screen
  ↓
Fetch user's nutrition goal (Phase 3)
  ↓
Fetch user's AR detection history (Phase 9)
  ↓
Fetch user's preferences from analytics (Phase 6)
  ↓
Call Claude API: "Given goal X, eaten Y, likes Z → suggest 3 meals"
  ↓
Display suggestions with nutritional info
  ↓
User can tap to add to meal plan

FEATURE 4: Social Sharing
────────────────────────
User detects/scans food
  ↓
Show detection with "Share?" toggle
  ├→ Private: Store locally only
  ├→ Friends: Send to Phase 5 friends list
  └→ Team: Send to Phase 8 team
  ↓
Shared meal appears in friends' feed (new SocialFeed screen)
  ↓
Friends can see: Photo + food name + nutrition + timestamp
  ↓
Friends can compare/react (optional: like, comment)
```

### 3.2 Databases

**SQLite (Local Cache):**
- `portion_estimations` table: id, photoPath, foodName, estimatedPortionG, confidence, createdAt
- `barcode_results` table: id, barcode, foodName, nutrition (JSON), source ('openfoodfacts' | 'usda'), cachedAt
- `meal_suggestions` table: id, userId, mealName, nutrition (JSON), reasonForSuggestion, createdAt
- `shared_meals` table: id, mealLogId, userId, shareType ('private' | 'friends' | 'team'), sharedWith (JSON), createdAt

**PostgreSQL (Backend):**
- portion_estimations (store user's portion adjustments for ML training)
- shared_meals (social feed data)
- meal_suggestions (user preferences, trending)
- barcode_cache (global barcode→nutrition mapping)

**External APIs:**
- **GPT-4 Vision** — Portion estimation from photos
- **Open Food Facts API** — 2M+ barcode→nutrition
- **USDA FoodData Central** — 50k+ foods (fallback)
- **Claude API** — Meal planning suggestions

---

## 4. Core Features

✅ **Portion Size Estimation** — GPT-4 Vision estimates portion from photo (in grams or slices)
✅ **Barcode Scanning** — Real-time barcode detection + Open Food Facts lookup
✅ **USDA Fallback** — If barcode not in Open Food Facts, try USDA
✅ **Portion Adjustment** — User can override AI estimation
✅ **AI Meal Planning** — Personalized 3-5 meal suggestions daily
✅ **Preference Learning** — System learns from user's AR detections
✅ **Social Feed** — See friends' detected/scanned meals
✅ **Selective Sharing** — Private/Friends/Team toggle
✅ **Meal Comparison** — Compare own nutrition vs team/friends
✅ **Trending Meals** — See what team is eating

---

## 5. Data Models

```typescript
// Portion Estimation
interface PortionEstimation {
  id: string
  photoPath: string
  foodName: string
  estimatedPortionG: number
  estimatedPortionDescription: string // "2 slices" or "150g"
  confidence: number // 0-100, GPT-4 confidence
  userAdjustedPortionG?: number // If user overrides
  createdAt: string // ISO timestamp
}

// Barcode Result
interface BarcodeResult {
  id: string
  barcode: string // EAN-13, UPC, etc.
  foodName: string
  nutrition: {
    calories: number
    proteinG: number
    carbsG: number
    fatG: number
    fiberG: number
  }
  source: 'openfoodfacts' | 'usda'
  servingSize: string
  servingSizeG: number
  cachedAt: string // ISO timestamp
  expiresAt: string // Cache expires after 30 days
}

// Meal Suggestion
interface MealSuggestion {
  id: string
  userId: string
  mealName: string
  description: string
  nutrition: {
    calories: number
    proteinG: number
    carbsG: number
    fatG: number
    fiberG: number
  }
  reasonForSuggestion: string // "Based on your 2000 cal goal and love of pizza"
  recipeUrl?: string // Link to recipe
  createdAt: string
  expiresAt: string // Suggestions valid for 1 day
}

// Shared Meal
interface SharedMeal {
  id: string
  mealLogId: string
  userId: string
  foodName: string
  photoUrl: string
  nutrition: {
    calories: number
    proteinG: number
    carbsG: number
    fatG: number
    fiberG: number
  }
  shareType: 'private' | 'friends' | 'team'
  sharedWith: {
    friendIds?: string[]
    teamId?: string
  }
  createdAt: string
  reactions?: { userId: string; type: 'like' | 'heart' }[] // Optional
}

// Social Feed Item (for display)
interface SocialFeedItem {
  id: string
  userId: string
  userName: string
  userAvatar: string
  foodName: string
  photoUrl: string
  nutrition: Nutrition
  timestamp: string
  shareType: 'friends' | 'team' // Private items don't appear here
  reactions: { type: 'like' | 'heart'; count: number }[]
}
```

---

## 6. Screens & Components

### Screens (6 new)

**1. PortionEstimationScreen**
- AR detection photo display
- "Estimating portion..." loading
- GPT-4 estimate display (e.g., "~150g" or "2 slices")
- Slider to adjust if user disagrees
- Confirm button

**2. BarcodeScanner**
- Full-screen camera feed
- Barcode detection crosshair
- Detected barcode display
- "Scanning..." → "Found: Coca-Cola 355ml" or "Product not found"
- Nutrition auto-populated on find

**3. MealPlanningScreen**
- User's nutrition goal display (today's target)
- "Suggested Meals Today" section (3-5 suggestions)
- Each suggestion: meal name, description, nutrition, "Add to Plan" button
- Refresh button to get new suggestions
- Past suggestions history

**4. SocialFeedScreen**
- List of friends'/team members' shared meals
- Each item: user avatar, food name, photo, nutrition, timestamp
- Tap to view details
- Like button
- Filter: Friends / Team / All

**5. SharedMealDetailScreen**
- Full meal photo
- User info (who shared, when)
- Nutrition breakdown (macros, calories)
- "Compare with me" button (show side-by-side)
- Comments/reactions (optional)

**6. NutritionComparisonScreen**
- Side-by-side: "My meal" vs "Friend's meal"
- Nutrition comparison (calories, macros)
- "I ate X cal, they ate Y cal"
- Leaderboard snippet (who's closest to goal today)

### Components (8 new)

**PortionSlider** — Adjust portion (100g → 200g)
**BarcodeIndicator** — Barcode detection status
**MealSuggestionCard** — Meal name, description, nutrition, Add button
**NutritionComparison** — Side-by-side macro display
**SocialFeedCard** — User, food, photo, reactions
**ShareToggle** — Private/Friends/Team selector
**TrendingMeals** — What team is eating today
**MacroCircles** — Circular macro display (like Phase 6)

---

## 7. Integration Points

**Existing Systems (Phase 1-9):**
- Phase 3 (Nutrition) — MealLog creation from barcode, portion estimation
- Phase 5 (Social) — Friends list for sharing
- Phase 6 (Analytics) — User preferences, trends
- Phase 8 (Teams) — Team sharing, team leaderboard
- Phase 9 (AR) — Detection photos, detected foods → meal planning

**New Services:**
- Portion estimation service (GPT-4 Vision)
- Barcode scanning service (Open Food Facts + USDA)
- Meal planning service (Claude API)
- Social sharing service (share to friends/teams)
- Social feed service (retrieve shared meals)

---

## 8. Tech Stack

**Frontend:**
- React Native 0.81.5
- Expo 54
- react-native-camera (barcode scanning)
- Zustand (state management)
- SQLite (local cache)

**Backend:**
- PostgreSQL (shared meals, suggestions, cache)
- Node.js/Express (API endpoints)

**ML/AI:**
- GPT-4 Vision (portion estimation)
- Claude API (meal planning)
- TensorFlow.js (optional: barcode detection fallback)

**External APIs:**
- Open Food Facts API (barcode→nutrition)
- USDA FoodData Central API (fallback)

---

## 9. Testing Strategy

- **Unit:** 50+ tests (services, utilities, calculations)
- **Component:** 30+ tests (new screens + components)
- **Integration:** 40+ tests (portion estimation, barcode, meal planning, sharing flows)
- **E2E:** 10+ tests (end-to-end user journeys)

**Target:** 150+ total tests, 85%+ coverage

---

## 10. Success Criteria

✅ Portion estimation works (GPT-4 Vision accurate)
✅ Barcode scanning detects barcodes (90%+ accuracy)
✅ Barcode lookup returns nutrition (Open Food Facts primary)
✅ USDA fallback works (if Open Food Facts misses)
✅ Meal suggestions personalized (based on goals + preferences)
✅ Claude API generates smart suggestions
✅ Social sharing works (Private/Friends/Team toggle)
✅ Social feed displays shared meals correctly
✅ Nutrition comparison accurate
✅ All Phase 1-9 tests still passing (2493 tests)
✅ 150+ Phase 10 tests passing
✅ Zero TypeScript errors
✅ No regressions

---

## 11. Timeline (10-12 days)

- **Day 1-3:** Portion Estimation + Barcode Scanning (Task 1)
- **Day 4-6:** Meal Planning + Services (Task 2)
- **Day 7-9:** Social Sharing + Screens (Task 3)
- **Day 10-11:** Integration Tests + Documentation (Task 4)
- **Day 12 (buffer):** Polish + final verification

**Parallel execution possible:** Task 1 (foundation) → Tasks 2+3 parallel → Task 4 final

---

## 12. Dependencies

**Existing (Phase 1-9):**
- User auth, profiles
- Nutrition data (Phase 3)
- Social/friends (Phase 5)
- Analytics (Phase 6)
- Teams (Phase 8)
- AR detections (Phase 9)

**New:**
- GPT-4 Vision API key
- Claude API key
- Open Food Facts API (free)
- USDA FoodData Central API (free)
- react-native-camera library

---

## 13. Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| GPT-4 Vision slow (3-5s per estimation) | Show loading, cache results, allow skip |
| Barcode scanning unreliable | Use camera + TensorFlow.js fallback, manual entry option |
| Open Food Facts incomplete | USDA fallback + manual entry |
| Claude API expensive | Rate limit suggestions (1x/day per user) |
| Social sharing privacy concern | Selective sharing (Private/Friends/Team user choice) |
| Meal suggestions generic | Use goals + detections + analytics (personalized) |

---

## 14. Future Work (Deferred)

- **Phase 11+:** Social comments/discussions on shared meals
- **Phase 11+:** Meal recommendations marketplace (buy from friends)
- **Phase 11+:** Advanced portion detection (3D depth sensing)
- **Phase 11+:** Team meal planning (coordinated macro goals)
- **Phase 11+:** Export meal plans to calendar

---

**Approval:** ✅ Design approved by user (4 features, 10-12 days, 150+ tests)
