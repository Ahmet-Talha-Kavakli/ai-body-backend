/**
 * Portion Estimation API Client
 *
 * Handles GPT-4 Vision-based portion estimation requests to the backend.
 * Includes error handling, retries, and response validation.
 */

import type { PortionEstimateRequest, PortionEstimateResponse } from '../types/portion'

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000'
const MAX_RETRIES = 3
const INITIAL_DELAY = 1000 // 1 second

/**
 * Calculate exponential backoff delay
 */
function getRetryDelay(attempt: number): number {
  return INITIAL_DELAY * Math.pow(2, attempt - 1)
}

/**
 * Portion Estimation API Client
 */
export const portionClient = {
  /**
   * Estimate portion size from a food photo using GPT-4 Vision
   * @param photoPath - Path to the food photo
   * @param foodName - Name of the food being estimated
   * @returns Promise with estimation results
   * @throws Error if API call fails or validation fails
   */
  async estimatePortion(photoPath: string, foodName: string): Promise<PortionEstimateResponse> {
    const request: PortionEstimateRequest = {
      photoPath,
      foodName,
    }

    let lastError: Error | null = null

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        const response = await fetch(`${API_BASE_URL}/api/portion/estimate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(request),
        })

        if (!response.ok) {
          const errorMessage = `HTTP ${response.status}: ${response.statusText}`
          throw new Error(errorMessage)
        }

        const data = await response.json()
        return this.validateResponse(data)
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error))

        // If this is the last attempt, throw the error
        if (attempt === MAX_RETRIES - 1) {
          throw lastError
        }

        // Wait before retrying
        const delay = getRetryDelay(attempt + 1)
        await new Promise((resolve) => setTimeout(resolve, delay))
      }
    }

    // Should never reach here, but just in case
    throw lastError || new Error('Failed to estimate portion')
  },

  /**
   * Validate API response data
   */
  validateResponse(data: unknown): PortionEstimateResponse {
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid response: expected object')
    }

    const response = data as Record<string, unknown>

    if (
      typeof response.estimatedPortionG !== 'number' ||
      typeof response.estimatedPortionDescription !== 'string' ||
      typeof response.confidence !== 'number'
    ) {
      throw new Error('Invalid response: missing or invalid fields')
    }

    if (response.confidence < 0 || response.confidence > 100) {
      throw new Error('Invalid confidence: must be between 0-100')
    }

    if (response.estimatedPortionG <= 0) {
      throw new Error('Invalid portion: must be greater than 0')
    }

    return {
      estimatedPortionG: response.estimatedPortionG as number,
      estimatedPortionDescription: response.estimatedPortionDescription as string,
      confidence: response.confidence as number,
    }
  },
}
