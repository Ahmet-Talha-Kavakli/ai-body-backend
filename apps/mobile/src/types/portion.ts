/**
 * Portion Estimation Types
 *
 * Handles GPT-4 Vision-based portion size estimation from food photos
 */

export interface PortionEstimation {
  /** Unique identifier for the estimation */
  id: string

  /** File path to the food photo */
  photoPath: string

  /** Name of the food being estimated (e.g., "Chicken Breast") */
  foodName: string

  /** Estimated portion size in grams */
  estimatedPortionG: number

  /** Human-readable portion description (e.g., "150g (5 oz)", "2 slices") */
  estimatedPortionDescription: string

  /** Confidence score 0-100 (higher = more confident) */
  confidence: number

  /** User-adjusted portion size if they override the estimate */
  userAdjustedPortionG?: number

  /** ISO timestamp when the estimation was created */
  createdAt: string
}

/**
 * Request payload for portion estimation API
 */
export interface PortionEstimateRequest {
  photoPath: string
  foodName: string
}

/**
 * Response from portion estimation API
 */
export interface PortionEstimateResponse {
  estimatedPortionG: number
  estimatedPortionDescription: string
  confidence: number
}

/**
 * Database row for portion estimations
 */
export interface PortionEstimationRow {
  id: string
  photoPath: string
  foodName: string
  estimatedPortionG: number
  estimatedPortionDescription: string
  confidence: number
  userAdjustedPortionG: number | null
  createdAt: string
}
