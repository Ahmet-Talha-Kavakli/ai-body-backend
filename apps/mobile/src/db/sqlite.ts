import * as SQLite from 'expo-sqlite'
import { executeMigrations } from './migrations'

let database: SQLite.SQLiteDatabase | null = null

export async function initializeDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (database) return database
  database = await SQLite.openDatabaseAsync(':memory:')
  await executeMigrations(database)
  return database
}

export function getDatabase(): SQLite.SQLiteDatabase {
  if (!database) throw new Error('Database not initialized')
  return database
}
