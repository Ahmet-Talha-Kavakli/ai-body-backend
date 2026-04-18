import { create } from 'zustand'

interface CoachMessage {
  role: 'user' | 'assistant'
  content: string
}

interface NutritionCoachStoreState {
  messages: CoachMessage[]
  loading: boolean
  error: string | null
  addMessage: (role: 'user' | 'assistant', content: string) => void
  clearMessages: () => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
}

export const useNutritionCoachStore = create<NutritionCoachStoreState>((set) => ({
  messages: [],
  loading: false,
  error: null,

  addMessage: (role: 'user' | 'assistant', content: string) => {
    set((state) => ({
      messages: [...state.messages, { role, content }],
    }))
  },

  clearMessages: () => {
    set({ messages: [] })
  },

  setLoading: (loading: boolean) => {
    set({ loading })
  },

  setError: (error: string | null) => {
    set({ error })
  },
}))
