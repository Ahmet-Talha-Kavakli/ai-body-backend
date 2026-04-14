'use client'

import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import type { MealTimingStats } from '@/lib/nutrition/types'

interface Props {
  timing: MealTimingStats
}

const COLORS = ['#6366F1', '#10B981', '#F59E0B', '#EC4899']
const LABELS = ['Kahvaltı', 'Öğle', 'Akşam', 'Atıştırma']

export function MealTimingChart({ timing }: Props) {
  const data = [
    { name: LABELS[0], value: timing.breakfast },
    { name: LABELS[1], value: timing.lunch },
    { name: LABELS[2], value: timing.dinner },
    { name: LABELS[3], value: timing.snack },
  ].filter((d) => d.value > 0)

  if (data.length === 0) {
    return (
      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-4">
        <h3 className="mb-4 text-sm font-semibold text-white">Öğün Zamanı Dağılımı</h3>
        <p className="py-8 text-center text-sm text-[#64748B]">Henüz veri yok</p>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-4">
      <h3 className="mb-4 text-sm font-semibold text-white">Öğün Zamanı Dağılımı</h3>
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie data={data} cx="50%" cy="50%" outerRadius={75} dataKey="value">
            {data.map((_, index) => (
              <Cell key={index} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: '#1E293B',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: '8px',
              color: '#fff',
              fontSize: 12,
            }}
            formatter={(value: number, name: string) => [`${value} kcal ort.`, name]}
          />
          <Legend wrapperStyle={{ fontSize: 12, color: '#94A3B8' }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
