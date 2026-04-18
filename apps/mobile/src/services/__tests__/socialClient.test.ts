import { describe, it, expect } from 'vitest'
import socialClient from '../../api/socialClient'

describe('socialClient', () => {
  describe('API structure', () => {
    it('should have friends endpoints', () => {
      expect(socialClient.friends).toBeDefined()
      expect(socialClient.friends.search).toBeDefined()
      expect(socialClient.friends.list).toBeDefined()
      expect(socialClient.friends.getProfile).toBeDefined()
      expect(socialClient.friends.sendRequest).toBeDefined()
      expect(socialClient.friends.acceptRequest).toBeDefined()
      expect(socialClient.friends.rejectRequest).toBeDefined()
      expect(socialClient.friends.block).toBeDefined()
    })

    it('should have challenges endpoints', () => {
      expect(socialClient.challenges).toBeDefined()
      expect(socialClient.challenges.list).toBeDefined()
      expect(socialClient.challenges.get).toBeDefined()
      expect(socialClient.challenges.create).toBeDefined()
      expect(socialClient.challenges.join).toBeDefined()
      expect(socialClient.challenges.getProgress).toBeDefined()
      expect(socialClient.challenges.updateProgress).toBeDefined()
    })

    it('should have leaderboards endpoints', () => {
      expect(socialClient.leaderboards).toBeDefined()
      expect(socialClient.leaderboards.global).toBeDefined()
      expect(socialClient.leaderboards.friends).toBeDefined()
      expect(socialClient.leaderboards.challenge).toBeDefined()
      expect(socialClient.leaderboards.myRank).toBeDefined()
    })

    it('should have badges endpoints', () => {
      expect(socialClient.badges).toBeDefined()
      expect(socialClient.badges.list).toBeDefined()
      expect(socialClient.badges.getUserBadges).toBeDefined()
      expect(socialClient.badges.unlock).toBeDefined()
    })

    it('should have feed endpoints', () => {
      expect(socialClient.feed).toBeDefined()
      expect(socialClient.feed.get).toBeDefined()
      expect(socialClient.feed.like).toBeDefined()
      expect(socialClient.feed.comment).toBeDefined()
    })

    it('should have notifications endpoints', () => {
      expect(socialClient.notifications).toBeDefined()
      expect(socialClient.notifications.list).toBeDefined()
      expect(socialClient.notifications.markAsRead).toBeDefined()
    })
  })

  describe('endpoint types', () => {
    it('all friends endpoints should be functions', () => {
      expect(typeof socialClient.friends.search).toBe('function')
      expect(typeof socialClient.friends.list).toBe('function')
      expect(typeof socialClient.friends.getProfile).toBe('function')
      expect(typeof socialClient.friends.sendRequest).toBe('function')
      expect(typeof socialClient.friends.acceptRequest).toBe('function')
      expect(typeof socialClient.friends.rejectRequest).toBe('function')
      expect(typeof socialClient.friends.block).toBe('function')
    })

    it('all challenges endpoints should be functions', () => {
      expect(typeof socialClient.challenges.list).toBe('function')
      expect(typeof socialClient.challenges.get).toBe('function')
      expect(typeof socialClient.challenges.create).toBe('function')
      expect(typeof socialClient.challenges.join).toBe('function')
      expect(typeof socialClient.challenges.getProgress).toBe('function')
      expect(typeof socialClient.challenges.updateProgress).toBe('function')
    })

    it('all leaderboards endpoints should be functions', () => {
      expect(typeof socialClient.leaderboards.global).toBe('function')
      expect(typeof socialClient.leaderboards.friends).toBe('function')
      expect(typeof socialClient.leaderboards.challenge).toBe('function')
      expect(typeof socialClient.leaderboards.myRank).toBe('function')
    })

    it('all badges endpoints should be functions', () => {
      expect(typeof socialClient.badges.list).toBe('function')
      expect(typeof socialClient.badges.getUserBadges).toBe('function')
      expect(typeof socialClient.badges.unlock).toBe('function')
    })

    it('all feed endpoints should be functions', () => {
      expect(typeof socialClient.feed.get).toBe('function')
      expect(typeof socialClient.feed.like).toBe('function')
      expect(typeof socialClient.feed.comment).toBe('function')
    })

    it('all notifications endpoints should be functions', () => {
      expect(typeof socialClient.notifications.list).toBe('function')
      expect(typeof socialClient.notifications.markAsRead).toBe('function')
    })
  })
})
