'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Lock, CheckCircle, Circle, ChevronDown, ChevronUp, Sparkles, Loader2 } from 'lucide-react'

interface RoadmapTask {
  id: string
  title: string
  isDone: boolean
  order: number
}

interface RoadmapWeek {
  id: string
  weekNumber: number
  title: string
  description: string | null
  isComplete: boolean
  isUnlocked: boolean
  tasks: RoadmapTask[]
}

interface Roadmap {
  id: string
  title: string
  type: string
  weeks: RoadmapWeek[]
}

export default function RoadmapPage() {
  const [roadmap, setRoadmap] = useState<Roadmap | null>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [expandedWeek, setExpandedWeek] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/roadmap')
      .then((r) => r.json())
      .then((data) => {
        setRoadmap(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const generateRoadmap = async () => {
    setGenerating(true)
    try {
      const res = await fetch('/api/roadmap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'fitness' }),
      })
      const data = await res.json()
      setRoadmap(data)
    } finally {
      setGenerating(false)
    }
  }

  const completeTask = async (weekId: string, taskId: string) => {
    await fetch(`/api/roadmap/week/${weekId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ taskId }),
    })
    // Optimistic update
    setRoadmap((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        weeks: prev.weeks.map((w) =>
          w.id === weekId
            ? { ...w, tasks: w.tasks.map((t) => (t.id === taskId ? { ...t, isDone: true } : t)) }
            : w
        ),
      }
    })
  }

  if (loading)
    return (
      <div className="flex min-h-64 items-center justify-center">
        <Loader2 className="animate-spin text-indigo-400" size={32} />
      </div>
    )

  if (!roadmap)
    return (
      <div className="mx-auto max-w-2xl space-y-6 py-16 text-center">
        <div className="text-6xl">🗺️</div>
        <h1 className="text-2xl font-black text-white">Yol haritanı oluştur</h1>
        <p className="text-white/50">AI koçun sana özel 8 haftalık bir plan hazırlasın.</p>
        <button
          onClick={generateRoadmap}
          disabled={generating}
          className="mx-auto flex items-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 px-8 py-4 text-lg font-bold text-white disabled:opacity-60"
        >
          {generating ? (
            <>
              <Loader2 size={20} className="animate-spin" /> Hazırlanıyor...
            </>
          ) : (
            <>
              <Sparkles size={20} /> Plan Oluştur
            </>
          )}
        </button>
      </div>
    )

  const completedWeeks = roadmap.weeks.filter((w) => w.isComplete).length
  const totalWeeks = roadmap.weeks.length

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="mb-1 text-2xl font-black text-white">{roadmap.title}</h1>
        <div className="flex items-center gap-3">
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/10">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(completedWeeks / totalWeeks) * 100}%` }}
              transition={{ duration: 0.8 }}
              className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500"
            />
          </div>
          <span className="shrink-0 text-sm text-white/50">
            {completedWeeks}/{totalWeeks} hafta
          </span>
        </div>
      </div>

      {/* Hafta Kartları */}
      <div className="space-y-3">
        {roadmap.weeks.map((week, i) => {
          const isExpanded = expandedWeek === week.id
          const doneTasks = week.tasks.filter((t) => t.isDone).length
          const totalTasks = week.tasks.length
          const progress = totalTasks > 0 ? (doneTasks / totalTasks) * 100 : 0

          return (
            <motion.div
              key={week.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`overflow-hidden rounded-2xl border ${
                week.isComplete
                  ? 'border-green-500/30 bg-green-500/5'
                  : week.isUnlocked
                    ? 'border-indigo-500/30 bg-indigo-500/5'
                    : 'bg-white/2 border-white/10 opacity-50'
              }`}
            >
              {/* Hafta header */}
              <button
                onClick={() => week.isUnlocked && setExpandedWeek(isExpanded ? null : week.id)}
                className="flex w-full items-center gap-4 p-4"
                disabled={!week.isUnlocked}
              >
                {/* Status icon */}
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                    week.isComplete
                      ? 'bg-green-500/20'
                      : week.isUnlocked
                        ? 'bg-indigo-500/20'
                        : 'bg-white/5'
                  }`}
                >
                  {week.isComplete ? (
                    <CheckCircle size={20} className="text-green-400" />
                  ) : week.isUnlocked ? (
                    <span className="text-sm font-black text-indigo-400">{week.weekNumber}</span>
                  ) : (
                    <Lock size={16} className="text-white/30" />
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 text-left">
                  <p className="text-sm font-bold text-white">{week.title}</p>
                  {week.isUnlocked && (
                    <p className="mt-0.5 text-xs text-white/40">
                      {doneTasks}/{totalTasks} görev tamamlandı
                    </p>
                  )}
                </div>

                {/* Progress mini + expand */}
                {week.isUnlocked && (
                  <div className="flex items-center gap-2">
                    {!week.isComplete && (
                      <div className="h-1.5 w-12 overflow-hidden rounded-full bg-white/10">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    )}
                    {isExpanded ? (
                      <ChevronUp size={16} className="text-white/40" />
                    ) : (
                      <ChevronDown size={16} className="text-white/40" />
                    )}
                  </div>
                )}
              </button>

              {/* Görevler (expandable) */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="space-y-2 px-4 pb-4">
                      {week.description && (
                        <p className="mb-3 text-sm text-white/50">{week.description}</p>
                      )}
                      {week.tasks.map((task) => (
                        <button
                          key={task.id}
                          onClick={() => !task.isDone && completeTask(week.id, task.id)}
                          disabled={task.isDone}
                          className="flex w-full items-center gap-3 rounded-xl bg-white/5 p-3 text-left transition-colors hover:bg-white/10"
                        >
                          {task.isDone ? (
                            <CheckCircle size={18} className="shrink-0 text-green-400" />
                          ) : (
                            <Circle size={18} className="shrink-0 text-white/30" />
                          )}
                          <span
                            className={`text-sm ${task.isDone ? 'text-white/40 line-through' : 'text-white'}`}
                          >
                            {task.title}
                          </span>
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )
        })}
      </div>

      {/* Yeniden oluştur */}
      <button
        onClick={generateRoadmap}
        disabled={generating}
        className="flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 py-3 text-sm text-white/40 transition-all hover:border-white/20 hover:text-white/60"
      >
        {generating ? (
          <>
            <Loader2 size={14} className="animate-spin" /> Yenileniyor...
          </>
        ) : (
          <>
            <Sparkles size={14} /> Planı Yenile
          </>
        )}
      </button>
    </div>
  )
}
