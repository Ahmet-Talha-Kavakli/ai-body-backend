import { openDatabaseSync } from 'expo-sqlite'

const db = openDatabaseSync('challenges.db')

export async function initChallengesTable(): Promise<void> {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS challenges (
      id TEXT PRIMARY KEY,
      created_by TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      type TEXT NOT NULL,
      target INTEGER NOT NULL,
      duration TEXT NOT NULL,
      start_date TEXT NOT NULL,
      end_date TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'active',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS challenge_progress (
      id TEXT PRIMARY KEY,
      challenge_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      current_value INTEGER NOT NULL DEFAULT 0,
      completed BOOLEAN DEFAULT 0,
      completed_at TEXT,
      UNIQUE(challenge_id, user_id),
      FOREIGN KEY(challenge_id) REFERENCES challenges(id)
    );

    CREATE INDEX IF NOT EXISTS idx_challenges_status ON challenges(status);
    CREATE INDEX IF NOT EXISTS idx_progress_user ON challenge_progress(user_id);
  `)
}

export async function saveChallenge(challenge: any): Promise<string> {
  const id = challenge.id || `challenge-${Date.now()}`
  await db.runAsync(
    `INSERT INTO challenges (id, created_by, title, description, type, target, duration, start_date, end_date, status, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      challenge.createdBy,
      challenge.title,
      challenge.description,
      challenge.type,
      challenge.target,
      challenge.duration,
      challenge.startDate,
      challenge.endDate,
      challenge.status || 'active',
      new Date().toISOString(),
    ]
  )
  return id
}

export async function getChallenges(): Promise<any[]> {
  const result = await db.getAllAsync('SELECT * FROM challenges WHERE status = ?', ['active'])
  return (result as any[]) || []
}

export async function getChallengeDetail(challengeId: string): Promise<any> {
  return await db.getFirstAsync('SELECT * FROM challenges WHERE id = ?', [challengeId])
}

export async function saveChallengeProgress(
  challengeId: string,
  userId: string,
  value: number
): Promise<void> {
  const id = `progress-${Date.now()}`
  const target = await db.getFirstAsync('SELECT target FROM challenges WHERE id = ?', [
    challengeId,
  ])
  const completed = value >= (target as any)?.target ? 1 : 0

  await db.runAsync(
    `INSERT OR REPLACE INTO challenge_progress (id, challenge_id, user_id, current_value, completed, completed_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      id,
      challengeId,
      userId,
      value,
      completed,
      completed ? new Date().toISOString() : null,
    ]
  )
}

export async function getChallengeProgress(
  challengeId: string,
  userId: string
): Promise<any> {
  return await db.getFirstAsync(
    'SELECT * FROM challenge_progress WHERE challenge_id = ? AND user_id = ?',
    [challengeId, userId]
  )
}

export async function getParticipants(challengeId: string): Promise<string[]> {
  const results = await db.getAllAsync(
    'SELECT DISTINCT user_id FROM challenge_progress WHERE challenge_id = ?',
    [challengeId]
  )
  return (results as any[]).map((r) => r.user_id) || []
}

// For testing only
export async function clearChallengesTables(): Promise<void> {
  await db.runAsync('DELETE FROM challenge_progress')
  await db.runAsync('DELETE FROM challenges')
}
