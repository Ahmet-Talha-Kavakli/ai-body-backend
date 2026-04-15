'use client'

import { motion } from 'framer-motion'
import type { StepProps } from '../page'

export function Step4Body({ data, onChange }: StepProps) {
  return (
    <div className="mx-auto w-full max-w-lg space-y-6 px-4">
      <motion.h2
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-2 text-center text-3xl font-bold text-white"
      >
        Fiziksel Bilgiler
      </motion.h2>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="mb-6 text-center text-white/60"
      >
        Sana özel program oluşturmak için bu bilgilere ihtiyacımız var.
      </motion.p>

      {/* Height */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        <label className="mb-2 flex justify-between text-sm font-medium text-white/70">
          <span>Boy (cm)</span>
          <span className="text-indigo-400">{data.height ?? '—'} cm</span>
        </label>
        <input
          type="number"
          value={data.height ?? ''}
          onChange={(e) => onChange({ height: parseFloat(e.target.value) || undefined })}
          placeholder="175"
          min={100}
          max={250}
          className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-white placeholder-white/30 transition-colors focus:border-indigo-500 focus:outline-none"
        />
      </motion.div>

      {/* Weight */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
      >
        <label className="mb-2 flex justify-between text-sm font-medium text-white/70">
          <span>Mevcut Kilo (kg)</span>
          <span className="text-indigo-400">{data.weight ?? '—'} kg</span>
        </label>
        <input
          type="number"
          value={data.weight ?? ''}
          onChange={(e) => onChange({ weight: parseFloat(e.target.value) || undefined })}
          placeholder="70"
          min={30}
          max={300}
          className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-white placeholder-white/30 transition-colors focus:border-indigo-500 focus:outline-none"
        />
      </motion.div>

      {/* Target Weight */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
      >
        <label className="mb-2 flex justify-between text-sm font-medium text-white/70">
          <span>Hedef Kilo (kg)</span>
          <span className="text-purple-400">{data.targetWeight ?? '—'} kg</span>
        </label>
        <input
          type="number"
          value={data.targetWeight ?? ''}
          onChange={(e) => onChange({ targetWeight: parseFloat(e.target.value) || undefined })}
          placeholder="65"
          min={30}
          max={300}
          className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-white placeholder-white/30 transition-colors focus:border-indigo-500 focus:outline-none"
        />
      </motion.div>
    </div>
  )
}
