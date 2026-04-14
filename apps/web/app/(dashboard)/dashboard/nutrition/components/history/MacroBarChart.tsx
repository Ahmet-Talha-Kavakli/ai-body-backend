'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import type { WeeklyStats } from '@/lib/nutrition/types'

interface Props {
  weeks: WeeklyStats[]
}

export function MacroBarChart({ weeks }: Props) {
  const data = weeks.map((w) => ({
    week: w.weekLabel.split(' - ')[0], // start date only
    Protein: w.avgProtein,
    Karbonhidrat: w.avgCarbs,
    Yağ: w.avgFat,
  }))

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-4">
      <h3 className="mb-4 text-sm font-semibold text-white">Haftalık Makro Ortalama</h3>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis
            dataKey="week"
            tick={{ fill: '#64748B', fontSize: 11 }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tick={{ fill: '#64748B', fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            width={35}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1E293B',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: '8px',
              color: '#fff',
              fontSize: 12,
            }}
            formatter={(value: number, name: string) => [`${value}g`, name]}
          />
          <Legend wrapperStyle={{ fontSize: 12, color: '#94A3B8' }} />
          <Bar dataKey="Protein" fill="#6366F1" radius={[4, 4, 0, 0]} />
          <Bar dataKey="Karbonhidrat" fill="#F59E0B" radius={[4, 4, 0, 0]} />
          <Bar dataKey="Yağ" fill="#EF4444" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
