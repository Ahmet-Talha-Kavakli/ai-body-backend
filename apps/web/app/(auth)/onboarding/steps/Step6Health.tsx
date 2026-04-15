'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import type { StepProps } from '../page'

const HEALTH_CONDITIONS = [
  { value: 'diabetes', label: 'Diyabet' },
  { value: 'heart_disease', label: 'Kalp Hastalığı' },
  { value: 'hypertension', label: 'Hipertansiyon' },
  { value: 'joint_problems', label: 'Eklem Sorunları' },
  { value: 'back_pain', label: 'Sırt Ağrısı' },
]

const BODY_PARTS = ['Diz', 'Omuz', 'Bel', 'Boyun', 'Bilek', 'Dirsek', 'Kalça', 'Ayak Bileği']

export function Step6Health({ data, onChange }: StepProps) {
  const [hasInjury, setHasInjury] = useState(data.activeInjuries.length > 0)
  const [customCondition, setCustomCondition] = useState('')

  const toggleCondition = (value: string) => {
    const current = data.medicalRestrictions
    onChange({
      medicalRestrictions: current.includes(value)
        ? current.filter((c) => c !== value)
        : [...current, value],
    })
  }

  const toggleInjury = (part: string) => {
    const current = data.activeInjuries
    onChange({
      activeInjuries: current.includes(part)
        ? current.filter((p) => p !== part)
        : [...current, part],
    })
  }

  return (
    <div className="mx-auto w-full max-w-lg space-y-6 px-4">
      <motion.h2
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-2 text-center text-3xl font-bold text-white"
      >
        Sağlık Durumu
      </motion.h2>

      {/* Medical conditions */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <p className="mb-3 text-sm font-medium text-white/70">
          Herhangi bir sağlık sorununuz var mı?
        </p>
        <div className="space-y-2">
          {HEALTH_CONDITIONS.map((cond) => (
            <label
              key={cond.value}
              className="flex cursor-pointer items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-3 transition-colors hover:bg-white/10"
            >
              <div
                onClick={() => toggleCondition(cond.value)}
                className={`flex h-5 w-5 flex-shrink-0 cursor-pointer items-center justify-center rounded border-2 transition-colors ${
                  data.medicalRestrictions.includes(cond.value)
                    ? 'border-indigo-500 bg-indigo-500'
                    : 'border-white/30'
                }`}
              >
                {data.medicalRestrictions.includes(cond.value) && (
                  <span className="text-xs text-white">✓</span>
                )}
              </div>
              <span className="text-sm text-white" onClick={() => toggleCondition(cond.value)}>
                {cond.label}
              </span>
            </label>
          ))}

          {/* Custom */}
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Diğer (belirt)..."
              value={customCondition}
              onChange={(e) => setCustomCondition(e.target.value)}
              className="flex-1 rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-sm text-white placeholder-white/30 focus:border-indigo-500 focus:outline-none"
            />
            <button
              onClick={() => {
                if (customCondition.trim()) {
                  onChange({
                    medicalRestrictions: [...data.medicalRestrictions, customCondition.trim()],
                  })
                  setCustomCondition('')
                }
              }}
              className="rounded-xl bg-indigo-500 px-4 py-2 text-sm font-medium text-white"
            >
              Ekle
            </button>
          </div>

          {data.medicalRestrictions
            .filter((r) => !HEALTH_CONDITIONS.find((c) => c.value === r))
            .map((r) => (
              <div
                key={r}
                className="flex items-center gap-2 rounded-xl border border-indigo-500/30 bg-indigo-500/20 px-3 py-2"
              >
                <span className="flex-1 text-sm text-white">{r}</span>
                <button
                  onClick={() =>
                    onChange({
                      medicalRestrictions: data.medicalRestrictions.filter((x) => x !== r),
                    })
                  }
                  className="text-sm text-white/50 hover:text-white"
                >
                  ✕
                </button>
              </div>
            ))}
        </div>
      </motion.div>

      {/* Active injury toggle */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-medium text-white/70">Aktif sakatlığınız var mı?</p>
          <button
            onClick={() => {
              setHasInjury(!hasInjury)
              if (hasInjury) onChange({ activeInjuries: [] })
            }}
            className={`relative h-6 w-12 rounded-full transition-colors ${hasInjury ? 'bg-indigo-500' : 'bg-white/20'}`}
          >
            <div
              className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-transform ${hasInjury ? 'translate-x-7' : 'translate-x-1'}`}
            />
          </button>
        </div>

        {hasInjury && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="grid grid-cols-4 gap-2"
          >
            {BODY_PARTS.map((part) => (
              <button
                key={part}
                onClick={() => toggleInjury(part)}
                className={`rounded-xl border-2 px-1 py-2 text-xs font-medium transition-all ${
                  data.activeInjuries.includes(part)
                    ? 'border-red-500 bg-red-500/20 text-white'
                    : 'border-white/10 bg-white/5 text-white/60 hover:border-white/25'
                }`}
              >
                {part}
              </button>
            ))}
          </motion.div>
        )}
      </motion.div>
    </div>
  )
}
