// Plateau Detection - Identify stagnation in progress

export interface ProgressMetric {
  timestamp: number;
  value: number; // Could be weight lifted, reps, volume, etc.
  exercise: string;
}

export interface PlateauAnalysis {
  isPlateau: boolean;
  duration: number; // weeks stagnant
  expectedBreakthrough: string; // recommendation to break through
  similarHistoricalPatterns: number;
  suggestedInterventions: string[];
}

export function detectPlateau(metrics: ProgressMetric[], windowWeeks: number = 4): PlateauAnalysis {
  // Stub: Analyze progress over window
  // Stub: Check if improvement < 2% over period
  // Stub: Calculate plateau duration

  if (metrics.length < 2) {
    return {
      isPlateau: false,
      duration: 0,
      expectedBreakthrough: '',
      similarHistoricalPatterns: 0,
      suggestedInterventions: [],
    };
  }

  // Simple stub: assumes plateau if last 3 values within 5% of each other
  const recentMetrics = metrics.slice(-3);
  const avg = recentMetrics.reduce((a, m) => a + m.value, 0) / recentMetrics.length;
  const variance = recentMetrics.reduce((max, m) => Math.max(max, Math.abs(m.value - avg)), 0);

  const isPlateau = variance / avg < 0.05;

  return {
    isPlateau,
    duration: isPlateau ? 3 : 0,
    expectedBreakthrough: isPlateau ? '2-3 weeks with new stimulus' : 'N/A',
    similarHistoricalPatterns: 2,
    suggestedInterventions: isPlateau
      ? [
          'Change exercise variation',
          'Increase training frequency',
          'Adjust rep range (drop 2-3 reps, increase weight)',
          'Add pause reps or tempo training',
        ]
      : [],
  };
}

export function predictPlateauRisk(
  recentProgress: ProgressMetric[],
  historicalData: ProgressMetric[]
): { riskLevel: 'low' | 'medium' | 'high'; timeToExpectedPlateau: number } {
  // Stub: Predict plateau likelihood
  // Stub: Estimate when plateau might occur

  return {
    riskLevel: 'low',
    timeToExpectedPlateau: 8, // weeks
  };
}
