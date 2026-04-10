'use client'

import { motion } from 'framer-motion'
import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ZAxis,
} from 'recharts'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'

interface DataPoint {
  sleepHours: number
  formScore: number
  soreness: number
}

interface RecoveryVsPerformanceChartProps {
  data?: DataPoint[]
  isLoading?: boolean
}

const MOCK_DATA: DataPoint[] = [
  { sleepHours: 5, formScore: 68, soreness: 8 },
  { sleepHours: 6, formScore: 72, soreness: 6 },
  { sleepHours: 6.5, formScore: 75, soreness: 5 },
  { sleepHours: 7, formScore: 80, soreness: 4 },
  { sleepHours: 7.5, formScore: 84, soreness: 3 },
  { sleepHours: 8, formScore: 88, soreness: 3 },
  { sleepHours: 8.5, formScore: 86, soreness: 2 },
  { sleepHours: 9, formScore: 85, soreness: 2 },
  { sleepHours: 5.5, formScore: 70, soreness: 7 },
  { sleepHours: 7, formScore: 82, soreness: 4 },
  { sleepHours: 6, formScore: 74, soreness: 6 },
  { sleepHours: 8, formScore: 90, soreness: 2 },
]

const tooltipStyle = {
  backgroundColor: 'hsl(var(--card))',
  border: '1px solid hsl(var(--border))',
  borderRadius: '8px',
  color: 'hsl(var(--foreground))',
  fontSize: '12px',
}

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null
  const d = payload[0]?.payload as DataPoint
  return (
    <div style={tooltipStyle} className="p-3 space-y-1">
      <p className="text-xs font-semibold">Uyku: <span className="text-primary">{d.sleepHours}h</span></p>
      <p className="text-xs font-semibold">Form Skoru: <span className="text-green-400">{d.formScore}%</span></p>
      <p className="text-xs font-semibold">Ağrı: <span className="text-red-400">{d.soreness}/10</span></p>
    </div>
  )
}

export function RecoveryVsPerformanceChart({ data, isLoading }: RecoveryVsPerformanceChartProps) {
  const chartData = data ?? MOCK_DATA

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="bg-card/50 border-border/30 backdrop-blur-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Toparlanma vs Performans</CardTitle>
          <p className="text-xs text-muted-foreground">Uyku süresi ile form skoru ilişkisi</p>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="h-52 bg-muted/30 animate-pulse rounded-xl" />
          ) : (
            <>
              <p className="text-xs text-muted-foreground mb-3">
                Nokta boyutu kas ağrısını, pozisyon ise uyku–form ilişkisini gösterir.
              </p>
              <ResponsiveContainer width="100%" height={220}>
                <ScatterChart margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
                  <XAxis
                    dataKey="sleepHours"
                    name="Uyku"
                    type="number"
                    domain={[4.5, 9.5]}
                    stroke="hsl(var(--muted-foreground))"
                    tick={{ fontSize: 11 }}
                    label={{ value: 'Uyku (saat)', position: 'insideBottom', offset: -2, fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <YAxis
                    dataKey="formScore"
                    name="Form"
                    domain={[60, 95]}
                    stroke="hsl(var(--muted-foreground))"
                    tick={{ fontSize: 11 }}
                    label={{ value: 'Form %', angle: -90, position: 'insideLeft', fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <ZAxis dataKey="soreness" range={[40, 200]} />
                  <Tooltip content={<CustomTooltip />} />
                  <Scatter
                    data={chartData}
                    fill="hsl(var(--primary))"
                    fillOpacity={0.7}
                  />
                </ScatterChart>
              </ResponsiveContainer>
            </>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}
