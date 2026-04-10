'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Mic, MicOff, Video, VideoOff, Phone, Play, Pause,
  Activity, Heart, Zap, Timer, Volume2, VolumeX, CheckCircle
} from 'lucide-react'
import { useVoiceChat } from '@/hooks/useVoiceChat'
import { useSessionTracker } from '@/hooks/useSessionTracker'
import { usePoseDetection } from '@/hooks/usePoseDetection'

const EXERCISES = [
  { id: 1, name: 'Squat', slug: 'squat', sets: 4, reps: 12, rest: 60, muscles: ['Bacak', 'Kalça'] },
  { id: 2, name: 'Push-up', slug: 'push-up', sets: 3, reps: 15, rest: 45, muscles: ['Göğüs', 'Tricep'] },
  { id: 3, name: 'Plank', slug: 'plank', sets: 3, reps: 60, rest: 30, muscles: ['Core'], isDuration: true },
  { id: 4, name: 'Lunge', slug: 'lunge', sets: 3, reps: 10, rest: 45, muscles: ['Bacak'] },
  { id: 5, name: 'Mountain Climber', slug: 'mountain-climber', sets: 3, reps: 20, rest: 30, muscles: ['Kardio', 'Core'] },
]

// Stick figure AI koç animasyonu
function AICoach({ isActive, exerciseName }: { isActive: boolean; exerciseName: string }) {
  const [frame, setFrame] = useState(0)
  useEffect(() => {
    if (!isActive) return
    const t = setInterval(() => setFrame(f => (f + 1) % 4), 450)
    return () => clearInterval(t)
  }, [isActive])

  const squat = [0, -6, -12, -6]
  const dy = isActive ? (squat[frame] ?? 0) : 0

  return (
    <div className="flex flex-col items-center justify-center h-full relative">
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-64 h-64 rounded-full bg-blue-500/5 blur-3xl" />
      </div>
      <svg width="180" height="260" viewBox="0 0 180 260" className="relative z-10">
        {/* Glow */}
        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        {/* Head */}
        <circle cx="90" cy={28 + dy} r="20" fill="none" stroke="#3B82F6" strokeWidth="2.5" filter="url(#glow)" />
        <circle cx="83" cy={25 + dy} r="2.5" fill="#3B82F6" />
        <circle cx="97" cy={25 + dy} r="2.5" fill="#3B82F6" />
        <path d={`M 83 ${33 + dy} Q 90 ${38 + dy} 97 ${33 + dy}`} fill="none" stroke="#3B82F6" strokeWidth="1.5" />

        {/* Neck + Body */}
        <line x1="90" y1={48 + dy} x2="90" y2={120 + dy * 0.4} stroke="#3B82F6" strokeWidth="2.5" filter="url(#glow)" />

        {/* Arms */}
        <line x1="90" y1={65 + dy * 0.5} x2={isActive ? 55 - dy * 0.5 : 58} y2={100 + dy * 0.3} stroke="#3B82F6" strokeWidth="2.5" />
        <line x1="90" y1={65 + dy * 0.5} x2={isActive ? 125 + dy * 0.5 : 122} y2={100 + dy * 0.3} stroke="#3B82F6" strokeWidth="2.5" />

        {/* Legs */}
        <line x1="90" y1={120 + dy * 0.4} x2={isActive ? 70 : 75} y2={185 - dy * 0.2} stroke="#3B82F6" strokeWidth="2.5" />
        <line x1={isActive ? 70 : 75} y1={185 - dy * 0.2} x2={isActive ? 62 : 70} y2={245} stroke="#3B82F6" strokeWidth="2.5" />
        <line x1="90" y1={120 + dy * 0.4} x2={isActive ? 110 : 105} y2={185 - dy * 0.2} stroke="#3B82F6" strokeWidth="2.5" />
        <line x1={isActive ? 110 : 105} y1={185 - dy * 0.2} x2={isActive ? 118 : 110} y2={245} stroke="#3B82F6" strokeWidth="2.5" />

        {/* Joints */}
        {[
          [90, 65 + dy * 0.5], [90, 120 + dy * 0.4],
          [isActive ? 70 : 75, 185 - dy * 0.2],
          [isActive ? 110 : 105, 185 - dy * 0.2],
        ].map(([cx, cy], i) => (
          <circle key={i} cx={cx} cy={cy} r="4" fill="#1D4ED8" filter="url(#glow)" />
        ))}
      </svg>

      <div className="absolute bottom-6 left-0 right-0 text-center">
        <span className="text-blue-400 text-sm font-semibold bg-blue-500/10 px-3 py-1 rounded-full">
          {exerciseName}
        </span>
      </div>
    </div>
  )
}

// Kullanıcı kamerası — videoRef dışarıya açık
function UserCamera({ isOn, videoRef }: { isOn: boolean; videoRef: React.RefObject<HTMLVideoElement | null> }) {
  const streamRef = useRef<MediaStream | null>(null)

  useEffect(() => {
    if (!isOn) {
      streamRef.current?.getTracks().forEach(t => t.stop())
      return
    }
    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: 640, height: 480 } })
      .then(stream => {
        streamRef.current = stream
        if (videoRef.current) videoRef.current.srcObject = stream
      })
      .catch(() => {})
    return () => { streamRef.current?.getTracks().forEach(t => t.stop()) }
  }, [isOn, videoRef])

  if (!isOn) return (
    <div className="w-full h-full flex items-center justify-center bg-gray-900 rounded-xl">
      <div className="text-center">
        <VideoOff size={40} className="text-gray-600 mx-auto mb-2" />
        <p className="text-gray-500 text-xs">Kamera kapalı</p>
      </div>
    </div>
  )

  return (
    <div className="relative w-full h-full">
      <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover rounded-xl scale-x-[-1]" />
      <div className="absolute inset-0 rounded-xl border-2 border-blue-500/20 pointer-events-none" />
      <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-sm rounded-lg px-2 py-1">
        <span className="text-green-400 text-xs font-semibold flex items-center gap-1">
          <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse inline-block" />
          Canlı
        </span>
      </div>
    </div>
  )
}

export default function SessionPage() {
  const { speak, stop: stopSpeech, startRecording, stopRecording, isRecording, state: voiceState } = useVoiceChat({
    onTranscript: (text) => setAiMessage(`Sen: ${text}`),
    onAIResponse: (text) => setAiMessage(text),
  })
  const { startSession, recordSet, endSession } = useSessionTracker()

  const [isActive, setIsActive] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [isMicOn, setIsMicOn] = useState(true)
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

  useEffect(() => { currentSetRef.current = currentSet }, [currentSet])
  useEffect(() => { exerciseRef.current = exercise }, [exercise])
  useEffect(() => { isVoiceOnRef.current = isVoiceOn }, [isVoiceOn])
  useEffect(() => { isRestingRef.current = isResting }, [isResting])

  // AI mesaj getir
  const fetchAIMessage = useCallback(async (reps: number) => {
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
  }, [speak, isLoadingMessage])

  // Pose detection — gerçek rep sayımı
  const handleRep = useCallback((count: number, score: number) => {
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
        setExerciseIdx(i => Math.min(i + 1, EXERCISES.length - 1))
        setCurrentSet(1)
      } else {
        setCurrentSet(s => s + 1)
      }

      setRepCount(0)
      setIsResting(true)
      setRestTime(ex.rest)
    }
  }, [isPaused, fetchAIMessage, recordSet, speak])

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
      setSessionTime(s => s + 1)
      setCalories(c => c + 0.085)
      setHeartRate(h => Math.max(65, Math.min(185, h + (Math.random() - 0.4) * 2.5)))
    }, 1000)
    return () => clearInterval(t)
  }, [isActive, isPaused])

  // Dinlenme timer
  useEffect(() => {
    if (!isResting || restTime <= 0) return
    const t = setInterval(() => {
      setRestTime(r => {
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
    const msg = 'Seans başladı! İlk egzersizimiz ' + exercise.name + '. Hazır olduğunda başlayabilirsin!'
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
    `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col gap-3 -mt-8 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 pt-4 pb-4 overflow-hidden">

      {/* Pre-session overlay */}
      <AnimatePresence>
        {!isActive && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 bg-background/95 backdrop-blur-sm flex items-center justify-center"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="text-center max-w-md px-4"
            >
              <div className="w-20 h-20 rounded-full bg-blue-500/10 border border-blue-500/30 flex items-center justify-center mx-auto mb-6">
                <Activity size={36} className="text-blue-500" />
              </div>
              <h1 className="text-3xl font-black mb-2">Full Body Strength</h1>
              <p className="text-muted-foreground mb-6 text-sm">AI koçun hazır · Sesli yönlendirme açık</p>

              <div className="grid grid-cols-3 gap-3 mb-8">
                {[
                  { label: 'Egzersiz', value: `${EXERCISES.length}` },
                  { label: 'Süre', value: '~40 dk' },
                  { label: 'Kalori', value: '~300' },
                ].map(s => (
                  <div key={s.label} className="bg-card/50 border border-border/30 rounded-xl p-3">
                    <p className="text-xl font-black">{s.value}</p>
                    <p className="text-xs text-muted-foreground">{s.label}</p>
                  </div>
                ))}
              </div>

              <button
                onClick={startSeason}
                className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-colors"
              >
                <Play size={18} /> Seansı Başlat
              </button>
              <p className="text-xs text-muted-foreground mt-3">Sesli koçluk için ses açık olmalı</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stats bar */}
      <div className="flex items-center justify-between shrink-0 flex-wrap gap-2">
        <div className="flex items-center gap-3 flex-wrap">
          {[
            { icon: Timer, value: fmt(sessionTime), color: 'text-blue-400' },
            { icon: Heart, value: `${Math.round(heartRate)} bpm`, color: 'text-red-400' },
            { icon: Zap, value: `${Math.round(calories)} kcal`, color: 'text-yellow-400' },
          ].map(({ icon: Icon, value, color }) => (
            <div key={value} className="flex items-center gap-1.5 bg-card/50 border border-border/30 rounded-lg px-3 py-1.5">
              <Icon size={13} className={color} />
              <span className="text-sm font-mono font-bold">{value}</span>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-1.5">
          {EXERCISES.map((ex, i) => (
            <div
              key={ex.id}
              className={`h-1.5 w-6 rounded-full transition-colors ${
                i < exerciseIdx ? 'bg-green-500' :
                i === exerciseIdx ? 'bg-blue-400 animate-pulse' : 'bg-muted'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Video area */}
      <div className="flex-1 grid grid-cols-2 gap-3 min-h-0">
        {/* AI Koç */}
        <motion.div
          initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
          className="relative bg-gray-950 rounded-2xl overflow-hidden border border-blue-500/20"
        >
          <div className="absolute top-3 left-3 z-10 bg-blue-600/90 rounded-lg px-2.5 py-1 flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
            <span className="text-white text-xs font-semibold">AI Koç</span>
          </div>
          <div className="absolute top-3 right-3 z-10 bg-black/60 rounded-lg px-2.5 py-1">
            <p className="text-white text-xs font-semibold">{exercise.name}</p>
            <p className="text-gray-400 text-xs">Set {currentSet}/{exercise.sets}</p>
          </div>

          <AICoach isActive={isActive && !isPaused && !isResting} exerciseName={exercise.name} />

          {/* Pose detection durumu */}
          {isActive && isVideoOn && (
            <div className="absolute top-12 right-3 z-10">
              <div className={`text-xs px-2 py-1 rounded-lg font-medium ${poseLoaded ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                {poseLoaded ? 'Pose Aktif' : 'Yükleniyor...'}
              </div>
            </div>
          )}

          {/* AI mesaj */}
          <AnimatePresence mode="wait">
            <motion.div
              key={aiMessage}
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
              className="absolute bottom-3 left-3 right-3 bg-blue-700/90 backdrop-blur-sm rounded-xl px-3 py-2.5"
            >
              <div className="flex items-start gap-2">
                {isVoiceOn ? <Volume2 size={13} className="text-white mt-0.5 shrink-0" /> : <VolumeX size={13} className="text-white mt-0.5 shrink-0" />}
                <p className="text-white text-xs leading-relaxed">{aiMessage}</p>
              </div>
            </motion.div>
          </AnimatePresence>
        </motion.div>

        {/* Kullanıcı kamera */}
        <motion.div
          initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
          className="relative bg-gray-950 rounded-2xl overflow-hidden border border-border/30"
        >
          <UserCamera isOn={isVideoOn} videoRef={videoRef} />

          {/* Rep counter */}
          {isActive && !isResting && (
            <div className="absolute bottom-3 left-3 right-3 bg-black/75 backdrop-blur-sm rounded-xl px-3 py-2.5">
              <div className="flex items-center justify-between mb-1.5">
                <div>
                  <p className="text-gray-400 text-xs">Tekrar</p>
                  <div className="flex items-end gap-1">
                    <span className="text-white text-2xl font-black">{repCount}</span>
                    <span className="text-gray-500 text-sm mb-0.5">/{exercise.reps}</span>
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-gray-400 text-xs">Form</p>
                  <p className={`text-sm font-bold ${formScore >= 85 ? 'text-green-400' : formScore >= 70 ? 'text-yellow-400' : 'text-red-400'}`}>
                    {Math.round(formScore)}
                  </p>
                </div>
                <svg className="w-10 h-10 -rotate-90" viewBox="0 0 36 36">
                  <circle cx="18" cy="18" r="15" fill="none" stroke="#374151" strokeWidth="3" />
                  <circle
                    cx="18" cy="18" r="15" fill="none" stroke="#3B82F6" strokeWidth="3"
                    strokeDasharray={`${(repCount / exercise.reps) * 94} 94`}
                    strokeLinecap="round"
                  />
                </svg>
              </div>
              <div className="h-1 bg-gray-800 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-blue-500 rounded-full"
                  animate={{ width: `${(repCount / exercise.reps) * 100}%` }}
                />
              </div>
            </div>
          )}

          {/* Dinlenme overlay */}
          <AnimatePresence>
            {isResting && (
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center rounded-xl"
              >
                <div className="text-center">
                  <p className="text-gray-400 text-sm mb-1">Dinlenme</p>
                  <motion.p
                    key={restTime}
                    initial={{ scale: 1.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                    className="text-white text-5xl font-black"
                  >{restTime}</motion.p>
                  <p className="text-gray-500 text-xs mt-1">saniye</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between shrink-0 flex-wrap gap-2">
        {/* Egzersiz progress */}
        <div className="flex gap-1.5 flex-wrap">
          {EXERCISES.map((ex, i) => (
            <div
              key={ex.id}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium border ${
                i === exerciseIdx ? 'bg-blue-600 text-white border-blue-600' :
                i < exerciseIdx ? 'bg-green-500/15 text-green-400 border-green-500/30' :
                'bg-card/50 text-muted-foreground border-border/30'
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
            onMouseDown={startRecording}
            onMouseUp={stopRecording}
            onTouchStart={startRecording}
            onTouchEnd={stopRecording}
            title="Basılı tut ve konuş"
            className={`p-2.5 rounded-xl border transition-colors ${
              isRecording
                ? 'bg-red-500/30 border-red-500 text-red-300 animate-pulse'
                : voiceState === 'transcribing' || voiceState === 'thinking'
                ? 'bg-yellow-500/20 border-yellow-500/50 text-yellow-400'
                : voiceState === 'speaking'
                ? 'bg-blue-500/20 border-blue-500/50 text-blue-400'
                : 'bg-card/50 border-border/30 hover:bg-card'
            }`}
          >{isRecording ? <MicOff size={16} /> : <Mic size={16} />}</button>

          <button
            onClick={() => setIsVideoOn(v => !v)}
            className={`p-2.5 rounded-xl border transition-colors ${isVideoOn ? 'bg-card/50 border-border/30 hover:bg-card' : 'bg-red-500/15 border-red-500/30 text-red-400'}`}
          >{isVideoOn ? <Video size={16} /> : <VideoOff size={16} />}</button>

          <button
            onClick={() => { setIsVoiceOn(v => !v); if (isVoiceOn) stopSpeech() }}
            className={`p-2.5 rounded-xl border transition-colors ${isVoiceOn ? 'bg-card/50 border-border/30 hover:bg-card' : 'bg-orange-500/15 border-orange-500/30 text-orange-400'}`}
          >{isVoiceOn ? <Volume2 size={16} /> : <VolumeX size={16} />}</button>

          {isActive && (
            <button
              onClick={() => { setIsPaused(p => !p); if (!isPaused) stopSpeech() }}
              className="p-2.5 rounded-xl bg-yellow-500/15 border border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/25 transition-colors"
            >{isPaused ? <Play size={16} /> : <Pause size={16} />}</button>
          )}

          <button
            onClick={endSeason}
            className="p-2.5 rounded-xl bg-red-500/15 border border-red-500/30 text-red-400 hover:bg-red-500/25 transition-colors"
          ><Phone size={16} /></button>
        </div>
      </div>
    </div>
  )
}
