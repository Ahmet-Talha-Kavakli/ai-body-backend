'use client'

import { useState } from 'react'
import { Heart, Footprints, Moon, Droplets, Activity, Wind } from 'lucide-react'
import { HealthMetricCard } from '@/components/health/HealthMetricCard'
import { AIInsightCard } from '@/components/health/AIInsightCard'
import { TimeRangeFilter, TimeRange } from '@/components/health/TimeRangeFilter'

interface OverviewTabProps {
  heartRate: number
  spo2: number
  avgSteps: number
  avgSleepH: number
  waterLiters: number
  stressScore: number | null
  waterGoalL: number
  stepGoal: number
  sleepGoal: number
  aiInsight: string
}

export function OverviewTab({
  heartRate,
  spo2,
  avgSteps,
  avgSleepH,
  waterLiters,
  stressScore,
  waterGoalL,
  stepGoal,
  sleepGoal,
  aiInsight,
}: OverviewTabProps) {
  const [range, setRange] = useState<TimeRange>('7d')

  const METRICS = [
    {
      icon: Heart,
      label: 'Dinlenme Nabzı',
      value: heartRate,
      unit: 'bpm',
      accentColor: 'red',
      status: heartRate < 100 ? 'Normal' : 'Yüksek',
      statusColor: heartRate < 100 ? 'text-green-400' : 'text-red-400',
    },
    {
      icon: Wind,
      label: 'Kan Oksijeni',
      value: spo2,
      unit: '%',
      accentColor: 'cyan',
      status: spo2 >= 95 ? 'Normal' : 'Düşük',
      statusColor: spo2 >= 95 ? 'text-green-400' : 'text-red-400',
    },
    {
      icon: Footprints,
      label: 'Ort. Adım',
      value: (avgSteps ?? 0).toLocaleString('tr-TR'),
      unit: 'adım',
      accentColor: 'purple',
      status: `Hedef: ${(stepGoal ?? 0).toLocaleString('tr-TR')}`,
    },
    {
      icon: Moon,
      label: 'Ort. Uyku',
      value: avgSleepH,
      unit: 'saat',
      accentColor: 'indigo',
      status: `Hedef: ${sleepGoal}s`,
    },
    {
      icon: Droplets,
      label: 'Su Tüketimi',
      value: (waterLiters ?? 0).toFixed(1),
      unit: 'L',
      accentColor: 'blue',
      status: `Hedef: ${waterGoalL}L`,
    },
    {
      icon: Activity,
      label: 'Stres Skoru',
      value: stressScore ?? '–',
      unit: stressScore ? '/100' : '',
      accentColor: 'emerald',
      status: stressScore
        ? stressScore < 40
          ? 'Düşük'
          : stressScore < 70
            ? 'Orta'
            : 'Yüksek'
        : 'Veri yok',
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">Genel Bakış</h2>
        <TimeRangeFilter value={range} onChange={setRange} />
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        {METRICS.map((m, i) => (
          <HealthMetricCard key={m.label} {...m} delay={i * 0.07} />
        ))}
      </div>

      <AIInsightCard insight={aiInsight} accentColor="purple" />
    </div>
  )
}
