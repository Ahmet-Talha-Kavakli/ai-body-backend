# AI Gym Coach - Phase 3: AR Visualization & Advanced Analytics

**Date:** 2026-04-10  
**Project:** FitAI - Phase 3 Implementation  
**Status:** Design Approved

---

## Executive Summary

Transform FitAI into an advanced fitness platform with 3D AR visualization, machine learning-powered analytics, and social motivation features. Users see their body in real-time 3D with injury heat maps, receive AI-driven recovery recommendations, and compete with friends on leaderboards.

---

## 1. AR Skeleton Visualization System

### 1.1 Three.js 3D Model

**Architecture:**
- Replace Phase 1 Canvas skeleton with Three.js 3D skeleton
- Load pre-built 3D body model (gltf/glb format)
- Map 33 MediaPipe keypoints to 3D bone structure
- Real-time pose synchronization (30+ fps)

**Features:**
- **3D Rotation**: User can rotate/zoom skeleton
- **Bone Highlighting**: Hovered bones highlight
- **Injury Coloring**: Yaralanmış kemikleri renklendir
- **Muscle Engagement Visualization**: Egzersiz sırasında aktif kaslar parlıyor

**Technical Stack:**
- Three.js for 3D rendering
- gltf-loader for model loading
- Canvas WebGL backend
- GPU acceleration

**Performance Targets:**
- 60 fps skeleton rendering
- <500ms model load time
- Sub-100ms keypoint sync

### 1.2 Injury Heat Map

**Visualization:**
- 3D model üzerinde renkli gradient (ısı haritası)
- Yaralanma severity'sine göre renk değişimi

**Color Scale:**
```
Green (#22c55e)   = Healthy (0-2 severity)
Yellow (#eab308)  = Caution (3-5 severity)
Orange (#f97316)  = Warning (6-7 severity)
Red (#ef4444)     = Critical (8-10 severity)
```

**Pulse Effect:**
- Critical injuries (8+) = pulse/glow animation (500ms cycle)
- Warning (6-7) = subtle glow
- Healthy = no glow

**Data Source:**
- UserHealthMetrics.activeInjuries → severity mapping
- Sync with currentPainPoints real-time

**Implementation:**
- Shader-based color mapping
- Fragment shader for gradient interpolation
- Vertex animation for pulse

### 1.3 Muscle Engagement Overlay

**During Workout:**
- Active muscles highlight (blue/green glow)
- Calculated from FormAnalysisResult.muscleEngagement
- Real-time update (per-rep)

**Post-Workout:**
- Heatmap shows which muscles were engaged
- Color intensity = engagement percentage
- 8 muscle groups: Quads, Hamstrings, Glutes, Core, Chest, Back, Shoulders, Arms

---

## 2. Machine Learning Analytics System

### 2.1 TensorFlow.js Integration

**Setup:**
- Use existing @tensorflow/tfjs library from Phase 1
- Load pre-trained models or create custom ones

**Models:**

#### Model 1: Form Score Trend Predictor
- **Input**: Last 30 days form scores + recovery metrics
- **Output**: Predicted form score for next 7 days
- **Algorithm**: LSTM (Long Short-Term Memory) network
- **Accuracy Target**: >85% prediction accuracy

#### Model 2: Recovery State Classifier
- **Input**: Sleep hours, stress level, protein intake, soreness
- **Output**: Recovery state (0-1 scale)
- **Type**: Random Forest or Neural Network
- **Use**: Determine if user ready for intense workout

#### Model 3: Weakness Severity Predictor
- **Input**: Form scores for muscle groups + exercise history
- **Output**: Which muscles will worsen/improve in next 30 days
- **Type**: Time series forecasting

### 2.2 ML-Powered Recommendations

**Recovery Optimizer:**

```
IF recovery_state < 0.5 (Low Recovery)
  THEN:
    - Recommend light cardio instead of heavy lifting
    - Reduce volume by 40%
    - Prioritize recovery activities (yoga, stretching)
    - Alert: "Vücudun dinlenmeye ihtiyaç duyuyor"
    
ELSE IF recovery_state 0.5-0.7 (Medium)
  THEN:
    - Recommend normal intensity
    - Focus on weak areas (lighter form)
    
ELSE (High Recovery - 0.7+)
  THEN:
    - Recommend high intensity
    - Progressive overload (increase weight)
    - "İyi hissediyorsun, bu ideal zaman yeni PR!"
```

**Form Score Trend Alerts:**
- If trend declining >10% in 2 weeks → Alert
- If form improving >15% in 2 weeks → Congratulate + increase difficulty

**Weakness Intervention:**
- Predict which muscles will decline
- Proactive exercises (before they become weak)
- "Posterior chain 3 haftada düşecek, şimdi RDL yap"

### 2.3 Model Training & Storage

**Training Data:**
- Batch train on historical user data (FormRepData + DailyMetrics)
- Retrain weekly with new data
- Server-side training (Python backend) → export to TFJS format

**Model Storage:**
- Save trained models as .json + weights
- Store in `/public/models/`
- Load on app startup

**Versioning:**
- v1.0, v1.1, etc.
- API endpoint: `/api/ai/models/latest` returns current model version

---

## 3. Social Features System

### 3.1 Friends & Network

**Database Models:**

```prisma
model UserFriend {
  id              String    @id @default(cuid())
  userId          String
  user            User      @relation("UserFriends", fields: [userId], references: [id], onDelete: Cascade)
  friendId        String
  friend          User      @relation("FriendOf", fields: [friendId], references: [id], onDelete: Cascade)
  
  status          String    // "pending", "accepted", "blocked"
  requestedAt     DateTime  @default(now())
  acceptedAt      DateTime?
  
  @@unique([userId, friendId])
  @@index([userId])
  @@index([friendId])
}

model UserActivity {
  id              String    @id @default(cuid())
  userId          String
  user            User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  activityType    String    // "workout_completed", "pr_achieved", "streak_milestone"
  description     String    // "Benched 120kg x5", "10 day streak"
  metadata        Json?     // {exercise, weight, reps, streak_days}
  
  createdAt       DateTime  @default(now())
  visibility      String    // "private", "friends_only", "public"
  
  @@index([userId])
  @@index([createdAt])
}

model Leaderboard {
  id              String    @id @default(cuid())
  
  leaderboardType String    // "form_score", "most_consistent", "strongest", "best_recovery"
  period          String    // "weekly", "monthly", "all_time"
  
  entries         Json      // Array<{userId, username, score, rank}>
  
  updatedAt       DateTime  @updatedAt
  
  @@unique([leaderboardType, period])
}
```

**Update User model:**
```prisma
model User {
  // ... existing fields ...
  
  friends         UserFriend[]    @relation("UserFriends")
  friendOf        UserFriend[]    @relation("FriendOf")
  activities      UserActivity[]
  
  // Social stats
  friendCount     Int @default(0)
  followerCount   Int @default(0)
  bio             String?
  profilePublic   Boolean @default(false)
}
```

### 3.2 Leaderboard System

**Leaderboard Types:**

1. **Form Score Leaderboard**
   - Avg form score (8-week)
   - Ranking: Higher is better

2. **Consistency Leaderboard**
   - Workout streak days
   - Ranking: Higher is better

3. **Strongest Lifters**
   - Sum of top 3 personal records (deadlift, squat, bench)
   - Ranking: Higher is better

4. **Best Recovery**
   - Recovery state average (last 30 days)
   - Ranking: Higher is better

5. **Most Improved**
   - Form score improvement (month-over-month)
   - Ranking: Higher % improvement is better

**Periods:**
- Weekly (reset every Monday)
- Monthly (reset every 1st)
- All-time (persistent)

**Calculation:**
- Batch job (every 6 hours) aggregates user stats
- Updates Leaderboard table
- API returns top 100 per leaderboard

### 3.3 Social Feed & Comparison

**Activity Feed:**
- User can see friends' recent achievements
- "Ali benched 140kg PR!" 
- "Zeynep 30 günlük streak başladı!"
- Filterable by type (PRs, streaks, milestones)

**Friend Comparison:**
- Side-by-side form score comparison (8-week)
- Muscle strength comparison
- Recovery state comparison
- Friendly competition motivators

**Sharing:**
- Share workout summary
- "Bugün squat'ta +5kg! 💪"
- Share achievement card (shareable image)

### 3.4 Social API Endpoints

```
POST   /api/user/friends/add           - Send friend request
POST   /api/user/friends/accept        - Accept friend request
DELETE /api/user/friends/{friendId}    - Remove friend
GET    /api/user/friends               - Get friend list

POST   /api/user/activity              - Log activity/achievement
GET    /api/user/activity              - Get user's activity feed
GET    /api/user/activity/friends      - Get friends' activity

GET    /api/leaderboards/{type}/{period}  - Get leaderboard
GET    /api/leaderboards/friends/{type}   - Get friends' rankings

GET    /api/user/compare/{friendId}    - Compare with friend
POST   /api/user/share/{activityId}    - Generate shareable link
```

---

## 4. Advanced Analytics Dashboard Enhancements

### 4.1 ML-Powered Insights

**New Chart Types:**

1. **Form Score Prediction** (Line chart with confidence interval)
   - Next 7 days predicted form scores
   - Shaded confidence band (+/- 10%)

2. **Recovery vs Performance Correlation** (Heatmap)
   - Shows which recovery factors most impact form
   - Sleep, stress, protein, soreness matrix

3. **Weakness Trajectory** (Multi-line chart)
   - Predicted weakness severity over 30 days
   - Red = declining, Green = improving

4. **Muscle Imbalance Trend** (Diverging bar chart)
   - Left vs Right side symmetry over time
   - Alert if imbalance >15%

5. **Recovery State Timeline** (Area chart)
   - Daily recovery state (0-1)
   - Shows correlation with form dips/spikes

### 4.2 Personalized Insights

**AI-Generated Insights:**
- "Your form improves after 8+ hours sleep. Prioritize rest."
- "Posterior chain weakening. Add 2x RDL/week."
- "Protein compliance = form score +8%. Increase intake."
- "Recovery declining. Reduce workout intensity for 3 days."

**Alerts:**
- Form declining >10% in 2 weeks
- Injury pain increasing (red zone)
- Recovery state critically low
- Muscle imbalance detected

---

## 5. Component Structure

### New Components

```
apps/web/components/
├── ar/
│   ├── SkeletonViewer3D.tsx          # Three.js 3D skeleton
│   ├── InjuryHeatMap.tsx             # Heat map overlay
│   └── MuscleEngagementOverlay.tsx   # Real-time muscle glow
├── analytics/
│   ├── FormScorePredictionChart.tsx  # ML predictions
│   ├── RecoveryCorrelationHeatmap.tsx
│   ├── WeaknessTrajectory.tsx
│   ├── MuscleImbalanceTrend.tsx
│   └── RecoveryTimeline.tsx
└── social/
    ├── FriendsListPanel.tsx
    ├── LeaderboardView.tsx
    ├── ActivityFeed.tsx
    ├── FriendComparison.tsx
    └── ShareAchievement.tsx
```

### New Pages

```
apps/web/app/(dashboard)/
├── dashboard/
│   ├── ar/page.tsx                   # /dashboard/ar
│   ├── analytics-advanced/page.tsx   # /dashboard/analytics-advanced
│   ├── social/page.tsx               # /dashboard/social
│   ├── leaderboard/page.tsx          # /dashboard/leaderboard
│   └── compare/[friendId]/page.tsx   # /dashboard/compare/friend123
```

---

## 6. Implementation Timeline

### Week 1-2: AR Visualization
- Three.js 3D skeleton setup
- Injury heat map shader
- Muscle engagement overlay
- Integration with Phase 2 form analysis

### Week 3-4: ML Analytics
- TensorFlow.js model setup
- Form score predictor training
- Recovery state classifier
- ML-powered recommendations

### Week 5-6: Social Features
- Friends & network system
- Leaderboard calculation
- Activity feed & sharing
- Friend comparison views

### Week 7: Polish & Testing
- Performance optimization
- Cross-device testing
- Mobile responsiveness
- Turkish language finalization

---

## 7. Technical Specifications

### Dependencies to Add
- three.js (for 3D)
- three-gltf-loader (model loading)
- @tensorflow/tfjs-layers (ML models)
- uuid (for shareable links)

### Database Migrations
- 3 new tables: UserFriend, UserActivity, Leaderboard
- 2 new fields: User.bio, User.profilePublic
- Update relationships

### API Endpoints
- 10 new social endpoints
- 2 new model serving endpoints
- 1 leaderboard aggregation endpoint

### Model Training
- Python backend script (scikit-learn/TensorFlow)
- Export to TFJS format
- Weekly retraining job

---

## 8. Success Criteria

✅ 3D skeleton renders at 60fps  
✅ Injury heat map updates in real-time  
✅ Form score prediction >85% accurate  
✅ Recovery optimizer provides actionable advice  
✅ Leaderboards update every 6 hours  
✅ Friend comparisons load in <2s  
✅ All features mobile responsive  
✅ Turkish language throughout  
✅ No TypeScript errors on build  

---

## 9. Post-Phase 3 Opportunities

- Wearable integration (Apple Watch, Fitbit)
- Video analysis (form feedback from video)
- Nutrition tracking (Cronometer API integration)
- Workout program recommendations
- Virtual coaching sessions

---

**Document Status:** Ready for Review  
**Next Step:** User approval, then invoke writing-plans for Phase 3 implementation plan
