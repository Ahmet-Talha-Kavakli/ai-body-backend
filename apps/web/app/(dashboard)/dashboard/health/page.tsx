'use client'

import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Loader } from '@/components/ui/loader'
import { Heart, Target, TrendingUp, Zap } from 'lucide-react'

const FORM_FIELDS = [
  {
    label: 'Fitness Level',
    options: ['Beginner', 'Intermediate', 'Advanced', 'Elite'],
    value: 'Intermediate',
  },
  {
    label: 'Primary Goal',
    options: ['Weight Loss', 'Muscle Gain', 'Endurance', 'Flexibility'],
    value: 'Muscle Gain',
  },
  {
    label: 'Age',
    type: 'number',
    value: '28',
  },
  {
    label: 'Weight (kg)',
    type: 'number',
    value: '72',
  },
  {
    label: 'Height (cm)',
    type: 'number',
    value: '180',
  },
]

export default function HealthPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-4xl font-black mb-2">Health Profile</h1>
        <p className="text-muted-foreground">
          Keep your health information up to date
        </p>
      </motion.div>

      {/* Health Metrics */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="grid md:grid-cols-4 gap-4 my-12"
      >
        {[
          {
            icon: Heart,
            label: 'Heart Health',
            value: 'Excellent',
            color: 'text-red-500',
          },
          {
            icon: TrendingUp,
            label: 'BMI',
            value: '22.2',
            color: 'text-green-500',
          },
          {
            icon: Zap,
            label: 'Activity Level',
            value: 'Moderate',
            color: 'text-yellow-500',
          },
          {
            icon: Target,
            label: 'VO2 Max',
            value: '45.2',
            color: 'text-blue-500',
          },
        ].map((metric, idx) => {
          const Icon = metric.icon
          return (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + idx * 0.05 }}
              className="p-4 rounded-xl bg-card/50 border border-border/30"
            >
              <Icon className={`w-6 h-6 ${metric.color} mb-2`} />
              <p className="text-sm text-muted-foreground mb-1">{metric.label}</p>
              <p className="text-2xl font-bold">{metric.value}</p>
            </motion.div>
          )
        })}
      </motion.div>

      {/* Profile Form */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="p-8 rounded-xl bg-card/50 border border-border/30 mb-12"
      >
        <h2 className="text-2xl font-bold mb-6">Your Information</h2>
        <div className="grid md:grid-cols-2 gap-6">
          {FORM_FIELDS.map((field, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 + idx * 0.05 }}
            >
              <label className="block text-sm font-semibold mb-2">
                {field.label}
              </label>
              {field.type === 'number' ? (
                <input
                  type="number"
                  defaultValue={field.value}
                  className="w-full px-4 py-2 rounded-lg bg-background border border-border/30 focus:border-primary focus-visible:outline-none"
                />
              ) : (
                <select
                  defaultValue={field.value}
                  className="w-full px-4 py-2 rounded-lg bg-background border border-border/30 focus:border-primary focus-visible:outline-none"
                >
                  {field.options?.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              )}
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-8 pt-6 border-t border-border/30"
        >
          <div className="flex items-center gap-4 mb-4">
            <Loader variant="pulse" size="md" />
            <div>
              <p className="text-sm text-muted-foreground">
                Saving your profile updates...
              </p>
            </div>
          </div>
          <Button className="w-full">Save Changes</Button>
        </motion.div>
      </motion.div>

      {/* Health Goals */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="p-8 rounded-xl bg-card/50 border border-border/30"
      >
        <h2 className="text-2xl font-bold mb-4">Health Goals</h2>
        <ul className="space-y-3">
          {[
            'Increase muscle mass by 5kg',
            'Reduce body fat percentage to 15%',
            'Run a 5K in under 20 minutes',
            'Improve flexibility score',
          ].map((goal, idx) => (
            <motion.li
              key={idx}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.35 + idx * 0.05 }}
              className="flex items-center gap-3 p-3 rounded-lg bg-background hover:bg-primary/5 transition-colors cursor-pointer"
            >
              <input
                type="checkbox"
                className="rounded border-primary"
                defaultChecked={idx < 2}
              />
              <span>{goal}</span>
            </motion.li>
          ))}
        </ul>
      </motion.div>
    </div>
  )
}
