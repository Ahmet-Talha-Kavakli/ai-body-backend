'use client'

import { motion } from 'framer-motion'
import type { StepProps } from '../page'

const GENDERS = [
  { value: 'male', label: 'Erkek', emoji: '♂️' },
  { value: 'female', label: 'Kadın', emoji: '♀️' },
  { value: 'prefer_not_to_say', label: 'Belirtmek İstemiyorum', emoji: '🤐' },
]

export function Step3Personal({ data, onChange }: StepProps) {
  return (
    <div className="mx-auto w-full max-w-lg space-y-6 px-4">
      <motion.h2
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-2 text-center text-3xl font-bold text-white"
      >
        Kişisel Bilgiler
      </motion.h2>

      {/* Name */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <label className="mb-2 block text-sm font-medium text-white/70">Adın</label>
        <input
          type="text"
          value={data.name}
          onChange={(e) => onChange({ name: e.target.value })}
          placeholder="Adını gir..."
          className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-white placeholder-white/30 transition-colors focus:border-indigo-500 focus:outline-none"
        />
      </motion.div>

      {/* Age */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <label className="mb-2 block text-sm font-medium text-white/70">Yaşın</label>
        <input
          type="number"
          value={data.age ?? ''}
          onChange={(e) => onChange({ age: parseInt(e.target.value) || undefined })}
          placeholder="25"
          min={10}
          max={100}
          className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-white placeholder-white/30 transition-colors focus:border-indigo-500 focus:outline-none"
        />
      </motion.div>

      {/* Gender */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <label className="mb-3 block text-sm font-medium text-white/70">Cinsiyet</label>
        <div className="grid grid-cols-3 gap-2">
          {GENDERS.map((g) => (
            <button
              key={g.value}
              onClick={() => onChange({ gender: g.value })}
              className={`flex flex-col items-center gap-1 rounded-xl border-2 p-3 transition-all ${
                data.gender === g.value
                  ? 'border-indigo-500 bg-indigo-500/20'
                  : 'border-white/10 bg-white/5 hover:border-white/25'
              }`}
            >
              <span className="text-2xl">{g.emoji}</span>
              <span className="text-center text-xs font-medium leading-tight text-white">
                {g.label}
              </span>
            </button>
          ))}
        </div>
      </motion.div>
    </div>
  )
}
