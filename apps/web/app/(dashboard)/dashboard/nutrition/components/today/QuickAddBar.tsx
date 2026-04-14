'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'
import Image from 'next/image'
import { THIINGS } from '@/lib/thiings'

interface QuickAddItem {
  name: string
  cals: number
  img: string
  type: string
  protein: number
  carbs: number
  fat: number
}

const QUICK_ADD: QuickAddItem[] = [
  { name: 'Su (250ml)', cals: 0, img: THIINGS.waterBottle, type: 'snack', protein: 0, carbs: 0, fat: 0 },
  { name: 'Muz', cals: 89, img: THIINGS.banana, type: 'snack', protein: 1, carbs: 23, fat: 0 },
  { name: 'Yumurta', cals: 78, img: THIINGS.egg, type: 'breakfast', protein: 6, carbs: 0, fat: 5 },
  { name: 'Avokado', cals: 160, img: THIINGS.avocado, type: 'snack', protein: 2, carbs: 9, fat: 15 },
  { name: 'Elma', cals: 95, img: THIINGS.apple, type: 'snack', protein: 0, carbs: 25, fat: 0 },
  { name: 'Portakal', cals: 62, img: THIINGS.orange, type: 'snack', protein: 1, carbs: 15, fat: 0 },
]

interface Props {
  onAdd: (item: QuickAddItem) => Promise<void>
}

export function QuickAddBar({ onAdd }: Props) {
  const [adding, setAdding] = useState<string | null>(null)

  const handle = async (item: QuickAddItem) => {
    setAdding(item.name)
    await onAdd(item)
    setAdding(null)
  }

  return (
    <div className="scrollbar-none flex gap-3 overflow-x-auto pb-2">
      {QUICK_ADD.map((item) => (
        <motion.button
          key={item.name}
          onClick={() => handle(item)}
          disabled={adding === item.name}
          whileTap={{ scale: 0.94 }}
          transition={{ duration: 0.12 }}
          className="flex min-w-[72px] cursor-pointer flex-col items-center gap-1.5 rounded-xl border border-white/[0.06] bg-white/[0.04] p-3 transition-colors hover:border-[#6366F1]/30 hover:bg-[#6366F1]/10 disabled:opacity-50"
        >
          {adding === item.name ? (
            <Loader2 size={24} className="animate-spin text-[#6366F1]" />
          ) : (
            <Image src={item.img} alt={item.name} width={36} height={36} unoptimized className="drop-shadow-md" />
          )}
          <p className="text-center text-[11px] font-medium leading-tight text-white">{item.name}</p>
          <p className="text-[10px] text-[#64748B]">{item.cals > 0 ? `${item.cals} kcal` : '—'}</p>
        </motion.button>
      ))}
    </div>
  )
}
