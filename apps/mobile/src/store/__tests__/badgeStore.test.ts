import { describe, it, expect, beforeEach } from 'vitest'
import { useBadgeStore } from '../badgeStore'
import type { Badge, UserBadge } from '@/types/social-social'

describe('BadgeStore', () => {
  beforeEach(() => {
    useBadgeStore.setState({
      badges: [],
      userBadges: [],
      recentlyUnlocked: [],
      loading: false,
    })
  })

  function getState() {
    return useBadgeStore.getState()
  }

  describe('State Initialization', () => {
    it('initializes with empty badges array', () => {
      const state = getState()
      expect(state.badges).toEqual([])
    })

    it('initializes with empty userBadges array', () => {
      const state = getState()
      expect(state.userBadges).toEqual([])
    })

    it('initializes with empty recentlyUnlocked array', () => {
      const state = getState()
      expect(state.recentlyUnlocked).toEqual([])
    })

    it('initializes with loading false', () => {
      const state = getState()
      expect(state.loading).toBe(false)
    })
  })

  describe('setBadges', () => {
    it('sets badges array', () => {
      const mockBadges = [createMockBadge('badge-1'), createMockBadge('badge-2')]
      getState().setBadges(mockBadges)

      expect(getState().badges).toEqual(mockBadges)
      expect(getState().badges).toHaveLength(2)
    })

    it('replaces existing badges', () => {
      const badges1 = [createMockBadge('badge-1')]
      const badges2 = [createMockBadge('badge-2'), createMockBadge('badge-3')]

      getState().setBadges(badges1)
      getState().setBadges(badges2)

      expect(getState().badges).toEqual(badges2)
      expect(getState().badges).toHaveLength(2)
    })
  })

  describe('setUserBadges', () => {
    it('sets user badges array', () => {
      const mockUserBadges = [
        createMockUserBadge('badge-1', 'user-1'),
        createMockUserBadge('badge-2', 'user-1'),
      ]
      getState().setUserBadges(mockUserBadges)

      expect(getState().userBadges).toEqual(mockUserBadges)
      expect(getState().userBadges).toHaveLength(2)
    })

    it('replaces existing user badges', () => {
      const badges1 = [createMockUserBadge('badge-1', 'user-1')]
      const badges2 = [createMockUserBadge('badge-2', 'user-1')]

      getState().setUserBadges(badges1)
      getState().setUserBadges(badges2)

      expect(getState().userBadges).toEqual(badges2)
    })
  })

  describe('addBadge', () => {
    it('adds badge to userBadges and recentlyUnlocked', () => {
      const userBadge = createMockUserBadge('badge-1', 'user-1')
      getState().addBadge(userBadge)

      expect(getState().userBadges).toContainEqual(userBadge)
      expect(getState().recentlyUnlocked).toContainEqual(userBadge)
    })

    it('adds multiple badges', () => {
      const badge1 = createMockUserBadge('badge-1', 'user-1')
      const badge2 = createMockUserBadge('badge-2', 'user-1')

      getState().addBadge(badge1)
      getState().addBadge(badge2)

      expect(getState().userBadges).toHaveLength(2)
      expect(getState().recentlyUnlocked).toHaveLength(2)
    })

    it('preserves existing badges when adding new', () => {
      const badge1 = createMockUserBadge('badge-1', 'user-1')
      const badge2 = createMockUserBadge('badge-2', 'user-1')

      getState().addBadge(badge1)
      expect(getState().userBadges).toHaveLength(1)

      getState().addBadge(badge2)
      expect(getState().userBadges).toHaveLength(2)
      expect(getState().userBadges[0].badgeId).toBe('badge-1')
    })
  })

  describe('addRecentlyUnlocked', () => {
    it('adds badge to recentlyUnlocked', () => {
      const userBadge = createMockUserBadge('badge-1', 'user-1')
      getState().addRecentlyUnlocked(userBadge)

      expect(getState().recentlyUnlocked).toContainEqual(userBadge)
    })

    it('does not add to userBadges', () => {
      const userBadge = createMockUserBadge('badge-1', 'user-1')
      getState().addRecentlyUnlocked(userBadge)

      expect(getState().userBadges).toHaveLength(0)
      expect(getState().recentlyUnlocked).toHaveLength(1)
    })

    it('adds multiple recently unlocked badges', () => {
      const badge1 = createMockUserBadge('badge-1', 'user-1')
      const badge2 = createMockUserBadge('badge-2', 'user-1')

      getState().addRecentlyUnlocked(badge1)
      getState().addRecentlyUnlocked(badge2)

      expect(getState().recentlyUnlocked).toHaveLength(2)
    })
  })

  describe('isBadgeUnlocked', () => {
    it('returns true if badge is unlocked', () => {
      const userBadge = createMockUserBadge('badge-1', 'user-1')
      getState().setUserBadges([userBadge])

      expect(getState().isBadgeUnlocked('badge-1')).toBe(true)
    })

    it('returns false if badge is not unlocked', () => {
      const userBadge = createMockUserBadge('badge-1', 'user-1')
      getState().setUserBadges([userBadge])

      expect(getState().isBadgeUnlocked('badge-2')).toBe(false)
    })

    it('returns false if no badges are unlocked', () => {
      expect(getState().isBadgeUnlocked('badge-1')).toBe(false)
    })

    it('finds badge among multiple unlocked badges', () => {
      const badge1 = createMockUserBadge('badge-1', 'user-1')
      const badge2 = createMockUserBadge('badge-2', 'user-1')
      const badge3 = createMockUserBadge('badge-3', 'user-1')

      getState().setUserBadges([badge1, badge2, badge3])

      expect(getState().isBadgeUnlocked('badge-2')).toBe(true)
    })
  })

  describe('getProgress', () => {
    it('returns progress for unlocked badge', () => {
      const userBadge = createMockUserBadge('badge-1', 'user-1', 50)
      getState().setUserBadges([userBadge])

      expect(getState().getProgress('badge-1')).toBe(50)
    })

    it('returns 0 for non-existent badge', () => {
      expect(getState().getProgress('badge-1')).toBe(0)
    })

    it('returns correct progress for specific badge', () => {
      const badge1 = createMockUserBadge('badge-1', 'user-1', 25)
      const badge2 = createMockUserBadge('badge-2', 'user-1', 75)

      getState().setUserBadges([badge1, badge2])

      expect(getState().getProgress('badge-1')).toBe(25)
      expect(getState().getProgress('badge-2')).toBe(75)
    })
  })

  describe('getCategory', () => {
    it('returns badges for specific category', () => {
      const nutritionBadge = createMockBadge('badge-1', 'nutrition')
      const workoutBadge = createMockBadge('badge-2', 'workout')
      const anotherNutrition = createMockBadge('badge-3', 'nutrition')

      getState().setBadges([nutritionBadge, workoutBadge, anotherNutrition])

      const nutritionBadges = getState().getCategory('nutrition')

      expect(nutritionBadges).toHaveLength(2)
      expect(nutritionBadges[0].category).toBe('nutrition')
    })

    it('returns empty array for non-existent category', () => {
      const badge = createMockBadge('badge-1', 'nutrition')
      getState().setBadges([badge])

      expect(getState().getCategory('social')).toEqual([])
    })

    it('returns all badges from category', () => {
      const badges = [
        createMockBadge('badge-1', 'health'),
        createMockBadge('badge-2', 'health'),
        createMockBadge('badge-3', 'health'),
        createMockBadge('badge-4', 'streak'),
      ]

      getState().setBadges(badges)

      const healthBadges = getState().getCategory('health')

      expect(healthBadges).toHaveLength(3)
      expect(healthBadges.every(b => b.category === 'health')).toBe(true)
    })
  })

  describe('clearRecentlyUnlocked', () => {
    it('clears recently unlocked badges', () => {
      const badge1 = createMockUserBadge('badge-1', 'user-1')
      const badge2 = createMockUserBadge('badge-2', 'user-1')

      getState().addRecentlyUnlocked(badge1)
      getState().addRecentlyUnlocked(badge2)

      expect(getState().recentlyUnlocked).toHaveLength(2)

      getState().clearRecentlyUnlocked()

      expect(getState().recentlyUnlocked).toEqual([])
    })

    it('does not clear userBadges when clearing recently unlocked', () => {
      const badge1 = createMockUserBadge('badge-1', 'user-1')
      const badge2 = createMockUserBadge('badge-2', 'user-1')

      getState().setUserBadges([badge1])
      getState().addRecentlyUnlocked(badge2)

      getState().clearRecentlyUnlocked()

      expect(getState().userBadges).toHaveLength(1)
      expect(getState().recentlyUnlocked).toHaveLength(0)
    })
  })

  describe('integration scenarios', () => {
    it('unlocks badge and marks as recently unlocked', () => {
      const badges = [createMockBadge('badge-1', 'nutrition')]
      const userBadge = createMockUserBadge('badge-1', 'user-1', 100)

      getState().setBadges(badges)
      getState().addBadge(userBadge)

      expect(getState().isBadgeUnlocked('badge-1')).toBe(true)
      expect(getState().recentlyUnlocked).toContainEqual(userBadge)
      expect(getState().getProgress('badge-1')).toBe(100)
    })

    it('manages multiple badge categories', () => {
      const badges = [
        createMockBadge('badge-1', 'nutrition'),
        createMockBadge('badge-2', 'nutrition'),
        createMockBadge('badge-3', 'workout'),
        createMockBadge('badge-4', 'health'),
      ]

      getState().setBadges(badges)

      expect(getState().getCategory('nutrition')).toHaveLength(2)
      expect(getState().getCategory('workout')).toHaveLength(1)
      expect(getState().getCategory('health')).toHaveLength(1)
    })

    it('tracks user progress toward badges', () => {
      const badge1 = createMockUserBadge('badge-1', 'user-1', 25)
      const badge2 = createMockUserBadge('badge-2', 'user-1', 100)

      getState().setUserBadges([badge1, badge2])

      expect(getState().getProgress('badge-1')).toBe(25)
      expect(getState().getProgress('badge-2')).toBe(100)
      expect(getState().isBadgeUnlocked('badge-1')).toBe(true)
      expect(getState().isBadgeUnlocked('badge-2')).toBe(true)
    })
  })
})

// Helper functions
function createMockBadge(
  id: string,
  category: 'nutrition' | 'health' | 'workout' | 'social' | 'streak' = 'nutrition'
): Badge {
  return {
    id,
    name: `Badge ${id}`,
    description: `Description for ${id}`,
    icon: 'icon.png',
    category,
    criteria: { type: 'workouts', target: 10 },
    rarity: 'common',
  }
}

function createMockUserBadge(
  badgeId: string,
  userId: string,
  progress: number = 100
): UserBadge {
  return {
    badgeId,
    userId,
    unlockedAt: new Date().toISOString(),
    progress,
  }
}
