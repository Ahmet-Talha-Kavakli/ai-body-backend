'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Edit2, Save, X, Apple } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface NutritionMetrics {
  proteinTarget: number
  calorieTarget?: number
  dietType: string
  avgSleepHours: number
  stressLevel: number
  waterIntakeTarget: number
  supplementStack: string[]
}

const DIET_LABELS: Record<string, string> = {
  standard: 'Standart', vegetarian: 'Vejetaryen', vegan: 'Vegan',
  keto: 'Keto', paleo: 'Paleo', intermittent_fasting: 'Aralıklı Oruç',
}

const SUPPLEMENT_OPTIONS = ['Whey Protein', 'Kreatin', 'BCAA', 'Omega-3', 'Vitamin D', 'Magnezyum', 'Pre-workout', 'Glutamin']

interface NutritionMetricsCardProps {
  metrics: NutritionMetrics | null
  isLoading?: boolean
  onSave?: (data: Partial<NutritionMetrics>) => Promise<void>
}

function ProgressBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = Math.min((value / max) * 100, 100)
  return (
    <div className="h-2 bg-muted rounded-full overflow-hidden">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.7 }}
        className={cn('h-full rounded-full', color)}
      />
    </div>
  )
}

export function NutritionMetricsCard({ metrics, isLoading, onSave }: NutritionMetricsCardProps) {
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<Partial<NutritionMetrics>>({})

  const startEdit = () => {
    setForm(metrics ?? { supplementStack: [], avgSleepHours: 7, stressLevel: 5, waterIntakeTarget: 2500 })
    setEditing(true)
  }
  const cancelEdit = () => { setForm({}); setEditing(false) }
  const handleSave = async () => {
    setSaving(true)
    try { await onSave?.(form); setEditing(false) }
    finally { setSaving(false) }
  }

  const toggleSup = (s: string) => {
    setForm(p => {
      const cur = p.supplementStack ?? []
      return { ...p, supplementStack: cur.includes(s) ? cur.filter(x => x !== s) : [...cur, s] }
    })
  }

  if (isLoading) {
    return (
      <Card className="bg-card/50 border-border/30">
        <CardHeader><div className="h-6 w-36 bg-muted animate-pulse rounded" /></CardHeader>
        <CardContent className="space-y-3">
          {[...Array(4)].map((_, i) => <div key={i} className="h-10 bg-muted/50 animate-pulse rounded-lg" />)}
        </CardContent>
      </Card>
    )
  }

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="bg-card/50 border-border/30 backdrop-blur-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center">
              <Apple size={16} className="text-orange-400" />
            </div>
            <CardTitle className="text-lg">Beslenme Metrikleri</CardTitle>
          </div>
          {!editing ? (
            <Button variant="ghost" size="sm" onClick={startEdit} className="gap-1.5">
              <Edit2 size={13} /> Düzenle
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={cancelEdit}><X size={13} /></Button>
              <Button size="sm" onClick={handleSave} disabled={saving} className="gap-1.5">
                <Save size={13} /> {saving ? 'Kaydediliyor...' : 'Kaydet'}
              </Button>
            </div>
          )}
        </CardHeader>

        <CardContent>
          {editing ? (
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Protein Hedefi (g)</label>
                  <Input type="number" placeholder="150" value={form.proteinTarget ?? ''} onChange={e => setForm(p => ({ ...p, proteinTarget: +e.target.value }))} />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Kalori Hedefi</label>
                  <Input type="number" placeholder="2200" value={form.calorieTarget ?? ''} onChange={e => setForm(p => ({ ...p, calorieTarget: +e.target.value }))} />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Su Hedefi (ml)</label>
                  <Input type="number" placeholder="2500" value={form.waterIntakeTarget ?? ''} onChange={e => setForm(p => ({ ...p, waterIntakeTarget: +e.target.value }))} />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-2 block">Diyet Tipi</label>
                <div className="grid grid-cols-3 gap-2">
                  {Object.entries(DIET_LABELS).map(([v, l]) => (
                    <button key={v} onClick={() => setForm(p => ({ ...p, dietType: v }))}
                      className={cn('py-2 rounded-lg border text-xs font-semibold transition-all',
                        form.dietType === v ? 'bg-primary/10 border-primary text-primary' : 'border-border text-muted-foreground'
                      )}>
                      {l}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-2 block">
                  Uyku: <span className="text-primary font-bold">{form.avgSleepHours ?? 7} saat</span>
                </label>
                <input type="range" min={4} max={12} step={0.5}
                  value={form.avgSleepHours ?? 7}
                  onChange={e => setForm(p => ({ ...p, avgSleepHours: +e.target.value }))}
                  className="w-full accent-primary cursor-pointer" />
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-2 block">
                  Stres Seviyesi: <span className={cn('font-bold', (form.stressLevel ?? 5) > 7 ? 'text-red-400' : (form.stressLevel ?? 5) > 4 ? 'text-orange-400' : 'text-green-400')}>{form.stressLevel ?? 5}/10</span>
                </label>
                <input type="range" min={1} max={10}
                  value={form.stressLevel ?? 5}
                  onChange={e => setForm(p => ({ ...p, stressLevel: +e.target.value }))}
                  className="w-full accent-primary cursor-pointer" />
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-2 block">Supleman Kullanımı</label>
                <div className="flex flex-wrap gap-1.5">
                  {SUPPLEMENT_OPTIONS.map(s => {
                    const sel = (form.supplementStack ?? []).includes(s)
                    return (
                      <button key={s} onClick={() => toggleSup(s)}
                        className={cn('px-3 py-1.5 rounded-full border text-xs font-semibold transition-all',
                          sel ? 'bg-blue-500/10 border-blue-500 text-blue-400' : 'border-border text-muted-foreground'
                        )}>
                        {s}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          ) : !metrics ? (
            <p className="text-sm text-muted-foreground text-center py-4">Henüz beslenme bilgisi eklenmemiş.</p>
          ) : (
            <div className="space-y-4">
              {/* Targets */}
              <div className="space-y-3">
                {[
                  { label: 'Protein', value: metrics.proteinTarget, max: 250, unit: 'g', color: 'bg-blue-500' },
                  { label: 'Kalori', value: metrics.calorieTarget ?? 0, max: 4000, unit: 'kcal', color: 'bg-orange-500' },
                  { label: 'Su', value: metrics.waterIntakeTarget, max: 5000, unit: 'ml', color: 'bg-cyan-500' },
                ].map(item => (
                  <div key={item.label}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-semibold text-muted-foreground">{item.label}</span>
                      <span className="font-bold">{item.value.toLocaleString('tr-TR')} {item.unit}</span>
                    </div>
                    <ProgressBar value={item.value} max={item.max} color={item.color} />
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="bg-muted/30 rounded-xl p-3 text-center">
                  <p className="text-lg font-black">{metrics.avgSleepHours}h</p>
                  <p className="text-xs text-muted-foreground">Uyku</p>
                </div>
                <div className="bg-muted/30 rounded-xl p-3 text-center">
                  <p className={cn('text-lg font-black', metrics.stressLevel > 7 ? 'text-red-400' : metrics.stressLevel > 4 ? 'text-orange-400' : 'text-green-400')}>
                    {metrics.stressLevel}/10
                  </p>
                  <p className="text-xs text-muted-foreground">Stres</p>
                </div>
                <div className="bg-muted/30 rounded-xl p-3 text-center">
                  <p className="text-sm font-bold">{DIET_LABELS[metrics.dietType] ?? metrics.dietType}</p>
                  <p className="text-xs text-muted-foreground">Diyet</p>
                </div>
              </div>

              {metrics.supplementStack?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-2">Suplemanlar</p>
                  <div className="flex flex-wrap gap-1.5">
                    {metrics.supplementStack.map(s => <Badge key={s} variant="secondary">{s}</Badge>)}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}
