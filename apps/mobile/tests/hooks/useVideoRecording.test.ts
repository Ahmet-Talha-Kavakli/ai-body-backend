import { describe, it, expect, beforeEach, vi } from 'vitest'
import * as videoQueueModule from '@/src/db/videoQueue'

// Video recording state tracker (extracted from hook for testing)
class VideoRecorder {
  private isRecording = false
  private duration = 0
  private currentSessionDir: string | null = null
  private recordingStart: number | null = null
  private durationInterval: NodeJS.Timeout | null = null
  private videoPath: string | null = null

  getIsRecording(): boolean {
    return this.isRecording
  }

  getDuration(): number {
    return this.duration
  }

  getCurrentSessionDir(): string | null {
    return this.currentSessionDir
  }

  async startRecording(sessionDir: string): Promise<void> {
    if (this.isRecording) {
      console.warn('Recording already in progress')
      return
    }

    const timestamp = Date.now()
    this.videoPath = `${sessionDir}/video-${timestamp}.mp4`
    this.currentSessionDir = sessionDir
    this.isRecording = true
    this.duration = 0
    this.recordingStart = Date.now()

    this.durationInterval = setInterval(() => {
      if (this.recordingStart) {
        this.duration = Math.floor((Date.now() - this.recordingStart) / 1000)
      }
    }, 100)

    console.log(`Started recording to ${this.videoPath}`)
  }

  async stopRecording(): Promise<string | null> {
    if (!this.isRecording || !this.videoPath) {
      console.warn('Not recording')
      return null
    }

    try {
      if (this.durationInterval) {
        clearInterval(this.durationInterval)
        this.durationInterval = null
      }

      const videoPath = this.videoPath
      const sessionId = this.currentSessionDir?.split('/').pop() || 'unknown'

      await videoQueueModule.queueVideoForUpload(videoPath, sessionId, {
        duration: this.duration,
        recordedAt: new Date().toISOString(),
      })

      console.log(`Stopped recording. Duration: ${this.duration}s`)

      this.isRecording = false
      this.duration = 0
      this.currentSessionDir = null
      this.recordingStart = null
      this.videoPath = null

      return videoPath
    } catch (error) {
      console.error('Failed to stop recording:', error)
      return null
    }
  }
}

describe('Video Recording Logic', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Recording State', () => {
    it('should initialize with recording disabled', () => {
      const recorder = new VideoRecorder()
      expect(recorder.getIsRecording()).toBe(false)
      expect(recorder.getDuration()).toBe(0)
      expect(recorder.getCurrentSessionDir()).toBeNull()
    })

    it('should start recording with session directory', async () => {
      const recorder = new VideoRecorder()
      const sessionDir = '/tmp/session-001'

      await recorder.startRecording(sessionDir)

      expect(recorder.getIsRecording()).toBe(true)
      expect(recorder.getCurrentSessionDir()).toBe(sessionDir)
    })

    it('should track duration during recording', async () => {
      const recorder = new VideoRecorder()

      await recorder.startRecording('/tmp/session-001')
      // Wait long enough for floor((now - start) / 1000) > 0 (need ~1+ second)
      await new Promise((resolve) => setTimeout(resolve, 1100))

      expect(recorder.getDuration()).toBeGreaterThan(0)
    })

    it('should stop recording and return video path', async () => {
      vi.spyOn(videoQueueModule, 'queueVideoForUpload').mockResolvedValueOnce({
        id: 'video-1',
        videoPath: '/tmp/session-001/video-12345.mp4',
        sessionId: 'session-001',
        status: 'pending',
        progress: 0,
        retryCount: 0,
        uploadedAt: null,
      })

      const recorder = new VideoRecorder()
      await recorder.startRecording('/tmp/session-001')
      await new Promise((resolve) => setTimeout(resolve, 50))

      const videoPath = await recorder.stopRecording()

      expect(videoPath).toBeDefined()
      expect(recorder.getIsRecording()).toBe(false)
      expect(recorder.getCurrentSessionDir()).toBeNull()
    })
  })

  describe('Error Handling', () => {
    it('should prevent starting if already recording', async () => {
      const recorder = new VideoRecorder()

      await recorder.startRecording('/tmp/session-001')
      expect(recorder.getIsRecording()).toBe(true)

      await recorder.startRecording('/tmp/session-002')

      expect(recorder.getCurrentSessionDir()).toBe('/tmp/session-001')
    })

    it('should return null when stopping without recording', async () => {
      const recorder = new VideoRecorder()
      const videoPath = await recorder.stopRecording()

      expect(videoPath).toBeNull()
    })
  })

  describe('Video Queuing', () => {
    it('should queue video for upload on stop', async () => {
      const queueSpy = vi.spyOn(videoQueueModule, 'queueVideoForUpload')
      queueSpy.mockResolvedValueOnce({
        id: 'video-1',
        videoPath: '/tmp/session-001/video-12345.mp4',
        sessionId: 'session-001',
        status: 'pending',
        progress: 0,
        retryCount: 0,
        uploadedAt: null,
      })

      const recorder = new VideoRecorder()
      await recorder.startRecording('/tmp/session-001')
      await recorder.stopRecording()

      expect(queueSpy).toHaveBeenCalled()
    })
  })
})
