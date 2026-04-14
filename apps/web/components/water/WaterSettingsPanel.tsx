'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Settings, X, Loader2 } from 'lucide-react'

interface WaterSettingsPanelProps {
  dailyGoalMl: number
  cupSizeMl: number
  onSave: (dailyGoalMl: number, cupSizeMl: number) => Promise<void>
}

export function WaterSettingsPanel({ dailyGoalMl, cupSizeMl, onSave }: WaterSettingsPanelProps) {
  const [open, setOpen] = useState(false)
  const [goal, setGoal] = useState(dailyGoalMl)
  const [cup, setCup] = useState(cupSizeMl)
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    await onSave(goal, cup)
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
              className="w-full max-w-sm space-y-5 rounded-3xl border border-white/[0.08] bg-[#111118] p-6"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-white">Su Takip Ayarları</h3>
                <button onClick={() => setOpen(false)} className="text-[#64748B] hover:text-white">
                  <X size={18} />
                </button>
              </div>

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
