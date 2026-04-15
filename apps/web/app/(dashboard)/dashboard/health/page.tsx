'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Activity, Moon, Droplets, Scale, Watch, LayoutDashboard, Settings2 } from 'lucide-react'
import { useSearchParams, useRouter } from 'next/navigation'
import { MacbookLoader } from '@/components/ui/macbook-loader'
import { GoalsModal } from '@/components/health/GoalsModal'
import { OverviewTab } from './components/OverviewTab'
import { ActivityTab } from './components/ActivityTab'
import { SleepTab } from './components/SleepTab'
import { WaterTab } from './components/WaterTab'
import { BodyTab } from './components/BodyTab'
import { DevicesTab } from './components/DevicesTab'

type Tab = 'overview' | 'activity' | 'sleep' | 'water' | 'body' | 'devices'

const TABS: { id: Tab; label: string; icon: typeof Activity; color: string }[] = [
  { id: 'overview', label: 'Genel', icon: LayoutDashboard, color: 'text-purple-400' },
  { id: 'activity', label: 'Aktivite', icon: Activity, color: 'text-purple-400' },
  { id: 'sleep', label: 'Uyku', icon: Moon, color: 'text-indigo-400' },
  { id: 'water', label: 'Su', icon: Droplets, color: 'text-blue-400' },
  { id: 'body', label: 'Vücut', icon: Scale, color: 'text-emerald-400' },
  { id: 'devices', label: 'Cihazlar', icon: Watch, color: 'text-slate-400' },
]

const DEFAULT_INSIGHTS: Record<Tab, string> = {
  overview: 'Sağlık verilerine bakıyorum...',
  activity: 'Aktivite verilerine bakıyorum...',
  sleep: 'Uyku verilerine bakıyorum...',
  water: 'Su verilerine bakıyorum...',
  body: 'Vücut verilerine bakıyorum...',
  devices: '',
}

interface Goals {
  dailySteps: number
  sleepHours: number
  waterMl: number
  targetWeightKg: number | null
}

function HealthPageInner() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const [activeTab, setActiveTab] = useState<Tab>((searchParams.get('tab') as Tab) ?? 'overview')
  const [loading, setLoading] = useState(true)
  const [goalsOpen, setGoalsOpen] = useState(false)

  // Time range state — controls how many days API fetches
  const [activityDays, setActivityDays] = useState(7)
  const [sleepDays, setSleepDays] = useState(7)

  // Data state
  const [overview, setOverview] = useState<any>(null)
  const [activityData, setActivityData] = useState<any>(null)
  const [sleepData, setSleepData] = useState<any>(null)
  const [waterData, setWaterData] = useState<{ totalMl: number; count: number; weeklyData: any[] }>(
    {
      totalMl: 0,
      count: 0,
      weeklyData: [],
    }
  )
  const [devices, setDevices] = useState<any[]>([])
  const [goals, setGoals] = useState<Goals>({
    dailySteps: 10000,
    sleepHours: 8,
    waterMl: 2500,
    targetWeightKg: null,
  })
  const [insights, setInsights] = useState<Record<Tab, string>>(DEFAULT_INSIGHTS)

  const fetchActivity = useCallback(async (days: number) => {
    const res = await fetch(`/api/health/activity?days=${days}`)
    const data = await res.json()
    setActivityData(data)
  }, [])

  const fetchSleep = useCallback(async (days: number) => {
    const res = await fetch(`/api/health/sleep?days=${days}`)
    const data = await res.json()
    setSleepData(data)
  }, [])

  const fetchAll = useCallback(async () => {
    setLoading(true)
    try {
      const [ovRes, actRes, sleepRes, waterRes, devRes, goalRes] = await Promise.all([
        fetch('/api/health'),
        fetch(`/api/health/activity?days=${activityDays}`),
        fetch(`/api/health/sleep?days=${sleepDays}`),
        fetch('/api/health/water?weekly=true'),
        fetch('/api/health/devices'),
        fetch('/api/health/goals'),
      ])
      const [ov, act, sleep, water, devs, goal] = await Promise.all([
        ovRes.json(),
        actRes.json(),
        sleepRes.json(),
        waterRes.json(),
        devRes.json(),
        goalRes.json(),
      ])
      setOverview(ov?.error ? null : ov)
      setActivityData(act?.error ? null : act)
      setSleepData(sleep?.error ? null : sleep)
      setWaterData({
        totalMl: water.totalMl ?? 0,
        count: water.count ?? 0,
        weeklyData: water.weeklyData ?? [],
      })
      setDevices(Array.isArray(devs) ? devs : [])
      if (!goal?.error)
        setGoals({
          dailySteps: goal.dailySteps ?? 10000,
          sleepHours: goal.sleepHours ?? 8,
          waterMl: goal.waterMl ?? 2500,
          targetWeightKg: goal.targetWeightKg ?? null,
        })
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [activityDays, sleepDays])

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  // Re-fetch activity when days change
  useEffect(() => {
    if (!loading) fetchActivity(activityDays)
  }, [activityDays]) // eslint-disable-line

  // Re-fetch sleep when days change
  useEffect(() => {
    if (!loading) fetchSleep(sleepDays)
  }, [sleepDays]) // eslint-disable-line

  // OAuth success handling
  useEffect(() => {
    const connected = searchParams.get('connected')
    const error = searchParams.get('error')
    if (connected || error) {
      if (connected) fetchAll()
      router.replace('/dashboard/health?tab=devices', { scroll: false })
    }
  }, []) // eslint-disable-line

  // AI insight per tab
  useEffect(() => {
    if (activeTab === 'devices' || loading) return
    const ctx = buildInsightCtx(activeTab)
    fetch('/api/health/insight', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(ctx),
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.insight) setInsights((prev) => ({ ...prev, [activeTab]: d.insight }))
      })
      .catch(() => {})
  }, [activeTab, loading]) // eslint-disable-line

  function buildInsightCtx(tab: Tab) {
    const latest = overview?.latestReadings ?? {}
    const weightEntries = overview?.weightEntries ?? []
    const latestWeight = weightEntries[0]?.weightKg
    const heightCm = overview?.profile?.heightCm
    const bmi =
      latestWeight && heightCm
        ? +(latestWeight / Math.pow(heightCm / 100, 2)).toFixed(1)
        : undefined
    const hrv = latest['hrv']
    // Stres skoru: HRV'den hesapla (düşük HRV = yüksek stres)
    // Normal HRV range: 20-100ms. Stres: 100 - normalize(hrv)
    const stressScore = hrv
      ? Math.max(0, Math.min(100, Math.round(100 - ((hrv - 20) / 80) * 100)))
      : null

    return {
      tab,
      heartRate: latest['heart_rate'],
      avgSteps: overview?.avgSteps,
      stepGoal: goals.dailySteps,
      avgSleepH: sleepData?.avg,
      sleepGoal: goals.sleepHours,
      waterLiters: waterData.totalMl ? +(waterData.totalMl / 1000).toFixed(1) : undefined,
      waterGoalL: +(goals.waterMl / 1000).toFixed(1),
      weightKg: latestWeight,
      targetWeightKg: goals.targetWeightKg,
      bmi,
      hrv,
      spo2: latest['spo2'],
      stressScore,
    }
  }

  function handleTabChange(tab: Tab) {
    setActiveTab(tab)
    router.replace(`/dashboard/health?tab=${tab}`, { scroll: false })
  }

  async function handleSaveGoals(newGoals: Goals) {
    const res = await fetch('/api/health/goals', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newGoals),
    })
    if (res.ok) {
      const saved = await res.json()
      setGoals(saved)
    }
  }

  async function handleAddWater(ml: number) {
    const res = await fetch('/api/health/water', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ml }),
    })
    const data = await res.json()
    if (data.totalMl !== undefined) {
      setWaterData((prev) => ({ ...prev, totalMl: data.totalMl, count: prev.count + 1 }))
    }
  }

  async function handleAddWeight(kg: number) {
    await fetch('/api/health/weight', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ weightKg: kg }),
    })
    await fetchAll()
  }

  async function handleConnectDevice(provider: string) {
    const res = await fetch('/api/health/devices/connect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ provider }),
    })
    const { redirectUrl } = await res.json()
    if (redirectUrl) window.location.href = redirectUrl
  }

  async function handleDisconnect(id: string) {
    await fetch('/api/health/devices', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    setDevices((prev) => prev.filter((d) => d.id !== id))
  }

  async function handleManualEntry(type: string, value: number) {
    await fetch('/api/health/manual', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, value }),
    })
    await fetchAll()
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="scale-[1.5]">
          <MacbookLoader />
        </motion.div>
      </div>
    )
  }

  const latest = overview?.latestReadings ?? {}
  const heartRate = latest['heart_rate'] ?? 68
  const spo2 = latest['spo2'] ?? 98
  const hrv = latest['hrv'] ?? null
  const weightEntries = overview?.weightEntries ?? []
  const heightCm = overview?.profile?.heightCm ?? 170

  // Stres skoru HRV'den
  const stressScore = hrv
    ? Math.max(0, Math.min(100, Math.round(100 - ((hrv - 20) / 80) * 100)))
    : null

  const activityChartData = (activityData?.chartData ?? []).map((d: any) => ({
    date: d.date,
    value: d.steps ?? 0,
  }))
  const caloriesData = (activityData?.chartData ?? []).map((d: any) => ({
    date: d.date,
    value: d.calories ?? 0,
  }))

  return (
    <div className="max-w-4xl space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-start justify-between"
      >
        <div>
          <h1 className="mb-1 text-3xl font-black">Sağlık Merkezi</h1>
          <p className="text-muted-foreground text-sm">
            Tüm sağlık verilerini tek bir yerden takip et
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setGoalsOpen(true)}
          className="bg-muted/30 border-border/30 hover:border-border/60 flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-xs font-bold transition-all"
        >
          <Settings2 size={13} className="text-purple-400" />
          Hedefler
        </motion.button>
      </motion.div>

      {/* Tab Bar */}
      <div className="bg-muted/20 border-border/30 scrollbar-none flex gap-1 overflow-x-auto rounded-2xl border p-1.5">
        {TABS.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`relative flex flex-shrink-0 cursor-pointer items-center gap-2 whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-bold transition-all ${
                isActive ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="tab-pill"
                  className="bg-card border-border/50 absolute inset-0 rounded-xl border shadow-sm"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-1.5">
                <Icon size={14} className={isActive ? tab.color : ''} />
                {tab.label}
              </span>
            </button>
          )
        })}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === 'overview' && (
            <OverviewTab
              heartRate={heartRate}
              spo2={spo2}
              avgSteps={overview?.avgSteps ?? 0}
              avgSleepH={sleepData?.avg ?? 0}
              waterLiters={waterData.totalMl ? waterData.totalMl / 1000 : 0}
              stressScore={stressScore}
              waterGoalL={goals.waterMl / 1000}
              stepGoal={goals.dailySteps}
              sleepGoal={goals.sleepHours}
              aiInsight={insights.overview}
            />
          )}

          {activeTab === 'activity' && (
            <ActivityTab
              todaySteps={overview?.avgSteps ?? 0}
              stepGoal={goals.dailySteps}
              avgHeartRate={heartRate}
              hrv={hrv}
              chartData={activityChartData}
              caloriesData={caloriesData}
              aiInsight={insights.activity}
              days={activityDays}
              onDaysChange={setActivityDays}
            />
          )}

          {activeTab === 'sleep' && (
            <SleepTab
              chartData={overview?.sleepData ?? []}
              avg={sleepData?.avg ?? 0}
              goal={goals.sleepHours}
              aiInsight={insights.sleep}
              days={sleepDays}
              onDaysChange={setSleepDays}
            />
          )}

          {activeTab === 'water' && (
            <WaterTab
              totalMl={waterData.totalMl}
              goalMl={goals.waterMl}
              count={waterData.count}
              weeklyData={waterData.weeklyData}
              aiInsight={insights.water}
              onAddWater={handleAddWater}
            />
          )}

          {activeTab === 'body' && (
            <BodyTab
              weightEntries={weightEntries}
              heightCm={heightCm}
              targetWeightKg={goals.targetWeightKg}
              aiInsight={insights.body}
              onAddWeight={handleAddWeight}
            />
          )}

          {activeTab === 'devices' && (
            <DevicesTab
              devices={devices}
              onConnect={handleConnectDevice}
              onDisconnect={handleDisconnect}
              onManualEntry={handleManualEntry}
              onSync={fetchAll}
            />
          )}
        </motion.div>
      </AnimatePresence>

      {/* Goals Modal */}
      <GoalsModal
        open={goalsOpen}
        onClose={() => setGoalsOpen(false)}
        goals={goals}
        onSave={handleSaveGoals}
      />
    </div>
  )
}

export default function HealthPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center">
          <MacbookLoader />
        </div>
      }
    >
      <HealthPageInner />
    </Suspense>
  )
}
