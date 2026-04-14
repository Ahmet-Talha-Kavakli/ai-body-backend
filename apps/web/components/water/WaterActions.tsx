'use client'

import { motion } from 'framer-motion'
import { Plus, Minus } from 'lucide-react'

interface WaterActionsProps {
  cupSizeMl: number
  onAdd: (ml: number) => void
  onRemove: (ml: number) => void
}

const PRESETS = [
  { label: '1 Bardak', getMl: (cup: number) => cup },
  { label: '500 ml', getMl: () => 500 },
  { label: '1 L', getMl: () => 1000 },
]

export function WaterActions({ cupSizeMl, onAdd, onRemove }: WaterActionsProps) {
  return (
    <div className="w-full space-y-3">
      {/* Hızlı ekleme presetleri */}
      <div className="grid grid-cols-3 gap-2">
        {PRESETS.map((preset) => {
          const ml = preset.getMl(cupSizeMl)
          return (
            <motion.button
              key={preset.label}
              whileTap={{ scale: 0.95 }}
              onClick={() => onAdd(ml)}
              className="flex flex-col items-center gap-1 rounded-2xl border border-[#3B82F6]/20 bg-[#3B82F6]/10 px-2 py-3 transition-colors hover:bg-[#3B82F6]/20"
            >
              <Plus size={16} className="text-[#3B82F6]" />
              <span className="text-xs font-semibold text-white">{preset.label}</span>
              <span className="text-[10px] text-[#64748B]">{ml} ml</span>
            </motion.button>
          )
        })}
      </div>

      {/* Manuel ml giriş */}
      <ManualInput onAdd={onAdd} onRemove={onRemove} />
    </div>
  )
}

function ManualInput({
  onAdd,
  onRemove,
}: {
  onAdd: (ml: number) => void
  onRemove: (ml: number) => void
}) {
  return (
    <div className="flex items-center gap-2 rounded-2xl border border-white/[0.06] bg-white/[0.03] p-3">
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={() => onRemove(100)}
        className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-500/10 text-red-400 transition-colors hover:bg-red-500/20"
      >
        <Minus size={16} />
      </motion.button>
      <div className="flex-1 text-center">
        <p className="text-xs text-[#64748B]">100 ml ekle / çıkar</p>
      </div>
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={() => onAdd(100)}
        className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#3B82F6]/10 text-[#3B82F6] transition-colors hover:bg-[#3B82F6]/20"
      >
        <Plus size={16} />
      </motion.button>
    </div>
  )
}
