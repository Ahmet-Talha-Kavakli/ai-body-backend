import { describe, it, expect } from 'vitest'
import type { UserProfile, FriendSearchResult } from '../types/social'
import * as friendService from '../friendService'

describe('friendService', () => {
  describe('exported functions', () => {
    it('should export searchFriends function', () => {
      expect(typeof friendService.searchFriends).toBe('function')
    })

    it('should export getUserProfile function', () => {
      expect(typeof friendService.getUserProfile).toBe('function')
    })

    it('should export sendFriendRequest function', () => {
      expect(typeof friendService.sendFriendRequest).toBe('function')
    })

    it('should export acceptFriendRequest function', () => {
      expect(typeof friendService.acceptFriendRequest).toBe('function')
    })

    it('should export rejectFriendRequest function', () => {
      expect(typeof friendService.rejectFriendRequest).toBe('function')
    })

    it('should export blockUser function', () => {
      expect(typeof friendService.blockUser).toBe('function')
    })

    it('should export getFriendList function', () => {
      expect(typeof friendService.getFriendList).toBe('function')
    })
  })

  describe('function signatures', () => {
    it('searchFriends accepts a string query parameter', async () => {
      const fn = friendService.searchFriends
      expect(fn.length).toBeGreaterThanOrEqual(1)
    })

    it('getUserProfile accepts a userId string parameter', async () => {
      const fn = friendService.getUserProfile
      expect(fn.length).toBeGreaterThanOrEqual(1)
    })

    it('sendFriendRequest accepts a toUserId string parameter', async () => {
      const fn = friendService.sendFriendRequest
      expect(fn.length).toBeGreaterThanOrEqual(1)
    })

    it('acceptFriendRequest accepts a fromUserId string parameter', async () => {
      const fn = friendService.acceptFriendRequest
      expect(fn.length).toBeGreaterThanOrEqual(1)
    })

    it('rejectFriendRequest accepts a fromUserId string parameter', async () => {
      const fn = friendService.rejectFriendRequest
      expect(fn.length).toBeGreaterThanOrEqual(1)
    })

    it('blockUser accepts a userId string parameter', async () => {
      const fn = friendService.blockUser
      expect(fn.length).toBeGreaterThanOrEqual(1)
    })
  })
})
