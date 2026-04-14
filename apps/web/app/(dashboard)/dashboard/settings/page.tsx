'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { LogOut, ChevronRight, Moon, Sun, Save, Star, Zap, CheckCircle, Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useClerk, useUser } from '@clerk/nextjs'
import { useTheme } from 'next-themes'
import Image from 'next/image'
import { THIINGS } from '@/lib/thiings'
import { NotificationSettings } from '@/components/settings/NotificationSettings'

interface ProfileData {
  user: {
    name: string | null
    email: string
    clerkId: string
    healthProfile: {
      fitnessLevel: string
      goals: string[]
    } | null
  } | null
}

interface SubscriptionData {
  tier: string
  usage: {
    sessions: { used: number; limit: number; canUse: boolean }
    aiPrograms: { used: number; limit: number; canUse: boolean }
    aiMeals: { used: number; limit: number; canUse: boolean }
    aiCoach: { used: number; limit: number; canUse: boolean }
  }
  features: {
    wearableSync: boolean
    advancedAnalytics: boolean
    prioritySupport: boolean
  }
}

const NOTIFICATIONS = [
  {
    label: 'Antrenman Hatırlatıcısı',
    desc: 'Günlük seans saatinde bildirim al',
    key: 'workout',
    default: true,
  },
  {
    label: 'Başarı Rozetleri',
    desc: 'Yeni başarı kazandığında bildirim al',
    key: 'badges',
    default: true,
  },
  { label: 'Haftalık Rapor', desc: 'Her Pazartesi haftalık özet', key: 'weekly', default: false },
  { label: 'AI Koç Tavsiyeleri', desc: 'Kişiselleştirilmiş öneriler', key: 'ai', default: true },
  {
    label: 'Pazarlama E-postaları',
    desc: 'Kampanya ve fırsatlardan haberdar ol',
    key: 'marketing',
    default: false,
  },
]

const FITNESS_LEVELS: Record<string, string> = {
  beginner: 'Başlangıç',
  intermediate: 'Orta',
  advanced: 'İleri',
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

export default function SettingsPage() {
  const { signOut } = useClerk()
  const { user: clerkUser } = useUser()
  const { theme, setTheme } = useTheme()
  const [profileData, setProfileData] = useState<ProfileData | null>(null)
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionData | null>(null)
  const [loading, setLoading] = useState(true)
  const [subLoading, setSubLoading] = useState(true)
  const [name, setName] = useState('')
  const [editName, setEditName] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [toggles, setToggles] = useState(
    Object.fromEntries(NOTIFICATIONS.map((n) => [n.key, n.default]))
  )
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null)
  const [portalLoading, setPortalLoading] = useState(false)

  useEffect(() => {
    Promise.all([
      fetch('/api/user/profile')
        .then((r) => r.json())
        .then((data: ProfileData) => {
          setProfileData(data)
          setName(data.user?.name ?? clerkUser?.fullName ?? '')
        })
        .catch(console.error),
      fetch('/api/subscription/usage')
        .then((r) => r.json())
        .then((data: SubscriptionData) => {
          setSubscriptionData(data)
        })
        .catch(console.error)
        .finally(() => setSubLoading(false)),
    ]).finally(() => setLoading(false))
  }, [clerkUser])

  const flipToggle = (key: string) => {
    setToggles((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const handleSaveName = async () => {
    if (!name.trim()) return
    setSaving(true)
    try {
      await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      })
      setEditName(false)
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 2000)
    } catch (e) {
      console.error(e)
    } finally {
      setSaving(false)
    }
  }

  const handleUpgrade = async (plan: string) => {
    setCheckoutLoading(plan)
    try {
      const res = await fetch('/api/subscription/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      }
    } catch (e) {
      console.error(e)
    } finally {
      setCheckoutLoading(null)
    }
  }

  const handlePortal = async () => {
    setPortalLoading(true)
    try {
      const res = await fetch('/api/subscription/portal', { method: 'POST' })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      }
    } catch (e) {
      console.error(e)
    } finally {
      setPortalLoading(false)
    }
  }

  const email = clerkUser?.primaryEmailAddress?.emailAddress ?? profileData?.user?.email ?? '–'
  const fitnessLevel = profileData?.user?.healthProfile?.fitnessLevel
  const goals = profileData?.user?.healthProfile?.goals ?? []

  return (
    <div className="max-w-2xl space-y-8">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="mb-1 text-3xl font-black">Ayarlar</h1>
        <p className="text-muted-foreground">Hesap ve tercihlerini yönet</p>
      </motion.div>

      {/* Profil */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-card/50 border-border/30 rounded-2xl border p-5"
      >
        <div className="mb-5 flex items-center gap-3">
          <Image
            src={THIINGS.profileIcon}
            alt="profile"
            width={36}
            height={36}
            unoptimized
            className="rounded-xl"
          />
          <div>
            <h3 className="font-bold">Profil Bilgileri</h3>
            <p className="text-muted-foreground text-xs">Hesap bilgilerini düzenle</p>
          </div>
        </div>

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-muted/30 h-12 animate-pulse rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="space-y-1">
            {/* Ad Soyad */}
            <div className="border-border/20 flex items-center justify-between border-b py-3">
              <div className="flex-1">
                <p className="text-muted-foreground text-xs">Ad Soyad</p>
                {editName ? (
                  <div className="mt-1 flex items-center gap-2">
                    <input
                      autoFocus
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
                      className="flex-1 border-b border-blue-500 bg-transparent text-sm font-semibold outline-none"
                    />
                    <button
                      onClick={handleSaveName}
                      disabled={saving}
                      className="flex items-center gap-1 text-xs font-medium text-blue-400 hover:text-blue-300"
                    >
                      <Save size={12} /> {saving ? 'Kaydediliyor...' : 'Kaydet'}
                    </button>
                    <button
                      onClick={() => setEditName(false)}
                      className="text-muted-foreground hover:text-foreground text-xs"
                    >
                      İptal
                    </button>
                  </div>
                ) : (
                  <p className="text-sm font-semibold">
                    {name || '–'}
                    {saveSuccess && (
                      <span className="ml-2 text-xs text-green-400">✓ Kaydedildi</span>
                    )}
                  </p>
                )}
              </div>
              {!editName && (
                <button
                  onClick={() => setEditName(true)}
                  className="text-xs font-medium text-blue-400 hover:text-blue-300"
                >
                  Düzenle
                </button>
              )}
            </div>

            {[
              { label: 'E-posta', value: email },
              {
                label: 'Fitness Seviyesi',
                value: fitnessLevel ? (FITNESS_LEVELS[fitnessLevel] ?? fitnessLevel) : '–',
              },
              { label: 'Hedefler', value: goals.length > 0 ? goals.join(', ') : '–' },
            ].map((field) => (
              <div
                key={field.label}
                className="border-border/20 flex items-center justify-between border-b py-3 last:border-0"
              >
                <div>
                  <p className="text-muted-foreground text-xs">{field.label}</p>
                  <p className="text-sm font-semibold">{field.value}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Abonelik */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.12 }}
        className="rounded-2xl border border-blue-500/20 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-pink-500/5 p-5"
      >
        <div className="mb-5 flex items-center gap-3">
          <div className="rounded-lg bg-blue-500/10 p-2">
            <Star size={24} className="text-blue-400" />
          </div>
          <div>
            <h3 className="font-bold">Abonelik Planı</h3>
            <p className="text-muted-foreground text-xs">
              Mevcut planını yönet ve özellik limitleri
            </p>
          </div>
        </div>

        {subLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-muted/30 h-10 animate-pulse rounded-xl" />
            ))}
          </div>
        ) : subscriptionData ? (
          <div className="space-y-4">
            {/* Mevcut Plan */}
            <div className="bg-card/50 border-border/30 flex items-center justify-between rounded-xl border p-3">
              <div>
                <p className="text-muted-foreground text-xs">Mevcut Plan</p>
                <div className="mt-1 flex items-center gap-2">
                  <p className="text-lg font-bold capitalize">
                    {subscriptionData.tier === 'free' && 'Ücretsiz'}
                    {subscriptionData.tier === 'basic' && 'Basic'}
                    {subscriptionData.tier === 'standard' && 'Standart'}
                    {subscriptionData.tier === 'pro' && 'Pro'}
                  </p>
                  {subscriptionData.tier !== 'pro' && <Zap size={16} className="text-yellow-500" />}
                </div>
              </div>
              {subscriptionData.tier !== 'pro' && (
                <Button
                  onClick={() =>
                    handleUpgrade(
                      subscriptionData.tier === 'free'
                        ? 'basic'
                        : subscriptionData.tier === 'basic'
                          ? 'standard'
                          : 'pro'
                    )
                  }
                  disabled={
                    checkoutLoading ===
                    (subscriptionData.tier === 'free'
                      ? 'basic'
                      : subscriptionData.tier === 'basic'
                        ? 'standard'
                        : 'pro')
                  }
                  className="h-8 bg-gradient-to-r from-green-500 to-emerald-600 text-xs text-white"
                >
                  {checkoutLoading ? 'Yükleniyor...' : 'Yükselten'}
                </Button>
              )}
            </div>

            {/* Kullanım */}
            <div className="space-y-2">
              <p className="text-muted-foreground text-xs font-semibold">AYLIK KULLANIM</p>
              {[
                { label: 'Seans', usage: subscriptionData.usage.sessions },
                { label: 'AI Program', usage: subscriptionData.usage.aiPrograms },
                { label: 'Yemek Analizi', usage: subscriptionData.usage.aiMeals },
                { label: 'Koç Mesajı', usage: subscriptionData.usage.aiCoach },
              ].map((item) => (
                <div key={item.label} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">{item.label}</p>
                    <p className="text-muted-foreground text-xs">
                      {item.usage.used}/{item.usage.limit === Infinity ? '∞' : item.usage.limit}
                    </p>
                  </div>
                  {item.usage.limit !== Infinity && (
                    <div className="bg-muted/30 h-1.5 w-full rounded-full">
                      <div
                        className={`h-1.5 rounded-full transition-all ${
                          item.usage.used >= item.usage.limit ? 'bg-red-500' : 'bg-blue-500'
                        }`}
                        style={{
                          width: `${Math.min((item.usage.used / item.usage.limit) * 100, 100)}%`,
                        }}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Özellikler */}
            <div className="space-y-2">
              <p className="text-muted-foreground text-xs font-semibold">PREMIUM ÖZELLIKLER</p>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                {[
                  { label: 'Akıllı Saat Sync', enabled: subscriptionData.features.wearableSync },
                  {
                    label: 'Gelişmiş Analiz',
                    enabled: subscriptionData.features.advancedAnalytics,
                  },
                  { label: 'Öncelikli Destek', enabled: subscriptionData.features.prioritySupport },
                ].map((feature) => (
                  <div
                    key={feature.label}
                    className="bg-card/50 border-border/30 flex items-center gap-2 rounded-lg border p-2"
                  >
                    {feature.enabled ? (
                      <CheckCircle size={14} className="flex-shrink-0 text-green-500" />
                    ) : (
                      <Lock size={14} className="text-muted-foreground flex-shrink-0" />
                    )}
                    <span
                      className={`text-xs font-medium ${!feature.enabled && 'text-muted-foreground'}`}
                    >
                      {feature.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Fatura Yönetimi */}
            {subscriptionData.tier !== 'free' && (
              <Button
                onClick={handlePortal}
                disabled={portalLoading}
                variant="outline"
                className="h-9 w-full text-xs"
              >
                {portalLoading ? 'Yükleniyor...' : 'Fatura Yönetimi'}
              </Button>
            )}
          </div>
        ) : null}
      </motion.div>

      {/* Tema */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="bg-card/50 border-border/30 rounded-2xl border p-5"
      >
        <div className="mb-5 flex items-center gap-3">
          <Image
            src={THIINGS.settings}
            alt="settings"
            width={36}
            height={36}
            unoptimized
            className="rounded-xl"
          />
          <div>
            <h3 className="font-bold">Görünüm ve Dil</h3>
            <p className="text-muted-foreground text-xs">Tema ve dil tercihlerini seç</p>
          </div>
        </div>

        <div className="border-border/20 flex items-center justify-between border-b py-3">
          <div>
            <p className="text-sm font-semibold">Tema</p>
            <p className="text-muted-foreground text-xs">Açık veya koyu mod</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setTheme('light')}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                theme === 'light' ? 'bg-blue-600 text-white' : 'bg-muted/30 text-muted-foreground'
              }`}
            >
              <Sun size={12} /> Açık
            </button>
            <button
              onClick={() => setTheme('dark')}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                theme === 'dark' || theme === 'system'
                  ? 'bg-blue-600 text-white'
                  : 'bg-muted/30 text-muted-foreground'
              }`}
            >
              <Moon size={12} /> Koyu
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between py-3">
          <div>
            <p className="text-sm font-semibold">Dil</p>
            <p className="text-muted-foreground text-xs">Uygulama dili</p>
          </div>
          <select className="bg-muted/30 border-border/30 rounded-lg border px-3 py-1.5 text-sm focus:outline-none">
            <option>Türkçe</option>
            <option>English</option>
          </select>
        </div>
      </motion.div>

      {/* Bildirimler */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-card/50 border-border/30 rounded-2xl border p-5"
      >
        <div className="mb-5 flex items-center gap-3">
          <Image
            src={THIINGS.bell}
            alt="notifications"
            width={36}
            height={36}
            unoptimized
            className="rounded-xl"
          />
          <div>
            <h3 className="font-bold">Bildirimler</h3>
            <p className="text-muted-foreground text-xs">Bildirim tercihlerini yönet</p>
          </div>
        </div>
        <NotificationSettings />
      </motion.div>

      {/* Güvenlik */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="bg-card/50 border-border/30 rounded-2xl border p-5"
      >
        <div className="mb-5 flex items-center gap-3">
          <Image
            src={THIINGS.settings}
            alt="security"
            width={36}
            height={36}
            unoptimized
            className="rounded-xl"
          />
          <div>
            <h3 className="font-bold">Gizlilik ve Güvenlik</h3>
            <p className="text-muted-foreground text-xs">Hesap güvenliğini yönet</p>
          </div>
        </div>

        <div className="space-y-2">
          {[
            { label: 'İki Faktörlü Doğrulama', value: 'Aktif', action: 'Devre Dışı Bırak' },
            { label: 'Son Şifre Değişimi', value: '30 gün önce', action: 'Değiştir' },
            { label: 'Oturum Geçmişi', value: '3 aktif cihaz', action: 'Görüntüle' },
          ].map((item) => (
            <div
              key={item.label}
              className="border-border/20 flex items-center justify-between border-b py-3 last:border-0"
            >
              <div>
                <p className="text-sm font-semibold">{item.label}</p>
                <p className="text-muted-foreground text-xs">{item.value}</p>
              </div>
              <button className="flex items-center gap-1 text-xs font-medium text-blue-400 hover:text-blue-300">
                {item.action} <ChevronRight size={12} />
              </button>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Tehlikeli Alan */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="rounded-2xl border border-red-500/20 bg-red-500/5 p-5"
      >
        <div className="mb-5 flex items-center gap-3">
          <Image
            src={THIINGS.trashBin}
            alt="danger"
            width={36}
            height={36}
            unoptimized
            className="rounded-xl"
          />
          <div>
            <h3 className="font-bold text-red-400">Tehlikeli Alan</h3>
            <p className="text-muted-foreground text-xs">Geri alınamaz işlemler</p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between border-b border-red-500/20 py-3">
            <div>
              <p className="text-sm font-semibold">Tüm Verilerimi Sil</p>
              <p className="text-muted-foreground text-xs">
                Antrenman geçmişi ve beslenme verileri silinir
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="border-red-500/30 text-xs text-red-400 hover:bg-red-500/10"
            >
              Sil
            </Button>
          </div>

          <div className="flex items-center justify-between border-b border-red-500/20 py-3">
            <div>
              <p className="text-sm font-semibold">Hesabı Sil</p>
              <p className="text-muted-foreground text-xs">FitAI hesabın kalıcı olarak silinir</p>
            </div>
            <Button variant="destructive" size="sm" className="text-xs">
              Hesabı Sil
            </Button>
          </div>

          <div className="flex items-center justify-between py-3">
            <div>
              <p className="text-sm font-semibold">Çıkış Yap</p>
              <p className="text-muted-foreground text-xs">Tüm cihazlardan çıkış yap</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => signOut({ redirectUrl: '/' })}
              className="gap-1.5 border-red-500/30 text-xs text-red-400 hover:bg-red-500/10"
            >
              <LogOut size={12} />
              Çıkış Yap
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
