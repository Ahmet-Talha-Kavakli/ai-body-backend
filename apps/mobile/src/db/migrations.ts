import * as SQLite from 'expo-sqlite'

const MIGRATIONS = [
  {
    version: 1,
    sql: `
      CREATE TABLE IF NOT EXISTS dashboard_cache (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId TEXT NOT NULL,
        date TEXT NOT NULL,
        todayCalories INTEGER,
        calorieGoal INTEGER,
        cachedAt INTEGER,
        expiresAt INTEGER,
        UNIQUE(userId, date)
      );
    `,
  },
  {
    version: 2,
    sql: `
      CREATE TABLE IF NOT EXISTS user_cache (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId TEXT NOT NULL UNIQUE,
        email TEXT,
        name TEXT,
        cachedAt INTEGER,
        expiresAt INTEGER
      );
    `,
  },
  {
    version: 3,
    sql: `
      CREATE TABLE IF NOT EXISTS sync_queue (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId TEXT NOT NULL,
        action TEXT NOT NULL,
        endpoint TEXT NOT NULL,
        payload TEXT,
        createdAt INTEGER,
        retries INTEGER DEFAULT 0
      );
    `,
  },
  {
    version: 4,
    sql: `
      CREATE TABLE IF NOT EXISTS meal_photos (
        id TEXT PRIMARY KEY,
        mealLogId TEXT NOT NULL,
        filePath TEXT NOT NULL,
        uploadStatus TEXT NOT NULL DEFAULT 'pending',
        remoteUrl TEXT,
        createdAt INTEGER,
        UNIQUE(mealLogId, filePath)
      );
    `,
  },
  {
    version: 5,
    sql: `
      CREATE TABLE IF NOT EXISTS nutrition_goals (
        id TEXT PRIMARY KEY,
        userId TEXT NOT NULL UNIQUE,
        dailyCalories INTEGER,
        proteinG REAL,
        carbsG REAL,
        fatG REAL,
        waterMl INTEGER,
        generatedByAi INTEGER DEFAULT 0,
        updatedAt INTEGER,
        UNIQUE(userId)
      );
    `,
  },
  {
    version: 6,
    sql: `
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
      CREATE INDEX IF NOT EXISTS idx_meal_logs_userId_loggedAt ON meal_logs(userId, loggedAt);
    `,
  },
]

export async function executeMigrations(db: SQLite.SQLiteDatabase): Promise<void> {
  for (const migration of MIGRATIONS) {
    await db.execAsync(migration.sql)
  }
}
