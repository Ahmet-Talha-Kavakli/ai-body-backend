'use client'

import type { TopFood } from '@/lib/nutrition/types'

interface Props {
  foods: TopFood[]
}

export function TopFoodsList({ foods }: Props) {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-4">
      <h3 className="mb-4 text-sm font-semibold text-white">En Çok Tüketilen (Top 5)</h3>
      {foods.length === 0 ? (
        <p className="py-4 text-center text-sm text-[#64748B]">Henüz veri yok</p>
      ) : (
        <ul className="space-y-2">
          {foods.map((food, i) => (
            <li key={food.name} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/[0.06] text-xs font-bold text-[#94A3B8]">
                  {i + 1}
                </span>
                <span className="text-sm text-white">{food.name}</span>
              </div>
              <div className="text-right">
                <p className="text-xs font-semibold text-[#6366F1]">{food.count}x</p>
                <p className="text-xs text-[#64748B]">{food.avgCalories} kcal ort.</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
