import { getDatabase } from './sqlite'
import * as FileSystem from 'expo-file-system'

export interface MealPhoto {
  id: string
  mealLogId: string
  filePath: string
  uploadStatus: 'pending' | 'uploading' | 'success' | 'failed'
  remoteUrl?: string
  createdAt: number
}

/**
 * Create meal_photos table if it doesn't exist
 */
export async function createPhotoTable(): Promise<void> {
  const db = getDatabase()
  try {
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS meal_photos (
        id TEXT PRIMARY KEY,
        mealLogId TEXT NOT NULL,
        filePath TEXT NOT NULL,
        uploadStatus TEXT NOT NULL DEFAULT 'pending',
        remoteUrl TEXT,
        createdAt INTEGER,
        UNIQUE(mealLogId, filePath)
      )
    `)
  } catch (error) {
    console.error('Error creating photo table:', error)
    throw error
  }
}

/**
 * Save a photo record to database
 */
export async function savePhotoRecord(photo: MealPhoto): Promise<void> {
  const db = getDatabase()
  try {
    await db.runAsync(
      `INSERT INTO meal_photos (id, mealLogId, filePath, uploadStatus, remoteUrl, createdAt)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        photo.id,
        photo.mealLogId,
        photo.filePath,
        photo.uploadStatus,
        photo.remoteUrl || null,
        photo.createdAt,
      ]
    )
  } catch (error) {
    console.error('Error saving photo record:', error)
    throw error
  }
}

/**
 * Get photo record for a meal
 */
export async function getPhotoForMeal(mealLogId: string): Promise<MealPhoto | null> {
  const db = getDatabase()
  try {
    const result = await db.getFirstAsync<MealPhoto>(
      `SELECT * FROM meal_photos WHERE mealLogId = ? LIMIT 1`,
      [mealLogId]
    )
    return result || null
  } catch (error) {
    console.error('Error fetching photo for meal:', error)
    throw error
  }
}

/**
 * Get all photos for a meal log (some meals may have multiple photos)
 */
export async function getPhotosForMeal(mealLogId: string): Promise<MealPhoto[]> {
  const db = getDatabase()
  try {
    const results = await db.getAllAsync<MealPhoto>(
      `SELECT * FROM meal_photos WHERE mealLogId = ? ORDER BY createdAt DESC`,
      [mealLogId]
    )
    return results || []
  } catch (error) {
    console.error('Error fetching photos for meal:', error)
    throw error
  }
}

/**
 * Update photo upload status
 */
export async function updatePhotoUploadStatus(
  photoId: string,
  status: 'pending' | 'uploading' | 'success' | 'failed',
  remoteUrl?: string
): Promise<void> {
  const db = getDatabase()
  try {
    const query = remoteUrl
      ? `UPDATE meal_photos SET uploadStatus = ?, remoteUrl = ? WHERE id = ?`
      : `UPDATE meal_photos SET uploadStatus = ? WHERE id = ?`

    const params = remoteUrl ? [status, remoteUrl, photoId] : [status, photoId]

    await db.runAsync(query, params)
  } catch (error) {
    console.error('Error updating photo upload status:', error)
    throw error
  }
}

/**
 * Delete a photo record and optionally remove file
 */
export async function deletePhotoRecord(
  photoId: string,
  removeFile: boolean = false
): Promise<void> {
  const db = getDatabase()
  try {
    // Get photo record first to get file path
    const photo = await db.getFirstAsync<MealPhoto>(`SELECT * FROM meal_photos WHERE id = ?`, [
      photoId,
    ])

    if (photo && removeFile) {
      try {
        await FileSystem.deleteAsync(photo.filePath)
      } catch (error) {
        console.warn('Error deleting photo file:', error)
      }
    }

    await db.runAsync(`DELETE FROM meal_photos WHERE id = ?`, [photoId])
  } catch (error) {
    console.error('Error deleting photo record:', error)
    throw error
  }
}

/**
 * Get pending uploads (photos not yet synced to server)
 */
export async function getPendingPhotoUploads(): Promise<MealPhoto[]> {
  const db = getDatabase()
  try {
    const results = await db.getAllAsync<MealPhoto>(
      `SELECT * FROM meal_photos WHERE uploadStatus IN ('pending', 'failed') ORDER BY createdAt ASC`,
      []
    )
    return results || []
  } catch (error) {
    console.error('Error fetching pending uploads:', error)
    throw error
  }
}

/**
 * Get all pending photos to upload for a specific meal
 */
export async function getPendingPhotosForMeal(mealLogId: string): Promise<MealPhoto[]> {
  const db = getDatabase()
  try {
    const results = await db.getAllAsync<MealPhoto>(
      `SELECT * FROM meal_photos WHERE mealLogId = ? AND uploadStatus != 'success' ORDER BY createdAt ASC`,
      [mealLogId]
    )
    return results || []
  } catch (error) {
    console.error('Error fetching pending photos for meal:', error)
    throw error
  }
}
