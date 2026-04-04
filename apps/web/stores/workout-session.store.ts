import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import type { CompletedSet, RepData } from '@fitai/shared-types'

interface WorkoutSessionState {
  sessionId: string | null
  isActive: boolean
  currentExerciseIndex: number
  currentSetNumber: number
  elapsedSeconds: number
  completedSets: CompletedSet[]
  // Pose analysis state
  currentFormScore: number
  repCount: number
  // Actions
  startSession: (sessionId: string) => void
  endSession: () => void
  nextExercise: () => void
  addCompletedSet: (set: CompletedSet) => void
  updateFormScore: (score: number) => void
  incrementRep: (repData: RepData) => void
  resetCurrentExercise: () => void
  tick: () => void
}

export const useWorkoutSessionStore = create<WorkoutSessionState>()(
  devtools(
    (set) => ({
      sessionId: null,
      isActive: false,
      currentExerciseIndex: 0,
      currentSetNumber: 1,
      elapsedSeconds: 0,
      completedSets: [],
      currentFormScore: 100,
      repCount: 0,

      startSession: (sessionId) => set({ sessionId, isActive: true, elapsedSeconds: 0 }),

      endSession: () =>
        set({
          sessionId: null,
          isActive: false,
          currentExerciseIndex: 0,
          currentSetNumber: 1,
          elapsedSeconds: 0,
          completedSets: [],
          currentFormScore: 100,
          repCount: 0,
        }),

      nextExercise: () =>
        set((state) => ({
          currentExerciseIndex: state.currentExerciseIndex + 1,
          currentSetNumber: 1,
          repCount: 0,
          currentFormScore: 100,
        })),

      addCompletedSet: (completedSet) =>
        set((state) => ({
          completedSets: [...state.completedSets, completedSet],
          currentSetNumber: state.currentSetNumber + 1,
          repCount: 0,
        })),

      updateFormScore: (score) => set({ currentFormScore: score }),

      incrementRep: (_repData) =>
        set((state) => ({ repCount: state.repCount + 1 })),

      resetCurrentExercise: () => set({ repCount: 0, currentFormScore: 100 }),

      tick: () => set((state) => ({ elapsedSeconds: state.elapsedSeconds + 1 })),
    }),
    { name: 'workout-session' }
  )
)
