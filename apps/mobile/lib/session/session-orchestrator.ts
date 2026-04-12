import EventEmitter from 'eventemitter3'
import { FormAnalyzer } from '@/lib/session/form-analyzer'
import { VoiceCoach } from '@/lib/session/voice-coach'
import { SessionConfig, FormAnalysisResult, SessionRecord, SessionFrame } from '@/lib/session/types'
import { insertSessionFrames, insertSessionRecord } from '@/lib/db/session-sqlite'
import { v4 as uuidv4 } from 'uuid'

/**
 * SessionOrchestrator: Core coordinator for session components
 *
 * Orchestrates data flow between:
 * - FormAnalyzer (pose detection & form analysis)
 * - VoiceCoach (voice feedback via VAPI)
 * - FeedbackUI (visual feedback)
 * - SQLite (session persistence)
 *
 * Emits events for each stage of processing:
 * - 'initialized': Session ready to accept frames
 * - 'analysis': New form analysis result
 * - 'visual-feedback': Feedback for UI display
 * - 'error': Component error
 * - 'shutdown': Session ending
 */
export class SessionOrchestrator extends EventEmitter {
  private sessionId: string
  private config: SessionConfig
  private formAnalyzer: FormAnalyzer
  private voiceCoach: VoiceCoach | null = null
  private isInitialized = false
  private running = false
  private startTime: Date | null = null
  private endTime: Date | null = null
  private frames: SessionFrame[] = []
  private error: Error | null = null
  private totalReps = 0
  private formScores: number[] = []

  constructor(config: SessionConfig) {
    super()

    // Validate config
    if (!config.userId || config.userId.trim() === '') {
      throw new Error('userId is required')
    }
    if (!config.exercise || config.exercise.trim() === '') {
      throw new Error('exercise is required')
    }
    if (!config.db) {
      throw new Error('db is required')
    }

    this.sessionId = uuidv4()
    this.config = config
    this.formAnalyzer = new FormAnalyzer()
  }

  /**
   * Initialize orchestrator and components
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return

    try {
      // Load FormAnalyzer model
      await this.formAnalyzer.loadModel()

      // Initialize VoiceCoach if configured
      if (this.config.voiceCoachConfig) {
        this.voiceCoach = new VoiceCoach(this.config.voiceCoachConfig)
        await this.voiceCoach.initialize()
      }

      this.isInitialized = true
      this.running = true
      this.startTime = new Date()
      this.endTime = null
      this.frames = []
      this.totalReps = 0
      this.formScores = []

      this.emit('initialized')
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      this.setError(error)
      throw error
    }
  }

  /**
   * Process camera frame and orchestrate analysis
   *
   * Flow:
   * 1. DetectPose(frame) -> Pose
   * 2. AnalyzeExercise(pose) -> FormAnalysisResult
   * 3. onFormAnalysisResult(result) handles:
   *    - Emit 'visual-feedback' for UI
   *    - Call VoiceCoach.sendFormAnalysis() for voice
   *    - InsertSessionFrames() for persistence
   *    - Emit 'analysis' for state tracking
   */
  async processFrame(frameData: Uint8Array): Promise<void> {
    if (!this.isInitialized || !this.running) {
      throw new Error('Session not initialized')
    }

    try {
      // Detect pose from frame (480x640 assumed)
      const pose = await this.formAnalyzer.detectPose(frameData, 480, 640)

      // Analyze exercise form
      const analysis = await this.formAnalyzer.analyzeExercise(
        pose,
        this.config.exercise,
        this.totalReps + 1
      )

      // Dispatch to all consumers
      await this.onFormAnalysisResult(analysis)
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      this.setError(error)
    }
  }

  /**
   * Handle form analysis result
   *
   * Dispatches to:
   * - VoiceCoach (async voice feedback)
   * - FeedbackUI (visual feedback event)
   * - SQLite (frame persistence)
   * - Event listeners (analysis event)
   */
  async onFormAnalysisResult(analysis: FormAnalysisResult): Promise<void> {
    try {
      // Track form score
      this.formScores.push(analysis.formScore)

      // Track reps
      if (analysis.repNumber > this.totalReps) {
        this.totalReps = analysis.repNumber
      }

      // Create frame record
      const frame: SessionFrame = {
        timestamp: analysis.timestamp,
        exercise: analysis.exercise,
        formScore: analysis.formScore,
        repNumber: analysis.repNumber,
        errors: analysis.errors,
        muscleEngagement: analysis.muscleEngagement,
      }

      this.frames.push(frame)

      // Emit visual feedback for UI
      this.emit('visual-feedback', analysis)

      // Send to VoiceCoach if available
      if (this.voiceCoach) {
        try {
          await this.voiceCoach.sendFormAnalysis(analysis)
        } catch (err) {
          // Log but don't crash on voice feedback failure
          console.warn('VoiceCoach error:', err)
        }
      }

      // Persist to SQLite
      try {
        await insertSessionFrames(this.config.db, this.sessionId, [frame])
      } catch (err) {
        // Log but don't crash on persistence failure
        console.warn('SQLite persistence error:', err)
      }

      // Emit analysis event for state tracking
      this.emit('analysis', analysis)
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      this.setError(error)
    }
  }

  /**
   * Build final session record with aggregated data
   */
  async buildSessionRecord(): Promise<SessionRecord> {
    const avgFormScore =
      this.formScores.length > 0
        ? this.formScores.reduce((a, b) => a + b, 0) / this.formScores.length
        : 0

    const record: SessionRecord = {
      id: this.sessionId,
      userId: this.config.userId,
      exercise: this.config.exercise,
      startTime: this.startTime || new Date(),
      endTime: this.endTime || new Date(),
      totalReps: this.totalReps,
      avgFormScore,
      frames: this.frames,
      voiceFeedback: [],
      syncStatus: 'pending',
    }

    return record
  }

  /**
   * Shutdown orchestrator and clean up resources
   */
  async shutdown(): Promise<void> {
    if (!this.running) return

    try {
      this.endTime = new Date()
      this.running = false

      // Build and persist final record
      const record = await this.buildSessionRecord()
      await insertSessionRecord(this.config.db, {
        id: record.id,
        userId: record.userId,
        exercise: record.exercise,
        startTime: record.startTime,
        endTime: record.endTime,
        totalReps: record.totalReps,
        avgFormScore: record.avgFormScore,
        syncStatus: record.syncStatus,
      })

      // Cleanup components
      if (this.voiceCoach) {
        await this.voiceCoach.shutdown()
      }
      this.formAnalyzer.dispose()

      this.emit('shutdown')
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      this.setError(error)
    }
  }

  /**
   * Get session frames accumulated so far
   */
  async getSessionFrames(): Promise<SessionFrame[]> {
    return this.frames
  }

  /**
   * Get session ID
   */
  getSessionId(): string {
    return this.sessionId
  }

  /**
   * Get exercise name
   */
  getExercise(): string {
    return this.config.exercise
  }

  /**
   * Check if session is running
   */
  isRunning(): boolean {
    return this.running
  }

  /**
   * Set error state and emit error event
   */
  setError(error: Error | null): void {
    this.error = error
    if (error) {
      this.emit('error', error)
    }
  }

  /**
   * Get current error state
   */
  getError(): Error | null {
    return this.error
  }
}
