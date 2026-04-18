import { describe, it, expect } from 'vitest'
import * as badgeService from '../badgeService'

describe('badgeService', () => {
  describe('BADGE_DEFINITIONS', () => {
    it('should have correct number of badge definitions', () => {
      expect(badgeService.BADGE_DEFINITIONS).toHaveLength(50)
    })

    it('should contain badges with valid structure', () => {
      badgeService.BADGE_DEFINITIONS.forEach((badge) => {
        expect(badge).toHaveProperty('id')
        expect(badge).toHaveProperty('name')
        expect(badge).toHaveProperty('description')
        expect(badge).toHaveProperty('icon')
        expect(badge).toHaveProperty('category')
        expect(badge).toHaveProperty('criteria')
        expect(badge).toHaveProperty('rarity')
      })
    })

    it('should contain nutrition badges', () => {
      const nutritionBadges = badgeService.BADGE_DEFINITIONS.filter(
        (b) => b.category === 'nutrition'
      )
      expect(nutritionBadges.length).toBeGreaterThan(0)
    })

    it('should contain health badges', () => {
      const healthBadges = badgeService.BADGE_DEFINITIONS.filter((b) => b.category === 'health')
      expect(healthBadges.length).toBeGreaterThan(0)
    })

    it('should contain workout badges', () => {
      const workoutBadges = badgeService.BADGE_DEFINITIONS.filter(
        (b) => b.category === 'workout'
      )
      expect(workoutBadges.length).toBeGreaterThan(0)
    })

    it('should contain streak badges', () => {
      const streakBadges = badgeService.BADGE_DEFINITIONS.filter((b) => b.category === 'streak')
      expect(streakBadges.length).toBeGreaterThan(0)
    })

    it('should contain social badges', () => {
      const socialBadges = badgeService.BADGE_DEFINITIONS.filter((b) => b.category === 'social')
      expect(socialBadges.length).toBeGreaterThan(0)
    })
  })

  describe('exported functions', () => {
    it('should export getBadges function', () => {
      expect(typeof badgeService.getBadges).toBe('function')
    })

    it('should export getUserBadges function', () => {
      expect(typeof badgeService.getUserBadges).toBe('function')
    })

    it('should export evaluateBadgeCriteria function', () => {
      expect(typeof badgeService.evaluateBadgeCriteria).toBe('function')
    })

    it('should export unlockBadge function', () => {
      expect(typeof badgeService.unlockBadge).toBe('function')
    })

    it('should export isBadgeUnlocked function', () => {
      expect(typeof badgeService.isBadgeUnlocked).toBe('function')
    })

    it('should export getBadgeProgress function', () => {
      expect(typeof badgeService.getBadgeProgress).toBe('function')
    })
  })

  describe('isBadgeUnlocked', () => {
    it('should return true if badge is unlocked', () => {
      const userBadges = [
        {
          badgeId: 'first-workout',
          userId: 'user-1',
          unlockedAt: new Date().toISOString(),
          progress: 100,
        },
      ]

      const result = badgeService.isBadgeUnlocked(userBadges, 'first-workout')
      expect(result).toBe(true)
    })

    it('should return false if badge is not unlocked', () => {
      const userBadges = []

      const result = badgeService.isBadgeUnlocked(userBadges, 'first-workout')
      expect(result).toBe(false)
    })
  })

  describe('getBadgeProgress', () => {
    it('should calculate progress percentage correctly', () => {
      const progress = badgeService.getBadgeProgress('badge-1', 5, 10)
      expect(progress).toBe(50)
    })

    it('should return 100 for completed progress', () => {
      const progress = badgeService.getBadgeProgress('badge-1', 10, 10)
      expect(progress).toBe(100)
    })

    it('should return 0 for no progress', () => {
      const progress = badgeService.getBadgeProgress('badge-1', 0, 10)
      expect(progress).toBe(0)
    })

    it('should cap progress at 100 when current exceeds target', () => {
      const progress = badgeService.getBadgeProgress('badge-1', 15, 10)
      expect(progress).toBe(100)
    })
  })
})
