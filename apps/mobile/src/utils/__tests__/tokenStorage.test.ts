import { describe, it, expect, vi } from 'vitest'

// Mock expo-secure-store before importing the module
const mockSecureStore = {
  setItemAsync: vi.fn(),
  getItemAsync: vi.fn(),
  deleteItemAsync: vi.fn(),
}

vi.doMock('expo-secure-store', () => mockSecureStore, { virtual: true })

describe('tokenStorage', () => {
  describe('saveAuthToken', () => {
    it('should save token to secure store', async () => {
      const { saveAuthToken } = await import('../tokenStorage')
      const token = 'test-token-123'
      mockSecureStore.setItemAsync.mockResolvedValue(undefined)

      await saveAuthToken(token)

      expect(mockSecureStore.setItemAsync).toHaveBeenCalledWith('auth_token', token)
    })
  })

  describe('getAuthToken', () => {
    it('should retrieve token from secure store', async () => {
      const { getAuthToken } = await import('../tokenStorage')
      const token = 'test-token-123'
      mockSecureStore.getItemAsync.mockResolvedValue(token)

      const result = await getAuthToken()

      expect(result).toBe(token)
      expect(mockSecureStore.getItemAsync).toHaveBeenCalledWith('auth_token')
    })

    it('should return null when no token exists', async () => {
      const { getAuthToken } = await import('../tokenStorage')
      mockSecureStore.getItemAsync.mockResolvedValue(null)

      const result = await getAuthToken()

      expect(result).toBeNull()
    })
  })

  describe('removeAuthToken', () => {
    it('should remove token from secure store', async () => {
      const { removeAuthToken } = await import('../tokenStorage')
      mockSecureStore.deleteItemAsync.mockResolvedValue(undefined)

      await removeAuthToken()

      expect(mockSecureStore.deleteItemAsync).toHaveBeenCalledWith('auth_token')
    })
  })
})
