'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Footprints, Flame, Zap, Heart } from 'lucide-react'
import { TimeRangeFilter, TimeRange } from '@/components/health/TimeRangeFilter'
import { GoalRing } from '@/components/health/GoalRing'
import { WeeklyBarChart } from '@/components/health/WeeklyBarChart'
import { AIInsightCard } from '@/components/health/AIInsightCard'
import { HealthMetricCard } from '@/components/health/HealthMetricCard'

const HEART_ZONES = [
  { name: 'Dinlenme', range: '< 60 bpm', color: 'bg-blue-500', pct: 40 },
  { name: 'Hafif', range: '60–100 bpm', color: 'bg-green-500', pct: 30 },
  { name: 'Aerobik', range: '100–140 bpm', color: 'bg-yellow-500', pct: 18 },
  { name: 'Anaerobik', range: '140–170 bpm', color: 'bg-orange-500', pct: 9 },
  { name: 'Maksimal', range: '170+ bpm', color: 'bg-red-500', pct: 3 },
]

interface ActivityTabProps {
  todaySteps: number
  stepGoal: number
  avgHeartRate: number
  hrv: number | null
  chartData: { date: string; value: number }[]
  caloriesData: { date: string; value: number }[]
  aiInsight: string
}

export function ActivityTab({
  todaySteps,
  stepGoal,
  avgHeartRate,
  hrv,
  chartData,
  caloriesData,
  aiInsight,
}: ActivityTabProps) {
  const [range, setRange] = useState<TimeRange>('7d')
  const estimatedCalories = Math.round(todaySteps * 0.04)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">Aktivite</h2>
        <TimeRangeFilter value={range} onChange={setRange} />
      </div>

      {/* Goal Rings */}
      <div className="bg-card/50 border-border/30 rounded-3xl border p-6">
        <p className="text-muted-foreground mb-6 text-xs font-semibold uppercase tracking-wider">
          Bugünkü Hedefler
        </p>
        <div className="flex flex-wrap justify-around gap-4">
          <GoalRing
            value={todaySteps}
            max={stepGoal}
            label="Adım"
            unit="adım"
            color="#a855f7"
            size={120}
          />
          <GoalRing
            value={estimatedCalories}
            max={500}
            label="Kalori"
            unit="kcal"
            color="#f97316"
            size={120}
          />
          <GoalRing
            value={Math.min(avgHeartRate, 180)}
            max={180}
            label="Nabız"
            unit="bpm"
            color="#ef4444"
            size={120}
          />
        </div>
      </div>

      {/* Steps Chart */}
      {chartData.length > 0 && (
        <div className="bg-card/50 border-border/30 rounded-3xl border p-6">
          <p className="text-muted-foreground mb-4 text-xs font-semibold uppercase tracking-wider">
            Haftalık Adım
          </p>
          <WeeklyBarChart data={chartData} color="#a855f7" label="Adım" unit="adım" />
        </div>
      )}

      {/* Heart Rate Zones */}
      <div className="bg-card/50 border-border/30 rounded-3xl border p-6">
        <div className="mb-5 flex items-center gap-2">
          <Heart size={16} className="text-red-400" />
          <h3 className="font-bold">Nabız Zonu Dağılımı</h3>
        </div>
        <div className="space-y-3">
          {HEART_ZONES.map((zone, i) => (
            <motion.div
              key={zone.name}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 + i * 0.07 }}
            >
              <div className="mb-1.5 flex justify-between text-xs">
                <span className="font-semibold">{zone.name}</span>
                <div className="flex gap-2">
                  <span className="text-muted-foreground">{zone.range}</span>
                  <span className="font-black">{zone.pct}%</span>
                </div>
              </div>
              <div className="bg-muted/30 h-2.5 overflow-hidden rounded-full">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${zone.pct}%` }}
                  transition={{ delay: 0.3 + i * 0.1, duration: 0.8, ease: 'easeOut' }}
                  className={`h-full ${zone.color} rounded-full`}
                />
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Extra metrics */}
      <div className="grid grid-cols-2 gap-4">
        {hrv && (
          <HealthMetricCard
            icon={Zap}
            label="HRV"
            value={hrv}
            unit="ms"
            accentColor="emerald"
            status="Toparlanma"
            delay={0}
          />
        )}
        <HealthMetricCard
          icon={Flame}
          label="Tahmini Kalori"
          value={estimatedCalories}
          unit="kcal"
          accentColor="red"
          delay={0.07}
        />
        <HealthMetricCard
          icon={Footprints}
          label="Toplam Adım"
          value={todaySteps.toLocaleString('tr-TR')}
          unit="adım"
          accentColor="purple"
          delay={0.14}
        />
      </div>

      <AIInsightCard insight={aiInsight} accentColor="purple" />
    </div>
  )
}
