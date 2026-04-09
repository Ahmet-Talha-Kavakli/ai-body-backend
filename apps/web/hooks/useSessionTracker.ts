'use client'

import { useRef, useCallback } from 'react'

interface CompletedSet {
  exerciseName: string
  exerciseSlug: string
  muscleGroups: string[]
  setNumber: number
  reps: number
  weightKg?: number
  formScore: number
  repData: unknown[]
}

interface SessionData {
  durationSeconds: number
  caloriesBurned: number
  overallFormScore: number
  heartRateData: unknown[]
  completedSets: CompletedSet[]
}

export function useSessionTracker() {
  const sessionIdRef = useRef<string | null>(null)
  const completedSetsRef = useRef<CompletedSet[]>([])

  const startSession = useCallback(async () => {
    try {
      const res = await fetch('/api/sessions', { method: 'POST' })
      const data = await res.json()
      sessionIdRef.current = data.sessionId
      completedSetsRef.current = []
      return data.sessionId as string
    } catch {
      return null
    }
  }, [])

  const recordSet = useCallback((set: CompletedSet) => {
    completedSetsRef.current.push(set)
  }, [])

  const endSession = useCallback(async (data: Omit<SessionData, 'completedSets'>) => {
    if (!sessionIdRef.current) return
    try {
      await fetch(`/api/sessions/${sessionIdRef.current}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          completedSets: completedSetsRef.current,
        }),
      })
    } catch (e) {
      console.error('Session end error:', e)
    }
  }, [])

  return { startSession, recordSet, endSession, sessionIdRef }
}
