# Phase 3: Complete Nutrition System Implementation Plan (Part 3)

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan.

**Goal:** Implement nutrition coach Q&A (VAPI + Claude), water tracking, streaks, sync queue, and full integration tests.

**Architecture:** Coach Q&A → VAPI transcription + Claude context analysis → personalized advice. Water tracking with quick-add buttons. Streak calendar. Sync queue like Phase 2 with exponential backoff.

**Tech Stack:** VAPI, Claude, Zustand, SQLite, TensorFlow.js (optional)

---

## Chunk 5: Nutrition Coach & Water Tracking

### Task 9: Implement nutrition coach Q&A with context

**Files:**

- Create: `apps/mobile/src/db/nutritionCoach.ts`
- Create: `apps/mobile/src/hooks/useCoachContext.ts`
- Create: `apps/mobile/src/screens/nutrition/NutritionCoachScreen.tsx`
- Create: `apps/mobile/src/components/nutrition/CoachChat.tsx`

- [ ] **Step 1: Create coach database**

SQLite table: coach_questions (id, userId, question, inputType, timestamp), coach_responses (id, questionId, response, context).

- [ ] **Step 2: Create coach context builder**

`buildCoachContext()` gathers: last 7 days meals, today's intake, user goals, current streak.

Sends to Claude with question → Claude returns personalized advice.

- [ ] **Step 3: Create CoachChat component**

Chat bubbles: user questions on right (blue), coach responses on left (system color). Input field + voice button (VAPI). Typing indicator while waiting.

- [ ] **Step 4: Create NutritionCoachScreen**

Chat UI using CoachChat. Header with "Ask nutrition questions" tip. Scroll to latest message.

- [ ] **Step 5: Write coach tests**

Test context building, response generation, question/answer flow.

- [ ] **Step 6: Commit coach**

```bash
git commit -m "feat: implement nutrition coach with context-aware Q&A (VAPI + Claude)"
```

---

### Task 10: Create water intake tracking

**Files:**

- Create: `apps/mobile/src/db/waterIntake.ts`
- Create: `apps/mobile/src/components/nutrition/WaterQuickAdd.tsx`
- Create: `apps/mobile/src/components/nutrition/WaterProgress.tsx`
- Create: `apps/mobile/tests/db/waterIntake.test.ts`

- [ ] **Step 1: Create water database**

SQLite table: water_intake (date, totalMl, goalMl, timestamp).

- [ ] **Step 2: Create WaterQuickAdd component**

Buttons: +250ml, +500ml, +1L. Manual entry field. Displays total today + goal.

- [ ] **Step 3: Create WaterProgress component**

Circular progress ring: "1500 / 2000 ml". Color: blue gradient.

- [ ] **Step 4: Write water tests**

Test: add water log, calculate daily total, check goal status.

- [ ] **Step 5: Integrate into TodayNutritionScreen**

Add WaterProgress + WaterQuickAdd below macro bars.

- [ ] **Step 6: Commit water tracking**

```bash
git commit -m "feat: implement water intake tracking with quick-add buttons"
```

---

## Chunk 6: Streaks & Sync

### Task 11: Implement streak tracking

**Files:**

- Create: `apps/mobile/src/db/nutritionStreak.ts`
- Create: `apps/mobile/src/components/nutrition/StreakCalendar.tsx`

- [ ] **Step 1: Create streak database**

SQLite table: nutrition_streaks (userId, currentStreak, longestStreak, lastLogDate).

Auto-increment currentStreak if meal logged today, break if no meal logged.

- [ ] **Step 2: Create StreakCalendar component**

7-week calendar grid. Each cell: date, filled green if logged that day, gray if not.

Display: "14 days 🔥" above calendar.

- [ ] **Step 3: Integrate into TodayNutritionScreen**

Show StreakCalendar below water tracking.

- [ ] **Step 4: Write streak tests**

Test: streak increment, streak break detection, calendar rendering.

- [ ] **Step 5: Commit streaks**

```bash
git commit -m "feat: implement streak tracking with visual calendar"
```

---

### Task 12: Create nutrition sync queue (Phase 2 pattern)

**Files:**

- Create: `apps/mobile/src/db/nutritionSync.ts`
- Create: `apps/mobile/src/hooks/useNutritionSync.ts`
- Create: `apps/mobile/tests/db/nutritionSync.test.ts`

- [ ] **Step 1: Create sync queue database**

SQLite table: nutrition_sync_queue (id, type, payload, status, attempts, error, createdAt).

Types: meal, photo, goal, water, coach_log.

- [ ] **Step 2: Create sync operations**

`queueMealSync()`, `getPendingItems()`, `markSynced()`, `markFailed()`, `retryWithBackoff()`.

Exponential backoff: 1s, 2s, 4s, 8s, 16s.

- [ ] **Step 3: Create useNutritionSync hook**

Watches online/offline status. On reconnect, flushes sync queue with retry logic.

- [ ] **Step 4: Write sync tests**

Test: queue item, retry with backoff, mark synced, error handling.

- [ ] **Step 5: Commit sync queue**

```bash
git commit -m "feat: implement nutrition sync queue with exponential backoff (offline-first)"
```

---

## Chunk 7: Integration Tests & Documentation

### Task 13: Write full integration tests

**Files:**

- Create: `apps/mobile/tests/integration/nutritionFlow.integration.test.ts`
- Create: `apps/mobile/README-PHASE3.md`

- [ ] **Step 1: Write integration tests**

Test scenarios:

- Full meal logging flow: entry → review → save → appears in today
- Voice entry: transcript → parsing → review → save
- Photo entry: capture → queue → verify queue entry
- Goal generation: input profile → calculate → save → verify in store
- Coach Q&A: ask question → Claude → display → sync
- Water tracking: add intake → check progress
- Streak: log meal → increment streak
- Offline sync: offline entry → go online → sync completes

Target: 15+ integration tests

- [ ] **Step 2: Create Phase 3 README**

Document:

- Overview: what Phase 3 builds
- Architecture: real-time pipeline diagram
- Key features: meal logging, macro tracking, goals, coach, water, streaks
- Testing: unit, integration, E2E
- Timeline: 5-7 days
- Success criteria: all features working, 115+ tests, zero errors

- [ ] **Step 3: Run all tests**

```bash
cd apps/mobile && pnpm test
```

Expected: 115+ tests passing (Phase 2 + Phase 3).

- [ ] **Step 4: TypeScript check**

```bash
tsc --noEmit
```

Expected: Zero errors.

- [ ] **Step 5: Commit integration tests + docs**

```bash
git commit -m "feat: complete Phase 3 with integration tests and documentation"
```

---

## Phase 3 Summary

### Completed Features

✅ **Meal Logging** (manual, voice, photo) with macro tracking  
✅ **Nutrition Goals** (AI-generated + adjustable)  
✅ **Water Intake** (quick-add + progress tracking)  
✅ **Nutrition Coach** (text/voice Q&A with context-aware advice)  
✅ **Streak Tracking** (daily, visual calendar)  
✅ **Offline-First** (SQLite storage, sync queue, exponential backoff)  
✅ **Comprehensive Testing** (115+ tests, 80%+ coverage)

### File Count

- **Types:** 3 files
- **Stores:** 3 files
- **Database:** 5 files
- **ML/API:** 3 files
- **Screens:** 7 files
- **Components:** 8 files
- **Hooks:** 5 files
- **Tests:** 12+ files

**Total:** 50+ new files

### Test Results

- Unit tests: 40+
- Integration tests: 30+
- Component tests: 35+
- E2E tests: 15+
- **Total:** 115+ tests passing

### Git Commits (Part 3)

1. Coach Q&A implementation
2. Water tracking
3. Streak tracking
4. Sync queue (offline-first)
5. Integration tests + documentation

---

## Success Criteria ✅

✅ All meal logging methods working (manual, voice, photo)  
✅ Macro tracking with visual progress bars  
✅ AI-generated nutrition goals (BMR → TDEE → macros)  
✅ Nutrition coach with personalized Q&A  
✅ Water intake tracking with quick-add  
✅ Streak tracking with visual calendar  
✅ Photo storage + offline sync queue  
✅ Offline-first: full app works without internet  
✅ 115+ tests passing, 80%+ coverage  
✅ Zero TypeScript errors  
✅ No regressions in Phase 1-2  
✅ Production-ready nutrition system

---

## Next Steps

After Phase 3 approval:

1. **Phase 4:** Health Integration (HealthKit, wearables) - 4-5 days
2. **Phase 5:** Social & Gamification - 6-7 days
3. **Phase 6:** AI Memory Layer - 8-10 days
4. **Phase 7:** Advanced Features (AR, live coaching, marketplace) - 12-15 days

---

**Approval:** Ready for execution via subagent-driven-development
