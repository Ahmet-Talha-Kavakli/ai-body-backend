'use client'

import { motion } from 'framer-motion'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts'
import { AlertTriangle } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'

interface RiskEntry {
  week: string
  risk: number
  sessions: number
}

interface InjuryRiskTimelineProps {
  data?: RiskEntry[]
  isLoading?: boolean
}

const MOCK_DATA: RiskEntry[] = [
  { week: 'Hf 1', risk: 2, sessions: 3 },
  { week: 'Hf 2', risk: 3, sessions: 4 },
  { week: 'Hf 3', risk: 5, sessions: 5 },
  { week: 'Hf 4', risk: 4, sessions: 4 },
  { week: 'Hf 5', risk: 7, sessions: 6 },
  { week: 'Hf 6', risk: 5, sessions: 4 },
  { week: 'Hf 7', risk: 3, sessions: 3 },
  { week: 'Hf 8', risk: 2, sessions: 3 },
]

function getRiskColor(risk: number) {
  if (risk <= 3) return '#22c55e'
  if (risk <= 6) return '#f97316'
  return '#ef4444'
}

function getRiskLabel(risk: number) {
  if (risk <= 3) return 'Düşük'
  if (risk <= 6) return 'Orta'
  return 'Yüksek'
}

const tooltipStyle = {
  backgroundColor: 'hsl(var(--card))',
  border: '1px solid hsl(var(--border))',
  borderRadius: '8px',
  color: 'hsl(var(--foreground))',
  fontSize: '12px',
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  const d = payload[0]?.payload as RiskEntry
  return (
    <div style={tooltipStyle} className="p-3 space-y-1">
      <p className="font-semibold">{label}</p>
      <p className="text-xs">Risk: <span style={{ color: getRiskColor(d.risk) }} className="font-bold">{d.risk}/10 ({getRiskLabel(d.risk)})</span></p>
      <p className="text-xs text-muted-foreground">Seans: {d.sessions}</p>
    </div>
  )
}

export function InjuryRiskTimeline({ data, isLoading }: InjuryRiskTimelineProps) {
  const chartData = data ?? MOCK_DATA
  const maxRisk = Math.max(...chartData.map(d => d.risk))
  const maxWeek = chartData.find(d => d.risk === maxRisk)

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="bg-card/50 border-border/30 backdrop-blur-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Sakatlık Risk Takvimi</CardTitle>
          <p className="text-xs text-muted-foreground">Haftalık sakatlık riski (1–10)</p>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="h-52 bg-muted/30 animate-pulse rounded-xl" />
          ) : (
            <>
              {maxWeek && maxRisk > 6 && (
                <div className="mb-3 flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20">
                  <AlertTriangle size={13} className="text-red-400" />
                  <p className="text-xs text-red-400">{maxWeek.week}'de risk pik değerine ulaştı ({maxRisk}/10). Yükü azaltmayı düşün.</p>
                </div>
              )}
              <div className="flex gap-3 mb-3">
                {[{ label: 'Düşük', color: '#22c55e' }, { label: 'Orta', color: '#f97316' }, { label: 'Yüksek', color: '#ef4444' }].map(l => (
                  <div key={l.label} className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: l.color }} />
                    <span className="text-xs text-muted-foreground">{l.label}</span>
                  </div>
                ))}
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
                  <XAxis dataKey="week" stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 11 }} />
                  <YAxis domain={[0, 10]} stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 11 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="risk" radius={[6, 6, 0, 0]}>
                    {chartData.map((entry, i) => (
                      <Cell key={i} fill={getRiskColor(entry.risk)} fillOpacity={0.85} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}
