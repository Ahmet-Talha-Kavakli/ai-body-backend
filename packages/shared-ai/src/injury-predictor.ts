export interface TrainingLoad {
  date: Date;
  volumeLoad: number; // sets × reps × weight
  intensity: number; // RPE 1-10
  exercise: string;
}

export interface AthleteMetrics {
  formScore: number; // 0-100
  readinessScore: number; // 0-100
  recoveryQuality: number; // 0-100
  sleepQuality: number; // 0-100
  hrvScore: number; // Heart Rate Variability
}

export interface InjuryRiskAssessment {
  riskPercentage: number; // 0-100
  riskLevel: "low" | "moderate" | "high" | "critical";
  factors: Array<{ name: string; contribution: number }>;
  recommendations: string[];
}

export class InjuryPredictor {
  /**
   * Calculate acute-chronic workload ratio (ACWR)
   * Higher than 1.5 or lower than 0.8 indicates injury risk
   */
  static calculateACWR(
    recentLoads: TrainingLoad[], // 7 days
    previousLoads: TrainingLoad[] // 28 days
  ): number {
    const acuteVolume = recentLoads.reduce((sum, load) => sum + load.volumeLoad, 0);
    const chronicVolume = previousLoads.reduce(
      (sum, load) => sum + load.volumeLoad,
      0
    );

    if (chronicVolume === 0) return 1;
    return acuteVolume / (chronicVolume / 4);
  }

  /**
   * Calculate cumulative fatigue score
   */
  static calculateFatigueScore(
    loads: TrainingLoad[],
    metrics: AthleteMetrics
  ): number {
    const volumeAvg =
      loads.reduce((sum, load) => sum + load.volumeLoad, 0) / Math.max(loads.length, 1);
    const intensityAvg =
      loads.reduce((sum, load) => sum + load.intensity, 0) / Math.max(loads.length, 1);

    // Base fatigue from volume and intensity
    let fatigueScore = (volumeAvg / 1000) * 50 + (intensityAvg / 10) * 50;

    // Reduce fatigue if athlete is well recovered
    const recoveryFactor = (metrics.recoveryQuality / 100) * 0.5;
    fatigueScore *= 1 - recoveryFactor;

    // Add sleep quality factor
    if (metrics.sleepQuality < 50) {
      fatigueScore *= 1.3;
    }

    return Math.min(100, fatigueScore);
  }

  /**
   * Calculate readiness deficit
   */
  static calculateReadinessDeficit(
    formScore: number,
    readinessScore: number,
    hrvScore: number
  ): number {
    const avgScore = (formScore + readinessScore + hrvScore) / 3;
    const deficit = Math.max(0, 80 - avgScore); // 80 is target
    return Math.min(100, deficit * 1.25);
  }

  /**
   * Predict injury risk based on multiple factors
   */
  static predictInjuryRisk(
    recentLoads: TrainingLoad[],
    previousLoads: TrainingLoad[],
    metrics: AthleteMetrics
  ): InjuryRiskAssessment {
    const factors: Array<{ name: string; contribution: number }> = [];
    let totalRisk = 0;

    // Factor 1: ACWR (0-40 points)
    const acwr = this.calculateACWR(recentLoads, previousLoads);
    let acwrRisk = 0;
    if (acwr > 1.5) {
      acwrRisk = Math.min(40, (acwr - 1) * 20);
    } else if (acwr < 0.8) {
      acwrRisk = (0.8 - acwr) * 20;
    }
    factors.push({ name: "ACWR", contribution: acwrRisk });
    totalRisk += acwrRisk;

    // Factor 2: Fatigue Score (0-30 points)
    const fatigueScore = this.calculateFatigueScore(recentLoads, metrics);
    const fatigueRisk = (fatigueScore / 100) * 30;
    factors.push({ name: "Fatigue Accumulation", contribution: fatigueRisk });
    totalRisk += fatigueRisk;

    // Factor 3: Readiness Deficit (0-20 points)
    const readinessDeficit = this.calculateReadinessDeficit(
      metrics.formScore,
      metrics.readinessScore,
      metrics.hrvScore
    );
    const readinessRisk = (readinessDeficit / 100) * 20;
    factors.push({
      name: "Readiness Deficit",
      contribution: readinessRisk,
    });
    totalRisk += readinessRisk;

    // Factor 4: Sleep Quality (0-10 points)
    const sleepRisk =
      metrics.sleepQuality < 60 ? (100 - metrics.sleepQuality) * 0.1 : 0;
    factors.push({ name: "Sleep Quality", contribution: sleepRisk });
    totalRisk += sleepRisk;

    const riskPercentage = Math.min(100, totalRisk);

    // Determine risk level
    let riskLevel: "low" | "moderate" | "high" | "critical";
    if (riskPercentage < 20) riskLevel = "low";
    else if (riskPercentage < 40) riskLevel = "moderate";
    else if (riskPercentage < 70) riskLevel = "high";
    else riskLevel = "critical";

    // Generate recommendations
    const recommendations: string[] = [];

    if (acwr > 1.5) {
      recommendations.push("Reduce acute training load. Risk of overuse injury.");
    }
    if (acwr < 0.8) {
      recommendations.push(
        "Gradually increase training load. You're under-stimulating adaptation."
      );
    }
    if (fatigueScore > 70) {
      recommendations.push("High fatigue accumulation. Schedule a recovery week.");
    }
    if (metrics.sleepQuality < 60) {
      recommendations.push(
        "Sleep quality is compromised. This significantly increases injury risk."
      );
    }
    if (metrics.readinessScore < 50) {
      recommendations.push(
        "Low readiness. Consider reducing intensity or volume today."
      );
    }
    if (recommendations.length === 0) {
      recommendations.push("Injury risk is low. Continue your current program.");
    }

    return {
      riskPercentage: Math.round(riskPercentage),
      riskLevel,
      factors: factors.sort((a, b) => b.contribution - a.contribution),
      recommendations,
    };
  }
}

export function createInjuryPredictor(): typeof InjuryPredictor {
  return InjuryPredictor;
}

  if (riskAssessment.overallRiskLevel === 'low') {
    return { timeToInjury: null, confidence: 0.9 }; // No injury expected
  }

  return { timeToInjury: 6, confidence: 0.55 }; // 6 weeks
}
