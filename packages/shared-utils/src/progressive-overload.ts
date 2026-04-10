interface SetHistory {
  repsCompleted: number;
  rpe: number; // 1-10 scale
}

interface ProgressiveOverloadInput {
  currentWeightKg: number;
  targetRepsMin: number;
  targetRepsMax: number;
  history: SetHistory[];
}

interface LoadRecommendation {
  weightKg: number;
  note: string;
}

export function calculateNextLoad(input: ProgressiveOverloadInput): LoadRecommendation {
  const { currentWeightKg, targetRepsMin, targetRepsMax, history } = input;

  // Average reps and RPE from last 3 sets
  const avgReps = history.reduce((sum, s) => sum + s.repsCompleted, 0) / history.length;
  const avgRpe = history.reduce((sum, s) => sum + s.rpe, 0) / history.length;

  let newWeight = currentWeightKg;

  // Progression logic
  if (avgReps >= targetRepsMax - 1 && avgRpe <= 7) {
    // Hit top of range with ease → increase weight 5%
    newWeight = currentWeightKg * 1.05;
  } else if (avgReps < targetRepsMin && avgRpe >= 8) {
    // Cannot hit min with proper form → decrease weight 5%
    newWeight = currentWeightKg * 0.95;
  }
  // Otherwise keep same weight

  // Round to nearest 2.5kg
  newWeight = Math.round(newWeight / 2.5) * 2.5;

  const note = newWeight > currentWeightKg ? '↑ Arttır' : newWeight < currentWeightKg ? '↓ Azalt' : '→ Aynı kal';

  return { weightKg: newWeight, note };
}
