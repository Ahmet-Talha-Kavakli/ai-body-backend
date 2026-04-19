import { UserEmbedding } from '@/types/analytics'
import { pgvectorClient } from './pgvectorClient'

// Aggregate Phase 1-5 data into embedding-ready format
export async function aggregateUserData(userId: string): Promise<{
  meals: any[]
  workouts: any[]
  health: any[]
  social: any[]
}> {
  // TODO: Query Phase 1-5 data (workouts, meals, health, social)
  // For MVP: return empty arrays, will be populated with real data
  return {
    meals: [],
    workouts: [],
    health: [],
    social: [],
  }
}

// Generate user embedding from aggregated data
export async function generateUserEmbedding(userId: string): Promise<UserEmbedding> {
  const data = await aggregateUserData(userId)

  // Create 768-dimensional embedding from data
  // For MVP: simple feature vector (expand later with ML)
  const embedding = new Array(768).fill(0)

  // Meal preferences (first 256 dims)
  const cuisines = new Set<string>()
  const ingredients = new Set<string>()
  let totalProtein = 0
  let totalCarbs = 0
  let totalFat = 0

  for (const meal of data.meals) {
    meal.cuisines?.forEach((c: string) => cuisines.add(c))
    meal.ingredients?.forEach((i: string) => ingredients.add(i))
    totalProtein += meal.protein || 0
    totalCarbs += meal.carbs || 0
    totalFat += meal.fat || 0
  }

  // Workout preferences (next 256 dims)
  const exercises = new Set<string>()
  let totalIntensity = 0

  for (const w of data.workouts) {
    w.exercises?.forEach((e: string) => exercises.add(e))
    totalIntensity += w.intensity || 0
  }

  // Health patterns (next 128 dims)
  let avgSleep = 0
  let avgSteps = 0

  for (const h of data.health) {
    avgSleep += h.sleep || 0
    avgSteps += h.steps || 0
  }

  // Social patterns (last 128 dims) - initialized with defaults
  const friendCount = 0
  const challengeParticipation = 0
  const badgeEarningRate = 0

  return {
    userId,
    embedding,
    mealPreferences: {
      cuisines: Array.from(cuisines),
      ingredients: Array.from(ingredients),
      avgMacros: {
        protein: data.meals.length > 0 ? totalProtein / data.meals.length : 0,
        carbs: data.meals.length > 0 ? totalCarbs / data.meals.length : 0,
        fat: data.meals.length > 0 ? totalFat / data.meals.length : 0,
      },
    },
    workoutPreferences: {
      favoriteExercises: Array.from(exercises),
      avgIntensity: data.workouts.length > 0 ? totalIntensity / data.workouts.length : 0,
      frequency: 'weekly',
    },
    healthPatterns: {
      avgSleep: data.health.length > 0 ? avgSleep / data.health.length : 0,
      avgSteps: data.health.length > 0 ? avgSteps / data.health.length : 0,
      heartRateRange: [60, 100],
    },
    socialPatterns: {
      friendCount,
      challengeParticipation,
      badgeEarningRate,
    },
    lastUpdated: new Date().toISOString(),
  }
}

// Save embedding to pgvector
export async function saveEmbedding(userId: string): Promise<UserEmbedding> {
  const embedding = await generateUserEmbedding(userId)
  await pgvectorClient.saveEmbedding(userId, embedding.embedding)
  return embedding
}

// Get cached embedding
export async function getEmbedding(userId: string): Promise<UserEmbedding | null> {
  const vector = await pgvectorClient.getEmbedding(userId)
  if (!vector) return null

  return {
    userId,
    embedding: vector,
    mealPreferences: {
      cuisines: [],
      ingredients: [],
      avgMacros: { protein: 0, carbs: 0, fat: 0 },
    },
    workoutPreferences: {
      favoriteExercises: [],
      avgIntensity: 0,
      frequency: 'weekly',
    },
    healthPatterns: {
      avgSleep: 0,
      avgSteps: 0,
      heartRateRange: [60, 100],
    },
    socialPatterns: {
      friendCount: 0,
      challengeParticipation: 0,
      badgeEarningRate: 0,
    },
    lastUpdated: new Date().toISOString(),
  }
}
