import apiClient from './apiClient'
import type { Coach, CoachingSession, CoachingProgram, CoachRating } from '../types/coaching'

/**
 * Live Coaching Service
 * Handles REST API calls for live coaching (1-on-1 sessions with human coaches)
 */

export async function getCoaches(
  specialization?: string,
  limit?: number
): Promise<Coach[]> {
  try {
    let endpoint = '/api/coaching/coaches'
    const params = new URLSearchParams()
    if (specialization) params.append('specialization', specialization)
    if (limit) params.append('limit', limit.toString())

    if (params.toString()) {
      endpoint += `?${params.toString()}`
    }

    return await apiClient.get<Coach[]>(endpoint)
  } catch (error) {
    console.error('Error fetching coaches:', error)
    throw error
  }
}

export async function getCoach(coachId: string): Promise<Coach> {
  try {
    return await apiClient.get<Coach>(`/api/coaching/coaches/${coachId}`)
  } catch (error) {
    console.error('Error fetching coach:', error)
    throw error
  }
}

export async function searchCoaches(query: string): Promise<Coach[]> {
  try {
    return await apiClient.get<Coach[]>(`/api/coaching/coaches/search?q=${encodeURIComponent(query)}`)
  } catch (error) {
    console.error('Error searching coaches:', error)
    throw error
  }
}

export async function createSession(
  coachId: string,
  type: 'scheduled' | 'ondemand',
  scheduledAt?: string
): Promise<CoachingSession> {
  try {
    return await apiClient.post<CoachingSession>('/api/coaching/sessions', {
      coachId,
      type,
      scheduledAt,
    })
  } catch (error) {
    console.error('Error creating session:', error)
    throw error
  }
}

export async function getSession(sessionId: string): Promise<CoachingSession> {
  try {
    return await apiClient.get<CoachingSession>(`/api/coaching/sessions/${sessionId}`)
  } catch (error) {
    console.error('Error fetching session:', error)
    throw error
  }
}

export async function getActiveSessions(): Promise<CoachingSession[]> {
  try {
    return await apiClient.get<CoachingSession[]>('/api/coaching/sessions/active')
  } catch (error) {
    console.error('Error fetching active sessions:', error)
    throw error
  }
}

export async function cancelSession(sessionId: string): Promise<boolean> {
  try {
    await apiClient.patch(`/api/coaching/sessions/${sessionId}`, {
      status: 'cancelled',
    })
    return true
  } catch (error) {
    console.error('Error cancelling session:', error)
    throw error
  }
}

export async function completeSession(sessionId: string): Promise<boolean> {
  try {
    await apiClient.patch(`/api/coaching/sessions/${sessionId}`, {
      status: 'completed',
    })
    return true
  } catch (error) {
    console.error('Error completing session:', error)
    throw error
  }
}

export async function getCoachingPrograms(
  userId: string,
  limit?: number
): Promise<CoachingProgram[]> {
  try {
    return await apiClient.get<CoachingProgram[]>(
      `/api/coaching/programs?userId=${userId}&limit=${limit}`
    )
  } catch (error) {
    console.error('Error fetching coaching programs:', error)
    throw error
  }
}

export async function getCoachingProgram(programId: string): Promise<CoachingProgram> {
  try {
    return await apiClient.get<CoachingProgram>(`/api/coaching/programs/${programId}`)
  } catch (error) {
    console.error('Error fetching coaching program:', error)
    throw error
  }
}

export async function rateCoach(
  coachId: string,
  rating: number,
  review?: string
): Promise<boolean> {
  try {
    await apiClient.post(`/api/coaching/coaches/${coachId}/rate`, {
      rating,
      review,
    })
    return true
  } catch (error) {
    console.error('Error rating coach:', error)
    throw error
  }
}
