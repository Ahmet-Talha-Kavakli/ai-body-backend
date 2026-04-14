'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Trash2 } from 'lucide-react'

type DrinkType = 'coffee' | 'tea' | 'juice' | 'milk' | 'energy'

interface DrinkLog {
  id: string
  drinkType: DrinkType
  amountMl: number
  createdAt: string
}

const DRINK_DEFS: Record<
  DrinkType,
  { label: string; icon: string; color: string; defaultMl: number }
> = {
  coffee: {
    label: 'Kahve',
    icon: '☕',
    color: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
    defaultMl: 200,
  },
  tea: {
    label: 'Çay',
    icon: '🍵',
    color: 'bg-green-500/10 border-green-500/20 text-green-400',
    defaultMl: 200,
  },
  juice: {
    label: 'Meyve Suyu',
    icon: '🧃',
    color: 'bg-orange-500/10 border-orange-500/20 text-orange-400',
    defaultMl: 250,
  },
  milk: {
    label: 'Süt',
    icon: '🥛',
    color: 'bg-blue-500/10 border-blue-500/20 text-blue-400',
    defaultMl: 200,
  },
  energy: {
    label: 'Enerji',
    icon: '⚡',
    color: 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400',
    defaultMl: 250,
  },
}

export function DrinkTracker() {
  const [logs, setLogs] = useState<DrinkLog[]>([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState<DrinkType | null>(null)

  useEffect(() => {
    fetch('/api/nutrition/drinks')
      .then((r) => r.json())
      .then((d) => {
        setLogs(d.logs ?? [])
        setLoading(false)
      })
  }, [])

  const addDrink = async (drinkType: DrinkType) => {
    setAdding(drinkType)
    const amountMl = DRINK_DEFS[drinkType].defaultMl
    const res = await fetch('/api/nutrition/drinks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ drinkType, amountMl }),
    }).then((r) => r.json())

    if (res.success) {
      setLogs((prev) => [res.log, ...prev])
    }
    setAdding(null)
  }

  const removeDrink = async (id: string) => {
    const res = await fetch('/api/nutrition/drinks', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    }).then((r) => r.json())
    if (res.success) {
      setLogs((prev) => prev.filter((l) => l.id !== id))
    }
  }

  const totalByType = logs.reduce(
    (acc, log) => {
      acc[log.drinkType] = (acc[log.drinkType] ?? 0) + log.amountMl
      return acc
    },
    {} as Record<DrinkType, number>
  )

  return (
    <div className="space-y-4 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
      <h3 className="text-sm font-semibold text-white">Diğer İçecekler</h3>

      {/* Hızlı Ekleme */}
      <div className="grid grid-cols-5 gap-2">
        {(Object.entries(DRINK_DEFS) as [DrinkType, (typeof DRINK_DEFS)[DrinkType]][]).map(
          ([type, def]) => (
            <motion.button
              key={type}
              whileTap={{ scale: 0.92 }}
              onClick={() => addDrink(type)}
              disabled={adding === type}
              className={`flex flex-col items-center gap-1 rounded-2xl border p-2 transition-all ${def.color} hover:opacity-80 disabled:opacity-50`}
            >
              <span className="text-xl">{def.icon}</span>
              <span className="text-[9px] font-medium">{def.label}</span>
              {totalByType[type] ? (
                <span className="text-[9px] opacity-70">{totalByType[type]}ml</span>
              ) : null}
            </motion.button>
          )
        )}
      </div>

      {/* Log Listesi */}
      {!loading && logs.length > 0 && (
        <div className="space-y-1">
          <AnimatePresence>
            {logs.slice(0, 5).map((log) => {
              const def = DRINK_DEFS[log.drinkType]
              return (
                <motion.div
                  key={log.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="flex items-center justify-between rounded-xl bg-white/[0.03] px-3 py-2"
                >
                  <div className="flex items-center gap-2">
                    <span>{def.icon}</span>
                    <span className="text-xs text-white">{def.label}</span>
                    <span className="text-xs text-[#64748B]">{log.amountMl}ml</span>
                  </div>
                  <button
                    onClick={() => removeDrink(log.id)}
                    className="text-red-400/40 transition-colors hover:text-red-400"
                  >
                    <Trash2 size={13} />
                  </button>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      )}

      {!loading && logs.length === 0 && (
        <p className="text-center text-xs text-[#64748B]">Bugün henüz başka içecek eklenmedi</p>
      )}
    </div>
  )
}
