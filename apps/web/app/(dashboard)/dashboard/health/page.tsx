'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Activity, Moon, Droplets, Scale, Watch, LayoutDashboard } from 'lucide-react'
import { useSearchParams, useRouter } from 'next/navigation'
import { MacbookLoader } from '@/components/ui/macbook-loader'
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

function HealthPageInner() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const [activeTab, setActiveTab] = useState<Tab>((searchParams.get('tab') as Tab) ?? 'overview')
  const [loading, setLoading] = useState(true)

  // Data state
  const [overview, setOverview] = useState<any>(null)
  const [activityData, setActivityData] = useState<any>(null)
  const [sleepData, setSleepData] = useState<any>(null)
  const [waterData, setWaterData] = useState<{ totalMl: number; count: number }>({
    totalMl: 0,
    count: 0,
  })
  const [devices, setDevices] = useState<any[]>([])
  const [goals, setGoals] = useState<any>({
    dailySteps: 10000,
    sleepHours: 8,
    waterMl: 2500,
    targetWeightKg: null,
  })
  const [insights, setInsights] = useState<Record<Tab, string>>(DEFAULT_INSIGHTS)

  const fetchAll = useCallback(async () => {
    setLoading(true)
    try {
      const [ovRes, actRes, sleepRes, waterRes, devRes, goalRes] = await Promise.all([
        fetch('/api/health'),
        fetch('/api/health/activity?days=7'),
        fetch('/api/health/sleep?days=7'),
        fetch('/api/health/water'),
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
      setOverview(ov)
      setActivityData(act)
      setSleepData(sleep)
      setWaterData(water)
      setDevices(Array.isArray(devs) ? devs : [])
      setGoals(goal)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  // OAuth success toast
  useEffect(() => {
    const connected = searchParams.get('connected')
    const error = searchParams.get('error')
    if (connected) {
      // Refresh data and clear param
      fetchAll()
      router.replace('/dashboard/health?tab=devices', { scroll: false })
    }
    if (error) {
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
        if (d.insight) {
          setInsights((prev) => ({ ...prev, [activeTab]: d.insight }))
        }
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

    return {
      tab,
      heartRate: latest['heart_rate'],
      avgSteps: overview?.avgSteps,
      stepGoal: goals.dailySteps,
      avgSleepH: sleepData?.avg,
      sleepGoal: goals.sleepHours,
      waterLiters: waterData?.totalMl ? +(waterData.totalMl / 1000).toFixed(1) : undefined,
      waterGoalL: +(goals.waterMl / 1000).toFixed(1),
      weightKg: latestWeight,
      targetWeightKg: goals.targetWeightKg,
      bmi,
      hrv: latest['hrv'],
      spo2: latest['spo2'],
    }
  }

  function handleTabChange(tab: Tab) {
    setActiveTab(tab)
    router.replace(`/dashboard/health?tab=${tab}`, { scroll: false })
  }

  async function handleAddWater(ml: number) {
    const res = await fetch('/api/health/water', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ml }),
    })
    const data = await res.json()
    if (data.totalMl !== undefined) {
      setWaterData((prev) => ({ totalMl: data.totalMl, count: prev.count + 1 }))
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
      <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="mb-1 text-3xl font-black">Sağlık Merkezi</h1>
        <p className="text-muted-foreground text-sm">
          Tüm sağlık verilerini tek bir yerden takip et
        </p>
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
              stressScore={null}
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
            />
          )}

          {activeTab === 'sleep' && (
            <SleepTab
              chartData={overview?.sleepData ?? []}
              avg={sleepData?.avg ?? 0}
              goal={goals.sleepHours}
              aiInsight={insights.sleep}
            />
          )}

          {activeTab === 'water' && (
            <WaterTab
              totalMl={waterData.totalMl}
              goalMl={goals.waterMl}
              count={waterData.count}
              weeklyData={[]}
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
