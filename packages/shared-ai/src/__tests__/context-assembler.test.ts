import { describe, it, expect } from 'vitest';
import { buildContextString } from '../context-assembler';

describe('buildContextString', () => {
  it('includes all context sections', () => {
    const ctx = buildContextString({
      body: { fitnessLevel: 'intermediate', primaryGoal: 'muscle_gain', weight: 80, height: 178 },
      weekly: { avgFormScore: 72, sessionsCompleted: 3, avgReadiness: 68 },
      session: null,
      injuries: [{ location: 'left_shoulder', severity: 'moderate' }],
    });
    expect(ctx).toContain('intermediate');
    expect(ctx).toContain('muscle_gain');
    expect(ctx).toContain('sol omuz');
    expect(ctx).toContain('3 seans');
  });

  it('stays under 2000 tokens estimate (8000 chars)', () => {
    const ctx = buildContextString({
      body: { fitnessLevel: 'beginner', primaryGoal: 'weight_loss', weight: 90, height: 170 },
      weekly: { avgFormScore: 60, sessionsCompleted: 1, avgReadiness: 55 },
      session: { currentExercise: 'squat', repCount: 5, formScore: 65 },
      injuries: [],
    });
    expect(ctx.length).toBeLessThan(8000);
  });
});
