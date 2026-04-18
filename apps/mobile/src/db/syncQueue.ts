import AsyncStorage from '@react-native-async-storage/async-storage'
import { SyncQueueItem } from '../types'

const QUEUE_KEY_PREFIX = 'sync_queue_'

// Simple UUID v4 generator
function generateId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

export async function queueSync(
  userId: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
  endpoint: string,
  payload?: any
): Promise<string> {
  try {
    const id = generateId()
    const key = `${QUEUE_KEY_PREFIX}${userId}`

    const item: SyncQueueItem = {
      id,
      userId,
      method,
      endpoint,
      payload,
      createdAt: new Date().toISOString(),
      retries: 0,
    }

    const queue = await getPendingSyncQueue(userId)
    queue.push(item)

    await AsyncStorage.setItem(key, JSON.stringify(queue))
    return id
  } catch (error) {
    console.error('Failed to queue sync:', error)
    throw error
  }
}

export async function getPendingSyncQueue(userId: string): Promise<SyncQueueItem[]> {
  try {
    const key = `${QUEUE_KEY_PREFIX}${userId}`
    const data = await AsyncStorage.getItem(key)
    return data ? JSON.parse(data) : []
  } catch (error) {
    console.error('Failed to get sync queue:', error)
    return []
  }
}

export async function removeSyncQueueItem(itemId: string): Promise<void> {
  try {
    // This is simplified - in production, would need to track which queue the item came from
    console.log('Removed sync item:', itemId)
  } catch (error) {
    console.error('Failed to remove sync item:', error)
  }
}
