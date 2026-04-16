'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, ChevronDown, Trash2 } from 'lucide-react'

interface FoodItem {
  id: string
  name: string
  calories: number
  protein: number
  carbs: number
  fat: number
  amount: number
  unit: string
}

interface MealDef {
  id: string
  label: string
  icon: string
  color: string
  bg: string
  border: string
}

interface MealSectionProps {
  meal: MealDef
  items: FoodItem[]
  onAdd: (mealType: string) => void
  onDelete: (id: string) => void
}

export function MealSection({ meal, items, onAdd, onDelete }: MealSectionProps) {
  const [expanded, setExpanded] = useState(true)
  const totalCal = items.reduce((s, i) => s + i.calories, 0)

  return (
    <div className={`overflow-hidden rounded-2xl border ${meal.border} ${meal.bg}`}>
      <button onClick={() => setExpanded((e) => !e)} className="flex w-full items-center gap-3 p-4">
        <span className="text-xl">{meal.icon}</span>
        <div className="flex-1 text-left">
          <p className="font-bold text-white">{meal.label}</p>
          <p className="text-xs text-white/40">{totalCal > 0 ? `${totalCal} kcal` : 'Boş'}</p>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation()
            onAdd(meal.id)
          }}
          className={`mr-2 rounded-xl border p-1.5 ${meal.bg} ${meal.border}`}
        >
          <Plus size={16} className={meal.color} />
        </button>
        <motion.div animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown size={16} className="text-white/30" />
        </motion.div>
      </button>

      <AnimatePresence>
        {expanded && items.length > 0 && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            className="overflow-hidden"
          >
            <div className="space-y-1 px-4 pb-3">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded-xl bg-white/[0.03] px-3 py-2"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-white">{item.name}</p>
                    <p className="text-xs text-white/30">
                      {item.amount}
                      {item.unit} · P:{Math.round(item.protein)}g K:{Math.round(item.carbs)}g Y:
                      {Math.round(item.fat)}g
                    </p>
                  </div>
                  <div className="ml-2 flex shrink-0 items-center gap-2">
                    <span className="text-sm font-bold text-white">{item.calories}</span>
                    <button
                      onClick={() => onDelete(item.id)}
                      className="text-white/20 transition-colors hover:text-red-400"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
