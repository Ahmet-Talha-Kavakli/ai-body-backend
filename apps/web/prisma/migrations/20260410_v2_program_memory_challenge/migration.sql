-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "vector";

-- CreateEnum
CREATE TYPE "ProgramStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'PAUSED');

-- CreateEnum
CREATE TYPE "MemoryType" AS ENUM ('SESSION_SUMMARY', 'WEEKLY_SUMMARY', 'MILESTONE', 'PATTERN');

-- CreateEnum
CREATE TYPE "FitnessLevel" AS ENUM ('BEGINNER', 'INTERMEDIATE', 'ADVANCED');

-- CreateEnum
CREATE TYPE "FitnessGoal" AS ENUM ('WEIGHT_LOSS', 'MUSCLE_GAIN', 'STRENGTH', 'ENDURANCE', 'FLEXIBILITY', 'GENERAL_FITNESS');

-- AlterTable
ALTER TABLE "PlannedExercise" ADD COLUMN     "repsMax" INTEGER NOT NULL DEFAULT 12,
ADD COLUMN     "repsMin" INTEGER NOT NULL DEFAULT 8,
ALTER COLUMN "rpe" SET DATA TYPE DOUBLE PRECISION,
ALTER COLUMN "order" SET DEFAULT 0;

-- AlterTable
ALTER TABLE "WorkoutProgram" ADD COLUMN     "currentWeek" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "deloadWeek" INTEGER,
ADD COLUMN     "mesoCycleWeeks" INTEGER NOT NULL DEFAULT 4,
ADD COLUMN     "status" "ProgramStatus" NOT NULL DEFAULT 'ACTIVE';

-- CreateTable
CREATE TABLE "UserMemoryEmbedding" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "embedding" vector(1536),
    "type" "MemoryType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserMemoryEmbedding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChallengeGroup" (
    "id" TEXT NOT NULL,
    "weekStart" TIMESTAMP(3) NOT NULL,
    "ageRange" TEXT NOT NULL,
    "fitnessLevel" "FitnessLevel" NOT NULL,
    "goal" "FitnessGoal" NOT NULL,
    "avgSessions" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "memberCount" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChallengeGroup_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "UserMemoryEmbedding_userId_idx" ON "UserMemoryEmbedding"("userId");

-- AddForeignKey
ALTER TABLE "UserMemoryEmbedding" ADD CONSTRAINT "UserMemoryEmbedding_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
