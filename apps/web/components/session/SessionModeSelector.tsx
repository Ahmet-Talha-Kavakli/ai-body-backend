'use client'

import { useRouter } from 'next/navigation'
import { Activity, MessageCircle } from 'lucide-react'

export function SessionModeSelector() {
  const router = useRouter()

  return (
    <div className="bg-background flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <h1 className="mb-2 text-center text-3xl font-black">Seans Başlat</h1>
        <p className="text-muted-foreground mb-8 text-center text-sm">
          Hangi modda devam etmek istersin?
        </p>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Mod 1 */}
          <button
            onClick={() => router.push('/dashboard/session/workout')}
            aria-label="AI PT ile Spor modunu başlat"
            className="bg-card border-border/50 group relative rounded-2xl border p-6 text-left transition-all hover:border-emerald-500/50 hover:bg-emerald-500/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
          >
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-emerald-500/30 bg-emerald-500/10 transition-colors group-hover:bg-emerald-500/20">
              <Activity size={24} className="text-emerald-400" />
            </div>
            <h2 className="mb-1 text-xl font-black">AI PT ile Spor</h2>
            <p className="text-muted-foreground mb-4 text-sm">
              Egzersiz yap, form analizi, 3D koç rehberliği
            </p>
            <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-400">
              Başla →
            </span>
          </button>

          {/* Mod 2 */}
          <button
            onClick={() => router.push('/dashboard/session/fitness-coach')}
            aria-label="Fitness Koçu modunu başlat"
            className="bg-card border-border/50 group relative rounded-2xl border p-6 text-left transition-all hover:border-blue-500/50 hover:bg-blue-500/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-blue-500/30 bg-blue-500/10 transition-colors group-hover:bg-blue-500/20">
              <MessageCircle size={24} className="text-blue-400" />
            </div>
            <h2 className="mb-1 text-xl font-black">Fitness Koçu</h2>
            <p className="text-muted-foreground mb-4 text-sm">
              Supplement, beslenme, kilo, motivasyon — sesli danışmanlık
            </p>
            <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-400">
              Başla →
            </span>
          </button>
        </div>
      </div>
    </div>
  )
}
