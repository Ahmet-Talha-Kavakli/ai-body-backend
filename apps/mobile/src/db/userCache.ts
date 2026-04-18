import { getDatabase } from './sqlite'

export async function saveUserCache(profile: any): Promise<void> {
  const db = getDatabase()
  await db.runAsync(
    `INSERT OR REPLACE INTO user_cache (userId, email, name, cachedAt, expiresAt)
     VALUES (?, ?, ?, ?, ?)`,
    [profile.id, profile.email, profile.name, Date.now(), Date.now() + 60 * 60 * 1000]
  )
}

export async function getUserCache(userId: string): Promise<any | null> {
  const db = getDatabase()
  const row = await db.getFirstAsync(
    `SELECT * FROM user_cache WHERE userId = ? AND expiresAt > ? LIMIT 1`,
    [userId, Date.now()]
  )
  return row || null
}
