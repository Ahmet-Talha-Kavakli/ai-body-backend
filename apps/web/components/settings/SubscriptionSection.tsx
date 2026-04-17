'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Zap, CheckCircle, Lock, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { THIINGS } from '@/lib/thiings'
import { SettingsSectionCard } from './SettingsSectionCard'

const TIER_LABELS: Record<string, string> = {
  free: 'Ücretsiz',
  basic: 'Basic',
  standard: 'Standart',
  pro: 'Pro',
}

interface SubscriptionData {
  tier: string
  usageResetAt?: string
  usage: {
    sessions: { used: number; limit: number }
    aiPrograms: { used: number; limit: number }
    aiMeals: { used: number; limit: number }
    aiCoach: { used: number; limit: number }
  }
  features: {
    wearableSync: boolean
    advancedAnalytics: boolean
    prioritySupport: boolean
  }
}

export function SubscriptionSection() {
  const router = useRouter()
  const [data, setData] = useState<SubscriptionData | null>(null)
  const [loading, setLoading] = useState(true)
  const [portalLoading, setPortalLoading] = useState(false)

  useEffect(() => {
    fetch('/api/subscription/usage')
      .then((r) => r.json())
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const handlePortal = async () => {
    setPortalLoading(true)
    try {
      const res = await fetch('/api/subscription/portal', { method: 'POST' })
      const d = await res.json()
      if (d.url) window.location.href = d.url
    } finally {
      setPortalLoading(false)
    }
  }

  const limitedItems = data
    ? [
        { label: 'Seans', usage: data.usage.sessions },
        { label: 'AI Program', usage: data.usage.aiPrograms },
        { label: 'Yemek Analizi', usage: data.usage.aiMeals },
        { label: 'Koç Mesajı', usage: data.usage.aiCoach },
      ].filter((i) => isFinite(i.usage.limit) && i.usage.used >= i.usage.limit)
    : []

  return (
    <SettingsSectionCard
      icon={THIINGS.settings}
      title="Abonelik Planı"
      description="Mevcut planını yönet ve özellik limitleri"
      delay={0.12}
      variant="premium"
    >
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-muted/30 h-10 animate-pulse rounded-xl" />
          ))}
        </div>
      ) : !data ? (
        <p className="text-muted-foreground text-sm">Abonelik bilgisi yüklenemedi.</p>
      ) : (
        <div className="space-y-4">
          {limitedItems.length > 0 && (
            <div className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2">
              <AlertTriangle size={14} className="flex-shrink-0 text-red-400" />
              <p className="text-xs text-red-400">
                {limitedItems.map((i) => i.label).join(', ')} limitin doldu. Yükselt veya yenileme
                tarihini bekle.
              </p>
            </div>
          )}

          <div className="bg-card/50 border-border/30 flex items-center justify-between rounded-xl border p-3">
            <div>
              <p className="text-muted-foreground text-xs">Mevcut Plan</p>
              <div className="mt-1 flex items-center gap-2">
                <p className="text-lg font-bold">{TIER_LABELS[data.tier] ?? data.tier}</p>
                {data.tier !== 'pro' && <Zap size={16} className="text-yellow-500" />}
              </div>
              {data.usageResetAt && (
                <p className="text-muted-foreground mt-0.5 text-xs">
                  Yenileme: {new Date(data.usageResetAt).toLocaleDateString('tr-TR')}
                </p>
              )}
            </div>
            <div className="flex gap-2">
              {data.tier !== 'free' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePortal}
                  disabled={portalLoading}
                  className="h-8 text-xs"
                >
                  {portalLoading ? '...' : 'Planı Yönet'}
                </Button>
              )}
              {data.tier !== 'pro' && (
                <Button
                  size="sm"
                  onClick={() => router.push('/dashboard/settings/premium')}
                  className="h-8 bg-gradient-to-r from-green-500 to-emerald-600 text-xs text-white"
                >
                  Yükselt
                </Button>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-muted-foreground text-xs font-semibold uppercase">Aylık Kullanım</p>
            {[
              { label: 'Seans', usage: data.usage.sessions },
              { label: 'AI Program', usage: data.usage.aiPrograms },
              { label: 'Yemek Analizi', usage: data.usage.aiMeals },
              { label: 'Koç Mesajı', usage: data.usage.aiCoach },
            ].map((item) => {
              const pct = isFinite(item.usage.limit)
                ? (item.usage.used / item.usage.limit) * 100
                : 0
              return (
                <div key={item.label} className="space-y-1">
                  <div className="flex justify-between">
                    <p className="text-sm font-medium">{item.label}</p>
                    <p className="text-muted-foreground text-xs">
                      {item.usage.used}/{isFinite(item.usage.limit) ? item.usage.limit : '∞'}
                    </p>
                  </div>
                  {isFinite(item.usage.limit) && (
                    <div className="bg-muted/30 h-1.5 w-full rounded-full">
                      <div
                        className={`h-1.5 rounded-full transition-all ${pct >= 100 ? 'bg-red-500' : pct >= 80 ? 'bg-yellow-500' : 'bg-blue-500'}`}
                        style={{ width: `${Math.min(pct, 100)}%` }}
                      />
                    </div>
                  )}
                  {!isFinite(item.usage.limit) && (
                    <p className="text-muted-foreground text-xs">Sınırsız</p>
                  )}
                </div>
              )
            })}
          </div>

          <div className="space-y-2">
            <p className="text-muted-foreground text-xs font-semibold uppercase">
              Premium Özellikler
            </p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              {[
                { label: 'Akıllı Saat Sync', enabled: data.features.wearableSync },
                { label: 'Gelişmiş Analiz', enabled: data.features.advancedAnalytics },
                { label: 'Öncelikli Destek', enabled: data.features.prioritySupport },
              ].map((f) => (
                <div
                  key={f.label}
                  className="bg-card/50 border-border/30 flex items-center gap-2 rounded-lg border p-2"
                >
                  {f.enabled ? (
                    <CheckCircle size={14} className="flex-shrink-0 text-green-500" />
                  ) : (
                    <Lock size={14} className="text-muted-foreground flex-shrink-0" />
                  )}
                  <span
                    className={`text-xs font-medium ${!f.enabled ? 'text-muted-foreground' : ''}`}
                  >
                    {f.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </SettingsSectionCard>
  )
}
