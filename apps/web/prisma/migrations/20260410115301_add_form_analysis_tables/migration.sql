-- AlterTable
ALTER TABLE "Subscription" ADD COLUMN     "aiCoachUsed" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "aiMealsUsed" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "aiProgramsUsed" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "monthlySessionsUsed" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "usageResetAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateTable
CREATE TABLE "FormRepData" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "exerciseName" TEXT NOT NULL,
    "repNumber" INTEGER NOT NULL,
    "setNumber" INTEGER NOT NULL,
    "keypoints" JSONB NOT NULL,
    "angles" JSONB NOT NULL,
    "formScore" DOUBLE PRECISION NOT NULL,
    "technicalCorrectness" DOUBLE PRECISION NOT NULL,
    "errors" JSONB NOT NULL,
    "muscleEngagement" JSONB NOT NULL,
    "injuryRisk" INTEGER NOT NULL,
    "voiceFeedback" TEXT NOT NULL,
    "corrections" TEXT[],
    "encouragement" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FormRepData_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkoutAnalytics" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "avgFormScore" DOUBLE PRECISION NOT NULL,
    "bestRepScore" DOUBLE PRECISION NOT NULL,
    "worstRepScore" DOUBLE PRECISION NOT NULL,
    "formTrend" TEXT NOT NULL,
    "muscleEngagement" JSONB NOT NULL,
    "weakPointsFound" TEXT[],
    "injuryRiskLevel" INTEGER NOT NULL,
    "riskFactors" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkoutAnalytics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserWeakness" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "muscleGroup" TEXT NOT NULL,
    "exerciseName" TEXT NOT NULL,
    "severity" INTEGER NOT NULL,
    "discoveredDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "targetDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserWeakness_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FormRepData_sessionId_idx" ON "FormRepData"("sessionId");

-- CreateIndex
CREATE INDEX "FormRepData_exerciseName_idx" ON "FormRepData"("exerciseName");

-- CreateIndex
CREATE INDEX "FormRepData_repNumber_idx" ON "FormRepData"("repNumber");

-- CreateIndex
CREATE UNIQUE INDEX "WorkoutAnalytics_sessionId_key" ON "WorkoutAnalytics"("sessionId");

-- CreateIndex
CREATE INDEX "WorkoutAnalytics_sessionId_idx" ON "WorkoutAnalytics"("sessionId");

-- CreateIndex
CREATE INDEX "UserWeakness_userId_idx" ON "UserWeakness"("userId");

-- CreateIndex
CREATE INDEX "UserWeakness_muscleGroup_idx" ON "UserWeakness"("muscleGroup");

-- CreateIndex
CREATE INDEX "Subscription_userId_idx" ON "Subscription"("userId");

-- AddForeignKey
ALTER TABLE "FormRepData" ADD CONSTRAINT "FormRepData_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "WorkoutSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkoutAnalytics" ADD CONSTRAINT "WorkoutAnalytics_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "WorkoutSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserWeakness" ADD CONSTRAINT "UserWeakness_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
