# Phase 3: Complete Nutrition System for Mobile - Specification

**Date:** 2026-04-18  
**Status:** Approved Design  
**Target Timeline:** 5-7 days (parallel subagents)  
**Success Criteria:** 115+ tests, 80%+ coverage, production-ready nutrition system

---

## 1. Overview

Phase 3 implements a complete mobile nutrition tracking system with AI-powered food parsing, real-time macro tracking, water intake monitoring, and a personalized nutrition coach. Built on Phase 1 (auth, dashboard) + Phase 2 (workout system) foundation.

**Key differentiator:** Mobile-first design with voice entry, photo analysis, offline-first architecture, and AI nutrition coaching.

---

## 2. Architecture

### 2.1 Real-Time Pipeline

```
┌─ Voice Entry (VAPI) / Photo Capture / Manual Entry
├─ Transcript/Image → Food Parsing (Claude/TensorFlow.js)
├─ User Review & Confirmation
├─ Meal Log Creation (SQLite)
├─ Sync Queue (offline-first)
└─ Backend Upload (meals + photos)

PARALLEL:

┌─ Nutrition Coach Q&A
├─ User asks: text or voice (VAPI)
├─ Claude analyzes: meal history + goals context
├─ Returns: personalized nutrition advice
└─ Display answer to user
```

### 2.2 Offline-First Strategy

- **Local storage:** SQLite for meals, goals, photos (thumbnails), sync queue
- **Sync queue:** Like Phase 2 videos, exponential backoff (1s, 2s, 4s, 8s, 16s)
- **Photo handling:** Store locally, queue for upload, show thumbnail in UI
- **Coach context:** Recent meals + goals stored locally for offline Q&A (canned responses)

---

## 3. Core Features

✅ **Meal Logging** (3 methods: manual, voice, photo)  
✅ **Macro Tracking** (daily, weekly, trends)  
✅ **Water Intake** (quick-add, progress tracking)  
✅ **Nutrition Goals** (AI-generated + adjustable)  
✅ **Food Database** (barcode search, recent, favorites)  
✅ **Photo Management** (local storage, queue upload)  
✅ **Streak Tracking** (daily, visual calendar)  
✅ **Nutrition Coach** (text/voice Q&A, personalized advice)

---

## 4. Data Models

**Reuse from web:**

- MealLog, FoodItem, NutritionGoal, MealType, DietType

**Mobile-specific:**

- MealPhoto, VoiceTranscript, FoodParseResult
- CoachQuestion, CoachResponse, CoachContext
- NutritionSyncQueue, WaterIntake, NutritionStreak

---

## 5. Screens & Components

**Main Screens:**

- MealEntryScreen (manual, voice, photo tabs)
- MealReviewScreen (confirm foods before save)
- TodayNutritionScreen (daily summary + macro progress)
- NutritionHistoryScreen (weekly graphs, trends)
- GoalSetupScreen (AI goal generation)
- FoodDatabaseScreen (search, barcode, favorites)
- NutritionCoachScreen (chat-like Q&A)

**Components:**

- MacroProgressBar, CircularProgressRing
- WaterQuickAdd, StreakCalendar
- MealCard, VoiceRecorder, CoachChat

---

## 6. Integration Points

**VAPI:** Voice transcription for meals + coach questions  
**Claude:** Food parsing, goal generation, coach advice  
**OpenFoodFacts:** Barcode search + local caching  
**Backend:** Meal/photo/goal sync with exponential backoff  
**SQLite:** Local storage (meals, photos, goals, sync queue, coach logs)

---

## 7. Testing Strategy

- **Unit:** 40+ tests (parsing, calculations, goal generation, streaks)
- **Integration:** 30+ tests (meal flow, voice entry, photo queue, coach Q&A, sync)
- **Component:** 35+ tests (all screens + reusable components)
- **E2E:** 10+ tests (full meal logging, coaching, offline scenarios)

**Target:** 115+ total tests, 80%+ coverage

---

## 8. Success Criteria

✅ All meal logging methods working (manual, voice, photo)  
✅ Macro tracking with visual progress bars  
✅ Water intake tracking + quick-add buttons  
✅ AI-generated nutrition goals (adjustable)  
✅ Food database with search/barcode/favorites  
✅ Photo storage + offline sync queue  
✅ Streak tracking with calendar  
✅ Nutrition coach with personalized advice  
✅ Offline-first: full app works without internet  
✅ 115+ tests passing, 80%+ coverage  
✅ Zero TypeScript errors  
✅ No regressions in Phase 1-2

---

## 9. Timeline (5-7 days)

- **Day 1-2:** Types, stores, database, basic screens (manual entry)
- **Day 2-3:** Voice integration (VAPI + food parsing), photo capture + queue
- **Day 3-4:** Goal generation (AI), macro calculations, nutrition history
- **Day 4-5:** Coach Q&A integration (VAPI + Claude), sync, offline queue
- **Day 5-6:** Water tracking, streaks, UI polish, comprehensive testing
- **Day 6-7:** Buffer for fixes, integration, final review

---

## 10. Dependencies

- Phase 1: Auth, dashboard, utilities, hooks, stores
- Phase 2: Workout system (activity data for goals)
- External APIs: VAPI, Claude, OpenFoodFacts
- Libraries: React Native, Zustand, SQLite, expo-camera

---

**Approval:** ✅ Design approved by user on 2026-04-18
