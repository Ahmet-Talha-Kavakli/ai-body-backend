import { openDatabaseSync } from 'expo-sqlite'
import type { LeaderboardEntry } from '@/types/social-social'

const db = openDatabaseSync('leaderboards.db')

export async function initLeaderboardsTable(): Promise<void> {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS leaderboard_snapshots (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      reference_id TEXT,
      period TEXT NOT NULL,
      entries TEXT NOT NULL,
      last_updated TEXT NOT NULL,
      UNIQUE(type, reference_id, period)
    );
  `)
}

export async function saveLeaderboardSnapshot(
  type: 'global' | 'friend' | 'challenge',
  entries: LeaderboardEntry[],
  period: string,
  referenceId?: string
): Promise<void> {
  const id = `leaderboard-${Date.now()}`
  await db.runAsync(
    `INSERT OR REPLACE INTO leaderboard_snapshots (id, type, reference_id, period, entries, last_updated)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [id, type, referenceId || null, period, JSON.stringify(entries), new Date().toISOString()]
  )
}

export async function getLeaderboard(
  type: 'global' | 'friend' | 'challenge',
  period: string,
  referenceId?: string
): Promise<LeaderboardEntry[]> {
  const result = await db.getFirstAsync(
    'SELECT entries FROM leaderboard_snapshots WHERE type = ? AND period = ? AND reference_id = ?',
    [type, period, referenceId || null]
  )
  return result ? JSON.parse((result as any).entries) : []
}

export async function calculateLeaderboardPosition(
  type: 'global' | 'friend' | 'challenge',
  userId: string,
  period: string,
  referenceId?: string
): Promise<number> {
  const entries = await getLeaderboard(type, period, referenceId)
  const position = entries.findIndex((e) => e.userId === userId)
  return position >= 0 ? position + 1 : 0
}

// For testing only
export async function clearLeaderboardsTables(): Promise<void> {
  await db.runAsync('DELETE FROM leaderboard_snapshots')
}
