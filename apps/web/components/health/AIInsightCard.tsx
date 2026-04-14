'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Sparkles, ChevronDown } from 'lucide-react'

interface AIInsightCardProps {
  insight: string
  loading?: boolean
  accentColor?: string
}

const colorMap: Record<string, { border: string; iconBg: string; iconText: string; glow: string }> =
  {
    purple: {
      border: 'border-purple-500/30',
      iconBg: 'bg-purple-500/20',
      iconText: 'text-purple-400',
      glow: 'from-purple-500/5 to-indigo-500/5',
    },
    blue: {
      border: 'border-blue-500/30',
      iconBg: 'bg-blue-500/20',
      iconText: 'text-blue-400',
      glow: 'from-blue-500/5 to-cyan-500/5',
    },
    indigo: {
      border: 'border-indigo-500/30',
      iconBg: 'bg-indigo-500/20',
      iconText: 'text-indigo-400',
      glow: 'from-indigo-500/5 to-purple-500/5',
    },
    emerald: {
      border: 'border-emerald-500/30',
      iconBg: 'bg-emerald-500/20',
      iconText: 'text-emerald-400',
      glow: 'from-emerald-500/5 to-green-500/5',
    },
    cyan: {
      border: 'border-cyan-500/30',
      iconBg: 'bg-cyan-500/20',
      iconText: 'text-cyan-400',
      glow: 'from-cyan-500/5 to-blue-500/5',
    },
  }

export function AIInsightCard({ insight, loading, accentColor = 'purple' }: AIInsightCardProps) {
  const [expanded, setExpanded] = useState(false)
  const c = colorMap[accentColor] ?? colorMap.purple

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className={`bg-gradient-to-r ${c.glow} border ${c.border} cursor-pointer rounded-2xl p-4 transition-opacity hover:opacity-90`}
      onClick={() => setExpanded((e) => !e)}
    >
      <div className="flex items-center gap-3">
        <div className={`p-2 ${c.iconBg} shrink-0 rounded-xl`}>
          <Sparkles size={14} className={c.iconText} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-muted-foreground mb-0.5 text-xs font-bold uppercase tracking-wider">
            AI Koç Önerisi
          </p>
          {loading ? (
            <div className="bg-muted/50 h-4 w-3/4 animate-pulse rounded" />
          ) : (
            <p className={`text-sm font-medium ${expanded ? '' : 'truncate'}`}>{insight}</p>
          )}
        </div>
        <motion.div animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown size={14} className="text-muted-foreground shrink-0" />
        </motion.div>
      </div>
    </motion.div>
  )
}
