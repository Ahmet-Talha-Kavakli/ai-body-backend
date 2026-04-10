import { describe, it, expect } from 'vitest';
import { calculateReadinessScore } from '../readiness-score';

describe('calculateReadinessScore', () => {
  it('returns >= 95 for perfect inputs', () => {
    const score = calculateReadinessScore({
      sleepHours: 8,
      hrvDelta: 0.1,       // +10% above personal average
      sessionFatigue: 0.1, // low load in last 48 hours
      stressLevel: 1,      // 1/10
      proteinRatio: 1.0,   // 100% of target
      activeInjuries: 0,
    });
    expect(score).toBeGreaterThanOrEqual(95);
  });

  it('returns < 40 for poor inputs', () => {
    const score = calculateReadinessScore({
      sleepHours: 4,
      hrvDelta: -0.15,
      sessionFatigue: 0.9,
      stressLevel: 9,
      proteinRatio: 0.4,
      activeInjuries: 2,
    });
    expect(score).toBeLessThan(40);
  });

  it('clamps output between 0 and 100', () => {
    const score = calculateReadinessScore({
      sleepHours: 0,
      hrvDelta: -1,
      sessionFatigue: 1,
      stressLevel: 10,
      proteinRatio: 0,
      activeInjuries: 5,
    });
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });

  it('uses 0.5 default for HRV when wearable not connected', () => {
    const withHRV = calculateReadinessScore({
      sleepHours: 7,
      hrvDelta: 0,
      sessionFatigue: 0.3,
      stressLevel: 4,
      proteinRatio: 0.9,
      activeInjuries: 0,
    });
    const withoutHRV = calculateReadinessScore({
      sleepHours: 7,
      hrvDelta: null,
      sessionFatigue: 0.3,
      stressLevel: 4,
      proteinRatio: 0.9,
      activeInjuries: 0,
    });
    // null HRV → 0.5 default → scores should be close
    expect(Math.abs(withHRV - withoutHRV)).toBeLessThan(15);
  });
});
