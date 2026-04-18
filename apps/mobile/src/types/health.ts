// Health data types for HealthKit / Health Connect integration

export interface HeartRateReading {
  id: string
  userId: string
  bpm: number
  timestamp: string
  sourceDevice?: string
  context?: string
}

export interface SleepStages {
  remMinutes: number
  deepMinutes: number
  lightMinutes: number
  awakeMinutes: number
}

export interface SleepSession {
  id: string
  userId: string
  startTime: string
  endTime: string
  durationMinutes: number
  stages?: SleepStages
  source?: string
}

export interface StepData {
  date: string
  count: number
  goalCount: number
  distance?: number
}

export interface EnergyBurned {
  date: string
  activeCalories: number
  basalCalories: number
  totalCalories: number
}

export interface DailyHealthSummary {
  date: string
  heartRateAvg?: number
  heartRateResting?: number
  sleepDurationMinutes?: number
  stepCount?: number
  activeCalories?: number
}

export type HealthDateRangePreset = 'today' | 'week' | 'month'

export interface HealthDateRange {
  startDate: string
  endDate: string
}
