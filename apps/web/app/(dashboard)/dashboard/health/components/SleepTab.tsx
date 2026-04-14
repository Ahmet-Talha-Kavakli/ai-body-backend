'use client'

import { motion } from 'framer-motion'
import { Moon, Clock, Star } from 'lucide-react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts'
import { TimeRangeFilter, TimeRange } from '@/components/health/TimeRangeFilter'
import { AIInsightCard } from '@/components/health/AIInsightCard'
import { HealthMetricCard } from '@/components/health/HealthMetricCard'

const DAYS_MAP: Record<TimeRange, number> = { '7d': 7, '30d': 30, '90d': 90 }
const RANGE_MAP: Record<number, TimeRange> = { 7: '7d', 30: '30d', 90: '90d' }
const toTimeRange = (days: number): TimeRange => RANGE_MAP[days] ?? '7d'

interface SleepTabProps {
  chartData: { date: string; hours: number }[]
  avg: number
  goal: number
  aiInsight: string
  days: number
  onDaysChange: (days: number) => void
}

export function SleepTab({ chartData, avg, goal, aiInsight, days, onDaysChange }: SleepTabProps) {
  const formatted = chartData.map((d) => ({
    ...d,
    day: new Date(d.date).toLocaleDateString('tr-TR', { weekday: 'short' }),
  }))

  const best = chartData.length ? Math.max(...chartData.map((d) => d.hours)) : 0
  const worst = chartData.length ? Math.min(...chartData.map((d) => d.hours)) : 0
  const qualityScore = Math.min(100, Math.round((avg / goal) * 100))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">Uyku</h2>
        <TimeRangeFilter value={toTimeRange(days)} onChange={(r) => onDaysChange(DAYS_MAP[r])} />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <HealthMetricCard
          icon={Moon}
          label="Ortalama"
          value={avg}
          unit="saat"
          accentColor="indigo"
          delay={0}
        />
        <HealthMetricCard
          icon={Star}
          label="En Uzun"
          value={best}
          unit="saat"
          accentColor="purple"
          delay={0.07}
        />
        <HealthMetricCard
          icon={Clock}
          label="En Kısa"
          value={worst}
          unit="saat"
          accentColor="red"
          delay={0.14}
        />
      </div>

      {formatted.length > 0 ? (
        <div className="bg-card/50 border-border/30 rounded-3xl border p-6">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">
              Uyku Süresi Trendi
            </p>
            <span className="rounded-lg border border-indigo-500/20 bg-indigo-500/10 px-2 py-1 text-xs font-bold text-indigo-400">
              Hedef: {goal}s
            </span>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={formatted} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="sleepGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(255,255,255,0.05)"
                vertical={false}
              />
              <XAxis
                dataKey="day"
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                axisLine={false}
                tickLine={false}
                domain={[0, 12]}
              />
              <Tooltip
                contentStyle={{
                  background: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: 12,
                  fontSize: 12,
                }}
                formatter={(v: number) => [`${v} saat`, 'Uyku']}
              />
              <Area
                type="monotone"
                dataKey="hours"
                stroke="#6366f1"
                strokeWidth={2.5}
                fill="url(#sleepGrad)"
                dot={{ fill: '#6366f1', r: 4 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="bg-card/50 border-border/30 rounded-3xl border p-12 text-center">
          <Moon size={32} className="text-muted-foreground mx-auto mb-3 opacity-40" />
          <p className="text-muted-foreground text-sm">Henüz uyku verisi yok</p>
          <p className="text-muted-foreground mt-1 text-xs">Bir cihaz bağla veya manuel veri gir</p>
        </div>
      )}

      {/* Quality Score */}
      {avg > 0 && (
        <div className="rounded-3xl border border-indigo-500/20 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 p-6">
          <p className="text-muted-foreground mb-3 text-xs font-semibold uppercase tracking-wider">
            Uyku Kalitesi
          </p>
          <div className="flex items-center gap-4">
            <div className="text-4xl font-black text-indigo-400">%{qualityScore}</div>
            <div className="flex-1">
              <div className="bg-muted/30 h-3 overflow-hidden rounded-full">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${qualityScore}%` }}
                  transition={{ duration: 1.2, ease: 'easeOut' }}
                  className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500"
                />
              </div>
              <p className="text-muted-foreground mt-1.5 text-xs">
                {qualityScore >= 85
                  ? 'Mükemmel'
                  : qualityScore >= 70
                    ? 'İyi'
                    : qualityScore >= 50
                      ? 'Orta'
                      : 'Yetersiz'}
              </p>
            </div>
          </div>
        </div>
      )}

      <AIInsightCard insight={aiInsight} accentColor="indigo" />
    </div>
  )
}
