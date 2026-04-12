import {
  createSessionSchema,
  insertSessionRecord,
  insertSessionFrames,
  getSessionsForSync,
  markSessionSynced,
  markSessionSyncFailed,
} from '@/lib/db/session-sqlite'
import SQLite from 'react-native-sqlite'
import { SessionRecord } from '@/lib/session/types'
import { beforeEach, afterEach, describe, it, expect, vi } from 'vitest'

describe('Session SQLite', () => {
  let db: any

  beforeEach(async () => {
    // Mock SQLite database for testing
    db = {
      run: vi.fn(async () => ({ changes: 1 })),
      all: vi.fn(async () => []),
      get: vi.fn(async () => ({})),
      close: vi.fn(async () => {}),
    }
  })

  afterEach(async () => {
    if (db && db.close) {
      await db.close()
    }
  })

  it('should create session tables without error', async () => {
    // Mock that tables are created
    db.all = vi.fn(async (query) => {
      if (query.includes('SELECT name FROM sqlite_master')) {
        return [{ name: 'sessions' }, { name: 'session_frames' }, { name: 'sync_queue' }]
      }
      return []
    })

    await createSessionSchema(db)

    // Verify all table creation statements were executed
    expect(db.run).toHaveBeenCalled()
    const calls = db.run.mock.calls
    const createTableCalls = calls.filter(
      ([sql]) => sql.includes('CREATE TABLE') || sql.includes('CREATE INDEX')
    )

    // Should have created 3 tables + 5 indexes
    expect(createTableCalls.length).toBe(8)
  })

  it('should insert and retrieve session record', async () => {
    const session = {
      id: 'test-1',
      userId: 'user-1',
      exercise: 'squat',
      startTime: new Date('2026-04-12T10:00:00Z'),
      endTime: new Date('2026-04-12T10:05:00Z'),
      totalReps: 10,
      avgFormScore: 85,
      syncStatus: 'pending' as const,
    }

    db.run = vi.fn(async () => ({ changes: 1 }))

    await insertSessionRecord(db, session)

    // Verify run was called twice (once for sessions, once for sync_queue)
    expect(db.run).toHaveBeenCalledTimes(2)

    // Verify first call is INSERT into sessions
    const firstCall = db.run.mock.calls[0]
    expect(firstCall[0]).toContain('INSERT INTO sessions')
    expect(firstCall[1]).toContain(session.id)
    expect(firstCall[1]).toContain(session.userId)
    expect(firstCall[1]).toContain(session.exercise)
  })

  it('should queue sessions for sync with correct status', async () => {
    const session = {
      id: 'test-1',
      userId: 'user-1',
      exercise: 'squat',
      startTime: new Date('2026-04-12T10:00:00Z'),
      endTime: new Date('2026-04-12T10:05:00Z'),
      totalReps: 10,
      avgFormScore: 85,
      syncStatus: 'pending' as const,
    }

    db.run = vi.fn(async () => ({ changes: 1 }))
    db.all = vi.fn(async (query) => {
      if (query.includes('SELECT s.* FROM sessions')) {
        return [
          {
            id: session.id,
            userId: session.userId,
            exercise: session.exercise,
            startTime: session.startTime.toISOString(),
            endTime: session.endTime.toISOString(),
            totalReps: session.totalReps,
            avgFormScore: session.avgFormScore,
            syncStatus: 'pending',
          },
        ]
      }
      return []
    })

    await insertSessionRecord(db, session)
    const pendingSessions = await getSessionsForSync(db, 'pending')

    expect(pendingSessions).toHaveLength(1)
    expect(pendingSessions[0].id).toBe('test-1')
    expect(pendingSessions[0].syncStatus).toBe('pending')
  })

  it('should update session sync status to synced', async () => {
    db.run = vi.fn(async () => ({ changes: 1 }))

    await markSessionSynced(db, 'test-1')

    // Verify two UPDATE calls
    expect(db.run).toHaveBeenCalledTimes(2)

    // First should update sync_queue
    const firstCall = db.run.mock.calls[0]
    expect(firstCall[0]).toContain('UPDATE sync_queue')
    expect(firstCall[1]).toContain('synced')

    // Second should update sessions
    const secondCall = db.run.mock.calls[1]
    expect(secondCall[0]).toContain('UPDATE sessions')
  })

  it('should handle sync failure with retry count', async () => {
    db.run = vi.fn(async () => ({ changes: 1 }))

    await markSessionSyncFailed(db, 'test-1', 'Network timeout', 0)

    // Verify one UPDATE call
    expect(db.run).toHaveBeenCalled()
    const call = db.run.mock.calls[0]

    expect(call[0]).toContain('UPDATE sync_queue')
    expect(call[1]).toContain('failed')
    expect(call[1]).toContain('Network timeout')
  })

  it('should retrieve frames for sessions', async () => {
    const session = {
      id: 'test-1',
      userId: 'user-1',
      exercise: 'squat',
      startTime: new Date('2026-04-12T10:00:00Z'),
      endTime: new Date('2026-04-12T10:05:00Z'),
      totalReps: 3,
      avgFormScore: 85,
      syncStatus: 'pending' as const,
    }

    const frames = [
      {
        timestamp: 1681234567000,
        exercise: 'squat',
        formScore: 85,
        repNumber: 1,
        errors: [],
        muscleEngagement: { quadriceps: 0.9 },
      },
      {
        timestamp: 1681234568000,
        exercise: 'squat',
        formScore: 82,
        repNumber: 2,
        errors: [
          {
            bodyPart: 'knee',
            severity: 'low' as const,
            cue: 'Keep knees tracking',
            timestamp: 1681234568000,
          },
        ],
        muscleEngagement: { quadriceps: 0.88 },
      },
    ]

    db.run = vi.fn(async () => ({ changes: 1 }))
    db.all = vi.fn(async (query) => {
      if (query.includes('SELECT s.* FROM sessions')) {
        return [
          {
            id: session.id,
            userId: session.userId,
            exercise: session.exercise,
            startTime: session.startTime.toISOString(),
            endTime: session.endTime.toISOString(),
            totalReps: session.totalReps,
            avgFormScore: session.avgFormScore,
            syncStatus: 'pending',
          },
        ]
      }
      if (query.includes('SELECT * FROM session_frames')) {
        return [
          {
            id: `frame-${session.id}-${frames[0].timestamp}`,
            sessionId: session.id,
            timestamp: frames[0].timestamp,
            formScore: frames[0].formScore,
            repNumber: frames[0].repNumber,
            errors: JSON.stringify(frames[0].errors),
            muscleEngagement: JSON.stringify(frames[0].muscleEngagement),
            confidence: 0.85,
          },
          {
            id: `frame-${session.id}-${frames[1].timestamp}`,
            sessionId: session.id,
            timestamp: frames[1].timestamp,
            formScore: frames[1].formScore,
            repNumber: frames[1].repNumber,
            errors: JSON.stringify(frames[1].errors),
            muscleEngagement: JSON.stringify(frames[1].muscleEngagement),
            confidence: 0.85,
          },
        ]
      }
      return []
    })

    await insertSessionRecord(db, session)
    await insertSessionFrames(db, session.id, frames)

    const sessions = await getSessionsForSync(db, 'pending')

    expect(sessions).toHaveLength(1)
    expect(sessions[0].frames).toHaveLength(2)
    expect(sessions[0].frames[0].repNumber).toBe(1)
    expect(sessions[0].frames[1].repNumber).toBe(2)
    expect(sessions[0].frames[1].errors).toHaveLength(1)
    expect(sessions[0].frames[1].errors[0].bodyPart).toBe('knee')
  })
})
