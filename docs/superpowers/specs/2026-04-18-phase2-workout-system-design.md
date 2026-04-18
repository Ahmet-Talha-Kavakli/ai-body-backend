# Phase 2: Workout System Design

> **For agentic workers:** Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan.

**Goal:** Build comprehensive workout tracking with real-time form analysis, 3D avatar feedback, and exercise library.

**Architecture:** Session-based workout flow with camera feed + pose detection (TensorFlow.js), 3D avatar rendering (Babylon.js), form rule evaluation, and real-time feedback UI.

**Tech Stack:** React Native Camera, TensorFlow.js, Babylon.js, SQLite (offline sessions), WebRTC (video processing)

---

## 1. Overview

Phase 2 adds mobile-specific workout capabilities:

- **Session Tracking:** Start, pause, stop workouts with timer
- **Form Analysis:** Real-time pose detection + exercise-specific feedback
- **3D Avatar:** Live feedback avatar showing correct form
- **Exercise Library:** Browse exercises by muscle group, difficulty
- **Workout History:** View past sessions, analytics
- **Offline Support:** Sessions save locally, sync when online

---

## 2. Architecture

### Data Flow

```
Camera Feed
    ↓
Pose Detection (TensorFlow.js + MediaPipe)
    ↓
Form Analysis (Exercise-specific rules)
    ↓
Feedback Generation (Text + 3D visualization)
    ↓
Session Recording (Duration, reps, form quality)
    ↓
SQLite (Local cache) + Backend sync
```

### Components

**SessionCamera Screen**

- Live camera feed with pose detection overlay
- Real-time feedback UI (text + form quality score)
- Start/stop/pause controls

**3D Avatar Feedback**

- Babylon.js scene with human model
- Live pose update from MediaPipe
- Form corrections visualization

**ExerciseLibrary Screen**

- Search/filter by muscle group
- Exercise details, form tips, video demos
- Add to favorite/quick-start

**WorkoutHistory Screen**

- List of past workouts with analytics
- Detailed session view (exercise breakdown, form scores)
- Progress charts

**FormAnalyzer**

- Exercise-specific form rules (squat, deadlift, etc.)
- Real-time rule evaluation
- Feedback generation (e.g., "Knees too far forward")

---

## 3. Screens

**WorkoutStartScreen**

- Quick start buttons (preset workouts)
- Custom workout builder
- Recent workouts carousel

**SessionCameraScreen** (Main workout)

- Full-screen camera feed
- MediaPipe pose visualization overlay
- Real-time feedback (centered, large text)
- Exercise info (name, target reps, form tips)
- Timer + current rep counter
- 3D avatar panel (bottom-right corner)
- Pause/stop buttons

**ExerciseLibraryScreen**

- Search bar
- Filter by muscle group (chest, back, legs, etc.)
- Exercise cards (name, difficulty, muscle group)
- Exercise detail view (video demo, form tips, variations)

**WorkoutHistoryScreen**

- Date-filtered list of workouts
- Each item shows: date, duration, exercises, avg form score
- Tap to expand details

**WorkoutDetailScreen**

- Exercise breakdown (reps, form quality, notes)
- Charts (calories, duration, form trend)
- Edit/delete options

---

## 4. Data Models

### Workout Session (SQLite)

```typescript
{
  id: string;
  userId: string;
  startedAt: timestamp;
  endedAt: timestamp;
  exercises: Exercise[];
  totalDuration: number; // minutes
  totalCalories: number;
  avgFormQuality: number; // 0-100
  synced: boolean;
}
```

### Exercise (within session)

```typescript
{
  id: string;
  exerciseId: string; // from exercise library
  name: string;
  targetReps: number;
  actualReps: number;
  sets: number;
  completedSets: number;
  formQualityScores: number[]; // per rep
  avgFormQuality: number;
  notes?: string;
  videoUrl?: string; // recording of session
}
```

### Exercise Library

```typescript
{
  id: string;
  name: string;
  muscleGroup: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  description: string;
  formTips: string[];
  videoUrl: string;
  formRulesId: string; // reference to form analyzer rules
  targetReps: number;
}
```

### FormQualityScore

```typescript
{
  repNumber: number;
  score: number; // 0-100
  feedback: string[]; // ["knees too far forward", ...]
  keypoints: Keypoint[]; // pose data
}
```

---

## 5. Key Features

### Form Analysis Rules

Each exercise has rule set (e.g., Squat):

```typescript
{
  exerciseId: 'squat',
  rules: [
    {
      name: 'knee_angle',
      check: (keypoints) => keypoints.leftKnee.angle < 90,
      feedback: 'Go deeper',
      weight: 0.3, // importance in score
    },
    {
      name: 'back_straight',
      check: (keypoints) => keypoints.spine.angle < 10,
      feedback: 'Keep back straight',
      weight: 0.4,
    },
    {
      name: 'feet_shoulder_width',
      check: (keypoints) => keypoints.feet.distance === shoulderWidth,
      feedback: 'Feet closer together',
      weight: 0.3,
    },
  ],
}
```

### Real-time Feedback

- Audio cues: "Rep 1... go!" beep on complete
- Visual feedback: Green/red overlay on form issues
- Text feedback: "Knees in, back straight" (top 2 issues)
- Form quality score: 0-100 per rep, averaged

### Offline Support

- Sessions recorded locally in SQLite
- Video saved to device storage
- On reconnect, sync to backend with video upload
- Optimistic UI (show sync status)

---

## 6. API Endpoints

```
POST   /api/workout/sessions              → Create session
PUT    /api/workout/sessions/:id          → Update session
GET    /api/workout/sessions              → List user's sessions
GET    /api/workout/sessions/:id          → Get session details
GET    /api/exercises                     → Get exercise library
GET    /api/exercises/:id                 → Get exercise details
POST   /api/workout/sessions/:id/upload   → Upload video
GET    /api/workout/analytics             → User analytics (calories, streak, etc.)
```

---

## 7. Testing Strategy

- **Unit tests:** Form rule evaluation, score calculation
- **Integration tests:** Session flow (start → exercise → finish → save)
- **UI tests:** Camera permissions, form feedback display
- **Offline tests:** Session saves locally, syncs on reconnect

---

## 8. Success Criteria

✅ Camera feed displays live pose detection
✅ Form quality scores calculated per rep
✅ 3D avatar shows user pose in real-time
✅ Sessions saved to SQLite, synced to backend
✅ Exercise library searchable
✅ Workout history displays with analytics
✅ Works offline (camera still works, data saves locally)
✅ 80%+ test coverage

---

## 9. Timeline

~7-10 days (after Phase 1 complete)
