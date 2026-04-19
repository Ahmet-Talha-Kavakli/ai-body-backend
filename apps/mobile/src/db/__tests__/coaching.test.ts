import { describe, it, expect, beforeEach } from 'vitest'
import {
  createCoachingTables,
  saveCoach,
  getCoach,
  getAllCoaches,
  createCoachingSession,
  getCoachingSession,
  getUserSessions,
  updateSessionStatus,
  createCoachingProgram,
  getCoachingProgram,
  deleteOldSessions,
} from '../coaching'
import type {
  Coach,
  CoachingSession,
  CoachingProgram,
} from '../../types/coaching'

describe('coaching database', () => {
  beforeEach(async () => {
    await createCoachingTables()
  })

  describe('createCoachingTables', () => {
    it('should create all coaching tables', async () => {
      await expect(createCoachingTables()).resolves.not.toThrow()
    })

    it('should be idempotent', async () => {
      await createCoachingTables()
      await expect(createCoachingTables()).resolves.not.toThrow()
    })
  })

  describe('saveCoach and getCoach', () => {
    it('should save and retrieve a coach', async () => {
      const coach: Coach = {
        id: 'coach-1',
        name: 'John Trainer',
        avatar: 'https://example.com/avatar.jpg',
        specializations: ['strength', 'cardio'],
        certifications: ['NASM', 'ACE'],
        rating: 4.8,
        reviewCount: 42,
        hourlyRate: 75,
        bio: 'Expert strength trainer',
        availability: [
          {
            dayOfWeek: 1,
            startTime: '09:00',
            endTime: '17:00',
            timezone: 'America/New_York',
          },
        ],
        verified: true,
      }

      await saveCoach(coach)
      const retrieved = await getCoach('coach-1')

      expect(retrieved).toBeDefined()
      expect(retrieved?.id).toBe('coach-1')
      expect(retrieved?.name).toBe('John Trainer')
      expect(retrieved?.rating).toBe(4.8)
      expect(retrieved?.specializations).toEqual(['strength', 'cardio'])
    })

    it('should handle coaches without avatar', async () => {
      const coach: Coach = {
        id: 'coach-2',
        name: 'Jane Trainer',
        specializations: ['mobility'],
        certifications: ['Yoga'],
        rating: 4.5,
        reviewCount: 20,
        hourlyRate: 60,
        bio: 'Mobility expert',
        availability: [],
        verified: false,
      }

      await saveCoach(coach)
      const retrieved = await getCoach('coach-2')

      expect(retrieved?.avatar).toBeNull()
    })

    it('should return undefined for non-existent coach', async () => {
      const retrieved = await getCoach('non-existent')
      expect(retrieved).toBeUndefined()
    })

    it('should update existing coach', async () => {
      const coach: Coach = {
        id: 'coach-3',
        name: 'Bob',
        specializations: ['strength'],
        certifications: [],
        rating: 4.0,
        reviewCount: 10,
        hourlyRate: 50,
        bio: 'Bio',
        availability: [],
        verified: false,
      }

      await saveCoach(coach)

      const updated: Coach = {
        ...coach,
        rating: 4.9,
        reviewCount: 50,
      }

      await saveCoach(updated)
      const retrieved = await getCoach('coach-3')

      expect(retrieved?.rating).toBe(4.9)
      expect(retrieved?.reviewCount).toBe(50)
    })
  })

  describe('getAllCoaches', () => {
    it('should retrieve all coaches', async () => {
      const coach1: Coach = {
        id: 'coach-1',
        name: 'Trainer 1',
        specializations: ['strength'],
        certifications: [],
        rating: 4.5,
        reviewCount: 10,
        hourlyRate: 60,
        bio: 'Bio',
        availability: [],
        verified: true,
      }

      const coach2: Coach = {
        id: 'coach-2',
        name: 'Trainer 2',
        specializations: ['cardio'],
        certifications: [],
        rating: 4.8,
        reviewCount: 25,
        hourlyRate: 70,
        bio: 'Bio',
        availability: [],
        verified: true,
      }

      await saveCoach(coach1)
      await saveCoach(coach2)

      const coaches = await getAllCoaches()
      expect(coaches).toHaveLength(2)
      expect(coaches.map((c) => c.id).sort()).toEqual(['coach-1', 'coach-2'])
    })

    it('should return empty array when no coaches', async () => {
      const coaches = await getAllCoaches()
      expect(coaches).toEqual([])
    })
  })

  describe('createCoachingSession and getCoachingSession', () => {
    it('should create and retrieve a coaching session', async () => {
      const coach: Coach = {
        id: 'coach-1',
        name: 'John',
        specializations: ['strength'],
        certifications: [],
        rating: 4.5,
        reviewCount: 10,
        hourlyRate: 60,
        bio: 'Bio',
        availability: [],
        verified: true,
      }

      await saveCoach(coach)

      const session: CoachingSession = {
        id: 'session-1',
        userId: 'user-1',
        coachId: 'coach-1',
        coach,
        type: 'ondemand',
        status: 'in_progress',
        agoraChannel: 'coaching-session-session-1',
        agoraUserToken: 'user-token',
        agoraCoachToken: 'coach-token',
        recordingConsent: true,
      }

      await createCoachingSession(session)
      const retrieved = await getCoachingSession('session-1')

      expect(retrieved).toBeDefined()
      expect(retrieved?.id).toBe('session-1')
      expect(retrieved?.userId).toBe('user-1')
      expect(retrieved?.status).toBe('in_progress')
    })

    it('should return undefined for non-existent session', async () => {
      const retrieved = await getCoachingSession('non-existent')
      expect(retrieved).toBeUndefined()
    })
  })

  describe('getUserSessions', () => {
    it('should retrieve user sessions', async () => {
      const coach: Coach = {
        id: 'coach-1',
        name: 'John',
        specializations: ['strength'],
        certifications: [],
        rating: 4.5,
        reviewCount: 10,
        hourlyRate: 60,
        bio: 'Bio',
        availability: [],
        verified: true,
      }

      await saveCoach(coach)

      const session1: CoachingSession = {
        id: 'session-1',
        userId: 'user-1',
        coachId: 'coach-1',
        coach,
        type: 'ondemand',
        status: 'in_progress',
        agoraChannel: 'coaching-session-1',
        agoraUserToken: 'token-1',
        agoraCoachToken: 'token-2',
        recordingConsent: true,
        createdAt: '2026-04-20T10:00:00Z',
      }

      const session2: CoachingSession = {
        id: 'session-2',
        userId: 'user-1',
        coachId: 'coach-1',
        coach,
        type: 'scheduled',
        status: 'completed',
        agoraChannel: 'coaching-session-2',
        agoraUserToken: 'token-3',
        agoraCoachToken: 'token-4',
        recordingConsent: true,
        createdAt: '2026-04-19T15:00:00Z',
      }

      await createCoachingSession(session1)
      await createCoachingSession(session2)

      const sessions = await getUserSessions('user-1')
      expect(sessions).toHaveLength(2)
      // Sessions are ordered by createdAt DESC (most recent first)
      expect(sessions[0].id).toBe('session-1')
      expect(sessions[1].id).toBe('session-2')
    })
  })

  describe('updateSessionStatus', () => {
    it('should update session status', async () => {
      const coach: Coach = {
        id: 'coach-1',
        name: 'John',
        specializations: ['strength'],
        certifications: [],
        rating: 4.5,
        reviewCount: 10,
        hourlyRate: 60,
        bio: 'Bio',
        availability: [],
        verified: true,
      }

      await saveCoach(coach)

      const session: CoachingSession = {
        id: 'session-1',
        userId: 'user-1',
        coachId: 'coach-1',
        coach,
        type: 'ondemand',
        status: 'pending',
        agoraChannel: 'coaching-session-1',
        agoraUserToken: 'token-1',
        agoraCoachToken: 'token-2',
        recordingConsent: true,
      }

      await createCoachingSession(session)
      await updateSessionStatus('session-1', 'in_progress')

      const updated = await getCoachingSession('session-1')
      expect(updated?.status).toBe('in_progress')
    })
  })

  describe('createCoachingProgram and getCoachingProgram', () => {
    it('should create and retrieve a coaching program', async () => {
      const program: CoachingProgram = {
        id: 'program-1',
        userId: 'user-1',
        coachId: 'coach-1',
        sessionId: 'session-1',
        exercises: [
          {
            name: 'Squats',
            sets: 3,
            reps: 10,
            weight: 185,
            formTips: ['Keep chest up'],
            progression: 'Add 5 lbs',
          },
        ],
        nutritionNotes: 'Increase protein',
        recoveryTips: 'Foam roll daily',
        createdAt: '2026-04-20T11:00:00Z',
      }

      await createCoachingProgram(program)
      const retrieved = await getCoachingProgram('program-1')

      expect(retrieved).toBeDefined()
      expect(retrieved?.id).toBe('program-1')
      expect(retrieved?.exercises).toHaveLength(1)
      expect(retrieved?.exercises[0].name).toBe('Squats')
    })

    it('should return undefined for non-existent program', async () => {
      const retrieved = await getCoachingProgram('non-existent')
      expect(retrieved).toBeUndefined()
    })
  })

  describe('deleteOldSessions', () => {
    it('should delete sessions older than 90 days', async () => {
      const coach: Coach = {
        id: 'coach-1',
        name: 'John',
        specializations: ['strength'],
        certifications: [],
        rating: 4.5,
        reviewCount: 10,
        hourlyRate: 60,
        bio: 'Bio',
        availability: [],
        verified: true,
      }

      await saveCoach(coach)

      // Create old session
      const oldDate = new Date()
      oldDate.setDate(oldDate.getDate() - 91)

      const oldSession: CoachingSession = {
        id: 'old-session',
        userId: 'user-1',
        coachId: 'coach-1',
        coach,
        type: 'ondemand',
        status: 'completed',
        agoraChannel: 'coaching-old',
        agoraUserToken: 'token-1',
        agoraCoachToken: 'token-2',
        recordingConsent: true,
        createdAt: oldDate.toISOString(),
      }

      // Create recent session
      const recentSession: CoachingSession = {
        id: 'recent-session',
        userId: 'user-1',
        coachId: 'coach-1',
        coach,
        type: 'ondemand',
        status: 'completed',
        agoraChannel: 'coaching-recent',
        agoraUserToken: 'token-3',
        agoraCoachToken: 'token-4',
        recordingConsent: true,
        createdAt: new Date().toISOString(),
      }

      await createCoachingSession(oldSession)
      await createCoachingSession(recentSession)

      const deleted = await deleteOldSessions(90)
      expect(deleted).toBeGreaterThan(0)

      const old = await getCoachingSession('old-session')
      const recent = await getCoachingSession('recent-session')

      expect(old).toBeUndefined()
      expect(recent).toBeDefined()
    })
  })
})
