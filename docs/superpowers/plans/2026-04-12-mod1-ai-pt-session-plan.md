# Mod 1: AI PT + Egzersiz Seansı — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the SVG stick-figure AI coach with an animated low-poly 3D character that morphs based on the user's body profile and performs exercise animations in sync with the user.

**Architecture:** The character is a procedurally-built Three.js mesh (no external GLTF required). Body morph params are computed from `HealthProfile` data stored in a new `characterMorphCache` JSON field on the `User` model. Exercise animations are keyframe clips played by an `AnimationMixer`. The session page gains a mode-selector overlay so users can choose Mod 1 (exercise) or Mod 2 (coach chat) before a session begins.

**Tech Stack:** React Three Fiber (R3F), Three.js, Vitest, Prisma, Next.js App Router, TypeScript strict mode.

---

## Chunk 1: Shared Types + Morph Calculator

### Task 1: Shared character types

**Files:**

- Create: `packages/shared-types/src/character.ts`

- [ ] **Step 1: Create the types file**

```typescript
// packages/shared-types/src/character.ts
export type FitnessLevel = 'beginner' | 'intermediate' | 'advanced' | 'elite'
export type Gender = 'male' | 'female' | 'other'

export interface CharacterMorphParams {
  bmi: number
  muscleLevel: number // 0–1
  heightNorm: number // heightCm / 175
  gender: Gender
  fitnessLevel: FitnessLevel
  updatedAt: string // ISO timestamp
}

export interface MorphCalculatorInput {
  weightKg: number
  heightCm: number
  fitnessLevel: string
  gender: string
  totalWorkoutCount: number
}
```

- [ ] **Step 2: Export from package index**

Add to `packages/shared-types/src/index.ts`:

```typescript
export * from './character'
```

- [ ] **Step 3: Commit**

```bash
git add packages/shared-types/src/character.ts packages/shared-types/src/index.ts
git commit -m "feat: add CharacterMorphParams and MorphCalculatorInput shared types"
```

---

### Task 2: Morph calculator (web)

**Files:**

- Create: `apps/web/lib/character/morph-calculator.ts`
- Create: `apps/web/lib/character/__tests__/morph-calculator.test.ts`

- [ ] **Step 1: Write failing tests**

```typescript
// apps/web/lib/character/__tests__/morph-calculator.test.ts
import { describe, it, expect } from 'vitest'
import { computeMorphParams } from '../morph-calculator'

describe('computeMorphParams', () => {
  const base = {
    weightKg: 70,
    heightCm: 175,
    fitnessLevel: 'beginner',
    gender: 'male',
    totalWorkoutCount: 0,
  }

  it('normal BMI → bmi ~22.9', () => {
    const p = computeMorphParams(base)
    expect(p.bmi).toBeCloseTo(22.86, 1)
  })

  it('heightNorm = heightCm / 175', () => {
    const p = computeMorphParams({ ...base, heightCm: 175 })
    expect(p.heightNorm).toBe(1.0)
  })

  it('muscleLevel = 0 when 0 workouts', () => {
    const p = computeMorphParams(base)
    expect(p.muscleLevel).toBe(0)
  })

  it('muscleLevel = 1 at 100+ workouts', () => {
    const p = computeMorphParams({ ...base, totalWorkoutCount: 150 })
    expect(p.muscleLevel).toBe(1.0)
  })

  it('muscleLevel clamps at 1.0', () => {
    const p = computeMorphParams({ ...base, totalWorkoutCount: 200 })
    expect(p.muscleLevel).toBe(1.0)
  })

  it('unknown fitnessLevel defaults to beginner', () => {
    const p = computeMorphParams({ ...base, fitnessLevel: 'unknown' })
    expect(p.fitnessLevel).toBe('beginner')
  })

  it('unknown gender defaults to other', () => {
    const p = computeMorphParams({ ...base, gender: 'alien' })
    expect(p.gender).toBe('other')
  })
})
```

- [ ] **Step 2: Run tests — verify they FAIL**

```bash
cd apps/web && npx vitest run lib/character/__tests__/morph-calculator.test.ts
```

Expected: `Cannot find module '../morph-calculator'`

- [ ] **Step 3: Implement**

```typescript
// apps/web/lib/character/morph-calculator.ts
import type {
  CharacterMorphParams,
  MorphCalculatorInput,
  FitnessLevel,
  Gender,
} from '@repo/shared-types'

const FITNESS_LEVELS: FitnessLevel[] = ['beginner', 'intermediate', 'advanced', 'elite']
const GENDERS: Gender[] = ['male', 'female', 'other']

export function computeMorphParams(input: MorphCalculatorInput): CharacterMorphParams {
  const heightM = input.heightCm / 100
  const bmi = input.weightKg / (heightM * heightM)
  const muscleLevel = Math.min(input.totalWorkoutCount / 100, 1.0)
  const heightNorm = input.heightCm / 175

  const fitnessLevel: FitnessLevel = FITNESS_LEVELS.includes(input.fitnessLevel as FitnessLevel)
    ? (input.fitnessLevel as FitnessLevel)
    : 'beginner'

  const gender: Gender = GENDERS.includes(input.gender as Gender)
    ? (input.gender as Gender)
    : 'other'

  return {
    bmi: Math.round(bmi * 100) / 100,
    muscleLevel: Math.round(muscleLevel * 1000) / 1000,
    heightNorm: Math.round(heightNorm * 1000) / 1000,
    gender,
    fitnessLevel,
    updatedAt: new Date().toISOString(),
  }
}
```

- [ ] **Step 4: Run tests — verify they PASS**

```bash
cd apps/web && npx vitest run lib/character/__tests__/morph-calculator.test.ts
```

Expected: 7 tests pass

- [ ] **Step 5: Commit**

```bash
git add apps/web/lib/character/morph-calculator.ts apps/web/lib/character/__tests__/morph-calculator.test.ts
git commit -m "feat: add computeMorphParams utility with tests"
```

---

### Task 3: Level calculator (web)

**Files:**

- Create: `apps/web/lib/character/level-calculator.ts`
- Create: `apps/web/lib/character/__tests__/level-calculator.test.ts`

- [ ] **Step 1: Write failing tests**

```typescript
// apps/web/lib/character/__tests__/level-calculator.test.ts
import { describe, it, expect } from 'vitest'
import { workoutCountToFitnessLevel } from '../level-calculator'

describe('workoutCountToFitnessLevel', () => {
  it('0 workouts → beginner', () => expect(workoutCountToFitnessLevel(0)).toBe('beginner'))
  it('9 workouts → beginner', () => expect(workoutCountToFitnessLevel(9)).toBe('beginner'))
  it('10 workouts → intermediate', () =>
    expect(workoutCountToFitnessLevel(10)).toBe('intermediate'))
  it('49 workouts → intermediate', () =>
    expect(workoutCountToFitnessLevel(49)).toBe('intermediate'))
  it('50 workouts → advanced', () => expect(workoutCountToFitnessLevel(50)).toBe('advanced'))
  it('99 workouts → advanced', () => expect(workoutCountToFitnessLevel(99)).toBe('advanced'))
  it('100 workouts → elite', () => expect(workoutCountToFitnessLevel(100)).toBe('elite'))
  it('500 workouts → elite', () => expect(workoutCountToFitnessLevel(500)).toBe('elite'))
})
```

- [ ] **Step 2: Run tests — verify FAIL**

```bash
cd apps/web && npx vitest run lib/character/__tests__/level-calculator.test.ts
```

- [ ] **Step 3: Implement**

```typescript
// apps/web/lib/character/level-calculator.ts
import type { FitnessLevel } from '@repo/shared-types'

export function workoutCountToFitnessLevel(count: number): FitnessLevel {
  if (count >= 100) return 'elite'
  if (count >= 50) return 'advanced'
  if (count >= 10) return 'intermediate'
  return 'beginner'
}
```

- [ ] **Step 4: Run tests — verify PASS**

```bash
cd apps/web && npx vitest run lib/character/__tests__/level-calculator.test.ts
```

Expected: 8 tests pass

- [ ] **Step 5: Commit**

```bash
git add apps/web/lib/character/level-calculator.ts apps/web/lib/character/__tests__/level-calculator.test.ts
git commit -m "feat: add workoutCountToFitnessLevel utility with tests"
```

---

## Chunk 2: Database + API

### Task 4: Prisma schema — add characterMorphCache

**Files:**

- Modify: `apps/web/prisma/schema.prisma`

- [ ] **Step 1: Add field to User model**

In `apps/web/prisma/schema.prisma`, find the `User` model and add:

```prisma
characterMorphCache  Json?
```

Place it after the last existing field, before the closing `}`.

- [ ] **Step 2: Generate migration**

```bash
cd apps/web && npx prisma migrate dev --name add_character_morph_cache
```

Expected: Migration file created, schema updated.

- [ ] **Step 3: Verify Prisma client regenerated**

```bash
cd apps/web && npx prisma generate
```

Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add apps/web/prisma/schema.prisma apps/web/prisma/migrations/
git commit -m "feat: add characterMorphCache Json field to User model"
```

---

### Task 5: Character morph API route

**Files:**

- Create: `apps/web/app/api/character/morph/route.ts`
- Create: `apps/web/__tests__/api/character/morph.test.ts`

- [ ] **Step 1: Write failing tests**

```typescript
// apps/web/__tests__/api/character/morph.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET } from '@/app/api/character/morph/route'
import { NextRequest } from 'next/server'

vi.mock('@/lib/auth/session', () => ({
  getServerSession: vi.fn(),
}))
vi.mock('@/lib/db/client', () => ({
  prisma: { user: { findUnique: vi.fn() } },
}))

import { getServerSession } from '@/lib/auth/session'
import { prisma } from '@/lib/db/client'

describe('GET /api/character/morph', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 401 when unauthenticated', async () => {
    vi.mocked(getServerSession).mockResolvedValue(null)
    const res = await GET(new NextRequest('http://localhost/api/character/morph'))
    expect(res.status).toBe(401)
  })

  it('returns cached morph params when present', async () => {
    vi.mocked(getServerSession).mockResolvedValue({ user: { id: 'u1' } } as any)
    const cached = {
      bmi: 22,
      muscleLevel: 0.3,
      heightNorm: 1.0,
      gender: 'male',
      fitnessLevel: 'intermediate',
      updatedAt: '2026-01-01T00:00:00.000Z',
    }
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ characterMorphCache: cached } as any)
    const res = await GET(new NextRequest('http://localhost/api/character/morph'))
    const data = await res.json()
    expect(res.status).toBe(200)
    expect(data.bmi).toBe(22)
  })

  it('returns default params when cache is null', async () => {
    vi.mocked(getServerSession).mockResolvedValue({ user: { id: 'u1' } } as any)
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ characterMorphCache: null } as any)
    const res = await GET(new NextRequest('http://localhost/api/character/morph'))
    const data = await res.json()
    expect(res.status).toBe(200)
    expect(data.bmi).toBe(22)
    expect(data.fitnessLevel).toBe('beginner')
  })
})
```

- [ ] **Step 2: Run tests — verify FAIL**

```bash
cd apps/web && npx vitest run __tests__/api/character/morph.test.ts
```

- [ ] **Step 3: Implement route**

```typescript
// apps/web/app/api/character/morph/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth/session'
import { prisma } from '@/lib/db/client'
import type { CharacterMorphParams } from '@repo/shared-types'

const DEFAULT_PARAMS: CharacterMorphParams = {
  bmi: 22,
  muscleLevel: 0,
  heightNorm: 1.0,
  gender: 'other',
  fitnessLevel: 'beginner',
  updatedAt: new Date().toISOString(),
}

export async function GET(_req: NextRequest) {
  const session = await getServerSession()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { characterMorphCache: true },
  })

  const params = (user?.characterMorphCache as CharacterMorphParams | null) ?? DEFAULT_PARAMS

  return NextResponse.json(params)
}
```

- [ ] **Step 4: Run tests — verify PASS**

```bash
cd apps/web && npx vitest run __tests__/api/character/morph.test.ts
```

Expected: 3 tests pass

- [ ] **Step 5: Commit**

```bash
git add apps/web/app/api/character/morph/route.ts apps/web/__tests__/api/character/morph.test.ts
git commit -m "feat: add GET /api/character/morph route with tests"
```

---

### Task 6: Onboarding + weekly cron morph update

**Files:**

- Modify: `apps/web/app/api/onboarding/route.ts`
- Modify: `apps/web/app/api/cron/weekly-summary/route.ts`
- Create: `apps/web/lib/character/update-morph-cache.ts`

- [ ] **Step 1: Create shared update helper**

```typescript
// apps/web/lib/character/update-morph-cache.ts
import { prisma } from '@/lib/db/client'
import { computeMorphParams } from './morph-calculator'
import { workoutCountToFitnessLevel } from './level-calculator'

export async function updateCharacterMorphCache(
  userId: string,
  data: { weightKg: number; heightCm: number; gender: string; totalWorkoutCount: number }
): Promise<void> {
  const fitnessLevel = workoutCountToFitnessLevel(data.totalWorkoutCount)
  const params = computeMorphParams({ ...data, fitnessLevel })

  await prisma.user.update({
    where: { id: userId },
    data: { characterMorphCache: params },
  })
}
```

- [ ] **Step 2: Add morph update to onboarding POST**

In `apps/web/app/api/onboarding/route.ts`, after the existing profile save logic, add:

```typescript
// After profile is saved, fire-and-forget morph cache update
import { updateCharacterMorphCache } from '@/lib/character/update-morph-cache'

// (inside the POST handler, after profile upsert succeeds)
updateCharacterMorphCache(session.user.id, {
  weightKg: body.weightKg ?? 70,
  heightCm: body.heightCm ?? 175,
  gender: body.gender ?? 'other',
  totalWorkoutCount: 0,
}).catch((err) => logger.error({ err }, 'Failed to update morph cache on onboarding'))
```

- [ ] **Step 3: Add morph update to weekly-summary cron**

In `apps/web/app/api/cron/weekly-summary/route.ts`, inside the per-user loop after saving `weeklySummary`, add:

```typescript
import { updateCharacterMorphCache } from '@/lib/character/update-morph-cache'

// After weeklySummary upsert:
const profile = await prisma.healthProfile.findUnique({
  where: { userId: user.id },
  select: { weightKg: true, heightCm: true, gender: true },
})
if (profile) {
  const totalWorkoutCount = await prisma.workoutSession.count({ where: { userId: user.id } })
  await updateCharacterMorphCache(user.id, {
    weightKg: profile.weightKg ?? 70,
    heightCm: profile.heightCm ?? 175,
    gender: profile.gender ?? 'other',
    totalWorkoutCount,
  })
}
```

- [ ] **Step 4: TypeScript check**

```bash
cd apps/web && npx tsc --noEmit
```

Expected: No errors related to new files.

- [ ] **Step 5: Commit**

```bash
git add apps/web/lib/character/update-morph-cache.ts apps/web/app/api/onboarding/route.ts apps/web/app/api/cron/weekly-summary/route.ts
git commit -m "feat: update characterMorphCache on onboarding complete and weekly cron"
```

---

## Chunk 3: 3D Character Component (Web)

### Task 7: PTCharacter3D — low-poly mesh

**Files:**

- Create: `apps/web/components/session/character/PTCharacter3D.tsx`
- Create: `apps/web/components/session/character/__tests__/PTCharacter3D.test.tsx`

The character is built procedurally from Three.js `BoxGeometry` and `CylinderGeometry` parts. No external GLTF needed. Body scale and material are driven by `CharacterMorphParams`.

- [ ] **Step 1: Write render test**

```typescript
// apps/web/components/session/character/__tests__/PTCharacter3D.test.tsx
import { render } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { PTCharacter3D } from '../PTCharacter3D'

// Mock @react-three/fiber and three to avoid WebGL in tests
vi.mock('@react-three/fiber', () => ({
  Canvas: ({ children }: { children: React.ReactNode }) => <div data-testid="r3f-canvas">{children}</div>,
  useFrame: vi.fn(),
}))
vi.mock('three', async () => {
  const actual = await vi.importActual<typeof import('three')>('three')
  return actual
})

describe('PTCharacter3D', () => {
  it('renders without crashing with default params', () => {
    const { getByTestId } = render(
      <PTCharacter3D
        morphParams={{ bmi: 22, muscleLevel: 0, heightNorm: 1.0, gender: 'male', fitnessLevel: 'beginner', updatedAt: '' }}
        exerciseSlug="idle"
        isActive={false}
      />
    )
    expect(getByTestId('r3f-canvas')).toBeTruthy()
  })
})
```

- [ ] **Step 2: Run test — verify FAIL**

```bash
cd apps/web && npx vitest run components/session/character/__tests__/PTCharacter3D.test.tsx
```

- [ ] **Step 3: Implement PTCharacter3D**

```typescript
// apps/web/components/session/character/PTCharacter3D.tsx
'use client'

import { useRef, useEffect } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { CharacterMorphParams, FitnessLevel } from '@repo/shared-types'

// --- Scale tables from spec ---
function bmiToBodyScale(bmi: number): number {
  if (bmi < 18.5) return 0.85
  if (bmi < 25) return 1.0
  if (bmi < 30) return 1.15
  if (bmi < 35) return 1.30
  return 1.45
}

function fitnessToShoulderScale(level: FitnessLevel): number {
  return { beginner: 1.0, intermediate: 1.05, advanced: 1.12, elite: 1.20 }[level]
}

function fitnessToArmScale(level: FitnessLevel): number {
  return { beginner: 1.0, intermediate: 1.08, advanced: 1.18, elite: 1.28 }[level]
}

function fitnessToMaterialColor(level: FitnessLevel): number {
  return { beginner: 0x10b981, intermediate: 0x34d399, advanced: 0x34d399, elite: 0xf59e0b }[level]
}

// --- Character mesh builder ---
function buildCharacterGroup(params: CharacterMorphParams): THREE.Group {
  const group = new THREE.Group()
  const bodyScaleX = bmiToBodyScale(params.bmi)
  const shoulderScale = fitnessToShoulderScale(params.fitnessLevel)
  const armScale = fitnessToArmScale(params.fitnessLevel)
  const color = fitnessToMaterialColor(params.fitnessLevel)
  const emissive = params.fitnessLevel === 'advanced' || params.fitnessLevel === 'elite'

  const mat = new THREE.MeshStandardMaterial({
    color,
    emissive: emissive ? new THREE.Color(color).multiplyScalar(0.25) : new THREE.Color(0x000000),
    roughness: 0.6,
    metalness: params.fitnessLevel === 'elite' ? 0.5 : 0,
  })
  const skinMat = new THREE.MeshStandardMaterial({ color: 0xd4a574, roughness: 0.8 })
  const legMat = new THREE.MeshStandardMaterial({ color: 0x1e3a5f, roughness: 0.7 })

  // Head (octahedron for low-poly)
  const head = new THREE.Mesh(new THREE.OctahedronGeometry(0.22, 0), skinMat)
  head.position.y = 1.65
  head.name = 'head'
  group.add(head)

  // Torso
  const torso = new THREE.Mesh(
    new THREE.BoxGeometry(0.55 * bodyScaleX * shoulderScale, 0.65, 0.28),
    mat
  )
  torso.position.y = 1.0
  torso.name = 'torso'
  group.add(torso)

  // Upper arms
  const armGeo = new THREE.BoxGeometry(0.12 * armScale, 0.36, 0.12 * armScale)
  const leftUpperArm = new THREE.Mesh(armGeo, mat)
  leftUpperArm.position.set(-(0.28 * bodyScaleX * shoulderScale + 0.08), 1.05, 0)
  leftUpperArm.name = 'leftUpperArm'
  group.add(leftUpperArm)

  const rightUpperArm = new THREE.Mesh(armGeo, mat)
  rightUpperArm.position.set(0.28 * bodyScaleX * shoulderScale + 0.08, 1.05, 0)
  rightUpperArm.name = 'rightUpperArm'
  group.add(rightUpperArm)

  // Forearms
  const forearmGeo = new THREE.BoxGeometry(0.1 * armScale, 0.3, 0.1 * armScale)
  const leftForearm = new THREE.Mesh(forearmGeo, skinMat)
  leftForearm.position.set(-(0.28 * bodyScaleX * shoulderScale + 0.08), 0.7, 0)
  leftForearm.name = 'leftForearm'
  group.add(leftForearm)

  const rightForearm = new THREE.Mesh(forearmGeo, skinMat)
  rightForearm.position.set(0.28 * bodyScaleX * shoulderScale + 0.08, 0.7, 0)
  rightForearm.name = 'rightForearm'
  group.add(rightForearm)

  // Thighs
  const thighGeo = new THREE.BoxGeometry(0.18 * bodyScaleX, 0.4, 0.18)
  const leftThigh = new THREE.Mesh(thighGeo, legMat)
  leftThigh.position.set(-0.16, 0.42, 0)
  leftThigh.name = 'leftThigh'
  group.add(leftThigh)

  const rightThigh = new THREE.Mesh(thighGeo, legMat)
  rightThigh.position.set(0.16, 0.42, 0)
  rightThigh.name = 'rightThigh'
  group.add(rightThigh)

  // Shins
  const shinGeo = new THREE.BoxGeometry(0.14, 0.38, 0.14)
  const leftShin = new THREE.Mesh(shinGeo, legMat)
  leftShin.position.set(-0.16, 0.04, 0)
  leftShin.name = 'leftShin'
  group.add(leftShin)

  const rightShin = new THREE.Mesh(shinGeo, legMat)
  rightShin.position.set(0.16, 0.04, 0)
  rightShin.name = 'rightShin'
  group.add(rightShin)

  // Scale entire group by height
  group.scale.y = params.heightNorm

  return group
}

// --- Inner scene component ---
interface SceneProps {
  morphParams: CharacterMorphParams
  exerciseSlug: string
  isActive: boolean
}

function CharacterScene({ morphParams, exerciseSlug, isActive }: SceneProps) {
  const groupRef = useRef<THREE.Group | null>(null)
  const mixerRef = useRef<THREE.AnimationMixer | null>(null)

  useEffect(() => {
    if (!groupRef.current) return
    // Rebuild character group whenever morph params change
    while (groupRef.current.children.length) {
      groupRef.current.remove(groupRef.current.children[0]!)
    }
    const charGroup = buildCharacterGroup(morphParams)
    charGroup.children.forEach(c => groupRef.current!.add(c))
    groupRef.current.scale.y = morphParams.heightNorm

    mixerRef.current = new THREE.AnimationMixer(groupRef.current)
  }, [morphParams])

  // Idle rotation when not active
  useFrame((_, delta) => {
    if (mixerRef.current) mixerRef.current.update(delta)
    if (!isActive && groupRef.current) {
      groupRef.current.rotation.y += delta * 0.3
    }
  })

  return <group ref={groupRef} position={[0, -0.8, 0]} />
}

// --- Public component ---
interface PTCharacter3DProps {
  morphParams: CharacterMorphParams
  exerciseSlug: string
  isActive: boolean
  className?: string
}

export function PTCharacter3D({ morphParams, exerciseSlug, isActive, className }: PTCharacter3DProps) {
  return (
    <Canvas
      camera={{ position: [0, 1.0, 3.2], fov: 50 }}
      style={{ background: 'transparent' }}
      className={className}
    >
      <ambientLight intensity={0.6} />
      <directionalLight position={[3, 6, 4]} intensity={1.0} />
      <pointLight position={[-2, 3, 2]} intensity={0.4} color="#10b981" />
      <CharacterScene morphParams={morphParams} exerciseSlug={exerciseSlug} isActive={isActive} />
    </Canvas>
  )
}
```

- [ ] **Step 4: Install @react-three/fiber if not present**

```bash
cd apps/web && npm list @react-three/fiber || npm install @react-three/fiber @react-three/drei
```

- [ ] **Step 5: Run test — verify PASS**

```bash
cd apps/web && npx vitest run components/session/character/__tests__/PTCharacter3D.test.tsx
```

Expected: 1 test passes

- [ ] **Step 6: Commit**

```bash
git add apps/web/components/session/character/PTCharacter3D.tsx apps/web/components/session/character/__tests__/PTCharacter3D.test.tsx
git commit -m "feat: add PTCharacter3D low-poly 3D character component"
```

---

### Task 8: useCharacterMorph hook

**Files:**

- Create: `apps/web/components/session/character/useCharacterMorph.ts`

This hook fetches `/api/character/morph` and returns `CharacterMorphParams`.

- [ ] **Step 1: Implement hook**

```typescript
// apps/web/components/session/character/useCharacterMorph.ts
'use client'

import { useState, useEffect } from 'react'
import type { CharacterMorphParams } from '@repo/shared-types'

const DEFAULT_PARAMS: CharacterMorphParams = {
  bmi: 22,
  muscleLevel: 0,
  heightNorm: 1.0,
  gender: 'other',
  fitnessLevel: 'beginner',
  updatedAt: '',
}

export function useCharacterMorph() {
  const [params, setParams] = useState<CharacterMorphParams>(DEFAULT_PARAMS)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetch('/api/character/morph')
      .then((r) => r.json())
      .then((data) => setParams(data))
      .catch(() => {}) // keep default params on error
      .finally(() => setIsLoading(false))
  }, [])

  return { params, isLoading }
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/components/session/character/useCharacterMorph.ts
git commit -m "feat: add useCharacterMorph hook to fetch morph params from API"
```

---

## Chunk 4: Exercise Animations

### Task 9: Exercise animation clips

**Files:**

- Create: `apps/web/components/session/character/animations/index.ts`
- Create: `apps/web/components/session/character/animations/idle.ts`
- Create: `apps/web/components/session/character/animations/squat.ts`
- Create: `apps/web/components/session/character/animations/pushup.ts`
- Create: `apps/web/components/session/character/animations/plank.ts`
- Create: `apps/web/components/session/character/animations/lunge.ts`
- Create: `apps/web/components/session/character/animations/rest.ts`

Each animation is a `THREE.AnimationClip` that rotates named bones (the named meshes in the character group).

- [ ] **Step 1: Create idle animation**

```typescript
// apps/web/components/session/character/animations/idle.ts
import { AnimationClip, NumberKeyframeTrack } from 'three'

export function createIdleAnimation(): AnimationClip {
  // Gentle torso bob
  const bobTrack = new NumberKeyframeTrack('torso.position[y]', [0, 0.5, 1.0], [1.0, 1.02, 1.0])
  return new AnimationClip('idle', 1.0, [bobTrack])
}
```

- [ ] **Step 2: Create squat animation**

```typescript
// apps/web/components/session/character/animations/squat.ts
import { AnimationClip, QuaternionKeyframeTrack } from 'three'
import * as THREE from 'three'

function q(x: number, y: number, z: number, w: number) {
  return [x, y, z, w]
}

export function createSquatAnimation(): AnimationClip {
  // Thighs rotate forward (squat down), then back (stand up)
  const times = [0, 0.5, 1.0]
  const leftThighRot = new QuaternionKeyframeTrack('leftThigh.quaternion', times, [
    ...q(0, 0, 0, 1),
    ...q(0.5, 0, 0, 0.87),
    ...q(0, 0, 0, 1),
  ])
  const rightThighRot = new QuaternionKeyframeTrack('rightThigh.quaternion', times, [
    ...q(0, 0, 0, 1),
    ...q(0.5, 0, 0, 0.87),
    ...q(0, 0, 0, 1),
  ])
  // Torso leans slightly forward
  const torsoRot = new QuaternionKeyframeTrack('torso.quaternion', times, [
    ...q(0, 0, 0, 1),
    ...q(0.17, 0, 0, 0.98),
    ...q(0, 0, 0, 1),
  ])
  return new AnimationClip('squat', 1.0, [leftThighRot, rightThighRot, torsoRot])
}
```

- [ ] **Step 3: Create pushup animation**

```typescript
// apps/web/components/session/character/animations/pushup.ts
import { AnimationClip, QuaternionKeyframeTrack, VectorKeyframeTrack } from 'three'

export function createPushupAnimation(): AnimationClip {
  const times = [0, 0.5, 1.0]
  // Torso goes down and up (translate Y)
  const torsoY = new VectorKeyframeTrack(
    'torso.position',
    times,
    [0, 1.0, 0, 0, 0.65, 0, 0, 1.0, 0]
  )
  // Arms bend
  const leftForearmRot = new QuaternionKeyframeTrack(
    'leftForearm.quaternion',
    times,
    [0, 0, 0, 1, 0.5, 0, 0, 0.87, 0, 0, 0, 1]
  )
  const rightForearmRot = new QuaternionKeyframeTrack(
    'rightForearm.quaternion',
    times,
    [0, 0, 0, 1, 0.5, 0, 0, 0.87, 0, 0, 0, 1]
  )
  return new AnimationClip('pushup', 1.0, [torsoY, leftForearmRot, rightForearmRot])
}
```

- [ ] **Step 4: Create plank animation**

```typescript
// apps/web/components/session/character/animations/plank.ts
import { AnimationClip, NumberKeyframeTrack } from 'three'

export function createPlankAnimation(): AnimationClip {
  // Very subtle torso hold — slight breathing bob
  const breathTrack = new NumberKeyframeTrack('torso.position[y]', [0, 1.0, 2.0], [0.6, 0.62, 0.6])
  return new AnimationClip('plank', 2.0, [breathTrack])
}
```

- [ ] **Step 5: Create lunge animation**

```typescript
// apps/web/components/session/character/animations/lunge.ts
import { AnimationClip, QuaternionKeyframeTrack, VectorKeyframeTrack } from 'three'

export function createLungeAnimation(): AnimationClip {
  const times = [0, 0.5, 1.0]
  // Left leg steps forward (translate Z)
  const leftThighPos = new VectorKeyframeTrack(
    'leftThigh.position',
    times,
    [-0.16, 0.42, 0, -0.16, 0.25, 0.3, -0.16, 0.42, 0]
  )
  // Right thigh bends back
  const rightThighRot = new QuaternionKeyframeTrack(
    'rightThigh.quaternion',
    times,
    [0, 0, 0, 1, -0.34, 0, 0, 0.94, 0, 0, 0, 1]
  )
  return new AnimationClip('lunge', 1.0, [leftThighPos, rightThighRot])
}
```

- [ ] **Step 6: Create rest animation**

```typescript
// apps/web/components/session/character/animations/rest.ts
import { AnimationClip, QuaternionKeyframeTrack } from 'three'

export function createRestAnimation(): AnimationClip {
  // Hands on knees — arms rotate down slightly
  const times = [0, 0.3, 1.0]
  const leftArmRot = new QuaternionKeyframeTrack(
    'leftUpperArm.quaternion',
    times,
    [0, 0, 0, 1, 0.3, 0, 0.2, 0.93, 0.3, 0, 0.2, 0.93]
  )
  const rightArmRot = new QuaternionKeyframeTrack(
    'rightUpperArm.quaternion',
    times,
    [0, 0, 0, 1, 0.3, 0, -0.2, 0.93, 0.3, 0, -0.2, 0.93]
  )
  return new AnimationClip('rest', 1.0, [leftArmRot, rightArmRot])
}
```

- [ ] **Step 7: Create animation index**

```typescript
// apps/web/components/session/character/animations/index.ts
import { AnimationClip } from 'three'
import { createIdleAnimation } from './idle'
import { createSquatAnimation } from './squat'
import { createPushupAnimation } from './pushup'
import { createPlankAnimation } from './plank'
import { createLungeAnimation } from './lunge'
import { createRestAnimation } from './rest'

const ANIMATION_MAP: Record<string, () => AnimationClip> = {
  idle: createIdleAnimation,
  squat: createSquatAnimation,
  'push-up': createPushupAnimation,
  pushup: createPushupAnimation,
  plank: createPlankAnimation,
  lunge: createLungeAnimation,
  rest: createRestAnimation,
}

export function getAnimationClip(slug: string): AnimationClip {
  const factory = ANIMATION_MAP[slug] ?? ANIMATION_MAP['idle']!
  return factory()
}
```

- [ ] **Step 8: Commit**

```bash
git add apps/web/components/session/character/animations/
git commit -m "feat: add exercise animation clips (idle, squat, pushup, plank, lunge, rest)"
```

---

### Task 10: useExerciseAnimation hook

**Files:**

- Create: `apps/web/components/session/character/useExerciseAnimation.ts`

This hook wires an `AnimationMixer` to the correct clip for the active exercise, and adjusts `timeScale` to match the user's rep speed.

- [ ] **Step 1: Implement hook**

```typescript
// apps/web/components/session/character/useExerciseAnimation.ts
import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { getAnimationClip } from './animations'

interface UseExerciseAnimationOptions {
  mixer: THREE.AnimationMixer | null
  exerciseSlug: string
  isActive: boolean
  userRepDurationMs?: number // set when user rep speed is known
}

export function useExerciseAnimation({
  mixer,
  exerciseSlug,
  isActive,
  userRepDurationMs,
}: UseExerciseAnimationOptions) {
  const actionRef = useRef<THREE.AnimationAction | null>(null)

  useEffect(() => {
    if (!mixer) return

    // Stop previous action
    actionRef.current?.stop()

    const slug = isActive ? exerciseSlug : 'idle'
    const clip = getAnimationClip(slug)
    const action = mixer.clipAction(clip)
    action.reset().play()
    action.setLoop(THREE.LoopRepeat, Infinity)
    actionRef.current = action

    return () => {
      action.stop()
    }
  }, [mixer, exerciseSlug, isActive])

  useEffect(() => {
    if (!actionRef.current || !userRepDurationMs || userRepDurationMs <= 0) return
    const clip = actionRef.current.getClip()
    actionRef.current.timeScale = clip.duration / (userRepDurationMs / 1000)
  }, [userRepDurationMs])
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/components/session/character/useExerciseAnimation.ts
git commit -m "feat: add useExerciseAnimation hook for rep-synced animation playback"
```

---

## Chunk 5: Session UI Redesign

### Task 11: CharacterPanel component

**Files:**

- Create: `apps/web/components/session/panels/CharacterPanel.tsx`

Wraps `PTCharacter3D` with the morph hook and exercise animation integration.

- [ ] **Step 1: Implement**

```typescript
// apps/web/components/session/panels/CharacterPanel.tsx
'use client'

import { useRef } from 'react'
import { PTCharacter3D } from '../character/PTCharacter3D'
import { useCharacterMorph } from '../character/useCharacterMorph'

interface CharacterPanelProps {
  exerciseSlug: string
  isActive: boolean
  isResting: boolean
  aiMessage: string
  poseActive: boolean
}

export function CharacterPanel({
  exerciseSlug,
  isActive,
  isResting,
  aiMessage,
  poseActive,
}: CharacterPanelProps) {
  const { params, isLoading } = useCharacterMorph()
  const slug = isResting ? 'rest' : isActive ? exerciseSlug : 'idle'

  return (
    <div className="relative w-full h-full bg-gray-950 rounded-2xl overflow-hidden border border-emerald-500/20">
      {/* Badge */}
      <div className="absolute top-3 left-3 z-10 bg-emerald-600/90 rounded-lg px-2.5 py-1 flex items-center gap-1.5">
        <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
        <span className="text-white text-xs font-semibold">AI Koç</span>
      </div>

      {/* Pose indicator */}
      {poseActive && (
        <div className="absolute top-3 right-3 z-10 text-xs px-2 py-1 rounded-lg font-medium bg-green-500/20 text-green-400">
          Pose Aktif
        </div>
      )}

      {/* 3D character */}
      {!isLoading && (
        <PTCharacter3D
          morphParams={params}
          exerciseSlug={slug}
          isActive={isActive && !isResting}
          className="w-full h-full"
        />
      )}

      {/* AI message bubble */}
      {aiMessage && (
        <div className="absolute bottom-3 left-3 right-3 bg-emerald-700/90 backdrop-blur-sm rounded-xl px-3 py-2.5">
          <p className="text-white text-xs leading-relaxed">{aiMessage}</p>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/components/session/panels/CharacterPanel.tsx
git commit -m "feat: add CharacterPanel wrapping PTCharacter3D with morph and message display"
```

---

### Task 12: SessionModeSelector component

**Files:**

- Create: `apps/web/components/session/SessionModeSelector.tsx`

Shown on `/dashboard/session` before a mode is chosen.

- [ ] **Step 1: Implement**

```typescript
// apps/web/components/session/SessionModeSelector.tsx
'use client'

import { useRouter } from 'next/navigation'
import { Activity, MessageCircle } from 'lucide-react'

export function SessionModeSelector() {
  const router = useRouter()

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-2xl">
        <h1 className="text-3xl font-black text-center mb-2">Seans Başlat</h1>
        <p className="text-muted-foreground text-center text-sm mb-8">Hangi modda devam etmek istersin?</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Mod 1 */}
          <button
            onClick={() => router.push('/dashboard/session/workout')}
            className="group relative p-6 bg-card border border-border/50 rounded-2xl hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all text-left"
          >
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mb-4 group-hover:bg-emerald-500/20 transition-colors">
              <Activity size={24} className="text-emerald-400" />
            </div>
            <h2 className="text-xl font-black mb-1">AI PT ile Spor</h2>
            <p className="text-muted-foreground text-sm mb-4">Egzersiz yap, form analizi, 3D koç rehberliği</p>
            <span className="inline-flex items-center gap-1.5 text-emerald-400 text-sm font-semibold">
              Başla →
            </span>
          </button>

          {/* Mod 2 */}
          <button
            onClick={() => router.push('/dashboard/session/fitness-coach')}
            className="group relative p-6 bg-card border border-border/50 rounded-2xl hover:border-blue-500/50 hover:bg-blue-500/5 transition-all text-left"
          >
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center mb-4 group-hover:bg-blue-500/20 transition-colors">
              <MessageCircle size={24} className="text-blue-400" />
            </div>
            <h2 className="text-xl font-black mb-1">Fitness Koçu</h2>
            <p className="text-muted-foreground text-sm mb-4">Supplement, beslenme, kilo, motivasyon — sesli danışmanlık</p>
            <span className="inline-flex items-center gap-1.5 text-blue-400 text-sm font-semibold">
              Başla →
            </span>
          </button>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/components/session/SessionModeSelector.tsx
git commit -m "feat: add SessionModeSelector component for Mod 1 / Mod 2 routing"
```

---

### Task 13: Update session routes

**Files:**

- Modify: `apps/web/app/(dashboard)/dashboard/session/page.tsx`
- Create: `apps/web/app/(dashboard)/dashboard/session/workout/page.tsx`

- [ ] **Step 1: Replace session/page.tsx with mode selector**

Replace the contents of `apps/web/app/(dashboard)/dashboard/session/page.tsx` with:

```typescript
// apps/web/app/(dashboard)/dashboard/session/page.tsx
import { SessionModeSelector } from '@/components/session/SessionModeSelector'

export default function SessionPage() {
  return <SessionModeSelector />
}
```

- [ ] **Step 2: Create workout/page.tsx with PTCharacter3D integration**

```typescript
// apps/web/app/(dashboard)/dashboard/session/workout/page.tsx
'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Mic, MicOff, Video, VideoOff, Phone, Play, Pause,
  Heart, Zap, Timer, Volume2, VolumeX, CheckCircle
} from 'lucide-react'
import { useVoiceChat } from '@/hooks/useVoiceChat'
import { useSessionTracker } from '@/hooks/useSessionTracker'
import { usePoseDetection } from '@/hooks/usePoseDetection'
import { CharacterPanel } from '@/components/session/panels/CharacterPanel'

const EXERCISES = [
  { id: 1, name: 'Squat', slug: 'squat', sets: 4, reps: 12, rest: 60, muscles: ['Bacak', 'Kalça'] },
  { id: 2, name: 'Push-up', slug: 'push-up', sets: 3, reps: 15, rest: 45, muscles: ['Göğüs', 'Tricep'] },
  { id: 3, name: 'Plank', slug: 'plank', sets: 3, reps: 60, rest: 30, muscles: ['Core'], isDuration: true },
  { id: 4, name: 'Lunge', slug: 'lunge', sets: 3, reps: 10, rest: 45, muscles: ['Bacak'] },
  { id: 5, name: 'Mountain Climber', slug: 'mountain-climber', sets: 3, reps: 20, rest: 30, muscles: ['Kardio', 'Core'] },
]

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
      <VideoOff size={40} className="text-gray-600 mx-auto" />
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

export default function WorkoutPage() {
  const { speak, stop: stopSpeech, startRecording, stopRecording, isRecording, state: voiceState } = useVoiceChat({
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

  useEffect(() => { currentSetRef.current = currentSet }, [currentSet])
  useEffect(() => { exerciseRef.current = exercise }, [exercise])
  useEffect(() => { isVoiceOnRef.current = isVoiceOn }, [isVoiceOn])
  useEffect(() => { isRestingRef.current = isResting }, [isResting])

  const fetchAIMessage = useCallback(async (reps: number) => {
    if (isLoadingMessage) return
    setIsLoadingMessage(true)
    try {
      const ex = exerciseRef.current
      const res = await fetch('/api/ai/coach-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          exercise: ex.name, repCount: reps, targetReps: ex.reps,
          setNumber: currentSetRef.current, totalSets: ex.sets,
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

  const handleRep = useCallback((count: number, score: number) => {
    if (isRestingRef.current || isPaused) return
    const ex = exerciseRef.current
    setFormScore(score)
    setRepCount(count)
    if (count === Math.floor(ex.reps / 2)) fetchAIMessage(count)
    if (count >= ex.reps) {
      const setNum = currentSetRef.current
      recordSet({ exerciseName: ex.name, exerciseSlug: ex.slug, muscleGroups: ex.muscles, setNumber: setNum, reps: count, formScore: score, repData: [] })
      const remaining = ex.sets - setNum
      const doneMsg = `Set ${setNum} tamamlandı! ${remaining > 0 ? `${remaining} set daha kaldı.` : 'Egzersiz bitti!'}`
      setAiMessage(doneMsg)
      if (isVoiceOnRef.current) speak(doneMsg)
      if (setNum >= ex.sets) { setExerciseIdx(i => Math.min(i + 1, EXERCISES.length - 1)); setCurrentSet(1) }
      else setCurrentSet(s => s + 1)
      setRepCount(0); setIsResting(true); setRestTime(ex.rest)
    }
  }, [isPaused, fetchAIMessage, recordSet, speak])

  const { isLoaded: poseLoaded, resetCounter } = usePoseDetection({
    videoRef, exerciseSlug: exercise.slug, isActive: isActive && !isPaused && isVideoOn, onRep: handleRep,
  })

  useEffect(() => { resetCounter(); setRepCount(0) }, [exerciseIdx, currentSet, resetCounter])

  useEffect(() => {
    if (!isActive || isPaused) return
    const t = setInterval(() => {
      setSessionTime(s => s + 1); setCalories(c => c + 0.085)
      setHeartRate(h => Math.max(65, Math.min(185, h + (Math.random() - 0.4) * 2.5)))
    }, 1000)
    return () => clearInterval(t)
  }, [isActive, isPaused])

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

  const startWorkout = async () => {
    const id = await startSession()
    sessionIdRef.current = id
    setIsActive(true)
    const msg = 'Seans başladı! İlk egzersizimiz ' + exercise.name
    setAiMessage(msg)
    if (isVoiceOn) speak(msg)
  }

  const endWorkout = async () => {
    stopSpeech()
    await endSession({ durationSeconds: sessionTime, caloriesBurned: Math.round(calories), overallFormScore: Math.round(formScore), heartRateData: [] })
    setIsActive(false); setSessionTime(0); setExerciseIdx(0); setCurrentSet(1); setRepCount(0); setCalories(0); setIsResting(false)
    setAiMessage('Seans tamamlandı! Harika iş çıkardın!')
  }

  const fmt = (s: number) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col gap-3 -mt-8 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 pt-4 pb-4 overflow-hidden">

      {/* Pre-session overlay */}
      <AnimatePresence>
        {!isActive && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 bg-background/95 backdrop-blur-sm flex items-center justify-center">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="text-center max-w-md px-4">
              <h1 className="text-3xl font-black mb-2">Full Body Strength</h1>
              <p className="text-muted-foreground mb-6 text-sm">3D AI koçun hazır · Sesli yönlendirme açık</p>
              <div className="grid grid-cols-3 gap-3 mb-8">
                {[{ label: 'Egzersiz', value: `${EXERCISES.length}` }, { label: 'Süre', value: '~40 dk' }, { label: 'Kalori', value: '~300' }].map(s => (
                  <div key={s.label} className="bg-card/50 border border-border/30 rounded-xl p-3">
                    <p className="text-xl font-black">{s.value}</p>
                    <p className="text-xs text-muted-foreground">{s.label}</p>
                  </div>
                ))}
              </div>
              <button onClick={startWorkout} className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-colors">
                <Play size={18} /> Seansı Başlat
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stats bar */}
      <div className="flex items-center justify-between shrink-0 flex-wrap gap-2">
        <div className="flex items-center gap-3 flex-wrap">
          {[{ icon: Timer, value: fmt(sessionTime), color: 'text-blue-400' }, { icon: Heart, value: `${Math.round(heartRate)} bpm`, color: 'text-red-400' }, { icon: Zap, value: `${Math.round(calories)} kcal`, color: 'text-yellow-400' }].map(({ icon: Icon, value, color }) => (
            <div key={value} className="flex items-center gap-1.5 bg-card/50 border border-border/30 rounded-lg px-3 py-1.5">
              <Icon size={13} className={color} />
              <span className="text-sm font-mono font-bold">{value}</span>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-1.5">
          {EXERCISES.map((ex, i) => (
            <div key={ex.id} className={`h-1.5 w-6 rounded-full transition-colors ${i < exerciseIdx ? 'bg-green-500' : i === exerciseIdx ? 'bg-emerald-400 animate-pulse' : 'bg-muted'}`} />
          ))}
        </div>
      </div>

      {/* Video area */}
      <div className="flex-1 grid grid-cols-2 gap-3 min-h-0">
        {/* AI Character — left 40% */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="relative">
          <CharacterPanel
            exerciseSlug={exercise.slug}
            isActive={isActive && !isPaused}
            isResting={isResting}
            aiMessage={aiMessage}
            poseActive={poseLoaded}
          />
          {/* Exercise info overlay */}
          <div className="absolute top-3 right-3 z-10 bg-black/60 rounded-lg px-2.5 py-1">
            <p className="text-white text-xs font-semibold">{exercise.name}</p>
            <p className="text-gray-400 text-xs">Set {currentSet}/{exercise.sets}</p>
          </div>
        </motion.div>

        {/* User camera — right 60% */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
          className="relative bg-gray-950 rounded-2xl overflow-hidden border border-border/30">
          <UserCamera isOn={isVideoOn} videoRef={videoRef} />

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
                  <circle cx="18" cy="18" r="15" fill="none" stroke="#10b981" strokeWidth="3"
                    strokeDasharray={`${(repCount / exercise.reps) * 94} 94`} strokeLinecap="round" />
                </svg>
              </div>
              <div className="h-1 bg-gray-800 rounded-full overflow-hidden">
                <motion.div className="h-full bg-emerald-500 rounded-full" animate={{ width: `${(repCount / exercise.reps) * 100}%` }} />
              </div>
            </div>
          )}

          <AnimatePresence>
            {isResting && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center rounded-xl">
                <div className="text-center">
                  <p className="text-gray-400 text-sm mb-1">Dinlenme</p>
                  <motion.p key={restTime} initial={{ scale: 1.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                    className="text-white text-5xl font-black">{restTime}</motion.p>
                  <p className="text-gray-500 text-xs mt-1">saniye</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between shrink-0 flex-wrap gap-2">
        <div className="flex gap-1.5 flex-wrap">
          {EXERCISES.map((ex, i) => (
            <div key={ex.id} className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium border ${i === exerciseIdx ? 'bg-emerald-600 text-white border-emerald-600' : i < exerciseIdx ? 'bg-green-500/15 text-green-400 border-green-500/30' : 'bg-card/50 text-muted-foreground border-border/30'}`}>
              {i < exerciseIdx && <CheckCircle size={10} />}
              {ex.name}
            </div>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => isRecording ? stopRecording() : startRecording()}
            className={`p-2.5 rounded-xl border transition-colors ${isRecording ? 'bg-red-500/30 border-red-500 text-red-300 animate-pulse' : 'bg-card/50 border-border/30 hover:bg-card'}`}>
            {isRecording ? <MicOff size={16} /> : <Mic size={16} />}
          </button>
          <button onClick={() => setIsVideoOn(v => !v)}
            className={`p-2.5 rounded-xl border transition-colors ${isVideoOn ? 'bg-card/50 border-border/30 hover:bg-card' : 'bg-red-500/15 border-red-500/30 text-red-400'}`}>
            {isVideoOn ? <Video size={16} /> : <VideoOff size={16} />}
          </button>
          <button onClick={() => { setIsVoiceOn(v => !v); if (isVoiceOn) stopSpeech() }}
            className={`p-2.5 rounded-xl border transition-colors ${isVoiceOn ? 'bg-card/50 border-border/30 hover:bg-card' : 'bg-orange-500/15 border-orange-500/30 text-orange-400'}`}>
            {isVoiceOn ? <Volume2 size={16} /> : <VolumeX size={16} />}
          </button>
          {isActive && (
            <button onClick={() => { setIsPaused(p => !p); if (!isPaused) stopSpeech() }}
              className="p-2.5 rounded-xl bg-yellow-500/15 border border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/25 transition-colors">
              {isPaused ? <Play size={16} /> : <Pause size={16} />}
            </button>
          )}
          <button onClick={endWorkout}
            className="p-2.5 rounded-xl bg-red-500/15 border border-red-500/30 text-red-400 hover:bg-red-500/25 transition-colors">
            <Phone size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: TypeScript check**

```bash
cd apps/web && npx tsc --noEmit
```

Expected: No errors in new files.

- [ ] **Step 4: Commit**

```bash
git add apps/web/app/(dashboard)/dashboard/session/page.tsx apps/web/app/(dashboard)/dashboard/session/workout/page.tsx
git commit -m "feat: add session mode selector and workout page with 3D character integration"
```

---

## Chunk 6: Mobile Babylon.js Update

### Task 14: Update AvatarMorpher for CharacterMorphParams

**Files:**

- Modify: `apps/mobile/lib/session/avatar-morpher.ts`

- [ ] **Step 1: Read current AvatarState type**

```bash
# Check what AvatarState currently looks like
cat apps/mobile/lib/session/types.ts
```

- [ ] **Step 2: Update AvatarMorpher to accept CharacterMorphParams**

Add a new method `applyCharacterMorphParams` alongside the existing `applyMorph` (keep backward compat):

```typescript
// Add import at top
import type { CharacterMorphParams } from '@repo/shared-types'

// Add to AvatarMorpher class, after existing methods:
applyCharacterMorphParams(mesh: BABYLON.AbstractMesh, params: CharacterMorphParams): void {
  // BMI → body width scale
  let bodyScaleX: number
  if (params.bmi < 18.5) bodyScaleX = 0.85
  else if (params.bmi < 25) bodyScaleX = 1.0
  else if (params.bmi < 30) bodyScaleX = 1.15
  else if (params.bmi < 35) bodyScaleX = 1.30
  else bodyScaleX = 1.45

  // Height → Y scale
  const scaleY = params.heightNorm

  if (mesh.scaling) {
    mesh.scaling = new BABYLON.Vector3(bodyScaleX, scaleY, 1.0)
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add apps/mobile/lib/session/avatar-morpher.ts
git commit -m "feat: add applyCharacterMorphParams to AvatarMorpher for multi-axis body morphing"
```

---

## Chunk 7: Final Verification

### Task 15: Run all tests

- [ ] **Step 1: Run all web tests**

```bash
cd apps/web && npx vitest run
```

Expected: All existing tests pass + new tests pass (morph-calculator × 7, level-calculator × 8, morph API × 3, PTCharacter3D × 1 = 19 new tests minimum).

- [ ] **Step 2: TypeScript full check**

```bash
cd apps/web && npx tsc --noEmit
cd apps/mobile && npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 3: Commit if any cleanup needed, then final commit**

```bash
git add -A
git commit -m "feat: Mod 1 AI PT session redesign — low-poly 3D character with morph + exercise animations"
```
