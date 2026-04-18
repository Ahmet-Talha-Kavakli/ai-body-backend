import { create } from 'zustand'
import type { Badge, UserBadge } from '@/types/social-social'

interface BadgeState {
  badges: Badge[]
  userBadges: UserBadge[]
  recentlyUnlocked: UserBadge[]
  loading: boolean

  setBadges: (badges: Badge[]) => void
  setUserBadges: (badges: UserBadge[]) => void
  addBadge: (badge: UserBadge) => void
  addRecentlyUnlocked: (badge: UserBadge) => void
  isBadgeUnlocked: (badgeId: string) => boolean
  getProgress: (badgeId: string) => number
  getCategory: (category: string) => Badge[]
  clearRecentlyUnlocked: () => void
}

export const useBadgeStore = create<BadgeState>((set, get) => ({
  badges: [],
  userBadges: [],
  recentlyUnlocked: [],
  loading: false,

  setBadges: (badges) => set({ badges }),
  setUserBadges: (badges) => set({ userBadges: badges }),

  addBadge: (badge) =>
    set((state) => ({
      userBadges: [...state.userBadges, badge],
      recentlyUnlocked: [...state.recentlyUnlocked, badge],
    })),

  addRecentlyUnlocked: (badge) =>
    set((state) => ({
      recentlyUnlocked: [...state.recentlyUnlocked, badge],
    })),

  isBadgeUnlocked: (badgeId) => {
    const { userBadges } = get()
    return userBadges.some((ub) => ub.badgeId === badgeId)
  },

  getProgress: (badgeId) => {
    const { userBadges } = get()
    const badge = userBadges.find((ub) => ub.badgeId === badgeId)
    return badge?.progress || 0
  },

  getCategory: (category) => {
    const { badges } = get()
    return badges.filter((b) => b.category === category)
  },

  clearRecentlyUnlocked: () => set({ recentlyUnlocked: [] }),
}))
