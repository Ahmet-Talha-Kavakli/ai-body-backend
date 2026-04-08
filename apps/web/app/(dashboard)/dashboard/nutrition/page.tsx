'use client'

import { motion } from 'framer-motion'
import { Apple, Flame, Droplets, Zap } from 'lucide-react'
import { Loader } from '@/components/ui/loader'

const MACROS = [
  {
    name: 'Calories',
    icon: Flame,
    current: 1850,
    goal: 2200,
    unit: 'kcal',
    color: 'from-orange-500 to-red-500',
  },
  {
    name: 'Protein',
    icon: Zap,
    current: 145,
    goal: 160,
    unit: 'g',
    color: 'from-blue-500 to-cyan-500',
  },
  {
    name: 'Carbs',
    icon: Apple,
    current: 210,
    goal: 250,
    unit: 'g',
    color: 'from-yellow-500 to-orange-500',
  },
  {
    name: 'Fat',
    icon: Droplets,
    current: 62,
    goal: 75,
    unit: 'g',
    color: 'from-pink-500 to-rose-500',
  },
]

const MEALS = [
  { time: 'Breakfast', items: ['Oatmeal', 'Berries', 'Protein Shake'], cals: 450 },
  { time: 'Lunch', items: ['Grilled Chicken', 'Broccoli', 'Rice'], cals: 680 },
  { time: 'Snack', items: ['Greek Yogurt', 'Almonds'], cals: 320 },
  { time: 'Dinner', items: ['Salmon', 'Sweet Potato', 'Asparagus'], cals: 720 },
]

export default function NutritionPage() {
  const getProgress = (current: number, goal: number) =>
    Math.min((current / goal) * 100, 100)

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-4xl font-black mb-2">Nutrition Tracker</h1>
        <p className="text-muted-foreground">Monitor your daily macronutrients</p>
      </motion.div>

      {/* Macro Cards */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="grid md:grid-cols-2 gap-6 my-12"
      >
        {MACROS.map((macro, idx) => {
          const Icon = macro.icon
          const progress = getProgress(macro.current, macro.goal)

          return (
            <motion.div
              key={macro.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + idx * 0.05 }}
              className="p-6 rounded-xl bg-card/50 border border-border/30"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-lg bg-gradient-to-br ${macro.color} bg-opacity-10`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="font-semibold">{macro.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {macro.current}/{macro.goal} {macro.unit}
                    </p>
                  </div>
                </div>
                <span className="text-2xl font-bold">
                  {Math.round(progress)}%
                </span>
              </div>

              {/* Progress Bar */}
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ delay: 0.3, duration: 0.8 }}
                  className={`h-full bg-gradient-to-r ${macro.color}`}
                />
              </div>
            </motion.div>
          )
        })}
      </motion.div>

      {/* Meal Log */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mb-12"
      >
        <h2 className="text-2xl font-bold mb-6">Today's Meals</h2>
        <div className="space-y-4">
          {MEALS.map((meal, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 + idx * 0.05 }}
              className="p-4 rounded-xl bg-card/50 border border-border/30 hover:border-primary/20 transition-colors flex items-center justify-between group"
            >
              <div>
                <h3 className="font-semibold mb-2">{meal.time}</h3>
                <div className="flex flex-wrap gap-2">
                  {meal.items.map((item) => (
                    <span
                      key={item}
                      className="text-sm px-2 py-1 bg-background rounded text-muted-foreground"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold">{meal.cals}</p>
                <p className="text-xs text-muted-foreground">kcal</p>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Loading State */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="p-8 rounded-xl bg-card/50 border border-border/30"
      >
        <div className="flex items-center gap-4">
          <Loader variant="dots" />
          <div>
            <p className="font-semibold">Analyzing meal photos</p>
            <p className="text-sm text-muted-foreground">
              AI is calculating nutritional values...
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
