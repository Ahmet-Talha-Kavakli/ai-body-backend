import { openDatabaseSync } from 'expo-sqlite'
import type {
  Coach,
  CoachingSession,
  CoachingProgram,
  CoachRating,
} from '../types/coaching'

const db = openDatabaseSync('coaching.db')

export async function createCoachingTables(): Promise<void> {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS coaches (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      avatar TEXT,
      bio TEXT NOT NULL,
      verified BOOLEAN DEFAULT 0,
      specializations TEXT NOT NULL,
      certifications TEXT NOT NULL,
      rating REAL DEFAULT 0,
      reviewCount INTEGER DEFAULT 0,
      hourlyRate REAL NOT NULL,
      availability TEXT NOT NULL,
      createdAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS coaching_sessions (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      coachId TEXT NOT NULL,
      coach TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('scheduled', 'ondemand')),
      scheduledAt TEXT,
      startedAt TEXT,
      endedAt TEXT,
      status TEXT NOT NULL CHECK(status IN ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled')),
      agoraChannel TEXT NOT NULL,
      agoraUserToken TEXT NOT NULL,
      agoraCoachToken TEXT NOT NULL,
      coachNotes TEXT,
      formScores TEXT,
      recordingUrl TEXT,
      recordingConsent BOOLEAN DEFAULT 0,
      createdAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS coaching_programs (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      coachId TEXT NOT NULL,
      sessionId TEXT NOT NULL,
      exercises TEXT NOT NULL,
      nutritionNotes TEXT,
      recoveryTips TEXT,
      nextSessionRecommendation TEXT,
      createdAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS coach_ratings (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      coachId TEXT NOT NULL,
      rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
      review TEXT,
      sessionId TEXT,
      createdAt TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_coaching_sessions_userId ON coaching_sessions(userId);
    CREATE INDEX IF NOT EXISTS idx_coaching_sessions_coachId ON coaching_sessions(coachId);
    CREATE INDEX IF NOT EXISTS idx_coaching_sessions_createdAt ON coaching_sessions(createdAt DESC);
    CREATE INDEX IF NOT EXISTS idx_coaching_programs_userId ON coaching_programs(userId);
    CREATE INDEX IF NOT EXISTS idx_coaching_programs_sessionId ON coaching_programs(sessionId);
    CREATE INDEX IF NOT EXISTS idx_coach_ratings_coachId ON coach_ratings(coachId);
  `)
}

export async function saveCoach(coach: Coach): Promise<void> {
  await db.runAsync(
    `INSERT OR REPLACE INTO coaches
     (id, name, avatar, bio, verified, specializations, certifications, rating, reviewCount, hourlyRate, availability, createdAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      coach.id,
      coach.name,
      coach.avatar ?? null,
      coach.bio,
      coach.verified ? 1 : 0,
      JSON.stringify(coach.specializations),
      JSON.stringify(coach.certifications),
      coach.rating,
      coach.reviewCount,
      coach.hourlyRate,
      JSON.stringify(coach.availability),
      new Date().toISOString(),
    ]
  )
}

export async function getCoach(coachId: string): Promise<Coach | undefined> {
  const results = await db.getAllAsync<any>(
    'SELECT * FROM coaches WHERE id = ? LIMIT 1',
    [coachId]
  )

  if (results.length === 0) return undefined

  const row = results[0]
  return {
    id: row.id,
    name: row.name,
    avatar: row.avatar,
    bio: row.bio,
    verified: row.verified === 1,
    specializations: JSON.parse(row.specializations),
    certifications: JSON.parse(row.certifications),
    rating: row.rating,
    reviewCount: row.reviewCount,
    hourlyRate: row.hourlyRate,
    availability: JSON.parse(row.availability),
  }
}

export async function getAllCoaches(): Promise<Coach[]> {
  const results = await db.getAllAsync<any>(
    'SELECT * FROM coaches ORDER BY rating DESC'
  )

  return results.map((row) => ({
    id: row.id,
    name: row.name,
    avatar: row.avatar,
    bio: row.bio,
    verified: row.verified === 1,
    specializations: JSON.parse(row.specializations),
    certifications: JSON.parse(row.certifications),
    rating: row.rating,
    reviewCount: row.reviewCount,
    hourlyRate: row.hourlyRate,
    availability: JSON.parse(row.availability),
  }))
}

export async function createCoachingSession(
  session: CoachingSession
): Promise<void> {
  await db.runAsync(
    `INSERT INTO coaching_sessions
     (id, userId, coachId, coach, type, scheduledAt, startedAt, endedAt, status, agoraChannel, agoraUserToken, agoraCoachToken, coachNotes, formScores, recordingUrl, recordingConsent, createdAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      session.id,
      session.userId,
      session.coachId,
      JSON.stringify(session.coach),
      session.type,
      session.scheduledAt ?? null,
      session.startedAt ?? null,
      session.endedAt ?? null,
      session.status,
      session.agoraChannel,
      session.agoraUserToken,
      session.agoraCoachToken,
      session.coachNotes ?? null,
      session.formScores ? JSON.stringify(session.formScores) : null,
      session.recordingUrl ?? null,
      session.recordingConsent ? 1 : 0,
      session.createdAt ?? new Date().toISOString(),
    ]
  )
}

export async function getCoachingSession(
  sessionId: string
): Promise<CoachingSession | undefined> {
  const results = await db.getAllAsync<any>(
    'SELECT * FROM coaching_sessions WHERE id = ? LIMIT 1',
    [sessionId]
  )

  if (results.length === 0) return undefined

  const row = results[0]
  return {
    id: row.id,
    userId: row.userId,
    coachId: row.coachId,
    coach: JSON.parse(row.coach),
    type: row.type,
    scheduledAt: row.scheduledAt,
    startedAt: row.startedAt,
    endedAt: row.endedAt,
    status: row.status,
    agoraChannel: row.agoraChannel,
    agoraUserToken: row.agoraUserToken,
    agoraCoachToken: row.agoraCoachToken,
    coachNotes: row.coachNotes,
    formScores: row.formScores ? JSON.parse(row.formScores) : undefined,
    recordingUrl: row.recordingUrl,
    recordingConsent: row.recordingConsent === 1,
    createdAt: row.createdAt,
  }
}

export async function getUserSessions(userId: string): Promise<CoachingSession[]> {
  const results = await db.getAllAsync<any>(
    'SELECT * FROM coaching_sessions WHERE userId = ? ORDER BY createdAt DESC',
    [userId]
  )

  return results.map((row) => ({
    id: row.id,
    userId: row.userId,
    coachId: row.coachId,
    coach: JSON.parse(row.coach),
    type: row.type,
    scheduledAt: row.scheduledAt,
    startedAt: row.startedAt,
    endedAt: row.endedAt,
    status: row.status,
    agoraChannel: row.agoraChannel,
    agoraUserToken: row.agoraUserToken,
    agoraCoachToken: row.agoraCoachToken,
    coachNotes: row.coachNotes,
    formScores: row.formScores ? JSON.parse(row.formScores) : undefined,
    recordingUrl: row.recordingUrl,
    recordingConsent: row.recordingConsent === 1,
    createdAt: row.createdAt,
  }))
}

export async function updateSessionStatus(
  sessionId: string,
  status: CoachingSession['status']
): Promise<void> {
  await db.runAsync(
    'UPDATE coaching_sessions SET status = ? WHERE id = ?',
    [status, sessionId]
  )
}

export async function createCoachingProgram(
  program: CoachingProgram
): Promise<void> {
  await db.runAsync(
    `INSERT INTO coaching_programs
     (id, userId, coachId, sessionId, exercises, nutritionNotes, recoveryTips, nextSessionRecommendation, createdAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      program.id,
      program.userId,
      program.coachId,
      program.sessionId,
      JSON.stringify(program.exercises),
      program.nutritionNotes ?? null,
      program.recoveryTips ?? null,
      program.nextSessionRecommendation ?? null,
      program.createdAt,
    ]
  )
}

export async function getCoachingProgram(
  programId: string
): Promise<CoachingProgram | undefined> {
  const results = await db.getAllAsync<any>(
    'SELECT * FROM coaching_programs WHERE id = ? LIMIT 1',
    [programId]
  )

  if (results.length === 0) return undefined

  const row = results[0]
  return {
    id: row.id,
    userId: row.userId,
    coachId: row.coachId,
    sessionId: row.sessionId,
    exercises: JSON.parse(row.exercises),
    nutritionNotes: row.nutritionNotes,
    recoveryTips: row.recoveryTips,
    nextSessionRecommendation: row.nextSessionRecommendation,
    createdAt: row.createdAt,
  }
}

export async function saveCoachRating(rating: CoachRating): Promise<void> {
  await db.runAsync(
    `INSERT INTO coach_ratings
     (id, userId, coachId, rating, review, sessionId, createdAt)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      rating.id,
      rating.userId,
      rating.coachId,
      rating.rating,
      rating.review ?? null,
      rating.sessionId ?? null,
      rating.createdAt,
    ]
  )
}

export async function getCoachRatings(coachId: string): Promise<CoachRating[]> {
  const results = await db.getAllAsync<any>(
    'SELECT * FROM coach_ratings WHERE coachId = ? ORDER BY createdAt DESC',
    [coachId]
  )

  return results.map((row) => ({
    id: row.id,
    userId: row.userId,
    coachId: row.coachId,
    rating: row.rating,
    review: row.review,
    sessionId: row.sessionId,
    createdAt: row.createdAt,
  }))
}

export async function deleteOldSessions(daysOld: number): Promise<number> {
  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - daysOld)

  const result = await db.runAsync(
    'DELETE FROM coaching_sessions WHERE createdAt < ?',
    [cutoffDate.toISOString()]
  )

  return result.changes ?? 0
}
