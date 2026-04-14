'use client'

import { useState, useEffect } from 'react'
import { Bell, Loader2 } from 'lucide-react'
import { useNotifications } from '@/hooks/useNotifications'

interface Prefs {
  waterReminder: boolean
  mealReminder: boolean
  smartCalorie: boolean
}

export function NotificationSettings() {
  const { supported, permission, subscribe } = useNotifications()
  const [prefs, setPrefs] = useState<Prefs>({
    waterReminder: true,
    mealReminder: true,
    smartCalorie: true,
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch('/api/notifications/preferences')
      .then((r) => r.json())
      .then((d) => {
        if (d.prefs)
          setPrefs({
            waterReminder: d.prefs.waterReminder,
            mealReminder: d.prefs.mealReminder,
            smartCalorie: d.prefs.smartCalorie,
          })
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const save = async (next: Prefs) => {
    setSaving(true)
    await fetch('/api/notifications/preferences', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(next),
    }).catch(() => {})
    setSaving(false)
  }

  const toggle = (key: keyof Prefs) => {
    const next = { ...prefs, [key]: !prefs[key] }
    setPrefs(next)
    save(next)
  }

  if (loading) return <div className="h-32 animate-pulse rounded-2xl bg-white/[0.04]" />

  return (
    <div className="space-y-3 rounded-2xl border border-white/[0.06] bg-white/[0.03] p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white">Bildirimler</h3>
        {saving && <Loader2 size={14} className="animate-spin text-[#64748B]" />}
      </div>

      {!supported ? (
        <p className="text-xs text-[#64748B]">Tarayıcın push bildirimleri desteklemiyor.</p>
      ) : permission !== 'granted' ? (
        <button
          onClick={subscribe}
          className="flex items-center gap-2 rounded-xl bg-[#6366F1]/10 px-4 py-2.5 text-sm font-medium text-[#6366F1] transition-colors hover:bg-[#6366F1]/20"
        >
          <Bell size={14} /> Bildirimlere İzin Ver
        </button>
      ) : (
        <div className="space-y-2">
          {[
            { key: 'waterReminder' as const, label: 'Su Hatırlatıcısı', desc: 'Her 2 saatte bir' },
            {
              key: 'mealReminder' as const,
              label: 'Öğün Hatırlatıcısı',
              desc: 'Kahvaltı, öğle, akşam',
            },
            {
              key: 'smartCalorie' as const,
              label: 'Akıllı Kalori Bildirimi',
              desc: 'Günlük hedefe göre kişisel',
            },
          ].map(({ key, label, desc }) => (
            <div
              key={key}
              className="flex items-center justify-between rounded-xl bg-white/[0.02] px-3 py-2.5"
            >
              <div>
                <p className="text-sm text-white">{label}</p>
                <p className="text-xs text-[#64748B]">{desc}</p>
              </div>
              <button
                onClick={() => toggle(key)}
                className={`relative h-5 w-9 rounded-full transition-colors ${prefs[key] ? 'bg-[#6366F1]' : 'bg-white/[0.1]'}`}
              >
                <span
                  className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform ${prefs[key] ? 'translate-x-4' : 'translate-x-0.5'}`}
                />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
