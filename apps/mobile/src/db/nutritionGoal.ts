import { openDatabaseSync } from 'expo-sqlite'
import type { NutritionGoal } from '../types/nutrition'

const db = openDatabaseSync('nutrition.db')

export async function createGoalTable(): Promise<void> {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS nutrition_goals (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL UNIQUE,
      dailyCalories REAL NOT NULL,
      proteinG REAL NOT NULL,
      carbsG REAL NOT NULL,
      fatG REAL NOT NULL,
      fiberG REAL NOT NULL,
      waterGoalMl REAL NOT NULL,
      generatedByAi INTEGER NOT NULL,
      dietType TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_nutrition_goals_userId ON nutrition_goals(userId);
  `)
}

export async function saveGoal(goal: NutritionGoal): Promise<void> {
  await db.runAsync(
    `INSERT OR REPLACE INTO nutrition_goals
     (id, userId, dailyCalories, proteinG, carbsG, fatG, fiberG, waterGoalMl, generatedByAi, dietType, createdAt, updatedAt)
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
      goal.dietType,
      goal.createdAt,
      goal.updatedAt,
    ]
  )
}

export async function getGoal(userId: string): Promise<NutritionGoal | null> {
  const result = await db.getFirstAsync(
    `SELECT * FROM nutrition_goals WHERE userId = ? ORDER BY createdAt DESC LIMIT 1`,
    [userId]
  )

  if (!result) return null

  const row = result as any
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

// Legacy aliases for compatibility
export const createNutritionGoalTable = createGoalTable
export const saveNutritionGoal = saveGoal
export const getNutritionGoal = getGoal
