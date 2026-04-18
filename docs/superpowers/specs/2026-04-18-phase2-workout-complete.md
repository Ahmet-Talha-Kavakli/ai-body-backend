# Phase 2: Complete Workout System (Mobile)

> **For agentic workers:** Use superpowers:subagent-driven-development or superpowers:executing-plans.

**Goal:** Full workout tracking with real-time form analysis, 3D avatar feedback, exercise library, offline session recording.

**Architecture:** Camera-based session tracking with MediaPipe pose detection, TensorFlow.js form analysis, Babylon.js 3D avatar, SQLite offline session storage, FormRepData per-rep analysis matching web.

**Tech Stack:** Expo Camera, TensorFlow.js, MediaPipe, Babylon.js, SQLite, React Native Reanimated

---

## Overview

Port web's complete workout system to mobile:

- **Workout Programs:** AI-generated or manual programs with weekly structure
- **Session Tracking:** Start/pause/stop with real-time timer
- **Form Analysis:** Per-rep pose detection (MediaPipe) + form quality scoring
- **3D Avatar:** Live feedback showing user's pose + corrections
- **Exercise Library:** 300+ exercises by muscle group + difficulty
- **Offline Recording:** Sessions save locally, sync video + data when online
- **Analytics:** Session history, form trends, weakness tracking

## Database Models

### (From Prisma Schema)

- **WorkoutProgram, ProgramWeek, ProgramDay, PlannedExercise** (program planning)
- **WorkoutSession** (completed sessions)
- **CompletedSet** (per-set data)
- **FormRepData** (per-rep form analysis - 8 fields)
- **WorkoutAnalytics** (aggregated per-session)
- **UserWeakness** (tracked weak points)
- **Exercise** (300+ library with poseConfig)

## Screens

**WorkoutStartScreen**

- Quick start (preset programs)
- Custom workout builder
- Recent workouts carousel
- Browse exercise library

**SessionCameraScreen** (Main workout)

- Full-screen camera
- MediaPipe pose overlay
- Real-time feedback (top 2 issues)
- Exercise info + form tips
- Timer + rep counter
- 3D avatar panel (bottom-right, 20% screen)
- Pause/stop/skip buttons

**ExerciseLibraryScreen**

- Search + filter by muscle group
- Exercise cards (name, difficulty, target muscle)
- Detail view: video demo, form tips, variations, personal records

**WorkoutHistoryScreen**

- Date-filtered list with stats
- Tap to expand: exercise breakdown, form quality, notes
- Charts: calories, form trend, muscle engagement

## Key Features

### Form Analysis Rules

Each exercise has rule set (e.g., Squat):

- knee_angle < 90° (importance 0.3)
- back_straight < 10° deviation (importance 0.4)
- feet_shoulder_width ±2cm (importance 0.3)
- Real-time feedback: "Knees in, back straight"
- Form score: 0-100 per rep, averaged per set

### Real-Time Feedback Pipeline

```
Camera Feed
  → MediaPipe pose detection (30 FPS)
  → Extract keypoints (17 points)
  → Evaluate form rules
  → Calculate form score
  → Generate feedback ("Go deeper")
  → Show in UI + voice cue
```

### 3D Avatar

- Babylon.js human model
- Live pose update from MediaPipe keypoints
- Correct form overlay (ghosted)
- Color-coded feedback (green=correct, red=issue)

### Offline Session Recording

- Record video file locally (MP4)
- Store FormRepData in SQLite
- On sync: upload video to backend + POST session data
- Optimistic UI (show syncing status)

## API Endpoints

```
POST   /api/sessions                  → Create session
PUT    /api/sessions/:id              → Update session (add sets, end)
GET    /api/sessions                  → List user's sessions
GET    /api/sessions/:id              → Get session details
GET    /api/exercises                 → Get exercise library (paginated)
GET    /api/exercises/:id             → Get exercise details + form rules
POST   /api/sessions/:id/upload       → Upload video file
GET    /api/user/weaknesses           → Get tracked weaknesses
POST   /api/workout/analytics         → Get analytics (strength trends)
```

## Testing

- Unit: Form rule evaluation, score calculation
- Integration: Session flow (start → exercise → finish → save)
- UI: Camera permissions, feedback display
- Offline: Session saves locally, syncs on reconnect

## Success Criteria

✅ Camera feed with live pose detection
✅ Form quality scored per rep (0-100)
✅ 3D avatar shows user pose + corrections
✅ Sessions saved to SQLite, synced to backend
✅ Video recorded + uploaded
✅ Exercise library searchable + detailed
✅ Workout history with analytics
✅ Works offline (camera + local save)
✅ 80%+ test coverage

## Timeline

~7-10 days (after Phase 1)

---

## Notes

- FormRepData structure: keypoints[], angles[], formScore, technicalCorrectness, errors[], muscleEngagement, injuryRisk, voiceFeedback, corrections[]
- Per-rep feedback enables progression tracking (weak form vs improving form)
- Video upload asynchronous (don't block UI)
- Form rules extensible (add new exercises dynamically)
