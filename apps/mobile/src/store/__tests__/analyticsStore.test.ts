import { describe, it, expect, beforeEach } from 'vitest'
import { useAnalyticsStore } from '../analyticsStore'
import { SessionMetrics, ExerciseMetrics, DailyStats } from '../analyticsStore'

describe('analyticsStore', () => {
  beforeEach(() => {
    useAnalyticsStore.getState().clear()
  })

  describe('recordSession', () => {
    it('should record session metrics', () => {
      const metrics: SessionMetrics = {
        sessionId: 'session-1',
        totalDuration: 3600000, // 1 hour
        exercisesCompleted: 5,
        setsCompleted: 15,
        totalReps: 120,
        totalVolume: 5000,
        averageFormScore: 85,
        timestamp: Date.now(),
      }

      useAnalyticsStore.getState().recordSession(metrics)
      const retrieved = useAnalyticsStore.getState().getSessionMetrics('session-1')

      expect(retrieved).toEqual(metrics)
    })
  })

  describe('getTotalSessionCount', () => {
    it('should count all sessions', () => {
      const metrics1: SessionMetrics = {
        sessionId: 'session-1',
        totalDuration: 3600000,
        exercisesCompleted: 5,
        setsCompleted: 15,
        totalReps: 120,
        totalVolume: 5000,
        averageFormScore: 85,
        timestamp: Date.now(),
      }

      const metrics2: SessionMetrics = {
        sessionId: 'session-2',
        totalDuration: 2400000,
        exercisesCompleted: 4,
        setsCompleted: 12,
        totalReps: 96,
        totalVolume: 4000,
        averageFormScore: 88,
        timestamp: Date.now(),
      }

      useAnalyticsStore.getState().recordSession(metrics1)
      useAnalyticsStore.getState().recordSession(metrics2)

      expect(useAnalyticsStore.getState().getTotalSessionCount()).toBe(2)
    })
  })

  describe('getTotalDuration', () => {
    it('should sum all session durations', () => {
      const metrics1: SessionMetrics = {
        sessionId: 'session-1',
        totalDuration: 3600000,
        exercisesCompleted: 5,
        setsCompleted: 15,
        totalReps: 120,
        totalVolume: 5000,
        averageFormScore: 85,
        timestamp: Date.now(),
      }

      const metrics2: SessionMetrics = {
        sessionId: 'session-2',
        totalDuration: 2400000,
        exercisesCompleted: 4,
        setsCompleted: 12,
        totalReps: 96,
        totalVolume: 4000,
        averageFormScore: 88,
        timestamp: Date.now(),
      }

      useAnalyticsStore.getState().recordSession(metrics1)
      useAnalyticsStore.getState().recordSession(metrics2)

      expect(useAnalyticsStore.getState().getTotalDuration()).toBe(6000000)
    })
  })

  describe('getRecentSessions', () => {
    it('should return sessions from last N days', () => {
      const now = Date.now()

      const oldMetrics: SessionMetrics = {
        sessionId: 'session-old',
        totalDuration: 3600000,
        exercisesCompleted: 5,
        setsCompleted: 15,
        totalReps: 120,
        totalVolume: 5000,
        averageFormScore: 85,
        timestamp: now - 31 * 24 * 60 * 60 * 1000, // 31 days ago
      }

      const recentMetrics: SessionMetrics = {
        sessionId: 'session-recent',
        totalDuration: 2400000,
        exercisesCompleted: 4,
        setsCompleted: 12,
        totalReps: 96,
        totalVolume: 4000,
        averageFormScore: 88,
        timestamp: now - 1 * 24 * 60 * 60 * 1000, // 1 day ago
      }

      useAnalyticsStore.getState().recordSession(oldMetrics)
      useAnalyticsStore.getState().recordSession(recentMetrics)

      const recent = useAnalyticsStore.getState().getRecentSessions(7)

      expect(recent).toHaveLength(1)
      expect(recent[0].sessionId).toBe('session-recent')
    })
  })

  describe('recordExerciseMetrics', () => {
    it('should record exercise metrics', () => {
      const metrics: ExerciseMetrics = {
        exerciseId: 'ex-1',
        totalSessions: 10,
        totalSets: 30,
        totalReps: 240,
        averageFormScore: 87,
        progressTrend: 5.2,
      }

      useAnalyticsStore.getState().recordExerciseMetrics(metrics)
      const retrieved = useAnalyticsStore.getState().getExerciseMetrics('ex-1')

      expect(retrieved).toEqual(metrics)
    })
  })

  describe('getPersonalRecords', () => {
    it('should return personal records', () => {
      const metrics: ExerciseMetrics = {
        exerciseId: 'ex-1',
        totalSessions: 10,
        totalSets: 30,
        totalReps: 240,
        averageFormScore: 87,
        progressTrend: 5.2,
        personalRecord: {
          weight: 225,
          reps: 5,
          date: Date.now(),
        },
      }

      useAnalyticsStore.getState().recordExerciseMetrics(metrics)
      const prs = useAnalyticsStore.getState().getPersonalRecords()

      expect(prs.size).toBe(1)
      expect(prs.get('ex-1')).toEqual(metrics.personalRecord)
    })
  })

  describe('recordDailyStats', () => {
    it('should record daily statistics', () => {
      const today = new Date().toISOString().split('T')[0]
      const stats: DailyStats = {
        date: today,
        totalDuration: 3600000,
        exercisesCompleted: 5,
        sessionsCompleted: 1,
        totalVolume: 5000,
        averageFormScore: 85,
      }

      useAnalyticsStore.getState().recordDailyStats(stats)
      const retrieved = useAnalyticsStore.getState().getDailyStats(today)

      expect(retrieved).toEqual(stats)
    })
  })

  describe('getAverageFormScore', () => {
    it('should calculate average form score across sessions', () => {
      const metrics1: SessionMetrics = {
        sessionId: 'session-1',
        totalDuration: 3600000,
        exercisesCompleted: 5,
        setsCompleted: 15,
        totalReps: 120,
        totalVolume: 5000,
        averageFormScore: 80,
        timestamp: Date.now(),
      }

      const metrics2: SessionMetrics = {
        sessionId: 'session-2',
        totalDuration: 2400000,
        exercisesCompleted: 4,
        setsCompleted: 12,
        totalReps: 96,
        totalVolume: 4000,
        averageFormScore: 90,
        timestamp: Date.now(),
      }

      useAnalyticsStore.getState().recordSession(metrics1)
      useAnalyticsStore.getState().recordSession(metrics2)

      const avg = useAnalyticsStore.getState().getAverageFormScore()
      expect(avg).toBe(85)
    })
  })

  describe('updateExerciseMetrics', () => {
    it('should update exercise metrics', () => {
      const initial: ExerciseMetrics = {
        exerciseId: 'ex-1',
        totalSessions: 10,
        totalSets: 30,
        totalReps: 240,
        averageFormScore: 87,
        progressTrend: 5.2,
      }

      useAnalyticsStore.getState().recordExerciseMetrics(initial)
      useAnalyticsStore.getState().updateExerciseMetrics('ex-1', {
        progressTrend: 7.5,
        averageFormScore: 90,
      })

      const updated = useAnalyticsStore.getState().getExerciseMetrics('ex-1')
      expect(updated?.progressTrend).toBe(7.5)
      expect(updated?.averageFormScore).toBe(90)
      expect(updated?.totalSessions).toBe(10) // Unchanged
    })
  })

  describe('getTopExercises', () => {
    it('should return top exercises by session count', () => {
      const ex1: ExerciseMetrics = {
        exerciseId: 'ex-1',
        totalSessions: 20,
        totalSets: 60,
        totalReps: 480,
        averageFormScore: 87,
        progressTrend: 5.2,
      }

      const ex2: ExerciseMetrics = {
        exerciseId: 'ex-2',
        totalSessions: 15,
        totalSets: 45,
        totalReps: 360,
        averageFormScore: 85,
        progressTrend: 3.1,
      }

      const ex3: ExerciseMetrics = {
        exerciseId: 'ex-3',
        totalSessions: 10,
        totalSets: 30,
        totalReps: 240,
        averageFormScore: 82,
        progressTrend: 1.5,
      }

      useAnalyticsStore.getState().recordExerciseMetrics(ex1)
      useAnalyticsStore.getState().recordExerciseMetrics(ex2)
      useAnalyticsStore.getState().recordExerciseMetrics(ex3)

      const top = useAnalyticsStore.getState().getTopExercises(2)

      expect(top).toHaveLength(2)
      expect(top[0].totalSessions).toBe(20)
      expect(top[1].totalSessions).toBe(15)
    })
  })
})
