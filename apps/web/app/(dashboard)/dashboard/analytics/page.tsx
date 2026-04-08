'use client'

import { motion } from 'framer-motion'
import { Loader } from '@/components/ui/loader'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts'
import { TrendingUp, Activity, Zap, Target } from 'lucide-react'
import { TypewriterLoader } from '@/components/ui/typewriter-loader'
import { MorphingLoader } from '@/components/ui/morphing-loader'
import { ActionSearchBar } from '@/components/ui/action-search-bar'

const CHART_DATA = [
  { day: 'Mon', workouts: 1, calories: 520 },
  { day: 'Tue', workouts: 0, calories: 0 },
  { day: 'Wed', workouts: 1, calories: 450 },
  { day: 'Thu', workouts: 2, calories: 920 },
  { day: 'Fri', workouts: 1, calories: 380 },
  { day: 'Sat', workouts: 2, calories: 950 },
  { day: 'Sun', workouts: 1, calories: 320 },
]

const STATS = [
  {
    icon: Activity,
    label: 'Workouts This Week',
    value: '8',
    trend: '+2 vs last week',
    color: 'text-blue-500',
  },
  {
    icon: Zap,
    label: 'Calories Burned',
    value: '3,540',
    trend: '+340 kcal',
    color: 'text-orange-500',
  },
  {
    icon: Target,
    label: 'Avg. Form Score',
    value: '94%',
    trend: '+5% improvement',
    color: 'text-green-500',
  },
  {
    icon: TrendingUp,
    label: 'Streak',
    value: '12 days',
    trend: 'Keep it up!',
    color: 'text-red-500',
  },
]

export default function AnalyticsPage() {
  return (
    <div className="min-h-screen bg-background p-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-12 flex items-center justify-between"
      >
        <div>
          <h1 className="text-4xl font-black mb-2">Analytics</h1>
          <p className="text-muted-foreground">
            Track your fitness progress and achievements
          </p>
        </div>
        <TypewriterLoader />
      </motion.div>

      {/* Search Bar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="mb-12"
      >
        <ActionSearchBar />
      </motion.div>

      {/* Stats Grid */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 my-12"
      >
        {STATS.map((stat, idx) => {
          const Icon = stat.icon
          return (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + idx * 0.05 }}
              className="p-6 rounded-xl bg-card/50 border border-border/30"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    {stat.label}
                  </p>
                  <p className="text-3xl font-black">{stat.value}</p>
                </div>
                <Icon className={`w-6 h-6 ${stat.color}`} />
              </div>
              <p className="text-xs text-muted-foreground">{stat.trend}</p>
            </motion.div>
          )
        })}
      </motion.div>

      {/* Morphing Loader */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="mb-12 text-center"
      >
        <h2 className="text-xl font-bold mb-4">Loading Analytics</h2>
        <div className="flex justify-center">
          <MorphingLoader />
        </div>
      </motion.div>

      {/* Charts */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid lg:grid-cols-2 gap-6 mb-12"
      >
        {/* Workouts Chart */}
        <div className="p-6 rounded-xl bg-card/50 border border-border/30">
          <h2 className="text-xl font-bold mb-4">Weekly Workouts</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={CHART_DATA}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="day" stroke="var(--muted-foreground)" />
              <YAxis stroke="var(--muted-foreground)" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--background))',
                  border: '1px solid hsl(var(--border))',
                }}
              />
              <Bar dataKey="workouts" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Calories Chart */}
        <div className="p-6 rounded-xl bg-card/50 border border-border/30">
          <h2 className="text-xl font-bold mb-4">Calories Burned</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={CHART_DATA}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="day" stroke="var(--muted-foreground)" />
              <YAxis stroke="var(--muted-foreground)" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--background))',
                  border: '1px solid hsl(var(--border))',
                }}
              />
              <Line
                type="monotone"
                dataKey="calories"
                stroke="hsl(var(--primary))"
                dot={{ fill: 'hsl(var(--primary))' }}
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Loading State */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="p-8 rounded-xl bg-card/50 border border-border/30"
      >
        <div className="flex items-center gap-4">
          <Loader variant="circular" />
          <div>
            <p className="font-semibold">Processing analytics data</p>
            <p className="text-sm text-muted-foreground">
              Calculating your performance metrics...
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
