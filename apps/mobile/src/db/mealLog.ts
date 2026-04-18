import { getDatabase } from './sqlite'
import type { MealLog, MealType } from '@fitai/shared-types'

/**
 * Create meal_logs table if it doesn't exist
 */
export async function createMealLogTable(): Promise<void> {
  const db = getDatabase()
  try {
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS meal_logs (
        id TEXT PRIMARY KEY,
        userId TEXT NOT NULL,
        loggedAt INTEGER,
        mealType TEXT,
        photoUrl TEXT,
        aiAnalyzed INTEGER DEFAULT 0,
        totalCalories INTEGER,
        totalProteinG REAL,
        totalCarbsG REAL,
        totalFatG REAL,
        notes TEXT,
        syncedAt INTEGER
      );
      CREATE INDEX IF NOT EXISTS idx_meal_logs_userId_loggedAt ON meal_logs(userId, loggedAt)
    `)
  } catch (error) {
    console.error('Error creating meal log table:', error)
    throw error
  }
}

/**
 * Save a meal log to local database
 */
export async function saveMealLog(meal: MealLog): Promise<void> {
  const db = getDatabase()
  try {
    await db.runAsync(
      `INSERT OR REPLACE INTO meal_logs
       (id, userId, loggedAt, mealType, photoUrl, aiAnalyzed, totalCalories, totalProteinG, totalCarbsG, totalFatG, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        meal.id,
        meal.userId,
        meal.loggedAt instanceof Date ? meal.loggedAt.getTime() : meal.loggedAt,
        meal.mealType,
        meal.photoUrl || null,
        meal.aiAnalyzed ? 1 : 0,
        Math.round(meal.totalCalories),
        meal.totalProteinG,
        meal.totalCarbsG,
        meal.totalFatG,
        meal.notes || null,
      ]
    )
  } catch (error) {
    console.error('Error saving meal log:', error)
    throw error
  }
}

/**
 * Get meal log by ID
 */
export async function getMealLog(mealId: string): Promise<MealLog | null> {
  const db = getDatabase()
  try {
    const result = await db.getFirstAsync<any>(`SELECT * FROM meal_logs WHERE id = ?`, [mealId])

    if (!result) return null

    return {
      id: result.id,
      userId: result.userId,
      loggedAt: new Date(result.loggedAt),
      mealType: result.mealType as MealType,
      items: [],
      photoUrl: result.photoUrl,
      aiAnalyzed: result.aiAnalyzed === 1,
      totalCalories: result.totalCalories,
      totalProteinG: result.totalProteinG,
      totalCarbsG: result.totalCarbsG,
      totalFatG: result.totalFatG,
      notes: result.notes,
    }
  } catch (error) {
    console.error('Error fetching meal log:', error)
    throw error
  }
}

/**
 * Get all meals for a specific date
 */
export async function getMealsForDate(userId: string, date: string): Promise<MealLog[]> {
  const db = getDatabase()
  try {
    // Parse date string (YYYY-MM-DD) and get timestamp range for that day
    const startDate = new Date(date)
    startDate.setHours(0, 0, 0, 0)
    const endDate = new Date(date)
    endDate.setHours(23, 59, 59, 999)

    const results = await db.getAllAsync<any>(
      `SELECT * FROM meal_logs
       WHERE userId = ? AND loggedAt >= ? AND loggedAt <= ?
       ORDER BY loggedAt ASC`,
      [userId, startDate.getTime(), endDate.getTime()]
    )

    return (results || []).map((r) => ({
      id: r.id,
      userId: r.userId,
      loggedAt: new Date(r.loggedAt),
      mealType: r.mealType as MealType,
      items: [],
      photoUrl: r.photoUrl,
      aiAnalyzed: r.aiAnalyzed === 1,
      totalCalories: r.totalCalories,
      totalProteinG: r.totalProteinG,
      totalCarbsG: r.totalCarbsG,
      totalFatG: r.totalFatG,
      notes: r.notes,
    }))
  } catch (error) {
    console.error('Error fetching meals for date:', error)
    throw error
  }
}

/**
 * Get meals within a date range
 */
export async function getMealsInRange(
  userId: string,
  startDate: string,
  endDate: string
): Promise<MealLog[]> {
  const db = getDatabase()
  try {
    const start = new Date(startDate)
    start.setHours(0, 0, 0, 0)
    const end = new Date(endDate)
    end.setHours(23, 59, 59, 999)

    const results = await db.getAllAsync<any>(
      `SELECT * FROM meal_logs
       WHERE userId = ? AND loggedAt >= ? AND loggedAt <= ?
       ORDER BY loggedAt DESC`,
      [userId, start.getTime(), end.getTime()]
    )

    return (results || []).map((r) => ({
      id: r.id,
      userId: r.userId,
      loggedAt: new Date(r.loggedAt),
      mealType: r.mealType as MealType,
      items: [],
      photoUrl: r.photoUrl,
      aiAnalyzed: r.aiAnalyzed === 1,
      totalCalories: r.totalCalories,
      totalProteinG: r.totalProteinG,
      totalCarbsG: r.totalCarbsG,
      totalFatG: r.totalFatG,
      notes: r.notes,
    }))
  } catch (error) {
    console.error('Error fetching meals in range:', error)
    throw error
  }
}

/**
 * Delete a meal log
 */
export async function deleteMealLog(mealId: string): Promise<void> {
  const db = getDatabase()
  try {
    await db.runAsync(`DELETE FROM meal_logs WHERE id = ?`, [mealId])
  } catch (error) {
    console.error('Error deleting meal log:', error)
    throw error
  }
}

/**
 * Get unsynced meals
 */
export async function getUnsyncedMeals(userId: string): Promise<MealLog[]> {
  const db = getDatabase()
  try {
    const results = await db.getAllAsync<any>(
      `SELECT * FROM meal_logs WHERE userId = ? AND syncedAt IS NULL ORDER BY loggedAt ASC`,
      [userId]
    )

    return (results || []).map((r) => ({
      id: r.id,
      userId: r.userId,
      loggedAt: new Date(r.loggedAt),
      mealType: r.mealType as MealType,
      items: [],
      photoUrl: r.photoUrl,
      aiAnalyzed: r.aiAnalyzed === 1,
      totalCalories: r.totalCalories,
      totalProteinG: r.totalProteinG,
      totalCarbsG: r.totalCarbsG,
      totalFatG: r.totalFatG,
      notes: r.notes,
    }))
  } catch (error) {
    console.error('Error fetching unsynced meals:', error)
    throw error
  }
}

/**
 * Mark meal as synced
 */
export async function markMealSynced(mealId: string): Promise<void> {
  const db = getDatabase()
  try {
    await db.runAsync(`UPDATE meal_logs SET syncedAt = ? WHERE id = ?`, [Date.now(), mealId])
  } catch (error) {
    console.error('Error marking meal synced:', error)
    throw error
  }
}
