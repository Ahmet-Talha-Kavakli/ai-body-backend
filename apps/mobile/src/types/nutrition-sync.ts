// Nutrition sync queue types for offline-first synchronization

export interface NutritionSyncQueue {
  id: string
  type: 'meal' | 'photo' | 'goal' | 'water' | 'coach_log'
  payload: any
  status: 'pending' | 'synced' | 'failed' | 'syncing'
  attempts: number
  lastAttempt?: string
  error?: string
  createdAt: string
}
