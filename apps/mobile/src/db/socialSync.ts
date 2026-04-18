import { openDatabaseSync } from 'expo-sqlite'

const db = openDatabaseSync('social.db')

export async function initSocialSyncTable(): Promise<void> {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS social_sync_queue (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      data TEXT NOT NULL,
      retry_count INTEGER DEFAULT 0,
      last_error TEXT,
      created_at TEXT NOT NULL,
      scheduled_for TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_social_sync_status ON social_sync_queue(created_at);
  `)
}

export async function queueSocialAction(type: string, data: any): Promise<string> {
  const id = `social-sync-${Date.now()}`
  const now = new Date().toISOString()

  await db.runAsync(
    `INSERT INTO social_sync_queue (id, type, data, retry_count, created_at, scheduled_for)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [id, type, JSON.stringify(data), 0, now, now]
  )
  return id
}

export async function getQueuedActions(): Promise<any[]> {
  return await db.getAllAsync(
    'SELECT id, type, data FROM social_sync_queue WHERE retry_count < 5 ORDER BY created_at ASC'
  )
}

export async function markActionSynced(id: string): Promise<void> {
  await db.runAsync('DELETE FROM social_sync_queue WHERE id = ?', [id])
}

export async function incrementRetry(id: string, error: string): Promise<void> {
  const retryRecord = await db.getFirstAsync<{ retry_count: number }>(
    'SELECT retry_count FROM social_sync_queue WHERE id = ?',
    [id]
  )

  const retryCount = retryRecord?.retry_count || 0
  const delayMs = Math.pow(2, retryCount) * 1000
  const scheduledFor = new Date(Date.now() + delayMs).toISOString()

  await db.runAsync(
    'UPDATE social_sync_queue SET retry_count = retry_count + 1, last_error = ?, scheduled_for = ? WHERE id = ?',
    [error, scheduledFor, id]
  )
}

export async function clearOldQueuedActions(daysOld: number): Promise<void> {
  const cutoff = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000).toISOString()
  await db.runAsync(
    'DELETE FROM social_sync_queue WHERE created_at < ? AND retry_count >= 5',
    [cutoff]
  )
}

// For testing only
export async function clearSocialSyncTable(): Promise<void> {
  await db.runAsync('DELETE FROM social_sync_queue')
}
