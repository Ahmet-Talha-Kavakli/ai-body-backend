'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useUser } from '@clerk/nextjs'
import { ProfileSection } from '@/components/settings/ProfileSection'
import { SubscriptionSection } from '@/components/settings/SubscriptionSection'
import { AppearanceSection } from '@/components/settings/AppearanceSection'
import { PrivacySection } from '@/components/settings/PrivacySection'
import { DataPrivacySection } from '@/components/settings/DataPrivacySection'
import { DangerZone } from '@/components/settings/DangerZone'

export default function SettingsPage() {
  const { user: clerkUser } = useUser()
  const [profilePublic, setProfilePublic] = useState(false)

  useEffect(() => {
    fetch('/api/user/profile')
      .then((r) => r.json())
      .then((d) => {
        if (d.user?.profilePublic !== undefined) setProfilePublic(d.user.profilePublic)
      })
  }, [])

  return (
    <div className="max-w-2xl space-y-6 pb-16">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="mb-1 text-3xl font-black">Ayarlar</h1>
        <p className="text-muted-foreground text-sm">
          {clerkUser?.primaryEmailAddress?.emailAddress ?? 'Hesap ve tercihlerini yönet'}
        </p>
      </motion.div>

      <ProfileSection />
      <SubscriptionSection />
      <AppearanceSection />
      <PrivacySection profilePublic={profilePublic} onProfilePublicChange={setProfilePublic} />
      <DataPrivacySection />
      <DangerZone />
    </div>
  )
}
