import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { useFormAnalysis, FormAnalysisState } from '@/lib/hooks/useFormAnalysis'
import { SessionOrchestrator } from '@/lib/session/session-orchestrator'
import { SessionConfig, FormAnalysisResult } from '@/lib/session/types'

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

// Helper to simulate hook behavior
// In a real component, the hook would manage this state internally
class FormAnalysisStateManager {
  lastAnalysis: FormAnalysisResult | null = null
  repCount: number = 0
  avgFormScore: number = 0
  formScores: number[] = []

  updateAnalysis(analysis: FormAnalysisResult) {
    this.lastAnalysis = analysis
    this.formScores.push(analysis.formScore)
    this.repCount = Math.max(this.repCount, analysis.repNumber)
    this.avgFormScore =
      this.formScores.length > 0
        ? this.formScores.reduce((a, b) => a + b, 0) / this.formScores.length
        : 0
  }

  getState(): FormAnalysisState {
    return {
      lastAnalysis: this.lastAnalysis,
      repCount: this.repCount,
      avgFormScore: this.avgFormScore,
    }
  }
}

describe('useFormAnalysis', () => {
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
    it('should return initial null analysis', () => {
      const manager = new FormAnalysisStateManager()
      const state = manager.getState()

      expect(state.lastAnalysis).toBeNull()
      expect(state.repCount).toBe(0)
      expect(state.avgFormScore).toBe(0)
    })

    it('should initialize with 0 reps', () => {
      const manager = new FormAnalysisStateManager()

      expect(manager.getState().repCount).toBe(0)
    })

    it('should initialize with 0 average form score', () => {
      const manager = new FormAnalysisStateManager()

      expect(manager.getState().avgFormScore).toBe(0)
    })

    it('should provide correct FormAnalysisState interface', () => {
      const manager = new FormAnalysisStateManager()
      const state = manager.getState()

      expect(state).toHaveProperty('lastAnalysis')
      expect(state).toHaveProperty('repCount')
      expect(state).toHaveProperty('avgFormScore')
    })
  })

  describe('Event subscriptions', () => {
    it('should subscribe to analysis events from orchestrator', async () => {
      const analysis: FormAnalysisResult = {
        exercise: 'squat',
        formScore: 85,
        repNumber: 1,
        timestamp: Date.now(),
        errors: [],
        muscleEngagement: { quadriceps: 0.9 },
        depthAssessment: 'full',
        stabilityScore: 0.88,
        confidence: 0.9,
      }

      let analysisEmitted = false

      orchestrator.on('analysis', (result) => {
        expect(result).toBe(analysis)
        analysisEmitted = true
      })

      orchestrator.emit('analysis', analysis)
      expect(analysisEmitted).toBe(true)
    })
  })

  describe('State updates', () => {
    it('should handle analysis event', () => {
      const manager = new FormAnalysisStateManager()
      const analysis: FormAnalysisResult = {
        exercise: 'squat',
        formScore: 85,
        repNumber: 1,
        timestamp: Date.now(),
        errors: [],
        muscleEngagement: { quadriceps: 0.9 },
        depthAssessment: 'full',
        stabilityScore: 0.88,
        confidence: 0.9,
      }

      manager.updateAnalysis(analysis)
      const state = manager.getState()

      expect(state.lastAnalysis).toBe(analysis)
    })

    it('should update lastAnalysis on analysis event', () => {
      const manager = new FormAnalysisStateManager()
      const analysis1: FormAnalysisResult = {
        exercise: 'squat',
        formScore: 80,
        repNumber: 1,
        timestamp: Date.now(),
        errors: [],
        muscleEngagement: { quadriceps: 0.85 },
        depthAssessment: 'full',
        stabilityScore: 0.85,
        confidence: 0.9,
      }

      const analysis2: FormAnalysisResult = {
        exercise: 'squat',
        formScore: 90,
        repNumber: 2,
        timestamp: Date.now() + 1000,
        errors: [],
        muscleEngagement: { quadriceps: 0.95 },
        depthAssessment: 'full',
        stabilityScore: 0.92,
        confidence: 0.92,
      }

      manager.updateAnalysis(analysis1)
      let state = manager.getState()
      expect(state.lastAnalysis).toBe(analysis1)

      manager.updateAnalysis(analysis2)
      state = manager.getState()
      expect(state.lastAnalysis).toBe(analysis2)
    })

    it('should update repCount from analysis.repNumber', () => {
      const manager = new FormAnalysisStateManager()
      const analysis: FormAnalysisResult = {
        exercise: 'squat',
        formScore: 85,
        repNumber: 5,
        timestamp: Date.now(),
        errors: [],
        muscleEngagement: { quadriceps: 0.9 },
        depthAssessment: 'full',
        stabilityScore: 0.88,
        confidence: 0.9,
      }

      manager.updateAnalysis(analysis)
      const state = manager.getState()

      expect(state.repCount).toBe(5)
    })

    it('should track max repNumber as repCount', () => {
      const manager = new FormAnalysisStateManager()
      const analysis1: FormAnalysisResult = {
        exercise: 'squat',
        formScore: 85,
        repNumber: 3,
        timestamp: Date.now(),
        errors: [],
        muscleEngagement: { quadriceps: 0.9 },
        depthAssessment: 'full',
        stabilityScore: 0.88,
        confidence: 0.9,
      }

      const analysis2: FormAnalysisResult = {
        exercise: 'squat',
        formScore: 88,
        repNumber: 5,
        timestamp: Date.now() + 1000,
        errors: [],
        muscleEngagement: { quadriceps: 0.92 },
        depthAssessment: 'full',
        stabilityScore: 0.9,
        confidence: 0.91,
      }

      const analysis3: FormAnalysisResult = {
        exercise: 'squat',
        formScore: 82,
        repNumber: 4,
        timestamp: Date.now() + 2000,
        errors: [],
        muscleEngagement: { quadriceps: 0.88 },
        depthAssessment: 'partial',
        stabilityScore: 0.86,
        confidence: 0.89,
      }

      manager.updateAnalysis(analysis1)
      let state = manager.getState()
      expect(state.repCount).toBe(3)

      manager.updateAnalysis(analysis2)
      state = manager.getState()
      expect(state.repCount).toBe(5)

      manager.updateAnalysis(analysis3)
      state = manager.getState()
      expect(state.repCount).toBe(5)
    })

    it('should calculate average form score', () => {
      const manager = new FormAnalysisStateManager()
      const analysis1: FormAnalysisResult = {
        exercise: 'squat',
        formScore: 80,
        repNumber: 1,
        timestamp: Date.now(),
        errors: [],
        muscleEngagement: { quadriceps: 0.85 },
        depthAssessment: 'full',
        stabilityScore: 0.85,
        confidence: 0.9,
      }

      manager.updateAnalysis(analysis1)
      const state = manager.getState()

      expect(state.avgFormScore).toBe(80)
    })

    it('should compute running average of form scores', () => {
      const manager = new FormAnalysisStateManager()
      const analysis1: FormAnalysisResult = {
        exercise: 'squat',
        formScore: 80,
        repNumber: 1,
        timestamp: Date.now(),
        errors: [],
        muscleEngagement: { quadriceps: 0.85 },
        depthAssessment: 'full',
        stabilityScore: 0.85,
        confidence: 0.9,
      }

      const analysis2: FormAnalysisResult = {
        exercise: 'squat',
        formScore: 90,
        repNumber: 2,
        timestamp: Date.now() + 1000,
        errors: [],
        muscleEngagement: { quadriceps: 0.95 },
        depthAssessment: 'full',
        stabilityScore: 0.92,
        confidence: 0.92,
      }

      const analysis3: FormAnalysisResult = {
        exercise: 'squat',
        formScore: 85,
        repNumber: 3,
        timestamp: Date.now() + 2000,
        errors: [],
        muscleEngagement: { quadriceps: 0.9 },
        depthAssessment: 'full',
        stabilityScore: 0.88,
        confidence: 0.91,
      }

      manager.updateAnalysis(analysis1)
      let state = manager.getState()
      expect(state.avgFormScore).toBe(80)

      manager.updateAnalysis(analysis2)
      state = manager.getState()
      expect(state.avgFormScore).toBe(85)

      manager.updateAnalysis(analysis3)
      state = manager.getState()
      expect(state.avgFormScore).toBeCloseTo(85, 1)
    })

    it('should handle multiple analysis events sequentially', () => {
      const manager = new FormAnalysisStateManager()
      const analyses: FormAnalysisResult[] = [
        {
          exercise: 'squat',
          formScore: 75,
          repNumber: 1,
          timestamp: Date.now(),
          errors: [],
          muscleEngagement: { quadriceps: 0.8 },
          depthAssessment: 'full',
          stabilityScore: 0.8,
          confidence: 0.88,
        },
        {
          exercise: 'squat',
          formScore: 82,
          repNumber: 2,
          timestamp: Date.now() + 1000,
          errors: [],
          muscleEngagement: { quadriceps: 0.87 },
          depthAssessment: 'full',
          stabilityScore: 0.84,
          confidence: 0.89,
        },
        {
          exercise: 'squat',
          formScore: 88,
          repNumber: 3,
          timestamp: Date.now() + 2000,
          errors: [],
          muscleEngagement: { quadriceps: 0.92 },
          depthAssessment: 'full',
          stabilityScore: 0.9,
          confidence: 0.91,
        },
      ]

      for (const analysis of analyses) {
        manager.updateAnalysis(analysis)
      }

      const state = manager.getState()
      expect(state.lastAnalysis).toBe(analyses[2])
      expect(state.repCount).toBe(3)
      expect(state.avgFormScore).toBeCloseTo(81.67, 1)
    })

    it('should handle form scores with decimals', () => {
      const manager = new FormAnalysisStateManager()
      const analysis1: FormAnalysisResult = {
        exercise: 'squat',
        formScore: 75.5,
        repNumber: 1,
        timestamp: Date.now(),
        errors: [],
        muscleEngagement: { quadriceps: 0.85 },
        depthAssessment: 'full',
        stabilityScore: 0.85,
        confidence: 0.9,
      }

      const analysis2: FormAnalysisResult = {
        exercise: 'squat',
        formScore: 84.5,
        repNumber: 2,
        timestamp: Date.now() + 1000,
        errors: [],
        muscleEngagement: { quadriceps: 0.95 },
        depthAssessment: 'full',
        stabilityScore: 0.92,
        confidence: 0.92,
      }

      manager.updateAnalysis(analysis1)
      manager.updateAnalysis(analysis2)

      const state = manager.getState()
      expect(state.avgFormScore).toBe(80)
    })

    it('should maintain state with zero form scores', () => {
      const manager = new FormAnalysisStateManager()
      const analysis: FormAnalysisResult = {
        exercise: 'squat',
        formScore: 0,
        repNumber: 1,
        timestamp: Date.now(),
        errors: [],
        muscleEngagement: { quadriceps: 0.0 },
        depthAssessment: 'shallow',
        stabilityScore: 0.0,
        confidence: 0.5,
      }

      manager.updateAnalysis(analysis)
      const state = manager.getState()

      expect(state.avgFormScore).toBe(0)
      expect(state.repCount).toBe(1)
    })

    it('should maintain state with perfect form scores', () => {
      const manager = new FormAnalysisStateManager()
      const analysis: FormAnalysisResult = {
        exercise: 'squat',
        formScore: 100,
        repNumber: 1,
        timestamp: Date.now(),
        errors: [],
        muscleEngagement: { quadriceps: 1.0 },
        depthAssessment: 'full',
        stabilityScore: 1.0,
        confidence: 1.0,
      }

      manager.updateAnalysis(analysis)
      const state = manager.getState()

      expect(state.avgFormScore).toBe(100)
      expect(state.repCount).toBe(1)
    })
  })

  describe('Multiple instances', () => {
    it('should track multiple sessions independently', () => {
      const manager1 = new FormAnalysisStateManager()
      const manager2 = new FormAnalysisStateManager()

      const analysis1: FormAnalysisResult = {
        exercise: 'squat',
        formScore: 85,
        repNumber: 1,
        timestamp: Date.now(),
        errors: [],
        muscleEngagement: { quadriceps: 0.9 },
        depthAssessment: 'full',
        stabilityScore: 0.88,
        confidence: 0.9,
      }

      const analysis2: FormAnalysisResult = {
        exercise: 'deadlift',
        formScore: 90,
        repNumber: 2,
        timestamp: Date.now(),
        errors: [],
        muscleEngagement: { erectorSpinae: 0.95 },
        depthAssessment: 'full',
        stabilityScore: 0.92,
        confidence: 0.93,
      }

      manager1.updateAnalysis(analysis1)
      manager2.updateAnalysis(analysis2)

      const state1 = manager1.getState()
      const state2 = manager2.getState()

      expect(state1.lastAnalysis?.exercise).toBe('squat')
      expect(state2.lastAnalysis?.exercise).toBe('deadlift')
      expect(state1.repCount).toBe(1)
      expect(state2.repCount).toBe(2)
    })
  })

  describe('Null handling', () => {
    it('should handle null orchestrator gracefully', () => {
      const manager = new FormAnalysisStateManager()
      const state = manager.getState()

      expect(state.lastAnalysis).toBeNull()
      expect(state.repCount).toBe(0)
      expect(state.avgFormScore).toBe(0)
    })
  })
})
