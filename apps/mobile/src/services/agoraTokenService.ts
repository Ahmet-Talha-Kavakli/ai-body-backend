import apiClient from './apiClient'

/**
 * Agora Token Service
 * Handles generation and refresh of Agora RTC tokens for live coaching video calls
 */

interface AgoraTokenResponse {
  channelName: string
  userToken: string
  coachToken: string
  expiresIn: number // seconds until expiry
}

interface TokenCache {
  userToken: string
  coachToken: string
  expiresAt: number // timestamp
  channelName: string
}

// Cache for storing tokens with expiry tracking
const tokenCache = new Map<string, TokenCache>()

// Refresh threshold: refresh when less than 30 minutes remaining
const REFRESH_THRESHOLD_MS = 30 * 60 * 1000

/**
 * Generate new Agora tokens for a coaching session
 * @param sessionId Unique coaching session ID
 * @returns Token response with channelName and tokens
 */
export async function generateTokens(sessionId: string): Promise<AgoraTokenResponse> {
  try {
    const response = await apiClient.post<AgoraTokenResponse>(
      `/api/coaching/sessions/${sessionId}/agora-tokens`,
      {}
    )

    // Cache the tokens
    const expiresAt = Date.now() + response.expiresIn * 1000
    tokenCache.set(sessionId, {
      userToken: response.userToken,
      coachToken: response.coachToken,
      expiresAt,
      channelName: response.channelName,
    })

    return response
  } catch (error) {
    console.error('Error generating Agora tokens:', error)
    throw error
  }
}

/**
 * Refresh tokens if they're about to expire
 * @param sessionId Session ID
 * @returns True if tokens were refreshed, false if still valid
 */
export async function refreshTokens(sessionId: string): Promise<boolean> {
  try {
    const cached = tokenCache.get(sessionId)

    // Check if tokens need refresh
    if (!cached || Date.now() + REFRESH_THRESHOLD_MS >= cached.expiresAt) {
      // Generate new tokens
      await generateTokens(sessionId)
      return true
    }

    return false
  } catch (error) {
    console.error('Error refreshing Agora tokens:', error)
    throw error
  }
}

/**
 * Get current cached tokens for a session (with auto-refresh if needed)
 * @param sessionId Session ID
 * @returns User and coach tokens
 */
export async function getTokens(
  sessionId: string
): Promise<{ userToken: string; coachToken: string }> {
  try {
    // Try to refresh if needed
    await refreshTokens(sessionId)

    const cached = tokenCache.get(sessionId)
    if (!cached) {
      // If no cache, generate new tokens
      const generated = await generateTokens(sessionId)
      return {
        userToken: generated.userToken,
        coachToken: generated.coachToken,
      }
    }

    return {
      userToken: cached.userToken,
      coachToken: cached.coachToken,
    }
  } catch (error) {
    console.error('Error getting Agora tokens:', error)
    throw error
  }
}

/**
 * Join a channel with token (for testing/validation)
 * @param channelName Channel name
 * @param token Channel token
 * @param uid User ID (0 for user, 1 for coach)
 * @returns Success status
 */
export async function joinChannel(
  channelName: string,
  token: string,
  uid: number
): Promise<boolean> {
  try {
    await apiClient.post(`/api/coaching/channels/${channelName}/join`, {
      token,
      uid,
    })
    return true
  } catch (error) {
    console.error('Error joining Agora channel:', error)
    throw error
  }
}

/**
 * Clear cached tokens for a session (e.g., after session ends)
 * @param sessionId Session ID
 */
export function clearTokenCache(sessionId: string): void {
  tokenCache.delete(sessionId)
}

/**
 * Get token expiry info for a session
 * @param sessionId Session ID
 * @returns Expiry timestamp or null if not cached
 */
export function getTokenExpiry(sessionId: string): number | null {
  const cached = tokenCache.get(sessionId)
  return cached?.expiresAt ?? null
}

/**
 * Check if tokens are about to expire (within threshold)
 * @param sessionId Session ID
 * @returns True if about to expire or expired
 */
export function isTokenExpiring(sessionId: string): boolean {
  const cached = tokenCache.get(sessionId)
  if (!cached) return true
  return Date.now() + REFRESH_THRESHOLD_MS >= cached.expiresAt
}
