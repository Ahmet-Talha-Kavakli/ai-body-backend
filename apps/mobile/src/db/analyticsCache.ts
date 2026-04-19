import { getDatabase } from './sqlite'
import { AnalyticsSummary } from '@/types/analytics'

export async function initAnalyticsCacheTable(): Promise<void> {
  const db = getDatabase()

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS analytics_cache (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      period TEXT NOT NULL,
      summary TEXT NOT NULL,
      created_at TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      UNIQUE(user_id, period)
    );

    CREATE TABLE IF NOT EXISTS embedding_cache (
      user_id TEXT PRIMARY KEY,
      embedding TEXT NOT NULL,
      created_at TEXT NOT NULL,
      expires_at TEXT NOT NULL
    );

    CREATE INDEX idx_analytics_expires ON analytics_cache(expires_at);
    CREATE INDEX idx_embedding_expires ON embedding_cache(expires_at);
  `)
}

export async function cacheAnalyticsSummary(
  summary: AnalyticsSummary,
  ttlHours: number = 6
): Promise<void> {
  const db = getDatabase()
  const id = `analytics-${summary.userId}-${summary.period}-${Date.now()}`
  const createdAt = new Date().toISOString()
  const expiresAt = new Date(Date.now() + ttlHours * 60 * 60 * 1000).toISOString()

  await db.runAsync(
    `INSERT OR REPLACE INTO analytics_cache (id, user_id, period, summary, created_at, expires_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [id, summary.userId, summary.period, JSON.stringify(summary), createdAt, expiresAt]
  )
}

export async function getCachedAnalyticsSummary(
  userId: string,
  period: string
): Promise<AnalyticsSummary | null> {
  const db = getDatabase()

  const result = await db.getFirstAsync<{ summary: string }>(
    `SELECT summary FROM analytics_cache WHERE user_id = ? AND period = ? AND expires_at > datetime('now')`,
    [userId, period]
  )

  if (!result) return null
  return JSON.parse(result.summary) as AnalyticsSummary
}

export async function cacheEmbedding(
  userId: string,
  embedding: number[],
  ttlHours: number = 24
): Promise<void> {
  const db = getDatabase()
  const createdAt = new Date().toISOString()
  const expiresAt = new Date(Date.now() + ttlHours * 60 * 60 * 1000).toISOString()

  await db.runAsync(
    `INSERT OR REPLACE INTO embedding_cache (user_id, embedding, created_at, expires_at)
     VALUES (?, ?, ?, ?)`,
    [userId, JSON.stringify(embedding), createdAt, expiresAt]
  )
}

export async function getCachedEmbedding(userId: string): Promise<number[] | null> {
  const db = getDatabase()

  const result = await db.getFirstAsync<{ embedding: string }>(
    `SELECT embedding FROM embedding_cache WHERE user_id = ? AND expires_at > datetime('now')`,
    [userId]
  )

  if (!result) return null
  return JSON.parse(result.embedding) as number[]
}

export async function clearExpiredCache(): Promise<void> {
  const db = getDatabase()

  await db.runAsync("DELETE FROM analytics_cache WHERE expires_at <= datetime('now')")
  await db.runAsync("DELETE FROM embedding_cache WHERE expires_at <= datetime('now')")
}
