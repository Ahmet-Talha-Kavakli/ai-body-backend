'use client'

import { motion } from 'framer-motion'
import type { StepProps } from '../page'

const DIET_TYPES = [
  { value: 'omnivore', label: 'Her şey yiyorum', emoji: '🥩' },
  { value: 'vegetarian', label: 'Vejetaryen', emoji: '🥗' },
  { value: 'vegan', label: 'Vegan', emoji: '🌱' },
  { value: 'keto', label: 'Ketojenik', emoji: '🥚' },
  { value: 'gluten_free', label: 'Glutensiz', emoji: '🌾' },
  { value: 'other', label: 'Diğer', emoji: '🍽️' },
]

export function Step7Diet({ data, onChange, onNext }: StepProps) {
  const handleSelect = (value: string) => {
    onChange({ dietType: value })
    setTimeout(onNext, 300)
  }

  return (
    <div className="mx-auto w-full max-w-lg px-4">
      <motion.h2
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-2 text-center text-3xl font-bold text-white"
      >
        Beslenme Tercihlerin
      </motion.h2>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="mb-8 text-center text-white/60"
      >
        Beslenme alışkanlığını seç, sana uygun öneriler supalım.
      </motion.p>

      <div className="grid grid-cols-2 gap-3">
        {DIET_TYPES.map((diet, i) => (
          <motion.button
            key={diet.value}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => handleSelect(diet.value)}
            className={`flex flex-col items-center gap-2 rounded-2xl border-2 p-5 transition-all ${
              data.dietType === diet.value
                ? 'border-indigo-500 bg-indigo-500/20 shadow-lg shadow-indigo-500/20'
                : 'border-white/10 bg-white/5 hover:border-white/25 hover:bg-white/10'
            }`}
          >
            <span className="text-4xl">{diet.emoji}</span>
            <span className="text-center text-sm font-medium leading-snug text-white">
              {diet.label}
            </span>
          </motion.button>
        ))}
      </div>
    </div>
  )
}
