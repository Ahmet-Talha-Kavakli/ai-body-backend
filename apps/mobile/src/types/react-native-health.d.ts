// Minimal ambient type shim for react-native-health.
// Full types ship with the package once installed; this keeps typecheck
// and tests happy until the native dependency is added to package.json.

declare module 'react-native-health' {
  export interface HealthInputOptions {
    startDate: string
    endDate?: string
    ascending?: boolean
    limit?: number
    unit?: string
  }

  export interface HealthValue {
    id?: string
    value: number
    startDate: string
    endDate: string
    sourceId?: string
    sourceName?: string
  }

  export interface HealthSleepValue {
    id?: string
    value: string
    startDate: string
    endDate: string
    sourceId?: string
    sourceName?: string
  }

  type Callback<T> = (error: string | null, result: T) => void

  export interface AppleHealthKit {
    initHealthKit(permissions: unknown, cb: Callback<unknown>): void
    getHeartRateSamples(opts: HealthInputOptions, cb: Callback<HealthValue[]>): void
    getSleepSamples(opts: HealthInputOptions, cb: Callback<HealthSleepValue[]>): void
    getDailyStepCountSamples(opts: HealthInputOptions, cb: Callback<HealthValue[]>): void
    getActiveEnergyBurned(opts: HealthInputOptions, cb: Callback<HealthValue[]>): void
    getBasalEnergyBurned?(opts: HealthInputOptions, cb: Callback<HealthValue[]>): void
  }

  const AppleHealthKit: AppleHealthKit
  export default AppleHealthKit
}
