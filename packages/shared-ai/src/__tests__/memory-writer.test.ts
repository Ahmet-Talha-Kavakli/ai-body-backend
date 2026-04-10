import { describe, it, expect } from 'vitest';
import {
  buildSessionSummary,
  buildWeeklySummary,
  SessionSummaryInput,
  WeeklySummaryInput,
} from '../memory-writer';

describe('buildSessionSummary', () => {
  it('builds a concise session summary with pipe-separated format', () => {
    const input: SessionSummaryInput = {
      exercises: ['squat', 'bench press', 'deadlift'],
      avgFormScore: 85,
      totalVolume: 5000,
      duration: 60,
      personalRecords: [],
      readinessAtStart: 75,
    };

    const summary = buildSessionSummary(input);

    expect(summary).toContain('Seans: squat, bench press, deadlift');
    expect(summary).toContain('60 dakika');
    expect(summary).toContain('Form: 85/100');
    expect(summary).toContain('Hacim: 5000kg');
    expect(summary).toContain('Hazırlık: 75/100');
  });

  it('truncates exercises list when more than 3', () => {
    const input: SessionSummaryInput = {
      exercises: ['squat', 'bench press', 'deadlift', 'leg press', 'pull up'],
      avgFormScore: 85,
      totalVolume: 5000,
      duration: 60,
      personalRecords: [],
      readinessAtStart: 75,
    };

    const summary = buildSessionSummary(input);

    expect(summary).toContain('squat, bench press, deadlift +2');
  });

  it('includes first personal record when present', () => {
    const input: SessionSummaryInput = {
      exercises: ['deadlift'],
      avgFormScore: 90,
      totalVolume: 2000,
      duration: 45,
      personalRecords: ['deadlift: 200kg', 'deadlift reps: 5'],
      readinessAtStart: 85,
    };

    const summary = buildSessionSummary(input);

    expect(summary).toContain('kişisel rekor: deadlift: 200kg');
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

    expect(summary).not.toContain('kişisel rekor');
  });

  it('respects 480 character limit', () => {
    const input: SessionSummaryInput = {
      exercises: ['x'.repeat(100), 'y'.repeat(100), 'z'.repeat(100)],
      avgFormScore: 85,
      totalVolume: 5000,
      duration: 60,
      personalRecords: [],
      readinessAtStart: 75,
    };

    const summary = buildSessionSummary(input);

    expect(summary.length).toBeLessThanOrEqual(480);
  });
});

describe('buildWeeklySummary', () => {
  it('builds a concise weekly summary with pipe-separated format', () => {
    const input: WeeklySummaryInput = {
      sessionsCompleted: 4,
      avgFormScore: 82,
      avgReadiness: 78,
      totalVolume: 18000,
      muscleGroupsWorked: ['chest', 'back', 'legs', 'shoulders', 'arms'],
      weekNumber: 1,
    };

    const summary = buildWeeklySummary(input);

    expect(summary).toContain('Hafta 1:');
    expect(summary).toContain('4 seans');
    expect(summary).toContain('ort. form 82/100');
    expect(summary).toContain('ort. hazırlık 78/100');
    expect(summary).toContain('toplam hacim 18000kg');
    expect(summary).toContain('çalışılan kaslar: chest, back, legs, shoulders');
  });

  it('truncates muscle groups list when more than 4', () => {
    const input: WeeklySummaryInput = {
      sessionsCompleted: 5,
      avgFormScore: 85,
      avgReadiness: 82,
      totalVolume: 20000,
      muscleGroupsWorked: ['chest', 'back', 'legs', 'shoulders', 'arms', 'core', 'neck'],
      weekNumber: 2,
    };

    const summary = buildWeeklySummary(input);

    expect(summary).toContain('chest, back, legs, shoulders');
    expect(summary).not.toContain('arms');
  });

  it('respects 480 character limit', () => {
    const input: WeeklySummaryInput = {
      sessionsCompleted: 7,
      avgFormScore: 90,
      avgReadiness: 88,
      totalVolume: 35000,
      muscleGroupsWorked: Array(20).fill('verylongmusclename'),
      weekNumber: 52,
    };

    const summary = buildWeeklySummary(input);

    expect(summary.length).toBeLessThanOrEqual(480);
  });
});
