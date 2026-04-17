'use client'

import { useState, useEffect } from 'react'
import { useClerk, useUser } from '@clerk/nextjs'
import Image from 'next/image'
import { Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { THIINGS } from '@/lib/thiings'
import { SettingsSectionCard } from './SettingsSectionCard'
import { SettingsRow } from './SettingsRow'

const FITNESS_LEVELS = [
  { value: 'beginner', label: 'Başlangıç' },
  { value: 'intermediate', label: 'Orta' },
  { value: 'advanced', label: 'İleri' },
  { value: 'elite', label: 'Elit' },
]

const GENDER_OPTIONS = [
  { value: 'male', label: 'Erkek' },
  { value: 'female', label: 'Kadın' },
  { value: 'other', label: 'Diğer' },
  { value: 'prefer_not_to_say', label: 'Belirtmek istemiyorum' },
]

const GOAL_OPTIONS = [
  { value: 'lose_weight', label: 'Kilo Ver' },
  { value: 'gain_muscle', label: 'Kas Kazan' },
  { value: 'improve_endurance', label: 'Dayanıklılık' },
  { value: 'general_fitness', label: 'Genel Form' },
  { value: 'flexibility', label: 'Esneklik' },
]

interface ProfileData {
  name: string
  bio: string
  country: string
  timezone: string
  locale: string
  profilePublic: boolean
  healthProfile: {
    age: number
    gender: string
    heightCm: number
    weightKg: number
    fitnessLevel: string
    goals: string[]
  } | null
}

export function ProfileSection() {
  const { openUserProfile } = useClerk()
  const { user: clerkUser } = useUser()
  const [data, setData] = useState<ProfileData | null>(null)
  const [dirty, setDirty] = useState(false)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/user/profile')
      .then((r) => r.json())
      .then((res) => {
        const u = res.user
        setData({
          name: u?.name ?? '',
          bio: u?.bio ?? '',
          country: u?.country ?? '',
          timezone: u?.timezone ?? '',
          locale: u?.locale ?? 'tr',
          profilePublic: u?.profilePublic ?? false,
          healthProfile: u?.healthProfile ?? null,
        })
      })
      .finally(() => setLoading(false))
  }, [])

  const update = (patch: Partial<ProfileData>) => {
    setData((prev) => (prev ? { ...prev, ...patch } : prev))
    setDirty(true)
  }

  const updateHealth = (patch: Partial<ProfileData['healthProfile'] & object>) => {
    setData((prev) =>
      prev
        ? {
            ...prev,
            healthProfile: {
              ...(prev.healthProfile ?? {
                age: 25,
                gender: 'prefer_not_to_say',
                heightCm: 175,
                weightKg: 70,
                fitnessLevel: 'beginner',
                goals: [],
              }),
              ...patch,
            },
          }
        : prev
    )
    setDirty(true)
  }

  const handleSave = async () => {
    if (!data) return
    setSaving(true)
    try {
      await Promise.all([
        fetch('/api/user/profile', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: data.name,
            bio: data.bio,
            country: data.country,
            timezone: data.timezone,
            locale: data.locale,
          }),
        }),
        data.healthProfile
          ? fetch('/api/user/profile', {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ healthProfile: data.healthProfile }),
            })
          : Promise.resolve(),
      ])
      setDirty(false)
      setToast('Kaydedildi ✓')
      setTimeout(() => setToast(''), 2500)
    } catch {
      setToast('Kaydedilemedi, tekrar dene')
      setTimeout(() => setToast(''), 2500)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <SettingsSectionCard
        icon={THIINGS.profileIcon}
        title="Profil Bilgileri"
        description="Hesap bilgilerini düzenle"
        delay={0.1}
      >
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="bg-muted/30 h-12 animate-pulse rounded-xl" />
          ))}
        </div>
      </SettingsSectionCard>
    )
  }

  if (!data) return null

  return (
    <SettingsSectionCard
      icon={THIINGS.profileIcon}
      title="Profil Bilgileri"
      description="Hesap bilgilerini düzenle"
      delay={0.1}
    >
      {/* Avatar */}
      <div className="mb-5 flex items-center gap-4">
        <button onClick={() => openUserProfile()} className="relative">
          {clerkUser?.imageUrl ? (
            <Image
              src={clerkUser.imageUrl}
              alt="avatar"
              width={64}
              height={64}
              className="rounded-2xl object-cover"
            />
          ) : (
            <div className="bg-primary/20 flex h-16 w-16 items-center justify-center rounded-2xl text-xl font-bold">
              {data.name?.[0] ?? '?'}
            </div>
          )}
          <span className="bg-primary absolute -bottom-1 -right-1 rounded-full px-1.5 py-0.5 text-[10px] text-white">
            Düzenle
          </span>
        </button>
        <div>
          <p className="font-bold">{data.name || '–'}</p>
          <p className="text-muted-foreground text-xs">
            {clerkUser?.primaryEmailAddress?.emailAddress}
          </p>
        </div>
      </div>

      {/* Profil Detayları */}
      <div className="mb-1 space-y-0">
        <SettingsRow label="Ad Soyad">
          <input
            value={data.name}
            onChange={(e) => update({ name: e.target.value })}
            className="bg-transparent text-right text-sm font-semibold outline-none"
          />
        </SettingsRow>
        <SettingsRow label="E-posta" value={clerkUser?.primaryEmailAddress?.emailAddress ?? '–'} />
        <SettingsRow label="Telefon" value={clerkUser?.primaryPhoneNumber?.phoneNumber ?? '–'} />
        <SettingsRow label="Biyografi">
          <textarea
            value={data.bio}
            onChange={(e) => update({ bio: e.target.value })}
            maxLength={200}
            rows={2}
            className="resize-none bg-transparent text-right text-sm font-semibold outline-none"
            placeholder="Kendinizden bahsedin..."
          />
        </SettingsRow>
      </div>

      {/* Fiziksel */}
      <p className="text-muted-foreground mb-2 mt-4 text-xs font-semibold uppercase">
        Fiziksel & Kişisel
      </p>
      <div className="space-y-0">
        <SettingsRow label="Yaş">
          <input
            type="number"
            value={data.healthProfile?.age ?? ''}
            onChange={(e) => updateHealth({ age: Number(e.target.value) })}
            className="w-16 bg-transparent text-right text-sm font-semibold outline-none"
          />
        </SettingsRow>
        <SettingsRow label="Cinsiyet">
          <select
            value={data.healthProfile?.gender ?? ''}
            onChange={(e) => updateHealth({ gender: e.target.value })}
            className="bg-transparent text-right text-sm font-semibold outline-none"
          >
            {GENDER_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </SettingsRow>
        <SettingsRow label="Boy (cm)">
          <input
            type="number"
            value={data.healthProfile?.heightCm ?? ''}
            onChange={(e) => updateHealth({ heightCm: Number(e.target.value) })}
            className="w-16 bg-transparent text-right text-sm font-semibold outline-none"
          />
        </SettingsRow>
        <SettingsRow label="Kilo (kg)" last>
          <input
            type="number"
            value={data.healthProfile?.weightKg ?? ''}
            onChange={(e) => updateHealth({ weightKg: Number(e.target.value) })}
            className="w-16 bg-transparent text-right text-sm font-semibold outline-none"
          />
        </SettingsRow>
      </div>

      {/* Fitness */}
      <p className="text-muted-foreground mb-2 mt-4 text-xs font-semibold uppercase">Fitness</p>
      <div className="space-y-0">
        <SettingsRow label="Fitness Seviyesi">
          <select
            value={data.healthProfile?.fitnessLevel ?? ''}
            onChange={(e) => updateHealth({ fitnessLevel: e.target.value })}
            className="bg-transparent text-right text-sm font-semibold outline-none"
          >
            {FITNESS_LEVELS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </SettingsRow>
        <SettingsRow label="Hedefler" last>
          <div className="flex max-w-xs flex-wrap justify-end gap-1">
            {GOAL_OPTIONS.map((g) => {
              const active = data.healthProfile?.goals?.includes(g.value)
              return (
                <button
                  key={g.value}
                  onClick={() => {
                    const goals = data.healthProfile?.goals ?? []
                    updateHealth({
                      goals: active ? goals.filter((x) => x !== g.value) : [...goals, g.value],
                    })
                  }}
                  className={`rounded-full px-2 py-0.5 text-xs font-medium transition-colors ${active ? 'bg-primary text-white' : 'bg-muted/30 text-muted-foreground'}`}
                >
                  {g.label}
                </button>
              )
            })}
          </div>
        </SettingsRow>
      </div>

      {/* Konum */}
      <p className="text-muted-foreground mb-2 mt-4 text-xs font-semibold uppercase">Konum</p>
      <div className="space-y-0">
        <SettingsRow label="Ülke">
          <input
            value={data.country}
            onChange={(e) => update({ country: e.target.value })}
            className="bg-transparent text-right text-sm font-semibold outline-none"
            placeholder="Türkiye"
          />
        </SettingsRow>
        <SettingsRow label="Timezone" last>
          <input
            value={data.timezone}
            onChange={(e) => update({ timezone: e.target.value })}
            className="bg-transparent text-right text-sm font-semibold outline-none"
            placeholder="Europe/Istanbul"
          />
        </SettingsRow>
      </div>

      {/* Save */}
      <div className="mt-5 flex items-center justify-between">
        {toast && (
          <span
            className={`text-xs font-medium ${toast.includes('✓') ? 'text-green-400' : 'text-red-400'}`}
          >
            {toast}
          </span>
        )}
        <div className="ml-auto">
          <Button onClick={handleSave} disabled={!dirty || saving} size="sm" className="gap-1.5">
            <Save size={12} /> {saving ? 'Kaydediliyor...' : 'Kaydet'}
          </Button>
        </div>
      </div>
    </SettingsSectionCard>
  )
}
