'use client'

import { motion } from 'framer-motion'
import type { StepProps } from '../page'

const SUGGESTIONS = ['Pamuk', 'Minik', 'Karamel', 'Boncuk', 'Şeker', 'Turuncu']

const CAT_EMOJIS = ['😺', '😸', '🐱', '😻', '🐈', '😹']

export function Step9Pet({ data, onChange }: StepProps) {
  const catIndex = data.petName.length % CAT_EMOJIS.length

  return (
    <div className="mx-auto w-full max-w-lg space-y-6 px-4 text-center">
      <motion.h2
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-2 text-3xl font-bold text-white"
      >
        Yol Arkadaşını Seç! 🐱
      </motion.h2>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="text-white/60"
      >
        Fitness yolculuğunda sana eşlik edecek bir kedi seç ve ona bir isim ver!
      </motion.p>

      {/* Animated cat */}
      <motion.div
        key={catIndex}
        initial={{ scale: 0.5, rotate: -10 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 15 }}
        className="my-6 text-9xl"
      >
        {CAT_EMOJIS[catIndex]}
      </motion.div>

      {/* Name input */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
      >
        <input
          type="text"
          value={data.petName}
          onChange={(e) => onChange({ petName: e.target.value })}
          placeholder="Kedinizin adı..."
          maxLength={20}
          className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-center text-lg text-white placeholder-white/30 transition-colors focus:border-indigo-500 focus:outline-none"
        />
      </motion.div>

      {/* Suggestions */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.35 }}
        className="flex flex-wrap justify-center gap-2"
      >
        {SUGGESTIONS.map((name) => (
          <button
            key={name}
            onClick={() => onChange({ petName: name })}
            className={`rounded-full border-2 px-4 py-2 text-sm font-medium transition-all ${
              data.petName === name
                ? 'border-indigo-500 bg-indigo-500/20 text-white'
                : 'border-white/15 bg-white/5 text-white/60 hover:border-white/30 hover:text-white'
            }`}
          >
            {name}
          </button>
        ))}
      </motion.div>

      {data.petName && (
        <motion.p
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-sm text-indigo-300"
        >
          Harika! <strong>{data.petName}</strong> sana her adımda eşlik edecek. 🐾
        </motion.p>
      )}
    </div>
  )
}
