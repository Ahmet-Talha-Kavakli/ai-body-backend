import { openDatabaseSync } from 'expo-sqlite'

// Use singleton pattern for database instance
const db = openDatabaseSync('nutrition.db')

export interface StreakRecord {
  currentStreak: number
  longestStreak: number
  lastLogDate: string | null
}

export interface StreakStats extends StreakRecord {
  loggingDates: string[]
}

// Helper: Calculate day difference between two YYYY-MM-DD date strings
function calculateDaysDifference(fromDate: string, toDate: string): number {
  const from = new Date(fromDate + 'T00:00:00Z')
  const to = new Date(toDate + 'T00:00:00Z')
  const diffTime = to.getTime() - from.getTime()
  return Math.floor(diffTime / (1000 * 60 * 60 * 24))
}

export async function createStreakTable(): Promise<void> {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS nutrition_streaks (
      userId TEXT PRIMARY KEY,
      currentStreak INTEGER NOT NULL DEFAULT 0,
      longestStreak INTEGER NOT NULL DEFAULT 0,
      lastLogDate TEXT,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS nutrition_streak_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId TEXT NOT NULL,
      logDate TEXT NOT NULL,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(userId, logDate),
      FOREIGN KEY (userId) REFERENCES nutrition_streaks(userId)
    );
  `)
}

export async function logMealForToday(userId: string, date: Date = new Date()): Promise<void> {
  const logDate = date.toISOString().split('T')[0]

  // Check if already logged today
  const existing = await db.getFirstAsync(
    'SELECT id FROM nutrition_streak_logs WHERE userId = ? AND logDate = ?',
    [userId, logDate]
  )

  if (existing) {
    return // Already logged today
  }

  // Insert new log
  await db.runAsync('INSERT INTO nutrition_streak_logs (userId, logDate) VALUES (?, ?)', [
    userId,
    logDate,
  ])

  // Get or create streak record
  const streak = await db.getFirstAsync('SELECT * FROM nutrition_streaks WHERE userId = ?', [
    userId,
  ])

  if (!streak) {
    // New user - create with currentStreak = 1
    await db.runAsync(
      'INSERT INTO nutrition_streaks (userId, currentStreak, longestStreak, lastLogDate) VALUES (?, 1, 1, ?)',
      [userId, logDate]
    )
    return
  }

  // Check if this is consecutive day
  const lastLogDateStr = streak.lastLogDate as string
  let newStreak = streak.currentStreak
  let newLongestStreak = streak.longestStreak

  if (lastLogDateStr) {
    const diffDays = calculateDaysDifference(lastLogDateStr, logDate)

    if (diffDays === 1) {
      // Consecutive day
      newStreak = streak.currentStreak + 1
      newLongestStreak = Math.max(newLongestStreak, newStreak)
    } else if (diffDays > 1) {
      // Gap in streak - reset to 1
      newStreak = 1
    }
    // else diffDays === 0 should not happen (handled above)
  }

  // Update streak record
  await db.runAsync(
    `UPDATE nutrition_streaks
     SET currentStreak = ?, longestStreak = ?, lastLogDate = ?, updatedAt = CURRENT_TIMESTAMP
     WHERE userId = ?`,
    [newStreak, newLongestStreak, logDate, userId]
  )
}

export async function getStreak(userId: string): Promise<StreakRecord> {
  const streak = await db.getFirstAsync(
    'SELECT currentStreak, longestStreak, lastLogDate FROM nutrition_streaks WHERE userId = ?',
    [userId]
  )

  if (!streak) {
    return {
      currentStreak: 0,
      longestStreak: 0,
      lastLogDate: null,
    }
  }

  return {
    currentStreak: streak.currentStreak,
    longestStreak: streak.longestStreak,
    lastLogDate: streak.lastLogDate,
  }
}

export async function breakStreakIfNeeded(
  userId: string,
  checkDate: Date = new Date()
): Promise<void> {
  const streak = await db.getFirstAsync(
    'SELECT lastLogDate FROM nutrition_streaks WHERE userId = ?',
    [userId]
  )

  if (!streak || !streak.lastLogDate) {
    return // No streak to break
  }

  const lastLogDateStr = streak.lastLogDate as string
  const checkDateStr = checkDate.toISOString().split('T')[0]
  const diffDays = calculateDaysDifference(lastLogDateStr, checkDateStr)

  // If more than 1 day gap, reset streak
  if (diffDays > 1) {
    await db.runAsync(
      'UPDATE nutrition_streaks SET currentStreak = 0, updatedAt = CURRENT_TIMESTAMP WHERE userId = ?',
      [userId]
    )
  }
}

export async function getStreakStats(userId: string): Promise<StreakStats> {
  const streak = await getStreak(userId)

  const logs = await db.getAllAsync(
    'SELECT logDate FROM nutrition_streak_logs WHERE userId = ? ORDER BY logDate DESC',
    [userId]
  )

  return {
    currentStreak: streak.currentStreak,
    longestStreak: streak.longestStreak,
    lastLogDate: streak.lastLogDate,
    loggingDates: logs.map((log: any) => log.logDate),
  }
}
