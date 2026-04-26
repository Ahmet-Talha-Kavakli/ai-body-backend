/**
 * backgroundTask.ts
 *
 * Registers an `expo-task-manager` task that receives location updates
 * while the app is backgrounded and writes them to the SQLite session
 * buffer. The active session id is persisted in AsyncStorage so the
 * task (which runs in a fresh JS context) can look it up.
 *
 * iOS-only path. Android background location is out of scope.
 */

import * as TaskManager from 'expo-task-manager';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Buffer from './sessionBuffer';

export const BG_TASK_NAME = 'fitai-bg-location';
const ACTIVE_SESSION_KEY = 'fitai_active_session_id';

export async function setActiveSessionId(id: string | null) {
  if (id) await AsyncStorage.setItem(ACTIVE_SESSION_KEY, id);
  else await AsyncStorage.removeItem(ACTIVE_SESSION_KEY);
}

export async function getActiveSessionId() {
  return AsyncStorage.getItem(ACTIVE_SESSION_KEY);
}

TaskManager.defineTask(BG_TASK_NAME, async ({ data, error }) => {
  if (error) return;
  const { locations } = (data as { locations?: Location.LocationObject[] }) || {};
  if (!locations || locations.length === 0) return;
  const sessionId = await getActiveSessionId();
  if (!sessionId) return;
  try {
    await Buffer.init();
    await Buffer.appendSamples(
      sessionId,
      locations.map((l) => ({
        t: l.timestamp,
        lat: l.coords.latitude,
        lng: l.coords.longitude,
        alt: l.coords.altitude ?? null,
        speed: l.coords.speed ?? null,
        heading: l.coords.heading ?? null,
        accuracy: l.coords.accuracy ?? null,
        steps: null,
      })),
    );
  } catch {
    // best-effort: swallow to avoid crashing the background task
  }
});

export async function startBackground(sessionId: string) {
  await setActiveSessionId(sessionId);
  await Location.startLocationUpdatesAsync(BG_TASK_NAME, {
    accuracy: Location.Accuracy.BestForNavigation,
    timeInterval: 2000,
    distanceInterval: 5,
    showsBackgroundLocationIndicator: true,
    pausesUpdatesAutomatically: false,
    activityType: Location.ActivityType.Fitness,
  });
}

export async function stopBackground() {
  await setActiveSessionId(null);
  const has = await Location.hasStartedLocationUpdatesAsync(BG_TASK_NAME).catch(() => false);
  if (has) {
    try {
      await Location.stopLocationUpdatesAsync(BG_TASK_NAME);
    } catch {
      // ignore
    }
  }
}
