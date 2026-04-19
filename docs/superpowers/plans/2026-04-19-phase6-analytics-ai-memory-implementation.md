# Phase 6: Analytics & AI Memory Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement personalized analytics and AI-powered recommendations using pgvector embeddings, multi-domain coaching insights, and offline-first recommendation caching.

**Architecture:** Data aggregation → Embedding generation (pgvector) → Recommendation engine → Coaching insights (Claude API) → SQLite cache → UI (Insights tab + home cards). Parallel execution: Task 1 (types/services), Task 2 (embedding generation), Task 3 (recommendation engine), Task 4 (coaching insights), Task 5 (analytics aggregation), Task 6 (UI components/screens/integration tests).

**Tech Stack:** React Native 0.81.5, Expo 54, Zustand, SQLite, PostgreSQL + pgvector, Claude API, TypeScript strict mode, Vitest.

---

## File Structure

### Types (2 files)
- `apps/mobile/src/types/analytics.ts` — UserEmbedding, Recommendation, CoachingInsight, AnalyticsSummary types
- `apps/mobile/src/types/insights.ts` — InsightCard, AnalyticsChartData types

### Services (6 files)
- `apps/mobile/src/services/embeddingService.ts` — Aggregate data, generate embeddings (pgvector)
- `apps/mobile/src/services/recommendationService.ts` — Recommendation filtering + ranking
- `apps/mobile/src/services/coachingService.ts` — Coaching insights generation (Claude API)
- `apps/mobile/src/services/analyticsService.ts` — Stats aggregation + trend calculation
- `apps/mobile/src/services/analyticsClient.ts` — REST API client for analytics endpoints
- `apps/mobile/src/services/pgvectorClient.ts` — PostgreSQL + pgvector wrapper

### Stores (3 files)
- `apps/mobile/src/store/recommendationStore.ts` — Recommendations state (meals, workouts, health, social)
- `apps/mobile/src/store/analyticsStore.ts` — Analytics summaries + personal stats
- `apps/mobile/src/store/coachingStore.ts` — Coaching insights + insights history

### Database (2 files)
- `apps/mobile/src/db/recommendations.ts` — SQLite cache (recommendations, expiry)
- `apps/mobile/src/db/analyticsCache.ts` — SQLite cache (stats snapshots, embeddings)

### Components (10 files)
- `apps/mobile/src/components/analytics/RecommendationCard.tsx` — Generic recommendation display
- `apps/mobile/src/components/analytics/MealRecommendationCard.tsx` — Meal with macros
- `apps/mobile/src/components/analytics/WorkoutRecommendationCard.tsx` — Exercise suggestion
- `apps/mobile/src/components/analytics/HealthInsightCard.tsx` — Sleep/steps/heart rate
- `apps/mobile/src/components/analytics/FriendRecommendationCard.tsx` — Similar users
- `apps/mobile/src/components/analytics/ChallengeRecommendationCard.tsx` — Compatible challenges
- `apps/mobile/src/components/analytics/CoachingCard.tsx` — Coaching tip
- `apps/mobile/src/components/analytics/StatsCard.tsx` — Today's progress snapshot
- `apps/mobile/src/components/analytics/AnalyticsChart.tsx` — Line/bar charts
- `apps/mobile/src/components/analytics/GoalProgressRing.tsx` — Circular progress

### Screens (5 files)
- `apps/mobile/src/screens/analytics/InsightsTab.tsx` — Main Insights tab (recommendations + analytics)
- `apps/mobile/src/screens/analytics/AnalyticsDashboardScreen.tsx` — Detailed stats + trends
- `apps/mobile/src/screens/analytics/RecommendationsHubScreen.tsx` — All recommendations
- `apps/mobile/src/screens/analytics/CoachingInsightsScreen.tsx` — Coaching advice
- `apps/mobile/src/screens/analytics/PersonalStatsScreen.tsx` — Detailed statistics

### Tests (20+ files)
- Service tests: `src/services/__tests__/embedding/recommendation/coaching/analytics*.test.ts`
- Store tests: `src/store/__tests__/recommendation/analytics/coaching.test.ts`
- DB tests: `src/db/__tests__/recommendations/analyticsCache.test.ts`
- Component tests: `src/components/analytics/__tests__/*.test.tsx`
- Screen tests: `src/screens/analytics/__tests__/*.test.tsx`
- Integration: `tests/integration/analyticsFlow.integration.test.ts`

### Documentation (1 file)
- `apps/mobile/README-PHASE6.md` — Architecture, features, testing, offline strategy

---

## Task 1: Types & Services (Embedding + API Clients)

**Files:**
- Create: `apps/mobile/src/types/analytics.ts`
- Create: `apps/mobile/src/types/insights.ts`
- Create: `apps/mobile/src/services/embeddingService.ts`
- Create: `apps/mobile/src/services/pgvectorClient.ts`
- Create: `apps/mobile/src/services/analyticsClient.ts`
- Create: `apps/mobile/src/services/__tests__/embeddingService.test.ts`

**Steps:**

1. [ ] Write type definitions tests (RED)
2. [ ] Implement types (GREEN)
3. [ ] Write embedding service tests (RED)
4. [ ] Implement embedding service + pgvector client (GREEN)
5. [ ] Write analytics client tests (RED)
6. [ ] Implement analytics client (GREEN)
7. [ ] Refactor + commit

---

## Task 2: Recommendation Engine

**Files:**
- Create: `apps/mobile/src/services/recommendationService.ts`
- Create: `apps/mobile/src/store/recommendationStore.ts`
- Create: `apps/mobile/src/db/recommendations.ts`
- Create: `apps/mobile/src/services/__tests__/recommendationService.test.ts`
- Create: `apps/mobile/src/store/__tests__/recommendationStore.test.ts`
- Create: `apps/mobile/src/db/__tests__/recommendations.test.ts`

**Steps:**

1. [ ] Write recommendation service tests (RED)
2. [ ] Implement recommendationService.ts (meal, workout, health, social) (GREEN)
3. [ ] Write store tests (RED)
4. [ ] Implement recommendationStore.ts (GREEN)
5. [ ] Write DB tests (RED)
6. [ ] Implement recommendations.ts SQLite layer (GREEN)
7. [ ] Refactor + commit

---

## Task 3: Coaching Insights (Claude API)

**Files:**
- Create: `apps/mobile/src/services/coachingService.ts`
- Create: `apps/mobile/src/store/coachingStore.ts`
- Create: `apps/mobile/src/services/__tests__/coachingService.test.ts`
- Create: `apps/mobile/src/store/__tests__/coachingStore.test.ts`

**Steps:**

1. [ ] Write coaching service tests (RED)
2. [ ] Implement coachingService.ts (performance, nutrition, recovery, behavioral) (GREEN)
3. [ ] Write store tests (RED)
4. [ ] Implement coachingStore.ts (GREEN)
5. [ ] Refactor + commit

---

## Task 4: Analytics Aggregation

**Files:**
- Create: `apps/mobile/src/services/analyticsService.ts`
- Create: `apps/mobile/src/store/analyticsStore.ts`
- Create: `apps/mobile/src/db/analyticsCache.ts`
- Create: `apps/mobile/src/services/__tests__/analyticsService.test.ts`
- Create: `apps/mobile/src/store/__tests__/analyticsStore.test.ts`
- Create: `apps/mobile/src/db/__tests__/analyticsCache.test.ts`

**Steps:**

1. [ ] Write analytics service tests (RED)
2. [ ] Implement analyticsService.ts (aggregation + trend calculation) (GREEN)
3. [ ] Write store tests (RED)
4. [ ] Implement analyticsStore.ts (GREEN)
5. [ ] Write DB tests (RED)
6. [ ] Implement analyticsCache.ts (GREEN)
7. [ ] Refactor + commit

---

## Task 5: UI Components

**Files:**
- Create: `apps/mobile/src/components/analytics/RecommendationCard.tsx`
- Create: `apps/mobile/src/components/analytics/MealRecommendationCard.tsx`
- Create: `apps/mobile/src/components/analytics/WorkoutRecommendationCard.tsx`
- Create: `apps/mobile/src/components/analytics/HealthInsightCard.tsx`
- Create: `apps/mobile/src/components/analytics/FriendRecommendationCard.tsx`
- Create: `apps/mobile/src/components/analytics/ChallengeRecommendationCard.tsx`
- Create: `apps/mobile/src/components/analytics/CoachingCard.tsx`
- Create: `apps/mobile/src/components/analytics/StatsCard.tsx`
- Create: `apps/mobile/src/components/analytics/AnalyticsChart.tsx`
- Create: `apps/mobile/src/components/analytics/GoalProgressRing.tsx`
- Create: `apps/mobile/src/components/analytics/__tests__/*.test.tsx` (component tests)

**Steps:**

1. [ ] Write component tests (RED)
2. [ ] Implement all 10 components (GREEN)
3. [ ] Refactor + commit

---

## Task 6: Screens & Integration Tests

**Files:**
- Create: `apps/mobile/src/screens/analytics/InsightsTab.tsx`
- Create: `apps/mobile/src/screens/analytics/AnalyticsDashboardScreen.tsx`
- Create: `apps/mobile/src/screens/analytics/RecommendationsHubScreen.tsx`
- Create: `apps/mobile/src/screens/analytics/CoachingInsightsScreen.tsx`
- Create: `apps/mobile/src/screens/analytics/PersonalStatsScreen.tsx`
- Create: `tests/integration/analyticsFlow.integration.test.ts` (30+ integration tests)
- Create: `apps/mobile/README-PHASE6.md` (documentation)
- Create: `apps/mobile/src/screens/analytics/__tests__/*.test.tsx` (screen tests)

**Steps:**

1. [ ] Write screen tests (RED)
2. [ ] Implement 5 screens (GREEN)
3. [ ] Write 30+ integration tests (RED)
4. [ ] Implement integration tests (GREEN)
5. [ ] Write Phase 6 README documentation
6. [ ] Refactor + commit

---

## Success Criteria

✅ User embeddings generate correctly from Phase 1-5 data
✅ Meal/workout/health/social recommendations personalized
✅ Coaching insights generated (performance, nutrition, recovery, behavioral)
✅ Personal analytics dashboard functional
✅ Home recommendation cards display correctly
✅ Insights tab comprehensive and usable
✅ Offline-first: recommendations cached, available without internet
✅ 100+ tests passing
✅ Zero TypeScript errors
✅ No regressions in Phase 1-5

---

**Approval:** Ready for execution via subagent-driven-development
