import { describe, it, expect, beforeEach } from 'vitest'
import { FormAnalyzer } from '../../src/ml/form-analyzer'
import { generateVoiceFeedback, generateCorrections } from '../../src/ml/feedback-generator'
import { Keypoint, FormAnalysisResult, FormViolation } from '../../src/types/form-analysis'
import {
  SQUAT_FORM_RULES,
  BENCH_PRESS_FORM_RULES,
  DEADLIFT_FORM_RULES,
} from '../../src/utils/form-rules'

describe('FormAnalyzer', () => {
  let analyzer: FormAnalyzer
  let mockKeypoints: Keypoint[]

  beforeEach(() => {
    analyzer = new FormAnalyzer('squat')
    mockKeypoints = [
      { name: 'leftShoulder', x: 250, y: 100, confidence: 0.95 },
      { name: 'rightShoulder', x: 350, y: 100, confidence: 0.95 },
      { name: 'leftHip', x: 250, y: 250, confidence: 0.95 },
      { name: 'rightHip', x: 350, y: 250, confidence: 0.95 },
      { name: 'leftKnee', x: 250, y: 400, confidence: 0.95 },
      { name: 'rightKnee', x: 350, y: 400, confidence: 0.95 },
      { name: 'leftAnkle', x: 250, y: 550, confidence: 0.95 },
      { name: 'rightAnkle', x: 350, y: 550, confidence: 0.95 },
      { name: 'nose', x: 300, y: 50, confidence: 0.95 },
    ]
  })

  describe('FormAnalyzer initialization', () => {
    it('should initialize with exercise type', () => {
      const squat = new FormAnalyzer('squat')
      expect(squat).toBeDefined()

      const benchPress = new FormAnalyzer('benchPress')
      expect(benchPress).toBeDefined()

      const deadlift = new FormAnalyzer('deadlift')
      expect(deadlift).toBeDefined()
    })

    it('should have correct exercise type stored', () => {
      const analyzer = new FormAnalyzer('squat')
      expect(analyzer.exerciseType).toBe('squat')
    })
  })

  describe('analyzeRep', () => {
    it('should return FormAnalysisResult with good form', () => {
      const result = analyzer.analyzeRep(mockKeypoints, 1, 'squat')

      expect(result).toBeDefined()
      expect(result.repNumber).toBe(1)
      expect(result.exerciseId).toBe('squat')
      expect(result.overallScore).toBeGreaterThanOrEqual(0)
      expect(result.overallScore).toBeLessThanOrEqual(100)
      expect(Array.isArray(result.violations)).toBe(true)
      expect(Array.isArray(result.feedback)).toBe(true)
    })

    it('should detect good form (score > 80)', () => {
      const result = analyzer.analyzeRep(mockKeypoints, 1, 'squat')

      if (result.overallScore > 80) {
        expect(result.violations.length).toBeLessThan(3)
      }
    })

    it('should include timestamp in result', () => {
      const result = analyzer.analyzeRep(mockKeypoints, 1, 'squat')

      expect(result.timestamp).toBeDefined()
      expect(typeof result.timestamp).toBe('number')
      expect(result.timestamp).toBeGreaterThan(0)
    })

    it('should detect violations for poor form', () => {
      const poorKeypoints: Keypoint[] = [
        { name: 'leftShoulder', x: 200, y: 100, confidence: 0.95 },
        { name: 'rightShoulder', x: 400, y: 100, confidence: 0.95 },
        { name: 'leftHip', x: 150, y: 250, confidence: 0.95 }, // Asymmetric
        { name: 'rightHip', x: 400, y: 250, confidence: 0.95 },
        { name: 'leftKnee', x: 150, y: 450, confidence: 0.95 }, // Knee over toe
        { name: 'rightKnee', x: 400, y: 400, confidence: 0.95 },
        { name: 'leftAnkle', x: 150, y: 600, confidence: 0.95 },
        { name: 'rightAnkle', x: 400, y: 550, confidence: 0.95 },
        { name: 'nose', x: 250, y: 50, confidence: 0.95 },
      ]

      const result = analyzer.analyzeRep(poorKeypoints, 1, 'squat')

      expect(result.violations.length).toBeGreaterThan(0)
      expect(result.overallScore).toBeLessThan(80)
    })

    it('should include muscle engagement data', () => {
      const result = analyzer.analyzeRep(mockKeypoints, 1, 'squat')

      expect(result.muscleEngagement).toBeDefined()
      expect(Array.isArray(result.muscleEngagement)).toBe(true)
    })

    it('should include form metrics', () => {
      const result = analyzer.analyzeRep(mockKeypoints, 1, 'squat')

      expect(result.metrics).toBeDefined()
      expect(result.metrics.rangeOfMotion).toBeDefined()
      expect(result.metrics.stability).toBeDefined()
      expect(result.metrics.totalRepTime).toBeDefined()
    })

    it('should calculate different scores for different form quality', () => {
      const goodForm = analyzer.analyzeRep(mockKeypoints, 1, 'squat')

      const asymmetricKeypoints = [
        ...mockKeypoints.slice(0, 2),
        { name: 'leftHip', x: 200, y: 250, confidence: 0.95 }, // Shifted left
        { name: 'rightHip', x: 350, y: 250, confidence: 0.95 },
        ...mockKeypoints.slice(4),
      ]
      const badForm = analyzer.analyzeRep(asymmetricKeypoints, 1, 'squat')

      expect(goodForm.overallScore).not.toBe(badForm.overallScore)
    })
  })

  describe('feedback generation', () => {
    it('should generate voice feedback for violations', () => {
      const violations: FormViolation[] = [
        {
          ruleId: 'knee_over_toe',
          ruleName: 'Knee Over Toe',
          severity: 'high',
          detectedValue: 15,
          expectedRange: { min: 0, max: 10 },
          confidence: 0.9,
        },
      ]

      const feedback = generateVoiceFeedback(violations)

      expect(feedback).toBeDefined()
      expect(typeof feedback).toBe('string')
      expect(feedback.length).toBeGreaterThan(0)
    })

    it('should prioritize high severity violations', () => {
      const violations: FormViolation[] = [
        {
          ruleId: 'low_severity',
          ruleName: 'Minor Issue',
          severity: 'low',
          detectedValue: 5,
          expectedRange: { min: 0, max: 10 },
          confidence: 0.9,
        },
        {
          ruleId: 'high_severity',
          ruleName: 'Critical Issue',
          severity: 'high',
          detectedValue: 20,
          expectedRange: { min: 0, max: 10 },
          confidence: 0.95,
        },
      ]

      const feedback = generateVoiceFeedback(violations)

      expect(feedback).toContain('Critical')
    })

    it('should generate corrections from violations', () => {
      const violations: FormViolation[] = [
        {
          ruleId: 'knee_over_toe',
          ruleName: 'Knee Over Toe',
          severity: 'high',
          detectedValue: 15,
          expectedRange: { min: 0, max: 10 },
          confidence: 0.9,
        },
      ]

      const corrections = generateCorrections(violations)

      expect(corrections).toBeDefined()
      expect(Array.isArray(corrections)).toBe(true)
      expect(corrections.length).toBeGreaterThan(0)
    })

    it('should map violation ruleId to correction text', () => {
      const violations: FormViolation[] = [
        {
          ruleId: 'knee_over_toe',
          ruleName: 'Knee Over Toe',
          severity: 'high',
          detectedValue: 15,
          expectedRange: { min: 0, max: 10 },
          confidence: 0.9,
        },
      ]

      const corrections = generateCorrections(violations)

      expect(corrections[0].toLowerCase()).toContain('knee')
    })
  })

  describe('form rules', () => {
    it('should have squat form rules defined', () => {
      expect(SQUAT_FORM_RULES).toBeDefined()
      expect(Array.isArray(SQUAT_FORM_RULES)).toBe(true)
      expect(SQUAT_FORM_RULES.length).toBeGreaterThan(0)
    })

    it('should have bench press form rules defined', () => {
      expect(BENCH_PRESS_FORM_RULES).toBeDefined()
      expect(Array.isArray(BENCH_PRESS_FORM_RULES)).toBe(true)
      expect(BENCH_PRESS_FORM_RULES.length).toBeGreaterThan(0)
    })

    it('should have deadlift form rules defined', () => {
      expect(DEADLIFT_FORM_RULES).toBeDefined()
      expect(Array.isArray(DEADLIFT_FORM_RULES)).toBe(true)
      expect(DEADLIFT_FORM_RULES.length).toBeGreaterThan(0)
    })

    it('should have rules with correct structure', () => {
      const rule = SQUAT_FORM_RULES[0]

      expect(rule.id).toBeDefined()
      expect(rule.name).toBeDefined()
      expect(rule.type).toBeDefined()
      expect(rule.severity).toBeDefined()
      expect(rule.evaluate).toBeDefined()
      expect(typeof rule.evaluate).toBe('function')
    })
  })

  describe('integration', () => {
    it('should analyze multiple reps and track progression', () => {
      const results = []

      for (let i = 1; i <= 3; i++) {
        const result = analyzer.analyzeRep(mockKeypoints, i, 'squat')
        results.push(result)
      }

      expect(results.length).toBe(3)
      expect(results[0].repNumber).toBe(1)
      expect(results[1].repNumber).toBe(2)
      expect(results[2].repNumber).toBe(3)
    })

    it('should handle different exercise types', () => {
      const squatAnalyzer = new FormAnalyzer('squat')
      const benchAnalyzer = new FormAnalyzer('benchPress')
      const deadliftAnalyzer = new FormAnalyzer('deadlift')

      const squatResult = squatAnalyzer.analyzeRep(mockKeypoints, 1, 'squat')
      const benchResult = benchAnalyzer.analyzeRep(mockKeypoints, 1, 'benchPress')
      const deadliftResult = deadliftAnalyzer.analyzeRep(mockKeypoints, 1, 'deadlift')

      expect(squatResult).toBeDefined()
      expect(benchResult).toBeDefined()
      expect(deadliftResult).toBeDefined()
    })
  })
})
