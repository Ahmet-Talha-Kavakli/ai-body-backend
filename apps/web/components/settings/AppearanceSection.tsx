'use client'

import { useTheme } from 'next-themes'
import { Sun, Moon } from 'lucide-react'
import { THIINGS } from '@/lib/thiings'
import { SettingsSectionCard } from './SettingsSectionCard'
import { SettingsRow } from './SettingsRow'

export function AppearanceSection() {
  const { theme, setTheme } = useTheme()

  const handleLocale = async (locale: string) => {
    localStorage.setItem('locale', locale)
    await fetch('/api/user/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ locale }),
    })
  }

  return (
    <SettingsSectionCard
      icon={THIINGS.settings}
      title="Görünüm ve Dil"
      description="Tema ve dil tercihlerini seç"
      delay={0.15}
    >
      <SettingsRow label="Tema" value="Açık veya koyu mod">
        <div className="flex gap-2">
          <button
            onClick={() => setTheme('light')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${theme === 'light' ? 'bg-blue-600 text-white' : 'bg-muted/30 text-muted-foreground'}`}
          >
            <Sun size={12} /> Açık
          </button>
          <button
            onClick={() => setTheme('dark')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${theme === 'dark' || theme === 'system' ? 'bg-blue-600 text-white' : 'bg-muted/30 text-muted-foreground'}`}
          >
            <Moon size={12} /> Koyu
          </button>
        </div>
      </SettingsRow>

      <SettingsRow label="Dil" value="Uygulama dili" last>
        <select
          defaultValue={
            typeof window !== 'undefined' ? (localStorage.getItem('locale') ?? 'tr') : 'tr'
          }
          onChange={(e) => handleLocale(e.target.value)}
          onWheel={(e) => e.currentTarget.blur()}
          className="bg-muted/30 border-border/30 rounded-lg border px-3 py-1.5 text-sm focus:outline-none"
        >
          <option value="tr">Türkçe</option>
          <option value="en">English</option>
        </select>
      </SettingsRow>
    </SettingsSectionCard>
  )
}
