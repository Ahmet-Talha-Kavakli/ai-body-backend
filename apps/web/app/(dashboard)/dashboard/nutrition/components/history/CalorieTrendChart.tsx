'use client'

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from 'recharts'
import type { DailyEntry } from '@/lib/nutrition/types'

interface Props {
  daily: DailyEntry[]
  goalCalories: number
}

export function CalorieTrendChart({ daily, goalCalories }: Props) {
  const data = daily.map((d) => ({
    date: d.date.slice(5), // MM-DD
    calories: d.calories,
  }))

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-4">
      <h3 className="mb-4 text-sm font-semibold text-white">Kalori Trendi (30 Gün)</h3>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis
            dataKey="date"
            tick={{ fill: '#64748B', fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            interval={6}
          />
          <YAxis
            tick={{ fill: '#64748B', fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            width={40}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1E293B',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: '8px',
              color: '#fff',
              fontSize: 12,
            }}
            formatter={(value: number) => [`${value} kcal`, 'Kalori']}
          />
          <ReferenceLine
            y={goalCalories}
            stroke="#6366F1"
            strokeDasharray="4 4"
            label={{ value: 'Hedef', fill: '#6366F1', fontSize: 11 }}
          />
          <Line
            type="monotone"
            dataKey="calories"
            stroke="#10B981"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: '#10B981' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
