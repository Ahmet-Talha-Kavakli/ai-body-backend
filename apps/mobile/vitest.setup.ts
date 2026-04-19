import { vi, beforeEach } from 'vitest'
import React from 'react'

// Define global __DEV__
global.__DEV__ = true

// Polyfill React for Zustand
if (typeof global.React === 'undefined') {
  global.React = React
}

// Mock react-native first
vi.mock('react-native', () => ({
  View: 'View',
  Text: 'Text',
  TouchableOpacity: 'TouchableOpacity',
  TextInput: 'TextInput',
  StyleSheet: {
    create: (styles: any) => styles,
  },
  Platform: {
    OS: 'ios',
  },
}))

// Mock react-native-svg
vi.mock('react-native-svg', () => ({
  default: 'Svg',
  Svg: 'Svg',
  Circle: 'Circle',
}))

// Mock expo-modules-core
vi.mock('expo-modules-core', () => ({
  EventEmitter: class EventEmitter {
    addListener() {
      return { remove: () => {} }
    }
    removeListener() {}
    emit() {}
  },
  NativeModulesProxy: {},
  Platform: {
    OS: 'ios',
  },
  requireNativeModule: vi.fn(),
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
  private challengesData: Map<string, any> = new Map()
  private challengeProgressData: Map<string, any> = new Map()
  private leaderboardsData: Map<string, any> = new Map()
  private badgesData: Map<string, any> = new Map()
  private userBadgesData: Map<string, any> = new Map()
  // Messaging data
  private messagesData: Map<string, any> = new Map()
  private conversationsData: Map<string, any> = new Map()
  private groupsData: Map<string, any> = new Map()
  private messageSyncQueueData: Map<string, any> = new Map()
  // Coaching data
  private coachesData: Map<string, any> = new Map()
  private coachingSessionsData: Map<string, any> = new Map()
  private coachingProgramsData: Map<string, any> = new Map()
  private coachRatingsData: Map<string, any> = new Map()
  // Nutrition goals
  private nutritionGoalsData: Map<string, any> = new Map()
  // Nutrition meal logs
  private mealLogsData: Map<string, any> = new Map()
  private mealItemsData: Map<string, any> = new Map()

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
    this.challengesData.clear()
    this.challengeProgressData.clear()
    this.leaderboardsData.clear()
    this.badgesData.clear()
    this.userBadgesData.clear()
    this.messagesData.clear()
    this.conversationsData.clear()
    this.groupsData.clear()
    this.messageSyncQueueData.clear()
    this.coachesData.clear()
    this.coachingSessionsData.clear()
    this.coachingProgramsData.clear()
    this.coachRatingsData.clear()
    this.nutritionGoalsData.clear()
    this.mealLogsData.clear()
    this.mealItemsData.clear()
  }

  async execAsync(sql: string): Promise<void> {
    // No-op for schema creation in tests
    return
  }

  async runAsync(sql: string, params?: any[]): Promise<{ changes?: number } | void> {
    // Coach questions operations
    if (sql.includes('INSERT OR REPLACE INTO coach_questions')) {
      const id = params?.[0] || ''
      const userId = params?.[1] || ''
      const question = params?.[2] || ''
      const inputType = params?.[3] || 'text'
      const createdAt = params?.[4] || ''
      const synced = params?.[5] || 0
      this.coachQuestionsData.set(id, { id, userId, question, inputType, createdAt, synced })
      return
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
    // Challenges
    else if (sql.includes('INSERT INTO challenges')) {
      const [id, createdBy, title, description, type, target, duration, startDate, endDate, status, createdAt] = params || []
      this.challengesData.set(id, { id, created_by: createdBy, title, description, type, target, duration, start_date: startDate, end_date: endDate, status, created_at: createdAt })
    }
    // Challenge progress
    else if (sql.includes('INSERT OR REPLACE INTO challenge_progress')) {
      const [id, challengeId, userId, currentValue, completed, completedAt] = params || []
      const key = `${challengeId}:${userId}`
      this.challengeProgressData.set(key, { id, challenge_id: challengeId, user_id: userId, current_value: currentValue, completed, completed_at: completedAt })
    }
    // Delete challenge progress
    else if (sql.includes('DELETE FROM challenge_progress')) {
      this.challengeProgressData.clear()
    }
    // Delete challenges
    else if (sql.includes('DELETE FROM challenges')) {
      this.challengesData.clear()
    }
    // Leaderboards
    else if (sql.includes('INSERT OR REPLACE INTO leaderboard_snapshots')) {
      const [id, type, referenceId, period, entries, lastUpdated] = params || []
      const key = `${type}:${period}:${referenceId || 'null'}`
      this.leaderboardsData.set(key, { id, type, reference_id: referenceId, period, entries, last_updated: lastUpdated })
    }
    // Delete leaderboards
    else if (sql.includes('DELETE FROM leaderboard_snapshots')) {
      this.leaderboardsData.clear()
    }
    // Badges: save badge definitions
    else if (sql.includes('INSERT OR IGNORE INTO badges')) {
      const [id, name, description, icon, category, criteriaType, criteriaTarget, rarity, createdAt] = params || []
      this.badgesData.set(id, { id, name, description, icon, category, criteria_type: criteriaType, criteria_target: criteriaTarget, rarity, created_at: createdAt })
    }
    // User badges: unlock badge
    else if (sql.includes('INSERT OR IGNORE INTO user_badges')) {
      const [id, badgeId, userId, unlockedAt, progress] = params || []
      const key = `${userId}:${badgeId}`
      this.userBadgesData.set(key, { id, badge_id: badgeId, user_id: userId, unlocked_at: unlockedAt, progress })
    }
    // User badges: update progress
    else if (sql.includes('UPDATE user_badges SET progress')) {
      const progress = params?.[0]
      const userId = params?.[1]
      const badgeId = params?.[2]
      const key = `${userId}:${badgeId}`
      const badge = this.userBadgesData.get(key)
      if (badge) {
        badge.progress = progress
      }
    }
    // Delete badges
    else if (sql.includes('DELETE FROM badges')) {
      this.badgesData.clear()
    }
    // Delete user badges
    else if (sql.includes('DELETE FROM user_badges')) {
      this.userBadgesData.clear()
    }
    // Messaging: messages
    else if (sql.includes('INSERT OR REPLACE INTO messages')) {
      const [id, senderId, senderName, senderAvatar, recipientId, groupId, content, createdAt, updatedAt, read, readAt] = params || []
      this.messagesData.set(id, {
        id,
        senderId,
        senderName,
        senderAvatar,
        recipientId,
        groupId,
        content,
        createdAt,
        updatedAt,
        read,
        readAt,
      })
    } else if (sql.includes('UPDATE messages SET read = 1')) {
      const readAt = params?.[0]
      const messageId = params?.[2]
      const msg = this.messagesData.get(messageId)
      if (msg) {
        msg.read = 1
        msg.readAt = readAt
      }
    }
    // Messaging: conversations
    else if (sql.includes('INSERT OR REPLACE INTO conversations')) {
      const [id, userId, participantId, participantName, participantAvatar, groupId, groupName, groupAvatar, lastMessage, lastMessageAt, unreadCount, type] = params || []
      this.conversationsData.set(id, {
        id,
        userId,
        participantId,
        participantName,
        participantAvatar,
        groupId,
        groupName,
        groupAvatar,
        lastMessage,
        lastMessageAt,
        unreadCount,
        type,
      })
    }
    // Messaging: groups
    else if (sql.includes('INSERT OR REPLACE INTO groups')) {
      const [id, name, description, createdById, createdAt, members, avatar] = params || []
      this.groupsData.set(id, {
        id,
        name,
        description,
        createdById,
        createdAt,
        members,
        avatar,
      })
    }
    // Messaging: sync queue
    else if (sql.includes('INSERT OR REPLACE INTO message_sync_queue')) {
      const [id, messageId, status, retryCount, createdAt, scheduledFor, expiresAt] = params || []
      this.messageSyncQueueData.set(id, {
        id,
        messageId,
        status,
        retryCount,
        createdAt,
        scheduledFor,
        expiresAt,
      })
    }
    // Coaching: coaches
    else if (sql.includes('INSERT OR REPLACE INTO coaches')) {
      const [id, name, avatar, bio, verified, specializations, certifications, rating, reviewCount, hourlyRate, availability] = params || []
      this.coachesData.set(id, {
        id,
        name,
        avatar,
        bio,
        verified,
        specializations,
        certifications,
        rating,
        reviewCount,
        hourlyRate,
        availability,
      })
    }
    // Coaching: sessions
    else if (sql.includes('INSERT INTO coaching_sessions')) {
      const [id, userId, coachId, coach, type, scheduledAt, startedAt, endedAt, status, agoraChannel, agoraUserToken, agoraCoachToken, coachNotes, formScores, recordingUrl, recordingConsent, createdAt] = params || []
      this.coachingSessionsData.set(id, {
        id,
        userId,
        coachId,
        coach,
        type,
        scheduledAt,
        startedAt,
        endedAt,
        status,
        agoraChannel,
        agoraUserToken,
        agoraCoachToken,
        coachNotes,
        formScores,
        recordingUrl,
        recordingConsent,
        createdAt,
      })
    } else if (sql.includes('UPDATE coaching_sessions SET status = ?')) {
      const status = params?.[0]
      const sessionId = params?.[1]
      const session = this.coachingSessionsData.get(sessionId)
      if (session) {
        session.status = status
        return { changes: 1 }
      }
      return { changes: 0 }
    } else if (sql.includes('DELETE FROM coaching_sessions')) {
      const cutoff = params?.[0]
      let count = 0
      for (const [key, value] of this.coachingSessionsData) {
        if (value.createdAt < cutoff) {
          this.coachingSessionsData.delete(key)
          count++
        }
      }
      return { changes: count }
    }
    // Coaching: programs
    else if (sql.includes('INSERT INTO coaching_programs')) {
      const [id, userId, coachId, sessionId, exercises, nutritionNotes, recoveryTips, nextSessionRecommendation, createdAt] = params || []
      this.coachingProgramsData.set(id, {
        id,
        userId,
        coachId,
        sessionId,
        exercises,
        nutritionNotes,
        recoveryTips,
        nextSessionRecommendation,
        createdAt,
      })
    }
    // Coaching: ratings
    else if (sql.includes('INSERT INTO coach_ratings')) {
      const [id, userId, coachId, rating, review, sessionId, createdAt] = params || []
      this.coachRatingsData.set(id, {
        id,
        userId,
        coachId,
        rating,
        review,
        sessionId,
        createdAt,
      })
    }
    // Nutrition goals
    else if (sql.includes('INSERT OR REPLACE INTO nutrition_goals')) {
      const [id, userId, dailyCalories, proteinG, carbsG, fatG, fiberG, waterGoalMl, generatedByAi, dietType, createdAt, updatedAt] = params || []
      this.nutritionGoalsData.set(userId, {
        id,
        userId,
        dailyCalories,
        proteinG,
        carbsG,
        fatG,
        fiberG,
        waterGoalMl,
        generatedByAi,
        dietType,
        createdAt,
        updatedAt,
      })
    }
    // Nutrition meal logs
    else if (sql.includes('INSERT OR REPLACE INTO meal_logs')) {
      const [id, userId, mealType, totalCalories, totalProteinG, totalCarbsG, totalFatG, totalFiberG, loggedAt, aiAnalyzed] = params || []
      this.mealLogsData.set(id, {
        id,
        userId,
        mealType,
        totalCalories,
        totalProteinG,
        totalCarbsG,
        totalFatG,
        totalFiberG,
        loggedAt,
        aiAnalyzed,
        photoUrl: null,
        photoPath: null,
        notes: null,
        synced: 0,
        createdAt: new Date().toISOString(),
      })
    }
    // Nutrition meal items
    else if (sql.includes('INSERT INTO meal_items')) {
      const [mealLogId, name, calories, proteinG, carbsG, fatG, fiberG] = params || []
      const id = `${mealLogId}:${Math.random()}`
      this.mealItemsData.set(id, {
        id,
        mealLogId,
        name,
        calories,
        proteinG,
        carbsG,
        fatG,
        fiberG,
      })
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
    // Challenges
    if (sql.includes('FROM challenges') && sql.includes('WHERE id =')) {
      const id = params?.[0]
      const challenge = this.challengesData.get(id)
      return (challenge as T) ?? (undefined as T | undefined)
    }
    // Challenge target lookup
    if (sql.includes('SELECT target FROM challenges')) {
      const id = params?.[0]
      const challenge = this.challengesData.get(id)
      return challenge ? ({ target: challenge.target } as T) : (undefined as T | undefined)
    }
    // Challenge progress
    if (sql.includes('FROM challenge_progress') && sql.includes('WHERE challenge_id') && sql.includes('user_id')) {
      const challengeId = params?.[0]
      const userId = params?.[1]
      const key = `${challengeId}:${userId}`
      const progress = this.challengeProgressData.get(key)
      return (progress as T) ?? (undefined as T | undefined)
    }
    // Leaderboards
    if (sql.includes('FROM leaderboard_snapshots')) {
      const type = params?.[0]
      const period = params?.[1]
      const referenceId = params?.[2]
      const key = `${type}:${period}:${referenceId || 'null'}`
      const leaderboard = this.leaderboardsData.get(key)
      return (leaderboard as T) ?? (undefined as T | undefined)
    }
    // User badges: check if unlocked
    if (sql.includes('SELECT id FROM user_badges WHERE user_id')) {
      const userId = params?.[0]
      const badgeId = params?.[1]
      const key = `${userId}:${badgeId}`
      const badge = this.userBadgesData.get(key)
      return (badge as T) ?? (undefined as T | undefined)
    }
    // Messaging: get group
    if (sql.includes('SELECT * FROM groups WHERE id = ?')) {
      const groupId = params?.[0]
      const group = this.groupsData.get(groupId)
      return (group as T) ?? (undefined as T | undefined)
    }
    // Messaging: get sync queue item
    if (sql.includes('SELECT * FROM message_sync_queue WHERE id = ?')) {
      const itemId = params?.[0]
      const item = this.messageSyncQueueData.get(itemId)
      return (item as T) ?? (undefined as T | undefined)
    }
    // Coaching: get coach
    if (sql.includes('FROM coaches WHERE id =')) {
      const coachId = params?.[0]
      const coach = this.coachesData.get(coachId)
      return (coach as T) ?? (undefined as T | undefined)
    }
    // Coaching: get session
    if (sql.includes('FROM coaching_sessions WHERE id =')) {
      const sessionId = params?.[0]
      const session = this.coachingSessionsData.get(sessionId)
      return (session as T) ?? (undefined as T | undefined)
    }
    // Coaching: get program
    if (sql.includes('FROM coaching_programs WHERE id =')) {
      const programId = params?.[0]
      const program = this.coachingProgramsData.get(programId)
      return (program as T) ?? (undefined as T | undefined)
    }
    // Nutrition goals: get goal by userId
    if (sql.includes('SELECT * FROM nutrition_goals WHERE userId =')) {
      const userId = params?.[0]
      const goal = this.nutritionGoalsData.get(userId)
      return (goal as T) ?? (undefined as T | undefined)
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
    // Challenges
    if (sql.includes('FROM challenges') && sql.includes('WHERE status')) {
      const status = params?.[0]
      const results: T[] = []
      for (const [, value] of this.challengesData) {
        if (value.status === status) {
          results.push(value as T)
        }
      }
      return results
    }
    // Challenge participants
    if (sql.includes('SELECT DISTINCT user_id FROM challenge_progress')) {
      const challengeId = params?.[0]
      const results: T[] = []
      for (const [, value] of this.challengeProgressData) {
        if (value.challenge_id === challengeId) {
          results.push({ user_id: value.user_id } as T)
        }
      }
      return results
    }
    // Badges: get all badges
    if (sql.includes('SELECT id, name, description, icon, category, criteria_type, criteria_target, rarity FROM badges')) {
      const results: T[] = []
      for (const [, value] of this.badgesData) {
        results.push(value as T)
      }
      return results.sort((a: any, b: any) => `${a.category}${a.name}`.localeCompare(`${b.category}${b.name}`))
    }
    // Badges: get badges by category
    if (sql.includes('FROM badges WHERE category')) {
      const category = params?.[0]
      const results: T[] = []
      for (const [, value] of this.badgesData) {
        if (value.category === category) {
          results.push(value as T)
        }
      }
      return results.sort((a: any, b: any) => a.name.localeCompare(b.name))
    }
    // User badges: get user's badges
    if (sql.includes('SELECT badge_id, user_id, unlocked_at, progress FROM user_badges WHERE user_id')) {
      const userId = params?.[0]
      const results: T[] = []
      for (const [, value] of this.userBadgesData) {
        if (value.user_id === userId) {
          results.push(value as T)
        }
      }
      return results.sort((a: any, b: any) => b.unlocked_at.localeCompare(a.unlocked_at))
    }
    // Messaging: get messages for conversation (check most specific pattern first)
    if (sql.includes('FROM messages') && sql.includes('OR') && sql.includes('senderId')) {
      // DM message query: WHERE (senderId = ? AND recipientId = ?) OR (senderId = ? AND recipientId = ?)
      const userId = params?.[0]
      const participantId = params?.[1]
      const results: T[] = []
      for (const [, value] of this.messagesData) {
        if ((value.senderId === userId && value.recipientId === participantId) ||
            (value.senderId === participantId && value.recipientId === userId)) {
          results.push(value as T)
        }
      }
      return results.sort((a: any, b: any) => a.createdAt.localeCompare(b.createdAt))
    }
    if (sql.includes('SELECT * FROM messages WHERE groupId')) {
      // Group message query
      const groupId = params?.[0]
      const results: T[] = []
      for (const [, value] of this.messagesData) {
        if (value.groupId === groupId) {
          results.push(value as T)
        }
      }
      return results.sort((a: any, b: any) => a.createdAt.localeCompare(b.createdAt))
    }
    // Messaging: get conversations for user
    if (sql.includes('SELECT * FROM conversations WHERE userId')) {
      const userId = params?.[0]
      const results: T[] = []
      for (const [, value] of this.conversationsData) {
        if (value.userId === userId) {
          results.push(value as T)
        }
      }
      return results.sort((a: any, b: any) => b.lastMessageAt.localeCompare(a.lastMessageAt))
    }
    // Messaging: get sync queue items by status
    if (sql.includes('SELECT * FROM message_sync_queue WHERE status = ?')) {
      const status = params?.[0]
      const results: T[] = []
      for (const [, value] of this.messageSyncQueueData) {
        if (value.status === status) {
          results.push(value as T)
        }
      }
      return results.sort((a: any, b: any) => a.createdAt.localeCompare(b.createdAt))
    }
    // Coaching: get all coaches
    if (sql.includes('SELECT * FROM coaches')) {
      const results: T[] = []
      for (const [, value] of this.coachesData) {
        results.push(value as T)
      }
      return results.sort((a: any, b: any) => b.rating - a.rating)
    }
    // Coaching: get single session by id
    if (sql.includes('SELECT * FROM coaching_sessions WHERE id =')) {
      const sessionId = params?.[0]
      const session = this.coachingSessionsData.get(sessionId)
      return session ? [session] as T[] : []
    }
    // Coaching: get user sessions
    if (sql.includes('SELECT * FROM coaching_sessions WHERE userId =')) {
      const userId = params?.[0]
      const results: T[] = []
      for (const [, value] of this.coachingSessionsData) {
        if (value.userId === userId) {
          results.push(value as T)
        }
      }
      return results.sort((a: any, b: any) => b.createdAt.localeCompare(a.createdAt))
    }
    // Coaching: get single program by id
    if (sql.includes('SELECT * FROM coaching_programs WHERE id =')) {
      const programId = params?.[0]
      const program = this.coachingProgramsData.get(programId)
      return program ? [program] as T[] : []
    }
    // Coaching: get coach ratings
    if (sql.includes('SELECT * FROM coach_ratings WHERE coachId =')) {
      const coachId = params?.[0]
      const results: T[] = []
      for (const [, value] of this.coachRatingsData) {
        if (value.coachId === coachId) {
          results.push(value as T)
        }
      }
      return results.sort((a: any, b: any) => b.createdAt.localeCompare(a.createdAt))
    }
    // Nutrition: get meal logs for date
    if (sql.includes('SELECT * FROM meal_logs WHERE date(loggedAt) =')) {
      const date = params?.[0]
      const results: T[] = []
      for (const [, value] of this.mealLogsData) {
        // Simple date check: if loggedAt starts with the date
        if (value.loggedAt.startsWith(date)) {
          results.push(value as T)
        }
      }
      return results.sort((a: any, b: any) => b.loggedAt.localeCompare(a.loggedAt))
    }
    // Nutrition: get meal items for meal log
    if (sql.includes('SELECT * FROM meal_items WHERE mealLogId =')) {
      const mealLogId = params?.[0]
      const results: T[] = []
      for (const [, value] of this.mealItemsData) {
        if (value.mealLogId === mealLogId) {
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

// Mock expo-secure-store
vi.mock('expo-secure-store', () => ({
  getItemAsync: vi.fn().mockResolvedValue('mock-token'),
  setItemAsync: vi.fn().mockResolvedValue(undefined),
  deleteItemAsync: vi.fn().mockResolvedValue(undefined),
}))

// Mock pg (PostgreSQL client - not available in React Native)
vi.mock('pg', () => ({
  Client: vi.fn(() => ({
    connect: vi.fn().mockResolvedValue(undefined),
    end: vi.fn().mockResolvedValue(undefined),
    query: vi.fn().mockResolvedValue({ rows: [] }),
  })),
}))
