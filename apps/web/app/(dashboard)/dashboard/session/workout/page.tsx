'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Phone,
  Play,
  Pause,
  Activity,
  Heart,
  Zap,
  Timer,
  Volume2,
  VolumeX,
  CheckCircle,
} from 'lucide-react'
import { useVoiceChat } from '@/hooks/useVoiceChat'
import { useSessionTracker } from '@/hooks/useSessionTracker'
import { usePoseDetection } from '@/hooks/usePoseDetection'
import { CharacterPanel } from '@/components/session/panels/CharacterPanel'

const EXERCISES = [
  { id: 1, name: 'Squat', slug: 'squat', sets: 4, reps: 12, rest: 60, muscles: ['Bacak', 'Kalça'] },
  {
    id: 2,
    name: 'Push-up',
    slug: 'push-up',
    sets: 3,
    reps: 15,
    rest: 45,
    muscles: ['Göğüs', 'Tricep'],
  },
  {
    id: 3,
    name: 'Plank',
    slug: 'plank',
    sets: 3,
    reps: 60,
    rest: 30,
    muscles: ['Core'],
    isDuration: true,
  },
  { id: 4, name: 'Lunge', slug: 'lunge', sets: 3, reps: 10, rest: 45, muscles: ['Bacak'] },
  {
    id: 5,
    name: 'Mountain Climber',
    slug: 'mountain-climber',
    sets: 3,
    reps: 20,
    rest: 30,
    muscles: ['Kardio', 'Core'],
  },
]

// Kullanıcı kamerası — videoRef dışarıya açık
function UserCamera({
  isOn,
  videoRef,
}: {
  isOn: boolean
  videoRef: React.RefObject<HTMLVideoElement | null>
}) {
  const streamRef = useRef<MediaStream | null>(null)

  useEffect(() => {
    if (!isOn) {
      streamRef.current?.getTracks().forEach((t) => t.stop())
      return
    }
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: 'user', width: 640, height: 480 } })
      .then((stream) => {
        streamRef.current = stream
        if (videoRef.current) videoRef.current.srcObject = stream
      })
      .catch(() => {})
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop())
    }
  }, [isOn, videoRef])

  if (!isOn)
    return (
      <div className="flex h-full w-full items-center justify-center rounded-xl bg-gray-900">
        <div className="text-center">
          <VideoOff size={40} className="mx-auto mb-2 text-gray-600" />
          <p className="text-xs text-gray-500">Kamera kapalı</p>
        </div>
      </div>
    )

  return (
    <div className="relative h-full w-full">
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        className="h-full w-full scale-x-[-1] rounded-xl object-cover"
      />
      <div className="pointer-events-none absolute inset-0 rounded-xl border-2 border-emerald-500/20" />
      <div className="absolute left-3 top-3 rounded-lg bg-black/60 px-2 py-1 backdrop-blur-sm">
        <span className="flex items-center gap-1 text-xs font-semibold text-green-400">
          <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-green-400" />
          Canlı
        </span>
      </div>
    </div>
  )
}

export default function WorkoutPage() {
  const {
    speak,
    stop: stopSpeech,
    startRecording,
    stopRecording,
    isRecording,
    state: voiceState,
  } = useVoiceChat({
    onTranscript: (text) => setAiMessage(`Sen: ${text}`),
    onAIResponse: (text) => setAiMessage(text),
  })
  const { startSession, recordSet, endSession } = useSessionTracker()

  const [isActive, setIsActive] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [isVideoOn, setIsVideoOn] = useState(true)
  const [isVoiceOn, setIsVoiceOn] = useState(true)
  const [exerciseIdx, setExerciseIdx] = useState(0)
  const [currentSet, setCurrentSet] = useState(1)
  const [repCount, setRepCount] = useState(0)
  const [heartRate, setHeartRate] = useState(72)
  const [sessionTime, setSessionTime] = useState(0)
  const [restTime, setRestTime] = useState(0)
  const [isResting, setIsResting] = useState(false)
  const [aiMessage, setAiMessage] = useState('Bugünkü seansa hazır mısın?')
  const [calories, setCalories] = useState(0)
  const [isLoadingMessage, setIsLoadingMessage] = useState(false)
  const [formScore, setFormScore] = useState(85)

  const exercise = EXERCISES[exerciseIdx]!
  const sessionIdRef = useRef<string | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const currentSetRef = useRef(currentSet)
  const exerciseRef = useRef(exercise)
  const isVoiceOnRef = useRef(isVoiceOn)
  const isRestingRef = useRef(isResting)

  useEffect(() => {
    currentSetRef.current = currentSet
  }, [currentSet])
  useEffect(() => {
    exerciseRef.current = exercise
  }, [exercise])
  useEffect(() => {
    isVoiceOnRef.current = isVoiceOn
  }, [isVoiceOn])
  useEffect(() => {
    isRestingRef.current = isResting
  }, [isResting])

  // AI mesaj getir
  const fetchAIMessage = useCallback(
    async (reps: number) => {
      if (isLoadingMessage) return
      setIsLoadingMessage(true)
      try {
        const ex = exerciseRef.current
        const res = await fetch('/api/ai/coach-message', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            exercise: ex.name,
            repCount: reps,
            targetReps: ex.reps,
            setNumber: currentSetRef.current,
            totalSets: ex.sets,
          }),
        })
        const data = await res.json()
        const msg = data.message ?? 'Devam et!'
        setAiMessage(msg)
        if (isVoiceOnRef.current) speak(msg)
      } catch {
        const fallback = 'Harika gidiyorsun, devam et!'
        setAiMessage(fallback)
        if (isVoiceOnRef.current) speak(fallback)
      } finally {
        setIsLoadingMessage(false)
      }
    },
    [speak, isLoadingMessage]
  )

  // Pose detection — gerçek rep sayımı
  const handleRep = useCallback(
    (count: number, score: number) => {
      if (isRestingRef.current || isPaused) return
      const ex = exerciseRef.current
      setFormScore(score)
      setRepCount(count)

      // Yarıya gelince AI mesaj
      if (count === Math.floor(ex.reps / 2)) {
        fetchAIMessage(count)
      }

      // Set tamamlandı
      if (count >= ex.reps) {
        const setNum = currentSetRef.current
        recordSet({
          exerciseName: ex.name,
          exerciseSlug: ex.slug,
          muscleGroups: ex.muscles,
          setNumber: setNum,
          reps: count,
          formScore: score,
          repData: [],
        })

        const remaining = ex.sets - setNum
        const doneMsg = `Set ${setNum} tamamlandı! ${remaining > 0 ? `${remaining} set daha kaldı.` : 'Egzersiz bitti!'}`
        setAiMessage(doneMsg)
        if (isVoiceOnRef.current) speak(doneMsg)

        if (setNum >= ex.sets) {
          setExerciseIdx((i) => Math.min(i + 1, EXERCISES.length - 1))
          setCurrentSet(1)
        } else {
          setCurrentSet((s) => s + 1)
        }

        setRepCount(0)
        setIsResting(true)
        setRestTime(ex.rest)
      }
    },
    [isPaused, fetchAIMessage, recordSet, speak]
  )

  const { isLoaded: poseLoaded, resetCounter } = usePoseDetection({
    videoRef,
    exerciseSlug: exercise.slug,
    isActive: isActive && !isPaused && isVideoOn,
    onRep: handleRep,
  })

  // Reset rep counter on exercise/set change
  useEffect(() => {
    resetCounter()
    setRepCount(0)
  }, [exerciseIdx, currentSet, resetCounter])

  // Seans timer
  useEffect(() => {
    if (!isActive || isPaused) return
    const t = setInterval(() => {
      setSessionTime((s) => s + 1)
      setCalories((c) => c + 0.085)
      setHeartRate((h) => Math.max(65, Math.min(185, h + (Math.random() - 0.4) * 2.5)))
    }, 1000)
    return () => clearInterval(t)
  }, [isActive, isPaused])

  // Dinlenme timer
  useEffect(() => {
    if (!isResting || restTime <= 0) return
    const t = setInterval(() => {
      setRestTime((r) => {
        if (r <= 1) {
          setIsResting(false)
          const msg = 'Dinlenme bitti! Hazır ol, başlıyoruz!'
          setAiMessage(msg)
          if (isVoiceOn) speak(msg)
          return 0
        }
        return r - 1
      })
    }, 1000)
    return () => clearInterval(t)
  }, [isResting, restTime, isVoiceOn, speak])

  const startSeason = async () => {
    const id = await startSession()
    sessionIdRef.current = id
    setIsActive(true)
    const msg =
      'Seans başladı! İlk egzersizimiz ' + exercise.name + '. Hazır olduğunda başlayabilirsin!'
    setAiMessage(msg)
    if (isVoiceOn) speak(msg)
  }

  const endSeason = async () => {
    stopSpeech()
    await endSession({
      durationSeconds: sessionTime,
      caloriesBurned: Math.round(calories),
      overallFormScore: Math.round(formScore),
      heartRateData: [],
    })
    setIsActive(false)
    setSessionTime(0)
    setExerciseIdx(0)
    setCurrentSet(1)
    setRepCount(0)
    setCalories(0)
    setIsResting(false)
    setAiMessage('Seans tamamlandı! Harika iş çıkardın! 🎉')
  }

  const fmt = (s: number) =>
    `${Math.floor(s / 60)
      .toString()
      .padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`

  return (
    <div className="-mx-4 -mt-8 flex h-[calc(100vh-4rem)] flex-col gap-3 overflow-hidden px-4 pb-4 pt-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
      {/* Pre-session overlay */}
      <AnimatePresence>
        {!isActive && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="bg-background/95 absolute inset-0 z-50 flex items-center justify-center backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="max-w-md px-4 text-center"
            >
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full border border-emerald-500/30 bg-emerald-500/10">
                <Activity size={36} className="text-emerald-500" />
              </div>
              <h1 className="mb-2 text-3xl font-black">Full Body Strength</h1>
              <p className="text-muted-foreground mb-6 text-sm">
                AI koçun hazır · Sesli yönlendirme açık
              </p>

              <div className="mb-8 grid grid-cols-3 gap-3">
                {[
                  { label: 'Egzersiz', value: `${EXERCISES.length}` },
                  { label: 'Süre', value: '~40 dk' },
                  { label: 'Kalori', value: '~300' },
                ].map((s) => (
                  <div key={s.label} className="bg-card/50 border-border/30 rounded-xl border p-3">
                    <p className="text-xl font-black">{s.value}</p>
                    <p className="text-muted-foreground text-xs">{s.label}</p>
                  </div>
                ))}
              </div>

              <button
                onClick={startSeason}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-4 font-bold text-white transition-colors hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                aria-label="Seansı başlat"
              >
                <Play size={18} /> Seansı Başlat
              </button>
              <p className="text-muted-foreground mt-3 text-xs">
                Sesli koçluk için ses açık olmalı
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stats bar */}
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-3">
          {[
            { icon: Timer, value: fmt(sessionTime), color: 'text-emerald-400' },
            { icon: Heart, value: `${Math.round(heartRate)} bpm`, color: 'text-red-400' },
            { icon: Zap, value: `${Math.round(calories)} kcal`, color: 'text-yellow-400' },
          ].map(({ icon: Icon, value, color }) => (
            <div
              key={value}
              className="bg-card/50 border-border/30 flex items-center gap-1.5 rounded-lg border px-3 py-1.5"
            >
              <Icon size={13} className={color} />
              <span className="font-mono text-sm font-bold">{value}</span>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-1.5">
          {EXERCISES.map((ex, i) => (
            <div
              key={ex.id}
              className={`h-1.5 w-6 rounded-full transition-colors ${
                i < exerciseIdx
                  ? 'bg-emerald-500'
                  : i === exerciseIdx
                    ? 'animate-pulse bg-emerald-400'
                    : 'bg-muted'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Video area */}
      <div className="grid min-h-0 flex-1 grid-cols-2 gap-3">
        {/* LEFT: CharacterPanel */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="relative overflow-hidden rounded-2xl border border-emerald-500/20 bg-gray-950"
        >
          {/* AI Koç badge */}
          <div className="absolute left-3 top-3 z-10 flex items-center gap-1.5 rounded-lg bg-emerald-600/90 px-2.5 py-1">
            <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
            <span className="text-xs font-semibold text-white">AI Koç</span>
          </div>

          {/* Exercise info overlay */}
          <div className="absolute right-3 top-3 z-10 rounded-lg bg-black/60 px-2.5 py-1">
            <p className="text-xs font-semibold text-white">{exercise.name}</p>
            <p className="text-xs text-gray-400">
              Set {currentSet}/{exercise.sets}
            </p>
          </div>

          {/* Pose detection status */}
          {isActive && isVideoOn && (
            <div className="absolute right-3 top-12 z-10">
              <div
                className={`rounded-lg px-2 py-1 text-xs font-medium ${poseLoaded ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}
              >
                {poseLoaded ? 'Pose Aktif' : 'Yükleniyor...'}
              </div>
            </div>
          )}

          <CharacterPanel
            exerciseSlug={exercise.slug}
            isActive={isActive && !isPaused}
            isResting={isResting}
            aiMessage={aiMessage}
            poseActive={poseLoaded}
          />
        </motion.div>

        {/* RIGHT: UserCamera + rep counter + rest overlay */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="border-border/30 relative overflow-hidden rounded-2xl border bg-gray-950"
        >
          <UserCamera isOn={isVideoOn} videoRef={videoRef} />

          {/* Rep counter */}
          {isActive && !isResting && (
            <div className="absolute bottom-3 left-3 right-3 rounded-xl bg-black/75 px-3 py-2.5 backdrop-blur-sm">
              <div className="mb-1.5 flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-400">Tekrar</p>
                  <div className="flex items-end gap-1">
                    <span className="text-2xl font-black text-white">{repCount}</span>
                    <span className="mb-0.5 text-sm text-gray-500">/{exercise.reps}</span>
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-400">Form</p>
                  <p
                    className={`text-sm font-bold ${formScore >= 85 ? 'text-green-400' : formScore >= 70 ? 'text-yellow-400' : 'text-red-400'}`}
                  >
                    {Math.round(formScore)}
                  </p>
                </div>
                <svg
                  className="h-10 w-10 -rotate-90 text-emerald-500"
                  viewBox="0 0 36 36"
                  aria-hidden="true"
                >
                  <circle
                    cx="18"
                    cy="18"
                    r="15"
                    fill="none"
                    stroke="rgb(55 65 81)"
                    strokeWidth="3"
                  />
                  <circle
                    cx="18"
                    cy="18"
                    r="15"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeDasharray={`${(repCount / exercise.reps) * 94} 94`}
                    strokeLinecap="round"
                  />
                </svg>
              </div>
              <div className="h-1 overflow-hidden rounded-full bg-gray-800">
                <motion.div
                  className="h-full rounded-full bg-emerald-500"
                  animate={{ width: `${(repCount / exercise.reps) * 100}%` }}
                />
              </div>
            </div>
          )}

          {/* Dinlenme overlay */}
          <AnimatePresence>
            {isResting && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/80 backdrop-blur-sm"
              >
                <div className="text-center">
                  <p className="mb-1 text-sm text-gray-400">Dinlenme</p>
                  <motion.p
                    key={restTime}
                    initial={{ scale: 1.4, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="text-5xl font-black text-white"
                  >
                    {restTime}
                  </motion.p>
                  <p className="mt-1 text-xs text-gray-500">saniye</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Controls */}
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-2">
        {/* Egzersiz progress */}
        <div className="flex flex-wrap gap-1.5">
          {EXERCISES.map((ex, i) => (
            <div
              key={ex.id}
              className={`flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-medium ${
                i === exerciseIdx
                  ? 'border-emerald-600 bg-emerald-600 text-white'
                  : i < exerciseIdx
                    ? 'border-emerald-500/30 bg-emerald-500/15 text-emerald-400'
                    : 'bg-card/50 text-muted-foreground border-border/30'
              }`}
            >
              {i < exerciseIdx && <CheckCircle size={10} />}
              {ex.name}
            </div>
          ))}
        </div>

        {/* Butonlar */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => (isRecording ? stopRecording() : startRecording())}
            title={isRecording ? 'Durdurmak için tıkla' : 'Konuşmak için tıkla'}
            aria-label={isRecording ? 'Kaydı durdur' : 'Konuşmaya başla'}
            className={`rounded-xl border p-2.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
              isRecording
                ? 'animate-pulse border-red-500 bg-red-500/30 text-red-300'
                : voiceState === 'transcribing' || voiceState === 'thinking'
                  ? 'border-yellow-500/50 bg-yellow-500/20 text-yellow-400'
                  : voiceState === 'speaking'
                    ? 'border-emerald-500/50 bg-emerald-500/20 text-emerald-400'
                    : 'bg-card/50 border-border/30 hover:bg-card'
            }`}
          >
            {isRecording ? <MicOff size={16} /> : <Mic size={16} />}
          </button>

          <button
            onClick={() => setIsVideoOn((v) => !v)}
            aria-label={isVideoOn ? 'Kamerayı kapat' : 'Kamerayı aç'}
            className={`rounded-xl border p-2.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${isVideoOn ? 'bg-card/50 border-border/30 hover:bg-card' : 'border-red-500/30 bg-red-500/15 text-red-400'}`}
          >
            {isVideoOn ? <Video size={16} /> : <VideoOff size={16} />}
          </button>

          <button
            onClick={() => {
              setIsVoiceOn((v) => !v)
              if (isVoiceOn) stopSpeech()
            }}
            aria-label={isVoiceOn ? 'Sesi kapat' : 'Sesi aç'}
            className={`rounded-xl border p-2.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${isVoiceOn ? 'bg-card/50 border-border/30 hover:bg-card' : 'border-orange-500/30 bg-orange-500/15 text-orange-400'}`}
          >
            {isVoiceOn ? <Volume2 size={16} /> : <VolumeX size={16} />}
          </button>

          {isActive && (
            <button
              onClick={() => {
                setIsPaused((p) => !p)
                if (!isPaused) stopSpeech()
              }}
              aria-label={isPaused ? 'Devam et' : 'Duraklat'}
              className="rounded-xl border border-yellow-500/30 bg-yellow-500/15 p-2.5 text-yellow-400 transition-colors hover:bg-yellow-500/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-500"
            >
              {isPaused ? <Play size={16} /> : <Pause size={16} />}
            </button>
          )}

          <button
            onClick={endSeason}
            aria-label="Seansı bitir"
            className="rounded-xl border border-red-500/30 bg-red-500/15 p-2.5 text-red-400 transition-colors hover:bg-red-500/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
          >
            <Phone size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}
