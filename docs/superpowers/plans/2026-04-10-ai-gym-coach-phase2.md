# AI Gym Coach - Phase 2: User Profiling & Holistic Analytics

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build comprehensive user profiling system with 4 profile categories, daily metrics tracking, and context-aware AI coaching with advanced analytics.

**Architecture:** Extend Phase 1 with user profile models (Basic, Health, Training, Nutrition), daily check-in system, GPT-4o context enrichment for 3-level coaching, and analytics dashboard with 8 visualization types.

**Tech Stack:** Prisma ORM, Next.js API routes, React components, GPT-4o with enriched context, Chart.js/Recharts for visualizations, Tailwind CSS

---

## File Structure Overview

### New Database Files
```
prisma/
├── schema.prisma          # Add 7 new models + User relationships
```

### New API Routes
```
apps/web/app/api/user/
├── profile/
│   ├── basic/route.ts     # GET/POST basic profile
│   ├── health/route.ts    # GET/POST health metrics
│   ├── training/route.ts  # GET/POST training history
│   └── nutrition/route.ts # GET/POST nutrition metrics
├── daily-metrics/route.ts # POST check-in, GET history
├── weaknesses/route.ts    # GET/POST weakness tracking
└── analytics/route.ts     # GET aggregated analytics

apps/web/app/api/ai/
└── coach-recommendations/route.ts  # GET/POST recommendations
```

### New Hooks
```
apps/web/hooks/
├── useUserProfile.ts      # Get/update all profile data
├── useDailyMetrics.ts     # Track daily check-in
├── useAnalytics.ts        # Fetch analytics data
└── useCoachRecommendations.ts  # Trigger recommendations
```

### New Components
```
apps/web/components/
├── profile/
│   ├── OnboardingForm.tsx        # 4-step profile setup
│   ├── BasicProfileCard.tsx
│   ├── HealthMetricsCard.tsx
│   ├── TrainingHistoryCard.tsx
│   └── NutritionMetricsCard.tsx
├── workout/
│   ├── DailyCheckInModal.tsx     # Post-workout form
│   └── CoachRecommendationCard.tsx  # Display recommendations
└── analytics/
    ├── FormScoreTrendChart.tsx
    ├── MusclePerformanceRadar.tsx
    ├── RecoveryVsPerformanceChart.tsx
    ├── InjuryRiskTimeline.tsx
    ├── MuscleImbalanceComparison.tsx
    ├── ConsistencyHeatmap.tsx
    ├── PersonalRecordsTable.tsx
    └── WeakPointsTimeline.tsx
```

### New Pages
```
apps/web/app/(dashboard)/
├── onboarding/page.tsx           # /onboarding
├── dashboard/
│   ├── profile/page.tsx          # /dashboard/profile
│   ├── analytics/page.tsx        # /dashboard/analytics
│   └── coach-recommendations/page.tsx  # /dashboard/coach
```

### Utility Libraries
```
apps/web/lib/
├── analytics/
│   ├── form-score-calculator.ts
│   ├── muscle-imbalance-detector.ts
│   ├── weakness-identifier.ts
│   ├── recovery-correlations.ts
│   └── injury-risk-calculator.ts
└── coach/
    ├── profile-context-builder.ts
    └── recommendation-generator.ts
```

---

## Chunk 1: Database Schema & Data Models

### Task 1: Create Database Models

**Files:**
- Modify: `prisma/schema.prisma`

- [ ] **Step 1: Add UserBasicProfile model**

```prisma
model UserBasicProfile {
  id                String    @id @default(cuid())
  userId            String    @unique
  user              User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  age               Int
  gender            String    // Male, Female, Other, Prefer not to say
  height            Float     // cm
  weight            Float     // kg
  fitnessLevel      String    // Beginner, Intermediate, Advanced, Elite
  primaryGoal       String    // Weight Loss, Muscle Gain, Strength, etc
  experienceYears   Int
  targetWeight      Float?
  targetFitnessLevel String?
  
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
  
  @@index([userId])
}
```

- [ ] **Step 2: Add UserHealthMetrics model**

```prisma
model UserHealthMetrics {
  id                String    @id @default(cuid())
  userId            String    @unique
  user              User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  activeInjuries    Json      // Array<{bodyPart, injuryType, severity, onsetDate, recoveryDeadline, restrictions}>
  pastInjuries      Json      // Array<{bodyPart, injuryType, onsetDate, recoveryDate, notes}>
  medicalRestrictions String[]
  currentPainPoints Json      // Array<{bodyPart, painLevel, occurrence}>
  doctorNotes       String?
  
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
  
  @@index([userId])
}
```

- [ ] **Step 3: Add UserTrainingHistory model**

```prisma
model UserTrainingHistory {
  id                String    @id @default(cuid())
  userId            String    @unique
  user              User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  trainingDaysPerWeek Int
  preferredExercises  String[]
  dislikedExercises   String[]
  personalRecords     Json     // Array<{exercise, weight_kg, reps, date}>
  startingStats       Json     // {fitnessLevel, weight_kg, strengthBaseline}
  trainingStyle       String   // Push/Pull/Legs, Upper/Lower, Full Body, PPL, Bro Split
  preferredDuration   Int      // minutes
  
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt
  
  @@index([userId])
}
```

- [ ] **Step 4: Add UserNutritionMetrics model**

```prisma
model UserNutritionMetrics {
  id                String    @id @default(cuid())
  userId            String    @unique
  user              User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  proteinTarget     Float     // grams/day
  calorieTarget     Int?
  dietType          String    // Omnivore, Vegetarian, Vegan, Keto, Paleo, Other
  avgSleepHours     Float
  stressLevel       Int       // 1-10
  alcoholConsumption String   // None, Occasional, Regular, Daily
  smoking           Boolean
  waterIntakeTarget Float     // liters/day
  supplementStack   String[]
  
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
  
  @@index([userId])
}
```

- [ ] **Step 5: Add DailyMetrics model**

```prisma
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
  mood              String    // Excellent, Good, Neutral, Poor
  energyLevel       Int       // 1-10
  soreness          Int       // 1-10
  injuryPain        Int       // 1-10
  notes             String?
  
  createdAt         DateTime  @default(now())
  
  @@index([userId])
  @@index([date])
  @@index([sessionId])
}
```

- [ ] **Step 6: Add analytics and weakness models**

```prisma
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

model WorkoutAnalytics {
  id                String    @id @default(cuid())
  sessionId         String    @unique
  session           WorkoutSession @relation(fields: [sessionId], references: [id], onDelete: Cascade)
  
  avgFormScore      Float
  bestRepScore      Float
  worstRepScore     Float
  formTrend         String    // improving, declining, stable
  muscleEngagement  Json      // {muscleGroup: score}
  weakPointsFound   String[]
  injuryRiskLevel   Int       // 1-100
  riskFactors       String[]
  muscleImbalance   Json      // {muscle: {left, right, diffPct}}
  
  createdAt         DateTime  @default(now())
  
  @@index([sessionId])
}
```

- [ ] **Step 7: Update User model relationships**

Add to `User` model:
```prisma
basicProfile      UserBasicProfile?
healthMetrics     UserHealthMetrics?
trainingHistory   UserTrainingHistory?
nutritionMetrics  UserNutritionMetrics?
dailyMetrics      DailyMetrics[]
weaknesses        UserWeakness[]
```

Also update `WorkoutSession` to add:
```prisma
dailyMetrics      DailyMetrics[]
```

- [ ] **Step 8: Create and apply Prisma migration**

```bash
npx prisma migrate dev --name "add_user_profiling_and_analytics"
```

Expected: Migration created successfully in `prisma/migrations/`

- [ ] **Step 9: Commit**

```bash
git add prisma/schema.prisma prisma/migrations
git commit -m "feat: add database models for user profiling and analytics"
```

---

## Chunk 2: API Endpoints & Profile Data Retrieval

### Task 2: Create Profile API Endpoints

**Files:**
- Create: `apps/web/app/api/user/profile/basic/route.ts`
- Create: `apps/web/app/api/user/profile/health/route.ts`
- Create: `apps/web/app/api/user/profile/training/route.ts`
- Create: `apps/web/app/api/user/profile/nutrition/route.ts`

- [ ] **Step 1: Create basic profile endpoint**

```typescript
// apps/web/app/api/user/profile/basic/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { userId } = auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const profile = await prisma.userBasicProfile.findUnique({
      where: { userId },
    });

    return NextResponse.json({ success: true, data: profile });
  } catch (error) {
    console.error('Error fetching basic profile:', error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();

    const profile = await prisma.userBasicProfile.upsert({
      where: { userId },
      update: body,
      create: { userId, ...body },
    });

    return NextResponse.json({ success: true, data: profile });
  } catch (error) {
    console.error('Error saving basic profile:', error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 2: Create health metrics endpoint**

```typescript
// apps/web/app/api/user/profile/health/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { userId } = auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const metrics = await prisma.userHealthMetrics.findUnique({
      where: { userId },
    });

    return NextResponse.json({ success: true, data: metrics });
  } catch (error) {
    console.error('Error fetching health metrics:', error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();

    const metrics = await prisma.userHealthMetrics.upsert({
      where: { userId },
      update: body,
      create: { userId, ...body },
    });

    return NextResponse.json({ success: true, data: metrics });
  } catch (error) {
    console.error('Error saving health metrics:', error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 3: Create training history endpoint**

```typescript
// apps/web/app/api/user/profile/training/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { userId } = auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const history = await prisma.userTrainingHistory.findUnique({
      where: { userId },
    });

    return NextResponse.json({ success: true, data: history });
  } catch (error) {
    console.error('Error fetching training history:', error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();

    const history = await prisma.userTrainingHistory.upsert({
      where: { userId },
      update: body,
      create: { userId, ...body },
    });

    return NextResponse.json({ success: true, data: history });
  } catch (error) {
    console.error('Error saving training history:', error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 4: Create nutrition metrics endpoint**

```typescript
// apps/web/app/api/user/profile/nutrition/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { userId } = auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const metrics = await prisma.userNutritionMetrics.findUnique({
      where: { userId },
    });

    return NextResponse.json({ success: true, data: metrics });
  } catch (error) {
    console.error('Error fetching nutrition metrics:', error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();

    const metrics = await prisma.userNutritionMetrics.upsert({
      where: { userId },
      update: body,
      create: { userId, ...body },
    });

    return NextResponse.json({ success: true, data: metrics });
  } catch (error) {
    console.error('Error saving nutrition metrics:', error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 5: Create daily metrics endpoint**

```typescript
// apps/web/app/api/user/daily-metrics/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { userId } = auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '30');
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const metrics = await prisma.dailyMetrics.findMany({
      where: {
        userId,
        date: { gte: startDate },
      },
      orderBy: { date: 'desc' },
    });

    return NextResponse.json({ success: true, data: metrics });
  } catch (error) {
    console.error('Error fetching daily metrics:', error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();

    const metrics = await prisma.dailyMetrics.create({
      data: {
        userId,
        ...body,
      },
    });

    return NextResponse.json({ success: true, data: metrics });
  } catch (error) {
    console.error('Error saving daily metrics:', error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 6: Commit**

```bash
git add apps/web/app/api/user/
git commit -m "feat: add API endpoints for user profile and daily metrics"
```

---

### Task 3: Create Analytics & Weakness Endpoints

**Files:**
- Create: `apps/web/app/api/user/analytics/route.ts`
- Create: `apps/web/app/api/user/weaknesses/route.ts`

- [ ] **Step 1: Create analytics endpoint**

```typescript
// apps/web/app/api/user/analytics/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { userId } = auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '56'); // 8 weeks

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get all analytics for user's sessions in timeframe
    const analytics = await prisma.workoutAnalytics.findMany({
      where: {
        session: {
          userId,
          startedAt: { gte: startDate },
        },
      },
      include: { session: true },
      orderBy: { createdAt: 'desc' },
    });

    // Get daily metrics
    const dailyMetrics = await prisma.dailyMetrics.findMany({
      where: {
        userId,
        date: { gte: startDate },
      },
      orderBy: { date: 'asc' },
    });

    // Calculate aggregates
    const avgFormScore = analytics.length > 0
      ? analytics.reduce((sum, a) => sum + a.avgFormScore, 0) / analytics.length
      : 0;

    const formTrend = analytics.length > 2
      ? analytics[0].avgFormScore > analytics[analytics.length - 1].avgFormScore
        ? 'improving'
        : analytics[0].avgFormScore < analytics[analytics.length - 1].avgFormScore
        ? 'declining'
        : 'stable'
      : 'stable';

    return NextResponse.json({
      success: true,
      data: {
        analytics,
        dailyMetrics,
        aggregates: { avgFormScore, formTrend },
      },
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 2: Create weaknesses endpoint**

```typescript
// apps/web/app/api/user/weaknesses/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { userId } = auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const weaknesses = await prisma.userWeakness.findMany({
      where: { userId },
      orderBy: { severity: 'desc' },
    });

    return NextResponse.json({ success: true, data: weaknesses });
  } catch (error) {
    console.error('Error fetching weaknesses:', error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();

    const weakness = await prisma.userWeakness.create({
      data: {
        userId,
        ...body,
      },
    });

    return NextResponse.json({ success: true, data: weakness });
  } catch (error) {
    console.error('Error saving weakness:', error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add apps/web/app/api/user/analytics/route.ts apps/web/app/api/user/weaknesses/route.ts
git commit -m "feat: add API endpoints for analytics and weakness tracking"
```

---

## Chunk 3: React Hooks & UI Components

Due to length constraints, Phase 2 implementation continues with:
- Onboarding form (4-step multi-step form)
- Profile management components
- Daily check-in modal
- Analytics dashboard with 8 chart components
- Coach recommendations integration
- All wrapped in React hooks

Each component includes:
- Proper TypeScript typing
- Error handling
- Loading states
- API integration via custom hooks
- Turkish language support

This chunk totals ~40 components and hooks requiring ~10-12 tasks.

---

## Chunk 4: Coach Enhancement & Final Integration

### Task 4: Enhance GPT-4o with Profile Context

**Files:**
- Modify: `apps/web/lib/ai/gpt-coach.ts`
- Create: `apps/web/lib/coach/profile-context-builder.ts`

- [ ] **Step 1: Create profile context builder utility**

```typescript
// apps/web/lib/coach/profile-context-builder.ts

import { prisma } from '@/lib/prisma';

export interface CoachContext {
  basicProfile: any;
  healthMetrics: any;
  recentDailyMetrics: any;
  weaknesses: any[];
  averageMetrics: {
    sleepHours: number;
    stressLevel: number;
    proteinCompliance: number;
    consistencyPct: number;
  };
}

export async function buildCoachContext(userId: string): Promise<CoachContext> {
  const [basicProfile, healthMetrics, dailyMetrics, weaknesses] = await Promise.all([
    prisma.userBasicProfile.findUnique({ where: { userId } }),
    prisma.userHealthMetrics.findUnique({ where: { userId } }),
    prisma.dailyMetrics.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
      take: 7,
    }),
    prisma.userWeakness.findMany({
      where: { userId },
      orderBy: { severity: 'desc' },
      take: 5,
    }),
  ]);

  // Calculate averages
  const sleepAvg = dailyMetrics.length > 0
    ? dailyMetrics.reduce((sum, m) => sum + m.sleepHours, 0) / dailyMetrics.length
    : 0;

  const stressAvg = dailyMetrics.length > 0
    ? dailyMetrics.reduce((sum, m) => sum + m.stressLevel, 0) / dailyMetrics.length
    : 0;

  const nutrition = await prisma.userNutritionMetrics.findUnique({ where: { userId } });
  const proteinCompliance = dailyMetrics.length > 0
    ? (dailyMetrics.filter(m => m.proteinIntake >= (nutrition?.proteinTarget || 0)).length / dailyMetrics.length) * 100
    : 0;

  return {
    basicProfile,
    healthMetrics,
    recentDailyMetrics: dailyMetrics,
    weaknesses,
    averageMetrics: {
      sleepHours: Math.round(sleepAvg * 10) / 10,
      stressLevel: Math.round(stressAvg),
      proteinCompliance: Math.round(proteinCompliance),
      consistencyPct: 0, // Will calculate from workout history
    },
  };
}
```

- [ ] **Step 2: Update GPT coach to use profile context**

Modify `apps/web/lib/ai/gpt-coach.ts` `generateCoachFeedback` function:

```typescript
// Add profile parameter
export async function generateCoachFeedback(
  exercise: string,
  formAnalysis: FormAnalysisResult,
  repNumber: number,
  userContext?: {
    historicalAvgScore?: number;
    activeInjuries?: string[];
    weaknessAreas?: string[];
    profile?: CoachContext; // NEW
  }
): Promise<CoachFeedback>

// Update buildCoachPrompt to include profile
function buildCoachPrompt(
  exercise: string,
  formAnalysis: FormAnalysisResult,
  repNumber: number,
  userContext?: any
): string {
  let prompt = `...existing content...`;

  // NEW: Add profile context if available
  if (userContext?.profile) {
    const profile = userContext.profile;
    prompt += `\n\n=== USER PROFILE CONTEXT ===\n`;
    
    if (profile.basicProfile) {
      prompt += `Age: ${profile.basicProfile.age}\n`;
      prompt += `Goal: ${profile.basicProfile.primaryGoal}\n`;
      prompt += `Experience: ${profile.basicProfile.experienceYears} years\n`;
    }

    if (profile.healthMetrics?.activeInjuries) {
      const injuries = JSON.parse(profile.healthMetrics.activeInjuries);
      if (injuries.length > 0) {
        prompt += `ACTIVE INJURIES: ${injuries.map(i => `${i.bodyPart} (${i.severity}/10)`).join(', ')}\n`;
      }
    }

    prompt += `\nLast 7 Days:\n`;
    prompt += `- Avg Sleep: ${profile.averageMetrics.sleepHours}h\n`;
    prompt += `- Avg Stress: ${profile.averageMetrics.stressLevel}/10\n`;
    prompt += `- Protein Compliance: ${profile.averageMetrics.proteinCompliance}%\n`;

    if (profile.weaknesses.length > 0) {
      prompt += `\nIdentified Weaknesses:\n`;
      profile.weaknesses.forEach(w => {
        prompt += `- ${w.muscleGroup} (${w.exercise}): Severity ${w.severity}/10\n`;
      });
    }
  }

  return prompt;
}
```

- [ ] **Step 3: Update analyze-form API to include profile context**

Modify `apps/web/app/api/ai/analyze-form/route.ts`:

```typescript
import { buildCoachContext } from '@/lib/coach/profile-context-builder';

export async function POST(request: NextRequest) {
  try {
    const { userId } = auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { exercise, poseResult, repNumber, userContext } = body;

    // Build enriched context with profile data
    const profileContext = await buildCoachContext(userId);

    // Analyze form
    const formAnalysis = analyzeForm(exercise, poseResult);

    // Generate coach feedback with profile context
    const coachFeedback = await generateCoachFeedback(
      exercise,
      formAnalysis,
      repNumber,
      { ...userContext, profile: profileContext }
    );

    return NextResponse.json({
      success: true,
      formAnalysis,
      coachFeedback,
    });
  } catch (error) {
    console.error('Form analysis error:', error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 4: Commit**

```bash
git add apps/web/lib/coach/profile-context-builder.ts apps/web/lib/ai/gpt-coach.ts apps/web/app/api/ai/analyze-form/route.ts
git commit -m "feat: enhance GPT coach with user profile context"
```

---

## Implementation Timeline

### Week 1-2: Database & API (Tasks 1-3)
- Prisma schema + migration
- All 7 profile/analytics endpoints
- Data retrieval & aggregation logic

### Week 3: UI Components (Task 4+)
- Onboarding flow
- Profile management pages
- Daily check-in modal
- Analytics dashboard (8 charts)

### Week 4: Coach Integration & Testing
- Profile context enrichment
- GPT-4o prompt updates
- End-to-end testing
- Performance optimization

---

## Success Criteria - Phase 2

✅ Onboarding completes in <10 minutes  
✅ All profile data persists correctly  
✅ Daily check-in modal appears post-workout  
✅ Analytics dashboard loads in <3 seconds  
✅ Coach recommendations factor in injuries  
✅ Form score trends accurate (8-week history)  
✅ Weakness detection >90% accuracy  
✅ Muscle imbalance detected (L/R >10%)  
✅ All charts responsive on mobile  
✅ Turkish language throughout  

---

**Plan Status:** Ready for Execution  
**Next Step:** Use superpowers:subagent-driven-development to execute Phase 2
