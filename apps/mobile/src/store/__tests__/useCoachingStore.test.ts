import { describe, it, expect, beforeEach } from 'vitest'
import { useCoachingStore } from '../useCoachingStore'
import type { CoachingSession, FormAnalysisFrame, CoachingProgram } from '../../types/coaching'

describe('useCoachingStore', () => {
  beforeEach(() => {
    useCoachingStore.setState({
      sessions: [],
      activeSessions: [],
      currentSession: null,
      formScores: [],
      programs: [],
    })
  })

  describe('initial state', () => {
    it('should initialize with empty sessions', () => {
      const { sessions } = useCoachingStore.getState()
      expect(sessions).toEqual([])
    })

    it('should initialize with empty active sessions', () => {
      const { activeSessions } = useCoachingStore.getState()
      expect(activeSessions).toEqual([])
    })

    it('should initialize with no current session', () => {
      const { currentSession } = useCoachingStore.getState()
      expect(currentSession).toBeNull()
    })

    it('should initialize with empty form scores', () => {
      const { formScores } = useCoachingStore.getState()
      expect(formScores).toEqual([])
    })

    it('should initialize with empty programs', () => {
      const { programs } = useCoachingStore.getState()
      expect(programs).toEqual([])
    })
  })

  describe('setSessions', () => {
    it('should set sessions list', () => {
      const mockSession: CoachingSession = {
        id: 'session1',
        userId: 'user1',
        coachId: 'coach1',
        coach: {
          id: 'coach1',
          name: 'John Coach',
          specializations: ['strength'],
          certifications: ['NASM'],
          rating: 4.8,
          reviewCount: 25,
          hourlyRate: 50,
          bio: 'Expert trainer',
          availability: [],
          verified: true,
        },
        type: 'scheduled',
        status: 'confirmed',
        agoraChannel: 'coaching-session-1',
        agoraUserToken: 'token1',
        agoraCoachToken: 'token2',
        recordingConsent: true,
      }
      useCoachingStore.getState().setSessions([mockSession])
      expect(useCoachingStore.getState().sessions).toEqual([mockSession])
    })
  })

  describe('addSession', () => {
    it('should add a session to the list', () => {
      const mockSession: CoachingSession = {
        id: 'session1',
        userId: 'user1',
        coachId: 'coach1',
        coach: {
          id: 'coach1',
          name: 'John Coach',
          specializations: ['strength'],
          certifications: ['NASM'],
          rating: 4.8,
          reviewCount: 25,
          hourlyRate: 50,
          bio: 'Expert trainer',
          availability: [],
          verified: true,
        },
        type: 'scheduled',
        status: 'confirmed',
        agoraChannel: 'coaching-session-1',
        agoraUserToken: 'token1',
        agoraCoachToken: 'token2',
        recordingConsent: true,
      }
      useCoachingStore.getState().addSession(mockSession)
      expect(useCoachingStore.getState().sessions).toHaveLength(1)
      expect(useCoachingStore.getState().sessions[0]).toEqual(mockSession)
    })

    it('should add multiple sessions without duplicating', () => {
      const session1: CoachingSession = {
        id: 'session1',
        userId: 'user1',
        coachId: 'coach1',
        coach: {
          id: 'coach1',
          name: 'John Coach',
          specializations: ['strength'],
          certifications: [],
          rating: 4.5,
          reviewCount: 10,
          hourlyRate: 50,
          bio: 'Trainer',
          availability: [],
          verified: true,
        },
        type: 'scheduled',
        status: 'confirmed',
        agoraChannel: 'coaching-session-1',
        agoraUserToken: 'token1',
        agoraCoachToken: 'token2',
        recordingConsent: true,
      }
      const session2: CoachingSession = {
        id: 'session2',
        userId: 'user1',
        coachId: 'coach1',
        coach: session1.coach,
        type: 'scheduled',
        status: 'confirmed',
        agoraChannel: 'coaching-session-2',
        agoraUserToken: 'token3',
        agoraCoachToken: 'token4',
        recordingConsent: true,
      }
      useCoachingStore.getState().addSession(session1)
      useCoachingStore.getState().addSession(session2)
      expect(useCoachingStore.getState().sessions).toHaveLength(2)
    })
  })

  describe('updateSession', () => {
    it('should update session status', () => {
      const mockSession: CoachingSession = {
        id: 'session1',
        userId: 'user1',
        coachId: 'coach1',
        coach: {
          id: 'coach1',
          name: 'John Coach',
          specializations: ['strength'],
          certifications: [],
          rating: 4.5,
          reviewCount: 10,
          hourlyRate: 50,
          bio: 'Trainer',
          availability: [],
          verified: true,
        },
        type: 'scheduled',
        status: 'confirmed',
        agoraChannel: 'coaching-session-1',
        agoraUserToken: 'token1',
        agoraCoachToken: 'token2',
        recordingConsent: true,
      }
      useCoachingStore.getState().setSessions([mockSession])
      useCoachingStore.getState().updateSession('session1', { status: 'in_progress' })
      const updated = useCoachingStore.getState().sessions[0]
      expect(updated.status).toBe('in_progress')
    })

    it('should update session with multiple fields', () => {
      const mockSession: CoachingSession = {
        id: 'session1',
        userId: 'user1',
        coachId: 'coach1',
        coach: {
          id: 'coach1',
          name: 'John Coach',
          specializations: ['strength'],
          certifications: [],
          rating: 4.5,
          reviewCount: 10,
          hourlyRate: 50,
          bio: 'Trainer',
          availability: [],
          verified: true,
        },
        type: 'scheduled',
        status: 'confirmed',
        agoraChannel: 'coaching-session-1',
        agoraUserToken: 'token1',
        agoraCoachToken: 'token2',
        recordingConsent: true,
      }
      useCoachingStore.getState().setSessions([mockSession])
      useCoachingStore.getState().updateSession('session1', {
        status: 'completed',
        coachNotes: 'Great form on squats',
      })
      const updated = useCoachingStore.getState().sessions[0]
      expect(updated.status).toBe('completed')
      expect(updated.coachNotes).toBe('Great form on squats')
    })
  })

  describe('setCurrentSession', () => {
    it('should set current session', () => {
      const mockSession: CoachingSession = {
        id: 'session1',
        userId: 'user1',
        coachId: 'coach1',
        coach: {
          id: 'coach1',
          name: 'John Coach',
          specializations: ['strength'],
          certifications: [],
          rating: 4.5,
          reviewCount: 10,
          hourlyRate: 50,
          bio: 'Trainer',
          availability: [],
          verified: true,
        },
        type: 'scheduled',
        status: 'in_progress',
        agoraChannel: 'coaching-session-1',
        agoraUserToken: 'token1',
        agoraCoachToken: 'token2',
        recordingConsent: true,
      }
      useCoachingStore.getState().setCurrentSession(mockSession)
      expect(useCoachingStore.getState().currentSession).toEqual(mockSession)
    })

    it('should clear current session with null', () => {
      const mockSession: CoachingSession = {
        id: 'session1',
        userId: 'user1',
        coachId: 'coach1',
        coach: {
          id: 'coach1',
          name: 'John Coach',
          specializations: ['strength'],
          certifications: [],
          rating: 4.5,
          reviewCount: 10,
          hourlyRate: 50,
          bio: 'Trainer',
          availability: [],
          verified: true,
        },
        type: 'scheduled',
        status: 'completed',
        agoraChannel: 'coaching-session-1',
        agoraUserToken: 'token1',
        agoraCoachToken: 'token2',
        recordingConsent: true,
      }
      useCoachingStore.getState().setCurrentSession(mockSession)
      useCoachingStore.getState().setCurrentSession(null)
      expect(useCoachingStore.getState().currentSession).toBeNull()
    })
  })

  describe('addFormScore', () => {
    it('should add form score frame', () => {
      const frame: FormAnalysisFrame = {
        timestamp: 1000,
        pose: [
          {
            keypoint: 'knee',
            x: 100,
            y: 200,
            confidence: 0.95,
          },
        ],
        formScore: 85,
        feedback: ['Knee bent properly', 'Back straight'],
      }
      useCoachingStore.getState().addFormScore(frame)
      expect(useCoachingStore.getState().formScores).toHaveLength(1)
      expect(useCoachingStore.getState().formScores[0]).toEqual(frame)
    })

    it('should add multiple form scores in order', () => {
      const frame1: FormAnalysisFrame = {
        timestamp: 1000,
        pose: [],
        formScore: 85,
        feedback: [],
      }
      const frame2: FormAnalysisFrame = {
        timestamp: 2000,
        pose: [],
        formScore: 88,
        feedback: [],
      }
      useCoachingStore.getState().addFormScore(frame1)
      useCoachingStore.getState().addFormScore(frame2)
      expect(useCoachingStore.getState().formScores).toHaveLength(2)
      expect(useCoachingStore.getState().formScores[1].timestamp).toBe(2000)
    })
  })

  describe('setPrograms', () => {
    it('should set coaching programs', () => {
      const mockProgram: CoachingProgram = {
        id: 'program1',
        userId: 'user1',
        coachId: 'coach1',
        sessionId: 'session1',
        exercises: [
          {
            name: 'Squat',
            sets: 3,
            reps: 10,
            weight: 185,
            formTips: ['Knees over toes', 'Back straight'],
            progression: 'Add 10 lbs next session',
          },
        ],
        nutritionNotes: 'Increase protein intake',
        recoveryTips: 'Sleep 8 hours',
        createdAt: '2024-04-19T00:00:00Z',
      }
      useCoachingStore.getState().setPrograms([mockProgram])
      expect(useCoachingStore.getState().programs).toHaveLength(1)
      expect(useCoachingStore.getState().programs[0]).toEqual(mockProgram)
    })
  })
})
