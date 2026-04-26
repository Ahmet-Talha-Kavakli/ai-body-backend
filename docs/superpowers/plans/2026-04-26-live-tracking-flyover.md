# Live Tracking + Cinematic Flyover + Share Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Strava-style live GPS tracking that records the user's run/ride/walk in real time, persists locally during the session, syncs to backend on completion, plays a cinematic flyover replay of the route, and lets the user share that replay as a downloadable video.

**Architecture:** Three layers.

1. **Tracking layer** — `expo-location` foreground + `expo-task-manager` background updates write to a local SQLite-backed buffer (`fitai_session_buffer`). Pedometer (foot activities) and speed metrics (cycling) feed live UI.
2. **Persistence layer** — On finish: encode polyline → POST `/api/tracking/sessions` to Supabase (one row + compressed geometry). Local buffer kept until server returns 200; queued retry if offline.
3. **Replay layer** — Mapbox `setCamera` chain animates the saved trace at pitch ≥ 60° with bearing aligned to the route tangent; `react-native-view-shot` + `react-native-skia` records the flyover frames into an MP4 via `expo-av` recording, exposed via `expo-sharing`.

A "Recording in progress" banner on the Home tab shows live stats while the app is backgrounded. (iOS home-screen WidgetKit widget deferred — requires paid Apple Developer account.)

**Tech Stack:**

- `expo-location` (foreground + background tasks)
- `expo-task-manager` (background location task)
- `expo-sensors` (Pedometer)
- `@rnmapbox/maps` 10.3 (3D camera)
- `expo-sqlite` (session buffer)
- `react-native-view-shot` + `expo-media-library` + `expo-av` (replay capture)
- `expo-sharing` (share sheet)
- Native iOS WidgetKit extension (Swift) for home-screen widget
- Prisma + Supabase Postgres for backend persistence

---

## Scope Note

This plan delivers **the full feature** in one sequenced track because each piece depends on the previous (you cannot build the share button without flyover, you cannot test sync without local buffer, etc.). Break points for separate commits/PRs are at the end of each Chunk; an engineer can stop after any chunk and ship working partial value:

- After **Chunk 1** → free-run + planned-route foreground tracking saves locally.
- After **Chunk 2** → background tracking + pause/resume work; battery-friendly.
- After **Chunk 3** → flyover plays cinematic replay.
- After **Chunk 4** → backend sync + offline queue (transparent, no manual button).
- After **Chunk 5** → share/download replay as video.
- After **Chunk 6** → home tab "recording in progress" banner.

---

## File Structure (where every change lives)

### New files

- `apps/mobile/src/lib/tracking/sessionBuffer.ts` — SQLite buffer (write/read/clear samples)
- `apps/mobile/src/lib/tracking/sessionMetrics.ts` — pure metric calculators (distance, pace, splits, hr-zones-stub)
- `apps/mobile/src/lib/tracking/backgroundTask.ts` — `defineTask` for `expo-task-manager`
- `apps/mobile/src/lib/tracking/polyline.ts` — encode/decode polyline (Google's algorithm), simplification
- `apps/mobile/src/lib/tracking/syncQueue.ts` — POST sessions, retry, offline queue
- `apps/mobile/src/hooks/useSyncOnConnect.ts` — auto-flush on AppState 'active' + NetInfo connectivity restore
- `apps/mobile/components/tracking/SyncIndicator.tsx` — silent micro-pill (Senkron ediliyor / Senkronize ✓)
- `apps/mobile/src/hooks/useTrackingSession.ts` — central state machine for tracking screen
- `apps/mobile/src/hooks/usePedometer.ts` — wrap `expo-sensors` Pedometer with foreground + watch
- `apps/mobile/src/hooks/useFlyover.ts` — drives Mapbox camera chain
- `apps/mobile/src/lib/tracking/flyoverRecorder.ts` — captures flyover frames → mp4
- `apps/mobile/components/tracking/StatsPanel.tsx` — bottom stats card (split into its own component)
- `apps/mobile/components/tracking/FlyoverOverlay.tsx` — already inline; extracted
- `apps/mobile/components/tracking/RecordingBanner.tsx` — Home tab "recording in progress" banner
- `apps/mobile/components/tracking/ShareSheet.tsx` — share modal with Save/Share/Instagram-Story actions
- `apps/web/app/api/tracking/sessions/route.ts` — POST/GET endpoint
- `apps/web/app/api/tracking/sessions/[id]/route.ts` — GET single

### Modified files

- `apps/mobile/app/(app)/tracking/rota-takip.tsx` — refactor to use `useTrackingSession` hook + add free-run support
- `apps/mobile/app/(app)/tracking/rota-detay.tsx` — "Rotayı Kullan" + "Free Run Başlat" buttons
- `apps/mobile/app/(app)/tracking/aktivite.tsx` — entry point for free-run from activity quick-start
- `apps/mobile/app/(app)/home.tsx` — mount `<RecordingBanner />`
- `apps/mobile/components/maps/MapboxRouteView.tsx` — expose `setCamera` (richer params), expose `traceCoords` prop for live trail polyline
- `apps/mobile/app.json` — add `UIBackgroundModes`, `NSMotionUsageDescription`, App Group entitlement
- `apps/mobile/package.json` — add `expo-task-manager`, `expo-sensors`, `expo-sqlite`, `expo-sharing`, `react-native-view-shot`, `expo-media-library`
- `apps/web/prisma/schema.prisma` — add `TrackingSession`, `TrackingSessionSplit` models

### Test files

- `apps/mobile/src/lib/tracking/__tests__/sessionMetrics.test.ts`
- `apps/mobile/src/lib/tracking/__tests__/polyline.test.ts`
- `apps/mobile/src/lib/tracking/__tests__/syncQueue.test.ts`

---

## Chunk 1: Foreground tracking + free-run mode + local buffer

Goal: rewire `rota-takip.tsx` to support free-run + planned-route, add SQLite buffer, extract pure metric helpers (TDD'd), no behavior regression.

### Task 1.1: Install runtime dependencies

**Files:**

- Modify: `apps/mobile/package.json`

- [ ] **Step 1: Install packages**

```bash
cd apps/mobile
pnpm add expo-task-manager expo-sensors expo-sqlite expo-sharing react-native-view-shot expo-media-library
```

- [ ] **Step 2: Verify peer deps install cleanly**

Run: `pnpm i`
Expected: no `ERR_PNPM_PEER_DEP_ISSUES` blocking errors (warnings ok).

- [ ] **Step 3: Run prebuild + pod install (native modules added)**

```bash
SENTRY_DISABLE_AUTO_UPLOAD=true pnpm expo prebuild --platform ios --clean
cd ios && pod install && cd ..
```

Expected: `Installing CocoaPods... ✔ Installed CocoaPods`.

- [ ] **Step 4: Commit**

```bash
git add apps/mobile/package.json apps/mobile/pnpm-lock.yaml apps/mobile/ios apps/mobile/app.json
git commit -m "feat(tracking): install expo-task-manager, sensors, sqlite, view-shot, sharing"
```

### Task 1.2: Pure metric helpers (TDD)

**Files:**

- Create: `apps/mobile/src/lib/tracking/sessionMetrics.ts`
- Create: `apps/mobile/src/lib/tracking/__tests__/sessionMetrics.test.ts`

- [ ] **Step 1: Write failing tests**

```ts
// __tests__/sessionMetrics.test.ts
import {
  haversineKm,
  totalDistanceKm,
  paceSecPerKm,
  avgSpeedKmh,
  maxSpeedKmh,
  splitsPerKm,
} from '../sessionMetrics'

const A = { latitude: 41.0082, longitude: 28.9784, t: 0 }
const B = { latitude: 41.009, longitude: 28.9784, t: 60 } // ~89m north, 60s
const C = { latitude: 41.0098, longitude: 28.9784, t: 120 } // another ~89m north, 60s

test('haversineKm two known points', () => {
  expect(haversineKm(A, B)).toBeCloseTo(0.0889, 2)
})

test('totalDistanceKm sums segments', () => {
  expect(totalDistanceKm([A, B, C])).toBeCloseTo(0.1778, 2)
})

test('paceSecPerKm', () => {
  // 0.1778 km in 120 s => 674.9 s/km
  expect(paceSecPerKm([A, B, C])).toBeCloseTo(675, 0)
})

test('avgSpeedKmh', () => {
  // 0.1778 km in 120s => 5.33 km/h
  expect(avgSpeedKmh([A, B, C])).toBeCloseTo(5.33, 1)
})

test('maxSpeedKmh picks fastest segment', () => {
  const fast = { latitude: 41.011, longitude: 28.9784, t: 130 } // 133m in 10s
  expect(maxSpeedKmh([A, B, C, fast])).toBeGreaterThan(40)
})

test('splitsPerKm returns one entry per completed km', () => {
  const points = []
  for (let i = 0; i <= 100; i++) {
    points.push({ latitude: 41.0082 + i * 0.0002, longitude: 28.9784, t: i * 30 })
  }
  const splits = splitsPerKm(points)
  expect(splits.length).toBeGreaterThanOrEqual(2)
  expect(splits[0].km).toBe(1)
})
```

- [ ] **Step 2: Run failing test**

Run: `pnpm --filter mobile test sessionMetrics`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `sessionMetrics.ts`**

```ts
export interface Sample {
  latitude: number
  longitude: number
  t: number /* sec since session start */
}

export function haversineKm(a: Sample, b: Sample): number {
  const R = 6371
  const dLat = ((b.latitude - a.latitude) * Math.PI) / 180
  const dLon = ((b.longitude - a.longitude) * Math.PI) / 180
  const lat1 = (a.latitude * Math.PI) / 180
  const lat2 = (b.latitude * Math.PI) / 180
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x))
}

export function totalDistanceKm(pts: Sample[]): number {
  let d = 0
  for (let i = 1; i < pts.length; i++) d += haversineKm(pts[i - 1], pts[i])
  return d
}

export function paceSecPerKm(pts: Sample[]): number {
  if (pts.length < 2) return 0
  const km = totalDistanceKm(pts)
  if (km < 0.001) return 0
  const elapsedSec = pts[pts.length - 1].t - pts[0].t
  return elapsedSec / km
}

export function avgSpeedKmh(pts: Sample[]): number {
  if (pts.length < 2) return 0
  const km = totalDistanceKm(pts)
  const hours = (pts[pts.length - 1].t - pts[0].t) / 3600
  return hours > 0 ? km / hours : 0
}

export function maxSpeedKmh(pts: Sample[]): number {
  let max = 0
  for (let i = 1; i < pts.length; i++) {
    const dKm = haversineKm(pts[i - 1], pts[i])
    const dt = (pts[i].t - pts[i - 1].t) / 3600
    if (dt > 0) {
      const speed = dKm / dt
      if (speed > max && speed < 250) max = speed // sanity cap (250 km/h)
    }
  }
  return max
}

export interface Split {
  km: number
  durationSec: number
  paceSecPerKm: number
}

export function splitsPerKm(pts: Sample[]): Split[] {
  const splits: Split[] = []
  let lastKm = 0
  let lastT = pts[0]?.t ?? 0
  let cumKm = 0
  for (let i = 1; i < pts.length; i++) {
    cumKm += haversineKm(pts[i - 1], pts[i])
    while (cumKm >= lastKm + 1) {
      const dur = pts[i].t - lastT
      splits.push({ km: lastKm + 1, durationSec: dur, paceSecPerKm: dur })
      lastKm += 1
      lastT = pts[i].t
    }
  }
  return splits
}
```

- [ ] **Step 4: Run test, verify pass**

Run: `pnpm --filter mobile test sessionMetrics`
Expected: PASS — all 6 tests green.

- [ ] **Step 5: Commit**

```bash
git add apps/mobile/src/lib/tracking/sessionMetrics.ts apps/mobile/src/lib/tracking/__tests__/sessionMetrics.test.ts
git commit -m "feat(tracking): add pure session metric helpers with tests"
```

### Task 1.3: Polyline encode/decode + simplification (TDD)

**Files:**

- Create: `apps/mobile/src/lib/tracking/polyline.ts`
- Create: `apps/mobile/src/lib/tracking/__tests__/polyline.test.ts`

- [ ] **Step 1: Write failing tests**

```ts
import { encodePolyline, decodePolyline, simplify } from '../polyline'

test('encode/decode roundtrip preserves coords within 1e-5', () => {
  const coords = [
    { latitude: 38.5, longitude: -120.2 },
    { latitude: 40.7, longitude: -120.95 },
    { latitude: 43.252, longitude: -126.453 },
  ]
  const encoded = encodePolyline(coords)
  const decoded = decodePolyline(encoded)
  expect(decoded.length).toBe(coords.length)
  decoded.forEach((p, i) => {
    expect(p.latitude).toBeCloseTo(coords[i].latitude, 4)
    expect(p.longitude).toBeCloseTo(coords[i].longitude, 4)
  })
})

test('simplify reduces collinear points', () => {
  const coords = []
  for (let i = 0; i < 100; i++) coords.push({ latitude: 41 + i * 0.001, longitude: 29 })
  const out = simplify(coords, 0.0001)
  expect(out.length).toBeLessThan(20)
  expect(out[0]).toEqual(coords[0])
  expect(out[out.length - 1]).toEqual(coords[coords.length - 1])
})
```

- [ ] **Step 2: Run test, verify FAIL**

Run: `pnpm --filter mobile test polyline`
Expected: FAIL.

- [ ] **Step 3: Implement** — Google polyline algorithm + Douglas–Peucker

```ts
export interface Pt {
  latitude: number
  longitude: number
}

export function encodePolyline(coords: Pt[]): string {
  let lat = 0,
    lng = 0,
    out = ''
  for (const c of coords) {
    const cLat = Math.round(c.latitude * 1e5)
    const cLng = Math.round(c.longitude * 1e5)
    out += enc(cLat - lat) + enc(cLng - lng)
    lat = cLat
    lng = cLng
  }
  return out
}

function enc(v: number): string {
  v = v < 0 ? ~(v << 1) : v << 1
  let out = ''
  while (v >= 0x20) {
    out += String.fromCharCode((0x20 | (v & 0x1f)) + 63)
    v >>= 5
  }
  out += String.fromCharCode(v + 63)
  return out
}

export function decodePolyline(str: string): Pt[] {
  const out: Pt[] = []
  let i = 0,
    lat = 0,
    lng = 0
  while (i < str.length) {
    let res = 0,
      shift = 0,
      b = 0
    do {
      b = str.charCodeAt(i++) - 63
      res |= (b & 0x1f) << shift
      shift += 5
    } while (b >= 0x20)
    lat += res & 1 ? ~(res >> 1) : res >> 1
    res = 0
    shift = 0
    do {
      b = str.charCodeAt(i++) - 63
      res |= (b & 0x1f) << shift
      shift += 5
    } while (b >= 0x20)
    lng += res & 1 ? ~(res >> 1) : res >> 1
    out.push({ latitude: lat / 1e5, longitude: lng / 1e5 })
  }
  return out
}

// Douglas–Peucker
export function simplify(coords: Pt[], epsilon: number): Pt[] {
  if (coords.length < 3) return coords
  const stack: [number, number][] = [[0, coords.length - 1]]
  const keep = new Array(coords.length).fill(false)
  keep[0] = true
  keep[coords.length - 1] = true
  while (stack.length) {
    const [s, e] = stack.pop()!
    let maxD = 0,
      idx = -1
    for (let i = s + 1; i < e; i++) {
      const d = perpDistance(coords[i], coords[s], coords[e])
      if (d > maxD) {
        maxD = d
        idx = i
      }
    }
    if (maxD > epsilon && idx !== -1) {
      keep[idx] = true
      stack.push([s, idx], [idx, e])
    }
  }
  return coords.filter((_, i) => keep[i])
}

function perpDistance(p: Pt, a: Pt, b: Pt): number {
  const dx = b.longitude - a.longitude
  const dy = b.latitude - a.latitude
  if (dx === 0 && dy === 0) return Math.hypot(p.latitude - a.latitude, p.longitude - a.longitude)
  const t =
    ((p.longitude - a.longitude) * dx + (p.latitude - a.latitude) * dy) / (dx * dx + dy * dy)
  const tc = Math.max(0, Math.min(1, t))
  const cx = a.longitude + tc * dx
  const cy = a.latitude + tc * dy
  return Math.hypot(p.latitude - cy, p.longitude - cx)
}
```

- [ ] **Step 4: Run, verify PASS**

Run: `pnpm --filter mobile test polyline`

- [ ] **Step 5: Commit**

```bash
git add apps/mobile/src/lib/tracking/polyline.ts apps/mobile/src/lib/tracking/__tests__/polyline.test.ts
git commit -m "feat(tracking): polyline encode/decode + Douglas-Peucker simplify"
```

### Task 1.4: SQLite session buffer

**Files:**

- Create: `apps/mobile/src/lib/tracking/sessionBuffer.ts`

- [ ] **Step 1: Write skeleton API + types**

```ts
// sessionBuffer.ts
import * as SQLite from 'expo-sqlite'

export interface SampleRow {
  sessionId: string
  t: number // ms since epoch
  lat: number
  lng: number
  alt: number | null
  speed: number | null
  heading: number | null
  accuracy: number | null
  steps: number | null
}

export interface SessionMeta {
  id: string
  routeId: string | null
  activityType: string
  startedAt: number
  endedAt: number | null
  status: 'active' | 'paused' | 'completed' | 'synced'
}

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null

function db() {
  if (!dbPromise) dbPromise = SQLite.openDatabaseAsync('fitai_tracking.db')
  return dbPromise
}

export async function init() {
  const d = await db()
  await d.execAsync(`
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      route_id TEXT,
      activity_type TEXT NOT NULL,
      started_at INTEGER NOT NULL,
      ended_at INTEGER,
      status TEXT NOT NULL DEFAULT 'active'
    );
    CREATE TABLE IF NOT EXISTS samples (
      session_id TEXT NOT NULL,
      t INTEGER NOT NULL,
      lat REAL NOT NULL, lng REAL NOT NULL,
      alt REAL, speed REAL, heading REAL, accuracy REAL,
      steps INTEGER,
      PRIMARY KEY(session_id, t)
    );
    CREATE INDEX IF NOT EXISTS samples_by_session ON samples(session_id);
  `)
}

export async function startSession(meta: Omit<SessionMeta, 'endedAt' | 'status'>) {
  const d = await db()
  await d.runAsync(
    'INSERT INTO sessions (id, route_id, activity_type, started_at, status) VALUES (?, ?, ?, ?, ?)',
    [meta.id, meta.routeId, meta.activityType, meta.startedAt, 'active']
  )
}

export async function appendSamples(sessionId: string, samples: Omit<SampleRow, 'sessionId'>[]) {
  if (samples.length === 0) return
  const d = await db()
  await d.withTransactionAsync(async () => {
    for (const s of samples) {
      await d.runAsync('INSERT OR IGNORE INTO samples VALUES (?,?,?,?,?,?,?,?,?)', [
        sessionId,
        s.t,
        s.lat,
        s.lng,
        s.alt,
        s.speed,
        s.heading,
        s.accuracy,
        s.steps,
      ])
    }
  })
}

export async function getSamples(sessionId: string): Promise<SampleRow[]> {
  const d = await db()
  return await d.getAllAsync<SampleRow>(
    'SELECT * FROM samples WHERE session_id = ? ORDER BY t ASC',
    [sessionId]
  )
}

export async function endSession(sessionId: string, status: 'completed' | 'synced' = 'completed') {
  const d = await db()
  await d.runAsync('UPDATE sessions SET ended_at = ?, status = ? WHERE id = ?', [
    Date.now(),
    status,
    sessionId,
  ])
}

export async function listSessions(): Promise<SessionMeta[]> {
  const d = await db()
  const rows = await d.getAllAsync<any>('SELECT * FROM sessions ORDER BY started_at DESC')
  return rows.map((r) => ({
    id: r.id,
    routeId: r.route_id,
    activityType: r.activity_type,
    startedAt: r.started_at,
    endedAt: r.ended_at,
    status: r.status,
  }))
}

export async function deleteSession(sessionId: string) {
  const d = await db()
  await d.withTransactionAsync(async () => {
    await d.runAsync('DELETE FROM samples WHERE session_id = ?', [sessionId])
    await d.runAsync('DELETE FROM sessions WHERE id = ?', [sessionId])
  })
}
```

- [ ] **Step 2: Manual smoke test from REPL/dev menu**

Add a temporary `__DEV__` button in `app/(showcase)/index.tsx` that calls `init()` then `startSession`/`appendSamples`/`getSamples` and `console.log` results. Verify three samples come back ordered. Remove the button before committing.

- [ ] **Step 3: Commit**

```bash
git add apps/mobile/src/lib/tracking/sessionBuffer.ts
git commit -m "feat(tracking): SQLite session+samples buffer"
```

### Task 1.5: `useTrackingSession` hook (replaces inline state in `rota-takip.tsx`)

**Files:**

- Create: `apps/mobile/src/hooks/useTrackingSession.ts`

The hook owns: phase machine, watcher subscription, derived metrics, AsyncStorage of legacy session, SQLite buffering.

- [ ] **Step 1: Implement hook**

```ts
import { useCallback, useEffect, useRef, useState } from 'react'
import * as Location from 'expo-location'
import * as Haptics from 'expo-haptics'
import * as Buffer from '../lib/tracking/sessionBuffer'
import {
  totalDistanceKm,
  paceSecPerKm,
  avgSpeedKmh,
  maxSpeedKmh,
  type Sample,
} from '../lib/tracking/sessionMetrics'

export type Phase = 'idle' | 'countdown' | 'tracking' | 'paused' | 'finished'

export interface UseTrackingSessionOpts {
  activityType: 'running' | 'walking' | 'cycling'
  routeId?: string
  plannedRoute?: { latitude: number; longitude: number }[]
}

export function useTrackingSession(opts: UseTrackingSessionOpts) {
  const [phase, setPhase] = useState<Phase>('idle')
  const [samples, setSamples] = useState<Sample[]>([])
  const [elapsed, setElapsed] = useState(0)

  const sessionIdRef = useRef<string | null>(null)
  const startedAtRef = useRef<number>(0)
  const watchRef = useRef<Location.LocationSubscription | null>(null)
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const flushRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const pendingFlushRef = useRef<Buffer.SampleRow[]>([])

  // Init DB once
  useEffect(() => {
    Buffer.init()
  }, [])

  const start = useCallback(async () => {
    setPhase('countdown')
  }, [])

  // After countdown completes, caller transitions phase to 'tracking'
  useEffect(() => {
    if (phase !== 'tracking') return
    let cancelled = false
    ;(async () => {
      const { status } = await Location.requestForegroundPermissionsAsync()
      if (status !== 'granted') {
        setPhase('idle')
        return
      }

      const id = `s_${Date.now()}`
      sessionIdRef.current = id
      startedAtRef.current = Date.now()
      await Buffer.startSession({
        id,
        routeId: opts.routeId ?? null,
        activityType: opts.activityType,
        startedAt: startedAtRef.current,
      })

      tickRef.current = setInterval(() => {
        setElapsed(Math.floor((Date.now() - startedAtRef.current) / 1000))
      }, 1000)

      flushRef.current = setInterval(() => {
        if (pendingFlushRef.current.length === 0) return
        const batch = pendingFlushRef.current
        pendingFlushRef.current = []
        Buffer.appendSamples(id, batch).catch(() => {
          pendingFlushRef.current.unshift(...batch)
        })
      }, 10_000)

      const sub = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.BestForNavigation, timeInterval: 1000, distanceInterval: 2 },
        (loc) => {
          if (cancelled) return
          const t = Math.floor((loc.timestamp - startedAtRef.current) / 1000)
          const sample: Sample = {
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
            t,
          }
          setSamples((prev) => filterSpurious(prev, sample, loc.coords.accuracy ?? 100))
          pendingFlushRef.current.push({
            t: loc.timestamp,
            lat: loc.coords.latitude,
            lng: loc.coords.longitude,
            alt: loc.coords.altitude ?? null,
            speed: loc.coords.speed ?? null,
            heading: loc.coords.heading ?? null,
            accuracy: loc.coords.accuracy ?? null,
            steps: null,
          })
        }
      )
      watchRef.current = sub
    })()
    return () => {
      cancelled = true
      watchRef.current?.remove()
      watchRef.current = null
      if (tickRef.current) clearInterval(tickRef.current)
      if (flushRef.current) clearInterval(flushRef.current)
    }
  }, [phase, opts.activityType, opts.routeId])

  const pause = useCallback(() => {
    watchRef.current?.remove()
    watchRef.current = null
    if (tickRef.current) clearInterval(tickRef.current)
    setPhase('paused')
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {})
  }, [])

  const resume = useCallback(() => {
    setPhase('tracking')
  }, [])

  const finish = useCallback(async () => {
    watchRef.current?.remove()
    watchRef.current = null
    if (tickRef.current) clearInterval(tickRef.current)
    if (flushRef.current) clearInterval(flushRef.current)
    if (pendingFlushRef.current.length > 0 && sessionIdRef.current) {
      await Buffer.appendSamples(sessionIdRef.current, pendingFlushRef.current)
      pendingFlushRef.current = []
    }
    if (sessionIdRef.current) await Buffer.endSession(sessionIdRef.current, 'completed')
    setPhase('finished')
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {})
  }, [])

  return {
    phase,
    setPhase,
    samples,
    elapsed,
    distanceKm: totalDistanceKm(samples),
    paceSecPerKm: paceSecPerKm(samples),
    avgSpeedKmh: avgSpeedKmh(samples),
    maxSpeedKmh: maxSpeedKmh(samples),
    sessionId: sessionIdRef.current,
    start,
    pause,
    resume,
    finish,
  }
}

function filterSpurious(prev: Sample[], next: Sample, accuracy: number): Sample[] {
  if (prev.length === 0) return [next]
  const last = prev[prev.length - 1]
  const dKm = Math.hypot(next.latitude - last.latitude, next.longitude - last.longitude) * 111
  if (dKm > 0.1 && accuracy > 30) return prev // drop big jumps with weak accuracy
  return [...prev, next]
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/mobile/src/hooks/useTrackingSession.ts
git commit -m "feat(tracking): useTrackingSession hook with SQLite buffering"
```

### Task 1.6: Refactor `rota-takip.tsx` to use the hook + add free-run mode

**Files:**

- Modify: `apps/mobile/app/(app)/tracking/rota-takip.tsx`
- Modify: `apps/mobile/app/(app)/tracking/rota-detay.tsx`

The existing screen accepts `id` as a route id. Add `mode=free` support: if no id, run in free-run mode (no planned route, no off-route warning, distance from samples only).

- [ ] **Step 1: Replace internal state with `useTrackingSession`**

Walk through `rota-takip.tsx` and:

- Remove `useState<Phase>`, `useState<LatLng[]>('trace')`, `useState(0)('elapsed')` and their effects.
- Read `mode` from `useLocalSearchParams` along with `id` and `activityType`.
- If `mode === 'free'` skip the `AsyncStorage.getItem(ROUTES_KEY)` block; set `route = null`; pass `routeId: undefined` to the hook.
- Replace inline finish handler with hook's `finish()` then `setPhase('flyover')`.

- [ ] **Step 2: Update detail screen "Rotayı Kullan" + add Free Run launcher in `aktivite.tsx`**

In `rota-detay.tsx`, the existing button already routes to `rota-takip?id={route.id}`. Add a second screen entry: in `aktivite.tsx` next to each activity quick-start (`Koşu`, `Bisiklet`, `Yürüyüş`), wire a "Şimdi Başlat" button that pushes `rota-takip?mode=free&activityType=running`.

- [ ] **Step 3: Manual test in simulator**

```bash
SENTRY_DISABLE_AUTO_UPLOAD=true pnpm expo run:ios
```

- Open Aktivite tab → tap "Şimdi Başlat" under Koşu → countdown 3-2-1 → tracking starts.
- Use Simulator → Features → Location → City Run to simulate movement.
- Verify distance increases, pace shows after 50 m, "Bitir" advances to flyover.

- [ ] **Step 4: Commit**

```bash
git add apps/mobile/app/(app)/tracking/rota-takip.tsx apps/mobile/app/(app)/tracking/rota-detay.tsx apps/mobile/app/(app)/tracking/aktivite.tsx
git commit -m "feat(tracking): free-run mode + refactor rota-takip onto useTrackingSession"
```

---

## Chunk 2: Background tracking + pause/resume + pedometer + cycling speed

Goal: tracking continues when the app is backgrounded; live pedometer for foot activities; cycling speed metrics replace step count; pause/resume in UI.

### Task 2.1: Configure iOS background location

**Files:**

- Modify: `apps/mobile/app.json`

- [ ] **Step 1: Add `UIBackgroundModes` and motion usage**

In `expo.ios.infoPlist`:

```json
{
  "UIBackgroundModes": ["location", "fetch"],
  "NSLocationAlwaysAndWhenInUseUsageDescription": "Antrenman bittiğinde bile rotanı kaydedebilelim diye konum gerekli.",
  "NSLocationAlwaysUsageDescription": "Antrenman bittiğinde bile rotanı kaydedebilelim diye konum gerekli.",
  "NSMotionUsageDescription": "Adım sayını ve aktiviteni hesaplayabilmemiz için hareket verisi gerekli."
}
```

- [ ] **Step 2: Re-run prebuild**

```bash
SENTRY_DISABLE_AUTO_UPLOAD=true pnpm expo prebuild --platform ios --clean
cd ios && pod install && cd ..
```

- [ ] **Step 3: Commit**

```bash
git add apps/mobile/app.json apps/mobile/ios
git commit -m "feat(tracking): enable iOS background location + motion permissions"
```

### Task 2.2: Background task that writes to SQLite

**Files:**

- Create: `apps/mobile/src/lib/tracking/backgroundTask.ts`
- Modify: `apps/mobile/app/_layout.tsx` (register task at app boot)

- [ ] **Step 1: Define task**

```ts
// backgroundTask.ts
import * as TaskManager from 'expo-task-manager'
import * as Location from 'expo-location'
import * as Buffer from './sessionBuffer'
import AsyncStorage from '@react-native-async-storage/async-storage'

export const BG_TASK_NAME = 'fitai-bg-location'
const ACTIVE_SESSION_KEY = 'fitai_active_session_id'

export async function setActiveSessionId(id: string | null) {
  if (id) await AsyncStorage.setItem(ACTIVE_SESSION_KEY, id)
  else await AsyncStorage.removeItem(ACTIVE_SESSION_KEY)
}

export async function getActiveSessionId() {
  return AsyncStorage.getItem(ACTIVE_SESSION_KEY)
}

TaskManager.defineTask(BG_TASK_NAME, async ({ data, error }) => {
  if (error) return
  const { locations } = (data as any) || {}
  if (!locations || locations.length === 0) return
  const sessionId = await getActiveSessionId()
  if (!sessionId) return
  await Buffer.init()
  await Buffer.appendSamples(
    sessionId,
    locations.map((l: any) => ({
      t: l.timestamp,
      lat: l.coords.latitude,
      lng: l.coords.longitude,
      alt: l.coords.altitude ?? null,
      speed: l.coords.speed ?? null,
      heading: l.coords.heading ?? null,
      accuracy: l.coords.accuracy ?? null,
      steps: null,
    }))
  )
})

export async function startBackground(sessionId: string) {
  await setActiveSessionId(sessionId)
  await Location.startLocationUpdatesAsync(BG_TASK_NAME, {
    accuracy: Location.Accuracy.BestForNavigation,
    timeInterval: 2000,
    distanceInterval: 5,
    showsBackgroundLocationIndicator: true,
    pausesUpdatesAutomatically: false,
    activityType: Location.ActivityType.Fitness,
    foregroundService: undefined, // iOS only feature here; Android scope deferred
  })
}

export async function stopBackground() {
  await setActiveSessionId(null)
  const has = await Location.hasStartedLocationUpdatesAsync(BG_TASK_NAME).catch(() => false)
  if (has) await Location.stopLocationUpdatesAsync(BG_TASK_NAME)
}
```

- [ ] **Step 2: Register task at app boot**

In `apps/mobile/app/_layout.tsx`, before `RootProviders`, add `import '../src/lib/tracking/backgroundTask';` so the `defineTask` runs.

- [ ] **Step 3: Wire start/stop into `useTrackingSession`**

In the hook:

- After `Buffer.startSession(...)`, request `requestBackgroundPermissionsAsync()`. If granted, call `startBackground(id)`. (Best-effort — foreground still works without it.)
- In `finish()` and `pause()`, call `stopBackground()`.

- [ ] **Step 4: Smoke test**

Simulator → run a tracking session → press home button → confirm in console (or via re-foregrounding) that samples table grew.

- [ ] **Step 5: Commit**

```bash
git add apps/mobile/src/lib/tracking apps/mobile/app/_layout.tsx apps/mobile/src/hooks/useTrackingSession.ts
git commit -m "feat(tracking): background location task writes to SQLite buffer"
```

### Task 2.3: Pedometer hook

**Files:**

- Create: `apps/mobile/src/hooks/usePedometer.ts`

- [ ] **Step 1: Implement**

```ts
import { useEffect, useState } from 'react'
import { Pedometer } from 'expo-sensors'

export function usePedometer(active: boolean, startedAt: number | null) {
  const [steps, setSteps] = useState(0)

  useEffect(() => {
    if (!active || !startedAt) return
    let sub: { remove: () => void } | null = null
    let cancelled = false
    ;(async () => {
      const ok = await Pedometer.isAvailableAsync().catch(() => false)
      if (!ok) return
      sub = Pedometer.watchStepCount(({ steps: delta }) => {
        if (cancelled) return
        setSteps((prev) => prev + delta)
      })
    })()
    return () => {
      cancelled = true
      sub?.remove()
    }
  }, [active, startedAt])

  return steps
}
```

- [ ] **Step 2: Use in `rota-takip.tsx`**

```tsx
const isFootActivity = activityType === 'running' || activityType === 'walking'
const steps = usePedometer(phase === 'tracking' && isFootActivity, startedAtRef.current)
```

Replace the placeholder `Math.round(distKm * 1300)` with `steps` when foot, or hide the sub-stat when cycling and replace with `<SubStat icon="speedometer" label="hız" value={`${avgSpeedKmh.toFixed(1)} km/h`} />`.

- [ ] **Step 3: Commit**

```bash
git add apps/mobile/src/hooks/usePedometer.ts apps/mobile/app/(app)/tracking/rota-takip.tsx
git commit -m "feat(tracking): live pedometer for foot activities, speed for cycling"
```

### Task 2.4: Pause/Resume UI

**Files:**

- Modify: `apps/mobile/app/(app)/tracking/rota-takip.tsx`

- [ ] **Step 1: Replace single Bitir button with three: Pause / Resume / Bitir**

```tsx
{
  phase === 'tracking' && (
    <Pressable onPress={pause} style={[s.actionBtn, { backgroundColor: '#374151' }]}>
      <Ionicons name="pause" size={18} color="#fff" />
    </Pressable>
  )
}
{
  phase === 'paused' && (
    <Pressable onPress={resume} style={[s.actionBtn, { backgroundColor: ACCENT }]}>
      <Ionicons name="play" size={18} color="#fff" />
    </Pressable>
  )
}
;<Pressable onPress={handleFinish} style={s.finishBtn}>
  <Ionicons name="stop-circle" size={22} color="#fff" />
  <Text style={s.finishBtnTxt}>Bitir</Text>
</Pressable>
```

- [ ] **Step 2: Show "DURDURULDU" tag in top bar when paused**

- [ ] **Step 3: Commit**

```bash
git add apps/mobile/app/(app)/tracking/rota-takip.tsx
git commit -m "feat(tracking): pause/resume controls"
```

---

## Chunk 3: Cinematic flyover refinement

Goal: replace the existing 3-phase `flyAlong` with a more reliable bearing-aligned camera chain that reads the saved trace from SQLite (so it works even after a crash/restart).

### Task 3.1: `useFlyover` hook

**Files:**

- Create: `apps/mobile/src/hooks/useFlyover.ts`
- Modify: `apps/mobile/components/maps/MapboxRouteView.tsx` (expose richer `setCamera`)

- [ ] **Step 1: Expose detailed `setCamera` on the imperative ref**

In `MapboxRouteView.tsx`, add to the ref interface:

```ts
setCameraDetailed: (opts: {
  centerCoordinate: [number, number];
  zoomLevel?: number;
  pitch?: number;
  bearing?: number;
  animationDuration?: number;
  animationMode?: 'easeTo' | 'flyTo' | 'linearTo' | 'moveTo';
}) => void;
```

Implement passing through to `cameraRef.current?.setCamera(...)`.

- [ ] **Step 2: Implement `useFlyover`**

```ts
import { useCallback } from 'react'
import type { MapboxRouteViewRef } from '../../components/maps/MapboxRouteView'
import { simplify, type Pt } from '../lib/tracking/polyline'

export interface FlyoverOpts {
  pitch?: number // default 60
  totalSec?: number // default 8 (5–10 range)
  zoom?: number // default 17
}

export function useFlyover() {
  const run = useCallback(async (map: MapboxRouteViewRef, coords: Pt[], opts: FlyoverOpts = {}) => {
    if (coords.length < 2) return
    const { pitch = 60, totalSec = 8, zoom = 17 } = opts
    const sampled = simplify(coords, 0.00005)
    const target = Math.max(20, Math.min(60, Math.round(totalSec * 6)))
    const points = downsample(sampled, target)

    // Phase A: overview, 1.2s
    map.fitToCoords(coords, 80)
    await sleep(1200)

    // Phase B: drop into start with pitch
    const start = points[0]
    const heading0 = bearingDeg(points[0], points[1])
    map.setCameraDetailed({
      centerCoordinate: [start.longitude, start.latitude],
      zoomLevel: zoom,
      pitch,
      bearing: heading0,
      animationDuration: 1200,
      animationMode: 'easeTo',
    })
    await sleep(1200)

    // Phase C: glide along
    const segMs = (totalSec * 1000) / (points.length - 1)
    for (let i = 1; i < points.length; i++) {
      const heading = bearingDeg(points[i - 1], points[i])
      map.setCameraDetailed({
        centerCoordinate: [points[i].longitude, points[i].latitude],
        zoomLevel: zoom,
        pitch,
        bearing: heading,
        animationDuration: Math.round(segMs),
        animationMode: 'linearTo',
      })
      await sleep(segMs)
    }

    // Phase D: zoom out
    map.setCameraDetailed({
      centerCoordinate: [
        coords[Math.floor(coords.length / 2)].longitude,
        coords[Math.floor(coords.length / 2)].latitude,
      ],
      pitch: 0,
      animationDuration: 1000,
      animationMode: 'easeTo',
    })
    map.fitToCoords(coords, 80)
  }, [])
  return { run }
}

function downsample(coords: Pt[], n: number): Pt[] {
  if (coords.length <= n) return coords
  const step = (coords.length - 1) / (n - 1)
  return Array.from({ length: n }, (_, i) => coords[Math.round(i * step)])
}

function bearingDeg(a: Pt, b: Pt): number {
  const φ1 = (a.latitude * Math.PI) / 180,
    φ2 = (b.latitude * Math.PI) / 180
  const Δλ = ((b.longitude - a.longitude) * Math.PI) / 180
  const y = Math.sin(Δλ) * Math.cos(φ2)
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ)
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360
}

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms))
```

- [ ] **Step 3: Replace flyover effect in `rota-takip.tsx`**

```tsx
const flyover = useFlyover()
useEffect(() => {
  if (phase !== 'flyover' || samples.length < 2) return
  flyover.run(mapRef.current!, samples, { totalSec: 8, pitch: 60, zoom: 17 })
}, [phase, samples.length])
```

- [ ] **Step 4: Manual test**

Run a session in simulator → finish → flyover should: zoom out, drop into start with tilt, glide for ~8 s with bearing rotating, then zoom out. No jank.

- [ ] **Step 5: Commit**

```bash
git add apps/mobile/src/hooks/useFlyover.ts apps/mobile/components/maps/MapboxRouteView.tsx apps/mobile/app/(app)/tracking/rota-takip.tsx
git commit -m "feat(tracking): bearing-aligned cinematic flyover"
```

---

## Chunk 4: Backend persistence (Prisma + Supabase + sync queue)

### Task 4.1: Prisma schema

**Files:**

- Modify: `apps/web/prisma/schema.prisma`

- [ ] **Step 1: Add models**

```prisma
model TrackingSession {
  id              String   @id @default(cuid())
  userId          String
  user            User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  routeId         String?  // nullable for free-run
  activityType    String   // "running" | "walking" | "cycling"
  startedAt       DateTime
  endedAt         DateTime
  durationSec     Int
  distanceKm      Float
  paceSecPerKm    Float?
  avgSpeedKmh     Float?
  maxSpeedKmh     Float?
  steps           Int?
  elevationGain   Float?
  encodedPolyline String   @db.Text  // Google polyline format
  // Optional raw samples (only kept if user opts in to detailed analysis)
  rawSamples      Json?
  createdAt       DateTime @default(now())

  splits          TrackingSessionSplit[]

  @@index([userId])
  @@index([userId, startedAt])
}

model TrackingSessionSplit {
  id           String          @id @default(cuid())
  sessionId    String
  session      TrackingSession @relation(fields: [sessionId], references: [id], onDelete: Cascade)
  km           Int
  durationSec  Int
  paceSecPerKm Float

  @@index([sessionId])
}
```

- [ ] **Step 2: Migrate**

```bash
cd apps/web
pnpm prisma migrate dev --name add_tracking_sessions
```

Expected: migration applied, no schema drift errors.

- [ ] **Step 3: Commit**

```bash
git add apps/web/prisma/schema.prisma apps/web/prisma/migrations
git commit -m "feat(tracking): TrackingSession + Split Prisma models"
```

### Task 4.2: API endpoints

**Files:**

- Create: `apps/web/app/api/tracking/sessions/route.ts`
- Create: `apps/web/app/api/tracking/sessions/[id]/route.ts`

- [ ] **Step 1: POST /api/tracking/sessions**

```ts
// route.ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import prisma from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const body = await req.json()
  const {
    routeId,
    activityType,
    startedAt,
    endedAt,
    durationSec,
    distanceKm,
    paceSecPerKm,
    avgSpeedKmh,
    maxSpeedKmh,
    steps,
    elevationGain,
    encodedPolyline,
    splits,
    rawSamples,
  } = body
  if (!encodedPolyline || !activityType)
    return NextResponse.json({ error: 'invalid' }, { status: 400 })

  const session = await prisma.trackingSession.create({
    data: {
      userId,
      routeId: routeId ?? null,
      activityType,
      startedAt: new Date(startedAt),
      endedAt: new Date(endedAt),
      durationSec,
      distanceKm,
      paceSecPerKm,
      avgSpeedKmh,
      maxSpeedKmh,
      steps,
      elevationGain,
      encodedPolyline,
      rawSamples: rawSamples ?? null,
      splits: {
        create: (splits ?? []).map((sp: any) => ({
          km: sp.km,
          durationSec: sp.durationSec,
          paceSecPerKm: sp.paceSecPerKm,
        })),
      },
    },
    include: { splits: true },
  })
  return NextResponse.json({ session })
}

export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const sessions = await prisma.trackingSession.findMany({
    where: { userId },
    orderBy: { startedAt: 'desc' },
    take: 50,
    include: { splits: true },
  })
  return NextResponse.json({ sessions })
}
```

- [ ] **Step 2: GET single session**

`/api/tracking/sessions/[id]/route.ts` — returns `{ session }` if `userId` matches, else 404.

- [ ] **Step 3: Commit**

```bash
git add apps/web/app/api/tracking
git commit -m "feat(tracking): POST/GET tracking session endpoints"
```

### Task 4.3: Mobile sync queue

**Files:**

- Create: `apps/mobile/src/lib/tracking/syncQueue.ts`
- Create: `apps/mobile/src/lib/tracking/__tests__/syncQueue.test.ts`

- [ ] **Step 1: Tests for queue ordering + retry semantics**

Test that `enqueue` writes to AsyncStorage, `flushOnce` POSTs each item, on 200 removes, on network error keeps for next attempt.

- [ ] **Step 2: Implement (using `getToken()` from Clerk)**

```ts
import AsyncStorage from '@react-native-async-storage/async-storage'

const QUEUE_KEY = 'fitai_sync_queue_v1'

export interface PendingSession {
  sessionId: string
  payload: any
  attempts: number
}

export async function enqueue(item: PendingSession) {
  const raw = await AsyncStorage.getItem(QUEUE_KEY)
  const list: PendingSession[] = raw ? JSON.parse(raw) : []
  list.push(item)
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(list))
}

export async function getQueue(): Promise<PendingSession[]> {
  const raw = await AsyncStorage.getItem(QUEUE_KEY)
  return raw ? JSON.parse(raw) : []
}

export async function flushOnce(getToken: () => Promise<string | null>, apiUrl: string) {
  const list = await getQueue()
  const remaining: PendingSession[] = []
  for (const item of list) {
    try {
      const token = await getToken()
      const r = await fetch(`${apiUrl}/api/tracking/sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(item.payload),
      })
      if (!r.ok) throw new Error('non-2xx')
    } catch {
      remaining.push({ ...item, attempts: item.attempts + 1 })
    }
  }
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(remaining))
}
```

- [ ] **Step 3: Wire into `finish()` of `useTrackingSession`**

After `Buffer.endSession`, build payload from samples + computed metrics + encoded polyline, then `enqueue(...)` then call `flushOnce(getToken, apiUrl)`. (Don't await flush in the UI thread — fire-and-forget.)

- [ ] **Step 4: Commit**

```bash
git add apps/mobile/src/lib/tracking/syncQueue.ts apps/mobile/src/lib/tracking/__tests__/syncQueue.test.ts apps/mobile/src/hooks/useTrackingSession.ts
git commit -m "feat(tracking): offline-tolerant sync queue"
```

### Task 4.4: Transparent auto-sync (no manual button)

Strava/Nike-style: user never sees a "sync" button. Sync triggers automatically:

1. On `finish()` — fire-and-forget POST.
2. When app foregrounds (AppState 'active').
3. When network connectivity is restored.

**Files:**

- Install: `@react-native-community/netinfo`
- Create: `apps/mobile/src/hooks/useSyncOnConnect.ts`
- Create: `apps/mobile/components/tracking/SyncIndicator.tsx`
- Modify: `apps/mobile/src/providers/index.tsx` (mount the hook globally)

- [ ] **Step 1: Install NetInfo**

```bash
cd apps/mobile && pnpm add @react-native-community/netinfo
```

- [ ] **Step 2: Hook**

```ts
// useSyncOnConnect.ts
import { useEffect } from 'react'
import { AppState } from 'react-native'
import NetInfo from '@react-native-community/netinfo'
import { useAuth } from '@clerk/expo'
import { flushOnce, getQueue } from '../lib/tracking/syncQueue'

export function useSyncOnConnect() {
  const { getToken } = useAuth()
  const apiUrl = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000'

  useEffect(() => {
    const tryFlush = async () => {
      const q = await getQueue()
      if (q.length === 0) return
      const net = await NetInfo.fetch()
      if (!net.isConnected) return
      await flushOnce(getToken, apiUrl)
    }

    tryFlush() // on mount

    const appSub = AppState.addEventListener('change', (st) => {
      if (st === 'active') tryFlush()
    })
    const netSub = NetInfo.addEventListener((state) => {
      if (state.isConnected) tryFlush()
    })
    return () => {
      appSub.remove()
      netSub()
    }
  }, [getToken, apiUrl])
}
```

- [ ] **Step 3: Mount in `RootProviders`** (so it runs the entire app lifetime)

In `apps/mobile/src/providers/index.tsx`, add a `<SyncRunner />` wrapper inside `<ClerkProvider>` that calls `useSyncOnConnect()` and renders nothing.

- [ ] **Step 4: Silent indicator**

`SyncIndicator.tsx` reads `getQueue()` size every 1.5 s while mounted. When queue size > 0, shows a small pill at top of FlyoverOverlay: "Senkron ediliyor…". When size hits 0, animates to "Senkronize ✓" and fades out after 1.5 s. No buttons, no errors shown unless `attempts > 5` (then a tiny ⓘ icon — tap to see "Bağlantı kurulamadı, otomatik tekrar denenecek").

- [ ] **Step 5: Commit**

```bash
git add apps/mobile/package.json apps/mobile/pnpm-lock.yaml apps/mobile/src/hooks/useSyncOnConnect.ts apps/mobile/components/tracking/SyncIndicator.tsx apps/mobile/src/providers/index.tsx
git commit -m "feat(tracking): transparent auto-sync on app resume + connectivity restore"
```

---

## Chunk 5: Share/download flyover video

### Task 5.1: Capture flyover frames → MP4

**Files:**

- Create: `apps/mobile/src/lib/tracking/flyoverRecorder.ts`
- Create: `apps/mobile/components/tracking/ShareSheet.tsx`

iOS-only path (Talha's scope is iOS). Two approaches considered:

- **A) ReplayKit (`RPScreenRecorder`)** — system screen recorder, native, smooth, but requires user-visible mic prompt and produces watermark-free MP4. Best UX. Needs a tiny native module (~30 lines Swift) wired through Expo's `createRunOnceTask` or a `expo-modules-core` View Module.
- **B) `react-native-view-shot` per-frame capture + `ffmpeg-kit-react-native` stitch** — pure JS but heavy, slow (~3 s flyover takes ~15 s to encode), large binary.

Pick A for production quality. Add an `ExpoConfigPlugin` that registers a `RPScreenRecorder` bridge.

- [ ] **Step 1: Add native ReplayKit bridge**

Create `ios/FitAIFlyoverRecorder/FlyoverRecorder.swift`:

```swift
import Foundation
import ReplayKit

@objc(FlyoverRecorder)
class FlyoverRecorder: NSObject {
  @objc func startRecording(_ resolve: @escaping RCTPromiseResolveBlock,
                            reject: @escaping RCTPromiseRejectBlock) {
    let recorder = RPScreenRecorder.shared()
    recorder.isMicrophoneEnabled = false
    recorder.startRecording { error in
      if let error = error { reject("recording_error", error.localizedDescription, error); return }
      resolve(nil)
    }
  }
  @objc func stopRecording(_ resolve: @escaping RCTPromiseResolveBlock,
                           reject: @escaping RCTPromiseRejectBlock) {
    let recorder = RPScreenRecorder.shared()
    let outputURL = FileManager.default.urls(for: .cachesDirectory, in: .userDomainMask)[0]
      .appendingPathComponent("flyover-\(Int(Date().timeIntervalSince1970)).mp4")
    recorder.stopRecording(withOutput: outputURL) { error in
      if let error = error { reject("stop_error", error.localizedDescription, error); return }
      resolve(["uri": outputURL.absoluteString])
    }
  }
  @objc static func requiresMainQueueSetup() -> Bool { return false }
}
```

Expose via `FlyoverRecorder.m` bridge file and register in Podfile through a small ExpoConfig plugin (`apps/mobile/plugins/withFlyoverRecorder.js`).

- [ ] **Step 2: TS wrapper**

```ts
// flyoverRecorder.ts
import { NativeModules } from 'react-native'
const { FlyoverRecorder } = NativeModules

export async function startRecording(): Promise<void> {
  await FlyoverRecorder.startRecording()
}
export async function stopRecording(): Promise<{ uri: string }> {
  return await FlyoverRecorder.stopRecording()
}
```

- [ ] **Step 3: Hook into flyover phase**

In `rota-takip.tsx`, when entering `'flyover'` phase, call `startRecording()` → `flyover.run(...)` → `stopRecording()` → set `videoUri` state.

- [ ] **Step 4: Smoke test**

Record once, log returned URI, open file URL via Files app to confirm MP4 plays.

- [ ] **Step 5: Commit**

```bash
git add apps/mobile/ios/FitAIFlyoverRecorder apps/mobile/plugins apps/mobile/src/lib/tracking/flyoverRecorder.ts apps/mobile/app/(app)/tracking/rota-takip.tsx
git commit -m "feat(tracking): record flyover via ReplayKit"
```

### Task 5.2: Share sheet UI (Save / Share / Instagram Story)

**Files:**

- Create: `apps/mobile/components/tracking/ShareSheet.tsx`

- [ ] **Step 1: Implement**

```tsx
import * as Sharing from 'expo-sharing'
import * as MediaLibrary from 'expo-media-library'

export function ShareSheet({
  uri,
  distKm,
  durationSec,
  onClose,
}: {
  uri: string
  distKm: number
  durationSec: number
  onClose: () => void
}) {
  const save = async () => {
    const { status } = await MediaLibrary.requestPermissionsAsync()
    if (status !== 'granted') return
    await MediaLibrary.saveToLibraryAsync(uri)
    Alert.alert('Kaydedildi', 'Video Fotoğraflar uygulamasına eklendi.')
  }
  const share = async () => {
    if (!(await Sharing.isAvailableAsync())) return
    await Sharing.shareAsync(uri, { mimeType: 'video/mp4', dialogTitle: 'Antrenmanını paylaş' })
  }

  return (
    <View>
      <Pressable onPress={save}>
        <Text>İndir</Text>
      </Pressable>
      <Pressable onPress={share}>
        <Text>Paylaş</Text>
      </Pressable>
      <Pressable onPress={onClose}>
        <Text>Kapat</Text>
      </Pressable>
    </View>
  )
}
```

(Wrap in proper styled component matching FitAI premium UI standard; this is the functional skeleton.)

- [ ] **Step 2: Mount in `FlyoverOverlay` after recording finishes**

- [ ] **Step 3: Manual test**

- Save → confirm video appears in Photos.
- Share → confirm iOS share sheet appears with Instagram, AirDrop, Messages, etc.

- [ ] **Step 4: Commit**

```bash
git add apps/mobile/components/tracking/ShareSheet.tsx apps/mobile/app/(app)/tracking/rota-takip.tsx
git commit -m "feat(tracking): share/download flyover video via system share sheet"
```

---

## Chunk 6: Home tab "Recording in progress" banner

> WidgetKit (iOS home-screen widget) deferred — requires paid Apple Developer account. Re-add as a future plan once account is provisioned.

### Task 6.1: RecordingBanner

**Files:**

- Create: `apps/mobile/components/tracking/RecordingBanner.tsx`
- Modify: `apps/mobile/app/(app)/home.tsx`

- [ ] **Step 1: Banner subscribes to active session**

Banner reads `getActiveSessionId()` every 2 s while mounted; if non-null, shows pulse dot + "Antrenman devam ediyor" + tap-to-resume → routes to `/(app)/tracking/rota-takip?resume=1`.

- [ ] **Step 2: Mount on `home.tsx`**

```tsx
<RecordingBanner />
```

(Uses absolute positioning at top of safe area.)

- [ ] **Step 3: Commit**

```bash
git add apps/mobile/components/tracking/RecordingBanner.tsx apps/mobile/app/(app)/home.tsx
git commit -m "feat(tracking): home tab recording-in-progress banner"
```

---

## Verification & Cutover

- [ ] **Step 1: Full end-to-end manual test**

1. Open Aktivite → Koşu → "Şimdi Başlat" (free-run).
2. Simulator: Features → Location → City Run.
3. Wait 30 s; verify distance, pace, steps update.
4. Send to background (cmd+H); verify banner stays.
5. Re-open after 60 s; samples table should have grown by ≥30 rows.
6. Tap home; banner shows "Antrenman devam ediyor"; tap → returns to tracking screen.
7. Bitir → flyover plays for ~8 s with 60° pitch + bearing rotation.
8. Save video → check Photos.
9. Share → confirm system share sheet works.
10. Re-open app → previous session listed under aktivite history (Chunk 4 sync queue should have flushed).

- [ ] **Step 2: Battery sanity check**

Run a 20 min session in background; expect ≤8% battery drain on iPhone 17.

- [ ] **Step 3: Commit final docs/CHANGELOG entry**

```bash
git add CHANGELOG.md
git commit -m "docs: live tracking + flyover + share + widget release notes"
```

---

## Open questions to revisit during execution

1. **Crash recovery**: If app crashes mid-session, on next launch detect `active` row in SQLite → offer "Resume previous session?" dialog. Not in this plan; add in Chunk 8 if needed.
2. **Heart rate / Apple Watch integration**: out of scope; will require HealthKit + workout session API in a future plan.
3. **Android parity**: this plan is iOS-only per Talha's scope. Background location + WidgetKit equivalents (Foreground Service + Glance) are tracked separately.
4. **Privacy**: route polylines + raw samples are personal data. Settings screen needs a "Don't store raw samples" toggle that suppresses the `rawSamples` field in POST. Tracked but deferred.
