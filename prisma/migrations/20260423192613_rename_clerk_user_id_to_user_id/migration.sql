-- Rename athlete.clerkUserId -> athlete.userId (column + unique index)
ALTER TABLE "athlete" RENAME COLUMN "clerkUserId" TO "userId";
ALTER INDEX "athlete_clerkUserId_key" RENAME TO "athlete_userId_key";
