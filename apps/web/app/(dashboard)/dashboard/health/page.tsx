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
import { MacbookLoader } from '@/components/ui/macbook-loader'

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
      <div className="flex items-center justify-center min-h-screen bg-background">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="scale-[2]">
          <MacbookLoader />
        </motion.div>
      </div>
    )
  }

  return (
    <div className="space-y-8 max-w-5xl">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-black mb-1">Sağlık & Akıllı Saat</h1>
        <p className="text-muted-foreground">Sağlık metriklerini ve akıllı saat verilerini takip et</p>
      </motion.div>

      <motion.div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {METRICS.map((metric, i) => (
          <motion.div
            key={metric.label}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: i * 0.08 }}
            whileHover={{ y: -4 }}
            className="group relative"
          >
            <div className={`absolute inset-0 ${metric.bg} rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity blur-xl`} />
            <div className={`relative ${metric.bg} border ${metric.border} rounded-3xl p-6 backdrop-blur-sm hover:border-opacity-60 transition-all h-full`}>
              <motion.div whileHover={{ scale: 1.2, rotate: 5 }} className="mb-3">
                <NeonIcon type={metric.neonType} color={metric.color as any} size={28} />
              </motion.div>
              <p className="text-xs text-muted-foreground mb-2 font-semibold uppercase tracking-wider">{metric.label}</p>
              <p className="text-2xl font-black">
                {metric.value}
                {metric.unit && <span className="text-sm font-normal text-muted-foreground ml-1">{metric.unit}</span>}
              </p>
              <p className={`text-xs mt-2 font-semibold ${metric.color}`}>{metric.status}</p>
            </div>
          </motion.div>
        ))}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="group relative"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity blur-xl" />
          <div className="relative bg-gradient-to-br from-card/80 to-card/40 border border-border/30 rounded-3xl p-6 backdrop-blur-sm hover:border-border/60 transition-all">
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
                    { icon: Battery, label: 'Batarya', value: `${healthData?.latestReadings?.['battery'] ?? 78}%`, color: 'text-green-400', bg: 'from-green-500/20 to-green-600/10' },
                    { icon: Heart, label: 'Nabız', value: `${heartRate} bpm`, color: 'text-red-400', bg: 'from-red-500/20 to-red-600/10' },
                    { icon: Activity, label: 'SpO2', value: `%${healthData?.latestReadings?.['spo2'] ?? 98}`, color: 'text-blue-400', bg: 'from-blue-500/20 to-blue-600/10' },
                  ].map(item => (
                    <motion.div
                      key={item.label}
                      whileHover={{ scale: 1.05, y: -2 }}
                      className={`bg-gradient-to-br ${item.bg} border border-white/10 rounded-2xl p-4 text-center group/stat hover:border-white/20 transition-all`}
                    >
                      <motion.div whileHover={{ scale: 1.2 }} className="mb-2">
                        <item.icon size={16} className={`${item.color} mx-auto`} />
                      </motion.div>
                      <p className="text-sm font-bold">{item.value}</p>
                      <p className="text-xs text-muted-foreground mt-1">{item.label}</p>
                    </motion.div>
                  ))}
                </div>

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="p-4 bg-gradient-to-r from-blue-500/15 to-cyan-500/15 border border-blue-500/30 rounded-2xl hover:border-blue-500/50 transition-all"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">Canlı Nabız İzleme</span>
                    <span className="text-xs text-green-400 flex items-center gap-1.5 font-semibold">
                      <motion.span
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ repeat: Infinity, duration: 1.5 }}
                        className="w-2 h-2 bg-green-400 rounded-full"
                      />
                      Aktif
                    </span>
                  </div>
                  <svg viewBox="0 0 200 40" className="w-full h-12">
                    <defs>
                      <linearGradient id="heartbeat" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#3B82F6" />
                        <stop offset="50%" stopColor="#06B6D4" />
                        <stop offset="100%" stopColor="#3B82F6" />
                      </linearGradient>
                    </defs>
                    <polyline
                      points="0,20 20,20 30,5 40,35 50,20 70,20 80,8 90,32 100,20 120,20 130,5 140,35 150,20 170,20 180,8 190,32 200,20"
                      fill="none"
                      stroke="url(#heartbeat)"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </motion.div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setWatchConnected(false)}
                  className="w-full py-2.5 text-xs text-muted-foreground hover:text-red-400 font-semibold transition-all hover:bg-red-500/5 rounded-xl mt-4"
                >
                  Bağlantıyı Kes
                </motion.button>
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
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="group relative"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 to-pink-500/10 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity blur-xl" />
          <div className="relative bg-gradient-to-br from-card/80 to-card/40 border border-border/30 rounded-3xl p-6 backdrop-blur-sm hover:border-border/60 transition-all">
            <div className="flex items-center gap-2 mb-5">
              <Heart size={18} className="text-red-400" />
              <h3 className="font-bold">Nabız Zonu Dağılımı</h3>
            </div>

            <p className="text-xs text-muted-foreground mb-5 uppercase tracking-wider">Bu haftaki antrenman nabız dağılımı</p>

            <div className="space-y-4">
              {HEART_RATE_ZONES.map((zone, i) => (
                <motion.div
                  key={zone.name}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.08 }}
                >
                  <div className="flex justify-between text-xs mb-2">
                    <span className="font-semibold uppercase tracking-wider">{zone.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground text-xs">{zone.range}</span>
                      <span className="font-black text-sm">{zone.pct}%</span>
                    </div>
                  </div>
                  <div className="h-3 bg-muted/30 rounded-full overflow-hidden border border-border/20">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${zone.pct}%` }}
                      transition={{ delay: 0.4 + i * 0.1, duration: 0.8 }}
                      whileHover={{ scaleY: 1.3 }}
                      className={`h-full ${zone.color} rounded-full shadow-lg`}
                    />
                  </div>
                </motion.div>
              ))}
            </div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="mt-6 p-4 bg-gradient-to-r from-yellow-500/15 to-orange-500/15 border border-yellow-500/30 rounded-2xl hover:border-yellow-500/50 transition-all"
            >
              <p className="text-xs text-muted-foreground">
                <span className="font-semibold text-yellow-400">Öneri:</span> Aerobik zonunda daha fazla zaman geçirmeye çalış. Hedef: %25
              </p>
            </motion.div>
          </div>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="group relative"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-indigo-500/10 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity blur-xl" />
        <div className="relative bg-gradient-to-br from-card/80 to-card/40 border border-border/30 rounded-3xl p-6 backdrop-blur-sm hover:border-border/60 transition-all">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-purple-500/10 rounded-2xl">
                <Image src={THIINGS.brain} alt="sleep" width={24} height={24} unoptimized />
              </div>
              <h3 className="font-bold">Uyku Analizi</h3>
            </div>
            <span className="text-sm font-semibold px-3 py-1.5 bg-purple-500/10 border border-purple-500/20 rounded-xl text-purple-300">
              Ort: <span className="font-black ml-1">{avgSleep}h</span>
            </span>
          </div>

          {sleepData.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-sm">
              Henüz uyku verisi yok. Akıllı saat bağladığında veriler burada görünecek.
            </div>
          ) : (
            <>
              <div className="flex items-end gap-2.5 h-32 mb-6 p-4 bg-muted/10 rounded-2xl">
                {sleepChart.map((day, i) => (
                  <motion.div
                    key={day.day}
                    className="flex-1 flex flex-col items-center gap-2"
                    whileHover={{ scale: 1.1 }}
                  >
                    <span className="text-xs font-bold text-muted-foreground h-5">
                      {day.hours > 0 ? `${day.hours}s` : ''}
                    </span>
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: day.hours > 0 ? `${(day.hours / maxSleep) * 100}%` : '6px' }}
                      transition={{ delay: 0.4 + i * 0.07, duration: 0.7 }}
                      className={`w-full rounded-t-xl transition-all ${
                        day.hours >= 7.5 ? 'bg-gradient-to-t from-purple-500 to-purple-400 shadow-lg shadow-purple-500/30' :
                        day.hours >= 6 ? 'bg-gradient-to-t from-purple-500/70 to-purple-400/50 shadow-lg shadow-purple-500/20' :
                        day.hours > 0 ? 'bg-gradient-to-t from-red-500/60 to-red-400/40' : 'bg-muted/30'
                      }`}
                    />
                    <span className="text-xs font-bold text-muted-foreground">{day.day}</span>
                  </motion.div>
                ))}
              </div>

              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'En Uzun', value: `${Math.max(...sleepData.map(d => d.hours)).toFixed(1)}h`, img: THIINGS.pillow, color: 'text-purple-400', bg: 'from-purple-500/20 to-purple-600/10' },
                  { label: 'En Kısa', value: `${Math.min(...sleepData.map(d => d.hours)).toFixed(1)}h`, img: THIINGS.alarmClock, color: 'text-red-400', bg: 'from-red-500/20 to-red-600/10' },
                  { label: 'Kalite', value: '%82', img: THIINGS.star, color: 'text-yellow-400', bg: 'from-yellow-500/20 to-yellow-600/10' },
                ].map(item => (
                  <motion.div
                    key={item.label}
                    whileHover={{ scale: 1.05, y: -2 }}
                    className={`bg-gradient-to-br ${item.bg} border border-white/10 rounded-2xl p-3 text-center group/stat hover:border-white/20 transition-all`}
                  >
                    <motion.div whileHover={{ scale: 1.2 }} className="mb-2">
                      <Image src={item.img} alt={item.label} width={24} height={24} unoptimized className="mx-auto" />
                    </motion.div>
                    <p className={`text-sm font-black ${item.color}`}>{item.value}</p>
                    <p className="text-xs text-muted-foreground mt-1">{item.label}</p>
                  </motion.div>
                ))}
              </div>
            </>
          )}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="group relative"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity blur-xl" />
        <div className="relative bg-gradient-to-br from-card/80 to-card/40 border border-border/30 rounded-3xl p-6 backdrop-blur-sm hover:border-border/60 transition-all">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-500/10 rounded-2xl">
                <Image src={THIINGS.waterBottle} alt="water" width={24} height={24} unoptimized />
              </div>
              <h3 className="font-bold">Su Tüketimi</h3>
            </div>
            <span className="text-sm font-semibold px-3 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-xl text-blue-300">
              <span className="font-black">{waterLiters}</span> / {waterGoalL} L
            </span>
          </div>

          <div className="mb-5 p-4 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 rounded-2xl">
            <p className="text-xs text-muted-foreground mb-4 uppercase tracking-wider font-semibold">İçilen bardaklar</p>
            <div className="flex gap-2.5 flex-wrap">
              {Array.from({ length: waterGoalGlasses }).map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.4 + i * 0.04 }}
                  whileHover={{ scale: 1.15 }}
                  className={`w-10 h-14 rounded-xl flex items-end justify-center pb-1.5 font-bold text-xs transition-all border ${
                    i < waterGlasses
                      ? 'bg-gradient-to-b from-blue-400 to-blue-500 text-white border-blue-400 shadow-lg shadow-blue-500/30'
                      : 'bg-muted/20 border-border/30 text-muted-foreground hover:border-blue-500/30'
                  }`}
                >
                  <Droplets size={14} />
                </motion.div>
              ))}
            </div>
          </div>

          <p className="text-xs text-muted-foreground mb-5 uppercase tracking-wider">
            Her bardak = 250ml · <span className="font-bold text-foreground">{waterGlasses}/{waterGoalGlasses}</span> bardak içildi
          </p>

          <motion.button
            onClick={handleAddWater}
            disabled={addingWater}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full py-3 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border border-blue-500/30 hover:border-blue-500/60 rounded-2xl text-sm font-bold text-blue-300 transition-all hover:bg-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wider"
          >
            {addingWater ? (
              <span className="flex items-center justify-center gap-2">
                <motion.span animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }} className="inline-block">
                  ⊙
                </motion.span>
                Ekleniyor...
              </span>
            ) : (
              '+ Su Ekle (250ml)'
            )}
          </motion.button>
        </div>
      </motion.div>
    </div>
  )
}
