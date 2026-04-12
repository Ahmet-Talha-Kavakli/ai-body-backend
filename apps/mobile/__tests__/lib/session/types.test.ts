import {
  FormAnalysisResult,
  SessionRecord,
  AvatarState,
  VoiceCoachConfig,
} from '@/lib/session/types'

describe('Session Types', () => {
  it('FormAnalysisResult should have required fields', () => {
    const result: FormAnalysisResult = {
      exercise: 'squat',
      formScore: 85,
      repNumber: 1,
      timestamp: Date.now(),
      errors: [],
      muscleEngagement: { quadriceps: 0.9 },
      depthAssessment: 'full',
      stabilityScore: 0.85,
      confidence: 0.92,
    }
    expect(result.exercise).toBe('squat')
    expect(result.formScore).toBeGreaterThanOrEqual(0)
    expect(result.formScore).toBeLessThanOrEqual(100)
  })

  it('SessionRecord should track metadata correctly', () => {
    const session: SessionRecord = {
      id: 'session-1',
      userId: 'user-1',
      exercise: 'squat',
      startTime: new Date(),
      endTime: new Date(),
      totalReps: 10,
      avgFormScore: 82,
      frames: [],
      voiceFeedback: [],
      syncStatus: 'pending',
    }
    expect(session.totalReps).toBeGreaterThan(0)
    expect(session.syncStatus).toMatch(/pending|synced|failed/)
  })

  it('AvatarState should handle body composition', () => {
    const avatar: AvatarState = {
      userId: 'user-1',
      gender: 'male',
      startingWeight: 85,
      currentWeight: 83,
      skinTone: 'light',
      lastUpdated: new Date(),
    }
    expect(avatar.currentWeight).toBeLessThanOrEqual(avatar.startingWeight)
  })
})
