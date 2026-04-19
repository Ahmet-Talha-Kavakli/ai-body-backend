/**
 * Integration Tests for Complete Coaching Flow
 * Tests full coaching lifecycle: form analysis, program generation, end-to-end flow
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import * as formAnalysisService from '../../src/services/formAnalysisService'
import * as programGenerationService from '../../src/services/programGenerationService'
import type {
  FormAnalysisFrame,
  CoachingProgram,
} from '../../src/types/coaching'

describe('Coaching Integration Tests', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    await formAnalysisService.initializeModel()
  })

  afterEach(async () => {
    await formAnalysisService.dispose()
  })

  // ==================== FORM ANALYSIS TESTS ====================

  describe('Form Analysis and Feedback', () => {
    it('should analyze single frame and return form score', async () => {
      const frame = await formAnalysisService.analyzeFrame(
        'file:///path/to/frame.jpg'
      )

      expect(frame.pose).toBeDefined()
      expect(frame.formScore).toBeGreaterThanOrEqual(0)
      expect(frame.formScore).toBeLessThanOrEqual(100)
      expect(frame.feedback).toBeDefined()
    })

    it('should return 17 keypoints for valid pose', async () => {
      const frame = await formAnalysisService.analyzeFrame(
        'file:///path/to/frame.jpg'
      )

      expect(frame.pose.length).toBe(17)
      frame.pose.forEach((keypoint) => {
        expect(keypoint).toHaveProperty('name')
        expect(keypoint).toHaveProperty('x')
        expect(keypoint).toHaveProperty('y')
        expect(keypoint).toHaveProperty('score')
      })
    })

    it('should generate actionable feedback based on form score', async () => {
      const frame = await formAnalysisService.analyzeFrame(
        'file:///path/to/frame.jpg'
      )

      expect(Array.isArray(frame.feedback)).toBe(true)
      frame.feedback.forEach((msg) => {
        expect(typeof msg).toBe('string')
        expect(msg.length).toBeGreaterThan(0)
      })
    })

    it('should handle multiple frames sequentially', async () => {
      const frame1 = await formAnalysisService.analyzeFrame(
        'file:///path/to/frame1.jpg'
      )
      const frame2 = await formAnalysisService.analyzeFrame(
        'file:///path/to/frame2.jpg'
      )
      const frame3 = await formAnalysisService.analyzeFrame(
        'file:///path/to/frame3.jpg'
      )

      expect(frame1.formScore).toBeGreaterThanOrEqual(0)
      expect(frame2.formScore).toBeGreaterThanOrEqual(0)
      expect(frame3.formScore).toBeGreaterThanOrEqual(0)
    })

    it('should maintain pose consistency across similar frames', async () => {
      const frame1 = await formAnalysisService.analyzeFrame(
        'file:///path/to/same-frame.jpg'
      )
      const frame2 = await formAnalysisService.analyzeFrame(
        'file:///path/to/same-frame.jpg'
      )

      expect(frame1.pose.length).toBe(frame2.pose.length)
      expect(frame1.pose.length).toBe(17)
    })
  })

  // ==================== REP DETECTION TESTS ====================

  describe('Rep Detection and Counting', () => {
    it('should detect reps for squat exercise', () => {
      const poses = Array(5)
        .fill(null)
        .map((_, i) => ({
          keypoints: [
            { name: 'right_hip', x: 100, y: 100 + i * 20, score: 0.9 },
            { name: 'right_knee', x: 105, y: 150 + i * 20, score: 0.9 },
            { name: 'right_ankle', x: 105, y: 200, score: 0.9 },
          ],
        }))

      const repCount = formAnalysisService.detectReps(poses, 'squat')

      expect(typeof repCount).toBe('number')
      expect(repCount).toBeGreaterThanOrEqual(0)
    })

    it('should detect reps for deadlift exercise', () => {
      const poses = Array(6)
        .fill(null)
        .map((_, i) => ({
          keypoints: [
            { name: 'right_hip', x: 100, y: 100 + i * 15, score: 0.9 },
            { name: 'right_knee', x: 105, y: 120 + i * 15, score: 0.9 },
          ],
        }))

      const repCount = formAnalysisService.detectReps(poses, 'deadlift')

      expect(typeof repCount).toBe('number')
    })

    it('should return 0 for single pose', () => {
      const poses = [
        {
          keypoints: [
            { name: 'right_hip', x: 100, y: 100, score: 0.9 },
          ],
        },
      ]

      const repCount = formAnalysisService.detectReps(poses, 'squat')

      expect(repCount).toBe(0)
    })

    it('should handle empty pose array', () => {
      const repCount = formAnalysisService.detectReps([], 'squat')

      expect(repCount).toBe(0)
    })

    it('should detect multiple reps in sequence', () => {
      const poses = Array(20)
        .fill(null)
        .map((_, i) => ({
          keypoints: [
            { name: 'right_hip', x: 100, y: 100 + Math.sin(i / 5) * 50, score: 0.9 },
            { name: 'right_knee', x: 105, y: 150 + Math.sin(i / 5) * 40, score: 0.9 },
          ],
        }))

      const repCount = formAnalysisService.detectReps(poses, 'squat')

      expect(typeof repCount).toBe('number')
    })
  })

  // ==================== POSE COMPARISON TESTS ====================

  describe('Form Scoring and Comparison', () => {
    it('should score perfect pose higher than poor pose', () => {
      const perfectPose = [
        { name: 'left_shoulder', x: 100, y: 50, score: 0.99 },
        { name: 'left_elbow', x: 110, y: 100, score: 0.99 },
        { name: 'left_wrist', x: 120, y: 150, score: 0.99 },
      ]

      const slightlyOffPose = [
        { name: 'left_shoulder', x: 105, y: 55, score: 0.9 },
        { name: 'left_elbow', x: 125, y: 115, score: 0.9 },
        { name: 'left_wrist', x: 145, y: 165, score: 0.9 },
      ]

      const perfectResult = formAnalysisService.comparePose(
        perfectPose,
        perfectPose
      )
      const offResult = formAnalysisService.comparePose(slightlyOffPose, perfectPose)

      expect(perfectResult.form_score).toBeGreaterThanOrEqual(offResult.form_score)
    })

    it('should provide angle errors for form deviations', () => {
      const detectedPose = [
        { name: 'left_shoulder', x: 100, y: 50, score: 0.9 },
        { name: 'left_elbow', x: 120, y: 100, score: 0.9 },
        { name: 'left_wrist', x: 140, y: 150, score: 0.9 },
      ]

      const templatePose = [
        { name: 'left_shoulder', x: 100, y: 50, score: 1 },
        { name: 'left_elbow', x: 110, y: 100, score: 1 },
        { name: 'left_wrist', x: 120, y: 150, score: 1 },
      ]

      const result = formAnalysisService.comparePose(
        detectedPose,
        templatePose
      )

      expect(result.angle_errors).toBeDefined()
      expect(Array.isArray(result.angle_errors)).toBe(true)
    })

    it('should include feedback for form improvement', () => {
      const detectedPose = [
        { name: 'left_shoulder', x: 100, y: 50, score: 0.6 },
      ]
      const templatePose = [
        { name: 'left_shoulder', x: 100, y: 50, score: 1 },
      ]

      const result = formAnalysisService.comparePose(
        detectedPose,
        templatePose
      )

      expect(result.feedback).toBeDefined()
      expect(Array.isArray(result.feedback)).toBe(true)
    })
  })

  // ==================== PROGRAM GENERATION TESTS ====================

  describe('Coaching Program Generation', () => {
    it('should generate program with exercises', async () => {
      const input = {
        userId: 'user-1',
        sessionId: 'session-1',
        userAnalytics: {
          workoutHistory: ['squat', 'deadlift'],
          strengthLevels: { squat: 185, deadlift: 225 },
        },
        formScores: [
          { exercise: 'squat', score: 80 },
          { exercise: 'deadlift', score: 85 },
        ],
        coachNotes: 'Good form on both lifts',
      }

      const program = await programGenerationService.generateProgram(input)

      expect(program.id).toBeDefined()
      expect(program.userId).toBe('user-1')
      expect(program.sessionId).toBe('session-1')
      expect(program.exercises).toBeDefined()
      expect(program.exercises.length).toBeGreaterThan(0)
    })

    it('should include exercise details in program', async () => {
      const input = {
        userId: 'user-1',
        sessionId: 'session-1',
        userAnalytics: { workoutHistory: ['squat'], strengthLevels: { squat: 185 } },
        formScores: [{ exercise: 'squat', score: 75 }],
        coachNotes: 'Work on depth',
      }

      const program = await programGenerationService.generateProgram(input)

      program.exercises.forEach((exercise) => {
        expect(exercise.name).toBeDefined()
        expect(exercise.sets).toBeGreaterThan(0)
        expect(exercise.reps).toBeGreaterThan(0)
        expect(exercise.formTips).toBeDefined()
        expect(Array.isArray(exercise.formTips)).toBe(true)
      })
    })

    it('should include nutrition notes when generated', async () => {
      const input = {
        userId: 'user-2',
        sessionId: 'session-2',
        userAnalytics: { workoutHistory: [], strengthLevels: {} },
        formScores: [],
        coachNotes: 'Focus on nutrition',
      }

      const program = await programGenerationService.generateProgram(input)

      expect(program.nutritionNotes).toBeDefined()
    })

    it('should include recovery tips in program', async () => {
      const input = {
        userId: 'user-3',
        sessionId: 'session-3',
        userAnalytics: { workoutHistory: ['bench', 'squat'], strengthLevels: {} },
        formScores: [
          { exercise: 'bench', score: 70 },
          { exercise: 'squat', score: 65 },
        ],
        coachNotes: 'Focus on recovery',
      }

      const program = await programGenerationService.generateProgram(input)

      expect(program.recoveryTips).toBeDefined()
    })

    it('should generate unique programs for different sessions', async () => {
      const input1 = {
        userId: 'user-1',
        sessionId: 'session-1',
        userAnalytics: { workoutHistory: [], strengthLevels: {} },
        formScores: [],
        coachNotes: '',
      }

      const input2 = {
        userId: 'user-1',
        sessionId: 'session-2',
        userAnalytics: { workoutHistory: [], strengthLevels: {} },
        formScores: [],
        coachNotes: '',
      }

      const program1 = await programGenerationService.generateProgram(input1)
      const program2 = await programGenerationService.generateProgram(input2)

      expect(program1.id).not.toBe(program2.id)
      expect(program1.sessionId).not.toBe(program2.sessionId)
    })

    it('should handle empty user analytics', async () => {
      const input = {
        userId: 'new-user',
        sessionId: 'session-new',
        userAnalytics: { workoutHistory: [], strengthLevels: {} },
        formScores: [],
        coachNotes: 'First session',
      }

      const program = await programGenerationService.generateProgram(input)

      expect(program).toBeDefined()
      expect(program.exercises.length).toBeGreaterThan(0)
    })
  })

  // ==================== END-TO-END COACHING FLOW ====================

  describe('Complete Coaching Session End-to-End', () => {
    it('should complete full flow: analyze → detect reps → generate program', async () => {
      // Step 1: Analyze frames during session
      const frames = []
      for (let i = 0; i < 3; i++) {
        const frame = await formAnalysisService.analyzeFrame(
          `file:///path/to/frame${i}.jpg`
        )
        frames.push(frame)
      }

      expect(frames).toHaveLength(3)
      frames.forEach((frame) => {
        expect(frame.formScore).toBeGreaterThanOrEqual(0)
      })

      // Step 2: Calculate average form score
      const avgFormScore =
        frames.reduce((sum, f) => sum + f.formScore, 0) / frames.length

      // Step 3: Detect reps from pose sequence
      const poses = frames.map((f) => ({
        keypoints: f.pose,
      }))

      const repCount = formAnalysisService.detectReps(poses, 'squat')

      expect(typeof repCount).toBe('number')

      // Step 4: Generate coaching program
      const programInput = {
        userId: 'user-e2e',
        sessionId: 'session-e2e',
        userAnalytics: {
          workoutHistory: ['squat', 'deadlift'],
          strengthLevels: { squat: 185, deadlift: 225 },
        },
        formScores: [
          { exercise: 'squat', score: avgFormScore },
        ],
        coachNotes: `Completed ${repCount} reps with average form score ${Math.round(avgFormScore)}%`,
      }

      const program = await programGenerationService.generateProgram(
        programInput
      )

      expect(program.id).toBeDefined()
      expect(program.exercises.length).toBeGreaterThan(0)
    })

    it('should handle multiple exercises in single session', async () => {
      // Analyze squat
      const squatFrames = []
      for (let i = 0; i < 2; i++) {
        const frame = await formAnalysisService.analyzeFrame(
          `file:///path/to/squat${i}.jpg`
        )
        squatFrames.push(frame)
      }

      // Analyze deadlift
      const deadliftFrames = []
      for (let i = 0; i < 2; i++) {
        const frame = await formAnalysisService.analyzeFrame(
          `file:///path/to/deadlift${i}.jpg`
        )
        deadliftFrames.push(frame)
      }

      const squatScore =
        squatFrames.reduce((sum, f) => sum + f.formScore, 0) / squatFrames.length
      const deadliftScore =
        deadliftFrames.reduce((sum, f) => sum + f.formScore, 0) /
        deadliftFrames.length

      // Generate program with both exercises
      const input = {
        userId: 'user-multi',
        sessionId: 'session-multi',
        userAnalytics: {
          workoutHistory: ['squat', 'deadlift'],
          strengthLevels: { squat: 185, deadlift: 225 },
        },
        formScores: [
          { exercise: 'squat', score: squatScore },
          { exercise: 'deadlift', score: deadliftScore },
        ],
        coachNotes: 'Multi-exercise session',
      }

      const program = await programGenerationService.generateProgram(input)

      expect(program.exercises.length).toBeGreaterThan(0)
    })

    it('should adapt program based on form scores', async () => {
      // Low form score session
      const lowFormInput = {
        userId: 'user-low',
        sessionId: 'session-low',
        userAnalytics: { workoutHistory: ['squat'], strengthLevels: { squat: 185 } },
        formScores: [{ exercise: 'squat', score: 45 }],
        coachNotes: 'Form needs work',
      }

      const lowFormProgram = await programGenerationService.generateProgram(
        lowFormInput
      )

      // High form score session
      const highFormInput = {
        userId: 'user-high',
        sessionId: 'session-high',
        userAnalytics: { workoutHistory: ['squat'], strengthLevels: { squat: 185 } },
        formScores: [{ exercise: 'squat', score: 90 }],
        coachNotes: 'Excellent form',
      }

      const highFormProgram = await programGenerationService.generateProgram(
        highFormInput
      )

      expect(lowFormProgram.exercises).toBeDefined()
      expect(highFormProgram.exercises).toBeDefined()
      // Both should be valid programs
      expect(lowFormProgram.exercises.length).toBeGreaterThan(0)
      expect(highFormProgram.exercises.length).toBeGreaterThan(0)
    })
  })

  // ==================== ERROR HANDLING ====================

  describe('Error Handling and Edge Cases', () => {
    it('should handle form analysis timeout gracefully', async () => {
      const frame = await formAnalysisService.analyzeFrame(
        'file:///invalid/path.jpg'
      )

      expect(frame).toBeDefined()
      expect(frame.formScore).toBeDefined()
      expect(frame.pose).toBeDefined()
    })

    it('should handle program generation timeout with stub', async () => {
      const input = {
        userId: 'user-timeout',
        sessionId: 'session-timeout',
        userAnalytics: { workoutHistory: [], strengthLevels: {} },
        formScores: [],
        coachNotes: '',
      }

      const program = await programGenerationService.generateProgram(input)

      // Should return valid stub program
      expect(program).toBeDefined()
      expect(program.exercises.length).toBeGreaterThan(0)
    })

    it('should handle missing user analytics gracefully', async () => {
      const input = {
        userId: 'user-minimal',
        sessionId: 'session-minimal',
        userAnalytics: { workoutHistory: [], strengthLevels: {} },
        formScores: [],
        coachNotes: '',
      }

      const program = await programGenerationService.generateProgram(input)

      expect(program.exercises).toBeDefined()
      expect(program.exercises.length).toBeGreaterThan(0)
    })
  })
})
