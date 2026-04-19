import { describe, it, expect } from 'vitest'
import type {
  Coach,
  CoachingSession,
  CoachingProgram,
  FormAnalysisFrame,
  CoachRating,
} from '../coaching'

describe('coaching types', () => {
  describe('Coach interface', () => {
    it('should have all required properties', () => {
      const coach: Coach = {
        id: '1',
        name: 'John Trainer',
        specializations: ['strength', 'cardio'],
        certifications: ['NASM', 'ACE'],
        rating: 4.8,
        reviewCount: 42,
        hourlyRate: 75,
        bio: 'Expert trainer',
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

      expect(coach.id).toBe('1')
      expect(coach.name).toBe('John Trainer')
      expect(coach.specializations).toContain('strength')
      expect(coach.rating).toBe(4.8)
      expect(coach.verified).toBe(true)
    })

    it('should allow optional avatar', () => {
      const coach: Coach = {
        id: '1',
        name: 'John Trainer',
        avatar: 'https://example.com/avatar.jpg',
        specializations: ['strength'],
        certifications: [],
        rating: 4.5,
        reviewCount: 10,
        hourlyRate: 60,
        bio: 'Bio',
        availability: [],
        verified: false,
      }

      expect(coach.avatar).toBe('https://example.com/avatar.jpg')
    })
  })

  describe('CoachingSession interface', () => {
    it('should have all required properties', () => {
      const session: CoachingSession = {
        id: 'session-1',
        userId: 'user-1',
        coachId: 'coach-1',
        coach: {
          id: 'coach-1',
          name: 'Coach Name',
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
        agoraChannel: 'coaching-session-session-1',
        agoraUserToken: 'token-user',
        agoraCoachToken: 'token-coach',
        recordingConsent: true,
      }

      expect(session.id).toBe('session-1')
      expect(session.status).toBe('in_progress')
      expect(session.type).toBe('ondemand')
    })

    it('should allow optional fields', () => {
      const session: CoachingSession = {
        id: 'session-1',
        userId: 'user-1',
        coachId: 'coach-1',
        coach: {
          id: 'coach-1',
          name: 'Coach Name',
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
        scheduledAt: '2026-04-20T10:00:00Z',
        startedAt: '2026-04-20T10:00:00Z',
        endedAt: '2026-04-20T11:00:00Z',
        status: 'completed',
        agoraChannel: 'coaching-session-session-1',
        agoraUserToken: 'token-user',
        agoraCoachToken: 'token-coach',
        coachNotes: 'Good form on squats',
        formScores: [{ exercise: 'squats', score: 85 }],
        recordingUrl: 'https://example.com/recording.mp4',
        recordingConsent: true,
        createdAt: '2026-04-20T09:00:00Z',
      }

      expect(session.scheduledAt).toBe('2026-04-20T10:00:00Z')
      expect(session.coachNotes).toBe('Good form on squats')
      expect(session.formScores).toHaveLength(1)
    })
  })

  describe('CoachingProgram interface', () => {
    it('should have all required properties', () => {
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
            formTips: ['Keep chest up', 'Knees over toes'],
            progression: 'Add 5 lbs next week',
          },
        ],
        createdAt: '2026-04-20T11:00:00Z',
      }

      expect(program.id).toBe('program-1')
      expect(program.exercises).toHaveLength(1)
      expect(program.exercises[0].name).toBe('Squats')
      expect(program.exercises[0].sets).toBe(3)
    })

    it('should allow optional nutrition and recovery notes', () => {
      const program: CoachingProgram = {
        id: 'program-1',
        userId: 'user-1',
        coachId: 'coach-1',
        sessionId: 'session-1',
        exercises: [],
        nutritionNotes: 'Increase protein intake',
        recoveryTips: 'Foam roll 2x daily',
        nextSessionRecommendation: 'Tuesday at 10am',
        createdAt: '2026-04-20T11:00:00Z',
      }

      expect(program.nutritionNotes).toBe('Increase protein intake')
      expect(program.recoveryTips).toBe('Foam roll 2x daily')
      expect(program.nextSessionRecommendation).toBe('Tuesday at 10am')
    })
  })

  describe('FormAnalysisFrame interface', () => {
    it('should have all required properties', () => {
      const frame: FormAnalysisFrame = {
        timestamp: 1234,
        pose: [
          { keypoint: 'nose', x: 100, y: 150, confidence: 0.95 },
          { keypoint: 'left_shoulder', x: 90, y: 120, confidence: 0.92 },
        ],
        formScore: 85,
        feedback: ['Good alignment', 'Watch knee position'],
      }

      expect(frame.timestamp).toBe(1234)
      expect(frame.pose).toHaveLength(2)
      expect(frame.formScore).toBe(85)
      expect(frame.feedback).toHaveLength(2)
    })

    it('should allow optional repCount', () => {
      const frame: FormAnalysisFrame = {
        timestamp: 5000,
        pose: [],
        formScore: 90,
        feedback: [],
        repCount: 5,
      }

      expect(frame.repCount).toBe(5)
    })
  })

  describe('CoachRating interface', () => {
    it('should have all required properties', () => {
      const rating: CoachRating = {
        id: 'rating-1',
        userId: 'user-1',
        coachId: 'coach-1',
        rating: 5,
        createdAt: '2026-04-20T12:00:00Z',
      }

      expect(rating.rating).toBe(5)
      expect(rating.userId).toBe('user-1')
      expect(rating.coachId).toBe('coach-1')
    })

    it('should allow optional review and sessionId', () => {
      const rating: CoachRating = {
        id: 'rating-1',
        userId: 'user-1',
        coachId: 'coach-1',
        rating: 4,
        review: 'Great coaching session!',
        sessionId: 'session-1',
        createdAt: '2026-04-20T12:00:00Z',
      }

      expect(rating.review).toBe('Great coaching session!')
      expect(rating.sessionId).toBe('session-1')
    })
  })
})
