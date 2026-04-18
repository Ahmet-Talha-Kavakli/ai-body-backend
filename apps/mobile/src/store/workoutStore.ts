import { create } from 'zustand'
import { WorkoutSession, CompletedSet, FormRepData, Keypoint, AngleData } from '../types/workout'

interface WorkoutState {
  currentSession: WorkoutSession | null
  completedSets: CompletedSet[]
  currentRepData: FormRepData[]
  sessionNotes: string
}

interface WorkoutStore extends WorkoutState {
  // Session management
  startSession: (session: WorkoutSession) => void
  endSession: (endedAt: number, finalNotes?: string) => void
  pauseSession: () => void
  resumeSession: () => void
  abandonSession: () => void

  // Exercise tracking
  completeSet: (set: CompletedSet) => void
  updateCurrentExercise: (exerciseId: string | undefined) => void

  // Rep data collection
  addRepData: (repData: FormRepData) => void
  clearRepData: () => void
  getRepDataForCurrentRep: (repNumber: number) => FormRepData | undefined

  // Form analysis
  updateSetFormScore: (setIndex: number, score: number) => void
  updateSetVideoId: (setIndex: number, videoId: string) => void

  // Session state
  updateNotes: (notes: string) => void
  getSessionDuration: () => number
  getCompletedSetCount: () => number
  getCompletedSetsForExercise: (exerciseId: string) => CompletedSet[]

  // Reset
  reset: () => void
}

const initialState: WorkoutState = {
  currentSession: null,
  completedSets: [],
  currentRepData: [],
  sessionNotes: '',
}

export const useWorkoutStore = create<WorkoutStore>((set, get) => ({
  ...initialState,

  startSession: (session: WorkoutSession) =>
    set({
      currentSession: {
        ...session,
        status: 'active',
      },
      completedSets: [],
      currentRepData: [],
      sessionNotes: '',
    }),

  endSession: (endedAt: number, finalNotes?: string) => {
    const session = get().currentSession
    if (session) {
      set({
        currentSession: {
          ...session,
          endedAt,
          status: 'completed',
        },
        sessionNotes: finalNotes || get().sessionNotes,
      })
    }
  },

  pauseSession: () => {
    const session = get().currentSession
    if (session && session.status === 'active') {
      set({
        currentSession: {
          ...session,
          status: 'paused',
        },
      })
    }
  },

  resumeSession: () => {
    const session = get().currentSession
    if (session && session.status === 'paused') {
      set({
        currentSession: {
          ...session,
          status: 'active',
        },
      })
    }
  },

  abandonSession: () => {
    const session = get().currentSession
    if (session) {
      set({
        currentSession: {
          ...session,
          status: 'abandoned',
          endedAt: Date.now(),
        },
      })
    }
  },

  completeSet: (set_: CompletedSet) =>
    set((state) => ({
      completedSets: [...state.completedSets, set_],
    })),

  updateCurrentExercise: (exerciseId: string | undefined) =>
    set((state) => ({
      currentSession: state.currentSession
        ? {
            ...state.currentSession,
            currentExerciseId: exerciseId,
          }
        : null,
    })),

  addRepData: (repData: FormRepData) =>
    set((state) => ({
      currentRepData: [...state.currentRepData, repData],
    })),

  clearRepData: () =>
    set({
      currentRepData: [],
    }),

  getRepDataForCurrentRep: (repNumber: number) => {
    const state = get()
    return state.currentRepData.find((rep) => rep.repNumber === repNumber)
  },

  updateSetFormScore: (setIndex: number, score: number) =>
    set((state) => {
      const updated = [...state.completedSets]
      if (updated[setIndex]) {
        updated[setIndex] = {
          ...updated[setIndex],
          formScore: score,
        }
      }
      return { completedSets: updated }
    }),

  updateSetVideoId: (setIndex: number, videoId: string) =>
    set((state) => {
      const updated = [...state.completedSets]
      if (updated[setIndex]) {
        updated[setIndex] = {
          ...updated[setIndex],
          videoId,
        }
      }
      return { completedSets: updated }
    }),

  updateNotes: (notes: string) =>
    set({
      sessionNotes: notes,
    }),

  getSessionDuration: () => {
    const state = get()
    const session = state.currentSession
    if (!session) return 0
    const endTime = session.endedAt || Date.now()
    return endTime - session.startedAt
  },

  getCompletedSetCount: () => {
    return get().completedSets.length
  },

  getCompletedSetsForExercise: (exerciseId: string) => {
    const state = get()
    return state.completedSets.filter((set_) => set_.exerciseId === exerciseId)
  },

  reset: () => set(initialState),
}))
