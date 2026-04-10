# AI Gym Coach - Phase 2: User Profiling & Holistic Analytics

**Date:** 2026-04-10  
**Project:** FitAI - Phase 2 Implementation  
**Status:** Design Approved

---

## Executive Summary

Extend the Phase 1 foundation with comprehensive user profiling and holistic analytics. Users build detailed profiles covering fitness, health, nutrition, and recovery. The AI coach becomes fully context-aware, providing personalized recommendations across form, workout selection, nutrition, and recovery optimization.

---

## 1. User Profile System

### 1.1 Profile Categories

#### A) Basic Profile (`UserBasicProfile`)
- **Age**: Integer (18-100)
- **Gender**: Enum (Male, Female, Other, Prefer not to say)
- **Height**: Float (cm)
- **Weight**: Float (kg) - Current
- **Fitness Level**: Enum (Beginner, Intermediate, Advanced, Elite)
- **Primary Goal**: Enum (Weight Loss, Muscle Gain, Strength, Conditioning, Rehabilitation, General Fitness)
- **Experience Years**: Integer (0-60)
- **Target Weight**: Float (kg)
- **Target Fitness Level**: Enum (same as Fitness Level)

#### B) Health & Injury (`UserHealthMetrics`)
- **Active Injuries**: Array of {
  - `bodyPart`: String (e.g., "left_shoulder", "right_knee")
  - `injuryType`: String (e.g., "shoulder_impingement", "ACL_strain")
  - `severity`: Int (1-10)
  - `onset_date`: DateTime
  - `recovery_deadline`: DateTime (optional)
  - `restrictions`: String[] (e.g., ["no_overhead", "no_rotation"])
  }
- **Past Injuries**: Array of {
  - `bodyPart`: String
  - `injuryType`: String
  - `onset_date`: DateTime
  - `recovery_date`: DateTime
  - `notes`: String
  }
- **Medical Restrictions**: String[] (e.g., ["heart_condition", "back_surgery"])
- **Current Pain Points**: Array of {
  - `bodyPart`: String
  - `painLevel`: Int (1-10)
  - `occurrence`: String (e.g., "during_exercise", "post_workout", "constant")
  }
- **Doctor's Notes**: String (optional medical advice)

#### C) Training History (`UserTrainingHistory`)
- **Training Days Per Week**: Int (1-7)
- **Preferred Exercises**: String[] (e.g., ["squat", "deadlift", "bench_press"])
- **Disliked Exercises**: String[] (e.g., ["leg_press", "cable_flyes"])
- **Personal Records**: Array of {
  - `exercise`: String
  - `weight_kg`: Float
  - `reps`: Int
  - `date`: DateTime
  }
- **Starting Stats**: {
  - `fitness_level`: Enum (initial)
  - `weight_kg`: Float
  - `strength_baseline`: String (e.g., "can_lift_50kg_squat")
  }
- **Training Style**: Enum (Push/Pull/Legs, Upper/Lower, Full Body, PPL, Bro Split)
- **Preferred Duration**: Int (minutes per session, e.g., 45-120)

#### D) Nutrition & Recovery (`UserNutritionMetrics`)
- **Protein Target**: Float (grams per day)
- **Calorie Target**: Int (per day, optional)
- **Diet Type**: Enum (Omnivore, Vegetarian, Vegan, Keto, Paleo, Other)
- **Average Sleep Hours**: Float (hours per night)
- **Stress Level**: Int (1-10 - user's perception)
- **Alcohol Consumption**: Enum (None, Occasional, Regular, Daily)
- **Smoking**: Boolean
- **Water Intake Target**: Float (liters per day)
- **Supplement Stack**: String[] (e.g., ["creatine", "whey_protein", "vitamin_d"])

---

## 2. Daily Metrics Tracking

### 2.1 Post-Workout Check-in (`DailyMetrics`)

After each workout session, automatically prompt user to log:

- **Sleep Last Night**: Float (hours)
- **Sleep Quality**: Int (1-10)
- **Stress Level Today**: Int (1-10)
- **Protein Intake**: Float (grams - estimated or tracked)
- **Calories Intake**: Int (optional)
- **Water Intake**: Float (liters)
- **Mood**: Enum (Excellent, Good, Neutral, Poor)
- **Energy Level**: Int (1-10)
- **Soreness**: Int (1-10 - DOMS)
- **Injury Pain**: Int (1-10 - if applicable)
- **Notes**: String (freeform, e.g., "Low energy, didn't sleep well")

### 2.2 Weekly Update

Optionally (or on-demand), user can review/update:
- All daily metrics summary
- Compliance with protein/calorie targets
- Average sleep
- Training consistency
- Progress on goals

---

## 3. AI Coach Enhancement (GPT-4o)

### 3.1 Three Levels of Coaching

#### Level 1: Real-Time Form Analysis (During Workout)
**Purpose**: Prevent injury during exercise

**Logic**:
```
IF user has active injury in body_part
  AND exercise engages that body_part
THEN:
  - Alert: "Omuzun ağrıyor, bench press riskli"
  - Suggest alternative: "Dumbell press yap, kontrol daha iyi"
  - Adjust form criteria: Relax shoulder angle tolerance
END

IF pain_level > 6 AND exercise involves that body_part
THEN:
  - Warn: "Bu kadar ağrı ile çalışma, dinlen"
END
```

**Coach Prompt Addition**:
```
Active Injuries: {injuries_json}
Current Pain Levels: {pain_json}
Exercise Restrictions: {restrictions}
Mood: {mood}, Energy: {energy}/10

Prioritize safety. If exercise is contraindicated, suggest safer alternative.
```

#### Level 2: Workout Planning (Exercise Selection)
**Purpose**: Optimize exercise selection based on weaknesses and recovery state

**Logic**:
```
IF weak_muscle_group detected
THEN:
  - Prioritize exercises targeting that group
  - Increase volume (reps/sets) for weak area
  - Monitor form closely on these exercises
END

IF sleep_hours < 6 OR stress_level > 7
THEN:
  - Reduce intensity: "Dün uyku az, bugün hafif bas"
  - Prefer compound movements (more efficient)
  - Skip high-volume days
END

IF protein_compliance < 0.8 (80%)
THEN:
  - Recommend protein-rich meals before/after
  - Suggest lighter volume (less recovery needed)
END

IF workout_consistency < 0.6 (60% of planned days)
THEN:
  - Suggest shorter, easier sessions to build habit
END
```

**Coach Prompt Addition**:
```
Last 7 Days Metrics:
- Avg Sleep: {sleep_avg}h
- Avg Stress: {stress_avg}/10
- Protein Compliance: {protein_pct}%
- Workout Consistency: {consistency_pct}%
- Weak Muscles: {weak_muscles}
- Muscle Imbalance: L/R Quad Diff: {imbalance_pct}%

Suggest exercises that address weaknesses and respect recovery state.
```

#### Level 3: Holistic Recommendations (Post-Workout Summary)
**Purpose**: Optimize recovery, nutrition, and lifestyle

**Coach Message Format**:
```
🎯 BUGÜNÜN ÖZETİ:
- Form Score: 82/100 (+5 vs geçen hafta) 
- En zayıf bölüm: Posterior Chain (65/100)
- Uyku: 6 saat ✓
- Protein: 120gr/140gr (85%) ✓
- Yaralanma riski: %5

💡 ÖNERİLER:
[Nutrition]: "Protein hedefine 20gr yaklaştı. Akşam snack: 20gr whey + 1 muz"
[Recovery]: "Uyku iyi, devam et. Stres 7/10 - aktif dinlenme yap (yoga)"
[Training]: "Posterior chain zayıf - deadlift varyasyonları yap. Form perfect, load increase 5kg"
[Injury]: "Omuz ağrısı %10 azaldı, iyi gidiyor. Bench press cautiously continue"

🔥 NEXT SESSION: RDL, Hip Thrusts, Nordic Curls (posterior chain focus)
```

---

## 4. Analytics System

### 4.1 Automated Post-Workout Report

Immediately after session, display:

```
📊 WORKOUT SUMMARY:
Form Score: 82/100 | Reps: 24 | Sets: 6 | Time: 45 min

🏋️ PERFORMANCE:
- Best Rep: 88/100 (Rep 3, Set 2)
- Avg Form: 81/100
- Most Errors: Depth control (-15° variance)

💪 MUSCLE ENGAGEMENT:
- Quadriceps: 88%
- Hamstrings: 72% (LOW)
- Glutes: 85%
- Core: 80%

⚠️ FORM ISSUES:
- Knee Cave (3 reps) - Severity: Moderate
- Heel Rise (2 reps) - Severity: Minor
- Back Rounding (1 rep) - Severity: Severe

📈 TREND vs LAST WEEK:
Form Score: 82/100 (+5) ↗
Consistency: 4/4 workouts ✓
```

### 4.2 Detailed Analytics Dashboard

**Charts & Metrics** (User triggers "View Analytics"):

1. **Form Score Trend** (8-week line graph)
   - Weekly average form score
   - Show recovery periods (dips)
   - Trend line (improving/declining/stable)

2. **Muscle Group Performance** (Radar chart)
   - Show all muscle groups scored
   - Target vs actual
   - Identify weak areas visually

3. **Recovery vs Performance** (Scatter plot)
   - X-axis: Sleep hours
   - Y-axis: Form score for that day
   - Correlation: Does sleep impact form?

4. **Injury Risk Timeline** (Bar chart)
   - Daily injury risk % (1-100)
   - Highlight spikes
   - Correlate with specific exercises

5. **Muscle Imbalance** (L/R comparison)
   - Left Quad: 45° avg
   - Right Quad: 48° avg
   - Imbalance: +6.7% (RIGHT DOMINANT)
   - Alert: "Right side stronger - focus on left"

6. **Workout Consistency** (Heatmap calendar)
   - Green (completed), Red (missed), Gray (rest day)
   - Streak counter ("Current: 12 days")
   - Weekly commitment: 4/4 this week

7. **Personal Records** (Table)
   - Exercise | Weight | Reps | Date | Progress
   - squat | 120kg | 5 | 2026-04-10 | +5kg vs 3 weeks ago
   - deadlift | 160kg | 3 | 2026-04-09 | +10kg PR!

8. **Weak Points Identified** (List with timeline)
   - Posterior Chain: Started 2 weeks ago, trending -8%
   - Rear Delts: Consistently <70/100
   - Left Hamstring: Imbalance detected

---

## 5. Database Schema Extensions

### New Tables

```prisma
// User Profile - Basic Info
model UserBasicProfile {
  id                String    @id @default(cuid())
  userId            String    @unique
  user              User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  age               Int
  gender            String
  height            Float     // cm
  weight            Float     // kg
  fitnessLevel      String    // Beginner/Intermediate/Advanced/Elite
  primaryGoal       String    // Weight Loss/Muscle Gain/Strength/etc
  experienceYears   Int
  targetWeight      Float?
  targetFitnessLevel String?
  
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
  
  @@index([userId])
}

// Health & Injury Tracking
model UserHealthMetrics {
  id                String    @id @default(cuid())
  userId            String    @unique
  user              User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  activeInjuries    Json      // Array of {bodyPart, injuryType, severity, onsetDate, restrictions}
  pastInjuries      Json      // Array of {bodyPart, injuryType, onsetDate, recoveryDate}
  medicalRestrictions String[]
  currentPainPoints Json      // Array of {bodyPart, painLevel, occurrence}
  doctorNotes       String?
  
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
  
  @@index([userId])
}

// Training History
model UserTrainingHistory {
  id                String    @id @default(cuid())
  userId            String    @unique
  user              User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  trainingDaysPerWeek Int
  preferredExercises  String[]
  dislikedExercises   String[]
  personalRecords     Json     // Array of {exercise, weight_kg, reps, date}
  startingStats       Json     // {fitnessLevel, weight_kg, strengthBaseline}
  trainingStyle       String   // Push/Pull/Legs, Upper/Lower, etc
  preferredDuration   Int      // minutes
  
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt
  
  @@index([userId])
}

// Nutrition & Recovery Targets
model UserNutritionMetrics {
  id                String    @id @default(cuid())
  userId            String    @unique
  user              User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  proteinTarget     Float     // grams/day
  calorieTarget     Int?      // calories/day
  dietType          String    // Omnivore, Vegan, Keto, etc
  avgSleepHours     Float
  stressLevel       Int       // 1-10
  alcoholConsumption String   // None/Occasional/Regular/Daily
  smoking           Boolean
  waterIntakeTarget Float     // liters/day
  supplementStack   String[]  // e.g., ["creatine", "whey"]
  
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
  
  @@index([userId])
}

// Daily Metrics - Post-workout check-in
model DailyMetrics {
  id                String    @id @default(cuid())
  userId            String
  user              User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  sessionId         String?
  session           WorkoutSession? @relation(fields: [sessionId], references: [id], onDelete: SetNull)
  
  date              DateTime  @default(now())
  sleepHours        Float
  sleepQuality      Int       // 1-10
  stressLevel       Int       // 1-10
  proteinIntake     Float     // grams
  calorieIntake     Int?
  waterIntake       Float     // liters
  mood              String    // Excellent/Good/Neutral/Poor
  energyLevel       Int       // 1-10
  soreness          Int       // 1-10 (DOMS)
  injuryPain        Int       // 1-10
  notes             String?
  
  createdAt         DateTime  @default(now())
  
  @@index([userId])
  @@index([date])
  @@index([sessionId])
}

// Calculated Analytics
model WorkoutAnalytics {
  id                String    @id @default(cuid())
  sessionId         String    @unique
  session           WorkoutSession @relation(fields: [sessionId], references: [id], onDelete: Cascade)
  
  avgFormScore      Float
  bestRepScore      Float
  worstRepScore     Float
  formTrend         String    // "improving", "declining", "stable"
  muscleEngagement  Json      // Aggregate by muscle group
  weakPointsFound   String[]
  injuryRiskLevel   Int       // 1-100
  riskFactors       String[]
  muscleImbalance   Json      // {muscle: leftAvg, rightAvg, diffPct}
  
  createdAt         DateTime  @default(now())
  
  @@index([sessionId])
}

// User Weaknesses - Tracked over time
model UserWeakness {
  id                String    @id @default(cuid())
  userId            String
  user              User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  muscleGroup       String
  exerciseName      String
  severity          Int       // 1-10
  discoveredDate    DateTime  @default(now())
  targetDate        DateTime?
  
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
  
  @@index([userId])
  @@index([muscleGroup])
}

// Update WorkoutSession relation
model WorkoutSession {
  // ... existing fields ...
  
  dailyMetrics      DailyMetrics[]
  
  @@index([userId])
  @@index([startedAt])
}

// Update User relation
model User {
  // ... existing fields ...
  
  basicProfile      UserBasicProfile?
  healthMetrics     UserHealthMetrics?
  trainingHistory   UserTrainingHistory?
  nutritionMetrics  UserNutritionMetrics?
  dailyMetrics      DailyMetrics[]
  weaknesses        UserWeakness[]
}
```

---

## 6. UI Components & Pages

### 6.1 New Pages

1. **Onboarding Flow** (`/onboarding`)
   - Step 1: Basic Profile (age, gender, height, weight, goal)
   - Step 2: Health & Injuries (active/past injuries, restrictions)
   - Step 3: Training History (experience, preferred exercises, PRs)
   - Step 4: Nutrition & Recovery (targets, sleep, diet type)
   - Confirmation screen + save to DB

2. **Profile Management** (`/dashboard/profile`)
   - Editable sections for all 4 categories
   - Update buttons, confirmation dialogs
   - Visual progress indicators (% complete)

3. **Daily Check-in Modal** (Post-workout)
   - Quick form: Sleep, Stress, Protein, Mood, Energy, Notes
   - Save to DailyMetrics
   - Auto-fill protein target (visual progress bar)

4. **Analytics Dashboard** (`/dashboard/analytics`)
   - Tab 1: Form Score Trend (8-week chart)
   - Tab 2: Muscle Performance (radar)
   - Tab 3: Recovery vs Performance (scatter)
   - Tab 4: Muscle Imbalance (L/R comparison)
   - Tab 5: Consistency (calendar heatmap)
   - Tab 6: PRs (table)
   - Tab 7: Weak Points (timeline)

5. **Coach Recommendations** (`/dashboard/coach-recommendations`)
   - Automated report (generated post-workout)
   - Manual trigger: "Give me detailed recommendations"
   - Sections: Nutrition, Recovery, Training, Injury
   - Save history (archive past recommendations)

### 6.2 New Components

- `OnboardingForm.tsx` - Multi-step form
- `ProfileCard.tsx` - Display/edit profile sections
- `DailyCheckInModal.tsx` - Post-workout form
- `FormScoreTrendChart.tsx` - 8-week line graph
- `MusclePerformanceRadar.tsx` - Radar chart
- `RecoveryVsPerformance.tsx` - Scatter plot
- `MuscleImbalanceComparison.tsx` - L/R bars
- `ConsistencyHeatmap.tsx` - Calendar view
- `PersonalRecordsTable.tsx` - Table with sorting
- `WeakPointsTimeline.tsx` - List with dates
- `CoachRecommendationCard.tsx` - Styled recommendation boxes

---

## 7. API Endpoints

### New Routes

```
POST   /api/user/profile/basic          - Create/update basic profile
GET    /api/user/profile/basic          - Get basic profile
POST   /api/user/profile/health         - Create/update health metrics
GET    /api/user/profile/health         - Get health metrics
POST   /api/user/profile/training       - Create/update training history
GET    /api/user/profile/training       - Get training history
POST   /api/user/profile/nutrition      - Create/update nutrition metrics
GET    /api/user/profile/nutrition      - Get nutrition metrics

POST   /api/user/daily-metrics          - Record daily check-in
GET    /api/user/daily-metrics          - Get daily metrics (filtered by date range)

GET    /api/user/analytics              - Get aggregated analytics
GET    /api/user/weaknesses             - Get identified weak muscles
POST   /api/user/weaknesses             - Create/update weakness

GET    /api/ai/coach-recommendations   - Get AI-generated recommendations (post-workout)
POST   /api/ai/coach-recommendations   - Trigger manual recommendation generation
```

---

## 8. Implementation Phases

### Phase 2 - Week 1-2: Profile & Daily Metrics
- Database schema updates
- Onboarding form flow
- Profile management page
- Daily check-in modal
- API endpoints for all profile data

### Phase 2 - Week 3: Analytics
- Analytics dashboard with all 7 charts
- Weakness tracking logic
- Muscle imbalance detection algorithm

### Phase 2 - Week 4: Coach Enhancement
- Integrate profile data into GPT-4o prompts
- Level 1: Form analysis with injury awareness
- Level 2: Workout planning with recovery state
- Level 3: Post-workout holistic recommendations

---

## 9. Success Criteria

✅ Users can complete onboarding in <10 minutes  
✅ Profile data updates properly to database  
✅ Post-workout check-in takes <2 minutes  
✅ Analytics dashboard loads in <3 seconds  
✅ Coach recommendations factor in health/recovery  
✅ Weak muscles correctly identified (>90% accuracy)  
✅ Muscle imbalance detected when L/R differ >10%  
✅ Form score trends visible and accurate  
✅ All charts responsive and mobile-friendly  
✅ Injury awareness prevents dangerous exercises  

---

## 10. Data Privacy & Security

- All profile data encrypted in transit (HTTPS)
- Health data flagged as sensitive (restricted access)
- Users can export their data (GDPR compliance)
- Deletion: cascade deletes all related metrics

---

**Document Status:** Ready for Review  
**Next Step:** Invoke `writing-plans` skill to create detailed implementation plan
