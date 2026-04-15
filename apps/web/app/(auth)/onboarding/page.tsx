'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import { motion, AnimatePresence } from 'framer-motion'
import { Step1Welcome } from './steps/Step1Welcome'
import { Step2Goal } from './steps/Step2Goal'
import { Step3Personal } from './steps/Step3Personal'
import { Step4Body } from './steps/Step4Body'
import { Step5Activity } from './steps/Step5Activity'
import { Step6Health } from './steps/Step6Health'
import { Step7Diet } from './steps/Step7Diet'
import { Step8Sleep } from './steps/Step8Sleep'
import { Step9Pet } from './steps/Step9Pet'
import { Step10Ready } from './steps/Step10Ready'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface OnboardingData {
  primaryGoal: string
  name: string
  age: number | undefined
  gender: string
  height: number | undefined
  weight: number | undefined
  targetWeight: number | undefined
  fitnessLevel: string
  trainingDaysPerWeek: number
  medicalRestrictions: string[]
  activeInjuries: string[]
  dietType: string
  avgSleepHours: number
  stressLevel: number
  waterIntakeTarget: number
  petName: string
}

export interface StepProps {
  data: OnboardingData
  onChange: (updates: Partial<OnboardingData>) => void
  onNext: () => void
  onBack?: () => void
}

// ─── Animation variants ───────────────────────────────────────────────────────

const variants = {
  enter: (dir: number) => ({ x: dir > 0 ? 300 : -300, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -300 : 300, opacity: 0 }),
}

// ─── Constants ────────────────────────────────────────────────────────────────

const TOTAL_STEPS = 10

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function OnboardingPage() {
  const router = useRouter()
  const { user } = useUser()

  const [currentStep, setCurrentStep] = useState(1)
  const [direction, setDirection] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [data, setData] = useState<OnboardingData>({
    primaryGoal: '',
    name: user?.firstName ?? '',
    age: undefined,
    gender: '',
    height: undefined,
    weight: undefined,
    targetWeight: undefined,
    fitnessLevel: '',
    trainingDaysPerWeek: 3,
    medicalRestrictions: [],
    activeInjuries: [],
    dietType: '',
    avgSleepHours: 7,
    stressLevel: 5,
    waterIntakeTarget: 2,
    petName: '',
  })

  const onChange = useCallback((updates: Partial<OnboardingData>) => {
    setData((prev) => ({ ...prev, ...updates }))
  }, [])

  const goNext = useCallback(() => {
    if (currentStep < TOTAL_STEPS) {
      setDirection(1)
      setCurrentStep((s) => s + 1)
    }
  }, [currentStep])

  const goBack = useCallback(() => {
    if (currentStep > 1) {
      setDirection(-1)
      setCurrentStep((s) => s - 1)
    }
  }, [currentStep])

  const handleFinish = useCallback(async () => {
    setIsSubmitting(true)
    try {
      await fetch('/api/onboarding/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          primaryGoal: data.primaryGoal,
          age: data.age,
          gender: data.gender,
          height: data.height,
          weight: data.weight,
          targetWeight: data.targetWeight,
          fitnessLevel: data.fitnessLevel,
          trainingDaysPerWeek: data.trainingDaysPerWeek,
          medicalRestrictions: data.medicalRestrictions,
          activeInjuries: data.activeInjuries,
          dietType: data.dietType,
          avgSleepHours: data.avgSleepHours,
          stressLevel: data.stressLevel,
          waterIntakeTarget: data.waterIntakeTarget,
          petName: data.petName,
        }),
      })
    } catch {
      // fail silently — redirect anyway
    } finally {
      setIsSubmitting(false)
    }
    setTimeout(() => router.push('/dashboard'), 2000)
  }, [data, router])

  // Trigger submit when reaching step 10
  const handleNext = useCallback(async () => {
    if (currentStep === TOTAL_STEPS - 1) {
      // Going to step 10 — trigger submit
      setDirection(1)
      setCurrentStep(TOTAL_STEPS)
      await handleFinish()
    } else {
      goNext()
    }
  }, [currentStep, goNext, handleFinish])

  const stepProps: StepProps = { data, onChange, onNext: handleNext, onBack: goBack }

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <Step1Welcome {...stepProps} />
      case 2:
        return <Step2Goal {...stepProps} />
      case 3:
        return <Step3Personal {...stepProps} />
      case 4:
        return <Step4Body {...stepProps} />
      case 5:
        return <Step5Activity {...stepProps} />
      case 6:
        return <Step6Health {...stepProps} />
      case 7:
        return <Step7Diet {...stepProps} />
      case 8:
        return <Step8Sleep {...stepProps} />
      case 9:
        return <Step9Pet {...stepProps} />
      case 10:
        return <Step10Ready {...stepProps} isSubmitting={isSubmitting} />
      default:
        return null
    }
  }

  // Steps where auto-advance happens (no manual Next button needed)
  const AUTO_ADVANCE_STEPS = new Set([1, 2, 5, 7])
  const isLastStep = currentStep === TOTAL_STEPS
  const showNav = !AUTO_ADVANCE_STEPS.has(currentStep) && !isLastStep

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-gray-950 via-indigo-950 to-gray-950">
      {/* Progress bar */}
      <div className="p-4 pb-0 pt-6">
        <div className="mx-auto max-w-lg">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs text-white/40">
              Adım {currentStep} / {TOTAL_STEPS}
            </span>
            <span className="text-xs text-white/40">
              {Math.round((currentStep / TOTAL_STEPS) * 100)}%
            </span>
          </div>
          <div className="h-1 overflow-hidden rounded-full bg-white/10">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500"
              animate={{ width: `${(currentStep / TOTAL_STEPS) * 100}%` }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
            />
          </div>
        </div>
      </div>

      {/* Step content */}
      <div className="flex flex-1 items-center justify-center overflow-hidden py-8">
        <div className="w-full max-w-lg">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={currentStep}
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3, ease: 'easeInOut' }}
            >
              {renderStep()}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Nav buttons */}
      {showNav && (
        <div className="p-6">
          <div className="mx-auto flex max-w-lg gap-3">
            {currentStep > 1 && (
              <button
                onClick={goBack}
                className="flex-1 rounded-2xl border-2 border-white/15 py-3 font-medium text-white/70 transition-all hover:border-white/30 hover:text-white"
              >
                ← Geri
              </button>
            )}
            <button
              onClick={handleNext}
              className="flex-[2] rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 py-3 font-semibold text-white shadow-lg shadow-indigo-500/30 transition-shadow hover:shadow-indigo-500/50"
            >
              {currentStep === TOTAL_STEPS - 1 ? 'Başla! 🚀' : 'İleri →'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
