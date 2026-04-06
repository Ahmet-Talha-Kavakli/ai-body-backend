-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "clerkId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "avatarUrl" TEXT,
    "subscriptionTier" TEXT NOT NULL DEFAULT 'free',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HealthProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "age" INTEGER NOT NULL,
    "gender" TEXT NOT NULL,
    "heightCm" DOUBLE PRECISION NOT NULL,
    "weightKg" DOUBLE PRECISION NOT NULL,
    "fitnessLevel" TEXT NOT NULL,
    "goals" TEXT[],
    "availableDaysPerWeek" INTEGER NOT NULL,
    "sessionDurationMinutes" INTEGER NOT NULL,
    "availableEquipment" TEXT[],
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HealthProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Injury" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "bodyPart" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Injury_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkoutProgram" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "generatedByAi" BOOLEAN NOT NULL DEFAULT false,
    "aiVersion" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkoutProgram_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProgramWeek" (
    "id" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "weekNumber" INTEGER NOT NULL,

    CONSTRAINT "ProgramWeek_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProgramDay" (
    "id" TEXT NOT NULL,
    "weekId" TEXT NOT NULL,
    "dayNumber" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "estimatedDurationMinutes" INTEGER NOT NULL DEFAULT 45,
    "notes" TEXT,

    CONSTRAINT "ProgramDay_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Exercise" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "muscleGroups" TEXT[],
    "equipment" TEXT[],
    "difficultyLevel" TEXT NOT NULL,
    "videoUrl" TEXT,
    "thumbnailUrl" TEXT,
    "animationKey" TEXT NOT NULL,
    "cues" TEXT[],
    "commonMistakes" TEXT[],
    "poseConfig" JSONB,

    CONSTRAINT "Exercise_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlannedExercise" (
    "id" TEXT NOT NULL,
    "dayId" TEXT NOT NULL,
    "exerciseId" TEXT NOT NULL,
    "sets" INTEGER NOT NULL,
    "reps" INTEGER,
    "durationSeconds" INTEGER,
    "restSeconds" INTEGER NOT NULL DEFAULT 60,
    "rpe" INTEGER,
    "notes" TEXT,
    "order" INTEGER NOT NULL,

    CONSTRAINT "PlannedExercise_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkoutSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "programId" TEXT,
    "programDayId" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),
    "durationSeconds" INTEGER,
    "overallFormScore" DOUBLE PRECISION,
    "caloriesBurned" DOUBLE PRECISION,
    "notes" TEXT,
    "heartRateData" JSONB,
    "poseAnalyses" JSONB,

    CONSTRAINT "WorkoutSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompletedSet" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "exerciseId" TEXT NOT NULL,
    "setNumber" INTEGER NOT NULL,
    "reps" INTEGER,
    "weightKg" DOUBLE PRECISION,
    "durationSeconds" INTEGER,
    "formScore" DOUBLE PRECISION NOT NULL,
    "repData" JSONB NOT NULL,

    CONSTRAINT "CompletedSet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MealLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "loggedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "mealType" TEXT NOT NULL,
    "items" JSONB NOT NULL,
    "photoUrl" TEXT,
    "aiAnalyzed" BOOLEAN NOT NULL DEFAULT false,
    "totalCalories" DOUBLE PRECISION NOT NULL,
    "totalProteinG" DOUBLE PRECISION NOT NULL,
    "totalCarbsG" DOUBLE PRECISION NOT NULL,
    "totalFatG" DOUBLE PRECISION NOT NULL,
    "notes" TEXT,

    CONSTRAINT "MealLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NutritionGoal" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "dailyCalories" DOUBLE PRECISION NOT NULL,
    "proteinG" DOUBLE PRECISION NOT NULL,
    "carbsG" DOUBLE PRECISION NOT NULL,
    "fatG" DOUBLE PRECISION NOT NULL,
    "waterMl" DOUBLE PRECISION NOT NULL DEFAULT 2500,
    "generatedByAi" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NutritionGoal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WearableDevice" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "brand" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "isConnected" BOOLEAN NOT NULL DEFAULT false,
    "lastSyncedAt" TIMESTAMP(3),
    "accessToken" TEXT,

    CONSTRAINT "WearableDevice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WearableReading" (
    "id" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL,
    "recordedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WearableReading_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIConversation" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "context" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AIConversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIMessage" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AIMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subscription" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "stripeCustomerId" TEXT NOT NULL,
    "stripeSubscriptionId" TEXT,
    "tier" TEXT NOT NULL DEFAULT 'free',
    "status" TEXT NOT NULL DEFAULT 'active',
    "currentPeriodEnd" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_clerkId_key" ON "User"("clerkId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_clerkId_idx" ON "User"("clerkId");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "HealthProfile_userId_key" ON "HealthProfile"("userId");

-- CreateIndex
CREATE INDEX "HealthProfile_userId_idx" ON "HealthProfile"("userId");

-- CreateIndex
CREATE INDEX "Injury_userId_idx" ON "Injury"("userId");

-- CreateIndex
CREATE INDEX "WorkoutProgram_userId_idx" ON "WorkoutProgram"("userId");

-- CreateIndex
CREATE INDEX "ProgramWeek_programId_idx" ON "ProgramWeek"("programId");

-- CreateIndex
CREATE INDEX "ProgramDay_weekId_idx" ON "ProgramDay"("weekId");

-- CreateIndex
CREATE UNIQUE INDEX "Exercise_slug_key" ON "Exercise"("slug");

-- CreateIndex
CREATE INDEX "Exercise_slug_idx" ON "Exercise"("slug");

-- CreateIndex
CREATE INDEX "PlannedExercise_dayId_idx" ON "PlannedExercise"("dayId");

-- CreateIndex
CREATE INDEX "WorkoutSession_userId_idx" ON "WorkoutSession"("userId");

-- CreateIndex
CREATE INDEX "WorkoutSession_startedAt_idx" ON "WorkoutSession"("startedAt");

-- CreateIndex
CREATE INDEX "CompletedSet_sessionId_idx" ON "CompletedSet"("sessionId");

-- CreateIndex
CREATE INDEX "MealLog_userId_idx" ON "MealLog"("userId");

-- CreateIndex
CREATE INDEX "MealLog_loggedAt_idx" ON "MealLog"("loggedAt");

-- CreateIndex
CREATE UNIQUE INDEX "NutritionGoal_userId_key" ON "NutritionGoal"("userId");

-- CreateIndex
CREATE INDEX "WearableDevice_userId_idx" ON "WearableDevice"("userId");

-- CreateIndex
CREATE INDEX "WearableReading_userId_idx" ON "WearableReading"("userId");

-- CreateIndex
CREATE INDEX "WearableReading_deviceId_idx" ON "WearableReading"("deviceId");

-- CreateIndex
CREATE INDEX "WearableReading_recordedAt_idx" ON "WearableReading"("recordedAt");

-- CreateIndex
CREATE INDEX "AIConversation_userId_idx" ON "AIConversation"("userId");

-- CreateIndex
CREATE INDEX "AIMessage_conversationId_idx" ON "AIMessage"("conversationId");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_userId_key" ON "Subscription"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_stripeCustomerId_key" ON "Subscription"("stripeCustomerId");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_stripeSubscriptionId_key" ON "Subscription"("stripeSubscriptionId");

-- AddForeignKey
ALTER TABLE "HealthProfile" ADD CONSTRAINT "HealthProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Injury" ADD CONSTRAINT "Injury_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkoutProgram" ADD CONSTRAINT "WorkoutProgram_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProgramWeek" ADD CONSTRAINT "ProgramWeek_programId_fkey" FOREIGN KEY ("programId") REFERENCES "WorkoutProgram"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProgramDay" ADD CONSTRAINT "ProgramDay_weekId_fkey" FOREIGN KEY ("weekId") REFERENCES "ProgramWeek"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlannedExercise" ADD CONSTRAINT "PlannedExercise_dayId_fkey" FOREIGN KEY ("dayId") REFERENCES "ProgramDay"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlannedExercise" ADD CONSTRAINT "PlannedExercise_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "Exercise"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkoutSession" ADD CONSTRAINT "WorkoutSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkoutSession" ADD CONSTRAINT "WorkoutSession_programId_fkey" FOREIGN KEY ("programId") REFERENCES "WorkoutProgram"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkoutSession" ADD CONSTRAINT "WorkoutSession_programDayId_fkey" FOREIGN KEY ("programDayId") REFERENCES "ProgramDay"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompletedSet" ADD CONSTRAINT "CompletedSet_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "WorkoutSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompletedSet" ADD CONSTRAINT "CompletedSet_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "Exercise"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MealLog" ADD CONSTRAINT "MealLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NutritionGoal" ADD CONSTRAINT "NutritionGoal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WearableDevice" ADD CONSTRAINT "WearableDevice_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WearableReading" ADD CONSTRAINT "WearableReading_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "WearableDevice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WearableReading" ADD CONSTRAINT "WearableReading_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIConversation" ADD CONSTRAINT "AIConversation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIMessage" ADD CONSTRAINT "AIMessage_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "AIConversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
