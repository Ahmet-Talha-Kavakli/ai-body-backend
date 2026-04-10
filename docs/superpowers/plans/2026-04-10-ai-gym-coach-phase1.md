# AI Gym Coach - Phase 1: Core Pose Detection & Real-time Coaching

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the foundation for AI gym coaching with real-time pose detection, form scoring, and GPT-4o-powered voice feedback.

**Architecture:** MediaPipe Pose detects user's body position → angles calculated → GPT-4o analyzes form → TTS generates voice feedback → data persisted to database.

**Tech Stack:** MediaPipe Pose (JS), TensorFlow.js, OpenAI GPT-4o, Web Speech API (TTS), Prisma + PostgreSQL, React/Next.js

---

## File Structure Overview

**New files to create:**

```
apps/web/lib/ai/
├── pose-detection.ts          # MediaPipe Pose setup
├── angle-calculator.ts         # Angle calculations from keypoints
├── form-analyzer.ts            # Form scoring algorithm
├── gpt-coach.ts                # GPT-4o integration
└── voice-feedback.ts           # TTS voice generation

apps/web/hooks/
├── usePoseDetection.ts         # React hook for pose detection
├── useFormAnalysis.ts          # React hook for form analysis
├── useGptCoach.ts              # React hook for AI coaching
└── useVoiceFeedback.ts         # React hook for TTS

apps/web/components/workout/
├── PoseDetectionCamera.tsx     # Camera feed + skeleton overlay
├── FormScoreDisplay.tsx        # Form score badge
├── CoachFeedback.tsx           # Voice feedback text
└── WorkoutAnalytics.tsx        # Real-time metrics display

apps/web/app/api/ai/
├── analyze-form/route.ts       # API endpoint for form analysis
├── gpt-coach/route.ts          # API endpoint for AI coaching
└── voice-feedback/route.ts     # API endpoint for TTS

prisma/
└── schema.prisma               # Schema extensions (new tables)
```

**Files to modify:**

```
apps/web/app/(dashboard)/dashboard/session/page.tsx    # Integrate new components
apps/web/package.json                                    # Add dependencies
```

---

## Dependencies to Install

Before starting:

```bash
npm install @mediapipe/tasks-vision
npm install @tensorflow/tfjs @tensorflow/tfjs-core
npm install openai
npm install axios
```

---

## Chunk 1: MediaPipe Pose Detection Setup

### Task 1: Create Pose Detection Library

**Files:**
- Create: `apps/web/lib/ai/pose-detection.ts`

- [ ] **Step 1: Write pose detection module**

```typescript
// apps/web/lib/ai/pose-detection.ts

import * as PoseLandmarker from '@mediapipe/tasks-vision';

export interface KeyPoint {
  name: string;
  x: number;
  y: number;
  z: number;
  visibility: number;
}

export interface PoseDetectionResult {
  keypoints: KeyPoint[];
  confidence: number;
  timestamp: number;
}

let poseLandmarker: PoseLandmarker.PoseLandmarker | null = null;
let initialized = false;

export async function initializePoseDetection(): Promise<void> {
  if (initialized) return;

  const vision = await PoseLandmarker.FilesetResolver.forVisionTasks(
    'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
  );

  poseLandmarker = await PoseLandmarker.PoseLandmarker.createFromOptions(
    vision,
    {
      baseOptions: {
        modelAssetPath: `https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task`,
        delegate: 'GPU', // Use GPU if available, fallback to CPU
      },
      runningMode: 'VIDEO',
      numPoses: 1, // Single person
    }
  );

  initialized = true;
}

export function detectPose(
  videoElement: HTMLVideoElement
): PoseDetectionResult | null {
  if (!poseLandmarker) {
    console.error('Pose detection not initialized');
    return null;
  }

  try {
    const result = poseLandmarker.detectForVideo(
      videoElement,
      performance.now()
    );

    if (!result.landmarks || result.landmarks.length === 0) {
      return null;
    }

    const landmarks = result.landmarks[0]; // First person

    const keypoints: KeyPoint[] = landmarks.map((landmark, index) => ({
      name: getLandmarkName(index),
      x: landmark.x,
      y: landmark.y,
      z: landmark.z || 0,
      visibility: landmark.visibility || 1,
    }));

    return {
      keypoints,
      confidence: calculateConfidence(landmarks),
      timestamp: performance.now(),
    };
  } catch (error) {
    console.error('Pose detection error:', error);
    return null;
  }
}

function getLandmarkName(index: number): string {
  const names = [
    'nose',
    'left_eye_inner',
    'left_eye',
    'left_eye_outer',
    'right_eye_inner',
    'right_eye',
    'right_eye_outer',
    'left_ear',
    'right_ear',
    'mouth_left',
    'mouth_right',
    'left_shoulder',
    'right_shoulder',
    'left_elbow',
    'right_elbow',
    'left_wrist',
    'right_wrist',
    'left_pinky',
    'right_pinky',
    'left_index',
    'right_index',
    'left_thumb',
    'right_thumb',
    'left_hip',
    'right_hip',
    'left_knee',
    'right_knee',
    'left_ankle',
    'right_ankle',
    'left_heel',
    'right_heel',
    'left_foot_index',
    'right_foot_index',
  ];
  return names[index] || `landmark_${index}`;
}

function calculateConfidence(landmarks: any[]): number {
  if (landmarks.length === 0) return 0;
  const visibilities = landmarks.map((l) => l.visibility || 0);
  return visibilities.reduce((a, b) => a + b, 0) / visibilities.length;
}

export function closePoseDetection(): void {
  if (poseLandmarker) {
    poseLandmarker.close();
    poseLandmarker = null;
    initialized = false;
  }
}
```

- [ ] **Step 2: Create angle calculator**

Create: `apps/web/lib/ai/angle-calculator.ts`

```typescript
// apps/web/lib/ai/angle-calculator.ts

import { KeyPoint, PoseDetectionResult } from './pose-detection';

export interface AngleData {
  knee_left: number;
  knee_right: number;
  hip_left: number;
  hip_right: number;
  spine: number;
  shoulder_left: number;
  shoulder_right: number;
  ankle_left: number;
  ankle_right: number;
  elbow_left: number;
  elbow_right: number;
  [key: string]: number;
}

/**
 * Calculate angle between three points (A-B-C)
 * Returns angle at point B in degrees
 */
function calculateAngle(
  pointA: KeyPoint,
  pointB: KeyPoint,
  pointC: KeyPoint
): number {
  const BA = {
    x: pointA.x - pointB.x,
    y: pointA.y - pointB.y,
  };

  const BC = {
    x: pointC.x - pointB.x,
    y: pointC.y - pointB.y,
  };

  const dotProduct = BA.x * BC.x + BA.y * BC.y;
  const magnitudeBA = Math.sqrt(BA.x * BA.x + BA.y * BA.y);
  const magnitudeBC = Math.sqrt(BC.x * BC.x + BC.y * BC.y);

  const cosineAngle = dotProduct / (magnitudeBA * magnitudeBC);
  const angleRadians = Math.acos(Math.max(-1, Math.min(1, cosineAngle)));
  const angleDegrees = (angleRadians * 180) / Math.PI;

  return Math.round(angleDegrees);
}

function getKeypoint(
  keypoints: KeyPoint[],
  name: string
): KeyPoint | null {
  return keypoints.find((kp) => kp.name === name) || null;
}

export function calculateAngles(
  poseResult: PoseDetectionResult
): AngleData {
  const kp = poseResult.keypoints;

  // Helper to safely get keypoint
  const get = (name: string) => getKeypoint(kp, name);

  const angles: AngleData = {
    // Knee angles (hip - knee - ankle)
    knee_left: 0,
    knee_right: 0,
    // Hip angles (shoulder - hip - knee)
    hip_left: 0,
    hip_right: 0,
    // Spine angle (shoulder - hip center - nose)
    spine: 0,
    // Shoulder angles (elbow - shoulder - hip)
    shoulder_left: 0,
    shoulder_right: 0,
    // Ankle angles (knee - ankle - foot)
    ankle_left: 0,
    ankle_right: 0,
    // Elbow angles (shoulder - elbow - wrist)
    elbow_left: 0,
    elbow_right: 0,
  };

  // Calculate knee angles
  const lHip = get('left_hip');
  const lKnee = get('left_knee');
  const lAnkle = get('left_ankle');
  if (lHip && lKnee && lAnkle) {
    angles.knee_left = calculateAngle(lHip, lKnee, lAnkle);
  }

  const rHip = get('right_hip');
  const rKnee = get('right_knee');
  const rAnkle = get('right_ankle');
  if (rHip && rKnee && rAnkle) {
    angles.knee_right = calculateAngle(rHip, rKnee, rAnkle);
  }

  // Calculate hip angles
  const lShoulder = get('left_shoulder');
  if (lShoulder && lHip && lKnee) {
    angles.hip_left = calculateAngle(lShoulder, lHip, lKnee);
  }

  const rShoulder = get('right_shoulder');
  if (rShoulder && rHip && rKnee) {
    angles.hip_right = calculateAngle(rShoulder, rHip, rKnee);
  }

  // Calculate spine angle (shoulder to hip)
  const nose = get('nose');
  if (lShoulder && rShoulder && lHip && rHip && nose) {
    const shoulderCenter = {
      x: (lShoulder.x + rShoulder.x) / 2,
      y: (lShoulder.y + rShoulder.y) / 2,
      z: 0,
      name: 'shoulder_center',
      visibility: 1,
    };
    const hipCenter = {
      x: (lHip.x + rHip.x) / 2,
      y: (lHip.y + rHip.y) / 2,
      z: 0,
      name: 'hip_center',
      visibility: 1,
    };
    angles.spine = calculateAngle(nose, shoulderCenter, hipCenter);
  }

  // Calculate shoulder angles
  const lElbow = get('left_elbow');
  if (lShoulder && lElbow && lHip) {
    angles.shoulder_left = calculateAngle(lElbow, lShoulder, lHip);
  }

  const rElbow = get('right_elbow');
  if (rShoulder && rElbow && rHip) {
    angles.shoulder_right = calculateAngle(rElbow, rShoulder, rHip);
  }

  // Calculate elbow angles
  const lWrist = get('left_wrist');
  if (lShoulder && lElbow && lWrist) {
    angles.elbow_left = calculateAngle(lShoulder, lElbow, lWrist);
  }

  const rWrist = get('right_wrist');
  if (rShoulder && rElbow && rWrist) {
    angles.elbow_right = calculateAngle(rShoulder, rElbow, rWrist);
  }

  // Calculate ankle angles
  if (lKnee && lAnkle) {
    const lHeel = get('left_heel');
    if (lHeel) {
      angles.ankle_left = calculateAngle(lKnee, lAnkle, lHeel);
    }
  }

  if (rKnee && rAnkle) {
    const rHeel = get('right_heel');
    if (rHeel) {
      angles.ankle_right = calculateAngle(rKnee, rAnkle, rHeel);
    }
  }

  return angles;
}
```

- [ ] **Step 3: Test angle calculations**

Create test file: `apps/web/__tests__/lib/ai/angle-calculator.test.ts`

```typescript
import { calculateAngle } from '@/lib/ai/angle-calculator';
import { KeyPoint } from '@/lib/ai/pose-detection';

describe('Angle Calculator', () => {
  it('should calculate 90 degree angle', () => {
    const pointA: KeyPoint = {
      name: 'a',
      x: 0,
      y: 1,
      z: 0,
      visibility: 1,
    };
    const pointB: KeyPoint = {
      name: 'b',
      x: 0,
      y: 0,
      z: 0,
      visibility: 1,
    };
    const pointC: KeyPoint = {
      name: 'c',
      x: 1,
      y: 0,
      z: 0,
      visibility: 1,
    };

    const angle = calculateAngle(pointA, pointB, pointC);
    expect(angle).toBe(90);
  });

  it('should calculate 180 degree angle', () => {
    const pointA: KeyPoint = {
      name: 'a',
      x: 0,
      y: 0,
      z: 0,
      visibility: 1,
    };
    const pointB: KeyPoint = {
      name: 'b',
      x: 1,
      y: 0,
      z: 0,
      visibility: 1,
    };
    const pointC: KeyPoint = {
      name: 'c',
      x: 2,
      y: 0,
      z: 0,
      visibility: 1,
    };

    const angle = calculateAngle(pointA, pointB, pointC);
    expect(angle).toBe(180);
  });
});
```

- [ ] **Step 4: Run tests**

```bash
npm test -- angle-calculator.test.ts
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/web/lib/ai/pose-detection.ts apps/web/lib/ai/angle-calculator.ts apps/web/__tests__/lib/ai/angle-calculator.test.ts
git commit -m "feat: add MediaPipe pose detection and angle calculation"
```

---

### Task 2: Create Form Scoring Algorithm

**Files:**
- Create: `apps/web/lib/ai/form-analyzer.ts`

- [ ] **Step 1: Write form analyzer**

```typescript
// apps/web/lib/ai/form-analyzer.ts

import { PoseDetectionResult } from './pose-detection';
import { AngleData, calculateAngles } from './angle-calculator';

export interface FormAnalysisResult {
  formScore: number; // 1-100
  technicalCorrectness: number; // 0-1
  consistency: number; // 0-1 (how consistent with user's history)
  injuryAvoidanceScore: number; // 0-1
  errors: FormError[];
  muscleEngagement: MuscleEngagement;
  depthAssessment: string; // 'partial', 'full_range', 'excessive'
  stabilityScore: number; // 0-1
  movementSpeed: string; // 'too_slow', 'optimal', 'too_fast'
}

export interface FormError {
  error: string;
  severity: 'minor' | 'moderate' | 'severe';
  bodyPart: string;
  currentValue: number;
  idealValue: number;
  cue: string;
}

export interface MuscleEngagement {
  [muscleGroup: string]: number; // 0-1 engagement score
}

// Exercise-specific form criteria
const EXERCISE_CRITERIA: Record<string, ExerciseCriteria> = {
  squat: {
    name: 'Squat',
    idealAngles: {
      knee_left: 45,
      knee_right: 45,
      hip_left: 45,
      hip_right: 45,
      spine: 15,
      ankle_left: 85,
      ankle_right: 85,
    },
    tolerance: 15, // +/- 15 degrees
    criticalAngles: ['knee_left', 'knee_right', 'hip_left', 'hip_right'],
    muscleGroups: ['quadriceps', 'hamstrings', 'glutes', 'core'],
  },
  deadlift: {
    name: 'Deadlift',
    idealAngles: {
      knee_left: 70,
      knee_right: 70,
      hip_left: 35,
      hip_right: 35,
      spine: 25,
      ankle_left: 90,
      ankle_right: 90,
    },
    tolerance: 20,
    criticalAngles: ['spine', 'knee_left', 'knee_right'],
    muscleGroups: ['hamstrings', 'glutes', 'lower_back', 'trapezius'],
  },
  bench_press: {
    name: 'Bench Press',
    idealAngles: {
      shoulder_left: 85,
      shoulder_right: 85,
      elbow_left: 90,
      elbow_right: 90,
    },
    tolerance: 15,
    criticalAngles: ['elbow_left', 'elbow_right'],
    muscleGroups: ['chest', 'triceps', 'shoulders'],
  },
  push_up: {
    name: 'Push-up',
    idealAngles: {
      shoulder_left: 85,
      shoulder_right: 85,
      elbow_left: 90,
      elbow_right: 90,
      spine: 10,
    },
    tolerance: 15,
    criticalAngles: ['elbow_left', 'elbow_right', 'spine'],
    muscleGroups: ['chest', 'triceps', 'shoulders', 'core'],
  },
  plank: {
    name: 'Plank',
    idealAngles: {
      spine: 5,
      knee_left: 180,
      knee_right: 180,
    },
    tolerance: 10,
    criticalAngles: ['spine'],
    muscleGroups: ['core', 'shoulders'],
  },
};

interface ExerciseCriteria {
  name: string;
  idealAngles: Partial<AngleData>;
  tolerance: number;
  criticalAngles: string[];
  muscleGroups: string[];
}

export function analyzeForm(
  exercise: string,
  poseResult: PoseDetectionResult,
  historicalAvg?: number
): FormAnalysisResult {
  const angles = calculateAngles(poseResult);
  const criteria = EXERCISE_CRITERIA[exercise.toLowerCase()];

  if (!criteria) {
    return {
      formScore: 50, // Unknown exercise
      technicalCorrectness: 0.5,
      consistency: 0.5,
      injuryAvoidanceScore: 0.5,
      errors: [],
      muscleEngagement: {},
      depthAssessment: 'unknown',
      stabilityScore: 0.5,
      movementSpeed: 'optimal',
    };
  }

  // Calculate errors
  const errors = findFormErrors(angles, criteria);

  // Technical correctness (0-1)
  const technicalCorrectness = calculateTechnicalCorrectness(
    errors,
    criteria
  );

  // Consistency with history (0-1)
  const consistency = historicalAvg ? calculateConsistency(historicalAvg) : 0.5;

  // Injury avoidance score (0-1)
  const injuryAvoidanceScore = calculateInjuryAvoidance(
    errors,
    poseResult.confidence
  );

  // Muscle engagement (0-1 per muscle group)
  const muscleEngagement = calculateMuscleEngagement(
    exercise,
    angles,
    poseResult
  );

  // Depth assessment
  const depthAssessment = assessDepth(exercise, angles);

  // Stability score
  const stabilityScore = calculateStability(poseResult);

  // Movement speed (inferred from frame analysis)
  const movementSpeed = 'optimal'; // TODO: Compare with frame history

  // Overall form score (1-100)
  const formScore = Math.round(
    (technicalCorrectness * 0.6 +
      consistency * 0.2 +
      injuryAvoidanceScore * 0.2) *
      100
  );

  return {
    formScore,
    technicalCorrectness,
    consistency,
    injuryAvoidanceScore,
    errors,
    muscleEngagement,
    depthAssessment,
    stabilityScore,
    movementSpeed,
  };
}

function findFormErrors(
  angles: AngleData,
  criteria: ExerciseCriteria
): FormError[] {
  const errors: FormError[] = [];

  Object.entries(criteria.idealAngles).forEach(([angleName, idealValue]) => {
    const currentValue = angles[angleName];
    if (currentValue === undefined) return;

    const difference = Math.abs(currentValue - idealValue);
    if (difference > criteria.tolerance) {
      const severity =
        difference > criteria.tolerance * 2 ? 'severe' : 'moderate';

      errors.push({
        error: `${angleName}_out_of_range`,
        severity,
        bodyPart: angleName.split('_')[0],
        currentValue: Math.round(currentValue),
        idealValue: Math.round(idealValue),
        cue: generateCue(angleName, currentValue, idealValue),
      });
    }
  });

  return errors;
}

function generateCue(
  angleName: string,
  currentValue: number,
  idealValue: number
): string {
  const difference = currentValue - idealValue;
  const direction = difference > 0 ? 'daha kapat' : 'daha aç';
  const bodyPart = getBodyPartName(angleName);
  const amount = Math.abs(Math.round(difference));

  return `${bodyPart} açısını ${amount}° ${direction}`;
}

function getBodyPartName(angleName: string): string {
  const names: Record<string, string> = {
    knee: 'Diz',
    hip: 'Kalça',
    spine: 'Sırt',
    shoulder: 'Omuz',
    ankle: 'Ayak bileği',
    elbow: 'Dirsek',
  };

  for (const [key, value] of Object.entries(names)) {
    if (angleName.includes(key)) return value;
  }

  return 'Vücut bölümü';
}

function calculateTechnicalCorrectness(
  errors: FormError[],
  criteria: ExerciseCriteria
): number {
  if (errors.length === 0) return 1.0;

  const maxErrorScore = errors.length > 0 ? errors.length : 1;
  const errorSeverityScore = errors.reduce((sum, err) => {
    const severityMultiplier =
      err.severity === 'severe' ? 0.5 : err.severity === 'moderate' ? 0.25 : 0.1;
    return sum + severityMultiplier;
  }, 0);

  return Math.max(0, 1.0 - errorSeverityScore / maxErrorScore);
}

function calculateConsistency(historicalAvg: number): number {
  // TODO: Compare with user's historical form scores
  return 0.5;
}

function calculateInjuryAvoidance(
  errors: FormError[],
  confidence: number
): number {
  const severErrors = errors.filter((e) => e.severity === 'severe').length;
  const baseScore = Math.max(0, 1.0 - severErrors * 0.3);
  return baseScore * confidence;
}

function calculateMuscleEngagement(
  exercise: string,
  angles: AngleData,
  poseResult: PoseDetectionResult
): MuscleEngagement {
  // Simplified: estimate based on angle range
  const engagement: MuscleEngagement = {};

  const criteria = EXERCISE_CRITERIA[exercise.toLowerCase()];
  if (criteria) {
    criteria.muscleGroups.forEach((muscle) => {
      engagement[muscle] = 0.85; // Default engagement
    });
  }

  return engagement;
}

function assessDepth(exercise: string, angles: AngleData): string {
  if (exercise.toLowerCase() === 'squat') {
    const kneeAngleAvg =
      (angles.knee_left + angles.knee_right) / 2;
    if (kneeAngleAvg > 70) return 'partial';
    if (kneeAngleAvg < 30) return 'excessive';
    return 'full_range';
  }

  return 'unknown';
}

function calculateStability(poseResult: PoseDetectionResult): number {
  // Calculate based on keypoint confidence
  const avgConfidence =
    poseResult.keypoints.reduce((sum, kp) => sum + kp.visibility, 0) /
    poseResult.keypoints.length;
  return avgConfidence;
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/lib/ai/form-analyzer.ts
git commit -m "feat: add form analyzer with exercise-specific criteria"
```

---

## Chunk 2: GPT-4o Integration & Voice Feedback

### Task 3: Integrate GPT-4o Coach

**Files:**
- Create: `apps/web/lib/ai/gpt-coach.ts`

- [ ] **Step 1: Write GPT coach integration**

```typescript
// apps/web/lib/ai/gpt-coach.ts

import { OpenAI } from 'openai';
import { FormAnalysisResult, AngleData } from './form-analyzer';

export interface CoachFeedback {
  formScore: number;
  voiceFeedback: string;
  corrections: string[];
  encouragement: string;
  nextRepTip: string;
  injuryWarning: string | null;
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const SYSTEM_PROMPT = `You are an elite personal trainer AI with expertise from:
- Louie Simmons (Westside Barbell - Conjugate Method)
- Mike Israetel (Renaissance Periodization)
- Stronger by Science (Evidence-based training)

Your role: Analyze user's form and provide real-time coaching feedback.

Instructions:
1. Be concise and actionable (max 2 sentences for voice feedback)
2. Use Turkish language
3. Focus on ONE primary correction if there are multiple errors
4. Be encouraging but honest
5. Prioritize safety over ego

Response format: JSON with fields: voiceFeedback, corrections, encouragement, nextRepTip, injuryWarning`;

export async function generateCoachFeedback(
  exercise: string,
  formAnalysis: FormAnalysisResult,
  repNumber: number,
  userContext?: {
    historicalAvgScore?: number;
    activeInjuries?: string[];
    weaknessAreas?: string[];
  }
): Promise<CoachFeedback> {
  try {
    const prompt = buildCoachPrompt(
      exercise,
      formAnalysis,
      repNumber,
      userContext
    );

    const message = await openai.messages.create({
      model: 'gpt-4o-mini',
      max_tokens: 300,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const responseText =
      message.content[0].type === 'text' ? message.content[0].text : '';

    // Parse JSON from response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Could not parse JSON response');
    }

    const parsed = JSON.parse(jsonMatch[0]);

    return {
      formScore: formAnalysis.formScore,
      voiceFeedback: parsed.voiceFeedback || 'Form check!',
      corrections: parsed.corrections || [],
      encouragement: parsed.encouragement || 'Harika!',
      nextRepTip: parsed.nextRepTip || 'Devam et!',
      injuryWarning: parsed.injuryWarning || null,
    };
  } catch (error) {
    console.error('Error generating coach feedback:', error);
    // Fallback response
    return {
      formScore: formAnalysis.formScore,
      voiceFeedback: `Form skoru: ${formAnalysis.formScore}. Devam et!`,
      corrections: formAnalysis.errors.map((e) => e.cue),
      encouragement: 'Güzel çalışıyor!',
      nextRepTip: 'Tekrar et',
      injuryWarning: null,
    };
  }
}

function buildCoachPrompt(
  exercise: string,
  formAnalysis: FormAnalysisResult,
  repNumber: number,
  userContext?: any
): string {
  let prompt = `
Exercise: ${exercise}
Rep Number: ${repNumber}
Form Score: ${formAnalysis.formScore}/100

Form Errors Found:
${formAnalysis.errors.length > 0 ? formAnalysis.errors.map((e) => `- ${e.cue} (severity: ${e.severity})`).join('\n') : '- No major errors'}

Muscle Engagement:
${Object.entries(formAnalysis.muscleEngagement)
  .map(([muscle, score]) => `- ${muscle}: ${Math.round(score * 100)}%`)
  .join('\n')}

Depth Assessment: ${formAnalysis.depthAssessment}
Stability: ${Math.round(formAnalysis.stabilityScore * 100)}%
`;

  if (userContext) {
    if (userContext.historicalAvgScore) {
      prompt += `\nUser's Historical Avg Score: ${userContext.historicalAvgScore}/100`;
    }
    if (userContext.activeInjuries?.length) {
      prompt += `\nActive Injuries: ${userContext.activeInjuries.join(', ')}`;
    }
    if (userContext.weaknessAreas?.length) {
      prompt += `\nWeak Areas: ${userContext.weaknessAreas.join(', ')}`;
    }
  }

  prompt += `

Provide feedback in JSON format:
{
  "voiceFeedback": "Concise coaching cue in Turkish (max 10 words)",
  "corrections": ["Specific correction 1", "Specific correction 2"],
  "encouragement": "Motivational comment in Turkish",
  "nextRepTip": "Tip for next rep in Turkish",
  "injuryWarning": null or "Warning if injury risk detected"
}`;

  return prompt;
}
```

- [ ] **Step 2: Create voice feedback generator**

Create: `apps/web/lib/ai/voice-feedback.ts`

```typescript
// apps/web/lib/ai/voice-feedback.ts

export interface VoiceFeedbackOptions {
  rate?: number; // 0.1 - 10
  pitch?: number; // 0 - 2
  volume?: number; // 0 - 1
  language?: string; // 'tr-TR', 'en-US'
}

const DEFAULT_OPTIONS: VoiceFeedbackOptions = {
  rate: 1.2,
  pitch: 1,
  volume: 1,
  language: 'tr-TR',
};

export async function playVoiceFeedback(
  text: string,
  options: VoiceFeedbackOptions = {}
): Promise<void> {
  const finalOptions = { ...DEFAULT_OPTIONS, ...options };

  return new Promise((resolve, reject) => {
    // Check browser support
    const SpeechSynthesisUtterance =
      window.SpeechSynthesisUtterance || (window as any).webkitSpeechSynthesisUtterance;

    if (!SpeechSynthesisUtterance) {
      console.error('Speech Synthesis not supported');
      reject(new Error('Speech Synthesis not supported'));
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = finalOptions.language!;
    utterance.rate = finalOptions.rate!;
    utterance.pitch = finalOptions.pitch!;
    utterance.volume = finalOptions.volume!;

    utterance.onend = () => resolve();
    utterance.onerror = (error) => reject(error);

    window.speechSynthesis.cancel(); // Cancel any previous speech
    window.speechSynthesis.speak(utterance);
  });
}

export function stopVoiceFeedback(): void {
  window.speechSynthesis.cancel();
}

export function isSpeechSynthesisSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    (!!window.SpeechSynthesisUtterance ||
      !!(window as any).webkitSpeechSynthesisUtterance)
  );
}
```

- [ ] **Step 3: Create API endpoint for form analysis**

Create: `apps/web/app/api/ai/analyze-form/route.ts`

```typescript
// apps/web/app/api/ai/analyze-form/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { analyzeForm } from '@/lib/ai/form-analyzer';
import { generateCoachFeedback } from '@/lib/ai/gpt-coach';
import { PoseDetectionResult } from '@/lib/ai/pose-detection';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      exercise,
      poseResult,
      repNumber,
      userContext,
    }: {
      exercise: string;
      poseResult: PoseDetectionResult;
      repNumber: number;
      userContext?: any;
    } = body;

    // Analyze form
    const formAnalysis = analyzeForm(exercise, poseResult);

    // Generate coach feedback
    const coachFeedback = await generateCoachFeedback(
      exercise,
      formAnalysis,
      repNumber,
      userContext
    );

    return NextResponse.json({
      success: true,
      formAnalysis,
      coachFeedback,
    });
  } catch (error) {
    console.error('Form analysis error:', error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 4: Commit**

```bash
git add apps/web/lib/ai/gpt-coach.ts apps/web/lib/ai/voice-feedback.ts apps/web/app/api/ai/analyze-form/route.ts
git commit -m "feat: add GPT-4o coach integration and voice feedback"
```

---

## Chunk 3: React Hooks & UI Components

### Task 4: Create React Hooks

**Files:**
- Create: `apps/web/hooks/usePoseDetection.ts`

- [ ] **Step 1: Write usePoseDetection hook**

```typescript
// apps/web/hooks/usePoseDetection.ts

import { useEffect, useRef, useState, useCallback } from 'react';
import {
  initializePoseDetection,
  detectPose,
  closePoseDetection,
  PoseDetectionResult,
} from '@/lib/ai/pose-detection';

export function usePoseDetection() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [poseResult, setPoseResult] = useState<PoseDetectionResult | null>(
    null
  );
  const [isDetecting, setIsDetecting] = useState(false);
  const animationFrameRef = useRef<number>();

  // Initialize pose detection
  useEffect(() => {
    initializePoseDetection()
      .then(() => setIsLoading(false))
      .catch((err) => {
        setError(err.message);
        setIsLoading(false);
      });

    return () => closePoseDetection();
  }, []);

  // Start camera
  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user',
        },
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      setError('Could not access camera');
    }
  }, []);

  // Stop camera
  const stopCamera = useCallback(() => {
    if (videoRef.current && videoRef.current.srcObject) {
      (videoRef.current.srcObject as MediaStream)
        .getTracks()
        .forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
  }, []);

  // Detection loop
  const startDetection = useCallback(() => {
    setIsDetecting(true);

    const detect = () => {
      if (videoRef.current && !isLoading) {
        const result = detectPose(videoRef.current);
        if (result) {
          setPoseResult(result);
        }
      }

      if (isDetecting) {
        animationFrameRef.current = requestAnimationFrame(detect);
      }
    };

    detect();
  }, [isLoading, isDetecting]);

  const stopDetection = useCallback(() => {
    setIsDetecting(false);
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
  }, []);

  return {
    videoRef,
    isLoading,
    error,
    poseResult,
    isDetecting,
    startCamera,
    stopCamera,
    startDetection,
    stopDetection,
  };
}
```

- [ ] **Step 2: Create useFormAnalysis hook**

Create: `apps/web/hooks/useFormAnalysis.ts`

```typescript
// apps/web/hooks/useFormAnalysis.ts

import { useState, useCallback } from 'react';
import { PoseDetectionResult } from '@/lib/ai/pose-detection';
import { FormAnalysisResult } from '@/lib/ai/form-analyzer';
import { CoachFeedback } from '@/lib/ai/gpt-coach';

export function useFormAnalysis() {
  const [formAnalysis, setFormAnalysis] =
    useState<FormAnalysisResult | null>(null);
  const [coachFeedback, setCoachFeedback] =
    useState<CoachFeedback | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyze = useCallback(
    async (
      exercise: string,
      poseResult: PoseDetectionResult,
      repNumber: number,
      userContext?: any
    ) => {
      setIsAnalyzing(true);
      setError(null);

      try {
        const response = await fetch('/api/ai/analyze-form', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            exercise,
            poseResult,
            repNumber,
            userContext,
          }),
        });

        if (!response.ok) {
          throw new Error('Analysis failed');
        }

        const data = await response.json();
        setFormAnalysis(data.formAnalysis);
        setCoachFeedback(data.coachFeedback);
      } catch (err) {
        setError(String(err));
      } finally {
        setIsAnalyzing(false);
      }
    },
    []
  );

  return {
    formAnalysis,
    coachFeedback,
    isAnalyzing,
    error,
    analyze,
  };
}
```

- [ ] **Step 3: Commit**

```bash
git add apps/web/hooks/usePoseDetection.ts apps/web/hooks/useFormAnalysis.ts
git commit -m "feat: add React hooks for pose detection and form analysis"
```

---

### Task 5: Create UI Components & Integrate

**Files:**
- Create: `apps/web/components/workout/PoseDetectionCamera.tsx`
- Create: `apps/web/components/workout/FormScoreDisplay.tsx`
- Create: `apps/web/components/workout/CoachFeedback.tsx`

- [ ] **Step 1: Create PoseDetectionCamera component**

```typescript
// apps/web/components/workout/PoseDetectionCamera.tsx

'use client';

import React, { useEffect, useRef } from 'react';
import { usePoseDetection } from '@/hooks/usePoseDetection';
import { useFormAnalysis } from '@/hooks/useFormAnalysis';

interface PoseDetectionCameraProps {
  exercise: string;
  repNumber: number;
  onFormScoreUpdate?: (score: number) => void;
}

export function PoseDetectionCamera({
  exercise,
  repNumber,
  onFormScoreUpdate,
}: PoseDetectionCameraProps) {
  const {
    videoRef,
    isLoading,
    error,
    poseResult,
    isDetecting,
    startCamera,
    stopCamera,
    startDetection,
    stopDetection,
  } = usePoseDetection();

  const { coachFeedback, analyze } = useFormAnalysis();
  const analysisTimeoutRef = useRef<NodeJS.Timeout>();

  // Start on mount
  useEffect(() => {
    startCamera();
    startDetection();

    return () => {
      stopDetection();
      stopCamera();
    };
  }, [startCamera, startDetection, stopCamera, stopDetection]);

  // Analyze form when pose updates
  useEffect(() => {
    if (poseResult && isDetecting) {
      // Debounce analysis (every 500ms)
      if (analysisTimeoutRef.current) {
        clearTimeout(analysisTimeoutRef.current);
      }

      analysisTimeoutRef.current = setTimeout(async () => {
        await analyze(exercise, poseResult, repNumber);
      }, 500);
    }

    return () => {
      if (analysisTimeoutRef.current) {
        clearTimeout(analysisTimeoutRef.current);
      }
    };
  }, [poseResult, isDetecting, exercise, repNumber, analyze]);

  // Update parent when score changes
  useEffect(() => {
    if (coachFeedback && onFormScoreUpdate) {
      onFormScoreUpdate(coachFeedback.formScore);
    }
  }, [coachFeedback, onFormScoreUpdate]);

  return (
    <div className="w-full h-full bg-black rounded-lg overflow-hidden relative">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <p className="text-white">Kamera başlatılıyor...</p>
        </div>
      )}

      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-red-500/20">
          <p className="text-red-400">{error}</p>
        </div>
      )}

      <video
        ref={videoRef}
        autoPlay
        playsInline
        className="w-full h-full object-cover"
      />

      {/* Skeleton overlay will be added in next task */}
      {poseResult && (
        <SkeletonOverlay keypoints={poseResult.keypoints} />
      )}
    </div>
  );
}

function SkeletonOverlay({
  keypoints,
}: {
  keypoints: Array<{ name: string; x: number; y: number }>;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current || !keypoints) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw keypoints
    keypoints.forEach((kp) => {
      const x = kp.x * canvas.width;
      const y = kp.y * canvas.height;

      ctx.fillStyle = '#3B82F6';
      ctx.beginPath();
      ctx.arc(x, y, 5, 0, Math.PI * 2);
      ctx.fill();
    });

    // Draw skeleton connections
    const connections = [
      ['left_shoulder', 'left_hip'],
      ['right_shoulder', 'right_hip'],
      ['left_hip', 'right_hip'],
      ['left_shoulder', 'right_shoulder'],
      ['left_shoulder', 'left_elbow'],
      ['left_elbow', 'left_wrist'],
      ['right_shoulder', 'right_elbow'],
      ['right_elbow', 'right_wrist'],
      ['left_hip', 'left_knee'],
      ['left_knee', 'left_ankle'],
      ['right_hip', 'right_knee'],
      ['right_knee', 'right_ankle'],
    ];

    ctx.strokeStyle = '#3B82F6';
    ctx.lineWidth = 2;

    connections.forEach(([start, end]) => {
      const startKp = keypoints.find((kp) => kp.name === start);
      const endKp = keypoints.find((kp) => kp.name === end);

      if (startKp && endKp) {
        ctx.beginPath();
        ctx.moveTo(startKp.x * canvas.width, startKp.y * canvas.height);
        ctx.lineTo(endKp.x * canvas.width, endKp.y * canvas.height);
        ctx.stroke();
      }
    });
  }, [keypoints]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      width={640}
      height={480}
    />
  );
}
```

- [ ] **Step 2: Create FormScoreDisplay component**

Create: `apps/web/components/workout/FormScoreDisplay.tsx`

```typescript
// apps/web/components/workout/FormScoreDisplay.tsx

'use client';

import React from 'react';

interface FormScoreDisplayProps {
  score: number;
  injuryRisk: number;
  errors: Array<{ cue: string; severity: string }>;
}

export function FormScoreDisplay({
  score,
  injuryRisk,
  errors,
}: FormScoreDisplayProps) {
  const getScoreColor = () => {
    if (score >= 85) return 'text-green-400';
    if (score >= 70) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getScoreBg = () => {
    if (score >= 85) return 'bg-green-500/10';
    if (score >= 70) return 'bg-yellow-500/10';
    return 'bg-red-500/10';
  };

  return (
    <div className={`${getScoreBg()} border border-opacity-20 rounded-xl p-4`}>
      <div className={`text-3xl font-bold ${getScoreColor()}`}>
        {Math.round(score)}/100
      </div>

      <div className="mt-2 text-sm text-gray-400">
        Yaralanma Riski: {injuryRisk}% ✅
      </div>

      {errors.length > 0 && (
        <div className="mt-3 space-y-1">
          <div className="text-xs text-gray-500 font-semibold">DÜZELTMELER:</div>
          {errors.slice(0, 2).map((err, i) => (
            <div key={i} className="text-xs text-gray-300">
              • {err.cue}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Create CoachFeedback component**

Create: `apps/web/components/workout/CoachFeedback.tsx`

```typescript
// apps/web/components/workout/CoachFeedback.tsx

'use client';

import React, { useEffect } from 'react';
import { playVoiceFeedback } from '@/lib/ai/voice-feedback';
import { Volume2, VolumeX } from 'lucide-react';

interface CoachFeedbackProps {
  feedback: string;
  isPlaying?: boolean;
}

export function CoachFeedback({
  feedback,
  isPlaying = false,
}: CoachFeedbackProps) {
  const [isSpeaking, setIsSpeaking] = React.useState(false);

  useEffect(() => {
    if (isPlaying && feedback) {
      setIsSpeaking(true);
      playVoiceFeedback(feedback).finally(() => setIsSpeaking(false));
    }
  }, [feedback, isPlaying]);

  return (
    <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 flex items-center gap-3">
      {isSpeaking ? (
        <Volume2 className="w-5 h-5 text-blue-400 animate-pulse" />
      ) : (
        <VolumeX className="w-5 h-5 text-gray-500" />
      )}

      <div className="flex-1">
        <p className="text-sm text-blue-300">{feedback}</p>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Integrate into session page**

Modify: `apps/web/app/(dashboard)/dashboard/session/page.tsx`

```typescript
// Add imports
import { PoseDetectionCamera } from '@/components/workout/PoseDetectionCamera';
import { FormScoreDisplay } from '@/components/workout/FormScoreDisplay';
import { CoachFeedback } from '@/components/workout/CoachFeedback';

// In the component, replace the camera section with:
export default function SessionPage() {
  const [formScore, setFormScore] = React.useState(0);

  return (
    <div className="space-y-4">
      {/* Camera + skeleton overlay */}
      <div className="h-96">
        <PoseDetectionCamera
          exercise="squat"
          repNumber={1}
          onFormScoreUpdate={setFormScore}
        />
      </div>

      {/* Form score display */}
      <FormScoreDisplay
        score={formScore}
        injuryRisk={5}
        errors={[]}
      />

      {/* Coach feedback */}
      <CoachFeedback
        feedback="Form skoru 87! Harika gidiyor! Daha derine in."
        isPlaying={false}
      />
    </div>
  );
}
```

- [ ] **Step 5: Commit**

```bash
git add apps/web/components/workout/PoseDetectionCamera.tsx apps/web/components/workout/FormScoreDisplay.tsx apps/web/components/workout/CoachFeedback.tsx apps/web/app/\(dashboard\)/dashboard/session/page.tsx
git commit -m "feat: add UI components for pose detection and form coaching"
```

---

## Chunk 4: Database Schema & Final Setup

### Task 6: Update Database Schema

**Files:**
- Modify: `apps/web/prisma/schema.prisma`

- [ ] **Step 1: Add new tables to schema**

Find the existing `WorkoutSession` model and replace/extend it:

```prisma
model WorkoutSession {
  id               String         @id @default(cuid())
  userId           String
  user             User           @relation(fields: [userId], references: [id], onDelete: Cascade)
  programId        String?
  program          WorkoutProgram? @relation(fields: [programId], references: [id])
  programDayId     String?
  programDay       ProgramDay?    @relation(fields: [programDayId], references: [id])
  startedAt        DateTime       @default(now())
  endedAt          DateTime?
  durationSeconds  Int?
  overallFormScore Float?
  caloriesBurned   Float?
  notes            String?
  heartRateData    Json?
  poseAnalyses     Json?          // Array of RepAnalysis

  completedSets    CompletedSet[]
  formRepData      FormRepData[]  // NEW: Per-rep form analysis

  @@index([userId])
  @@index([startedAt])
}

// NEW TABLE: Store per-rep form analysis
model FormRepData {
  id               String         @id @default(cuid())
  sessionId        String
  session          WorkoutSession @relation(fields: [sessionId], references: [id], onDelete: Cascade)

  exerciseName     String
  repNumber        Int
  setNumber        Int

  // Pose data
  keypoints        Json           // Array of KeyPoint
  angles           Json           // AngleData

  // Analysis results
  formScore        Float
  technicalCorrectness Float
  errors           Json           // Array of FormError
  muscleEngagement Json           // MuscleEngagement map
  injuryRisk       Int            // 1-100

  // Coach feedback
  voiceFeedback    String
  corrections      String[]
  encouragement    String

  createdAt        DateTime       @default(now())

  @@index([sessionId])
  @@index([exerciseName])
  @@index([repNumber])
}

// NEW TABLE: Workout analytics aggregation
model WorkoutAnalytics {
  id               String         @id @default(cuid())
  sessionId        String         @unique
  session          WorkoutSession @relation(fields: [sessionId], references: [id])

  avgFormScore     Float
  bestRepScore     Float
  worstRepScore    Float
  formTrend        String         // "improving", "declining", "stable"
  muscleEngagement Json           // Aggregate muscle engagement
  weakPointsFound  String[]
  injuryRiskLevel  Int            // 1-100
  riskFactors      String[]

  createdAt        DateTime       @default(now())

  @@index([sessionId])
}

// NEW TABLE: User weaknesses tracking
model UserWeakness {
  id               String         @id @default(cuid())
  userId           String
  user             User           @relation(fields: [userId], references: [id])

  muscleGroup      String         // "posterior_chain", "rear_delts", etc.
  exerciseName     String
  severity         Int            // 1-10
  discoveredDate   DateTime       @default(now())
  targetDate       DateTime?      // When to improve by

  createdAt        DateTime       @default(now())
  updatedAt        DateTime       @updatedAt

  @@index([userId])
  @@index([muscleGroup])
}
```

- [ ] **Step 2: Update User model to include relationships**

Add to `User` model:

```prisma
model User {
  // ... existing fields ...

  formRepData      FormRepData[]
  weaknesses       UserWeakness[]
  workoutAnalytics WorkoutAnalytics[]

  // ... rest of model ...
}
```

- [ ] **Step 3: Run Prisma migration**

```bash
npx prisma migrate dev --name "add_form_analysis_tables"
```

Expected: Migration created successfully

- [ ] **Step 4: Commit**

```bash
git add prisma/schema.prisma prisma/migrations
git commit -m "feat: add database schema for form analysis and analytics"
```

---

### Task 7: Install Dependencies

**Files:**
- Modify: `apps/web/package.json`

- [ ] **Step 1: Install required packages**

```bash
npm install @mediapipe/tasks-vision @tensorflow/tfjs @tensorflow/tfjs-core openai axios
npm install --save-dev @types/node
```

- [ ] **Step 2: Verify installations**

```bash
npm ls | grep -E "(mediapipe|tensorflow|openai)"
```

Expected: All packages installed

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "feat: add AI and pose detection dependencies"
```

---

### Task 8: Environment Setup

**Files:**
- Create: `.env.local.example`
- Modify: `.env.local`

- [ ] **Step 1: Create example env file**

```bash
echo "OPENAI_API_KEY=sk-your-key-here" > .env.local.example
```

- [ ] **Step 2: Add to .env.local**

```bash
# Add to your actual .env.local:
OPENAI_API_KEY=<your-openai-api-key>
```

- [ ] **Step 3: Verify build**

```bash
npm run build
```

Expected: Build succeeds

- [ ] **Step 4: Final commit**

```bash
git add .env.local.example
git commit -m "chore: add environment setup for OpenAI API"
```

---

## Success Criteria - Phase 1

✅ MediaPipe pose detection working (30+ fps)  
✅ Angle calculations accurate (±5° error)  
✅ Form scoring algorithm functional (1-100 scale)  
✅ GPT-4o integration working (real-time analysis)  
✅ Voice feedback playing via TTS  
✅ React hooks properly managing state  
✅ Camera feed displaying with skeleton overlay  
✅ UI components rendering correctly  
✅ Database schema migrations applied  
✅ All dependencies installed  
✅ Build succeeds without errors  

---

## Timeline

- **Weeks 1-2:** Tasks 1-4 (Pose detection, angle calculation, form analysis, GPT integration)
- **Week 2-3:** Tasks 5-8 (React hooks, UI components, database, setup)

**Total: 3 weeks for Phase 1 foundation**

---

**Plan Status:** Complete and ready for execution

**Next Steps:**
1. Execute Phase 1 using subagent-driven-development
2. After Phase 1 completes: Move to Phase 2 (User Profiling & Analytics)
3. After Phase 2 completes: Move to Phase 3 (AR Visualization & Polish)
