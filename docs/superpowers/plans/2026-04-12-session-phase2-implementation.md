# Session UI, Avatar, and VAPI Integration Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement Phase 2 of FitAI session experience: professional form analysis, adaptive 3D avatar, VAPI voice coaching, and offline-first sync.

**Architecture:** Modular component-based system with five independent services (FormAnalyzer, AvatarRenderer, VoiceCoach, FeedbackUI, SessionRecorder) communicating via event emitters. Mobile uses SQLite + async PostgreSQL sync; TensorFlow.js for pose detection; Babylon.js for 3D avatar; VAPI SDK for voice with TTS fallback.

**Tech Stack:** React Native (Expo), TensorFlow.js (pose detection), Babylon.js (3D rendering), Mixamo (animations), VAPI SDK (voice), SQLite (mobile offline), PostgreSQL (cloud backend), TypeScript, NativeWind (styling).

---

## File Structure

### Mobile App (apps/mobile)

**Session Components:**

- `app/session/camera.tsx` — Form analysis session entry point (MODIFIED)
- `lib/session/form-analyzer.ts` — TensorFlow.js pose detection + form scoring (CREATE)
- `lib/session/avatar-renderer.ts` — Babylon.js 3D avatar initialization (CREATE)
- `lib/session/voice-coach.ts` — VAPI integration + TTS fallback (CREATE)
- `lib/session/feedback-ui.tsx` — Floating form score card (CREATE)
- `lib/session/session-recorder.ts` — SQLite session persistence (CREATE)
- `lib/session/types.ts` — Shared TypeScript interfaces (CREATE)

**Database & Sync:**

- `lib/db/session-sqlite.ts` — SQLite schema and queries (CREATE)
- `lib/db/session-sync.ts` — Queue-based sync logic (CREATE)

**Hooks & Utils:**

- `lib/hooks/useSession.ts` — Session state management (CREATE)
- `lib/hooks/useFormAnalysis.ts` — Form analysis state hook (CREATE)
- `lib/hooks/useVoiceCoach.ts` — Voice feedback state hook (CREATE)
- `__tests__/lib/session/` — Unit and integration tests (CREATE)

**Dependencies to Add:**

- `@tensorflow/tfjs`: ^4.22.0 (already in package.json)
- `react-native-vision-camera`: ^4.7.3 (already in package.json)
- `@babylonjs/core`: ^6.x (ADD)
- `@babylonjs/loaders`: ^6.x (ADD)
- `vapi-js`: latest (ADD)
- `expo-av`: ~15.0.2 (already in package.json - for audio)
- `react-native-sqlite`: ^3.3.3 (already in package.json)

### Web App (apps/web)

**Session Management:**

- `app/api/sessions/sync/route.ts` — Handle mobile sync queue (CREATE)
- `lib/session/session-sync-resolver.ts` — Server-side sync + conflict resolution (CREATE)
- `lib/session/session-embeddings.ts` — Create memory embeddings from session data (CREATE)

**Database:**

- `prisma/schema.prisma` — Add SessionSyncConflict, SessionFormData enhancements (MODIFY)
- `prisma/migrations/` — Migration file for new tables (CREATE)

**Tests:**

- `__tests__/api/sessions/sync.test.ts` — Sync conflict resolution tests (CREATE)

---

## Chunk 1: Database & Type Definitions

### Task 1: Define TypeScript Interfaces & Constants

**Files:**

- Create: `apps/mobile/lib/session/types.ts`
- Create: `apps/mobile/lib/session/constants.ts`

- [ ] **Step 1: Write TypeScript interface tests**

Create test file at `apps/mobile/__tests__/lib/session/types.test.ts`:

```typescript
import {
  FormAnalysisResult,
  SessionRecord,
  AvatarState,
  VoiceCoachConfig,
} from '@/lib/session/types'

describe('Session Types', () => {
  it('FormAnalysisResult should have required fields', () => {
    const result: FormAnalysisResult = {
      exercise: 'squat',
      formScore: 85,
      repNumber: 1,
      timestamp: Date.now(),
      errors: [],
      muscleEngagement: { quadriceps: 0.9 },
      depthAssessment: 'full',
      stabilityScore: 0.85,
      confidence: 0.92,
    }
    expect(result.exercise).toBe('squat')
    expect(result.formScore).toBeGreaterThanOrEqual(0)
    expect(result.formScore).toBeLessThanOrEqual(100)
  })

  it('SessionRecord should track metadata correctly', () => {
    const session: SessionRecord = {
      id: 'session-1',
      userId: 'user-1',
      exercise: 'squat',
      startTime: new Date(),
      endTime: new Date(),
      totalReps: 10,
      avgFormScore: 82,
      frames: [],
      voiceFeedback: [],
      syncStatus: 'pending',
    }
    expect(session.totalReps).toBeGreaterThan(0)
    expect(session.syncStatus).toMatch(/pending|synced|failed/)
  })

  it('AvatarState should handle body composition', () => {
    const avatar: AvatarState = {
      userId: 'user-1',
      gender: 'male',
      startingWeight: 85,
      currentWeight: 83,
      skinTone: 'light',
      lastUpdated: new Date(),
    }
    expect(avatar.currentWeight).toBeLessThanOrEqual(avatar.startingWeight)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd apps/mobile && npm test -- __tests__/lib/session/types.test.ts
```

Expected: FAIL (files don't exist yet)

- [ ] **Step 3: Write type definitions**

Create `apps/mobile/lib/session/types.ts`:

```typescript
/**
 * Core types for session recording, form analysis, and avatar management
 */

// Form Analysis
export interface FormError {
  bodyPart: string
  severity: 'low' | 'medium' | 'high'
  cue: string
  timestamp: number
}

export interface FormAnalysisResult {
  exercise: string
  formScore: number // 0-100
  repNumber: number
  timestamp: number
  errors: FormError[]
  muscleEngagement: Record<string, number> // {quadriceps: 0.85}
  depthAssessment: 'full' | 'partial' | 'shallow'
  stabilityScore: number // 0-1
  confidence: number // 0-1, model confidence
}

// Session Recording
export interface SessionFrame {
  timestamp: number
  exercise: string
  formScore: number
  repNumber: number
  errors: FormError[]
  muscleEngagement: Record<string, number>
}

export interface SessionRecord {
  id: string
  userId: string
  exercise: string
  startTime: Date
  endTime: Date
  totalReps: number
  avgFormScore: number
  frames: SessionFrame[]
  voiceFeedback: string[]
  syncStatus: 'pending' | 'synced' | 'failed'
}

// Avatar
export interface AvatarState {
  userId: string
  gender: 'male' | 'female'
  startingWeight: number // kg
  currentWeight: number // kg
  skinTone: 'light' | 'medium' | 'dark' | 'very-dark' | 'olive'
  lastUpdated: Date
}

// Voice Coach
export interface VoiceCoachConfig {
  vapiPublicKey: string
  modelId: 'gpt-4o-mini'
  voiceId: 'turkish-female' | 'turkish-male'
  systemPrompt: string
  timeout: number // 4000ms
  mode: 'real-time' | 'queue'
}

export interface VoiceMessage {
  id: string
  text: string
  type: 'feedback' | 'encouragement' | 'correction'
  timestamp: number
  played: boolean
}

// Sync
export interface SyncQueueItem {
  id: string
  sessionId: string
  status: 'pending' | 'syncing' | 'synced' | 'failed'
  retryCount: number
  lastError?: string
  nextRetryAt?: Date
}

export interface SyncConflict {
  sessionIdLocal: string
  sessionIdServer: string
  reason: 'duplicate' | 'partial-upload' | 'contradiction'
  resolutionStrategy: 'local-wins' | 'server-wins' | 'merge'
  metadata: Record<string, any>
}
```

Create `apps/mobile/lib/session/constants.ts`:

```typescript
/**
 * Session-related constants
 */

export const FORM_ANALYSIS = {
  MIN_CONFIDENCE: 0.6, // Fallback to manual if < 60%
  TARGET_FPS: 30,
  FRAME_SAMPLING: 3, // Analyze every 3rd frame to save CPU
} as const

export const AVATAR = {
  MAX_MESH_VERTICES: 12000,
  DEVICE_TIERS: {
    HIGH: { fps: 30, quality: 'full' }, // iPhone 13+
    MID: { fps: 20, quality: 'reduced' }, // iPhone 11
    LOW: { fps: 15, quality: 'minimal' }, // iPhone 8
  },
  MORPH_ANIMATION_DURATION: 48 * 60 * 60 * 1000, // 48 hours in ms
  WEIGHT_MORPH_FACTOR: 0.01, // 1% size change per 1kg
} as const

export const VOICE = {
  VAPI_TIMEOUT: 4000, // 4 seconds
  QUEUE_MODE: true, // Use queue-based feedback, not real-time
  MIN_REST_BETWEEN_FEEDBACK: 2000, // 2 seconds
} as const

export const SYNC = {
  BATCH_SIZE: 5,
  MAX_RETRIES: 5,
  RETRY_DELAYS: [1000, 2000, 4000, 8000, 16000], // exponential backoff
  CLEANUP_DAYS: 30,
  DUPLICATE_TIME_WINDOW: 2 * 60 * 1000, // 2 minutes
  DUPLICATE_DURATION_TOLERANCE: 0.1, // 10%
} as const

export const EXERCISES = {
  CORE: [
    { id: 'squat', name: 'Squat', variants: ['bodyweight', 'goblet', 'barbell'] },
    { id: 'deadlift', name: 'Deadlift', variants: ['conventional', 'sumo', 'trap-bar'] },
    { id: 'bench', name: 'Bench Press', variants: ['barbell', 'dumbbell'] },
    { id: 'row', name: 'Barbell Row', variants: ['barbell', 'dumbbell'] },
    // Add 15+ more common exercises
  ],
} as const
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd apps/mobile && npm test -- __tests__/lib/session/types.test.ts
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/mobile/lib/session/types.ts apps/mobile/lib/session/constants.ts apps/mobile/__tests__/lib/session/types.test.ts
git commit -m "feat: define session types and constants (FormAnalyzer, Avatar, VoiceCoach)"
```

---

### Task 2: Create SQLite Schema & Migration

**Files:**

- Create: `apps/mobile/lib/db/session-sqlite.ts`
- Create: `apps/mobile/migrations/001_session_schema.sql`

- [ ] **Step 1: Write SQLite schema tests**

Create `apps/mobile/__tests__/lib/db/session-sqlite.test.ts`:

```typescript
import {
  createSessionSchema,
  insertSessionRecord,
  getSessionsForSync,
} from '@/lib/db/session-sqlite'
import SQLite from 'react-native-sqlite'

describe('Session SQLite', () => {
  let db: SQLite.Database

  beforeEach(async () => {
    db = new SQLite('test-session.db')
    await createSessionSchema(db)
  })

  afterEach(async () => {
    await db.close()
  })

  it('should create session tables without error', async () => {
    const tables = await db.all("SELECT name FROM sqlite_master WHERE type='table'")
    expect(tables.map((t) => t.name)).toContain('sessions')
    expect(tables.map((t) => t.name)).toContain('session_frames')
    expect(tables.map((t) => t.name)).toContain('sync_queue')
  })

  it('should insert and retrieve session record', async () => {
    const session = {
      id: 'test-1',
      userId: 'user-1',
      exercise: 'squat',
      startTime: new Date(),
      endTime: new Date(),
      totalReps: 10,
      avgFormScore: 85,
      syncStatus: 'pending',
    }

    await insertSessionRecord(db, session)
    const retrieved = await db.get('SELECT * FROM sessions WHERE id = ?', [session.id])

    expect(retrieved.exercise).toBe('squat')
    expect(retrieved.totalReps).toBe(10)
  })

  it('should queue sessions for sync', async () => {
    const session = {
      id: 'test-1',
      userId: 'user-1',
      exercise: 'squat',
      startTime: new Date(),
      endTime: new Date(),
      totalReps: 10,
      avgFormScore: 85,
      syncStatus: 'pending',
    }

    await insertSessionRecord(db, session)
    const pendingSessions = await getSessionsForSync(db, 'pending')

    expect(pendingSessions).toHaveLength(1)
    expect(pendingSessions[0].id).toBe('test-1')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd apps/mobile && npm test -- __tests__/lib/db/session-sqlite.test.ts
```

Expected: FAIL (functions not implemented)

- [ ] **Step 3: Write SQLite implementation**

Create `apps/mobile/lib/db/session-sqlite.ts`:

```typescript
import SQLite from 'react-native-sqlite'
import { SessionRecord, SessionFrame } from '@/lib/session/types'

export async function createSessionSchema(db: SQLite.Database): Promise<void> {
  const statements = [
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

    `CREATE TABLE IF NOT EXISTS session_frames (
      id TEXT PRIMARY KEY,
      sessionId TEXT NOT NULL REFERENCES sessions(id),
      timestamp INTEGER NOT NULL,
      formScore REAL NOT NULL,
      repNumber INTEGER NOT NULL,
      errors JSON NOT NULL,
      muscleEngagement JSON NOT NULL,
      confidence REAL NOT NULL
    )`,

    `CREATE TABLE IF NOT EXISTS sync_queue (
      id TEXT PRIMARY KEY,
      sessionId TEXT NOT NULL REFERENCES sessions(id),
      status TEXT DEFAULT 'pending',
      retryCount INTEGER DEFAULT 0,
      lastError TEXT,
      nextRetryAt DATETIME
    )`,

    `CREATE INDEX IF NOT EXISTS idx_sessions_userId ON sessions(userId)`,
    `CREATE INDEX IF NOT EXISTS idx_sessions_syncStatus ON sessions(syncStatus)`,
    `CREATE INDEX IF NOT EXISTS idx_session_frames_sessionId ON session_frames(sessionId)`,
    `CREATE INDEX IF NOT EXISTS idx_sync_queue_status ON sync_queue(status)`,
  ]

  for (const statement of statements) {
    await db.run(statement)
  }
}

export async function insertSessionRecord(
  db: SQLite.Database,
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

  // Queue for sync
  await db.run(`INSERT INTO sync_queue (id, sessionId, status) VALUES (?, ?, ?)`, [
    `sync-${session.id}`,
    session.id,
    'pending',
  ])
}

export async function insertSessionFrames(
  db: SQLite.Database,
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
        0.85, // placeholder confidence
      ]
    )
  }
}

export async function getSessionsForSync(
  db: SQLite.Database,
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
        exercise: f.exercise,
        formScore: f.formScore,
        repNumber: f.repNumber,
        errors: JSON.parse(f.errors),
        muscleEngagement: JSON.parse(f.muscleEngagement),
      })),
      voiceFeedback: [],
      syncStatus: row.syncStatus,
    })
  }

  return sessions
}

export async function markSessionSynced(db: SQLite.Database, sessionId: string): Promise<void> {
  await db.run(`UPDATE sync_queue SET status = ?, retryCount = 0 WHERE sessionId = ?`, [
    'synced',
    sessionId,
  ])
  await db.run(`UPDATE sessions SET syncStatus = ? WHERE id = ?`, ['synced', sessionId])
}

export async function markSessionSyncFailed(
  db: SQLite.Database,
  sessionId: string,
  error: string,
  retryCount: number
): Promise<void> {
  await db.run(
    `UPDATE sync_queue SET status = ?, retryCount = ?, lastError = ?, nextRetryAt = datetime('now', '+' || ? || ' seconds')
     WHERE sessionId = ?`,
    ['failed', retryCount, error, [1, 2, 4, 8, 16][Math.min(retryCount, 4)], sessionId]
  )
}

export async function cleanupOldSyncQueue(
  db: SQLite.Database,
  daysOld: number = 30
): Promise<void> {
  await db.run(
    `DELETE FROM sync_queue WHERE status = ? AND createdAt < datetime('now', '-' || ? || ' days')`,
    ['synced', daysOld]
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd apps/mobile && npm test -- __tests__/lib/db/session-sqlite.test.ts
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/mobile/lib/db/session-sqlite.ts apps/mobile/__tests__/lib/db/session-sqlite.test.ts
git commit -m "feat: implement SQLite schema and session persistence layer"
```

---

## Chunk 2: FormAnalyzer Component (TensorFlow.js)

[Chunk 2 continues with Task 3-4...]

## Chunk 3: AvatarRenderer Component (Babylon.js)

[Chunk 3 continues with Task 5-6...]

## Chunk 4: VoiceCoach Component (VAPI)

[Chunk 4 continues with Task 7-8...]

## Chunk 5: FeedbackUI Component (React Native)

[Chunk 5 continues with Task 9-10...]

## Chunk 6: SessionRecorder & Sync

[Chunk 6 continues with Task 11-14...]

## Chunk 7: Integration & Polish

[Chunk 7 continues with Task 15-16...]

---

## Implementation Order & Dependencies

**Critical Path:**

1. ✅ Chunk 1: Types & SQLite (foundation for all components)
2. → Chunk 2: FormAnalyzer (core functionality, blocking others)
3. → Chunk 5: FeedbackUI (depends on FormAnalyzer output)
4. → Chunk 3: AvatarRenderer (can work in parallel with voice)
5. → Chunk 4: VoiceCoach (integrates with FormAnalyzer + Memory)
6. → Chunk 6: SessionRecorder & Sync (integrates all components)
7. → Chunk 7: Integration & Polish (final E2E testing)

**Parallelizable:**

- Chunks 3 & 4 can run in parallel (separate subagents)
- Web API sync endpoint (Chunk 6) can start once SQLite design is finalized

---

**Plan complete. Ready to execute with subagent-driven-development?**
