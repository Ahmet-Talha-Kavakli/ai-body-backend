import { openDatabaseSync } from 'expo-sqlite'

export interface WaterLog {
  date: string
  totalMl: number
  goalMl: number
}

const DEFAULT_GOAL_ML = 2000
const db = openDatabaseSync('water.db')

export async function createWaterTable(): Promise<void> {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS water_intake (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL UNIQUE,
      totalMl REAL NOT NULL DEFAULT 0,
      goalMl REAL NOT NULL DEFAULT 2000,
      timestamp TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_water_intake_date ON water_intake(date);
  `)
}

export async function addWaterLog(date: string, ml: number): Promise<void> {
  await db.withTransactionAsync(async () => {
    // Check if row exists
    const existing = await db.getFirstAsync<{
      date: string
      totalMl: number
      goalMl: number
    }>(`SELECT date, totalMl, goalMl FROM water_intake WHERE date = ?`, [date])

    if (existing) {
      // Update existing row
      await db.runAsync(`UPDATE water_intake SET totalMl = totalMl + ? WHERE date = ?`, [ml, date])
    } else {
      // Insert new row
      await db.runAsync(`INSERT INTO water_intake (date, totalMl, goalMl) VALUES (?, ?, ?)`, [
        date,
        ml,
        DEFAULT_GOAL_ML,
      ])
    }
  })
}

export async function getWaterForToday(): Promise<WaterLog> {
  const today = new Date().toISOString().split('T')[0]
  return getWaterForDate(today)
}

export async function getWaterForDate(date: string): Promise<WaterLog> {
  const result = await db.getFirstAsync<{
    date: string
    totalMl: number
    goalMl: number
  }>(`SELECT date, totalMl, goalMl FROM water_intake WHERE date = ?`, [date])

  if (result) {
    return {
      date: result.date,
      totalMl: result.totalMl,
      goalMl: result.goalMl,
    }
  }

  return {
    date,
    totalMl: 0,
    goalMl: DEFAULT_GOAL_ML,
  }
}

export async function getWaterStats(startDate: string, endDate: string): Promise<WaterLog[]> {
  const results = await db.getAllAsync<WaterLog>(
    `SELECT date, totalMl, goalMl FROM water_intake
     WHERE date >= ? AND date <= ?
     ORDER BY date DESC`,
    [startDate, endDate]
  )

  return results
}
