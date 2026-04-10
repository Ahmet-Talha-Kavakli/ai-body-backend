# AiFiti - Comprehensive AI Gym Coach

**Date:** 2026-04-10  
**Project:** AI-Powered Real-time Form Detection + Holistic Fitness Coaching  
**Status:** Design Approved

---

## Executive Summary

Transform AiFiti into a **comprehensive AI gym coach** that combines real-time pose detection, form analysis, and holistic user profiling. The AI will have complete knowledge of user fitness history, nutrition, injuries, weaknesses, and elite coaching methodologies to provide personalized, context-aware guidance during every workout.

---

## 1. System Architecture

### Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    USER INTERACTION                         │
│  (Workout Session, Nutrition Logging, Sleep, Stress, etc.)  │
└────────────────────────┬────────────────────────────────────┘
                         ↓
        ┌────────────────────────────────────┐
        │   DATA INGESTION & NORMALIZATION   │
        │  ├─ Pose Data (MediaPipe)          │
        │  ├─ Workout History (DB)           │
        │  ├─ Nutrition (Manual + API)       │
        │  ├─ Health Metrics (Wearables)     │
        │  └─ User Profile (Injuries, Goals) │
        └────────────────────────────────────┘
                         ↓
        ┌────────────────────────────────────┐
        │   VECTOR DATABASE (Semantic)       │
        │  ├─ Historical Patterns            │
        │  ├─ Weakness Trends                │
        │  ├─ Form Consistency               │
        │  └─ Recovery Status                │
        └────────────────────────────────────┘
                         ↓
        ┌────────────────────────────────────┐
        │   KNOWLEDGE BASE (Embedding)       │
        │  ├─ Biomechanics Research          │
        │  ├─ Training Methodologies         │
        │  ├─ Nutrition Science              │
        │  ├─ Elite Coach Knowledge          │
        │  └─ Exercise Variations            │
        └────────────────────────────────────┘
                         ↓
        ┌────────────────────────────────────┐
        │   GPT-4o (MAIN COACH ENGINE)       │
        │  ├─ Real-time Analysis             │
        │  ├─ Personalized Recommendations   │
        │  ├─ Context-aware Coaching         │
        │  └─ Holistic Decision Making       │
        └────────────────────────────────────┘
                         ↓
        ┌────────────────────────────────────┐
        │   COACHING OUTPUT (Multi-modal)    │
        │  ├─ Form Score (1-100)             │
        │  ├─ Voice Feedback (TTS)           │
        │  ├─ Visual Cues (AR)               │
        │  ├─ Session Recommendations        │
        │  └─ Long-term Plan Adjustments     │
        └────────────────────────────────────┘
                         ↓
        ┌────────────────────────────────────┐
        │   DATABASE PERSISTENCE             │
        │  ├─ Workout Sessions               │
        │  ├─ Rep-by-rep Data                │
        │  ├─ Analytics & Trends             │
        │  └─ Coach Decisions (for learning) │
        └────────────────────────────────────┘
```

---

## 2. User Profile Model

### Complete User Data Structure

```
User Profile = {
  // BASIC INFO
  id, email, name, age, gender,
  
  // PHYSICAL METRICS
  {
    height_cm,
    weight_kg,
    body_fat_percent,
    muscle_mass_kg,
    measurements: { chest, waist, arms, legs, ... }
  },
  
  // INJURIES & HEALTH
  {
    active_injuries: [
      {
        body_part: "left_shoulder",
        severity: "moderate",
        start_date,
        notes: "ACL tear from skiing",
        restrictions: ["no_heavy_overhead", "limit_abduction"],
        recovery_timeline: "June 2026"
      },
      ...
    ],
    past_injuries: [...],
    pain_points: { shoulder_ache, lower_back_tightness, ... },
    mobility_issues: [...],
    medical_conditions: ["diabetes", "hypertension", ...],
    allergies: [...]
  },
  
  // FITNESS HISTORY (Time-series)
  {
    all_sessions: [
      {
        date,
        exercise,
        sets, reps, weight,
        form_score_avg,
        duration,
        notes,
        workout_quality_score,
        recovery_next_day,
        energy_level_reported
      }
    ],
    personal_records: {
      squat_1rm: 150kg,
      bench_1rm: 100kg,
      deadlift_1rm: 200kg,
      ...
    },
    strength_trends: {
      squat: [95kg, 100kg, 105kg, 110kg],  // Last 4 weeks
      bench: [...],
      ...
    },
    weakness_analysis: {
      weak_exercises: ["leg_curl", "face_pulls"],
      weak_muscle_groups: ["posterior_chain", "rear_delts"],
      form_weak_points: ["knee_valgus_in_squat", "rounded_back_in_deadlift"],
      muscle_imbalance: { left_quad: -12%, right_hamstring: +8% }
    }
  },
  
  // NUTRITION PROFILE
  {
    daily_targets: { calories: 2500, protein: 180g, carbs: 250g, fat: 80g },
    recent_meals: [
      {
        date, meal_type, items, calories, protein, carbs, fat,
        photo_url, ai_analyzed
      }
    ],
    nutrition_trends: {
      avg_daily_calories_last_week: 2350,
      protein_consistency: 85%, // % of days hit target
      hydration_daily_ml: 2800,
      micronutrient_levels: { vitamin_d: "sufficient", iron: "low", ... }
    }
  },
  
  // RECOVERY & LIFESTYLE
  {
    sleep: {
      last_night_hours: 7.5,
      weekly_average: 6.8,
      quality_score: 7, // 1-10
      notes: "Woke up 2x"
    },
    stress: {
      current_level: 6, // 1-10
      work_deadline: "Friday",
      personal_stressors: []
    },
    heart_rate: {
      resting_hr: 58,
      last_recorded: DateTime,
      trend: "improving"
    }
  },
  
  // GOALS & CONSTRAINTS
  {
    primary_goal: "hypertrophy", // strength, hypertrophy, endurance, weight_loss
    timeline: "12 weeks",
    specific_targets: ["bigger_legs", "stronger_bench", "fix_posterior_chain"],
    
    constraints: {
      available_days_per_week: 4,
      session_duration_minutes: 75,
      equipment_access: "full_commercial_gym",
      travel_schedule: ["March 15-20 business trip"]
    },
    
    periodization_plan: {
      current_phase: "hypertrophy",
      phase_start_date: "2026-03-10",
      phase_duration_weeks: 6,
      deload_week: "Week 10",
      peak_date: "2026-05-15"
    }
  },
  
  // AI COACH HISTORY
  {
    coaching_decisions_made: [...],  // For AI learning
    preferred_coaching_style: "direct", // motivational, direct, analytical, etc.
    response_to_feedback: "positive", // How user responds to corrections
    compliance_score: 0.92 // % adherence to coach recommendations
  }
}
```

---

## 3. Real-time Coaching Logic

### Decision Tree During Workout

```
SESSION START:
├─ Retrieve user profile
├─ Analyze current state:
│  ├─ Sleep quality last night
│  ├─ Nutrition today vs. target
│  ├─ Stress level
│  ├─ Recovery status (soreness, fatigue)
│  ├─ Injury status (all clear? risk level?)
│  └─ Energy level (self-reported or inferred)
│
├─ Decision: Proceed or Modify?
│  IF (sleep < 5 hours) AND (injury active) THEN
│    → Modify: Reduce volume, form focus
│  ELSE IF (nutrition low) AND (intense session planned) THEN
│    → Warn: "Fuel up first, 30g carb"
│  ELSE IF (recovery_score < 5/10) THEN
│    → Recommend: "Light session today"
│  ELSE
│    → "Let's go! Full intensity"
│
└─ Adjust session recommendation based on history

PER REP ANALYSIS:
├─ Pose detection → Angles
├─ GPT-4o Analysis:
│  ├─ "Is this form correct for THIS USER's history & injuries?"
│  ├─ "How does this compare to their past reps?"
│  ├─ "Is there a weakness pattern I should correct?"
│  ├─ "What's the injury risk for this rep?"
│  └─ "What coaching cue would help THEM most?"
│
├─ Form Score Calculation:
│  = (technical_correctness × 60%) 
│    + (consistency_with_history × 20%)
│    + (injury_avoidance_score × 20%)
│
├─ Voice Feedback Generation:
│  IF (form_error detected) THEN
│    → Specific cue: "Diz açısını 15° daha aç"
│  ELSE IF (form improving from last session) THEN
│    → Motivational: "Form'u iyileştirdin! +4 puan"
│  ELSE
│    → Encouraging: "Rep 5/12, harika gidiyor!"
│
└─ Decision Log & History Update

SESSION END:
├─ Aggregate session data
├─ Compare to historical baseline
├─ Identify trends:
│  ├─ Strength progression
│  ├─ Form consistency
│  ├─ Weak point improvement
│  ├─ Recovery pattern
│  └─ Nutrition impact
├─ Generate session report:
│  ├─ Overall quality score
│  ├─ Best/worst rep analysis
│  ├─ Muscle imbalance findings
│  ├─ Injury risk assessment
│  ├─ Recommendations (rest, nutrition, next session)
│  └─ Long-term plan adjustments
└─ Store all data for future context
```

---

## 4. Knowledge Base Components

### Elite Coaching Methodologies

```
TRAINING SCIENCE:
├─ Periodization Models
│  ├─ Linear (classic strength progression)
│  ├─ Undulating (DUP - daily undulating periodization)
│  ├─ Block (Westside Barbell - Max Effort, Dynamic, Repetition)
│  ├─ Conjugate (Louie Simmons principles)
│  └─ Autoregulation (RPE, RIR - Reps in Reserve)
│
├─ Progressive Overload Strategies
│  ├─ Strength: Add weight (2-5% increments)
│  ├─ Hypertrophy: Add volume or reduce rest (target 6-20 reps)
│  ├─ Endurance: Decrease rest, increase reps
│  └─ Dynamic: Vary rep ranges, tempos, angles
│
├─ Recovery Protocols
│  ├─ Sleep optimization (7-9 hours for muscle growth)
│  ├─ Nutrition (macros, meal timing, hydration)
│  ├─ Stress management (cortisol effects on progress)
│  ├─ Deload weeks (every 4-6 weeks, 50% normal volume)
│  └─ Active recovery (mobility, light cardio)

BIOMECHANICS:
├─ Optimal Movement Patterns (per exercise)
│  ├─ Squat: Optimal angles per body structure
│  ├─ Deadlift: Back angle, knee position, hip drive
│  ├─ Bench: Scapular position, grip, bar path
│  ├─ Pull-ups: Lat engagement, full ROM
│  └─ All exercises (33 major compound + accessories)
│
├─ Injury Prevention
│  ├─ Common weak points (ACL in squats, lower back in deadlifts)
│  ├─ Muscle imbalance risks
│  ├─ Overuse patterns
│  └─ Pain vs. discomfort distinction

NUTRITION SCIENCE:
├─ Caloric Needs (based on activity, age, gender, goals)
├─ Macro Distribution (protein per lb, carb timing, fat sources)
├─ Micronutrient Deficiencies & Symptoms
├─ Supplement Efficacy (evidence-based: creatine, protein, beta-alanine, caffeine)
├─ Meal Timing Impact (pre/post workout optimization)
└─ Hydration & Performance (impact on strength, endurance)

SPORTS PSYCHOLOGY:
├─ Motivation Techniques (intrinsic vs. extrinsic)
├─ Mind-Muscle Connection (concentration cues)
├─ Plateau Breaking Strategies
├─ Injury Comeback (psychological resilience)
└─ Consistency Reinforcement (habit formation)

ELITE COACH KNOWLEDGE:
├─ Louie Simmons (Westside Barbell - Conjugate Method)
├─ Mike Israetel (Renaissance Periodization - MV, MEV, MAV)
├─ Stronger by Science (Evidence-based training)
├─ Renaissance Periodization (Adaptive programming)
├─ NASM/ISSA/ISSN Certifications
└─ Real-time feel-based adjustment (beyond metrics)
```

---

## 5. Data Collection & Storage

### Per-Rep Data Structure

```json
{
  "sessionId": "sess_abc123",
  "exerciseName": "squat",
  "repNumber": 5,
  "setNumber": 2,
  "timestamp": "2026-04-10T10:30:15.123Z",
  
  "pose_data": {
    "keypoints": [
      { "name": "nose", "x": 0.45, "y": 0.2, "confidence": 0.98 },
      { "name": "left_shoulder", "x": 0.35, "y": 0.3, "confidence": 0.97 },
      { "name": "right_shoulder", "x": 0.55, "y": 0.3, "confidence": 0.96 },
      { "name": "left_elbow", "x": 0.30, "y": 0.45, "confidence": 0.95 },
      { "name": "right_elbow", "x": 0.60, "y": 0.45, "confidence": 0.94 },
      { "name": "left_wrist", "x": 0.25, "y": 0.60, "confidence": 0.92 },
      { "name": "right_wrist", "x": 0.65, "y": 0.60, "confidence": 0.91 },
      { "name": "left_hip", "x": 0.38, "y": 0.65, "confidence": 0.99 },
      { "name": "right_hip", "x": 0.52, "y": 0.65, "confidence": 0.99 },
      { "name": "left_knee", "x": 0.36, "y": 0.85, "confidence": 0.98 },
      { "name": "right_knee", "x": 0.54, "y": 0.85, "confidence": 0.98 },
      { "name": "left_ankle", "x": 0.35, "y": 1.0, "confidence": 0.97 },
      { "name": "right_ankle", "x": 0.55, "y": 1.0, "confidence": 0.97 },
      // ... 20 more keypoints (full 33 from MediaPipe)
    ],
    "frame_count": 75,  // 75 frames @ 30fps = 2.5 seconds
    "duration_seconds": 2.5
  },
  
  "angles": {
    "knee_left": 65,
    "knee_right": 66,
    "hip_left": 45,
    "hip_right": 44,
    "spine": 15,
    "shoulder_left": 90,
    "shoulder_right": 91,
    "ankle_left": 85,
    "ankle_right": 86
  },
  
  "analysis": {
    "form_score": 87,
    "technical_correctness": 0.92,
    "consistency_with_history": 0.85,
    "injury_avoidance_score": 0.88,
    
    "errors_detected": [
      {
        "error": "knee_angle_too_narrow",
        "severity": "minor",
        "body_part": "left_knee",
        "current_value": 65,
        "ideal_value": 45,
        "cue": "Diz açısını 20° daha aç"
      }
    ],
    
    "feedback": "Form'u iyileştirdin! Diz açısını biraz daha aç, çok yakın.",
    "form_trend": "improving",  // vs. last rep
    "movement_speed": "optimal",  // too_slow, optimal, too_fast
    "depth_assessment": "full_range",  // partial, full_range, excessive
    "stability_score": 0.89,
    "muscle_engagement": {
      "quadriceps": 0.92,
      "hamstrings": 0.85,
      "glutes": 0.88,
      "core": 0.80,
      "lower_back": 0.75
    }
  },
  
  "injury_risk": {
    "risk_level": 5,  // 1-100
    "risk_factors": [
      "user_has_knee_history",
      "form_minor_deviation"
    ],
    "safe_to_continue": true,
    "modifications_needed": false
  },
  
  "coaching": {
    "voice_feedback": "Form'u iyileştirdin! Diz açısını 20° daha aç.",
    "ar_highlights": {
      "left_knee": "red",  // needs correction
      "right_knee": "green",  // good
      "hips": "green",
      "spine": "green"
    },
    "next_rep_tip": "Sol diz açısını 45° target et"
  },
  
  "context": {
    "user_sleep_last_night": 7.5,
    "user_nutrition_today": { calories: 2200, target: 2500 },
    "user_stress_level": 6,
    "user_energy_level_reported": 8,
    "session_fatigue_level": 5,  // How tired user is at this rep
    "weight_used": 110,
    "weight_progression": "same",  // increased, same, decreased
    "rpe": 7,  // Rate of Perceived Exertion (1-10)
    "rir": 2  // Reps in Reserve
  },
  
  "database_record": {
    "stored_at": "2026-04-10T10:30:20Z",
    "vector_embedded": true,  // For semantic search
    "coaching_decision_logged": true  // For AI learning
  }
}
```

---

## 6. AI Coach Prompt Engineering

### System Prompt (Knowledge Integration)

```
You are an elite personal trainer AI with expertise from:
- Louie Simmons (Westside Barbell - Conjugate Method)
- Mike Israetel (Renaissance Periodization)
- Stronger by Science (Evidence-based training)
- NASM/ISSA/ISSN Certifications
- Modern sports science & biomechanics research

Your responsibilities:
1. Analyze user's form in real-time using pose data
2. Generate personalized coaching based on their complete history
3. Adapt coaching based on recovery, nutrition, injuries
4. Make long-term programming decisions
5. Predict and prevent injuries
6. Motivate and educate the user

Input: Pose angles, user history, current context
Output: Form score, voice feedback, AR cues, session recommendations

Always prioritize:
1. Safety (injury prevention)
2. Form quality
3. Long-term progression
4. Personalization (user-specific)
```

---

## 7. User Interface (Workout Session)

### Live Coaching Screen

```
┌──────────────────────────────────────────────────┐
│ SQUAT - SET 2/4 - REP 5/12 - 45 SEC             │
├──────────────────────────────────────────────────┤
│                                                  │
│  ┌──────────────────────────────────────┐       │
│  │  CAMERA FEED (with skeleton overlay) │       │
│  │  ├─ Left knee: 65° 🔴 (45° ideal)  │       │
│  │  ├─ Right knee: 66° 🟢             │       │
│  │  ├─ Hips: 45° 🟢                   │       │
│  │  ├─ Spine: 15° 🟢                  │       │
│  │  └─ Stability: 89% ✅              │       │
│  └──────────────────────────────────────┘       │
│                                                  │
│  ┌──────────────────────────────────────┐       │
│  │  FORM SCORE: 87/100 📊              │       │
│  │  Injury Risk: 5% ✅                 │       │
│  │  Energy: 8/10 ⚡                     │       │
│  └──────────────────────────────────────┘       │
│                                                  │
│  "Form iyileşti! Diz açısını 20° daha aç" 🎙️ │
│                                                  │
│  [Rep Progress: ████░░░░░░░░░░░░░░░] 5/12     │
│                                                  │
│  💾 Saved to history | 📈 Form trending ↑      │
└──────────────────────────────────────────────────┘
```

---

## 8. Post-Workout Report

```
SESSION SUMMARY - SQUAT (4 sets x 12 reps)
═════════════════════════════════════════════

📊 PERFORMANCE METRICS:
├─ Total Duration: 18 minutes
├─ Average Form Score: 84/100
├─ Best Rep: #8 (89/100)
├─ Worst Rep: #3 (76/100)
├─ Form Consistency: ↑ Improving (+3 avg vs. last week)
└─ Energy Level: 8/10

💪 MUSCLE ENGAGEMENT:
├─ Quadriceps: 91% (primary, excellent)
├─ Glutes: 87% (good)
├─ Hamstrings: 82% (adequate)
├─ Core: 78% (could improve)
└─ Lower Back: 72% (watch for heavy days)

⚠️ FORM ISSUES FOUND:
├─ Left knee angle (consistently narrow by 15-20°)
├─ Core engagement dipping on final reps
└─ Slight forward lean (watch for lower back load)

🚨 INJURY RISK ASSESSMENT:
├─ Overall Risk Level: 4% ✅
├─ Risk Factor: Left knee history (ACL)
├─ Mitigation: Form correction applied
└─ Status: Safe to progress

📈 PROGRESSION ANALYSIS:
├─ Last Week Average Form: 81/100
├─ This Week Average Form: 84/100
├─ Improvement: +3 points ✅
├─ Strength Trend: Consistent (+2 reps from week 1)
└─ Recommendation: Ready to increase weight 2-5%

🔔 RECOMMENDATIONS:
1. Next Session: "Increase weight to 115kg (was 110kg)"
2. Weakness Focus: "Add 2 sets of leg extensions for left quad"
3. Recovery: "Sleep 7.5+ hours tonight (critical for gains)"
4. Nutrition: "Post-workout: 40g protein + 60g carbs within 30 min"
5. Long-term: "Core engagement needs work, add 1 set planks 2x/week"

📅 NEXT SESSION PLAN:
├─ Date: 2026-04-12 (Saturday)
├─ Exercise: Squat (continue progression)
├─ Proposed: 4 sets x 10 reps @ 115kg
├─ Accessories: Leg extensions (left focused), planks
└─ Estimated Duration: 20 minutes

🏆 STREAK & BADGES:
├─ Consistency Streak: 12 days 🔥
├─ Form Improvement: Week 2 improving ✅
└─ New Badge Unlocked: "Form Master - 3 sessions with 85+ avg"
```

---

## 9. Database Schema Extensions

### New Tables (Prisma)

```prisma
// COACH KNOWLEDGE BASE
model CoachKnowledgeBase {
  id String @id @default(cuid())
  category String  // "periodization", "biomechanics", "nutrition", etc.
  subcategory String
  content String  // Research paper, methodology, case study
  embeddings Vector  // For semantic search
  source String  // Author, publication
  confidence Float  // 0-1, how validated
  createdAt DateTime @default(now())

  @@index([category])
  @@index([embeddings])  // Vector index for similarity search
}

// WORKOUT ANALYTICS (Extended)
model WorkoutAnalytics {
  id String @id @default(cuid())
  sessionId String @unique
  session WorkoutSession @relation(fields: [sessionId], references: [id])
  
  // Aggregate metrics
  avgFormScore Float
  bestRepFormScore Float
  worstRepFormScore Float
  formTrend String  // "improving", "declining", "stable"
  
  // Muscle engagement
  muscleEngagement Json  // { quadriceps: 0.91, glutes: 0.87, ... }
  primaryMuscleFocus String[]
  secondaryMuscleWork String[]
  
  // Weakness detection
  weakPointsIdentified String[]
  muscleImbalanceDetected Json  // { left_quad: -12%, ... }
  
  // Injury risk
  injuryRiskLevel Int  // 1-100
  riskFactors String[]
  
  // Progression
  comparedToPreviousSession Json
  strengthProgression String  // "increasing", "plateaued", "declining"
  formProgression String  // "improving", "worsening", "stable"
  
  // Coach decisions
  coachDecisionsMade String[]  // Log of AI decisions for learning
  
  @@index([sessionId])
}

// USER WEAKNESS TRACKING
model UserWeakness {
  id String @id @default(cuid())
  userId String
  user User @relation(fields: [userId], references: [id])
  
  exerciseName String
  muscleGroup String
  weakness_description String
  severityLevel Int  // 1-10
  discoveredDate DateTime
  targetDate DateTime  // When to improve by
  
  suggestedAccessories String[]  // Exercise recommendations
  progressTracking Json  // Historical data
  
  @@index([userId])
  @@index([exerciseName])
}

// VECTOR DATABASE INTEGRATION
model SemanticUserData {
  id String @id @default(cuid())
  userId String
  user User @relation(fields: [userId], references: [id])
  
  dataType String  // "form_pattern", "weakness_trend", "recovery_impact", etc.
  embedding Vector  // Vector embedding for semantic search
  context String  // For retrieval augmented generation
  metadata Json
  
  @@index([userId])
  @@index([embedding])  // Vector similarity search
}
```

---

## 10. Success Criteria

✅ Real-time pose detection with confidence scores  
✅ Form score calculation (1-100) considering user history  
✅ Personalized voice feedback based on user profile  
✅ AR visual cues (green/red highlights on body)  
✅ Complete user profiling (injuries, weaknesses, history)  
✅ GPT-4o integration for holistic coaching decisions  
✅ Vector database for semantic historical data retrieval  
✅ Post-workout analytics with personalized recommendations  
✅ Progressive overload tracking and adjustment  
✅ Injury risk prediction and prevention  
✅ 30fps+ performance on all devices (phone, tablet, laptop)  
✅ Zero latency real-time voice feedback  
✅ Knowledge base embedding for elite coaching methodology  

---

## 11. Technical Stack (Final)

| Component | Technology | Why? |
|-----------|-----------|------|
| Frontend | React + Next.js | Existing |
| Pose Detection | MediaPipe Pose | Real-time, accurate, free |
| Angle Calculation | TensorFlow.js | Fast, browser-native |
| AR Visualization | Three.js + Canvas | Skeleton overlay |
| Voice Output | Web Speech API (TTS) | Browser native, fast |
| Speech Input | Whisper API (OpenAI) | Future feature, high accuracy |
| AI Coach | OpenAI GPT-4o | Full context understanding, latest model |
| Vector Database | Pinecone or Weaviate | Semantic search, historical data retrieval |
| Real-time | WebSocket (optional) | For live coaching feedback |
| Database | Prisma + PostgreSQL | Existing, scalable |
| Embeddings | OpenAI Embeddings API | Consistent with GPT-4o |

---

## 12. Implementation Timeline

| Phase | Duration | Tasks |
|-------|----------|-------|
| **Phase 1** | Weeks 1-2 | MediaPipe setup, angle calculation, database schema |
| **Phase 2** | Weeks 2-3 | GPT-4o integration, prompt engineering |
| **Phase 3** | Weeks 3-4 | AR visual feedback, TTS voice |
| **Phase 4** | Weeks 4-5 | User profiling system, vector database |
| **Phase 5** | Weeks 5-6 | Analytics & reporting, weakness tracking |
| **Phase 6** | Weeks 6-7 | Knowledge base embedding, elite coaching logic |
| **Phase 7** | Weeks 7-8 | Testing, optimization, UI/UX polish |

**Total: 8 weeks** for comprehensive AI gym coach MVP

---

**Document Status:** Ready for Implementation Plan  
**Next Step:** Write detailed implementation plan with code examples
