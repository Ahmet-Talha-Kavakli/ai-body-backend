'use client'

import { useState, useEffect } from 'react'
import { Save, Loader2 } from 'lucide-react'

interface Goal {
  dailyCalories: number
  proteinG: number
  carbsG: number
  fatG: number
  waterGoalMl: number
  fiberG: number
}

interface Props {
  initialGoal: Goal
}

const FIELDS: Array<{ key: keyof Goal; label: string; unit: string; color: string }> = [
  { key: 'dailyCalories', label: 'Kalori Hedefi', unit: 'kcal', color: 'text-[#6366F1]' },
  { key: 'proteinG', label: 'Protein', unit: 'g', color: 'text-blue-400' },
  { key: 'carbsG', label: 'Karbonhidrat', unit: 'g', color: 'text-amber-400' },
  { key: 'fatG', label: 'Yağ', unit: 'g', color: 'text-pink-400' },
  { key: 'waterGoalMl', label: 'Su Hedefi', unit: 'ml', color: 'text-cyan-400' },
  { key: 'fiberG', label: 'Lif', unit: 'g', color: 'text-emerald-400' },
]

export function GoalEditor({ initialGoal }: Props) {
  const [goal, setGoal] = useState<Goal>(initialGoal)
  const [dirty, setDirty] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    fetch('/api/nutrition/goal')
      .then((r) => r.json())
      .then((data) => {
        if (data.goal) {
          setGoal(data.goal)
          setDirty(false)
        }
      })
      .catch(() => {})
  }, [])

  const handleChange = (key: keyof Goal, value: string) => {
    const num = parseFloat(value)
    if (isNaN(num)) return
    setGoal((prev) => ({ ...prev, [key]: num }))
    setDirty(true)
    setSaved(false)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await fetch('/api/nutrition/goal', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(goal),
      })
      setDirty(false)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-4">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white">Hedeflerim</h3>
        {dirty && (
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1.5 rounded-lg bg-[#6366F1] px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-[#4F46E5] disabled:opacity-60"
          >
            {saving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
            Kaydet
          </button>
        )}
        {saved && !dirty && (
          <span className="text-xs font-semibold text-emerald-400">Kaydedildi ✓</span>
        )}
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {FIELDS.map(({ key, label, unit, color }) => (
          <div key={key} className="rounded-xl border border-white/[0.04] bg-white/[0.02] p-3">
            <label className={`mb-1 block text-xs font-medium ${color}`}>{label}</label>
            <div className="flex items-baseline gap-1">
              <input
                type="number"
                value={goal[key]}
                onChange={(e) => handleChange(key, e.target.value)}
                className="w-full bg-transparent text-lg font-bold text-white outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                min={0}
              />
              <span className="text-xs text-[#64748B]">{unit}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
