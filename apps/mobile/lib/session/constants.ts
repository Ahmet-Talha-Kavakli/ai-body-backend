/**
 * Session-related constants
 */

export const FORM_ANALYSIS = {
  MIN_CONFIDENCE: 0.6, // Fallback to manual if < 60%
  TARGET_FPS: 30,
  FRAME_SAMPLING: 3, // Analyze every 3rd frame to save CPU
} as const

export const AVATAR = {
  MAX_MESH_VERTICES: 12000,
  DEVICE_TIERS: {
    HIGH: { fps: 30, quality: 'full' }, // iPhone 13+
    MID: { fps: 20, quality: 'reduced' }, // iPhone 11
    LOW: { fps: 15, quality: 'minimal' }, // iPhone 8
  },
  MORPH_ANIMATION_DURATION: 48 * 60 * 60 * 1000, // 48 hours in ms
  WEIGHT_MORPH_FACTOR: 0.01, // 1% size change per 1kg
} as const

export const VOICE = {
  VAPI_TIMEOUT: 4000, // 4 seconds
  QUEUE_MODE: true, // Use queue-based feedback, not real-time
  MIN_REST_BETWEEN_FEEDBACK: 2000, // 2 seconds
} as const

export const SYNC = {
  BATCH_SIZE: 5,
  MAX_RETRIES: 5,
  RETRY_DELAYS: [1000, 2000, 4000, 8000, 16000], // exponential backoff
  CLEANUP_DAYS: 30,
  DUPLICATE_TIME_WINDOW: 2 * 60 * 1000, // 2 minutes
  DUPLICATE_DURATION_TOLERANCE: 0.1, // 10%
} as const

export const EXERCISES = {
  CORE: [
    { id: 'squat', name: 'Squat', variants: ['bodyweight', 'goblet', 'barbell'] },
    { id: 'deadlift', name: 'Deadlift', variants: ['conventional', 'sumo', 'trap-bar'] },
    { id: 'bench', name: 'Bench Press', variants: ['barbell', 'dumbbell'] },
    { id: 'row', name: 'Barbell Row', variants: ['barbell', 'dumbbell'] },
    // Add 15+ more common exercises in full implementation
  ],
} as const
