'use client'

import { motion } from 'framer-motion'
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Tooltip, ResponsiveContainer,
} from 'recharts'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'

interface MuscleData {
  muscle: string
  score: number
  fullMark: number
}

interface MusclePerformanceRadarProps {
  data?: MuscleData[]
  isLoading?: boolean
}

const MOCK_DATA: MuscleData[] = [
  { muscle: 'Göğüs', score: 82, fullMark: 100 },
  { muscle: 'Sırt', score: 75, fullMark: 100 },
  { muscle: 'Omuz', score: 68, fullMark: 100 },
  { muscle: 'Bacak', score: 88, fullMark: 100 },
  { muscle: 'Kol', score: 72, fullMark: 100 },
  { muscle: 'Karın', score: 65, fullMark: 100 },
]

const tooltipStyle = {
  backgroundColor: 'hsl(var(--card))',
  border: '1px solid hsl(var(--border))',
  borderRadius: '8px',
  color: 'hsl(var(--foreground))',
  fontSize: '12px',
}

export function MusclePerformanceRadar({ data, isLoading }: MusclePerformanceRadarProps) {
  const chartData = data ?? MOCK_DATA
  const weakest = [...chartData].sort((a, b) => a.score - b.score)[0]

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="bg-card/50 border-border/30 backdrop-blur-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Kas Grubu Performansı</CardTitle>
          <p className="text-xs text-muted-foreground">Her kas grubunun form skoru ortalaması</p>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="h-56 bg-muted/30 animate-pulse rounded-xl" />
          ) : (
            <>
              {weakest && (
                <div className="mb-3 px-3 py-2 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center gap-2">
                  <span className="text-xs text-orange-400 font-semibold">⚠ Odak Noktası:</span>
                  <span className="text-xs text-muted-foreground">{weakest.muscle} — {weakest.score}%</span>
                </div>
              )}
              <ResponsiveContainer width="100%" height={220}>
                <RadarChart data={chartData} margin={{ top: 0, right: 16, bottom: 0, left: 16 }}>
                  <PolarGrid stroke="hsl(var(--border))" />
                  <PolarAngleAxis dataKey="muscle" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 10 }} stroke="transparent" />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`${v}%`, 'Skor']} />
                  <Radar
                    name="Performans"
                    dataKey="score"
                    stroke="hsl(var(--primary))"
                    fill="hsl(var(--primary))"
                    fillOpacity={0.2}
                    strokeWidth={2}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}
