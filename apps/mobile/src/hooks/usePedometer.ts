/**
 * usePedometer
 *
 * Wraps expo-sensors Pedometer with a foreground watcher that accumulates
 * step deltas while `active` is true. Returns the running step count.
 *
 * iOS-only path. Pedometer should only be enabled for foot activities
 * (running/walking) — never cycling.
 */

import { useEffect, useState } from 'react';
import { Pedometer } from 'expo-sensors';

export function usePedometer(active: boolean, startedAt: number | null) {
  const [steps, setSteps] = useState(0);

  useEffect(() => {
    if (!active || !startedAt) return;
    let sub: { remove: () => void } | null = null;
    let cancelled = false;
    (async () => {
      const ok = await Pedometer.isAvailableAsync().catch(() => false);
      if (!ok || cancelled) return;
      sub = Pedometer.watchStepCount(({ steps: delta }) => {
        if (cancelled) return;
        setSteps((prev) => prev + delta);
      });
    })();
    return () => {
      cancelled = true;
      sub?.remove();
    };
  }, [active, startedAt]);

  return steps;
}
