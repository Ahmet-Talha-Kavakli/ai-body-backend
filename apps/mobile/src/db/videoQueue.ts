/**
 * Video upload queue management for offline-first support
 * Persists videos to be uploaded and tracks their progress
 */

export interface VideoQueueItem {
  id: string
  videoPath: string
  sessionId: string
  status: 'pending' | 'uploading' | 'uploaded' | 'failed'
  progress: number // 0-100
  retryCount: number
  uploadedAt: number | null
  failureReason?: string
  metadata?: Record<string, any>
}

// In-memory queue (in production, would use SQLite)
let videoQueue: Map<string, VideoQueueItem> = new Map()
let nextId = 1

/**
 * Queue a video for upload
 */
export async function queueVideoForUpload(
  videoPath: string,
  sessionId: string,
  metadata?: Record<string, any>
): Promise<VideoQueueItem> {
  const item: VideoQueueItem = {
    id: `video-${nextId++}`,
    videoPath,
    sessionId,
    status: 'pending',
    progress: 0,
    retryCount: 0,
    uploadedAt: null,
    metadata,
  }

  videoQueue.set(item.id, item)
  return item
}

/**
 * Get all pending videos
 */
export async function getPendingVideos(): Promise<VideoQueueItem[]> {
  return Array.from(videoQueue.values())
    .filter((item) => item.status === 'pending')
    .sort((a, b) => {
      // Extract numeric ID for sorting
      const aId = parseInt(a.id.split('-')[1] || '0', 10)
      const bId = parseInt(b.id.split('-')[1] || '0', 10)
      return aId - bId
    })
}

/**
 * Update video upload progress
 */
export async function updateVideoProgress(videoId: string, progress: number): Promise<void> {
  const item = videoQueue.get(videoId)
  if (item) {
    // Clamp progress to 0-100
    item.progress = Math.max(0, Math.min(100, progress))
  }
}

/**
 * Mark video as successfully uploaded
 */
export async function markVideoUploaded(videoId: string): Promise<void> {
  const item = videoQueue.get(videoId)
  if (item) {
    item.status = 'uploaded'
    item.progress = 100
    item.uploadedAt = Date.now()
  }
}

/**
 * Mark video as failed
 */
export async function markVideoFailed(videoId: string, reason: string): Promise<void> {
  const item = videoQueue.get(videoId)
  if (item) {
    item.status = 'failed'
    item.failureReason = reason
  }
}

/**
 * Clear all videos from queue
 */
export async function clearVideoQueue(): Promise<void> {
  videoQueue.clear()
  nextId = 1
}
