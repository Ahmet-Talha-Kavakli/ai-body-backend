// Periodization Engine - Mesocycle logic for training phases

export type PeriodizationPhase = 'hypertrophy' | 'strength' | 'power' | 'deload';

export interface Mesocycle {
  phase: PeriodizationPhase;
  duration: number; // weeks
  targetRPE: number; // Rate of Perceived Exertion (1-10)
  volumeProgression: number; // % increase per week
  intensityProgression: number; // % increase per week
  focusAreas: string[];
}

export interface TrainingPlan {
  startDate: string;
  mesocycles: Mesocycle[];
  currentWeek: number;
  progressionModel: 'linear' | 'undulating' | 'block';
}

export function generateMesocycle(
  phase: PeriodizationPhase,
  currentFitnessLevel: number
): Mesocycle {
  // Stub: Generate mesocycle based on phase and current level
  // Stub: Calculate progression parameters

  const baseIntensity: Record<PeriodizationPhase, number> = {
    hypertrophy: 6,
    strength: 8,
    power: 9,
    deload: 4,
  };

  return {
    phase,
    duration: 4,
    targetRPE: baseIntensity[phase],
    volumeProgression: 5,
    intensityProgression: 3,
    focusAreas: [phase],
  };
}

export function createTrainingPlan(
  progression: 'linear' | 'undulating' | 'block',
  weeksToPlan: number
): TrainingPlan {
  // Stub: Create periodized training plan
  // Stub: Structure mesocycles based on progression model
  // Stub: Calculate deload timing

  const mesocycles: Mesocycle[] = [];
  for (let i = 0; i < Math.ceil(weeksToPlan / 4); i++) {
    const phases: PeriodizationPhase[] = ['hypertrophy', 'strength', 'power', 'deload'];
    const phase = phases[i % 4];
    mesocycles.push(generateMesocycle(phase, 70 + i * 5));
  }

  return {
    startDate: new Date().toISOString(),
    mesocycles,
    currentWeek: 1,
    progressionModel: progression,
  };
}
