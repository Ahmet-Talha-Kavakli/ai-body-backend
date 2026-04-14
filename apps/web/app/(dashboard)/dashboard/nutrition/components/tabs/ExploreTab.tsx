'use client'

import { FoodSearchBar } from '../explore/FoodSearchBar'
import { FoodSearchResults } from '../explore/FoodSearchResults'
import { RecentFoods } from '../explore/RecentFoods'
import { useFoodSearch } from '../../hooks/useFoodSearch'
import type { SearchResult } from '@/lib/nutrition/types'

interface Props {
  onSelectFood: (food: SearchResult) => void
  onPhoto: () => void
  onBarcode: () => void
}

export function ExploreTab({ onSelectFood, onPhoto, onBarcode }: Props) {
  const { results, loading, query, search } = useFoodSearch()

  return (
    <div className="space-y-4">
      <FoodSearchBar query={query} onSearch={search} onPhoto={onPhoto} onBarcode={onBarcode} />
      {!query && <RecentFoods onSelect={search} />}
      {query && (
        <FoodSearchResults results={results} loading={loading} query={query} onSelect={onSelectFood} />
      )}
    </div>
  )
}
