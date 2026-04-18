# Phase 3: Complete Nutrition System Implementation Plan (Part 2)

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan.

**Goal:** Implement voice integration (VAPI), photo capture, AI goal generation (Claude), and nutrition history screens.

**Architecture:** Voice entry → VAPI transcription → Claude food parsing → review → save. Photo capture with local queue. Goal generation from user profile.

**Tech Stack:** VAPI API, Claude API, Zustand, SQLite

---

## Chunk 3: Voice Integration & Photo Capture

### Task 5: Set up VAPI voice integration and Claude food parsing

**Files:**

- Create: `apps/mobile/src/ml/food-parser.ts`
- Create: `apps/mobile/src/api/nutrition-client.ts`
- Create: `apps/mobile/tests/ml/food-parser.test.ts`

- [ ] **Step 1: Create Claude food parser**

Implement `parseFoodFromTranscript()` function. Takes meal transcript like "2 eggs and toast" → returns JSON array with FoodItem objects including macro estimates.

- [ ] **Step 2: Create nutrition API client**

Add `uploadMealPhoto()`, `syncMeal()`, `generateNutritionGoal()` endpoints.

- [ ] **Step 3: Write food parser tests**

Test parsing: "2 eggs" → {name: egg, quantity: 2, calories: 150, proteinG: 12}

- [ ] **Step 4: Commit voice integration**

```bash
git commit -m "feat: implement Claude-based food parsing and nutrition API client"
```

---

### Task 6: Create photo capture + local storage

**Files:**

- Create: `apps/mobile/src/db/nutritionPhoto.ts`
- Create: `apps/mobile/src/hooks/usePhotoCapture.ts`
- Create: `apps/mobile/src/components/nutrition/PhotoCapture.tsx`

- [ ] **Step 1: Create photo database**

SQLite table for meal_photos with id, mealLogId, filePath, uploadStatus.

- [ ] **Step 2: Create photo capture hook**

`usePhotoCapture()` with camera ref, permission handling, takePhoto() function.

- [ ] **Step 3: Create PhotoCapture component**

Camera preview → capture button → photo preview → use/retake options.

- [ ] **Step 4: Commit photo capture**

```bash
git commit -m "feat: implement photo capture with local storage"
```

---

## Chunk 4: AI Goal Generation & History

### Task 7: Implement AI goal generation with Claude

**Files:**

- Create: `apps/mobile/src/ml/goal-generator.ts`
- Create: `apps/mobile/src/screens/nutrition/GoalSetupScreen.tsx`

- [ ] **Step 1: Create goal generator**

`generateNutritionGoal()` calculates: BMR + activity level → TDEE → goal adjustment (±deficit/surplus) → macro split by diet type.

- [ ] **Step 2: Create GoalSetupScreen**

Input form: age, weight, height, activity level, goal (lose/maintain/gain), diet type (balanced/keto/vegan/paleo/low_carb).

Shows calculated goals in card. User can adjust and save.

- [ ] **Step 3: Commit goal generation**

```bash
git commit -m "feat: implement AI-powered goal generation and goal setup screen"
```

---

### Task 8: Create nutrition history screens

**Files:**

- Create: `apps/mobile/src/screens/nutrition/TodayNutritionScreen.tsx`
- Create: `apps/mobile/src/screens/nutrition/NutritionHistoryScreen.tsx`
- Create: `apps/mobile/src/components/nutrition/MacroProgressBar.tsx`

- [ ] **Step 1: Create MacroProgressBar component**

Displays progress: "Calories: 1500 / 2000 cal" with colored bar (green > 80%, yellow 60-80%, red < 60%).

- [ ] **Step 2: Create TodayNutritionScreen**

Shows: macro progress bars (calories, protein, carbs, fat) vs daily goal, list of meals logged today, "+ Log Meal" button.

- [ ] **Step 3: Create NutritionHistoryScreen**

Shows: meals grouped by date, daily calorie totals, clickable dates to expand.

- [ ] **Step 4: Commit history screens**

```bash
git commit -m "feat: create nutrition summary and history screens with macro progress tracking"
```

---

## Success Criteria for Part 2

✅ Voice → transcript → food parsing (Claude)  
✅ Photo capture with local storage  
✅ AI goal generation (BMR → TDEE → macros)  
✅ Today's nutrition summary with progress bars  
✅ Nutrition history by date  
✅ 25+ new tests  
✅ Zero TypeScript errors  
✅ 4 commits

---

**Next (Part 3):** Coach Q&A, water tracking, streaks, sync queue, full integration tests
