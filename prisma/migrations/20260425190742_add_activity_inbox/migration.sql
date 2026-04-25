/*
  Warnings:

  - A unique constraint covering the columns `[athleteId,stravaId]` on the table `activity` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[athleteId,conceptTwoId]` on the table `activity` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "IntegrationSource" AS ENUM ('strava', 'concept2');

-- CreateEnum
CREATE TYPE "ActivityInboxKind" AS ENUM ('sync', 'webhook');

-- CreateEnum
CREATE TYPE "ActivityInboxStatus" AS ENUM ('pending', 'running', 'completed', 'failed');

-- AlterTable
ALTER TABLE "activity" ALTER COLUMN "stravaId" SET DATA TYPE BIGINT,
ALTER COLUMN "conceptTwoId" SET DATA TYPE BIGINT;

-- CreateTable
CREATE TABLE "activity_inbox" (
    "id" TEXT NOT NULL DEFAULT generate_id('inbox_'::text),
    "athleteId" TEXT NOT NULL,
    "source" "IntegrationSource" NOT NULL,
    "kind" "ActivityInboxKind" NOT NULL,
    "status" "ActivityInboxStatus" NOT NULL DEFAULT 'pending',
    "payload" JSONB NOT NULL,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "errorMessage" TEXT,
    "activitiesCreated" INTEGER NOT NULL DEFAULT 0,
    "attempts" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "activity_inbox_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "activity_inbox_athleteId_status_idx" ON "activity_inbox"("athleteId", "status");

-- CreateIndex
CREATE INDEX "activity_inbox_status_receivedAt_idx" ON "activity_inbox"("status", "receivedAt");

-- CreateIndex
CREATE UNIQUE INDEX "activity_athleteId_stravaId_key" ON "activity"("athleteId", "stravaId");

-- CreateIndex
CREATE UNIQUE INDEX "activity_athleteId_conceptTwoId_key" ON "activity"("athleteId", "conceptTwoId");

-- AddForeignKey
ALTER TABLE "activity_inbox" ADD CONSTRAINT "activity_inbox_athleteId_fkey" FOREIGN KEY ("athleteId") REFERENCES "athlete"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
