'use client'

import { useRecentFoods } from '../../hooks/useRecentFoods'

interface Props {
  onSelect: (name: string) => void
}

export function RecentFoods({ onSelect }: Props) {
  const { foods } = useRecentFoods()

  if (foods.length === 0) return null

  return (
    <div>
      <p className="mb-2 text-xs text-[#64748B]">Son Kullanılanlar</p>
      <div className="flex flex-wrap gap-2">
        {foods.map((f) => (
          <button
            key={f.name}
            onClick={() => onSelect(f.name)}
            className="cursor-pointer rounded-full border border-white/[0.06] bg-white/[0.04] px-3 py-1.5 text-xs text-white transition-colors hover:bg-white/[0.08]"
          >
            {f.name}
          </button>
        ))}
      </div>
    </div>
  )
}
