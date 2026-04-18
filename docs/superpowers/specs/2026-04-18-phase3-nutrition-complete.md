# Phase 3: Complete Nutrition System (Mobile)

**Goal:** Food tracking with barcode scanning, meal logging, macro tracking, AI meal analysis, water tracking, streaks.

**Architecture:** Camera-based barcode scanner, public food DB API integration, ImageRecognition for meal analysis, SQLite offline meal logging, water streak tracking.

**Tech Stack:** Expo Camera, Barcode Scanner, ImageRecognition, public APIs (USDA FoodData), SQLite

---

## Screens

**NutritionDashboard**

- Today's calories (progress ring): current/goal
- Macros (pie chart): protein/carbs/fat ratio
- Add meal buttons: Quick add, Scan, Search
- Recent meals list (breakfast→lunch→dinner→snacks)
- Water intake: glasses logged + goal

**FoodScanner**

- Camera for barcode scanning
- Image recognition fallback
- Quick confirm/edit macros
- Add to meal (breakfast/lunch/dinner/snack/pre_workout/post_workout)

**FoodSearchScreen**

- Search bar + results
- Nutrition facts displayed
- Quantity selector
- Add button

**MealLogScreen**

- Meals by time
- Swipe to delete
- Edit macros
- Daily calorie total

**WaterTrackerScreen**

- Daily goal visual (circle progress)
- Quick add buttons: +250ml, +500ml
- Logged glasses/ml display
- Streak info
- Weekly trend chart

**NutritionAnalyticsScreen**

- Daily/weekly/monthly breakdown
- Macro trends (line chart)
- Calorie goal progress
- Nutrient distribution

## Data Models

**MealLog** (from Prisma)

- mealType: breakfast|lunch|dinner|snack|pre_workout|post_workout
- items: FoodItem[]
- totalCalories, totalProteinG, totalCarbsG, totalFatG
- aiAnalyzed (if photo-based)

**WaterLog** (per-day unique entry)

- date, glasses, amountMl

**WaterStreak, NutritionStreak** (tracking)

**MealTemplate** (user's saved meals)

## API Endpoints

```
POST/GET   /api/nutrition              → Log/list meals
GET        /api/nutrition/today        → Today's macros
POST       /api/nutrition/analyze-photo → AI meal analysis
GET/POST   /api/nutrition/water        → Log water
GET        /api/water/dashboard        → Water progress
POST       /api/nutrition/goal         → Set targets
GET        /api/nutrition/streak       → Nutrition streak
GET        /api/water/streak           → Water streak
```

## Key Features

- Barcode integration (USDA FoodData Central API)
- Photo-based meal analysis (vision API)
- Offline meal logging (SQLite)
- Streak tracking (consecutive days of logging)
- Weekly/monthly trend analysis
- Meal templates for quick reuse

## Timeline

~5-7 days (after Phase 1)
