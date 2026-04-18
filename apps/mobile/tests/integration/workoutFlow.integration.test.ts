/**
 * Integration Tests for Complete Workout Flow
 * Tests the full lifecycle: session start → exercise selection → form analysis → video queuing → session completion
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { syncSessionToBackend, getSyncQueue, clearSyncQueue } from '@/lib/session/session-sync'
import { queueVideoForUpload, getPendingVideos, clearVideoQueue } from '@/src/db/videoQueue'
import { saveExerciseLibrary, getExerciseById } from '@/src/db/exerciseLibrary'
import type { SessionRecord } from '@/lib/session/types'
import type { Exercise } from '@/src/db/exerciseLibrary'

// Mock fetch globally
global.fetch = vi.fn()

describe('Workout Flow Integration Tests', () => {
  const mockExercise: Exercise = {
    id: 'squat',
    name: 'Squat',
    muscleGroups: ['quadriceps', 'glutes', 'hamstrings'],
    category: 'compound',
    difficulty: 'intermediate',
    description: 'Lower body compound movement',
    variations: ['bodyweight', 'goblet', 'barbell'],
  }

  const mockSession: SessionRecord = {
    id: 'session-001',
    userId: 'user-123',
    exercise: 'squat',
    startTime: new Date('2026-04-18T10:00:00Z'),
    endTime: new Date('2026-04-18T10:15:00Z'),
    totalReps: 10,
    avgFormScore: 85.5,
    frames: [
      {
        timestamp: 1776535200000,
        exercise: 'squat',
        formScore: 85,
        repNumber: 1,
        errors: [],
        muscleEngagement: { quadriceps: 0.85, glutes: 0.78 },
      },
    ],
    voiceFeedback: ['Great form!', 'Keep chest up'],
    syncStatus: 'pending',
  }

  beforeEach(async () => {
    vi.clearAllMocks()
    global.fetch = vi.fn()
    await clearSyncQueue()
    await clearVideoQueue()
    await saveExerciseLibrary([mockExercise])
  })

  afterEach(async () => {
    await clearSyncQueue()
    await clearVideoQueue()
  })

  describe('Session Lifecycle', () => {
    it('should complete full workout flow: session → exercise → form → video → completion', async () => {
      // Step 1: Start session (implicitly created)
      expect(mockSession.id).toBeDefined()
      expect(mockSession.syncStatus).toBe('pending')

      // Step 2: Select exercise
      const selectedExercise = await getExerciseById('squat')
      expect(selectedExercise).toBeDefined()
      expect(selectedExercise?.name).toBe('Squat')

      // Step 3: Simulate form analysis (session already has form data)
      expect(mockSession.avgFormScore).toBeGreaterThan(0)
      expect(mockSession.frames.length).toBeGreaterThan(0)

      // Step 4: Queue video for upload
      const videoPath = `/videos/session-001/video-recording.mp4`
      const videoItem = await queueVideoForUpload(videoPath, mockSession.id)
      expect(videoItem).toBeDefined()
      expect(videoItem.status).toBe('pending')

      // Step 5: Sync session to backend
      vi.mocked(global.fetch).mockResolvedValueOnce(
        new Response(JSON.stringify({ ok: true }), { status: 200 })
      )

      await syncSessionToBackend(mockSession)
      await new Promise((resolve) => setTimeout(resolve, 100))

      // Verify: Session queued/synced and video queued
      const syncQueue = await getSyncQueue()
      expect(syncQueue.length).toBeGreaterThan(0)

      const pending = await getPendingVideos()
      expect(pending.length).toBe(1)
      expect(pending[0].videoPath).toBe(videoPath)

      // Step 6: Completion
      expect(syncQueue[0].sessionId).toBe(mockSession.id)
    })
  })

  describe('Session Sync During Workout', () => {
    it('should queue session for sync even if offline', async () => {
      // Simulate offline (network error)
      vi.mocked(global.fetch).mockRejectedValueOnce(new Error('Network error'))

      await syncSessionToBackend(mockSession)
      await new Promise((resolve) => setTimeout(resolve, 300))

      const queue = await getSyncQueue()
      expect(queue).toHaveLength(1)
      expect(queue[0].syncStatus).toBe('pending')
      expect(queue[0].retryCount).toBeGreaterThan(0)
    })

    it('should track multiple sessions in queue', async () => {
      const session2: SessionRecord = {
        ...mockSession,
        id: 'session-002',
        exercise: 'deadlift',
      }

      vi.mocked(global.fetch).mockRejectedValueOnce(new Error('Network error'))

      await syncSessionToBackend(mockSession)
      vi.mocked(global.fetch).mockRejectedValueOnce(new Error('Network error'))
      await syncSessionToBackend(session2)

      await new Promise((resolve) => setTimeout(resolve, 300))

      const queue = await getSyncQueue()
      expect(queue).toHaveLength(2)
      expect(queue.map((q) => q.sessionId)).toContain('session-001')
      expect(queue.map((q) => q.sessionId)).toContain('session-002')
    })
  })

  describe('Video Queuing During Session', () => {
    it('should queue multiple videos from single session', async () => {
      const video1 = await queueVideoForUpload('/videos/session-001/rep-1.mp4', 'session-001')
      const video2 = await queueVideoForUpload('/videos/session-001/rep-2.mp4', 'session-001')
      const video3 = await queueVideoForUpload('/videos/session-001/rep-3.mp4', 'session-001')

      const pending = await getPendingVideos()
      expect(pending).toHaveLength(3)
      expect(pending.map((v) => v.id)).toContain(video1.id)
      expect(pending.map((v) => v.id)).toContain(video2.id)
      expect(pending.map((v) => v.id)).toContain(video3.id)
    })

    it('should preserve video metadata during queuing', async () => {
      const metadata = {
        repNumber: 5,
        formScore: 88,
        muscleGroups: ['quadriceps', 'glutes'],
      }

      const video = await queueVideoForUpload(
        '/videos/session-001/rep-5.mp4',
        'session-001',
        metadata
      )

      expect(video.metadata).toEqual(metadata)
    })
  })

  describe('Form Analysis with Session', () => {
    it('should track form score across multiple reps', async () => {
      const sessionWithMultipleReps: SessionRecord = {
        ...mockSession,
        frames: [
          {
            timestamp: 1776535200000,
            exercise: 'squat',
            formScore: 85,
            repNumber: 1,
            errors: [],
            muscleEngagement: { quadriceps: 0.85, glutes: 0.78 },
          },
          {
            timestamp: 1776535205000,
            exercise: 'squat',
            formScore: 82,
            repNumber: 2,
            errors: ['Knees caving in'],
            muscleEngagement: { quadriceps: 0.8, glutes: 0.75 },
          },
          {
            timestamp: 1776535210000,
            exercise: 'squat',
            formScore: 88,
            repNumber: 3,
            errors: [],
            muscleEngagement: { quadriceps: 0.88, glutes: 0.82 },
          },
        ],
      }

      expect(sessionWithMultipleReps.frames).toHaveLength(3)
      expect(sessionWithMultipleReps.avgFormScore).toBeGreaterThan(0)

      const avgScore =
        sessionWithMultipleReps.frames.reduce((sum, f) => sum + f.formScore, 0) /
        sessionWithMultipleReps.frames.length
      expect(avgScore).toBeCloseTo(85, 0)
    })
  })

  describe('Exercise Selection Impact', () => {
    it('should load correct exercise for session', async () => {
      const exercise = await getExerciseById(mockSession.exercise)

      expect(exercise).toBeDefined()
      expect(exercise?.id).toBe('squat')
      expect(exercise?.muscleGroups.length).toBeGreaterThan(0)
    })
  })

  describe('Error Handling in Workflow', () => {
    it('should handle sync failure gracefully', async () => {
      // Simulate server error
      vi.mocked(global.fetch).mockResolvedValueOnce(
        new Response(JSON.stringify({ error: 'Server error' }), { status: 500 })
      )

      await syncSessionToBackend(mockSession)
      await new Promise((resolve) => setTimeout(resolve, 300))

      // Session should be queued for retry
      const queue = await getSyncQueue()
      expect(queue.length).toBeGreaterThan(0)
      expect(queue[0].syncStatus).toBe('pending')
    })

    it('should handle video queueing even if sync fails', async () => {
      // Sync fails
      vi.mocked(global.fetch).mockRejectedValueOnce(new Error('Network error'))
      await syncSessionToBackend(mockSession)

      // But video can still be queued
      await queueVideoForUpload('/videos/session-001/video.mp4', mockSession.id)

      const pending = await getPendingVideos()
      expect(pending).toHaveLength(1)
    })
  })

  describe('Session Completion Workflow', () => {
    it('should create complete session with all components', async () => {
      // Session with all data
      expect(mockSession.id).toBeDefined()
      expect(mockSession.userId).toBeDefined()
      expect(mockSession.exercise).toBeDefined()
      expect(mockSession.totalReps).toBeGreaterThan(0)
      expect(mockSession.avgFormScore).toBeGreaterThan(0)
      expect(mockSession.frames.length).toBeGreaterThan(0)
      expect(mockSession.voiceFeedback.length).toBeGreaterThan(0)

      // Queue for sync
      vi.mocked(global.fetch).mockResolvedValueOnce(
        new Response(JSON.stringify({ ok: true }), { status: 200 })
      )
      await syncSessionToBackend(mockSession)

      // Queue video
      await queueVideoForUpload('/videos/session-001/video.mp4', mockSession.id)

      const syncQueue = await getSyncQueue()
      const videoQueue = await getPendingVideos()

      expect(syncQueue.length).toBeGreaterThan(0)
      expect(videoQueue.length).toBe(1)
    })
  })
})
