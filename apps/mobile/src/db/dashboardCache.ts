import { getDatabase } from './sqlite'

const CACHE_TTL = 60 * 60 * 1000 // 1 hour

export async function saveDashboardCache(userId: string, stats: any): Promise<void> {
  const db = getDatabase()
  const now = Date.now()

  await db.runAsync(
    `INSERT OR REPLACE INTO dashboard_cache (userId, date, todayCalories, calorieGoal, cachedAt, expiresAt)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      userId,
      new Date().toISOString().split('T')[0],
      stats.todayCalories,
      stats.calorieGoal,
      now,
      now + CACHE_TTL,
    ]
  )
}

export async function getDashboardCache(userId: string): Promise<any | null> {
  const db = getDatabase()
  const now = Date.now()

  const row = await db.getFirstAsync(
    `SELECT * FROM dashboard_cache WHERE userId = ? AND expiresAt > ? LIMIT 1`,
    [userId, now]
  )

  return row || null
}
