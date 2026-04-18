/**
 * Health Permission Service
 *
 * Thin wrapper around Apple HealthKit authorization via react-native-health.
 * Android is not yet supported (Health Connect coming soon) — on Android we
 * return a fully-denied status without throwing.
 */

import AppleHealthKit from 'react-native-health'
import { Platform } from 'react-native'
import type { HealthPermissionKey, HealthPermissionStatus } from '../types/health-permission'

// ---------- Constants ----------

const PERMISSION_KEYS: readonly HealthPermissionKey[] = [
  'heartRate',
  'sleep',
  'steps',
  'energy',
] as const

// Apple's getAuthStatus returns numeric codes for each permission in the
// requested order. 1 (or SharingAuthorized) = granted, everything else = denied.
const AUTH_STATUS_GRANTED = 1

// Cached snapshot of the last resolved status — returned by checkHealthPermissions
// without re-prompting the user.
let cachedStatus: HealthPermissionStatus | null = null

// All-denied template used whenever we can't reach HealthKit (Android, missing
// native module, init failure, etc.).
const DENIED_PERMISSIONS: Pick<HealthPermissionStatus, HealthPermissionKey> = {
  heartRate: false,
  sleep: false,
  steps: false,
  energy: false,
}

// ---------- Helpers ----------

function resolvePlatform(): HealthPermissionStatus['platform'] {
  if (Platform.OS === 'ios') return 'ios'
  if (Platform.OS === 'android') return 'android'
  return 'unsupported'
}

function permissionsPayload() {
  const P =
    (
      AppleHealthKit as unknown as {
        Constants?: { Permissions?: Record<string, string> }
      }
    ).Constants?.Permissions ?? {}

  // Request read-only access to the 4 metrics we care about. Energy covers
  // both active + basal since they're merged under a single permission slot.
  const readPerms = [
    P.HeartRate,
    P.SleepAnalysis,
    P.StepCount,
    P.ActiveEnergyBurned,
    P.BasalEnergyBurned,
  ].filter(Boolean) as string[]

  return {
    permissions: {
      read: readPerms,
      write: [] as string[],
    },
  }
}

function mapAuthStatusToPermissions(
  readStatuses: unknown
): Pick<HealthPermissionStatus, HealthPermissionKey> {
  const arr = Array.isArray(readStatuses) ? readStatuses : []
  const isGranted = (idx: number): boolean => arr[idx] === AUTH_STATUS_GRANTED

  // Order matches permissionsPayload().permissions.read above.
  const heartRate = isGranted(0)
  const sleep = isGranted(1)
  const steps = isGranted(2)
  const energy = isGranted(3) || isGranted(4)

  return { heartRate, sleep, steps, energy }
}

function finalize(
  partial: Pick<HealthPermissionStatus, HealthPermissionKey>,
  platform: HealthPermissionStatus['platform']
): HealthPermissionStatus {
  const granted = partial.heartRate && partial.sleep && partial.steps && partial.energy
  const status: HealthPermissionStatus = {
    ...partial,
    granted,
    platform,
    checkedAt: new Date().toISOString(),
  }
  cachedStatus = status
  return status
}

// ---------- Public API ----------

/**
 * Returns true when the device can source data from Apple HealthKit.
 * Android (and other platforms) return false until Health Connect lands.
 */
export async function isHealthKitAvailable(): Promise<boolean> {
  return Platform.OS === 'ios'
}

/**
 * Prompts the user for HealthKit read access and resolves with the resulting
 * permission status. Safe to call on Android — returns a denied status.
 */
export async function requestHealthPermissions(): Promise<HealthPermissionStatus> {
  if (Platform.OS !== 'ios') {
    return finalize(DENIED_PERMISSIONS, resolvePlatform())
  }

  const initOk = await new Promise<boolean>((resolve) => {
    const init = (
      AppleHealthKit as unknown as {
        initHealthKit?: (opts: unknown, cb: (err: unknown) => void) => void
      }
    ).initHealthKit
    if (typeof init !== 'function') {
      resolve(false)
      return
    }
    try {
      init(permissionsPayload(), (err) => resolve(!err))
    } catch {
      resolve(false)
    }
  })

  if (!initOk) {
    return finalize(DENIED_PERMISSIONS, 'ios')
  }

  return checkHealthPermissions()
}

/**
 * Reads (without prompting) the current HealthKit authorization status.
 * Falls back to the cached value when a fresh read is not possible.
 */
export async function checkHealthPermissions(): Promise<HealthPermissionStatus> {
  if (Platform.OS !== 'ios') {
    return finalize(DENIED_PERMISSIONS, resolvePlatform())
  }

  const getAuthStatus = (
    AppleHealthKit as unknown as {
      getAuthStatus?: (opts: unknown, cb: (err: unknown, res: unknown) => void) => void
    }
  ).getAuthStatus

  if (typeof getAuthStatus !== 'function') {
    // API surface missing (older native module) — fall back to cache or denied.
    return cachedStatus ?? finalize(DENIED_PERMISSIONS, 'ios')
  }

  const raw = await new Promise<unknown>((resolve) => {
    try {
      getAuthStatus(permissionsPayload(), (err, res) => {
        if (err) {
          resolve(null)
          return
        }
        resolve(res)
      })
    } catch {
      resolve(null)
    }
  })

  const readStatuses =
    (raw as { permissions?: { read?: unknown[] } } | null)?.permissions?.read ?? []

  return finalize(mapAuthStatusToPermissions(readStatuses), 'ios')
}

// ---------- Test utilities ----------

/**
 * Clears the in-memory permission cache. Exported primarily so tests can
 * reset module state between scenarios.
 */
export function __resetHealthPermissionCache(): void {
  cachedStatus = null
}

export { PERMISSION_KEYS }
