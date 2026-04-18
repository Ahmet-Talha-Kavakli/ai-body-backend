import { useEffect, useState, useCallback, useRef } from 'react'
import NetInfo from '@react-native-community/netinfo'
import type { NetInfoState } from '@react-native-community/netinfo'
import {
  getPendingItems,
  markSynced,
  markFailed,
  retryWithBackoff,
  queueMealSync,
  queuePhotoSync,
  queueGoalSync,
  type SyncQueueItem,
} from '../db/nutritionSync'
import type { MealLog } from '../types/nutrition'

interface UseNutritionSyncReturn {
  isOnline: boolean
  isSyncing: boolean
  syncMeal: (meal: MealLog) => Promise<string>
  syncPhoto: (photo: any) => Promise<string>
  syncGoal: (goal: any) => Promise<string>
  flushSyncQueue: () => Promise<void>
}

export function useNutritionSync(): UseNutritionSyncReturn {
  const [isOnline, setIsOnline] = useState(true)
  const [isSyncing, setIsSyncing] = useState(false)
  const syncTimeoutsRef = useRef<Map<string, NodeJS.Timeout>>(new Map())

  // Monitor network status
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      const online = state.isConnected ?? false
      setIsOnline(online)

      // Flush queue when coming online
      if (online) {
        flushSyncQueue().catch((error) => {
          console.error('Failed to flush sync queue on reconnect:', error)
        })
      }
    })

    return () => {
      unsubscribe()
    }
  }, [])

  // Queue a meal for sync
  const syncMeal = useCallback(async (meal: MealLog): Promise<string> => {
    return queueMealSync(meal)
  }, [])

  // Queue a photo for sync
  const syncPhoto = useCallback(async (photo: any): Promise<string> => {
    return queuePhotoSync(photo)
  }, [])

  // Queue a goal for sync
  const syncGoal = useCallback(async (goal: any): Promise<string> => {
    return queueGoalSync(goal)
  }, [])

  // Flush pending items with retries
  const flushSyncQueue = useCallback(async () => {
    if (isSyncing || !isOnline) return

    setIsSyncing(true)
    try {
      const pending = await getPendingItems()

      for (const item of pending) {
        await processSyncItem(item)
      }
    } catch (error) {
      console.error('Error flushing sync queue:', error)
    } finally {
      setIsSyncing(false)
    }
  }, [isOnline, isSyncing])

  // Process a single sync item with retries and backoff
  const processSyncItem = useCallback(async (item: SyncQueueItem) => {
    try {
      // Clear any existing timeout for this item
      const existingTimeout = syncTimeoutsRef.current.get(item.id)
      if (existingTimeout) {
        clearTimeout(existingTimeout)
        syncTimeoutsRef.current.delete(item.id)
      }

      // Simulate sync (in real implementation, this would call an API)
      // For now, we'll just mark it as synced
      const syncSuccess = await simulateSyncRequest(item)

      if (syncSuccess) {
        await markSynced(item.id)
      } else {
        // Calculate backoff delay: 1s, 2s, 4s, 8s, 16s
        const maxAttempts = 5
        if (item.attempts < maxAttempts) {
          await retryWithBackoff(item.id)

          const delay = Math.pow(2, item.attempts) * 1000
          const timeout = setTimeout(() => {
            processSyncItem(item).catch((error) => {
              console.error('Error retrying sync item:', error)
            })
          }, delay)

          syncTimeoutsRef.current.set(item.id, timeout)
        } else {
          // Max attempts reached, mark as failed
          await markFailed(item.id, 'Max retry attempts exceeded')
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      await markFailed(item.id, errorMessage)
    }
  }, [])

  // Simulate API sync request
  const simulateSyncRequest = useCallback(async (item: SyncQueueItem): Promise<boolean> => {
    // In production, this would make an actual API call
    // For now, we'll simulate a 90% success rate
    return Math.random() < 0.9
  }, [])

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      syncTimeoutsRef.current.forEach((timeout) => clearTimeout(timeout))
      syncTimeoutsRef.current.clear()
    }
  }, [])

  return {
    isOnline,
    isSyncing,
    syncMeal,
    syncPhoto,
    syncGoal,
    flushSyncQueue,
  }
}
