'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { Play, Lock, CheckCircle, Moon, Clock, Dumbbell, Flame, X, Zap, Trophy } from 'lucide-react'

// ─── Types ───────────────────────────────────────────────────────────────────

interface Exercise {
  name: string
  sets: number
  reps?: number
  durationSeconds?: number
  restSeconds: number
  muscleGroups: string[]
  notes?: string
}

interface WorkoutDay {
  dayNumber: number
  name: string
  isRest: boolean
  estimatedMinutes?: number
  difficulty?: 'Kolay' | 'Orta' | 'Zor'
  exercises: Exercise[]
  completed?: boolean
}

interface WorkoutRoadmapProps {
  days: WorkoutDay[]
  todayDayNumber: number
}

type NodeStatus = 'completed' | 'today' | 'locked' | 'rest'

function getStatus(day: WorkoutDay, todayDayNumber: number): NodeStatus {
  if (day.isRest) return 'rest'
  if (day.completed || day.dayNumber < todayDayNumber) return 'completed'
  if (day.dayNumber === todayDayNumber) return 'today'
  return 'locked'
}

// Zigzag X pozisyonları (0–1 arası, merkez=0.5)
const ZIGZAG = [0.5, 0.78, 0.55, 0.22, 0.5, 0.78, 0.22]

// ─── Main ─────────────────────────────────────────────────────────────────────

export function WorkoutRoadmap({ days, todayDayNumber }: WorkoutRoadmapProps) {
  const [selectedDay, setSelectedDay] = useState<WorkoutDay | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const weeks = [0, 1, 2, 3].map((w) => days.slice(w * 7, w * 7 + 7))

  return (
    <div className="relative w-full" ref={containerRef}>
      {/* Ambient glow background */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-40 h-96 w-96 -translate-x-1/2 rounded-full bg-indigo-600/5 blur-3xl" />
        <div className="absolute left-1/4 top-1/2 h-64 w-64 rounded-full bg-emerald-600/5 blur-3xl" />
      </div>

      {weeks.map((weekDays, weekIdx) => (
        <WeekSection
          key={weekIdx}
          weekIdx={weekIdx}
          days={weekDays}
          todayDayNumber={todayDayNumber}
          onSelect={setSelectedDay}
        />
      ))}

      <AnimatePresence>
        {selectedDay && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedDay(null)}
              className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm"
            />
            <DayDetailPanel
              day={selectedDay}
              status={getStatus(selectedDay, todayDayNumber)}
              onClose={() => setSelectedDay(null)}
            />
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Week Section ─────────────────────────────────────────────────────────────

function WeekSection({
  weekIdx,
  days,
  todayDayNumber,
  onSelect,
}: {
  weekIdx: number
  days: WorkoutDay[]
  todayDayNumber: number
  onSelect: (day: WorkoutDay) => void
}) {
  const NODE_HEIGHT = 100 // px per node
  const CONTAINER_W = 480
  const svgH = days.length * NODE_HEIGHT

  // Compute node centers for SVG path
  const centers = days.map((_, i) => ({
    x: ZIGZAG[i % ZIGZAG.length]! * CONTAINER_W,
    y: i * NODE_HEIGHT + NODE_HEIGHT / 2,
  }))

  // Build smooth SVG path through all centers
  const pathD = centers.reduce((acc, pt, i) => {
    if (i === 0) return `M ${pt.x} ${pt.y}`
    const prev = centers[i - 1]!
    const cpX = (prev.x + pt.x) / 2
    return `${acc} C ${cpX} ${prev.y}, ${cpX} ${pt.y}, ${pt.x} ${pt.y}`
  }, '')

  const completedUpTo = days.findIndex((d) => getStatus(d, todayDayNumber) === 'today')
  const completedCenters = completedUpTo > 0 ? centers.slice(0, completedUpTo + 1) : []
  const completedPathD = completedCenters.reduce((acc, pt, i) => {
    if (i === 0) return `M ${pt.x} ${pt.y}`
    const prev = completedCenters[i - 1]!
    const cpX = (prev.x + pt.x) / 2
    return `${acc} C ${cpX} ${prev.y}, ${cpX} ${pt.y}, ${pt.x} ${pt.y}`
  }, '')

  const weekNames = ['1. Hafta', '2. Hafta', '3. Hafta', '4. Hafta']
  const weekThemes = [
    { color: '#6366F1', glow: 'rgba(99,102,241,0.3)' },
    { color: '#10B981', glow: 'rgba(16,185,129,0.3)' },
    { color: '#F59E0B', glow: 'rgba(245,158,11,0.3)' },
    { color: '#EF4444', glow: 'rgba(239,68,68,0.3)' },
  ]
  const theme = weekThemes[weekIdx % weekThemes.length]!

  return (
    <div className="mb-8">
      {/* Week header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: weekIdx * 0.1 }}
        className="mb-6 flex items-center gap-4 px-2"
      >
        <div
          className="h-px flex-1"
          style={{ background: `linear-gradient(to right, transparent, ${theme.color}40)` }}
        />
        <div
          className="flex items-center gap-2 rounded-full border px-4 py-1.5"
          style={{ borderColor: `${theme.color}30`, background: `${theme.color}10` }}
        >
          <div className="h-1.5 w-1.5 rounded-full" style={{ background: theme.color }} />
          <span className="text-xs font-bold uppercase tracking-widest text-white/60">
            {weekNames[weekIdx]}
          </span>
        </div>
        <div
          className="h-px flex-1"
          style={{ background: `linear-gradient(to left, transparent, ${theme.color}40)` }}
        />
      </motion.div>

      {/* Roadmap container */}
      <div className="relative mx-auto" style={{ width: CONTAINER_W, height: svgH }}>
        {/* SVG path — background (dim) */}
        <svg
          className="pointer-events-none absolute inset-0"
          width={CONTAINER_W}
          height={svgH}
          style={{ overflow: 'visible' }}
        >
          <defs>
            <filter id={`glow-${weekIdx}`}>
              <feGaussianBlur stdDeviation="3" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          {/* Base path */}
          <path
            d={pathD}
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth="2"
            strokeDasharray="6 6"
          />
          {/* Completed path */}
          {completedPathD && (
            <motion.path
              d={completedPathD}
              fill="none"
              stroke={theme.color}
              strokeWidth="2"
              filter={`url(#glow-${weekIdx})`}
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1.2, ease: 'easeOut', delay: weekIdx * 0.2 }}
            />
          )}
        </svg>

        {/* Nodes */}
        {days.map((day, dayIdx) => {
          const center = centers[dayIdx]!
          const status = getStatus(day, todayDayNumber)
          const globalIdx = weekIdx * 7 + dayIdx

          return (
            <RoadmapNode
              key={day.dayNumber}
              day={day}
              status={status}
              cx={center.x}
              cy={center.y}
              globalIdx={globalIdx}
              theme={theme}
              onClick={() => status !== 'locked' && onSelect(day)}
            />
          )
        })}
      </div>
    </div>
  )
}

// ─── Node ─────────────────────────────────────────────────────────────────────

function RoadmapNode({
  day,
  status,
  cx,
  cy,
  globalIdx,
  theme,
  onClick,
}: {
  day: WorkoutDay
  status: NodeStatus
  cx: number
  cy: number
  globalIdx: number
  theme: { color: string; glow: string }
  onClick: () => void
}) {
  const isLeft = cx < 240

  const nodeConfig = {
    completed: {
      bg: 'rgba(16,185,129,0.15)',
      border: '#10B981',
      icon: <CheckCircle size={18} className="text-emerald-400" />,
      glow: '0 0 20px rgba(16,185,129,0.4)',
      label: 'text-emerald-400',
    },
    today: {
      bg: `rgba(99,102,241,0.2)`,
      border: '#6366F1',
      icon: <Play size={16} className="translate-x-0.5 text-indigo-300" />,
      glow: `0 0 30px rgba(99,102,241,0.6), 0 0 60px rgba(99,102,241,0.2)`,
      label: 'text-indigo-300',
    },
    locked: {
      bg: 'rgba(255,255,255,0.03)',
      border: 'rgba(255,255,255,0.08)',
      icon: <Lock size={14} className="text-white/20" />,
      glow: 'none',
      label: 'text-white/25',
    },
    rest: {
      bg: 'rgba(139,92,246,0.1)',
      border: 'rgba(139,92,246,0.3)',
      icon: <Moon size={14} className="text-purple-400/60" />,
      glow: 'none',
      label: 'text-purple-400/50',
    },
  }[status]

  // Card is positioned centered on cx, cy
  const CARD_W = 160
  const CARD_H = 72
  const cardLeft = cx - CARD_W / 2
  const cardTop = cy - CARD_H / 2

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: globalIdx * 0.04, type: 'spring', damping: 20, stiffness: 200 }}
      style={{
        position: 'absolute',
        left: cardLeft,
        top: cardTop,
        width: CARD_W,
        height: CARD_H,
      }}
    >
      {/* Ping for today */}
      {status === 'today' && (
        <>
          <span className="absolute inset-0 rounded-2xl border border-indigo-500/30 motion-safe:animate-ping" />
          <span className="absolute inset-0 rounded-2xl border border-indigo-500/20 [animation-delay:0.3s] motion-safe:animate-ping" />
        </>
      )}

      <button
        onClick={onClick}
        disabled={status === 'locked'}
        className="relative h-full w-full overflow-hidden rounded-2xl border transition-all duration-300"
        style={{
          background: nodeConfig.bg,
          borderColor: nodeConfig.border,
          boxShadow: status !== 'locked' ? nodeConfig.glow : 'none',
          cursor: status === 'locked' ? 'default' : 'pointer',
        }}
        aria-label={`Gün ${day.dayNumber}: ${day.name}`}
      >
        {/* Shimmer on hover for non-locked */}
        {status !== 'locked' && (
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 transition-opacity duration-300 hover:opacity-100" />
        )}

        <div className="flex h-full items-center gap-3 px-3">
          {/* Icon circle */}
          <div
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
            style={{ background: nodeConfig.bg, border: `1px solid ${nodeConfig.border}` }}
          >
            {nodeConfig.icon}
          </div>

          {/* Text */}
          <div className="min-w-0 text-left">
            <div className="mb-0.5 flex items-center gap-1.5">
              <span
                className={`text-[10px] font-semibold uppercase tracking-wider ${nodeConfig.label}`}
              >
                Gün {day.dayNumber}
              </span>
              {status === 'today' && (
                <span className="rounded-sm bg-indigo-500 px-1 py-px text-[9px] font-black tracking-wider text-white">
                  BUGÜN
                </span>
              )}
              {status === 'completed' && <Zap size={10} className="text-emerald-400" />}
            </div>
            <p
              className={`truncate text-xs font-bold leading-tight ${status === 'locked' ? 'text-white/20' : 'text-white/90'}`}
            >
              {day.isRest ? 'Dinlenme' : day.name}
            </p>
            {!day.isRest && status !== 'locked' && day.estimatedMinutes && (
              <p className="mt-0.5 text-[10px] text-white/30">
                {day.estimatedMinutes}dk · {day.exercises.length} egzersiz
              </p>
            )}
          </div>
        </div>
      </button>
    </motion.div>
  )
}

// ─── Detail Panel ─────────────────────────────────────────────────────────────

function DayDetailPanel({
  day,
  status,
  onClose,
}: {
  day: WorkoutDay
  status: NodeStatus
  onClose: () => void
}) {
  const diffColor = {
    Kolay: '#10B981',
    Orta: '#F59E0B',
    Zor: '#EF4444',
  }[day.difficulty ?? 'Orta']

  const accentColor =
    status === 'completed' ? '#10B981' : status === 'today' ? '#6366F1' : '#8B5CF6'

  return (
    <motion.div
      initial={{ opacity: 0, y: 40, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.97 }}
      transition={{ type: 'spring', damping: 28, stiffness: 300 }}
      className="fixed bottom-6 left-1/2 z-50 w-full max-w-md -translate-x-1/2 overflow-hidden rounded-3xl"
      style={{
        background: 'linear-gradient(160deg, #16162A 0%, #0D0D1A 100%)',
        border: `1px solid ${accentColor}25`,
        boxShadow: `0 0 0 1px rgba(255,255,255,0.04), 0 30px 80px rgba(0,0,0,0.9), 0 0 60px ${accentColor}15`,
      }}
    >
      {/* Colored top bar */}
      <div
        className="h-0.5 w-full"
        style={{ background: `linear-gradient(90deg, transparent, ${accentColor}, transparent)` }}
      />

      {/* Header */}
      <div className="flex items-start justify-between p-5 pb-3">
        <div>
          <div className="mb-1.5 flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-white/30">
              Gün {day.dayNumber}
            </span>
            {status === 'today' && (
              <span className="rounded-md border border-indigo-500/30 bg-indigo-500/15 px-1.5 py-0.5 text-[9px] font-black tracking-wider text-indigo-300">
                BUGÜN
              </span>
            )}
            {status === 'completed' && (
              <span className="rounded-md border border-emerald-500/30 bg-emerald-500/15 px-1.5 py-0.5 text-[9px] font-black tracking-wider text-emerald-300">
                TAMAMLANDI
              </span>
            )}
          </div>
          <h3 className="text-lg font-black text-white">{day.name}</h3>
          <div className="mt-1.5 flex flex-wrap items-center gap-3">
            {day.estimatedMinutes && (
              <span className="flex items-center gap-1 text-xs text-white/35">
                <Clock size={10} /> {day.estimatedMinutes} dk
              </span>
            )}
            <span className="flex items-center gap-1 text-xs text-white/35">
              <Dumbbell size={10} /> {day.exercises.length} egzersiz
            </span>
            {day.difficulty && (
              <span className="text-[11px] font-bold" style={{ color: diffColor }}>
                {day.difficulty}
              </span>
            )}
          </div>
        </div>

        <button
          onClick={onClose}
          aria-label="Kapat"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.04] text-white/40 transition-all hover:bg-white/10 hover:text-white"
        >
          <X size={14} />
        </button>
      </div>

      {/* Exercise list */}
      <div className="max-h-[42vh] overflow-y-auto px-4 pb-2">
        <div className="space-y-1.5">
          {day.exercises.map((ex, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04 }}
              className="flex items-center gap-3 rounded-xl border border-white/[0.04] bg-white/[0.025] px-3 py-2.5 transition-colors hover:bg-white/[0.04]"
            >
              <div
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-[10px] font-black"
                style={{ background: `${accentColor}15`, color: accentColor }}
              >
                {i + 1}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-white/85">{ex.name}</p>
                <p className="text-[11px] text-white/30">
                  {ex.sets} set{ex.reps ? ` · ${ex.reps} tekrar` : ''}
                  {ex.durationSeconds ? ` · ${ex.durationSeconds}sn` : ''} · {ex.restSeconds}sn mola
                </p>
                {ex.notes && <p className="mt-0.5 text-[10px] italic text-white/20">{ex.notes}</p>}
              </div>
              <div className="flex shrink-0 flex-wrap justify-end gap-1">
                {ex.muscleGroups.slice(0, 1).map((m) => (
                  <span
                    key={m}
                    className="rounded-md bg-white/[0.05] px-1.5 py-0.5 text-[9px] text-white/30"
                  >
                    {m}
                  </span>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="p-4 pt-3">
        {status === 'today' ? (
          <Link
            href="/dashboard/session"
            className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-2xl py-3.5 text-sm font-black text-white transition-all"
            style={{
              background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
              boxShadow: '0 0 30px rgba(99,102,241,0.35), 0 4px 20px rgba(0,0,0,0.4)',
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            <Flame size={15} />
            Antrenmanı Başlat
          </Link>
        ) : status === 'completed' ? (
          <div
            className="flex items-center justify-center gap-2 rounded-2xl py-3 text-sm font-bold text-emerald-400"
            style={{
              background: 'rgba(16,185,129,0.07)',
              border: '1px solid rgba(16,185,129,0.2)',
            }}
          >
            <Trophy size={15} /> Tamamlandı
          </div>
        ) : (
          <div
            className="flex items-center justify-center gap-2 rounded-2xl py-3 text-sm font-bold text-white/20"
            style={{
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.05)',
            }}
          >
            <Lock size={13} /> Henüz Kilitli
          </div>
        )}
      </div>
    </motion.div>
  )
}
