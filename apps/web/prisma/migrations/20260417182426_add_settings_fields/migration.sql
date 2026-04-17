-- AlterTable: Add timezone, country, locale to User
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "timezone" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "country" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "locale" TEXT;

-- CreateTable: UserPrivacySettings
CREATE TABLE IF NOT EXISTS "UserPrivacySettings" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "collectWorkout" BOOLEAN NOT NULL DEFAULT true,
    "collectNutrition" BOOLEAN NOT NULL DEFAULT true,
    "analytics" BOOLEAN NOT NULL DEFAULT true,
    "marketingEmails" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserPrivacySettings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "UserPrivacySettings_userId_key" ON "UserPrivacySettings"("userId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "UserPrivacySettings_userId_idx" ON "UserPrivacySettings"("userId");

-- AddForeignKey
ALTER TABLE "UserPrivacySettings" ADD CONSTRAINT "UserPrivacySettings_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
