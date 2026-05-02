/**
 * HealthKit servisi — sadece iOS, asistan için günlük snapshot toplar.
 * Backend'e sync eder.
 */

import { Platform } from 'react-native';
// eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-explicit-any
const AppleHealthKit =
  Platform.OS === 'ios' ? (require('react-native-health') as any).default : null;

export const HEALTH_PERMISSIONS = AppleHealthKit
  ? {
      permissions: {
        read: [
          AppleHealthKit.Constants.Permissions.Steps,
          AppleHealthKit.Constants.Permissions.ActiveEnergyBurned,
          AppleHealthKit.Constants.Permissions.BasalEnergyBurned,
          AppleHealthKit.Constants.Permissions.AppleExerciseTime,
          AppleHealthKit.Constants.Permissions.AppleStandTime,
          AppleHealthKit.Constants.Permissions.DistanceWalkingRunning,
          AppleHealthKit.Constants.Permissions.FlightsClimbed,
          AppleHealthKit.Constants.Permissions.HeartRate,
          AppleHealthKit.Constants.Permissions.RestingHeartRate,
          AppleHealthKit.Constants.Permissions.HeartRateVariability,
          AppleHealthKit.Constants.Permissions.SleepAnalysis,
          AppleHealthKit.Constants.Permissions.Weight,
          AppleHealthKit.Constants.Permissions.BodyFatPercentage,
        ],
        write: [],
      },
    }
  : null;

export async function requestHealthKitAuth(): Promise<boolean> {
  if (!AppleHealthKit || !HEALTH_PERMISSIONS) return false;
  return new Promise((resolve) => {
    AppleHealthKit.initHealthKit(HEALTH_PERMISSIONS, (err: string | null) => {
      if (err) {
        console.error('[healthkit/init]', err);
        resolve(false);
        return;
      }
      resolve(true);
    });
  });
}

export interface DailySnapshot {
  date: string; // YYYY-MM-DD
  steps?: number;
  activeKcal?: number;
  restingKcal?: number;
  exerciseMinutes?: number;
  standHours?: number;
  distanceKm?: number;
  flightsClimbed?: number;
  heartRateAvg?: number;
  heartRateMin?: number;
  heartRateMax?: number;
  restingHR?: number;
  hrvSdnn?: number;
  sleepMinutes?: number;
  sleepDeepMin?: number;
  sleepRemMin?: number;
  weightKg?: number;
  bodyFatPct?: number;
}

function ymd(d: Date): string {
  return d.toISOString().slice(0, 10);
}

async function getSampleSum(
  method: string,
  startDate: Date,
  endDate: Date,
): Promise<number | undefined> {
  if (!AppleHealthKit) return undefined;
  return new Promise((resolve) => {
    const fn = AppleHealthKit[method];
    if (typeof fn !== 'function') {
      resolve(undefined);
      return;
    }
    fn(
      { startDate: startDate.toISOString(), endDate: endDate.toISOString() },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (err: string | null, results: any) => {
        if (err) {
          resolve(undefined);
          return;
        }
        // Bazı API'ler {value} döner, bazıları array
        if (Array.isArray(results)) {
          const sum = results.reduce((acc, r) => acc + (r.value ?? 0), 0);
          resolve(sum);
        } else if (results && typeof results.value === 'number') {
          resolve(results.value);
        } else {
          resolve(undefined);
        }
      },
    );
  });
}

/**
 * Son N gün için günlük snapshot'ları topla.
 */
export async function collectRecentSnapshots(daysBack = 7): Promise<DailySnapshot[]> {
  if (!AppleHealthKit) return [];

  const snapshots: DailySnapshot[] = [];
  const now = new Date();
  for (let i = 0; i < daysBack; i++) {
    const day = new Date(now);
    day.setDate(now.getDate() - i);
    day.setHours(0, 0, 0, 0);
    const dayEnd = new Date(day);
    dayEnd.setHours(23, 59, 59, 999);

    const [steps, activeKcal, restingKcal, exerciseMin, standH, distKm, flights] =
      await Promise.all([
        getSampleSum('getStepCount', day, dayEnd),
        getSampleSum('getActiveEnergyBurned', day, dayEnd),
        getSampleSum('getBasalEnergyBurned', day, dayEnd),
        getSampleSum('getAppleExerciseTime', day, dayEnd),
        getSampleSum('getAppleStandTime', day, dayEnd),
        getSampleSum('getDistanceWalkingRunning', day, dayEnd),
        getSampleSum('getFlightsClimbed', day, dayEnd),
      ]);

    snapshots.push({
      date: ymd(day),
      steps: steps != null ? Math.round(steps) : undefined,
      activeKcal: activeKcal,
      restingKcal: restingKcal,
      exerciseMinutes: exerciseMin != null ? Math.round(exerciseMin) : undefined,
      standHours: standH != null ? Math.round(standH) : undefined,
      distanceKm: distKm != null ? distKm / 1000 : undefined,
      flightsClimbed: flights != null ? Math.round(flights) : undefined,
    });
  }
  return snapshots;
}

/**
 * Snapshot'ları backend'e push.
 */
export async function syncSnapshotsToBackend(args: {
  apiUrl: string;
  getToken: () => Promise<string | null>;
  snapshots: DailySnapshot[];
}): Promise<{ ok: boolean; upserted?: number }> {
  if (args.snapshots.length === 0) return { ok: true, upserted: 0 };
  try {
    const token = await args.getToken();
    if (!token) return { ok: false };
    const res = await fetch(`${args.apiUrl}/api/assistant/healthkit/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ snapshots: args.snapshots }),
    });
    if (!res.ok) return { ok: false };
    const data = await res.json();
    return { ok: true, upserted: data.upserted };
  } catch (e) {
    console.error('[healthkit/sync]', e);
    return { ok: false };
  }
}

/**
 * Tek seferlik: izin + 7 gün veri + sync.
 */
export async function runFullHealthKitSync(args: {
  apiUrl: string;
  getToken: () => Promise<string | null>;
}): Promise<{ ok: boolean; daysSynced?: number }> {
  const granted = await requestHealthKitAuth();
  if (!granted) return { ok: false };
  const snapshots = await collectRecentSnapshots(7);
  const result = await syncSnapshotsToBackend({ ...args, snapshots });
  return { ok: result.ok, daysSynced: result.upserted };
}
