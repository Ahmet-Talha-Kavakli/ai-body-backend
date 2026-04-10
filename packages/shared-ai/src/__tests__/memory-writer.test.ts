import { describe, it, expect } from 'vitest';
import { buildSessionSummary, SessionSummaryInput } from '../memory-writer';

describe('buildSessionSummary', () => {
  it('builds a summary with basic session info', () => {
    const input: SessionSummaryInput = {
      exercises: ['squat', 'bench press'],
      avgFormScore: 85,
      totalVolume: 5000,
      duration: 60,
      personalRecords: [],
      readinessAtStart: 75,
    };

    const summary = buildSessionSummary(input);

    expect(summary).toContain('Seansda squat, bench press yaptı');
    expect(summary).toContain('Form skoru ortalama: 85/100');
    expect(summary).toContain('Toplam yük: 5000kg');
    expect(summary).toContain('Süre: 60 dakika');
    expect(summary).toContain('Hazırlık skoru başta: 75/100');
  });

  it('includes personal records when present', () => {
    const input: SessionSummaryInput = {
      exercises: ['deadlift'],
      avgFormScore: 90,
      totalVolume: 2000,
      duration: 45,
      personalRecords: ['deadlift: 200kg', 'deadlift reps: 5'],
      readinessAtStart: 85,
    };

    const summary = buildSessionSummary(input);

    expect(summary).toContain('Kişisel rekorlar: deadlift: 200kg, deadlift reps: 5');
  });

  it('excludes personal records section when empty', () => {
    const input: SessionSummaryInput = {
      exercises: ['leg press'],
      avgFormScore: 78,
      totalVolume: 3000,
      duration: 50,
      personalRecords: [],
      readinessAtStart: 70,
    };

    const summary = buildSessionSummary(input);

    expect(summary).not.toContain('Kişisel rekorlar');
  });
});
