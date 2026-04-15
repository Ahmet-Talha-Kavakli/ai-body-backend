'use client'

import { motion } from 'framer-motion'
import type { StepProps } from '../page'

const GOALS = [
  { value: 'weight_loss', label: 'Kilo Vermek', emoji: '🔥' },
  { value: 'muscle_gain', label: 'Kas Yapmak', emoji: '💪' },
  { value: 'healthy_lifestyle', label: 'Sağlıklı Yaşam', emoji: '🏃' },
  { value: 'disease_management', label: 'Hastalık Yönetimi', emoji: '🏥' },
  { value: 'performance', label: 'Performans Artırmak', emoji: '⚡' },
  { value: 'mental_health', label: 'Zihinsel Sağlık', emoji: '🧘' },
]

export function Step2Goal({ data, onChange, onNext }: StepProps) {
  const handleSelect = (value: string) => {
    onChange({ primaryGoal: value })
    setTimeout(onNext, 300)
  }

  return (
    <div className="mx-auto w-full max-w-lg px-4">
      <motion.h2
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-2 text-center text-3xl font-bold text-white"
      >
        Hedefin Ne?
      </motion.h2>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="mb-8 text-center text-white/60"
      >
        Sana en uygun planı oluşturabilmemiz için hedefini seç.
      </motion.p>

      <div className="grid grid-cols-2 gap-3">
        {GOALS.map((goal, i) => (
          <motion.button
            key={goal.value}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => handleSelect(goal.value)}
            className={`relative flex cursor-pointer flex-col items-center gap-2 rounded-2xl border-2 p-5 transition-all ${
              data.primaryGoal === goal.value
                ? 'border-indigo-500 bg-indigo-500/20 shadow-lg shadow-indigo-500/20'
                : 'border-white/10 bg-white/5 hover:border-white/25 hover:bg-white/10'
            }`}
          >
            <span className="text-4xl">{goal.emoji}</span>
            <span className="text-center text-sm font-medium leading-snug text-white">
              {goal.label}
            </span>
            {data.primaryGoal === goal.value && (
              <motion.div
                layoutId="goal-check"
                className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-indigo-500 text-xs text-white"
              >
                ✓
              </motion.div>
            )}
          </motion.button>
        ))}
      </div>
    </div>
  )
}
