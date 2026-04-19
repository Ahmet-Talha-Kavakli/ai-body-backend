import { describe, it, expect, beforeEach, vi } from 'vitest'
import * as liveCoachingService from '../liveCoachingService'
import type { Coach, CoachingSession, CoachingProgram } from '../../types/coaching'

// Mock the API client
vi.mock('../apiClient', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
  },
}))

import apiClient from '../apiClient'

describe('liveCoachingService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getCoaches', () => {
    it('should fetch all coaches', async () => {
      const mockCoaches: Coach[] = [
        {
          id: '1',
          name: 'John',
          specializations: ['strength'],
          certifications: ['NASM'],
          rating: 4.5,
          reviewCount: 10,
          hourlyRate: 60,
          bio: 'Bio',
          availability: [],
          verified: true,
        },
      ]

      vi.mocked(apiClient.get).mockResolvedValueOnce(mockCoaches)

      const coaches = await liveCoachingService.getCoaches()

      expect(coaches).toEqual(mockCoaches)
      expect(apiClient.get).toHaveBeenCalledWith('/api/coaching/coaches')
    })

    it('should fetch coaches with specialization filter', async () => {
      const mockCoaches: Coach[] = []

      vi.mocked(apiClient.get).mockResolvedValueOnce(mockCoaches)

      const coaches = await liveCoachingService.getCoaches('strength', 5)

      expect(coaches).toEqual(mockCoaches)
      expect(apiClient.get).toHaveBeenCalledWith('/api/coaching/coaches?specialization=strength&limit=5')
    })
  })

  describe('getCoach', () => {
    it('should fetch a specific coach', async () => {
      const mockCoach: Coach = {
        id: '1',
        name: 'John',
        specializations: ['strength'],
        certifications: ['NASM'],
        rating: 4.5,
        reviewCount: 10,
        hourlyRate: 60,
        bio: 'Bio',
        availability: [],
        verified: true,
      }

      vi.mocked(apiClient.get).mockResolvedValueOnce(mockCoach)

      const coach = await liveCoachingService.getCoach('1')

      expect(coach).toEqual(mockCoach)
      expect(apiClient.get).toHaveBeenCalledWith('/api/coaching/coaches/1')
    })
  })

  describe('searchCoaches', () => {
    it('should search coaches by query', async () => {
      const mockCoaches: Coach[] = []

      vi.mocked(apiClient.get).mockResolvedValueOnce(mockCoaches)

      const coaches = await liveCoachingService.searchCoaches('john')

      expect(coaches).toEqual(mockCoaches)
      expect(apiClient.get).toHaveBeenCalledWith('/api/coaching/coaches/search?q=john')
    })

    it('should encode special characters in search query', async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce([])

      await liveCoachingService.searchCoaches('john doe')

      expect(apiClient.get).toHaveBeenCalledWith('/api/coaching/coaches/search?q=john%20doe')
    })
  })

  describe('createSession', () => {
    it('should create an ondemand session', async () => {
      const mockSession: CoachingSession = {
        id: 'session-1',
        userId: 'user-1',
        coachId: 'coach-1',
        coach: {
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
        },
        type: 'ondemand',
        status: 'pending',
        agoraChannel: 'coaching-session-1',
        agoraUserToken: 'token',
        agoraCoachToken: 'token',
        recordingConsent: false,
      }

      vi.mocked(apiClient.post).mockResolvedValueOnce(mockSession)

      const session = await liveCoachingService.createSession('coach-1', 'ondemand')

      expect(session).toEqual(mockSession)
      expect(apiClient.post).toHaveBeenCalledWith('/api/coaching/sessions', {
        coachId: 'coach-1',
        type: 'ondemand',
        scheduledAt: undefined,
      })
    })

    it('should create a scheduled session', async () => {
      const mockSession: CoachingSession = {
        id: 'session-1',
        userId: 'user-1',
        coachId: 'coach-1',
        coach: {
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
        },
        type: 'scheduled',
        scheduledAt: '2026-04-25T10:00:00Z',
        status: 'pending',
        agoraChannel: 'coaching-session-1',
        agoraUserToken: 'token',
        agoraCoachToken: 'token',
        recordingConsent: false,
      }

      vi.mocked(apiClient.post).mockResolvedValueOnce(mockSession)

      const session = await liveCoachingService.createSession(
        'coach-1',
        'scheduled',
        '2026-04-25T10:00:00Z'
      )

      expect(session).toEqual(mockSession)
      expect(apiClient.post).toHaveBeenCalledWith('/api/coaching/sessions', {
        coachId: 'coach-1',
        type: 'scheduled',
        scheduledAt: '2026-04-25T10:00:00Z',
      })
    })
  })

  describe('getSession', () => {
    it('should fetch a session', async () => {
      const mockSession: CoachingSession = {
        id: 'session-1',
        userId: 'user-1',
        coachId: 'coach-1',
        coach: {
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
        },
        type: 'ondemand',
        status: 'in_progress',
        agoraChannel: 'coaching-session-1',
        agoraUserToken: 'token',
        agoraCoachToken: 'token',
        recordingConsent: false,
      }

      vi.mocked(apiClient.get).mockResolvedValueOnce(mockSession)

      const session = await liveCoachingService.getSession('session-1')

      expect(session).toEqual(mockSession)
      expect(apiClient.get).toHaveBeenCalledWith('/api/coaching/sessions/session-1')
    })
  })

  describe('getActiveSessions', () => {
    it('should fetch active sessions', async () => {
      const mockSessions: CoachingSession[] = []

      vi.mocked(apiClient.get).mockResolvedValueOnce(mockSessions)

      const sessions = await liveCoachingService.getActiveSessions()

      expect(sessions).toEqual(mockSessions)
      expect(apiClient.get).toHaveBeenCalledWith('/api/coaching/sessions/active')
    })
  })

  describe('cancelSession', () => {
    it('should cancel a session', async () => {
      vi.mocked(apiClient.patch).mockResolvedValueOnce({ success: true })

      const result = await liveCoachingService.cancelSession('session-1')

      expect(result).toBe(true)
      expect(apiClient.patch).toHaveBeenCalledWith('/api/coaching/sessions/session-1', {
        status: 'cancelled',
      })
    })
  })

  describe('completeSession', () => {
    it('should complete a session', async () => {
      vi.mocked(apiClient.patch).mockResolvedValueOnce({ success: true })

      const result = await liveCoachingService.completeSession('session-1')

      expect(result).toBe(true)
      expect(apiClient.patch).toHaveBeenCalledWith('/api/coaching/sessions/session-1', {
        status: 'completed',
      })
    })
  })

  describe('getCoachingPrograms', () => {
    it('should fetch coaching programs for user', async () => {
      const mockPrograms: CoachingProgram[] = []

      vi.mocked(apiClient.get).mockResolvedValueOnce(mockPrograms)

      const programs = await liveCoachingService.getCoachingPrograms('user-1')

      expect(programs).toEqual(mockPrograms)
      expect(apiClient.get).toHaveBeenCalledWith('/api/coaching/programs?userId=user-1&limit=undefined')
    })

    it('should fetch coaching programs with limit', async () => {
      const mockPrograms: CoachingProgram[] = []

      vi.mocked(apiClient.get).mockResolvedValueOnce(mockPrograms)

      const programs = await liveCoachingService.getCoachingPrograms('user-1', 10)

      expect(programs).toEqual(mockPrograms)
      expect(apiClient.get).toHaveBeenCalledWith('/api/coaching/programs?userId=user-1&limit=10')
    })
  })

  describe('getCoachingProgram', () => {
    it('should fetch a coaching program', async () => {
      const mockProgram: CoachingProgram = {
        id: 'program-1',
        userId: 'user-1',
        coachId: 'coach-1',
        sessionId: 'session-1',
        exercises: [],
        createdAt: '2026-04-20T11:00:00Z',
      }

      vi.mocked(apiClient.get).mockResolvedValueOnce(mockProgram)

      const program = await liveCoachingService.getCoachingProgram('program-1')

      expect(program).toEqual(mockProgram)
      expect(apiClient.get).toHaveBeenCalledWith('/api/coaching/programs/program-1')
    })
  })

  describe('rateCoach', () => {
    it('should rate a coach', async () => {
      vi.mocked(apiClient.post).mockResolvedValueOnce({ success: true })

      const result = await liveCoachingService.rateCoach('coach-1', 5, 'Great coaching!')

      expect(result).toBe(true)
      expect(apiClient.post).toHaveBeenCalledWith('/api/coaching/coaches/coach-1/rate', {
        rating: 5,
        review: 'Great coaching!',
      })
    })

    it('should rate without review', async () => {
      vi.mocked(apiClient.post).mockResolvedValueOnce({ success: true })

      const result = await liveCoachingService.rateCoach('coach-1', 4)

      expect(result).toBe(true)
      expect(apiClient.post).toHaveBeenCalledWith('/api/coaching/coaches/coach-1/rate', {
        rating: 4,
        review: undefined,
      })
    })
  })
})
