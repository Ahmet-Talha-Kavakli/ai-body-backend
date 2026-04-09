'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Activity, Droplets, TrendingUp,
  Watch, Bluetooth, Battery, CheckCircle, Heart
} from 'lucide-react'
import Image from 'next/image'
import { THIINGS } from '@/lib/thiings'
import { NeonIcon } from '@/components/ui/neon-icon'

interface HealthData {
  profile: {
    weightKg: number
    heightCm: number
    age: number
  } | null
  latestReadings: Record<string, number>
  avgSteps: number
  sleepData: { date: string; hours: number }[]
  hasDevice: boolean
  devices: { id: string; brand: string; model: string; isConnected: boolean }[]
}

interface WaterData {
  totalMl: number
  count: number
}

const HEART_RATE_ZONES = [
  { name: 'Dinlenme', range: '< 60 bpm', pct: 45, color: 'bg-blue-500' },
  { name: 'Hafif', range: '60–100 bpm', pct: 30, color: 'bg-green-500' },
  { name: 'Aerobik', range: '100–140 bpm', pct: 15, color: 'bg-yellow-500' },
  { name: 'Anaerobik', range: '140–170 bpm', pct: 8, color: 'bg-orange-500' },
  { name: 'Maksimal', range: '170+ bpm', pct: 2, color: 'bg-red-500' },
]

const DAYS = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz']

export default function HealthPage() {
  const [healthData, setHealthData] = useState<HealthData | null>(null)
  const [waterData, setWaterData] = useState<WaterData>({ totalMl: 0, count: 0 })
  const [loading, setLoading] = useState(true)
  const [addingWater, setAddingWater] = useState(false)
  const [watchConnected, setWatchConnected] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    setLoading(true)
    try {
      const [healthRes, waterRes] = await Promise.all([
        fetch('/api/health'),
        fetch('/api/health/water'),
      ])
      const health = await healthRes.json()
      const water = await waterRes.json()
      setHealthData(health)
      setWaterData(water)
      setWatchConnected(health.hasDevice)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  async function handleAddWater() {
    setAddingWater(true)
    try {
      const res = await fetch('/api/health/water', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ml: 250 }),
      })
      const data = await res.json()
      setWaterData({ totalMl: data.totalMl, count: waterData.count + 1 })
    } catch (e) {
      console.error(e)
    } finally {
      setAddingWater(false)
    }
  }

  const handleConnect = async () => {
    setIsConnecting(true)
    await new Promise(r => setTimeout(r, 2000))
    setIsConnecting(false)
    setWatchConnected(true)
  }

  // Compute BMI
  const bmi = healthData?.profile
    ? (healthData.profile.weightKg / Math.pow(healthData.profile.heightCm / 100, 2)).toFixed(1)
    : null

  const heartRate = healthData?.latestReadings?.['heart_rate'] ?? 68
  const steps = healthData?.avgSteps ?? 0
  const waterLiters = (waterData.totalMl / 1000).toFixed(1)
  const waterGoalL = 2.5
  const waterGlasses = Math.floor(waterData.totalMl / 250)
  const waterGoalGlasses = Math.ceil((waterGoalL * 1000) / 250)

  const sleepData = healthData?.sleepData ?? []
  const avgSleep = sleepData.length
    ? (sleepData.reduce((s, d) => s + d.hours, 0) / sleepData.length).toFixed(1)
    : '–'
  const maxSleep = sleepData.length ? Math.max(...sleepData.map(d => d.hours)) : 8

  // Fill 7 days for chart
  const sleepChart = DAYS.map((day, i) => ({
    day,
    hours: sleepData[i]?.hours ?? 0,
  }))

  const METRICS = [
    { neonType: 'heart' as const, label: 'Dinlenme Nabzı', value: heartRate.toString(), unit: 'bpm', color: 'red', bg: 'bg-red-500/10', border: 'border-red-500/20', status: heartRate < 100 ? 'Normal' : 'Yüksek' },
    { neonType: 'target' as const, label: 'BMI', value: bmi ?? '–', unit: '', color: 'green', bg: 'bg-green-500/10', border: 'border-green-500/20', status: bmi && parseFloat(bmi) < 25 ? 'Normal' : 'Dikkat' },
    { neonType: 'activity' as const, label: 'Günlük Adım', value: steps.toLocaleString('tr-TR'), unit: 'adım', color: 'purple', bg: 'bg-purple-500/10', border: 'border-purple-500/20', status: `Hedef: 10.000` },
    { neonType: 'droplet' as const, label: 'Su Tüketimi', value: waterLiters, unit: 'L', color: 'blue', bg: 'bg-blue-500/10', border: 'border-blue-500/20', status: `Hedef: ${waterGoalL} L` },
  ]

  if (loading) {
    return (
      <div className="space-y-8 max-w-5xl">
        <div className="h-12 bg-muted/30 rounded-xl animate-pulse" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-32 bg-muted/30 rounded-2xl animate-pulse" />
          ))}
        </div>
        <div className="h-64 bg-muted/30 rounded-2xl animate-pulse" />
      </div>
    )
  }

  return (
    <div className="space-y-8 max-w-5xl">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-black mb-1">Sağlık & Akıllı Saat</h1>
        <p className="text-muted-foreground">Sağlık metriklerini ve akıllı saat verilerini takip et</p>
      </motion.div>

      {/* Metrikler */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {METRICS.map((metric, i) => (
          <motion.div
            key={metric.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className={`${metric.bg} border ${metric.border} rounded-2xl p-5`}
          >
            <NeonIcon type={metric.neonType} color={metric.color as any} size={28} />
            <p className="text-xs text-muted-foreground mb-1">{metric.label}</p>
            <p className="text-2xl font-black">
              {metric.value}
              {metric.unit && <span className="text-sm font-normal text-muted-foreground ml-1">{metric.unit}</span>}
            </p>
            <p className={`text-xs mt-1 ${metric.color}`}>{metric.status}</p>
          </motion.div>
        ))}
      </div>

      {/* Akıllı Saat + Nabız Zonları */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-card/50 border border-border/30 rounded-2xl p-5"
        >
          <div className="flex items-center gap-2 mb-5">
            <Watch size={18} className="text-blue-400" />
            <h3 className="font-bold">Akıllı Saat Bağlantısı</h3>
          </div>

          {watchConnected ? (
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 bg-green-500/5 border border-green-500/20 rounded-xl">
                <div className="w-12 h-16 bg-gray-800 rounded-xl flex items-center justify-center border border-gray-700 relative">
                  <Watch size={20} className="text-green-400" />
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-background" />
                </div>
                <div className="flex-1">
                  <p className="font-bold">{healthData?.devices[0]?.brand ?? 'Akıllı Saat'} {healthData?.devices[0]?.model ?? ''}</p>
                  <p className="text-xs text-green-400 flex items-center gap-1 mt-0.5">
                    <CheckCircle size={10} /> Bağlı
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {[
                  { icon: Battery, label: 'Batarya', value: `${healthData?.latestReadings?.['battery'] ?? 78}%`, color: 'text-green-400' },
                  { icon: Heart, label: 'Nabız', value: `${heartRate} bpm`, color: 'text-red-400' },
                  { icon: Activity, label: 'SpO2', value: `%${healthData?.latestReadings?.['spo2'] ?? 98}`, color: 'text-blue-400' },
                ].map(item => (
                  <div key={item.label} className="bg-muted/30 rounded-xl p-3 text-center">
                    <item.icon size={14} className={`${item.color} mx-auto mb-1`} />
                    <p className="text-xs font-bold">{item.value}</p>
                    <p className="text-xs text-muted-foreground">{item.label}</p>
                  </div>
                ))}
              </div>

              <div className="p-3 bg-blue-500/5 border border-blue-500/20 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-blue-400">Canlı Nabız İzleme</span>
                  <span className="text-xs text-green-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse inline-block" />
                    Aktif
                  </span>
                </div>
                <svg viewBox="0 0 200 40" className="w-full h-10">
                  <polyline
                    points="0,20 20,20 30,5 40,35 50,20 70,20 80,8 90,32 100,20 120,20 130,5 140,35 150,20 170,20 180,8 190,32 200,20"
                    fill="none"
                    stroke="#3B82F6"
                    strokeWidth="2"
                  />
                </svg>
              </div>

              <button
                onClick={() => setWatchConnected(false)}
                className="w-full py-2 text-xs text-muted-foreground hover:text-red-400 transition-colors"
              >
                Bağlantıyı Kes
              </button>
            </div>
          ) : (
            <div className="text-center py-6">
              <div className="w-16 h-16 bg-muted/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Watch size={28} className="text-muted-foreground" />
              </div>
              <p className="font-semibold mb-1">Akıllı Saat Bağlı Değil</p>
              <p className="text-xs text-muted-foreground mb-5">
                Apple Watch, Garmin, Samsung Galaxy Watch veya Fitbit bağla
              </p>

              <div className="flex flex-col gap-2">
                {['Apple Watch', 'Garmin', 'Samsung Galaxy Watch', 'Fitbit'].map(brand => (
                  <button
                    key={brand}
                    onClick={handleConnect}
                    disabled={isConnecting}
                    className="flex items-center gap-3 px-4 py-3 bg-muted/30 hover:bg-muted/50 border border-border/30 hover:border-blue-500/30 rounded-xl text-sm font-medium transition-all"
                  >
                    <Bluetooth size={14} className="text-blue-400" />
                    {brand}
                    {isConnecting && (
                      <span className="ml-auto text-xs text-muted-foreground">Bağlanıyor...</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </motion.div>

        {/* Nabız Zonları */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="bg-card/50 border border-border/30 rounded-2xl p-5"
        >
          <div className="flex items-center gap-2 mb-5">
            <Heart size={18} className="text-red-400" />
            <h3 className="font-bold">Nabız Zonu Dağılımı</h3>
          </div>

          <p className="text-xs text-muted-foreground mb-4">Bu haftaki antrenman nabız dağılımı</p>

          <div className="space-y-3">
            {HEART_RATE_ZONES.map((zone, i) => (
              <div key={zone.name}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-medium">{zone.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">{zone.range}</span>
                    <span className="font-bold">%{zone.pct}</span>
                  </div>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${zone.pct}%` }}
                    transition={{ delay: 0.3 + i * 0.1, duration: 0.7 }}
                    className={`h-full ${zone.color} rounded-full`}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 p-3 bg-muted/20 rounded-xl">
            <p className="text-xs text-muted-foreground">
              <span className="font-semibold text-foreground">Öneri:</span> Aerobik zonunda daha fazla zaman geçirmeye çalış. Hedef: %25
            </p>
          </div>
        </motion.div>
      </div>

      {/* Uyku Analizi */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-card/50 border border-border/30 rounded-2xl p-5"
      >
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Image src={THIINGS.brain} alt="sleep" width={28} height={28} unoptimized />
            <h3 className="font-bold">Uyku Analizi</h3>
          </div>
          <span className="text-sm text-muted-foreground">
            Bu hafta ort: <span className="font-bold text-foreground">{avgSleep} saat</span>
          </span>
        </div>

        {sleepData.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">
            Henüz uyku verisi yok. Akıllı saat bağladığında veriler burada görünecek.
          </div>
        ) : (
          <>
            <div className="flex items-end gap-2 h-28">
              {sleepChart.map((day, i) => (
                <div key={day.day} className="flex-1 flex flex-col items-center gap-2">
                  <span className="text-xs text-muted-foreground">{day.hours > 0 ? `${day.hours}s` : ''}</span>
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: day.hours > 0 ? `${(day.hours / maxSleep) * 100}%` : '4px' }}
                    transition={{ delay: 0.4 + i * 0.07, duration: 0.6 }}
                    className={`w-full rounded-t-lg ${
                      day.hours >= 7.5 ? 'bg-purple-500' :
                      day.hours >= 6 ? 'bg-purple-500/60' :
                      day.hours > 0 ? 'bg-red-500/60' : 'bg-muted/30'
                    }`}
                  />
                  <span className="text-xs text-muted-foreground">{day.day}</span>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-3 gap-3 mt-4">
              {[
                { label: 'En Uzun', value: `${Math.max(...sleepData.map(d => d.hours)).toFixed(1)} saat`, img: THIINGS.pillow, color: 'text-purple-400' },
                { label: 'En Kısa', value: `${Math.min(...sleepData.map(d => d.hours)).toFixed(1)} saat`, img: THIINGS.alarmClock, color: 'text-red-400' },
                { label: 'Uyku Kalitesi', value: '%82', img: THIINGS.star, color: 'text-yellow-400' },
              ].map(item => (
                <div key={item.label} className="bg-muted/20 rounded-xl p-3 text-center">
                  <Image src={item.img} alt={item.label} width={32} height={32} unoptimized className="mx-auto mb-1" />
                  <p className={`text-sm font-bold ${item.color}`}>{item.value}</p>
                  <p className="text-xs text-muted-foreground">{item.label}</p>
                </div>
              ))}
            </div>
          </>
        )}
      </motion.div>

      {/* Su takibi */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="bg-card/50 border border-border/30 rounded-2xl p-5"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Image src={THIINGS.waterBottle} alt="water" width={32} height={32} unoptimized />
            <h3 className="font-bold">Su Tüketimi</h3>
          </div>
          <span className="text-sm font-bold text-blue-400">{waterLiters} / {waterGoalL} L</span>
        </div>

        <div className="flex gap-2 flex-wrap mb-3">
          {Array.from({ length: waterGoalGlasses }).map((_, i) => (
            <motion.div
              key={i}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.4 + i * 0.05 }}
              className={`w-8 h-12 rounded-lg flex items-end justify-center pb-1 text-xs ${
                i < waterGlasses
                  ? 'bg-blue-500 text-white'
                  : 'bg-muted/30 border border-border/30 text-muted-foreground'
              }`}
            >
              <Droplets size={12} />
            </motion.div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          Her bardak = 250ml · {waterGlasses}/{waterGoalGlasses} bardak içildi
        </p>

        <button
          onClick={handleAddWater}
          disabled={addingWater}
          className="mt-3 w-full py-2.5 bg-blue-500/10 border border-blue-500/20 hover:bg-blue-500/20 rounded-xl text-sm font-semibold text-blue-400 transition-colors disabled:opacity-50"
        >
          {addingWater ? 'Ekleniyor...' : '+ Su Ekle (250ml)'}
        </button>
      </motion.div>
    </div>
  )
}
