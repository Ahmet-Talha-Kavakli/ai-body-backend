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
]

export async function executeMigrations(db: SQLite.SQLiteDatabase): Promise<void> {
  for (const migration of MIGRATIONS) {
    await db.execAsync(migration.sql)
  }
}
