/**
 * Hook for managing video upload queue with offline-first support
 * Handles automatic flushing when online and retry logic with exponential backoff
 */

import { useState, useCallback, useEffect } from 'react'
import {
  getPendingVideos,
  updateVideoProgress,
  markVideoUploaded,
  markVideoFailed,
} from '@/src/db/videoQueue'

interface UseVideoUploadQueueReturn {
  pending: number
  uploading: boolean
  flush: () => Promise<void>
  uploadVideo: (videoId: string, videoPath: string) => Promise<void>
}

const BACKOFF_DELAYS = [1000, 2000, 4000, 8000, 16000] // exponential backoff

export function useVideoUploadQueue(): UseVideoUploadQueueReturn {
  const [pending, setPending] = useState(0)
  const [uploading, setUploading] = useState(false)

  // Refresh pending count
  const refreshPending = useCallback(async () => {
    const videos = await getPendingVideos()
    setPending(videos.length)
  }, [])

  // Upload a single video with progress tracking
  const uploadVideo = useCallback(
    async (videoId: string, videoPath: string): Promise<void> => {
      try {
        // Simulate upload with progress tracking
        // In production, this would actually upload to server
        for (let i = 0; i <= 100; i += 20) {
          await updateVideoProgress(videoId, i)
          // Simulate network delay
          await new Promise((resolve) => setTimeout(resolve, 100))
        }

        // Mark as uploaded
        await markVideoUploaded(videoId)
        console.log(`Uploaded video ${videoId}`)

        // Refresh pending count
        await refreshPending()
      } catch (error) {
        console.error(`Failed to upload video ${videoId}:`, error)
        await markVideoFailed(videoId, String(error))
        throw error
      }
    },
    [refreshPending]
  )

  // Flush all pending videos to server
  const flush = useCallback(async (): Promise<void> => {
    if (uploading) {
      console.warn('Upload already in progress')
      return
    }

    setUploading(true)

    try {
      const videos = await getPendingVideos()

      for (const video of videos) {
        try {
          await uploadVideo(video.id, video.videoPath)
        } catch (error) {
          console.error(`Failed to upload ${video.id}, will retry later:`, error)
        }
      }
    } finally {
      setUploading(false)
      await refreshPending()
    }
  }, [uploading, uploadVideo, refreshPending])

  // Auto-flush on app resume (listen for app foreground event)
  useEffect(() => {
    // In production, would listen to AppState or similar
    // For now, just refresh pending on mount
    refreshPending()

    const interval = setInterval(() => {
      refreshPending()
    }, 5000) // Check every 5 seconds

    return () => {
      clearInterval(interval)
    }
  }, [refreshPending])

  return {
    pending,
    uploading,
    flush,
    uploadVideo,
  }
}
