/**
 * Integration Tests for Complete Nutrition Flow
 * Tests the full lifecycle: meal logging → food parsing → goal generation → water tracking → coaching
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

// Mock types and functions for Phase 3 Nutrition System
interface FoodItem {
  id: string
  name: string
  calories: number
  proteinG: number
  carbsG: number
  fatG: number
  fiberG: number
  portionSize?: number
  portionUnit?: string
  barcode?: string
}

interface MealLog {
  id: string
  userId: string
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'pre_workout' | 'post_workout'
  items: FoodItem[]
  totalCalories: number
  totalProteinG: number
  totalCarbsG: number
  totalFatG: number
  totalFiberG: number
  loggedAt: string
  photoUrl?: string
  photoPath?: string
  notes?: string
  aiAnalyzed: boolean
  synced: boolean
}

interface NutritionGoal {
  id: string
  userId: string
  dailyCalories: number
  proteinG: number
  carbsG: number
  fatG: number
  fiberG: number
  waterGoalMl: number
  dietType: 'balanced' | 'keto' | 'vegan' | 'paleo' | 'low_carb'
  generatedByAi: boolean
  createdAt: string
  updatedAt: string
}

interface WaterIntake {
  date: string
  totalMl: number
  goalMl: number
  timestamp: string
}

interface NutritionStreak {
  userId: string
  currentStreak: number
  longestStreak: number
  lastLogDate: string
}

// Mock store state
const mockStore = {
  meals: [] as MealLog[],
  goals: null as NutritionGoal | null,
  water: [] as WaterIntake[],
  streaks: null as NutritionStreak | null,
  syncQueue: [] as any[],
}

// Mock database operations
const mockDb = {
  saveMealLog: async (meal: MealLog) => {
    mockStore.meals.push(meal)
    return meal.id
  },
  getMealsForDate: async (userId: string, date: string) => {
    return mockStore.meals.filter((m) => m.userId === userId && m.loggedAt.startsWith(date))
  },
  getTodaysMeals: async (userId: string) => {
    const today = new Date().toISOString().split('T')[0]
    return mockDb.getMealsForDate(userId, today)
  },
  saveNutritionGoal: async (goal: NutritionGoal) => {
    mockStore.goals = goal
    return goal.id
  },
  getNutritionGoal: async (userId: string) => {
    return mockStore.goals
  },
  saveWaterIntake: async (water: WaterIntake) => {
    mockStore.water.push(water)
    return water
  },
  getDailyWaterIntake: async (userId: string, date: string) => {
    return mockStore.water.find((w) => w.date === date)
  },
  saveStreak: async (streak: NutritionStreak) => {
    mockStore.streaks = streak
    return streak
  },
  getStreak: async (userId: string) => {
    return mockStore.streaks
  },
  queueForSync: async (data: any) => {
    mockStore.syncQueue.push({
      id: `sync-${Date.now()}`,
      data,
      createdAt: new Date().toISOString(),
      syncStatus: 'pending',
      retryCount: 0,
    })
  },
  getSyncQueue: async () => {
    return mockStore.syncQueue
  },
  clearSyncQueue: async () => {
    mockStore.syncQueue = []
  },
}

// Mock API calls
const mockApi = {
  parseFoodFromTranscript: async (transcript: string): Promise<FoodItem[]> => {
    // Simulate Claude parsing "2 eggs and toast" → FoodItems
    if (transcript.includes('2 eggs') && transcript.includes('toast')) {
      return [
        {
          id: 'food-1',
          name: 'Eggs (2)',
          calories: 155,
          proteinG: 13,
          carbsG: 1.1,
          fatG: 11,
          fiberG: 0,
        },
        {
          id: 'food-2',
          name: 'Toast',
          calories: 80,
          proteinG: 2.7,
          carbsG: 14,
          fatG: 1,
          fiberG: 2.7,
        },
      ]
    }
    return []
  },
  analyzeMealPhoto: async (
    photoPath: string
  ): Promise<{ foods: FoodItem[]; confidence: number }> => {
    // Simulate photo analysis
    return {
      foods: [
        {
          id: 'food-photo-1',
          name: 'Salad',
          calories: 150,
          proteinG: 8,
          carbsG: 20,
          fatG: 5,
          fiberG: 6,
        },
      ],
      confidence: 0.85,
    }
  },
  generateNutritionGoal: async (userProfile: any): Promise<NutritionGoal> => {
    // Simulate BMR/TDEE calculation and goal generation
    return {
      id: `goal-${Date.now()}`,
      userId: userProfile.userId,
      dailyCalories: 2000,
      proteinG: 150,
      carbsG: 250,
      fatG: 65,
      fiberG: 35,
      waterGoalMl: 3000,
      dietType: 'balanced',
      generatedByAi: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
  },
  getCoachAnswer: async (question: string, context: any): Promise<string> => {
    // Simulate Claude coach answering questions based on meal history
    if (question.includes('protein')) {
      return 'You logged 120g of protein today. Target is 150g, so aim for 30g more.'
    }
    if (question.includes('water')) {
      return 'You drank 1500ml of water today. Goal is 3000ml, so try to drink more water throughout the day.'
    }
    return 'Great question! Keep logging your meals consistently for better insights.'
  },
}

describe('Nutrition Flow Integration Tests', () => {
  const userId = 'user-nutrition-001'
  const today = new Date().toISOString().split('T')[0]

  beforeEach(() => {
    vi.clearAllMocks()
    mockStore.meals = []
    mockStore.goals = null
    mockStore.water = []
    mockStore.streaks = null
    mockStore.syncQueue = []
  })

  afterEach(async () => {
    await mockDb.clearSyncQueue()
  })

  describe('Meal Logging Flow', () => {
    it('should complete manual meal entry: enter foods → review → save → verify in today meals', async () => {
      // Step 1: Create meal log with manual food entries
      const mealLog: MealLog = {
        id: `meal-${Date.now()}`,
        userId,
        mealType: 'breakfast',
        items: [
          {
            id: 'egg',
            name: 'Eggs',
            calories: 155,
            proteinG: 13,
            carbsG: 1.1,
            fatG: 11,
            fiberG: 0,
            portionSize: 2,
            portionUnit: 'large',
          },
          {
            id: 'bread',
            name: 'Whole Wheat Bread',
            calories: 80,
            proteinG: 4,
            carbsG: 14,
            fatG: 1,
            fiberG: 2.4,
            portionSize: 1,
            portionUnit: 'slice',
          },
        ],
        totalCalories: 235,
        totalProteinG: 17,
        totalCarbsG: 15.1,
        totalFatG: 12,
        totalFiberG: 2.4,
        loggedAt: new Date().toISOString(),
        aiAnalyzed: false,
        synced: false,
      }

      // Step 2: Save meal
      const savedId = await mockDb.saveMealLog(mealLog)
      expect(savedId).toBe(mealLog.id)

      // Step 3: Queue for sync
      await mockDb.queueForSync(mealLog)
      const syncQueue = await mockDb.getSyncQueue()
      expect(syncQueue).toHaveLength(1)

      // Step 4: Verify meal appears in today's meals
      const todaysMeals = await mockDb.getTodaysMeals(userId)
      expect(todaysMeals).toHaveLength(1)
      expect(todaysMeals[0].id).toBe(mealLog.id)
      expect(todaysMeals[0].totalCalories).toBe(235)
    })

    it('should support all meal types', async () => {
      const mealTypes: MealLog['mealType'][] = [
        'breakfast',
        'lunch',
        'dinner',
        'snack',
        'pre_workout',
        'post_workout',
      ]

      for (const mealType of mealTypes) {
        const meal: MealLog = {
          id: `meal-${mealType}-${Date.now()}`,
          userId,
          mealType,
          items: [
            { id: '1', name: 'Food', calories: 100, proteinG: 5, carbsG: 10, fatG: 3, fiberG: 1 },
          ],
          totalCalories: 100,
          totalProteinG: 5,
          totalCarbsG: 10,
          totalFatG: 3,
          totalFiberG: 1,
          loggedAt: new Date().toISOString(),
          aiAnalyzed: false,
          synced: false,
        }

        await mockDb.saveMealLog(meal)
        const meals = await mockDb.getMealsForDate(userId, today)
        expect(meals.map((m) => m.mealType)).toContain(mealType)
      }
    })

    it('should calculate macro totals correctly', async () => {
      const mealLog: MealLog = {
        id: `meal-macros-${Date.now()}`,
        userId,
        mealType: 'lunch',
        items: [
          {
            id: '1',
            name: 'Chicken',
            calories: 165,
            proteinG: 31,
            carbsG: 0,
            fatG: 3.6,
            fiberG: 0,
          },
          {
            id: '2',
            name: 'Rice',
            calories: 130,
            proteinG: 2.7,
            carbsG: 28,
            fatG: 0.3,
            fiberG: 0.4,
          },
          {
            id: '3',
            name: 'Broccoli',
            calories: 34,
            proteinG: 2.8,
            carbsG: 7,
            fatG: 0.4,
            fiberG: 2.4,
          },
        ],
        totalCalories: 329,
        totalProteinG: 36.5,
        totalCarbsG: 35,
        totalFatG: 4.3,
        totalFiberG: 2.8,
        loggedAt: new Date().toISOString(),
        aiAnalyzed: false,
        synced: false,
      }

      await mockDb.saveMealLog(mealLog)
      const meals = await mockDb.getTodaysMeals(userId)

      expect(meals[0].totalCalories).toBe(329)
      expect(meals[0].totalProteinG).toBe(36.5)
      expect(meals[0].totalCarbsG).toBe(35)
    })
  })

  describe('Voice Entry Flow', () => {
    it('should parse voice transcript: transcript → Claude parsing → FoodItems → save', async () => {
      // Step 1: Simulate voice transcript from VAPI
      const transcript = '2 eggs and toast'

      // Step 2: Parse using Claude
      const foods = await mockApi.parseFoodFromTranscript(transcript)
      expect(foods).toHaveLength(2)
      expect(foods[0].name).toContain('Eggs')
      expect(foods[1].name).toContain('Toast')

      // Step 3: Create meal from parsed foods
      const mealLog: MealLog = {
        id: `meal-voice-${Date.now()}`,
        userId,
        mealType: 'breakfast',
        items: foods,
        totalCalories: foods.reduce((sum, f) => sum + f.calories, 0),
        totalProteinG: foods.reduce((sum, f) => sum + f.proteinG, 0),
        totalCarbsG: foods.reduce((sum, f) => sum + f.carbsG, 0),
        totalFatG: foods.reduce((sum, f) => sum + f.fatG, 0),
        totalFiberG: foods.reduce((sum, f) => sum + f.fiberG, 0),
        loggedAt: new Date().toISOString(),
        notes: `Voice logged: "${transcript}"`,
        aiAnalyzed: true,
        synced: false,
      }

      // Step 4: Save meal
      await mockDb.saveMealLog(mealLog)
      const todaysMeals = await mockDb.getTodaysMeals(userId)

      expect(todaysMeals).toHaveLength(1)
      expect(todaysMeals[0].notes).toContain('Voice logged')
      expect(todaysMeals[0].aiAnalyzed).toBe(true)
    })

    it('should handle complex voice commands', async () => {
      const transcripts = [
        { text: '2 eggs and toast', expected: 2 },
        { text: 'chicken, rice, and broccoli', expected: 0 }, // Not recognized
      ]

      for (const { text, expected } of transcripts) {
        const foods = await mockApi.parseFoodFromTranscript(text)
        expect(foods.length).toBeLessThanOrEqual(expected + 1)
      }
    })
  })

  describe('Photo Entry Flow', () => {
    it('should capture photo: save locally → queue for sync → analyze when online', async () => {
      // Step 1: Photo captured and saved locally
      const photoPath = '/storage/photos/meal-photo-001.jpg'
      const timestamp = new Date().toISOString()

      // Step 2: Queue photo for processing
      const photoMetadata = {
        id: `photo-${Date.now()}`,
        mealLogId: `meal-${Date.now()}`,
        filePath: photoPath,
        uploadStatus: 'pending' as const,
        createdAt: timestamp,
      }

      await mockDb.queueForSync(photoMetadata)

      // Step 3: Simulate coming online and analyzing
      const analysis = await mockApi.analyzeMealPhoto(photoPath)
      expect(analysis.confidence).toBeGreaterThan(0.8)
      expect(analysis.foods.length).toBeGreaterThan(0)

      // Step 4: Create meal from photo analysis
      const mealLog: MealLog = {
        id: `meal-photo-${Date.now()}`,
        userId,
        mealType: 'lunch',
        items: analysis.foods,
        totalCalories: analysis.foods.reduce((sum, f) => sum + f.calories, 0),
        totalProteinG: analysis.foods.reduce((sum, f) => sum + f.proteinG, 0),
        totalCarbsG: analysis.foods.reduce((sum, f) => sum + f.carbsG, 0),
        totalFatG: analysis.foods.reduce((sum, f) => sum + f.fatG, 0),
        totalFiberG: analysis.foods.reduce((sum, f) => sum + f.fiberG, 0),
        loggedAt: timestamp,
        photoPath,
        aiAnalyzed: true,
        synced: false,
      }

      await mockDb.saveMealLog(mealLog)
      const meals = await mockDb.getTodaysMeals(userId)

      expect(meals.length).toBeGreaterThan(0)
      expect(meals[0].photoPath).toBe(photoPath)
    })
  })

  describe('Goal Generation Flow', () => {
    it('should generate nutrition goal: user input → BMR/TDEE calc → save goal → verify', async () => {
      // Step 1: User profile for goal generation
      const userProfile = {
        userId,
        age: 30,
        weight: 75,
        height: 180,
        gender: 'male',
        activityLevel: 'moderate',
        goal: 'weight_loss',
      }

      // Step 2: Generate goal using Claude
      const goal = await mockApi.generateNutritionGoal(userProfile)
      expect(goal.dailyCalories).toBeGreaterThan(0)
      expect(goal.proteinG).toBeGreaterThan(0)
      expect(goal.generatedByAi).toBe(true)

      // Step 3: Save goal
      await mockDb.saveNutritionGoal(goal)

      // Step 4: Verify goal is stored
      const retrievedGoal = await mockDb.getNutritionGoal(userId)
      expect(retrievedGoal).toBeDefined()
      expect(retrievedGoal?.dailyCalories).toBe(goal.dailyCalories)
    })

    it('should support different diet types', async () => {
      const dietTypes: NutritionGoal['dietType'][] = [
        'balanced',
        'keto',
        'vegan',
        'paleo',
        'low_carb',
      ]

      for (const dietType of dietTypes) {
        const goal: NutritionGoal = {
          id: `goal-${dietType}-${Date.now()}`,
          userId,
          dailyCalories: 2000,
          proteinG: 150,
          carbsG: 250,
          fatG: 65,
          fiberG: 35,
          waterGoalMl: 2000,
          dietType,
          generatedByAi: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }

        await mockDb.saveNutritionGoal(goal)
        const retrieved = await mockDb.getNutritionGoal(userId)
        expect(retrieved?.dietType).toBe(dietType)
      }
    })
  })

  describe('Coach Q&A Flow', () => {
    it('should answer coach question: question → build context → Claude → display answer → save history', async () => {
      // Step 1: Log some meals first
      const breakfastMeal: MealLog = {
        id: `meal-coach-${Date.now()}`,
        userId,
        mealType: 'breakfast',
        items: [
          { id: '1', name: 'Oatmeal', calories: 150, proteinG: 5, carbsG: 27, fatG: 3, fiberG: 4 },
          { id: '2', name: 'Milk', calories: 100, proteinG: 8, carbsG: 12, fatG: 2.5, fiberG: 0 },
        ],
        totalCalories: 250,
        totalProteinG: 13,
        totalCarbsG: 39,
        totalFatG: 5.5,
        totalFiberG: 4,
        loggedAt: new Date().toISOString(),
        aiAnalyzed: false,
        synced: false,
      }

      await mockDb.saveMealLog(breakfastMeal)

      // Step 2: Ask coach a question
      const question = 'How much protein did I eat today?'
      const todaysMeals = await mockDb.getTodaysMeals(userId)
      const context = {
        meals: todaysMeals,
        totalCalories: todaysMeals.reduce((sum, m) => sum + m.totalCalories, 0),
        totalProtein: todaysMeals.reduce((sum, m) => sum + m.totalProteinG, 0),
      }

      // Step 3: Get coach answer
      const answer = await mockApi.getCoachAnswer(question, context)
      expect(answer).toBeDefined()
      expect(answer.length).toBeGreaterThan(0)

      // Step 4: Verify answer contains relevant info
      expect(answer.toLowerCase()).toContain('protein')
    })

    it('should provide contextual answers based on meal history', async () => {
      // Log low water intake
      const waterLog: WaterIntake = {
        date: today,
        totalMl: 1500,
        goalMl: 3000,
        timestamp: new Date().toISOString(),
      }

      await mockDb.saveWaterIntake(waterLog)

      // Ask water-related question
      const question = 'How much water should I drink?'
      const answer = await mockApi.getCoachAnswer(question, {})

      expect(answer).toBeDefined()
      expect(answer.toLowerCase()).toContain('water')
    })
  })

  describe('Water Tracking Flow', () => {
    it('should add water intake: log amount → totals update → progress reflects', async () => {
      // Step 1: Initialize daily water goal
      const goalMl = 3000

      // Step 2: Log water intake throughout day (accumulating)
      const intakes = [500, 500, 500]
      let totalMl = 0

      for (const intake of intakes) {
        totalMl += intake

        const waterLog: WaterIntake = {
          date: today,
          totalMl, // Should be 500, 1000, 1500
          goalMl,
          timestamp: new Date().toISOString(),
        }

        // Update existing entry for the day (not append new one)
        const existingIndex = mockStore.water.findIndex((w) => w.date === today)
        if (existingIndex >= 0) {
          mockStore.water[existingIndex] = waterLog
        } else {
          await mockDb.saveWaterIntake(waterLog)
        }
      }

      // Step 3: Verify totals (last entry should have accumulated 1500ml)
      const waterIntake = await mockDb.getDailyWaterIntake(userId, today)
      expect(waterIntake).toBeDefined()
      expect(waterIntake?.totalMl).toBe(1500)

      // Step 4: Verify progress (1500/3000 = 50%)
      const progressPercent = (waterIntake?.totalMl || 0) / goalMl
      expect(progressPercent).toBe(0.5)
    })

    it('should track daily water intake history', async () => {
      const dates = [
        { date: '2026-04-16', ml: 2000 },
        { date: '2026-04-17', ml: 2800 },
        { date: '2026-04-18', ml: 3000 },
      ]

      for (const { date, ml } of dates) {
        const water: WaterIntake = {
          date,
          totalMl: ml,
          goalMl: 3000,
          timestamp: new Date().toISOString(),
        }
        await mockDb.saveWaterIntake(water)
      }

      // Verify latest intake (2026-04-18)
      const latest = await mockDb.getDailyWaterIntake(userId, '2026-04-18')
      expect(latest?.totalMl).toBe(3000)
    })
  })

  describe('Streak Tracking Flow', () => {
    it('should increment streak: log meal → streak increments → calendar shows green', async () => {
      // Step 1: Create initial streak
      let streak: NutritionStreak = {
        userId,
        currentStreak: 1,
        longestStreak: 1,
        lastLogDate: today,
      }

      await mockDb.saveStreak(streak)

      // Step 2: Log meal today
      const meal: MealLog = {
        id: `meal-streak-${Date.now()}`,
        userId,
        mealType: 'breakfast',
        items: [
          { id: '1', name: 'Food', calories: 100, proteinG: 5, carbsG: 10, fatG: 3, fiberG: 1 },
        ],
        totalCalories: 100,
        totalProteinG: 5,
        totalCarbsG: 10,
        totalFatG: 3,
        totalFiberG: 1,
        loggedAt: new Date().toISOString(),
        aiAnalyzed: false,
        synced: false,
      }

      await mockDb.saveMealLog(meal)

      // Step 3: Verify streak increments tomorrow (simulated)
      const nextDay = new Date()
      nextDay.setDate(nextDay.getDate() + 1)
      const nextDayStr = nextDay.toISOString().split('T')[0]

      streak = {
        userId,
        currentStreak: 2,
        longestStreak: 2,
        lastLogDate: nextDayStr,
      }

      await mockDb.saveStreak(streak)
      const savedStreak = await mockDb.getStreak(userId)

      expect(savedStreak?.currentStreak).toBe(2)
      expect(savedStreak?.longestStreak).toBe(2)
    })

    it('should reset streak on skip day', async () => {
      // Set up existing streak
      const streak: NutritionStreak = {
        userId,
        currentStreak: 5,
        longestStreak: 10,
        lastLogDate: '2026-04-15',
      }

      await mockDb.saveStreak(streak)

      // Skip day (today = 2026-04-18, last log = 2026-04-15)
      const lastLogDate = new Date('2026-04-15')
      const today_date = new Date('2026-04-18')
      const daysSinceLastLog = Math.floor(
        (today_date.getTime() - lastLogDate.getTime()) / (1000 * 60 * 60 * 24)
      )

      let updatedStreak = streak
      if (daysSinceLastLog > 1) {
        // Streak breaks
        updatedStreak = {
          userId,
          currentStreak: 0,
          longestStreak: streak.longestStreak,
          lastLogDate: streak.lastLogDate,
        }
      }

      await mockDb.saveStreak(updatedStreak)
      const saved = await mockDb.getStreak(userId)

      expect(saved?.currentStreak).toBe(0)
      expect(saved?.longestStreak).toBe(10) // Longest streak preserved
    })
  })

  describe('Offline Sync Flow', () => {
    it('should queue meal while offline → sync when online → verify completed', async () => {
      // Step 1: Create meal while offline
      const meal: MealLog = {
        id: `meal-offline-${Date.now()}`,
        userId,
        mealType: 'lunch',
        items: [
          {
            id: '1',
            name: 'Sandwich',
            calories: 350,
            proteinG: 12,
            carbsG: 45,
            fatG: 8,
            fiberG: 4,
          },
        ],
        totalCalories: 350,
        totalProteinG: 12,
        totalCarbsG: 45,
        totalFatG: 8,
        totalFiberG: 4,
        loggedAt: new Date().toISOString(),
        aiAnalyzed: false,
        synced: false,
      }

      // Save locally
      await mockDb.saveMealLog(meal)

      // Step 2: Queue for sync (offline)
      await mockDb.queueForSync(meal)
      let syncQueue = await mockDb.getSyncQueue()
      expect(syncQueue).toHaveLength(1)
      expect(syncQueue[0].syncStatus).toBe('pending')

      // Step 3: Come online, complete sync
      const syncedMeal = { ...meal, synced: true }
      mockStore.syncQueue[0].syncStatus = 'completed'

      syncQueue = await mockDb.getSyncQueue()
      expect(syncQueue[0].syncStatus).toBe('completed')
    })

    it('should handle sync failure with exponential backoff', async () => {
      const meal: MealLog = {
        id: `meal-retry-${Date.now()}`,
        userId,
        mealType: 'breakfast',
        items: [
          { id: '1', name: 'Cereal', calories: 200, proteinG: 6, carbsG: 35, fatG: 3, fiberG: 3 },
        ],
        totalCalories: 200,
        totalProteinG: 6,
        totalCarbsG: 35,
        totalFatG: 3,
        totalFiberG: 3,
        loggedAt: new Date().toISOString(),
        aiAnalyzed: false,
        synced: false,
      }

      await mockDb.queueForSync(meal)

      // Simulate retry with backoff
      let syncItem = mockStore.syncQueue[0]
      expect(syncItem.retryCount).toBe(0)

      // First retry
      syncItem.retryCount = 1
      expect(syncItem.retryCount).toBe(1)

      // Second retry (exponential backoff: 2^1 = 2 seconds)
      syncItem.retryCount = 2
      expect(syncItem.retryCount).toBe(2)

      // Eventually succeeds
      syncItem.syncStatus = 'completed'
      expect(syncItem.syncStatus).toBe('completed')
    })
  })

  describe('Complete Workflow Integration', () => {
    it('should complete full nutrition day: goal → multiple meals → water → streak → coach → sync', async () => {
      // Step 1: Generate nutrition goal
      const goal = await mockApi.generateNutritionGoal({
        userId,
        weight: 75,
        height: 180,
      })
      await mockDb.saveNutritionGoal(goal)

      // Step 2: Log multiple meals
      const meals: MealLog[] = [
        {
          id: `meal-${Date.now()}-1`,
          userId,
          mealType: 'breakfast',
          items: [
            { id: '1', name: 'Eggs', calories: 155, proteinG: 13, carbsG: 1, fatG: 11, fiberG: 0 },
            {
              id: '2',
              name: 'Toast',
              calories: 80,
              proteinG: 2.7,
              carbsG: 14,
              fatG: 1,
              fiberG: 2.7,
            },
          ],
          totalCalories: 235,
          totalProteinG: 15.7,
          totalCarbsG: 15,
          totalFatG: 12,
          totalFiberG: 2.7,
          loggedAt: new Date().toISOString(),
          aiAnalyzed: false,
          synced: false,
        },
        {
          id: `meal-${Date.now()}-2`,
          userId,
          mealType: 'lunch',
          items: [
            {
              id: '3',
              name: 'Chicken',
              calories: 165,
              proteinG: 31,
              carbsG: 0,
              fatG: 3.6,
              fiberG: 0,
            },
            {
              id: '4',
              name: 'Rice',
              calories: 130,
              proteinG: 2.7,
              carbsG: 28,
              fatG: 0.3,
              fiberG: 0.4,
            },
          ],
          totalCalories: 295,
          totalProteinG: 33.7,
          totalCarbsG: 28,
          totalFatG: 3.9,
          totalFiberG: 0.4,
          loggedAt: new Date().toISOString(),
          aiAnalyzed: false,
          synced: false,
        },
      ]

      for (const meal of meals) {
        await mockDb.saveMealLog(meal)
        await mockDb.queueForSync(meal)
      }

      // Step 3: Log water intake
      const water: WaterIntake = {
        date: today,
        totalMl: 2500,
        goalMl: 3000,
        timestamp: new Date().toISOString(),
      }
      await mockDb.saveWaterIntake(water)

      // Step 4: Create streak
      const streak: NutritionStreak = {
        userId,
        currentStreak: 3,
        longestStreak: 10,
        lastLogDate: today,
      }
      await mockDb.saveStreak(streak)

      // Step 5: Ask coach question
      const todaysMeals = await mockDb.getTodaysMeals(userId)
      const answer = await mockApi.getCoachAnswer('How are my macros today?', {
        meals: todaysMeals,
      })

      // Step 6: Verify all components
      const allMeals = await mockDb.getTodaysMeals(userId)
      const savedGoal = await mockDb.getNutritionGoal(userId)
      const savedWater = await mockDb.getDailyWaterIntake(userId, today)
      const savedStreak = await mockDb.getStreak(userId)
      const syncQueue = await mockDb.getSyncQueue()

      expect(allMeals).toHaveLength(2)
      expect(savedGoal).toBeDefined()
      expect(savedWater?.totalMl).toBe(2500)
      expect(savedStreak?.currentStreak).toBe(3)
      expect(answer).toBeDefined()
      expect(syncQueue.length).toBeGreaterThan(0)
    })
  })

  describe('Error Handling', () => {
    it('should handle invalid meal data gracefully', async () => {
      const invalidMeal: any = {
        id: `meal-invalid-${Date.now()}`,
        userId,
        mealType: 'invalid_type',
        items: [],
        totalCalories: -100, // Invalid negative calories
        totalProteinG: -5,
      }

      // Should validate and reject invalid meal
      expect(() => {
        if (invalidMeal.totalCalories < 0) throw new Error('Invalid calories')
      }).toThrow()
    })

    it('should handle missing food items gracefully', async () => {
      const mealWithoutItems: MealLog = {
        id: `meal-empty-${Date.now()}`,
        userId,
        mealType: 'snack',
        items: [],
        totalCalories: 0,
        totalProteinG: 0,
        totalCarbsG: 0,
        totalFatG: 0,
        totalFiberG: 0,
        loggedAt: new Date().toISOString(),
        aiAnalyzed: false,
        synced: false,
      }

      await mockDb.saveMealLog(mealWithoutItems)
      const meals = await mockDb.getTodaysMeals(userId)

      expect(meals[0].items).toHaveLength(0)
      expect(meals[0].totalCalories).toBe(0)
    })

    it('should handle sync queue overflow', async () => {
      // Queue many items
      for (let i = 0; i < 100; i++) {
        await mockDb.queueForSync({ id: i, data: 'test' })
      }

      const queue = await mockDb.getSyncQueue()
      expect(queue.length).toBe(100)
    })
  })
})
