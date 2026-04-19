import { db } from './sqlite'
import type { SharedMeal, SocialFeedItem } from '../types/social'
import { v4 as uuidv4 } from 'uuid'

export async function initSocialTables() {
  await db.executeSqlAsync(`
    CREATE TABLE IF NOT EXISTS shared_meals (
      id TEXT PRIMARY KEY,
      mealLogId TEXT NOT NULL,
      userId TEXT NOT NULL,
      foodName TEXT NOT NULL,
      photoUrl TEXT NOT NULL,
      nutrition TEXT NOT NULL,
      shareType TEXT NOT NULL,
      sharedWith TEXT NOT NULL,
      createdAt TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_shared_meals_userId ON shared_meals(userId);
    CREATE INDEX IF NOT EXISTS idx_shared_meals_shareType ON shared_meals(shareType);
    CREATE INDEX IF NOT EXISTS idx_shared_meals_createdAt ON shared_meals(createdAt DESC);

    CREATE TABLE IF NOT EXISTS meal_reactions (
      id TEXT PRIMARY KEY,
      mealId TEXT NOT NULL,
      userId TEXT NOT NULL,
      reactionType TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      FOREIGN KEY (mealId) REFERENCES shared_meals(id)
    );

    CREATE INDEX IF NOT EXISTS idx_meal_reactions_mealId ON meal_reactions(mealId);
    CREATE INDEX IF NOT EXISTS idx_meal_reactions_userId ON meal_reactions(userId);
  `)
}

export async function createSharedMeal(meal: SharedMeal): Promise<SharedMeal> {
  await db.executeSqlAsync(
    `INSERT INTO shared_meals (id, mealLogId, userId, foodName, photoUrl, nutrition, shareType, sharedWith, createdAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      meal.id,
      meal.mealLogId,
      meal.userId,
      meal.foodName,
      meal.photoUrl,
      JSON.stringify(meal.nutrition),
      meal.shareType,
      JSON.stringify(meal.sharedWith),
      meal.createdAt,
    ]
  )
  return meal
}

export async function getSharedMealById(id: string): Promise<SharedMeal | null> {
  const result = await db.executeSqlAsync(
    `SELECT * FROM shared_meals WHERE id = ?`,
    [id]
  )
  if (!result || result.length === 0) return null

  const row = result[0] as any
  return {
    id: row.id,
    mealLogId: row.mealLogId,
    userId: row.userId,
    foodName: row.foodName,
    photoUrl: row.photoUrl,
    nutrition: JSON.parse(row.nutrition),
    shareType: row.shareType as 'private' | 'friends' | 'team',
    sharedWith: JSON.parse(row.sharedWith),
    createdAt: row.createdAt,
  }
}

export async function getSocialFeed(userId: string): Promise<SocialFeedItem[]> {
  const result = await db.executeSqlAsync(
    `SELECT sm.*,
            COALESCE(fp.username, 'Unknown') as userName,
            COALESCE(fp.avatar, '') as userAvatar
     FROM shared_meals sm
     LEFT JOIN user_profiles fp ON sm.userId = fp.userId
     WHERE sm.shareType IN ('friends', 'team')
     AND sm.createdAt >= datetime('now', '-7 days')
     ORDER BY sm.createdAt DESC
     LIMIT 100`,
    []
  )

  const items: SocialFeedItem[] = []
  for (const row of result as any[]) {
    const reactions = await getMealReactions(row.id)
    items.push({
      id: row.id,
      userId: row.userId,
      userName: row.userName,
      userAvatar: row.userAvatar,
      foodName: row.foodName,
      photoUrl: row.photoUrl,
      nutrition: JSON.parse(row.nutrition),
      timestamp: row.createdAt,
      shareType: row.shareType as 'friends' | 'team',
      reactions,
    })
  }

  return items
}

export async function getTeamMeals(teamId: string): Promise<SocialFeedItem[]> {
  const result = await db.executeSqlAsync(
    `SELECT sm.*,
            COALESCE(fp.username, 'Unknown') as userName,
            COALESCE(fp.avatar, '') as userAvatar
     FROM shared_meals sm
     LEFT JOIN user_profiles fp ON sm.userId = fp.userId
     WHERE sm.shareType = 'team'
     AND sm.sharedWith LIKE ?
     ORDER BY sm.createdAt DESC
     LIMIT 100`,
    [`%"teamId":"${teamId}"%`]
  )

  const items: SocialFeedItem[] = []
  for (const row of result as any[]) {
    const reactions = await getMealReactions(row.id)
    items.push({
      id: row.id,
      userId: row.userId,
      userName: row.userName,
      userAvatar: row.userAvatar,
      foodName: row.foodName,
      photoUrl: row.photoUrl,
      nutrition: JSON.parse(row.nutrition),
      timestamp: row.createdAt,
      shareType: row.shareType as 'friends' | 'team',
      reactions,
    })
  }

  return items
}

export async function getUserSharedMeals(userId: string): Promise<SharedMeal[]> {
  const result = await db.executeSqlAsync(
    `SELECT * FROM shared_meals WHERE userId = ? ORDER BY createdAt DESC`,
    [userId]
  )

  return (result as any[]).map((row) => ({
    id: row.id,
    mealLogId: row.mealLogId,
    userId: row.userId,
    foodName: row.foodName,
    photoUrl: row.photoUrl,
    nutrition: JSON.parse(row.nutrition),
    shareType: row.shareType as 'private' | 'friends' | 'team',
    sharedWith: JSON.parse(row.sharedWith),
    createdAt: row.createdAt,
  }))
}

export async function addReaction(
  mealId: string,
  userId: string,
  reactionType: 'like' | 'heart'
): Promise<void> {
  // Check if user already reacted
  const existing = await db.executeSqlAsync(
    `SELECT * FROM meal_reactions WHERE mealId = ? AND userId = ?`,
    [mealId, userId]
  )

  if (existing && existing.length > 0) {
    // Update existing reaction
    await db.executeSqlAsync(
      `UPDATE meal_reactions SET reactionType = ? WHERE mealId = ? AND userId = ?`,
      [reactionType, mealId, userId]
    )
  } else {
    // Create new reaction
    await db.executeSqlAsync(
      `INSERT INTO meal_reactions (id, mealId, userId, reactionType, createdAt)
       VALUES (?, ?, ?, ?, ?)`,
      [
        uuidv4(),
        mealId,
        userId,
        reactionType,
        new Date().toISOString(),
      ]
    )
  }
}

export async function removeReaction(
  mealId: string,
  userId: string
): Promise<void> {
  await db.executeSqlAsync(
    `DELETE FROM meal_reactions WHERE mealId = ? AND userId = ?`,
    [mealId, userId]
  )
}

export async function getMealReactions(
  mealId: string
): Promise<Array<{ type: 'like' | 'heart'; count: number }>> {
  const result = await db.executeSqlAsync(
    `SELECT reactionType, COUNT(*) as count FROM meal_reactions
     WHERE mealId = ? GROUP BY reactionType`,
    [mealId]
  )

  const reactionMap = new Map<string, number>()
  for (const row of result as any[]) {
    reactionMap.set(row.reactionType, row.count)
  }

  return [
    { type: 'like', count: reactionMap.get('like') || 0 },
    { type: 'heart', count: reactionMap.get('heart') || 0 },
  ]
}

export async function deleteSharedMeal(id: string): Promise<void> {
  // Delete reactions first
  await db.executeSqlAsync(`DELETE FROM meal_reactions WHERE mealId = ?`, [id])

  // Delete meal
  await db.executeSqlAsync(`DELETE FROM shared_meals WHERE id = ?`, [id])
}
