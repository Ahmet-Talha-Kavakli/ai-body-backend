/**
 * HealthKit Read Service
 *
 * Provides typed access to Apple HealthKit data via react-native-health.
 * Android returns empty arrays (Health Connect handled separately).
 */

import AppleHealthKit from 'react-native-health'
import { Platform } from 'react-native'
import type {
  HeartRateReading,
  SleepSession,
  SleepStages,
  StepData,
  EnergyBurned,
  HealthDateRange,
  HealthDateRangePreset,
} from '../types/health'

// ---------- Constants ----------

const DEFAULT_STEP_GOAL = 10000
const MS_PER_MINUTE = 60 * 1000
const MS_PER_DAY = 24 * 60 * MS_PER_MINUTE
const ANONYMOUS_USER_ID = 'local'

// Re-export convenience aliases (backwards compatible)
export type DateRangeType = HealthDateRangePreset
export type DateRange = HealthDateRange

// ---------- Internal raw sample shapes ----------

interface HealthKitSample {
  id?: string
  value: number
  startDate: string
  endDate: string
  sourceId?: string
  sourceName?: string
}

interface HealthKitSleepSample {
  id?: string
  value: string
  startDate: string
  endDate: string
  sourceId?: string
  sourceName?: string
}

// ---------- Date Range Helpers ----------

export function getDateRange(type: HealthDateRangePreset): HealthDateRange {
  const end = new Date()
  const start = new Date(end)

  if (type === 'today') {
    start.setHours(0, 0, 0, 0)
  } else if (type === 'week') {
    start.setTime(end.getTime() - 7 * MS_PER_DAY)
  } else if (type === 'month') {
    start.setTime(end.getTime() - 30 * MS_PER_DAY)
  }

  return {
    startDate: start.toISOString(),
    endDate: end.toISOString(),
  }
}

// ---------- Callback -> Promise helpers ----------

function callHealthKit<T>(
  method: ((opts: unknown, cb: (err: unknown, res: T) => void) => void) | undefined,
  options: unknown
): Promise<T> {
  return new Promise((resolve) => {
    if (typeof method !== 'function') {
      resolve([] as unknown as T)
      return
    }
    try {
      method(options, (err, res) => {
        if (err) {
          // Fail-soft: return empty result
          resolve([] as unknown as T)
          return
        }
        resolve(res ?? ([] as unknown as T))
      })
    } catch {
      resolve([] as unknown as T)
    }
  })
}

// ---------- Mapping helpers ----------

function durationInMinutes(startDate: string, endDate: string): number {
  const diff = new Date(endDate).getTime() - new Date(startDate).getTime()
  return Math.max(0, Math.round(diff / MS_PER_MINUTE))
}

function bucketSleepStage(raw: string, minutes: number, acc: SleepStages): void {
  const v = (raw || '').toUpperCase()
  if (v.includes('AWAKE')) acc.awakeMinutes += minutes
  else if (v.includes('REM')) acc.remMinutes += minutes
  else if (v.includes('DEEP')) acc.deepMinutes += minutes
  else if (v.includes('CORE') || v.includes('LIGHT')) acc.lightMinutes += minutes
  // INBED / ASLEEP untyped — ignored for stage breakdown
}

// ---------- Read APIs ----------

export async function getHeartRate(range: HealthDateRange): Promise<HeartRateReading[]> {
  if (Platform.OS !== 'ios') return []

  const samples = await callHealthKit<HealthKitSample[]>(
    AppleHealthKit.getHeartRateSamples as never,
    { ...range, ascending: true }
  )

  if (!Array.isArray(samples)) return []

  return samples.map((s, idx) => ({
    id: s.id ?? `hr-${s.startDate}-${idx}`,
    userId: ANONYMOUS_USER_ID,
    bpm: Math.round(s.value),
    timestamp: s.startDate,
    sourceDevice: s.sourceName ?? s.sourceId,
  }))
}

export async function getSleep(range: HealthDateRange): Promise<SleepSession[]> {
  if (Platform.OS !== 'ios') return []

  const samples = await callHealthKit<HealthKitSleepSample[]>(
    AppleHealthKit.getSleepSamples as never,
    { ...range, ascending: true }
  )

  if (!Array.isArray(samples)) return []

  // Group by session (contiguous start/end pairs from same source)
  // For the minimal impl, each sample is a session; aggregate stages if overlapping.
  return samples.map((s, idx) => {
    const duration = durationInMinutes(s.startDate, s.endDate)
    const stages: SleepStages = {
      remMinutes: 0,
      deepMinutes: 0,
      lightMinutes: 0,
      awakeMinutes: 0,
    }
    bucketSleepStage(s.value, duration, stages)

    return {
      id: s.id ?? `sleep-${s.startDate}-${idx}`,
      userId: ANONYMOUS_USER_ID,
      startTime: s.startDate,
      endTime: s.endDate,
      durationMinutes: duration,
      stages,
      source: s.sourceName ?? s.sourceId,
    }
  })
}

export async function getSteps(range: HealthDateRange): Promise<StepData[]> {
  if (Platform.OS !== 'ios') return []

  const samples = await callHealthKit<HealthKitSample[]>(
    AppleHealthKit.getDailyStepCountSamples as never,
    { ...range, ascending: true }
  )

  if (!Array.isArray(samples)) return []

  return samples.map((s) => ({
    date: s.startDate.slice(0, 10),
    count: Math.round(s.value),
    goalCount: DEFAULT_STEP_GOAL,
  }))
}

export async function getEnergyBurned(range: HealthDateRange): Promise<EnergyBurned[]> {
  if (Platform.OS !== 'ios') return []

  const [active, basal] = await Promise.all([
    callHealthKit<HealthKitSample[]>(AppleHealthKit.getActiveEnergyBurned as never, {
      ...range,
      ascending: true,
    }),
    callHealthKit<HealthKitSample[]>(
      (AppleHealthKit as unknown as Record<string, unknown>).getBasalEnergyBurned as never,
      { ...range, ascending: true }
    ),
  ])

  // Bucket by date (YYYY-MM-DD) and sum
  const buckets = new Map<string, { activeCalories: number; basalCalories: number }>()

  const addToBucket = (
    list: HealthKitSample[] | undefined,
    key: 'activeCalories' | 'basalCalories'
  ) => {
    if (!Array.isArray(list)) return
    for (const s of list) {
      const day = s.startDate.slice(0, 10)
      const existing = buckets.get(day) ?? { activeCalories: 0, basalCalories: 0 }
      existing[key] += s.value ?? 0
      buckets.set(day, existing)
    }
  }

  addToBucket(active, 'activeCalories')
  addToBucket(basal, 'basalCalories')

  return Array.from(buckets.entries()).map(([date, bucket]) => ({
    date,
    activeCalories: Math.round(bucket.activeCalories),
    basalCalories: Math.round(bucket.basalCalories),
    totalCalories: Math.round(bucket.activeCalories + bucket.basalCalories),
  }))
}
