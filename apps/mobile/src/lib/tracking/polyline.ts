export interface Pt {
  latitude: number;
  longitude: number;
}

export function encodePolyline(coords: Pt[]): string {
  let lat = 0;
  let lng = 0;
  let out = '';
  for (const c of coords) {
    const cLat = Math.round(c.latitude * 1e5);
    const cLng = Math.round(c.longitude * 1e5);
    out += enc(cLat - lat) + enc(cLng - lng);
    lat = cLat;
    lng = cLng;
  }
  return out;
}

function enc(value: number): string {
  let v = value < 0 ? ~(value << 1) : value << 1;
  let out = '';
  while (v >= 0x20) {
    out += String.fromCharCode((0x20 | (v & 0x1f)) + 63);
    v >>>= 5;
  }
  out += String.fromCharCode(v + 63);
  return out;
}

export function decodePolyline(str: string): Pt[] {
  const out: Pt[] = [];
  let i = 0;
  let lat = 0;
  let lng = 0;
  while (i < str.length) {
    let res = 0;
    let shift = 0;
    let b = 0;
    do {
      b = str.charCodeAt(i++) - 63;
      res |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    lat += res & 1 ? ~(res >> 1) : res >> 1;
    res = 0;
    shift = 0;
    do {
      b = str.charCodeAt(i++) - 63;
      res |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    lng += res & 1 ? ~(res >> 1) : res >> 1;
    out.push({ latitude: lat / 1e5, longitude: lng / 1e5 });
  }
  return out;
}

export function simplify(coords: Pt[], epsilon: number): Pt[] {
  if (coords.length < 3) return coords;
  const stack: [number, number][] = [[0, coords.length - 1]];
  const keep = new Array(coords.length).fill(false);
  keep[0] = true;
  keep[coords.length - 1] = true;
  while (stack.length) {
    const [s, e] = stack.pop()!;
    let maxD = 0;
    let idx = -1;
    for (let i = s + 1; i < e; i++) {
      const d = perpDistance(coords[i], coords[s], coords[e]);
      if (d > maxD) {
        maxD = d;
        idx = i;
      }
    }
    if (maxD > epsilon && idx !== -1) {
      keep[idx] = true;
      stack.push([s, idx], [idx, e]);
    }
  }
  return coords.filter((_, i) => keep[i]);
}

function perpDistance(p: Pt, a: Pt, b: Pt): number {
  const dx = b.longitude - a.longitude;
  const dy = b.latitude - a.latitude;
  if (dx === 0 && dy === 0) {
    return Math.hypot(p.latitude - a.latitude, p.longitude - a.longitude);
  }
  const t =
    ((p.longitude - a.longitude) * dx + (p.latitude - a.latitude) * dy) / (dx * dx + dy * dy);
  const tc = Math.max(0, Math.min(1, t));
  const cx = a.longitude + tc * dx;
  const cy = a.latitude + tc * dy;
  return Math.hypot(p.latitude - cy, p.longitude - cx);
}
