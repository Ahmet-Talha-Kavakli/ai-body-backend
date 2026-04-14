'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Settings, X, Loader2, Plus, Trash2 } from 'lucide-react'

interface ReminderSettings {
  reminderMode: 'interval' | 'manual'
  reminderIntervalHours: number
  reminderTimes: string[]
}

interface WaterSettingsPanelProps {
  dailyGoalMl: number
  cupSizeMl: number
  reminderMode: 'interval' | 'manual'
  reminderIntervalHours: number
  reminderTimes: string[]
  onSave: (dailyGoalMl: number, cupSizeMl: number, reminder: ReminderSettings) => Promise<void>
}

export function WaterSettingsPanel({
  dailyGoalMl,
  cupSizeMl,
  reminderMode,
  reminderIntervalHours,
  reminderTimes,
  onSave,
}: WaterSettingsPanelProps) {
  const [open, setOpen] = useState(false)
  const [goal, setGoal] = useState(dailyGoalMl)
  const [cup, setCup] = useState(cupSizeMl)
  const [mode, setMode] = useState<'interval' | 'manual'>(reminderMode)
  const [intervalHours, setIntervalHours] = useState(reminderIntervalHours)
  const [times, setTimes] = useState<string[]>(reminderTimes)
  const [newTime, setNewTime] = useState('09:00')
  const [saving, setSaving] = useState(false)

  const addTime = () => {
    if (!times.includes(newTime)) {
      setTimes((prev) => [...prev, newTime].sort())
    }
  }

  const removeTime = (t: string) => setTimes((prev) => prev.filter((x) => x !== t))

  const handleSave = async () => {
    setSaving(true)
    await onSave(goal, cup, {
      reminderMode: mode,
      reminderIntervalHours: intervalHours,
      reminderTimes: times,
    })
    setSaving(false)
    setOpen(false)
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 rounded-xl bg-white/[0.04] px-3 py-2 text-xs text-[#64748B] transition-colors hover:bg-white/[0.08]"
      >
        <Settings size={13} /> Ayarlar
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 backdrop-blur-sm sm:items-center"
            onClick={() => setOpen(false)}
          >
            <motion.div
              initial={{ y: 60, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 60, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              onClick={(e) => e.stopPropagation()}
              className="max-h-[90vh] w-full max-w-sm space-y-5 overflow-y-auto rounded-3xl border border-white/[0.08] bg-[#111118] p-6"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-white">Su Takip Ayarları</h3>
                <button onClick={() => setOpen(false)} className="text-[#64748B] hover:text-white">
                  <X size={18} />
                </button>
              </div>

              {/* Günlük Hedef */}
              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-xs text-[#64748B]">Günlük Hedef (ml)</label>
                  <div className="flex items-center gap-2">
                    {[1500, 2000, 2500, 3000, 3500].map((v) => (
                      <button
                        key={v}
                        onClick={() => setGoal(v)}
                        className={`flex-1 rounded-xl py-2 text-xs font-semibold transition-colors ${
                          goal === v
                            ? 'bg-[#3B82F6] text-white'
                            : 'bg-white/[0.04] text-[#64748B] hover:bg-white/[0.08]'
                        }`}
                      >
                        {v < 1000 ? v : `${v / 1000}L`}
                      </button>
                    ))}
                  </div>
                  <input
                    type="number"
                    value={goal}
                    onChange={(e) => setGoal(Number(e.target.value))}
                    className="mt-2 w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-sm text-white outline-none focus:border-[#3B82F6]/50"
                  />
                </div>

                {/* Bardak Boyutu */}
                <div>
                  <label className="mb-2 block text-xs text-[#64748B]">Bardak Boyutu (ml)</label>
                  <div className="flex items-center gap-2">
                    {[150, 200, 250, 300, 400].map((v) => (
                      <button
                        key={v}
                        onClick={() => setCup(v)}
                        className={`flex-1 rounded-xl py-2 text-xs font-semibold transition-colors ${
                          cup === v
                            ? 'bg-[#3B82F6] text-white'
                            : 'bg-white/[0.04] text-[#64748B] hover:bg-white/[0.08]'
                        }`}
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Hatırlatıcılar */}
                <div>
                  <label className="mb-2 block text-xs text-[#64748B]">Hatırlatıcı Modu</label>
                  <div className="flex gap-2">
                    {(['interval', 'manual'] as const).map((m) => (
                      <button
                        key={m}
                        onClick={() => setMode(m)}
                        className={`flex-1 rounded-xl py-2 text-xs font-semibold transition-colors ${
                          mode === m
                            ? 'bg-[#3B82F6] text-white'
                            : 'bg-white/[0.04] text-[#64748B] hover:bg-white/[0.08]'
                        }`}
                      >
                        {m === 'interval' ? '⏱ Aralıklı' : '🕐 Manuel Saatler'}
                      </button>
                    ))}
                  </div>

                  <AnimatePresence mode="wait">
                    {mode === 'interval' ? (
                      <motion.div
                        key="interval"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-3"
                      >
                        <label className="mb-2 block text-xs text-[#64748B]">
                          Her kaç saatte bir?
                        </label>
                        <div className="flex gap-2">
                          {[1, 2, 3, 4].map((h) => (
                            <button
                              key={h}
                              onClick={() => setIntervalHours(h)}
                              className={`flex-1 rounded-xl py-2 text-xs font-semibold transition-colors ${
                                intervalHours === h
                                  ? 'bg-[#3B82F6] text-white'
                                  : 'bg-white/[0.04] text-[#64748B] hover:bg-white/[0.08]'
                              }`}
                            >
                              {h}s
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="manual"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-3 space-y-2"
                      >
                        <div className="flex gap-2">
                          <input
                            type="time"
                            value={newTime}
                            onChange={(e) => setNewTime(e.target.value)}
                            className="flex-1 rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-sm text-white outline-none focus:border-[#3B82F6]/50"
                          />
                          <button
                            onClick={addTime}
                            className="flex items-center gap-1 rounded-xl bg-[#3B82F6]/20 px-3 py-2 text-xs text-[#3B82F6] hover:bg-[#3B82F6]/30"
                          >
                            <Plus size={14} /> Ekle
                          </button>
                        </div>
                        <div className="space-y-1">
                          {times.map((t) => (
                            <div
                              key={t}
                              className="flex items-center justify-between rounded-xl bg-white/[0.03] px-3 py-2"
                            >
                              <span className="text-sm text-white">{t}</span>
                              <button
                                onClick={() => removeTime(t)}
                                className="text-red-400/60 hover:text-red-400"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          ))}
                          {times.length === 0 && (
                            <p className="text-center text-xs text-[#64748B]">
                              Henüz saat eklenmedi
                            </p>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              <button
                onClick={handleSave}
                disabled={saving}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#3B82F6] py-3 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {saving && <Loader2 size={14} className="animate-spin" />}
                Kaydet
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
