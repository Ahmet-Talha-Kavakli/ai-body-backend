export interface Sample {
  latitude: number;
  longitude: number;
  t: number;
}

export function haversineKm(a: Sample, b: Sample): number {
  const R = 6371;
  const dLat = ((b.latitude - a.latitude) * Math.PI) / 180;
  const dLon = ((b.longitude - a.longitude) * Math.PI) / 180;
  const lat1 = (a.latitude * Math.PI) / 180;
  const lat2 = (b.latitude * Math.PI) / 180;
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

export function totalDistanceKm(pts: Sample[]): number {
  if (pts.length < 2) return 0;
  let d = 0;
  for (let i = 1; i < pts.length; i++) d += haversineKm(pts[i - 1], pts[i]);
  return d;
}

export function paceSecPerKm(pts: Sample[]): number {
  if (pts.length < 2) return 0;
  const km = totalDistanceKm(pts);
  if (km < 0.001) return 0;
  const elapsedSec = pts[pts.length - 1].t - pts[0].t;
  return elapsedSec / km;
}

export function avgSpeedKmh(pts: Sample[]): number {
  if (pts.length < 2) return 0;
  const km = totalDistanceKm(pts);
  const hours = (pts[pts.length - 1].t - pts[0].t) / 3600;
  return hours > 0 ? km / hours : 0;
}

export function maxSpeedKmh(pts: Sample[]): number {
  let max = 0;
  for (let i = 1; i < pts.length; i++) {
    const dKm = haversineKm(pts[i - 1], pts[i]);
    const dt = (pts[i].t - pts[i - 1].t) / 3600;
    if (dt > 0) {
      const speed = dKm / dt;
      if (speed > max && speed < 250) max = speed;
    }
  }
  return max;
}

export interface Split {
  km: number;
  durationSec: number;
  paceSecPerKm: number;
}

export function splitsPerKm(pts: Sample[]): Split[] {
  const splits: Split[] = [];
  if (pts.length < 2) return splits;
  let lastKm = 0;
  let lastT = pts[0].t;
  let cumKm = 0;
  for (let i = 1; i < pts.length; i++) {
    cumKm += haversineKm(pts[i - 1], pts[i]);
    while (cumKm >= lastKm + 1) {
      const dur = pts[i].t - lastT;
      splits.push({ km: lastKm + 1, durationSec: dur, paceSecPerKm: dur });
      lastKm += 1;
      lastT = pts[i].t;
    }
  }
  return splits;
}
