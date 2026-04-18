import { describe, it, expect } from 'vitest'
import { mapApiError } from '../errorMapper'

describe('errorMapper', () => {
  describe('mapApiError', () => {
    it('should return authentication error for 401 status', () => {
      const error = { status: 401, message: 'Unauthorized' }
      const result = mapApiError(error)

      expect(result.title).toBe('Authentication Failed')
      expect(result.message).toBe('Please sign in again')
      expect(result.isRetryable).toBe(false)
    })

    it('should return server error for 5xx status', () => {
      const error = { status: 500, message: 'Server error' }
      const result = mapApiError(error)

      expect(result.title).toBe('Server Error')
      expect(result.message).toBe('Something went wrong. Please try again.')
      expect(result.isRetryable).toBe(true)
    })

    it('should return generic error for other statuses', () => {
      const error = { status: 400, message: 'Bad request' }
      const result = mapApiError(error)

      expect(result.title).toBe('Error')
      expect(result.message).toBe('Bad request')
      expect(result.isRetryable).toBe(true)
    })

    it('should handle missing status gracefully', () => {
      const error = { message: 'Network error' }
      const result = mapApiError(error)

      expect(result.title).toBe('Server Error')
      expect(result.isRetryable).toBe(true)
    })
  })
})
