'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import {
  Play,
  CheckCircle,
  Clock,
  Flame,
  Dumbbell,
  ChevronRight,
  Sparkles,
  Loader2,
  AlertCircle,
  RotateCcw,
  Calendar,
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

interface AiPlanExercise {
  name: string
  sets: number
  reps: number
  restSeconds: number
  muscleGroups: string[]
  notes?: string
}

interface AiPlanDay {
  day: string
  isRest: boolean
  workoutName?: string
  estimatedMinutes?: number
  exercises: AiPlanExercise[]
}

interface AiWeeklyPlan {
  programName: string
  description: string
  weeklyPlan: AiPlanDay[]
  nutritionTips?: string[]
  estimatedWeeklyCalories?: number
}

interface Program {
  id: string
  name: string
  description: string
  generatedByAi: boolean
  isActive: boolean
  createdAt: string
  weeks: { weekNumber: number; days: ProgramDay[] }[]
  weeklyPlanJson?: AiWeeklyPlan | null
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
    <div className="max-w-5xl space-y-8">
      {/* Başlık */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-wrap items-start justify-between gap-3"
      >
        <div className="flex items-center gap-3">
          <Image
            src={THIINGS.dumbbell}
            alt="dumbbell"
            width={44}
            height={44}
            unoptimized
            className="drop-shadow-lg"
          />
          <h1 className="mb-1 text-3xl font-black">Egzersiz Planım</h1>
          <p className="text-muted-foreground">
            {program
              ? `${program.name}${program.generatedByAi ? ' · AI tarafından oluşturuldu' : ''}`
              : 'Kişiselleştirilmiş antrenman programın'}
          </p>
        </div>
        <button
          onClick={generateProgram}
          disabled={generating}
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 transition-all hover:from-blue-700 hover:to-purple-700 disabled:opacity-60"
        >
          {generating ? (
            <>
              <Loader2 size={14} className="animate-spin" /> Oluşturuluyor...
            </>
          ) : (
            <>
              <Sparkles size={14} /> {program ? 'Yeniden Oluştur' : 'AI Program Oluştur'}
            </>
          )}
        </button>
      </motion.div>

      {/* Hata */}
      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {/* Tabs */}
      <div className="bg-muted/30 flex w-fit gap-1 rounded-xl p-1">
        {(['plan', 'history'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`rounded-lg px-5 py-2 text-sm font-semibold transition-colors ${
              activeTab === tab
                ? 'bg-background text-foreground shadow'
                : 'text-muted-foreground hover:text-foreground'
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
                <div
                  key={i}
                  className="bg-card/30 border-border/20 h-16 animate-pulse rounded-2xl border"
                />
              ))}
            </div>
          ) : !program ? (
            /* Program yok — oluştur çağrısı */
            <div className="bg-card/30 border-border/40 rounded-2xl border border-dashed py-16 text-center">
              <Sparkles size={40} className="mx-auto mb-4 text-blue-400" />
              <h3 className="mb-2 text-lg font-bold">Henüz programın yok</h3>
              <p className="text-muted-foreground mx-auto mb-6 max-w-xs text-sm">
                AI koçun, onboarding bilgilerini kullanarak sana özel bir haftalık program
                oluşturacak.
              </p>
              <button
                onClick={generateProgram}
                disabled={generating}
                className="mx-auto flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
              >
                {generating ? (
                  <>
                    <Loader2 size={14} className="animate-spin" /> Oluşturuluyor...
                  </>
                ) : (
                  <>
                    <Sparkles size={14} /> Program Oluştur
                  </>
                )}
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
                    className={`overflow-hidden rounded-2xl border transition-colors ${
                      isToday ? 'border-blue-500/30 bg-blue-500/5' : 'bg-card/50 border-border/30'
                    }`}
                  >
                    <button
                      onClick={() => setExpandedDay(isExpanded ? null : i)}
                      className="flex w-full items-center gap-4 p-4 text-left"
                    >
                      <div
                        className={`w-12 shrink-0 text-center ${isToday ? 'text-blue-400' : 'text-muted-foreground'}`}
                      >
                        <p className="text-xs font-medium">{DAY_NAMES[i]}</p>
                        <p className="text-xl font-black">{i + 1}</p>
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="truncate font-bold">{day.name}</p>
                          {isToday && (
                            <span className="shrink-0 rounded-full bg-blue-500 px-2 py-0.5 text-xs text-white">
                              Bugün
                            </span>
                          )}
                        </div>
                        <div className="text-muted-foreground mt-0.5 flex items-center gap-4 text-xs">
                          <span className="flex items-center gap-1">
                            <Clock size={10} /> {day.estimatedDurationMinutes} dk
                          </span>
                          <span className="flex items-center gap-1">
                            <Dumbbell size={10} /> {day.exercises.length} egzersiz
                          </span>
                        </div>
                      </div>

                      <div className="flex shrink-0 items-center gap-2">
                        {isToday && (
                          <Link
                            href="/dashboard/session"
                            onClick={(e) => e.stopPropagation()}
                            className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-blue-700"
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
                        className="border-border/20 border-t px-4 pb-4"
                      >
                        <div className="mt-3 space-y-2">
                          {day.exercises.map((ex, j) => (
                            <div
                              key={j}
                              className="bg-muted/20 flex items-center gap-3 rounded-xl p-3"
                            >
                              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-blue-500/20 bg-blue-500/10">
                                <span className="text-xs font-bold text-blue-400">{j + 1}</span>
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-semibold">{ex.exercise.name}</p>
                                <div className="text-muted-foreground mt-0.5 flex gap-3 text-xs">
                                  <span>{ex.sets} set</span>
                                  {ex.reps && <span>{ex.reps} tekrar</span>}
                                  {ex.durationSeconds && <span>{ex.durationSeconds}sn</span>}
                                  <span>· {ex.restSeconds}sn dinlenme</span>
                                </div>
                              </div>
                              <div className="flex shrink-0 gap-1">
                                {ex.exercise.muscleGroups.slice(0, 2).map((m) => (
                                  <span
                                    key={m}
                                    className="bg-muted/40 rounded-full px-1.5 py-0.5 text-xs"
                                  >
                                    {m}
                                  </span>
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
          ) : program.weeklyPlanJson?.weeklyPlan ? (
            /* AI JSON programı var — render et */
            <div className="space-y-3">
              {program.weeklyPlanJson.weeklyPlan.map((day, i) => {
                const isToday = i === todayIdx
                const isExpanded = expandedDay === i
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className={`overflow-hidden rounded-2xl border transition-colors ${
                      isToday ? 'border-blue-500/30 bg-blue-500/5' : 'bg-card/50 border-border/30'
                    } ${day.isRest ? 'opacity-60' : ''}`}
                  >
                    <button
                      onClick={() => !day.isRest && setExpandedDay(isExpanded ? null : i)}
                      className="flex w-full items-center gap-4 p-4 text-left"
                    >
                      <div
                        className={`w-12 shrink-0 text-center ${isToday ? 'text-blue-400' : 'text-muted-foreground'}`}
                      >
                        <p className="text-xs font-medium">{day.day}</p>
                        <p className="text-xl font-black">{i + 1}</p>
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="truncate font-bold">
                            {day.isRest ? 'Dinlenme' : (day.workoutName ?? day.day)}
                          </p>
                          {isToday && (
                            <span className="shrink-0 rounded-full bg-blue-500 px-2 py-0.5 text-xs text-white">
                              Bugün
                            </span>
                          )}
                        </div>
                        {!day.isRest && (
                          <div className="text-muted-foreground mt-0.5 flex items-center gap-4 text-xs">
                            {day.estimatedMinutes && (
                              <span className="flex items-center gap-1">
                                <Clock size={10} /> {day.estimatedMinutes} dk
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <Dumbbell size={10} /> {day.exercises.length} egzersiz
                            </span>
                          </div>
                        )}
                      </div>

                      {!day.isRest && (
                        <div className="flex shrink-0 items-center gap-2">
                          {isToday && (
                            <Link
                              href="/dashboard/session"
                              onClick={(e) => e.stopPropagation()}
                              className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-blue-700"
                            >
                              <Play size={12} /> Başlat
                            </Link>
                          )}
                          <ChevronRight
                            size={16}
                            className={`text-muted-foreground transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                          />
                        </div>
                      )}
                    </button>

                    {isExpanded && !day.isRest && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        className="border-border/20 border-t px-4 pb-4"
                      >
                        <div className="mt-3 space-y-2">
                          {day.exercises.map((ex, j) => (
                            <div
                              key={j}
                              className="bg-muted/20 flex items-center gap-3 rounded-xl p-3"
                            >
                              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-blue-500/20 bg-blue-500/10">
                                <span className="text-xs font-bold text-blue-400">{j + 1}</span>
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-semibold">{ex.name}</p>
                                <div className="text-muted-foreground mt-0.5 flex gap-3 text-xs">
                                  <span>{ex.sets} set</span>
                                  {ex.reps && <span>{ex.reps} tekrar</span>}
                                  <span>· {ex.restSeconds}sn dinlenme</span>
                                </div>
                                {ex.notes && (
                                  <p className="text-muted-foreground/70 mt-0.5 text-xs italic">
                                    {ex.notes}
                                  </p>
                                )}
                              </div>
                              <div className="flex max-w-24 shrink-0 flex-wrap justify-end gap-1">
                                {ex.muscleGroups.slice(0, 2).map((m) => (
                                  <span
                                    key={m}
                                    className="bg-muted/40 rounded-full px-1.5 py-0.5 text-xs"
                                  >
                                    {m}
                                  </span>
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
            /* Program var ama JSON da yok — yeniden oluştur */
            <div className="bg-card/30 border-border/20 rounded-2xl border py-12 text-center">
              <CheckCircle size={36} className="mx-auto mb-3 text-green-400" />
              <h3 className="mb-1 text-lg font-bold">{program.name}</h3>
              <p className="text-muted-foreground mb-2 text-sm">{program.description}</p>
              <p className="text-muted-foreground mb-6 text-xs">
                {program.generatedByAi ? 'AI tarafından oluşturuldu' : ''}
                {' · '}
                {new Date(program.createdAt).toLocaleDateString('tr-TR')}
              </p>
              <button
                onClick={generateProgram}
                disabled={generating}
                className="mx-auto flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
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
          <p className="text-muted-foreground text-sm">Son antrenmanlar</p>

          {historyLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="bg-muted/30 h-20 animate-pulse rounded-2xl" />
              ))}
            </div>
          ) : history.filter((s) => s.endedAt).length === 0 ? (
            <div className="bg-card/30 border-border/40 rounded-2xl border border-dashed py-16 text-center">
              <Calendar size={36} className="text-muted-foreground mx-auto mb-3" />
              <h3 className="mb-1 font-bold">Henüz tamamlanan seans yok</h3>
              <p className="text-muted-foreground text-sm">
                Bir seans tamamladıktan sonra burada görünecek.
              </p>
            </div>
          ) : (
            history
              .filter((s) => s.endedAt)
              .map((session, i) => {
                const date = new Date(session.startedAt)
                const now = new Date()
                const diffDays = Math.floor(
                  (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
                )
                const dateLabel =
                  diffDays === 0
                    ? 'Bugün'
                    : diffDays === 1
                      ? 'Dün'
                      : date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })
                const durationMin = session.durationSeconds
                  ? Math.round(session.durationSeconds / 60)
                  : null
                const formScore = session.overallFormScore

                return (
                  <motion.div
                    key={session.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.07 }}
                    className="bg-card/50 border-border/30 flex items-center gap-4 rounded-2xl border p-4 transition-colors hover:border-blue-500/30"
                  >
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-green-500/20 bg-green-500/10">
                      <CheckCircle size={20} className="text-green-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-bold">Antrenman Seansı</p>
                      <div className="text-muted-foreground mt-0.5 flex items-center gap-4 text-xs">
                        <span className="flex items-center gap-1">
                          <Calendar size={10} /> {dateLabel}
                        </span>
                        {durationMin && (
                          <span className="flex items-center gap-1">
                            <Clock size={10} /> {durationMin} dk
                          </span>
                        )}
                        {session.caloriesBurned && (
                          <span className="flex items-center gap-1 text-orange-400">
                            <Flame size={10} /> {session.caloriesBurned} kcal
                          </span>
                        )}
                      </div>
                    </div>
                    {formScore && (
                      <div className="shrink-0 text-right">
                        <p className="text-muted-foreground text-xs">Form</p>
                        <p
                          className={`text-sm font-bold ${formScore >= 80 ? 'text-green-400' : formScore >= 60 ? 'text-yellow-400' : 'text-red-400'}`}
                        >
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
