'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Heart, Activity, Thermometer, Droplets, Scale, Brain, Zap, Plus, X } from 'lucide-react'

const METRIC_TYPES = [
  {
    id: 'blood_pressure',
    label: 'Tansiyon',
    icon: Activity,
    color: 'text-red-400',
    bg: 'bg-red-500/10',
    border: 'border-red-500/20',
    unit: 'mmHg',
    fields: [
      { key: 'value', label: 'Sistolik', placeholder: '120' },
      { key: 'value2', label: 'Diyastolik', placeholder: '80' },
    ],
    format: (v: number, v2?: number | null) => `${v}/${v2 ?? '?'} mmHg`,
    normal: '< 120/80',
  },
  {
    id: 'heart_rate',
    label: 'Nabız',
    icon: Heart,
    color: 'text-pink-400',
    bg: 'bg-pink-500/10',
    border: 'border-pink-500/20',
    unit: 'bpm',
    fields: [{ key: 'value', label: 'Nabız', placeholder: '72' }],
    format: (v: number) => `${v} bpm`,
    normal: '60–100',
  },
  {
    id: 'blood_glucose',
    label: 'Kan Şekeri',
    icon: Droplets,
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/20',
    unit: 'mg/dL',
    fields: [{ key: 'value', label: 'Değer', placeholder: '100' }],
    format: (v: number) => `${v} mg/dL`,
    normal: '70–100',
  },
  {
    id: 'temperature',
    label: 'Ateş',
    icon: Thermometer,
    color: 'text-orange-400',
    bg: 'bg-orange-500/10',
    border: 'border-orange-500/20',
    unit: '°C',
    fields: [{ key: 'value', label: 'Derece', placeholder: '36.6' }],
    format: (v: number) => `${v}°C`,
    normal: '36.1–37.2',
  },
  {
    id: 'body_fat',
    label: 'Vücut Yağı',
    icon: Scale,
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/20',
    unit: '%',
    fields: [{ key: 'value', label: 'Yüzde', placeholder: '20' }],
    format: (v: number) => `%${v}`,
    normal: '8–24%',
  },
  {
    id: 'mood',
    label: 'Ruh Hali',
    icon: Brain,
    color: 'text-purple-400',
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/20',
    unit: '/10',
    fields: [{ key: 'value', label: 'Puan (1-10)', placeholder: '7' }],
    format: (v: number) => `${v}/10`,
    normal: '7–10',
  },
  {
    id: 'energy',
    label: 'Enerji',
    icon: Zap,
    color: 'text-green-400',
    bg: 'bg-green-500/10',
    border: 'border-green-500/20',
    unit: '/10',
    fields: [{ key: 'value', label: 'Puan (1-10)', placeholder: '8' }],
    format: (v: number) => `${v}/10`,
    normal: '7–10',
  },
] as const

type MetricTypeId = (typeof METRIC_TYPES)[number]['id']

interface MetricLog {
  id: string
  type: string
  value: number
  value2: number | null
  unit: string
  recordedAt: string
}

export default function HealthMetricsPage() {
  const [logs, setLogs] = useState<MetricLog[]>([])
  const [loading, setLoading] = useState(true)
  const [addingType, setAddingType] = useState<MetricTypeId | null>(null)
  const [form, setForm] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)

  const fetchLogs = useCallback(async () => {
    try {
      const res = await fetch('/api/health-metrics')
      if (res.ok) setLogs(await res.json())
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchLogs()
  }, [fetchLogs])

  const openAdd = useCallback((type: MetricTypeId) => {
    setAddingType(type)
    setForm({})
  }, [])

  const closeAdd = useCallback(() => {
    setAddingType(null)
    setForm({})
  }, [])

  const submit = useCallback(async () => {
    if (!addingType) return
    const def = METRIC_TYPES.find((m) => m.id === addingType)
    if (!def || !form.value) return

    setSubmitting(true)
    try {
      await fetch('/api/health-metrics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: addingType,
          value: parseFloat(form.value),
          value2: form.value2 ? parseFloat(form.value2) : undefined,
          unit: def.unit,
        }),
      })
      closeAdd()
      await fetchLogs()
    } finally {
      setSubmitting(false)
    }
  }, [addingType, form, closeAdd, fetchLogs])

  const latestByType = useCallback((type: string) => logs.find((l) => l.type === type), [logs])

  const activeDef = addingType ? METRIC_TYPES.find((m) => m.id === addingType) : null

  return (
    <div className="mx-auto max-w-2xl space-y-4 pb-24">
      {/* Header */}
      <div>
        <h1 className="text-xl font-black text-white">Sağlık Takibi</h1>
        <p className="text-xs text-white/40">Vücut metriklerini takip et ve analiz et</p>
      </div>

      {/* Metric widgets grid */}
      <div className="grid grid-cols-2 gap-3">
        {METRIC_TYPES.map((metric, i) => {
          const latest = latestByType(metric.id)
          const Icon = metric.icon
          return (
            <motion.button
              key={metric.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => openAdd(metric.id)}
              className={`w-full rounded-2xl border ${metric.border} ${metric.bg} p-4 text-left`}
            >
              <div className="mb-2 flex items-center justify-between">
                <Icon size={18} className={metric.color} />
                <Plus size={14} className="text-white/20" />
              </div>
              <p className="text-xs font-medium text-white/50">{metric.label}</p>
              <p className={`text-lg font-black ${latest ? 'text-white' : 'text-white/20'}`}>
                {latest ? metric.format(latest.value, latest.value2) : '—'}
              </p>
              {latest && (
                <p className="mt-0.5 text-[10px] text-white/30">
                  {new Date(latest.recordedAt).toLocaleDateString('tr-TR', {
                    day: '2-digit',
                    month: '2-digit',
                  })}
                </p>
              )}
              <p className="mt-1 text-[10px] text-white/20">Normal: {metric.normal}</p>
            </motion.button>
          )
        })}
      </div>

      {/* Recent logs */}
      {!loading && logs.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card rounded-3xl p-4"
        >
          <p className="mb-3 text-sm font-semibold text-white/50">Son Ölçümler</p>
          <div className="space-y-2">
            {logs.slice(0, 10).map((log) => {
              const def = METRIC_TYPES.find((m) => m.id === log.type)
              if (!def) return null
              const Icon = def.icon
              return (
                <div
                  key={log.id}
                  className="bg-white/3 flex items-center gap-3 rounded-xl px-3 py-2"
                >
                  <Icon size={14} className={def.color} />
                  <span className="flex-1 text-sm text-white/60">{def.label}</span>
                  <span className="text-sm font-bold text-white">
                    {def.format(log.value, log.value2)}
                  </span>
                  <span className="text-xs text-white/30">
                    {new Date(log.recordedAt).toLocaleDateString('tr-TR', {
                      day: '2-digit',
                      month: '2-digit',
                    })}
                  </span>
                </div>
              )
            })}
          </div>
        </motion.div>
      )}

      {loading && (
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-2xl bg-white/5" />
          ))}
        </div>
      )}

      {/* Add metric modal */}
      <AnimatePresence>
        {addingType && activeDef && (
          <motion.div
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeAdd}
          >
            <motion.div
              className="w-full max-w-lg rounded-t-3xl border-t border-white/10 bg-[#0a0f1e] p-6 pb-10"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`rounded-xl p-2 ${activeDef.bg}`}>
                    <activeDef.icon size={20} className={activeDef.color} />
                  </div>
                  <h3 className="text-lg font-bold text-white">{activeDef.label} Ekle</h3>
                </div>
                <button onClick={closeAdd}>
                  <X size={20} className="text-white/40" />
                </button>
              </div>

              <div className="space-y-3">
                {activeDef.fields.map((field) => (
                  <div key={field.key}>
                    <label className="mb-1 block text-xs text-white/50">{field.label}</label>
                    <input
                      type="number"
                      step="0.1"
                      placeholder={field.placeholder}
                      value={form[field.key] ?? ''}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, [field.key]: e.target.value }))
                      }
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-lg font-bold text-white placeholder-white/20 outline-none focus:border-indigo-500/50"
                    />
                  </div>
                ))}

                <p className="text-xs text-white/30">Normal aralık: {activeDef.normal}</p>

                <button
                  onClick={submit}
                  disabled={!form.value || submitting}
                  className="w-full rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 py-3 font-bold text-white disabled:opacity-50"
                >
                  {submitting ? 'Kaydediliyor...' : 'Kaydet'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
