import { vi, beforeEach } from 'vitest'

// Mock react-native first
vi.mock('react-native', () => ({
  View: 'View',
  Text: 'Text',
  TouchableOpacity: 'TouchableOpacity',
  TextInput: 'TextInput',
  StyleSheet: {
    create: (styles: any) => styles,
  },
}))

// Mock react-native-svg
vi.mock('react-native-svg', () => ({
  default: 'Svg',
  Svg: 'Svg',
  Circle: 'Circle',
}))

// In-memory database for testing
class MockDatabase {
  private waterData: Map<string, { date: string; totalMl: number; goalMl: number }> = new Map()
  private syncQueueData: Map<string, any> = new Map()

  clear() {
    this.waterData.clear()
    this.syncQueueData.clear()
  }

  async execAsync(sql: string): Promise<void> {
    // No-op for schema creation in tests
    return
  }

  async runAsync(sql: string, params?: any[]): Promise<void> {
    // Water intake operations
    if (sql.includes('UPDATE water_intake SET totalMl = totalMl + ?')) {
      const ml = params?.[0] || 0
      const date = params?.[1] || ''
      const existing = this.waterData.get(date)
      if (existing) {
        existing.totalMl += ml
      }
    } else if (sql.includes('INSERT INTO water_intake')) {
      const date = params?.[0] || ''
      const ml = params?.[1] || 0
      const goal = params?.[2] || 2000
      this.waterData.set(date, { date, totalMl: ml, goalMl: goal })
    }
    // Nutrition sync queue operations
    else if (sql.includes('INSERT INTO nutrition_sync_queue')) {
      const id = params?.[0] || ''
      const type = params?.[1] || ''
      const payload = params?.[2] || ''
      const status = params?.[3] || 'pending'
      const attempts = params?.[4] || 0
      const createdAt = params?.[5] || ''
      const synced = params?.[6] || 0
      this.syncQueueData.set(id, {
        id,
        type,
        payload,
        status,
        attempts,
        createdAt,
        synced,
        lastAttempt: null,
        error: null,
      })
    } else if (
      sql.includes('UPDATE nutrition_sync_queue SET status = ?') &&
      sql.includes('lastAttempt = ?') &&
      sql.includes('synced = 1')
    ) {
      const status = params?.[0] || ''
      const lastAttempt = params?.[1] || ''
      const id = params?.[2] || ''
      const item = this.syncQueueData.get(id)
      if (item) {
        item.status = status
        item.lastAttempt = lastAttempt
        item.synced = 1
      }
    } else if (
      sql.includes('UPDATE nutrition_sync_queue SET status = ?') &&
      sql.includes('error = ?')
    ) {
      const status = params?.[0] || ''
      const error = params?.[1] || ''
      const lastAttempt = params?.[2] || ''
      const id = params?.[3] || ''
      const item = this.syncQueueData.get(id)
      if (item) {
        item.status = status
        item.error = error
        item.lastAttempt = lastAttempt
      }
    } else if (sql.includes('UPDATE nutrition_sync_queue SET attempts = ?')) {
      const attempts = params?.[0] || 0
      const lastAttempt = params?.[1] || ''
      const id = params?.[2] || ''
      const item = this.syncQueueData.get(id)
      if (item) {
        item.attempts = attempts
        item.lastAttempt = lastAttempt
      }
    }
  }

  async getFirstAsync<T>(sql: string, params?: any[]): Promise<T | undefined> {
    // Water intake operations
    if (sql.includes('changes()')) {
      const date = params?.[1] || ''
      const hasData = this.waterData.has(date)
      return { changes: hasData ? 1 : 0 } as T
    }
    if (sql.includes('SELECT date, totalMl, goalMl FROM water_intake')) {
      const date = params?.[0] || ''
      const data = this.waterData.get(date)
      return data as T
    }
    // Nutrition sync queue operations
    if (sql.includes('SELECT * FROM nutrition_sync_queue WHERE id = ?')) {
      const id = params?.[0] || ''
      const item = this.syncQueueData.get(id)
      return item as T
    }
    return undefined
  }

  async getAllAsync<T>(sql: string, params?: any[]): Promise<T[]> {
    // Water intake operations
    if (sql.includes('SELECT date, totalMl, goalMl FROM water_intake')) {
      const startDate = params?.[0] || ''
      const endDate = params?.[1] || ''
      const results: T[] = []
      for (const [, value] of this.waterData) {
        if (value.date >= startDate && value.date <= endDate) {
          results.push(value as T)
        }
      }
      return results.sort((a: any, b: any) => b.date.localeCompare(a.date))
    }
    // Nutrition sync queue operations
    if (sql.includes("SELECT * FROM nutrition_sync_queue WHERE status = 'pending'")) {
      const results: T[] = []
      for (const [, value] of this.syncQueueData) {
        if (value.status === 'pending') {
          results.push(value as T)
        }
      }
      return results
    }
    return []
  }

  async withTransactionAsync<T>(fn: () => Promise<T> | T): Promise<T> {
    return fn()
  }
}

const mockDb = new MockDatabase()

// Clear database before each test
beforeEach(() => {
  mockDb.clear()
})

// Mock expo-sqlite
vi.mock('expo-sqlite', () => ({
  openDatabaseSync: vi.fn(() => mockDb),
}))
