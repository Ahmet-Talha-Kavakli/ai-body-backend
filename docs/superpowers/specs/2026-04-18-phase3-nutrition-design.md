# Phase 3: Nutrition System Design

**Goal:** Food tracking with barcode scanning, meal logging, and AI-powered nutrition insights.

**Architecture:** Camera-based food scanning (barcode + ML image recognition), meal database integration, macro/calorie tracking, and backend AI analysis.

**Tech Stack:** Expo Camera, Barcode Scanner, ImageRecognition, SQLite, Nutritionix API

---

## 1. Overview

- **Food Scanning:** Barcode + image recognition for instant logging
- **Meal Planning:** Create meals, log portions, track macros
- **Nutrition Analytics:** Daily/weekly macro breakdown, trends
- **AI Tips:** Personalized nutrition recommendations
- **Offline Logging:** Scan offline, sync when online

---

## 2. Screens

**NutritionDashboard**

- Today's calories, macros (pie chart)
- Add meal buttons (quick add, scan, search)
- Recent meals list

**FoodScanner**

- Camera for barcode scanning
- Image recognition for food detection
- Search fallback if scan fails
- Quick confirm/edit nutritional info

**FoodSearchScreen**

- Search bar (food name)
- Results with nutrition facts
- Quantity selector
- Add to meal

**MealLogScreen**

- Meals by time (breakfast, lunch, dinner, snacks)
- Each meal shows calories, macros
- Swipe to delete
- Edit nutrition values

**NutritionAnalytics**

- Daily/weekly/monthly breakdown
- Macro trends (carbs, protein, fat)
- Calorie goal progress
- Nutrient distribution charts

---

## 3. Data Models

### Meal (SQLite)

```typescript
{
  id: string;
  userId: string;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  foods: Food[];
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  loggedAt: timestamp;
  synced: boolean;
}
```

### Food

```typescript
{
  id: string;
  name: string;
  quantity: number;
  unit: string; // grams, cups, etc.
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  barcode?: string;
  imageUrl?: string;
  source: 'barcode' | 'ai_vision' | 'manual_search';
}
```

### NutritionTarget

```typescript
{
  userId: string
  dailyCalories: number
  proteinGrams: number
  carbsGrams: number
  fatGrams: number
}
```

---

## 4. Key Features

- Barcode database (integrate with public APIs)
- Image-based food recognition (ML model)
- Macro calculator
- Daily/weekly summaries
- AI nutrition tips

---

## 5. Timeline

~5-7 days
