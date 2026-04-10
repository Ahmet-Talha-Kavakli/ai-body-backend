'use client'

import { motion } from 'framer-motion'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface WorkoutDay {
  date: string
  sessions: number
}

interface ConsistencyHeatmapProps {
  data?: WorkoutDay[]
  isLoading?: boolean
}

const DAY_LABELS = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz']
const MONTH_LABELS = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara']

function generateMockData(): WorkoutDay[] {
  const days: WorkoutDay[] = []
  const now = new Date()
  for (let i = 83; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    const rand = Math.random()
    days.push({
      date: d.toISOString().split('T')[0]!,
      sessions: rand > 0.55 ? (rand > 0.8 ? 2 : 1) : 0,
    })
  }
  return days
}

function getColor(sessions: number) {
  if (sessions === 0) return 'bg-muted/30'
  if (sessions === 1) return 'bg-primary/40'
  return 'bg-primary'
}

export function ConsistencyHeatmap({ data, isLoading }: ConsistencyHeatmapProps) {
  const rawData = data ?? generateMockData()

  // Build weeks grid
  const today = new Date()
  const startDate = new Date(today)
  startDate.setDate(startDate.getDate() - 83)

  // Pad to start on Monday
  const startDayOfWeek = (startDate.getDay() + 6) % 7 // 0=Mon
  const paddedDays: (WorkoutDay | null)[] = [
    ...Array(startDayOfWeek).fill(null),
    ...rawData,
  ]

  const weeks: (WorkoutDay | null)[][] = []
  for (let i = 0; i < paddedDays.length; i += 7) {
    weeks.push(paddedDays.slice(i, i + 7))
  }

  const dataMap = new Map(rawData.map(d => [d.date, d.sessions]))
  const totalSessions = rawData.reduce((s, d) => s + d.sessions, 0)
  const activeDays = rawData.filter(d => d.sessions > 0).length

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="bg-card/50 border-border/30 backdrop-blur-sm">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-base">Antrenman Tutarlılığı</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">Son 12 hafta</p>
            </div>
            <div className="flex gap-3 text-right">
              <div>
                <p className="text-xl font-black text-primary">{totalSessions}</p>
                <p className="text-xs text-muted-foreground">seans</p>
              </div>
              <div>
                <p className="text-xl font-black">{activeDays}</p>
                <p className="text-xs text-muted-foreground">aktif gün</p>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="h-32 bg-muted/30 animate-pulse rounded-xl" />
          ) : (
            <div className="overflow-x-auto">
              <div className="inline-flex gap-1">
                {/* Day labels */}
                <div className="flex flex-col gap-1 mr-1">
                  <div className="h-3" /> {/* spacer for month label */}
                  {DAY_LABELS.map((d, i) => (
                    <div key={d} className={cn('h-3 w-6 text-[9px] text-muted-foreground flex items-center', i % 2 === 0 ? 'opacity-100' : 'opacity-0')}>
                      {d}
                    </div>
                  ))}
                </div>

                {/* Weeks */}
                {weeks.map((week, wi) => {
                  const firstRealDay = week.find(d => d !== null)
                  const monthLabel = firstRealDay ? MONTH_LABELS[new Date(firstRealDay.date).getMonth()] : ''
                  const showMonth = wi === 0 || (firstRealDay && new Date(firstRealDay.date).getDate() <= 7)

                  return (
                    <div key={wi} className="flex flex-col gap-1">
                      <div className="h-3 text-[9px] text-muted-foreground">{showMonth ? monthLabel : ''}</div>
                      {week.map((day, di) => {
                        if (!day) return <div key={di} className="w-3 h-3 rounded-[2px] opacity-0" />
                        const sessions = dataMap.get(day.date) ?? 0
                        const isToday = day.date === today.toISOString().split('T')[0]
                        return (
                          <motion.div
                            key={day.date}
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: wi * 0.015 }}
                            title={`${day.date}: ${sessions} seans`}
                            className={cn(
                              'w-3 h-3 rounded-[2px] cursor-pointer transition-transform hover:scale-125',
                              getColor(sessions),
                              isToday && 'ring-1 ring-primary ring-offset-1 ring-offset-card'
                            )}
                          />
                        )
                      })}
                    </div>
                  )
                })}
              </div>

              {/* Legend */}
              <div className="flex items-center gap-2 mt-3">
                <span className="text-xs text-muted-foreground">Az</span>
                {['bg-muted/30', 'bg-primary/40', 'bg-primary'].map((c, i) => (
                  <div key={i} className={cn('w-3 h-3 rounded-[2px]', c)} />
                ))}
                <span className="text-xs text-muted-foreground">Çok</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}
