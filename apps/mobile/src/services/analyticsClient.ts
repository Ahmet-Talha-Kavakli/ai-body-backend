import axios from 'axios'
import { Recommendation, CoachingInsight, AnalyticsSummary } from '@/types/analytics'

const api = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001',
  timeout: 10000,
})

export const analyticsClient = {
  embeddings: {
    generate: (userId: string) => api.post(`/analytics/embeddings/${userId}/generate`),
    get: (userId: string) => api.get(`/analytics/embeddings/${userId}`),
    findSimilar: (userId: string, limit?: number) =>
      api.get(`/analytics/embeddings/${userId}/similar`, { params: { limit } }),
  },

  recommendations: {
    getMeals: (userId: string) => api.get(`/analytics/recommendations/${userId}/meals`),
    getWorkouts: (userId: string) => api.get(`/analytics/recommendations/${userId}/workouts`),
    getHealth: (userId: string) => api.get(`/analytics/recommendations/${userId}/health`),
    getFriends: (userId: string) => api.get(`/analytics/recommendations/${userId}/friends`),
    getChallenges: (userId: string) =>
      api.get(`/analytics/recommendations/${userId}/challenges`),
    all: (userId: string) => api.get(`/analytics/recommendations/${userId}`),
  },

  coaching: {
    getPerformance: (userId: string) => api.get(`/analytics/coaching/${userId}/performance`),
    getNutrition: (userId: string) => api.get(`/analytics/coaching/${userId}/nutrition`),
    getRecovery: (userId: string) => api.get(`/analytics/coaching/${userId}/recovery`),
    getBehavioral: (userId: string) => api.get(`/analytics/coaching/${userId}/behavioral`),
    all: (userId: string) => api.get(`/analytics/coaching/${userId}`),
  },

  analytics: {
    getSummary: (userId: string, period?: string) =>
      api.get(`/analytics/summary/${userId}`, { params: { period } }),
    getStats: (userId: string) => api.get(`/analytics/stats/${userId}`),
  },
}

export default analyticsClient
