'use client'

import { motion } from 'framer-motion'
import { Target, Calendar, TrendingDown, TrendingUp, Minus } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface WeakPoint {
  id: string
  muscleGroup: string
  exerciseName: string
  severity: number
  discoveredDate: string
  targetDate?: string
  status?: 'improving' | 'stable' | 'worsening'
}

interface WeakPointsTimelineProps {
  data?: WeakPoint[]
  isLoading?: boolean
}

const MOCK_DATA: WeakPoint[] = [
  {
    id: '1', muscleGroup: 'Omuz', exerciseName: 'Overhead Press',
    severity: 7, discoveredDate: '2025-12-10', targetDate: '2026-03-10', status: 'improving',
  },
  {
    id: '2', muscleGroup: 'Hamstring', exerciseName: 'Deadlift',
    severity: 6, discoveredDate: '2026-01-05', targetDate: '2026-04-05', status: 'stable',
  },
  {
    id: '3', muscleGroup: 'Sol Bacak', exerciseName: 'Squat Dengesizliği',
    severity: 5, discoveredDate: '2026-01-20', targetDate: '2026-05-01', status: 'improving',
  },
  {
    id: '4', muscleGroup: 'Ön Kol', exerciseName: 'Curl Zayıflığı',
    severity: 4, discoveredDate: '2026-02-14', status: 'stable',
  },
  {
    id: '5', muscleGroup: 'Diz Stabilitesi', exerciseName: 'Lunge',
    severity: 8, discoveredDate: '2026-03-01', targetDate: '2026-06-01', status: 'worsening',
  },
]

function SeverityDots({ severity }: { severity: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(i => (
        <div key={i} className={cn(
          'w-1.5 h-1.5 rounded-full transition-all',
          i <= severity
            ? severity >= 7 ? 'bg-red-500' : severity >= 5 ? 'bg-orange-500' : 'bg-yellow-500'
            : 'bg-muted/50'
        )} />
      ))}
    </div>
  )
}

function StatusIcon({ status }: { status?: string }) {
  if (status === 'improving') return <TrendingUp size={13} className="text-green-400" />
  if (status === 'worsening') return <TrendingDown size={13} className="text-red-400" />
  return <Minus size={13} className="text-muted-foreground" />
}

function StatusBadge({ status }: { status?: string }) {
  if (status === 'improving') return <Badge variant="outline" className="border-green-500/50 text-green-400 text-[10px]">İyileşiyor</Badge>
  if (status === 'worsening') return <Badge variant="outline" className="border-red-500/50 text-red-400 text-[10px]">Kötüleşiyor</Badge>
  return <Badge variant="outline" className="text-[10px]">Stabil</Badge>
}

export function WeakPointsTimeline({ data, isLoading }: WeakPointsTimelineProps) {
  const items = data ?? MOCK_DATA
  const sorted = [...items].sort((a, b) => b.severity - a.severity)

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="bg-card/50 border-border/30 backdrop-blur-sm">
        <CardHeader className="flex flex-row items-center gap-2 pb-3">
          <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center">
            <Target size={16} className="text-red-400" />
          </div>
          <div>
            <CardTitle className="text-base">Zayıf Nokta Takibi</CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">{items.length} aktif zayıf nokta</p>
          </div>
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => <div key={i} className="h-16 bg-muted/30 animate-pulse rounded-xl" />)}
            </div>
          ) : sorted.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">Zayıf nokta kaydedilmemiş.</p>
          ) : (
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-3.5 top-5 bottom-5 w-px bg-border/50" />

              <div className="space-y-4">
                {sorted.map((item, i) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.07 }}
                    className="flex gap-4"
                  >
                    {/* Timeline dot */}
                    <div className={cn(
                      'relative z-10 w-7 h-7 rounded-full border-2 flex items-center justify-center shrink-0 mt-1',
                      item.severity >= 7 ? 'border-red-500 bg-red-500/10' : item.severity >= 5 ? 'border-orange-500 bg-orange-500/10' : 'border-yellow-500 bg-yellow-500/10'
                    )}>
                      <StatusIcon status={item.status} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 p-3 rounded-xl bg-muted/20 border border-border/30">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <p className="font-semibold text-sm">{item.muscleGroup}</p>
                          <p className="text-xs text-muted-foreground">{item.exerciseName}</p>
                        </div>
                        <StatusBadge status={item.status} />
                      </div>

                      <SeverityDots severity={item.severity} />

                      <div className="flex items-center gap-3 mt-2">
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Calendar size={10} />
                          <span>Keşif: {new Date(item.discoveredDate).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}</span>
                        </div>
                        {item.targetDate && (
                          <div className="flex items-center gap-1 text-xs text-primary">
                            <Target size={10} />
                            <span>Hedef: {new Date(item.targetDate).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}
