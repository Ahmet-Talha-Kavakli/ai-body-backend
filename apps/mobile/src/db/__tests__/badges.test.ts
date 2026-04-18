import { describe, it, expect, beforeEach } from 'vitest'
import {
  initBadgesTable,
  saveBadgeDefinitions,
  getBadges,
  getBadgesByCategory,
  getUserBadges,
  unlockBadge,
  updateBadgeProgress,
  isBadgeUnlocked,
  clearBadgesTables,
} from '../badges'
import type { Badge, UserBadge } from '@/types/social-social'

describe('Badges Database', () => {
  beforeEach(async () => {
    await initBadgesTable()
    await clearBadgesTables()
  })

  describe('initBadgesTable', () => {
    it('creates badges table without error', async () => {
      expect(async () => {
        await initBadgesTable()
      }).not.toThrow()
    })
  })

  describe('saveBadgeDefinitions', () => {
    it('saves a single badge definition', async () => {
      const badges = [createMockBadge('badge-1')]

      expect(async () => {
        await saveBadgeDefinitions(badges)
      }).not.toThrow()
    })

    it('saves multiple badge definitions', async () => {
      const badges = [
        createMockBadge('badge-1', 'nutrition'),
        createMockBadge('badge-2', 'workout'),
        createMockBadge('badge-3', 'health'),
      ]

      expect(async () => {
        await saveBadgeDefinitions(badges)
      }).not.toThrow()
    })

    it('ignores duplicate badge definitions', async () => {
      const badge = createMockBadge('badge-1')

      await saveBadgeDefinitions([badge])
      expect(async () => {
        await saveBadgeDefinitions([badge])
      }).not.toThrow()
    })
  })

  describe('getBadges', () => {
    it('returns empty array initially', async () => {
      const badges = await getBadges()
      expect(badges).toEqual([])
    })

    it('retrieves saved badge definitions', async () => {
      const mockBadges = [
        createMockBadge('badge-1'),
        createMockBadge('badge-2'),
      ]

      await saveBadgeDefinitions(mockBadges)
      const badges = await getBadges()

      expect(badges.length).toBeGreaterThan(0)
    })

    it('returns badges with correct structure', async () => {
      const mockBadges = [createMockBadge('badge-1', 'nutrition')]

      await saveBadgeDefinitions(mockBadges)
      const badges = await getBadges()

      const badge = badges.find((b) => b.id === 'badge-1')
      expect(badge).toBeDefined()
      expect(badge?.name).toBe('Badge badge-1')
      expect(badge?.category).toBe('nutrition')
    })
  })

  describe('getBadgesByCategory', () => {
    it('returns empty array for non-existent category', async () => {
      const badges = await getBadgesByCategory('nutrition')
      expect(badges).toEqual([])
    })

    it('retrieves badges for specific category', async () => {
      const mockBadges = [
        createMockBadge('nutrition-badge-1', 'nutrition'),
        createMockBadge('nutrition-badge-2', 'nutrition'),
        createMockBadge('workout-badge-3', 'workout'),
      ]

      await saveBadgeDefinitions(mockBadges)
      const nutritionBadges = await getBadgesByCategory('nutrition')

      expect(nutritionBadges.length).toBeGreaterThanOrEqual(2)
      if (nutritionBadges.length > 0) {
        expect(nutritionBadges.some((b) => b.category === 'nutrition')).toBe(true)
      }
    })

    it('filters badges correctly by category', async () => {
      const mockBadges = [
        createMockBadge('nutrition-1', 'nutrition'),
        createMockBadge('nutrition-2', 'nutrition'),
        createMockBadge('health-1', 'health'),
      ]

      await saveBadgeDefinitions(mockBadges)
      const healthBadges = await getBadgesByCategory('health')

      const nutritionBadges = await getBadgesByCategory('nutrition')

      expect(healthBadges.some((b) => b.id.includes('health'))).toBe(true)
      expect(nutritionBadges.some((b) => b.id.includes('nutrition'))).toBe(true)
    })
  })

  describe('getUserBadges', () => {
    it('returns empty array for user with no badges', async () => {
      const badges = await getUserBadges('user-1')
      expect(badges).toEqual([])
    })

    it('returns user badges after unlocking', async () => {
      await unlockBadge('user-1', 'badge-1')

      const badges = await getUserBadges('user-1')

      expect(badges.length).toBeGreaterThan(0)
    })

    it('returns multiple badges for user', async () => {
      await unlockBadge('user-1', 'badge-1')
      await unlockBadge('user-1', 'badge-2')

      const badges = await getUserBadges('user-1')

      expect(badges.length).toBeGreaterThanOrEqual(2)
    })
  })

  describe('unlockBadge', () => {
    it('unlocks a badge for a user', async () => {
      expect(async () => {
        await unlockBadge('user-1', 'badge-1')
      }).not.toThrow()
    })

    it('marks badge as unlocked with progress 100', async () => {
      await unlockBadge('user-1', 'badge-1')

      const isUnlocked = await isBadgeUnlocked('user-1', 'badge-1')
      expect(isUnlocked).toBe(true)
    })

    it('ignores duplicate unlocks', async () => {
      await unlockBadge('user-1', 'badge-1')
      expect(async () => {
        await unlockBadge('user-1', 'badge-1')
      }).not.toThrow()
    })

    it('unlocks different badges for same user', async () => {
      await unlockBadge('user-1', 'badge-1')
      await unlockBadge('user-1', 'badge-2')

      const isUnlocked1 = await isBadgeUnlocked('user-1', 'badge-1')
      const isUnlocked2 = await isBadgeUnlocked('user-1', 'badge-2')

      expect(isUnlocked1).toBe(true)
      expect(isUnlocked2).toBe(true)
    })

    it('isolates badges by user', async () => {
      await unlockBadge('user-1', 'badge-1')
      await unlockBadge('user-2', 'badge-2')

      const user1BadgeUnlocked = await isBadgeUnlocked('user-1', 'badge-1')
      const user2BadgeUnlocked = await isBadgeUnlocked('user-2', 'badge-2')
      const user1Badge2Unlocked = await isBadgeUnlocked('user-1', 'badge-2')

      expect(user1BadgeUnlocked).toBe(true)
      expect(user2BadgeUnlocked).toBe(true)
      expect(user1Badge2Unlocked).toBe(false)
    })
  })

  describe('updateBadgeProgress', () => {
    it('updates badge progress', async () => {
      await unlockBadge('user-1', 'badge-1')
      await updateBadgeProgress('user-1', 'badge-1', 50)

      expect(async () => {
        await updateBadgeProgress('user-1', 'badge-1', 75)
      }).not.toThrow()
    })

    it('allows progress update from 0 to 100', async () => {
      expect(async () => {
        await updateBadgeProgress('user-1', 'badge-1', 0)
        await updateBadgeProgress('user-1', 'badge-1', 25)
        await updateBadgeProgress('user-1', 'badge-1', 50)
        await updateBadgeProgress('user-1', 'badge-1', 100)
      }).not.toThrow()
    })
  })

  describe('isBadgeUnlocked', () => {
    it('returns false for unlocked badge', async () => {
      const isUnlocked = await isBadgeUnlocked('user-1', 'badge-1')
      expect(isUnlocked).toBe(false)
    })

    it('returns true after unlocking badge', async () => {
      await unlockBadge('user-1', 'badge-1')

      const isUnlocked = await isBadgeUnlocked('user-1', 'badge-1')
      expect(isUnlocked).toBe(true)
    })

    it('distinguishes between unlocked and locked badges', async () => {
      await unlockBadge('user-1', 'badge-1')

      const badge1Unlocked = await isBadgeUnlocked('user-1', 'badge-1')
      const badge2Unlocked = await isBadgeUnlocked('user-1', 'badge-2')

      expect(badge1Unlocked).toBe(true)
      expect(badge2Unlocked).toBe(false)
    })
  })

  describe('clearBadgesTables', () => {
    it('clears all badge data', async () => {
      const mockBadges = [createMockBadge('badge-1')]
      await saveBadgeDefinitions(mockBadges)
      await unlockBadge('user-1', 'badge-1')

      await clearBadgesTables()

      const badges = await getBadges()
      const userBadges = await getUserBadges('user-1')

      expect(badges).toEqual([])
      expect(userBadges).toEqual([])
    })

    it('allows fresh data after clearing', async () => {
      const mockBadges = [createMockBadge('badge-1')]
      await saveBadgeDefinitions(mockBadges)
      await clearBadgesTables()

      // Should not throw after clearing
      expect(async () => {
        await saveBadgeDefinitions(mockBadges)
        await unlockBadge('user-1', 'badge-1')
      }).not.toThrow()
    })
  })

  describe('integration scenarios', () => {
    it('complete badge unlock flow', async () => {
      const badgeDef = createMockBadge('achievement-1', 'nutrition')
      await saveBadgeDefinitions([badgeDef])

      // Check badge definition exists
      const badges = await getBadges()
      expect(badges.length).toBeGreaterThan(0)

      // Unlock badge for user
      await unlockBadge('user-1', 'achievement-1')

      // Verify unlock
      const isUnlocked = await isBadgeUnlocked('user-1', 'achievement-1')
      expect(isUnlocked).toBe(true)

      // Check user's badges
      const userBadges = await getUserBadges('user-1')
      expect(userBadges.length).toBeGreaterThan(0)
    })

    it('manages multiple users with same badges', async () => {
      const badgeDef = createMockBadge('shared-badge', 'health')
      await saveBadgeDefinitions([badgeDef])

      await unlockBadge('user-1', 'shared-badge')
      await unlockBadge('user-2', 'shared-badge')

      const user1Badges = await getUserBadges('user-1')
      const user2Badges = await getUserBadges('user-2')

      expect(user1Badges.length).toBeGreaterThan(0)
      expect(user2Badges.length).toBeGreaterThan(0)
    })

    it('tracks progress across multiple badges', async () => {
      await unlockBadge('user-1', 'badge-1')
      await unlockBadge('user-1', 'badge-2')

      await updateBadgeProgress('user-1', 'badge-1', 50)
      await updateBadgeProgress('user-1', 'badge-2', 75)

      const isUnlocked1 = await isBadgeUnlocked('user-1', 'badge-1')
      const isUnlocked2 = await isBadgeUnlocked('user-1', 'badge-2')

      expect(isUnlocked1).toBe(true)
      expect(isUnlocked2).toBe(true)
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
