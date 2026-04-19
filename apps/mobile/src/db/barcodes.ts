/**
 * Barcode Database Module
 *
 * Manages SQLite storage for barcode lookups and meal suggestions.
 * Tables: barcode_results, meal_suggestions, shared_meals
 */

import { openDatabaseSync } from 'expo-sqlite'
import { v4 as uuidv4 } from 'uuid'
import type {
  BarcodeResult,
  BarcodeResultRow,
  MealSuggestion,
  MealSuggestionRow,
  SharedMeal,
  SharedMealRow,
  BarcodeLookupResponse,
} from '../types/barcode'

const db = openDatabaseSync('nutrition.db')

/**
 * Initialize the barcode tables
 */
export async function initializeBarcodeTables(): Promise<void> {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS barcode_results (
      id TEXT PRIMARY KEY,
      barcode TEXT NOT NULL UNIQUE,
      foodName TEXT NOT NULL,
      nutrition TEXT NOT NULL,
      source TEXT NOT NULL,
      servingSize TEXT NOT NULL,
      servingSizeG REAL NOT NULL,
      cachedAt TEXT NOT NULL,
      expiresAt TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_barcode_barcode ON barcode_results(barcode);
    CREATE INDEX IF NOT EXISTS idx_barcode_expiresAt ON barcode_results(expiresAt);

    CREATE TABLE IF NOT EXISTS meal_suggestions (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      mealName TEXT NOT NULL,
      nutrition TEXT NOT NULL,
      reasonForSuggestion TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      expiresAt TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_meal_userId ON meal_suggestions(userId);
    CREATE INDEX IF NOT EXISTS idx_meal_expiresAt ON meal_suggestions(expiresAt);

    CREATE TABLE IF NOT EXISTS shared_meals (
      id TEXT PRIMARY KEY,
      mealLogId TEXT NOT NULL,
      userId TEXT NOT NULL,
      shareType TEXT NOT NULL,
      sharedWith TEXT NOT NULL,
      createdAt TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_shared_mealLogId ON shared_meals(mealLogId);
    CREATE INDEX IF NOT EXISTS idx_shared_userId ON shared_meals(userId);
  `)
}

/**
 * Create a barcode result record
 * Note: For testing purposes, we use foodName as the barcode since the request doesn't include it
 */
export async function createBarcodeResult(data: BarcodeLookupResponse & { barcode?: string }): Promise<BarcodeResult> {
  const id = uuidv4()
  const now = new Date()
  const cachedAt = now.toISOString()
  const barcode = data.barcode || `barcode-${id}`

  // Set expiration to 30 days from now
  const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
  const expiresAtIso = expiresAt.toISOString()

  const nutritionJson = JSON.stringify(data.nutrition)

  await db.runAsync(
    `INSERT INTO barcode_results (
      id, barcode, foodName, nutrition, source, servingSize, servingSizeG, cachedAt, expiresAt
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, barcode, data.foodName, nutritionJson, data.source, data.servingSize, data.servingSizeG, cachedAt, expiresAtIso],
  )

  return {
    id,
    barcode,
    foodName: data.foodName,
    nutrition: data.nutrition,
    source: data.source,
    servingSize: data.servingSize,
    servingSizeG: data.servingSizeG,
    cachedAt,
    expiresAt: expiresAtIso,
  }
}

/**
 * Get a barcode result by ID
 */
export async function getBarcodeResult(id: string): Promise<BarcodeResult | undefined> {
  const row = await db.getFirstAsync<BarcodeResultRow>(
    `SELECT * FROM barcode_results WHERE id = ?`,
    [id],
  )

  if (!row) {
    return undefined
  }

  return convertBarcodeRow(row)
}

/**
 * Get cached barcode by barcode value (if not expired)
 */
export async function getCachedBarcode(barcode: string): Promise<BarcodeResult | undefined> {
  const row = await db.getFirstAsync<BarcodeResultRow>(
    `SELECT * FROM barcode_results WHERE barcode = ? AND expiresAt > ?`,
    [barcode, new Date().toISOString()],
  )

  if (!row) {
    return undefined
  }

  return convertBarcodeRow(row)
}

/**
 * Delete a barcode result
 */
export async function deleteBarcodeResult(id: string): Promise<void> {
  await db.runAsync(`DELETE FROM barcode_results WHERE id = ?`, [id])
}

/**
 * Create a meal suggestion
 */
export async function createMealSuggestion(
  userId: string,
  mealData: BarcodeLookupResponse,
  reasonForSuggestion: string,
): Promise<MealSuggestion> {
  const id = uuidv4()
  const now = new Date()
  const createdAt = now.toISOString()

  // Set expiration to 7 days from now
  const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
  const expiresAtIso = expiresAt.toISOString()

  const nutritionJson = JSON.stringify(mealData.nutrition)

  await db.runAsync(
    `INSERT INTO meal_suggestions (
      id, userId, mealName, nutrition, reasonForSuggestion, createdAt, expiresAt
    ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [id, userId, mealData.foodName, nutritionJson, reasonForSuggestion, createdAt, expiresAtIso],
  )

  return {
    id,
    userId,
    mealName: mealData.foodName,
    nutrition: mealData.nutrition,
    reasonForSuggestion,
    createdAt,
    expiresAt: expiresAtIso,
  }
}

/**
 * Get meal suggestions for a user
 */
export async function getMealSuggestions(userId: string): Promise<MealSuggestion[]> {
  const rows = await db.getAllAsync<MealSuggestionRow>(
    `SELECT * FROM meal_suggestions WHERE userId = ? AND expiresAt > ? ORDER BY createdAt DESC`,
    [userId, new Date().toISOString()],
  )

  return rows.map(convertMealSuggestionRow)
}

/**
 * Delete a meal suggestion
 */
export async function deleteMealSuggestion(id: string): Promise<void> {
  await db.runAsync(`DELETE FROM meal_suggestions WHERE id = ?`, [id])
}

/**
 * Create a shared meal record
 */
export async function createSharedMeal(
  mealLogId: string,
  userId: string,
  shareType: 'friend' | 'group' | 'public',
  sharedWith: string[],
): Promise<SharedMeal> {
  const id = uuidv4()
  const createdAt = new Date().toISOString()
  const sharedWithJson = JSON.stringify(sharedWith)

  await db.runAsync(
    `INSERT OR REPLACE INTO shared_meals (
      id, mealLogId, userId, shareType, sharedWith, createdAt
    ) VALUES (?, ?, ?, ?, ?, ?)`,
    [id, mealLogId, userId, shareType, sharedWithJson, createdAt],
  )

  return {
    id,
    mealLogId,
    userId,
    shareType,
    sharedWith,
    createdAt,
  }
}

/**
 * Get a shared meal by ID
 */
export async function getSharedMeal(id: string): Promise<SharedMeal | undefined> {
  const row = await db.getFirstAsync<SharedMealRow>(
    `SELECT * FROM shared_meals WHERE id = ?`,
    [id],
  )

  if (!row) {
    return undefined
  }

  return convertSharedMealRow(row)
}

/**
 * Delete a shared meal
 */
export async function deleteSharedMeal(id: string): Promise<void> {
  await db.runAsync(`DELETE FROM shared_meals WHERE id = ?`, [id])
}

/**
 * Convert barcode result row to object
 */
function convertBarcodeRow(row: BarcodeResultRow): BarcodeResult {
  return {
    id: row.id,
    barcode: row.barcode,
    foodName: row.foodName,
    nutrition: JSON.parse(row.nutrition),
    source: row.source,
    servingSize: row.servingSize,
    servingSizeG: row.servingSizeG,
    cachedAt: row.cachedAt,
    expiresAt: row.expiresAt,
  }
}

/**
 * Convert meal suggestion row to object
 */
function convertMealSuggestionRow(row: MealSuggestionRow): MealSuggestion {
  return {
    id: row.id,
    userId: row.userId,
    mealName: row.mealName,
    nutrition: JSON.parse(row.nutrition),
    reasonForSuggestion: row.reasonForSuggestion,
    createdAt: row.createdAt,
    expiresAt: row.expiresAt,
  }
}

/**
 * Convert shared meal row to object
 */
function convertSharedMealRow(row: SharedMealRow): SharedMeal {
  return {
    id: row.id,
    mealLogId: row.mealLogId,
    userId: row.userId,
    shareType: row.shareType,
    sharedWith: JSON.parse(row.sharedWith),
    createdAt: row.createdAt,
  }
}
