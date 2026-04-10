// Injury Prediction - ML risk model

export interface InjuryRiskFactors {
  volume?: number; // Weekly training volume
  intensity?: number; // Average RPE
  recovery?: number; // Recovery score (0-100)
  sleepHours?: number;
  previousInjuries?: { location: string; yearsAgo: number }[];
  formScore?: number; // Average form quality
  ageOfAthlete?: number;
  trainingAge?: number; // Years of experience
}

export interface InjuryRiskAssessment {
  overallRiskLevel: 'low' | 'moderate' | 'high';
  riskProbability: number; // 0-1
  vulnerableAreas: Array<{ location: string; riskScore: number }>;
  immediateRedFlags: string[];
  preventiveMeasures: string[];
}

export function assessInjuryRisk(factors: InjuryRiskFactors): InjuryRiskAssessment {
  // Stub: Load ML model trained on injury history
  // Stub: Calculate risk probability using weighted factors
  // Stub: Identify vulnerable areas based on training patterns

  const baseRisk = 0.15;
  let riskMultiplier = 1.0;

  // Increase risk if volume too high
  if (factors.volume && factors.volume > 500) {
    riskMultiplier *= 1.3;
  }

  // Decrease risk if recovery good
  if (factors.recovery && factors.recovery > 80) {
    riskMultiplier *= 0.8;
  }

  // Increase risk if history of injury
  if (factors.previousInjuries && factors.previousInjuries.length > 0) {
    riskMultiplier *= 1.5;
  }

  const riskProbability = Math.min(baseRisk * riskMultiplier, 0.95);

  let riskLevel: 'low' | 'moderate' | 'high';
  if (riskProbability < 0.3) riskLevel = 'low';
  else if (riskProbability < 0.6) riskLevel = 'moderate';
  else riskLevel = 'high';

  return {
    overallRiskLevel: riskLevel,
    riskProbability,
    vulnerableAreas: [
      { location: 'lower_back', riskScore: 0.35 },
      { location: 'shoulder', riskScore: 0.28 },
      { location: 'knee', riskScore: 0.22 },
    ],
    immediateRedFlags:
      riskLevel === 'high'
        ? ['High training volume detected', 'Below optimal recovery score']
        : [],
    preventiveMeasures: [
      'Incorporate mobility work 3x per week',
      'Reduce volume by 10-20%',
      'Increase sleep by 1 hour',
      'Add dynamic warm-up before heavy lifting',
    ],
  };
}

export function predictInjuryTimeline(
  riskAssessment: InjuryRiskAssessment,
  currentTrend: 'worsening' | 'stable' | 'improving'
): { timeToInjury: number | null; confidence: number } {
  // Stub: Predict when injury might occur
  // Stub: Calculate confidence in prediction

  if (riskAssessment.overallRiskLevel === 'high' && currentTrend === 'worsening') {
    return { timeToInjury: 2, confidence: 0.72 }; // 2 weeks
  }

  if (riskAssessment.overallRiskLevel === 'low') {
    return { timeToInjury: null, confidence: 0.9 }; // No injury expected
  }

  return { timeToInjury: 6, confidence: 0.55 }; // 6 weeks
}
