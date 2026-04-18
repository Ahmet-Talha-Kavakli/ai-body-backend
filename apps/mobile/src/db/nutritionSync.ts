import { openDatabaseSync, type SQLiteDatabase } from 'expo-sqlite'
import type { MealLog } from '../types/nutrition'

// Use test-specific database during tests
const dbName = process.env.NODE_ENV === 'test' ? 'nutrition-test.db' : 'nutrition.db'
let db: SQLiteDatabase | null = null

function getDb(): SQLiteDatabase {
  if (!db) {
    db = openDatabaseSync(dbName)
  }
  return db
}

// Export for testing purposes
export function resetDatabase(): void {
  db = null
}

export interface SyncQueueItem {
  id: string
  type: 'meal' | 'photo' | 'goal' | 'water' | 'coach_log'
  payload: any
  status: 'pending' | 'syncing' | 'synced' | 'failed'
  attempts: number
  lastAttempt?: string
  error?: string
  createdAt: string
}

export async function createSyncQueueTable(): Promise<void> {
  await getDb().execAsync(`
    CREATE TABLE IF NOT EXISTS nutrition_sync_queue (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      payload TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      attempts INTEGER NOT NULL DEFAULT 0,
      lastAttempt TEXT,
      error TEXT,
      createdAt TEXT NOT NULL,
      synced INTEGER NOT NULL DEFAULT 0
    );

    CREATE INDEX IF NOT EXISTS idx_sync_queue_status ON nutrition_sync_queue(status);
    CREATE INDEX IF NOT EXISTS idx_sync_queue_createdAt ON nutrition_sync_queue(createdAt);
  `)
}

function generateId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

export async function queueMealSync(meal: MealLog): Promise<string> {
  const id = generateId()
  const now = new Date().toISOString()

  await getDb().runAsync(
    `INSERT INTO nutrition_sync_queue (id, type, payload, status, attempts, createdAt, synced)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [id, 'meal', JSON.stringify(meal), 'pending', 0, now, 0]
  )

  return id
}

export async function queuePhotoSync(photo: any): Promise<string> {
  const id = generateId()
  const now = new Date().toISOString()

  await getDb().runAsync(
    `INSERT INTO nutrition_sync_queue (id, type, payload, status, attempts, createdAt, synced)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [id, 'photo', JSON.stringify(photo), 'pending', 0, now, 0]
  )

  return id
}

export async function queueGoalSync(goal: any): Promise<string> {
  const id = generateId()
  const now = new Date().toISOString()

  await getDb().runAsync(
    `INSERT INTO nutrition_sync_queue (id, type, payload, status, attempts, createdAt, synced)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [id, 'goal', JSON.stringify(goal), 'pending', 0, now, 0]
  )

  return id
}

export async function getPendingItems(): Promise<SyncQueueItem[]> {
  const results = await getDb().getAllAsync(
    `SELECT * FROM nutrition_sync_queue WHERE status = 'pending' ORDER BY createdAt ASC`
  )

  return results.map((row: any) => ({
    id: row.id,
    type: row.type,
    payload: JSON.parse(row.payload),
    status: row.status,
    attempts: row.attempts,
    lastAttempt: row.lastAttempt,
    error: row.error,
    createdAt: row.createdAt,
  }))
}

export async function getQueueItem(id: string): Promise<SyncQueueItem> {
  const result = await getDb().getFirstAsync(`SELECT * FROM nutrition_sync_queue WHERE id = ?`, [
    id,
  ])

  if (!result) throw new Error(`Queue item not found: ${id}`)

  return {
    id: (result as any).id,
    type: (result as any).type,
    payload: JSON.parse((result as any).payload),
    status: (result as any).status,
    attempts: (result as any).attempts,
    lastAttempt: (result as any).lastAttempt,
    error: (result as any).error,
    createdAt: (result as any).createdAt,
  }
}

export async function markSynced(id: string): Promise<void> {
  const now = new Date().toISOString()

  await getDb().runAsync(
    `UPDATE nutrition_sync_queue SET status = ?, lastAttempt = ?, synced = 1 WHERE id = ?`,
    ['synced', now, id]
  )
}

export async function markFailed(id: string, error: string): Promise<void> {
  const now = new Date().toISOString()

  await getDb().runAsync(
    `UPDATE nutrition_sync_queue SET status = ?, error = ?, lastAttempt = ? WHERE id = ?`,
    ['failed', error, now, id]
  )
}

export async function retryWithBackoff(id: string): Promise<void> {
  const item = await getQueueItem(id)
  const nextAttempt = item.attempts + 1
  const delay = Math.pow(2, item.attempts) * 1000 // 1s, 2s, 4s, 8s, 16s
  const now = new Date().toISOString()

  await getDb().runAsync(
    `UPDATE nutrition_sync_queue SET attempts = ?, lastAttempt = ? WHERE id = ?`,
    [nextAttempt, now, id]
  )
}

export async function clearSyncedItems(): Promise<void> {
  await getDb().runAsync(`DELETE FROM nutrition_sync_queue WHERE status = 'synced'`)
}
