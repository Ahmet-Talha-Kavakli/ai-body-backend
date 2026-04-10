'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Moon, Zap, Dumbbell, Heart, Smile, Loader2, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

interface DailyCheckInData {
  sleepHours: number
  sleepQuality: number
  stressLevel: number
  proteinIntake: number
  calorieIntake?: number
  waterIntake: number
  mood: string
  energyLevel: number
  soreness: number
  injuryPain: number
  notes?: string
}

const MOOD_OPTIONS = [
  { value: 'great', label: '😄 Harika', color: 'border-green-500 bg-green-500/10 text-green-400' },
  { value: 'good', label: '🙂 İyi', color: 'border-blue-500 bg-blue-500/10 text-blue-400' },
  { value: 'okay', label: '😐 Fena Değil', color: 'border-yellow-500 bg-yellow-500/10 text-yellow-400' },
  { value: 'tired', label: '😴 Yorgun', color: 'border-orange-500 bg-orange-500/10 text-orange-400' },
  { value: 'bad', label: '😞 Kötü', color: 'border-red-500 bg-red-500/10 text-red-400' },
]

interface SliderFieldProps {
  label: string
  value: number
  min?: number
  max?: number
  step?: number
  onChange: (v: number) => void
  icon: React.ElementType
  color: string
  formatValue?: (v: number) => string
}

function SliderField({ label, value, min = 1, max = 10, step = 1, onChange, icon: Icon, color, formatValue }: SliderFieldProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-1.5">
          <Icon size={13} className={color} />
          <label className="text-xs font-semibold text-muted-foreground">{label}</label>
        </div>
        <span className={cn('text-xs font-bold', color)}>{formatValue ? formatValue(value) : `${value}/${max}`}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(+e.target.value)}
        className="w-full accent-primary cursor-pointer" />
    </div>
  )
}

interface DailyCheckInModalProps {
  open: boolean
  onClose: () => void
  onSubmit?: (data: DailyCheckInData) => Promise<void>
}

export function DailyCheckInModal({ open, onClose, onSubmit }: DailyCheckInModalProps) {
  const [saving, setSaving] = useState(false)
  const [done, setDone] = useState(false)
  const [form, setForm] = useState<DailyCheckInData>({
    sleepHours: 7,
    sleepQuality: 7,
    stressLevel: 4,
    proteinIntake: 120,
    calorieIntake: undefined,
    waterIntake: 2000,
    mood: 'good',
    energyLevel: 7,
    soreness: 3,
    injuryPain: 1,
    notes: '',
  })

  const set = <K extends keyof DailyCheckInData>(field: K, value: DailyCheckInData[K]) =>
    setForm(p => ({ ...p, [field]: value }))

  const handleSubmit = async () => {
    setSaving(true)
    try {
      if (onSubmit) {
        await onSubmit(form)
      } else {
        await fetch('/api/user/daily-metrics', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        })
      }
      setDone(true)
      setTimeout(() => { setDone(false); onClose() }, 1800)
    } finally {
      setSaving(false)
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={e => e.target === e.currentTarget && onClose()}
        >
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="w-full max-w-md bg-card border border-border/40 rounded-2xl shadow-2xl overflow-hidden"
          >
            {done ? (
              <div className="flex flex-col items-center justify-center p-12 gap-4">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200 }}
                >
                  <CheckCircle size={56} className="text-green-400" />
                </motion.div>
                <p className="text-xl font-black">Kaydedildi!</p>
                <p className="text-sm text-muted-foreground">Günlük check-in tamamlandı.</p>
              </div>
            ) : (
              <>
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-border/30">
                  <div>
                    <h3 className="font-black text-lg">Günlük Check-in</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">~2 dakikada tamamla</p>
                  </div>
                  <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-muted transition-colors">
                    <X size={16} />
                  </button>
                </div>

                {/* Content */}
                <div className="p-5 space-y-5 max-h-[70vh] overflow-y-auto">
                  {/* Mood */}
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground mb-2 block">Bugün nasılsın?</label>
                    <div className="grid grid-cols-5 gap-1.5">
                      {MOOD_OPTIONS.map(m => (
                        <button key={m.value} onClick={() => set('mood', m.value)}
                          className={cn('py-2 px-1 rounded-xl border text-xs font-semibold transition-all text-center leading-tight',
                            form.mood === m.value ? m.color : 'border-border text-muted-foreground'
                          )}>
                          {m.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Sleep */}
                  <SliderField
                    label="Uyku Süresi"
                    value={form.sleepHours}
                    min={3} max={12} step={0.5}
                    onChange={v => set('sleepHours', v)}
                    icon={Moon}
                    color="text-purple-400"
                    formatValue={v => `${v} saat`}
                  />

                  <SliderField
                    label="Uyku Kalitesi"
                    value={form.sleepQuality}
                    onChange={v => set('sleepQuality', v)}
                    icon={Moon}
                    color="text-indigo-400"
                  />

                  <SliderField
                    label="Enerji Seviyesi"
                    value={form.energyLevel}
                    onChange={v => set('energyLevel', v)}
                    icon={Zap}
                    color="text-yellow-400"
                  />

                  <SliderField
                    label="Stres Seviyesi"
                    value={form.stressLevel}
                    onChange={v => set('stressLevel', v)}
                    icon={Heart}
                    color="text-red-400"
                  />

                  <SliderField
                    label="Kas Ağrısı"
                    value={form.soreness}
                    onChange={v => set('soreness', v)}
                    icon={Dumbbell}
                    color="text-orange-400"
                  />

                  <SliderField
                    label="Sakatlık Ağrısı"
                    value={form.injuryPain}
                    onChange={v => set('injuryPain', v)}
                    icon={Heart}
                    color="text-red-500"
                  />

                  {/* Nutrition */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Protein (g)</label>
                      <Input type="number" value={form.proteinIntake} onChange={e => set('proteinIntake', +e.target.value)} placeholder="120" />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Su (ml)</label>
                      <Input type="number" value={form.waterIntake} onChange={e => set('waterIntake', +e.target.value)} placeholder="2000" />
                    </div>
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Notlar (opsiyonel)</label>
                    <textarea rows={2}
                      value={form.notes}
                      onChange={e => set('notes', e.target.value)}
                      placeholder="Bugün nasıl hissettin?"
                      className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring resize-none"
                    />
                  </div>
                </div>

                {/* Footer */}
                <div className="p-5 border-t border-border/30">
                  <Button className="w-full gap-2" onClick={handleSubmit} disabled={saving}>
                    {saving
                      ? <><Loader2 size={14} className="animate-spin" /> Kaydediliyor...</>
                      : <><Smile size={14} /> Check-in Tamamla</>
                    }
                  </Button>
                </div>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
