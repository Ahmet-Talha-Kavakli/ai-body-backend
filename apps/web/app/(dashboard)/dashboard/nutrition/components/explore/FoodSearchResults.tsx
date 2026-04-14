'use client'

import { motion } from 'framer-motion'
import { Plus, AlertTriangle } from 'lucide-react'
import type { SearchResult } from '@/lib/nutrition/types'

interface Props {
  results: SearchResult[]
  loading: boolean
  query: string
  onSelect: (result: SearchResult) => void
}

export function FoodSearchResults({ results, loading, query, onSelect }: Props) {
  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-16 animate-pulse rounded-xl bg-white/[0.04]" />
        ))}
      </div>
    )
  }

  if (query && results.length === 0) {
    return (
      <div className="py-10 text-center text-[#64748B]">
        <p className="text-sm">"{query}" için sonuç bulunamadı</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {results.map((r, i) => (
        <motion.div
          key={r.barcode + i}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.04 }}
          className="flex cursor-pointer items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.03] p-3 transition-colors hover:bg-white/[0.06]"
          onClick={() => onSelect(r)}
        >
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-white">{r.name}</p>
            {r.brand && <p className="truncate text-xs text-[#64748B]">{r.brand}</p>}
            <div className="mt-1 flex gap-3 text-[11px] text-[#64748B]">
              <span>{r.caloriesPer100g} kcal</span>
              <span>P {r.proteinPer100g}g</span>
              <span>K {r.carbsPer100g}g</span>
              <span>Y {r.fatPer100g}g</span>
              {r.glycemicIndex && <span>Gİ {r.glycemicIndex}</span>}
            </div>
            {r.allergens.length > 0 && (
              <div className="mt-1 flex items-center gap-1">
                <AlertTriangle size={10} className="text-[#F59E0B]" />
                <span className="text-[10px] text-[#F59E0B]">{r.allergens.slice(0, 3).join(', ')}</span>
              </div>
            )}
          </div>
          <button className="shrink-0 cursor-pointer rounded-lg bg-[#6366F1]/10 p-1.5 transition-colors hover:bg-[#6366F1]/20">
            <Plus size={16} className="text-[#6366F1]" />
          </button>
        </motion.div>
      ))}
    </div>
  )
}
