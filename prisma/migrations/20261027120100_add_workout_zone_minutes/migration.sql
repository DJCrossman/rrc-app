-- CreateTable
CREATE TABLE "workout_zone_minute" (
    "id" TEXT NOT NULL DEFAULT generate_id('work_zone_'),
    "workoutId" TEXT NOT NULL,
    "intensityCategory" "IntensityCategory" NOT NULL,
    "minutes" INTEGER NOT NULL,

    CONSTRAINT "workout_zone_minute_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "workout_zone_minute_workoutId_intensityCategory_key" ON "workout_zone_minute"("workoutId", "intensityCategory");

-- AddForeignKey
ALTER TABLE "workout_zone_minute" ADD CONSTRAINT "workout_zone_minute_workoutId_fkey" FOREIGN KEY ("workoutId") REFERENCES "workout"("id") ON DELETE CASCADE ON UPDATE CASCADE;
