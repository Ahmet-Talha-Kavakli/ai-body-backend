import { create } from 'zustand'
import type { CoachingSession, FormAnalysisFrame, CoachingProgram } from '../types/coaching'

interface CoachingState {
  sessions: CoachingSession[]
  activeSessions: CoachingSession[]
  currentSession: CoachingSession | null
  formScores: FormAnalysisFrame[]
  programs: CoachingProgram[]

  setSessions: (sessions: CoachingSession[]) => void
  addSession: (session: CoachingSession) => void
  updateSession: (sessionId: string, updates: Partial<CoachingSession>) => void
  setCurrentSession: (session: CoachingSession | null) => void
  addFormScore: (frame: FormAnalysisFrame) => void
  setPrograms: (programs: CoachingProgram[]) => void
}

export const useCoachingStore = create<CoachingState>((set, get) => ({
  sessions: [],
  activeSessions: [],
  currentSession: null,
  formScores: [],
  programs: [],

  setSessions: (sessions) => set({ sessions }),

  addSession: (session) => {
    const { sessions } = get()
    set({ sessions: [...sessions, session] })
  },

  updateSession: (sessionId, updates) => {
    const { sessions } = get()
    const updated = sessions.map((s) => (s.id === sessionId ? { ...s, ...updates } : s))
    set({ sessions: updated })
  },

  setCurrentSession: (session) => set({ currentSession: session }),

  addFormScore: (frame) => {
    const { formScores } = get()
    set({ formScores: [...formScores, frame] })
  },

  setPrograms: (programs) => set({ programs }),
}))
