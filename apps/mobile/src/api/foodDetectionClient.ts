import type { FoodDetectionResult } from '../types/ar'

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000'

export const foodDetectionClient = {
  async detectFood(imageData: Uint8Array): Promise<FoodDetectionResult[]> {
    return this._retryWithBackoff(async () => {
      const formData = new FormData()
      const blob = new Blob([imageData], { type: 'image/jpeg' })
      formData.append('image', blob, 'detection.jpg')

      const response = await fetch(`${API_BASE_URL}/api/ar/detect`, {
        method: 'POST',
        headers: {
          'User-Agent': 'FitnessApp/1.0',
        },
        body: formData,
      })

      if (!response.ok) {
        throw new Error(
          `Detection failed: ${response.status} ${response.statusText}`
        )
      }

      return response.json()
    })
  },

  async getDetectionHistory(): Promise<FoodDetectionResult[]> {
    const response = await fetch(`${API_BASE_URL}/api/ar/history`, {
      method: 'GET',
      headers: {
        'User-Agent': 'FitnessApp/1.0',
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(
        `Failed to fetch history: ${response.status} ${response.statusText}`
      )
    }

    return response.json()
  },

  async _retryWithBackoff(
    fn: () => Promise<FoodDetectionResult[]>,
    attempt = 1
  ): Promise<FoodDetectionResult[]> {
    const MAX_RETRIES = 3
    const RETRY_DELAY = 500 // ms

    try {
      return await fn()
    } catch (error) {
      if (attempt < MAX_RETRIES) {
        // Only retry on transient errors (503, 429, etc)
        const isTransientError =
          error instanceof Error &&
          (error.message.includes('503') || error.message.includes('429'))

        if (isTransientError) {
          await new Promise((resolve) =>
            setTimeout(resolve, RETRY_DELAY * attempt)
          )
          return this._retryWithBackoff(fn, attempt + 1)
        }
      }
      throw error
    }
  },
}
