'use client'

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

interface WeeklyBarChartProps {
  data: { date: string; value: number }[]
  color: string
  label: string
  unit: string
}

export function WeeklyBarChart({ data, color, label, unit }: WeeklyBarChartProps) {
  const formatted = data.map((d) => ({
    ...d,
    day: new Date(d.date).toLocaleDateString('tr-TR', { weekday: 'short' }),
  }))

  return (
    <ResponsiveContainer width="100%" height={160}>
      <BarChart data={formatted} barSize={28} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
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
          formatter={(v: number) => [`${v.toLocaleString('tr-TR')} ${unit}`, label]}
          cursor={{ fill: 'rgba(255,255,255,0.04)', radius: 8 }}
        />
        <Bar dataKey="value" fill={color} radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
