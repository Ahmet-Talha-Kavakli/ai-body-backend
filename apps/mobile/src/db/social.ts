import { openDatabaseSync } from 'expo-sqlite'
import type { SharedMeal, SocialFeedItem } from '../types/social'

const db = openDatabaseSync('social.db')

export async function createSocialTables(): Promise<void> {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS shared_meals (
      id TEXT PRIMARY KEY,
      mealLogId TEXT NOT NULL,
      userId TEXT NOT NULL,
      foodName TEXT NOT NULL,
      photoUrl TEXT NOT NULL,
      caloriesNum INTEGER,
      proteinG REAL,
      carbsG REAL,
      fatG REAL,
      fiberG REAL,
      shareType TEXT NOT NULL,
      sharedWith TEXT NOT NULL,
      createdAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sync_queue (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      data TEXT NOT NULL,
      createdAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS reactions (
      id TEXT PRIMARY KEY,
      sharedMealId TEXT NOT NULL,
      userId TEXT NOT NULL,
      reactionType TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      UNIQUE(sharedMealId, userId, reactionType)
    );
  `)
}

export async function saveSharedMeal(meal: SharedMeal): Promise<string> {
  await db.runAsync(`INSERT INTO shared_meals VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
    meal.id,
    meal.mealLogId,
    meal.userId,
    meal.foodName,
    meal.photoUrl,
    meal.nutrition.calories,
    meal.nutrition.proteinG,
    meal.nutrition.carbsG,
    meal.nutrition.fatG,
    meal.nutrition.fiberG,
    meal.shareType,
    JSON.stringify(meal.sharedWith),
    meal.createdAt,
  ])
  return meal.id
}

export async function getSharedMeal(id: string): Promise<SharedMeal | null> {
  const result = await db.getFirstAsync(`SELECT * FROM shared_meals WHERE id = ?`, [id])
  return result as any
}

export async function queueShare(
  mealLogId: string,
  shareType: string,
  sharedWith: any
): Promise<boolean> {
  const id = `queue-${Date.now()}`
  await db.runAsync(`INSERT INTO sync_queue VALUES (?, ?, ?, ?)`, [
    id,
    'share',
    JSON.stringify({ mealLogId, shareType, sharedWith }),
    new Date().toISOString(),
  ])
  return true
}

export async function getPendingShares(): Promise<any[]> {
  const results = await db.getAllAsync(`SELECT * FROM sync_queue WHERE type = 'share'`)
  return results || []
}

export async function removePendingShare(id: string): Promise<boolean> {
  await db.runAsync(`DELETE FROM sync_queue WHERE id = ?`, [id])
  return true
}

export async function queueReaction(sharedMealId: string, reactionType: string): Promise<boolean> {
  const id = `reaction-queue-${Date.now()}`
  await db.runAsync(`INSERT INTO sync_queue VALUES (?, ?, ?, ?)`, [
    id,
    'reaction',
    JSON.stringify({ sharedMealId, reactionType }),
    new Date().toISOString(),
  ])
  return true
}

export async function getPendingReactions(): Promise<any[]> {
  const results = await db.getAllAsync(`SELECT * FROM sync_queue WHERE type = 'reaction'`)
  return results || []
}

export async function removePendingReaction(id: string): Promise<boolean> {
  await db.runAsync(`DELETE FROM sync_queue WHERE id = ?`, [id])
  return true
}

export async function cacheFeed(items: SocialFeedItem[]): Promise<boolean> {
  try {
    await db.execAsync(`DELETE FROM shared_meals WHERE shareType IN ('friends', 'team')`)
    return true
  } catch {
    return false
  }
}

export async function getCachedFeed(): Promise<SocialFeedItem[]> {
  const results = await db.getAllAsync(
    `SELECT * FROM shared_meals WHERE shareType IN ('friends', 'team') ORDER BY createdAt DESC`
  )
  return results as any
}

export async function addReactionToMeal(
  sharedMealId: string,
  userId: string,
  reactionType: string
): Promise<boolean> {
  const id = `reaction-${Date.now()}`
  await db.runAsync(`INSERT OR IGNORE INTO reactions VALUES (?, ?, ?, ?, ?)`, [
    id,
    sharedMealId,
    userId,
    reactionType,
    new Date().toISOString(),
  ])
  return true
}

export async function clearSocialData(): Promise<void> {
  await db.execAsync(`
    DELETE FROM shared_meals;
    DELETE FROM sync_queue;
    DELETE FROM reactions;
  `)
}
