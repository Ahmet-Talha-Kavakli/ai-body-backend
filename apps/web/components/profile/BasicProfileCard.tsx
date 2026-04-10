'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Edit2, Save, X, User } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface BasicProfile {
  age: number
  gender: string
  height: number
  weight: number
  fitnessLevel: string
  primaryGoal: string
  experienceYears: number
  targetWeight?: number
}

const FITNESS_LEVEL_LABELS: Record<string, string> = {
  beginner: 'Başlangıç', intermediate: 'Orta', advanced: 'İleri', elite: 'Elit',
}

const GOAL_LABELS: Record<string, string> = {
  weight_loss: 'Kilo Verme', muscle_gain: 'Kas Kazanımı', endurance: 'Dayanıklılık',
  flexibility: 'Esneklik', general_fitness: 'Genel Sağlık', sport_specific: 'Spor Performansı',
}

const GENDER_LABELS: Record<string, string> = {
  male: 'Erkek', female: 'Kadın', other: 'Diğer',
}

interface BasicProfileCardProps {
  profile: BasicProfile | null
  isLoading?: boolean
  onSave?: (data: Partial<BasicProfile>) => Promise<void>
}

export function BasicProfileCard({ profile, isLoading, onSave }: BasicProfileCardProps) {
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<Partial<BasicProfile>>({})

  const startEdit = () => {
    setForm(profile ?? {})
    setEditing(true)
  }

  const cancelEdit = () => {
    setForm({})
    setEditing(false)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await onSave?.(form)
      setEditing(false)
    } finally {
      setSaving(false)
    }
  }

  const set = (field: keyof BasicProfile, value: any) =>
    setForm(p => ({ ...p, [field]: value }))

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

  const bmi = profile ? (profile.weight / Math.pow(profile.height / 100, 2)).toFixed(1) : null

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="bg-card/50 border-border/30 backdrop-blur-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <User size={16} className="text-primary" />
            </div>
            <CardTitle className="text-lg">Temel Profil</CardTitle>
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
          {!profile && !editing ? (
            <p className="text-sm text-muted-foreground text-center py-4">Henüz profil bilgisi eklenmemiş.</p>
          ) : editing ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Yaş</label>
                  <Input type="number" value={form.age ?? ''} onChange={e => set('age', +e.target.value)} placeholder="25" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Deneyim (yıl)</label>
                  <Input type="number" value={form.experienceYears ?? ''} onChange={e => set('experienceYears', +e.target.value)} placeholder="2" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Boy (cm)</label>
                  <Input type="number" value={form.height ?? ''} onChange={e => set('height', +e.target.value)} placeholder="175" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Kilo (kg)</label>
                  <Input type="number" value={form.weight ?? ''} onChange={e => set('weight', +e.target.value)} placeholder="75" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Hedef Kilo (kg)</label>
                  <Input type="number" value={form.targetWeight ?? ''} onChange={e => set('targetWeight', +e.target.value)} placeholder="70" />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Cinsiyet</label>
                <div className="flex gap-2">
                  {['male', 'female', 'other'].map(g => (
                    <button key={g} onClick={() => set('gender', g)}
                      className={cn('flex-1 py-2 rounded-lg border text-xs font-semibold transition-all',
                        form.gender === g ? 'bg-primary/10 border-primary text-primary' : 'border-border text-muted-foreground'
                      )}>
                      {GENDER_LABELS[g]}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Fitness Seviyesi</label>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(FITNESS_LEVEL_LABELS).map(([v, l]) => (
                    <button key={v} onClick={() => set('fitnessLevel', v)}
                      className={cn('py-2 rounded-lg border text-xs font-semibold transition-all',
                        form.fitnessLevel === v ? 'bg-primary/10 border-primary text-primary' : 'border-border text-muted-foreground'
                      )}>
                      {l}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Birincil Hedef</label>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(GOAL_LABELS).map(([v, l]) => (
                    <button key={v} onClick={() => set('primaryGoal', v)}
                      className={cn('py-2 px-3 rounded-lg border text-xs font-semibold transition-all text-left',
                        form.primaryGoal === v ? 'bg-primary/10 border-primary text-primary' : 'border-border text-muted-foreground'
                      )}>
                      {l}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Yaş', value: `${profile?.age} yaş` },
                  { label: 'Boy / Kilo', value: `${profile?.height} cm / ${profile?.weight} kg` },
                  { label: 'Cinsiyet', value: GENDER_LABELS[profile?.gender ?? ''] ?? profile?.gender },
                  { label: 'Deneyim', value: `${profile?.experienceYears} yıl` },
                ].map(item => (
                  <div key={item.label} className="bg-muted/30 rounded-xl p-3">
                    <p className="text-xs text-muted-foreground mb-0.5">{item.label}</p>
                    <p className="font-semibold text-sm">{item.value}</p>
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap gap-2 pt-1">
                <Badge variant="secondary">{FITNESS_LEVEL_LABELS[profile?.fitnessLevel ?? ''] ?? profile?.fitnessLevel}</Badge>
                <Badge variant="secondary">{GOAL_LABELS[profile?.primaryGoal ?? ''] ?? profile?.primaryGoal}</Badge>
                {bmi && <Badge variant="outline">BMI: {bmi}</Badge>}
                {profile?.targetWeight && <Badge variant="outline">Hedef: {profile.targetWeight} kg</Badge>}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}
