import type { ID, Timestamp } from './common'

export interface WearableDevice {
  id: ID
  userId: ID
  type: WearableType
  brand: string
  model: string
  isConnected: boolean
  lastSyncedAt?: Timestamp
  accessToken?: string // encrypted
}

export type WearableType = 'apple_watch' | 'garmin' | 'fitbit' | 'google_fit' | 'samsung_health'

export interface WearableReading {
  id: ID
  deviceId: ID
  userId: ID
  type: WearableReadingType
  value: number
  unit: string
  recordedAt: Timestamp
}

export type WearableReadingType =
  | 'heart_rate'
  | 'steps'
  | 'calories_burned'
  | 'sleep_minutes'
  | 'hrv'
  | 'spo2'
  | 'stress_level'
  | 'body_temperature'

export interface DailyHealthSummary {
  date: string
  avgHeartRate?: number
  restingHeartRate?: number
  steps?: number
  activeCalories?: number
  sleepMinutes?: number
  hrvMs?: number
  readinessScore?: number // 0-100 AI calculated
}
