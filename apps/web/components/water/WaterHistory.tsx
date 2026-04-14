'use client'

import { motion } from 'framer-motion'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
} from 'recharts'

interface DayData {
  date: string
  amountMl: number
  goalMet: boolean
}

interface WaterHistoryProps {
  history: DayData[]
  dailyGoalMl: number
  period: 'week' | 'month'
  onPeriodChange: (p: 'week' | 'month') => void
}

function formatDate(dateStr: string, period: 'week' | 'month') {
  const d = new Date(dateStr)
  if (period === 'week') {
    return ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'][d.getDay()]
  }
  return `${d.getDate()}/${d.getMonth() + 1}`
}

export function WaterHistory({ history, dailyGoalMl, period, onPeriodChange }: WaterHistoryProps) {
  const data = history.map((d) => ({
    ...d,
    label: formatDate(d.date, period),
    liters: +(d.amountMl / 1000).toFixed(1),
  }))

  const goalL = +(dailyGoalMl / 1000).toFixed(1)

  return (
    <div className="space-y-3 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white">Geçmiş</h3>
        <div className="flex gap-1 rounded-xl bg-white/[0.04] p-1">
          {(['week', 'month'] as const).map((p) => (
            <button
              key={p}
              onClick={() => onPeriodChange(p)}
              className={`rounded-lg px-3 py-1 text-xs font-semibold transition-colors ${
                period === p ? 'bg-[#3B82F6] text-white' : 'text-[#64748B] hover:text-white'
              }`}
            >
              {p === 'week' ? 'Haftalık' : 'Aylık'}
            </button>
          ))}
        </div>
      </div>

      <motion.div
        key={period}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="h-48"
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fill: '#64748B', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: '#64748B', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `${v}L`}
            />
            <Tooltip
              contentStyle={{
                background: '#1A1A2E',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 12,
                color: '#fff',
                fontSize: 12,
              }}
              formatter={(value: number) => [`${(value * 1000).toFixed(0)} ml`, 'Su']}
              cursor={{ fill: 'rgba(255,255,255,0.03)' }}
            />
            <ReferenceLine
              y={goalL}
              stroke="#3B82F6"
              strokeDasharray="4 4"
              strokeOpacity={0.5}
              label={{ value: 'Hedef', fill: '#3B82F6', fontSize: 10, position: 'right' }}
            />
            <Bar dataKey="liters" radius={[6, 6, 0, 0]}>
              {data.map((entry, index) => (
                <Cell
                  key={index}
                  fill={entry.goalMet ? '#10B981' : '#3B82F6'}
                  fillOpacity={entry.goalMet ? 0.9 : 0.6}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </motion.div>

      <div className="flex items-center gap-4 pt-1">
        <div className="flex items-center gap-1.5">
          <div className="h-2 w-2 rounded-full bg-emerald-500" />
          <span className="text-xs text-[#64748B]">Hedefe ulaşıldı</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-2 w-2 rounded-full bg-blue-500 opacity-60" />
          <span className="text-xs text-[#64748B]">Hedefe ulaşılamadı</span>
        </div>
      </div>
    </div>
  )
}
