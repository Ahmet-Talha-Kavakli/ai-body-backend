'use client'

import { motion } from 'framer-motion'

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-4xl font-black mb-2">Good Morning, John!</h1>
        <p className="text-muted-foreground">Today, April 9, 2026</p>
      </motion.div>

      {/* Placeholder - Coming Soon */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-12 rounded-xl bg-card/50 border border-border/30 text-center"
      >
        <p className="text-lg text-muted-foreground">
          Dashboard home page - Full implementation coming next
        </p>
      </motion.div>
    </div>
  )
}
