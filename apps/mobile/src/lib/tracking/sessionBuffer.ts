/**
 * sessionBuffer.ts
 *
 * SQLite-backed session + samples buffer for live GPS tracking.
 * Persists samples locally during a session so we never lose data
 * if the app is backgrounded, killed, or loses network.
 *
 * Tables:
 *   sessions(id, route_id, activity_type, started_at, ended_at, status)
 *   samples(session_id, t, lat, lng, alt, speed, heading, accuracy, steps)
 */

import * as SQLite from 'expo-sqlite';

export interface SampleRow {
  sessionId: string;
  t: number; // ms since epoch
  lat: number;
  lng: number;
  alt: number | null;
  speed: number | null;
  heading: number | null;
  accuracy: number | null;
  steps: number | null;
}

export interface SessionMeta {
  id: string;
  routeId: string | null;
  activityType: string;
  startedAt: number;
  endedAt: number | null;
  status: 'active' | 'paused' | 'completed' | 'synced';
}

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

function db() {
  if (!dbPromise) dbPromise = SQLite.openDatabaseAsync('fitai_tracking.db');
  return dbPromise;
}

export async function init(): Promise<void> {
  const d = await db();
  await d.execAsync(`
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      route_id TEXT,
      activity_type TEXT NOT NULL,
      started_at INTEGER NOT NULL,
      ended_at INTEGER,
      status TEXT NOT NULL DEFAULT 'active'
    );
    CREATE TABLE IF NOT EXISTS samples (
      session_id TEXT NOT NULL,
      t INTEGER NOT NULL,
      lat REAL NOT NULL,
      lng REAL NOT NULL,
      alt REAL,
      speed REAL,
      heading REAL,
      accuracy REAL,
      steps INTEGER,
      PRIMARY KEY(session_id, t)
    );
    CREATE INDEX IF NOT EXISTS samples_by_session ON samples(session_id);
  `);
}

export async function startSession(meta: Omit<SessionMeta, 'endedAt' | 'status'>): Promise<void> {
  const d = await db();
  await d.runAsync(
    'INSERT INTO sessions (id, route_id, activity_type, started_at, status) VALUES (?, ?, ?, ?, ?)',
    [meta.id, meta.routeId, meta.activityType, meta.startedAt, 'active'],
  );
}

export async function appendSamples(
  sessionId: string,
  samples: Omit<SampleRow, 'sessionId'>[],
): Promise<void> {
  if (samples.length === 0) return;
  const d = await db();
  await d.withTransactionAsync(async () => {
    for (const sample of samples) {
      await d.runAsync('INSERT OR IGNORE INTO samples VALUES (?,?,?,?,?,?,?,?,?)', [
        sessionId,
        sample.t,
        sample.lat,
        sample.lng,
        sample.alt,
        sample.speed,
        sample.heading,
        sample.accuracy,
        sample.steps,
      ]);
    }
  });
}

export async function getSamples(sessionId: string): Promise<SampleRow[]> {
  const d = await db();
  const rows = await d.getAllAsync<{
    session_id: string;
    t: number;
    lat: number;
    lng: number;
    alt: number | null;
    speed: number | null;
    heading: number | null;
    accuracy: number | null;
    steps: number | null;
  }>('SELECT * FROM samples WHERE session_id = ? ORDER BY t ASC', [sessionId]);
  return rows.map((r) => ({
    sessionId: r.session_id,
    t: r.t,
    lat: r.lat,
    lng: r.lng,
    alt: r.alt,
    speed: r.speed,
    heading: r.heading,
    accuracy: r.accuracy,
    steps: r.steps,
  }));
}

/**
 * Returns every (lat, lng) sample across every session — used by the heatmap
 * screen to render activity density. Optionally filtered by activity_type.
 */
export async function getAllSamplePoints(
  activityType?: string,
): Promise<{ lat: number; lng: number }[]> {
  const d = await db();
  const sql = activityType
    ? 'SELECT s.lat, s.lng FROM samples s JOIN sessions ss ON ss.id = s.session_id WHERE ss.activity_type = ?'
    : 'SELECT lat, lng FROM samples';
  const rows = await d.getAllAsync<{ lat: number; lng: number }>(
    sql,
    activityType ? [activityType] : [],
  );
  return rows;
}

export async function endSession(
  sessionId: string,
  status: 'completed' | 'synced' = 'completed',
): Promise<void> {
  const d = await db();
  await d.runAsync('UPDATE sessions SET ended_at = ?, status = ? WHERE id = ?', [
    Date.now(),
    status,
    sessionId,
  ]);
}

export async function listSessions(): Promise<SessionMeta[]> {
  const d = await db();
  const rows = await d.getAllAsync<{
    id: string;
    route_id: string | null;
    activity_type: string;
    started_at: number;
    ended_at: number | null;
    status: SessionMeta['status'];
  }>('SELECT * FROM sessions ORDER BY started_at DESC');
  return rows.map((r) => ({
    id: r.id,
    routeId: r.route_id,
    activityType: r.activity_type,
    startedAt: r.started_at,
    endedAt: r.ended_at,
    status: r.status,
  }));
}

export async function deleteSession(sessionId: string): Promise<void> {
  const d = await db();
  await d.withTransactionAsync(async () => {
    await d.runAsync('DELETE FROM samples WHERE session_id = ?', [sessionId]);
    await d.runAsync('DELETE FROM sessions WHERE id = ?', [sessionId]);
  });
}
