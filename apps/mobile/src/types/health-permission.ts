// Health permission types for HealthKit / Health Connect access control

export interface HealthPermissionStatus {
  /** Whether the user has granted heart rate read access. */
  heartRate: boolean
  /** Whether the user has granted sleep analysis read access. */
  sleep: boolean
  /** Whether the user has granted step count read access. */
  steps: boolean
  /** Whether the user has granted active / basal energy read access. */
  energy: boolean
  /** True when every requested permission has been granted. */
  granted: boolean
  /** Platform the status was resolved for. */
  platform?: 'ios' | 'android' | 'unsupported'
  /** Timestamp (ISO) when the status was last resolved. */
  checkedAt?: string
}

export type HealthPermissionKey = 'heartRate' | 'sleep' | 'steps' | 'energy'
