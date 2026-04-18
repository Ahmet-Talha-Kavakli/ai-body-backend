/**
 * Video and Media Types
 */

export interface VideoMeta {
  id: string
  exerciseId: string
  setNumber: number
  repNumber?: number
  startedAt: number
  endedAt: number
  duration: number // Milliseconds
  frameRate: number
  resolution: {
    width: number
    height: number
  }
  uri: string // Local file path or S3 URL
  thumbnail?: string
  uploadStatus: 'pending' | 'uploading' | 'completed' | 'failed'
  uploadProgress?: number // 0-100
}

export interface VideoUploadQueue {
  id: string
  videoId: string
  sessionId: string
  status: 'pending' | 'processing' | 'uploading' | 'completed' | 'failed'
  priority: number
  attempts: number
  lastAttempt?: number
  error?: string
  formAnalysisResult?: string // Stringified FormAnalysisResult
  createdAt: number
  updatedAt: number
}
