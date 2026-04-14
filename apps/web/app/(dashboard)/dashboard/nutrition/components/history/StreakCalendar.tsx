'use client'

interface Props {
  calendar: Record<string, boolean> // YYYY-MM-DD -> logged
}

export function StreakCalendar({ calendar }: Props) {
  const entries = Object.entries(calendar).sort(([a], [b]) => a.localeCompare(b))

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-4">
      <h3 className="mb-4 text-sm font-semibold text-white">Son 30 Gün Aktivitesi</h3>
      <div className="flex flex-wrap gap-1.5">
        {entries.map(([date, logged]) => (
          <div
            key={date}
            title={date}
            className={`h-5 w-5 rounded-sm transition-colors ${
              logged ? 'bg-[#6366F1]' : 'bg-white/[0.06]'
            }`}
          />
        ))}
      </div>
      <div className="mt-3 flex items-center gap-3 text-xs text-[#64748B]">
        <div className="flex items-center gap-1">
          <div className="h-3 w-3 rounded-sm bg-[#6366F1]" />
          <span>Kayıt var</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="h-3 w-3 rounded-sm bg-white/[0.06]" />
          <span>Kayıt yok</span>
        </div>
      </div>
    </div>
  )
}
