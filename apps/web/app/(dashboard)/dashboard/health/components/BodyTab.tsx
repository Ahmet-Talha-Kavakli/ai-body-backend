'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Scale, Target, TrendingDown } from 'lucide-react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine,
} from 'recharts'
import { AIInsightCard } from '@/components/health/AIInsightCard'
import { HealthMetricCard } from '@/components/health/HealthMetricCard'
import { TimeRangeFilter, TimeRange } from '@/components/health/TimeRangeFilter'

interface BodyTabProps {
  weightEntries: { date: string; weightKg: number }[]
  heightCm: number
  targetWeightKg: number | null
  aiInsight: string
  onAddWeight: (kg: number) => Promise<void>
}

export function BodyTab({
  weightEntries,
  heightCm,
  targetWeightKg,
  aiInsight,
  onAddWeight,
}: BodyTabProps) {
  const [range, setRange] = useState<TimeRange>('30d')
  const [newWeight, setNewWeight] = useState('')
  const [saving, setSaving] = useState(false)

  const latest = weightEntries[0]?.weightKg ?? null
  const bmi = latest && heightCm ? +(latest / Math.pow(heightCm / 100, 2)).toFixed(1) : null
  const bmiCategory = bmi
    ? bmi < 18.5
      ? 'Zayıf'
      : bmi < 25
        ? 'Normal'
        : bmi < 30
          ? 'Fazla Kilolu'
          : 'Obez'
    : '–'

  const formatted = weightEntries
    .slice()
    .reverse()
    .map((e) => ({
      date: new Date(e.date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' }),
      kg: e.weightKg,
    }))

  async function handleSave() {
    const kg = parseFloat(newWeight)
    if (isNaN(kg) || kg < 20 || kg > 300) return
    setSaving(true)
    await onAddWeight(kg)
    setSaving(false)
    setNewWeight('')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">Vücut</h2>
        <TimeRangeFilter value={range} onChange={setRange} />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <HealthMetricCard
          icon={Scale}
          label="Güncel Kilo"
          value={latest ? `${latest}` : '–'}
          unit={latest ? 'kg' : ''}
          accentColor="emerald"
          delay={0}
        />
        <HealthMetricCard
          icon={Target}
          label="BMI"
          value={bmi ?? '–'}
          unit=""
          accentColor="blue"
          delay={0.07}
          status={bmiCategory}
        />
        <HealthMetricCard
          icon={TrendingDown}
          label="Hedef Kilo"
          value={targetWeightKg ? `${targetWeightKg}` : '–'}
          unit={targetWeightKg ? 'kg' : ''}
          accentColor="purple"
          delay={0.14}
        />
      </div>

      {/* Weight input */}
      <div className="bg-card/50 border-border/30 rounded-3xl border p-6">
        <p className="text-muted-foreground mb-4 text-xs font-semibold uppercase tracking-wider">
          Kilo Gir
        </p>
        <div className="flex gap-3">
          <input
            type="number"
            step="0.1"
            value={newWeight}
            onChange={(e) => setNewWeight(e.target.value)}
            placeholder="Örn: 75.5"
            className="bg-muted/30 border-border/50 flex-1 rounded-xl border px-4 py-3 font-bold transition-colors focus:border-emerald-500/50 focus:outline-none"
          />
          <button
            onClick={handleSave}
            disabled={saving || !newWeight}
            className="cursor-pointer rounded-xl border border-emerald-500/30 bg-emerald-500/20 px-5 py-3 text-sm font-bold text-emerald-300 transition-all hover:bg-emerald-500/30 disabled:opacity-50"
          >
            {saving ? '...' : 'Kaydet'}
          </button>
        </div>
      </div>

      {/* Weight trend */}
      {formatted.length > 1 && (
        <div className="bg-card/50 border-border/30 rounded-3xl border p-6">
          <p className="text-muted-foreground mb-4 text-xs font-semibold uppercase tracking-wider">
            Kilo Trendi
          </p>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={formatted} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(255,255,255,0.05)"
                vertical={false}
              />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                axisLine={false}
                tickLine={false}
                domain={['auto', 'auto']}
              />
              <Tooltip
                contentStyle={{
                  background: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: 12,
                  fontSize: 12,
                }}
                formatter={(v: number) => [`${v} kg`, 'Kilo']}
              />
              {targetWeightKg && (
                <ReferenceLine
                  y={targetWeightKg}
                  stroke="#a855f7"
                  strokeDasharray="4 4"
                  label={{ value: 'Hedef', fill: '#a855f7', fontSize: 10 }}
                />
              )}
              <Line
                type="monotone"
                dataKey="kg"
                stroke="#10b981"
                strokeWidth={2.5}
                dot={{ fill: '#10b981', r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* BMI Scale */}
      {bmi && (
        <div className="bg-card/50 border-border/30 rounded-3xl border p-6">
          <p className="text-muted-foreground mb-4 text-xs font-semibold uppercase tracking-wider">
            BMI Skalası
          </p>
          <div className="relative flex h-6 overflow-hidden rounded-full">
            {[
              { label: 'Zayıf', color: 'bg-blue-500', width: '20%' },
              { label: 'Normal', color: 'bg-green-500', width: '30%' },
              { label: 'Fazla', color: 'bg-yellow-500', width: '25%' },
              { label: 'Obez', color: 'bg-red-500', width: '25%' },
            ].map((s) => (
              <div
                key={s.label}
                style={{ width: s.width }}
                className={`${s.color} flex items-center justify-center opacity-70`}
              >
                <span className="text-xs font-bold text-white">{s.label}</span>
              </div>
            ))}
          </div>
          <div className="text-muted-foreground mt-2 flex justify-between text-xs">
            <span>16</span>
            <span>18.5</span>
            <span>25</span>
            <span>30</span>
            <span>40</span>
          </div>
          <div className="mt-3 text-center">
            <span className="text-2xl font-black">{bmi}</span>
            <span className="text-muted-foreground ml-2 text-sm">BMI · {bmiCategory}</span>
          </div>
        </div>
      )}

      <AIInsightCard insight={aiInsight} accentColor="emerald" />
    </div>
  )
}
