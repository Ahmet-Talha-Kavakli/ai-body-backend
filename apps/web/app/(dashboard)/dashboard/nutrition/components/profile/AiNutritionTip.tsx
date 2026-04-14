'use client'

import { useState, useEffect } from 'react'
import { Sparkles, RefreshCw } from 'lucide-react'

const FALLBACK =
  'Bugün sağlıklı beslenmeye devam et! Her öğünde protein, karbonhidrat ve yağ dengesine dikkat et.'

export function AiNutritionTip() {
  const [tip, setTip] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchTip = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/ai/nutrition-tip')
      const data = await res.json()
      setTip(data.tip ?? FALLBACK)
    } catch {
      setTip(FALLBACK)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTip()
  }, [])

  return (
    <div className="rounded-2xl border border-[#6366F1]/20 bg-gradient-to-br from-[#6366F1]/10 to-[#4F46E5]/5 p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles size={14} className="text-[#6366F1]" />
          <span className="text-xs font-semibold text-[#6366F1]">AI Günlük İpucu</span>
        </div>
        <button
          onClick={fetchTip}
          disabled={loading}
          className="rounded-lg p-1.5 text-[#64748B] transition-colors hover:bg-white/[0.06] disabled:opacity-40"
        >
          <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>
      {loading ? (
        <div className="space-y-2">
          <div className="h-3 w-full animate-pulse rounded bg-white/[0.06]" />
          <div className="h-3 w-3/4 animate-pulse rounded bg-white/[0.06]" />
        </div>
      ) : (
        <p className="text-sm leading-relaxed text-[#CBD5E1]">{tip}</p>
      )}
    </div>
  )
}
