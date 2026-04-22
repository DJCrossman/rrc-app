-- Base58 ID generator (Bitcoin alphabet: no 0, O, I, l)
CREATE OR REPLACE FUNCTION generate_id(prefix TEXT) RETURNS TEXT AS $$
DECLARE
    alphabet TEXT := '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
    result TEXT := '';
    i INT;
BEGIN
    FOR i IN 1..22 LOOP
        result := result || substr(alphabet, floor(random() * 58)::int + 1, 1);
    END LOOP;
    RETURN prefix || result;
END;
$$ LANGUAGE plpgsql VOLATILE;

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('admin', 'member');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('male', 'female', 'nonbinary');

-- CreateEnum
CREATE TYPE "ProgramType" AS ENUM ('masters', 'juniors', 'alumni');

-- CreateEnum
CREATE TYPE "WeightUnit" AS ENUM ('kilogram', 'pound');

-- CreateEnum
CREATE TYPE "WorkoutType" AS ENUM ('distance', 'time', 'other');

-- CreateEnum
CREATE TYPE "IntensityCategory" AS ENUM ('C1', 'C2', 'C3', 'C4', 'C5', 'C6');

-- CreateEnum
CREATE TYPE "ActivityType" AS ENUM ('water', 'erg');

-- CreateTable
CREATE TABLE "athlete" (
    "id" TEXT NOT NULL DEFAULT generate_id('ath_'),
    "clerkUserId" TEXT,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "nickname" TEXT,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "role" "Role" NOT NULL DEFAULT 'member',
    "gender" "Gender" NOT NULL,
    "dateOfBirth" DATE NOT NULL,
    "dateJoined" TIMESTAMP(3),
    "heightInCm" DOUBLE PRECISION,
    "weightInKg" DOUBLE PRECISION,
    "concept2UserId" INTEGER,
    "stravaAthleteId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "athlete_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "program" (
    "id" TEXT NOT NULL DEFAULT generate_id('prog_'),
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "programType" "ProgramType" NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "program_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "membership" (
    "id" TEXT NOT NULL DEFAULT generate_id('mem_'),
    "athleteId" TEXT NOT NULL,
    "programId" TEXT NOT NULL,

    CONSTRAINT "membership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "boat" (
    "id" TEXT NOT NULL DEFAULT generate_id('boat_'),
    "name" TEXT NOT NULL,
    "manufacturer" TEXT NOT NULL,
    "seats" TEXT NOT NULL,
    "rigging" TEXT NOT NULL,
    "weightMinKg" DOUBLE PRECISION NOT NULL,
    "weightMaxKg" DOUBLE PRECISION NOT NULL,
    "preferredWeightUnit" "WeightUnit" NOT NULL,

    CONSTRAINT "boat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "erg" (
    "id" TEXT NOT NULL DEFAULT generate_id('erg_'),
    "name" TEXT NOT NULL,
    "manufacturer" TEXT NOT NULL,
    "firmwareVersion" TEXT,
    "hardwareVersion" TEXT,
    "serialNumber" TEXT,
    "dataCode" TEXT,

    CONSTRAINT "erg_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workout" (
    "id" TEXT NOT NULL DEFAULT generate_id('work_'),
    "description" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "workoutType" "WorkoutType" NOT NULL,
    "elapsedTime" INTEGER,
    "distance" INTEGER,
    "intervalCount" INTEGER NOT NULL DEFAULT 1,
    "intensityCategory" "IntensityCategory" NOT NULL,

    CONSTRAINT "workout_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workout_fragment" (
    "id" TEXT NOT NULL DEFAULT generate_id('work_frag_'),
    "workoutId" TEXT NOT NULL,
    "rate" INTEGER,
    "elapsedTime" INTEGER,
    "distance" INTEGER,
    "relativeTo" TEXT NOT NULL,
    "relativeSplit" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "workout_fragment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activity" (
    "id" TEXT NOT NULL DEFAULT generate_id('act_'),
    "name" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "timezone" TEXT NOT NULL,
    "workoutType" "WorkoutType" NOT NULL,
    "elapsedTime" INTEGER NOT NULL,
    "distance" INTEGER NOT NULL,
    "type" "ActivityType" NOT NULL,
    "athleteId" TEXT NOT NULL,
    "boatId" TEXT,
    "ergId" TEXT,
    "workoutId" TEXT,
    "stravaId" INTEGER,
    "stravaData" JSONB,
    "conceptTwoId" INTEGER,
    "conceptTwoData" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "activity_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "athlete_clerkUserId_key" ON "athlete"("clerkUserId");

-- CreateIndex
CREATE UNIQUE INDEX "athlete_email_key" ON "athlete"("email");

-- AddForeignKey
ALTER TABLE "membership" ADD CONSTRAINT "membership_athleteId_fkey" FOREIGN KEY ("athleteId") REFERENCES "athlete"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "membership" ADD CONSTRAINT "membership_programId_fkey" FOREIGN KEY ("programId") REFERENCES "program"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workout_fragment" ADD CONSTRAINT "workout_fragment_workoutId_fkey" FOREIGN KEY ("workoutId") REFERENCES "workout"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity" ADD CONSTRAINT "activity_athleteId_fkey" FOREIGN KEY ("athleteId") REFERENCES "athlete"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity" ADD CONSTRAINT "activity_boatId_fkey" FOREIGN KEY ("boatId") REFERENCES "boat"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity" ADD CONSTRAINT "activity_ergId_fkey" FOREIGN KEY ("ergId") REFERENCES "erg"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity" ADD CONSTRAINT "activity_workoutId_fkey" FOREIGN KEY ("workoutId") REFERENCES "workout"("id") ON DELETE SET NULL ON UPDATE CASCADE;
