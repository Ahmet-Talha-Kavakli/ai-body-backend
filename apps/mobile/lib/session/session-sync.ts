/**
 * Offline-first session synchronization with exponential backoff retry
 * Handles network failures gracefully without blocking the app
 */

import type { SessionRecord } from './types'
import { SYNC } from './constants'

export interface SyncItem {
  sessionId: string
  record: SessionRecord
  syncStatus: 'pending' | 'synced' | 'failed'
  retryCount: number
  nextRetryAt: number
}

// In-memory sync queue (in production, would use SQLite)
let syncQueue: Map<string, SyncItem> = new Map()

/**
 * Initialize the sync queue
 */
export async function initSyncQueue(): Promise<void> {
  syncQueue.clear()
}

/**
 * Get the API URL for session sync
 */
function getApiUrl(): string {
  // Use EXPO_PUBLIC_API_URL if available, fallback to localhost for development
  const baseUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000'
  return `${baseUrl}/api/sessions/sync`
}

/**
 * Calculate next retry delay in milliseconds based on retry count
 * Exponential backoff: 1s, 2s, 4s, 8s, 16s
 */
function getRetryDelay(retryCount: number): number {
  return SYNC.RETRY_DELAYS[Math.min(retryCount, SYNC.RETRY_DELAYS.length - 1)]
}

/**
 * Attempt to sync a session to the backend
 * Non-blocking - returns immediately even if sync fails
 */
export async function syncSessionToBackend(record: SessionRecord): Promise<void> {
  const sessionId = record.id

  // Check if this session is already in the queue
  let item = syncQueue.get(sessionId)

  if (!item) {
    // New item - create it
    item = {
      sessionId,
      record,
      syncStatus: 'pending',
      retryCount: 0,
      nextRetryAt: Date.now(),
    }
    syncQueue.set(sessionId, item)
  } else {
    // Update the record
    item.record = record
  }

  // Fire-and-forget: attempt sync without awaiting
  attemptSync(item).catch((error) => {
    console.error(`Session sync background task failed: ${sessionId}`, error)
  })
}

/**
 * Attempt to sync a single item to the backend
 * Handles retries, errors, and status updates
 */
async function attemptSync(item: SyncItem): Promise<void> {
  // Check if it's time to retry
  if (item.nextRetryAt > Date.now()) {
    return
  }

  try {
    const response = await fetch(getApiUrl(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(item.record),
    })

    if (response.ok) {
      // Success
      item.syncStatus = 'synced'
      console.log(`Session synced successfully: ${item.sessionId}`)
      return
    }

    // Handle HTTP error responses
    const status = response.status

    if (status >= 400 && status < 500) {
      // 4xx errors - don't retry (bad request, not found, etc.)
      item.syncStatus = 'failed'
      console.warn(`Cannot retry 4xx error for session ${item.sessionId}:`, status)
      return
    }

    if (status >= 500) {
      // 5xx errors - queue for retry
      console.warn(`Server error syncing session ${item.sessionId}:`, status)
      queueForRetry(item)
      return
    }
  } catch (error) {
    // Network errors, timeouts, etc. - queue for retry
    console.error(`Session sync failed for ${item.sessionId}:`, error)
    queueForRetry(item)
  }
}

/**
 * Queue an item for retry with exponential backoff
 */
function queueForRetry(item: SyncItem): void {
  if (item.retryCount >= SYNC.MAX_RETRIES) {
    // Max retries exceeded - mark as failed
    item.syncStatus = 'failed'
    console.warn(`Max retries exceeded for session ${item.sessionId}`)
    return
  }

  // Get delay for current retry count, then increment
  const delayMs = getRetryDelay(item.retryCount)
  item.retryCount++
  item.nextRetryAt = Date.now() + delayMs

  item.syncStatus = 'pending'
  console.log(
    `Queued session ${item.sessionId} for retry ${item.retryCount}/${SYNC.MAX_RETRIES} in ${delayMs}ms`
  )
}

/**
 * Get the current sync queue
 */
export async function getSyncQueue(): Promise<SyncItem[]> {
  return Array.from(syncQueue.values())
}

/**
 * Clear all items from the sync queue
 */
export async function clearSyncQueue(): Promise<void> {
  syncQueue.clear()
}

/**
 * Get count of pending sync items
 */
export function getBacklog(): number {
  let count = 0
  for (const item of syncQueue.values()) {
    if (item.syncStatus === 'pending') {
      count++
    }
  }
  return count
}

/**
 * Background job to process pending retries
 * Call this periodically (e.g., every 5 seconds) or when app comes to foreground
 */
export async function processPendingRetries(): Promise<void> {
  const queue = await getSyncQueue()

  for (const item of queue) {
    if (item.syncStatus === 'pending' && item.nextRetryAt <= Date.now()) {
      await attemptSync(item)
    }
  }
}
