import { create } from 'zustand'
import type { Challenge, ChallengeProgress, ChallengeWithProgress } from '@/types/challenge'

interface ChallengeState {
  challenges: ChallengeWithProgress[]
  myChallenges: ChallengeWithProgress[]
  loading: boolean
  error: string | null

  setChallenges: (challenges: ChallengeWithProgress[]) => void
  setMyChallenges: (challenges: ChallengeWithProgress[]) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void

  addChallenge: (challenge: ChallengeWithProgress) => void
  updateChallengeProgress: (challengeId: string, value: number) => void
  joinChallenge: (challenge: ChallengeWithProgress) => void
  leaveChallenge: (challengeId: string) => void
  getActiveChallenges: () => ChallengeWithProgress[]
  getCompletedChallenges: () => ChallengeWithProgress[]
}

export const useChallengeStore = create<ChallengeState>((set, get) => ({
  challenges: [],
  myChallenges: [],
  loading: false,
  error: null,

  setChallenges: (challenges) => set({ challenges }),
  setMyChallenges: (challenges) => set({ myChallenges: challenges }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),

  addChallenge: (challenge) =>
    set((state) => ({
      challenges: [...state.challenges, challenge],
    })),

  updateChallengeProgress: (challengeId, value) =>
    set((state) => ({
      myChallenges: state.myChallenges.map((c) =>
        c.challenge.id === challengeId
          ? { ...c, progress: { ...c.progress, currentValue: value } }
          : c
      ),
    })),

  joinChallenge: (challenge) =>
    set((state) => ({
      myChallenges: [...state.myChallenges, challenge],
    })),

  leaveChallenge: (challengeId) =>
    set((state) => ({
      myChallenges: state.myChallenges.filter((c) => c.challenge.id !== challengeId),
    })),

  getActiveChallenges: () => {
    const { myChallenges } = get()
    return myChallenges.filter((c) => c.challenge.status === 'active')
  },

  getCompletedChallenges: () => {
    const { myChallenges } = get()
    return myChallenges.filter((c) => c.challenge.status === 'completed')
  },
}))
