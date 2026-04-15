'use client'
import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { ArrowLeft, Star } from 'lucide-react'

export default function MiniGamePage() {
  const [score, setScore] = useState(0)
  const [balls, setBalls] = useState<{ id: number; x: number; y: number }[]>([])
  const [gameActive, setGameActive] = useState(false)
  const [timeLeft, setTimeLeft] = useState(30)

  const startGame = useCallback(() => {
    setScore(0)
    setTimeLeft(30)
    setGameActive(true)
    setBalls([])

    // Topu ekle her saniye
    let count = 0
    const ballInterval = setInterval(() => {
      setBalls((prev) => [
        ...prev.slice(-5),
        {
          id: count++,
          x: Math.random() * 80 + 10,
          y: Math.random() * 60 + 10,
        },
      ])
    }, 800)

    // Geri sayım
    let t = 30
    const timer = setInterval(() => {
      t--
      setTimeLeft(t)
      if (t <= 0) {
        clearInterval(timer)
        clearInterval(ballInterval)
        setGameActive(false)
        setBalls([])
      }
    }, 1000)
  }, [])

  const catchBall = useCallback((id: number) => {
    setBalls((prev) => prev.filter((b) => b.id !== id))
    setScore((s) => s + 1)
  }, [])

  return (
    <div className="mx-auto max-w-sm space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/pet">
          <ArrowLeft size={20} className="text-white/60" />
        </Link>
        <h1 className="text-xl font-black text-white">Top Yakalama 🎾</h1>
      </div>

      {/* Oyun alanı */}
      <div className="relative h-72 overflow-hidden rounded-3xl border border-purple-500/20 bg-gradient-to-br from-purple-900/50 to-indigo-900/50">
        {/* Skor + süre */}
        <div className="absolute left-4 right-4 top-4 z-10 flex justify-between">
          <div className="flex items-center gap-1 font-black text-amber-400">
            <Star size={16} />
            <span>{score}</span>
          </div>
          <span className={`font-black ${timeLeft <= 10 ? 'text-red-400' : 'text-white/60'}`}>
            {timeLeft}s
          </span>
        </div>

        {/* Toplar */}
        <AnimatePresence>
          {balls.map((ball) => (
            <motion.button
              key={ball.id}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              onClick={() => catchBall(ball.id)}
              className="absolute h-10 w-10 -translate-x-1/2 -translate-y-1/2 text-2xl"
              style={{ left: `${ball.x}%`, top: `${ball.y}%` }}
            >
              🎾
            </motion.button>
          ))}
        </AnimatePresence>

        {/* Oyun yok */}
        {!gameActive && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
            {score > 0 && (
              <p className="text-sm text-white/60">
                Son skor: <span className="font-black text-amber-400">{score}</span> 🏆
              </p>
            )}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={startGame}
              className="rounded-2xl bg-gradient-to-r from-purple-500 to-indigo-600 px-8 py-3 font-bold text-white shadow-lg"
            >
              {score > 0 ? 'Tekrar Oyna' : 'Başla'}
            </motion.button>
          </div>
        )}
      </div>

      <p className="text-center text-xs text-white/30">
        30 saniyede mümkün olduğunca çok top yakala!
      </p>
    </div>
  )
}
