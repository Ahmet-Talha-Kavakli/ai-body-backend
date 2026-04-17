'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { THIINGS } from '@/lib/thiings'
import { SettingsSectionCard } from './SettingsSectionCard'
import { SettingsRow } from './SettingsRow'

interface PrivacySettings {
  collectWorkout: boolean
  collectNutrition: boolean
  analytics: boolean
  marketingEmails: boolean
}

function Toggle({ enabled, onChange }: { enabled: boolean; onChange: () => void }) {
  return (
    <button
      onClick={onChange}
      className={`relative h-6 w-11 rounded-full transition-colors ${enabled ? 'bg-blue-600' : 'bg-muted'}`}
    >
      <motion.div
        animate={{ x: enabled ? 20 : 2 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        className="absolute top-1 h-4 w-4 rounded-full bg-white shadow"
      />
    </button>
  )
}

export function DataPrivacySection() {
  const [settings, setSettings] = useState<PrivacySettings>({
    collectWorkout: true,
    collectNutrition: true,
    analytics: true,
    marketingEmails: false,
  })
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState('')

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(''), 2500)
  }

  useEffect(() => {
    fetch('/api/user/privacy-settings')
      .then((r) => r.json())
      .then((d) => d.settings && setSettings(d.settings))
      .finally(() => setLoading(false))
  }, [])

  const toggle = async (key: keyof PrivacySettings) => {
    const newVal = !settings[key]
    const prev = settings[key]
    setSettings((s) => ({ ...s, [key]: newVal }))
    try {
      await fetch('/api/user/privacy-settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [key]: newVal }),
      })
    } catch {
      setSettings((s) => ({ ...s, [key]: prev }))
      showToast('Kaydedilemedi, tekrar dene')
    }
  }

  if (loading) {
    return (
      <SettingsSectionCard
        icon={THIINGS.bell}
        title="Veri ve Gizlilik"
        description="Veri toplama tercihlerini yönet"
        delay={0.22}
      >
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-muted/30 h-10 animate-pulse rounded-xl" />
          ))}
        </div>
      </SettingsSectionCard>
    )
  }

  return (
    <SettingsSectionCard
      icon={THIINGS.bell}
      title="Veri ve Gizlilik"
      description="Veri toplama tercihlerini yönet"
      delay={0.22}
    >
      <SettingsRow label="Antrenman verilerini topla" value="Seans ve egzersiz verileri">
        <Toggle enabled={settings.collectWorkout} onChange={() => toggle('collectWorkout')} />
      </SettingsRow>
      <SettingsRow label="Beslenme verilerini topla" value="Yemek günlüğü verileri">
        <Toggle enabled={settings.collectNutrition} onChange={() => toggle('collectNutrition')} />
      </SettingsRow>
      <SettingsRow label="Analitik ve iyileştirme" value="Uygulama kullanım verileri">
        <Toggle enabled={settings.analytics} onChange={() => toggle('analytics')} />
      </SettingsRow>
      <SettingsRow label="Pazarlama iletişimi" value="Kampanya ve fırsatlar" last>
        <Toggle enabled={settings.marketingEmails} onChange={() => toggle('marketingEmails')} />
      </SettingsRow>

      {toast && <p className="mt-2 text-xs text-red-400">{toast}</p>}

      <div className="mt-4 flex gap-4">
        <a
          href="/privacy"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-blue-400 hover:text-blue-300"
        >
          Gizlilik Politikası →
        </a>
        <a
          href="/terms"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-blue-400 hover:text-blue-300"
        >
          Kullanım Şartları →
        </a>
      </div>
    </SettingsSectionCard>
  )
}
