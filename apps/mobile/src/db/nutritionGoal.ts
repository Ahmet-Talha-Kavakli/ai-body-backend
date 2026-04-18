import { getDatabase } from './sqlite'
import type { NutritionGoal } from '@fitai/shared-types'

/**
 * Create nutrition_goals table if it doesn't exist
 */
export async function createNutritionGoalTable(): Promise<void> {
  const db = getDatabase()
  try {
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS nutrition_goals (
        id TEXT PRIMARY KEY,
        userId TEXT NOT NULL UNIQUE,
        dailyCalories INTEGER,
        proteinG REAL,
        carbsG REAL,
        fatG REAL,
        waterMl INTEGER,
        generatedByAi INTEGER DEFAULT 0,
        updatedAt INTEGER,
        UNIQUE(userId)
      )
    `)
  } catch (error) {
    console.error('Error creating nutrition goal table:', error)
    throw error
  }
}

/**
 * Save or update nutrition goal
 */
export async function saveNutritionGoal(goal: NutritionGoal): Promise<void> {
  const db = getDatabase()
  try {
    await db.runAsync(
      `INSERT OR REPLACE INTO nutrition_goals
       (id, userId, dailyCalories, proteinG, carbsG, fatG, waterMl, generatedByAi, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        goal.id,
        goal.userId,
        Math.round(goal.dailyCalories),
        goal.proteinG,
        goal.carbsG,
        goal.fatG,
        goal.waterMl,
        goal.generatedByAi ? 1 : 0,
        goal.updatedAt instanceof Date ? goal.updatedAt.getTime() : goal.updatedAt,
      ]
    )
  } catch (error) {
    console.error('Error saving nutrition goal:', error)
    throw error
  }
}

/**
 * Get nutrition goal for user
 */
export async function getNutritionGoal(userId: string): Promise<NutritionGoal | null> {
  const db = getDatabase()
  try {
    const result = await db.getFirstAsync<any>(`SELECT * FROM nutrition_goals WHERE userId = ?`, [
      userId,
    ])

    if (!result) return null

    return {
      id: result.id,
      userId: result.userId,
      dailyCalories: result.dailyCalories,
      proteinG: result.proteinG,
      carbsG: result.carbsG,
      fatG: result.fatG,
      waterMl: result.waterMl,
      generatedByAi: result.generatedByAi === 1,
      updatedAt: new Date(result.updatedAt),
    }
  } catch (error) {
    console.error('Error fetching nutrition goal:', error)
    throw error
  }
}

/**
 * Delete nutrition goal
 */
export async function deleteNutritionGoal(userId: string): Promise<void> {
  const db = getDatabase()
  try {
    await db.runAsync(`DELETE FROM nutrition_goals WHERE userId = ?`, [userId])
  } catch (error) {
    console.error('Error deleting nutrition goal:', error)
    throw error
  }
}
