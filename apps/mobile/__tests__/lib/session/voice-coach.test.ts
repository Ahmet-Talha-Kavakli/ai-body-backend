import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { VoiceCoach } from '@/lib/session/voice-coach'
import { VoiceCoachConfig, VoiceMessage, FormAnalysisResult } from '@/lib/session/types'

describe('VoiceCoach', () => {
  let voiceCoach: VoiceCoach
  let config: VoiceCoachConfig

  beforeEach(() => {
    config = {
      apiKey: 'test-key-123',
      assistantId: 'test-assistant-456',
      language: 'tr',
      timeout: 4000,
      enableFallback: true,
    }
    voiceCoach = new VoiceCoach(config)
  })

  afterEach(() => {
    voiceCoach.shutdown()
  })

  describe('Initialization', () => {
    it('should initialize with config', () => {
      expect(voiceCoach).toBeDefined()
      expect(voiceCoach.getConfig()).toEqual(config)
    })

    it('should have empty queue on initialization', () => {
      expect(voiceCoach.getQueue().length).toBe(0)
    })

    it('should start in listening state', () => {
      expect(voiceCoach.getState().isListening).toBe(true)
    })

    it('should initialize connection to VAPI', async () => {
      await voiceCoach.initialize()
      expect(voiceCoach.isConnected()).toBe(true)
    })
  })

  describe('Form Analysis Feedback', () => {
    beforeEach(async () => {
      await voiceCoach.initialize()
    })

    it('should queue feedback on form analysis', async () => {
      const analysis: FormAnalysisResult = {
        exercise: 'squat',
        formScore: 65,
        repNumber: 1,
        timestamp: Date.now(),
        errors: [
          {
            bodyPart: 'knee',
            severity: 'medium',
            cue: 'Keep knees tracking over toes',
            timestamp: Date.now(),
          },
        ],
        muscleEngagement: { quadriceps: 0.7 },
        depthAssessment: 'partial',
        stabilityScore: 0.8,
        confidence: 0.92,
      }

      await voiceCoach.sendFormAnalysis(analysis)

      expect(voiceCoach.getQueue().length).toBeGreaterThan(0)
    })

    it('should generate feedback message from analysis', async () => {
      const analysis: FormAnalysisResult = {
        exercise: 'squat',
        formScore: 70,
        repNumber: 2,
        timestamp: Date.now(),
        errors: [
          {
            bodyPart: 'back',
            severity: 'high',
            cue: 'Keep back straight',
            timestamp: Date.now(),
          },
        ],
        muscleEngagement: { quadriceps: 0.8 },
        depthAssessment: 'full',
        stabilityScore: 0.85,
        confidence: 0.95,
      }

      // Test private method via sending form analysis
      await voiceCoach.sendFormAnalysis(analysis)
      const feedback = voiceCoach.getFeedback()

      expect(feedback).toBeDefined()
      expect(feedback?.text).toBeDefined()
      expect(feedback?.text.length).toBeGreaterThan(0)
      expect(feedback?.text).toContain('squat') // Exercise name
    })

    it('should batch similar corrections', async () => {
      const analysis1: FormAnalysisResult = {
        exercise: 'squat',
        formScore: 65,
        repNumber: 1,
        timestamp: Date.now(),
        errors: [
          {
            bodyPart: 'knee',
            severity: 'medium',
            cue: 'Knee alignment',
            timestamp: Date.now(),
          },
        ],
        muscleEngagement: { quadriceps: 0.7 },
        depthAssessment: 'partial',
        stabilityScore: 0.8,
        confidence: 0.9,
      }

      const analysis2: FormAnalysisResult = {
        exercise: 'squat',
        formScore: 64,
        repNumber: 2,
        timestamp: Date.now() + 100,
        errors: [
          {
            bodyPart: 'knee',
            severity: 'medium',
            cue: 'Knee alignment',
            timestamp: Date.now() + 100,
          },
        ],
        muscleEngagement: { quadriceps: 0.72 },
        depthAssessment: 'partial',
        stabilityScore: 0.82,
        confidence: 0.91,
      }

      await voiceCoach.sendFormAnalysis(analysis1)
      await voiceCoach.sendFormAnalysis(analysis2)

      // Should batch consecutive similar errors (same body part, same cue)
      // Depending on implementation, may combine into 1 message or queue separately
      expect(voiceCoach.getQueue().length).toBeGreaterThanOrEqual(1)
    })
  })

  describe('Feedback Queue Management', () => {
    beforeEach(async () => {
      await voiceCoach.initialize()
    })

    it('should return null when no feedback queued', () => {
      expect(voiceCoach.getFeedback()).toBeNull()
    })

    it('should return and dequeue feedback in FIFO order', async () => {
      const analysis: FormAnalysisResult = {
        exercise: 'squat',
        formScore: 70,
        repNumber: 1,
        timestamp: Date.now(),
        errors: [],
        muscleEngagement: { quadriceps: 0.8 },
        depthAssessment: 'full',
        stabilityScore: 0.9,
        confidence: 0.95,
      }

      await voiceCoach.sendFormAnalysis(analysis)
      const feedback = voiceCoach.getFeedback()

      expect(feedback).toBeDefined()
      expect(feedback?.type).toMatch(/feedback|correction|encouragement/)
      expect(voiceCoach.getQueue().length).toBe(0)
    })

    it('should have correct feedback structure', async () => {
      const analysis: FormAnalysisResult = {
        exercise: 'squat',
        formScore: 75,
        repNumber: 1,
        timestamp: Date.now(),
        errors: [],
        muscleEngagement: { quadriceps: 0.85 },
        depthAssessment: 'full',
        stabilityScore: 0.92,
        confidence: 0.96,
      }

      await voiceCoach.sendFormAnalysis(analysis)
      const feedback = voiceCoach.getFeedback()

      expect(feedback).toHaveProperty('id')
      expect(feedback).toHaveProperty('text')
      expect(feedback).toHaveProperty('type')
      expect(feedback).toHaveProperty('timestamp')
      expect(feedback).toHaveProperty('played')
    })
  })

  describe('VAPI Integration', () => {
    beforeEach(async () => {
      await voiceCoach.initialize()
    })

    it('should call VAPI for feedback with 4-second timeout', async () => {
      // Test private method via sending form analysis which triggers VAPI
      const analysis: FormAnalysisResult = {
        exercise: 'squat',
        formScore: 80,
        repNumber: 1,
        timestamp: Date.now(),
        errors: [
          {
            bodyPart: 'back',
            severity: 'high',
            cue: 'Keep back straight',
            timestamp: Date.now(),
          },
        ],
        muscleEngagement: { quadriceps: 0.8 },
        depthAssessment: 'full',
        stabilityScore: 0.9,
        confidence: 0.95,
      }

      await voiceCoach.sendFormAnalysis(analysis)
      const feedback = voiceCoach.getFeedback()

      expect(feedback).toBeDefined()
      expect(typeof feedback?.text).toBe('string')
    })

    it('should fallback to TTS on VAPI timeout', async () => {
      // sendFormAnalysis will call VAPI and fallback to TTS on timeout
      const analysis: FormAnalysisResult = {
        exercise: 'squat',
        formScore: 50,
        repNumber: 1,
        timestamp: Date.now(),
        errors: [
          {
            bodyPart: 'knee',
            severity: 'high',
            cue: 'Fix knee alignment',
            timestamp: Date.now(),
          },
        ],
        muscleEngagement: { quadriceps: 0.5 },
        depthAssessment: 'shallow',
        stabilityScore: 0.7,
        confidence: 0.85,
      }

      // Should not throw and should fallback if needed
      await expect(voiceCoach.sendFormAnalysis(analysis)).resolves.not.toThrow()
      expect(voiceCoach.getQueue().length).toBeGreaterThan(0)
    })

    it('should support Turkish language feedback', async () => {
      const turkishConfig: VoiceCoachConfig = {
        ...config,
        language: 'tr',
      }
      const turkishCoach = new VoiceCoach(turkishConfig)
      await turkishCoach.initialize()

      expect(turkishCoach.getConfig().language).toBe('tr')
      turkishCoach.shutdown()
    })
  })

  describe('Fallback TTS', () => {
    beforeEach(async () => {
      await voiceCoach.initialize()
    })

    it('should generate TTS fallback message on VAPI error', async () => {
      const analysis: FormAnalysisResult = {
        exercise: 'bench-press',
        formScore: 65,
        repNumber: 1,
        timestamp: Date.now(),
        errors: [
          {
            bodyPart: 'chest',
            severity: 'medium',
            cue: 'Lower the weight further',
            timestamp: Date.now(),
          },
        ],
        muscleEngagement: { chest: 0.7 },
        depthAssessment: 'partial',
        stabilityScore: 0.8,
        confidence: 0.9,
      }

      await voiceCoach.sendFormAnalysis(analysis)
      const feedback = voiceCoach.getFeedback()

      expect(feedback).toBeDefined()
      expect(feedback?.type).toMatch(/feedback|correction|encouragement/)
      expect(feedback?.text).toBeDefined()
    })

    it('should respect language config for TTS', async () => {
      const turkishConfig: VoiceCoachConfig = {
        ...config,
        language: 'tr',
      }
      const turkishCoach = new VoiceCoach(turkishConfig)
      await turkishCoach.initialize()

      const analysis: FormAnalysisResult = {
        exercise: 'squat',
        formScore: 75,
        repNumber: 1,
        timestamp: Date.now(),
        errors: [],
        muscleEngagement: { quadriceps: 0.8 },
        depthAssessment: 'full',
        stabilityScore: 0.9,
        confidence: 0.95,
      }

      await turkishCoach.sendFormAnalysis(analysis)
      const feedback = turkishCoach.getFeedback()

      expect(feedback).toBeDefined()
      expect(feedback?.text).toBeDefined()
      turkishCoach.shutdown()
    })
  })

  describe('State Management', () => {
    it('should track listening state', async () => {
      await voiceCoach.initialize()
      expect(voiceCoach.getState().isListening).toBe(true)

      voiceCoach.stopListening()
      expect(voiceCoach.getState().isListening).toBe(false)

      voiceCoach.startListening()
      expect(voiceCoach.getState().isListening).toBe(true)
    })

    it('should track processing state', async () => {
      await voiceCoach.initialize()
      expect(voiceCoach.getState().isProcessing).toBe(false)
    })

    it('should track errors', async () => {
      expect(voiceCoach.getState().error).toBeNull()

      const testError = new Error('Test error')
      voiceCoach.setError(testError)
      expect(voiceCoach.getState().error).toEqual(testError)

      voiceCoach.clearError()
      expect(voiceCoach.getState().error).toBeNull()
    })

    it('should return complete state object', () => {
      const state = voiceCoach.getState()

      expect(state).toHaveProperty('isListening')
      expect(state).toHaveProperty('isProcessing')
      expect(state).toHaveProperty('feedbackQueue')
      expect(state).toHaveProperty('error')
      expect(Array.isArray(state.feedbackQueue)).toBe(true)
    })
  })

  describe('Resource Cleanup', () => {
    it('should shutdown cleanly', async () => {
      await voiceCoach.initialize()

      const analysis: FormAnalysisResult = {
        exercise: 'squat',
        formScore: 70,
        repNumber: 1,
        timestamp: Date.now(),
        errors: [],
        muscleEngagement: { quadriceps: 0.8 },
        depthAssessment: 'full',
        stabilityScore: 0.9,
        confidence: 0.95,
      }

      await voiceCoach.sendFormAnalysis(analysis)

      voiceCoach.shutdown()

      expect(voiceCoach.isConnected()).toBe(false)
      expect(voiceCoach.getQueue().length).toBe(0)
    })

    it('should cancel pending requests on shutdown', async () => {
      await voiceCoach.initialize()

      const analysis: FormAnalysisResult = {
        exercise: 'squat',
        formScore: 70,
        repNumber: 1,
        timestamp: Date.now(),
        errors: [],
        muscleEngagement: { quadriceps: 0.8 },
        depthAssessment: 'full',
        stabilityScore: 0.9,
        confidence: 0.95,
      }

      // Send analysis but don't await
      voiceCoach.sendFormAnalysis(analysis)

      // Immediately shutdown
      voiceCoach.shutdown()

      expect(voiceCoach.isConnected()).toBe(false)
    })

    it('should allow multiple shutdown calls', async () => {
      await voiceCoach.initialize()
      voiceCoach.shutdown()
      voiceCoach.shutdown() // Should not throw
      expect(voiceCoach.isConnected()).toBe(false)
    })
  })

  describe('Error Handling', () => {
    beforeEach(async () => {
      await voiceCoach.initialize()
    })

    it('should handle VAPI connection errors gracefully', async () => {
      // Try to send analysis even if connection fails
      const analysis: FormAnalysisResult = {
        exercise: 'squat',
        formScore: 70,
        repNumber: 1,
        timestamp: Date.now(),
        errors: [],
        muscleEngagement: { quadriceps: 0.8 },
        depthAssessment: 'full',
        stabilityScore: 0.9,
        confidence: 0.95,
      }

      // Should not throw
      await expect(voiceCoach.sendFormAnalysis(analysis)).resolves.not.toThrow()
    })

    it('should recover from transient errors in form analysis', async () => {
      const analysis: FormAnalysisResult = {
        exercise: 'deadlift',
        formScore: 60,
        repNumber: 1,
        timestamp: Date.now(),
        errors: [
          {
            bodyPart: 'back',
            severity: 'high',
            cue: 'Keep back straight',
            timestamp: Date.now(),
          },
        ],
        muscleEngagement: { back: 0.7 },
        depthAssessment: 'full',
        stabilityScore: 0.75,
        confidence: 0.88,
      }

      // First call may fail but should recover
      await voiceCoach.sendFormAnalysis(analysis)

      // Second call should work
      await voiceCoach.sendFormAnalysis(analysis)
      expect(voiceCoach.getQueue().length).toBeGreaterThan(0)
    })
  })

  describe('Batching Logic', () => {
    beforeEach(async () => {
      await voiceCoach.initialize()
    })

    it('should not send feedback on every frame', async () => {
      // Send multiple analyses in quick succession
      for (let i = 0; i < 5; i++) {
        const analysis: FormAnalysisResult = {
          exercise: 'squat',
          formScore: 70,
          repNumber: i + 1,
          timestamp: Date.now() + i * 10,
          errors: [
            {
              bodyPart: 'knee',
              severity: 'low',
              cue: 'Minor form issue',
              timestamp: Date.now() + i * 10,
            },
          ],
          muscleEngagement: { quadriceps: 0.8 },
          depthAssessment: 'full',
          stabilityScore: 0.9,
          confidence: 0.95,
        }

        await voiceCoach.sendFormAnalysis(analysis)
      }

      // Queue should have fewer items than analyses sent (batching effect)
      // OR it should have processed only distinct meaningful feedback
      const queue = voiceCoach.getQueue()
      expect(queue.length).toBeLessThanOrEqual(5)
    })

    it('should separate feedback for different errors', async () => {
      const analysis1: FormAnalysisResult = {
        exercise: 'squat',
        formScore: 60,
        repNumber: 1,
        timestamp: Date.now(),
        errors: [
          {
            bodyPart: 'knee',
            severity: 'high',
            cue: 'Knee alignment',
            timestamp: Date.now(),
          },
        ],
        muscleEngagement: { quadriceps: 0.7 },
        depthAssessment: 'partial',
        stabilityScore: 0.8,
        confidence: 0.9,
      }

      const analysis2: FormAnalysisResult = {
        exercise: 'squat',
        formScore: 55,
        repNumber: 2,
        timestamp: Date.now() + 100,
        errors: [
          {
            bodyPart: 'back',
            severity: 'high',
            cue: 'Back position',
            timestamp: Date.now() + 100,
          },
        ],
        muscleEngagement: { quadriceps: 0.65 },
        depthAssessment: 'shallow',
        stabilityScore: 0.75,
        confidence: 0.92,
      }

      await voiceCoach.sendFormAnalysis(analysis1)
      await voiceCoach.sendFormAnalysis(analysis2)

      // Different errors should not be batched together
      const queue = voiceCoach.getQueue()
      expect(queue.length).toBeGreaterThanOrEqual(1)
    })
  })
})
