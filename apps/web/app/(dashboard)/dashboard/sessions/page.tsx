'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { ChevronRight, Mic } from 'lucide-react'
import { PERSONAS } from '@/lib/sessions/personas'

export default function SessionsPage() {
  const personas = Object.values(PERSONAS)

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="mb-1 text-2xl font-black text-white">Seans</h1>
        <p className="text-sm text-white/50">Hangi koçla çalışmak istiyorsun?</p>
      </div>

      <div className="space-y-3">
        {personas.map((persona, i) => (
          <motion.div
            key={persona.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.06 }}
            whileHover={{ x: 4 }}
            whileTap={{ scale: 0.98 }}
          >
            <Link href={`/dashboard/sessions/${persona.id}`}>
              <div
                className={`flex items-center gap-4 rounded-2xl p-4 ${persona.bgColor} border ${persona.borderColor} transition-all`}
              >
                {/* Emoji avatar */}
                <div
                  className={`h-12 w-12 rounded-2xl bg-gradient-to-br ${persona.gradient} flex items-center justify-center text-2xl shadow-lg`}
                >
                  {persona.emoji}
                </div>

                {/* Info */}
                <div className="min-w-0 flex-1">
                  <div className="mb-0.5 flex items-center gap-2">
                    <p className="font-bold text-white">{persona.name}</p>
                    <span className={`text-xs ${persona.accentColor} font-semibold`}>
                      {persona.role}
                    </span>
                  </div>
                  <p className="truncate text-sm text-white/50">{persona.description}</p>
                </div>

                {/* Mic + arrow */}
                <div className="flex shrink-0 items-center gap-2">
                  <Mic size={16} className={persona.accentColor} />
                  <ChevronRight size={18} className="text-white/30" />
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* Info note */}
      <p className="text-center text-xs text-white/30">
        Tüm seanslar sesli AI ile gerçekleşir • Verileriniz kullanılarak kişiselleştirilir
      </p>
    </div>
  )
}
