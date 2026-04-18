import { getDatabase } from './sqlite'

export async function queueSync(
  userId: string,
  action: string,
  endpoint: string,
  payload: any
): Promise<void> {
  const db = getDatabase()
  await db.runAsync(
    `INSERT INTO sync_queue (userId, action, endpoint, payload, createdAt, retries)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [userId, action, endpoint, JSON.stringify(payload), Date.now(), 0]
  )
}

export async function getPendingSyncQueue(userId: string): Promise<any[]> {
  const db = getDatabase()
  return await db.getAllAsync(`SELECT * FROM sync_queue WHERE userId = ? ORDER BY createdAt ASC`, [
    userId,
  ])
}

export async function removeSyncQueueItem(id: string): Promise<void> {
  const db = getDatabase()
  await db.runAsync(`DELETE FROM sync_queue WHERE id = ?`, [id])
}
