'use client'

import { useState } from 'react'
import { useClerk, useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { THIINGS } from '@/lib/thiings'
import { SettingsSectionCard } from './SettingsSectionCard'
import { SettingsRow } from './SettingsRow'

interface Props {
  profilePublic: boolean
  onProfilePublicChange: (val: boolean) => void
}

export function PrivacySection({ profilePublic, onProfilePublicChange }: Props) {
  const { openUserProfile } = useClerk()
  const { user: clerkUser } = useUser()
  const router = useRouter()
  const [toggling, setToggling] = useState(false)
  const [toast, setToast] = useState('')

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(''), 2500)
  }

  const handleProfilePublic = async () => {
    const newVal = !profilePublic
    setToggling(true)
    try {
      await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profilePublic: newVal }),
      })
      onProfilePublicChange(newVal)
    } catch {
      showToast('Kaydedilemedi, tekrar dene')
    } finally {
      setToggling(false)
    }
  }

  const handleExport = () => {
    window.location.href = '/api/user/export'
  }

  const lastSignIn = clerkUser?.lastSignInAt
    ? new Date(clerkUser.lastSignInAt).toLocaleString('tr-TR')
    : 'Bilinmiyor'

  return (
    <SettingsSectionCard
      icon={THIINGS.settings}
      title="Gizlilik ve Güvenlik"
      description="Hesap güvenliğini yönet"
      delay={0.2}
    >
      {toast && <p className="mb-2 text-xs text-red-400">{toast}</p>}
      <SettingsRow
        label="İki Faktörlü Doğrulama"
        value="Hesap güvenliği"
        action="Yönet"
        onAction={() => openUserProfile()}
      />
      <SettingsRow
        label="Şifre"
        value="Şifreni değiştir"
        action="Değiştir"
        onAction={() => openUserProfile()}
      />
      <SettingsRow
        label="Aktif Oturumlar"
        value="Bağlı cihazlar"
        action="Görüntüle"
        onAction={() => openUserProfile()}
      />
      <SettingsRow
        label="Hesap Aktivite Logu"
        value={`Son giriş: ${lastSignIn}`}
        action="Görüntüle"
        onAction={() => openUserProfile()}
      />
      <SettingsRow
        label="Bağlı Cihazlar"
        value="Akıllı saat ve uygulamalar"
        action="Yönet"
        onAction={() => router.push('/dashboard/health')}
      />
      <SettingsRow label="Profil Görünürlüğü" value={profilePublic ? 'Herkese açık' : 'Gizli'}>
        <button
          onClick={handleProfilePublic}
          disabled={toggling}
          className={`relative h-6 w-11 rounded-full transition-colors ${profilePublic ? 'bg-blue-600' : 'bg-muted'}`}
        >
          <motion.div
            animate={{ x: profilePublic ? 20 : 2 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="absolute top-1 h-4 w-4 rounded-full bg-white shadow"
          />
        </button>
      </SettingsRow>
      <SettingsRow
        label="Verilerimi İndir"
        value="JSON formatında export"
        action="İndir"
        onAction={handleExport}
        last
      />
    </SettingsSectionCard>
  )
}
