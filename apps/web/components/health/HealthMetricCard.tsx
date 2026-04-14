'use client'

import { motion } from 'framer-motion'
import { LucideIcon } from 'lucide-react'

interface HealthMetricCardProps {
  icon: LucideIcon
  label: string
  value: string | number
  unit?: string
  status?: string
  statusColor?: string
  accentColor: string
  trend?: number
  delay?: number
}

const colorMap: Record<string, { bg: string; border: string; glow: string; text: string }> = {
  red: {
    bg: 'bg-red-500/10',
    border: 'border-red-500/20',
    glow: 'from-red-500/10 to-red-600/5',
    text: 'text-red-400',
  },
  purple: {
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/20',
    glow: 'from-purple-500/10 to-purple-600/5',
    text: 'text-purple-400',
  },
  blue: {
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/20',
    glow: 'from-blue-500/10 to-blue-600/5',
    text: 'text-blue-400',
  },
  green: {
    bg: 'bg-green-500/10',
    border: 'border-green-500/20',
    glow: 'from-green-500/10 to-green-600/5',
    text: 'text-green-400',
  },
  indigo: {
    bg: 'bg-indigo-500/10',
    border: 'border-indigo-500/20',
    glow: 'from-indigo-500/10 to-indigo-600/5',
    text: 'text-indigo-400',
  },
  emerald: {
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/20',
    glow: 'from-emerald-500/10 to-emerald-600/5',
    text: 'text-emerald-400',
  },
  cyan: {
    bg: 'bg-cyan-500/10',
    border: 'border-cyan-500/20',
    glow: 'from-cyan-500/10 to-cyan-600/5',
    text: 'text-cyan-400',
  },
}

export function HealthMetricCard({
  icon: Icon,
  label,
  value,
  unit,
  status,
  statusColor,
  accentColor,
  trend,
  delay = 0,
}: HealthMetricCardProps) {
  const c = colorMap[accentColor] ?? colorMap.purple

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay, duration: 0.4 }}
      whileHover={{ y: -4 }}
      className="group relative cursor-pointer"
    >
      <div
        className={`absolute inset-0 bg-gradient-to-br ${c.glow} rounded-3xl opacity-0 blur-xl transition-opacity group-hover:opacity-100`}
      />
      <div
        className={`relative ${c.bg} border ${c.border} h-full rounded-3xl p-5 backdrop-blur-sm transition-all hover:border-opacity-60`}
      >
        <motion.div whileHover={{ scale: 1.15, rotate: 5 }} className="mb-3">
          <Icon size={22} className={c.text} />
        </motion.div>
        <p className="text-muted-foreground mb-1.5 text-xs font-semibold uppercase leading-tight tracking-wider">
          {label}
        </p>
        <p className="text-2xl font-black leading-none">
          {value}
          {unit && <span className="text-muted-foreground ml-1 text-sm font-normal">{unit}</span>}
        </p>
        <div className="mt-2 flex items-center justify-between">
          {status && <p className={`text-xs font-semibold ${statusColor ?? c.text}`}>{status}</p>}
          {trend !== undefined && (
            <p
              className={`ml-auto text-xs font-bold ${trend >= 0 ? 'text-green-400' : 'text-red-400'}`}
            >
              {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
            </p>
          )}
        </div>
      </div>
    </motion.div>
  )
}
