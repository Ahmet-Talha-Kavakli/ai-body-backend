/**
 * Portion Estimation Service
 *
 * High-level service for portion estimation operations.
 * Handles caching, validation, and database persistence.
 */

import { portionClient } from '../api/portionClient'
import type { PortionEstimation } from '../types/portion'
import * as portionDb from '../db/portions'

/**
 * In-memory cache for estimation results
 */
const estimationCache = new Map<string, PortionEstimation>()

/**
 * Portion Estimation Service
 */
export const portionEstimationService = {
  /**
   * Estimate portion size from a photo
   * @param photoPath - Path to the food photo
   * @param foodName - Name of the food
   * @returns Promise with estimation record
   */
  async estimateFromPhoto(
    photoPath: string,
    foodName: string,
  ): Promise<PortionEstimation> {
    // Check cache first
    const cacheKey = `${photoPath}:${foodName}`
    const cached = estimationCache.get(cacheKey)
    if (cached) {
      return cached
    }

    // Call API for estimation
    const apiResponse = await portionClient.estimatePortion(photoPath, foodName)

    // Create estimation record in database
    const estimation = await portionDb.createEstimation({
      photoPath,
      foodName,
      estimatedPortionG: apiResponse.estimatedPortionG,
      estimatedPortionDescription: apiResponse.estimatedPortionDescription,
      confidence: apiResponse.confidence,
    })

    // Cache the result
    estimationCache.set(cacheKey, estimation)

    return estimation
  },

  /**
   * Adjust the portion estimate with user override
   * @param estimationId - ID of the estimation
   * @param adjustedPortionG - User-adjusted portion in grams
   * @returns Promise with updated estimation
   */
  async adjustPortion(
    estimationId: string,
    adjustedPortionG: number,
  ): Promise<PortionEstimation> {
    if (adjustedPortionG <= 0) {
      throw new Error('Invalid portion: must be greater than 0')
    }

    const updated = await portionDb.updateEstimation(estimationId, {
      userAdjustedPortionG: adjustedPortionG,
    })

    // Invalidate cache
    estimationCache.clear()

    return updated
  },

  /**
   * Get a single estimation by ID
   * @param estimationId - ID of the estimation
   * @returns Promise with estimation or undefined
   */
  async getEstimation(estimationId: string): Promise<PortionEstimation | undefined> {
    return await portionDb.getEstimation(estimationId)
  },

  /**
   * Get recent estimations
   * @param limit - Maximum number of records to return
   * @returns Promise with array of estimations
   */
  async getRecentEstimations(limit: number): Promise<PortionEstimation[]> {
    return await portionDb.getRecentEstimations(limit)
  },

  /**
   * Clear the in-memory cache
   */
  clearCache(): void {
    estimationCache.clear()
  },
}
