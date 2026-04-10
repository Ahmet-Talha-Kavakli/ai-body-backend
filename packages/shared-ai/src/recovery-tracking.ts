export type RecoveryModality =
  | "massage"
  | "sleep"
  | "stretching"
  | "ice_bath"
  | "sauna"
  | "meditation"
  | "teeth_clenching_release";

export interface RecoverySession {
  id: string;
  userId: string;
  modality: RecoveryModality;
  duration: number; // minutes
  intensity: number; // 0-100
  recordedAt: Date;
}

export interface RecoveryMetrics {
  modality: RecoveryModality;
  totalSessions: number;
  averageIntensity: number;
  averageDuration: number;
  correlationWithFormScore: number; // -1 to 1
}

export class RecoveryTracker {
  /**
   * Calculate correlation between recovery modality usage and form scores
   */
  static calculateCorrelation(
    sessions: RecoverySession[],
    formScores: Array<{ date: Date; score: number }>
  ): number {
    if (sessions.length === 0 || formScores.length === 0) return 0;

    // Create daily recovery totals
    const dailyRecovery: Record<string, number> = {};
    sessions.forEach((session) => {
      const date = session.recordedAt.toISOString().split("T")[0];
      dailyRecovery[date] = (dailyRecovery[date] || 0) + session.intensity;
    });

    // Match with form scores
    const pairs: Array<[number, number]> = [];
    formScores.forEach((fs) => {
      const date = fs.date.toISOString().split("T")[0];
      if (dailyRecovery[date]) {
        pairs.push([dailyRecovery[date], fs.score]);
      }
    });

    if (pairs.length < 2) return 0;

    // Calculate Pearson correlation coefficient
    const n = pairs.length;
    const sumX = pairs.reduce((sum, [x]) => sum + x, 0);
    const sumY = pairs.reduce((sum, [, y]) => sum + y, 0);
    const sumXY = pairs.reduce((sum, [x, y]) => sum + x * y, 0);
    const sumX2 = pairs.reduce((sum, [x]) => sum + x * x, 0);
    const sumY2 = pairs.reduce((sum, [, y]) => sum + y * y, 0);

    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt(
      (n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY)
    );

    return denominator === 0 ? 0 : numerator / denominator;
  }

  /**
   * Analyze recovery modality effectiveness
   */
  static analyzeModality(
    modality: RecoveryModality,
    sessions: RecoverySession[],
    formScores: Array<{ date: Date; score: number }>
  ): RecoveryMetrics {
    const modalitySessions = sessions.filter((s) => s.modality === modality);
    const avgIntensity =
      modalitySessions.length > 0
        ? modalitySessions.reduce((sum, s) => sum + s.intensity, 0) /
          modalitySessions.length
        : 0;

    const avgDuration =
      modalitySessions.length > 0
        ? modalitySessions.reduce((sum, s) => sum + s.duration, 0) /
          modalitySessions.length
        : 0;

    const correlation = this.calculateCorrelation(modalitySessions, formScores);

    return {
      modality,
      totalSessions: modalitySessions.length,
      averageIntensity: Math.round(avgIntensity * 10) / 10,
      averageDuration: Math.round(avgDuration * 10) / 10,
      correlationWithFormScore: Math.round(correlation * 100) / 100,
    };
  }

  /**
   * Get personalized recovery recommendations
   */
  static getRecommendations(
    metrics: RecoveryMetrics[]
  ): Array<{ modality: RecoveryModality; reason: string }> {
    // Sort by positive correlation
    const sorted = [...metrics].sort(
      (a, b) => b.correlationWithFormScore - a.correlationWithFormScore
    );

    return sorted
      .filter((m) => m.correlationWithFormScore > 0.2)
      .slice(0, 3)
      .map((m) => ({
        modality: m.modality,
        reason: `${m.modality.replace(/_/g, " ")} shows +${(m.correlationWithFormScore * 100).toFixed(0)}% correlation with better form scores`,
      }));
  }
}

export function createRecoveryTracker(): typeof RecoveryTracker {
  return RecoveryTracker;
}
