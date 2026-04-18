/**
 * Hook for managing video recording with offline queue integration
 * Handles recording lifecycle and queues videos for upload
 */

import { useState, useRef, useCallback } from 'react'
import { queueVideoForUpload } from '@/src/db/videoQueue'

interface UseVideoRecordingReturn {
  isRecording: boolean
  duration: number
  currentSessionDir: string | null
  startRecording: (sessionDir: string) => Promise<void>
  stopRecording: () => Promise<string | null>
}

export function useVideoRecording(): UseVideoRecordingReturn {
  const [isRecording, setIsRecording] = useState(false)
  const [duration, setDuration] = useState(0)
  const [currentSessionDir, setCurrentSessionDir] = useState<string | null>(null)

  const recordingStartRef = useRef<number | null>(null)
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const videoPathRef = useRef<string | null>(null)

  const startRecording = useCallback(
    async (sessionDir: string): Promise<void> => {
      // Prevent starting if already recording
      if (isRecording) {
        console.warn('Recording already in progress')
        return
      }

      try {
        // Generate unique video filename
        const timestamp = Date.now()
        const videoPath = `${sessionDir}/video-${timestamp}.mp4`
        videoPathRef.current = videoPath

        setCurrentSessionDir(sessionDir)
        setIsRecording(true)
        setDuration(0)
        recordingStartRef.current = Date.now()

        // Start tracking duration
        durationIntervalRef.current = setInterval(() => {
          if (recordingStartRef.current) {
            const elapsed = Math.floor((Date.now() - recordingStartRef.current) / 1000)
            setDuration(elapsed)
          }
        }, 100)

        console.log(`Started recording to ${videoPath}`)
      } catch (error) {
        console.error('Failed to start recording:', error)
        setIsRecording(false)
      }
    },
    [isRecording]
  )

  const stopRecording = useCallback(async (): Promise<string | null> => {
    if (!isRecording || !videoPathRef.current) {
      console.warn('Not recording')
      return null
    }

    try {
      // Stop tracking duration
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current)
        durationIntervalRef.current = null
      }

      const videoPath = videoPathRef.current
      const sessionId = currentSessionDir?.split('/').pop() || 'unknown'

      // Queue video for upload
      await queueVideoForUpload(videoPath, sessionId, {
        duration,
        recordedAt: new Date().toISOString(),
      })

      console.log(`Stopped recording. Duration: ${duration}s`)

      // Reset state
      setIsRecording(false)
      setDuration(0)
      setCurrentSessionDir(null)
      recordingStartRef.current = null
      videoPathRef.current = null

      return videoPath
    } catch (error) {
      console.error('Failed to stop recording:', error)
      return null
    }
  }, [isRecording, currentSessionDir, duration])

  return {
    isRecording,
    duration,
    currentSessionDir,
    startRecording,
    stopRecording,
  }
}
