# Mod 2: Fitness Koçu / Sesli Danışmanlık — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a "Fitness Coach" voice consultation mode — a Zoom-style layout with the 3D PT character on the left (talking animation), user camera on the right, real-time transcript, topic chips, and full VAPI voice session.

**Architecture:** Builds on the VAPI infrastructure already in `apps/web/lib/vapi/`. A new `fitness-coach-prompt.ts` builds the system prompt from the user's `HealthProfile`. A `useFitnessCoachSession` hook manages the VAPI call lifecycle. The 3D character from Mod 1 is reused — speech animation is driven by VAPI's audio level events. Transcript is streamed in real-time from VAPI's message events.

**Tech Stack:** VAPI SDK (already installed), React Three Fiber, Three.js, Next.js App Router, Vitest, TypeScript strict mode.

**Prerequisite:** Mod 1 plan must be executed first (PTCharacter3D component must exist).

---

## Chunk 1: VAPI Fitness Coach Infrastructure

### Task 1: Fitness coach system prompt builder

**Files:**

- Create: `apps/web/lib/vapi/fitness-coach-prompt.ts`
- Create: `apps/web/lib/vapi/__tests__/fitness-coach-prompt.test.ts`

- [ ] **Step 1: Write failing tests**

```typescript
// apps/web/lib/vapi/__tests__/fitness-coach-prompt.test.ts
import { describe, it, expect } from 'vitest'
import { buildFitnessCoachPrompt } from '../fitness-coach-prompt'

describe('buildFitnessCoachPrompt', () => {
  const profile = {
    name: 'Ahmet',
    weightKg: 80,
    heightCm: 178,
    goals: ['weight_loss', 'muscle_gain'],
    fitnessLevel: 'intermediate' as const,
    injuries: [],
    weeklyWorkouts: 3,
    supplements: ['whey', 'creatine'],
  }

  it('includes user name', () => {
    expect(buildFitnessCoachPrompt(profile)).toContain('Ahmet')
  })

  it('includes weight and height', () => {
    const prompt = buildFitnessCoachPrompt(profile)
    expect(prompt).toContain('80')
    expect(prompt).toContain('178')
  })

  it('includes goals', () => {
    expect(buildFitnessCoachPrompt(profile)).toContain('weight_loss')
  })

  it('includes supplements', () => {
    expect(buildFitnessCoachPrompt(profile)).toContain('whey')
  })

  it('says no injuries when list is empty', () => {
    expect(buildFitnessCoachPrompt(profile)).toContain('yok')
  })

  it('includes injury when present', () => {
    const p = { ...profile, injuries: ['diz ağrısı'] }
    expect(buildFitnessCoachPrompt(p)).toContain('diz ağrısı')
  })

  it('says no supplements when list is empty', () => {
    const p = { ...profile, supplements: [] }
    expect(buildFitnessCoachPrompt(p)).toContain('belirtilmemiş')
  })
})
```

- [ ] **Step 2: Run tests — verify FAIL**

```bash
cd apps/web && npx vitest run lib/vapi/__tests__/fitness-coach-prompt.test.ts
```

- [ ] **Step 3: Implement**

```typescript
// apps/web/lib/vapi/fitness-coach-prompt.ts
import type { FitnessLevel } from '@repo/shared-types'

export interface UserCoachProfile {
  name: string
  weightKg: number
  heightCm: number
  goals: string[]
  fitnessLevel: FitnessLevel
  injuries: string[]
  weeklyWorkouts: number
  supplements: string[]
}

export function buildFitnessCoachPrompt(profile: UserCoachProfile): string {
  return `Sen ${profile.name}'in kişisel fitness koçusun.

Kullanıcı profili:
- Kilo: ${profile.weightKg}kg, Boy: ${profile.heightCm}cm
- Hedef: ${profile.goals.join(', ')}
- Fitness seviyesi: ${profile.fitnessLevel}
- Aktif sakatlıklar: ${profile.injuries.length > 0 ? profile.injuries.join(', ') : 'yok'}
- Bu hafta ${profile.weeklyWorkouts} antrenman yaptı
- Supplement stack: ${profile.supplements.length > 0 ? profile.supplements.join(', ') : 'belirtilmemiş'}

Türkçe konuş. Samimi, motive edici ve bilgi dolu ol.
Supplement, beslenme, kilo yönetimi, uyku, stres konularında danışmanlık ver.
Tıbbi teşhis koyma, genel tavsiye ver.`
}
```

- [ ] **Step 4: Run tests — verify PASS**

```bash
cd apps/web && npx vitest run lib/vapi/__tests__/fitness-coach-prompt.test.ts
```

Expected: 7 tests pass

- [ ] **Step 5: Commit**

```bash
git add apps/web/lib/vapi/fitness-coach-prompt.ts apps/web/lib/vapi/__tests__/fitness-coach-prompt.test.ts
git commit -m "feat: add buildFitnessCoachPrompt with tests"
```

---

### Task 2: Topic suggestions generator

**Files:**

- Create: `apps/web/lib/vapi/topic-suggestions.ts`
- Create: `apps/web/lib/vapi/__tests__/topic-suggestions.test.ts`

- [ ] **Step 1: Write failing tests**

```typescript
// apps/web/lib/vapi/__tests__/topic-suggestions.test.ts
import { describe, it, expect } from 'vitest'
import { generateTopicSuggestions } from '../topic-suggestions'

describe('generateTopicSuggestions', () => {
  const baseProfile = {
    goals: [] as string[],
    activeInjuries: [] as string[],
    supplements: [] as string[],
  }

  it('always includes base chips', () => {
    const chips = generateTopicSuggestions(baseProfile)
    expect(chips.length).toBeGreaterThanOrEqual(4)
    expect(chips.some((c) => c.label.includes('beslenme') || c.label.includes('Bugün'))).toBe(true)
  })

  it('adds injury chip when injuries present', () => {
    const chips = generateTopicSuggestions({ ...baseProfile, activeInjuries: ['diz'] })
    expect(chips.some((c) => c.label.toLowerCase().includes('sakatlık'))).toBe(true)
  })

  it('no injury chip when no injuries', () => {
    const chips = generateTopicSuggestions(baseProfile)
    expect(chips.some((c) => c.label.toLowerCase().includes('sakatlık'))).toBe(false)
  })

  it('adds weight_loss chip when goal present', () => {
    const chips = generateTopicSuggestions({ ...baseProfile, goals: ['weight_loss'] })
    expect(chips.some((c) => c.label.toLowerCase().includes('kalori'))).toBe(true)
  })

  it('each chip has label and prompt', () => {
    const chips = generateTopicSuggestions(baseProfile)
    chips.forEach((c) => {
      expect(c.label).toBeTruthy()
      expect(c.prompt).toBeTruthy()
    })
  })
})
```

- [ ] **Step 2: Run tests — verify FAIL**

```bash
cd apps/web && npx vitest run lib/vapi/__tests__/topic-suggestions.test.ts
```

- [ ] **Step 3: Implement**

```typescript
// apps/web/lib/vapi/topic-suggestions.ts
export interface TopicChip {
  label: string
  prompt: string
}

interface TopicProfile {
  goals: string[]
  activeInjuries: string[]
  supplements: string[]
}

export function generateTopicSuggestions(profile: TopicProfile): TopicChip[] {
  const chips: TopicChip[] = [
    { label: 'Bugün ne yedim?', prompt: 'Bugünkü beslenme düzenimi değerlendir' },
    { label: 'Supplement öneri', prompt: 'Hedeflerime göre supplement öner' },
    { label: 'Kilo durumu', prompt: 'Bu haftaki kilo değişimimi analiz et' },
    { label: 'Uyku & toparlanma', prompt: 'Toparlanma sürecimi nasıl optimize ederim?' },
  ]

  if (profile.activeInjuries.length > 0) {
    chips.push({ label: 'Sakatlık ile spor', prompt: 'Sakatken nasıl antrenman yapabilirim?' })
  }

  if (profile.goals.includes('weight_loss')) {
    chips.push({ label: 'Kalori açığı', prompt: 'Bu hafta kalori açığım yeterli mi?' })
  }

  if (profile.goals.includes('muscle_gain')) {
    chips.push({
      label: 'Protein hedefi',
      prompt: 'Kas yapımı için günlük protein alımım yeterli mi?',
    })
  }

  return chips
}
```

- [ ] **Step 4: Run tests — verify PASS**

```bash
cd apps/web && npx vitest run lib/vapi/__tests__/topic-suggestions.test.ts
```

Expected: 5 tests pass

- [ ] **Step 5: Commit**

```bash
git add apps/web/lib/vapi/topic-suggestions.ts apps/web/lib/vapi/__tests__/topic-suggestions.test.ts
git commit -m "feat: add generateTopicSuggestions with tests"
```

---

### Task 3: Fitness coach session API route

**Files:**

- Create: `apps/web/app/api/fitness-coach/session/route.ts`
- Create: `apps/web/__tests__/api/fitness-coach/session.test.ts`

This route handles two things: GET user profile to build the coach prompt, and POST to save the session transcript.

- [ ] **Step 1: Write failing tests**

```typescript
// apps/web/__tests__/api/fitness-coach/session.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET, POST } from '@/app/api/fitness-coach/session/route'
import { NextRequest } from 'next/server'

vi.mock('@/lib/auth/session', () => ({ getServerSession: vi.fn() }))
vi.mock('@/lib/db/client', () => ({
  prisma: {
    healthProfile: { findUnique: vi.fn() },
    workoutSession: { count: vi.fn() },
    fitnessCoachSession: { create: vi.fn() },
    user: { findUnique: vi.fn() },
  },
}))

import { getServerSession } from '@/lib/auth/session'
import { prisma } from '@/lib/db/client'

describe('GET /api/fitness-coach/session', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 401 when unauthenticated', async () => {
    vi.mocked(getServerSession).mockResolvedValue(null)
    const res = await GET(new NextRequest('http://localhost/api/fitness-coach/session'))
    expect(res.status).toBe(401)
  })

  it('returns coach profile when authenticated', async () => {
    vi.mocked(getServerSession).mockResolvedValue({ user: { id: 'u1', name: 'Ahmet' } } as any)
    vi.mocked(prisma.healthProfile.findUnique).mockResolvedValue({
      weightKg: 80,
      heightCm: 178,
      fitnessLevel: 'intermediate',
      injuries: [],
      goals: [],
      supplements: [],
    } as any)
    vi.mocked(prisma.workoutSession.count).mockResolvedValue(15)
    const res = await GET(new NextRequest('http://localhost/api/fitness-coach/session'))
    const data = await res.json()
    expect(res.status).toBe(200)
    expect(data.profile).toBeDefined()
    expect(data.systemPrompt).toBeDefined()
  })
})

describe('POST /api/fitness-coach/session', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 401 when unauthenticated', async () => {
    vi.mocked(getServerSession).mockResolvedValue(null)
    const req = new NextRequest('http://localhost/api/fitness-coach/session', {
      method: 'POST',
      body: JSON.stringify({ transcript: [] }),
    })
    const res = await POST(req)
    expect(res.status).toBe(401)
  })

  it('saves transcript and returns 201', async () => {
    vi.mocked(getServerSession).mockResolvedValue({ user: { id: 'u1' } } as any)
    vi.mocked(prisma.fitnessCoachSession.create).mockResolvedValue({ id: 'sess1' } as any)
    const req = new NextRequest('http://localhost/api/fitness-coach/session', {
      method: 'POST',
      body: JSON.stringify({
        transcript: [{ speaker: 'assistant', text: 'Merhaba!', timestamp: 1 }],
        durationSeconds: 120,
      }),
    })
    const res = await POST(req)
    expect(res.status).toBe(201)
  })
})
```

- [ ] **Step 2: Run tests — verify FAIL**

```bash
cd apps/web && npx vitest run __tests__/api/fitness-coach/session.test.ts
```

- [ ] **Step 3: Add Prisma model for FitnessCoachSession**

In `apps/web/prisma/schema.prisma`, add after the existing models:

```prisma
model FitnessCoachSession {
  id              String   @id @default(cuid())
  userId          String
  transcript      Json     // TranscriptEntry[]
  durationSeconds Int      @default(0)
  createdAt       DateTime @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

Also add the back-relation on the `User` model:

```prisma
fitnessCoachSessions FitnessCoachSession[]
```

Then run:

```bash
cd apps/web && npx prisma migrate dev --name add_fitness_coach_session
```

- [ ] **Step 4: Implement route**

```typescript
// apps/web/app/api/fitness-coach/session/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth/session'
import { prisma } from '@/lib/db/client'
import { buildFitnessCoachPrompt } from '@/lib/vapi/fitness-coach-prompt'
import { workoutCountToFitnessLevel } from '@/lib/character/level-calculator'
import type { FitnessLevel } from '@repo/shared-types'

export async function GET(_req: NextRequest) {
  const session = await getServerSession()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const [healthProfile, workoutCount, user] = await Promise.all([
    prisma.healthProfile.findUnique({ where: { userId: session.user.id } }),
    prisma.workoutSession.count({ where: { userId: session.user.id } }),
    prisma.user.findUnique({ where: { id: session.user.id }, select: { name: true } }),
  ])

  const fitnessLevel: FitnessLevel = workoutCountToFitnessLevel(workoutCount)

  const profile = {
    name: user?.name ?? 'Kullanıcı',
    weightKg: healthProfile?.weightKg ?? 70,
    heightCm: healthProfile?.heightCm ?? 175,
    goals: (healthProfile?.goals as string[]) ?? [],
    fitnessLevel,
    injuries: (healthProfile?.injuries as string[]) ?? [],
    weeklyWorkouts: 0,
    supplements: (healthProfile?.supplements as string[]) ?? [],
  }

  const systemPrompt = buildFitnessCoachPrompt(profile)

  return NextResponse.json({ profile, systemPrompt })
}

export async function POST(req: NextRequest) {
  const session = await getServerSession()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = (await req.json()) as { transcript?: unknown[]; durationSeconds?: number }

  await prisma.fitnessCoachSession.create({
    data: {
      userId: session.user.id,
      transcript: body.transcript ?? [],
      durationSeconds: body.durationSeconds ?? 0,
    },
  })

  return NextResponse.json({ success: true }, { status: 201 })
}
```

- [ ] **Step 5: Run tests — verify PASS**

```bash
cd apps/web && npx vitest run __tests__/api/fitness-coach/session.test.ts
```

Expected: 4 tests pass

- [ ] **Step 6: Commit**

```bash
git add apps/web/app/api/fitness-coach/session/route.ts apps/web/__tests__/api/fitness-coach/session.test.ts apps/web/prisma/schema.prisma apps/web/prisma/migrations/
git commit -m "feat: add fitness coach session API (GET profile, POST transcript) with tests"
```

---

## Chunk 2: VAPI Hook + Talking Animation

### Task 4: useFitnessCoachSession hook

**Files:**

- Create: `apps/web/components/fitness-coach/hooks/useFitnessCoachSession.ts`

This hook initializes the VAPI call with the system prompt, manages start/stop, exposes transcript events, and provides audio level for animation.

- [ ] **Step 1: Check existing VAPI session infrastructure**

```bash
cat apps/web/lib/vapi/session.ts
```

Note the VAPI client API surface before implementing.

- [ ] **Step 2: Implement hook**

```typescript
// apps/web/components/fitness-coach/hooks/useFitnessCoachSession.ts
'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

export interface TranscriptEntry {
  speaker: 'assistant' | 'user'
  text: string
  timestamp: number
}

interface UseFitnessCoachSessionOptions {
  systemPrompt: string
  onAudioLevel?: (level: number) => void
}

interface FitnessCoachSessionState {
  status: 'idle' | 'connecting' | 'active' | 'ended' | 'error'
  transcript: TranscriptEntry[]
  isSpeaking: boolean
  errorMessage: string | null
}

export function useFitnessCoachSession({
  systemPrompt,
  onAudioLevel,
}: UseFitnessCoachSessionOptions) {
  const [state, setState] = useState<FitnessCoachSessionState>({
    status: 'idle',
    transcript: [],
    isSpeaking: false,
    errorMessage: null,
  })
  const vapiRef = useRef<any>(null)

  const start = useCallback(async () => {
    setState((s) => ({ ...s, status: 'connecting', errorMessage: null }))
    try {
      // Dynamically import VAPI to avoid SSR issues
      const { default: Vapi } = await import('@vapi-ai/web')
      const vapi = new Vapi(process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY ?? '')
      vapiRef.current = vapi

      vapi.on('call-start', () => setState((s) => ({ ...s, status: 'active' })))
      vapi.on('call-end', () => setState((s) => ({ ...s, status: 'ended' })))
      vapi.on('error', (err: unknown) =>
        setState((s) => ({ ...s, status: 'error', errorMessage: String(err) }))
      )

      vapi.on('speech-start', () => setState((s) => ({ ...s, isSpeaking: true })))
      vapi.on('speech-end', () => setState((s) => ({ ...s, isSpeaking: false })))

      vapi.on('volume-level', (level: number) => {
        onAudioLevel?.(level)
      })

      vapi.on('message', (msg: any) => {
        if (msg.type === 'transcript' && msg.transcriptType === 'final') {
          setState((s) => ({
            ...s,
            transcript: [
              ...s.transcript,
              {
                speaker: msg.role as 'assistant' | 'user',
                text: msg.transcript,
                timestamp: Date.now(),
              },
            ],
          }))
        }
      })

      await vapi.start({
        model: { provider: 'openai', model: 'gpt-4o-mini' },
        voice: { provider: 'playht', voiceId: 'tr-TR-EmelNeural' },
        transcriber: { provider: 'deepgram', language: 'tr' },
        systemPrompt,
      })
    } catch (err) {
      setState((s) => ({
        ...s,
        status: 'error',
        errorMessage: 'Bağlantı hatası. Lütfen tekrar deneyin.',
      }))
    }
  }, [systemPrompt, onAudioLevel])

  const stop = useCallback(async () => {
    if (vapiRef.current) {
      await vapiRef.current.stop()
      vapiRef.current = null
    }
    setState((s) => ({ ...s, status: 'ended' }))
  }, [])

  const sendMessage = useCallback((message: string) => {
    vapiRef.current?.send({ type: 'add-message', message: { role: 'user', content: message } })
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      vapiRef.current?.stop()
    }
  }, [])

  return { ...state, start, stop, sendMessage }
}
```

- [ ] **Step 3: Commit**

```bash
git add apps/web/components/fitness-coach/hooks/useFitnessCoachSession.ts
git commit -m "feat: add useFitnessCoachSession hook for VAPI lifecycle management"
```

---

### Task 5: useSpeechAnimation hook

**Files:**

- Create: `apps/web/components/fitness-coach/hooks/useSpeechAnimation.ts`

Converts VAPI audio level events to animation state for the 3D character.

- [ ] **Step 1: Implement**

```typescript
// apps/web/components/fitness-coach/hooks/useSpeechAnimation.ts
'use client'

import { useState, useCallback, useRef } from 'react'

export type AnimationState = 'idle' | 'listening' | 'talking' | 'thinking'

export function useSpeechAnimation() {
  const [animState, setAnimState] = useState<AnimationState>('idle')
  const [audioLevel, setAudioLevel] = useState(0)
  const idleTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const onSpeechStart = useCallback(() => {
    if (idleTimeoutRef.current) clearTimeout(idleTimeoutRef.current)
    setAnimState('talking')
  }, [])

  const onSpeechEnd = useCallback(() => {
    idleTimeoutRef.current = setTimeout(() => setAnimState('idle'), 800)
    setAnimState('listening')
  }, [])

  const onAudioLevel = useCallback((level: number) => {
    setAudioLevel(level)
  }, [])

  return { animState, audioLevel, onSpeechStart, onSpeechEnd, onAudioLevel }
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/components/fitness-coach/hooks/useSpeechAnimation.ts
git commit -m "feat: add useSpeechAnimation hook for audio-driven character animation states"
```

---

## Chunk 3: UI Components

### Task 6: VoiceWaveform component

**Files:**

- Create: `apps/web/components/fitness-coach/ui/VoiceWaveform.tsx`

Animated SVG waveform shown beneath the character. Pulses based on audio level.

- [ ] **Step 1: Implement**

```typescript
// apps/web/components/fitness-coach/ui/VoiceWaveform.tsx
'use client'

interface VoiceWaveformProps {
  audioLevel: number   // 0–1
  isActive: boolean
  color?: string
}

export function VoiceWaveform({ audioLevel, isActive, color = '#10b981' }: VoiceWaveformProps) {
  const bars = 12
  return (
    <div className="flex items-center justify-center gap-0.5 h-8">
      {Array.from({ length: bars }, (_, i) => {
        const center = bars / 2
        const distFromCenter = Math.abs(i - center) / center
        const baseHeight = isActive ? (0.3 + audioLevel * 0.7 * (1 - distFromCenter * 0.5)) : 0.15
        const height = Math.max(4, baseHeight * 32)
        return (
          <div
            key={i}
            style={{
              width: 3,
              height,
              backgroundColor: color,
              borderRadius: 2,
              opacity: isActive ? 0.9 : 0.3,
              transition: 'height 80ms ease, opacity 200ms ease',
            }}
          />
        )
      })}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/components/fitness-coach/ui/VoiceWaveform.tsx
git commit -m "feat: add VoiceWaveform animated waveform component"
```

---

### Task 7: TopicChips component

**Files:**

- Create: `apps/web/components/fitness-coach/ui/TopicChips.tsx`

- [ ] **Step 1: Implement**

```typescript
// apps/web/components/fitness-coach/ui/TopicChips.tsx
'use client'

import type { TopicChip } from '@/lib/vapi/topic-suggestions'

interface TopicChipsProps {
  chips: TopicChip[]
  onSelect: (prompt: string) => void
  disabled?: boolean
}

export function TopicChips({ chips, onSelect, disabled }: TopicChipsProps) {
  return (
    <div className="flex flex-wrap gap-2 px-4 py-2">
      {chips.map(chip => (
        <button
          key={chip.label}
          onClick={() => onSelect(chip.prompt)}
          disabled={disabled}
          className="px-3 py-1.5 text-xs font-medium bg-card/60 border border-border/50 rounded-full hover:bg-blue-500/10 hover:border-blue-500/40 hover:text-blue-300 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {chip.label}
        </button>
      ))}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/components/fitness-coach/ui/TopicChips.tsx
git commit -m "feat: add TopicChips component for voice consultation prompts"
```

---

### Task 8: TranscriptScroller component

**Files:**

- Create: `apps/web/components/fitness-coach/ui/TranscriptScroller.tsx`

- [ ] **Step 1: Implement**

```typescript
// apps/web/components/fitness-coach/ui/TranscriptScroller.tsx
'use client'

import { useEffect, useRef } from 'react'
import type { TranscriptEntry } from '../hooks/useFitnessCoachSession'

interface TranscriptScrollerProps {
  entries: TranscriptEntry[]
}

export function TranscriptScroller({ entries }: TranscriptScrollerProps) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [entries.length])

  if (entries.length === 0) {
    return (
      <div className="px-4 py-2 text-center text-muted-foreground text-xs">
        Konuşmak için başlat'a bas...
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 py-2 space-y-1 max-h-24">
      {entries.map((entry, i) => (
        <div key={i} className={`text-xs ${entry.speaker === 'assistant' ? 'text-emerald-400' : 'text-blue-300'}`}>
          <span className="font-semibold mr-1">{entry.speaker === 'assistant' ? 'Koç:' : 'Sen:'}</span>
          {entry.text}
        </div>
      ))}
      <div ref={bottomRef} />
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/components/fitness-coach/ui/TranscriptScroller.tsx
git commit -m "feat: add TranscriptScroller for real-time VAPI transcript display"
```

---

## Chunk 4: Main Page Assembly

### Task 9: CoachCharacterPanel component

**Files:**

- Create: `apps/web/components/fitness-coach/panels/CoachCharacterPanel.tsx`

Left panel — 3D character + waveform + status badge.

- [ ] **Step 1: Implement**

```typescript
// apps/web/components/fitness-coach/panels/CoachCharacterPanel.tsx
'use client'

import { PTCharacter3D } from '@/components/session/character/PTCharacter3D'
import { VoiceWaveform } from '../ui/VoiceWaveform'
import { useCharacterMorph } from '@/components/session/character/useCharacterMorph'
import type { AnimationState } from '../hooks/useSpeechAnimation'

interface CoachCharacterPanelProps {
  animState: AnimationState
  audioLevel: number
  isSpeaking: boolean
}

export function CoachCharacterPanel({ animState, audioLevel, isSpeaking }: CoachCharacterPanelProps) {
  const { params, isLoading } = useCharacterMorph()

  const exerciseSlug = animState === 'talking' ? 'idle' : 'rest'

  return (
    <div className="relative w-full h-full bg-gray-950 rounded-2xl overflow-hidden border border-emerald-500/20 flex flex-col">
      {/* Badge */}
      <div className="absolute top-3 left-3 z-10 bg-emerald-600/90 rounded-lg px-2.5 py-1 flex items-center gap-1.5">
        <div className={`w-1.5 h-1.5 rounded-full ${isSpeaking ? 'bg-white animate-pulse' : 'bg-white/50'}`} />
        <span className="text-white text-xs font-semibold">
          {animState === 'talking' ? 'Konuşuyor' : animState === 'listening' ? 'Dinliyor' : 'AI Koç'}
        </span>
      </div>

      {/* 3D Character */}
      <div className="flex-1">
        {!isLoading && (
          <PTCharacter3D
            morphParams={params}
            exerciseSlug={exerciseSlug}
            isActive={false}
            className="w-full h-full"
          />
        )}
      </div>

      {/* Waveform */}
      <div className="pb-3">
        <VoiceWaveform audioLevel={audioLevel} isActive={isSpeaking} />
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/components/fitness-coach/panels/CoachCharacterPanel.tsx
git commit -m "feat: add CoachCharacterPanel with 3D character and voice waveform"
```

---

### Task 10: UserCameraPanel component

**Files:**

- Create: `apps/web/components/fitness-coach/panels/UserCameraPanel.tsx`

- [ ] **Step 1: Implement**

```typescript
// apps/web/components/fitness-coach/panels/UserCameraPanel.tsx
'use client'

import { useRef, useEffect } from 'react'
import { VideoOff, Mic, MicOff } from 'lucide-react'

interface UserCameraPanelProps {
  isVideoOn: boolean
  isMicOn: boolean
}

export function UserCameraPanel({ isVideoOn, isMicOn }: UserCameraPanelProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  useEffect(() => {
    if (!isVideoOn) {
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
  }, [isVideoOn])

  return (
    <div className="relative w-full h-full bg-gray-900 rounded-2xl overflow-hidden border border-border/30">
      {isVideoOn ? (
        <>
          <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover scale-x-[-1]" />
          <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-sm rounded-lg px-2 py-1">
            <span className="text-green-400 text-xs font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse inline-block" />
              Canlı
            </span>
          </div>
        </>
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <VideoOff size={40} className="text-gray-600" />
        </div>
      )}

      {/* Mic indicator */}
      <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-sm rounded-full p-2">
        {isMicOn
          ? <Mic size={14} className="text-green-400" />
          : <MicOff size={14} className="text-red-400" />
        }
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/components/fitness-coach/panels/UserCameraPanel.tsx
git commit -m "feat: add UserCameraPanel for fitness coach video feed"
```

---

### Task 11: FitnessCoachPage main component

**Files:**

- Create: `apps/web/components/fitness-coach/FitnessCoachPage.tsx`
- Create: `apps/web/app/(dashboard)/dashboard/session/fitness-coach/page.tsx`

- [ ] **Step 1: Implement FitnessCoachPage**

```typescript
// apps/web/components/fitness-coach/FitnessCoachPage.tsx
'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Phone, Video, VideoOff, Clock, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { CoachCharacterPanel } from './panels/CoachCharacterPanel'
import { UserCameraPanel } from './panels/UserCameraPanel'
import { TopicChips } from './ui/TopicChips'
import { TranscriptScroller } from './ui/TranscriptScroller'
import { useFitnessCoachSession } from './hooks/useFitnessCoachSession'
import { useSpeechAnimation } from './hooks/useSpeechAnimation'
import { generateTopicSuggestions } from '@/lib/vapi/topic-suggestions'
import type { TopicChip } from '@/lib/vapi/topic-suggestions'

interface CoachProfile {
  goals: string[]
  activeInjuries: string[]
  supplements: string[]
}

interface FitnessCoachPageProps {
  systemPrompt: string
  profile: CoachProfile
}

export function FitnessCoachPage({ systemPrompt, profile }: FitnessCoachPageProps) {
  const router = useRouter()
  const [isVideoOn, setIsVideoOn] = useState(true)
  const [sessionSeconds, setSessionSeconds] = useState(0)
  const [chips] = useState<TopicChip[]>(() => generateTopicSuggestions(profile))

  const { animState, audioLevel, onSpeechStart, onSpeechEnd, onAudioLevel } = useSpeechAnimation()

  const { status, transcript, isSpeaking, start, stop, sendMessage } = useFitnessCoachSession({
    systemPrompt,
    onAudioLevel,
  })

  // Session timer
  useEffect(() => {
    if (status !== 'active') return
    const t = setInterval(() => setSessionSeconds(s => s + 1), 1000)
    return () => clearInterval(t)
  }, [status])

  const handleEnd = useCallback(async () => {
    await stop()
    if (transcript.length > 0) {
      // Fire and forget — save transcript
      fetch('/api/fitness-coach/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript, durationSeconds: sessionSeconds }),
      }).catch(() => {})
    }
    router.push('/dashboard/session')
  }, [stop, transcript, sessionSeconds, router])

  const fmt = (s: number) =>
    `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col gap-0 -mt-8 -mx-4 sm:-mx-6 lg:-mx-8 overflow-hidden bg-background">

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border/30 shrink-0">
        <h1 className="font-black text-base">Fitness Koçu</h1>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock size={12} />
            <span className="font-mono">{fmt(sessionSeconds)}</span>
          </div>
          <button onClick={() => setIsVideoOn(v => !v)}
            className={`p-2 rounded-lg border transition-colors ${isVideoOn ? 'border-border/30 hover:bg-card' : 'border-red-500/30 bg-red-500/10 text-red-400'}`}>
            {isVideoOn ? <Video size={14} /> : <VideoOff size={14} />}
          </button>
          <button onClick={handleEnd}
            className="p-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 transition-colors">
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Video area */}
      <div className="flex-1 grid grid-cols-2 gap-3 p-3 min-h-0">
        {/* Left — AI character 45% */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <CoachCharacterPanel animState={animState} audioLevel={audioLevel} isSpeaking={isSpeaking} />
        </motion.div>

        {/* Right — User camera 55% */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
          <UserCameraPanel isVideoOn={isVideoOn} isMicOn={status === 'active'} />
        </motion.div>
      </div>

      {/* Topic chips */}
      <TopicChips chips={chips} onSelect={sendMessage} disabled={status !== 'active'} />

      {/* Transcript */}
      <TranscriptScroller entries={transcript} />

      {/* Start / End call button */}
      <div className="flex justify-center py-3 shrink-0">
        {status === 'idle' || status === 'error' ? (
          <button onClick={start}
            className="px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full font-bold flex items-center gap-2 transition-colors">
            <Phone size={16} /> Görüşmeyi Başlat
          </button>
        ) : status === 'connecting' ? (
          <div className="px-8 py-3 bg-card border border-border/30 rounded-full text-muted-foreground text-sm flex items-center gap-2">
            <div className="w-3 h-3 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            Bağlanıyor...
          </div>
        ) : (
          <button onClick={handleEnd}
            className="px-8 py-3 bg-red-600 hover:bg-red-700 text-white rounded-full font-bold flex items-center gap-2 transition-colors">
            <Phone size={16} className="rotate-135" /> Görüşmeyi Bitir
          </button>
        )}
        {status === 'error' && (
          <p className="text-red-400 text-xs text-center mt-2">Bağlantı hatası. Tekrar dene.</p>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create route page**

```typescript
// apps/web/app/(dashboard)/dashboard/session/fitness-coach/page.tsx
import { redirect } from 'next/navigation'
import { getServerSession } from '@/lib/auth/session'
import { FitnessCoachPage } from '@/components/fitness-coach/FitnessCoachPage'
import { buildFitnessCoachPrompt } from '@/lib/vapi/fitness-coach-prompt'
import { workoutCountToFitnessLevel } from '@/lib/character/level-calculator'
import { prisma } from '@/lib/db/client'
import type { FitnessLevel } from '@repo/shared-types'

export default async function FitnessCoachRoute() {
  const session = await getServerSession()
  if (!session?.user?.id) redirect('/login')

  const [healthProfile, workoutCount, user] = await Promise.all([
    prisma.healthProfile.findUnique({ where: { userId: session.user.id } }),
    prisma.workoutSession.count({ where: { userId: session.user.id } }),
    prisma.user.findUnique({ where: { id: session.user.id }, select: { name: true } }),
  ])

  const fitnessLevel: FitnessLevel = workoutCountToFitnessLevel(workoutCount)

  const profile = {
    name: user?.name ?? 'Kullanıcı',
    weightKg: healthProfile?.weightKg ?? 70,
    heightCm: healthProfile?.heightCm ?? 175,
    goals: (healthProfile?.goals as string[]) ?? [],
    fitnessLevel,
    injuries: (healthProfile?.injuries as string[]) ?? [],
    weeklyWorkouts: 0,
    supplements: (healthProfile?.supplements as string[]) ?? [],
  }

  const topicProfile = {
    goals: profile.goals,
    activeInjuries: profile.injuries,
    supplements: profile.supplements,
  }

  const systemPrompt = buildFitnessCoachPrompt(profile)

  return <FitnessCoachPage systemPrompt={systemPrompt} profile={topicProfile} />
}
```

- [ ] **Step 3: TypeScript check**

```bash
cd apps/web && npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add apps/web/components/fitness-coach/ apps/web/app/(dashboard)/dashboard/session/fitness-coach/page.tsx
git commit -m "feat: add FitnessCoachPage and fitness-coach route with full VAPI integration"
```

---

## Chunk 5: Final Verification

### Task 12: Run all tests

- [ ] **Step 1: Run all web tests**

```bash
cd apps/web && npx vitest run
```

Expected: All tests pass including new Mod 2 tests (fitness-coach-prompt × 7, topic-suggestions × 5, session API × 4 = 16 new tests).

- [ ] **Step 2: TypeScript full check**

```bash
cd apps/web && npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 3: Final commit**

```bash
git add -A
git commit -m "feat: Mod 2 Fitness Coach voice session — VAPI + 3D character + transcript UI"
```
