'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Pill, Plus, Check, X, SkipForward } from 'lucide-react'

interface Medication {
  id: string
  name: string
  dosage: string
  frequency: string
  reminderAt?: string
  takenToday: boolean
  skippedToday: boolean
}

const FREQUENCY_LABELS: Record<string, string> = {
  daily: 'Günlük',
  twice_daily: 'Günde 2x',
  three_times_daily: 'Günde 3x',
  weekly: 'Haftalık',
  as_needed: 'Gerektiğinde',
}

export default function MedicationsPage() {
  const [medications, setMedications] = useState<Medication[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [acting, setActing] = useState<string | null>(null)

  const [form, setForm] = useState({
    name: '',
    dosage: '',
    frequency: 'daily',
    reminderAt: '',
  })

  const fetchMedications = useCallback(async () => {
    const res = await fetch('/api/tracking/medications').then((r) => r.json())
    setMedications(Array.isArray(res) ? res : [])
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchMedications()
  }, [fetchMedications])

  const handleAction = async (id: string, skipped = false) => {
    setActing(id)
    await fetch('/api/tracking/medications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ medicationId: id, skipped }),
    })
    setMedications((prev) =>
      prev.map((m) => (m.id === id ? { ...m, takenToday: !skipped, skippedToday: skipped } : m))
    )
    setActing(null)
  }

  const handleAdd = async () => {
    if (!form.name || !form.dosage) return
    await fetch('/api/tracking/medications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: form.name,
        dosage: form.dosage,
        frequency: form.frequency,
        reminderAt: form.reminderAt || undefined,
      }),
    })
    setForm({ name: '', dosage: '', frequency: 'daily', reminderAt: '' })
    setShowModal(false)
    fetchMedications()
  }

  const takenCount = medications.filter((m) => m.takenToday).length
  const skippedCount = medications.filter((m) => m.skippedToday).length
  const pendingCount = medications.filter((m) => !m.takenToday && !m.skippedToday).length

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Başlık */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Pill size={22} className="text-red-400" />
          <h1 className="text-2xl font-black text-white">İlaçlar</h1>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 rounded-xl border border-red-500/30 bg-red-500/20 px-3 py-2 text-sm font-semibold text-red-400 transition-colors hover:bg-red-500/30"
        >
          <Plus size={16} />
          Ekle
        </button>
      </div>

      {/* Özet */}
      {medications.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-2xl border border-green-500/20 bg-green-500/10 p-3 text-center">
            <p className="text-xl font-black text-green-400">{takenCount}</p>
            <p className="mt-0.5 text-xs text-white/50">Alındı</p>
          </div>
          <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-3 text-center">
            <p className="text-xl font-black text-red-400">{skippedCount}</p>
            <p className="mt-0.5 text-xs text-white/50">Atlandı</p>
          </div>
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-3 text-center">
            <p className="text-xl font-black text-white/60">{pendingCount}</p>
            <p className="mt-0.5 text-xs text-white/50">Bekliyor</p>
          </div>
        </div>
      )}

      {/* Liste */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-7 w-7 animate-spin rounded-full border-2 border-red-500 border-t-transparent" />
        </div>
      ) : medications.length === 0 ? (
        <div className="py-16 text-center text-white/30">
          <Pill size={40} className="mx-auto mb-3 opacity-30" />
          <p>Henüz ilaç eklenmedi</p>
          <p className="mt-1 text-sm">Yukarıdaki Ekle butonuna tıkla</p>
        </div>
      ) : (
        <div className="space-y-3">
          {medications.map((m, i) => (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`rounded-2xl border p-4 transition-all ${
                m.takenToday
                  ? 'border-green-500/30 bg-green-500/10'
                  : m.skippedToday
                    ? 'border-white/[0.06] bg-white/[0.02] opacity-60'
                    : 'border-white/[0.06] bg-white/[0.03]'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p
                      className={`font-bold ${m.takenToday ? 'text-green-400' : m.skippedToday ? 'text-white/40 line-through' : 'text-white'}`}
                    >
                      {m.name}
                    </p>
                    <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs font-medium text-white/50">
                      {FREQUENCY_LABELS[m.frequency] ?? m.frequency}
                    </span>
                  </div>
                  <p className="mt-0.5 text-sm text-white/50">{m.dosage}</p>
                  {m.reminderAt && (
                    <p className="mt-1 text-xs text-white/30">Hatırlatıcı: {m.reminderAt}</p>
                  )}
                </div>

                {m.takenToday ? (
                  <div className="flex shrink-0 items-center gap-1.5 rounded-xl bg-green-500/20 px-3 py-2 text-sm font-semibold text-green-400">
                    <Check size={14} />
                    Alındı
                  </div>
                ) : m.skippedToday ? (
                  <div className="shrink-0 rounded-xl bg-white/10 px-3 py-2 text-sm font-semibold text-white/40">
                    Atlandı
                  </div>
                ) : (
                  <div className="flex shrink-0 gap-2">
                    <button
                      onClick={() => handleAction(m.id, true)}
                      disabled={acting === m.id}
                      className="rounded-xl border border-white/10 bg-white/[0.05] p-2 text-white/50 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-40"
                      title="Atla"
                    >
                      <SkipForward size={14} />
                    </button>
                    <button
                      onClick={() => handleAction(m.id, false)}
                      disabled={acting === m.id}
                      className="flex items-center gap-1.5 rounded-xl border border-red-500/30 bg-red-500/20 px-3 py-2 text-sm font-bold text-red-400 transition-colors hover:bg-red-500/30 disabled:opacity-40"
                    >
                      {acting === m.id ? (
                        <div className="h-3.5 w-3.5 animate-spin rounded-full border border-red-400 border-t-transparent" />
                      ) : (
                        <Check size={14} />
                      )}
                      Aldım
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
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
                <h2 className="text-lg font-bold text-white">İlaç Ekle</h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-white/40 hover:text-white"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="mb-1 block text-xs text-white/50">İlaç Adı</label>
                  <input
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    placeholder="Örn: Metformin, Aspirin..."
                    className="w-full rounded-xl border border-white/10 bg-white/[0.05] px-4 py-3 text-sm text-white placeholder:text-white/30 focus:border-red-500/50 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs text-white/50">Dozaj</label>
                  <input
                    value={form.dosage}
                    onChange={(e) => setForm((f) => ({ ...f, dosage: e.target.value }))}
                    placeholder="Örn: 500mg, 1 tablet"
                    className="w-full rounded-xl border border-white/10 bg-white/[0.05] px-4 py-3 text-sm text-white placeholder:text-white/30 focus:border-red-500/50 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs text-white/50">Kullanım Sıklığı</label>
                  <select
                    value={form.frequency}
                    onChange={(e) => setForm((f) => ({ ...f, frequency: e.target.value }))}
                    className="w-full rounded-xl border border-white/10 bg-white/[0.05] px-4 py-3 text-sm text-white focus:border-red-500/50 focus:outline-none"
                  >
                    <option value="daily">Günlük</option>
                    <option value="twice_daily">Günde 2x</option>
                    <option value="three_times_daily">Günde 3x</option>
                    <option value="weekly">Haftalık</option>
                    <option value="as_needed">Gerektiğinde</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-xs text-white/50">
                    Hatırlatıcı Saati (isteğe bağlı)
                  </label>
                  <input
                    type="time"
                    value={form.reminderAt}
                    onChange={(e) => setForm((f) => ({ ...f, reminderAt: e.target.value }))}
                    className="w-full rounded-xl border border-white/10 bg-white/[0.05] px-4 py-3 text-sm text-white focus:border-red-500/50 focus:outline-none"
                  />
                </div>
              </div>

              <button
                onClick={handleAdd}
                disabled={!form.name || !form.dosage}
                className="w-full rounded-2xl bg-gradient-to-r from-red-500 to-rose-500 py-3 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-40"
              >
                Kaydet
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
