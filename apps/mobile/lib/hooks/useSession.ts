import { useState, useEffect, useCallback } from 'react'
import { SessionOrchestrator } from '@/lib/session/session-orchestrator'

/**
 * SessionState: Current state of a session tracked by useSession hook
 */
export interface SessionState {
  sessionId: string
  exercise: string
  isRunning: boolean
  error: Error | null
}

/**
 * useSession: React hook that tracks session lifecycle state
 *
 * Purpose: Connect UI to SessionOrchestrator, tracking:
 * - sessionId: Unique session identifier
 * - exercise: Current exercise name
 * - isRunning: Whether session is active
 * - error: Any errors that occurred during session
 *
 * Behavior:
 * - On mount: Get initial state from orchestrator
 * - Subscribe to 'error' events: Update error state
 * - Subscribe to 'shutdown' events: Update isRunning to false
 * - On unmount: Clean up event listeners
 *
 * @param orchestrator SessionOrchestrator instance
 * @returns SessionState containing session tracking data
 */
export function useSession(orchestrator: SessionOrchestrator | null): SessionState {
  // Initialize state from orchestrator
  const [state, setState] = useState<SessionState>(() => {
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
  })

  // Handle error events with useCallback to prevent re-subscription
  const handleError = useCallback((error: Error) => {
    setState((prevState) => ({
      ...prevState,
      error,
    }))
  }, [])

  // Handle shutdown events
  const handleShutdown = useCallback(() => {
    setState((prevState) => ({
      ...prevState,
      isRunning: false,
    }))
  }, [])

  // Subscribe to events on mount
  useEffect(() => {
    if (!orchestrator) return

    // Subscribe to error events
    orchestrator.on('error', handleError)

    // Subscribe to shutdown events
    orchestrator.on('shutdown', handleShutdown)

    // Cleanup on unmount
    return () => {
      orchestrator.off('error', handleError)
      orchestrator.off('shutdown', handleShutdown)
    }
  }, [orchestrator, handleError, handleShutdown])

  return state
}
