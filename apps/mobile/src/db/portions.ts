/**
 * Portion Estimation Database Module
 *
 * Manages SQLite storage for portion estimation data.
 * Tables: portion_estimations
 */

import { openDatabaseSync } from 'expo-sqlite'
import { v4 as uuidv4 } from 'uuid'
import type { PortionEstimation, PortionEstimationRow } from '../types/portion'

const db = openDatabaseSync('nutrition.db')

/**
 * Initialize the portions table
 */
export async function initializePortionTables(): Promise<void> {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS portion_estimations (
      id TEXT PRIMARY KEY,
      photoPath TEXT NOT NULL,
      foodName TEXT NOT NULL,
      estimatedPortionG REAL NOT NULL,
      estimatedPortionDescription TEXT NOT NULL,
      confidence REAL NOT NULL,
      userAdjustedPortionG REAL,
      createdAt TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_portion_foodName ON portion_estimations(foodName);
    CREATE INDEX IF NOT EXISTS idx_portion_createdAt ON portion_estimations(createdAt DESC);
  `)
}

/**
 * Create a new portion estimation record
 */
export async function createEstimation(data: {
  photoPath: string
  foodName: string
  estimatedPortionG: number
  estimatedPortionDescription: string
  confidence: number
}): Promise<PortionEstimation> {
  const id = uuidv4()
  const createdAt = new Date().toISOString()

  await db.runAsync(
    `INSERT INTO portion_estimations (
      id, photoPath, foodName, estimatedPortionG,
      estimatedPortionDescription, confidence, createdAt
    ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      data.photoPath,
      data.foodName,
      data.estimatedPortionG,
      data.estimatedPortionDescription,
      data.confidence,
      createdAt,
    ],
  )

  return {
    id,
    photoPath: data.photoPath,
    foodName: data.foodName,
    estimatedPortionG: data.estimatedPortionG,
    estimatedPortionDescription: data.estimatedPortionDescription,
    confidence: data.confidence,
    createdAt,
  }
}

/**
 * Get a portion estimation by ID
 */
export async function getEstimation(
  estimationId: string,
): Promise<PortionEstimation | undefined> {
  const row = await db.getFirstAsync<PortionEstimationRow>(
    `SELECT * FROM portion_estimations WHERE id = ?`,
    [estimationId],
  )

  if (!row) {
    return undefined
  }

  return convertRowToEstimation(row)
}

/**
 * Update a portion estimation
 */
export async function updateEstimation(
  estimationId: string,
  updates: {
    userAdjustedPortionG?: number
  },
): Promise<PortionEstimation> {
  // Check if record exists
  const existing = await getEstimation(estimationId)
  if (!existing) {
    throw new Error(`Estimation not found: ${estimationId}`)
  }

  // Update the record
  if (updates.userAdjustedPortionG !== undefined) {
    await db.runAsync(
      `UPDATE portion_estimations SET userAdjustedPortionG = ? WHERE id = ?`,
      [updates.userAdjustedPortionG, estimationId],
    )
  }

  // Return updated record
  const updated = await getEstimation(estimationId)
  if (!updated) {
    throw new Error('Failed to retrieve updated estimation')
  }

  return updated
}

/**
 * Get recent portion estimations
 */
export async function getRecentEstimations(limit: number): Promise<PortionEstimation[]> {
  const rows = await db.getAllAsync<PortionEstimationRow>(
    `SELECT * FROM portion_estimations ORDER BY createdAt DESC LIMIT ?`,
    [limit],
  )

  return rows.map(convertRowToEstimation)
}

/**
 * Delete an estimation (for cleanup)
 */
export async function deleteEstimation(estimationId: string): Promise<void> {
  await db.runAsync(`DELETE FROM portion_estimations WHERE id = ?`, [estimationId])
}

/**
 * Convert database row to PortionEstimation object
 */
function convertRowToEstimation(row: PortionEstimationRow): PortionEstimation {
  return {
    id: row.id,
    photoPath: row.photoPath,
    foodName: row.foodName,
    estimatedPortionG: row.estimatedPortionG,
    estimatedPortionDescription: row.estimatedPortionDescription,
    confidence: row.confidence,
    userAdjustedPortionG: row.userAdjustedPortionG ?? undefined,
    createdAt: row.createdAt,
  }
}
