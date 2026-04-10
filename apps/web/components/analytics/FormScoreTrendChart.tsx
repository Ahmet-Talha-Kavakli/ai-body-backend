'use client'

import { motion } from 'framer-motion'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface FormScoreEntry {
  date: string
  week: string
  avgFormScore: number
}

interface FormScoreTrendChartProps {
  data?: FormScoreEntry[]
  isLoading?: boolean
}

const MOCK_DATA: FormScoreEntry[] = [
  { date: '2025-12-15', week: 'Hf 1', avgFormScore: 72 },
  { date: '2025-12-22', week: 'Hf 2', avgFormScore: 75 },
  { date: '2025-12-29', week: 'Hf 3', avgFormScore: 71 },
  { date: '2026-01-05', week: 'Hf 4', avgFormScore: 78 },
  { date: '2026-01-12', week: 'Hf 5', avgFormScore: 82 },
  { date: '2026-01-19', week: 'Hf 6', avgFormScore: 80 },
  { date: '2026-01-26', week: 'Hf 7', avgFormScore: 85 },
  { date: '2026-02-02', week: 'Hf 8', avgFormScore: 88 },
]

const tooltipStyle = {
  backgroundColor: 'hsl(var(--card))',
  border: '1px solid hsl(var(--border))',
  borderRadius: '8px',
  color: 'hsl(var(--foreground))',
  fontSize: '12px',
}

export function FormScoreTrendChart({ data, isLoading }: FormScoreTrendChartProps) {
  const chartData = data ?? MOCK_DATA
  const first = chartData[0]?.avgFormScore ?? 0
  const last = chartData[chartData.length - 1]?.avgFormScore ?? 0
  const delta = last - first
  const avg = Math.round(chartData.reduce((s, d) => s + d.avgFormScore, 0) / chartData.length)

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="bg-card/50 border-border/30 backdrop-blur-sm">
        <CardHeader className="flex flex-row items-start justify-between pb-2">
          <div>
            <CardTitle className="text-base">Form Skoru Trendi</CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">8 haftalık skor gelişimi</p>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-muted/40">
            {delta > 0
              ? <><TrendingUp size={13} className="text-green-400" /><span className="text-xs font-bold text-green-400">+{delta.toFixed(0)}</span></>
              : delta < 0
              ? <><TrendingDown size={13} className="text-red-400" /><span className="text-xs font-bold text-red-400">{delta.toFixed(0)}</span></>
              : <><Minus size={13} className="text-muted-foreground" /><span className="text-xs font-bold text-muted-foreground">Sabit</span></>
            }
          </div>
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <div className="h-48 bg-muted/30 animate-pulse rounded-xl" />
          ) : (
            <>
              <div className="flex gap-4 mb-4">
                <div className="bg-muted/30 rounded-lg px-3 py-2">
                  <p className="text-xs text-muted-foreground">Mevcut</p>
                  <p className="text-xl font-black text-primary">{last}%</p>
                </div>
                <div className="bg-muted/30 rounded-lg px-3 py-2">
                  <p className="text-xs text-muted-foreground">Ortalama</p>
                  <p className="text-xl font-black">{avg}%</p>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
                  <XAxis dataKey="week" stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 11 }} />
                  <YAxis domain={[60, 100]} stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`${v}%`, 'Form Skoru']} />
                  <ReferenceLine y={avg} stroke="hsl(var(--muted-foreground))" strokeDasharray="4 4" opacity={0.5} />
                  <Line
                    type="monotone"
                    dataKey="avgFormScore"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2.5}
                    dot={{ fill: 'hsl(var(--primary))', r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}
