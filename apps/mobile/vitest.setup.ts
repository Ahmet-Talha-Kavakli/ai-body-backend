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

// Mock react-native-community/netinfo
vi.mock('@react-native-community/netinfo', () => ({
  default: {
    addEventListener: vi.fn(() => vi.fn()),
  },
  useNetInfo: vi.fn(() => ({
    isConnected: true,
    isInternetReachable: true,
  })),
}))

// In-memory database for testing
class MockDatabase {
  private waterData: Map<string, { date: string; totalMl: number; goalMl: number }> = new Map()
  private syncQueueData: Map<string, any> = new Map()
  private coachQuestionsData: Map<string, any> = new Map()
  private coachResponsesData: Map<string, any> = new Map()
  private heartRateData: Map<string, any> = new Map()
  private sleepSessionData: Map<string, any> = new Map()
  private stepDataMap: Map<string, any> = new Map()
  private energyData: Map<string, any> = new Map()
  private dailySummaryData: Map<string, any> = new Map()

  clear() {
    this.waterData.clear()
    this.syncQueueData.clear()
    this.coachQuestionsData.clear()
    this.coachResponsesData.clear()
    this.heartRateData.clear()
    this.sleepSessionData.clear()
    this.stepDataMap.clear()
    this.energyData.clear()
    this.dailySummaryData.clear()
  }

  async execAsync(sql: string): Promise<void> {
    // No-op for schema creation in tests
    return
  }

  async runAsync(sql: string, params?: any[]): Promise<void> {
    // Coach questions operations
    if (sql.includes('INSERT OR REPLACE INTO coach_questions')) {
      const id = params?.[0] || ''
      const userId = params?.[1] || ''
      const question = params?.[2] || ''
      const inputType = params?.[3] || 'text'
      const createdAt = params?.[4] || ''
      const synced = params?.[5] || 0
      this.coachQuestionsData.set(id, { id, userId, question, inputType, createdAt, synced })
    }
    // Coach responses operations
    else if (sql.includes('INSERT OR REPLACE INTO coach_responses')) {
      const id = params?.[0] || ''
      const questionId = params?.[1] || ''
      const response = params?.[2] || ''
      const context = params?.[3] || '{}'
      this.coachResponsesData.set(id, { id, questionId, response, context })
    }
    // Water intake operations
    else if (sql.includes('UPDATE water_intake SET totalMl = totalMl + ?')) {
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
    // Health: heart rate
    else if (sql.includes('INSERT OR REPLACE INTO heart_rate_readings')) {
      const [id, userId, bpm, timestamp, sourceDevice, context] = params || []
      this.heartRateData.set(id, { id, userId, bpm, timestamp, sourceDevice, context })
    } else if (sql.includes('DELETE FROM heart_rate_readings')) {
      const userId = params?.[0]
      const cutoff = params?.[1]
      for (const [key, value] of this.heartRateData) {
        if (value.userId === userId && value.timestamp.slice(0, 10) < cutoff) {
          this.heartRateData.delete(key)
        }
      }
    }
    // Health: sleep
    else if (sql.includes('INSERT OR REPLACE INTO sleep_sessions')) {
      const [
        id,
        userId,
        startTime,
        endTime,
        durationMinutes,
        remMinutes,
        deepMinutes,
        lightMinutes,
        awakeMinutes,
      ] = params || []
      this.sleepSessionData.set(id, {
        id,
        userId,
        startTime,
        endTime,
        durationMinutes,
        remMinutes,
        deepMinutes,
        lightMinutes,
        awakeMinutes,
      })
    } else if (sql.includes('DELETE FROM sleep_sessions')) {
      const userId = params?.[0]
      const cutoff = params?.[1]
      for (const [key, value] of this.sleepSessionData) {
        if (value.userId === userId && value.endTime.slice(0, 10) < cutoff) {
          this.sleepSessionData.delete(key)
        }
      }
    }
    // Health: steps
    else if (sql.includes('INSERT OR REPLACE INTO step_data')) {
      const [date, userId, count, goalCount, distance] = params || []
      this.stepDataMap.set(`${userId}:${date}`, { date, userId, count, goalCount, distance })
    } else if (sql.includes('DELETE FROM step_data')) {
      const userId = params?.[0]
      const cutoff = params?.[1]
      for (const [key, value] of this.stepDataMap) {
        if (value.userId === userId && value.date < cutoff) {
          this.stepDataMap.delete(key)
        }
      }
    }
    // Health: energy
    else if (sql.includes('INSERT OR REPLACE INTO energy_burned')) {
      const [date, userId, activeCalories, basalCalories, totalCalories] = params || []
      this.energyData.set(`${userId}:${date}`, {
        date,
        userId,
        activeCalories,
        basalCalories,
        totalCalories,
      })
    } else if (sql.includes('DELETE FROM energy_burned')) {
      const userId = params?.[0]
      const cutoff = params?.[1]
      for (const [key, value] of this.energyData) {
        if (value.userId === userId && value.date < cutoff) {
          this.energyData.delete(key)
        }
      }
    }
    // Health: daily summary
    else if (sql.includes('INSERT OR REPLACE INTO daily_health_summary')) {
      const [
        date,
        userId,
        heartRateAvg,
        heartRateResting,
        sleepDurationMinutes,
        stepCount,
        activeCalories,
      ] = params || []
      this.dailySummaryData.set(`${userId}:${date}`, {
        date,
        userId,
        heartRateAvg,
        heartRateResting,
        sleepDurationMinutes,
        stepCount,
        activeCalories,
      })
    } else if (sql.includes('DELETE FROM daily_health_summary')) {
      const userId = params?.[0]
      const cutoff = params?.[1]
      for (const [key, value] of this.dailySummaryData) {
        if (value.userId === userId && value.date < cutoff) {
          this.dailySummaryData.delete(key)
        }
      }
    }
  }

  async getFirstAsync<T>(sql: string, params?: any[]): Promise<T | undefined> {
    // Coach questions operations
    if (
      sql.includes('SELECT id, userId, question, inputType, createdAt, synced FROM coach_questions')
    ) {
      const id = params?.[0] || ''
      const data = this.coachQuestionsData.get(id)
      return data as T
    }
    // Coach responses operations
    if (sql.includes('SELECT id, questionId, response, context FROM coach_responses')) {
      const questionId = params?.[0] || ''
      for (const [, value] of this.coachResponsesData) {
        if (value.questionId === questionId) {
          return value as T
        }
      }
      return undefined
    }
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
    // Health: steps
    if (sql.includes('FROM step_data')) {
      const userId = params?.[0]
      const date = params?.[1]
      const row = this.stepDataMap.get(`${userId}:${date}`)
      return (row as T) ?? (undefined as T | undefined)
    }
    // Health: energy
    if (sql.includes('FROM energy_burned')) {
      const userId = params?.[0]
      const date = params?.[1]
      const row = this.energyData.get(`${userId}:${date}`)
      return (row as T) ?? (undefined as T | undefined)
    }
    // Health: daily summary
    if (sql.includes('FROM daily_health_summary')) {
      const userId = params?.[0]
      const date = params?.[1]
      const row = this.dailySummaryData.get(`${userId}:${date}`)
      return (row as T) ?? (undefined as T | undefined)
    }
    return undefined
  }

  async getAllAsync<T>(sql: string, params?: any[]): Promise<T[]> {
    // Coach questions operations
    if (
      sql.includes('SELECT id, userId, question, inputType, createdAt, synced FROM coach_questions')
    ) {
      const userId = params?.[0] || ''
      const results: T[] = []
      for (const [, value] of this.coachQuestionsData) {
        if (value.userId === userId) {
          results.push(value as T)
        }
      }
      return results.reverse() // DESC order (most recent first)
    }
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
    // Health: heart rate for date
    if (sql.includes('FROM heart_rate_readings')) {
      const userId = params?.[0]
      const date = params?.[1]
      const results: T[] = []
      for (const [, value] of this.heartRateData) {
        if (value.userId === userId && value.timestamp.slice(0, 10) === date) {
          results.push(value as T)
        }
      }
      return results.sort((a: any, b: any) => a.timestamp.localeCompare(b.timestamp))
    }
    // Health: sleep sessions for date
    if (sql.includes('FROM sleep_sessions')) {
      const userId = params?.[0]
      const date = params?.[1]
      const results: T[] = []
      for (const [, value] of this.sleepSessionData) {
        if (value.userId === userId && value.endTime.slice(0, 10) === date) {
          results.push(value as T)
        }
      }
      return results.sort((a: any, b: any) => a.endTime.localeCompare(b.endTime))
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
