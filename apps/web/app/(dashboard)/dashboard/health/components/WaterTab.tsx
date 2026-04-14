'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Droplets } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { AIInsightCard } from '@/components/health/AIInsightCard'
import Link from 'next/link'

interface WaterTabProps {
  totalMl: number
  goalMl: number
  count: number
  weeklyData: { date: string; totalMl: number }[]
  aiInsight: string
  onAddWater: (ml: number) => Promise<void>
}

const QUICK_AMOUNTS = [150, 200, 250, 330, 500]

export function WaterTab({
  totalMl,
  goalMl,
  count,
  weeklyData,
  aiInsight,
  onAddWater,
}: WaterTabProps) {
  const [adding, setAdding] = useState(false)
  const pct = Math.min((totalMl / goalMl) * 100, 100)
  const glasses = Math.floor(totalMl / 250)
  const goalGlasses = Math.ceil(goalMl / 250)
  const remaining = Math.max(0, goalMl - totalMl)

  const formatted = weeklyData.map((d) => ({
    day: new Date(d.date).toLocaleDateString('tr-TR', { weekday: 'short' }),
    litre: +(d.totalMl / 1000).toFixed(1),
  }))

  async function handleAdd(ml: number) {
    setAdding(true)
    await onAddWater(ml)
    setAdding(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">Su Tüketimi</h2>
        <Link
          href="/dashboard/water"
          className="cursor-pointer text-xs font-semibold text-blue-400 transition-colors hover:text-blue-300"
        >
          Detaylı Görünüm →
        </Link>
      </div>

      {/* Main progress */}
      <div className="rounded-3xl border border-blue-500/20 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 p-6">
        <div className="mb-4 flex items-end justify-between">
          <div>
            <p className="text-muted-foreground mb-1 text-xs font-semibold uppercase tracking-wider">
              Bugün
            </p>
            <p className="text-4xl font-black text-blue-400">
              {(totalMl / 1000).toFixed(1)}
              <span className="text-muted-foreground ml-1 text-lg font-normal">L</span>
            </p>
            <p className="text-muted-foreground mt-1 text-sm">
              {remaining > 0 ? `${(remaining / 1000).toFixed(1)}L daha iç` : 'Hedef tamamlandı!'}
            </p>
          </div>
          <div className="text-right">
            <p className="text-muted-foreground text-xs">Hedef</p>
            <p className="text-2xl font-black">
              {(goalMl / 1000).toFixed(1)}
              <span className="text-muted-foreground ml-1 text-sm font-normal">L</span>
            </p>
          </div>
        </div>
        <div className="h-3 overflow-hidden rounded-full border border-blue-500/20 bg-blue-500/10">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
            className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-400"
          />
        </div>
        <p className="mt-2 text-xs font-bold text-blue-400">{Math.round(pct)}% tamamlandı</p>
      </div>

      {/* Glass visualization */}
      <div className="bg-card/50 border-border/30 rounded-3xl border p-6">
        <p className="text-muted-foreground mb-4 text-xs font-semibold uppercase tracking-wider">
          Bardaklar ({glasses}/{goalGlasses})
        </p>
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: goalGlasses }).map((_, i) => (
            <motion.div
              key={i}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: i * 0.03 }}
              className={`flex h-12 w-9 items-end justify-center rounded-xl border pb-1 transition-all ${
                i < glasses
                  ? 'border-blue-400 bg-gradient-to-b from-blue-400 to-blue-600 shadow-lg shadow-blue-500/30'
                  : 'bg-muted/20 border-border/30'
              }`}
            >
              <Droplets
                size={12}
                className={i < glasses ? 'text-white' : 'text-muted-foreground/30'}
              />
            </motion.div>
          ))}
        </div>
      </div>

      {/* Quick add */}
      <div className="bg-card/50 border-border/30 rounded-3xl border p-6">
        <p className="text-muted-foreground mb-4 text-xs font-semibold uppercase tracking-wider">
          Hızlı Ekle
        </p>
        <div className="flex flex-wrap gap-2">
          {QUICK_AMOUNTS.map((ml) => (
            <button
              key={ml}
              onClick={() => handleAdd(ml)}
              disabled={adding}
              className="cursor-pointer rounded-xl border border-blue-500/20 bg-blue-500/10 px-4 py-2.5 text-sm font-bold text-blue-300 transition-all hover:border-blue-500/40 hover:bg-blue-500/20 disabled:opacity-50"
            >
              +{ml}ml
            </button>
          ))}
        </div>
      </div>

      {/* Weekly chart */}
      {formatted.length > 0 && (
        <div className="bg-card/50 border-border/30 rounded-3xl border p-6">
          <p className="text-muted-foreground mb-4 text-xs font-semibold uppercase tracking-wider">
            Haftalık Su Trendi
          </p>
          <ResponsiveContainer width="100%" height={140}>
            <BarChart
              data={formatted}
              barSize={24}
              margin={{ top: 4, right: 4, left: -20, bottom: 0 }}
            >
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
              />
              <Tooltip
                contentStyle={{
                  background: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: 12,
                  fontSize: 12,
                }}
                formatter={(v: number) => [`${v}L`, 'Su']}
              />
              <Bar dataKey="litre" fill="#3b82f6" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <AIInsightCard insight={aiInsight} accentColor="blue" />
    </div>
  )
}
