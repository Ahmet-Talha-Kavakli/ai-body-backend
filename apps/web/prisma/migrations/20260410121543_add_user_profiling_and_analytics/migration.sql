-- CreateTable
CREATE TABLE "UserBasicProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "age" INTEGER NOT NULL,
    "gender" TEXT NOT NULL,
    "height" DOUBLE PRECISION NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL,
    "fitnessLevel" TEXT NOT NULL,
    "primaryGoal" TEXT NOT NULL,
    "experienceYears" INTEGER NOT NULL,
    "targetWeight" DOUBLE PRECISION,
    "targetFitnessLevel" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserBasicProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserHealthMetrics" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "activeInjuries" JSONB NOT NULL,
    "pastInjuries" JSONB NOT NULL,
    "medicalRestrictions" TEXT[],
    "currentPainPoints" JSONB NOT NULL,
    "doctorNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserHealthMetrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserTrainingHistory" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "trainingDaysPerWeek" INTEGER NOT NULL,
    "preferredExercises" TEXT[],
    "dislikedExercises" TEXT[],
    "personalRecords" JSONB NOT NULL,
    "startingStats" JSONB NOT NULL,
    "trainingStyle" TEXT NOT NULL,
    "preferredDuration" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserTrainingHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserNutritionMetrics" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "proteinTarget" DOUBLE PRECISION NOT NULL,
    "calorieTarget" INTEGER,
    "dietType" TEXT NOT NULL,
    "avgSleepHours" DOUBLE PRECISION NOT NULL,
    "stressLevel" INTEGER NOT NULL,
    "alcoholConsumption" TEXT NOT NULL,
    "smoking" BOOLEAN NOT NULL,
    "waterIntakeTarget" DOUBLE PRECISION NOT NULL,
    "supplementStack" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserNutritionMetrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyMetrics" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sessionId" TEXT,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sleepHours" DOUBLE PRECISION NOT NULL,
    "sleepQuality" INTEGER NOT NULL,
    "stressLevel" INTEGER NOT NULL,
    "proteinIntake" DOUBLE PRECISION NOT NULL,
    "calorieIntake" INTEGER,
    "waterIntake" DOUBLE PRECISION NOT NULL,
    "mood" TEXT NOT NULL,
    "energyLevel" INTEGER NOT NULL,
    "soreness" INTEGER NOT NULL,
    "injuryPain" INTEGER NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DailyMetrics_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserBasicProfile_userId_key" ON "UserBasicProfile"("userId");

-- CreateIndex
CREATE INDEX "UserBasicProfile_userId_idx" ON "UserBasicProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "UserHealthMetrics_userId_key" ON "UserHealthMetrics"("userId");

-- CreateIndex
CREATE INDEX "UserHealthMetrics_userId_idx" ON "UserHealthMetrics"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "UserTrainingHistory_userId_key" ON "UserTrainingHistory"("userId");

-- CreateIndex
CREATE INDEX "UserTrainingHistory_userId_idx" ON "UserTrainingHistory"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "UserNutritionMetrics_userId_key" ON "UserNutritionMetrics"("userId");

-- CreateIndex
CREATE INDEX "UserNutritionMetrics_userId_idx" ON "UserNutritionMetrics"("userId");

-- CreateIndex
CREATE INDEX "DailyMetrics_userId_idx" ON "DailyMetrics"("userId");

-- CreateIndex
CREATE INDEX "DailyMetrics_date_idx" ON "DailyMetrics"("date");

-- CreateIndex
CREATE INDEX "DailyMetrics_sessionId_idx" ON "DailyMetrics"("sessionId");

-- AddForeignKey
ALTER TABLE "UserBasicProfile" ADD CONSTRAINT "UserBasicProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserHealthMetrics" ADD CONSTRAINT "UserHealthMetrics_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserTrainingHistory" ADD CONSTRAINT "UserTrainingHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserNutritionMetrics" ADD CONSTRAINT "UserNutritionMetrics_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyMetrics" ADD CONSTRAINT "DailyMetrics_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyMetrics" ADD CONSTRAINT "DailyMetrics_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "WorkoutSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;
