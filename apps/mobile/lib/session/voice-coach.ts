import { VoiceCoachConfig, VoiceMessage, FormAnalysisResult } from '@/lib/session/types'
import { VOICE } from '@/lib/session/constants'

/**
 * VoiceCoach: AI-powered voice feedback system using VAPI integration
 *
 * Responsibilities:
 * 1. Connect to VAPI SDK for real-time voice feedback
 * 2. Queue and manage feedback from FormAnalyzer
 * 3. Batch similar corrections to avoid feedback overload
 * 4. Fallback to TTS (Text-to-Speech) on VAPI timeout
 * 5. Support Turkish and English voice feedback
 * 6. Manage feedback queue (FIFO) for UI consumption
 * 7. Track connection state and error handling
 */
export class VoiceCoach {
  private config: VoiceCoachConfig
  private connected = false
  private feedbackQueue: VoiceMessage[] = []
  private lastBatchedErrors: Map<string, number> = new Map()
  private readonly batchThreshold: number
  private readonly vapiTimeout: number
  private abortController: AbortController | null = null
  private state = {
    isListening: true,
    isProcessing: false,
    error: null as Error | null,
  }

  constructor(config: VoiceCoachConfig) {
    // Validate required fields
    if (!config.apiKey) {
      throw new Error('VoiceCoachConfig: apiKey is required')
    }
    if (!config.assistantId) {
      throw new Error('VoiceCoachConfig: assistantId is required')
    }
    if (!config.language) {
      throw new Error('VoiceCoachConfig: language is required')
    }
    if (!config.timeout || config.timeout < 1000) {
      throw new Error('VoiceCoachConfig: timeout must be >= 1000ms')
    }
    if (config.enableFallback === undefined) {
      throw new Error('VoiceCoachConfig: enableFallback is required')
    }

    this.config = config
    this.vapiTimeout = config.timeout
    this.batchThreshold = VOICE.MIN_REST_BETWEEN_FEEDBACK
  }

  /**
   * Initialize connection to VAPI SDK
   */
  async initialize(): Promise<void> {
    try {
      this.abortController = new AbortController()

      // In production, would initialize VAPI SDK here
      // import { Vapi } from 'vapi-js'
      // const vapi = new Vapi(this.config.apiKey)
      // const assistant = await vapi.getAssistant(this.config.assistantId)
      // await vapi.connect()

      // For now, simulate successful connection
      this.connected = true
      this.state.isListening = true
      this.clearError()
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      this.setError(err)
      throw err
    }
  }

  /**
   * Send form analysis result for voice feedback
   */
  async sendFormAnalysis(analysis: FormAnalysisResult): Promise<void> {
    if (!this.connected) {
      this.setError(new Error('VoiceCoach not connected — feedback dropped'))
      return
    }

    try {
      this.state.isProcessing = true

      // Check if we should batch this feedback
      if (this.shouldBatchFeedback(analysis)) {
        return
      }

      // Generate feedback message from analysis
      const message = this._generateFeedbackMessage(analysis)

      // Try VAPI first, fallback to TTS
      let feedback: VoiceMessage

      try {
        const vapiResponse = await this._callVAPI(message)
        feedback = {
          id: this._generateId(),
          text: vapiResponse,
          type: this._determineFeedbackType(analysis),
          timestamp: Date.now(),
          played: false,
        }
      } catch (error) {
        // Fallback to TTS if enabled
        if (this.config.enableFallback) {
          feedback = await this._fallbackTTS(message)
        } else {
          throw error
        }
      }

      this.feedbackQueue.push(feedback)

      // Track this error for batching
      this._recordErrorBatch(analysis)
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      this.setError(err)
    } finally {
      this.state.isProcessing = false
    }
  }

  /**
   * Private: Generate feedback message from form analysis
   */
  private _generateFeedbackMessage(analysis: FormAnalysisResult): string {
    const parts: string[] = []

    // Exercise context
    parts.push(`During ${analysis.exercise}`)

    // Critical errors first
    const criticalErrors = analysis.errors.filter((e) => e.severity === 'high')
    if (criticalErrors.length > 0) {
      const cues = criticalErrors.map((e) => e.cue).join(' and ')
      parts.push(`: ${cues}`)
    }

    // Form score feedback
    if (analysis.formScore < 60) {
      parts.push('Your form score is low. Focus on maintaining proper form.')
    } else if (analysis.formScore < 75) {
      parts.push('Good effort. Try to improve your form slightly.')
    } else {
      parts.push('Excellent form!')
    }

    // Depth assessment
    if (analysis.depthAssessment === 'shallow') {
      parts.push('Increase your range of motion for deeper engagement.')
    } else if (analysis.depthAssessment === 'partial') {
      parts.push('Try to achieve full depth for maximum effect.')
    }

    return parts.join(' ')
  }

  /**
   * Get next feedback from queue (FIFO)
   */
  getFeedback(): VoiceMessage | null {
    if (this.feedbackQueue.length === 0) {
      return null
    }

    const feedback = this.feedbackQueue.shift()!
    return feedback
  }

  /**
   * Private: Call VAPI API with configured timeout
   */
  private async _callVAPI(message: string): Promise<string> {
    if (!this.abortController) {
      throw new Error('VoiceCoach not initialized')
    }

    try {
      // In production, would call actual VAPI endpoint:
      // const response = await fetch(vapiEndpoint, {
      //   method: 'POST',
      //   headers: { 'Authorization': `Bearer ${this.config.apiKey}` },
      //   body: JSON.stringify({
      //     assistantId: this.config.assistantId,
      //     message: message
      //   }),
      //   signal: this.abortController.signal,
      //   timeout: this.vapiTimeout
      // })

      // Simulate VAPI call with configured timeout
      return await this._simulateVAPICall(message, this.vapiTimeout)
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('VAPI request timeout')
      }
      throw error
    }
  }

  /**
   * Private: Generate TTS fallback message
   */
  private async _fallbackTTS(message: string): Promise<VoiceMessage> {
    // In production, would use:
    // import * as Speech from 'expo-speech'
    // await Speech.speak(message, { language: this._getLanguageCode() })

    // For now, return the message as-is
    return {
      id: this._generateId(),
      text: message,
      type: 'feedback',
      timestamp: Date.now(),
      played: false,
    }
  }

  /**
   * Start listening for feedback requests
   */
  startListening(): void {
    this.state.isListening = true
  }

  /**
   * Stop listening for feedback requests
   */
  stopListening(): void {
    this.state.isListening = false
  }

  /**
   * Shutdown and cleanup resources
   */
  shutdown(): void {
    if (this.abortController) {
      this.abortController.abort()
    }

    this.feedbackQueue = []
    this.lastBatchedErrors.clear()
    this.connected = false
  }

  /**
   * Get current configuration
   */
  getConfig(): VoiceCoachConfig {
    return this.config
  }

  /**
   * Get current state
   */
  getState() {
    return { ...this.state }
  }

  /**
   * Get current feedback queue
   */
  getQueue(): VoiceMessage[] {
    return [...this.feedbackQueue]
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.connected
  }

  /**
   * Set error state
   */
  setError(error: Error): void {
    this.state.error = error
  }

  /**
   * Clear error state
   */
  clearError(): void {
    this.state.error = null
  }

  /**
   * Private: Check if feedback should be batched
   */
  private shouldBatchFeedback(analysis: FormAnalysisResult): boolean {
    if (analysis.errors.length === 0) {
      return false
    }

    const errorKey = this._getErrorKey(analysis)
    const lastTime = this.lastBatchedErrors.get(errorKey)

    if (!lastTime) {
      return false
    }

    // Batch if same error within threshold
    return Date.now() - lastTime < this.batchThreshold
  }

  /**
   * Private: Record error for batching
   */
  private _recordErrorBatch(analysis: FormAnalysisResult): void {
    if (analysis.errors.length > 0) {
      const errorKey = this._getErrorKey(analysis)
      this.lastBatchedErrors.set(errorKey, Date.now())
    }
  }

  /**
   * Private: Get error key for batching
   */
  private _getErrorKey(analysis: FormAnalysisResult): string {
    if (analysis.errors.length === 0) {
      return ''
    }

    const error = analysis.errors[0]
    return `${analysis.exercise}-${error.bodyPart}-${error.cue}`
  }

  /**
   * Private: Determine feedback type based on analysis
   */
  private _determineFeedbackType(
    analysis: FormAnalysisResult
  ): 'feedback' | 'encouragement' | 'correction' {
    if (analysis.errors.length === 0) {
      return 'encouragement'
    }

    const hasHighSeverity = analysis.errors.some((e) => e.severity === 'high')
    return hasHighSeverity ? 'correction' : 'feedback'
  }

  /**
   * Private: Generate unique ID
   */
  private _generateId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Private: Get language code for TTS
   */
  private _getLanguageCode(): string {
    return this.config.language === 'tr' ? 'tr-TR' : 'en-US'
  }

  /**
   * Private: Simulate VAPI API call
   */
  private async _simulateVAPICall(message: string, timeout: number): Promise<string> {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error('VAPI timeout'))
      }, timeout)

      // Simulate processing
      setTimeout(() => {
        clearTimeout(timeoutId)
        // Return a reasonable response based on input
        const responses: Record<string, string> = {
          'Keep back straight':
            'Excellent observation. Maintain spinal alignment throughout the movement.',
          'Knee alignment': 'Good point. Ensure knees track over your toes.',
          'Increase your range of motion for deeper engagement.':
            'Well done. Going deeper will maximize muscle engagement.',
        }

        const response =
          responses[message] ||
          `Got it. ${message.charAt(0).toLowerCase()}${message.slice(1)} Keep it up!`

        resolve(response)
      }, Math.random() * 100)
    })
  }
}
