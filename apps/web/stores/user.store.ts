'use client'

import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import type { SubscriptionTier } from '@fitai/shared-types'

interface UserState {
  subscriptionTier: SubscriptionTier
  hasCompletedOnboarding: boolean
  unitSystem: 'metric' | 'imperial'
  // Actions
  setSubscriptionTier: (tier: SubscriptionTier) => void
  completeOnboarding: () => void
  setUnitSystem: (system: 'metric' | 'imperial') => void
}

export const useUserStore = create<UserState>()(
  devtools(
    (set) => ({
      subscriptionTier: 'free',
      hasCompletedOnboarding: false,
      unitSystem: 'metric',

      setSubscriptionTier: (tier) => set({ subscriptionTier: tier }),
      completeOnboarding: () => set({ hasCompletedOnboarding: true }),
      setUnitSystem: (system) => set({ unitSystem: system }),
    }),
    { name: 'user' }
  )
)
