import { openDatabaseSync } from 'expo-sqlite'
import type {
  HeartRateReading,
  SleepSession,
  StepData,
  EnergyBurned,
  DailyHealthSummary,
} from '../types/health'

const db = openDatabaseSync('health.db')

export async function createHealthTables(): Promise<void> {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS heart_rate_readings (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      bpm INTEGER NOT NULL,
      timestamp TEXT NOT NULL,
      sourceDevice TEXT,
      context TEXT
    );

    CREATE TABLE IF NOT EXISTS sleep_sessions (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      startTime TEXT NOT NULL,
      endTime TEXT NOT NULL,
      durationMinutes INTEGER NOT NULL,
      remMinutes INTEGER,
      deepMinutes INTEGER,
      lightMinutes INTEGER,
      awakeMinutes INTEGER
    );

    CREATE TABLE IF NOT EXISTS step_data (
      date TEXT NOT NULL,
      userId TEXT NOT NULL,
      count INTEGER NOT NULL,
      goalCount INTEGER DEFAULT 10000,
      distance REAL,
      PRIMARY KEY (userId, date)
    );

    CREATE TABLE IF NOT EXISTS energy_burned (
      date TEXT NOT NULL,
      userId TEXT NOT NULL,
      activeCalories INTEGER NOT NULL,
      basalCalories INTEGER NOT NULL,
      totalCalories INTEGER NOT NULL,
      PRIMARY KEY (userId, date)
    );

    CREATE TABLE IF NOT EXISTS daily_health_summary (
      date TEXT NOT NULL,
      userId TEXT NOT NULL,
      heartRateAvg INTEGER,
      heartRateResting INTEGER,
      sleepDurationMinutes INTEGER,
      stepCount INTEGER,
      activeCalories INTEGER,
      PRIMARY KEY (userId, date)
    );

    CREATE INDEX IF NOT EXISTS idx_heart_rate_userId_timestamp ON heart_rate_readings(userId, timestamp);
    CREATE INDEX IF NOT EXISTS idx_sleep_userId_endTime ON sleep_sessions(userId, endTime);
  `)
}

export async function saveHeartRateReading(reading: HeartRateReading): Promise<void> {
  await db.runAsync(
    `INSERT OR REPLACE INTO heart_rate_readings
     (id, userId, bpm, timestamp, sourceDevice, context)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      reading.id,
      reading.userId,
      reading.bpm,
      reading.timestamp,
      reading.sourceDevice ?? null,
      reading.context ?? null,
    ]
  )
}

export async function getHeartRateReadingsForDate(
  userId: string,
  date: string
): Promise<HeartRateReading[]> {
  const results = await db.getAllAsync(
    `SELECT id, userId, bpm, timestamp, sourceDevice, context FROM heart_rate_readings
     WHERE userId = ? AND date(timestamp) = ?
     ORDER BY timestamp ASC`,
    [userId, date]
  )

  return (results as any[]).map((row) => ({
    id: row.id,
    userId: row.userId,
    bpm: row.bpm,
    timestamp: row.timestamp,
    sourceDevice: row.sourceDevice ?? undefined,
    context: row.context ?? undefined,
  }))
}

export async function saveSleepSession(session: SleepSession): Promise<void> {
  await db.runAsync(
    `INSERT OR REPLACE INTO sleep_sessions
     (id, userId, startTime, endTime, durationMinutes, remMinutes, deepMinutes, lightMinutes, awakeMinutes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      session.id,
      session.userId,
      session.startTime,
      session.endTime,
      session.durationMinutes,
      session.stages?.remMinutes ?? null,
      session.stages?.deepMinutes ?? null,
      session.stages?.lightMinutes ?? null,
      session.stages?.awakeMinutes ?? null,
    ]
  )
}

export async function getSleepSessionsForDate(
  userId: string,
  date: string
): Promise<SleepSession[]> {
  const results = await db.getAllAsync(
    `SELECT id, userId, startTime, endTime, durationMinutes, remMinutes, deepMinutes, lightMinutes, awakeMinutes
     FROM sleep_sessions
     WHERE userId = ? AND date(endTime) = ?
     ORDER BY endTime ASC`,
    [userId, date]
  )

  return (results as any[]).map((row) => ({
    id: row.id,
    userId: row.userId,
    startTime: row.startTime,
    endTime: row.endTime,
    durationMinutes: row.durationMinutes,
    stages:
      row.remMinutes !== null && row.remMinutes !== undefined
        ? {
            remMinutes: row.remMinutes,
            deepMinutes: row.deepMinutes,
            lightMinutes: row.lightMinutes,
            awakeMinutes: row.awakeMinutes,
          }
        : undefined,
  }))
}

export async function saveStepData(userId: string, data: StepData): Promise<void> {
  await db.runAsync(
    `INSERT OR REPLACE INTO step_data
     (date, userId, count, goalCount, distance)
     VALUES (?, ?, ?, ?, ?)`,
    [data.date, userId, data.count, data.goalCount, data.distance ?? null]
  )
}

export async function getStepsForDate(
  userId: string,
  date: string
): Promise<StepData | null> {
  const row = await db.getFirstAsync<any>(
    `SELECT date, count, goalCount, distance FROM step_data
     WHERE userId = ? AND date = ?`,
    [userId, date]
  )
  if (!row) return null
  return {
    date: row.date,
    count: row.count,
    goalCount: row.goalCount,
    distance: row.distance ?? undefined,
  }
}

export async function saveEnergyBurned(
  userId: string,
  data: EnergyBurned
): Promise<void> {
  await db.runAsync(
    `INSERT OR REPLACE INTO energy_burned
     (date, userId, activeCalories, basalCalories, totalCalories)
     VALUES (?, ?, ?, ?, ?)`,
    [data.date, userId, data.activeCalories, data.basalCalories, data.totalCalories]
  )
}

export async function getEnergyForDate(
  userId: string,
  date: string
): Promise<EnergyBurned | null> {
  const row = await db.getFirstAsync<any>(
    `SELECT date, activeCalories, basalCalories, totalCalories FROM energy_burned
     WHERE userId = ? AND date = ?`,
    [userId, date]
  )
  if (!row) return null
  return {
    date: row.date,
    activeCalories: row.activeCalories,
    basalCalories: row.basalCalories,
    totalCalories: row.totalCalories,
  }
}

export async function saveDailySummary(
  userId: string,
  summary: DailyHealthSummary
): Promise<void> {
  await db.runAsync(
    `INSERT OR REPLACE INTO daily_health_summary
     (date, userId, heartRateAvg, heartRateResting, sleepDurationMinutes, stepCount, activeCalories)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      summary.date,
      userId,
      summary.heartRateAvg ?? null,
      summary.heartRateResting ?? null,
      summary.sleepDurationMinutes ?? null,
      summary.stepCount ?? null,
      summary.activeCalories ?? null,
    ]
  )
}

export async function getDailySummary(
  userId: string,
  date: string
): Promise<DailyHealthSummary | null> {
  const row = await db.getFirstAsync<any>(
    `SELECT date, heartRateAvg, heartRateResting, sleepDurationMinutes, stepCount, activeCalories
     FROM daily_health_summary
     WHERE userId = ? AND date = ?`,
    [userId, date]
  )
  if (!row) return null
  return {
    date: row.date,
    heartRateAvg: row.heartRateAvg ?? undefined,
    heartRateResting: row.heartRateResting ?? undefined,
    sleepDurationMinutes: row.sleepDurationMinutes ?? undefined,
    stepCount: row.stepCount ?? undefined,
    activeCalories: row.activeCalories ?? undefined,
  }
}

export async function cleanupOldHealthData(userId: string, daysToKeep: number = 90): Promise<void> {
  const cutoffDate = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0]
  await db.runAsync(
    `DELETE FROM heart_rate_readings WHERE userId = ? AND date(timestamp) < ?`,
    [userId, cutoffDate]
  )
  await db.runAsync(
    `DELETE FROM sleep_sessions WHERE userId = ? AND date(endTime) < ?`,
    [userId, cutoffDate]
  )
  await db.runAsync(`DELETE FROM step_data WHERE userId = ? AND date < ?`, [userId, cutoffDate])
  await db.runAsync(`DELETE FROM energy_burned WHERE userId = ? AND date < ?`, [userId, cutoffDate])
  await db.runAsync(`DELETE FROM daily_health_summary WHERE userId = ? AND date < ?`, [
    userId,
    cutoffDate,
  ])
}
