import { openDatabaseSync } from 'expo-sqlite'
import type { Recommendation } from '@/types/analytics'

let db: any = null

export function setDatabase(database: any): void {
  db = database
}

function getDb(): any {
  if (!db) {
    db = openDatabaseSync('recommendations.db')
  }
  return db
}

export async function initRecommendationsTable(): Promise<void> {
  const database = getDb()
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS recommendations (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      confidence INTEGER NOT NULL,
      reasoning TEXT,
      action_url TEXT,
      created_at TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      UNIQUE(user_id, id)
    );

    CREATE INDEX IF NOT EXISTS idx_recommendations_user ON recommendations(user_id);
    CREATE INDEX IF NOT EXISTS idx_recommendations_expires ON recommendations(expires_at);
  `)
}

export async function saveRecommendation(rec: Recommendation): Promise<void> {
  const database = getDb()
  await database.runAsync(
    `INSERT OR REPLACE INTO recommendations (id, user_id, type, title, description, confidence, reasoning, action_url, created_at, expires_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [rec.id, rec.userId, rec.type, rec.title, rec.description, rec.confidence, rec.reasoning, rec.actionUrl, rec.createdAt, rec.expiresAt]
  )
}

export async function getRecommendations(userId: string, type?: string): Promise<Recommendation[]> {
  const database = getDb()
  const now = new Date().toISOString()
  let query = 'SELECT * FROM recommendations WHERE user_id = ? AND expires_at > ?'
  const params: any[] = [userId, now]

  if (type) {
    query += ' AND type = ?'
    params.push(type)
  }

  query += ' ORDER BY confidence DESC'

  const results = await database.getAllAsync(query, params)
  return results as Recommendation[]
}

export async function clearExpiredRecommendations(userId: string): Promise<void> {
  const database = getDb()
  const now = new Date().toISOString()
  await database.runAsync(
    'DELETE FROM recommendations WHERE user_id = ? AND expires_at <= ?',
    [userId, now]
  )
}
