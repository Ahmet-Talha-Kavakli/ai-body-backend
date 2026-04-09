'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import {
  Play, CheckCircle, Clock, Flame, Dumbbell, ChevronRight,
  Sparkles, Loader2, AlertCircle, RotateCcw, Calendar
} from 'lucide-react'
import Image from 'next/image'
import { THIINGS } from '@/lib/thiings'

interface ProgramDay {
  dayNumber: number
  name: string
  estimatedDurationMinutes: number
  exercises: {
    order: number
    sets: number
    reps: number | null
    durationSeconds: number | null
    restSeconds: number
    exercise: { name: string; muscleGroups: string[]; difficultyLevel: string }
  }[]
}

interface Program {
  id: string
  name: string
  description: string
  generatedByAi: boolean
  isActive: boolean
  createdAt: string
  weeks: { weekNumber: number; days: ProgramDay[] }[]
}

const DAY_NAMES = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar']

interface SessionRecord {
  id: string
  startedAt: string
  endedAt: string | null
  durationSeconds: number | null
  caloriesBurned: number | null
  overallFormScore: number | null
  notes: string | null
}

export default function WorkoutsPage() {
  const [activeTab, setActiveTab] = useState<'plan' | 'history'>('plan')
  const [program, setProgram] = useState<Program | null>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState('')
  const [expandedDay, setExpandedDay] = useState<number | null>(null)
  const [history, setHistory] = useState<SessionRecord[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)

  const today = new Date().getDay() // 0=Pazar, 1=Pzt...
  const todayIdx = today === 0 ? 6 : today - 1 // 0=Pzt

  useEffect(() => {
    fetchProgram()
  }, [])

  useEffect(() => {
    if (activeTab === 'history' && history.length === 0) {
      fetchHistory()
    }
  }, [activeTab])

  const fetchHistory = async () => {
    setHistoryLoading(true)
    try {
      const res = await fetch('/api/sessions')
      const data = await res.json()
      setHistory(data.sessions ?? [])
    } catch {
      // ignore
    } finally {
      setHistoryLoading(false)
    }
  }

  const fetchProgram = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/dashboard/program')
      const data = await res.json()
      setProgram(data.program ?? null)
    } catch {
      setError('Program yüklenemedi')
    } finally {
      setLoading(false)
    }
  }

  const generateProgram = async () => {
    setGenerating(true)
    setError('')
    try {
      const res = await fetch('/api/ai/generate-program', { method: 'POST' })
      if (!res.ok) throw new Error()
      await fetchProgram()
    } catch {
      setError('Program oluşturulamadı. Önce onboarding tamamla.')
    } finally {
      setGenerating(false)
    }
  }

  // Program var ama hafta yapısı yoksa (sadece AI JSON)
  const days = program?.weeks?.[0]?.days ?? []

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Başlık */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-start justify-between flex-wrap gap-3"
      >
        <div className="flex items-center gap-3">
          <Image src={THIINGS.dumbbell} alt="dumbbell" width={44} height={44} unoptimized className="drop-shadow-lg" />
          <h1 className="text-3xl font-black mb-1">Egzersiz Planım</h1>
          <p className="text-muted-foreground">
            {program
              ? `${program.name}${program.generatedByAi ? ' · AI tarafından oluşturuldu' : ''}`
              : 'Kişiselleştirilmiş antrenman programın'}
          </p>
        </div>
        <button
          onClick={generateProgram}
          disabled={generating}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:opacity-60 text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-blue-500/20"
        >
          {generating
            ? <><Loader2 size={14} className="animate-spin" /> Oluşturuluyor...</>
            : <><Sparkles size={14} /> {program ? 'Yeniden Oluştur' : 'AI Program Oluştur'}</>
          }
        </button>
      </motion.div>

      {/* Hata */}
      {error && (
        <div className="flex items-center gap-2 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-muted/30 p-1 rounded-xl w-fit">
        {(['plan', 'history'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-2 rounded-lg text-sm font-semibold transition-colors ${
              activeTab === tab ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab === 'plan' ? 'Bu Hafta' : 'Geçmiş'}
          </button>
        ))}
      </div>

      {/* Plan tab */}
      {activeTab === 'plan' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          {loading ? (
            <div className="space-y-3">
              {[...Array(7)].map((_, i) => (
                <div key={i} className="h-16 bg-card/30 border border-border/20 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : !program ? (
            /* Program yok — oluştur çağrısı */
            <div className="text-center py-16 bg-card/30 border border-dashed border-border/40 rounded-2xl">
              <Sparkles size={40} className="text-blue-400 mx-auto mb-4" />
              <h3 className="font-bold text-lg mb-2">Henüz programın yok</h3>
              <p className="text-muted-foreground text-sm mb-6 max-w-xs mx-auto">
                AI koçun, onboarding bilgilerini kullanarak sana özel bir haftalık program oluşturacak.
              </p>
              <button
                onClick={generateProgram}
                disabled={generating}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-sm flex items-center gap-2 mx-auto transition-colors"
              >
                {generating
                  ? <><Loader2 size={14} className="animate-spin" /> Oluşturuluyor...</>
                  : <><Sparkles size={14} /> Program Oluştur</>
                }
              </button>
            </div>
          ) : days.length > 0 ? (
            /* Tam yapılandırılmış program (hafta/gün/egzersiz) */
            <div className="space-y-3">
              {days.map((day, i) => {
                const isToday = i === todayIdx
                const isExpanded = expandedDay === i
                return (
                  <motion.div
                    key={day.dayNumber}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className={`border rounded-2xl overflow-hidden transition-colors ${
                      isToday ? 'bg-blue-500/5 border-blue-500/30' : 'bg-card/50 border-border/30'
                    }`}
                  >
                    <button
                      onClick={() => setExpandedDay(isExpanded ? null : i)}
                      className="w-full flex items-center gap-4 p-4 text-left"
                    >
                      <div className={`w-12 text-center shrink-0 ${isToday ? 'text-blue-400' : 'text-muted-foreground'}`}>
                        <p className="text-xs font-medium">{DAY_NAMES[i]}</p>
                        <p className="text-xl font-black">{i + 1}</p>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-bold truncate">{day.name}</p>
                          {isToday && <span className="text-xs bg-blue-500 text-white px-2 py-0.5 rounded-full shrink-0">Bugün</span>}
                        </div>
                        <div className="flex items-center gap-4 mt-0.5 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1"><Clock size={10} /> {day.estimatedDurationMinutes} dk</span>
                          <span className="flex items-center gap-1"><Dumbbell size={10} /> {day.exercises.length} egzersiz</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {isToday && (
                          <Link
                            href="/dashboard/session"
                            onClick={e => e.stopPropagation()}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition-colors"
                          >
                            <Play size={12} /> Başlat
                          </Link>
                        )}
                        <ChevronRight
                          size={16}
                          className={`text-muted-foreground transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                        />
                      </div>
                    </button>

                    {/* Egzersiz listesi */}
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        className="border-t border-border/20 px-4 pb-4"
                      >
                        <div className="mt-3 space-y-2">
                          {day.exercises.map((ex, j) => (
                            <div
                              key={j}
                              className="flex items-center gap-3 p-3 bg-muted/20 rounded-xl"
                            >
                              <div className="w-7 h-7 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
                                <span className="text-blue-400 text-xs font-bold">{j + 1}</span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-sm truncate">{ex.exercise.name}</p>
                                <div className="flex gap-3 mt-0.5 text-xs text-muted-foreground">
                                  <span>{ex.sets} set</span>
                                  {ex.reps && <span>{ex.reps} tekrar</span>}
                                  {ex.durationSeconds && <span>{ex.durationSeconds}sn</span>}
                                  <span>· {ex.restSeconds}sn dinlenme</span>
                                </div>
                              </div>
                              <div className="flex gap-1 shrink-0">
                                {ex.exercise.muscleGroups.slice(0, 2).map(m => (
                                  <span key={m} className="text-xs bg-muted/40 px-1.5 py-0.5 rounded-full">{m}</span>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </motion.div>
                )
              })}
            </div>
          ) : (
            /* Program var ama yapılandırılmamış (sadece DB kaydı, detay yok) */
            <div className="text-center py-12 bg-card/30 border border-border/20 rounded-2xl">
              <CheckCircle size={36} className="text-green-400 mx-auto mb-3" />
              <h3 className="font-bold text-lg mb-1">{program.name}</h3>
              <p className="text-muted-foreground text-sm mb-2">{program.description}</p>
              <p className="text-xs text-muted-foreground mb-6">
                {program.generatedByAi ? 'AI tarafından oluşturuldu' : ''}
                {' · '}
                {new Date(program.createdAt).toLocaleDateString('tr-TR')}
              </p>
              <button
                onClick={generateProgram}
                disabled={generating}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold flex items-center gap-2 mx-auto"
              >
                <RotateCcw size={14} /> Detaylı Program Oluştur
              </button>
            </div>
          )}
        </motion.div>
      )}

      {/* Geçmiş tab */}
      {activeTab === 'history' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-3"
        >
          <p className="text-sm text-muted-foreground">Son antrenmanlar</p>

          {historyLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-20 bg-muted/30 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : history.filter(s => s.endedAt).length === 0 ? (
            <div className="text-center py-16 bg-card/30 border border-dashed border-border/40 rounded-2xl">
              <Calendar size={36} className="text-muted-foreground mx-auto mb-3" />
              <h3 className="font-bold mb-1">Henüz tamamlanan seans yok</h3>
              <p className="text-sm text-muted-foreground">Bir seans tamamladıktan sonra burada görünecek.</p>
            </div>
          ) : (
            history.filter(s => s.endedAt).map((session, i) => {
              const date = new Date(session.startedAt)
              const now = new Date()
              const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
              const dateLabel = diffDays === 0 ? 'Bugün' : diffDays === 1 ? 'Dün' : date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })
              const durationMin = session.durationSeconds ? Math.round(session.durationSeconds / 60) : null
              const formScore = session.overallFormScore

              return (
                <motion.div
                  key={session.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.07 }}
                  className="flex items-center gap-4 p-4 bg-card/50 border border-border/30 rounded-2xl hover:border-blue-500/30 transition-colors"
                >
                  <div className="w-12 h-12 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center shrink-0">
                    <CheckCircle size={20} className="text-green-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold">Antrenman Seansı</p>
                    <div className="flex items-center gap-4 mt-0.5 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Calendar size={10} /> {dateLabel}</span>
                      {durationMin && <span className="flex items-center gap-1"><Clock size={10} /> {durationMin} dk</span>}
                      {session.caloriesBurned && <span className="text-orange-400 flex items-center gap-1"><Flame size={10} /> {session.caloriesBurned} kcal</span>}
                    </div>
                  </div>
                  {formScore && (
                    <div className="text-right shrink-0">
                      <p className="text-xs text-muted-foreground">Form</p>
                      <p className={`text-sm font-bold ${formScore >= 80 ? 'text-green-400' : formScore >= 60 ? 'text-yellow-400' : 'text-red-400'}`}>
                        {formScore}/100
                      </p>
                    </div>
                  )}
                  <ChevronRight size={16} className="text-muted-foreground shrink-0" />
                </motion.div>
              )
            })
          )}
        </motion.div>
      )}
    </div>
  )
}
