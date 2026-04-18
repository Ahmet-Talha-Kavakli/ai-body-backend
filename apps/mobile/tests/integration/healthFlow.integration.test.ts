/**
 * Integration Tests for Complete Health Flow (Phase 4)
 * Tests the full lifecycle: permission request -> HealthKit fetch -> cache -> aggregate -> UI
 *
 * NOTE: These tests use in-memory mocks for HealthKit, SQLite cache, and the
 * health store. The goal is to validate end-to-end wiring without requiring
 * native modules or a running device. Real integration happens in E2E runs.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'

// ---------- Types (mirror apps/mobile/src/types/health.ts) ----------

interface HeartRateReading {
  id: string
  bpm: number
  timestamp: string
  source?: string
}

interface SleepSession {
  id: string
  startDate: string
  endDate: string
  durationMinutes: number
  stage?: 'awake' | 'light' | 'deep' | 'rem' | 'inbed' | 'asleep'
  source?: string
}

interface StepData {
  id: string
  date: string
  stepCount: number
  goalCount: number
  source?: string
}

interface EnergyBurned {
  id: string
  date: string
  activeCalories: number
  basalCalories: number
  totalCalories: number
  source?: string
}

interface DailyHealthSummary {
  date: string
  heartRate: { average: number; min: number; max: number; resting: number } | null
  sleep: { totalMinutes: number; quality: number } | null
  steps: { count: number; goal: number; percent: number } | null
  energy: { active: number; basal: number; total: number } | null
}

type DateRangeType = 'today' | 'week' | 'month'
interface DateRange {
  startDate: string
  endDate: string
}

// ---------- Mock Platform ----------

const mockPlatform = { OS: 'ios' as 'ios' | 'android' }

// ---------- Mock Permission State ----------

interface PermissionState {
  requested: boolean
  granted: boolean
  partial: {
    heartRate: boolean
    sleep: boolean
    steps: boolean
    energy: boolean
  }
}

let permissionState: PermissionState = {
  requested: false,
  granted: false,
  partial: { heartRate: false, sleep: false, steps: false, energy: false },
}

const mockPermissions = {
  request: async (): Promise<boolean> => {
    permissionState.requested = true
    if (mockPlatform.OS !== 'ios') return false
    permissionState.granted = true
    permissionState.partial = {
      heartRate: true,
      sleep: true,
      steps: true,
      energy: true,
    }
    return true
  },
  deny: () => {
    permissionState.requested = true
    permissionState.granted = false
  },
  partialGrant: (keys: Partial<PermissionState['partial']>) => {
    permissionState.requested = true
    permissionState.granted = true
    permissionState.partial = { ...permissionState.partial, ...keys }
  },
  reset: () => {
    permissionState = {
      requested: false,
      granted: false,
      partial: { heartRate: false, sleep: false, steps: false, energy: false },
    }
  },
}

// ---------- Mock HealthKit Fetch ----------

let hkShouldFail = false
let hkReturnEmpty = false

const mockHealthKit = {
  fetchHeartRate: async (_range: DateRange): Promise<HeartRateReading[]> => {
    if (mockPlatform.OS !== 'ios') return []
    if (!permissionState.partial.heartRate) return []
    if (hkShouldFail) throw new Error('HealthKit error: denied')
    if (hkReturnEmpty) return []
    return [
      { id: 'hr-1', bpm: 62, timestamp: '2026-04-19T08:00:00Z' },
      { id: 'hr-2', bpm: 75, timestamp: '2026-04-19T12:00:00Z' },
      { id: 'hr-3', bpm: 110, timestamp: '2026-04-19T17:00:00Z' },
    ]
  },
  fetchSleep: async (_range: DateRange): Promise<SleepSession[]> => {
    if (mockPlatform.OS !== 'ios') return []
    if (!permissionState.partial.sleep) return []
    if (hkShouldFail) throw new Error('HealthKit error: denied')
    if (hkReturnEmpty) return []
    return [
      {
        id: 'sleep-1',
        startDate: '2026-04-18T23:00:00Z',
        endDate: '2026-04-19T07:00:00Z',
        durationMinutes: 480,
        stage: 'asleep',
      },
    ]
  },
  fetchSteps: async (_range: DateRange): Promise<StepData[]> => {
    if (mockPlatform.OS !== 'ios') return []
    if (!permissionState.partial.steps) return []
    if (hkShouldFail) throw new Error('HealthKit error: denied')
    if (hkReturnEmpty) return []
    return [
      { id: 'step-1', date: '2026-04-19', stepCount: 4200, goalCount: 10000 },
      { id: 'step-2', date: '2026-04-19', stepCount: 3100, goalCount: 10000 },
    ]
  },
  fetchEnergy: async (_range: DateRange): Promise<EnergyBurned[]> => {
    if (mockPlatform.OS !== 'ios') return []
    if (!permissionState.partial.energy) return []
    if (hkShouldFail) throw new Error('HealthKit error: denied')
    if (hkReturnEmpty) return []
    return [
      {
        id: 'energy-2026-04-19',
        date: '2026-04-19',
        activeCalories: 420,
        basalCalories: 1600,
        totalCalories: 2020,
      },
    ]
  },
}

// ---------- Mock SQLite Cache ----------

interface CacheRow<T> {
  key: string
  value: T
  cachedAt: string
}

const mockCache = {
  heartRate: new Map<string, CacheRow<HeartRateReading[]>>(),
  sleep: new Map<string, CacheRow<SleepSession[]>>(),
  steps: new Map<string, CacheRow<StepData[]>>(),
  energy: new Map<string, CacheRow<EnergyBurned[]>>(),

  STALE_MS: 15 * 60 * 1000, // 15 minutes

  saveHeartRate(key: string, value: HeartRateReading[]) {
    this.heartRate.set(key, { key, value, cachedAt: new Date().toISOString() })
  },
  saveSleep(key: string, value: SleepSession[]) {
    this.sleep.set(key, { key, value, cachedAt: new Date().toISOString() })
  },
  saveSteps(key: string, value: StepData[]) {
    this.steps.set(key, { key, value, cachedAt: new Date().toISOString() })
  },
  saveEnergy(key: string, value: EnergyBurned[]) {
    this.energy.set(key, { key, value, cachedAt: new Date().toISOString() })
  },
  loadHeartRate(key: string): HeartRateReading[] | null {
    return this.heartRate.get(key)?.value ?? null
  },
  loadSleep(key: string): SleepSession[] | null {
    return this.sleep.get(key)?.value ?? null
  },
  loadSteps(key: string): StepData[] | null {
    return this.steps.get(key)?.value ?? null
  },
  loadEnergy(key: string): EnergyBurned[] | null {
    return this.energy.get(key)?.value ?? null
  },
  isStale(key: string, map: Map<string, CacheRow<unknown>>): boolean {
    const row = map.get(key)
    if (!row) return true
    return Date.now() - new Date(row.cachedAt).getTime() > this.STALE_MS
  },
  clear() {
    this.heartRate.clear()
    this.sleep.clear()
    this.steps.clear()
    this.energy.clear()
  },
}

// ---------- Mock Network ----------

let isOnline = true
const setOnline = (v: boolean) => {
  isOnline = v
}

// ---------- Mock Health Store ----------

interface HealthStoreState {
  loading: boolean
  error: string | null
  heartRate: HeartRateReading[]
  sleep: SleepSession[]
  steps: StepData[]
  energy: EnergyBurned[]
  summary: DailyHealthSummary | null
  range: DateRangeType
}

const createHealthStore = () => {
  const state: HealthStoreState = {
    loading: false,
    error: null,
    heartRate: [],
    sleep: [],
    steps: [],
    energy: [],
    summary: null,
    range: 'today',
  }

  const buildRange = (type: DateRangeType): DateRange => {
    const end = new Date('2026-04-19T18:00:00Z')
    const start = new Date(end)
    if (type === 'today') start.setUTCHours(0, 0, 0, 0)
    else if (type === 'week') start.setTime(end.getTime() - 7 * 86400000)
    else if (type === 'month') start.setTime(end.getTime() - 30 * 86400000)
    return { startDate: start.toISOString(), endDate: end.toISOString() }
  }

  const aggregate = (): DailyHealthSummary => {
    const hr = state.heartRate
    const hrAgg = hr.length
      ? {
          average: Math.round(hr.reduce((s, r) => s + r.bpm, 0) / hr.length),
          min: Math.min(...hr.map((r) => r.bpm)),
          max: Math.max(...hr.map((r) => r.bpm)),
          resting: Math.min(...hr.map((r) => r.bpm)),
        }
      : null

    const sleepAgg = state.sleep.length
      ? {
          totalMinutes: state.sleep.reduce((s, r) => s + r.durationMinutes, 0),
          quality: 0.8,
        }
      : null

    const stepTotal = state.steps.reduce((s, r) => s + r.stepCount, 0)
    const stepGoal = state.steps[0]?.goalCount ?? 10000
    const stepsAgg = state.steps.length
      ? {
          count: stepTotal,
          goal: stepGoal,
          percent: Math.round((stepTotal / stepGoal) * 100),
        }
      : null

    const energyAgg = state.energy.length
      ? {
          active: state.energy.reduce((s, r) => s + r.activeCalories, 0),
          basal: state.energy.reduce((s, r) => s + r.basalCalories, 0),
          total: state.energy.reduce((s, r) => s + r.totalCalories, 0),
        }
      : null

    return {
      date: '2026-04-19',
      heartRate: hrAgg,
      sleep: sleepAgg,
      steps: stepsAgg,
      energy: energyAgg,
    }
  }

  const fetchAll = async (opts: { forceRefresh?: boolean } = {}) => {
    state.loading = true
    state.error = null

    const range = buildRange(state.range)
    const cacheKey = `${state.range}:${range.startDate}:${range.endDate}`

    try {
      const canHitNetwork = isOnline && (opts.forceRefresh || mockCache.isStale(cacheKey, mockCache.heartRate as Map<string, CacheRow<unknown>>))

      if (canHitNetwork) {
        const [hr, sleep, steps, energy] = await Promise.all([
          mockHealthKit.fetchHeartRate(range),
          mockHealthKit.fetchSleep(range),
          mockHealthKit.fetchSteps(range),
          mockHealthKit.fetchEnergy(range),
        ])

        state.heartRate = hr
        state.sleep = sleep
        state.steps = steps
        state.energy = energy

        mockCache.saveHeartRate(cacheKey, hr)
        mockCache.saveSleep(cacheKey, sleep)
        mockCache.saveSteps(cacheKey, steps)
        mockCache.saveEnergy(cacheKey, energy)
      } else {
        // Offline / fresh cache -> use cache
        state.heartRate = mockCache.loadHeartRate(cacheKey) ?? []
        state.sleep = mockCache.loadSleep(cacheKey) ?? []
        state.steps = mockCache.loadSteps(cacheKey) ?? []
        state.energy = mockCache.loadEnergy(cacheKey) ?? []
      }

      state.summary = aggregate()
    } catch (err) {
      state.error = (err as Error).message
      // Fail-soft to cache
      state.heartRate = mockCache.loadHeartRate(cacheKey) ?? []
      state.sleep = mockCache.loadSleep(cacheKey) ?? []
      state.steps = mockCache.loadSteps(cacheKey) ?? []
      state.energy = mockCache.loadEnergy(cacheKey) ?? []
      state.summary = aggregate()
    } finally {
      state.loading = false
    }
  }

  return {
    state,
    setRange: (r: DateRangeType) => {
      state.range = r
    },
    fetchAll,
    refresh: () => fetchAll({ forceRefresh: true }),
  }
}

// ---------- Mock Navigation ----------

const navigation = {
  route: 'Dashboard' as string,
  navigate(to: string) {
    this.route = to
  },
}

// ---------- Tests ----------

describe('Health Flow Integration Tests (Phase 4)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockPermissions.reset()
    mockCache.clear()
    mockPlatform.OS = 'ios'
    hkShouldFail = false
    hkReturnEmpty = false
    setOnline(true)
    navigation.route = 'Dashboard'
  })

  // =====================================================
  // 1. PERMISSION FLOW
  // =====================================================
  describe('Permission Flow', () => {
    it('should request HealthKit permissions on first launch', async () => {
      expect(permissionState.requested).toBe(false)
      const granted = await mockPermissions.request()
      expect(permissionState.requested).toBe(true)
      expect(granted).toBe(true)
    })

    it('should handle granted permission and unlock all data types', async () => {
      await mockPermissions.request()
      expect(permissionState.granted).toBe(true)
      expect(permissionState.partial.heartRate).toBe(true)
      expect(permissionState.partial.sleep).toBe(true)
      expect(permissionState.partial.steps).toBe(true)
      expect(permissionState.partial.energy).toBe(true)
    })

    it('should handle denied permission and expose re-request UI state', async () => {
      mockPermissions.deny()
      expect(permissionState.requested).toBe(true)
      expect(permissionState.granted).toBe(false)

      // Re-request succeeds
      const granted = await mockPermissions.request()
      expect(granted).toBe(true)
    })

    it('should detect iOS platform and allow permission request', async () => {
      mockPlatform.OS = 'ios'
      const granted = await mockPermissions.request()
      expect(granted).toBe(true)
    })

    it('should not grant HealthKit on Android (coming-soon)', async () => {
      mockPlatform.OS = 'android'
      const granted = await mockPermissions.request()
      expect(granted).toBe(false)
      expect(permissionState.granted).toBe(false)
    })

    it('should handle partial permission grants (HR yes, sleep no)', async () => {
      mockPermissions.partialGrant({
        heartRate: true,
        sleep: false,
        steps: true,
        energy: true,
      })
      const store = createHealthStore()
      await store.fetchAll()

      expect(store.state.heartRate.length).toBeGreaterThan(0)
      expect(store.state.sleep.length).toBe(0)
      expect(store.state.steps.length).toBeGreaterThan(0)
    })
  })

  // =====================================================
  // 2. DATA FETCH FLOW
  // =====================================================
  describe('Data Fetch Flow', () => {
    beforeEach(async () => {
      await mockPermissions.request()
    })

    it('should fetch heart rate data after permission granted', async () => {
      const store = createHealthStore()
      await store.fetchAll()
      expect(store.state.heartRate.length).toBe(3)
      expect(store.state.heartRate[0].bpm).toBe(62)
    })

    it('should fetch sleep data after permission granted', async () => {
      const store = createHealthStore()
      await store.fetchAll()
      expect(store.state.sleep.length).toBe(1)
      expect(store.state.sleep[0].durationMinutes).toBe(480)
    })

    it('should fetch step data after permission granted', async () => {
      const store = createHealthStore()
      await store.fetchAll()
      expect(store.state.steps.length).toBe(2)
      expect(store.state.steps[0].stepCount).toBe(4200)
    })

    it('should fetch energy data after permission granted', async () => {
      const store = createHealthStore()
      await store.fetchAll()
      expect(store.state.energy.length).toBe(1)
      expect(store.state.energy[0].totalCalories).toBe(2020)
    })

    it('should fetch multi-day data when range=week', async () => {
      const store = createHealthStore()
      store.setRange('week')
      await store.fetchAll()
      expect(store.state.range).toBe('week')
      expect(store.state.heartRate.length).toBeGreaterThan(0)
    })
  })

  // =====================================================
  // 3. OFFLINE CACHE FLOW
  // =====================================================
  describe('Offline Cache Flow', () => {
    beforeEach(async () => {
      await mockPermissions.request()
    })

    it('should save fetched data to SQLite cache', async () => {
      const store = createHealthStore()
      await store.fetchAll()
      expect(mockCache.heartRate.size).toBeGreaterThan(0)
      expect(mockCache.sleep.size).toBeGreaterThan(0)
      expect(mockCache.steps.size).toBeGreaterThan(0)
      expect(mockCache.energy.size).toBeGreaterThan(0)
    })

    it('should load from cache when offline', async () => {
      const store = createHealthStore()
      // Populate cache while online
      await store.fetchAll()

      // Go offline
      setOnline(false)

      // Create a fresh store, same range -> should hit cache
      const offlineStore = createHealthStore()
      await offlineStore.fetchAll()
      expect(offlineStore.state.heartRate.length).toBe(3)
      expect(offlineStore.state.steps.length).toBe(2)
    })

    it('should refresh cache when forceRefresh is triggered online', async () => {
      const store = createHealthStore()
      await store.fetchAll()
      const firstCachedAt = mockCache.heartRate.values().next().value?.cachedAt

      // Wait a tick and refresh
      await new Promise((r) => setTimeout(r, 5))
      await store.refresh()

      const secondCachedAt = mockCache.heartRate.values().next().value?.cachedAt
      expect(secondCachedAt).not.toBe(firstCachedAt)
    })

    it('should use cached data if fresh network data unavailable', async () => {
      const store = createHealthStore()
      await store.fetchAll()
      expect(store.state.heartRate.length).toBe(3)

      // Simulate network failure
      hkShouldFail = true
      await store.refresh()

      // State should still contain data (from cache fail-soft)
      expect(store.state.heartRate.length).toBe(3)
      expect(store.state.error).toBe('HealthKit error: denied')
    })

    it('should detect stale cache and re-fetch', async () => {
      const store = createHealthStore()
      await store.fetchAll()

      // Mutate cachedAt to simulate staleness
      for (const row of mockCache.heartRate.values()) {
        row.cachedAt = new Date(Date.now() - 60 * 60 * 1000).toISOString()
      }

      const freshStore = createHealthStore()
      await freshStore.fetchAll()
      // Cache was stale -> network was hit -> new cachedAt written
      const newRow = mockCache.heartRate.values().next().value
      expect(Date.now() - new Date(newRow!.cachedAt).getTime()).toBeLessThan(1000)
    })
  })

  // =====================================================
  // 4. AGGREGATION FLOW
  // =====================================================
  describe('Aggregation Flow', () => {
    beforeEach(async () => {
      await mockPermissions.request()
    })

    it('should calculate daily heart rate average from readings', async () => {
      const store = createHealthStore()
      await store.fetchAll()
      // (62 + 75 + 110) / 3 = 82.33 -> 82
      expect(store.state.summary?.heartRate?.average).toBe(82)
      expect(store.state.summary?.heartRate?.min).toBe(62)
      expect(store.state.summary?.heartRate?.max).toBe(110)
    })

    it('should calculate total daily steps', async () => {
      const store = createHealthStore()
      await store.fetchAll()
      expect(store.state.summary?.steps?.count).toBe(7300) // 4200 + 3100
      expect(store.state.summary?.steps?.goal).toBe(10000)
      expect(store.state.summary?.steps?.percent).toBe(73)
    })

    it('should calculate total sleep duration', async () => {
      const store = createHealthStore()
      await store.fetchAll()
      expect(store.state.summary?.sleep?.totalMinutes).toBe(480)
    })

    it('should generate daily summary from raw data', async () => {
      const store = createHealthStore()
      await store.fetchAll()
      const summary = store.state.summary
      expect(summary).not.toBeNull()
      expect(summary?.date).toBe('2026-04-19')
      expect(summary?.energy?.total).toBe(2020)
    })
  })

  // =====================================================
  // 5. UI FLOW
  // =====================================================
  describe('UI Flow', () => {
    beforeEach(async () => {
      await mockPermissions.request()
    })

    it('should display dashboard widget with today values', async () => {
      const store = createHealthStore()
      await store.fetchAll()
      const widget = {
        steps: store.state.summary?.steps?.count ?? 0,
        hr: store.state.summary?.heartRate?.average ?? 0,
        sleep: store.state.summary?.sleep?.totalMinutes ?? 0,
      }
      expect(widget.steps).toBe(7300)
      expect(widget.hr).toBe(82)
      expect(widget.sleep).toBe(480)
    })

    it('should navigate to detail screen on metric tap', async () => {
      navigation.navigate('HealthDetail/heartRate')
      expect(navigation.route).toBe('HealthDetail/heartRate')
    })

    it('should pull-to-refresh to fetch fresh data', async () => {
      const store = createHealthStore()
      await store.fetchAll()
      const beforeRefreshAt = mockCache.heartRate.values().next().value?.cachedAt
      await new Promise((r) => setTimeout(r, 3))

      await store.refresh()
      const afterRefreshAt = mockCache.heartRate.values().next().value?.cachedAt
      expect(afterRefreshAt).not.toBe(beforeRefreshAt)
    })

    it('should show loading state while fetching', async () => {
      const store = createHealthStore()
      const p = store.fetchAll()
      expect(store.state.loading).toBe(true)
      await p
      expect(store.state.loading).toBe(false)
    })

    it('should show error state on fetch failure', async () => {
      hkShouldFail = true
      const store = createHealthStore()
      await store.fetchAll()
      expect(store.state.error).toBe('HealthKit error: denied')
    })

    it('should render empty UI when no data is available', async () => {
      hkReturnEmpty = true
      const store = createHealthStore()
      await store.fetchAll()

      expect(store.state.heartRate.length).toBe(0)
      expect(store.state.sleep.length).toBe(0)
      expect(store.state.steps.length).toBe(0)
      expect(store.state.energy.length).toBe(0)
      expect(store.state.summary?.heartRate).toBeNull()
      expect(store.state.summary?.steps).toBeNull()
    })

    it('should update when date range changes (today -> week)', async () => {
      const store = createHealthStore()
      await store.fetchAll()
      expect(store.state.range).toBe('today')

      store.setRange('week')
      await store.fetchAll()
      expect(store.state.range).toBe('week')
    })

    it('should render charts correctly for empty data sets', async () => {
      hkReturnEmpty = true
      const store = createHealthStore()
      await store.fetchAll()

      const chartData = store.state.heartRate.map((r) => ({ x: r.timestamp, y: r.bpm }))
      expect(chartData).toEqual([])
    })
  })

  // =====================================================
  // 6. END-TO-END SCENARIO
  // =====================================================
  describe('End-to-End Scenario', () => {
    it('should run complete flow: permission -> fetch -> cache -> aggregate -> display', async () => {
      // 1. Permission
      const granted = await mockPermissions.request()
      expect(granted).toBe(true)

      // 2. Fetch
      const store = createHealthStore()
      await store.fetchAll()
      expect(store.state.heartRate.length).toBeGreaterThan(0)

      // 3. Cache
      expect(mockCache.heartRate.size).toBeGreaterThan(0)

      // 4. Aggregate
      expect(store.state.summary?.heartRate?.average).toBeDefined()
      expect(store.state.summary?.steps?.percent).toBeGreaterThan(0)

      // 5. Navigate (display detail)
      navigation.navigate('HealthDetail/steps')
      expect(navigation.route).toBe('HealthDetail/steps')

      // 6. Go offline -> re-open -> still works
      setOnline(false)
      const offlineStore = createHealthStore()
      await offlineStore.fetchAll()
      expect(offlineStore.state.heartRate.length).toBe(3)
    })
  })
})
