import * as SQLite from 'expo-sqlite'
import AsyncStorage from '@react-native-async-storage/async-storage'

const dbName = 'fitai.db'

export interface OfflineSession {
  id: string
  exercise_name: string
  reps: number
  weight: number
  form_score: number
  synced: boolean
  created_at: number
}

let dbInstance: SQLite.SQLiteDatabase | null = null

async function getDb() {
  if (!dbInstance) {
    dbInstance = await SQLite.openDatabaseAsync(dbName)
    await initializeDb()
  }
  return dbInstance
}

async function initializeDb() {
  const db = await getDb()
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS offline_sessions (
      id TEXT PRIMARY KEY,
      exercise_name TEXT NOT NULL,
      reps REAL NOT NULL,
      weight REAL NOT NULL,
      form_score REAL NOT NULL,
      synced INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_synced ON offline_sessions(synced);
  `)
}

export const db = {
  async addSession(session: Omit<OfflineSession, 'id'>) {
    const database = await getDb()
    const id = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    await database.runAsync(
      `INSERT INTO offline_sessions (id, exercise_name, reps, weight, form_score, synced, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        session.exercise_name,
        session.reps,
        session.weight,
        session.form_score,
        session.synced ? 1 : 0,
        session.created_at,
      ]
    )
    return id
  },

  async getSessions(synced?: boolean): Promise<OfflineSession[]> {
    const database = await getDb()
    let query = 'SELECT * FROM offline_sessions'
    const params: any[] = []

    if (synced !== undefined) {
      query += ' WHERE synced = ?'
      params.push(synced ? 1 : 0)
    }

    const result = await database.getAllAsync<any>(query, params)
    return result.map((row) => ({
      ...row,
      synced: row.synced === 1,
    }))
  },

  async updateSession(id: string, updates: Partial<OfflineSession>) {
    const database = await getDb()
    const setClauses: string[] = []
    const values: any[] = []

    if (updates.exercise_name !== undefined) {
      setClauses.push('exercise_name = ?')
      values.push(updates.exercise_name)
    }
    if (updates.reps !== undefined) {
      setClauses.push('reps = ?')
      values.push(updates.reps)
    }
    if (updates.weight !== undefined) {
      setClauses.push('weight = ?')
      values.push(updates.weight)
    }
    if (updates.form_score !== undefined) {
      setClauses.push('form_score = ?')
      values.push(updates.form_score)
    }
    if (updates.synced !== undefined) {
      setClauses.push('synced = ?')
      values.push(updates.synced ? 1 : 0)
    }

    if (setClauses.length === 0) return

    values.push(id)
    await database.runAsync(
      `UPDATE offline_sessions SET ${setClauses.join(', ')} WHERE id = ?`,
      values
    )
  },

  async deleteSession(id: string) {
    const database = await getDb()
    await database.runAsync('DELETE FROM offline_sessions WHERE id = ?', [id])
  },

  async clearSyncedSessions() {
    const database = await getDb()
    await database.runAsync('DELETE FROM offline_sessions WHERE synced = 1')
  },

  async closeDb() {
    if (dbInstance) {
      await dbInstance.closeAsync()
      dbInstance = null
    }
  },
}
