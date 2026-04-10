'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Edit2, Save, X, Dumbbell } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface TrainingHistory {
  trainingDaysPerWeek: number
  preferredExercises: string[]
  dislikedExercises: string[]
  trainingStyle: string
  preferredDuration: number
}

const EXERCISE_OPTIONS = ['Squat', 'Deadlift', 'Bench Press', 'Pull-up', 'Overhead Press', 'Row', 'Lunges', 'Hip Thrust', 'Dips', 'Curl', 'Leg Press', 'Lat Pulldown']

const TRAINING_STYLES: Record<string, string> = {
  strength: 'Güç', hypertrophy: 'Hipertrofi', cardio: 'Kardio',
  hiit: 'HIIT', crossfit: 'CrossFit', powerlifting: 'Powerlifting',
}

interface TrainingHistoryCardProps {
  history: TrainingHistory | null
  isLoading?: boolean
  onSave?: (data: Partial<TrainingHistory>) => Promise<void>
}

export function TrainingHistoryCard({ history, isLoading, onSave }: TrainingHistoryCardProps) {
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<Partial<TrainingHistory>>({})

  const startEdit = () => {
    setForm(history ?? { preferredExercises: [], dislikedExercises: [], trainingDaysPerWeek: 3, preferredDuration: 45 })
    setEditing(true)
  }
  const cancelEdit = () => { setForm({}); setEditing(false) }
  const handleSave = async () => {
    setSaving(true)
    try { await onSave?.(form); setEditing(false) }
    finally { setSaving(false) }
  }

  const toggleEx = (ex: string, field: 'preferredExercises' | 'dislikedExercises') => {
    setForm(p => {
      const cur = p[field] ?? []
      return { ...p, [field]: cur.includes(ex) ? cur.filter(e => e !== ex) : [...cur, ex] }
    })
  }

  if (isLoading) {
    return (
      <Card className="bg-card/50 border-border/30">
        <CardHeader><div className="h-6 w-44 bg-muted animate-pulse rounded" /></CardHeader>
        <CardContent className="space-y-3">
          {[...Array(3)].map((_, i) => <div key={i} className="h-10 bg-muted/50 animate-pulse rounded-lg" />)}
        </CardContent>
      </Card>
    )
  }

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="bg-card/50 border-border/30 backdrop-blur-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <Dumbbell size={16} className="text-blue-400" />
            </div>
            <CardTitle className="text-lg">Antrenman Geçmişi</CardTitle>
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
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-2 block">
                  Haftada Antrenman Günü: <span className="text-primary font-bold">{form.trainingDaysPerWeek ?? 3}</span>
                </label>
                <input type="range" min={1} max={7}
                  value={form.trainingDaysPerWeek ?? 3}
                  onChange={e => setForm(p => ({ ...p, trainingDaysPerWeek: +e.target.value }))}
                  className="w-full accent-primary cursor-pointer" />
                <div className="flex justify-between text-xs text-muted-foreground mt-1"><span>1</span><span>7</span></div>
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-2 block">
                  Seans Süresi: <span className="text-primary font-bold">{form.preferredDuration ?? 45} dk</span>
                </label>
                <input type="range" min={20} max={120} step={5}
                  value={form.preferredDuration ?? 45}
                  onChange={e => setForm(p => ({ ...p, preferredDuration: +e.target.value }))}
                  className="w-full accent-primary cursor-pointer" />
                <div className="flex justify-between text-xs text-muted-foreground mt-1"><span>20 dk</span><span>120 dk</span></div>
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-2 block">Antrenman Stili</label>
                <div className="grid grid-cols-3 gap-2">
                  {Object.entries(TRAINING_STYLES).map(([v, l]) => (
                    <button key={v} onClick={() => setForm(p => ({ ...p, trainingStyle: v }))}
                      className={cn('py-2 rounded-lg border text-xs font-semibold transition-all',
                        form.trainingStyle === v ? 'bg-primary/10 border-primary text-primary' : 'border-border text-muted-foreground'
                      )}>
                      {l}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-2 block">
                  Tercih Edilen Egzersizler <span className="text-green-400">({(form.preferredExercises ?? []).length} seçili)</span>
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {EXERCISE_OPTIONS.map(ex => {
                    const pref = (form.preferredExercises ?? []).includes(ex)
                    const dis = (form.dislikedExercises ?? []).includes(ex)
                    return (
                      <button key={ex}
                        onClick={() => {
                          if (dis) toggleEx(ex, 'dislikedExercises')
                          toggleEx(ex, 'preferredExercises')
                        }}
                        className={cn('px-3 py-1.5 rounded-full border text-xs font-semibold transition-all',
                          pref ? 'bg-green-500/10 border-green-500 text-green-400' : 'border-border text-muted-foreground'
                        )}>
                        {ex}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-2 block">
                  Sevmediğin Egzersizler <span className="text-red-400">({(form.dislikedExercises ?? []).length} seçili)</span>
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {EXERCISE_OPTIONS.map(ex => {
                    const dis = (form.dislikedExercises ?? []).includes(ex)
                    return (
                      <button key={ex}
                        onClick={() => {
                          if ((form.preferredExercises ?? []).includes(ex)) toggleEx(ex, 'preferredExercises')
                          toggleEx(ex, 'dislikedExercises')
                        }}
                        className={cn('px-3 py-1.5 rounded-full border text-xs font-semibold transition-all',
                          dis ? 'bg-red-500/10 border-red-500 text-red-400' : 'border-border text-muted-foreground'
                        )}>
                        {ex}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          ) : !history ? (
            <p className="text-sm text-muted-foreground text-center py-4">Henüz antrenman bilgisi eklenmemiş.</p>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-muted/30 rounded-xl p-3 text-center">
                  <p className="text-2xl font-black text-primary">{history.trainingDaysPerWeek}</p>
                  <p className="text-xs text-muted-foreground">gün / hafta</p>
                </div>
                <div className="bg-muted/30 rounded-xl p-3 text-center">
                  <p className="text-2xl font-black text-primary">{history.preferredDuration}</p>
                  <p className="text-xs text-muted-foreground">dk / seans</p>
                </div>
                <div className="bg-muted/30 rounded-xl p-3 text-center">
                  <p className="text-sm font-bold text-primary">{TRAINING_STYLES[history.trainingStyle] ?? history.trainingStyle}</p>
                  <p className="text-xs text-muted-foreground">stil</p>
                </div>
              </div>

              {history.preferredExercises?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-2">Tercih Edilenler</p>
                  <div className="flex flex-wrap gap-1.5">
                    {history.preferredExercises.map(ex => (
                      <Badge key={ex} variant="outline" className="border-green-500/50 text-green-400">{ex}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {history.dislikedExercises?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-2">Sevilmeyenler</p>
                  <div className="flex flex-wrap gap-1.5">
                    {history.dislikedExercises.map(ex => (
                      <Badge key={ex} variant="outline" className="border-red-500/50 text-red-400">{ex}</Badge>
                    ))}
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
