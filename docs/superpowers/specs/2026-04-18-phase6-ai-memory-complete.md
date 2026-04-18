# Phase 6: Complete AI Memory + Analytics (Mobile)

**Goal:** AI coach (VAPI, 6 personas), memory system (pgvector embeddings), semantic search, advanced analytics, daily check-in.

**Architecture:** VAPI voice sessions (6 personas: fitness, dietitian, health, motivation, pt, general), OpenAI embeddings (pgvector), memory decay scoring, prompt injection for context-aware responses, LLM-generated summaries.

---

## Screens

**AICoachScreen**

- Chat UI with AI coach
- Persona selector (6 options)
- Voice input/output buttons
- Conversation history (scrollable)
- Quick action buttons (e.g., "Generate program", "Meal advice")

**CoachHistoryScreen**

- List of past conversations
- Persona name + date
- Quick summary
- Tap to expand conversation

**AnalyticsDashboardScreen**

- Advanced metrics: VO2 max estimate, body composition trend
- PR tracking (weight/reps progression)
- Form improvement trend (line chart)
- Weak points identified + improvement target
- Readiness score with breakdown

**DailyCheckInScreen**

- Post-workout survey:
  - Sleep quality (1-10)
  - Stress level (1-10)
  - Energy level (1-10)
  - Mood (excellent|good|neutral|poor)
  - Soreness (1-10)
  - Injury pain (1-10)
  - Notes (open text)
- Save → POST /api/user/daily-metrics

## Models (Prisma)

- **UserMemoryEmbedding**: content, embedding (pgvector 1536), type (SESSION_SUMMARY|WEEKLY_SUMMARY|EXERCISE_PATTERN|NUTRITION_PATTERN|RECOVERY_PATTERN|MILESTONE|WEAKNESS|PREFERENCE), importance (1-10), decayScore (0-1), tags[], sourceId, sourceType
- **DailyMetrics**: sleepHours, sleepQuality, stressLevel, energyLevel, mood, soreness, injuryPain, proteinIntake, calorieIntake, waterIntake, notes
- **FitnessCoachSession**: transcript (JSON), durationSeconds

## Memory Types (8 Total)

1. **SESSION_SUMMARY**: Workout summary (LLM-generated from session data)
2. **WEEKLY_SUMMARY**: Week aggregation (totalWorkouts, avgFormScore, avgReadiness, topExercises, patterns)
3. **EXERCISE_PATTERN**: User's exercise preferences ("loves squats", "struggles with overhead press")
4. **NUTRITION_PATTERN**: Diet patterns ("high protein intake", "carb timing preference")
5. **RECOVERY_PATTERN**: Sleep/rest patterns ("needs 8+ hours", "recovers well from high volume")
6. **MILESTONE**: Major achievements ("First 100kg deadlift", "30-day streak")
7. **WEAKNESS**: Identified weak points ("posterior chain weak", "form breakdown at fatigue")
8. **PREFERENCE**: User stated preferences ("prefer morning workouts", "likes barbell exercises")

## AI Coach Flow

```
User message (voice or text)
  → Convert to text (if voice)
  → Semantic search memories (pgvector)
  → Re-rank top 5 by relevance + decay score
  → Build system prompt with context
  → Call OpenAI chat API via VAPI
  → Parse response
  → Convert to speech (if voice mode)
  → Save to FitnessCoachSession
```

## Cron Jobs (Backend)

```
Daily (3 AM):
  POST /api/cron/memory-decay → Reduce importance of old memories

Weekly (Sunday 11 PM):
  POST /api/cron/memory-summary → Generate weekly summary (LLM)
  POST /api/cron/weekly-summary → Aggregate metrics
```

## API Endpoints

```
POST   /api/ai/coach-message            → Chat with coach
GET    /api/fitness-coach/session       → Session history
POST   /api/ai/generate-program         → AI program generation
POST   /api/ai/analyze-form             → Form feedback
POST   /api/ai/nutrition-tip            → Nutrition advice
GET    /api/user/analytics              → Advanced analytics
POST   /api/user/daily-metrics          → Log daily check-in
GET    /api/readiness                   → Readiness score
GET    /api/progress                    → Progress summary
```

## Key Features

- **6 AI Personas**: fitness (form), dietitian (macros), health (recovery), motivation (goals), pt (programs), general (everything)
- **Memory Embedding**: All memories stored with OpenAI embeddings (1536-dim vectors)
- **Semantic Search**: Find relevant context using pgvector similarity
- **Decay Scoring**: Old memories less important (exponential decay, importance 1-10)
- **Prompt Injection**: Top 5 memories injected into system prompt
- **Weekly Summaries**: LLM-generated summaries of week's activity + patterns
- **Daily Check-In**: Post-workout survey feeds into memory system
- **Advanced Analytics**: Form trends, weakness tracking, readiness prediction

## Timeline

~8-10 days (after Phase 1 + Phase 2 + Phase 3)
