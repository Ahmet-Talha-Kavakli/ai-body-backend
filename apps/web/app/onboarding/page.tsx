'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { ChevronRight, ChevronLeft, Check, Dumbbell, Target, Clock, AlertTriangle, Home, Zap } from 'lucide-react'
import Image from 'next/image'
import { THIINGS } from '@/lib/thiings'

const STEPS = [
  {
    id: 'fitness-level',
    title: 'Fitness seviyeni seç',
    subtitle: 'Bu, AI koçunun sana uygun program oluşturmasına yardımcı olur.',
    type: 'single',
    icon: Dumbbell,
    options: [
      { value: 'beginner', label: 'Başlangıç', desc: 'Düzenli egzersiz yapmıyorum veya yeni başlıyorum', img: THIINGS.leaf },
      { value: 'intermediate', label: 'Orta', desc: 'Haftada 2-3 gün düzenli antrenman yapıyorum', img: THIINGS.dumbbell },
      { value: 'advanced', label: 'İleri', desc: 'Haftada 4-5 gün yoğun antrenman yapıyorum', img: THIINGS.flame },
      { value: 'elite', label: 'Elit', desc: 'Profesyonel sporcu veya deneyimli atlet', img: THIINGS.trophy },
    ],
  },
  {
    id: 'goals',
    title: 'Hedeflerini seç',
    subtitle: 'Birden fazla hedef seçebilirsin.',
    type: 'multi',
    icon: Target,
    options: [
      { value: 'weight-loss', label: 'Kilo Vermek', desc: 'Yağ yakmak ve forma girmek', img: THIINGS.lightningBolt },
      { value: 'muscle-gain', label: 'Kas Kazanmak', desc: 'Kas kütlesi ve güç artırmak', img: THIINGS.barbell },
      { value: 'endurance', label: 'Dayanıklılık', desc: 'Kardiyovasküler sağlık ve kondisyon', img: THIINGS.running },
      { value: 'flexibility', label: 'Esneklik', desc: 'Mobilite ve esneklik geliştirmek', img: THIINGS.yoga },
      { value: 'health', label: 'Genel Sağlık', desc: 'Sağlıklı yaşam tarzı sürdürmek', img: THIINGS.heart },
      { value: 'sport', label: 'Spor Performansı', desc: 'Belirli bir spor için antrenman', img: THIINGS.goldMedal },
    ],
  },
  {
    id: 'time',
    title: 'Günlük ne kadar vaktın var?',
    subtitle: 'AI koçun bu süreye göre program hazırlayacak.',
    type: 'single',
    icon: Clock,
    options: [
      { value: '20', label: '20 dakika', desc: 'Kısa ve yoğun antrenmanlar', img: THIINGS.lightning },
      { value: '30', label: '30 dakika', desc: 'Etkili ve dengeli program', img: THIINGS.stopwatch },
      { value: '45', label: '45 dakika', desc: 'Kapsamlı antrenman', img: THIINGS.timer },
      { value: '60', label: '60+ dakika', desc: 'Detaylı ve tam program', img: THIINGS.hourglass },
    ],
  },
  {
    id: 'injuries',
    title: 'Herhangi bir sakatlığın var mı?',
    subtitle: 'AI koçun sakatlıklarına göre egzersizleri ayarlayacak.',
    type: 'multi',
    icon: AlertTriangle,
    options: [
      { value: 'none', label: 'Yok', desc: 'Herhangi bir sakatlığım yok', img: THIINGS.checkmark },
      { value: 'knee', label: 'Diz', desc: 'Diz ağrısı veya sakatlığı', img: THIINGS.foot },
      { value: 'back', label: 'Sırt / Bel', desc: 'Sırt veya bel problemi', img: THIINGS.brain },
      { value: 'shoulder', label: 'Omuz', desc: 'Omuz ağrısı veya sakatlığı', img: THIINGS.yogaMat },
      { value: 'wrist', label: 'El bileği', desc: 'El bileği problemi', img: THIINGS.weight },
      { value: 'ankle', label: 'Ayak bileği', desc: 'Ayak bileği sorunu', img: THIINGS.foot },
    ],
  },
  {
    id: 'equipment',
    title: 'Hangi ekipmana erişimin var?',
    subtitle: 'Birden fazla seçebilirsin.',
    type: 'multi',
    icon: Home,
    options: [
      { value: 'none', label: 'Ekipmansız', desc: 'Sadece vücut ağırlığı egzersizleri', img: THIINGS.checkMark },
      { value: 'dumbbells', label: 'Dambıl', desc: 'Evde dambıl setim var', img: THIINGS.dumbbell },
      { value: 'bands', label: 'Direnç Bandı', desc: 'Elastik bant kullanıyorum', img: THIINGS.resistanceBand },
      { value: 'gym', label: 'Spor Salonu', desc: 'Tam donanımlı gym erişimim var', img: THIINGS.gym },
      { value: 'pullup', label: 'Barfiks Barı', desc: 'Barfiks barım mevcut', img: THIINGS.pullUpBar },
      { value: 'cardio', label: 'Kardio Aleti', desc: 'Koşu bandı, bisiklet vb.', img: THIINGS.treadmill },
    ],
  },
]

const SLIDE_VARIANTS = {
  enter: (direction: number) => ({ x: direction > 0 ? 300 : -300, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (direction: number) => ({ x: direction < 0 ? 300 : -300, opacity: 0 }),
}

export default function OnboardingPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(0)
  const [direction, setDirection] = useState(1)
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({})
  const [isCompleting, setIsCompleting] = useState(false)
  const [error, setError] = useState('')

  const step = STEPS[currentStep]!
  const totalSteps = STEPS.length
  const progress = (currentStep / totalSteps) * 100

  const currentAnswer = answers[step.id]
  const isAnswered = step.type === 'single'
    ? !!currentAnswer
    : Array.isArray(currentAnswer) && currentAnswer.length > 0

  const handleSingle = (value: string) => setAnswers(prev => ({ ...prev, [step.id]: value }))

  const handleMulti = (value: string) => {
    const current = (answers[step.id] as string[]) || []
    if (value === 'none') {
      setAnswers(prev => ({ ...prev, [step.id]: ['none'] }))
      return
    }
    const filtered = current.filter(v => v !== 'none')
    const updated = filtered.includes(value)
      ? filtered.filter(v => v !== value)
      : [...filtered, value]
    setAnswers(prev => ({ ...prev, [step.id]: updated }))
  }

  const goNext = () => {
    if (currentStep < totalSteps - 1) {
      setDirection(1)
      setCurrentStep(s => s + 1)
    } else {
      handleComplete()
    }
  }

  const goPrev = () => {
    if (currentStep > 0) {
      setDirection(-1)
      setCurrentStep(s => s - 1)
    }
  }

  const handleComplete = async () => {
    setIsCompleting(true)
    setError('')
    try {
      // Önce user sync
      await fetch('/api/user/sync', { method: 'POST' })

      // Onboarding verilerini kaydet
      const res = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fitnessLevel: answers['fitness-level'],
          goals: answers['goals'],
          sessionDuration: answers['time'],
          injuries: answers['injuries'],
          equipment: answers['equipment'],
        }),
      })

      if (!res.ok) throw new Error('Kayıt başarısız')

      // AI programı oluştur (arka planda, bekleme)
      fetch('/api/ai/generate-program', { method: 'POST' }).catch(() => {})

      await new Promise(r => setTimeout(r, 1000))
      router.push('/dashboard')
    } catch {
      setError('Bir hata oluştu. Tekrar dene.')
      setIsCompleting(false)
    }
  }

  const isSelected = (value: string) => {
    if (step.type === 'single') return currentAnswer === value
    return Array.isArray(currentAnswer) && currentAnswer.includes(value)
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
      {/* Logo */}
      <div className="fixed top-6 left-6 flex items-center gap-2">
        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
          <Zap size={16} className="text-white" />
        </div>
        <span className="font-bold text-lg">FitAI</span>
      </div>

      {/* Progress bar */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-muted">
        <motion.div
          className="h-full bg-blue-600"
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.4 }}
        />
      </div>

      {/* Adım sayacı */}
      <div className="fixed top-6 right-6 text-sm text-muted-foreground">
        {currentStep + 1} / {totalSteps}
      </div>

      <div className="w-full max-w-2xl">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentStep}
            custom={direction}
            variants={SLIDE_VARIANTS}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            <div className="text-center mb-10">
              <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mx-auto mb-5">
                <step.icon size={26} className="text-blue-400" />
              </div>
              <h1 className="text-2xl md:text-3xl font-black mb-3">{step.title}</h1>
              <p className="text-muted-foreground text-sm">{step.subtitle}</p>
            </div>

            <div className={`grid gap-3 ${step.options.length === 4 ? 'grid-cols-2' : 'grid-cols-2 md:grid-cols-3'}`}>
              {step.options.map(option => {
                const selected = isSelected(option.value)
                return (
                  <motion.button
                    key={option.value}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => step.type === 'single' ? handleSingle(option.value) : handleMulti(option.value)}
                    className={`relative p-4 rounded-2xl border text-left transition-all ${
                      selected
                        ? 'bg-blue-600/10 border-blue-500 shadow-lg shadow-blue-500/10'
                        : 'bg-card/50 border-border/30 hover:border-blue-500/40'
                    }`}
                  >
                    {selected && (
                      <div className="absolute top-3 right-3 w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
                        <Check size={11} className="text-white" />
                      </div>
                    )}
                    <Image src={option.img} alt={option.label} width={44} height={44} unoptimized className="mb-2 drop-shadow-md" />
                    <p className={`font-bold text-sm mb-1 ${selected ? 'text-blue-400' : ''}`}>{option.label}</p>
                    <p className="text-xs text-muted-foreground leading-snug">{option.desc}</p>
                  </motion.button>
                )
              })}
            </div>
          </motion.div>
        </AnimatePresence>

        {error && (
          <p className="text-red-400 text-sm text-center mt-4">{error}</p>
        )}

        <div className="flex items-center justify-between mt-10">
          <button
            onClick={goPrev}
            disabled={currentStep === 0}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft size={16} />
            Geri
          </button>

          <motion.button
            onClick={goNext}
            disabled={!isAnswered || isCompleting}
            whileHover={{ scale: isAnswered ? 1.03 : 1 }}
            whileTap={{ scale: isAnswered ? 0.97 : 1 }}
            className={`flex items-center gap-2 px-8 py-3 rounded-xl text-sm font-bold transition-all ${
              isAnswered && !isCompleting
                ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/30'
                : 'bg-muted text-muted-foreground cursor-not-allowed'
            }`}
          >
            {isCompleting ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Kaydediliyor...
              </>
            ) : currentStep === totalSteps - 1 ? (
              <><Zap size={16} /> Başla</>
            ) : (
              <>Devam <ChevronRight size={16} /></>
            )}
          </motion.button>
        </div>

        {currentStep === 0 && (
          <p className="text-center mt-4">
            <button
              onClick={() => router.push('/dashboard')}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Şimdilik atla
            </button>
          </p>
        )}
      </div>

      <AnimatePresence>
        {isCompleting && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-background/95 backdrop-blur-sm flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.4, type: 'spring', stiffness: 200 }}
                className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6"
              >
                <Check size={36} className="text-white" />
              </motion.div>
              <h2 className="text-3xl font-black mb-2">Harika! 🎉</h2>
              <p className="text-muted-foreground">AI koçun hazırlanıyor...</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
