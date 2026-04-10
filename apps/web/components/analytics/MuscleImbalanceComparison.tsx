'use client'

import { motion } from 'framer-motion'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface ImbalanceEntry {
  muscle: string
  left: number
  right: number
}

interface MuscleImbalanceComparisonProps {
  data?: ImbalanceEntry[]
  isLoading?: boolean
}

const MOCK_DATA: ImbalanceEntry[] = [
  { muscle: 'Biceps', left: 82, right: 88 },
  { muscle: 'Triceps', left: 79, right: 80 },
  { muscle: 'Omuz', left: 75, right: 83 },
  { muscle: 'Göğüs', left: 84, right: 85 },
  { muscle: 'Kuadriseps', left: 88, right: 92 },
  { muscle: 'Hamstring', left: 74, right: 80 },
]

const tooltipStyle = {
  backgroundColor: 'hsl(var(--card))',
  border: '1px solid hsl(var(--border))',
  borderRadius: '8px',
  color: 'hsl(var(--foreground))',
  fontSize: '12px',
}

export function MuscleImbalanceComparison({ data, isLoading }: MuscleImbalanceComparisonProps) {
  const chartData = data ?? MOCK_DATA

  const imbalances = chartData.map(d => ({
    ...d,
    diff: Math.abs(d.left - d.right),
    dominant: d.left > d.right ? 'Sol' : 'Sağ',
  })).filter(d => d.diff >= 5).sort((a, b) => b.diff - a.diff)

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="bg-card/50 border-border/30 backdrop-blur-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Kas Dengesizliği Karşılaştırması</CardTitle>
          <p className="text-xs text-muted-foreground">Sol / Sağ taraf form skoru farkı</p>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="h-52 bg-muted/30 animate-pulse rounded-xl" />
          ) : (
            <>
              {imbalances.length > 0 && (
                <div className="mb-3 flex flex-wrap gap-2">
                  {imbalances.slice(0, 3).map(im => (
                    <Badge key={im.muscle} variant="outline" className="border-orange-500/40 text-orange-400 text-xs">
                      {im.muscle}: {im.dominant} baskın ({im.diff} puan)
                    </Badge>
                  ))}
                </div>
              )}
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }} barSize={14}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
                  <XAxis dataKey="muscle" stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 10 }} />
                  <YAxis domain={[60, 100]} stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v: number, name: string) => [`${v}%`, name]} />
                  <Legend
                    wrapperStyle={{ fontSize: '11px', color: 'hsl(var(--muted-foreground))' }}
                    formatter={(value) => value === 'left' ? 'Sol' : 'Sağ'}
                  />
                  <Bar dataKey="left" name="Sol" fill="#6366f1" radius={[4, 4, 0, 0]} fillOpacity={0.85} />
                  <Bar dataKey="right" name="Sağ" fill="#22c55e" radius={[4, 4, 0, 0]} fillOpacity={0.85} />
                </BarChart>
              </ResponsiveContainer>
            </>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}
