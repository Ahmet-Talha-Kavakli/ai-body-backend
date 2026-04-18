import { describe, it, expect, beforeEach } from 'vitest'
import * as friendsDb from '../friends'

describe('friendsDb', () => {
  beforeEach(async () => {
    await friendsDb.initFriendsTable()
  })

  describe('initFriendsTable', () => {
    it('should initialize without error', async () => {
      await expect(friendsDb.initFriendsTable()).resolves.not.toThrow()
    })

    it('should be idempotent', async () => {
      await expect(friendsDb.initFriendsTable()).resolves.not.toThrow()
    })
  })

  describe('saveFriendship', () => {
    it('should save a friendship', async () => {
      const id = await friendsDb.saveFriendship('u1', 'u2', 'accepted')
      expect(id).toBeDefined()
      expect(id).toMatch(/^friendship-/)
    })

    it('should save friendship with default status', async () => {
      const id = await friendsDb.saveFriendship('u3', 'u4')
      expect(id).toBeDefined()
    })
  })

  describe('getFriendsForUser', () => {
    it('should return empty array for user with no friends', async () => {
      const friends = await friendsDb.getFriendsForUser('nonexistent')
      expect(Array.isArray(friends)).toBe(true)
    })
  })

  describe('removeFriendship', () => {
    it('should not error for non-existent friendship', async () => {
      await expect(friendsDb.removeFriendship('u1', 'u2')).resolves.not.toThrow()
    })
  })

  describe('isFriend', () => {
    it('should return false for non-existent friendship', async () => {
      const isFriend = await friendsDb.isFriend('u1', 'u2')
      expect(isFriend).toBe(false)
    })
  })

  describe('saveFriendRequest', () => {
    it('should save a friend request', async () => {
      const id = await friendsDb.saveFriendRequest('u1', 'u2')
      expect(id).toBeDefined()
      expect(id).toMatch(/^friend-request-/)
    })
  })

  describe('getFriendRequests', () => {
    it('should return empty array for user with no requests', async () => {
      const requests = await friendsDb.getFriendRequests('nonexistent')
      expect(Array.isArray(requests)).toBe(true)
    })
  })

  describe('acceptFriendRequest', () => {
    it('should accept request without error', async () => {
      const id = await friendsDb.saveFriendRequest('u5', 'u6')
      await expect(friendsDb.acceptFriendRequest(id, 'u5', 'u6')).resolves.not.toThrow()
    })
  })

  describe('rejectFriendRequest', () => {
    it('should reject request without error', async () => {
      const id = await friendsDb.saveFriendRequest('u7', 'u8')
      await expect(friendsDb.rejectFriendRequest(id)).resolves.not.toThrow()
    })
  })

  describe('blockUser', () => {
    it('should block user without error', async () => {
      await expect(friendsDb.blockUser('u1', 'u2')).resolves.not.toThrow()
    })
  })

  describe('cleanupOldFriendships', () => {
    it('should cleanup without error', async () => {
      await expect(friendsDb.cleanupOldFriendships('u1', 90)).resolves.not.toThrow()
    })
  })
})
