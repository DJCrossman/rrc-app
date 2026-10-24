-- CreateEnum
CREATE TYPE "EventType" AS ENUM ('training', 'regatta', 'volunteer');

-- CreateEnum
CREATE TYPE "EventAudience" AS ENUM ('club', 'groups');

-- CreateEnum
CREATE TYPE "RsvpStatus" AS ENUM ('yes', 'maybe', 'no');

-- CreateTable
CREATE TABLE "event" (
    "id" TEXT NOT NULL DEFAULT generate_id('evt_'::text),
    "type" "EventType" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "startAt" TIMESTAMP(3) NOT NULL,
    "endAt" TIMESTAMP(3),
    "allDay" BOOLEAN NOT NULL DEFAULT false,
    "timezone" TEXT NOT NULL DEFAULT 'America/Regina',
    "location" TEXT,
    "workoutId" TEXT,
    "audience" "EventAudience" NOT NULL DEFAULT 'club',
    "volunteerSpots" INTEGER,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_group" (
    "id" TEXT NOT NULL DEFAULT generate_id('evtgrp_'::text),
    "eventId" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,

    CONSTRAINT "event_group_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_rsvp" (
    "id" TEXT NOT NULL DEFAULT generate_id('rsvp_'::text),
    "eventId" TEXT NOT NULL,
    "athleteId" TEXT NOT NULL,
    "status" "RsvpStatus" NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "event_rsvp_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "calendar_token" (
    "id" TEXT NOT NULL DEFAULT generate_id('caltok_'::text),
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "calendar_token_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "event_workoutId_key" ON "event"("workoutId");

-- CreateIndex
CREATE INDEX "event_startAt_idx" ON "event"("startAt");

-- CreateIndex
CREATE UNIQUE INDEX "event_group_eventId_groupId_key" ON "event_group"("eventId", "groupId");

-- CreateIndex
CREATE UNIQUE INDEX "event_rsvp_eventId_athleteId_key" ON "event_rsvp"("eventId", "athleteId");

-- CreateIndex
CREATE UNIQUE INDEX "calendar_token_userId_key" ON "calendar_token"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "calendar_token_token_key" ON "calendar_token"("token");

-- AddForeignKey
ALTER TABLE "event" ADD CONSTRAINT "event_workoutId_fkey" FOREIGN KEY ("workoutId") REFERENCES "workout"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event" ADD CONSTRAINT "event_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "athlete"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_group" ADD CONSTRAINT "event_group_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_rsvp" ADD CONSTRAINT "event_rsvp_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_rsvp" ADD CONSTRAINT "event_rsvp_athleteId_fkey" FOREIGN KEY ("athleteId") REFERENCES "athlete"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- Backfill: every training-plan workout becomes a club-wide training event.
INSERT INTO "event" ("type", "title", "startAt", "endAt", "timezone", "workoutId", "updatedAt")
SELECT
    'training',
    COALESCE(
        NULLIF(btrim(split_part("description", ';', 1)), ''),
        CASE
            WHEN EXTRACT(HOUR FROM ("startDate" AT TIME ZONE 'UTC') AT TIME ZONE 'America/Regina') < 12 THEN 'Morning row'
            ELSE 'Evening row'
        END
    ),
    "startDate",
    CASE WHEN "elapsedTime" IS NOT NULL THEN "startDate" + "elapsedTime" * INTERVAL '1 millisecond' END,
    'America/Regina',
    "id",
    CURRENT_TIMESTAMP
FROM "workout";
