'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Edit2, Save, X, Heart, Plus, Trash2 } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface Injury {
  area: string
  severity: number
  notes?: string
}

interface HealthMetrics {
  activeInjuries: Injury[]
  pastInjuries: Injury[]
  medicalRestrictions: string[]
  currentPainPoints: string[]
  doctorNotes?: string
}

const BODY_AREAS = ['Diz', 'Sırt / Bel', 'Omuz', 'El Bileği', 'Ayak Bileği', 'Boyun', 'Kalça', 'Dirsek', 'Karın']

const SEVERITY_LABELS = ['', 'Hafif', 'Orta', 'Şiddetli', 'Çok Şiddetli', 'Aşırı']

interface HealthMetricsCardProps {
  metrics: HealthMetrics | null
  isLoading?: boolean
  onSave?: (data: Partial<HealthMetrics>) => Promise<void>
}

export function HealthMetricsCard({ metrics, isLoading, onSave }: HealthMetricsCardProps) {
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<Partial<HealthMetrics>>({})

  const startEdit = () => {
    setForm(metrics ?? { activeInjuries: [], medicalRestrictions: [], currentPainPoints: [] })
    setEditing(true)
  }

  const cancelEdit = () => { setForm({}); setEditing(false) }

  const handleSave = async () => {
    setSaving(true)
    try { await onSave?.(form); setEditing(false) }
    finally { setSaving(false) }
  }

  const addInjury = () => {
    setForm(p => ({
      ...p,
      activeInjuries: [...(p.activeInjuries ?? []), { area: '', severity: 2 }]
    }))
  }

  const removeInjury = (idx: number) => {
    setForm(p => ({ ...p, activeInjuries: (p.activeInjuries ?? []).filter((_, i) => i !== idx) }))
  }

  const updateInjury = (idx: number, field: keyof Injury, value: any) => {
    setForm(p => ({
      ...p,
      activeInjuries: (p.activeInjuries ?? []).map((inj, i) => i === idx ? { ...inj, [field]: value } : inj)
    }))
  }

  const togglePainPoint = (area: string) => {
    setForm(p => {
      const current = p.currentPainPoints ?? []
      return { ...p, currentPainPoints: current.includes(area) ? current.filter(a => a !== area) : [...current, area] }
    })
  }

  if (isLoading) {
    return (
      <Card className="bg-card/50 border-border/30">
        <CardHeader><div className="h-6 w-40 bg-muted animate-pulse rounded" /></CardHeader>
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
            <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center">
              <Heart size={16} className="text-red-400" />
            </div>
            <CardTitle className="text-lg">Sağlık Metrikleri</CardTitle>
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
              {/* Injuries */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-muted-foreground">Aktif Sakatlıklar</label>
                  <button onClick={addInjury} className="flex items-center gap-1 text-xs text-primary hover:underline">
                    <Plus size={12} /> Ekle
                  </button>
                </div>
                <div className="space-y-3">
                  {(form.activeInjuries ?? []).map((inj, idx) => (
                    <div key={idx} className="flex gap-2 items-start p-3 rounded-lg bg-muted/20 border border-border/40">
                      <div className="flex-1 space-y-2">
                        <select
                          value={inj.area}
                          onChange={e => updateInjury(idx, 'area', e.target.value)}
                          className="w-full h-9 rounded-md border border-input bg-transparent px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                        >
                          <option value="">Bölge seç...</option>
                          {BODY_AREAS.map(a => <option key={a} value={a}>{a}</option>)}
                        </select>
                        <div>
                          <div className="flex justify-between text-xs text-muted-foreground mb-1">
                            <span>Şiddet</span>
                            <span className="font-semibold text-red-400">{SEVERITY_LABELS[inj.severity]}</span>
                          </div>
                          <input type="range" min={1} max={5} value={inj.severity}
                            onChange={e => updateInjury(idx, 'severity', +e.target.value)}
                            className="w-full accent-red-500 cursor-pointer" />
                        </div>
                        <Input placeholder="Notlar (opsiyonel)" value={inj.notes ?? ''}
                          onChange={e => updateInjury(idx, 'notes', e.target.value)} />
                      </div>
                      <button onClick={() => removeInjury(idx)} className="text-muted-foreground hover:text-destructive transition-colors mt-1">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                  {(form.activeInjuries ?? []).length === 0 && (
                    <p className="text-xs text-muted-foreground text-center py-2">Sakatlık eklenmemiş</p>
                  )}
                </div>
              </div>

              {/* Pain Points */}
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-2 block">Ağrı Noktaları</label>
                <div className="flex flex-wrap gap-2">
                  {BODY_AREAS.map(area => {
                    const selected = (form.currentPainPoints ?? []).includes(area)
                    return (
                      <button key={area} onClick={() => togglePainPoint(area)}
                        className={cn('px-3 py-1.5 rounded-full border text-xs font-semibold transition-all',
                          selected ? 'bg-orange-500/10 border-orange-500 text-orange-400' : 'border-border text-muted-foreground'
                        )}>
                        {area}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Restrictions */}
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Tıbbi Kısıtlamalar</label>
                <Input placeholder="Hipertansiyon, Diyabet..."
                  value={(form.medicalRestrictions ?? []).join(', ')}
                  onChange={e => setForm(p => ({ ...p, medicalRestrictions: e.target.value.split(',').map(s => s.trim()).filter(Boolean) }))} />
              </div>

              {/* Doctor Notes */}
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Doktor Notları</label>
                <textarea
                  rows={3}
                  placeholder="Doktorunuzdan aldığınız öneriler..."
                  value={form.doctorNotes ?? ''}
                  onChange={e => setForm(p => ({ ...p, doctorNotes: e.target.value }))}
                  className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring resize-none"
                />
              </div>
            </div>
          ) : !metrics ? (
            <p className="text-sm text-muted-foreground text-center py-4">Henüz sağlık bilgisi eklenmemiş.</p>
          ) : (
            <div className="space-y-4">
              {/* Active Injuries */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-2">Aktif Sakatlıklar</p>
                {metrics.activeInjuries?.length > 0 ? (
                  <div className="space-y-2">
                    {metrics.activeInjuries.map((inj, i) => (
                      <div key={i} className="flex items-center justify-between p-3 bg-red-500/5 border border-red-500/20 rounded-xl">
                        <div>
                          <p className="font-semibold text-sm">{inj.area}</p>
                          {inj.notes && <p className="text-xs text-muted-foreground">{inj.notes}</p>}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <div className="flex gap-0.5">
                            {[1, 2, 3, 4, 5].map(s => (
                              <div key={s} className={cn('w-2 h-2 rounded-full', s <= inj.severity ? 'bg-red-500' : 'bg-muted')} />
                            ))}
                          </div>
                          <span className="text-xs text-red-400">{SEVERITY_LABELS[inj.severity]}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : <p className="text-xs text-muted-foreground">Aktif sakatlık yok ✓</p>}
              </div>

              {/* Pain Points */}
              {metrics.currentPainPoints?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-2">Ağrı Noktaları</p>
                  <div className="flex flex-wrap gap-1.5">
                    {metrics.currentPainPoints.map(p => (
                      <Badge key={p} variant="outline" className="border-orange-500/50 text-orange-400">{p}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Restrictions */}
              {metrics.medicalRestrictions?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-2">Kısıtlamalar</p>
                  <div className="flex flex-wrap gap-1.5">
                    {metrics.medicalRestrictions.map(r => (
                      <Badge key={r} variant="secondary">{r}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {metrics.doctorNotes && (
                <div className="p-3 bg-muted/20 rounded-xl border border-border/30">
                  <p className="text-xs font-semibold text-muted-foreground mb-1">Doktor Notları</p>
                  <p className="text-sm">{metrics.doctorNotes}</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}
