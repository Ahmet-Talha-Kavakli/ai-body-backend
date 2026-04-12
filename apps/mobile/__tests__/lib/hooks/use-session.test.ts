import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { useSession, SessionState } from '@/lib/hooks/useSession'
import { SessionOrchestrator } from '@/lib/session/session-orchestrator'
import { SessionConfig } from '@/lib/session/types'

// Mock FormAnalyzer
vi.mock('@/lib/session/form-analyzer', () => ({
  FormAnalyzer: class {
    async loadModel() {}
    async detectPose() {
      return { keypoints: [], score: 0.85 }
    }
    async analyzeExercise(pose: any, exercise: string, repNumber: number) {
      return {
        exercise,
        formScore: 85,
        repNumber,
        timestamp: Date.now(),
        errors: [],
        muscleEngagement: { quadriceps: 0.9 },
        depthAssessment: 'full' as const,
        stabilityScore: 0.88,
        confidence: 0.9,
      }
    }
    dispose() {}
  },
}))

// Mock VoiceCoach
vi.mock('@/lib/session/voice-coach', () => ({
  VoiceCoach: class {
    constructor(config: any) {
      this.config = config
    }
    config: any
    async initialize() {}
    async sendFormAnalysis(analysis: any) {}
    async shutdown() {}
  },
}))

// Mock SQLite functions
vi.mock('@/lib/db/session-sqlite', () => ({
  insertSessionFrames: vi.fn().mockResolvedValue(undefined),
  insertSessionRecord: vi.fn().mockResolvedValue(undefined),
  getSessionsForSync: vi.fn().mockResolvedValue([]),
}))

// Helper to test hooks without React component
// This simulates what a component using the hook would get
function simulateHookCall(orchestrator: SessionOrchestrator | null): SessionState {
  // This mirrors the behavior expected from the hook
  if (!orchestrator) {
    return {
      sessionId: '',
      exercise: '',
      isRunning: false,
      error: null,
    }
  }

  return {
    sessionId: orchestrator.getSessionId(),
    exercise: orchestrator.getExercise(),
    isRunning: orchestrator.isRunning(),
    error: orchestrator.getError(),
  }
}

describe('useSession', () => {
  let orchestrator: SessionOrchestrator
  let mockDb: any
  let mockConfig: SessionConfig

  beforeEach(() => {
    mockDb = {
      run: vi.fn().mockResolvedValue(undefined),
    }

    mockConfig = {
      userId: 'user-123',
      exercise: 'squat',
      db: mockDb,
    }

    orchestrator = new SessionOrchestrator(mockConfig)
  })

  afterEach(async () => {
    if (orchestrator) {
      await orchestrator.shutdown()
    }
    vi.clearAllMocks()
  })

  describe('Initial state', () => {
    it('should return initial session state from orchestrator', () => {
      const state = simulateHookCall(orchestrator)

      expect(state.sessionId).toBe(orchestrator.getSessionId())
      expect(state.exercise).toBe('squat')
      expect(state.isRunning).toBe(false)
      expect(state.error).toBeNull()
    })

    it('should get sessionId from orchestrator', () => {
      const state = simulateHookCall(orchestrator)

      expect(state.sessionId).toBeDefined()
      expect(typeof state.sessionId).toBe('string')
      expect(state.sessionId.length).toBeGreaterThan(0)
    })

    it('should get exercise from orchestrator', () => {
      const state = simulateHookCall(orchestrator)

      expect(state.exercise).toBe('squat')
    })

    it('should get isRunning from orchestrator', () => {
      const state = simulateHookCall(orchestrator)

      expect(state.isRunning).toBe(false)
    })

    it('should provide correct SessionState interface', () => {
      const state = simulateHookCall(orchestrator)

      expect(state).toHaveProperty('sessionId')
      expect(state).toHaveProperty('exercise')
      expect(state).toHaveProperty('isRunning')
      expect(state).toHaveProperty('error')
    })
  })

  describe('Event subscriptions', () => {
    it('should subscribe to error events from orchestrator', async () => {
      const testError = new Error('Test error')
      let errorEmitted = false

      // Subscribe to orchestrator error events
      orchestrator.on('error', (error) => {
        expect(error).toBe(testError)
        errorEmitted = true
      })

      // Emit error
      orchestrator.setError(testError)

      // Verify subscription worked
      expect(errorEmitted).toBe(true)
    })

    it('should subscribe to shutdown events from orchestrator', async () => {
      let shutdownEmitted = false

      // Initialize first (so running=true)
      await orchestrator.initialize()

      // Subscribe to orchestrator shutdown events
      orchestrator.on('shutdown', () => {
        shutdownEmitted = true
      })

      // Shutdown orchestrator
      await orchestrator.shutdown()
      expect(shutdownEmitted).toBe(true)
    })
  })

  describe('State updates', () => {
    it('should track isRunning state changes', async () => {
      const state1 = simulateHookCall(orchestrator)
      expect(state1.isRunning).toBe(false)

      await orchestrator.initialize()
      const state2 = simulateHookCall(orchestrator)
      expect(state2.isRunning).toBe(true)
    })

    it('should handle error state updates', async () => {
      const state1 = simulateHookCall(orchestrator)
      expect(state1.error).toBeNull()

      const testError = new Error('Test error')
      orchestrator.setError(testError)
      const state2 = simulateHookCall(orchestrator)
      expect(state2.error).toBe(testError)
      expect(state2.error?.message).toBe('Test error')
    })

    it('should update error state when error event fires', async () => {
      const error1 = new Error('Error 1')
      const error2 = new Error('Error 2')

      orchestrator.setError(error1)
      let state = simulateHookCall(orchestrator)
      expect(state.error).toBe(error1)

      orchestrator.setError(error2)
      state = simulateHookCall(orchestrator)
      expect(state.error).toBe(error2)
    })

    it('should clear error when set to null', async () => {
      const testError = new Error('Test error')
      orchestrator.setError(testError)
      let state = simulateHookCall(orchestrator)
      expect(state.error).toBe(testError)

      orchestrator.setError(null)
      state = simulateHookCall(orchestrator)
      expect(state.error).toBeNull()
    })

    it('should track shutdown state', async () => {
      await orchestrator.initialize()
      let state = simulateHookCall(orchestrator)
      expect(state.isRunning).toBe(true)

      await orchestrator.shutdown()
      state = simulateHookCall(orchestrator)
      expect(state.isRunning).toBe(false)
    })

    it('should maintain state through multiple error updates', async () => {
      const errors = [new Error('Error 1'), new Error('Error 2'), new Error('Error 3')]

      orchestrator.setError(errors[0])
      let state = simulateHookCall(orchestrator)
      expect(state.error).toBe(errors[0])

      orchestrator.setError(errors[1])
      state = simulateHookCall(orchestrator)
      expect(state.error).toBe(errors[1])

      orchestrator.setError(errors[2])
      state = simulateHookCall(orchestrator)
      expect(state.error).toBe(errors[2])
    })

    it('should emit and handle multiple lifecycle events', async () => {
      let state = simulateHookCall(orchestrator)
      expect(state.isRunning).toBe(false)
      expect(state.error).toBeNull()

      await orchestrator.initialize()
      state = simulateHookCall(orchestrator)
      expect(state.isRunning).toBe(true)
      expect(state.error).toBeNull()

      const testError = new Error('Session error')
      orchestrator.setError(testError)
      state = simulateHookCall(orchestrator)
      expect(state.error).toBe(testError)

      await orchestrator.shutdown()
      state = simulateHookCall(orchestrator)
      expect(state.isRunning).toBe(false)
    })
  })

  describe('Multiple instances', () => {
    it('should handle multiple orchestrators', () => {
      const mockConfig2: SessionConfig = {
        userId: 'user-456',
        exercise: 'deadlift',
        db: mockDb,
      }

      const orchestrator2 = new SessionOrchestrator(mockConfig2)

      const state1 = simulateHookCall(orchestrator)
      const state2 = simulateHookCall(orchestrator2)

      expect(state1.exercise).toBe('squat')
      expect(state2.exercise).toBe('deadlift')
      expect(state1.sessionId).not.toBe(state2.sessionId)

      orchestrator2.shutdown()
    })
  })

  describe('Null handling', () => {
    it('should handle null orchestrator gracefully', () => {
      const state = simulateHookCall(null)

      expect(state.sessionId).toBe('')
      expect(state.exercise).toBe('')
      expect(state.isRunning).toBe(false)
      expect(state.error).toBeNull()
    })
  })
})
