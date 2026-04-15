'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Moon, Plus, X, Star } from 'lucide-react'

interface SleepRecord {
  id: string
  duration: number // minutes
  quality: number // 0-100
  recordedAt: string
}

function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = Math.round(minutes % 60)
  if (m === 0) return `${h}s`
  return `${h}s ${m}dk`
}

function qualityLabel(q: number): string {
  if (q >= 80) return 'Mükemmel'
  if (q >= 60) return 'İyi'
  if (q >= 40) return 'Orta'
  return 'Kötü'
}

function qualityColor(q: number): string {
  if (q >= 80) return 'text-green-400'
  if (q >= 60) return 'text-blue-400'
  if (q >= 40) return 'text-amber-400'
  return 'text-red-400'
}

function dayLabel(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('tr-TR', { weekday: 'short', day: 'numeric' })
}

export default function SleepPage() {
  const [records, setRecords] = useState<SleepRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState({
    bedtime: '',
    wakeTime: '',
    quality: 7,
  })

  const fetchRecords = useCallback(async () => {
    const res = await fetch('/api/tracking/sleep').then((r) => r.json())
    setRecords(res.records ?? [])
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchRecords()
  }, [fetchRecords])

  const handleAdd = async () => {
    if (!form.bedtime || !form.wakeTime) return
    setSaving(true)
    await fetch('/api/tracking/sleep', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    setForm({ bedtime: '', wakeTime: '', quality: 7 })
    setShowModal(false)
    setSaving(false)
    fetchRecords()
  }

  const lastRecord = records[0]
  const avgDuration =
    records.length > 0 ? records.reduce((s, r) => s + r.duration, 0) / records.length : 0
  const avgQuality =
    records.length > 0 ? records.reduce((s, r) => s + r.quality, 0) / records.length : 0

  // Son 7 günlük chart için veri (en eski → en yeni)
  const chartData = [...records].reverse().slice(-7)
  const maxDuration = Math.max(...chartData.map((r) => r.duration), 480)

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Başlık */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Moon size={22} className="text-purple-400" />
          <h1 className="text-2xl font-black text-white">Uyku</h1>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 rounded-xl border border-purple-500/30 bg-purple-500/20 px-3 py-2 text-sm font-semibold text-purple-400 transition-colors hover:bg-purple-500/30"
        >
          <Plus size={16} />
          Ekle
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-7 w-7 animate-spin rounded-full border-2 border-purple-500 border-t-transparent" />
        </div>
      ) : (
        <>
          {/* Son Gece Özet */}
          {lastRecord ? (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-3xl border border-purple-500/20 bg-gradient-to-br from-purple-500/20 to-violet-500/10 p-5"
            >
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-purple-400/70">
                Son Gece
              </p>
              <div className="flex items-end gap-6">
                <div>
                  <p className="text-4xl font-black text-white">
                    {formatDuration(lastRecord.duration)}
                  </p>
                  <p className="mt-1 text-sm text-white/50">toplam uyku</p>
                </div>
                <div>
                  <p className={`text-2xl font-black ${qualityColor(lastRecord.quality)}`}>
                    {qualityLabel(lastRecord.quality)}
                  </p>
                  <p className="mt-1 text-sm text-white/50">kalite</p>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-1">
                {Array.from({ length: 10 }).map((_, i) => (
                  <Star
                    key={i}
                    size={12}
                    className={
                      i < Math.round(lastRecord.quality / 10)
                        ? 'fill-purple-400 text-purple-400'
                        : 'text-white/10'
                    }
                  />
                ))}
              </div>
            </motion.div>
          ) : (
            <div className="py-12 text-center text-white/30">
              <Moon size={40} className="mx-auto mb-3 opacity-30" />
              <p>Henüz uyku kaydı yok</p>
              <p className="mt-1 text-sm">İlk kaydını ekle</p>
            </div>
          )}

          {/* Haftalık Ortalamalar */}
          {records.length > 0 && (
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-4 text-center">
                <p className="text-xl font-black text-purple-400">{formatDuration(avgDuration)}</p>
                <p className="mt-1 text-xs text-white/50">Haftalık Ortalama</p>
              </div>
              <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-4 text-center">
                <p className={`text-xl font-black ${qualityColor(avgQuality)}`}>
                  {qualityLabel(avgQuality)}
                </p>
                <p className="mt-1 text-xs text-white/50">Ortalama Kalite</p>
              </div>
            </div>
          )}

          {/* Haftalık Bar Chart */}
          {chartData.length > 1 && (
            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-4">
              <p className="mb-4 text-sm font-semibold text-white/60">Son 7 Gün</p>
              <div className="flex h-28 items-end gap-2">
                {chartData.map((r, i) => {
                  const height = maxDuration > 0 ? (r.duration / maxDuration) * 100 : 0
                  return (
                    <div key={r.id} className="flex flex-1 flex-col items-center gap-1">
                      <motion.div
                        initial={{ scaleY: 0 }}
                        animate={{ scaleY: 1 }}
                        transition={{ delay: i * 0.05, duration: 0.4, ease: 'easeOut' }}
                        style={{ height: `${height}%`, originY: 1 }}
                        className="min-h-[4px] w-full rounded-t-lg bg-gradient-to-t from-purple-600 to-violet-400"
                      />
                      <p className="w-full truncate text-center text-[9px] text-white/30">
                        {dayLabel(r.recordedAt)}
                      </p>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Kayıt Listesi */}
          {records.length > 0 && (
            <div className="space-y-2">
              <p className="px-1 text-sm font-semibold text-white/50">Geçmiş</p>
              {records.slice(0, 7).map((r, i) => (
                <motion.div
                  key={r.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="flex items-center gap-3 rounded-2xl border border-white/[0.05] bg-white/[0.02] p-3"
                >
                  <Moon size={16} className="shrink-0 text-purple-400/60" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-white">{formatDuration(r.duration)}</p>
                    <p className="text-xs text-white/40">{dayLabel(r.recordedAt)}</p>
                  </div>
                  <span className={`text-sm font-semibold ${qualityColor(r.quality)}`}>
                    {qualityLabel(r.quality)}
                  </span>
                </motion.div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4 backdrop-blur-sm"
            onClick={(e) => {
              if (e.target === e.currentTarget) setShowModal(false)
            }}
          >
            <motion.div
              initial={{ y: 60, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 60, opacity: 0 }}
              className="w-full max-w-md space-y-4 rounded-3xl border border-white/10 bg-[#0f172a] p-6"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-white">Uyku Ekle</h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-white/40 hover:text-white"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="mb-1 block text-xs text-white/50">Yatış Saati</label>
                  <input
                    type="datetime-local"
                    value={form.bedtime}
                    onChange={(e) => setForm((f) => ({ ...f, bedtime: e.target.value }))}
                    className="w-full rounded-xl border border-white/10 bg-white/[0.05] px-4 py-3 text-sm text-white focus:border-purple-500/50 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs text-white/50">Kalkış Saati</label>
                  <input
                    type="datetime-local"
                    value={form.wakeTime}
                    onChange={(e) => setForm((f) => ({ ...f, wakeTime: e.target.value }))}
                    className="w-full rounded-xl border border-white/10 bg-white/[0.05] px-4 py-3 text-sm text-white focus:border-purple-500/50 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs text-white/50">
                    Uyku Kalitesi:{' '}
                    <span className="font-bold text-purple-400">{form.quality}/10</span>
                  </label>
                  <input
                    type="range"
                    min={1}
                    max={10}
                    value={form.quality}
                    onChange={(e) => setForm((f) => ({ ...f, quality: Number(e.target.value) }))}
                    className="w-full accent-purple-500"
                  />
                  <div className="mt-1 flex justify-between text-xs text-white/30">
                    <span>Kötü</span>
                    <span>Orta</span>
                    <span>Mükemmel</span>
                  </div>
                </div>
              </div>

              <button
                onClick={handleAdd}
                disabled={!form.bedtime || !form.wakeTime || saving}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-purple-500 to-violet-500 py-3 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-40"
              >
                {saving && (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                )}
                Kaydet
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
