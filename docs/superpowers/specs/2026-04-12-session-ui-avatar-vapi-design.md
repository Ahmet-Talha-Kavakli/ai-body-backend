# Session UI, Avatar, and VAPI Voice Integration Design

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform FitAI's session experience from "basic stick figure" to a professional real-time coaching system with adaptive 3D avatar that evolves with user progress, powered by AI form analysis and VAPI voice coaching.

**Architecture:** Modular session system with five independent components: FormAnalyzer (real-time pose detection), AvatarRenderer (adaptive 3D model generation and animation), VoiceCoach (VAPI integration with TTS fallback), FeedbackUI (floating form scores and error display), and SessionRecorder (offline-first data persistence). Components communicate via event emitters and shared state. Mobile uses hybrid SQLite+PostgreSQL sync; web uses direct PostgreSQL.

**Tech Stack:** Babylon.js (3D rendering), Mixamo (4000+ exercise animations), TensorFlow.js (form analysis), VAPI SDK (voice coaching), React Native (UI), Expo (mobile framework), PostgreSQL + pgvector (backend), SQLite (mobile offline storage).

---

## Chunk 1: System Architecture & Data Flow

### Core Vision

FitAI's session is a **real-time AI fitness coach** that:

1. Watches user movement via camera (form analysis)
2. Provides instant voice feedback via VAPI
3. Shows live form score (floating card)
4. Records all data for memory-based learning
5. Displays adaptive 3D avatar that transforms as user progresses
6. Learns user's strengths/weaknesses to personalize future sessions

### System Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    Mobile Session Flow                       │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐      ┌──────────────┐     ┌─────────────┐ │
│  │   Camera     │─────▶│ FormAnalyzer │────▶│ FeedbackUI  │ │
│  │  (TF.js)     │      │  (TF.js)     │     │(Form Score) │ │
│  └──────────────┘      └──────────────┘     └─────────────┘ │
│         │                     │                     │         │
│         │                     ├────▶┌─────────────┐ │         │
│         │                     │     │ VoiceCoach  │ │         │
│         │                     │     │ (VAPI+TTS)  │ │         │
│         │                     │     └─────────────┘ │         │
│         │                     │            │         │         │
│         └─────────────────────┼────────────┼─────────┘         │
│                               │            │                   │
│                        ┌──────▼────────────▼──────┐             │
│                        │   SessionRecorder        │             │
│                        │  (SQLite + Queue Sync)   │             │
│                        └──────────────────────────┘             │
│                               │                                │
│         ┌─────────────────────▼─────────────────────┐          │
│         │      AvatarRenderer                       │          │
│         │  (Babylon.js + Mixamo + Body Morph)      │          │
│         └───────────────────────────────────────────┘          │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### Data Architecture

**Local (Mobile):**

- SQLite: Session data, form scores, avatar state, pending syncs
- In-Memory: Real-time form analysis, voice stream buffer
- File System: Compressed session recordings

**Cloud (PostgreSQL):**

- UserSession: Session metadata, timestamps, duration
- SessionFormData: Frame-by-frame form analysis (exercise, reps, score, errors)
- UserMemoryEmbedding: Memory layer (from Phase 1) + session insights
- UserBodyComposition: Body metrics, avatar parameters
- SessionQueue: Pending syncs from offline sessions

**Sync Strategy:**

- Mobile: Write to SQLite immediately (offline-safe)
- Background: Queue async PostgreSQL push (network-safe)
- Conflict Resolution: Timestamp + version control (last-write-wins)
- Fallback: If sync fails, retry with exponential backoff (1s, 2s, 4s...)

---

## Chunk 2: Component Architecture

### 1. FormAnalyzer Component

**Responsibility:** Real-time pose detection and form scoring.

**Input:** Camera stream (30 fps)

**Output:**

```typescript
{
  exercise: string           // "squat", "bench_press", etc
  formScore: number          // 0-100
  repCount: number
  errors: FormError[]        // [{bodyPart, severity, cue}]
  muscleEngagement: Record<string, number>  // {quadriceps: 0.85, ...}
  depthAssessment: string    // "full", "partial", "shallow"
  stabilityScore: number     // 0-1
}
```

**Implementation Notes:**

- Uses TensorFlow.js COCO pose model (lightweight)
- Runs on device (offline-capable)
- Weekly model updates from cloud (optional)
- Falls back to manual rep counter if model confidence < 60%

**Error Handling:**

- Camera permission denied → fallback to manual mode
- Model load timeout → TTS: "Model loading, please wait"
- Poor lighting → confidence score drops, user warned

---

### 2. AvatarRenderer Component

**Responsibility:** 3D avatar generation, animation, and body composition transformation.

**Inputs:**

1. User body composition (onboarding)
2. Exercise animation (Mixamo)
3. Weekly progress data (weight, muscle%, fat%)

**Avatar Features:**

**2A. Initial Avatar Creation (Onboarding)**

```typescript
interface UserBodyProfile {
  gender: 'male' | 'female'
  startingWeight: number // kg
  height: number // cm
  age: number
  bodyFatPercentage?: number // DEXA or estimated
  musclePercentage?: number
  bodyType: 'endomorph' | 'mesomorph' | 'ectomorph'
  skinTone: string
  // Phase 3: hairColor, accessories
}
```

**Babylon.js Implementation (Mobile-Optimized):**

⚠️ **Performance Constraint:** Mobile GPUs are 100-200x weaker than desktop. Implementation strategy:

- **Mesh Complexity:** Max 12k vertices per avatar (not 50k+)
- **Morph Targets:** Pre-baked, not real-time calculated
- **Device Tiers:**
  - **High-end (iPhone 13+, Pixel 6+):** Full quality, 30fps target
  - **Mid-range (iPhone 11, Pixel 4):** Reduced detail, 20fps target
  - **Low-end (iPhone 8, Pixel 3):** Simplified model, 15fps target
- **Fallback:** If device can't sustain 15fps, show 2D avatar instead
- **LOD (Level of Detail):** Auto-reduce quality if CPU load > 80%

**Base Model Generation:**

- Mixamo base rig (low-poly, pre-optimized)
- Pre-baked morph targets for body weight ranges (every 5kg interval)
- Texture: Procedural generation by skin tone (5 variants)
- No real-time mesh deformation—use lerp between pre-baked shapes

**2B. Animation (Mixamo Library)**

⚠️ **Licensing & Animation Selection:**

- **License:** Free tier with attribution requirement
- **Animation Count:** 50-100 hand-curated exercise animations (not 4000)
- **Delivery:** Bundled with app (downloaded at first launch), not streamed
- **Curation:** Core exercises only:
  - Squats: Bodyweight, goblet, barbell (3 variants)
  - Deadlifts: Conventional, sumo, trap bar (3 variants)
  - Bench: Barbell, dumbbell (2 variants)
  - Rows: Barbell, dumbbell (2 variants)
  - Plus 40 additional common exercises
- **Implementation:** Blending between keyframes for smooth transitions, speed matching from form analysis

**2C. Body Transformation (Progressive, Not Real-Time)**

⚠️ **Morph Algorithm:** Simplified for Phase 2, detailed for Phase 3

**Phase 2 (MVP):** Weight-only transformation

```
Avatar Size = BaseSize + (CurrentWeight - StartWeight) * MorphFactor
- User loses 5kg → avatar 5% smaller
- User gains 3kg → avatar 3% larger
- Simple, visual, motivating
- No complex body composition math
```

**Phase 3 (Enhancement):** Detailed body composition

```
When body composition data available:
- Fat Loss: Belly, face → shrink these areas
- Muscle Gain: Arms, chest, legs → grow these areas
- Separate morph targets per body part
- Require manual body composition input (not estimated)
```

**Update Frequency:**

- Real-time: Not supported (too expensive)
- Weekly: Aggregate sessions, calculate weight change, update morph
- Animated over: 48 hours (subtle, not distracting)
- User notification: "Your progress is showing!" when update starts

**3D Visualization (Phase 2):**

- Front view only (primary) — side view moved to Phase 3
- 360° rotation optional (swipe)
- Before/After comparison screen (manual trigger, not automatic)
- Progress timeline: Every 4 weeks snapshot, not real-time

**Customization Scope (MVP):**

- Skin tone (5 options): Set once at onboarding, can change
- Gender avatar: Set at onboarding
- **Phase 3 additions:** Hair color, clothing variants, accessories
  - Defer full customization to avoid art asset explosion

---

### 3. VoiceCoach Component

**Responsibility:** Real-time voice feedback via VAPI with intelligent fallback.

**VAPI Integration:**

```typescript
interface VoiceCoachConfig {
  vapiPublicKey: string
  modelId: 'gpt-4o-mini' // Sufficient for real-time, cheaper than gpt-4
  voiceId: 'turkish-female' | 'turkish-male'
  systemPrompt: string // Personalized to user's history
  timeout: number // 4s max (validated, realistic)
  mode: 'real-time' | 'queue' // See latency handling below
}
```

**⚠️ Latency Validation (Critical)**

Real-world VAPI latency testing required before implementation:

- **TTS generation:** 2-4s (depends on message length)
- **Network roundtrip:** 0.5-1.5s (WiFi) to 2-3s (LTE)
- **Audio playback setup:** 0.3s
- **Total realistic latency:** 3-5 seconds minimum

**User Experience Impact:**

- User does rep 1 at t=0s
- Error detected at t=1s
- VAPI call starts at t=1s
- Feedback ready at t=5s
- User already on rep 3 → feedback is stale

**Solution: Queue-Based Feedback (Not Real-Time)**

Instead of interrupting with voice feedback:

1. **During set:** Show text feedback only (form score card)
2. **Between reps:** If user pauses >2s, play voice feedback
3. **After set:** Summarize all form issues with voice

This provides coaching without disrupting the workout flow.

**Voice Feedback Generation:**

**Trigger Points:**

1. **Between-Rep Feedback** (user rests 2+ seconds)
   - System: "Rep 2'de omuzlar ileri gelmişti, dikkat et"
   - Timing: User has rested, ready to listen
   - Latency tolerance: 5s acceptable

2. **Set Completion** (reps finished)
   - System: "Setinde 3 hata var: omuzlar, diz açısı, stabilite"
   - Detailed summary with priorities
   - Latency: 5-10s acceptable

3. **Session Completion**
   - System: Full feedback + memory-based coaching
   - Example: "Squatta form iyi ama deadliftte diz açısı zayıf. Sonraki seansında deadliftte daha dikkatli ol"

**Context Injection (Memory Layer Integration):**

```
User history (from Phase 1 memory):
- "Squatta form başarılı, deadliftte diz açısı zayıf"
- "Bench basışta right shoulder unstable"

VAPI Prompt enrichment:
"Bu kullanıcı squatta güçlü ama deadliftte zayıf.
Deadliftte daha dikkatli coaching yap.
Bench'te right shoulder'a fokus et.
Geçmiş seanslardan biliyorsun: [memory context]"
```

**TTS Fallback Strategy:**

- **If VAPI unavailable (network down):** Native device TTS
- **If VAPI timeout (>4s):** Skip voice, show text only
- **If model overloaded:** Queue feedback for after-session
- **Pre-recorded phrases:** 50 common cues for offline (no TTS latency)
  - Examples: "Harika!", "Daha derin!", "Omuzlar il-eri!"

**Voice Customization:**

- Turkish male/female (set once at onboarding)
- Speed: Normal, slow (for users who need processing time)
- Accent: Default to standard Turkish

---

### 4. FeedbackUI Component

**Responsibility:** Real-time form score and error display.

**Display Strategy:**

**Floating Card (Top-Right, Always Visible):**

```
┌─────────────────┐
│  Form Score     │
│      87/100     │
│                 │
│  ⚠️ Diz açısı   │ (Error if present)
└─────────────────┘
```

**Metrics:**

- Form Score: Large, bold, color-coded (green >80, yellow 60-80, red <60)
- Rep Counter: "Rep 3/10"
- Exercise: "Squat"
- Current Error: Top error only (non-intrusive)
- Real-time updates: Every frame (~30fps)

**Bottom Sheet (On-Demand):**

- Tap card → full error breakdown
- Detailed cues for each error
- Video clip of mistake (if recording enabled)
- Correction tip

**Session Summary (Post-Session):**

- Total reps × exercises
- Avg form score
- Top 3 errors (histogram)
- Top 3 successes
- Estimated calories
- Video highlights (best reps, worst reps)

---

### 5. SessionRecorder Component

**Responsibility:** Offline-first data persistence with network sync.

**Data Capture (Real-time):**

```typescript
interface SessionFrame {
  timestamp: number
  exercise: string
  formScore: number
  repNumber: number
  errors: FormError[]
  muscleEngagement: Record<string, number>
}

interface SessionRecord {
  id: string
  userId: string
  sessionId: string
  exercise: string
  startTime: Date
  endTime: Date
  totalReps: number
  avgFormScore: number
  frames: SessionFrame[]
  voiceFeedback: string[]
  videoClips?: string[] // compressed
  syncStatus: 'pending' | 'synced' | 'failed'
}
```

**Local Storage (SQLite):**

```sql
CREATE TABLE sessions (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  exercise TEXT,
  startTime DATETIME,
  endTime DATETIME,
  totalReps INTEGER,
  avgFormScore REAL,
  syncStatus TEXT DEFAULT 'pending',
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE session_frames (
  id TEXT PRIMARY KEY,
  sessionId TEXT REFERENCES sessions(id),
  timestamp INTEGER,
  formScore REAL,
  repNumber INTEGER,
  errors JSON,
  muscleEngagement JSON
);

CREATE TABLE sync_queue (
  id TEXT PRIMARY KEY,
  sessionId TEXT REFERENCES sessions(id),
  status TEXT DEFAULT 'pending',
  retryCount INTEGER DEFAULT 0,
  lastError TEXT,
  nextRetryAt DATETIME
);
```

**Sync Logic:**

1. **Offline Session:**
   - Write to SQLite immediately
   - Add to sync_queue with status='pending'
   - User sees: "Offline mode, syncs when connected"

2. **Network Connected:**
   - Batch sync (max 5 sessions per request)
   - Each session: compress frames, upload to PostgreSQL
   - On success: mark sync_queue as 'synced'
   - On failure: increment retryCount, schedule retry

3. **⚠️ Conflict Detection & Resolution (Robust)**

**Duplicate Detection Algorithm:**

```
A session is a duplicate if:
1. Same userId
2. Same exercise
3. startTime within 2 minutes (account for clock skew)
4. duration within 10% (account for timer differences)

Duplicate Score = Similarity(form_analysis_data)
- If 100% match (identical FormRepData): Certain duplicate
- If 90%+ match (same reps, same scores): Very likely duplicate
- If 70-90% match: Possible duplicate (manual review)
- If <70% match: Different sessions
```

**Winning Version Selection:**

```
When duplicate detected:
1. Compare analysis completeness
   - Which has more FormRepData rows? (more complete analysis wins)
2. Compare data quality
   - Which has higher median formScore confidence? (wins)
3. Compare timestamp
   - Which was created first? (assume that's the original)

Example:
- Mobile offline session: 10 reps, 80 frames, avg confidence 0.85
- Web re-upload: 10 reps, 30 frames, avg confidence 0.60
- Verdict: Keep mobile version (more complete analysis)
```

**Conflict Logging:**

- Log all conflicts to `SessionSyncConflict` table
- Include: which version won, why, both versions' data
- Monthly review: identify pattern issues (e.g., always web overwriting mobile)

4. **Retry Strategy:**
   - Immediate: 1s delay
   - If fails: 2s, 4s, 8s, 16s (exponential backoff)
   - Max 5 retries before manual intervention
   - User notification: "Session sync failed, tap to retry"

5. **Storage Cleanup Policy:**
   - Delete sync_queue entries after successful sync + 30 days
   - Prevent unbounded growth
   - Archive old sessions monthly (compress, move to cold storage)

---

## Chunk 3: User Flows & Interactions

### Flow 1: User Starts Form Analysis Session

```
1. User opens "Form Analizi ile Başla"
2. Camera permission check
   - If denied: "Kamera izni gerekli" → settings link
   - If granted: proceed
3. Exercise selection
   - List: Squat, Bench, Deadlift, etc (with thumbnails)
   - User selects "Squat"
4. Avatar appears (background)
   - Shows user's avatar doing squat
   - Greeting: "Merhaba! Hazırsan başlayalım"
5. VAPI listens (mic enabled)
6. Form analysis starts
   - Camera: User's movement
   - FormAnalyzer: Real-time pose detection
   - AvatarRenderer: Animates in sync
   - FeedbackUI: Floating card (top-right)
7. VoiceCoach: Provides real-time feedback
   - Error: "Omuzlar ileri"
   - Success: "Harika"
8. SessionRecorder: Writes to SQLite
```

### Flow 2: Session Ends → Summary & Avatar Update

```
1. User completes reps or taps "Finish"
2. SessionRecorder: Aggregates data
3. Summary screen:
   - Video highlights (best/worst reps)
   - Avg form score
   - Total reps
   - Top errors (histogram)
   - Calories burned
4. Avatar transformation preview
   - "This session contributed to your progress"
   - Show slight avatar change (visual feedback)
5. User can save or delete session
6. Background sync starts (if online)
   - Upload to PostgreSQL
   - Add to memory layer (Phase 1)
   - Update avatar state
```

### Flow 3: Weekly Avatar Transformation

```
1. Every Sunday (or on-demand)
2. Aggregate weekly session data:
   - Total sessions
   - Muscle engagement patterns
   - Weight (if integrated)
   - Body fat % (if available)
3. Calculate transformation:
   - Muscle +2% → avatar bigger
   - Fat -1% → avatar more defined
4. Animate transition over 24h:
   - Smooth mesh morph
   - Visual satisfaction
5. User gets notification:
   - "Your avatar evolved! Check progress"
6. Show before/after side-by-side
```

### Flow 4: Offline Mode (Multiple Sessions)

```
1. User offline, 3 sessions done
   - Each writes to SQLite immediately
   - sync_queue: [session1, session2, session3] (all pending)
2. Network connects
3. Background sync:
   - Session 1 uploads
   - Session 2 uploads
   - Session 3 uploads
   - All marked 'synced'
4. UI: "3 sessions synced ✓"
5. Memory layer updated with all 3
6. Avatar updated with aggregated progress
```

---

## Chunk 4: Error Handling & Edge Cases

### Camera Issues

| Scenario          | Handling                                                        |
| ----------------- | --------------------------------------------------------------- |
| Permission denied | "Kamera izni gerekli" → settings link → fallback to manual mode |
| Poor lighting     | Form score confidence drops, TTS: "Daha aydınlık yer gerekli"   |
| Camera crash      | Graceful restart, user loses current session (save prompt)      |
| No camera (web)   | Manual form input (dropdown: "How was your form?")              |

### Network Issues

| Scenario                     | Handling                                  |
| ---------------------------- | ----------------------------------------- |
| Offline session start        | Works fine, writes to SQLite              |
| Sync fails (retry exhausted) | User notification: "Tap to retry" button  |
| Partial upload               | Mark as 'pending', retry next time        |
| Duplicate session            | Server-side dedup (sessionId + timestamp) |

### Voice Issues

| Scenario                 | Handling                            |
| ------------------------ | ----------------------------------- |
| VAPI timeout (>5s)       | Fall back to TTS                    |
| Network loss mid-session | Cache response, finish with TTS     |
| No microphone            | Show text feedback instead of voice |
| Accent not available     | Default to Turkish-Female           |

### Performance Issues

| Scenario                      | Handling                                      |
| ----------------------------- | --------------------------------------------- |
| Memory leak (1+ hour session) | Aggressive cleanup, drop old frames           |
| Avatar rendering slow         | Reduce avatar detail, drop frame rate         |
| Form analysis lag (>200ms)    | Queue frames, catch up, may skip reps         |
| Battery drain                 | Offer "low-power mode" (reduce 3D, lower fps) |

### Data Conflicts

| Scenario                                | Handling                            |
| --------------------------------------- | ----------------------------------- |
| Session exists locally + cloud          | Last-write-wins, cloud version kept |
| User edits session on web while syncing | Queue conflict, notify user         |
| Avatar state out-of-sync                | Recalculate from session history    |

---

## Chunk 5: Testing Strategy

### Unit Tests

**FormAnalyzer:**

- ✓ Pose detection accuracy (TensorFlow model)
- ✓ Rep counting (10 reps → count == 10)
- ✓ Error detection (error array populated correctly)
- ✓ Muscle engagement scoring (0-1 range)

**AvatarRenderer:**

- ✓ Mesh generation (body params → valid mesh)
- ✓ Animation playback (smooth transitions)
- ✓ Body morph calculation (weight → avatar size)
- ✓ Mixamo animation loading

**VoiceCoach:**

- ✓ VAPI request formatting
- ✓ TTS fallback trigger
- ✓ Context injection (memory layer data)
- ✓ Voice customization

**FeedbackUI:**

- ✓ Form score rendering
- ✓ Error display (top error only)
- ✓ Rep counter accuracy
- ✓ Color coding (green/yellow/red)

**SessionRecorder:**

- ✓ SQLite write (frames inserted)
- ✓ Sync queue management
- ✓ Conflict resolution (last-write-wins)
- ✓ Retry logic (exponential backoff)

### Integration Tests

- ✓ Full session flow (camera → feedback → recorder → sync)
- ✓ Offline + online transition
- ✓ Avatar animation sync with form analysis
- ✓ Memory layer data capture
- ✓ VAPI + TTS switching

### Performance Tests

- ✓ Real-time form analysis latency (<200ms)
- ✓ Avatar rendering FPS (target 30fps)
- ✓ Memory usage (1-hour session < 500MB)
- ✓ Network sync time (100 frames < 5s)

### E2E Tests (Manual)

- ✓ Full session: squat, 10 reps, form errors, voice feedback, sync
- ✓ Offline session: 3 workouts offline, sync when online
- ✓ Avatar transformation: Complete week, see avatar change
- ✓ Error recovery: Disconnect network, reconnect, verify sync

---

## Chunk 6: Implementation Priorities

### Phase 2.1: Session UI (Week 1-2)

- [ ] FormAnalyzer component (TensorFlow pose detection)
- [ ] FeedbackUI component (floating card + summary)
- [ ] Basic camera integration
- [ ] SessionRecorder (SQLite + basic sync)

### Phase 2.2: Avatar & Animation (Week 2-3)

- [ ] AvatarRenderer (Babylon.js + Mixamo)
- [ ] Avatar generation from body params
- [ ] Animation sync with form analysis
- [ ] Progress transformation logic

### Phase 2.3: VAPI Voice (Week 3)

- [ ] VoiceCoach (VAPI integration)
- [ ] TTS fallback
- [ ] Memory layer context injection
- [ ] Real-time feedback generation

### Phase 2.4: Polish & Sync (Week 4)

- [ ] Offline-first sync queue
- [ ] Conflict resolution
- [ ] Error handling & recovery
- [ ] Performance optimization

---

## Chunk 7: Risk Mitigation & POC Requirements

### Critical Proof-of-Concepts (Required Before Implementation)

**POC 1: Babylon.js Mobile Performance (Week 1 Preparation)**

_Goal:_ Validate that we can achieve 20+ FPS on iPhone 12 with concurrent TensorFlow.js + Babylon.js

_Acceptance Criteria:_

- Babylon.js avatar renders at 20+ fps
- TensorFlow.js pose detection runs at 15+ fps
- Both running concurrently on iPhone 12 (not sequence)
- Battery drain acceptable (<10% per 30min session)

_If POC fails:_

- Option A: Use 2D avatar (flat PNG sprite, animated via CSS)
- Option B: Pre-render exercise videos (no real-time 3D)
- Option C: Simplify to stick figure (like competitors do)

**POC 2: Mixamo Animation Integration (Week 1 Preparation)**

_Goal:_ Verify we can load, blend, and play Mixamo animations on React Native

_Acceptance Criteria:_

- 5 test animations load successfully
- Smooth blending between animations
- Speed matching works (play at 1.5x speed for fast user)
- Total bundle size <5MB (before app compression)

_If POC fails:_

- Use pre-recorded video of trainer performing exercises (not 3D avatar)

**POC 3: VAPI Real-World Latency (Week 1 Preparation)**

_Goal:_ Measure actual VAPI latency on 4G, LTE, WiFi

_Acceptance Criteria:_

- Record latency on 3+ devices, 3+ network types
- Validate queue-based feedback model (test with real users)
- Confirm between-rep latency (2-5s) acceptable to users

_If latency consistently >6s:_

- Use pre-recorded voice library (not real-time VAPI)
- Provide text-only feedback for fast reps

### Implementation Guard Rails

1. **Device Support:** Launch with iPhone 12+ and Android 10+. Explicitly not supporting iPhone 8 or older.
2. **Form Analysis Accuracy:** Require 70%+ accuracy on 10-rep test video before release. If lower, document limitations.
3. **Avatar Quality:** MVP uses 5 customization options (skin tone only). Do not add more until Phase 3.
4. **Video Recording:** Not included in Phase 2. Defer to Phase 3 or later.
5. **Offline Capability:** Must work without network for at least 5 sessions before sync.

---

## Open Questions for Review

1. **Body Composition Data:** Should we integrate with Fitbit/Garmin/Apple Health for weight + body fat data (Phase 3), or ask user to input weight manually in Phase 2?
2. **Avatar Clothing:** Should avatars wear branded FitAI gear, or generic gym clothes? (Defer to Phase 3)
3. **Male/Female Avatars:** Always show user's gender avatar, or allow custom selection? (Phase 2: match gender, Phase 3: allow custom)
4. **Network Optimization:** Should we implement differential sync (only upload changed frames) or batch all frames? (MVP: batch all frames, Phase 3: differential)
5. **Accessibility:** Should we implement captions for voice feedback? (Yes, Phase 2.4)

---

## MVP Scope Summary (What's In Phase 2)

**Phase 2.1: Session UI & Form Analysis**

- ✅ Camera integration
- ✅ TensorFlow.js pose detection (COCO)
- ✅ Floating form score card
- ✅ Rep counter
- ✅ SQLite local storage
- ❌ Video recording
- ❌ Avatar
- ❌ Voice

**Phase 2.2: Avatar & Animation**

- ✅ Babylon.js 3D model (low-poly, mobile-optimized)
- ✅ Mixamo animation integration (50-100 core exercises)
- ✅ Body weight transformation (simple weight-based scaling)
- ✅ Skin tone customization (5 options)
- ❌ Complex body composition morphing
- ❌ Accessories, hair, clothing variants
- ❌ Side view, Before/After comparison

**Phase 2.3: VAPI Voice Integration**

- ✅ Queue-based voice feedback (between reps)
- ✅ TTS fallback (offline mode)
- ✅ Memory layer context injection
- ✅ Turkish male/female voice
- ❌ Real-time interrupting feedback
- ❌ Speech recognition (user says exercises)

**Phase 2.4: Sync & Polish**

- ✅ SQLite → PostgreSQL sync queue
- ✅ Conflict detection & resolution
- ✅ Exponential backoff retry
- ✅ Offline-first support (5+ sessions)
- ❌ Delta sync optimization
- ❌ Video compression

---

**Design complete and revised. Ready for spec review? Proceed with subagent-driven-development for implementation.**
