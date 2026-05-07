/*
  Warnings:

  - You are about to drop the column `programType` on the `program` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[athleteId,programId]` on the table `membership` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[rcaProgramId]` on the table `program` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `rcaProgramId` to the `program` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "program" DROP COLUMN "programType",
ADD COLUMN     "organizationName" TEXT,
ADD COLUMN     "rcaOrgId" INTEGER,
ADD COLUMN     "rcaProgramId" TEXT NOT NULL,
ADD COLUMN     "syncedAt" TIMESTAMP(3),
ALTER COLUMN "description" DROP NOT NULL,
ALTER COLUMN "startDate" DROP NOT NULL,
ALTER COLUMN "startDate" SET DATA TYPE DATE,
ALTER COLUMN "endDate" DROP NOT NULL,
ALTER COLUMN "endDate" SET DATA TYPE DATE;

-- DropEnum
DROP TYPE "ProgramType";

-- CreateIndex
CREATE UNIQUE INDEX "membership_athleteId_programId_key" ON "membership"("athleteId", "programId");

-- CreateIndex
CREATE UNIQUE INDEX "program_rcaProgramId_key" ON "program"("rcaProgramId");
