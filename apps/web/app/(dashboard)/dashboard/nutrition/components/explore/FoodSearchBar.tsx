'use client'

import { Search, Camera, ScanLine } from 'lucide-react'

interface Props {
  query: string
  onSearch: (q: string) => void
  onPhoto: () => void
  onBarcode: () => void
}

export function FoodSearchBar({ query, onSearch, onPhoto, onBarcode }: Props) {
  return (
    <div className="flex gap-2">
      <div className="relative flex-1">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B]" />
        <input
          type="text"
          value={query}
          onChange={(e) => onSearch(e.target.value)}
          placeholder="Besin ara..."
          className="w-full rounded-xl border border-white/[0.06] bg-white/[0.04] py-3 pl-9 pr-4 text-sm text-white outline-none transition-colors placeholder:text-[#64748B] focus:border-[#6366F1]/50"
        />
      </div>
      <button
        onClick={onPhoto}
        className="cursor-pointer rounded-xl border border-white/[0.06] bg-white/[0.04] p-3 transition-colors hover:border-[#6366F1]/30"
        aria-label="Fotoğrafla analiz"
      >
        <Camera size={18} className="text-[#64748B]" />
      </button>
      <button
        onClick={onBarcode}
        className="cursor-pointer rounded-xl border border-white/[0.06] bg-white/[0.04] p-3 transition-colors hover:border-[#6366F1]/30"
        aria-label="Barkod tara"
      >
        <ScanLine size={18} className="text-[#64748B]" />
      </button>
    </div>
  )
}
