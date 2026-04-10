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
