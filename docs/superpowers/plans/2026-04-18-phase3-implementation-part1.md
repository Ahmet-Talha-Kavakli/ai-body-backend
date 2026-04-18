# Phase 3: Complete Nutrition System Implementation Plan (Part 1)

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement nutrition type system, Zustand stores, SQLite database schema, and basic manual meal entry screens with macro tracking.

**Architecture:** Mobile-first nutrition tracking built on Phase 1/2 foundation. SQLite for offline-first storage, Zustand for state management. Manual meal entry provides baseline before adding voice/photo.

**Tech Stack:** React Native 0.81.5, Expo 54, TypeScript strict mode, Zustand, SQLite, Vitest

---

## File Structure Overview

```
apps/mobile/src/
├── types/
│   ├── nutrition.ts              # All nutrition types (MealLog, FoodItem, NutritionGoal, etc)
│   ├── nutrition-coach.ts        # Coach-specific types (CoachQuestion, CoachResponse)
│   └── nutrition-sync.ts         # Sync queue types (NutritionSyncQueue)
├── store/
│   ├── nutritionStore.ts         # Zustand store for meal logs, meals today
│   ├── nutritionGoalStore.ts     # Goals store with AI generation
│   └── nutritionCoachStore.ts    # Coach Q&A store
├── db/
│   ├── nutrition.ts              # SQLite operations for meals, foods
│   ├── nutritionGoal.ts          # Goals database operations
│   ├── nutritionPhoto.ts         # Photo storage + queue
│   ├── nutritionSync.ts          # Sync queue operations
│   └── waterIntake.ts            # Water tracking database
├── ml/
│   ├── food-parser.ts            # Claude-based food parsing from transcript
│   ├── goal-generator.ts         # AI goal generation from user profile
│   └── macro-calculator.ts       # Macro calculations and scoring
├── screens/
│   ├── nutrition/
│   │   ├── MealEntryScreen.tsx   # Manual + voice + photo entry (tabs)
│   │   ├── MealReviewScreen.tsx  # Review & confirm before save
│   │   ├── TodayNutritionScreen.tsx  # Daily summary with progress bars
│   │   ├── NutritionHistoryScreen.tsx # Weekly trends
│   │   ├── GoalSetupScreen.tsx   # AI goal generation
│   │   ├── FoodDatabaseScreen.tsx # Search, barcode, favorites
│   │   └── NutritionCoachScreen.tsx # Coach Q&A
├── components/
│   ├── nutrition/
│   │   ├── MacroProgressBar.tsx      # Progress bar component
│   │   ├── CircularProgressRing.tsx  # Water progress ring
│   │   ├── WaterQuickAdd.tsx         # Quick add buttons
│   │   ├── StreakCalendar.tsx        # Streak visualization
│   │   ├── MealCard.tsx              # Meal summary card
│   │   ├── VoiceRecorder.tsx         # Recording UI
│   │   └── CoachChat.tsx             # Chat UI
├── hooks/
│   ├── useNutrition.ts           # Nutrition store hook
│   ├── useFoodParsing.ts         # Food parsing logic
│   ├── useGoalGeneration.ts      # Goal generation with AI
│   ├── useMacroCalculations.ts   # Macro math
│   └── useNutritionSync.ts       # Sync queue management
└── api/
    └── nutrition-client.ts       # API calls (extends api/client)
```

---

## Chunk 1: Types & Data Models

### Task 1: Create nutrition type definitions

**Files:**

- Create: `apps/mobile/src/types/nutrition.ts`
- Create: `apps/mobile/src/types/nutrition-coach.ts`
- Create: `apps/mobile/src/types/nutrition-sync.ts`

- [ ] **Step 1: Create nutrition.ts with core types**

```typescript
// apps/mobile/src/types/nutrition.ts

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'pre_workout' | 'post_workout'
export type DietType = 'balanced' | 'keto' | 'vegan' | 'paleo' | 'low_carb'

export interface FoodItem {
  id?: string
  name: string
  calories: number
  proteinG: number
  carbsG: number
  fatG: number
  fiberG?: number
  glycemicIndex?: number
  allergens?: string[]
  portionSize?: number
  portionUnit?: string
  barcode?: string
  servingSize?: number
  servingSizeUnit?: string
}

export interface MealLog {
  id: string
  userId: string
  mealType: MealType
  items: FoodItem[]
  totalCalories: number
  totalProteinG: number
  totalCarbsG: number
  totalFatG: number
  totalFiberG?: number
  loggedAt: string
  aiAnalyzed: boolean
  photoUrl?: string
  photoPath?: string
  notes?: string
  syncedAt?: string
  synced: boolean
}

export interface NutritionGoal {
  id: string
  userId: string
  dailyCalories: number
  proteinG: number
  carbsG: number
  fatG: number
  fiberG: number
  waterGoalMl: number
  generatedByAi: boolean
  dietType?: DietType
  createdAt: string
  updatedAt: string
}

export interface MacroTotals {
  calories: number
  protein: number
  carbs: number
  fat: number
  fiber: number
}

export interface NutritionScore {
  score: number // 0-100
  breakdown: {
    calories: number
    protein: number
    carbs: number
    fat: number
    fiber: number
    water: number
  }
}

export interface NutritionStreak {
  currentStreak: number
  longestStreak: number
  lastLogDate: string | null
}

export interface OpenFoodFactsProduct {
  code: string
  product_name: string
  brands?: string
  nutriments: {
    'energy-kcal_100g'?: number
    proteins_100g?: number
    carbohydrates_100g?: number
    fat_100g?: number
    fiber_100g?: number
    'glycemic-index'?: number
  }
  allergens_tags?: string[]
  image_url?: string
}

export interface SearchResult {
  barcode: string
  name: string
  brand?: string
  caloriesPer100g: number
  proteinPer100g: number
  carbsPer100g: number
  fatPer100g: number
  fiberPer100g?: number
  glycemicIndex?: number
  allergens: string[]
  imageUrl?: string
}

export interface DailyEntry {
  date: string // YYYY-MM-DD
  calories: number
  protein: number
  carbs: number
  fat: number
}

export interface WeeklyStats {
  weekLabel: string
  avgCalories: number
  avgProtein: number
  avgCarbs: number
  avgFat: number
  daysLogged: number
  goalHitDays: number
  badge: 'excellent' | 'good' | 'needs_work'
}

export interface MealPhoto {
  id: string
  mealLogId: string
  filePath: string
  fileName: string
  size: number
  width: number
  height: number
  createdAt: string
  uploadStatus: 'pending' | 'uploading' | 'completed' | 'failed'
  uploadProgress: number
}

export interface WaterIntake {
  date: string // YYYY-MM-DD
  totalMl: number
  goal: number
  logs: { timestamp: string; amountMl: number }[]
}
```

Expected: File created with all nutrition types

- [ ] **Step 2: Create nutrition-coach.ts**

```typescript
// apps/mobile/src/types/nutrition-coach.ts

export interface CoachQuestion {
  id: string
  userId: string
  question: string
  inputType: 'text' | 'voice'
  createdAt: string
  synced: boolean
}

export interface CoachResponse {
  id: string
  questionId: string
  response: string
  context: {
    recentMeals: any[]
    todayIntake: any
    goals: any
    timestamp: string
  }
  createdAt: string
}

export interface CoachContext {
  recentMeals: any[]
  todayIntake: any
  goals: any
  streakData: any
}
```

Expected: Coach types file created

- [ ] **Step 3: Create nutrition-sync.ts**

```typescript
// apps/mobile/src/types/nutrition-sync.ts

export interface NutritionSyncQueue {
  id: string
  type: 'meal' | 'photo' | 'goal' | 'water' | 'coach_log'
  payload: any
  status: 'pending' | 'uploading' | 'retrying' | 'completed' | 'failed'
  attempts: number
  lastAttempt?: string
  error?: string
  createdAt: string
}
```

Expected: Sync queue types created

- [ ] **Step 4: Commit types**

```bash
git add apps/mobile/src/types/nutrition.ts apps/mobile/src/types/nutrition-coach.ts apps/mobile/src/types/nutrition-sync.ts
git commit -m "feat: add comprehensive nutrition type definitions (meals, goals, coach, sync)"
```

Expected: Commit successful

---

### Task 2: Create Zustand stores for nutrition state

**Files:**

- Create: `apps/mobile/src/store/nutritionStore.ts`
- Create: `apps/mobile/src/store/nutritionGoalStore.ts`
- Create: `apps/mobile/src/store/nutritionCoachStore.ts`

- [ ] **Step 1: Create nutritionStore**

```typescript
// apps/mobile/src/store/nutritionStore.ts

import { create } from 'zustand'
import { MealLog, MacroTotals } from '../types/nutrition'

interface NutritionState {
  meals: MealLog[]
  todaysMeals: MealLog[]
  selectedDate: string // YYYY-MM-DD
  currentMealBeingEdited: Partial<MealLog> | null

  // Computed
  todaysMacros: MacroTotals

  // Actions
  setMeals: (meals: MealLog[]) => void
  addMeal: (meal: MealLog) => void
  updateMeal: (id: string, meal: Partial<MealLog>) => void
  deleteMeal: (id: string) => void

  setSelectedDate: (date: string) => void
  setCurrentMealBeingEdited: (meal: Partial<MealLog> | null) => void

  calculateTodaysMacros: () => MacroTotals
  getMealsForDate: (date: string) => MealLog[]

  reset: () => void
}

export const useNutritionStore = create<NutritionState>((set, get) => ({
  meals: [],
  todaysMeals: [],
  selectedDate: new Date().toISOString().split('T')[0],
  currentMealBeingEdited: null,
  todaysMacros: { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 },

  setMeals: (meals) => {
    set({ meals })
    const today = new Date().toISOString().split('T')[0]
    const todaysMeals = meals.filter((m) => m.loggedAt.split('T')[0] === today)
    set({ todaysMeals })
  },

  addMeal: (meal) =>
    set((state) => {
      const updatedMeals = [...state.meals, meal]
      const today = new Date().toISOString().split('T')[0]
      const todaysMeals = updatedMeals.filter((m) => m.loggedAt.split('T')[0] === today)
      return { meals: updatedMeals, todaysMeals }
    }),

  updateMeal: (id, updates) =>
    set((state) => {
      const updatedMeals = state.meals.map((m) => (m.id === id ? { ...m, ...updates } : m))
      return { meals: updatedMeals }
    }),

  deleteMeal: (id) =>
    set((state) => ({
      meals: state.meals.filter((m) => m.id !== id),
    })),

  setSelectedDate: (date) => set({ selectedDate: date }),
  setCurrentMealBeingEdited: (meal) => set({ currentMealBeingEdited: meal }),

  calculateTodaysMacros: () => {
    const state = get()
    const macros = state.todaysMeals.reduce(
      (acc, meal) => ({
        calories: acc.calories + meal.totalCalories,
        protein: acc.protein + meal.totalProteinG,
        carbs: acc.carbs + meal.totalCarbsG,
        fat: acc.fat + meal.totalFatG,
        fiber: acc.fiber + (meal.totalFiberG || 0),
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 }
    )
    set({ todaysMacros: macros })
    return macros
  },

  getMealsForDate: (date) => get().meals.filter((m) => m.loggedAt.split('T')[0] === date),

  reset: () =>
    set({
      meals: [],
      todaysMeals: [],
      selectedDate: new Date().toISOString().split('T')[0],
      currentMealBeingEdited: null,
      todaysMacros: { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 },
    }),
}))
```

Expected: nutritionStore created and tested

- [ ] **Step 2: Create nutritionGoalStore**

```typescript
// apps/mobile/src/store/nutritionGoalStore.ts

import { create } from 'zustand'
import { NutritionGoal } from '../types/nutrition'

interface NutritionGoalState {
  goals: NutritionGoal | null
  isLoading: boolean
  error: string | null

  setGoals: (goals: NutritionGoal) => void
  updateGoals: (updates: Partial<NutritionGoal>) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void

  reset: () => void
}

export const useNutritionGoalStore = create<NutritionGoalState>((set) => ({
  goals: null,
  isLoading: false,
  error: null,

  setGoals: (goals) => set({ goals }),
  updateGoals: (updates) =>
    set((state) => ({
      goals: state.goals ? { ...state.goals, ...updates } : null,
    })),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),

  reset: () =>
    set({
      goals: null,
      isLoading: false,
      error: null,
    }),
}))
```

Expected: Goal store created

- [ ] **Step 3: Create nutritionCoachStore**

```typescript
// apps/mobile/src/store/nutritionCoachStore.ts

import { create } from 'zustand'
import { CoachQuestion, CoachResponse } from '../types/nutrition-coach'

interface CoachMessage {
  id: string
  type: 'question' | 'response'
  content: string
  timestamp: string
}

interface NutritionCoachState {
  messages: CoachMessage[]
  isLoading: boolean
  error: string | null

  addMessage: (message: CoachMessage) => void
  clearMessages: () => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void

  reset: () => void
}

export const useNutritionCoachStore = create<NutritionCoachState>((set) => ({
  messages: [],
  isLoading: false,
  error: null,

  addMessage: (message) => set((state) => ({ messages: [...state.messages, message] })),
  clearMessages: () => set({ messages: [] }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),

  reset: () =>
    set({
      messages: [],
      isLoading: false,
      error: null,
    }),
}))
```

Expected: Coach store created

- [ ] **Step 4: Write store tests**

```typescript
// apps/mobile/tests/store/nutritionStore.test.ts

import { describe, it, expect, beforeEach } from 'vitest'
import { useNutritionStore } from '../../src/store/nutritionStore'

describe('NutritionStore', () => {
  beforeEach(() => {
    useNutritionStore.getState().reset()
  })

  it('should add a meal', () => {
    const store = useNutritionStore.getState()
    const meal = {
      id: 'meal_1',
      userId: 'user_1',
      mealType: 'breakfast' as const,
      items: [],
      totalCalories: 300,
      totalProteinG: 20,
      totalCarbsG: 30,
      totalFatG: 10,
      loggedAt: new Date().toISOString(),
      aiAnalyzed: false,
      synced: false,
    }
    store.addMeal(meal)
    expect(store.meals).toHaveLength(1)
    expect(store.meals[0].id).toBe('meal_1')
  })

  it('should calculate todays macros', () => {
    const store = useNutritionStore.getState()
    const today = new Date().toISOString()
    store.addMeal({
      id: 'meal_1',
      userId: 'user_1',
      mealType: 'breakfast' as const,
      items: [],
      totalCalories: 300,
      totalProteinG: 20,
      totalCarbsG: 30,
      totalFatG: 10,
      loggedAt: today,
      aiAnalyzed: false,
      synced: false,
    })
    const macros = store.calculateTodaysMacros()
    expect(macros.calories).toBe(300)
    expect(macros.protein).toBe(20)
  })
})
```

Expected: Tests written and passing

- [ ] **Step 5: Commit stores**

```bash
git add apps/mobile/src/store/nutrition*.ts apps/mobile/tests/store/nutrition*.test.ts
git commit -m "feat: create Zustand stores for nutrition state (meals, goals, coach)"
```

Expected: Commit successful

---

**End of Chunk 1: Types and state management foundation ready**

---

## Chunk 2: Database & Basic Screens

### Task 3: Set up SQLite database schema for nutrition

**Files:**

- Create: `apps/mobile/src/db/nutrition.ts`
- Create: `apps/mobile/src/db/nutritionGoal.ts`
- Create: `apps/mobile/tests/db/nutrition.test.ts`

- [ ] **Step 1: Create nutrition database operations**

```typescript
// apps/mobile/src/db/nutrition.ts

import { getDatabase } from './sqlite'
import { MealLog, FoodItem } from '../types/nutrition'

export async function createNutritionTables(): Promise<void> {
  const db = getDatabase()

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS meal_logs (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      mealType TEXT NOT NULL,
      totalCalories REAL,
      totalProteinG REAL,
      totalCarbsG REAL,
      totalFatG REAL,
      totalFiberG REAL,
      loggedAt TEXT NOT NULL,
      aiAnalyzed INTEGER DEFAULT 0,
      photoPath TEXT,
      photoUrl TEXT,
      notes TEXT,
      synced INTEGER DEFAULT 0,
      syncedAt TEXT,
      createdAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS meal_items (
      id TEXT PRIMARY KEY,
      mealLogId TEXT NOT NULL,
      name TEXT NOT NULL,
      calories REAL,
      proteinG REAL,
      carbsG REAL,
      fatG REAL,
      fiberG REAL,
      portionSize REAL,
      portionUnit TEXT,
      barcode TEXT,
      glycemicIndex REAL,
      allergens TEXT,
      FOREIGN KEY (mealLogId) REFERENCES meal_logs(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS recent_foods (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      name TEXT NOT NULL,
      calories REAL,
      proteinG REAL,
      carbsG REAL,
      fatG REAL,
      fiberG REAL,
      barcode TEXT,
      lastUsed TEXT,
      useCount INTEGER DEFAULT 0
    );

    CREATE INDEX IF NOT EXISTS idx_meal_logs_userId ON meal_logs(userId);
    CREATE INDEX IF NOT EXISTS idx_meal_logs_loggedAt ON meal_logs(loggedAt);
    CREATE INDEX IF NOT EXISTS idx_meal_items_mealLogId ON meal_items(mealLogId);
    CREATE INDEX IF NOT EXISTS idx_recent_foods_userId ON recent_foods(userId);
  `)
}

export async function saveMealLog(meal: MealLog): Promise<void> {
  const db = getDatabase()

  await db.runAsync(
    `INSERT INTO meal_logs (id, userId, mealType, totalCalories, totalProteinG, totalCarbsG, totalFatG, totalFiberG, loggedAt, aiAnalyzed, photoPath, notes, synced, createdAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      meal.id,
      meal.userId,
      meal.mealType,
      meal.totalCalories,
      meal.totalProteinG,
      meal.totalCarbsG,
      meal.totalFatG,
      meal.totalFiberG || 0,
      meal.loggedAt,
      meal.aiAnalyzed ? 1 : 0,
      meal.photoPath || null,
      meal.notes || null,
      0,
      new Date().toISOString(),
    ]
  )

  for (const item of meal.items) {
    const itemId = `item_${Date.now()}_${Math.random()}`
    await db.runAsync(
      `INSERT INTO meal_items (id, mealLogId, name, calories, proteinG, carbsG, fatG, fiberG, portionSize, portionUnit, barcode)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        itemId,
        meal.id,
        item.name,
        item.calories,
        item.proteinG,
        item.carbsG,
        item.fatG,
        item.fiberG || 0,
        item.portionSize || 1,
        item.portionUnit || 'serving',
        item.barcode || null,
      ]
    )
  }
}

export async function getMealLogsForDate(userId: string, date: string): Promise<MealLog[]> {
  const db = getDatabase()
  const rows = await db.getAllAsync(
    `SELECT * FROM meal_logs WHERE userId = ? AND DATE(loggedAt) = ? ORDER BY loggedAt DESC`,
    [userId, date]
  )

  const meals: MealLog[] = []
  for (const row of rows) {
    const items = await db.getAllAsync(`SELECT * FROM meal_items WHERE mealLogId = ?`, [row.id])
    meals.push({
      id: row.id,
      userId: row.userId,
      mealType: row.mealType,
      items: items.map((i: any) => ({
        name: i.name,
        calories: i.calories,
        proteinG: i.proteinG,
        carbsG: i.carbsG,
        fatG: i.fatG,
        fiberG: i.fiberG,
        portionSize: i.portionSize,
        portionUnit: i.portionUnit,
        barcode: i.barcode,
      })),
      totalCalories: row.totalCalories,
      totalProteinG: row.totalProteinG,
      totalCarbsG: row.totalCarbsG,
      totalFatG: row.totalFatG,
      totalFiberG: row.totalFiberG,
      loggedAt: row.loggedAt,
      aiAnalyzed: row.aiAnalyzed === 1,
      photoPath: row.photoPath,
      notes: row.notes,
      synced: row.synced === 1,
    })
  }
  return meals
}

export async function deleteMealLog(id: string): Promise<void> {
  const db = getDatabase()
  await db.runAsync(`DELETE FROM meal_logs WHERE id = ?`, [id])
}

export async function addRecentFood(userId: string, food: FoodItem): Promise<void> {
  const db = getDatabase()
  const id = `food_${Date.now()}`

  await db.runAsync(
    `INSERT OR REPLACE INTO recent_foods (id, userId, name, calories, proteinG, carbsG, fatG, fiberG, barcode, lastUsed, useCount)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, (SELECT COALESCE(useCount, 0) + 1 FROM recent_foods WHERE name = ? LIMIT 1))`,
    [
      id,
      userId,
      food.name,
      food.calories,
      food.proteinG,
      food.carbsG,
      food.fatG,
      food.fiberG || 0,
      food.barcode || null,
      new Date().toISOString(),
      food.name,
    ]
  )
}

export async function getRecentFoods(userId: string, limit: number = 50): Promise<FoodItem[]> {
  const db = getDatabase()
  const rows = await db.getAllAsync(
    `SELECT * FROM recent_foods WHERE userId = ? ORDER BY lastUsed DESC LIMIT ?`,
    [userId, limit]
  )

  return rows.map((r: any) => ({
    name: r.name,
    calories: r.calories,
    proteinG: r.proteinG,
    carbsG: r.carbsG,
    fatG: r.fatG,
    fiberG: r.fiberG,
    barcode: r.barcode,
  }))
}
```

Expected: Database operations created

- [ ] **Step 2: Create nutrition goal database**

```typescript
// apps/mobile/src/db/nutritionGoal.ts

import { getDatabase } from './sqlite'
import { NutritionGoal } from '../types/nutrition'

export async function createGoalTable(): Promise<void> {
  const db = getDatabase()
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS nutrition_goals (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL UNIQUE,
      dailyCalories REAL NOT NULL,
      proteinG REAL NOT NULL,
      carbsG REAL NOT NULL,
      fatG REAL NOT NULL,
      fiberG REAL NOT NULL,
      waterGoalMl REAL,
      generatedByAi INTEGER DEFAULT 0,
      dietType TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );
  `)
}

export async function saveGoal(goal: NutritionGoal): Promise<void> {
  const db = getDatabase()
  await db.runAsync(
    `INSERT OR REPLACE INTO nutrition_goals (id, userId, dailyCalories, proteinG, carbsG, fatG, fiberG, waterGoalMl, generatedByAi, dietType, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      goal.id,
      goal.userId,
      goal.dailyCalories,
      goal.proteinG,
      goal.carbsG,
      goal.fatG,
      goal.fiberG,
      goal.waterGoalMl,
      goal.generatedByAi ? 1 : 0,
      goal.dietType || null,
      goal.createdAt,
      goal.updatedAt,
    ]
  )
}

export async function getGoal(userId: string): Promise<NutritionGoal | null> {
  const db = getDatabase()
  const row = await db.getFirstAsync(`SELECT * FROM nutrition_goals WHERE userId = ?`, [userId])

  if (!row) return null

  return {
    id: row.id,
    userId: row.userId,
    dailyCalories: row.dailyCalories,
    proteinG: row.proteinG,
    carbsG: row.carbsG,
    fatG: row.fatG,
    fiberG: row.fiberG,
    waterGoalMl: row.waterGoalMl,
    generatedByAi: row.generatedByAi === 1,
    dietType: row.dietType,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }
}
```

Expected: Goal database operations created

- [ ] **Step 3: Write database tests**

```typescript
// apps/mobile/tests/db/nutrition.test.ts

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { initializeDatabase, getDatabase } from '../../src/db/sqlite'
import {
  saveMealLog,
  getMealLogsForDate,
  addRecentFood,
  getRecentFoods,
} from '../../src/db/nutrition'

describe('Nutrition Database', () => {
  beforeEach(async () => {
    await initializeDatabase({ inMemory: true })
  })

  afterEach(async () => {
    const db = getDatabase()
    if (db) await db.closeAsync()
  })

  it('should save and retrieve meal log', async () => {
    const meal = {
      id: 'meal_1',
      userId: 'user_1',
      mealType: 'breakfast' as const,
      items: [
        { name: 'eggs', calories: 150, proteinG: 12, carbsG: 1, fatG: 11 },
        { name: 'toast', calories: 100, proteinG: 4, carbsG: 20, fatG: 1 },
      ],
      totalCalories: 250,
      totalProteinG: 16,
      totalCarbsG: 21,
      totalFatG: 12,
      loggedAt: new Date().toISOString(),
      aiAnalyzed: false,
      synced: false,
    }

    await saveMealLog(meal)
    const retrieved = await getMealLogsForDate('user_1', new Date().toISOString().split('T')[0])

    expect(retrieved).toHaveLength(1)
    expect(retrieved[0].totalCalories).toBe(250)
    expect(retrieved[0].items).toHaveLength(2)
  })

  it('should add recent food', async () => {
    const food = {
      name: 'banana',
      calories: 89,
      proteinG: 1,
      carbsG: 23,
      fatG: 0,
    }

    await addRecentFood('user_1', food)
    const recent = await getRecentFoods('user_1')

    expect(recent).toHaveLength(1)
    expect(recent[0].name).toBe('banana')
  })
})
```

Expected: Tests pass

- [ ] **Step 4: Commit database**

```bash
git add apps/mobile/src/db/nutrition*.ts apps/mobile/tests/db/nutrition.test.ts
git commit -m "feat: implement SQLite nutrition database with meal logging and recent foods"
```

Expected: Commit successful

---

### Task 4: Create basic manual meal entry screen

**Files:**

- Create: `apps/mobile/src/screens/nutrition/MealEntryScreen.tsx`
- Create: `apps/mobile/src/screens/nutrition/MealReviewScreen.tsx`
- Create: `apps/mobile/tests/screens/nutrition/MealEntryScreen.test.tsx`

- [ ] **Step 1: Create MealEntryScreen (manual tab)**

```typescript
// apps/mobile/src/screens/nutrition/MealEntryScreen.tsx

import React, { useState } from 'react'
import { View, TextInput, Pressable, Text, StyleSheet, ScrollView, FlatList } from 'react-native'
import { useNutritionStore } from '../../store/nutritionStore'

interface MealEntryScreenProps {
  navigation: any
}

export function MealEntryScreen({ navigation }: MealEntryScreenProps) {
  const store = useNutritionStore()
  const [activeTab, setActiveTab] = useState<'manual' | 'voice' | 'photo'>('manual')
  const [foodName, setFoodName] = useState('')
  const [portion, setPortion] = useState('1')
  const [selectedMealType, setSelectedMealType] = useState<'breakfast' | 'lunch' | 'dinner' | 'snack'>('breakfast')
  const [foods, setFoods] = useState<any[]>([])

  const handleAddFood = () => {
    if (!foodName.trim()) return

    // Placeholder macros (would come from database lookup)
    const newFood = {
      id: `food_${Date.now()}`,
      name: foodName,
      calories: 100 * parseFloat(portion),
      proteinG: 5 * parseFloat(portion),
      carbsG: 10 * parseFloat(portion),
      fatG: 3 * parseFloat(portion),
      portionSize: parseFloat(portion),
      portionUnit: 'serving',
    }
    setFoods([...foods, newFood])
    setFoodName('')
    setPortion('1')
  }

  const handleRemoveFood = (id: string) => {
    setFoods(foods.filter((f) => f.id !== id))
  }

  const handleSaveAndReview = () => {
    if (foods.length === 0) {
      alert('Add at least one food item')
      return
    }

    // Pass data to review screen
    navigation.navigate('MealReview', {
      foods,
      mealType: selectedMealType,
    })
  }

  return (
    <View style={styles.container}>
      {/* Tab navigation */}
      <View style={styles.tabs}>
        {(['manual', 'voice', 'photo'] as const).map((tab) => (
          <Pressable
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Manual entry tab */}
      {activeTab === 'manual' && (
        <ScrollView style={styles.content}>
          {/* Meal type selector */}
          <Text style={styles.label}>Meal Type</Text>
          <View style={styles.mealTypeButtons}>
            {(['breakfast', 'lunch', 'dinner', 'snack'] as const).map((type) => (
              <Pressable
                key={type}
                style={[
                  styles.mealTypeButton,
                  selectedMealType === type && styles.mealTypeButtonActive,
                ]}
                onPress={() => setSelectedMealType(type)}
              >
                <Text
                  style={[
                    styles.mealTypeButtonText,
                    selectedMealType === type && styles.mealTypeButtonTextActive,
                  ]}
                >
                  {type}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Food entry */}
          <Text style={styles.label}>Add Food</Text>
          <TextInput
            style={styles.input}
            placeholder="Food name (e.g., banana)"
            value={foodName}
            onChangeText={setFoodName}
          />

          <TextInput
            style={styles.input}
            placeholder="Portion (e.g., 2)"
            value={portion}
            onChangeText={setPortion}
            keyboardType="decimal-pad"
          />

          <Pressable style={styles.addButton} onPress={handleAddFood}>
            <Text style={styles.addButtonText}>Add Food</Text>
          </Pressable>

          {/* Foods list */}
          {foods.length > 0 && (
            <>
              <Text style={styles.label}>Foods Added</Text>
              {foods.map((food) => (
                <View key={food.id} style={styles.foodCard}>
                  <View style={styles.foodInfo}>
                    <Text style={styles.foodName}>{food.name}</Text>
                    <Text style={styles.foodMacros}>
                      {Math.round(food.calories)} cal | {Math.round(food.proteinG)}g protein
                    </Text>
                  </View>
                  <Pressable onPress={() => handleRemoveFood(food.id)}>
                    <Text style={styles.removeButton}>✕</Text>
                  </Pressable>
                </View>
              ))}
            </>
          )}

          {/* Save button */}
          <Pressable style={styles.saveButton} onPress={handleSaveAndReview}>
            <Text style={styles.saveButtonText}>Review & Save</Text>
          </Pressable>
        </ScrollView>
      )}

      {/* Voice and photo tabs - placeholders for now */}
      {activeTab === 'voice' && (
        <View style={styles.content}>
          <Text style={styles.placeholder}>Voice entry coming soon</Text>
        </View>
      )}

      {activeTab === 'photo' && (
        <View style={styles.content}>
          <Text style={styles.placeholder}>Photo entry coming soon</Text>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  tabActive: {
    borderBottomWidth: 3,
    borderBottomColor: '#3366FF',
  },
  tabText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  tabTextActive: {
    color: '#3366FF',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 12,
    marginBottom: 8,
    color: '#000',
  },
  mealTypeButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  mealTypeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
  },
  mealTypeButtonActive: {
    backgroundColor: '#3366FF',
    borderColor: '#3366FF',
  },
  mealTypeButtonText: {
    fontSize: 12,
    color: '#666',
  },
  mealTypeButtonTextActive: {
    color: '#fff',
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 14,
  },
  addButton: {
    backgroundColor: '#3366FF',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  foodCard: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  foodInfo: {
    flex: 1,
  },
  foodName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  foodMacros: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  removeButton: {
    fontSize: 18,
    color: '#FF6B6B',
    fontWeight: 'bold',
  },
  saveButton: {
    backgroundColor: '#10B981',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  placeholder: {
    textAlign: 'center',
    fontSize: 14,
    color: '#666',
    marginTop: 24,
  },
})
```

Expected: Screen created

- [ ] **Step 2: Create MealReviewScreen**

```typescript
// apps/mobile/src/screens/nutrition/MealReviewScreen.tsx

import React, { useMemo } from 'react'
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native'
import { useNutritionStore } from '../../store/nutritionStore'

export function MealReviewScreen({ route, navigation }: any) {
  const { foods, mealType } = route.params
  const store = useNutritionStore()

  const totals = useMemo(() => {
    return {
      calories: foods.reduce((sum: number, f: any) => sum + f.calories, 0),
      protein: foods.reduce((sum: number, f: any) => sum + f.proteinG, 0),
      carbs: foods.reduce((sum: number, f: any) => sum + f.carbsG, 0),
      fat: foods.reduce((sum: number, f: any) => sum + f.fatG, 0),
    }
  }, [foods])

  const handleSave = () => {
    const mealId = `meal_${Date.now()}`
    const meal = {
      id: mealId,
      userId: '', // Would be set from auth context
      mealType,
      items: foods,
      totalCalories: totals.calories,
      totalProteinG: totals.protein,
      totalCarbsG: totals.carbs,
      totalFatG: totals.fat,
      totalFiberG: 0,
      loggedAt: new Date().toISOString(),
      aiAnalyzed: false,
      synced: false,
    }

    store.addMeal(meal)
    navigation.navigate('TodayNutrition')
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content}>
        <Text style={styles.title}>Review {mealType}</Text>

        {/* Foods list */}
        <Text style={styles.sectionTitle}>Foods</Text>
        {foods.map((food: any, idx: number) => (
          <View key={idx} style={styles.foodItem}>
            <Text style={styles.foodName}>{food.name}</Text>
            <Text style={styles.foodMacros}>
              {Math.round(food.calories)} cal | {Math.round(food.proteinG)}g P | {Math.round(food.carbsG)}g C | {Math.round(food.fatG)}g F
            </Text>
          </View>
        ))}

        {/* Totals */}
        <View style={styles.totalsCard}>
          <Text style={styles.totalsTitle}>Total</Text>
          <View style={styles.macroRow}>
            <View style={styles.macroItem}>
              <Text style={styles.macroValue}>{Math.round(totals.calories)}</Text>
              <Text style={styles.macroLabel}>Calories</Text>
            </View>
            <View style={styles.macroItem}>
              <Text style={styles.macroValue}>{Math.round(totals.protein)}g</Text>
              <Text style={styles.macroLabel}>Protein</Text>
            </View>
            <View style={styles.macroItem}>
              <Text style={styles.macroValue}>{Math.round(totals.carbs)}g</Text>
              <Text style={styles.macroLabel}>Carbs</Text>
            </View>
            <View style={styles.macroItem}>
              <Text style={styles.macroValue}>{Math.round(totals.fat)}g</Text>
              <Text style={styles.macroLabel}>Fat</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Buttons */}
      <View style={styles.buttons}>
        <Pressable style={styles.cancelButton} onPress={() => navigation.goBack()}>
          <Text style={styles.cancelButtonText}>Back</Text>
        </Pressable>
        <Pressable style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>Save</Text>
        </Pressable>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#000',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
    color: '#333',
  },
  foodItem: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  foodName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  foodMacros: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  totalsCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginTop: 16,
    marginBottom: 16,
  },
  totalsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#000',
  },
  macroRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  macroItem: {
    alignItems: 'center',
  },
  macroValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#3366FF',
  },
  macroLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  buttons: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    paddingBottom: 32,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#ddd',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#666',
    fontWeight: 'bold',
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#10B981',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
})
```

Expected: Review screen created

- [ ] **Step 3: Write integration tests**

```typescript
// apps/mobile/tests/screens/nutrition/MealEntryScreen.test.tsx

import { describe, it, expect } from 'vitest'
import { render, fireEvent, waitFor } from '@testing-library/react-native'
import { MealEntryScreen } from '../../../src/screens/nutrition/MealEntryScreen'

describe('MealEntryScreen', () => {
  it('should render manual tab by default', () => {
    const mockNavigation = { navigate: vi.fn() }
    const { getByText, getByPlaceholderText } = render(
      <MealEntryScreen navigation={mockNavigation} />
    )

    expect(getByText('Manual')).toBeTruthy()
    expect(getByPlaceholderText('Food name (e.g., banana)')).toBeTruthy()
  })

  it('should add food to list', async () => {
    const mockNavigation = { navigate: vi.fn() }
    const { getByText, getByPlaceholderText } = render(
      <MealEntryScreen navigation={mockNavigation} />
    )

    const foodInput = getByPlaceholderText('Food name (e.g., banana)')
    fireEvent.changeText(foodInput, 'banana')

    const addButton = getByText('Add Food')
    fireEvent.press(addButton)

    await waitFor(() => {
      expect(getByText('banana')).toBeTruthy()
    })
  })
})
```

Expected: Tests passing

- [ ] **Step 4: Commit screens**

```bash
git add apps/mobile/src/screens/nutrition/Meal*.tsx apps/mobile/tests/screens/nutrition/
git commit -m "feat: create manual meal entry and review screens with macro tracking"
```

Expected: Commit successful

---

**End of Chunk 2: Database and basic meal entry complete**

---

## Success Criteria for Part 1

✅ All nutrition type definitions created (15+ types)  
✅ All Zustand stores created (nutrition, goals, coach)  
✅ SQLite database schema with meal logs, items, recent foods  
✅ Manual meal entry screen with food list management  
✅ Meal review screen with macro totals  
✅ 35+ unit and integration tests passing  
✅ Zero TypeScript errors  
✅ 4 commits (types, stores, database, screens)

---

**Next (Part 2):** Voice integration (VAPI), photo capture, goal generation (Claude), nutrition history screens

**Next (Part 3):** Coach Q&A (VAPI + Claude), water tracking, streaks, sync queue, full integration tests
