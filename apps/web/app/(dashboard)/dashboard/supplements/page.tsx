'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Dumbbell, Plus, Check, X } from 'lucide-react'

interface Supplement {
  id: string
  name: string
  dosage: string
  unit: string
  timing: string
  takenToday: boolean
}

const TIMING_LABELS: Record<string, string> = {
  morning: 'Sabah',
  afternoon: 'Öğle',
  evening: 'Akşam',
  night: 'Gece',
  pre_workout: 'Antrenman Öncesi',
  post_workout: 'Antrenman Sonrası',
}

const TIMING_COLORS: Record<string, string> = {
  morning: 'bg-amber-500/20 text-amber-400',
  afternoon: 'bg-orange-500/20 text-orange-400',
  evening: 'bg-purple-500/20 text-purple-400',
  night: 'bg-indigo-500/20 text-indigo-400',
  pre_workout: 'bg-green-500/20 text-green-400',
  post_workout: 'bg-blue-500/20 text-blue-400',
}

export default function SupplementsPage() {
  const [supplements, setSupplements] = useState<Supplement[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [taking, setTaking] = useState<string | null>(null)

  const [form, setForm] = useState({
    name: '',
    dosage: '',
    unit: 'mg',
    timing: 'morning',
  })

  const fetchSupplements = useCallback(async () => {
    const res = await fetch('/api/tracking/supplements').then((r) => r.json())
    setSupplements(Array.isArray(res) ? res : [])
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchSupplements()
  }, [fetchSupplements])

  const handleTake = async (id: string) => {
    setTaking(id)
    await fetch('/api/tracking/supplements', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ supplementId: id }),
    })
    setSupplements((prev) => prev.map((s) => (s.id === id ? { ...s, takenToday: true } : s)))
    setTaking(null)
  }

  const handleAdd = async () => {
    if (!form.name || !form.dosage) return
    await fetch('/api/tracking/supplements', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    setForm({ name: '', dosage: '', unit: 'mg', timing: 'morning' })
    setShowModal(false)
    fetchSupplements()
  }

  const takenCount = supplements.filter((s) => s.takenToday).length

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Başlık */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Dumbbell size={22} className="text-green-400" />
          <h1 className="text-2xl font-black text-white">Supplement & Vitamin</h1>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 rounded-xl border border-green-500/30 bg-green-500/20 px-3 py-2 text-sm font-semibold text-green-400 transition-colors hover:bg-green-500/30"
        >
          <Plus size={16} />
          Ekle
        </button>
      </div>

      {/* Özet */}
      {supplements.length > 0 && (
        <div className="flex items-center gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.03] p-4">
          <div className="flex-1">
            <p className="text-lg font-bold text-white">
              {takenCount}/{supplements.length}
            </p>
            <p className="text-xs text-white/50">bugün alındı</p>
          </div>
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-green-500 to-emerald-400 transition-all duration-500"
              style={{
                width:
                  supplements.length > 0 ? `${(takenCount / supplements.length) * 100}%` : '0%',
              }}
            />
          </div>
        </div>
      )}

      {/* Liste */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-7 w-7 animate-spin rounded-full border-2 border-green-500 border-t-transparent" />
        </div>
      ) : supplements.length === 0 ? (
        <div className="py-16 text-center text-white/30">
          <Dumbbell size={40} className="mx-auto mb-3 opacity-30" />
          <p>Henüz supplement eklenmedi</p>
          <p className="mt-1 text-sm">Yukarıdaki Ekle butonuna tıkla</p>
        </div>
      ) : (
        <div className="space-y-3">
          {supplements.map((s, i) => (
            <motion.div
              key={s.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`flex items-center gap-4 rounded-2xl border p-4 transition-all ${
                s.takenToday
                  ? 'border-green-500/30 bg-green-500/10'
                  : 'border-white/[0.06] bg-white/[0.03]'
              }`}
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className={`font-bold ${s.takenToday ? 'text-green-400' : 'text-white'}`}>
                    {s.name}
                  </p>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${TIMING_COLORS[s.timing] ?? 'bg-white/10 text-white/50'}`}
                  >
                    {TIMING_LABELS[s.timing] ?? s.timing}
                  </span>
                </div>
                <p className="mt-0.5 text-sm text-white/50">
                  {s.dosage} {s.unit}
                </p>
              </div>

              {s.takenToday ? (
                <div className="flex items-center gap-1.5 rounded-xl bg-green-500/20 px-3 py-2 text-sm font-semibold text-green-400">
                  <Check size={15} />
                  Alındı
                </div>
              ) : (
                <button
                  onClick={() => handleTake(s.id)}
                  disabled={taking === s.id}
                  className="flex items-center gap-1.5 rounded-xl border border-green-500/30 bg-green-500/20 px-3 py-2 text-sm font-semibold text-green-400 transition-colors hover:bg-green-500/30 disabled:opacity-50"
                >
                  {taking === s.id ? (
                    <div className="h-3.5 w-3.5 animate-spin rounded-full border border-green-400 border-t-transparent" />
                  ) : (
                    <Check size={15} />
                  )}
                  Aldım
                </button>
              )}
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
                <h2 className="text-lg font-bold text-white">Supplement Ekle</h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-white/40 hover:text-white"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="mb-1 block text-xs text-white/50">İsim</label>
                  <input
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    placeholder="Örn: Omega-3, Vitamin D3..."
                    className="w-full rounded-xl border border-white/10 bg-white/[0.05] px-4 py-3 text-sm text-white placeholder:text-white/30 focus:border-green-500/50 focus:outline-none"
                  />
                </div>

                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="mb-1 block text-xs text-white/50">Doz</label>
                    <input
                      value={form.dosage}
                      onChange={(e) => setForm((f) => ({ ...f, dosage: e.target.value }))}
                      placeholder="1000"
                      className="w-full rounded-xl border border-white/10 bg-white/[0.05] px-4 py-3 text-sm text-white placeholder:text-white/30 focus:border-green-500/50 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-white/50">Birim</label>
                    <select
                      value={form.unit}
                      onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))}
                      className="rounded-xl border border-white/10 bg-white/[0.05] px-3 py-3 text-sm text-white focus:border-green-500/50 focus:outline-none"
                    >
                      <option value="mg">mg</option>
                      <option value="mcg">mcg</option>
                      <option value="g">g</option>
                      <option value="IU">IU</option>
                      <option value="ml">ml</option>
                      <option value="tablet">tablet</option>
                      <option value="kapsül">kapsül</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-xs text-white/50">Zamanlama</label>
                  <select
                    value={form.timing}
                    onChange={(e) => setForm((f) => ({ ...f, timing: e.target.value }))}
                    className="w-full rounded-xl border border-white/10 bg-white/[0.05] px-4 py-3 text-sm text-white focus:border-green-500/50 focus:outline-none"
                  >
                    <option value="morning">Sabah</option>
                    <option value="afternoon">Öğle</option>
                    <option value="evening">Akşam</option>
                    <option value="night">Gece</option>
                    <option value="pre_workout">Antrenman Öncesi</option>
                    <option value="post_workout">Antrenman Sonrası</option>
                  </select>
                </div>
              </div>

              <button
                onClick={handleAdd}
                disabled={!form.name || !form.dosage}
                className="w-full rounded-2xl bg-gradient-to-r from-green-500 to-emerald-500 py-3 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-40"
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
