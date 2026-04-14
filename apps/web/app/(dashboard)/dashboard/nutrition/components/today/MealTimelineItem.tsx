'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, Trash2, Copy } from 'lucide-react'
import type { MealLog } from '@/lib/nutrition/types'

const MEAL_LABELS: Record<string, string> = {
  breakfast: 'Kahvaltı',
  lunch: 'Öğle Yemeği',
  dinner: 'Akşam Yemeği',
  snack: 'Ara Öğün',
  pre_workout: 'Antrenman Öncesi',
  post_workout: 'Antrenman Sonrası',
}

interface Props {
  meal: MealLog
  index: number
  onDelete: (id: string) => void
  onCopy: (meal: MealLog) => void
}

export function MealTimelineItem({ meal, index, onDelete, onCopy }: Props) {
  const [expanded, setExpanded] = useState(false)
  const items = meal.items as Array<{ name: string; calories: number }>

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, type: 'spring', stiffness: 120, damping: 18 }}
      className="flex gap-3"
    >
      <div className="flex flex-col items-center pt-1">
        <div
          className={`h-2.5 w-2.5 shrink-0 rounded-full ${meal.aiAnalyzed ? 'bg-[#8B5CF6]' : 'bg-[#6366F1]'}`}
        />
        <div className="mt-1 w-px flex-1 bg-white/[0.06]" />
      </div>

      <div className="flex-1 pb-4">
        <button
          onClick={() => setExpanded((e) => !e)}
          className="group flex w-full cursor-pointer items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-white">
              {MEAL_LABELS[meal.mealType] ?? meal.mealType}
            </span>
            {meal.aiAnalyzed && (
              <span className="rounded-full border border-[#8B5CF6]/20 bg-[#8B5CF6]/15 px-1.5 py-0.5 text-[10px] text-[#A78BFA]">
                AI
              </span>
            )}
            <span className="text-xs text-[#64748B]">
              {new Date(meal.loggedAt).toLocaleTimeString('tr-TR', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-['Barlow_Condensed'] text-lg font-bold text-white">
              {Math.round(meal.totalCalories)}
            </span>
            <span className="text-xs text-[#64748B]">kcal</span>
            <motion.div animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
              <ChevronDown size={14} className="text-[#64748B]" />
            </motion.div>
          </div>
        </button>

        <div className="mt-1.5 flex flex-wrap gap-1">
          {items.slice(0, 3).map((item, j) => (
            <span
              key={j}
              className="rounded-full bg-white/[0.05] px-2 py-0.5 text-[11px] text-[#64748B]"
            >
              {item.name}
            </span>
          ))}
          {items.length > 3 && (
            <span className="rounded-full bg-white/[0.05] px-2 py-0.5 text-[11px] text-[#64748B]">
              +{items.length - 3}
            </span>
          )}
        </div>

        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="mt-3 space-y-1">
                {items.map((item, j) => (
                  <div key={j} className="flex justify-between text-xs text-[#64748B]">
                    <span>{item.name}</span>
                    <span>{item.calories} kcal</span>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex gap-3 text-xs text-[#64748B]">
                <span>P: {Math.round(meal.totalProteinG)}g</span>
                <span>K: {Math.round(meal.totalCarbsG)}g</span>
                <span>Y: {Math.round(meal.totalFatG)}g</span>
              </div>
              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => onCopy(meal)}
                  className="flex cursor-pointer items-center gap-1 rounded-lg bg-white/[0.05] px-3 py-1.5 text-xs text-[#64748B] transition-colors hover:bg-white/[0.10]"
                >
                  <Copy size={12} /> Kopyala
                </button>
                <button
                  onClick={() => onDelete(meal.id)}
                  className="flex cursor-pointer items-center gap-1 rounded-lg bg-red-500/10 px-3 py-1.5 text-xs text-red-400 transition-colors hover:bg-red-500/20"
                >
                  <Trash2 size={12} /> Sil
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}
