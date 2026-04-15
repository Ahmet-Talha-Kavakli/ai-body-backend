'use client'

import { motion } from 'framer-motion'
import type { StepProps } from '../page'

interface SliderFieldProps {
  label: string
  value: number
  min: number
  max: number
  step?: number
  unit: string
  displayValue: string
  onChange: (v: number) => void
  color?: string
}

function SliderField({
  label,
  value,
  min,
  max,
  step = 1,
  unit,
  displayValue,
  onChange,
  color = 'indigo',
}: SliderFieldProps) {
  const colorClass =
    color === 'purple'
      ? 'accent-purple-500'
      : color === 'blue'
        ? 'accent-blue-500'
        : 'accent-indigo-500'
  return (
    <div>
      <div className="mb-2 flex justify-between">
        <label className="text-sm font-medium text-white/70">{label}</label>
        <span
          className={`text-sm font-semibold ${color === 'purple' ? 'text-purple-400' : color === 'blue' ? 'text-blue-400' : 'text-indigo-400'}`}
        >
          {displayValue} {unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className={`h-2 w-full rounded-full ${colorClass} cursor-pointer bg-white/10`}
      />
      <div className="mt-1 flex justify-between text-xs text-white/30">
        <span>
          {min} {unit}
        </span>
        <span>
          {max} {unit}
        </span>
      </div>
    </div>
  )
}

export function Step8Sleep({ data, onChange }: StepProps) {
  return (
    <div className="mx-auto w-full max-w-lg space-y-8 px-4">
      <motion.h2
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-2 text-center text-3xl font-bold text-white"
      >
        Uyku &amp; Yaşam Tarzı
      </motion.h2>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <SliderField
          label="Ortalama uyku saati"
          value={data.avgSleepHours ?? 7}
          min={4}
          max={12}
          step={0.5}
          unit="saat"
          displayValue={String(data.avgSleepHours ?? 7)}
          onChange={(v) => onChange({ avgSleepHours: v })}
          color="indigo"
        />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <SliderField
          label="Stres seviyesi"
          value={data.stressLevel ?? 5}
          min={1}
          max={10}
          unit="/10"
          displayValue={String(data.stressLevel ?? 5)}
          onChange={(v) => onChange({ stressLevel: v })}
          color="purple"
        />
        <div className="mt-1 flex justify-between text-xs text-white/40">
          <span>😌 Sakin</span>
          <span>😤 Çok stresli</span>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <SliderField
          label="Günlük su içme hedefi"
          value={data.waterIntakeTarget ?? 2}
          min={1}
          max={4}
          step={0.5}
          unit="litre"
          displayValue={String(data.waterIntakeTarget ?? 2)}
          onChange={(v) => onChange({ waterIntakeTarget: v })}
          color="blue"
        />
      </motion.div>
    </div>
  )
}
