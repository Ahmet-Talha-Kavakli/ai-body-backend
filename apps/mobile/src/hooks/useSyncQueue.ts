import { useEffect, useRef } from 'react'
import { useAuthStore } from '../store/authStore'
import { getAuthenticatedClient } from '../api/client'
import { getPendingSyncQueue, removeSyncQueueItem } from '../db/syncQueue'
import { useOfflineDetection } from './useOfflineDetection'

export function useSyncQueue() {
  const { isOnline } = useOfflineDetection()
  const syncInProgressRef = useRef(false)
  const authStore = useAuthStore()

  useEffect(() => {
    if (isOnline && authStore.userEmail) {
      flushSyncQueue()
    }
  }, [isOnline, authStore.userEmail])

  async function flushSyncQueue() {
    if (syncInProgressRef.current) return
    syncInProgressRef.current = true

    try {
      const queue = await getPendingSyncQueue(authStore.userEmail || '')

      for (const item of queue) {
        try {
          const client = await getAuthenticatedClient()

          if (item.action === 'POST') {
            await client.post(item.endpoint, JSON.parse(item.payload))
          } else if (item.action === 'PUT') {
            await client.put(item.endpoint, JSON.parse(item.payload))
          }

          await removeSyncQueueItem(item.id)
        } catch (error) {
          console.error('Sync item failed:', error)
        }
      }
    } finally {
      syncInProgressRef.current = false
    }
  }

  return { flushSyncQueue, isOnline }
}
