-- DropIndex
DROP INDEX IF EXISTS "UserMemoryEmbedding_userId_idx";

-- AlterTable - Convert type column from enum to String, add new columns
ALTER TABLE "UserMemoryEmbedding"
  ALTER COLUMN "content" SET DATA TYPE TEXT,
  ALTER COLUMN "type" SET DATA TYPE TEXT,
  ADD COLUMN "importance" INTEGER NOT NULL DEFAULT 5,
  ADD COLUMN "decayScore" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
  ADD COLUMN "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "sourceId" TEXT,
  ADD COLUMN "sourceType" TEXT;

-- DropEnum - Remove old MemoryType enum
DROP TYPE IF EXISTS "MemoryType";

-- CreateIndex - Add new indexes for performance
CREATE INDEX "UserMemoryEmbedding_userId_idx" ON "UserMemoryEmbedding"("userId");
CREATE INDEX "UserMemoryEmbedding_type_idx" ON "UserMemoryEmbedding"("type");
CREATE INDEX "UserMemoryEmbedding_userId_type_idx" ON "UserMemoryEmbedding"("userId", "type");
CREATE INDEX "UserMemoryEmbedding_createdAt_idx" ON "UserMemoryEmbedding"("createdAt");
CREATE INDEX "UserMemoryEmbedding_userId_createdAt_idx" ON "UserMemoryEmbedding"("userId", "createdAt");
