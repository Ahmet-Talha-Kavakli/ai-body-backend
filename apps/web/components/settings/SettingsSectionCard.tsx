'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'

interface Props {
  icon: string
  title: string
  description: string
  children: React.ReactNode
  delay?: number
  variant?: 'default' | 'danger' | 'premium'
}

export function SettingsSectionCard({
  icon,
  title,
  description,
  children,
  delay = 0,
  variant = 'default',
}: Props) {
  const cardClass =
    variant === 'danger'
      ? 'rounded-2xl border border-red-500/20 bg-red-500/5 p-5'
      : variant === 'premium'
        ? 'rounded-2xl border border-blue-500/20 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-pink-500/5 p-5'
        : 'bg-card/50 border-border/30 rounded-2xl border p-5'

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className={cardClass}
    >
      <div className="mb-5 flex items-center gap-3">
        <Image src={icon} alt={title} width={36} height={36} unoptimized className="rounded-xl" />
        <div>
          <h3 className={`font-bold ${variant === 'danger' ? 'text-red-400' : ''}`}>{title}</h3>
          <p className="text-muted-foreground text-xs">{description}</p>
        </div>
      </div>
      {children}
    </motion.div>
  )
}
