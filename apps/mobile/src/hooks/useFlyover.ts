/**
 * useFlyover — bearing-aligned cinematic camera chain over a saved trace.
 *
 * Phases:
 *   A) Overview fitToCoords (1.2s)
 *   B) Drop into start with pitch + bearing aligned to first segment (1.2s)
 *   C) Glide along the route with per-segment bearing (totalSec)
 *   D) Zoom out to overview (1s)
 *
 * Uses simplify (Douglas–Peucker) + downsample to keep anchor count modest
 * (target ~totalSec×6, capped 20–60).
 */

import { useCallback } from 'react';
import type { MapboxRouteViewRef } from '../../components/maps/MapboxRouteView';
import { simplify, type Pt } from '../lib/tracking/polyline';

export interface FlyoverOpts {
  pitch?: number;
  totalSec?: number;
  zoom?: number;
}

export function useFlyover() {
  const run = useCallback(async (map: MapboxRouteViewRef, coords: Pt[], opts: FlyoverOpts = {}) => {
    if (coords.length < 2) return;
    const pitch = opts.pitch ?? 60;
    const totalSec = opts.totalSec ?? 8;
    const zoom = opts.zoom ?? 17;

    const sampled = simplify(coords, 0.00005);
    const target = Math.max(20, Math.min(60, Math.round(totalSec * 6)));
    const points = downsample(sampled, target);
    if (points.length < 2) return;

    // Phase A: overview, 1.2s
    map.fitToCoords(coords, 80);
    await sleep(1200);

    // Phase B: drop into start with pitch + bearing
    const start = points[0]!;
    const heading0 = bearingDeg(start, points[1]!);
    map.setCameraDetailed({
      centerCoordinate: [start.longitude, start.latitude],
      zoomLevel: zoom,
      pitch,
      bearing: heading0,
      animationDuration: 1200,
      animationMode: 'easeTo',
    });
    await sleep(1200);

    // Phase C: glide along route with per-segment bearing
    const segMs = (totalSec * 1000) / (points.length - 1);
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1]!;
      const curr = points[i]!;
      const heading = bearingDeg(prev, curr);
      map.setCameraDetailed({
        centerCoordinate: [curr.longitude, curr.latitude],
        zoomLevel: zoom,
        pitch,
        bearing: heading,
        animationDuration: Math.round(segMs),
        animationMode: 'linearTo',
      });
      await sleep(segMs);
    }

    // Phase D: zoom out to overview
    const mid = coords[Math.floor(coords.length / 2)]!;
    map.setCameraDetailed({
      centerCoordinate: [mid.longitude, mid.latitude],
      pitch: 0,
      animationDuration: 1000,
      animationMode: 'easeTo',
    });
    await sleep(1000);
    map.fitToCoords(coords, 80);
  }, []);
  return { run };
}

function downsample(coords: Pt[], n: number): Pt[] {
  if (coords.length <= n) return coords;
  const step = (coords.length - 1) / (n - 1);
  return Array.from({ length: n }, (_, i) => coords[Math.round(i * step)]!);
}

function bearingDeg(a: Pt, b: Pt): number {
  const phi1 = (a.latitude * Math.PI) / 180;
  const phi2 = (b.latitude * Math.PI) / 180;
  const dLambda = ((b.longitude - a.longitude) * Math.PI) / 180;
  const y = Math.sin(dLambda) * Math.cos(phi2);
  const x = Math.cos(phi1) * Math.sin(phi2) - Math.sin(phi1) * Math.cos(phi2) * Math.cos(dLambda);
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
