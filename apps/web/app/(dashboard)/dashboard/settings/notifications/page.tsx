'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { Bell, Droplets, Pill, Moon, Zap, Cat, Map, Trophy, Loader2 } from 'lucide-react'

interface NotificationSettings {
  waterReminder: boolean
  medicationReminder: boolean
  sleepReminder: boolean
  workoutReminder: boolean
  petNotification: boolean
  roadmapUpdate: boolean
  achievementAlert: boolean
  streakWarning: boolean
}

const NOTIFICATION_ITEMS = [
  {
    key: 'waterReminder' as const,
    icon: Droplets,
    label: 'Su Hatırlatıcısı',
    desc: 'Her 2 saatte su içmeyi hatırlat',
    color: 'text-blue-400',
  },
  {
    key: 'medicationReminder' as const,
    icon: Pill,
    label: 'İlaç Hatırlatıcısı',
    desc: 'İlaç saatlerinde bildirim al',
    color: 'text-red-400',
  },
  {
    key: 'sleepReminder' as const,
    icon: Moon,
    label: 'Uyku Vakti',
    desc: 'Belirlenen saatte uyuma hatırlatması',
    color: 'text-purple-400',
  },
  {
    key: 'workoutReminder' as const,
    icon: Zap,
    label: 'Antrenman Günü',
    desc: 'Antrenman günlerinde motivasyon',
    color: 'text-green-400',
  },
  {
    key: 'petNotification' as const,
    icon: Cat,
    label: 'Kedi Bildirimleri',
    desc: 'Kedi özlediğinde bildirim al',
    color: 'text-amber-400',
  },
  {
    key: 'roadmapUpdate' as const,
    icon: Map,
    label: 'Yol Haritası',
    desc: 'Haftalık görev güncellemeleri',
    color: 'text-indigo-400',
  },
  {
    key: 'achievementAlert' as const,
    icon: Trophy,
    label: 'Başarım Kazanıldı',
    desc: 'Yeni rozet kazandığında bildirim',
    color: 'text-yellow-400',
  },
  {
    key: 'streakWarning' as const,
    icon: Bell,
    label: 'Seri Uyarısı',
    desc: 'Serin kırılmak üzereyken uyar',
    color: 'text-orange-400',
  },
]

export default function NotificationsPage() {
  const [settings, setSettings] = useState<NotificationSettings>({
    waterReminder: true,
    medicationReminder: true,
    sleepReminder: true,
    workoutReminder: true,
    petNotification: true,
    roadmapUpdate: true,
    achievementAlert: true,
    streakWarning: true,
  })
  const [saving, setSaving] = useState(false)

  const toggle = (key: keyof NotificationSettings) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const save = async () => {
    setSaving(true)
    await fetch('/api/notifications/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    }).catch(() => {})
    setSaving(false)
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="mb-1 text-2xl font-black text-white">Bildirimler</h1>
        <p className="text-sm text-white/50">Hangi bildirimleri almak istediğini seç</p>
      </div>

      <div className="space-y-2">
        {NOTIFICATION_ITEMS.map((item, i) => (
          <motion.div
            key={item.key}
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4"
          >
            <item.icon size={20} className={item.color} />
            <div className="flex-1">
              <p className="text-sm font-semibold text-white">{item.label}</p>
              <p className="text-xs text-white/40">{item.desc}</p>
            </div>
            <button
              onClick={() => toggle(item.key)}
              className={`relative h-6 w-12 rounded-full transition-all ${settings[item.key] ? 'bg-indigo-500' : 'bg-white/10'}`}
            >
              <motion.div
                animate={{ x: settings[item.key] ? 24 : 2 }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                className="absolute top-1 h-4 w-4 rounded-full bg-white shadow"
              />
            </button>
          </motion.div>
        ))}
      </div>

      <button
        onClick={save}
        disabled={saving}
        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 py-3 font-bold text-white disabled:opacity-60"
      >
        {saving ? (
          <>
            <Loader2 size={16} className="animate-spin" /> Kaydediliyor...
          </>
        ) : (
          'Ayarları Kaydet'
        )}
      </button>
    </div>
  )
}
