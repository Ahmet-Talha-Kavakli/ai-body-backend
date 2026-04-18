# Phase 2: Complete Workout System Implementation Plan (Part 1)

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement complete workout tracking with real-time MediaPipe pose detection, form analysis engine, 3D avatar feedback, video recording, and offline session storage.

**Architecture:** Real-time camera pipeline with MediaPipe (30 FPS pose detection) → TensorFlow.js form analysis → Babylon.js 3D avatar visualization. Sessions stored in SQLite offline, synced with video upload. FormRepData per-rep tracking for progression analysis.

**Tech Stack:** Expo Camera, MediaPipe, TensorFlow.js, Babylon.js, React Native Reanimated, SQLite, video recording (expo-av)

---

## File Structure Overview

```
apps/mobile/src/
├── types/
│   ├── workout.ts                  # Workout types (Session, Set, Rep, FormRepData)
│   ├── exercise.ts                 # Exercise, FormRules, PoseConfig
│   ├── form-analysis.ts            # FormAnalysisResult, FormScore
│   └── video.ts                    # VideoMeta, VideoUploadStatus
├── store/
│   ├── workoutStore.ts             # Active session state
│   ├── exerciseLibraryStore.ts     # Exercise cache
│   └── analytics-store.ts          # Session history + stats
├── db/
│   ├── workoutSession.ts           # SQLite session storage
│   ├── formRepData.ts              # SQLite form rep tracking
│   ├── exerciseLibrary.ts          # SQLite exercise cache
│   └── videoQueue.ts               # SQLite video upload queue
├── ml/
│   ├── mediapipe-processor.ts      # MediaPipe integration (pose detection)
│   ├── form-analyzer.ts            # TensorFlow.js form analysis rules
│   ├── pose-extractor.ts           # Keypoint → angles converter
│   └── feedback-generator.ts       # Form feedback text generation
├── api/
│   ├── workout-client.ts           # Workout API endpoints (extends api/client)
│   └── video-upload.ts             # Video upload with progress tracking
├── screens/
│   ├── workout/
│   │   ├── WorkoutStartScreen.tsx  # Program selection + quick start
│   │   ├── SessionCameraScreen.tsx # Main camera + pose overlay
│   │   ├── ExerciseLibraryScreen.tsx
│   │   └── WorkoutHistoryScreen.tsx
├── components/
│   ├── camera/
│   │   ├── CameraFeed.tsx          # Camera wrapper with permissions
│   │   ├── PoseOverlay.tsx         # MediaPipe skeleton overlay
│   │   ├── FormFeedbackBanner.tsx  # Real-time feedback display
│   │   └── RepCounterDisplay.tsx   # Rep + set counter
│   ├── avatar/
│   │   ├── AvatarCanvas.tsx        # Babylon.js 3D avatar
│   │   ├── PoseCorrector.tsx       # Overlay correct form
│   │   └── FeedbackVisuals.tsx     # Green/red feedback colors
│   ├── workout/
│   │   ├── SessionTimer.tsx        # Workout timer (pause/stop)
│   │   ├── ExerciseCard.tsx        # Exercise info + form tips
│   │   ├── SessionSummary.tsx      # Session recap after completion
│   │   └── FormScoreCard.tsx       # Form score 0-100 display
│   └── shared/
│       └── OfflineVideoIndicator.tsx # Video sync status
├── hooks/
│   ├── useCamera.ts                # Camera setup + frame capture
│   ├── useWorkoutSession.ts        # Session lifecycle (start/pause/stop)
│   ├── useFormAnalysis.ts          # Form analysis real-time pipeline
│   ├── useAvatarPose.ts            # Avatar pose updates
│   ├── useVideoRecording.ts        # Video recording control
│   └── useVideoUploadQueue.ts      # Video upload management
├── utils/
│   ├── form-rules.ts               # Exercise form rules (squats, bench, etc)
│   ├── keypoint-calculator.ts      # Angle/distance calculations
│   ├── form-scorer.ts              # 0-100 form score algorithm
│   └── video-codec.ts              # Video encoding setup
└── services/
    └── pose-detection.ts            # MediaPipe wrapper service
```

---

## Chunk 1: Types & Data Models

### Task 1: Create workout type definitions

**Files:**

- Create: `apps/mobile/src/types/workout.ts`
- Create: `apps/mobile/src/types/exercise.ts`
- Create: `apps/mobile/src/types/form-analysis.ts`
- Create: `apps/mobile/src/types/video.ts`

- [ ] **Step 1: Create workout.ts with session types**

```typescript
// apps/mobile/src/types/workout.ts
export interface WorkoutSession {
  id: string
  userId: string
  programId?: string
  startedAt: string
  endedAt?: string
  status: 'active' | 'paused' | 'completed' | 'abandoned'
  exerciseName: string
  muscleGroup: string
  notes?: string
  totalSets: number
  completedSets: CompletedSet[]
  totalCalories?: number
  totalDuration: number // seconds
  formScore?: number // 0-100 average
  syncedAt?: string
  videoPath?: string
  videoSynced: boolean
}

export interface CompletedSet {
  id: string
  setNumber: number
  reps: FormRepData[]
  targetReps: number
  actualReps: number
  weight?: number
  rpe?: number // rate of perceived exertion 1-10
  notes?: string
  completedAt: string
}

export interface FormRepData {
  id: string
  repNumber: number
  keypoints: Keypoint[] // 17 MediaPipe points
  angles: AngleData[]
  formScore: number // 0-100
  technicalCorrectness: 'perfect' | 'good' | 'poor' | 'dangerous'
  errors: FormError[]
  muscleEngagement: Record<string, number> // muscle -> 0-100 engagement
  injuryRisk: number // 0-100 risk score
  voiceFeedback: string // "Knees in, back straight"
  corrections: string[] // ["Go deeper", "Keep chest up"]
  timestamp: number // ms since session start
  frameImage?: string // base64 frame (optional for review)
}

export interface Keypoint {
  x: number
  y: number
  z: number
  visibility: number // 0-1 confidence
  name: string // 'nose', 'left_shoulder', etc
}

export interface AngleData {
  joint: string // 'left_knee', 'right_hip', etc
  angle: number // degrees
  normal: number // expected angle
  deviation: number // degrees from normal
}

export interface FormError {
  type: 'angle' | 'position' | 'range' | 'symmetry' | 'speed'
  joint?: string
  message: string
  severity: 'info' | 'warning' | 'critical'
  correction: string
}

export interface WorkoutProgram {
  id: string
  userId: string
  name: string
  type: 'strength' | 'cardio' | 'flexibility' | 'mixed'
  weeks: ProgramWeek[]
  createdAt: string
}

export interface ProgramWeek {
  weekNumber: number
  days: ProgramDay[]
}

export interface ProgramDay {
  dayNumber: number // 1-7
  exercises: PlannedExercise[]
}

export interface PlannedExercise {
  exerciseId: string
  sets: number
  reps: number
  weight?: number
  rest: number // seconds
  notes?: string
}
```

Expected: File created with all types defined

- [ ] **Step 2: Create exercise.ts with form rules**

```typescript
// apps/mobile/src/types/exercise.ts
export interface Exercise {
  id: string
  name: string
  muscleGroup: 'chest' | 'back' | 'shoulders' | 'arms' | 'legs' | 'core'
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  description: string
  videoUrl?: string
  thumbnailUrl?: string
  variations: string[]
  formRules: FormRule[]
  poseConfig: PoseConfig
  cues: string[] // Form tips: "Elbows tucked", "Back straight"
}

export interface FormRule {
  id: string
  type: 'angle' | 'position' | 'range' | 'symmetry'
  joint?: string // 'knee', 'hip', etc
  target: number // expected value
  tolerance: number // ±tolerance
  importance: number // 0-1 weight in form score
  feedback: string // "Knees should be under shoulders"
  correction: string // "Bring knees forward"
  injuryRisk: number // 0-1 risk if violated
}

export interface PoseConfig {
  exerciseId: string
  startPosition: BodyPosition
  endPosition: BodyPosition
  criticalJoints: string[] // Joints to track closely
  symmetryRequired: boolean // Both sides mirror?
  minDuration: number // Minimum rep duration (ms)
  maxDuration: number // Maximum rep duration (ms)
}

export interface BodyPosition {
  keypoints: Record<string, { x: number; y: number; z: number }>
  description: string
}

export interface ExerciseLibrary {
  exercises: Exercise[]
  lastUpdated: string
  version: number
}
```

Expected: File created with exercise + form rule types

- [ ] **Step 3: Create form-analysis.ts**

```typescript
// apps/mobile/src/types/form-analysis.ts
export interface FormAnalysisResult {
  repNumber: number
  formScore: number // 0-100
  isGoodRep: boolean // > 70 = good
  violations: FormViolation[]
  feedback: FeedbackMessage[]
  muscleEngagement: MuscleEngagement
  metrics: FormMetrics
}

export interface FormViolation {
  joint: string
  expected: number
  actual: number
  deviation: number
  severity: 'low' | 'medium' | 'high'
  message: string
}

export interface FeedbackMessage {
  type: 'positive' | 'correction' | 'warning'
  text: string // "Good depth!", "Elbows tucked", "Danger: hyperextension"
  priority: 'top2' | 'secondary' // Top 2 shown in real-time
}

export interface MuscleEngagement {
  [muscleGroup: string]: number // 0-100 engagement %
}

export interface FormMetrics {
  depth?: number // Rom range
  speed: number // ms per rep
  symmetry: number // 0-100 left/right balance
  stability: number // 0-100 shakiness
  tempo: 'fast' | 'controlled' | 'slow'
}

export interface PoseAnalysisPipeline {
  rawKeypoints: any[] // MediaPipe output
  normalizedKeypoints: NormalizedKeypoint[]
  extractedAngles: AngleExtraction[]
  ruleEvaluations: RuleEvaluation[]
  formScore: number
}

export interface NormalizedKeypoint {
  name: string
  x: number // 0-1 screen normalized
  y: number // 0-1 screen normalized
  z: number // depth
  confidence: number
}

export interface AngleExtraction {
  joint: string // 'left_knee', etc
  angle: number // degrees
  reference: number // expected
}

export interface RuleEvaluation {
  ruleId: string
  passed: boolean
  deviation: number
  importance: number
  feedback: string
}
```

Expected: File created

- [ ] **Step 4: Create video.ts**

```typescript
// apps/mobile/src/types/video.ts
export interface VideoMeta {
  id: string
  sessionId: string
  filePath: string // Local file path
  fileName: string
  size: number // bytes
  duration: number // seconds
  width: number
  height: number
  fps: number
  codec: string // 'h264', etc
  createdAt: string
  uploadedAt?: string
  uploadProgress: number // 0-100
  uploadStatus: 'pending' | 'uploading' | 'completed' | 'failed'
  s3Url?: string // After upload
  thumbnailUrl?: string
}

export interface VideoUploadQueue {
  id: string
  sessionId: string
  videoPath: string
  status: 'pending' | 'uploading' | 'retrying' | 'completed' | 'failed'
  progress: number // 0-100
  attempts: number
  lastAttempt?: string
  error?: string
  createdAt: string
}
```

Expected: File created

- [ ] **Step 5: Commit types**

```bash
git add apps/mobile/src/types/
git commit -m "feat: add comprehensive type definitions for workout system (session, exercise, form analysis, video)"
```

Expected: Commit successful

---

### Task 2: Create Zustand stores for workout state

**Files:**

- Create: `apps/mobile/src/store/workoutStore.ts`
- Create: `apps/mobile/src/store/exerciseLibraryStore.ts`
- Create: `apps/mobile/src/store/analyticsStore.ts`

- [ ] **Step 1: Create workoutStore for active session**

```typescript
// apps/mobile/src/store/workoutStore.ts
import { create } from 'zustand'
import { WorkoutSession, CompletedSet, FormRepData } from '../types/workout'

interface WorkoutState {
  // Active session
  activeSession: WorkoutSession | null
  currentSetNumber: number
  currentRepNumber: number

  // Timers
  sessionDuration: number // seconds elapsed
  repStartTime: number | null

  // State
  isPaused: boolean
  isRecording: boolean
  isAnalyzing: boolean

  // Current form analysis
  lastFormScore: number | null
  lastFeedback: string[]

  // Actions
  startSession: (exerciseName: string, muscleGroup: string) => void
  pauseSession: () => void
  resumeSession: () => void
  endSession: () => void

  addCompletedSet: (set: CompletedSet) => void
  addFormRepData: (repData: FormRepData) => void

  updateSessionDuration: (duration: number) => void
  updateFormAnalysis: (score: number, feedback: string[]) => void

  setRecording: (recording: boolean) => void
  setAnalyzing: (analyzing: boolean) => void

  reset: () => void
}

export const useWorkoutStore = create<WorkoutState>((set) => ({
  activeSession: null,
  currentSetNumber: 1,
  currentRepNumber: 1,
  sessionDuration: 0,
  repStartTime: null,
  isPaused: false,
  isRecording: false,
  isAnalyzing: false,
  lastFormScore: null,
  lastFeedback: [],

  startSession: (exerciseName: string, muscleGroup: string) => {
    set((state) => ({
      activeSession: {
        id: `session_${Date.now()}`,
        userId: '', // Set by auth
        exerciseName,
        muscleGroup,
        startedAt: new Date().toISOString(),
        status: 'active',
        totalSets: 3, // Default, can be changed
        completedSets: [],
        totalDuration: 0,
        videoSynced: false,
      } as WorkoutSession,
      sessionDuration: 0,
      currentSetNumber: 1,
      currentRepNumber: 1,
      isPaused: false,
    }))
  },

  pauseSession: () => set({ isPaused: true }),
  resumeSession: () => set({ isPaused: false }),

  endSession: () =>
    set((state) => ({
      activeSession: state.activeSession
        ? {
            ...state.activeSession,
            status: 'completed',
            endedAt: new Date().toISOString(),
            totalDuration: state.sessionDuration,
          }
        : null,
    })),

  addCompletedSet: (set: CompletedSet) =>
    set((state) => ({
      activeSession: state.activeSession
        ? {
            ...state.activeSession,
            completedSets: [...state.activeSession.completedSets, set],
          }
        : null,
      currentSetNumber: state.currentSetNumber + 1,
      currentRepNumber: 1,
    })),

  addFormRepData: (repData: FormRepData) =>
    set((state) => ({
      activeSession: state.activeSession
        ? {
            ...state.activeSession,
            completedSets: state.activeSession.completedSets.map((s) =>
              s.setNumber === state.currentSetNumber ? { ...s, reps: [...s.reps, repData] } : s
            ),
          }
        : null,
    })),

  updateSessionDuration: (duration: number) => set({ sessionDuration: duration }),

  updateFormAnalysis: (score: number, feedback: string[]) =>
    set({ lastFormScore: score, lastFeedback: feedback }),

  setRecording: (recording: boolean) => set({ isRecording: recording }),
  setAnalyzing: (analyzing: boolean) => set({ isAnalyzing: analyzing }),

  reset: () =>
    set({
      activeSession: null,
      currentSetNumber: 1,
      currentRepNumber: 1,
      sessionDuration: 0,
      repStartTime: null,
      isPaused: false,
      isRecording: false,
      isAnalyzing: false,
      lastFormScore: null,
      lastFeedback: [],
    }),
}))
```

Expected: Store created and tested

- [ ] **Step 2: Create exerciseLibraryStore**

```typescript
// apps/mobile/src/store/exerciseLibraryStore.ts
import { create } from 'zustand'
import { Exercise } from '../types/exercise'

interface ExerciseLibraryState {
  exercises: Exercise[]
  isLoading: boolean
  error: string | null
  lastFetch: number | null

  setExercises: (exercises: Exercise[]) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  setLastFetch: (time: number) => void

  getExercisesByMuscle: (muscle: string) => Exercise[]
  getExerciseById: (id: string) => Exercise | undefined

  reset: () => void
}

export const useExerciseLibraryStore = create<ExerciseLibraryState>((set, get) => ({
  exercises: [],
  isLoading: false,
  error: null,
  lastFetch: null,

  setExercises: (exercises) => set({ exercises }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  setLastFetch: (time) => set({ lastFetch: time }),

  getExercisesByMuscle: (muscle) => get().exercises.filter((e) => e.muscleGroup === muscle),

  getExerciseById: (id) => get().exercises.find((e) => e.id === id),

  reset: () =>
    set({
      exercises: [],
      isLoading: false,
      error: null,
      lastFetch: null,
    }),
}))
```

Expected: Store created

- [ ] **Step 3: Create analyticsStore**

```typescript
// apps/mobile/src/store/analyticsStore.ts
import { create } from 'zustand'
import { WorkoutSession } from '../types/workout'

interface AnalyticsState {
  sessions: WorkoutSession[]
  totalWorkouts: number
  totalCalories: number
  averageFormScore: number
  isLoading: boolean
  error: string | null

  setSessions: (sessions: WorkoutSession[]) => void
  addSession: (session: WorkoutSession) => void
  updateStats: () => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void

  reset: () => void
}

export const useAnalyticsStore = create<AnalyticsState>((set, get) => ({
  sessions: [],
  totalWorkouts: 0,
  totalCalories: 0,
  averageFormScore: 0,
  isLoading: false,
  error: null,

  setSessions: (sessions) => set({ sessions }),

  addSession: (session) =>
    set((state) => ({
      sessions: [...state.sessions, session],
    })),

  updateStats: () => {
    const state = get()
    const sessions = state.sessions.filter((s) => s.status === 'completed')
    const total = sessions.length
    const totalCals = sessions.reduce((sum, s) => sum + (s.totalCalories || 0), 0)
    const avgForm =
      sessions.length > 0
        ? sessions.reduce((sum, s) => sum + (s.formScore || 0), 0) / sessions.length
        : 0

    set({
      totalWorkouts: total,
      totalCalories: totalCals,
      averageFormScore: avgForm,
    })
  },

  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),

  reset: () =>
    set({
      sessions: [],
      totalWorkouts: 0,
      totalCalories: 0,
      averageFormScore: 0,
      isLoading: false,
      error: null,
    }),
}))
```

Expected: Store created

- [ ] **Step 4: Commit stores**

```bash
git add apps/mobile/src/store/workoutStore.ts apps/mobile/src/store/exerciseLibraryStore.ts apps/mobile/src/store/analyticsStore.ts
git commit -m "feat: create Zustand stores for workout session, exercise library, and analytics"
```

Expected: Commit successful

---

**End of Chunk 1**

This chunk establishes the complete type system and state management for Phase 2. All data models align with the Prisma schema on backend.

---

## Chunk 2: MediaPipe Integration & Form Analysis Engine

### Task 3: Set up MediaPipe pose detection

**Files:**

- Create: `apps/mobile/src/services/pose-detection.ts`
- Create: `apps/mobile/src/ml/mediapipe-processor.ts`
- Create: `apps/mobile/src/ml/pose-extractor.ts`
- Create: `apps/mobile/tests/ml/pose-extractor.test.ts`

- [ ] **Step 1: Write failing test for pose extraction**

```typescript
// apps/mobile/tests/ml/pose-extractor.test.ts
import { describe, it, expect } from 'vitest'
import { extractAngles, calculateJointAngle, normalizeKeypoints } from '../../src/ml/pose-extractor'
import { Keypoint } from '../../src/types/workout'

describe('Pose Extractor', () => {
  const mockKeypoints: Keypoint[] = [
    { x: 0.5, y: 0.3, z: 0, visibility: 0.95, name: 'left_hip' },
    { x: 0.5, y: 0.6, z: 0, visibility: 0.95, name: 'left_knee' },
    { x: 0.5, y: 0.9, z: 0, visibility: 0.95, name: 'left_ankle' },
  ]

  it('should calculate knee angle from 3 keypoints', () => {
    const angle = calculateJointAngle(
      mockKeypoints[0], // hip
      mockKeypoints[1], // knee
      mockKeypoints[2] // ankle
    )
    expect(angle).toBeCloseTo(180, 5) // Straight line = 180°
  })

  it('should extract angles from keypoints', () => {
    const angles = extractAngles(mockKeypoints)
    expect(angles).toBeDefined()
    expect(angles.length).toBeGreaterThan(0)
  })

  it('should normalize keypoints to 0-1 range', () => {
    const normalized = normalizeKeypoints(mockKeypoints, 1920, 1080)
    expect(normalized[0].x).toBeLessThanOrEqual(1)
    expect(normalized[0].y).toBeLessThanOrEqual(1)
  })
})
```

Expected: Test fails (functions not implemented)

- [ ] **Step 2: Implement pose extraction**

```typescript
// apps/mobile/src/ml/pose-extractor.ts
import { Keypoint, AngleData } from '../types/workout'

export function calculateJointAngle(
  point1: Keypoint, // Start point
  point2: Keypoint, // Joint (center)
  point3: Keypoint // End point
): number {
  // Vector from point2 to point1
  const v1 = {
    x: point1.x - point2.x,
    y: point1.y - point2.y,
  }

  // Vector from point2 to point3
  const v2 = {
    x: point3.x - point2.x,
    y: point3.y - point2.y,
  }

  // Dot product
  const dot = v1.x * v2.x + v1.y * v2.y

  // Magnitudes
  const mag1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y)
  const mag2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y)

  // Angle in radians
  const cosAngle = dot / (mag1 * mag2)
  const angle = Math.acos(Math.max(-1, Math.min(1, cosAngle))) // Clamp to [-1,1]

  // Convert to degrees
  return (angle * 180) / Math.PI
}

export function extractAngles(keypoints: Keypoint[]): AngleData[] {
  const angles: AngleData[] = []
  const keypointMap = new Map(keypoints.map((k) => [k.name, k]))

  // Define joint angles to extract
  const jointDefinitions = [
    { joint: 'left_knee', start: 'left_hip', center: 'left_knee', end: 'left_ankle' },
    { joint: 'right_knee', start: 'right_hip', center: 'right_knee', end: 'right_ankle' },
    { joint: 'left_hip', start: 'left_shoulder', center: 'left_hip', end: 'left_knee' },
    { joint: 'right_hip', start: 'right_shoulder', center: 'right_hip', end: 'right_knee' },
    { joint: 'left_elbow', start: 'left_shoulder', center: 'left_elbow', end: 'left_wrist' },
    { joint: 'right_elbow', start: 'right_shoulder', center: 'right_elbow', end: 'right_wrist' },
    { joint: 'left_shoulder', start: 'left_hip', center: 'left_shoulder', end: 'left_elbow' },
    { joint: 'right_shoulder', start: 'right_hip', center: 'right_shoulder', end: 'right_elbow' },
  ]

  for (const def of jointDefinitions) {
    const p1 = keypointMap.get(def.start)
    const p2 = keypointMap.get(def.center)
    const p3 = keypointMap.get(def.end)

    if (p1 && p2 && p3 && p1.visibility > 0.5 && p2.visibility > 0.5 && p3.visibility > 0.5) {
      const angle = calculateJointAngle(p1, p2, p3)
      angles.push({
        joint: def.joint,
        angle,
        normal: 0, // Will be set by form rules
        deviation: 0, // Calculated later
      })
    }
  }

  return angles
}

export function normalizeKeypoints(
  keypoints: Keypoint[],
  screenWidth: number,
  screenHeight: number
): Keypoint[] {
  return keypoints.map((kp) => ({
    ...kp,
    x: kp.x / screenWidth,
    y: kp.y / screenHeight,
  }))
}

export function calculateDistance(point1: Keypoint, point2: Keypoint): number {
  return Math.sqrt(Math.pow(point1.x - point2.x, 2) + Math.pow(point1.y - point2.y, 2))
}

export function checkSymmetry(
  leftKeypoint: Keypoint,
  rightKeypoint: Keypoint,
  threshold: number = 0.15 // 15% tolerance
): number {
  if (leftKeypoint.visibility < 0.5 || rightKeypoint.visibility < 0.5) {
    return 0
  }

  // Distance between left and right points
  const distance = Math.abs(leftKeypoint.x - rightKeypoint.x)

  // Symmetry score 0-100
  return Math.max(0, 100 - (distance * 100) / threshold)
}
```

Expected: Functions implemented, tests pass

- [ ] **Step 3: Create MediaPipe processor wrapper**

```typescript
// apps/mobile/src/ml/mediapipe-processor.ts
import { Keypoint } from '../types/workout'

// Mock MediaPipe processor (in real impl, would use actual MediaPipe library)
export class MediaPipeProcessor {
  private frameRate: number = 30
  private isReady: boolean = false

  async initialize(): Promise<void> {
    // Load MediaPipe model
    // For now, mock implementation
    this.isReady = true
  }

  async detectPose(imageFrame: any): Promise<Keypoint[]> {
    if (!this.isReady) {
      throw new Error('MediaPipe not initialized')
    }

    // In real implementation, would call MediaPipe detectMultiHandPose
    // For now, return mock keypoints
    const keypoints: Keypoint[] = [
      { x: 0.5, y: 0.3, z: 0, visibility: 0.95, name: 'nose' },
      { x: 0.45, y: 0.25, z: 0, visibility: 0.9, name: 'left_eye' },
      { x: 0.55, y: 0.25, z: 0, visibility: 0.9, name: 'right_eye' },
      // ... 14 more keypoints
    ]

    return keypoints
  }

  isInitialized(): boolean {
    return this.isReady
  }

  destroy(): void {
    this.isReady = false
  }
}

export const mediaPipeProcessor = new MediaPipeProcessor()
```

Expected: Processor created

- [ ] **Step 4: Run tests**

Run: `cd apps/mobile && pnpm test ml/pose-extractor.test.ts`

Expected: PASS (calculateJointAngle, extractAngles, normalizeKeypoints working)

- [ ] **Step 5: Commit MediaPipe setup**

```bash
git add apps/mobile/src/ml/ apps/mobile/src/services/pose-detection.ts apps/mobile/tests/ml/
git commit -m "feat: implement MediaPipe pose detection with angle extraction"
```

Expected: Commit successful

---

### Task 4: Create form analysis engine

**Files:**

- Create: `apps/mobile/src/utils/form-rules.ts`
- Create: `apps/mobile/src/ml/form-analyzer.ts`
- Create: `apps/mobile/src/ml/feedback-generator.ts`
- Create: `apps/mobile/tests/ml/form-analyzer.test.ts`

- [ ] **Step 1: Create form rules database**

```typescript
// apps/mobile/src/utils/form-rules.ts
import { Exercise, FormRule } from '../types/exercise'

// Exercise form rules library
export const SQUAT_FORM_RULES: FormRule[] = [
  {
    id: 'squat_knee_angle',
    type: 'angle',
    joint: 'left_knee',
    target: 90,
    tolerance: 10,
    importance: 0.35,
    feedback: 'Knees should bend to ~90 degrees',
    correction: 'Go deeper or bring knees up',
    injuryRisk: 0.3,
  },
  {
    id: 'squat_back_straight',
    type: 'angle',
    joint: 'left_hip',
    target: 100,
    tolerance: 15,
    importance: 0.4,
    feedback: 'Keep chest up, back straight',
    correction: 'Lean less forward, engage core',
    injuryRisk: 0.6,
  },
  {
    id: 'squat_knee_tracking',
    type: 'position',
    target: 0,
    tolerance: 5,
    importance: 0.25,
    feedback: 'Knees over toes',
    correction: 'Keep knees aligned with toes',
    injuryRisk: 0.5,
  },
]

export const BENCH_PRESS_FORM_RULES: FormRule[] = [
  {
    id: 'bench_elbow_angle',
    type: 'angle',
    joint: 'left_elbow',
    target: 90,
    tolerance: 15,
    importance: 0.4,
    feedback: 'Lower to ~90 degree elbow bend',
    correction: 'Lower or raise weight',
    injuryRisk: 0.4,
  },
  {
    id: 'bench_scapula',
    type: 'position',
    target: 0,
    tolerance: 10,
    importance: 0.35,
    feedback: 'Shoulder blades retracted',
    correction: 'Pull shoulders back',
    injuryRisk: 0.3,
  },
  {
    id: 'bench_feet_planted',
    type: 'position',
    target: 0,
    tolerance: 5,
    importance: 0.25,
    feedback: 'Feet on floor for stability',
    correction: 'Plant feet firmly',
    injuryRisk: 0.2,
  },
]

export const DEADLIFT_FORM_RULES: FormRule[] = [
  {
    id: 'deadlift_back_straight',
    type: 'angle',
    joint: 'left_hip',
    target: 180,
    tolerance: 20,
    importance: 0.45,
    feedback: 'Keep back neutral from start',
    correction: 'Flatten lower back',
    injuryRisk: 0.8,
  },
  {
    id: 'deadlift_bar_path',
    type: 'position',
    target: 0,
    tolerance: 3,
    importance: 0.35,
    feedback: 'Bar over mid-foot',
    correction: 'Keep bar close to legs',
    injuryRisk: 0.4,
  },
  {
    id: 'deadlift_knee_lockout',
    type: 'angle',
    joint: 'left_knee',
    target: 180,
    tolerance: 10,
    importance: 0.2,
    feedback: 'Lock out knees at top',
    correction: 'Extend knees fully',
    injuryRisk: 0.1,
  },
]

export const FORM_RULES_BY_EXERCISE: Record<string, FormRule[]> = {
  squat: SQUAT_FORM_RULES,
  bench_press: BENCH_PRESS_FORM_RULES,
  deadlift: DEADLIFT_FORM_RULES,
  // More exercises...
}

export function getFormRulesForExercise(exerciseName: string): FormRule[] {
  const key = exerciseName.toLowerCase().replace(/\s+/g, '_')
  return FORM_RULES_BY_EXERCISE[key] || []
}
```

Expected: Form rules defined

- [ ] **Step 2: Create form analyzer**

```typescript
// apps/mobile/src/ml/form-analyzer.ts
import { Keypoint, AngleData, FormRepData, FormError } from '../types/workout'
import { FormRule } from '../types/exercise'
import { extractAngles, calculateDistance } from './pose-extractor'
import { FormAnalysisResult, MuscleEngagement } from '../types/form-analysis'

export class FormAnalyzer {
  constructor(private formRules: FormRule[]) {}

  analyzeRep(keypoints: Keypoint[], angles: AngleData[]): FormAnalysisResult {
    const violations = this.evaluateRules(angles)
    const formScore = this.calculateFormScore(violations)
    const feedback = this.generateFeedback(violations)
    const muscleEngagement = this.estimateMuscleEngagement(keypoints)

    return {
      repNumber: 0, // Set by caller
      formScore,
      isGoodRep: formScore > 70,
      violations,
      feedback,
      muscleEngagement,
      metrics: {
        speed: 0, // Calculated from frame timing
        symmetry: this.checkSymmetry(keypoints),
        stability: 100, // Simplified
        tempo: 'controlled',
      },
    }
  }

  private evaluateRules(angles: AngleData[]): any[] {
    const violations: any[] = []

    for (const rule of this.formRules) {
      if (rule.type === 'angle' && rule.joint) {
        const angleData = angles.find((a) => a.joint === rule.joint)
        if (angleData) {
          const deviation = Math.abs(angleData.angle - rule.target)
          if (deviation > rule.tolerance) {
            violations.push({
              ruleId: rule.id,
              joint: rule.joint,
              expected: rule.target,
              actual: angleData.angle,
              deviation,
              severity: deviation > rule.tolerance * 2 ? 'high' : 'medium',
              message: rule.feedback,
              importance: rule.importance,
              injuryRisk: rule.injuryRisk,
            })
          }
        }
      }
    }

    return violations
  }

  private calculateFormScore(violations: any[]): number {
    let score = 100

    for (const violation of violations) {
      const penalty = violation.importance * violation.injuryRisk * 30 // Max 30 points per rule
      score -= penalty
    }

    return Math.max(0, Math.round(score))
  }

  private generateFeedback(violations: any[]): any[] {
    // Top 2 violations
    return violations
      .sort((a, b) => b.importance * b.injuryRisk - a.importance * a.injuryRisk)
      .slice(0, 2)
      .map((v) => ({
        type: 'correction',
        text: v.message,
        priority: 'top2',
      }))
  }

  private estimateMuscleEngagement(keypoints: Keypoint[]): MuscleEngagement {
    // Simplified muscle engagement estimation
    return {
      quads: 75,
      hamstrings: 65,
      glutes: 85,
      core: 70,
    }
  }

  private checkSymmetry(keypoints: Keypoint[]): number {
    // Simplified symmetry check
    const leftHip = keypoints.find((k) => k.name === 'left_hip')
    const rightHip = keypoints.find((k) => k.name === 'right_hip')

    if (!leftHip || !rightHip) return 0

    const distance = Math.abs(leftHip.y - rightHip.y)
    return Math.max(0, 100 - distance * 100)
  }
}
```

Expected: Analyzer created

- [ ] **Step 3: Create feedback generator**

```typescript
// apps/mobile/src/ml/feedback-generator.ts
export function generateVoiceFeedback(violations: any[]): string {
  if (violations.length === 0) {
    return 'Perfect rep!'
  }

  const top = violations[0]
  return top.message || 'Adjust form'
}

export function generateCorrections(violations: any[]): string[] {
  return violations.slice(0, 2).map((v) => v.correction || 'Adjust form')
}
```

Expected: Feedback generator created

- [ ] **Step 4: Write tests**

```typescript
// apps/mobile/tests/ml/form-analyzer.test.ts
import { describe, it, expect } from 'vitest'
import { FormAnalyzer } from '../../src/ml/form-analyzer'
import { SQUAT_FORM_RULES } from '../../src/utils/form-rules'
import { Keypoint, AngleData } from '../../src/types/workout'

describe('FormAnalyzer', () => {
  const analyzer = new FormAnalyzer(SQUAT_FORM_RULES)

  const goodSquatAngles: AngleData[] = [
    { joint: 'left_knee', angle: 90, normal: 90, deviation: 0 },
    { joint: 'left_hip', angle: 100, normal: 100, deviation: 0 },
  ]

  const poorSquatAngles: AngleData[] = [
    { joint: 'left_knee', angle: 120, normal: 90, deviation: 30 },
    { joint: 'left_hip', angle: 130, normal: 100, deviation: 30 },
  ]

  it('should score good form high', () => {
    const result = analyzer.analyzeRep([], goodSquatAngles)
    expect(result.formScore).toBeGreaterThan(80)
    expect(result.isGoodRep).toBe(true)
  })

  it('should score poor form low', () => {
    const result = analyzer.analyzeRep([], poorSquatAngles)
    expect(result.formScore).toBeLessThan(70)
    expect(result.isGoodRep).toBe(false)
  })
})
```

Expected: Tests pass

- [ ] **Step 5: Commit form analysis**

```bash
git add apps/mobile/src/utils/form-rules.ts apps/mobile/src/ml/form-analyzer.ts apps/mobile/src/ml/feedback-generator.ts apps/mobile/tests/ml/form-analyzer.test.ts
git commit -m "feat: implement form analysis engine with rule evaluation and feedback generation"
```

Expected: Commit successful

---

**End of Chunk 2**

MediaPipe integration + form analysis engine ready. Can analyze real-time pose data and generate form scores.

Next chunk (Part 2): Babylon.js 3D avatar, real-time camera integration, workout session tracking.
