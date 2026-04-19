import { describe, it, expect, beforeEach, vi } from 'vitest'
import * as agoraTokenService from '../agoraTokenService'

// Mock the API client
vi.mock('../apiClient', () => ({
  default: {
    post: vi.fn(),
  },
}))

import apiClient from '../apiClient'

describe('agoraTokenService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Clear token cache between tests
    agoraTokenService.clearTokenCache('session-1')
    agoraTokenService.clearTokenCache('session-2')
  })

  describe('generateTokens', () => {
    it('should generate and cache tokens', async () => {
      const mockResponse = {
        channelName: 'coaching-session-1',
        userToken: 'user-token-123',
        coachToken: 'coach-token-456',
        expiresIn: 86400, // 24 hours
      }

      vi.mocked(apiClient.post).mockResolvedValueOnce(mockResponse)

      const result = await agoraTokenService.generateTokens('session-1')

      expect(result).toEqual(mockResponse)
      expect(apiClient.post).toHaveBeenCalledWith(
        '/api/coaching/sessions/session-1/agora-tokens',
        {}
      )
    })

    it('should cache tokens with correct expiry time', async () => {
      const expiresIn = 3600 // 1 hour
      const mockResponse = {
        channelName: 'coaching-session-1',
        userToken: 'user-token-123',
        coachToken: 'coach-token-456',
        expiresIn,
      }

      vi.mocked(apiClient.post).mockResolvedValueOnce(mockResponse)

      const beforeTime = Date.now()
      await agoraTokenService.generateTokens('session-1')
      const afterTime = Date.now()

      const expiry = agoraTokenService.getTokenExpiry('session-1')
      expect(expiry).toBeDefined()
      expect(expiry!).toBeGreaterThanOrEqual(beforeTime + expiresIn * 1000)
      expect(expiry!).toBeLessThanOrEqual(afterTime + expiresIn * 1000 + 100)
    })
  })

  describe('refreshTokens', () => {
    it('should refresh tokens when about to expire', async () => {
      const expiresIn = 600 // 10 minutes, less than 30 minute threshold
      const mockResponse = {
        channelName: 'coaching-session-1',
        userToken: 'new-user-token',
        coachToken: 'new-coach-token',
        expiresIn: 86400,
      }

      // First generate tokens that are about to expire
      vi.mocked(apiClient.post).mockResolvedValueOnce({
        channelName: 'coaching-session-1',
        userToken: 'old-user-token',
        coachToken: 'old-coach-token',
        expiresIn, // Only 10 minutes left
      })

      await agoraTokenService.generateTokens('session-1')

      // Now refresh
      vi.mocked(apiClient.post).mockResolvedValueOnce(mockResponse)

      const refreshed = await agoraTokenService.refreshTokens('session-1')

      expect(refreshed).toBe(true)
      expect(apiClient.post).toHaveBeenCalledTimes(2)
    })

    it('should not refresh if tokens still valid', async () => {
      const mockResponse = {
        channelName: 'coaching-session-1',
        userToken: 'user-token-123',
        coachToken: 'coach-token-456',
        expiresIn: 86400, // 24 hours, well above threshold
      }

      vi.mocked(apiClient.post).mockResolvedValueOnce(mockResponse)

      await agoraTokenService.generateTokens('session-1')

      // Try to refresh - should not call API again
      const refreshed = await agoraTokenService.refreshTokens('session-1')

      expect(refreshed).toBe(false)
      expect(apiClient.post).toHaveBeenCalledTimes(1)
    })

    it('should handle refresh errors', async () => {
      vi.mocked(apiClient.post).mockRejectedValueOnce(new Error('Network error'))

      await expect(agoraTokenService.refreshTokens('session-1')).rejects.toThrow('Network error')
    })
  })

  describe('getTokens', () => {
    it('should return cached tokens', async () => {
      const mockResponse = {
        channelName: 'coaching-session-1',
        userToken: 'user-token-123',
        coachToken: 'coach-token-456',
        expiresIn: 86400,
      }

      vi.mocked(apiClient.post).mockResolvedValueOnce(mockResponse)

      await agoraTokenService.generateTokens('session-1')

      const tokens = await agoraTokenService.getTokens('session-1')

      expect(tokens.userToken).toBe('user-token-123')
      expect(tokens.coachToken).toBe('coach-token-456')
      expect(apiClient.post).toHaveBeenCalledTimes(1)
    })

    it('should generate new tokens if not cached', async () => {
      const mockResponse = {
        channelName: 'coaching-session-1',
        userToken: 'user-token-123',
        coachToken: 'coach-token-456',
        expiresIn: 86400,
      }

      vi.mocked(apiClient.post).mockResolvedValueOnce(mockResponse)

      const tokens = await agoraTokenService.getTokens('session-1')

      expect(tokens.userToken).toBe('user-token-123')
      expect(tokens.coachToken).toBe('coach-token-456')
      expect(apiClient.post).toHaveBeenCalledTimes(1)
    })
  })

  describe('joinChannel', () => {
    it('should join channel with user role', async () => {
      vi.mocked(apiClient.post).mockResolvedValueOnce({ success: true })

      const result = await agoraTokenService.joinChannel('coaching-session-1', 'user-token', 0)

      expect(result).toBe(true)
      expect(apiClient.post).toHaveBeenCalledWith(
        '/api/coaching/channels/coaching-session-1/join',
        {
          token: 'user-token',
          uid: 0,
        }
      )
    })

    it('should join channel with coach role', async () => {
      vi.mocked(apiClient.post).mockResolvedValueOnce({ success: true })

      const result = await agoraTokenService.joinChannel('coaching-session-1', 'coach-token', 1)

      expect(result).toBe(true)
      expect(apiClient.post).toHaveBeenCalledWith(
        '/api/coaching/channels/coaching-session-1/join',
        {
          token: 'coach-token',
          uid: 1,
        }
      )
    })
  })

  describe('clearTokenCache', () => {
    it('should remove tokens from cache', async () => {
      const mockResponse = {
        channelName: 'coaching-session-1',
        userToken: 'user-token-123',
        coachToken: 'coach-token-456',
        expiresIn: 86400,
      }

      vi.mocked(apiClient.post).mockResolvedValueOnce(mockResponse)

      await agoraTokenService.generateTokens('session-1')

      let expiry = agoraTokenService.getTokenExpiry('session-1')
      expect(expiry).not.toBeNull()

      agoraTokenService.clearTokenCache('session-1')

      expiry = agoraTokenService.getTokenExpiry('session-1')
      expect(expiry).toBeNull()
    })
  })

  describe('getTokenExpiry', () => {
    it('should return expiry timestamp for cached tokens', async () => {
      const mockResponse = {
        channelName: 'coaching-session-1',
        userToken: 'user-token-123',
        coachToken: 'coach-token-456',
        expiresIn: 3600,
      }

      vi.mocked(apiClient.post).mockResolvedValueOnce(mockResponse)

      const beforeTime = Date.now()
      await agoraTokenService.generateTokens('session-1')
      const afterTime = Date.now()

      const expiry = agoraTokenService.getTokenExpiry('session-1')

      expect(expiry).toBeDefined()
      expect(expiry!).toBeGreaterThanOrEqual(beforeTime + 3600000)
      expect(expiry!).toBeLessThanOrEqual(afterTime + 3600000 + 100)
    })

    it('should return null for non-cached session', () => {
      const expiry = agoraTokenService.getTokenExpiry('non-existent')
      expect(expiry).toBeNull()
    })
  })

  describe('isTokenExpiring', () => {
    it('should return false for tokens with plenty of time remaining', async () => {
      const mockResponse = {
        channelName: 'coaching-session-1',
        userToken: 'user-token-123',
        coachToken: 'coach-token-456',
        expiresIn: 86400, // 24 hours
      }

      vi.mocked(apiClient.post).mockResolvedValueOnce(mockResponse)

      await agoraTokenService.generateTokens('session-1')

      const isExpiring = agoraTokenService.isTokenExpiring('session-1')
      expect(isExpiring).toBe(false)
    })

    it('should return true for tokens about to expire', async () => {
      const mockResponse = {
        channelName: 'coaching-session-1',
        userToken: 'user-token-123',
        coachToken: 'coach-token-456',
        expiresIn: 600, // 10 minutes (less than 30 min threshold)
      }

      vi.mocked(apiClient.post).mockResolvedValueOnce(mockResponse)

      await agoraTokenService.generateTokens('session-1')

      const isExpiring = agoraTokenService.isTokenExpiring('session-1')
      expect(isExpiring).toBe(true)
    })

    it('should return true for non-cached session', () => {
      const isExpiring = agoraTokenService.isTokenExpiring('non-existent')
      expect(isExpiring).toBe(true)
    })
  })

  describe('multiple sessions', () => {
    it('should manage tokens for multiple sessions independently', async () => {
      const mockResponse1 = {
        channelName: 'coaching-session-1',
        userToken: 'user-token-1',
        coachToken: 'coach-token-1',
        expiresIn: 86400,
      }

      const mockResponse2 = {
        channelName: 'coaching-session-2',
        userToken: 'user-token-2',
        coachToken: 'coach-token-2',
        expiresIn: 86400,
      }

      vi.mocked(apiClient.post)
        .mockResolvedValueOnce(mockResponse1)
        .mockResolvedValueOnce(mockResponse2)

      await agoraTokenService.generateTokens('session-1')
      await agoraTokenService.generateTokens('session-2')

      const tokens1 = await agoraTokenService.getTokens('session-1')
      const tokens2 = await agoraTokenService.getTokens('session-2')

      expect(tokens1.userToken).toBe('user-token-1')
      expect(tokens2.userToken).toBe('user-token-2')
    })
  })
})
