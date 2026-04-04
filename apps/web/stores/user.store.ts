import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import type { SubscriptionTier } from '@fitai/shared-types'

interface UserState {
  subscriptionTier: SubscriptionTier
  hasCompletedOnboarding: boolean
  prefersDarkMode: boolean
  unitSystem: 'metric' | 'imperial'
  // Actions
  setSubscriptionTier: (tier: SubscriptionTier) => void
  completeOnboarding: () => void
  setUnitSystem: (system: 'metric' | 'imperial') => void
}

export const useUserStore = create<UserState>()(
  devtools(
    persist(
      (set) => ({
        subscriptionTier: 'free',
        hasCompletedOnboarding: false,
        prefersDarkMode: true,
        unitSystem: 'metric',

        setSubscriptionTier: (tier) => set({ subscriptionTier: tier }),
        completeOnboarding: () => set({ hasCompletedOnboarding: true }),
        setUnitSystem: (system) => set({ unitSystem: system }),
      }),
      { name: 'fitai-user-preferences' }
    ),
    { name: 'user' }
  )
)
