import { create } from 'zustand'
import type {
  HeartRateReading,
  SleepSession,
  StepData,
  EnergyBurned,
} from '../types/health'

interface HealthStoreState {
  heartRateReadings: HeartRateReading[]
  sleepSessions: SleepSession[]
  stepData: StepData[]
  energyData: EnergyBurned[]
  loading: boolean
  error: string | null

  setHeartRateReadings: (readings: HeartRateReading[]) => void
  setSleepSessions: (sessions: SleepSession[]) => void
  setStepData: (data: StepData[]) => void
  setEnergyData: (data: EnergyBurned[]) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void

  getAverageHeartRate: (date: string) => number
  getTotalSteps: (date: string) => number
  getSleepDuration: (date: string) => number
  getTotalEnergy: (date: string) => number

  clear: () => void
}

export const useHealthStore = create<HealthStoreState>((set, get) => ({
  heartRateReadings: [],
  sleepSessions: [],
  stepData: [],
  energyData: [],
  loading: false,
  error: null,

  setHeartRateReadings: (readings) => set({ heartRateReadings: readings }),
  setSleepSessions: (sessions) => set({ sleepSessions: sessions }),
  setStepData: (data) => set({ stepData: data }),
  setEnergyData: (data) => set({ energyData: data }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),

  getAverageHeartRate: (date) => {
    const readings = get().heartRateReadings.filter((r) => r.timestamp.startsWith(date))
    if (readings.length === 0) return 0
    const total = readings.reduce((sum, r) => sum + r.bpm, 0)
    return Math.round(total / readings.length)
  },

  getTotalSteps: (date) => {
    return get()
      .stepData.filter((s) => s.date === date)
      .reduce((sum, s) => sum + s.count, 0)
  },

  getSleepDuration: (date) => {
    return get()
      .sleepSessions.filter((s) => s.endTime.startsWith(date))
      .reduce((sum, s) => sum + s.durationMinutes, 0)
  },

  getTotalEnergy: (date) => {
    return get()
      .energyData.filter((e) => e.date === date)
      .reduce((sum, e) => sum + e.totalCalories, 0)
  },

  clear: () =>
    set({
      heartRateReadings: [],
      sleepSessions: [],
      stepData: [],
      energyData: [],
      loading: false,
      error: null,
    }),
}))
