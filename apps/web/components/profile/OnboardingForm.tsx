'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ChevronRight,
  ChevronLeft,
  Check,
  User,
  Heart,
  Dumbbell,
  Apple,
  Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

interface BasicProfileData {
  age: number
  gender: string
  height: number
  weight: number
  fitnessLevel: string
  primaryGoal: string
  experienceYears: number
  targetWeight?: number
}

interface HealthData {
  injuries: string[]
  restrictions: string[]
  painPoints: string[]
}

interface TrainingData {
  trainingDaysPerWeek: number
  preferredExercises: string[]
  dislikedExercises: string[]
  trainingStyle: string
  preferredDuration: number
}

interface NutritionData {
  proteinTarget: number
  calorieTarget: number
  dietType: string
  avgSleepHours: number
  stressLevel: number
  waterIntakeTarget: number
  supplementStack: string[]
}

interface FormData {
  basic: Partial<BasicProfileData>
  health: Partial<HealthData>
  training: Partial<TrainingData>
  nutrition: Partial<NutritionData>
}

const STEPS = [
  { id: 'basic', title: 'Temel Profil', subtitle: 'Kişisel bilgilerini gir', icon: User },
  {
    id: 'health',
    title: 'Sağlık Metrikleri',
    subtitle: 'Sakatlık ve kısıtlamalarını belirt',
    icon: Heart,
  },
  {
    id: 'training',
    title: 'Antrenman Geçmişi',
    subtitle: 'Tercihlerini ve deneyimini paylaş',
    icon: Dumbbell,
  },
  { id: 'nutrition', title: 'Beslenme', subtitle: 'Hedef ve alışkanlıklarını gir', icon: Apple },
]

const FITNESS_LEVELS = [
  { value: 'beginner', label: 'Başlangıç' },
  { value: 'intermediate', label: 'Orta' },
  { value: 'advanced', label: 'İleri' },
  { value: 'elite', label: 'Elit' },
]

const GOALS = [
  { value: 'weight_loss', label: 'Kilo Verme' },
  { value: 'muscle_gain', label: 'Kas Kazanımı' },
  { value: 'endurance', label: 'Dayanıklılık' },
  { value: 'flexibility', label: 'Esneklik' },
  { value: 'general_fitness', label: 'Genel Sağlık' },
  { value: 'sport_specific', label: 'Spor Performansı' },
]

const GENDERS = [
  { value: 'male', label: 'Erkek' },
  { value: 'female', label: 'Kadın' },
  { value: 'other', label: 'Diğer' },
]

const INJURY_OPTIONS = ['Diz', 'Sırt / Bel', 'Omuz', 'El Bileği', 'Ayak Bileği', 'Boyun', 'Kalça']
const EXERCISE_OPTIONS = [
  'Squat',
  'Deadlift',
  'Bench Press',
  'Pull-up',
  'Overhead Press',
  'Row',
  'Lunges',
  'Hip Thrust',
  'Dips',
  'Curl',
]

const TRAINING_STYLES = [
  { value: 'strength', label: 'Güç' },
  { value: 'hypertrophy', label: 'Hipertrofi' },
  { value: 'cardio', label: 'Kardio' },
  { value: 'hiit', label: 'HIIT' },
  { value: 'crossfit', label: 'CrossFit' },
  { value: 'powerlifting', label: 'Powerlifting' },
]

const DIET_TYPES = [
  { value: 'standard', label: 'Standart' },
  { value: 'vegetarian', label: 'Vejetaryen' },
  { value: 'vegan', label: 'Vegan' },
  { value: 'keto', label: 'Keto' },
  { value: 'paleo', label: 'Paleo' },
  { value: 'intermittent_fasting', label: 'Aralıklı Oruç' },
]

const SUPPLEMENT_OPTIONS = [
  'Whey Protein',
  'Kreatin',
  'BCAA',
  'Omega-3',
  'Vitamin D',
  'Magnezyum',
  'Pre-workout',
  'Glutamin',
]

const SLIDE_VARIANTS = {
  enter: (dir: number) => ({ x: dir > 0 ? 60 : -60, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir < 0 ? 60 : -60, opacity: 0 }),
}

function toggleItem(arr: string[], item: string): string[] {
  return arr.includes(item) ? arr.filter((i) => i !== item) : [...arr, item]
}

function OptionButton({
  selected,
  onClick,
  children,
  color = 'primary',
}: {
  selected: boolean
  onClick: () => void
  children: React.ReactNode
  color?: 'primary' | 'red' | 'orange' | 'green' | 'blue'
}) {
  const colorMap = {
    primary: 'bg-primary/10 border-primary text-primary',
    red: 'bg-red-500/10 border-red-500 text-red-400',
    orange: 'bg-orange-500/10 border-orange-500 text-orange-400',
    green: 'bg-green-500/10 border-green-500 text-green-400',
    blue: 'bg-blue-500/10 border-blue-500 text-blue-400',
  }
  return (
    <button
      onClick={onClick}
      className={cn(
        'rounded-full border px-3 py-1.5 text-xs font-semibold transition-all',
        selected ? colorMap[color] : 'border-border hover:border-border/80 text-muted-foreground'
      )}
    >
      {children}
    </button>
  )
}

interface OnboardingFormProps {
  onComplete?: () => void
}

export function OnboardingForm({ onComplete }: OnboardingFormProps) {
  const [step, setStep] = useState(0)
  const [dir, setDir] = useState(1)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState<FormData>({
    basic: {},
    health: { injuries: [], restrictions: [], painPoints: [] },
    training: {
      preferredExercises: [],
      dislikedExercises: [],
      trainingDaysPerWeek: 3,
      preferredDuration: 45,
    },
    nutrition: { supplementStack: [], avgSleepHours: 7, stressLevel: 5, waterIntakeTarget: 2500 },
  })

  const currentStep = STEPS[step]!
  const progress = (step / STEPS.length) * 100

  const updateBasic = (field: keyof BasicProfileData, value: any) =>
    setFormData((p) => ({ ...p, basic: { ...p.basic, [field]: value } }))
  const updateHealth = (field: keyof HealthData, value: any) =>
    setFormData((p) => ({ ...p, health: { ...p.health, [field]: value } }))
  const updateTraining = (field: keyof TrainingData, value: any) =>
    setFormData((p) => ({ ...p, training: { ...p.training, [field]: value } }))
  const updateNutrition = (field: keyof NutritionData, value: any) =>
    setFormData((p) => ({ ...p, nutrition: { ...p.nutrition, [field]: value } }))

  const goNext = async () => {
    if (step < STEPS.length - 1) {
      setDir(1)
      setStep((s) => s + 1)
    } else {
      await handleSave()
    }
  }

  const goPrev = () => {
    setDir(-1)
    setStep((s) => s - 1)
  }

  const handleSave = async () => {
    setSaving(true)
    setError('')
    try {
      const responses = await Promise.all([
        fetch('/api/user/profile/basic', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData.basic),
        }),
        fetch('/api/user/profile/health', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData.health),
        }),
        fetch('/api/user/profile/training', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData.training),
        }),
        fetch('/api/user/profile/nutrition', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData.nutrition),
        }),
      ])

      // Check if all responses are OK
      for (const response of responses) {
        if (!response.ok) {
          const error = await response.json().catch(() => ({ error: 'Unknown error' }))
          throw new Error(error.error || `Request failed: ${response.status}`)
        }
      }

      onComplete?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bir hata oluştu. Lütfen tekrar dene.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mx-auto w-full max-w-xl">
      {/* Progress bar */}
      <div className="bg-muted relative mb-8 h-1.5 overflow-hidden rounded-full">
        <motion.div
          className="bg-primary absolute inset-y-0 left-0 rounded-full"
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.4 }}
        />
      </div>

      {/* Step indicators */}
      <div className="mb-8 flex items-center justify-center gap-1">
        {STEPS.map((s, i) => {
          const Icon = s.icon
          const done = i < step
          const active = i === step
          return (
            <div key={s.id} className="flex items-center gap-1">
              <div
                className={cn(
                  'flex h-9 w-9 items-center justify-center rounded-full border-2 transition-all',
                  done
                    ? 'bg-primary border-primary'
                    : active
                      ? 'border-primary bg-primary/10'
                      : 'border-border bg-muted/30'
                )}
              >
                {done ? (
                  <Check size={14} className="text-primary-foreground" />
                ) : (
                  <Icon size={14} className={active ? 'text-primary' : 'text-muted-foreground'} />
                )}
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className={cn(
                    'h-0.5 w-10 transition-colors sm:w-16',
                    i < step ? 'bg-primary' : 'bg-border'
                  )}
                />
              )}
            </div>
          )
        })}
      </div>

      {/* Content */}
      <AnimatePresence mode="wait" custom={dir}>
        <motion.div
          key={step}
          custom={dir}
          variants={SLIDE_VARIANTS}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.22, ease: 'easeOut' }}
          className="space-y-5"
        >
          <div className="mb-6 text-center">
            <h2 className="mb-1 text-2xl font-black">{currentStep.title}</h2>
            <p className="text-muted-foreground text-sm">{currentStep.subtitle}</p>
          </div>

          {/* Step 0: Basic Profile */}
          {step === 0 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-muted-foreground mb-1.5 block text-xs font-semibold">
                    Yaş
                  </label>
                  <Input
                    type="number"
                    placeholder="25"
                    value={formData.basic.age ?? ''}
                    onChange={(e) => updateBasic('age', +e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-muted-foreground mb-1.5 block text-xs font-semibold">
                    Deneyim (yıl)
                  </label>
                  <Input
                    type="number"
                    placeholder="2"
                    value={formData.basic.experienceYears ?? ''}
                    onChange={(e) => updateBasic('experienceYears', +e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-muted-foreground mb-1.5 block text-xs font-semibold">
                    Boy (cm)
                  </label>
                  <Input
                    type="number"
                    placeholder="175"
                    value={formData.basic.height ?? ''}
                    onChange={(e) => updateBasic('height', +e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-muted-foreground mb-1.5 block text-xs font-semibold">
                    Kilo (kg)
                  </label>
                  <Input
                    type="number"
                    placeholder="75"
                    value={formData.basic.weight ?? ''}
                    onChange={(e) => updateBasic('weight', +e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="text-muted-foreground mb-1.5 block text-xs font-semibold">
                  Cinsiyet
                </label>
                <div className="flex gap-2">
                  {GENDERS.map((g) => (
                    <button
                      key={g.value}
                      onClick={() => updateBasic('gender', g.value)}
                      className={cn(
                        'flex-1 rounded-lg border py-2.5 text-xs font-semibold transition-all',
                        formData.basic.gender === g.value
                          ? 'bg-primary/10 border-primary text-primary'
                          : 'border-border text-muted-foreground hover:border-primary/40'
                      )}
                    >
                      {g.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-muted-foreground mb-1.5 block text-xs font-semibold">
                  Fitness Seviyesi
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {FITNESS_LEVELS.map((l) => (
                    <button
                      key={l.value}
                      onClick={() => updateBasic('fitnessLevel', l.value)}
                      className={cn(
                        'rounded-lg border py-2.5 text-xs font-semibold transition-all',
                        formData.basic.fitnessLevel === l.value
                          ? 'bg-primary/10 border-primary text-primary'
                          : 'border-border text-muted-foreground hover:border-primary/40'
                      )}
                    >
                      {l.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-muted-foreground mb-1.5 block text-xs font-semibold">
                  Birincil Hedef
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {GOALS.map((g) => (
                    <button
                      key={g.value}
                      onClick={() => updateBasic('primaryGoal', g.value)}
                      className={cn(
                        'rounded-lg border px-3 py-2.5 text-left text-xs font-semibold transition-all',
                        formData.basic.primaryGoal === g.value
                          ? 'bg-primary/10 border-primary text-primary'
                          : 'border-border text-muted-foreground hover:border-primary/40'
                      )}
                    >
                      {g.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 1: Health */}
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <label className="text-muted-foreground mb-2 block text-xs font-semibold">
                  Aktif Sakatlıklar
                </label>
                <div className="flex flex-wrap gap-2">
                  {INJURY_OPTIONS.map((inj) => (
                    <OptionButton
                      key={inj}
                      color="red"
                      selected={(formData.health.injuries ?? []).includes(inj)}
                      onClick={() =>
                        updateHealth('injuries', toggleItem(formData.health.injuries ?? [], inj))
                      }
                    >
                      {inj}
                    </OptionButton>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-muted-foreground mb-1.5 block text-xs font-semibold">
                  Tıbbi Kısıtlamalar
                </label>
                <Input
                  placeholder="Örn: Hipertansiyon, Diyabet..."
                  value={(formData.health.restrictions ?? []).join(', ')}
                  onChange={(e) =>
                    updateHealth(
                      'restrictions',
                      e.target.value
                        .split(',')
                        .map((s) => s.trim())
                        .filter(Boolean)
                    )
                  }
                />
                <p className="text-muted-foreground mt-1 text-xs">
                  Virgülle ayırarak birden fazla girebilirsin
                </p>
              </div>
              <div>
                <label className="text-muted-foreground mb-2 block text-xs font-semibold">
                  Ağrı Bölgeleri
                </label>
                <div className="flex flex-wrap gap-2">
                  {INJURY_OPTIONS.map((area) => (
                    <OptionButton
                      key={area}
                      color="orange"
                      selected={(formData.health.painPoints ?? []).includes(area)}
                      onClick={() =>
                        updateHealth(
                          'painPoints',
                          toggleItem(formData.health.painPoints ?? [], area)
                        )
                      }
                    >
                      {area}
                    </OptionButton>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Training */}
          {step === 2 && (
            <div className="space-y-5">
              <div>
                <label className="text-muted-foreground mb-2 block text-xs font-semibold">
                  Haftada Antrenman Günü:{' '}
                  <span className="text-primary font-bold">
                    {formData.training.trainingDaysPerWeek ?? 3}
                  </span>
                </label>
                <input
                  type="range"
                  min={1}
                  max={7}
                  value={formData.training.trainingDaysPerWeek ?? 3}
                  onChange={(e) => updateTraining('trainingDaysPerWeek', +e.target.value)}
                  className="accent-primary w-full cursor-pointer"
                />
                <div className="text-muted-foreground mt-1 flex justify-between text-xs">
                  <span>1 gün</span>
                  <span>7 gün</span>
                </div>
              </div>

              <div>
                <label className="text-muted-foreground mb-2 block text-xs font-semibold">
                  Seans Süresi:{' '}
                  <span className="text-primary font-bold">
                    {formData.training.preferredDuration ?? 45} dk
                  </span>
                </label>
                <input
                  type="range"
                  min={20}
                  max={120}
                  step={5}
                  value={formData.training.preferredDuration ?? 45}
                  onChange={(e) => updateTraining('preferredDuration', +e.target.value)}
                  className="accent-primary w-full cursor-pointer"
                />
                <div className="text-muted-foreground mt-1 flex justify-between text-xs">
                  <span>20 dk</span>
                  <span>120 dk</span>
                </div>
              </div>

              <div>
                <label className="text-muted-foreground mb-2 block text-xs font-semibold">
                  Antrenman Stili
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {TRAINING_STYLES.map((s) => (
                    <button
                      key={s.value}
                      onClick={() => updateTraining('trainingStyle', s.value)}
                      className={cn(
                        'rounded-lg border py-2.5 text-xs font-semibold transition-all',
                        formData.training.trainingStyle === s.value
                          ? 'bg-primary/10 border-primary text-primary'
                          : 'border-border text-muted-foreground hover:border-primary/40'
                      )}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-muted-foreground mb-2 block text-xs font-semibold">
                  Tercih Ettiğin Egzersizler
                </label>
                <div className="flex flex-wrap gap-2">
                  {EXERCISE_OPTIONS.map((ex) => (
                    <OptionButton
                      key={ex}
                      color="green"
                      selected={(formData.training.preferredExercises ?? []).includes(ex)}
                      onClick={() =>
                        updateTraining(
                          'preferredExercises',
                          toggleItem(formData.training.preferredExercises ?? [], ex)
                        )
                      }
                    >
                      {ex}
                    </OptionButton>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Nutrition */}
          {step === 3 && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-muted-foreground mb-1.5 block text-xs font-semibold">
                    Protein Hedefi (g/gün)
                  </label>
                  <Input
                    type="number"
                    placeholder="150"
                    value={formData.nutrition.proteinTarget ?? ''}
                    onChange={(e) => updateNutrition('proteinTarget', +e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-muted-foreground mb-1.5 block text-xs font-semibold">
                    Kalori Hedefi (kcal)
                  </label>
                  <Input
                    type="number"
                    placeholder="2200"
                    value={formData.nutrition.calorieTarget ?? ''}
                    onChange={(e) => updateNutrition('calorieTarget', +e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="text-muted-foreground mb-2 block text-xs font-semibold">
                  Diyet Tipi
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {DIET_TYPES.map((d) => (
                    <button
                      key={d.value}
                      onClick={() => updateNutrition('dietType', d.value)}
                      className={cn(
                        'rounded-lg border py-2.5 text-xs font-semibold transition-all',
                        formData.nutrition.dietType === d.value
                          ? 'bg-primary/10 border-primary text-primary'
                          : 'border-border text-muted-foreground hover:border-primary/40'
                      )}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-muted-foreground mb-2 block text-xs font-semibold">
                  Ortalama Uyku:{' '}
                  <span className="text-primary font-bold">
                    {formData.nutrition.avgSleepHours ?? 7} saat
                  </span>
                </label>
                <input
                  type="range"
                  min={4}
                  max={12}
                  step={0.5}
                  value={formData.nutrition.avgSleepHours ?? 7}
                  onChange={(e) => updateNutrition('avgSleepHours', +e.target.value)}
                  className="accent-primary w-full cursor-pointer"
                />
                <div className="text-muted-foreground mt-1 flex justify-between text-xs">
                  <span>4 saat</span>
                  <span>12 saat</span>
                </div>
              </div>

              <div>
                <label className="text-muted-foreground mb-2 block text-xs font-semibold">
                  Supleman Kullanımı
                </label>
                <div className="flex flex-wrap gap-2">
                  {SUPPLEMENT_OPTIONS.map((sup) => (
                    <OptionButton
                      key={sup}
                      color="blue"
                      selected={(formData.nutrition.supplementStack ?? []).includes(sup)}
                      onClick={() =>
                        updateNutrition(
                          'supplementStack',
                          toggleItem(formData.nutrition.supplementStack ?? [], sup)
                        )
                      }
                    >
                      {sup}
                    </OptionButton>
                  ))}
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {error && <p className="text-destructive mt-4 text-center text-sm">{error}</p>}

      {/* Navigation */}
      <div className="mt-8 flex items-center justify-between">
        <button
          onClick={goPrev}
          disabled={step === 0}
          className="text-muted-foreground hover:text-foreground flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-30"
        >
          <ChevronLeft size={16} /> Geri
        </button>
        <Button onClick={goNext} disabled={saving} className="flex items-center gap-2 px-8">
          {saving ? (
            <>
              <Loader2 size={14} className="animate-spin" /> Kaydediliyor...
            </>
          ) : step === STEPS.length - 1 ? (
            <>
              <Check size={14} /> Tamamla
            </>
          ) : (
            <>
              Devam <ChevronRight size={14} />
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
