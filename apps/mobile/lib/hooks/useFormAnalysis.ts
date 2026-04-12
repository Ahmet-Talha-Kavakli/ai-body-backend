import { useState, useEffect, useCallback } from 'react'
import { SessionOrchestrator } from '@/lib/session/session-orchestrator'
import { FormAnalysisResult } from '@/lib/session/types'

/**
 * FormAnalysisState: Current form analysis tracking state
 */
export interface FormAnalysisState {
  lastAnalysis: FormAnalysisResult | null
  repCount: number
  avgFormScore: number
}

/**
 * useFormAnalysis: React hook that tracks form analysis results
 *
 * Purpose: Connect UI to form analysis events, tracking:
 * - lastAnalysis: Most recent form analysis result
 * - repCount: Maximum rep number seen (tracks total reps completed)
 * - avgFormScore: Running average of all form scores
 *
 * Behavior:
 * - On mount: Initialize with null analysis, 0 reps, 0 score
 * - Subscribe to 'analysis' events: Update state with new analysis
 * - Update repCount: Track maximum repNumber from all analyses
 * - Calculate avgFormScore: Running average of all form scores
 * - On unmount: Clean up event listener
 *
 * @param orchestrator SessionOrchestrator instance
 * @returns FormAnalysisState containing form tracking data
 */
export function useFormAnalysis(orchestrator: SessionOrchestrator | null): FormAnalysisState {
  // Use internal state to track form scores for average calculation
  const [formScores, setFormScores] = useState<number[]>([])

  const [state, setState] = useState<FormAnalysisState>(() => ({
    lastAnalysis: null,
    repCount: 0,
    avgFormScore: 0,
  }))

  // Handle analysis events with useCallback to prevent re-subscription
  const handleAnalysis = useCallback((analysis: FormAnalysisResult) => {
    // Update form scores list
    setFormScores((prevScores) => {
      const updatedScores = [...prevScores, analysis.formScore]
      const avgScore =
        updatedScores.length > 0
          ? updatedScores.reduce((a, b) => a + b, 0) / updatedScores.length
          : 0

      // Update rep count (track maximum rep number seen)
      setState((prevState) => ({
        lastAnalysis: analysis,
        repCount: Math.max(prevState.repCount, analysis.repNumber),
        avgFormScore: avgScore,
      }))

      return updatedScores
    })
  }, [])

  // Subscribe to events on mount
  useEffect(() => {
    if (!orchestrator) return

    // Subscribe to analysis events
    orchestrator.on('analysis', handleAnalysis)

    // Cleanup on unmount
    return () => {
      orchestrator.off('analysis', handleAnalysis)
    }
  }, [orchestrator, handleAnalysis])

  return state
}
