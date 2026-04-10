'use client'

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Trophy, ArrowUpDown, ArrowUp, ArrowDown, TrendingUp } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface PersonalRecord {
  id: string
  exercise: string
  category: string
  value: number
  unit: string
  date: string
  improvement?: number
}

interface PersonalRecordsTableProps {
  data?: PersonalRecord[]
  isLoading?: boolean
}

const MOCK_DATA: PersonalRecord[] = [
  { id: '1', exercise: 'Squat', category: 'Bacak', value: 120, unit: 'kg', date: '2026-03-15', improvement: 5 },
  { id: '2', exercise: 'Deadlift', category: 'Sırt', value: 140, unit: 'kg', date: '2026-03-28', improvement: 10 },
  { id: '3', exercise: 'Bench Press', category: 'Göğüs', value: 90, unit: 'kg', date: '2026-02-20', improvement: 2.5 },
  { id: '4', exercise: 'Overhead Press', category: 'Omuz', value: 65, unit: 'kg', date: '2026-04-01', improvement: 2.5 },
  { id: '5', exercise: 'Pull-up', category: 'Sırt', value: 15, unit: 'tekrar', date: '2026-03-10', improvement: 3 },
  { id: '6', exercise: 'Hip Thrust', category: 'Glut', value: 100, unit: 'kg', date: '2026-04-05', improvement: 5 },
  { id: '7', exercise: 'Row', category: 'Sırt', value: 75, unit: 'kg', date: '2026-02-14', improvement: 0 },
  { id: '8', exercise: 'Dips', category: 'Göğüs', value: 12, unit: 'tekrar', date: '2026-01-30', improvement: 4 },
]

type SortKey = 'exercise' | 'value' | 'date' | 'improvement'
type SortDir = 'asc' | 'desc'

function SortIcon({ col, active, dir }: { col: string; active: string; dir: SortDir }) {
  if (col !== active) return <ArrowUpDown size={12} className="opacity-40" />
  return dir === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />
}

export function PersonalRecordsTable({ data, isLoading }: PersonalRecordsTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>('date')
  const [sortDir, setSortDir] = useState<SortDir>('desc')

  const tableData = data ?? MOCK_DATA

  const sorted = useMemo(() => {
    return [...tableData].sort((a, b) => {
      let va: any = a[sortKey]
      let vb: any = b[sortKey]
      if (sortKey === 'date') { va = new Date(va).getTime(); vb = new Date(vb).getTime() }
      if (typeof va === 'string') return sortDir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va)
      return sortDir === 'asc' ? va - vb : vb - va
    })
  }, [tableData, sortKey, sortDir])

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('desc') }
  }

  const headerClass = 'text-xs font-semibold text-muted-foreground px-3 py-2.5 text-left cursor-pointer hover:text-foreground transition-colors select-none'

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="bg-card/50 border-border/30 backdrop-blur-sm">
        <CardHeader className="flex flex-row items-center gap-2 pb-3">
          <div className="w-8 h-8 rounded-lg bg-yellow-500/10 flex items-center justify-center">
            <Trophy size={16} className="text-yellow-400" />
          </div>
          <div>
            <CardTitle className="text-base">Kişisel Rekorlar</CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">{tableData.length} egzersiz</p>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-3">
              {[...Array(5)].map((_, i) => <div key={i} className="h-10 bg-muted/30 animate-pulse rounded-lg" />)}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border/30">
                    <th className={headerClass} onClick={() => toggleSort('exercise')}>
                      <div className="flex items-center gap-1">Egzersiz <SortIcon col="exercise" active={sortKey} dir={sortDir} /></div>
                    </th>
                    <th className={headerClass} onClick={() => toggleSort('value')}>
                      <div className="flex items-center gap-1">Rekor <SortIcon col="value" active={sortKey} dir={sortDir} /></div>
                    </th>
                    <th className={headerClass} onClick={() => toggleSort('improvement')}>
                      <div className="flex items-center gap-1">Gelişim <SortIcon col="improvement" active={sortKey} dir={sortDir} /></div>
                    </th>
                    <th className={headerClass} onClick={() => toggleSort('date')}>
                      <div className="flex items-center gap-1">Tarih <SortIcon col="date" active={sortKey} dir={sortDir} /></div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((row, i) => (
                    <motion.tr
                      key={row.id}
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.04 }}
                      className="border-b border-border/20 hover:bg-muted/20 transition-colors"
                    >
                      <td className="px-3 py-3">
                        <div>
                          <p className="text-sm font-semibold">{row.exercise}</p>
                          <Badge variant="outline" className="text-[10px] mt-0.5">{row.category}</Badge>
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <span className="text-sm font-bold text-primary">{row.value} <span className="text-xs font-normal text-muted-foreground">{row.unit}</span></span>
                      </td>
                      <td className="px-3 py-3">
                        {(row.improvement ?? 0) > 0 ? (
                          <div className="flex items-center gap-1 text-green-400">
                            <TrendingUp size={13} />
                            <span className="text-xs font-bold">+{row.improvement} {row.unit}</span>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-3 py-3 text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(row.date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}
