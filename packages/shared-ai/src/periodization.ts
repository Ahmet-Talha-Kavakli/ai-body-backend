export enum TrainingPhase {
  HYPERTROPHY = "hypertrophy",
  STRENGTH = "strength",
  POWER = "power",
  DELOAD = "deload",
}

export interface Mesocycle {
  id: string;
  userId: string;
  phase: TrainingPhase;
  startDate: Date;
  endDate: Date;
  weekCount: number;
  currentWeek: number;
  volumeProgression: number; // 0-100, how much volume increases each week
  deloadWeek: number; // which week is deload (typically week 4)
}

export class PeriodizationPlanner {
  /**
   * Create a new 4-week mesocycle
   */
  static createMesocycle(
    userId: string,
    startingPhase: TrainingPhase = TrainingPhase.HYPERTROPHY
  ): Mesocycle {
    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 28); // 4 weeks

    return {
      id: `meso-${userId}-${Date.now()}`,
      userId,
      phase: startingPhase,
      startDate,
      endDate,
      weekCount: 4,
      currentWeek: 1,
      volumeProgression: 25, // 25% increase per week (before deload)
      deloadWeek: 4,
    };
  }

  /**
   * Calculate recommended training volume for current week
   */
  static calculateVolumeForWeek(
    mesocycle: Mesocycle,
    baselineVolume: number
  ): number {
    if (mesocycle.currentWeek === mesocycle.deloadWeek) {
      // Deload week: 50% of normal volume
      return baselineVolume * 0.5;
    }

    // Progressive overload: increase volume each week
    const progressionMultiplier =
      1 + (mesocycle.volumeProgression / 100) * (mesocycle.currentWeek - 1);
    return Math.round(baselineVolume * progressionMultiplier);
  }

  /**
   * Calculate recommended intensity (RPE/RIR) for current week
   */
  static calculateIntensityForWeek(
    mesocycle: Mesocycle,
    baselineIntensity: number
  ): {
    rpe: number; // Rate of Perceived Exertion (1-10)
    rir: number; // Reps in Reserve
  } {
    if (mesocycle.currentWeek === mesocycle.deloadWeek) {
      return {
        rpe: 5, // Very light
        rir: 5, // Should have 5 reps left in tank
      };
    }

    // Increase intensity each week until deload
    const intensityBoost =
      (mesocycle.currentWeek - 1) * 0.5; // +0.5 RPE per week
    return {
      rpe: Math.min(10, baselineIntensity + intensityBoost),
      rir: Math.max(1, 4 - Math.floor((mesocycle.currentWeek - 1) * 0.5)),
    };
  }

  /**
   * Determine the next mesocycle phase
   */
  static getNextPhase(currentPhase: TrainingPhase): TrainingPhase {
    const phaseProgression = {
      [TrainingPhase.HYPERTROPHY]: TrainingPhase.STRENGTH,
      [TrainingPhase.STRENGTH]: TrainingPhase.POWER,
      [TrainingPhase.POWER]: TrainingPhase.HYPERTROPHY,
      [TrainingPhase.DELOAD]: TrainingPhase.HYPERTROPHY,
    };

    return phaseProgression[currentPhase];
  }

  /**
   * Check if deload week is needed
   */
  static isDeloadWeek(mesocycle: Mesocycle): boolean {
    return mesocycle.currentWeek === mesocycle.deloadWeek;
  }

  /**
   * Advance to next week
   */
  static advanceToNextWeek(mesocycle: Mesocycle): Mesocycle {
    const updated = { ...mesocycle };
    updated.currentWeek += 1;

    // If reached end of mesocycle, create a new one
    if (updated.currentWeek > updated.weekCount) {
      const nextPhase = this.getNextPhase(updated.phase);
      return this.createMesocycle(updated.userId, nextPhase);
    }

    return updated;
  }

  /**
   * Get training recommendations for current week
   */
  static getWeeklyRecommendations(
    mesocycle: Mesocycle,
    baselineVolume: number,
    baselineIntensity: number
  ): {
    phase: TrainingPhase;
    volume: number;
    intensity: { rpe: number; rir: number };
    isDeload: boolean;
    guidance: string;
  } {
    const isDeload = this.isDeloadWeek(mesocycle);
    const volume = this.calculateVolumeForWeek(mesocycle, baselineVolume);
    const intensity = this.calculateIntensityForWeek(mesocycle, baselineIntensity);

    let guidance = "";
    if (isDeload) {
      guidance =
        "Deload week: Focus on form and recovery. Light training promotes adaptation.";
    } else if (mesocycle.currentWeek === 1) {
      guidance = `Starting ${mesocycle.phase} phase. Build a solid foundation.`;
    } else {
      guidance = "Progressive overload: Increase weight, reps, or density.";
    }

    return {
      phase: mesocycle.phase,
      volume,
      intensity,
      isDeload,
      guidance,
    };
  }
}

export function createPeriodizationPlanner(): typeof PeriodizationPlanner {
  return PeriodizationPlanner;
}
