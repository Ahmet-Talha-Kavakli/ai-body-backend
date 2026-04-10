export interface ReadinessInputs {
  sleepHours: number;
  hrvDelta: number | null; // ratio above/below personal 30-day average (-1 to +1)
  sessionFatigue: number; // 0-1 (load from last 48 hours relative to personal max)
  stressLevel: number; // 1-10 (from DailyMetrics.stressLevel)
  proteinRatio: number; // 0-1 (actual protein / target)
  activeInjuries: number; // count of active injuries
}

function normalizeSleep(hours: number): number {
  if (hours < 5) return 0.2;
  if (hours < 6) return 0.5;
  if (hours < 7) return 0.7;
  if (hours <= 8) return 1.0;
  return 1.0;
}

function normalizeHRV(delta: number | null): number {
  if (delta === null) return 0.5; // no wearable → neutral
  // -0.2 → 0.25, 0 → 0.5, +0.1 → 1.0 (if delta >= 0.1, treat as perfect)
  if (delta >= 0.1) return 1.0;
  return Math.min(1, Math.max(0, 0.5 + delta * 2.5));
}

function normalizeFatigue(fatigue: number): number {
  return 1 - fatigue; // high fatigue = low score
}

function normalizeStress(level: number): number {
  // 1=0.9, 5=0.5, 10=0.0 (clamp to 0-1)
  return Math.min(1, Math.max(0, (10 - level) / 10));
}

function normalizeProtein(ratio: number): number {
  return Math.min(1, ratio);
}

function normalizeInjuries(count: number): number {
  if (count === 0) return 1.0;
  if (count === 1) return 0.8;
  if (count === 2) return 0.5;
  return 0.3;
}

export function calculateReadinessScore(inputs: ReadinessInputs): number {
  const components = {
    sleep: normalizeSleep(inputs.sleepHours) * 0.3,
    hrv: normalizeHRV(inputs.hrvDelta) * 0.2,
    fatigue: normalizeFatigue(inputs.sessionFatigue) * 0.2,
    stress: normalizeStress(inputs.stressLevel) * 0.15,
    nutrition: normalizeProtein(inputs.proteinRatio) * 0.1,
    injuries: normalizeInjuries(inputs.activeInjuries) * 0.05,
  };

  const raw = Object.values(components).reduce((a, b) => a + b, 0);
  return Math.round(Math.min(100, Math.max(0, raw * 100)));
}
