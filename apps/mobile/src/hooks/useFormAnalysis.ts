/**
 * Form Analysis Hook
 * Real-time pipeline: extract angles from keypoints → analyze form → generate feedback
 * Coordinates all form analysis components
 */

import { useState, useCallback, useRef, useEffect } from 'react'
import { FormAnalyzer } from '../ml/form-analyzer'
import { extractAngles } from '../ml/pose-extractor'
import { generateVoiceFeedback } from '../ml/feedback-generator'
import {
  Keypoint,
  FormAnalysisResult,
  AngleExtraction,
  FormViolation,
} from '../types/form-analysis'

export interface FormAnalysisState {
  currentRep: number
  currentAnalysis: FormAnalysisResult | null
  voiceFeedback: string | null
  isAnalyzing: boolean
  analysisHistory: FormAnalysisResult[]
}

export interface UseFormAnalysisOptions {
  exerciseType: string
  exerciseId: string
  autoAnalyze?: boolean
  maxHistorySize?: number
}

export interface UseFormAnalysisReturn extends FormAnalysisState {
  analyzeFrame: (keypoints: Keypoint[]) => void
  startNewRep: () => void
  endRep: () => void
  reset: () => void
  getAverageScore: () => number
  getBestScore: () => number
  getWorstScore: () => number
}

const DEFAULT_MAX_HISTORY = 20

export function useFormAnalysis(options: UseFormAnalysisOptions): UseFormAnalysisReturn {
  const {
    exerciseType,
    exerciseId,
    autoAnalyze = true,
    maxHistorySize = DEFAULT_MAX_HISTORY,
  } = options

  const [state, setState] = useState<FormAnalysisState>({
    currentRep: 1,
    currentAnalysis: null,
    voiceFeedback: null,
    isAnalyzing: false,
    analysisHistory: [],
  })

  // Analyzer instance
  const analyzerRef = useRef<FormAnalyzer>(new FormAnalyzer(exerciseType))

  // Keypoint buffer for angle extraction
  const keypointsBufferRef = useRef<Keypoint[]>([])

  /**
   * Define joint angle configs for this exercise
   */
  const getJointAngleConfigs = useCallback(() => {
    switch (exerciseType.toLowerCase()) {
      case 'squat':
        return [
          {
            name: 'leftKneeAngle',
            joints: ['leftHip', 'leftKnee', 'leftAnkle'],
          },
          {
            name: 'rightKneeAngle',
            joints: ['rightHip', 'rightKnee', 'rightAnkle'],
          },
          {
            name: 'leftHipAngle',
            joints: ['leftShoulder', 'leftHip', 'leftKnee'],
          },
          {
            name: 'rightHipAngle',
            joints: ['rightShoulder', 'rightHip', 'rightKnee'],
          },
        ]

      case 'benchpress':
      case 'bench':
        return [
          {
            name: 'leftElbowAngle',
            joints: ['leftShoulder', 'leftElbow', 'leftWrist'],
          },
          {
            name: 'rightElbowAngle',
            joints: ['rightShoulder', 'rightElbow', 'rightWrist'],
          },
          {
            name: 'leftShoulderAngle',
            joints: ['leftBody', 'leftShoulder', 'leftElbow'],
          },
          {
            name: 'rightShoulderAngle',
            joints: ['rightBody', 'rightShoulder', 'rightElbow'],
          },
        ]

      case 'deadlift':
        return [
          {
            name: 'leftKneeAngle',
            joints: ['leftHip', 'leftKnee', 'leftAnkle'],
          },
          {
            name: 'rightKneeAngle',
            joints: ['rightHip', 'rightKnee', 'rightAnkle'],
          },
          {
            name: 'spineAngle',
            joints: ['nose', 'leftHip', 'leftKnee'],
          },
        ]

      default:
        return []
    }
  }, [exerciseType])

  /**
   * Analyze a single frame of keypoints
   */
  const analyzeFrame = useCallback(
    (keypoints: Keypoint[]) => {
      if (!autoAnalyze || keypoints.length === 0) {
        return
      }

      setState((prev) => ({
        ...prev,
        isAnalyzing: true,
      }))

      try {
        // Add to keypoints buffer
        keypointsBufferRef.current.push(...keypoints)
        if (keypointsBufferRef.current.length > 30) {
          keypointsBufferRef.current.shift()
        }

        // Extract angles
        const jointConfigs = getJointAngleConfigs()
        const angles: AngleExtraction = extractAngles(keypoints, jointConfigs)

        // Analyze rep
        const analysis = analyzerRef.current.analyzeRep(keypoints, state.currentRep, exerciseId)

        // Generate voice feedback (only if violations exist)
        let feedback = null
        if (analysis.violations.length > 0) {
          feedback = generateVoiceFeedback(analysis.violations)
        }

        setState((prev) => {
          const newHistory = [...prev.analysisHistory, analysis]
          if (newHistory.length > maxHistorySize) {
            newHistory.shift()
          }

          return {
            ...prev,
            currentAnalysis: analysis,
            voiceFeedback: feedback,
            analysisHistory: newHistory,
            isAnalyzing: false,
          }
        })
      } catch (error) {
        console.error('Form analysis error:', error)
        setState((prev) => ({
          ...prev,
          isAnalyzing: false,
        }))
      }
    },
    [autoAnalyze, state.currentRep, exerciseId, maxHistorySize, getJointAngleConfigs]
  )

  /**
   * Start a new rep
   */
  const startNewRep = useCallback(() => {
    setState((prev) => ({
      ...prev,
      currentRep: prev.currentRep + 1,
      voiceFeedback: null,
    }))

    keypointsBufferRef.current = []
  }, [])

  /**
   * End current rep
   */
  const endRep = useCallback(() => {
    if (state.currentAnalysis) {
      analyzerRef.current.clearFrameBuffer()
      keypointsBufferRef.current = []
    }
  }, [state.currentAnalysis])

  /**
   * Reset form analysis state
   */
  const reset = useCallback(() => {
    analyzerRef.current = new FormAnalyzer(exerciseType)
    keypointsBufferRef.current = []

    setState({
      currentRep: 1,
      currentAnalysis: null,
      voiceFeedback: null,
      isAnalyzing: false,
      analysisHistory: [],
    })
  }, [exerciseType])

  /**
   * Calculate average score from history
   */
  const getAverageScore = useCallback(() => {
    if (state.analysisHistory.length === 0) {
      return 0
    }

    const total = state.analysisHistory.reduce((sum, analysis) => sum + analysis.overallScore, 0)
    return Math.round(total / state.analysisHistory.length)
  }, [state.analysisHistory])

  /**
   * Get best score
   */
  const getBestScore = useCallback(() => {
    if (state.analysisHistory.length === 0) {
      return 0
    }

    return Math.max(...state.analysisHistory.map((a) => a.overallScore))
  }, [state.analysisHistory])

  /**
   * Get worst score
   */
  const getWorstScore = useCallback(() => {
    if (state.analysisHistory.length === 0) {
      return 0
    }

    return Math.min(...state.analysisHistory.map((a) => a.overallScore))
  }, [state.analysisHistory])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (analyzerRef.current) {
        analyzerRef.current.clearFrameBuffer()
      }
    }
  }, [])

  return {
    ...state,
    analyzeFrame,
    startNewRep,
    endRep,
    reset,
    getAverageScore,
    getBestScore,
    getWorstScore,
  }
}
