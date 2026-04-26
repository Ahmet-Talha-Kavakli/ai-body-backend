/**
 * useTrackingSession
 *
 * Central state machine for the live tracking screen. Owns:
 *   - phase machine (idle/countdown/tracking/paused/finished)
 *   - foreground watchPositionAsync subscription
 *   - SQLite buffering of samples (batched flush every 10s)
 *   - derived metrics (distance, pace, speed)
 *
 * UI layer is responsible for transitioning phase from 'countdown' → 'tracking'
 * after the 3..2..1 visual completes.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import * as Location from 'expo-location';
import * as Haptics from 'expo-haptics';
import * as Buffer from '../lib/tracking/sessionBuffer';
import {
  totalDistanceKm,
  paceSecPerKm,
  avgSpeedKmh,
  maxSpeedKmh,
} from '../lib/tracking/sessionMetrics';

export type Phase = 'idle' | 'countdown' | 'tracking' | 'paused' | 'finished';

export interface Sample {
  latitude: number;
  longitude: number;
  t: number; // seconds since session start
}

export interface UseTrackingSessionOpts {
  activityType: 'running' | 'walking' | 'cycling';
  routeId?: string;
  plannedRoute?: { latitude: number; longitude: number }[];
}

export function useTrackingSession(opts: UseTrackingSessionOpts) {
  const [phase, setPhase] = useState<Phase>('idle');
  const [samples, setSamples] = useState<Sample[]>([]);
  const [elapsed, setElapsed] = useState(0);
  const [lastCoord, setLastCoord] = useState<{
    latitude: number;
    longitude: number;
    heading: number | null;
  } | null>(null);

  const sessionIdRef = useRef<string | null>(null);
  const startedAtRef = useRef<number>(0);
  const watchRef = useRef<Location.LocationSubscription | null>(null);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const flushRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pendingFlushRef = useRef<Omit<Buffer.SampleRow, 'sessionId'>[]>([]);

  // Init DB once
  useEffect(() => {
    Buffer.init().catch(() => {});
  }, []);

  const start = useCallback(async () => {
    setPhase('countdown');
  }, []);

  // Watcher lifecycle: starts when phase transitions to 'tracking',
  // tears down when leaving 'tracking' (paused/finished/idle).
  useEffect(() => {
    if (phase !== 'tracking') return;
    let cancelled = false;

    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setPhase('idle');
        return;
      }

      // First-time start in this session: create buffer row + record startedAt.
      // On resume from pause, sessionIdRef is already set — keep it.
      if (!sessionIdRef.current) {
        const id = `s_${Date.now()}`;
        sessionIdRef.current = id;
        startedAtRef.current = Date.now();
        try {
          await Buffer.startSession({
            id,
            routeId: opts.routeId ?? null,
            activityType: opts.activityType,
            startedAt: startedAtRef.current,
          });
        } catch {
          // continue — buffer is best-effort during dev
        }
      }

      tickRef.current = setInterval(() => {
        setElapsed(Math.floor((Date.now() - startedAtRef.current) / 1000));
      }, 1000);

      flushRef.current = setInterval(() => {
        if (pendingFlushRef.current.length === 0) return;
        const id = sessionIdRef.current;
        if (!id) return;
        const batch = pendingFlushRef.current;
        pendingFlushRef.current = [];
        Buffer.appendSamples(id, batch).catch(() => {
          pendingFlushRef.current.unshift(...batch);
        });
      }, 10_000);

      const sub = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.BestForNavigation,
          timeInterval: 1000,
          distanceInterval: 2,
        },
        (loc) => {
          if (cancelled) return;
          const t = Math.floor((loc.timestamp - startedAtRef.current) / 1000);
          const next: Sample = {
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
            t,
          };
          setSamples((prev) => filterSpurious(prev, next, loc.coords.accuracy ?? 100));
          setLastCoord({
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
            heading:
              loc.coords.heading != null && loc.coords.heading >= 0 ? loc.coords.heading : null,
          });
          pendingFlushRef.current.push({
            t: loc.timestamp,
            lat: loc.coords.latitude,
            lng: loc.coords.longitude,
            alt: loc.coords.altitude ?? null,
            speed: loc.coords.speed ?? null,
            heading: loc.coords.heading ?? null,
            accuracy: loc.coords.accuracy ?? null,
            steps: null,
          });
        },
      );
      watchRef.current = sub;
    })();

    return () => {
      cancelled = true;
      watchRef.current?.remove();
      watchRef.current = null;
      if (tickRef.current) {
        clearInterval(tickRef.current);
        tickRef.current = null;
      }
      if (flushRef.current) {
        clearInterval(flushRef.current);
        flushRef.current = null;
      }
    };
  }, [phase, opts.activityType, opts.routeId]);

  const pause = useCallback(() => {
    watchRef.current?.remove();
    watchRef.current = null;
    if (tickRef.current) {
      clearInterval(tickRef.current);
      tickRef.current = null;
    }
    setPhase('paused');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
  }, []);

  const resume = useCallback(() => {
    setPhase('tracking');
  }, []);

  const finish = useCallback(async () => {
    watchRef.current?.remove();
    watchRef.current = null;
    if (tickRef.current) {
      clearInterval(tickRef.current);
      tickRef.current = null;
    }
    if (flushRef.current) {
      clearInterval(flushRef.current);
      flushRef.current = null;
    }
    const id = sessionIdRef.current;
    if (id && pendingFlushRef.current.length > 0) {
      try {
        await Buffer.appendSamples(id, pendingFlushRef.current);
      } catch {}
      pendingFlushRef.current = [];
    }
    if (id) {
      try {
        await Buffer.endSession(id, 'completed');
      } catch {}
    }
    setPhase('finished');
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
  }, []);

  return {
    phase,
    setPhase,
    samples,
    elapsed,
    lastCoord,
    distanceKm: totalDistanceKm(samples),
    paceSecPerKm: paceSecPerKm(samples),
    avgSpeedKmh: avgSpeedKmh(samples),
    maxSpeedKmh: maxSpeedKmh(samples),
    sessionId: sessionIdRef.current,
    startedAt: startedAtRef.current,
    start,
    pause,
    resume,
    finish,
  };
}

/**
 * Drop "teleport" samples — large jumps with weak GPS accuracy are almost
 * always tower-handover artifacts. Keep when accuracy is decent (≤30m).
 */
function filterSpurious(prev: Sample[], next: Sample, accuracy: number): Sample[] {
  if (prev.length === 0) return [next];
  const last = prev[prev.length - 1]!;
  // Rough km approximation (1 deg lat ≈ 111 km). Cheap test, not exact.
  const dKm = Math.hypot(next.latitude - last.latitude, next.longitude - last.longitude) * 111;
  if (dKm > 0.1 && accuracy > 30) return prev;
  return [...prev, next];
}
