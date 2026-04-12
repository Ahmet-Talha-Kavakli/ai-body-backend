import SQLite from 'react-native-sqlite'
import { SessionRecord, SessionFrame } from '@/lib/session/types'

/**
 * Initialize SQLite schema for session storage
 * Creates tables: sessions, session_frames, sync_queue
 */
export async function createSessionSchema(db: any): Promise<void> {
  const statements = [
    // Main sessions table
    `CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      exercise TEXT NOT NULL,
      startTime DATETIME NOT NULL,
      endTime DATETIME NOT NULL,
      totalReps INTEGER NOT NULL,
      avgFormScore REAL NOT NULL,
      syncStatus TEXT DEFAULT 'pending',
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,

    // Frame-level form analysis data
    `CREATE TABLE IF NOT EXISTS session_frames (
      id TEXT PRIMARY KEY,
      sessionId TEXT NOT NULL REFERENCES sessions(id),
      timestamp INTEGER NOT NULL,
      formScore REAL NOT NULL,
      repNumber INTEGER NOT NULL,
      errors JSON NOT NULL,
      muscleEngagement JSON NOT NULL,
      confidence REAL NOT NULL DEFAULT 0.85
    )`,

    // Queue for pending syncs
    `CREATE TABLE IF NOT EXISTS sync_queue (
      id TEXT PRIMARY KEY,
      sessionId TEXT NOT NULL REFERENCES sessions(id),
      status TEXT DEFAULT 'pending',
      retryCount INTEGER DEFAULT 0,
      lastError TEXT,
      nextRetryAt DATETIME,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,

    // Indexes for performance
    `CREATE INDEX IF NOT EXISTS idx_sessions_userId ON sessions(userId)`,
    `CREATE INDEX IF NOT EXISTS idx_sessions_syncStatus ON sessions(syncStatus)`,
    `CREATE INDEX IF NOT EXISTS idx_session_frames_sessionId ON session_frames(sessionId)`,
    `CREATE INDEX IF NOT EXISTS idx_sync_queue_status ON sync_queue(status)`,
    `CREATE INDEX IF NOT EXISTS idx_sync_queue_nextRetryAt ON sync_queue(nextRetryAt)`,
  ]

  for (const statement of statements) {
    await db.run(statement)
  }
}

/**
 * Insert a session record and queue it for sync
 */
export async function insertSessionRecord(
  db: any,
  session: Omit<SessionRecord, 'frames' | 'voiceFeedback'>
): Promise<void> {
  await db.run(
    `INSERT INTO sessions (id, userId, exercise, startTime, endTime, totalReps, avgFormScore, syncStatus)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      session.id,
      session.userId,
      session.exercise,
      session.startTime.toISOString(),
      session.endTime.toISOString(),
      session.totalReps,
      session.avgFormScore,
      session.syncStatus,
    ]
  )

  // Automatically queue for sync
  await db.run(`INSERT INTO sync_queue (id, sessionId, status) VALUES (?, ?, ?)`, [
    `sync-${session.id}`,
    session.id,
    'pending',
  ])
}

/**
 * Insert frame-level analysis data for a session
 */
export async function insertSessionFrames(
  db: any,
  sessionId: string,
  frames: SessionFrame[]
): Promise<void> {
  for (const frame of frames) {
    await db.run(
      `INSERT INTO session_frames
       (id, sessionId, timestamp, formScore, repNumber, errors, muscleEngagement, confidence)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        `frame-${sessionId}-${frame.timestamp}`,
        sessionId,
        frame.timestamp,
        frame.formScore,
        frame.repNumber,
        JSON.stringify(frame.errors),
        JSON.stringify(frame.muscleEngagement),
        0.85, // Default confidence, will be set by FormAnalyzer
      ]
    )
  }
}

/**
 * Get sessions pending sync by status
 */
export async function getSessionsForSync(
  db: any,
  status: 'pending' | 'syncing' | 'failed'
): Promise<SessionRecord[]> {
  const results = await db.all(
    `SELECT s.* FROM sessions s
     INNER JOIN sync_queue sq ON s.id = sq.sessionId
     WHERE sq.status = ?
     ORDER BY s.createdAt ASC`,
    [status]
  )

  // Fetch frames for each session
  const sessions: SessionRecord[] = []
  for (const row of results) {
    const frames = await db.all(
      `SELECT * FROM session_frames WHERE sessionId = ? ORDER BY timestamp ASC`,
      [row.id]
    )

    sessions.push({
      id: row.id,
      userId: row.userId,
      exercise: row.exercise,
      startTime: new Date(row.startTime),
      endTime: new Date(row.endTime),
      totalReps: row.totalReps,
      avgFormScore: row.avgFormScore,
      frames: frames.map((f) => ({
        timestamp: f.timestamp,
        exercise: f.exercise || row.exercise,
        formScore: f.formScore,
        repNumber: f.repNumber,
        errors: JSON.parse(f.errors || '[]'),
        muscleEngagement: JSON.parse(f.muscleEngagement || '{}'),
      })),
      voiceFeedback: [],
      syncStatus: row.syncStatus,
    })
  }

  return sessions
}

/**
 * Mark session as successfully synced
 */
export async function markSessionSynced(db: any, sessionId: string): Promise<void> {
  await db.run(`UPDATE sync_queue SET status = ?, retryCount = 0 WHERE sessionId = ?`, [
    'synced',
    sessionId,
  ])
  await db.run(`UPDATE sessions SET syncStatus = ? WHERE id = ?`, ['synced', sessionId])
}

/**
 * Mark session sync as failed with error and schedule retry
 */
export async function markSessionSyncFailed(
  db: any,
  sessionId: string,
  error: string,
  retryCount: number
): Promise<void> {
  // Exponential backoff: 1s, 2s, 4s, 8s, 16s
  const delays = [1, 2, 4, 8, 16]
  const nextDelaySeconds = delays[Math.min(retryCount, delays.length - 1)]

  await db.run(
    `UPDATE sync_queue
     SET status = ?, retryCount = ?, lastError = ?, nextRetryAt = datetime('now', '+' || ? || ' seconds')
     WHERE sessionId = ?`,
    ['failed', retryCount + 1, error, nextDelaySeconds, sessionId]
  )
}

/**
 * Clean up old successfully synced sessions (older than N days)
 */
export async function cleanupOldSyncQueue(db: any, daysOld: number = 30): Promise<number> {
  const result = await db.run(
    `DELETE FROM sync_queue
     WHERE status = 'synced'
     AND createdAt < datetime('now', '-' || ? || ' days')`,
    [daysOld]
  )
  return result.changes || 0
}

/**
 * Get pending sessions ready for retry (nextRetryAt is past)
 */
export async function getSessionsReadyForRetry(db: any): Promise<SessionRecord[]> {
  const results = await db.all(
    `SELECT s.* FROM sessions s
     INNER JOIN sync_queue sq ON s.id = sq.sessionId
     WHERE sq.status = 'failed'
     AND sq.nextRetryAt IS NOT NULL
     AND sq.nextRetryAt <= datetime('now')
     ORDER BY sq.nextRetryAt ASC`,
    []
  )

  const sessions: SessionRecord[] = []
  for (const row of results) {
    const frames = await db.all(
      `SELECT * FROM session_frames WHERE sessionId = ? ORDER BY timestamp ASC`,
      [row.id]
    )

    sessions.push({
      id: row.id,
      userId: row.userId,
      exercise: row.exercise,
      startTime: new Date(row.startTime),
      endTime: new Date(row.endTime),
      totalReps: row.totalReps,
      avgFormScore: row.avgFormScore,
      frames: frames.map((f) => ({
        timestamp: f.timestamp,
        exercise: f.exercise || row.exercise,
        formScore: f.formScore,
        repNumber: f.repNumber,
        errors: JSON.parse(f.errors || '[]'),
        muscleEngagement: JSON.parse(f.muscleEngagement || '{}'),
      })),
      voiceFeedback: [],
      syncStatus: row.syncStatus,
    })
  }

  return sessions
}
