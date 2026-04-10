import { describe, it, expect } from 'vitest';
import { calculateNextLoad } from '../progressive-overload';

describe('calculateNextLoad', () => {
  it('increases weight when user hits top of rep range with low RPE', () => {
    const result = calculateNextLoad({
      currentWeightKg: 100,
      targetRepsMin: 8,
      targetRepsMax: 12,
      history: [
        { repsCompleted: 12, rpe: 6 },
        { repsCompleted: 12, rpe: 7 },
        { repsCompleted: 11, rpe: 6 },
      ],
    });
    expect(result.weightKg).toBeGreaterThan(100);
  });

  it('decreases weight when user cannot complete min reps', () => {
    const result = calculateNextLoad({
      currentWeightKg: 100,
      targetRepsMin: 8,
      targetRepsMax: 12,
      history: [
        { repsCompleted: 5, rpe: 9 },
        { repsCompleted: 6, rpe: 10 },
        { repsCompleted: 5, rpe: 9 },
      ],
    });
    expect(result.weightKg).toBeLessThan(100);
  });

  it('keeps weight the same when in target range', () => {
    const result = calculateNextLoad({
      currentWeightKg: 100,
      targetRepsMin: 8,
      targetRepsMax: 12,
      history: [
        { repsCompleted: 10, rpe: 7 },
        { repsCompleted: 9, rpe: 8 },
        { repsCompleted: 10, rpe: 7 },
      ],
    });
    expect(result.weightKg).toBe(100);
  });

  it('rounds to nearest 2.5kg', () => {
    const result = calculateNextLoad({
      currentWeightKg: 100,
      targetRepsMin: 8,
      targetRepsMax: 12,
      history: [
        { repsCompleted: 12, rpe: 6 },
        { repsCompleted: 12, rpe: 6 },
        { repsCompleted: 12, rpe: 6 },
      ],
    });
    expect(result.weightKg % 2.5).toBe(0);
  });
});
