'use client'

import { motion } from 'framer-motion'
import { Dumbbell, Flame, Clock, Target } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Loader } from '@/components/ui/loader'
import { CommitsGrid } from '@/components/ui/commits-grid'

const WORKOUTS = [
  {
    id: 1,
    name: 'Upper Body Strength',
    duration: 45,
    difficulty: 'Intermediate',
    muscles: ['Chest', 'Back', 'Shoulders'],
    calories: 320,
  },
  {
    id: 2,
    name: 'HIIT Cardio Blast',
    duration: 30,
    difficulty: 'Hard',
    muscles: ['Full Body'],
    calories: 450,
  },
  {
    id: 3,
    name: 'Lower Body Endurance',
    duration: 50,
    difficulty: 'Advanced',
    muscles: ['Quads', 'Hamstrings', 'Glutes'],
    calories: 380,
  },
  {
    id: 4,
    name: 'Core & Stability',
    duration: 25,
    difficulty: 'Beginner',
    muscles: ['Core'],
    calories: 180,
  },
  {
    id: 5,
    name: 'Full Body Power',
    duration: 60,
    difficulty: 'Hard',
    muscles: ['Full Body'],
    calories: 520,
  },
  {
    id: 6,
    name: 'Recovery & Mobility',
    duration: 35,
    difficulty: 'Easy',
    muscles: ['Full Body'],
    calories: 120,
  },
]

const WEEK_DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']

export default function WorkoutsPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-12"
      >
        <h1 className="text-4xl font-black mb-2">Workouts</h1>
        <p className="text-muted-foreground">
          Choose from our AI-generated personalized workouts
        </p>
      </motion.div>

      {/* Weekly Streak */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-12 p-6 rounded-xl bg-card/50 border border-border/30"
      >
        <h2 className="text-lg font-bold mb-4">This Week's Streak</h2>
        <CommitsGrid text="FITFIT" />
      </motion.div>

      {/* Workouts Grid */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="space-y-6"
      >
        <h2 className="text-2xl font-bold">Available Workouts</h2>
        <div className="grid md:grid-cols-2 gap-6">
          {WORKOUTS.map((workout, idx) => (
            <motion.div
              key={workout.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + idx * 0.05 }}
              className="p-6 rounded-xl bg-card/50 border border-border/30 hover:border-primary/20 transition-colors group"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold mb-2">{workout.name}</h3>
                  <div className="inline-block px-3 py-1 bg-primary/10 rounded-full text-sm font-medium text-primary">
                    {workout.difficulty}
                  </div>
                </div>
                <Dumbbell className="w-6 h-6 text-primary opacity-50" />
              </div>

              <div className="grid grid-cols-3 gap-4 mb-4 py-4 border-y border-border/30">
                <div>
                  <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                    <Clock className="w-4 h-4" />
                    Duration
                  </div>
                  <p className="font-bold">{workout.duration}m</p>
                </div>
                <div>
                  <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                    <Flame className="w-4 h-4" />
                    Calories
                  </div>
                  <p className="font-bold">{workout.calories}</p>
                </div>
                <div>
                  <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                    <Target className="w-4 h-4" />
                    Muscles
                  </div>
                  <p className="font-bold text-sm">{workout.muscles.length}</p>
                </div>
              </div>

              <div className="mb-4">
                <p className="text-sm text-muted-foreground mb-2">Target Areas:</p>
                <div className="flex flex-wrap gap-2">
                  {workout.muscles.map((muscle) => (
                    <span
                      key={muscle}
                      className="px-3 py-1 bg-background rounded-full text-xs font-medium"
                    >
                      {muscle}
                    </span>
                  ))}
                </div>
              </div>

              <Button className="w-full" size="sm">
                Start Workout
              </Button>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Loading State Example */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="mt-16 p-8 rounded-xl bg-card/50 border border-border/30"
      >
        <div className="flex items-center gap-4">
          <Loader variant="bars" />
          <div>
            <p className="font-semibold">Generating personalized workouts</p>
            <p className="text-sm text-muted-foreground">
              Our AI is analyzing your fitness level...
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
